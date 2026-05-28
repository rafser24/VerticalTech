import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Truck, Users, TrendingUp,
  UserCircle, ChevronLeft, ChevronRight, Boxes, BarChart2,
  Shield, Ticket, ShoppingBag, LogOut, Store, Settings,
} from 'lucide-react';
import { useApp }  from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const navGroups = [
  {
    label: null,
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
      { to: '/usuarios',      label: 'Usuarios',      icon: UserCircle, roles: ['super-admin', 'admin'] },
      { to: '/auditoria',     label: 'Auditoría',     icon: Shield,     roles: ['super-admin'] },
      { to: '/configuracion', label: 'Configuración', icon: Settings,   roles: ['super-admin'] },
    ],
  },
];

const rolBadge = {
  'super-admin': { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Super Admin' },
  'admin':       { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin'       },
  'vendedor':    { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Vendedor'    },
};

function Avatar({ foto, nombre, size = 'sm' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs';
  const letra = nombre?.charAt(0)?.toUpperCase() || '?';
  if (foto) {
    return (
      <img src={foto} alt={nombre} className={`${dim} rounded-full object-cover flex-shrink-0 border border-gray-200`} />
    );
  }
  return (
    <div className={`${dim} flex items-center justify-center font-bold text-blue-800 rounded-full bg-pastel-primary flex-shrink-0`}>
      {letra}
    </div>
  );
}

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, empresa } = useApp();
  const { user, hasRole, logout }               = useAuth();
  const navigate      = useNavigate();

  const rolActual = user?.rol ?? '';
  const badge = rolBadge[rolActual] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: rolActual };

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <aside className={`h-screen sticky top-0 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 shadow-soft ${sidebarOpen ? 'w-60' : 'w-16'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 h-16 border-b border-gray-100 flex-shrink-0 ${sidebarOpen ? 'px-4' : 'justify-center px-2'}`}>
        {sidebarOpen ? (
          /* Sidebar expandido: logo vertical centrado */
          <div className="flex items-center justify-center flex-1">
            <img
              src={empresa?.logo_url || '/logovertical.png'}
              alt={empresa?.nombre || 'Logo'}
              className="h-25 max-w-[190px] object-contain"
            />
          </div>
        ) : (
          /* Sidebar colapsado: ícono cuadrado */
          <div className="w-8 h-8 bg-pastel-primary rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img
              src={empresa?.logo_url || '/logovertical.png'}
              alt={empresa?.nombre || 'Logo'}
              className="object-contain w-full h-full p-0.5"
            />
          </div>
        )}
      </div>

      {/* Navegación agrupada */}
      <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin">
        {navGroups.map((group, gi) => {
          const itemsVisibles = group.items.filter(item => item.roles.some(r => hasRole(r)));
          if (itemsVisibles.length === 0) return null;
          return (
            <div key={gi} className="mb-1">
              {group.label && sidebarOpen && (
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 select-none">
                  {group.label}
                </p>
              )}
              {group.label && !sidebarOpen && gi > 0 && <div className="mx-3 my-2 border-t border-gray-100" />}
              {itemsVisibles.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to + label} to={to} title={!sidebarOpen ? label : undefined}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {sidebarOpen && <span>{label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 flex-shrink-0">
        {sidebarOpen && user && (
          <div className="px-4 py-3 flex items-center gap-2">
            <Avatar foto={user.foto_url} nombre={user.nombre} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-700 truncate">{user.nombre}</p>
              <p className="text-[10px] text-gray-400 truncate">@{user.usuario}</p>
              <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold ${badge.bg} ${badge.text}`}>{badge.label}</span>
            </div>
          </div>
        )}
        {!sidebarOpen && user && (
          <div className="flex justify-center py-2">
            <Avatar foto={user.foto_url} nombre={user.nombre} size="sm" />
          </div>
        )}
        <div className={`px-2 pb-1 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
          <button onClick={handleLogout} title={!sidebarOpen ? 'Cerrar Sesión' : undefined}
            className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-pastel-accent hover:text-red-700 transition-colors duration-200 ${!sidebarOpen ? 'justify-center' : ''}`}>
            <LogOut size={16} className="flex-shrink-0" />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
        <div className="p-3">
          <button onClick={toggleSidebar}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-sm ${!sidebarOpen ? 'justify-center' : ''}`}>
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            {sidebarOpen && <span>Colapsar</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
