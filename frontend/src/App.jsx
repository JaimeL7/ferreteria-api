import { useCallback, useEffect, useMemo, useState } from "react";

const money = (value) => new Intl.NumberFormat("es-CO", {
  style: "currency", currency: "COP", maximumFractionDigits: 0,
}).format(Number(value || 0));
const date = (value) => value ? new Intl.DateTimeFormat("es-CO", {
  day: "2-digit", month: "short", year: "numeric",
}).format(new Date(value)) : "—";
const initials = (value = "") => value.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const readableError = (error, config) => /failed to fetch|networkerror|fetch failed/i.test(error.message || "")
  ? `No se pudo conectar con la API en ${config?.baseUrl || "http://localhost:3000"}. Confirma que el backend esté iniciado y vuelve a intentar.`
  : error.message || "Ocurrió un error inesperado al comunicarse con la API.";

const icons = {
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
  box: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  receipt: <><path d="M4 3v18l4-2 4 2 4-2 4 2V3l-4 2-4-2-4 2-4-2Z"/><path d="M8 9h8M8 13h8"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  trend: <><path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z"/></>,
};
function Icon({ name, size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>;
}

function Login({ onConnect, busy, error, onClearError }) {
  const [form, setForm] = useState({ baseUrl: "http://localhost:3000", username: "", password: "" });
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  return <main className="login-screen"><div className="login-card">
    <div className="brand-mark large">FC</div><p className="eyebrow">FERRETERÍA CENTRAL</p>
    <h1>Tu negocio, <em>en orden.</em></h1><p className="login-copy">Conecta con la API para gestionar inventario, clientes y ventas.</p>
    <form onSubmit={(event) => { event.preventDefault(); onConnect(form); }} className="login-form">
      <label>Dirección de la API<input value={form.baseUrl} onChange={update("baseUrl")} required /></label>
      <label>Usuario API<input value={form.username} onChange={update("username")} autoComplete="username" required /></label>
      <label>Contraseña API<input type="password" value={form.password} onChange={update("password")} autoComplete="current-password" required /></label>
      {error && <ErrorAlert message={error} onClose={onClearError} />}
      <button className="button primary full" disabled={busy}>{busy ? "Conectando…" : "Conectar con la API"}<Icon name="arrow" /></button>
    </form>
    <p className="login-foot">Usa las credenciales de <code>BASIC_AUTH_USER</code> y <code>BASIC_AUTH_PASS</code> del backend.</p>
  </div><div className="login-decoration"><span>01 / INVENTARIO</span><div className="deco-grid"><i>⚒</i><b>Todo lo que<br/>necesitas, a mano.</b></div></div></main>;
}

function App({ createGateway }) {
  const [config, setConfig] = useState(null);
  const [page, setPage] = useState("inicio");
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState("");
  const [editing, setEditing] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  const loadData = useCallback(async (activeConfig) => {
    setLoading(true); setError("");
    try {
      const gateway = createGateway(activeConfig);
      const [productRows, customerRows, saleRows] = await Promise.all([gateway.listProducts(), gateway.listCustomers(), gateway.listSales()]);
      setProducts(productRows); setCustomers(customerRows); setSales(saleRows);
    } catch (e) { setError(readableError(e, activeConfig)); }
    finally { setLoading(false); }
  }, []);

  const connect = async (form) => {
    setConnecting(true); setError("");
    const next = { ...form, baseUrl: form.baseUrl.trim() };
    try {
      await createGateway(next).checkConnection();
      setConfig(next); await loadData(next);
    } catch (e) { setError(readableError(e, next)); }
    finally { setConnecting(false); }
  };

  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(""), 3500); return () => clearTimeout(timer); } }, [notice]);

  const filteredProducts = useMemo(() => products.filter((item) => `${item.nombre} ${item.sku}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const filteredCustomers = useMemo(() => customers.filter((item) => `${item.nombre} ${item.documento}`.toLowerCase().includes(search.toLowerCase())), [customers, search]);
  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const activeProducts = products.filter((item) => item.activo !== false).length;
  const lowStock = products.filter((item) => item.activo !== false && item.stock <= 5).length;

  const save = async (path, payload, success) => {
    try {
      const gateway = createGateway(config);
      const resource = path === "/api/productos" ? "Product" : path === "/api/clientes" ? "Customer" : "Sale";
      if (editing && resource === "Product") await gateway.updateProduct(editing._id, payload);
      else if (editing && resource === "Customer") await gateway.updateCustomer(editing._id, payload);
      else if (resource === "Product") await gateway.createProduct(payload);
      else if (resource === "Customer") await gateway.createCustomer(payload);
      else await gateway.registerSale(payload);
      setModal(""); setEditing(null); setNotice(success); await loadData(config);
    } catch (e) { setError(readableError(e, config)); }
  };

  const deactivate = async (row, kind) => {
    if (!window.confirm(`¿Desactivar ${kind === "producto" ? "el producto" : "al cliente"} “${row.nombre}”?`)) return;
    try { const gateway = createGateway(config); if (kind === "producto") await gateway.deactivateProduct(row._id); else await gateway.deactivateCustomer(row._id); setNotice(`${kind === "producto" ? "Producto" : "Cliente"} desactivado.`); await loadData(config); }
    catch (e) { setError(readableError(e, config)); }
  };
  const closeModal = () => { setModal(""); setEditing(null); setError(""); };

  if (!config) return <Login onConnect={connect} busy={connecting} error={error} onClearError={() => setError("")} />;

  const nav = [
    { id: "inicio", title: "Resumen", icon: "home", group: "GENERAL" },
    { id: "productos", title: "Productos", icon: "box", group: "CATÁLOGO", count: products.length },
    { id: "clientes", title: "Clientes", icon: "users", group: "CATÁLOGO" },
    { id: "ventas", title: "Ventas", icon: "receipt", group: "VENTAS" },
  ];
  const title = { inicio: "Resumen", productos: "Productos", clientes: "Clientes", ventas: "Ventas" }[page];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">FC</div><div><strong>ferretería</strong><span>central · gestión</span></div></div>
      <div className="store-card"><span className="store-avatar">FC</span><div><b>Mi ferretería</b><small>Panel de administración</small></div><span className="dots">···</span></div>
      { ["GENERAL", "CATÁLOGO", "VENTAS"].map((group) => <div className="nav-group" key={group}><p>{group}</p>{nav.filter((item) => item.group === group).map((item) => <button key={item.id} onClick={() => { setPage(item.id); setSearch(""); setError(""); }} className={`nav-link ${page === item.id ? "active" : ""}`}><Icon name={item.icon} /><span>{item.title}</span>{item.count !== undefined && <small>{item.count}</small>}</button>)}</div>) }
      <div className="sidebar-bottom"><div className="connection"><i></i><span>API conectada</span><button title="Desconectar" onClick={() => { setConfig(null); setProducts([]); setCustomers([]); setSales([]); }}>Salir</button></div><div className="profile"><div className="profile-avatar">{initials(config.username)}</div><div><b>{config.username}</b><small>Administrador</small></div><span className="dots">···</span></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>{title}</strong></div><div className="top-actions"><span className="today">{new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</span><button className="icon-button" title="Actualizar datos" onClick={() => loadData(config)}><span className={loading ? "spin" : ""}>↻</span></button><div className="top-avatar">{initials(config.username)}</div></div></header>
      <section className="content">
        <div className="page-heading"><div><p className="eyebrow">{page === "inicio" ? "TU NEGOCIO HOY" : "GESTIÓN DE " + title.toUpperCase()}</p><h1>{page === "inicio" ? <>Un buen día para <em>vender.</em></> : title}</h1><p className="subheading">{page === "inicio" ? "Aquí tienes lo que está pasando en tu ferretería." : `Administra ${title.toLowerCase()} de forma sencilla.`}</p></div>
          <div className="heading-buttons">{page !== "inicio" && page !== "ventas" && <div className="search-box"><Icon name="search" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Buscar ${title.toLowerCase()}…`} /></div>}{page !== "inicio" && <button className="button primary" onClick={() => { setError(""); setEditing(null); setModal(page === "productos" ? "producto" : page === "clientes" ? "cliente" : "venta"); }}><Icon name="plus" />{page === "productos" ? "Nuevo producto" : page === "clientes" ? "Nuevo cliente" : "Nueva venta"}</button>}</div>
        </div>
        {notice && <div className="toast">✓ &nbsp;{notice}</div>}
        {loading && <div className="loading-line"><i/> Actualizando información…</div>}

        {page === "inicio" && <>
          <div className="stats-grid">
            <Stat label="Productos activos" value={activeProducts} icon="box" tint="mint" note="En tu catálogo" />
            <Stat label="Clientes" value={customers.length} icon="users" tint="violet" note="Registrados" />
            <Stat label="Ventas registradas" value={sales.length} icon="receipt" tint="orange" note="Histórico total" />
            <Stat label="Ingresos registrados" value={money(totalSales)} icon="trend" tint="blue" note="Acumulado histórico" />
          </div>
          <div className="dashboard-grid">
            <section className="panel inventory-panel"><div className="panel-head"><div><p className="eyebrow">INVENTARIO</p><h2>Productos recientes</h2></div><button className="text-link" onClick={() => setPage("productos")}>Ver catálogo <Icon name="arrow" size={16}/></button></div><ProductTable products={products.slice(0, 5)} compact onOpen={() => setPage("productos")} /></section>
            <section className="panel stock-panel"><div className="panel-head"><div><p className="eyebrow">ATENCIÓN</p><h2>Stock bajo</h2></div><span className="attention-count">{lowStock}</span></div>{lowStock ? products.filter((p) => p.activo !== false && p.stock <= 5).slice(0, 4).map((p) => <div className="low-row" key={p._id}><span className="product-mini">{initials(p.nombre)}</span><div><b>{p.nombre}</b><small>{p.sku}</small></div><strong>{p.stock} <small>unid.</small></strong></div>) : <Empty icon="box" title="Todo en orden" text="No tienes productos con stock crítico." />}</section>
          </div>
            <section className="panel recent-panel"><div className="panel-head"><div><p className="eyebrow">MOVIMIENTOS</p><h2>Ventas recientes</h2></div><button className="text-link" onClick={() => setPage("ventas")}>Ver ventas <Icon name="arrow" size={16}/></button></div><SalesTable sales={sales.slice(0, 5)} customers={customers} onView={setSelectedSale} /></section>
        </>}
        {page === "productos" && <section className="panel full-panel"><div className="panel-head"><div><p className="eyebrow">CATÁLOGO</p><h2>{filteredProducts.length} productos</h2></div><span className="subtle">Precios en pesos colombianos</span></div><ProductTable products={filteredProducts} onEdit={(row) => { setError(""); setEditing(row); setModal("producto"); }} onDeactivate={(row) => deactivate(row, "producto")} /></section>}
        {page === "clientes" && <section className="panel full-panel"><div className="panel-head"><div><p className="eyebrow">RELACIONES</p><h2>{filteredCustomers.length} clientes</h2></div></div><CustomerTable customers={filteredCustomers} onEdit={(row) => { setError(""); setEditing(row); setModal("cliente"); }} onDeactivate={(row) => deactivate(row, "cliente")} /></section>}
        {page === "ventas" && <section className="panel full-panel"><div className="panel-head"><div><p className="eyebrow">HISTORIAL</p><h2>{sales.length} ventas</h2></div><span className="subtle">Total vendido: <b>{money(totalSales)}</b></span></div><SalesTable sales={sales} customers={customers} onView={setSelectedSale} /></section>}
        <footer className="footer-note">Ferretería Central <span>·</span> Sistema de gestión</footer>
      </section>
    </main>
    {modal && <Modal title={modal === "producto" ? editing ? "Editar producto" : "Agregar producto" : modal === "cliente" ? editing ? "Editar cliente" : "Registrar cliente" : "Registrar una venta"} onClose={closeModal}>
      {modal === "producto" && <ProductForm initial={editing} onCancel={closeModal} onSubmit={(data) => save("/api/productos", data, "Producto guardado en el inventario.")} />}
      {modal === "cliente" && <CustomerForm initial={editing} onCancel={closeModal} onSubmit={(data) => save("/api/clientes", data, "Cliente guardado correctamente.")} />}
      {modal === "venta" && <SaleForm products={products.filter((p) => p.activo !== false && p.stock > 0)} customers={customers.filter((c) => c.activo !== false)} onCancel={closeModal} onSubmit={(data) => save("/api/ventas", data, "Venta registrada y stock actualizado.")} />}
    </Modal>}
    {selectedSale && <SaleDetailModal sale={selectedSale} customers={customers} onClose={() => setSelectedSale(null)} />}
    {error && <ErrorAlert message={error} onClose={() => setError("")} />}
  </div>;
}

