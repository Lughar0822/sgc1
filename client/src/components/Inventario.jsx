import { useMemo, useState } from "react";
import { dinero, obtenerEstado } from "../utils.js";

/**
 * Tabla de productos con búsqueda, filtros por categoría y estado, y acciones por fila.
 *
 * @param {object} props
 * @param {object[]} props.productos
 * @param {() => void} props.onAgregar
 * @param {(producto: object) => void} props.onEditar
 * @param {(producto: object) => void} props.onEliminar
 * @param {(id: number, delta: number) => void} props.onStock botones − y +
 * @param {() => void} props.onExportar descarga el CSV
 */
export default function Inventario({ productos, onAgregar, onEditar, onEliminar, onStock, onExportar }) {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("todos");
  const [estado, setEstado] = useState("todos");

  const categorias = useMemo(() => [...new Set(productos.map((p) => p.categoria))], [productos]);

  const filtrados = productos.filter((p) => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoria === "todos" || p.categoria === categoria;
    const coincideEstado =
      estado === "todos" ||
      (estado === "disponible" && p.stock > 10) ||
      (estado === "bajo" && p.stock > 0 && p.stock <= 10) ||
      (estado === "agotado" && p.stock === 0);
    return coincideBusqueda && coincideCategoria && coincideEstado;
  });

  return (
    <>
      <div className="seccion-header">
        <div>
          <h2>Inventario</h2>
          <p>Administra todos los productos</p>
        </div>
        <div className="header-acciones">
          <button className="secondary-btn" onClick={onExportar}>
            ⬇ Exportar CSV
          </button>
          <button className="primary-btn" onClick={onAgregar}>
            + Agregar producto
          </button>
        </div>
      </div>

      <div className="filtros">
        <div className="busqueda">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="todos">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="todos">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="bajo">Stock bajo</option>
          <option value="agotado">Agotado</option>
        </select>
      </div>

      <div className="tabla-container">
        <table>
          <thead>
            <tr>
              <th>PRODUCTO</th>
              <th>CATEGORÍA</th>
              <th>PRECIO</th>
              <th>STOCK</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="tabla-vacia">No se encontraron productos.</td>
              </tr>
            ) : (
              filtrados.map((p) => {
                const est = obtenerEstado(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="producto-tabla">
                        <div className="producto-icono">{p.icono}</div>
                        <div>
                          <strong>{p.nombre}</strong>
                          <small>ID: {p.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{p.categoria}</td>
                    <td className="precio-tabla">{dinero(p.precio)}</td>
                    <td>
                      <div className="control-stock">
                        <button aria-label={`Quitar una unidad de ${p.nombre}`} onClick={() => onStock(p.id, -1)}>−</button>
                        <strong>{p.stock}</strong>
                        <button aria-label={`Agregar una unidad de ${p.nombre}`} onClick={() => onStock(p.id, 1)}>+</button>
                      </div>
                    </td>
                    <td>
                      <span className={`estado ${est.clase}`}>{est.texto}</span>
                    </td>
                    <td>
                      <div className="acciones">
                        <button className="btn-accion" title="Editar" onClick={() => onEditar(p)}>✏️</button>
                        <button className="btn-accion btn-eliminar" title="Eliminar" onClick={() => onEliminar(p)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
