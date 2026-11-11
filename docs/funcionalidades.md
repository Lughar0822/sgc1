# Documentación de funcionalidades — StockControl

Las cinco funcionalidades del backend en Node.js, descritas en tres formatos:

1. [Historias de usuario](#formato-1--historias-de-usuario)
2. [Casos de uso](#formato-2--casos-de-uso)
3. [Fichas de requisitos funcionales](#formato-3--fichas-de-requisitos-funcionales)

| Código | Funcionalidad | Archivo principal |
|---|---|---|
| F1 | Gestión de productos (API REST) | `server/index.js` |
| F2 | Registro de ventas con validación de stock | `server/index.js` |
| F3 | Autenticación con JWT | `server/auth.js` |
| F4 | Exportación de reportes a CSV | `server/index.js` |
| F5 | Estadísticas del negocio | `server/index.js` |

**Actor del sistema:** Administrador (único rol).

---

## Formato 1 — Historias de usuario

Estructura: *Como [rol], quiero [acción], para [beneficio]* + criterios de aceptación.

### HU-01 · Gestionar productos (F1)
**Como** administrador, **quiero** crear, editar, eliminar y ajustar el stock de los productos, **para** mantener el inventario al día sin perder datos al cerrar el navegador.

Criterios de aceptación:
- Puedo crear un producto con nombre, categoría, precio, stock e icono.
- No se guarda un producto con nombre vacío, precio negativo o stock que no sea un entero ≥ 0; veo un mensaje que explica el motivo.
- Puedo editar todos los datos de un producto existente.
- Los botones − y + cambian el stock en 1 unidad y el stock nunca baja de 0.
- Antes de eliminar un producto se pide confirmación.
- Al recargar la página los cambios siguen ahí.

### HU-02 · Registrar ventas (F2)
**Como** administrador, **quiero** registrar la venta de un producto indicando la cantidad, **para** que el stock se descuente solo y quede un historial.

Criterios de aceptación:
- Solo aparecen para vender los productos con stock mayor a 0.
- Antes de confirmar veo el total (precio × cantidad).
- Si la cantidad supera el stock disponible, la venta se rechaza y se me indica cuántas unidades quedan.
- Al vender, el stock baja y la venta aparece arriba en el historial con fecha y monto.
- El precio queda guardado en la venta: si luego cambia el precio del producto, las ventas anteriores no cambian.

### HU-03 · Iniciar sesión (F3)
**Como** administrador, **quiero** entrar con usuario y contraseña, **para** que nadie más pueda ver ni modificar mi inventario.

Criterios de aceptación:
- Sin iniciar sesión no se puede consultar ni modificar ningún dato.
- Con credenciales incorrectas veo "Usuario o contraseña incorrectos".
- Tras 5 intentos fallidos desde el mismo equipo, el acceso se bloquea 15 minutos.
- La sesión dura 8 horas; al vencer, la app me lleva de nuevo al login.
- Puedo cerrar sesión desde el menú lateral.
- Las contraseñas no se guardan en texto plano.

### HU-04 · Exportar reportes (F4)
**Como** administrador, **quiero** descargar el inventario y las ventas en CSV, **para** abrirlos en Excel, imprimirlos o entregarlos.

Criterios de aceptación:
- Hay un botón de exportar en Inventario y otro en Ventas.
- El archivo descargado abre en Excel con las tildes y la ñ bien escritas.
- Contiene todos los registros, no solo los que se ven en pantalla.
- Un texto que empiece por `=`, `+`, `-` o `@` no se ejecuta como fórmula al abrirlo.

### HU-05 · Ver estadísticas (F5)
**Como** administrador, **quiero** ver cuánto vendí en los últimos días y qué productos se venden más, **para** decidir qué reponer.

Criterios de aceptación:
- El Dashboard muestra total de productos, unidades en stock, stock bajo y agotados.
- Un gráfico muestra el total vendido de cada uno de los últimos 7 días, incluidos los días sin ventas.
- Se listan los 5 productos más vendidos con unidades y dinero.
- Los números se actualizan solos después de cada venta o cambio de stock.

---

## Formato 2 — Casos de uso

### CU-01 · Gestionar productos (F1)
| Campo | Descripción |
|---|---|
| Actor | Administrador |
| Precondiciones | Sesión iniciada |
| Disparador | Pulsa "Agregar producto", ✏️ editar, 🗑️ eliminar, o − / + en el stock |

**Flujo principal (crear):**
1. El administrador pulsa "Agregar producto".
2. El sistema muestra el formulario.
3. El administrador llena los datos y pulsa "Guardar producto".
4. El sistema valida los datos y guarda el producto.
5. El sistema cierra el formulario, actualiza las vistas y muestra "Producto agregado correctamente".

**Flujos alternos:**
- *4a. Datos inválidos:* el sistema responde 400 con el motivo, muestra el error y deja el formulario abierto.
- *Editar:* igual al flujo principal, con el formulario ya lleno; al guardar se actualiza el producto.
- *Eliminar:* el sistema pide confirmación; si el administrador acepta, borra el producto; si cancela, no pasa nada.
- *Ajustar stock:* el sistema suma o resta 1 unidad; si el resultado fuera negativo, deja 0.
- *Producto inexistente:* el sistema responde 404.

**Postcondición:** el cambio queda guardado en `server/data/db.json`.

### CU-02 · Registrar venta (F2)
| Campo | Descripción |
|---|---|
| Actor | Administrador |
| Precondiciones | Sesión iniciada; existe al menos un producto con stock |
| Disparador | Pulsa "Registrar venta" en la sección Ventas |

**Flujo principal:**
1. El administrador elige el producto y la cantidad.
2. El sistema muestra el total calculado.
3. El administrador pulsa "Registrar venta".
4. El servidor comprueba que el producto exista, que la cantidad sea un entero positivo y que alcance el stock.
5. El servidor descuenta el stock y guarda la venta (producto, cantidad, precio unitario, total y fecha).
6. El sistema actualiza historial, inventario y Dashboard, y muestra "Venta registrada correctamente".

**Flujos alternos:**
- *4a. Cantidad mayor al stock:* el servidor responde 409 "Solo hay N unidades disponibles"; no se descuenta nada.
- *4b. Cantidad inválida:* responde 400.
- *4c. Producto inexistente:* responde 404.

**Postcondición:** el stock baja y la venta queda en el historial.

### CU-03 · Iniciar y cerrar sesión (F3)
| Campo | Descripción |
|---|---|
| Actor | Administrador |
| Precondiciones | Ninguna |
| Disparador | Abre la aplicación o pulsa "Cerrar sesión" |

**Flujo principal:**
1. El administrador escribe usuario y contraseña y pulsa "Entrar".
2. El servidor busca al usuario y compara la contraseña con su hash (bcrypt).
3. El servidor genera un token JWT válido por 8 horas.
4. El sistema guarda el token, carga los datos y muestra el Dashboard.

**Flujos alternos:**
- *2a. Credenciales incorrectas:* responde 401, se cuenta el intento fallido y se muestra el error.
- *2b. Más de 5 intentos fallidos en 15 minutos:* responde 429 y bloquea nuevos intentos.
- *Token vencido o inválido en cualquier petición:* el servidor responde 401 y el sistema vuelve al login.
- *Cerrar sesión:* el sistema borra el token y los datos de pantalla.

**Postcondición:** con sesión válida se puede usar la API; sin ella, no.

### CU-04 · Exportar CSV (F4)
| Campo | Descripción |
|---|---|
| Actor | Administrador |
| Precondiciones | Sesión iniciada |
| Disparador | Pulsa "Exportar CSV" en Inventario o en Ventas |

**Flujo principal:**
1. El administrador pulsa "Exportar CSV".
2. El sistema pide el archivo al servidor enviando el token.
3. El servidor arma el CSV con todos los registros, escapa las celdas y añade el BOM para Excel.
4. El navegador guarda `inventario.csv` o `ventas.csv`.
5. El sistema muestra "Inventario exportado" / "Ventas exportadas".

**Flujos alternos:**
- *2a. Sesión vencida:* responde 401 y se vuelve al login.
- *3a. Sin registros:* se descarga un archivo solo con los encabezados.

**Postcondición:** el archivo queda en el equipo del administrador; los datos no cambian.

### CU-05 · Consultar estadísticas (F5)
| Campo | Descripción |
|---|---|
| Actor | Administrador |
| Precondiciones | Sesión iniciada |
| Disparador | Entra al Dashboard o hace cualquier cambio de inventario o ventas |

**Flujo principal:**
1. El sistema pide `/api/estadisticas` al servidor.
2. El servidor calcula totales, dinero generado, ventas por día de los últimos 7 días y el top 5 de productos.
3. El sistema dibuja las tarjetas, el gráfico de barras y la lista de más vendidos.

**Flujos alternos:**
- *2a. Sin ventas:* el gráfico muestra los 7 días en cero y "Más vendidos" muestra "Aún no hay ventas para mostrar".

**Postcondición:** ninguna (solo lectura).

---

## Formato 3 — Fichas de requisitos funcionales

| ID | Funcionalidad | Endpoint | Entradas | Salidas | Validaciones y errores |
|---|---|---|---|---|---|
| RF-01 | Listar productos | `GET /api/productos` | — | Lista de productos | 401 sin sesión |
| RF-02 | Crear producto | `POST /api/productos` | `nombre`, `categoria`, `precio`, `stock`, `icono` | Producto creado (201) | Nombre 1–60 caracteres; categoría 1–30; precio y stock enteros ≥ 0; icono ≤ 4 caracteres → 400 |
| RF-03 | Editar producto | `PUT /api/productos/:id` | `id` + mismos campos de RF-02 | Producto actualizado | 400 datos inválidos; 404 no existe |
| RF-04 | Ajustar stock | `PATCH /api/productos/:id/stock` | `delta` (entero ≠ 0) | Producto actualizado | El stock no baja de 0; 400 delta inválido; 404 no existe |
| RF-05 | Eliminar producto | `DELETE /api/productos/:id` | `id` | 204 sin contenido | 404 no existe |
| RF-06 | Registrar venta | `POST /api/ventas` | `productoId`, `cantidad` | Venta y producto con stock actualizado (201) | Cantidad entera > 0 (400); producto existente (404); cantidad ≤ stock (409) |
| RF-07 | Consultar ventas | `GET /api/ventas` | — | Historial, la más reciente primero | 401 sin sesión |
| RF-08 | Iniciar sesión | `POST /api/auth/login` | `usuario`, `password` | `token` JWT (8 h) y datos del usuario | 400 faltan datos; 401 credenciales incorrectas; 429 tras 5 fallos en 15 min |
| RF-09 | Verificar sesión | `GET /api/auth/me` | Cabecera `Authorization: Bearer <token>` | Datos del usuario | 401 token ausente, inválido o vencido |
| RF-10 | Protección de rutas | Todas las rutas `/api/*` excepto `/api/auth/login` | Token en la cabecera | — | 401 si no hay token válido |
| RF-11 | Exportar inventario | `GET /api/exportar/inventario.csv` | — | CSV: ID, Producto, Categoría, Precio, Stock, Estado | Neutraliza fórmulas; BOM UTF-8 |
| RF-12 | Exportar ventas | `GET /api/exportar/ventas.csv` | — | CSV: ID, Fecha, Producto, Cantidad, Precio unitario, Total | Neutraliza fórmulas; fecha en hora de Colombia |
| RF-13 | Estadísticas | `GET /api/estadisticas` | — | Totales, dinero generado, ventas por día (7 días) y top 5 productos | Incluye días sin ventas en cero |

### Requisitos no funcionales relacionados

| ID | Requisito |
|---|---|
| RNF-01 | Los datos persisten en `server/data/db.json`, con escritura atómica (archivo temporal + renombrar). |
| RNF-02 | Las contraseñas se almacenan con hash bcrypt, nunca en texto plano. |
| RNF-03 | El servidor valida todo dato recibido; no confía en las validaciones del navegador. |
| RNF-04 | El cuerpo de las peticiones está limitado a 20 KB. |
| RNF-05 | Un stock se considera bajo con 10 unidades o menos. |
