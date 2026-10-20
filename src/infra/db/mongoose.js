import mongoose from "mongoose";

export const connectDB = async (uri) => {
  if (!uri) {
    throw new Error("MONGO_URI no está definido en el archivo .env");
  }

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    console.log("MongoDB conectado correctamente");
  } catch (error) {
    // Los errores de selección de servidor de Mongo suelen incluir datos
    // útiles (DNS, IP allowlist, credenciales), pero no debemos imprimir la URI.
    const detail = String(error.message || "Error desconocido")
      .replace(/mongodb(?:\+srv)?:\/\/[^\s"']+/gi, "mongodb://<URI_OCULTA>")
      .replace(/(password|passwd|pwd)=([^&\s]+)/gi, "$1=<OCULTO>");
    const diagnostic = new Error(
      `No se pudo conectar con MongoDB (${error.name || "Error"}${error.code ? `, código ${error.code}` : ""}): ${detail}`,
      { cause: error },
    );
    throw diagnostic;
  }
};

export default mongoose;
