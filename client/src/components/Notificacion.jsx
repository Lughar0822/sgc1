/**
 * Aviso flotante en la esquina inferior derecha (éxito o error).
 *
 * @param {object} props
 * @param {{texto: string, visible: boolean, error: boolean}} props.notificacion
 */
export default function Notificacion({ notificacion }) {
  return (
    <div className={"notificacion" + (notificacion.visible ? " mostrar" : "")} role="status" aria-live="polite">
      <span>{notificacion.error ? "⚠️" : "✓"}</span>
      <span>{notificacion.texto}</span>
    </div>
  );
}
