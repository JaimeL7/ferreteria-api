import express from "express";
import {
    crearPieza,
    obtenerPiezas,
    obtenerPiezaPorId,
    actualizarPieza,
    eliminarPieza,
} from "../controllers/piezaController.js";

import { basicAuth } from "../middlewares/basicAuth.js";

const router = express.Router();
router.use(basicAuth);
//Crear una nueva pieza
router.post("/", crearPieza);

//Obtener todas las piezas
router.get("/", obtenerPiezas);

//Obtener una pieza por ID
router.get("/:id", obtenerPiezaPorId);

//Actualizar una pieza
router.put("/:id", actualizarPieza);

//Eliminar una pieza
router.delete("/:id", eliminarPieza);

export default router;
