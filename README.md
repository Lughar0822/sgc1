# StockControl (React + Node.js)

Tu app de inventario migrada a **React (Vite)** con un backend en **Node.js (Express)**.

```
stockcontrol/
├── client/   React + Vite (tu CSS original en src/styles.css)
├── server/   API en Express, datos guardados en server/data/db.json
└── docs/     funcionalidades.md (historias de usuario, casos de uso y requisitos)
```

## Cómo correrlo

Necesitas Node 18 o superior. Abre **dos terminales**:

```bash
# Terminal 1 — API (puerto 3001)
cd server
npm install
npm run dev

# Terminal 2 — React (puerto 5173)
cd client
npm install
npm run dev
```

Entra a http://localhost:5173 e inicia sesión con **admin / admin123**.

### Modo producción (un solo servidor)

```bash
cd client && npm install && npm run build
cd ../server && npm install && npm start
```
Abre http://localhost:3001 (Express sirve el build de React).

### Variables de entorno (server)

| Variable | Para qué sirve | Por defecto |
|---|---|---|
| `JWT_SECRET` | Firma de las sesiones. **Defínela** para que no se cierren al reiniciar. | aleatoria |
| `ADMIN_PASSWORD` | Contraseña del admin al crear `db.json` por primera vez. | `admin123` |
| `PORT` | Puerto de la API. | `3001` |

Si quieres cambiar la contraseña después, borra `server/data/db.json` (se pierden los datos) y arranca con `ADMIN_PASSWORD` nueva.

## Las 5 funcionalidades en Node.js

1. **API REST de productos** — `GET/POST/PUT/DELETE /api/productos` y `PATCH /api/productos/:id/stock`, con validación y persistencia en archivo (ya no se pierde todo al recargar).
2. **Ventas con validación en el servidor** — `POST /api/ventas` comprueba el stock, lo descuenta y guarda la venta (precio y fecha incluidos). `GET /api/ventas` devuelve el historial.
3. **Login con JWT** — `POST /api/auth/login`, contraseña con bcrypt, sesión de 8 h, todas las rutas protegidas y límite de 5 intentos fallidos por IP cada 15 min.
4. **Exportar a CSV** — `GET /api/exportar/inventario.csv` y `ventas.csv` (abren bien en Excel, con tildes). Botones en Inventario y Ventas.
5. **Estadísticas** — `GET /api/estadisticas`: totales, ventas de los últimos 7 días y top 5 más vendidos. Se muestran en el Dashboard (gráfico de barras + "Más vendidos").

## Qué cambió respecto a tu versión

- `index.html` + `script.js` → componentes en `client/src/components/` (Sidebar, Dashboard, Inventario, Ventas, modales, Notificación, Login).
- Los `getElementById` / `innerHTML` pasaron a estado de React (`useState`); las vistas se actualizan solas.
- Los datos ya no viven en el navegador: cada acción llama a la API y luego recarga.
- Los `alert()` ahora son notificaciones (también para los errores del servidor).
- Se cierran los modales con la tecla Esc.

## Documentación

- El código está comentado con JSDoc en español: cada función del servidor, cada componente de React (con sus props) y cada llamada de `client/src/api.js`.
- Las 5 funcionalidades están descritas en tres formatos (historias de usuario, casos de uso y fichas de requisitos) en [`docs/funcionalidades.md`](docs/funcionalidades.md).
