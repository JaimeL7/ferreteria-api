import mongoose from "mongoose";

const schema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  documento: { type: String, required: true, trim: true },
  correo: { type: String, trim: true, lowercase: true },
  telefono: { type: String, trim: true },
  activo: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

export default mongoose.model("Cliente", schema);
