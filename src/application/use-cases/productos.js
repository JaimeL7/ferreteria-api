import { ConflictError, NotFoundError, ValidationError } from "../../domain/errors/AppError.js";
import { normalizeAmount } from "../../domain/value-objects/Amount.js";

function validate(data, partial = false) {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new ValidationError("El cuerpo debe ser un objeto");
  if (!partial) for (const key of ["sku", "nombre", "precio", "stock"]) if (data[key] === undefined || data[key] === null || data[key] === "") throw new ValidationError(`${key} es obligatorio`);
  for (const key of ["sku", "nombre", "descripcion"]) if (data[key] !== undefined && (typeof data[key] !== "string" || !data[key].trim())) throw new ValidationError(`${key} debe ser texto no vacío`);
  if (data.precio !== undefined) data.precio = normalizeAmount(data.precio);
  if (data.stock !== undefined && (!Number.isSafeInteger(data.stock) || data.stock < 0)) throw new ValidationError("stock debe ser un entero no negativo");
}

export function crearProductoUseCases(repository) {
  return {
    async crear(data) {
      validate(data);
      try { return await repository.crear(data); } catch (error) { if (error.code === 11000) throw new ConflictError("El SKU ya existe"); throw error; }
    },
    listar: (filters) => repository.listar(filters),
    async obtenerPorId(id) { const item = await repository.obtenerPorId(id); if (!item) throw new NotFoundError("Producto no encontrado"); return item; },
    async consultarDisponibilidad(id, cantidad = 1) {
      if (!Number.isSafeInteger(cantidad) || cantidad <= 0) throw new ValidationError("cantidad debe ser un entero positivo");
      const result = await repository.consultarDisponibilidad(id, cantidad);
      if (!result) throw new NotFoundError("Producto no encontrado");
      return result;
    },
    async actualizar(id, data) {
      validate(data, true);
      const changes = Object.fromEntries(Object.entries(data).filter(([key]) => ["sku", "nombre", "descripcion", "precio", "stock"].includes(key)));
      if (!Object.keys(changes).length) throw new ValidationError("No hay campos editables");
      try { const item = await repository.actualizar(id, changes); if (!item) throw new NotFoundError("Producto no encontrado"); return item; }
      catch (error) { if (error.code === 11000) throw new ConflictError("El SKU ya existe"); throw error; }
    },
    async desactivar(id) { const item = await repository.actualizar(id, { activo: false }); if (!item) throw new NotFoundError("Producto no encontrado"); return item; },
  };
}
