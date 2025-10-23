import PiezaModel from "../../infra/db/models/piezaModel.js";
import { Pieza } from "../../domain/entities/Pieza.js";

export class PiezaRepository {
  async crearPieza(data) {
    const pieza = new Pieza(data);
    const piezaDB = new PiezaModel(pieza);
    return await piezaDB.save();
  }

  async obtenerPiezas() {
    return await PiezaModel.find();
  }

  async obtenerPiezaPorId(id) {
    return await PiezaModel.findById(id);
  }

  async actualizarPieza(id, data) {
    const piezaActualizada = await PiezaModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    return piezaActualizada;
  }

  async eliminarPieza(id) {
    return await PiezaModel.findByIdAndDelete(id);
  }
}
