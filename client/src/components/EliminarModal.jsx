/**
 * Ventana de confirmación antes de eliminar un producto.
 *
 * @param {object} props
 * @param {{nombre: string}} props.producto
 * @param {() => void} props.onCancelar
 * @param {() => void} props.onConfirmar
 */
export default function EliminarModal({ producto, onCancelar, onConfirmar }) {
  return (
    <div className="modal visible">
      <div className="modal-box modal-pequeno">
        <div className="confirmacion-icono">🗑️</div>
        <h2>Eliminar producto</h2>
        <p>
          ¿Estás seguro de que deseas eliminar <strong>{producto.nombre}</strong>?
        </p>
        <p className="texto-advertencia">Esta acción no se puede deshacer.</p>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onCancelar}>Cancelar</button>
          <button className="danger-btn" onClick={onConfirmar}>🗑️ Eliminar</button>
        </div>
      </div>
    </div>
  );
}
