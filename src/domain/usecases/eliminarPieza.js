import { PiezaRepository } from "../../adapters/repositories/piezaRepository.js";
const piezaRepository = new PiezaRepository();
export const eliminarPieza = async (id) => {
  const resultado = await piezaRepository.eliminarPieza(id);
  if (!resultado) throw new Error("No se encontró la pieza para eliminar");
  return { mensaje: "Pieza eliminada correctamente" };
};