function Stat({ label, value, icon, tint, note }) {
  return <article className="stat-card"><div className={`stat-icon ${tint}`}><Icon name={icon} size={20}/></div><span className="stat-note">{note}</span><p>{label}</p><strong>{value}</strong></article>;
}

function ProductTable({ products, compact = false, onOpen, onEdit, onDeactivate }) {
  if (!products.length) return <Empty icon="box" title="Aún no hay productos" text="Agrega productos para verlos en tu inventario." />;
  return <div className="table-wrap"><table><thead><tr><th>PRODUCTO</th><th>SKU</th><th>PRECIO</th><th>STOCK</th><th>ESTADO</th>{onEdit && <th>ACCIONES</th>}</tr></thead><tbody>{products.map((p) => <tr key={p._id} onClick={onOpen} className={onOpen ? "click-row" : ""}><td><div className="item-cell"><span className="product-mini">{initials(p.nombre)}</span><div><b>{p.nombre}</b><small>{p.descripcion || "Producto ferretero"}</small></div></div></td><td className="mono">{p.sku}</td><td className="price">{money(p.precio)}</td><td><span className={`stock-pill ${p.stock <= 5 ? "low" : ""}`}>{p.stock} unid.</span></td><td><span className={`status ${p.activo === false ? "inactive" : "active"}`}><i/>{p.activo === false ? "Inactivo" : "Activo"}</span></td>{onEdit && <td><div className="row-actions"><button onClick={(e) => { e.stopPropagation(); onEdit(p); }}>Editar</button>{p.activo !== false && <button className="danger-link" onClick={(e) => { e.stopPropagation(); onDeactivate(p); }}>Desactivar</button>}</div></td>}</tr>)}</tbody></table>{compact && <div className="table-footer">Mostrando {products.length} productos</div>}</div>;
}

