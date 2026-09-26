import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  ClockAlert,
  AlertTriangle,
  Truck,
  Users,
  HardHat,
  ChevronRight,
  Shield,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, role, isAdmin, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
    { to: '/machinery', label: 'Máy móc thiết bị', icon: Truck },
    { to: '/daily-reports', label: 'Báo cáo ngày', icon: ClipboardList },
    { to: '/issues', label: 'Vướng mắc & Đề xuất', icon: AlertTriangle },
  ];

  if (isAdmin) {
    navItems.push({ to: '/users', label: 'Người dùng', icon: Users });
  }

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'manager':
        return 'Chỉ huy trưởng';
      case 'site_entry':
      default:
        return 'Kỹ thuật hiện trường';
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          id="mobile-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-white text-slate-800 border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 bg-amber-50/70">
          <div className="w-9 h-9 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide uppercase text-slate-900">
              QUẢN LÝ THI CÔNG
            </h1>
            <p className="text-[11px] text-slate-500">Hệ thống điều hành</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Quản trị & Giám sát
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </NavLink>
          ))}
        </nav>

        {/* Logged in user footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                  role === 'admin'
                    ? 'bg-red-100 text-red-600'
                    : role === 'manager'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {role === 'admin' ? (
                  <Shield className="w-4 h-4" />
                ) : role === 'manager' ? (
                  <UserCheck className="w-4 h-4" />
                ) : (
                  <HardHat className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.fullName || 'Người dùng'}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {getRoleLabel()}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};