import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { loginSchema } from '../schemas';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/* ─── Inline styles ────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .vt-root {
    min-height: 100vh;
    display: flex;
    font-family: 'DM Sans', sans-serif;
    background: #0F172A;
    overflow: hidden;
  }

  /* ── Full-screen centered layout ── */
  .vt-scene {
    min-height: 100vh;
    background: #EEF2FF;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }

  /* Pastel blobs */
  .vt-blob {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0.55;
    animation: orb-drift 10s ease-in-out infinite alternate;
  }
  .vt-blob-1 {
    width: 420px; height: 420px;
    background: #C7D2FE;
    top: -100px; left: -100px;
  }
  .vt-blob-2 {
    width: 340px; height: 340px;
    background: #BAE6FD;
    bottom: -80px; right: -80px;
    animation-duration: 13s;
    animation-direction: alternate-reverse;
  }
  .vt-blob-3 {
    width: 220px; height: 220px;
    background: #FDE8FF;
    top: 40%; left: 62%;
    animation-duration: 16s;
  }

  @keyframes orb-drift {
    from { transform: translate(0, 0) scale(1); }
    to   { transform: translate(24px, 16px) scale(1.08); }
  }

  /* ── Card ── */
  .vt-card {
    width: 100%;
    max-width: 400px;
    background: #ffffff;
    border-radius: 24px;
    padding: 2.75rem 2.5rem;
    border: 1px solid #E0E7FF;
    box-shadow: 0 2px 4px #a5b4fc22, 0 16px 48px #818cf828;
    position: relative;
    z-index: 2;
    animation: fade-up 0.7s cubic-bezier(.22,1,.36,1) both;
  }

  .vt-card-header { margin-bottom: 2rem; }
  .vt-card-eyebrow {
    font-size: 0.68rem;
    font-weight: 500;
    color: #6366F1;
    text-transform: uppercase;
    letter-spacing: 0.13em;
    margin-bottom: 0.4rem;
  }
  .vt-card-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.45rem;
    font-weight: 500;
    color: #1E1B4B;
    line-height: 1.25;
    letter-spacing: -0.01em;
    margin: 0 0 0.35rem;
  }
  .vt-card-sub {
    font-size: 0.85rem;
    color: #94A3B8;
    margin: 0;
    font-weight: 300;
  }

  /* Form */
  .vt-form { display: flex; flex-direction: column; gap: 1.1rem; }

  .vt-field { display: flex; flex-direction: column; gap: 0.32rem; }
  .vt-label {
    font-size: 0.77rem;
    font-weight: 500;
    color: #4F4F6E;
    letter-spacing: 0.01em;
  }
  .vt-input-wrap { position: relative; }
  .vt-input-icon {
    position: absolute;
    left: 13px;
    top: 50%;
    transform: translateY(-50%);
    color: #A5B4FC;
    pointer-events: none;
    transition: color 0.2s;
  }
  .vt-input-wrap:focus-within .vt-input-icon { color: #6366F1; }

  .vt-input {
    width: 100%;
    padding: 0.7rem 1rem 0.7rem 2.6rem;
    border: 1.5px solid #E0E7FF;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    color: #1E1B4B;
    background: #F5F3FF;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    box-sizing: border-box;
  }
  .vt-input:focus {
    border-color: #818CF8;
    background: #fff;
    box-shadow: 0 0 0 3px #818CF820;
  }
  .vt-input.error { border-color: #ef4444; }
  .vt-input.error:focus { box-shadow: 0 0 0 3px #ef444415; }

  .vt-eye-btn {
    position: absolute;
    right: 11px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #A5B4FC;
    padding: 4px;
    display: flex;
    transition: color 0.2s;
  }
  .vt-eye-btn:hover { color: #6366F1; }

  .vt-error-msg {
    font-size: 0.73rem;
    color: #ef4444;
    margin: 0;
  }

  /* Remember row */
  .vt-remember {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }
  .vt-checkbox {
    width: 15px; height: 15px;
    accent-color: #6366F1;
    cursor: pointer;
  }
  .vt-remember-label {
    font-size: 0.8rem;
    color: #94A3B8;
    cursor: pointer;
    user-select: none;
  }

  /* Submit button */
  .vt-btn {
    width: 100%;
    padding: 0.85rem 1rem;
    background: #6366F1;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.92rem;
    font-weight: 500;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
    box-shadow: 0 4px 14px #6366F133;
    margin-top: 0.15rem;
    letter-spacing: 0.01em;
  }
  .vt-btn:hover:not(:disabled) {
    background: #4F46E5;
    transform: translateY(-1px);
    box-shadow: 0 8px 22px #6366F144;
  }
  .vt-btn:active:not(:disabled) { transform: translateY(0); }
  .vt-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .vt-spinner {
    width: 15px; height: 15px;
    border: 2px solid #ffffff44;
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* Footer */
  .vt-footer {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.72rem;
    color: #CBD5E1;
  }

  /* Animations */
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 480px) {
    .vt-card { padding: 2rem 1.5rem; }
  }
`;

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const navigate      = useNavigate();
  const login         = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [remember, setRemember]         = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', data);

      const payload = response.data?.data || response.data;
      const token   = payload?.access_token || payload?.token;
      const user    = payload?.user;

      if (!token) {
        toast.error('Error del servidor: No se generó el token de acceso.');
        return;
      }
      if (!user) {
        toast.error('Error del servidor: No se recibió la información del usuario.');
        return;
      }

      const roles       = payload?.roles       || [];
      const permissions = payload?.permissions || [];
      login(user, token, roles, permissions);

      toast.success(`¡Bienvenido, ${user.nombre || user.name || 'Usuario'}!`);
      navigate('/dashboard');

    } catch (error) {
      let errorMessage = 'Error de conexión con el servidor';

      if (error.response) {
        const backendMessage   = error.response.data?.message;
        const validationErrors = error.response.data?.errors;

        if (validationErrors?.usuario) {
          errorMessage = validationErrors.usuario[0];
        } else if (validationErrors?.password) {
          errorMessage = validationErrors.password[0];
        } else {
          errorMessage = backendMessage || 'Credenciales incorrectas';
        }
        console.error('Error del backend:', error.response.data);
      } else if (error.request) {
        errorMessage = 'No se pudo contactar al servidor. Verifica si el backend está activo.';
        console.error('Error de red/CORS:', error.request);
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>

      <div className="vt-scene">
        {/* Pastel blobs */}
        <div className="vt-blob vt-blob-1" />
        <div className="vt-blob vt-blob-2" />
        <div className="vt-blob vt-blob-3" />

        <div className="vt-card">
            <div className="vt-card-header">
              <p className="vt-card-eyebrow">VerticalTech</p>
              <h2 className="vt-card-title">Bienvenido</h2>
              <p className="vt-card-sub">Accede a tu panel de gestión</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="vt-form" noValidate>
              {/* Usuario */}
              <div className="vt-field">
                <label className="vt-label" htmlFor="usuario">Usuario</label>
                <div className="vt-input-wrap">
                  <span className="vt-input-icon"><User size={16} /></span>
                  <input
                    {...register('usuario')}
                    id="usuario"
                    type="text"
                    placeholder="Nombre de usuario"
                    className={`vt-input${errors.usuario ? ' error' : ''}`}
                    autoComplete="username"
                  />
                </div>
                {errors.usuario && (
                  <p className="vt-error-msg">{errors.usuario.message}</p>
                )}
              </div>

              {/* Contraseña */}
              <div className="vt-field">
                <label className="vt-label" htmlFor="password">Contraseña</label>
                <div className="vt-input-wrap">
                  <span className="vt-input-icon"><Lock size={16} /></span>
                  <input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`vt-input${errors.password ? ' error' : ''}`}
                    style={{ paddingRight: '2.75rem' }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="vt-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="vt-error-msg">{errors.password.message}</p>
                )}
              </div>

              {/* Recordarme */}
              <div className="vt-remember">
                <input
                  type="checkbox"
                  id="remember"
                  className="vt-checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <label className="vt-remember-label" htmlFor="remember">Recordarme</label>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="vt-btn">
                {loading ? (
                  <>
                    <span className="vt-spinner" />
                    Iniciando sesión…
                  </>
                ) : 'Ingresar'}
              </button>
            </form>

            <p className="vt-footer">
              © {new Date().getFullYear()} VerticalTech · Todos los derechos reservados
            </p>
        </div>
      </div>
    </>
  );
}
