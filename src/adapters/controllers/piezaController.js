import piezaService from "../../application/services/piezaService.js";

export const crearPieza = async (req, res) => {
    try {
        const pieza = await piezaService.crear(req.body);
        res.status(201).json({ message: "Pieza creada correctamente", data: pieza })
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export const obtenerPiezas = async (req, res) => {
  try {
    const piezas = await piezaService.listar();
    res.status(200).json(piezas);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const obtenerPiezaPorId = async (req, res) => {
  try {
    const pieza = await piezaService.obtenerPorId(req.params.id);
    if (!pieza) {
      return res.status(404).json({ message: "Pieza no encontrada" });
    }
    res.status(200).json(pieza);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const actualizarPieza = async (req, res) => {
  try {
    const pieza = await piezaService.actualizar(req.params.id, req.body);
    if (!pieza) {
      return res.status(404).json({ message: "Pieza no encontrada" });
    }
    res.status(200).json({ message: "Pieza actualizada", data: pieza });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const eliminarPieza = async (req, res) => {
  try {
    const resultado = await piezaService.eliminar(req.params.id);
    if (!resultado) {
      return res.status(404).json({ message: "Pieza no encontrada" });
    }
    res.status(200).json({ message: "Pieza eliminada correctamente" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};