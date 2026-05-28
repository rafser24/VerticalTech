/**
 * AuthContext.jsx
 *
 * Reemplaza authStore (Zustand) con React Context + useReducer.
 *
 * Por qué Context y no Zustand:
 *   — Sin dependencia externa. React lo provee de serie.
 *   — El estado global de auth cambia pocas veces (login/logout/updateUser),
 *     así que el overhead de Context no es un problema en la práctica.
 *
 * Persistencia: guardamos en localStorage bajo la clave 'auth-storage'.
 * El formato es plano { user, token, roles, permissions, isAuthenticated }
 * para que api.js pueda leerlo directamente sin depender de React.
 *
 * Nota sobre api.js:
 *   Los interceptores de Axios se ejecutan fuera del árbol de React,
 *   por eso leen el token directamente de localStorage en lugar de
 *   usar este contexto.
 */

import { createContext, useContext, useReducer, useEffect } from 'react';

/* ─── Clave de persistencia ─────────────────────────────────────────────── */
export const AUTH_STORAGE_KEY = 'auth-storage';

/* ─── Estado inicial — carga desde localStorage si existe ───────────────── */
function loadInitialState() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Compatibilidad con el formato antiguo de Zustand: { state: {...}, version: 0 }
    const data = parsed.state ?? parsed;

    // Normalizar: si user.rol no está definido, derivarlo de user.roles / roles
    // (ocurre con sesiones anteriores a que UsuarioResource expusiera el campo 'rol')
    if (data?.user && !data.user.rol) {
      const rolDerivado =
        (Array.isArray(data.user.roles) && data.user.roles[0]) ||
        (Array.isArray(data.roles)       && data.roles[0])      ||
        null;
      if (rolDerivado) {
        data.user = { ...data.user, rol: rolDerivado };
      }
    }

    return data;
  } catch {
    return null;
  }
}

const defaultState = {
  user:            null,
  token:           null,
  roles:           [],
  permissions:     [],
  isAuthenticated: false,
};

const initialState = { ...defaultState, ...(loadInitialState() ?? {}) };

/* ─── Reducer ────────────────────────────────────────────────────────────── */
function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        user:            action.user,
        token:           action.token,
        roles:           action.roles ?? [],
        permissions:     action.permissions ?? [],
        isAuthenticated: true,
      };
    case 'LOGOUT':
      return { ...defaultState };
    case 'UPDATE_USER':
      // Mezcla parcialmente los campos del usuario sin tocar token/roles/perms.
      // Útil cuando el usuario edita su perfil (nombre, foto_url, etc.).
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
}

/* ─── Contexto ───────────────────────────────────────────────────────────── */
const AuthContext = createContext(null);

/* ─── Provider ───────────────────────────────────────────────────────────── */
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Sincroniza el estado con localStorage cada vez que cambia.
   * Solo persistimos cuando hay sesión activa; al cerrar sesión
   * limpiamos la entrada para no dejar datos sensibles.
   */
  useEffect(() => {
    if (state.isAuthenticated) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user:            state.user,
        token:           state.token,
        roles:           state.roles,
        permissions:     state.permissions,
        isAuthenticated: true,
      }));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [state]);

  /* ── Acciones ─────────────────────────────────────────────────────────── */

  /** Inicia sesión y guarda el token + datos de usuario. */
  const login = (user, token, roles = [], permissions = []) => {
    dispatch({ type: 'LOGIN', user, token, roles, permissions });
  };

  /** Cierra sesión y borra todo del estado y del storage. */
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  /**
   * Actualiza parcialmente los datos del usuario activo.
   * Útil después de editar el perfil: no es necesario volver a loguear.
   */
  const updateUser = (payload) => {
    dispatch({ type: 'UPDATE_USER', payload });
  };

  /* ── Helpers de rol ───────────────────────────────────────────────────── */

  /**
   * Devuelve true si el usuario tiene alguno de los roles indicados.
   * Acepta string o array: hasRole('admin') | hasRole(['admin','super-admin'])
   */
  const hasRole = (roleOrRoles) => {
    if (!state.user) return false;
    const lista = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
    return lista.some(
      r =>
        state.user.rol === r ||
        (Array.isArray(state.roles) && state.roles.includes(r)) ||
        (Array.isArray(state.user.roles) && state.user.roles.includes(r))
    );
  };

  const isSuperAdmin = () => {
    if (!state.user) return false;
    // Comprobar el campo 'rol' del modelo (fuente de verdad primaria),
    // y como fallback los arrays de roles de Spatie.
    return (
      state.user.rol === 'super-admin' ||
      (Array.isArray(state.roles) && state.roles.includes('super-admin')) ||
      (Array.isArray(state.user.roles) && state.user.roles.includes('super-admin'))
    );
  };

  const isAdmin = () => {
    if (!state.user) return false;
    // 'isAdmin' incluye super-admin (puede hacer todo lo que el admin hace).
    const adminRoles = ['admin', 'super-admin'];
    return (
      adminRoles.includes(state.user.rol) ||
      (Array.isArray(state.roles) && adminRoles.some(r => state.roles.includes(r))) ||
      (Array.isArray(state.user.roles) && adminRoles.some(r => state.user.roles.includes(r)))
    );
  };

  const isVendedor = () => {
    if (!state.user) return false;
    return (
      state.user.rol === 'vendedor' ||
      state.roles.includes('vendedor') ||
      (Array.isArray(state.user.roles) && state.user.roles.includes('vendedor'))
    );
  };

  const hasPermission = (permission) =>
    Array.isArray(state.permissions) && state.permissions.includes(permission);

  /* ── Valor del contexto ───────────────────────────────────────────────── */
  const value = {
    // Estado
    ...state,
    // Acciones
    login,
    logout,
    updateUser,
    // Helpers de rol
    hasRole,
    isSuperAdmin,
    isAdmin,
    isVendedor,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ─── Hook de consumo ────────────────────────────────────────────────────── */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() debe usarse dentro de <AuthProvider>');
  return ctx;
}
