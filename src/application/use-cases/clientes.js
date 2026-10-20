import { NotFoundError, ValidationError } from "../../domain/errors/AppError.js";

const required = ["nombre", "documento"];
function validate(input, partial = false) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ValidationError("El cuerpo debe ser un objeto");
  if (!partial) for (const key of required) if (typeof input[key] !== "string" || !input[key].trim()) throw new ValidationError(`${key} es obligatorio`);
  for (const key of ["nombre", "documento", "correo", "telefono"]) {
    if (input[key] !== undefined && (typeof input[key] !== "string" || !input[key].trim())) throw new ValidationError(`${key} debe ser texto no vacío`);
  }
  if (input.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.correo)) throw new ValidationError("correo no es válido");
}

export function crearClienteUseCases(repository) {
  return {
    async crear(input) { validate(input); return repository.crear(input); },
    listar: (filters) => repository.listar(filters),
    async obtenerPorId(id) { const item = await repository.obtenerPorId(id); if (!item) throw new NotFoundError("Cliente no encontrado"); return item; },
    async actualizar(id, input) {
      validate(input, true);
      const changes = Object.fromEntries(Object.entries(input).filter(([key]) => ["nombre", "documento", "correo", "telefono"].includes(key)));
      if (!Object.keys(changes).length) throw new ValidationError("No hay campos editables");
      const item = await repository.actualizar(id, changes);
      if (!item) throw new NotFoundError("Cliente no encontrado");
      return item;
    },
    async desactivar(id) { const item = await repository.actualizar(id, { activo: false }); if (!item) throw new NotFoundError("Cliente no encontrado"); return item; },
  };
}
