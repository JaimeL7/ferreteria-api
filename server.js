import "dotenv/config";
import { connectDB } from "./src/infra/db/mongoose.js";
import { MongoClienteRepository } from "./src/infra/db/MongoClienteRepository.js";
import { crearClienteUseCases } from "./src/application/use-cases/clientes.js";
import { MongoProductoRepository } from "./src/infra/db/MongoProductoRepository.js";
import { crearProductoUseCases } from "./src/application/use-cases/productos.js";
import { MongoVentaRepository } from "./src/infra/db/MongoVentaRepository.js";
import { crearVentaUseCases } from "./src/application/use-cases/ventas.js";
import { validateBasicAuthConfig } from "./src/adapters/middlewares/basicAuth.js";
import createApp from "./src/app.js";

const startServer = async () => {
  validateBasicAuthConfig();
  await connectDB(process.env.MONGO_URI);
  const clientesUseCases = crearClienteUseCases(new MongoClienteRepository());
  const productosUseCases = crearProductoUseCases(new MongoProductoRepository());
  const ventaRepository = new MongoVentaRepository();
  const ventasUseCases = crearVentaUseCases({ transaction: ventaRepository, repository: ventaRepository });
  const app = createApp({ clientesUseCases, productosUseCases, ventasUseCases });
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
};

startServer().catch((error) => {
  console.error("No se pudo iniciar la aplicación:", error.message);
  process.exitCode = 1;
});
