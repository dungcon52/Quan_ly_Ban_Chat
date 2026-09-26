import React, { useState } from 'react';
import {
  HardHat,
  Shield,
  UserCheck,
  Lock,
  User as UserIcon,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(username.trim(), password);
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(
        err.response?.data?.error ||
          'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản và mật khẩu.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
    setCopiedAccount(user);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const accounts = [
    {
      role: 'Quản trị viên (Admin)',
      username: 'admin',
      password: '123456',
      desc: 'Toàn quyền quản trị hệ thống, danh mục dự án, gói thầu và phân quyền người dùng',
      icon: Shield,
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
      iconColor: 'text-red-400',
    },
    {
      role: 'Chỉ huy trưởng / Quản lý (Manager)',
      username: 'cht_an',
      password: '123456',
      desc: 'Giám sát điều hành công trường, theo dõi tiến độ các gói thầu, duyệt vướng mắc & kiến nghị',
      icon: UserCheck,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      iconColor: 'text-amber-400',
    },
    {
      role: 'Kỹ thuật hiện trường (Site Entry)',
      username: 'kt_bao',
      password: '123456',
      desc: 'Lập phiếu báo cáo ngày ca sáng (08:00) & ca tối (20:00), cập nhật nhân công & sản lượng',
      icon: HardHat,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 mb-2">
            <HardHat className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          HỆ THỐNG QUẢN LÝ THI CÔNG
          </h1>
          <p className="text-xs text-slate-400">
            Hệ thống điều hành thi công, kiểm soát báo cáo ca ngày và tiến độ công trình
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-white">Đăng nhập tài khoản</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Nhập tên tài khoản và mật khẩu đã được cấp để truy cập hệ thống
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-950/60 border border-red-700/80 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tên đăng nhập
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập (vd: admin, cht_an, kt_bao)"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password field with show/hide password toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium transition-colors"
                  required
                />
                <button
                  type="button"
                  id="btn-toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              id="btn-submit-login"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        <p className="text-center text-[11px] text-slate-500">
          Hệ thống Quản lý thông tin dự án © 2026. Bản quyền thuộc về Mr.Trần Trung Dũng
        </p>
      </div>
    </div>
  );
};
