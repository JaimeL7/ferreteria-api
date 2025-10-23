import { crearPieza, obtenerPiezas, obtenerPiezaPorId, actualizarPieza, eliminarPieza } from "../../domain/usecases/index.js";

const piezaService = {
  async crear(data) {
    try {
      return await crearPieza(data);
    } catch (error) {
      throw new Error(`Error al crear la pieza: ${error.message}`);
    }
  },

  async listar() {
    try {
      return await obtenerPiezas();
    } catch (error) {
      throw new Error(`Error al obtener piezas: ${error.message}`);
    }
  },

  async obtenerPorId(id) {
    try {
      return await obtenerPiezaPorId(id);
    } catch (error) {
      throw new Error(`Error al obtener pieza: ${error.message}`);
    }
  },

  async actualizar(id, data) {
    try {
      return await actualizarPieza(id, data);
    } catch (error) {
      throw new Error(`Error al actualizar pieza: ${error.message}`);
    }
  },

  async eliminar(id) {
    try {
      return await eliminarPieza(id);
    } catch (error) {
      throw new Error(`Error al eliminar pieza: ${error.message}`);
    }
  },
};

export default piezaService;
