import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { cargarDb, getDb, guardarDb, nuevoId } from "./db.js";
import { rutasAuth, requerirAuth } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const STOCK_BAJO = 10;
const TZ = "America/Bogota";

cargarDb();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "20kb" }));

// ---------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------
/**
 * Texto del estado de un producto según su stock.
 * @param {{stock: number}} p
 * @returns {"Agotado"|"Stock bajo"|"Disponible"}
 */
const estadoDe = (p) =>
  p.stock === 0 ? "Agotado" : p.stock <= STOCK_BAJO ? "Stock bajo" : "Disponible";

/** true si n es un número entero mayor o igual a 0. */
const esEnteroNoNegativo = (n) => Number.isInteger(n) && n >= 0;

/**
 * Valida y limpia los datos de un producto recibidos del cliente.
 * Nunca se confía en lo que envía el navegador: aquí se revisan tipos y rangos.
 * @param {object} body cuerpo de la petición
 * @returns {{valor?: object, error?: string}} el producto limpio, o un mensaje de error
 */
function validarProducto(body) {
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const categoria = typeof body.categoria === "string" ? body.categoria.trim() : "";
  const precio = Number(body.precio);
  const stock = Number(body.stock);
  const icono = (typeof body.icono === "string" && body.icono.trim()) || "📦";

  if (!nombre || nombre.length > 60) return { error: "El nombre es obligatorio (máx. 60 caracteres)." };
  if (!categoria || categoria.length > 30) return { error: "La categoría es obligatoria (máx. 30 caracteres)." };
  if (!esEnteroNoNegativo(precio)) return { error: "El precio debe ser un número entero mayor o igual a 0." };
  if (!esEnteroNoNegativo(stock)) return { error: "El stock debe ser un número entero mayor o igual a 0." };
  if ([...icono].length > 4) return { error: "El icono es demasiado largo." };

  return { valor: { nombre, categoria, precio, stock, icono } };
}

/** Convierte una fecha ISO a 'YYYY-MM-DD' en la zona horaria de Colombia. */
const fechaLocal = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD

// ---------------------------------------------------------------
// FUNCIONALIDAD 3: autenticación (login público; el resto protegido)
// ---------------------------------------------------------------
rutasAuth(app);
app.use("/api", (req, res, next) => (req.path.startsWith("/auth/") ? next() : requerirAuth(req, res, next)));

// ---------------------------------------------------------------
// FUNCIONALIDAD 1: API REST de productos (CRUD persistente)
// ---------------------------------------------------------------
/** GET /api/productos — lista todos los productos. */
app.get("/api/productos", (req, res) => {
  res.json(getDb().productos);
});

/** POST /api/productos — crea un producto (201) o responde 400 si los datos no son válidos. */
app.post("/api/productos", (req, res) => {
  const { valor, error } = validarProducto(req.body || {});
  if (error) return res.status(400).json({ error });
  const producto = { id: nuevoId(), ...valor };
  getDb().productos.push(producto);
  guardarDb();
  res.status(201).json(producto);
});

/** PUT /api/productos/:id — reemplaza los datos de un producto (404 si no existe). */
app.put("/api/productos/:id", (req, res) => {
  const producto = getDb().productos.find((p) => p.id === Number(req.params.id));
  if (!producto) return res.status(404).json({ error: "Producto no encontrado." });
  const { valor, error } = validarProducto(req.body || {});
  if (error) return res.status(400).json({ error });
  Object.assign(producto, valor);
  guardarDb();
  res.json(producto);
});

/** PATCH /api/productos/:id/stock — suma o resta unidades ({delta}); el stock nunca baja de 0. */
app.patch("/api/productos/:id/stock", (req, res) => {
  const producto = getDb().productos.find((p) => p.id === Number(req.params.id));
  if (!producto) return res.status(404).json({ error: "Producto no encontrado." });
  const delta = Number(req.body?.delta);
  if (!Number.isInteger(delta) || delta === 0) {
    return res.status(400).json({ error: "El cambio de stock debe ser un entero distinto de 0." });
  }
  producto.stock = Math.max(0, producto.stock + delta);
  guardarDb();
  res.json(producto);
});

/** DELETE /api/productos/:id — elimina un producto (204, o 404 si no existe). */
app.delete("/api/productos/:id", (req, res) => {
  const db = getDb();
  const idx = db.productos.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Producto no encontrado." });
  db.productos.splice(idx, 1);
  guardarDb();
  res.status(204).end();
});

// ---------------------------------------------------------------
// FUNCIONALIDAD 2: ventas con validación de stock en el servidor
// ---------------------------------------------------------------
/** GET /api/ventas — historial de ventas, la más reciente primero. */
app.get("/api/ventas", (req, res) => {
  res.json(getDb().ventas);
});

/**
 * POST /api/ventas {productoId, cantidad} — registra una venta.
 * Valida en el servidor que exista el producto, que la cantidad sea entera y positiva
 * y que alcance el stock (409 si no). Descuenta el stock y guarda precio y fecha de la venta.
 */
