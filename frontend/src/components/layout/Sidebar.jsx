import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Truck, Users, TrendingUp,
  UserCircle, ChevronLeft, ChevronRight, Boxes, BarChart2,
  Shield, Ticket, ShoppingBag, LogOut, Store,
} from 'lucide-react';
import useAppStore  from '../../store/appStore';
import useAuthStore from '../../store/authStore';

/**
 * Grupos del menú lateral agrupados por sección.
 * Cada grupo tiene: label (etiqueta visible) e items (links).
 */
const navGroups = [
  {
    label: null, // Sin encabezado — accesos principales
    items: [
      { to: '/dashboard', label: 'Dashboard',      icon: LayoutDashboard, roles: ['super-admin', 'admin', 'vendedor'] },
      { to: '/pos',       label: 'Punto de Venta', icon: Store,           roles: ['super-admin', 'admin', 'vendedor'] },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { to: '/ventas',  label: 'Ventas',  icon: TrendingUp,  roles: ['super-admin', 'admin', 'vendedor'] },
      { to: '/compras', label: 'Compras', icon: ShoppingBag, roles: ['super-admin', 'admin'] },
    ],
  },
  {
    label: 'Inventario',
    items: [
      { to: '/productos',   label: 'Productos',   icon: Package, roles: ['super-admin', 'admin', 'vendedor'] },
      { to: '/categorias',  label: 'Categorías',  icon: Tag,     roles: ['super-admin', 'admin'] },
      { to: '/promociones', label: 'Promociones', icon: Ticket,  roles: ['super-admin', 'admin'] },
    ],
  },
  {
    label: 'Contactos',
    items: [
      { to: '/clientes',    label: 'Clientes',    icon: Users, roles: ['super-admin', 'admin', 'vendedor'] },
      { to: '/proveedores', label: 'Proveedores', icon: Truck, roles: ['super-admin', 'admin'] },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { to: '/reportes', label: 'Reportes', icon: BarChart2, roles: ['super-admin', 'admin'] },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/usuarios',  label: 'Usuarios',  icon: UserCircle, roles: ['super-admin', 'admin'] },
      { to: '/auditoria', label: 'Auditoría', icon: Shield,     roles: ['super-admin', 'admin'] },
    ],
  },
];

// Badge de rol — colores originales del proyecto
const rolBadge = {
  'super-admin': { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Super Admin' },
  'admin':       { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin'       },
  'vendedor':    { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Vendedor'    },
  'tecnico':     { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Técnico'     },
  'bodeguero':   { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Bodeguero'   },
};

export default function Sidebar() {
  const sidebarOpen   = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const user          = useAuthStore((s) => s.user);
  const hasRole       = useAuthStore((s) => s.hasRole);
  const logout        = useAuthStore((s) => s.logout);
  const navigate      = useNavigate();

  const rolActual = user?.rol ?? '';
  const badge = rolBadge[rolActual] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: rolActual };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={`h-screen sticky top-0 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 shadow-soft
        ${sidebarOpen ? 'w-60' : 'w-16'}`}
    >
      {/* ── Logo ── */}
      <div className={`flex items-center gap-3 h-16 border-b border-gray-100 flex-shrink-0
        ${sidebarOpen ? 'px-4' : 'justify-center px-2'}`}
      >
        <div className="w-8 h-8 bg-pastel-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <Boxes size={18} className="text-blue-800" />
        </div>
        {sidebarOpen && (
          <span className="font-display font-bold text-gray-800 text-lg leading-tight">
            VerticalTech
          </span>
        )}
      </div>

      {/* ── Navegación agrupada ── */}
      <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin">
        {navGroups.map((group, gi) => {
          const itemsVisibles = group.items.filter(item =>
            item.roles.some(r => hasRole(r))
          );
          if (itemsVisibles.length === 0) return null;

          return (
            <div key={gi} className="mb-1">
              {/* Etiqueta de sección — solo cuando el sidebar está abierto */}
              {group.label && sidebarOpen && (
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 select-none">
                  {group.label}
                </p>
              )}
              {/* Separador visual cuando está colapsado */}
              {group.label && !sidebarOpen && gi > 0 && (
                <div className="mx-3 my-2 border-t border-gray-100" />
              )}

              {itemsVisibles.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to + label}
                  to={to}
                  title={!sidebarOpen ? label : undefined}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-0' : ''}`
                  }
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {sidebarOpen && <span>{label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* ── Footer: usuario + logout + toggle ── */}
      <div className="border-t border-gray-100 flex-shrink-0">
        {/* Info usuario expandido */}
        {sidebarOpen && user && (
          <div className="px-4 py-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pastel-primary flex items-center justify-center text-blue-800 font-bold text-xs flex-shrink-0">
              {user.nombre?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-700 truncate">{user.nombre}</p>
              <p className="text-[10px] text-gray-400 truncate">@{user.usuario}</p>
              <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
            </div>
          </div>
        )}

        {/* Avatar colapsado */}
        {!sidebarOpen && user && (
          <div className="flex justify-center py-2">
            <div
              className="w-7 h-7 rounded-full bg-pastel-primary flex items-center justify-center text-blue-800 font-bold text-xs"
              title={`${user.nombre} — ${badge.label}`}
            >
              {user.nombre?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
        )}

        {/* Cerrar Sesión */}
        <div className={`px-2 pb-1 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? 'Cerrar Sesión' : undefined}
            className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium
              text-red-500 hover:bg-pastel-accent hover:text-red-700 transition-colors duration-200
              ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>

        {/* Toggle colapsar */}
        <div className="p-3">
          <button
            onClick={toggleSidebar}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-sm
              ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            {sidebarOpen && <span>Colapsar</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
