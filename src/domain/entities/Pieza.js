export class Pieza {
  constructor({ codigoProducto, descripcion, precio, marca, stock, fechaCrea, fechaModifica }) {
    this.codigoProducto = codigoProducto;
    this.descripcion = descripcion;
    this.precio = precio;
    this.marca = marca;
    this.stock = stock;
    this.fechaCrea = fechaCrea || new Date();
    this.fechaModifica = fechaModifica || new Date();
  }

  actualizarDatos({ descripcion, precio, marca, stock }) {
    if (descripcion) this.descripcion = descripcion;
    if (precio) this.precio = precio;
    if (marca) this.marca = marca;
    if (stock) this.stock = stock;
    this.fechaModifica = new Date();
  }
}
