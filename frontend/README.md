# Ferretería Central · Frontend

Panel web académico en React y Vite, conectado al backend de ferretería. Permite consultar el resumen, administrar productos y clientes, y registrar ventas con descuento de inventario. La pantalla solicita la URL y las credenciales Basic Auth, que se mantienen en memoria mientras la pestaña está abierta. La interfaz no expone el transporte: la capa adaptadora usa REST por defecto y puede cambiarse a GraphQL con `VITE_API_TRANSPORT=GRAPHQL` en `.env.local`.

## Ejecutar en desarrollo

1. Arranca primero el backend desde `ferreteria-api` con `npm.cmd run dev`.
2. En otra terminal, entra a esta carpeta e instala dependencias con `npm.cmd install`.
3. Inicia el frontend con `npm.cmd run dev`.
4. Abre `http://localhost:5173` y conecta con `http://localhost:3000`, usando `BASIC_AUTH_USER` y `BASIC_AUTH_PASS` del `.env` del backend.

Para cambiar el adaptador de comunicación durante una demostración, crea `.env.local` a partir de `.env.example`, cambia `VITE_API_TRANSPORT` a `GRAPHQL` y reinicia Vite. Esa configuración queda bajo `src/adapters/outbound`; los componentes de la interfaz usan el mismo puerto de aplicación en ambos casos.

No se usa ni se expone `MONGO_URI` en el navegador. Las operaciones del frontend van a la API HTTP.
