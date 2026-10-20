/**
 * Contrato del puerto de salida que consume la interfaz.
 * La UI no conoce si los métodos se resuelven por REST o por GraphQL.
 *
 * @typedef {Object} FerreteriaApiPort
 * @property {() => Promise<void>} checkConnection
 * @property {() => Promise<Array>} listProducts
 * @property {() => Promise<Array>} listCustomers
 * @property {() => Promise<Array>} listSales
 * @property {(data: Object) => Promise<Object>} createProduct
 * @property {(id: string, data: Object) => Promise<Object>} updateProduct
 * @property {(id: string) => Promise<Object>} deactivateProduct
 * @property {(data: Object) => Promise<Object>} createCustomer
 * @property {(id: string, data: Object) => Promise<Object>} updateCustomer
 * @property {(id: string) => Promise<Object>} deactivateCustomer
 * @property {(data: Object) => Promise<Object>} registerSale
 */
export {};