function CustomerTable({ customers, onEdit, onDeactivate }) {
  if (!customers.length) return <Empty icon="users" title="Aún no hay clientes" text="Registra tus clientes para asociarlos a las ventas." />;
  return <div className="table-wrap"><table><thead><tr><th>CLIENTE</th><th>DOCUMENTO</th><th>CORREO</th><th>TELÉFONO</th><th>ESTADO</th><th>ACCIONES</th></tr></thead><tbody>{customers.map((c) => <tr key={c._id}><td><div className="item-cell"><span className="customer-avatar">{initials(c.nombre)}</span><div><b>{c.nombre}</b><small>Registrado {date(c.createdAt)}</small></div></div></td><td className="mono">{c.documento}</td><td>{c.correo || "—"}</td><td>{c.telefono || "—"}</td><td><span className={`status ${c.activo === false ? "inactive" : "active"}`}><i/>{c.activo === false ? "Inactivo" : "Activo"}</span></td><td><div className="row-actions"><button onClick={() => onEdit(c)}>Editar</button>{c.activo !== false && <button className="danger-link" onClick={() => onDeactivate(c)}>Desactivar</button>}</div></td></tr>)}</tbody></table></div>;
}

function SalesTable({ sales, customers, onView }) {
  if (!sales.length) return <Empty icon="receipt" title="Todavía no hay ventas" text="Cuando registres una venta, aparecerá aquí." />;
  const customerName = (id) => customers.find((c) => c._id === id)?.nombre || `Cliente ${String(id).slice(-6)}`;
  return <div className="table-wrap"><table><thead><tr><th>VENTA</th><th>CLIENTE</th><th>FECHA</th><th>ARTÍCULOS</th><th>TOTAL</th><th></th></tr></thead><tbody>{sales.map((s) => <tr key={s._id}><td className="mono">#{String(s._id).slice(-8).toUpperCase()}</td><td><div className="item-cell"><span className="customer-avatar small">{initials(customerName(s.clienteId))}</span><b>{customerName(s.clienteId)}</b></div></td><td>{date(s.fecha)}</td><td>{s.detalles?.reduce((sum, item) => sum + item.cantidad, 0) || 0} unidades</td><td className="price">{money(s.total)}</td><td><button className="text-link" onClick={() => onView(s)}>Ver detalle <Icon name="arrow" size={14}/></button></td></tr>)}</tbody></table></div>;
}

function Empty({ icon, title, text }) { return <div className="empty-state"><span><Icon name={icon} size={22}/></span><b>{title}</b><p>{text}</p></div>; }
function Modal({ title, onClose, children }) { return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="modal"><div className="modal-head"><div><p className="eyebrow">FERRETERÍA CENTRAL</p><h2>{title}</h2></div><button className="icon-button close-button" onClick={onClose} aria-label="Cerrar">×</button></div>{children}</section></div>; }

function ErrorAlert({ message, onClose }) {
  return <div className="alert-backdrop" role="presentation"><section className="alert-dialog" role="alertdialog" aria-modal="true" aria-labelledby="api-error-title" aria-describedby="api-error-message">
    <span className="alert-icon">!</span><p className="eyebrow">CONEXIÓN CON EL SERVIDOR</p><h2 id="api-error-title">No se pudo completar la solicitud</h2>
    <p id="api-error-message">{message}</p><button className="button primary" onClick={onClose}>Entendido</button>
  </section></div>;
}

function SaleDetailModal({ sale, customers, onClose }) {
  const customer = customers.find((item) => item._id === sale.clienteId);
  return <Modal title="Detalle de venta" onClose={onClose}>
    <div className="sale-detail-head"><div><span className="detail-label">COMPROBANTE</span><b>#{String(sale._id).slice(-8).toUpperCase()}</b></div><div><span className="detail-label">FECHA</span><b>{new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeStyle: "short" }).format(new Date(sale.fecha))}</b></div></div>
    <div className="sale-customer"><span className="customer-avatar">{initials(customer?.nombre || "Cliente")}</span><div><span className="detail-label">CLIENTE</span><b>{customer?.nombre || "Cliente"}</b><small>Documento: {customer?.documento || "—"}</small></div></div>
    <div className="sale-lines"><div className="sale-lines-title"><span>PRODUCTO</span><span>CANT.</span><span>PRECIO</span><span>SUBTOTAL</span></div>{sale.detalles?.map((line, index) => <div className="sale-line" key={`${line.productoId}-${index}`}><div><b>{line.nombre}</b><small>SKU {line.sku}</small></div><span>{line.cantidad}</span><span>{money(line.precioUnitario)}</span><b>{money(line.subtotal)}</b></div>)}</div>
    <div className="sale-total"><span>Total de la venta</span><strong>{money(sale.total)}</strong></div>
    <p className="snapshot-note">Los datos de cada producto se guardaron como detalle de esta venta.</p>
    <div className="modal-actions"><button className="button primary" onClick={onClose}>Cerrar detalle</button></div>
  </Modal>;
}

function ProductForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState({ sku: initial?.sku || "", nombre: initial?.nombre || "", descripcion: initial?.descripcion || "", precio: initial?.precio || "", stock: initial?.stock ?? "" });
  const [busy, setBusy] = useState(false);
  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  return <form className="modal-form" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const data = { ...form, stock: Number(form.stock) }; if (!data.descripcion.trim()) delete data.descripcion; await onSubmit(data); setBusy(false); }}>
    <label>SKU<input value={form.sku} onChange={update("sku")} placeholder="FER-001" required /></label>
    <label>Nombre<input value={form.nombre} onChange={update("nombre")} placeholder="Nombre del producto" required /></label>
    <label className="wide">Descripción<input value={form.descripcion} onChange={update("descripcion")} placeholder="Descripción breve" /></label>
    <label>Precio (COP)<input type="number" min="0" step="0.01" value={form.precio} onChange={update("precio")} placeholder="0" required /></label>
    <label>Stock inicial<input type="number" min="0" step="1" value={form.stock} onChange={update("stock")} placeholder="0" required /></label>
    <div className="modal-actions"><button type="button" className="button ghost" onClick={onCancel}>Cancelar</button><button className="button primary" disabled={busy}>{busy ? "Guardando…" : initial ? "Guardar cambios" : "Guardar producto"}</button></div>
  </form>;
}

function CustomerForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState({ nombre: initial?.nombre || "", documento: initial?.documento || "", correo: initial?.correo || "", telefono: initial?.telefono || "" });
  const [busy, setBusy] = useState(false);
  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  return <form className="modal-form" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const data = Object.fromEntries(Object.entries(form).filter(([key, value]) => ["nombre", "documento"].includes(key) || value.trim())); await onSubmit(data); setBusy(false); }}>
    <label>Nombre completo<input value={form.nombre} onChange={update("nombre")} placeholder="Nombre del cliente" required /></label>
    <label>Documento<input value={form.documento} onChange={update("documento")} placeholder="Número de documento" required /></label>
    <label>Correo electrónico<input type="email" value={form.correo} onChange={update("correo")} placeholder="cliente@correo.com" /></label>
    <label>Teléfono<input value={form.telefono} onChange={update("telefono")} placeholder="300 000 0000" /></label>
    <div className="modal-actions"><button type="button" className="button ghost" onClick={onCancel}>Cancelar</button><button className="button primary" disabled={busy}>{busy ? "Guardando…" : initial ? "Guardar cambios" : "Guardar cliente"}</button></div>
  </form>;
}

function SaleForm({ products, customers, onSubmit, onCancel }) {
  const [clienteId, setClienteId] = useState("");
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [busy, setBusy] = useState(false);
  const product = products.find((p) => p._id === productoId);
  return <form className="modal-form single-column" onSubmit={async (e) => { e.preventDefault(); setBusy(true); await onSubmit({ clienteId, detalles: [{ productoId, cantidad: Number(cantidad) }] }); setBusy(false); }}>
    <label>Cliente<select required value={clienteId} onChange={(e) => setClienteId(e.target.value)}><option value="">Selecciona un cliente</option>{customers.map((c) => <option key={c._id} value={c._id}>{c.nombre} · {c.documento}</option>)}</select></label>
    <label>Producto<select required value={productoId} onChange={(e) => setProductoId(e.target.value)}><option value="">Selecciona un producto</option>{products.map((p) => <option key={p._id} value={p._id}>{p.nombre} · {p.stock} disponibles</option>)}</select></label>
    <label>Cantidad<input type="number" min="1" max={product?.stock || undefined} step="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required /></label>
    {product && <div className="sale-preview"><span>Precio unitario</span><b>{money(product.precio)}</b><span>Total estimado</span><b>{money(Number(product.precio) * Number(cantidad))}</b></div>}
    {!customers.length && <div className="form-hint">Registra primero un cliente para crear una venta.</div>}
    {!products.length && <div className="form-hint">No hay productos activos con stock disponible.</div>}
    <div className="modal-actions"><button type="button" className="button ghost" onClick={onCancel}>Cancelar</button><button className="button primary" disabled={busy || !customers.length || !products.length}>{busy ? "Registrando…" : "Confirmar venta"}</button></div>
  </form>;
}

export default App;
