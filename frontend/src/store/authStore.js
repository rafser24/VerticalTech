import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:            null,
      token:           null,
      roles:           [],
      permissions:     [],
      isAuthenticated: false,

      login: (userData, token, roles = [], permissions = []) => {
        set({ user: userData, token, roles, permissions, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, roles: [], permissions: [], isAuthenticated: false });
        localStorage.removeItem('auth-storage');
      },

      getToken: () => get().token,
      getUser:  () => get().user,

      // ── Helpers de rol ─────────────────────────────────────────────
      /**
       * Devuelve true si el usuario tiene alguno de los roles indicados.
       * Acepta string o array: hasRole('admin') | hasRole(['admin','super-admin'])
       */
      hasRole: (roleOrRoles) => {
        const { user, roles } = get();
        if (!user) return false;
        const lista = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
        return lista.some(r =>
          user.rol === r ||
          roles.includes(r) ||
          (Array.isArray(user.roles) && user.roles.includes(r))
        );
      },

      isSuperAdmin: () => {
        const { user, roles } = get();
        if (!user) return false;
        return (
          user.rol === 'super-admin' ||
          roles.includes('super-admin') ||
          (Array.isArray(user.roles) && user.roles.includes('super-admin'))
        );
      },

      isAdmin: () => {
        const { user, roles } = get();
        if (!user) return false;
        const adminRoles = ['admin', 'super-admin'];
        return (
          adminRoles.includes(user.rol) ||
          adminRoles.some(r => roles.includes(r)) ||
          (Array.isArray(user.roles) && adminRoles.some(r => user.roles.includes(r)))
        );
      },

      isVendedor: () => {
        const { user, roles } = get();
        if (!user) return false;
        return (
          user.rol === 'vendedor' ||
          roles.includes('vendedor') ||
          (Array.isArray(user.roles) && user.roles.includes('vendedor'))
        );
      },

      hasPermission: (permission) => {
        const { permissions } = get();
        return Array.isArray(permissions) && permissions.includes(permission);
      },
    }),
    {
      name: 'auth-storage',
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
