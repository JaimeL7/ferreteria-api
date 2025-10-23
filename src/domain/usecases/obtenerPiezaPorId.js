import { PiezaRepository } from "../../adapters/repositories/piezaRepository.js";
const piezaRepository = new PiezaRepository();
export const obtenerPiezaPorId = async (id) => {
  const pieza = await piezaRepository.obtenerPiezaPorId(id);
  if (!pieza) throw new Error("Pieza no encontrada");
  return pieza;
};
