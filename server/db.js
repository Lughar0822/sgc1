// Persistencia simple en un archivo JSON (suficiente para el proyecto).
// Escribe de forma atómica: archivo temporal + rename, para no corromper datos.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

/** Productos de ejemplo con los que arranca la base de datos la primera vez. */
const productosIniciales = [
  { id: 1, nombre: "Panzerotti", categoria: "Comidas", precio: 5000, stock: 18, icono: "🥟" },
  { id: 2, nombre: "H2O", categoria: "Bebidas", precio: 2500, stock: 32, icono: "💧" },
  { id: 3, nombre: "Papitas Margarita", categoria: "Snacks", precio: 3000, stock: 7, icono: "🥔" },
  { id: 4, nombre: "Chocolatina", categoria: "Dulces", precio: 2500, stock: 4, icono: "🍫" },
  { id: 5, nombre: "Gaseosa", categoria: "Bebidas", precio: 3500, stock: 0, icono: "🥤" },
  { id: 6, nombre: "Jugo Hit", categoria: "Bebidas", precio: 3000, stock: 14, icono: "🧃" },
];

/**
 * Construye la base de datos inicial: un usuario administrador,
 * los productos de ejemplo y la lista de ventas vacía.
 * La contraseña sale de la variable de entorno ADMIN_PASSWORD (o "admin123").
 * @returns {{usuarios: object[], productos: object[], ventas: object[], siguienteId: number}}
 */
function crearDbInicial() {
  const password = process.env.ADMIN_PASSWORD || "admin123";
  return {
    usuarios: [
      {
        id: 1,
        usuario: "admin",
        nombre: "Administrador",
        passwordHash: bcrypt.hashSync(password, 10),
      },
    ],
    productos: productosIniciales,
    ventas: [],
    siguienteId: 7,
  };
}

/** Copia en memoria de la base de datos; se vuelca al archivo con guardarDb(). */
let db;

/**
 * Carga db.json en memoria. Si el archivo no existe, lo crea con los datos iniciales.
 * Debe llamarse una sola vez al arrancar el servidor.
 * @returns {object} la base de datos cargada
 */
export function cargarDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    db = crearDbInicial();
    guardarDb();
  } else {
    db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  }
  return db;
}

/**
 * Guarda la base de datos en disco de forma atómica: escribe un archivo
 * temporal y lo renombra, para no dejar db.json corrupto si algo falla a medias.
 */
export function guardarDb() {
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

/**
 * Devuelve la base de datos en memoria.
 * @returns {{usuarios: object[], productos: object[], ventas: object[], siguienteId: number}}
 */
export function getDb() {
  return db;
}

/**
 * Entrega un id único y autoincremental (compartido por productos y ventas).
 * @returns {number}
 */
export function nuevoId() {
  const id = db.siguienteId++;
  return id;
}
