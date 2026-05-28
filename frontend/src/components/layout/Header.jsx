import { Bell, LogOut, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

export default function Header({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cierra el dropdown al hacer click fuera — sin overlay div
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada exitosamente');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-gray-100 shadow-soft">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 transition-colors hover:bg-gray-100 rounded-xl">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pastel-accent border-2 border-white rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pastel-primary">
              <span className="text-xs font-bold text-blue-800">{getInitials(user?.name)}</span>
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {/* Dropdown — sin overlay div, click-outside via useEffect */}
          {dropdownOpen && (
            <div className="absolute right-0 z-50 w-48 py-1 mt-2 bg-white border border-gray-100 top-full rounded-xl shadow-card">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
