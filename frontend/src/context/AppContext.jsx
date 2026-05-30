/**
 * AppContext.jsx
 *
 * Reemplaza appStore (Zustand) con React Context + useReducer.
 *
 * Gestiona:
 *   — sidebarOpen / toggleSidebar: colapsa o expande el menú lateral.
 *   — empresa: datos de la empresa activa (nombre, logo, etc.) que se
 *     muestran en el sidebar y en el encabezado de los reportes.
 *
 * Este estado no se persiste en localStorage porque:
 *   — El sidebar se puede preferir cerrado o abierto según el contexto,
 *     pero recuperarlo del storage no aporta mucho valor de UX.

 */

import { createContext, useContext, useReducer, useCallback } from 'react';

/* ─── Estado inicial ─────────────────────────────────────────────────────── */
const initialState = {
  sidebarOpen: true,
  empresa: {
    nombre:    'VerticalTech',
    logo_url:  null,
    nit:       '',
    nrc:       '',
    telefono:  '',
    correo:    '',
    direccion: '',
  },
};

/* ─── Reducer ────────────────────────────────────────────────────────────── */
function appReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_EMPRESA':
      // Mezcla parcialmente para que baste con enviar solo los campos que cambian.
      return { ...state, empresa: { ...state.empresa, ...action.payload } };
    default:
      return state;
  }
}

/* ─── Contexto ───────────────────────────────────────────────────────────── */
const AppContext = createContext(null);

/* ─── Provider ───────────────────────────────────────────────────────────── */
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const toggleSidebar = useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR' }), []);
  const setEmpresa    = useCallback((data) => dispatch({ type: 'SET_EMPRESA', payload: data }), []);

  return (
    <AppContext.Provider value={{ ...state, toggleSidebar, setEmpresa }}>
      {children}
    </AppContext.Provider>
  );
}

/* ─── Hook de consumo ────────────────────────────────────────────────────── */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp() debe usarse dentro de <AppProvider>');
  return ctx;
}
