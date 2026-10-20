import ClienteModel from "./models/clienteModel.js";
import { ValidationError } from "../../domain/errors/AppError.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const withErrors = async (operation) => {
  try { return await operation(); }
  catch (error) {
    if (error.name === "CastError") throw new ValidationError("Identificador de cliente inválido");
    if (error.name === "ValidationError") throw new ValidationError(error.message);
    throw error;
  }
};

export class MongoClienteRepository {
  async crear(data) { return withErrors(() => ClienteModel.create(data)); }
  async listar(filters = {}) {
    const query = {};
    if (filters.nombre) query.nombre = { $regex: escapeRegex(filters.nombre), $options: "i" };
    if (filters.documento) query.documento = String(filters.documento);
    if (filters.activo !== undefined) query.activo = filters.activo === "true" || filters.activo === true;
    return ClienteModel.find(query).sort({ nombre: 1 }).lean();
  }
  async obtenerPorId(id) { return withErrors(() => ClienteModel.findById(id).lean()); }
  async actualizar(id, changes) { return withErrors(() => ClienteModel.findByIdAndUpdate(id, changes, { new: true, runValidators: true }).lean()); }
}
