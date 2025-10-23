export default async function createApp() {
  // Importaciones dinámicas
  const express = (await import("express")).default;
  const helmet = (await import("helmet")).default;
  const morgan = (await import("morgan")).default;
  const bodyParser = (await import("body-parser")).default;
  const cookieParser = (await import("cookie-parser")).default;
  const cors = (await import("cors")).default;

  // Importa las rutas
  const piezaRoutes = (await import("./adapters/routes/piezaRoutes.js")).default;

  const app = express();

  //Middlewares de seguridad y utilidades
  app.use(helmet());
  app.use(cors());
  app.use(morgan("dev"));
  app.use(bodyParser.json());
  app.use(cookieParser());
  //Rutas base
  app.use("/api/piezas", piezaRoutes);

  //Health check
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      environment: process.env.NODE_ENV || "development",
      message: "API Ferretería corriendo correctamente",
    });
  });

  //Manejo de rutas no encontradas
  app.use((req, res) => {
    res.status(404).json({ message: "Ruta no encontrada" });
  });

  //Manejo global de errores (opcional, pero pro)
  app.use((err, req, res, next) => {
    console.error("Error global:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  });

  return app;
}


