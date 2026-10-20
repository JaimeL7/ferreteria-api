import express from "express";
import { crearClienteController } from "../controllers/clienteController.js";

export const crearClienteRoutes = (useCases, authenticate) => {
  const router = express.Router();
  const controller = crearClienteController(useCases);
  router.use(authenticate);
  router.post("/", controller.crear);
  router.get("/", controller.listar);
  router.get("/:id", controller.obtener);
  router.put("/:id", controller.actualizar);
  router.delete("/:id", controller.desactivar);
  return router;
};
