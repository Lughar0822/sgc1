import { dinero, obtenerEstado } from "../utils.js";

/**
 * Resumen general: tarjetas de totales, stock bajo, gráfico de ventas de 7 días y más vendidos.
 *
 * @param {object} props
 * @param {object[]} props.productos
 * @param {object|null} props.stats respuesta de /api/estadisticas
 * @param {() => void} props.onVerInventario
 * @param {() => void} props.onAgregar
 */
export default function Dashboard({ productos, stats, onVerInventario, onAgregar }) {
  const bajos = productos.filter((p) => p.stock > 0 && p.stock <= 10);
  const recientes = productos.slice(-4);
  const maxDia = Math.max(1, ...(stats?.ventasPorDia.map((d) => d.total) || [1]));

  return (
    <>
      <div className="estadisticas">
        <StatCard color="azul" icono="📦" etiqueta="Total productos" valor={stats?.totalProductos ?? 0} />
        <StatCard color="verde" icono="📊" etiqueta="Unidades en stock" valor={stats?.unidadesStock ?? 0} />
        <StatCard color="amarillo" icono="⚠️" etiqueta="Stock bajo" valor={stats?.stockBajo ?? 0} />
        <StatCard color="rojo" icono="🔴" etiqueta="Agotados" valor={stats?.agotados ?? 0} />
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>⚠️ Stock bajo</h2>
              <p>Productos que necesitan reposición</p>
            </div>
            <button className="link-btn" onClick={onVerInventario}>
              Ver inventario
            </button>
          </div>

          {bajos.length === 0 ? (
            <p className="vacio">No hay productos con stock bajo.</p>
          ) : (
            bajos.map((p) => (
              <div className="stock-bajo-item" key={p.id}>
                <div className="stock-bajo-producto">
                  <div className="producto-icono">{p.icono}</div>
                  <div>
                    <strong>{p.nombre}</strong>
                    <small>{p.categoria}</small>
                  </div>
                </div>
                <span className="stock-numero">{p.stock} unidades</span>
              </div>
            ))
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>📊 Resumen</h2>
              <p>Estado actual</p>
            </div>
          </div>
          <ResumenItem texto="Productos disponibles" valor={stats?.disponibles ?? 0} />
          <ResumenItem texto="Productos agotados" valor={stats?.agotados ?? 0} />
          <ResumenItem texto="Ventas realizadas" valor={stats?.ventasRealizadas ?? 0} />
          <ResumenItem texto="Dinero generado" valor={dinero(stats?.dineroGenerado ?? 0)} />
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>📈 Ventas de los últimos 7 días</h2>
              <p>Total vendido por día</p>
            </div>
          </div>
          <div className="grafico-barras">
            {stats?.ventasPorDia.map((d) => (
              <div className="barra-col" key={d.fecha} title={`${d.ventas} venta(s) · ${dinero(d.total)}`}>
                <small>{d.total ? dinero(d.total) : ""}</small>
                <div className="barra" style={{ height: `${(d.total / maxDia) * 100}%` }} />
                <small>{d.fecha.slice(5).replace("-", "/")}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>🏆 Más vendidos</h2>
              <p>Por unidades vendidas</p>
            </div>
          </div>
          {!stats || stats.topProductos.length === 0 ? (
            <p className="vacio">Aún no hay ventas para mostrar.</p>
          ) : (
            stats.topProductos.map((t) => (
              <div className="resumen-item" key={t.producto}>
                <span>{t.producto}</span>
                <strong>{t.unidades} u. · {dinero(t.total)}</strong>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>📦 Inventario reciente</h2>
            <p>Productos registrados en el sistema</p>
          </div>
          <button className="primary-btn" onClick={onAgregar}>
            + Agregar producto
          </button>
        </div>

        <div className="mini-productos">
          {recientes.map((p) => {
            const estado = obtenerEstado(p);
            return (
              <div className="mini-producto" key={p.id}>
                <div className="icon">{p.icono}</div>
                <h3>{p.nombre}</h3>
                <p>Stock: {p.stock}</p>
                <span className={`estado ${estado.clase}`}>{estado.texto}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/** Tarjeta con un número grande (total de productos, unidades, etc.). */
function StatCard({ color, icono, etiqueta, valor }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icono}</div>
      <div>
        <span>{etiqueta}</span>
        <strong>{valor}</strong>
      </div>
    </div>
  );
}

/** Fila "texto ... valor" del panel de resumen. */
function ResumenItem({ texto, valor }) {
  return (
    <div className="resumen-item">
      <span>{texto}</span>
      <strong>{valor}</strong>
    </div>
  );
}
