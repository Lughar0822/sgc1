import { useCallback, useEffect, useRef, useState } from "react";
import { api, getToken, onSesionExpirada, setToken } from "./api.js";
import { TITULOS } from "./utils.js";
import Login from "./components/Login.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Inventario from "./components/Inventario.jsx";
import Ventas from "./components/Ventas.jsx";
import ProductoModal from "./components/ProductoModal.jsx";
import EliminarModal from "./components/EliminarModal.jsx";
import Notificacion from "./components/Notificacion.jsx";

/** Fecha de hoy en español, para la cabecera. */
const fechaHoy = new Date().toLocaleDateString("es-CO", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

/**
 * Componente raíz. Se encarga de:
 *  - la sesión (login, verificación del token, cierre de sesión),
 *  - cargar productos, ventas y estadísticas desde la API,
 *  - decidir qué sección y qué modales se muestran,
 *  - avisar los resultados con notificaciones.
 * Los componentes hijos solo reciben datos y funciones por props.
 */
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(Boolean(getToken()));

  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [stats, setStats] = useState(null);
  const [cargado, setCargado] = useState(false);

  const [seccion, setSeccion] = useState("dashboard");
  const [modalProducto, setModalProducto] = useState(null); // null | { producto: obj | null }
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [notificacion, setNotificacion] = useState({ texto: "", visible: false, error: false });
  const temporizador = useRef(null);

  // ---------- notificaciones ----------
  /** Muestra una notificación 2,5 s; con error=true usa el estilo de error. */
  const notificar = useCallback((texto, error = false) => {
    clearTimeout(temporizador.current);
    setNotificacion({ texto, visible: true, error });
    temporizador.current = setTimeout(() => setNotificacion((n) => ({ ...n, visible: false })), 2500);
  }, []);

  // ---------- sesión ----------
  /** Cierra la sesión y limpia todos los datos en pantalla. */
  const salir = useCallback(() => {
    setToken(null);
    setUsuario(null);
    setProductos([]);
    setVentas([]);
    setStats(null);
    setCargado(false);
    setSeccion("dashboard");
  }, []);

  useEffect(() => {
    onSesionExpirada(() => {
      salir();
      notificar("La sesión expiró. Inicia sesión de nuevo.", true);
    });
  }, [salir, notificar]);

  // Si hay un token guardado, comprueba que siga siendo válido
  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then(setUsuario)
      .catch(() => setToken(null))
      .finally(() => setVerificando(false));
  }, []);

  function iniciarSesion({ token, usuario }) {
    setToken(token);
    setUsuario(usuario);
  }

  // ---------- datos ----------
  /** Pide a la API productos, ventas y estadísticas a la vez y actualiza el estado. */
  const recargar = useCallback(async () => {
    const [p, v, s] = await Promise.all([api.productos(), api.ventas(), api.estadisticas()]);
    setProductos(p);
    setVentas(v);
    setStats(s);
    setCargado(true);
  }, []);

  useEffect(() => {
    if (usuario) recargar().catch((e) => notificar(e.message, true));
  }, [usuario, recargar, notificar]);

  // Ejecuta una acción contra la API, recarga los datos y avisa el resultado
  /**
   * Ejecuta una acción contra la API, recarga los datos y avisa el resultado.
   * @returns {Promise<boolean>} true si todo salió bien
   */
  async function ejecutar(accion, mensajeOk) {
    try {
      await accion();
      await recargar();
      if (mensajeOk) notificar(mensajeOk);
      return true;
    } catch (e) {
      notificar(e.message, true);
      return false;
    }
  }

  // ---------- cerrar modales con Escape ----------
  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape") {
        setModalProducto(null);
        setProductoAEliminar(null);
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  // ---------- acciones ----------
  /** Crea o edita un producto según si el modal se abrió con uno existente. */
  async function guardarProducto(datos) {
    const editando = modalProducto.producto;
    const ok = await ejecutar(
      () => (editando ? api.editarProducto(editando.id, datos) : api.crearProducto(datos)),
      editando ? "Producto actualizado correctamente" : "Producto agregado correctamente"
    );
    if (ok) setModalProducto(null);
    return ok;
  }

  /** Elimina el producto elegido en el modal de confirmación. */
  async function confirmarEliminar() {
    const ok = await ejecutar(() => api.eliminarProducto(productoAEliminar.id), "Producto eliminado correctamente");
    if (ok) setProductoAEliminar(null);
  }

  const cambiarStock = (id, delta) =>
    ejecutar(() => api.cambiarStock(id, delta), delta > 0 ? "Stock aumentado" : "Stock disminuido");

  const registrarVenta = (productoId, cantidad) =>
    ejecutar(() => api.registrarVenta(productoId, cantidad), "Venta registrada correctamente");

  /** Descarga un CSV (inventario.csv o ventas.csv) y avisa el resultado. */
  async function exportar(nombre, mensaje) {
    try {
      await api.descargarCsv(nombre);
      notificar(mensaje);
    } catch (e) {
      notificar(e.message, true);
    }
  }

  // ---------- render ----------
  if (verificando) return null;

  if (!usuario) {
    return (
      <>
        <Login onLogin={iniciarSesion} />
        <Notificacion notificacion={notificacion} />
      </>
    );
  }

  const [titulo, subtitulo] = TITULOS[seccion];
  const abrirAgregar = () => setModalProducto({ producto: null });

  return (
    <>
      <Sidebar
        seccion={seccion}
        onCambiar={setSeccion}
        onAgregar={abrirAgregar}
        usuario={usuario}
        onSalir={salir}
      />

      <main className="main">
        <header className="header">
          <div>
            <h1>{titulo}</h1>
            <p>{subtitulo}</p>
          </div>
          <div className="fecha">📅 {fechaHoy}</div>
        </header>

        {!cargado ? (
          <p className="vacio">Cargando datos...</p>
        ) : (
          <>
            {seccion === "dashboard" && (
              <Dashboard
                productos={productos}
                stats={stats}
                onVerInventario={() => setSeccion("inventario")}
                onAgregar={abrirAgregar}
              />
            )}

            {seccion === "inventario" && (
              <Inventario
                productos={productos}
                onAgregar={abrirAgregar}
                onEditar={(producto) => setModalProducto({ producto })}
                onEliminar={setProductoAEliminar}
                onStock={cambiarStock}
                onExportar={() => exportar("inventario.csv", "Inventario exportado")}
              />
            )}

            {seccion === "ventas" && (
              <Ventas
                productos={productos}
                ventas={ventas}
                onRegistrar={registrarVenta}
                onExportar={() => exportar("ventas.csv", "Ventas exportadas")}
              />
            )}
          </>
        )}
      </main>

      {modalProducto && (
        <ProductoModal
          producto={modalProducto.producto}
          onCerrar={() => setModalProducto(null)}
          onGuardar={guardarProducto}
        />
      )}

      {productoAEliminar && (
        <EliminarModal
          producto={productoAEliminar}
          onCancelar={() => setProductoAEliminar(null)}
          onConfirmar={confirmarEliminar}
        />
      )}

      <Notificacion notificacion={notificacion} />
    </>
  );
}
