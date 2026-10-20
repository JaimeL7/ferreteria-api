import express from "express";
import { crearProductoController } from "../controllers/productoController.js";

export const crearProductoRoutes = (useCases, authenticate) => {
  const router = express.Router();
  const controller = crearProductoController(useCases);
  router.use(authenticate);
  router.post("/", controller.crear);
  router.get("/", controller.listar);
  router.get("/:id/disponibilidad", controller.disponibilidad);
  router.get("/:id", controller.obtener);
  router.put("/:id", controller.actualizar);
  router.delete("/:id", controller.desactivar);
  return router;
};
