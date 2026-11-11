/** Un producto con este número de unidades o menos se considera con stock bajo. */
export const STOCK_BAJO = 10;

/** Da formato de pesos colombianos: 15000 → "$15.000". */
export const dinero = (n) => "$" + Number(n).toLocaleString("es-CO");

/** Devuelve el texto y la clase CSS del estado de un producto (Disponible / Stock bajo / Agotado). */
export function obtenerEstado(producto) {
  if (producto.stock === 0) return { texto: "Agotado", clase: "estado-agotado" };
  if (producto.stock <= STOCK_BAJO) return { texto: "Stock bajo", clase: "estado-bajo" };
  return { texto: "Disponible", clase: "estado-disponible" };
}

/** Título y subtítulo que se muestran en la cabecera de cada sección. */
export const TITULOS = {
  dashboard: ["Dashboard", "Resumen general del inventario"],
  inventario: ["Inventario", "Administra todos los productos"],
  ventas: ["Ventas", "Registra las ventas realizadas"],
};
