import { useState } from "react";
import { api } from "../api.js";

/**
 * Pantalla de inicio de sesión. Envía usuario y contraseña a la API.
 *
 * @param {object} props
 * @param {(datos: {token: string, usuario: object}) => void} props.onLogin se llama cuando el login es correcto
 */
export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const data = await api.login(usuario, password);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login-pantalla">
      <form className="login-caja" onSubmit={enviar}>
        <div className="login-marca">
          <div className="logo-icon">📦</div>
          <div>
            <strong>StockControl</strong>
            <span>Gestión de inventario</span>
          </div>
        </div>

        <h2>Iniciar sesión</h2>

        <div className="campo">
          <label htmlFor="usuario">Usuario</label>
          <input
            id="usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </div>

        <div className="campo">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="login-error" role="alert">{error}</p>}

        <button className="primary-btn ancho" disabled={cargando}>
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
