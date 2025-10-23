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
    console.error("Error al conectar con MongoDB:", error.message);
    process.exit(1);
  }
};

export default mongoose;
