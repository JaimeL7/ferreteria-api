import { PiezaRepository } from "../../adapters/repositories/piezaRepository.js";

const piezaRepository = new PiezaRepository();

export const actualizarPieza = async (id, data) => {
  const piezaActualizada = await piezaRepository.actualizarPieza(id, data);
  if (!piezaActualizada) throw new Error("No se pudo actualizar la pieza");
  return piezaActualizada;
};
