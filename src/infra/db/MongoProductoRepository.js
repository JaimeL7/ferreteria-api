import ProductoModel from "./models/productoModel.js";
import { ConflictError, ValidationError } from "../../domain/errors/AppError.js";

const plain = (row) => {
  if (!row) return row;
  const data = typeof row.toObject === "function" ? row.toObject() : row;
  return { ...data, precio: data.precio?.toString() };
};
const withErrors = async (operation) => {
  try { return await operation(); }
  catch (error) {
    if (error.name === "CastError" || error.name === "ValidationError") throw new ValidationError(error.message);
    if (error.code === 11000) throw new ConflictError("El SKU ya existe");
    throw error;
  }
};

export class MongoProductoRepository {
  async crear(data) { return withErrors(async () => plain(await ProductoModel.create(data))); }
  async listar(filters = {}) {
    const query = {};
    if (filters.sku) query.sku = filters.sku;
    if (filters.nombre) query.nombre = { $regex: String(filters.nombre).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    if (filters.activo !== undefined) query.activo = filters.activo === "true" || filters.activo === true;
    return (await ProductoModel.find(query).sort({ nombre: 1 }).lean()).map(plain);
  }
  async obtenerPorId(id) { return withErrors(async () => plain(await ProductoModel.findById(id).lean())); }
  async consultarDisponibilidad(id, cantidad = 1) {
    return withErrors(async () => {
      const product = await ProductoModel.findById(id).select({ activo: 1, stock: 1 }).lean();
      return product ? { disponible: product.activo && product.stock >= cantidad, existencias: product.activo ? product.stock : 0 } : null;
    });
  }
  async actualizar(id, changes) { return withErrors(async () => plain(await ProductoModel.findByIdAndUpdate(id, changes, { new: true, runValidators: true }).lean())); }
}
