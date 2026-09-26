import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Edit,
  Shield,
  UserCheck,
  HardHat,
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff,
  Phone,
  Briefcase,
  Mail,
} from 'lucide-react';
import { authService } from '../services/api.ts';
import { User, UserRole } from '../types/index.ts';
import { Modal } from '../components/Modal.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

export const UsersManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('site_entry');
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [showFormPassword, setShowFormPassword] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await authService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormFullName('');
    setFormPhone('');
    setFormEmail('');
    setFormPosition('');
    setFormDepartment('');
    setFormPassword('');
    setFormRole('site_entry');
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormFullName(u.fullName);
    setFormPhone(u.phone || '');
    setFormEmail(u.email || '');
    setFormPosition(u.position || '');
    setFormDepartment(u.department || '');
    setFormPassword('');
    setFormRole(u.role);
    setFormIsActive(u.isActive !== false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      setSubmitting(true);
      if (editingUser) {
        await (authService.updateUser as any)(editingUser.id, {
          username: formUsername,
          fullName: formFullName,
          phone: formPhone,
          email: formEmail,
          position: formPosition,
          department: formDepartment,
          role: formRole,
          password: formPassword || undefined,
          isActive: formIsActive,
        });
      } else {
        if (!formPassword) {
          setFormError('Vui lòng nhập mật khẩu cho tài khoản mới.');
          setSubmitting(false);
          return;
        }
        await (authService.createUser as any)({
          username: formUsername,
          fullName: formFullName,
          phone: formPhone,
          email: formEmail,
          position: formPosition,
          department: formDepartment,
          password: formPassword,
          role: formRole,
        });
      }
      setIsModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Có lỗi xảy ra khi lưu người dùng.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-600 text-sm">
        Trang này chỉ dành riêng cho tài khoản Quản trị viên (Admin). Vui lòng đăng nhập bằng tài khoản Quản trị viên.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Quản trị Nhân sự & Tài khoản Ban Chỉ Huy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Phân quyền tài khoản kỹ thuật, chỉ huy trưởng và các bộ phận hiện trường
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm người dùng mới</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
            <span className="text-xs">Đang tải danh sách nhân sự...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tài khoản</th>
                  <th className="py-3 px-4">Họ và tên / Chức danh</th>
                  <th className="py-3 px-4">Liên hệ & Bộ phận</th>
                  <th className="py-3 px-4">Vai trò hệ thống</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {u.username}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{u.fullName}</div>
                      {u.position && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3 text-slate-400" /> {u.position}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {u.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400" /> {u.phone}
                        </div>
                      )}
                      {u.email && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" /> {u.email}
                        </div>
                      )}
                      {u.department && (
                        <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                          Tổ/BP: {u.department}
                        </div>
                      )}
                      {!u.phone && !u.email && !u.department && (
                        <span className="text-slate-400 text-[11px]">Chưa cập nhật</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'admin'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : u.role === 'manager'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {u.role === 'admin' ? (
                          <Shield className="w-3 h-3 text-red-600" />
                        ) : u.role === 'manager' ? (
                          <UserCheck className="w-3 h-3 text-amber-600" />
                        ) : (
                          <HardHat className="w-3 h-3 text-emerald-600" />
                        )}
                        <span>
                          {u.role === 'admin'
                            ? 'Quản trị viên (Admin)'
                            : u.role === 'manager'
                            ? 'Chỉ huy trưởng (Manager)'
                            : 'Kỹ thuật hiện trường'}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Hoạt động
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Cập nhật Thông tin Nhân sự' : 'Tạo Tài khoản Kỹ thuật Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên đăng nhập (Username) *</label>
              <input
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="vd: kt_nam"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono font-medium focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Họ và tên kỹ sư *</label>
              <input
                type="text"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn Nam"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-medium focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số điện thoại liên hệ</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="vd: 0912345678"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="vd: nam.nv@congty.com"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chức vụ trong BCH</label>
              <input
                type="text"
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                placeholder="vd: Trung đội trưởng, Trắc đạc, QS..."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bộ phận / Hạng mục phụ trách</label>
              <input
                type="text"
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                placeholder="vd: Tổ Kết cấu, Hoàn thiện, MEP..."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phân quyền (Role) *</label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="site_entry">Kỹ thuật hiện trường (Site Entry - Nhập báo cáo, tiến độ)</option>
              <option value="manager">Chỉ huy trưởng (Manager - Quản lý, duyệt báo cáo, xử lý vướng mắc)</option>
              <option value="admin">Quản trị viên (Admin - Toàn quyền quản trị tài khoản)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {editingUser ? 'Đổi mật khẩu mới (bỏ trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo *'}
            </label>
            <div className="relative">
              <input
                type={showFormPassword ? 'text' : 'password'}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={editingUser ? 'Để trống nếu không đổi' : 'Nhập mật khẩu truy cập'}
                className="w-full pl-3 pr-10 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowFormPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                title={showFormPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-amber-400 text-slate-900 font-bold rounded hover:bg-amber-300 cursor-pointer"
            >
              {submitting ? 'Đang lưu...' : 'Lưu tài khoản'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};