import { buildSchema, GraphQLError, graphql } from "graphql";

const schema = buildSchema(`
  type Mensaje { mensaje: String! }
  type Cliente {
    _id: ID!
    nombre: String!
    documento: String!
    correo: String
    telefono: String
    activo: Boolean!
    createdAt: String
    updatedAt: String
  }
  type Producto {
    _id: ID!
    sku: String!
    nombre: String!
    descripcion: String
    precio: String!
    stock: Int!
    activo: Boolean!
    createdAt: String
    updatedAt: String
  }
  type Disponibilidad { disponible: Boolean!, existencias: Int! }
  type VentaDetalle {
    productoId: ID!
    sku: String!
    nombre: String!
    cantidad: Int!
    precioUnitario: String!
    subtotal: String!
  }
  type Venta {
    _id: ID!
    clienteId: ID!
    fecha: String!
    detalles: [VentaDetalle!]!
    total: String!
  }
  input DetalleVentaInput { productoId: ID!, cantidad: Int! }
  input VentaInput { clienteId: ID!, detalles: [DetalleVentaInput!]! }
  input ClienteInput { nombre: String!, documento: String!, correo: String, telefono: String }
  input ClienteUpdateInput { nombre: String, documento: String, correo: String, telefono: String }
  input ProductoInput { sku: String!, nombre: String!, descripcion: String, precio: String!, stock: Int! }
  input ProductoUpdateInput { sku: String, nombre: String, descripcion: String, precio: String, stock: Int }
  type Query {
    clientes(nombre: String, documento: String, activo: Boolean): [Cliente!]!
    cliente(id: ID!): Cliente
    productos(nombre: String, sku: String, activo: Boolean): [Producto!]!
    producto(id: ID!): Producto
    disponibilidadProducto(id: ID!, cantidad: Int = 1): Disponibilidad!
    ventas(clienteId: ID, desde: String, hasta: String): [Venta!]!
    venta(id: ID!): Venta
  }
  type Mutation {
    crearCliente(input: ClienteInput!): Cliente!
    actualizarCliente(id: ID!, input: ClienteUpdateInput!): Cliente!
    desactivarCliente(id: ID!): Cliente!
    crearProducto(input: ProductoInput!): Producto!
    actualizarProducto(id: ID!, input: ProductoUpdateInput!): Producto!
    desactivarProducto(id: ID!): Producto!
    registrarVenta(input: VentaInput!): Venta!
  }
`);

const asGraphQLError = (error) => {
  const known = Number.isInteger(error.statusCode) && error.statusCode < 500;
  return new GraphQLError(known ? error.message : "Error interno del servidor", {
    extensions: known ? { code: error.code || "BAD_REQUEST", httpStatus: error.statusCode } : { code: "INTERNAL_SERVER_ERROR" },
  });
};

const normalizeOutput = (value) => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeOutput);
  if (value && typeof value.toObject === "function") return normalizeOutput(value.toObject());
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeOutput(item)]));
  return value;
};

export function crearGraphQLRoot(clientesUseCases, productosUseCases, ventasUseCases) {
  const handle = (operation) => async (...args) => {
    try { return normalizeOutput(await operation(...args)); } catch (error) { throw asGraphQLError(error); }
  };
  const root = {};
  if (clientesUseCases) Object.assign(root, {
    clientes: handle(({ nombre, documento, activo }) => clientesUseCases.listar({ nombre, documento, activo })),
    cliente: handle(({ id }) => clientesUseCases.obtenerPorId(id)),
    crearCliente: handle(({ input }) => clientesUseCases.crear(input)),
    actualizarCliente: handle(({ id, input }) => clientesUseCases.actualizar(id, input)),
    desactivarCliente: handle(({ id }) => clientesUseCases.desactivar(id)),
  });
  if (productosUseCases) Object.assign(root, {
    productos: handle(({ nombre, sku, activo }) => productosUseCases.listar({ nombre, sku, activo })),
    producto: handle(({ id }) => productosUseCases.obtenerPorId(id)),
    disponibilidadProducto: handle(({ id, cantidad }) => productosUseCases.consultarDisponibilidad(id, cantidad)),
    crearProducto: handle(({ input }) => productosUseCases.crear(input)),
    actualizarProducto: handle(({ id, input }) => productosUseCases.actualizar(id, input)),
    desactivarProducto: handle(({ id }) => productosUseCases.desactivar(id)),
  });
  if (ventasUseCases) Object.assign(root, {
    ventas: handle(({ clienteId, desde, hasta }) => ventasUseCases.listar({ clienteId, desde, hasta })),
    venta: handle(({ id }) => ventasUseCases.obtenerPorId(id)),
    registrarVenta: handle(({ input }) => ventasUseCases.registrar(input)),
  });
  return root;
}

export async function ejecutarGraphQL(source, variableValues, clientesUseCases, productosUseCases, ventasUseCases) {
  return graphql({ schema, source, rootValue: crearGraphQLRoot(clientesUseCases, productosUseCases, ventasUseCases), variableValues });
}

export { schema as apiSchema };
