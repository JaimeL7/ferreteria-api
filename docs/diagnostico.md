# Diagnóstico inicial

## Alcance observado

El repositorio contiene una API Express 5 en Node.js ESM para CRUD de `Pieza`. MongoDB se conecta mediante Mongoose 8. El proceso inicia en `server.js`; las rutas son `POST/GET /api/piezas`, `GET/PUT/DELETE /api/piezas/:id`. Basic Auth protege ese router. El health check está en `/health`. No hay frontend, pruebas, README ni instalación local de dependencias (`node_modules` no está presente). El entorno reporta Node.js v26.7.0; `npm --version` no pudo ejecutarse porque PowerShell bloquea `npm.ps1`.

## Problemas y efecto

| Hallazgo | Efecto |
| --- | --- |
| Los casos de uso importan e instancian el repositorio concreto, y ese repositorio importa Mongoose. | Dominio/aplicación acoplados a infraestructura; difícil sustituir persistencia o probar reglas aisladamente. |
| `server.js` monta rutas que `app.js` ya monta. | La ruta `/api/piezas` queda registrada dos veces y el wiring está dividido. |
| `body-parser` se importa, pero no figura como dependencia directa; Express ya ofrece `express.json()`. | Posible error de arranque y dependencia innecesaria. |
| `findByIdAndUpdate` no activa validadores; el modelo no limita precio/stock a valores no negativos. | Actualizaciones pueden guardar datos inválidos. |
| `Pieza.actualizarDatos` usa comprobaciones de truthiness. | No permite actualizar algunos valores válidos como `0`; además el repositorio no usa esta entidad al actualizar. |
| Controlador convierte cualquier error a 400; IDs inválidos de Mongo también se confunden con errores del cliente. | Respuestas HTTP incorrectas y poca observabilidad. |
| Basic Auth depende de variables sin validar, hace comparación ordinaria y no comprueba formato base64. | Configuración incompleta falla de forma confusa y entradas malformadas no se manejan explícitamente. Requiere HTTPS fuera del entorno local. |
| JWT middleware/servicio, `express-validator`, `mongodb` nativo y `bcryptjs` no se usan en la funcionalidad actual. | Superficie y configuración sobrantes; no se presume que deban eliminarse. |
| No existen pruebas, documentación ni configuración de entorno de ejemplo efectiva. | No hay línea base repetible ni guía de ejecución. |
| El enunciado describe clientes, productos y ventas, mientras el repositorio solo tiene piezas. | No se puede afirmar equivalencia funcional; reglas de clientes, concurrencia, impuestos y moneda requieren decisiones propias. |

## Arquitectura propuesta

Se mantiene el recurso y las rutas existentes. Los casos de uso reciben un puerto de repositorio por inyección; el adaptador MongoDB implementa ese puerto. Express, Basic Auth y GraphQL quedan como adaptadores HTTP que comparten los casos de uso. La composición de dependencias vive en el arranque. Clientes, productos y ventas pueden añadirse bajo el mismo patrón cuando estén cerradas sus reglas.

## Módulos a revisar

- `server.js`, `src/app.js`: composición, conexión y middleware.
- `src/domain/entities/Pieza.js` y casos de uso: reglas y dependencias.
- `src/adapters/repositories/piezaRepository.js`, `src/infra/db/**`: persistencia.
- `src/adapters/controllers/**`, `routes/**`, `middlewares/**`: HTTP, errores y autenticación.
- `package.json`, `.env.example`, README: ejecución y configuración reproducibles.

## Funcionalidad y compatibilidad

Se conserva CRUD de piezas, sus campos (`codigoProducto`, `descripcion`, `precio`, `marca`, `stock`, `fechaCrea`, `fechaModifica`), rutas, protección Basic Auth y formato general de respuestas. Correcciones de validación pueden rechazar datos negativos que antes podían persistirse. No se borran datos, colecciones ni funcionalidades en esta fase.

## Plan de verificación

1. Pruebas unitarias de casos de uso con repositorio en memoria.
2. Pruebas de validación de entidad y errores HTTP/autenticación.
3. Pruebas REST de integración y MongoDB únicamente con una instancia de prueba configurada.
4. Verificación de GraphQL una vez agregado su adaptador y dependencia.

## Riesgos y límites

Cambiar la semántica de borrado a desactivación alteraría el contrato, por lo que no se hace todavía. La unicidad de `codigoProducto` existe hoy en el esquema y se conserva aunque el objetivo recomienda SKU; migrar identificadores o datos requiere una decisión. Las transacciones MongoDB dependen de replica set; ventas no se implementan hasta especificar el dominio y verificar la topología. Basic Auth es demostrativa, no gestión de identidad.

## Resultado de esta intervención

Se implementó el puerto de piezas, casos de uso inyectables, adaptadores Mongo, montaje REST único, Basic Auth con configuración obligatoria y comparación resistente a timing, GraphQL compartiendo casos de uso y gestión CRUD de clientes/productos/ventas. Se conservan rutas y campos de piezas; CORS sigue habilitado. Productos usan SKU único; clientes/productos se desactivan sin borrar; los precios se representan exactamente en COP con máximo dos decimales. Las ventas guardan snapshots y usan transacciones para venta e inventario; su lógica se prueba con un unit of work en memoria. `node --test` pasó 9 pruebas; `npm run lint`, `git diff --check` y `npm audit` pasaron sin vulnerabilidades. No se ejecutaron pruebas contra MongoDB porque no hay instancia configurada.
