import React from 'react';
import { Menu, Plus, UserCheck, Shield, HardHat, LogOut, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { currentUser, role, logout } = useAuth();
  const navigate = useNavigate();

  const todayStr = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <Shield className="w-3.5 h-3.5 text-red-600" />
            <span>Quản trị viên (Admin)</span>
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Chỉ huy trưởng / Quản lý</span>
          </span>
        );
      case 'site_entry':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <HardHat className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kỹ thuật hiện trường</span>
          </span>
        );
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger & Date indicator */}
      <div className="flex items-center gap-3">
        <button
          id="btn-sidebar-toggle"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
          title="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <div className="text-xs font-semibold text-slate-800 capitalize">{todayStr}</div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Cập nhật từ báo cáo hiện trường</span>
          </div>
        </div>
      </div>

      {/* Right: Role indicator + Primary Action + User Profile & Logout */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Role Badge (Purely informational based on logged-in user) */}
        <div className="hidden md:flex items-center">
          {getRoleBadge()}
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 text-xs">
          <div className="hidden sm:block text-right">
            <div className="font-bold text-slate-900 truncate max-w-[150px]">
              {currentUser?.fullName || 'Người dùng'}
            </div>
            <div className="text-[11px] text-slate-500">
              @{currentUser?.username || 'user'}
            </div>
          </div>

          <button
            id="btn-logout"
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 rounded-lg hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
};
