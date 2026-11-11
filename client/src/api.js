// Cliente de la API. Guarda el token de sesión y centraliza los errores.
const TOKEN_KEY = "stockcontrol_token";

let alExpirarSesion = () => {};
/** Registra la función que se ejecuta cuando el servidor responde 401 (sesión vencida). */
export const onSesionExpirada = (fn) => (alExpirarSesion = fn);

/** Lee el token de sesión guardado en el navegador. */
export const getToken = () => localStorage.getItem(TOKEN_KEY);
/** Guarda el token de sesión; si recibe null lo borra. */
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

/**
 * Hace una petición a la API: añade el token, convierte el cuerpo a JSON y
 * lanza un Error con el mensaje del servidor si la respuesta no es exitosa.
 * @param {string} ruta ruta después de /api, p. ej. "/productos"
 * @param {{method?: string, body?: object, blob?: boolean}} opciones
 */
async function peticion(ruta, { method = "GET", body, blob } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${ruta}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !ruta.startsWith("/auth/login")) alExpirarSesion();
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Ocurrió un error inesperado.");
  }
  if (res.status === 204) return null;
  return blob ? res.blob() : res.json();
}

/** Una función por cada endpoint de la API. Todas devuelven una Promise. */
export const api = {
  login: (usuario, password) => peticion("/auth/login", { method: "POST", body: { usuario, password } }),
  me: () => peticion("/auth/me"),
  productos: () => peticion("/productos"),
  crearProducto: (p) => peticion("/productos", { method: "POST", body: p }),
  editarProducto: (id, p) => peticion(`/productos/${id}`, { method: "PUT", body: p }),
  cambiarStock: (id, delta) => peticion(`/productos/${id}/stock`, { method: "PATCH", body: { delta } }),
  eliminarProducto: (id) => peticion(`/productos/${id}`, { method: "DELETE" }),
  ventas: () => peticion("/ventas"),
  registrarVenta: (productoId, cantidad) => peticion("/ventas", { method: "POST", body: { productoId, cantidad } }),
  estadisticas: () => peticion("/estadisticas"),
  // Descarga un CSV con el token de sesión y lo guarda en el equipo
  async descargarCsv(nombre) {
    const archivo = await peticion(`/exportar/${nombre}`, { blob: true });
    const url = URL.createObjectURL(archivo);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  },
};
