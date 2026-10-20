import mongoose from "mongoose";

const schema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true, unique: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true, default: "" },
  precio: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  activo: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

export default mongoose.model("Producto", schema);
