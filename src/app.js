import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { basicAuth } from "./adapters/middlewares/basicAuth.js";
import { createHandler } from "graphql-http/lib/use/express";
import { crearGraphQLRoot, apiSchema } from "./adapters/graphql/apiSchema.js";
import { crearClienteRoutes } from "./adapters/routes/clienteRoutes.js";
import { crearProductoRoutes } from "./adapters/routes/productoRoutes.js";
import { crearVentaRoutes } from "./adapters/routes/ventaRoutes.js";

export default function createApp({ clientesUseCases, productosUseCases, ventasUseCases, authenticate = basicAuth }) {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(cookieParser());
  app.use(morgan("dev"));
  app.use(express.json({ limit: "1mb" }));
  app.get("/health", (_req, res) => res.json({ status: "ok", environment: process.env.NODE_ENV || "development", message: "API Ferretería corriendo correctamente" }));
  if (clientesUseCases) app.use("/api/clientes", crearClienteRoutes(clientesUseCases, authenticate));
  if (productosUseCases) app.use("/api/productos", crearProductoRoutes(productosUseCases, authenticate));
  if (ventasUseCases) app.use("/api/ventas", crearVentaRoutes(ventasUseCases, authenticate));
  app.all("/graphql", authenticate, createHandler({ schema: apiSchema, rootValue: crearGraphQLRoot(clientesUseCases, productosUseCases, ventasUseCases) }));
  app.use((_req, res) => res.status(404).json({ message: "Ruta no encontrada" }));
  app.use((error, _req, res, _next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) return res.status(400).json({ message: "JSON inválido" });
    const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    if (statusCode >= 500) console.error("Error interno de solicitud");
    return res.status(statusCode).json({ message: statusCode >= 500 ? "Error interno del servidor" : error.message, ...(error.code ? { code: error.code } : {}) });
  });
  return app;
}
