import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Truck, Users, ShoppingCart,
  TrendingUp, UserCircle, ChevronLeft, ChevronRight, Boxes, BarChart2,
} from 'lucide-react';
import useAppStore  from '../../store/appStore';
import useAuthStore from '../../store/authStore';

/**
 * Menú por rol:
 *
 * super-admin → todo
 * admin       → todo excepto gestión de roles/permisos avanzada
 * vendedor    → dashboard, productos (consulta), clientes, ventas
 */
const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['super-admin', 'admin', 'vendedor'],
  },
  {
    to: '/productos',
    label: 'Productos',
    icon: Package,
    roles: ['super-admin', 'admin', 'vendedor'],
  },
  {
    to: '/categorias',
    label: 'Categorías',
    icon: Tag,
    roles: ['super-admin', 'admin'],
  },
  {
    to: '/proveedores',
    label: 'Proveedores',
    icon: Truck,
    roles: ['super-admin', 'admin'],
  },
  {
    to: '/clientes',
    label: 'Clientes',
    icon: Users,
    roles: ['super-admin', 'admin', 'vendedor'],
  },
  {
    to: '/compras',
    label: 'Compras',
    icon: ShoppingCart,
    roles: ['super-admin', 'admin'],
  },
  {
    to: '/ventas',
    label: 'Ventas',
    icon: TrendingUp,
    roles: ['super-admin', 'admin', 'vendedor'],
  },
  {
    to: '/usuarios',
    label: 'Usuarios',
    icon: UserCircle,
    roles: ['super-admin', 'admin'],
  },
  {
    to: '/reportes',
    label: 'Reportes',
    icon: BarChart2,
    roles: ['super-admin', 'admin'],
  },
];

// Colores del badge de rol
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

  // Filtrar menú según roles del usuario
  const rolActual = user?.rol ?? '';
  const menuVisible = navItems.filter(item =>
    item.roles.some(r => hasRole(r))
  );

  const badge = rolBadge[rolActual] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: rolActual };

  return (
    <aside
      className={`h-screen sticky top-0 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 shadow-soft
        ${sidebarOpen ? 'w-60' : 'w-16'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100">
        <div className="w-8 h-8 bg-pastel-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <Boxes size={18} className="text-blue-800" />
        </div>
        {sidebarOpen && (
          <span className="font-display font-bold text-gray-800 text-lg leading-tight">
            VerticalTech
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {menuVisible.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center' : ''}`
            }
            title={!sidebarOpen ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Info usuario */}
      <div className="border-t border-gray-100">
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
            <div className="w-7 h-7 rounded-full bg-pastel-primary flex items-center justify-center text-blue-800 font-bold text-xs"
              title={`${user.nombre} — ${badge.label}`}>
              {user.nombre?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
        )}

        {/* Toggle */}
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
