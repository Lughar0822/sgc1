/** Secciones del menú principal: [id, icono, texto]. */
const ITEMS = [
  ["dashboard", "🏠", "Dashboard"],
  ["inventario", "📦", "Inventario"],
  ["ventas", "🛒", "Ventas"],
];

/**
 * Menú lateral: navegación, botón para agregar producto y datos del usuario.
 *
 * @param {object} props
 * @param {string} props.seccion sección activa
 * @param {(id: string) => void} props.onCambiar
 * @param {() => void} props.onAgregar abre el modal de nuevo producto
 * @param {{nombre: string}} props.usuario
 * @param {() => void} props.onSalir cierra la sesión
 */
export default function Sidebar({ seccion, onCambiar, onAgregar, usuario, onSalir }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">📦</div>
        <div>
          <strong>StockControl</strong>
          <span>Gestión de inventario</span>
        </div>
      </div>

      <nav>
        <p className="menu-titulo">MENÚ PRINCIPAL</p>

        {ITEMS.map(([id, icono, texto]) => (
          <button
            key={id}
            className={"menu-item" + (seccion === id ? " activo" : "")}
            onClick={() => onCambiar(id)}
          >
            <span>{icono}</span>
            {texto}
          </button>
        ))}

        <p className="menu-titulo">GESTIÓN</p>

        <button className="menu-item" onClick={onAgregar}>
          <span>➕</span>
          Agregar producto
        </button>
      </nav>

      <div className="usuario">
        <div className="avatar">{usuario.nombre?.[0] || "A"}</div>
        <div>
          <strong>{usuario.nombre}</strong>
          <span>Usuario del sistema</span>
        </div>
        <button className="btn-salir" onClick={onSalir} title="Cerrar sesión">
          ⎋
        </button>
      </div>
    </aside>
  );
}
