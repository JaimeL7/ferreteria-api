const productFields = "_id sku nombre descripcion precio stock activo createdAt updatedAt";
const customerFields = "_id nombre documento correo telefono activo createdAt updatedAt";
const saleFields = "_id clienteId fecha total detalles { productoId sku nombre cantidad precioUnitario subtotal }";

export function createFerreteriaGateway(config) {
  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const token = btoa(`${config.username}:${config.password}`);
  const transport = String(import.meta.env.VITE_API_TRANSPORT || "REST").toUpperCase();
  const headers = { Authorization: `Basic ${token}` };

  async function rest(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { ...headers, ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Error HTTP ${response.status}`);
    return data;
  }

  async function graph(query, variables = {}) {
    const response = await fetch(`${baseUrl}/graphql`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.errors?.length) throw new Error(result.errors?.[0]?.message || `Error HTTP ${response.status}`);
    return result.data;
  }

  const request = (restPath, query, variables) => transport === "GRAPHQL"
    ? graph(query, variables)
    : rest(restPath);

  return {
    async checkConnection() {
      if (transport === "GRAPHQL") {
        const data = await graph("query { productos { _id } }");
        if (!Array.isArray(data.productos)) throw new Error("La API no devolvió una respuesta válida.");
      } else {
        const data = await rest("/api/productos");
        if (!Array.isArray(data)) throw new Error("La API no devolvió una respuesta válida.");
      }
    },
    listProducts: async () => {
      const result = await request("/api/productos", `query { productos { ${productFields} } }`);
      return transport === "GRAPHQL" ? result.productos : result;
    },
    listCustomers: async () => {
      const result = await request("/api/clientes", `query { clientes { ${customerFields} } }`);
      return transport === "GRAPHQL" ? result.clientes : result;
    },
    listSales: async () => {
      const result = await request("/api/ventas", `query { ventas { ${saleFields} } }`);
      return transport === "GRAPHQL" ? result.ventas : result;
    },
    createProduct: async (data) => transport === "GRAPHQL"
      ? graph(`mutation($input: ProductoInput!) { crearProducto(input: $input) { ${productFields} } }`, { input: data })
      : rest("/api/productos", { method: "POST", body: JSON.stringify(data) }),
    updateProduct: async (id, data) => transport === "GRAPHQL"
      ? graph(`mutation($id: ID!, $input: ProductoUpdateInput!) { actualizarProducto(id: $id, input: $input) { ${productFields} } }`, { id, input: data })
      : rest(`/api/productos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deactivateProduct: async (id) => transport === "GRAPHQL"
      ? graph(`mutation($id: ID!) { desactivarProducto(id: $id) { ${productFields} } }`, { id })
      : rest(`/api/productos/${id}`, { method: "DELETE" }),
    createCustomer: async (data) => transport === "GRAPHQL"
      ? graph(`mutation($input: ClienteInput!) { crearCliente(input: $input) { ${customerFields} } }`, { input: data })
      : rest("/api/clientes", { method: "POST", body: JSON.stringify(data) }),
    updateCustomer: async (id, data) => transport === "GRAPHQL"
      ? graph(`mutation($id: ID!, $input: ClienteUpdateInput!) { actualizarCliente(id: $id, input: $input) { ${customerFields} } }`, { id, input: data })
      : rest(`/api/clientes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deactivateCustomer: async (id) => transport === "GRAPHQL"
      ? graph(`mutation($id: ID!) { desactivarCliente(id: $id) { ${customerFields} } }`, { id })
      : rest(`/api/clientes/${id}`, { method: "DELETE" }),
    registerSale: async (data) => transport === "GRAPHQL"
      ? graph(`mutation($input: VentaInput!) { registrarVenta(input: $input) { ${saleFields} } }`, { input: data })
      : rest("/api/ventas", { method: "POST", body: JSON.stringify(data) }),
  };
}
