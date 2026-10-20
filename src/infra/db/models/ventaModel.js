import mongoose from "mongoose";

const detailSchema = new mongoose.Schema({
  productoId: { type: mongoose.Schema.Types.ObjectId, required: true },
  sku: { type: String, required: true },
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true, min: 1 },
  precioUnitario: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
  subtotal: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
}, { _id: false });

const schema = new mongoose.Schema({
  clienteId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Cliente" },
  fecha: { type: Date, required: true, default: Date.now },
  detalles: { type: [detailSchema], required: true, validate: (lines) => lines.length > 0 },
  total: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
}, { versionKey: false });

export default mongoose.model("Venta", schema);
