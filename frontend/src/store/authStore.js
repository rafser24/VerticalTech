import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * authStore — CORREGIDO
 *
 * PROBLEMA ORIGINAL:
 *   isAdmin() comprobaba user?.rol === 'admin'
 *   pero el objeto 'user' que se guardaba venía de response.data.user
 *   sin pasar por el wrapper de ApiResponse, por lo que 'rol' era undefined.
 *
 * SOLUCIÓN:
 *   1. LoginPage ahora extrae correctamente el user desde response.data.data.user
 *   2. isAdmin() verifica AMBAS fuentes: campo 'rol' y array 'roles' de Spatie,
 *      para cubrir cualquier variación en la respuesta del backend.
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      user:            null,
      token:           null,
      roles:           [],         // roles de Spatie (array de strings)
      permissions:     [],         // permisos de Spatie
      isAuthenticated: false,

      // ── Acciones ──────────────────────────────────────────────────
      login: (userData, token, roles = [], permissions = []) => {
        set({
          user:            userData,
          token,
          roles,
          permissions,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user:            null,
          token:           null,
          roles:           [],
          permissions:     [],
          isAuthenticated: false,
        });
        localStorage.removeItem('auth-storage');
      },

      // ── Selectores ─────────────────────────────────────────────────
      getToken: () => get().token,
      getUser:  () => get().user,

      /**
       * isAdmin — verifica si el usuario logueado tiene rol de administrador.
       *
       * Comprueba en orden:
       *   1. user.rol === 'admin'           (campo directo del modelo Usuario)
       *   2. roles.includes('admin')        (array de Spatie en el store)
       *   3. user.roles?.includes('admin')  (si el objeto user trae roles embebidos)
       *
       * Esto cubre cualquier variación en cómo el backend estructura la respuesta.
       */
      isAdmin: () => {
        const { user, roles } = get();
        if (!user) return false;

        return (
          user.rol         === 'admin'        ||
          user.rol         === 'Super Admin'  ||
          roles.includes('admin')             ||
          roles.includes('Super Admin')       ||
          (Array.isArray(user.roles) && (
            user.roles.includes('admin') ||
            user.roles.includes('Super Admin')
          ))
        );
      },

      /**
       * hasRole — verifica si el usuario tiene un rol específico.
       * Útil para control granular en el frontend.
       */
      hasRole: (role) => {
        const { user, roles } = get();
        if (!user) return false;
        return (
          user.rol === role              ||
          roles.includes(role)           ||
          (Array.isArray(user.roles) && user.roles.includes(role))
        );
      },

      /**
       * hasPermission — verifica un permiso específico de Spatie.
       */
      hasPermission: (permission) => {
        const { permissions } = get();
        return Array.isArray(permissions) && permissions.includes(permission);
      },
    }),
    {
      name: 'auth-storage',
      // Solo persistir campos esenciales, no funciones
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        roles:           state.roles,
        permissions:     state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
