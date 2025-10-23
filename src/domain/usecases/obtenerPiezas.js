import { PiezaRepository } from "../../adapters/repositories/piezaRepository.js";
const piezaRepository = new PiezaRepository();
export const obtenerPiezas = async () => {
  const piezas = await piezaRepository.obtenerPiezas();
  return piezas;
};
