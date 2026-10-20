import { ConflictError, NotFoundError, ValidationError } from "../../domain/errors/AppError.js";
import { addAmounts, multiplyAmount, normalizeAmount } from "../../domain/value-objects/Amount.js";

export function crearVentaUseCases({ transaction, repository }) {
  return {
    async registrar(input) {
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new ValidationError("El cuerpo debe ser un objeto");
      if (typeof input.clienteId !== "string" || !input.clienteId) throw new ValidationError("clienteId es obligatorio");
      if (!Array.isArray(input.detalles) || input.detalles.length === 0) throw new ValidationError("La venta debe incluir al menos un producto");
      const quantities = new Map();
      for (const line of input.detalles) {
        if (!line || typeof line.productoId !== "string" || !line.productoId) throw new ValidationError("Cada detalle requiere productoId");
        if (!Number.isSafeInteger(line.cantidad) || line.cantidad <= 0) throw new ValidationError("Las cantidades deben ser enteros positivos");
        const totalQuantity = (quantities.get(line.productoId) || 0) + line.cantidad;
        if (!Number.isSafeInteger(totalQuantity)) throw new ValidationError("La cantidad acumulada excede el límite permitido");
        quantities.set(line.productoId, totalQuantity);
      }
      const normalizedInput = { clienteId: input.clienteId, detalles: [...quantities].map(([productoId, cantidad]) => ({ productoId, cantidad })) };
      return transaction.run(async ({ customers, products, sales }) => {
        const customer = await customers.obtener(normalizedInput.clienteId);
        if (!customer) throw new NotFoundError("Cliente no encontrado");
        if (!customer.activo) throw new ConflictError("El cliente está inactivo y no puede comprar");
        const detalles = [];
        for (const requested of normalizedInput.detalles) {
          const product = await products.obtener(requested.productoId);
          if (!product) throw new NotFoundError(`Producto ${requested.productoId} no encontrado`);
          if (!product.activo) throw new ConflictError(`El producto ${product.sku} está inactivo y no se puede vender`);
          const price = normalizeAmount(product.precio);
          const updated = await products.descontarSiDisponible(product.id ?? product._id, requested.cantidad);
          if (!updated) throw new ConflictError(`Existencias insuficientes para ${product.sku}`);
          detalles.push({ productoId: product.id ?? product._id, sku: product.sku, nombre: product.nombre, cantidad: requested.cantidad, precioUnitario: price, subtotal: multiplyAmount(price, requested.cantidad) });
        }
        const total = addAmounts(detalles.map(({ subtotal }) => subtotal));
        return sales.crear({ clienteId: customer.id ?? customer._id, fecha: new Date(), detalles, total });
      });
    },
    async obtenerPorId(id) { const sale = await repository.obtenerPorId(id); if (!sale) throw new NotFoundError("Venta no encontrada"); return sale; },
    async listar(filters = {}) {
      if (filters.clienteId !== undefined && (typeof filters.clienteId !== "string" || !filters.clienteId)) throw new ValidationError("clienteId no es válido");
      for (const field of ["desde", "hasta"]) if (filters[field] !== undefined && Number.isNaN(Date.parse(filters[field]))) throw new ValidationError(`${field} debe ser una fecha válida`);
      if (filters.desde && filters.hasta && Date.parse(filters.desde) > Date.parse(filters.hasta)) throw new ValidationError("desde no puede ser posterior a hasta");
      return repository.listar(filters);
    },
  };
}
