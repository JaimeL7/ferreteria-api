import mongoose from "mongoose";

const piezaSchema = new mongoose.Schema(
  {
    codigoProducto: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
    precio: {
      type: Number,
      required: true,
    },
    marca: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    fechaCrea: {
      type: Date,
      default: Date.now,
    },
    fechaModifica: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

export default mongoose.model("Pieza", piezaSchema);
