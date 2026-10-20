import express from "express";
import { crearVentaController } from "../controllers/ventaController.js";

export const crearVentaRoutes = (useCases, authenticate) => {
  const router = express.Router();
  const controller = crearVentaController(useCases);
  router.use(authenticate);
  router.post("/", controller.registrar);
  router.get("/", controller.listar);
  router.get("/:id", controller.obtener);
  return router;
};