app.post("/api/ventas", (req, res) => {
  const db = getDb();
  const productoId = Number(req.body?.productoId);
  const cantidad = Number(req.body?.cantidad);

  const producto = db.productos.find((p) => p.id === productoId);
  if (!producto) return res.status(404).json({ error: "Producto no encontrado." });
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return res.status(400).json({ error: "Ingresa una cantidad válida." });
  }
  if (cantidad > producto.stock) {
    return res.status(409).json({ error: `Solo hay ${producto.stock} unidades disponibles.` });
  }

  producto.stock -= cantidad;
  const venta = {
    id: nuevoId(),
    productoId: producto.id,
    producto: producto.nombre,
    cantidad,
    precioUnitario: producto.precio,
    total: producto.precio * cantidad,
    fecha: new Date().toISOString(),
  };
  db.ventas.unshift(venta);
  guardarDb();
  res.status(201).json({ venta, producto });
});

// ---------------------------------------------------------------
// FUNCIONALIDAD 4: exportar reportes en CSV (abre bien en Excel)
// ---------------------------------------------------------------
/**
 * Prepara un valor para una celda CSV: lo entrecomilla si hace falta y
 * neutraliza las fórmulas (=, +, -, @) para evitar inyección al abrir en Excel.
 */
function celdaCsv(valor) {
  let s = String(valor ?? "");
  // Evita inyección de fórmulas al abrir el archivo en Excel/Sheets
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Envía una respuesta CSV como descarga. Antepone un BOM para que Excel respete las tildes.
 * @param {import("express").Response} res
 * @param {string} nombreArchivo nombre sugerido para guardar
 * @param {string[]} encabezados primera fila
 * @param {Array<Array<string|number>>} filas datos
 */
function enviarCsv(res, nombreArchivo, encabezados, filas) {
  const lineas = [encabezados, ...filas].map((f) => f.map(celdaCsv).join(","));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nombreArchivo}"`);
  res.send("\ufeff" + lineas.join("\r\n")); // BOM para que Excel respete tildes
}

/** GET /api/exportar/inventario.csv — descarga el inventario completo. */
app.get("/api/exportar/inventario.csv", (req, res) => {
  const filas = getDb().productos.map((p) => [p.id, p.nombre, p.categoria, p.precio, p.stock, estadoDe(p)]);
  enviarCsv(res, "inventario.csv", ["ID", "Producto", "Categoría", "Precio", "Stock", "Estado"], filas);
});

/** GET /api/exportar/ventas.csv — descarga el historial de ventas. */
app.get("/api/exportar/ventas.csv", (req, res) => {
  const filas = getDb().ventas.map((v) => [
    v.id,
    new Date(v.fecha).toLocaleString("es-CO", { timeZone: TZ }),
    v.producto,
    v.cantidad,
    v.precioUnitario,
    v.total,
  ]);
  enviarCsv(res, "ventas.csv", ["ID", "Fecha", "Producto", "Cantidad", "Precio unitario", "Total"], filas);
});

// ---------------------------------------------------------------
// FUNCIONALIDAD 5: estadísticas (ventas por día + más vendidos)
// ---------------------------------------------------------------
/**
 * GET /api/estadisticas — datos para el Dashboard:
 * totales de inventario, dinero generado, ventas de los últimos 7 días
 * (incluye los días sin ventas) y los 5 productos más vendidos.
 */
app.get("/api/estadisticas", (req, res) => {
  const { productos, ventas } = getDb();

  // Últimos 7 días, incluso los que no tuvieron ventas
  const dias = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    dias.push(d.toLocaleDateString("en-CA", { timeZone: TZ }));
  }
  const porDia = Object.fromEntries(dias.map((d) => [d, { fecha: d, ventas: 0, total: 0 }]));
  for (const v of ventas) {
    const dia = porDia[fechaLocal(v.fecha)];
    if (dia) {
      dia.ventas += 1;
      dia.total += v.total;
    }
  }

  // Top 5 productos por unidades vendidas
  const acumulado = new Map();
  for (const v of ventas) {
    const a = acumulado.get(v.producto) || { producto: v.producto, unidades: 0, total: 0 };
    a.unidades += v.cantidad;
    a.total += v.total;
    acumulado.set(v.producto, a);
  }
  const topProductos = [...acumulado.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 5);

  res.json({
    totalProductos: productos.length,
    unidadesStock: productos.reduce((s, p) => s + p.stock, 0),
    stockBajo: productos.filter((p) => p.stock > 0 && p.stock <= STOCK_BAJO).length,
    agotados: productos.filter((p) => p.stock === 0).length,
    disponibles: productos.filter((p) => p.stock > STOCK_BAJO).length,
    ventasRealizadas: ventas.length,
    dineroGenerado: ventas.reduce((s, v) => s + v.total, 0),
    ventasPorDia: dias.map((d) => porDia[d]),
    topProductos,
  });
});

// ---------------------------------------------------------------
// Producción: sirve el build de React si existe
// ---------------------------------------------------------------
const dist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.use("/api", (req, res) => res.status(404).json({ error: "Ruta no encontrada." }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "JSON inválido." });
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor." });
});

app.listen(PORT, () => console.log(`StockControl API en http://localhost:${PORT}`));
