import { PiezaRepository } from "../../adapters/repositories/piezaRepository.js";

const piezaRepository = new PiezaRepository();

export const crearPieza = async (data) => {
  // Aquí podrías validar reglas de negocio, por ejemplo:
  if (!data.descripcion || !data.codigoProducto) {
    throw new Error("El nombre y código son obligatorios");
  }

  const nuevaPieza = await piezaRepository.crearPieza(data);
  return nuevaPieza;
};
