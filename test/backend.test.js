import test from "node:test";
import assert from "node:assert/strict";
import { ejecutarGraphQL } from "../src/adapters/graphql/apiSchema.js";
import { crearClienteUseCases } from "../src/application/use-cases/clientes.js";
import { crearProductoUseCases } from "../src/application/use-cases/productos.js";
import { addAmounts, multiplyAmount } from "../src/domain/value-objects/Amount.js";
import { crearVentaUseCases } from "../src/application/use-cases/ventas.js";
import ClienteModel from "../src/infra/db/models/clienteModel.js";

class InMemoryRepository {
  items = new Map();
  nextId = 1;
  async crear(data) { const row = { _id: String(this.nextId++), ...data }; this.items.set(row._id, row); return row; }
  async listar() { return [...this.items.values()]; }
  async obtenerPorId(id) { return this.items.get(id) ?? null; }
  async actualizar(id, changes) { const old = this.items.get(id); if (!old) return null; const next = { ...old, ...changes }; this.items.set(id, next); return next; }
  async eliminar(id) { const old = this.items.get(id); this.items.delete(id); return old ?? null; }
}


test("GraphQL serializa documentos Mongoose sin exponer su estructura interna", async () => {
  const document = new ClienteModel({ nombre: "Ana", documento: "123", activo: true });
  const clientUseCases = { crear: async () => document };
  const result = await ejecutarGraphQL(`mutation { crearCliente(input: { nombre: "Ana", documento: "123" }) { nombre documento activo } }`, undefined, clientUseCases);
  assert.equal(result.data.crearCliente.nombre, "Ana");
  assert.equal(result.data.crearCliente.documento, "123");
  assert.equal(result.data.crearCliente.activo, true);
});

test("clientes se crean, filtran, actualizan y desactivan sin imponer unicidad no definida", async () => {
  const repository = new InMemoryRepository();
  const clientes = crearClienteUseCases({
    async crear(data) { return repository.crear({ activo: true, ...data }); },
    async listar() { return repository.listar(); },
    async obtenerPorId(id) { return repository.obtenerPorId(id); },
    async actualizar(id, data) { return repository.actualizar(id, data); },
  });
  const one = await clientes.crear({ nombre: "Ana", documento: "123", correo: "ana@example.com" });
  const two = await clientes.crear({ nombre: "Ana María", documento: "123" });
  assert.equal((await clientes.listar({})).length, 2);
  assert.equal((await clientes.actualizar(one._id, { telefono: "300" })).telefono, "300");
  assert.equal((await clientes.desactivar(two._id)).activo, false);
  await assert.rejects(clientes.crear({ nombre: "Falta documento" }), { code: "VALIDATION_ERROR" });
  const result = await ejecutarGraphQL(`mutation($input: ClienteInput!) { crearCliente(input: $input) { nombre activo } }`, { input: { nombre: "Luz", documento: "456" } }, clientes);
  assert.equal(result.errors, undefined);
  assert.equal(result.data.crearCliente.nombre, "Luz");
});

test("producto conserva cantidades decimales exactas y valida SKU/precio/stock", async () => {
  const repo = new InMemoryRepository();
  const productos = crearProductoUseCases({
    async crear(data) { return repo.crear(data); },
    async listar() { return repo.listar(); },
    async obtenerPorId(id) { return repo.obtenerPorId(id); },
    async actualizar(id, changes) { return repo.actualizar(id, changes); },
    async consultarDisponibilidad(id, cantidad) { const item = await repo.obtenerPorId(id); return item ? { disponible: item.activo !== false && item.stock >= cantidad, existencias: item.activo === false ? 0 : item.stock } : null; },
  });
  const created = await productos.crear({ sku: "SKU-1", nombre: "Martillo", precio: "0.1", stock: 3 });
  assert.equal(created.precio, "0.1");
  assert.deepEqual(await productos.consultarDisponibilidad(created._id, 3), { disponible: true, existencias: 3 });
  assert.deepEqual(await productos.consultarDisponibilidad(created._id, 4), { disponible: false, existencias: 3 });
  assert.equal(multiplyAmount(created.precio, 3), "0.3");
  assert.equal(addAmounts(["0.1", "0.2"]), "0.3");
  await assert.rejects(productos.crear({ sku: "SKU-4", nombre: "Precisión excedida", precio: "1.001", stock: 1 }), { code: "VALIDATION_ERROR" });
  await assert.rejects(productos.crear({ sku: "SKU-2", nombre: "Error", precio: "-1", stock: 1 }), { code: "VALIDATION_ERROR" });
  await assert.rejects(productos.crear({ sku: "SKU-3", nombre: "Error", precio: "1", stock: 1.2 }), { code: "VALIDATION_ERROR" });
});

test("venta valida líneas y filtros antes de delegar la operación atómica", async () => {
  let state = {
    customers: new Map([["customer-1", { _id: "customer-1", activo: true }]]),
    products: new Map([["product-1", { _id: "product-1", sku: "SKU-1", nombre: "Martillo", precio: "1.25", stock: 5, activo: true }]]),
    sales: [],
  };
  const transaction = { async run(operation) {
    const pending = structuredClone(state);
    let id = pending.sales.length + 1;
    const result = await operation({
      customers: { obtener: async (key) => pending.customers.get(key) ?? null },
      products: {
        obtener: async (key) => pending.products.get(key) ?? null,
        async descontarSiDisponible(key, qty) { const p = pending.products.get(key); if (!p || p.stock < qty) return false; p.stock -= qty; return true; },
      },
      sales: { async crear(sale) { const created = { _id: String(id++), ...sale }; pending.sales.push(created); return created; } },
    });
    state = pending;
    return result;
  } };
  const ventas = crearVentaUseCases({ transaction, repository: { listar: async (filters) => filters, obtenerPorId: async () => null } });
  const request = { clienteId: "customer-1", detalles: [{ productoId: "product-1", cantidad: 1 }], total: "999999" };
  const result = await ventas.registrar(request);
  assert.equal(result.total, "1.25");
  assert.equal(result.detalles[0].sku, "SKU-1");
  assert.equal(state.products.get("product-1").stock, 4);
  assert.equal(state.sales.length, 1);
  await assert.rejects(ventas.registrar({ clienteId: "x", detalles: [{ productoId: "y", cantidad: 0 }] }), { code: "VALIDATION_ERROR" });
  const combined = await ventas.registrar({ clienteId: "customer-1", detalles: [{ productoId: "product-1", cantidad: 1 }, { productoId: "product-1", cantidad: 2 }] });
  assert.equal(combined.detalles[0].cantidad, 3);
  assert.equal(state.products.get("product-1").stock, 1);
  await assert.rejects(ventas.registrar({ clienteId: "customer-1", detalles: [{ productoId: "product-1", cantidad: 5 }] }), { statusCode: 409 });
  assert.equal(state.products.get("product-1").stock, 1);
  assert.equal(state.sales.length, 2);
  await assert.rejects(ventas.listar({ desde: "bad-date" }), { code: "VALIDATION_ERROR" });
});
