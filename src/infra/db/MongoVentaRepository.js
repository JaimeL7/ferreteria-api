import mongoose from "mongoose";
import ClienteModel from "./models/clienteModel.js";
import ProductoModel from "./models/productoModel.js";
import VentaModel from "./models/ventaModel.js";
import { ValidationError } from "../../domain/errors/AppError.js";

const decimalToString = (value) => value?.toString();
const plain = (sale) => sale && ({ ...sale, total: decimalToString(sale.total), detalles: sale.detalles.map((line) => ({ ...line, precioUnitario: decimalToString(line.precioUnitario), subtotal: decimalToString(line.subtotal) })) });

export class MongoVentaRepository {
  async run(operation) {
    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(() => operation({
        customers: { obtener: (id) => ClienteModel.findById(id).session(session).lean() },
        products: {
          async obtener(id) {
            const product = await ProductoModel.findById(id).session(session).lean();
            return product && { ...product, precio: product.precio.toString() };
          },
          async descontarSiDisponible(id, cantidad) {
            const result = await ProductoModel.updateOne({ _id: id, activo: true, stock: { $gte: cantidad } }, { $inc: { stock: -cantidad } }, { session });
            return result.modifiedCount === 1;
          },
        },
        sales: {
          async crear(data) {
            const [created] = await VentaModel.create([data], { session });
            return plain(created.toObject());
          },
        },
      }));
    } catch (error) {
      if (error.name === "CastError") throw new ValidationError("Identificador de cliente o producto inválido");
      if (error.name === "ValidationError") throw new ValidationError(error.message);
      throw error;
    } finally { await session.endSession(); }
  }

  async obtenerPorId(id) {
    try { return plain(await VentaModel.findById(id).lean()); }
    catch (error) { if (error.name === "CastError") throw new ValidationError("Identificador de venta inválido"); throw error; }
  }

  async listar(filters = {}) {
    const query = {};
    if (filters.clienteId) query.clienteId = filters.clienteId;
    if (filters.desde || filters.hasta) {
      query.fecha = {};
      if (filters.desde) query.fecha.$gte = new Date(filters.desde);
      if (filters.hasta) query.fecha.$lte = new Date(filters.hasta);
    }
    return (await VentaModel.find(query).sort({ fecha: -1 }).lean()).map(plain);
  }
}
