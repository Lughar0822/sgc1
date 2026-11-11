import { useState } from "react";

const CATEGORIAS = ["Comidas", "Bebidas", "Snacks", "Dulces", "Otros"];

// Se monta con key distinta cada vez que se abre, así el formulario siempre arranca limpio
/**
 * Formulario para agregar un producto o editar uno existente.
 *
 * @param {object} props
 * @param {object|null} props.producto null para crear uno nuevo
 * @param {() => void} props.onCerrar
 * @param {(datos: object) => Promise<boolean>} props.onGuardar devuelve true si se guardó
 */
export default function ProductoModal({ producto, onCerrar, onGuardar }) {
  const editando = Boolean(producto);
  const [form, setForm] = useState({
    nombre: producto?.nombre ?? "",
    categoria: producto?.categoria ?? "",
    precio: producto?.precio ?? "",
    stock: producto?.stock ?? "",
    icono: producto?.icono ?? "📦",
  });
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setGuardando(true);
    const ok = await onGuardar({
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      precio: Number(form.precio),
      stock: Number(form.stock),
      icono: form.icono.trim() || "📦",
    });
    if (!ok) setGuardando(false);
  }

  return (
    <div className="modal visible">
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <h2>{editando ? "Editar producto" : "Agregar producto"}</h2>
            <p>Completa la información del producto</p>
          </div>
          <button className="cerrar-modal" onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>

        <form onSubmit={enviar}>
          <div className="form-grid">
            <div className="campo">
              <label>Nombre del producto *</label>
              <input value={form.nombre} onChange={cambiar("nombre")} placeholder="Ej: Panzerotti" required />
            </div>

            <div className="campo">
              <label>Categoría *</label>
              <select value={form.categoria} onChange={cambiar("categoria")} required>
                <option value="">Seleccionar categoría</option>
                {/* Si el producto trae una categoría que no está en la lista, se conserva */}
                {[...new Set([...CATEGORIAS, form.categoria].filter(Boolean))].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label>Precio *</label>
              <input type="number" min="0" step="1" value={form.precio} onChange={cambiar("precio")} placeholder="5000" required />
            </div>

            <div className="campo">
              <label>{editando ? "Stock *" : "Stock inicial *"}</label>
              <input type="number" min="0" step="1" value={form.stock} onChange={cambiar("stock")} placeholder="20" required />
            </div>

            <div className="campo campo-completo">
              <label>Icono del producto</label>
              <input value={form.icono} onChange={cambiar("icono")} placeholder="🥟" maxLength={4} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-btn" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="primary-btn" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
