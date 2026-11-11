// FUNCIONALIDAD 3: autenticación con JWT + límite de intentos de login.
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { getDb } from "./db.js";

const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.JWT_SECRET) {
  console.warn(
    "⚠️  JWT_SECRET no está definido: se usa uno aleatorio y las sesiones se cierran al reiniciar el servidor."
  );
}

// --- límite de intentos: 5 por IP cada 15 minutos ---
const intentos = new Map();
const VENTANA_MS = 15 * 60 * 1000;
const MAX_INTENTOS = 5;

/**
 * Middleware que bloquea el login tras 5 intentos fallidos desde la misma IP
 * en 15 minutos (responde 429). Añade req.registrarIntentoFallido() para que
 * la ruta de login cuente solo los intentos que realmente fallan.
 */
function limitarLogin(req, res, next) {
  const ip = req.ip;
  const ahora = Date.now();
  const registro = (intentos.get(ip) || []).filter((t) => ahora - t < VENTANA_MS);
  if (registro.length >= MAX_INTENTOS) {
    return res
      .status(429)
      .json({ error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." });
  }
  req.registrarIntentoFallido = () => {
    registro.push(ahora);
    intentos.set(ip, registro);
  };
  next();
}

/**
 * Registra las rutas públicas de autenticación.
 *  - POST /api/auth/login  {usuario, password} → {token, usuario}
 *  - GET  /api/auth/me     (requiere token)    → datos del usuario en sesión
 * @param {import("express").Express} app
 */
export function rutasAuth(app) {
  app.post("/api/auth/login", limitarLogin, async (req, res) => {
    const { usuario, password } = req.body || {};
    if (typeof usuario !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Usuario y contraseña son obligatorios." });
    }
    const u = getDb().usuarios.find((x) => x.usuario === usuario.trim());
    const ok = u && (await bcrypt.compare(password, u.passwordHash));
    if (!ok) {
      req.registrarIntentoFallido();
      return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }
    const token = jwt.sign({ sub: u.id, usuario: u.usuario }, SECRET, { expiresIn: "8h" });
    res.json({ token, usuario: { id: u.id, usuario: u.usuario, nombre: u.nombre } });
  });

  app.get("/api/auth/me", requerirAuth, (req, res) => {
    const u = getDb().usuarios.find((x) => x.id === req.auth.sub);
    if (!u) return res.status(401).json({ error: "Sesión inválida." });
    res.json({ id: u.id, usuario: u.usuario, nombre: u.nombre });
  });
}

/**
 * Middleware que exige un token JWT válido en la cabecera
 * "Authorization: Bearer <token>". Si es válido guarda su contenido en req.auth;
 * si falta o expiró responde 401.
 */
export function requerirAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [tipo, token] = header.split(" ");
  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ error: "Necesitas iniciar sesión." });
  }
  try {
    req.auth = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "La sesión expiró. Inicia sesión de nuevo." });
  }
}
