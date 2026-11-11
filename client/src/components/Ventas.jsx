import { useEffect, useState } from "react";
import { dinero } from "../utils.js";

/**
 * Formulario para registrar ventas e historial de las últimas 8.
 *
 * @param {object} props
 * @param {object[]} props.productos solo se ofrecen los que tienen stock
 * @param {object[]} props.ventas
 * @param {(productoId: number, cantidad: number) => Promise<boolean>} props.onRegistrar
 * @param {() => void} props.onExportar descarga el CSV
 */
export default function Ventas({ productos, ventas, onRegistrar, onExportar }) {
  const disponibles = productos.filter((p) => p.stock > 0);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);

  // Si el producto elegido ya no está disponible, elige el primero
  useEffect(() => {
    if (!disponibles.some((p) => String(p.id) === String(productoId))) {
      setProductoId(disponibles[0] ? String(disponibles[0].id) : "");
    }
  }, [productos]); // eslint-disable-line react-hooks/exhaustive-deps

  const producto = disponibles.find((p) => String(p.id) === String(productoId));
  const total = producto && cantidad > 0 ? producto.precio * cantidad : 0;

  async function registrar() {
    const ok = await onRegistrar(Number(productoId), Number(cantidad));
    if (ok) setCantidad(1);
  }

  return (
    <>
      <div className="seccion-header">
        <div>
          <h2>Ventas</h2>
          <p>Registra las ventas realizadas</p>
        </div>
      </div>

      <div className="ventas-grid">
        <div className="panel">
          <h2>🛒 Nueva venta</h2>
          <p className="panel-descripcion">Selecciona el producto y la cantidad.</p>

          <label htmlFor="ventaProducto">Producto</label>
          <select id="ventaProducto" value={productoId} onChange={(e) => setProductoId(e.target.value)}>
            {disponibles.length === 0 && <option value="">No hay productos disponibles</option>}
            {disponibles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.icono} {p.nombre} — Stock: {p.stock}
              </option>
            ))}
          </select>

          <label htmlFor="ventaCantidad">Cantidad</label>
          <input
            id="ventaCantidad"
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />

          <div className="venta-total">
            <span>Total</span>
            <strong>{dinero(total)}</strong>
          </div>

          <button className="primary-btn ancho" onClick={registrar} disabled={!producto}>
            Registrar venta
          </button>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>🧾 Historial</h2>
              <p>Últimas ventas</p>
            </div>
            <button className="link-btn" onClick={onExportar}>⬇ Exportar CSV</button>
          </div>

          {ventas.length === 0 ? (
            <p className="vacio">Todavía no hay ventas registradas.</p>
          ) : (
            ventas.slice(0, 8).map((v) => (
              <div className="venta-item" key={v.id}>
                <div>
                  <strong>{v.producto}</strong>
                  <small>
                    {v.cantidad} unidad(es) · {new Date(v.fecha).toLocaleString("es-CO")}
                  </small>
                </div>
                <span className="venta-monto">+{dinero(v.total)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
