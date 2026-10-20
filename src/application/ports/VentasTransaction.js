// Atomic unit of work. The callback runs only if all writes commit together.
export class VentasTransaction {
  async run(_operation) { throw new Error("Not implemented"); }
}
