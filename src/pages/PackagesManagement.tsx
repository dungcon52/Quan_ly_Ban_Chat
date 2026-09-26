import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  User,
  Calendar,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { packageService, projectService, authService } from '../services/api.ts';
import { Package, Project, User as UserType } from '../types/index.ts';
import { Modal } from '../components/Modal.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

interface PackagesManagementProps {
  projectId?: number;
  embedded?: boolean;
}

export const PackagesManagement: React.FC<PackagesManagementProps> = ({
  projectId,
  embedded = false,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterProjectId = searchParams.get('projectId');

  const { isAdmin, isManager } = useAuth();

  const [packages, setPackages] = useState<Package[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projectId?.toString() || filterProjectId || ''
  );
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formProjectId, setFormProjectId] = useState<number | ''>('');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formUserId, setFormUserId] = useState<number | ''>('');
  const [formStatus, setFormStatus] = useState<any>('not_started');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pkgs, projs, uList] = await Promise.all([
        packageService.getAll(
          projectId || (selectedProjectId ? Number(selectedProjectId) : undefined)
        ),
        projectService.getAll(),
        authService.getUsers(),
      ]);
      setPackages(pkgs);
      setProjects(projs);
      setUsers(uList);
    } catch (err) {
      console.error('Failed to load packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId, projectId]);

  const openCreateModal = () => {
    setEditingPackage(null);
    setFormProjectId(projectId || (projects.length > 0 ? projects[0].id : ''));
    setFormCode(`PKG_${Date.now()}`);
    setFormName('');
    setFormUserId(users.length > 0 ? users[0].id : '');
    setFormStatus('not_started');
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormProjectId(pkg.projectId);
    setFormCode(pkg.code);
    setFormName(pkg.name);
    setFormUserId(pkg.responsibleUserId || '');
    setFormStatus(pkg.status);
    setFormNotes(pkg.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formProjectId) {
      setFormError('Vui lòng chọn Dự án trực thuộc.');
      return;
    }
    if (!formName.trim()) {
      setFormError('Vui lòng nhập tên gói thầu.');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        projectId: Number(formProjectId),
        code: formCode || `PKG_${Date.now()}`,
        name: formName.trim(),
        responsibleUserId: formUserId ? Number(formUserId) : null,
        status: formStatus,
        notes: formNotes || undefined,
      };

      if (editingPackage) {
        await packageService.update(editingPackage.id, payload);
      } else {
        await packageService.create(payload);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Có lỗi xảy ra khi lưu thông tin gói thầu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa gói thầu này? Thao tác sẽ bị từ chối nếu đã có báo cáo hoặc công tác.')) {
      return;
    }
    try {
      await packageService.delete(id);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Không thể xóa gói thầu.');
    }
  };

  // Helper hiển thị badge trạng thái gói thầu
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'on_track':
      case 'in_progress':
        return <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">Đúng tiến độ</span>;
      case 'at_risk':
        return <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-block">Nguy cơ chậm</span>;
      case 'delayed':
        return <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-red-50 text-red-700 border border-red-200 inline-block">Chậm tiến độ</span>;
      case 'paused':
        return <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-300 inline-block">Tạm dừng</span>;
      case 'completed':
        return <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-block">Hoàn thành</span>;
      case 'not_started':
      default:
        return <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200 inline-block">Chưa thi công</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Quản lý Danh mục Gói thầu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Danh sách các gói thầu thi công và chỉ huy trưởng phụ trách
          </p>
        </div>

        {(isAdmin || isManager) && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm gói thầu</span>
          </button>
        )}
      </div>

      {/* Filter by Project */}
      {!embedded && <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3 text-xs">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="font-semibold text-slate-600">Lọc theo Dự án:</span>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
        >
          <option value="">Tất cả các dự án</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>}

      {/* Packages List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
            <span className="text-xs">Đang tải danh sách gói thầu...</span>
          </div>
        ) : packages.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Không tìm thấy gói thầu nào.
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-2 sm:px-3 w-[26%]">Tên gói thầu thi công</th>
                  <th className="py-3 px-2 sm:px-3 w-[15%]">Người phụ trách</th>
                  {!embedded && <th className="py-3 px-2 sm:px-3 w-[16%]">Dự án</th>}
                  <th className="py-3 px-2 sm:px-3 w-[13%]">Ngày bắt đầu</th>
                  <th className="py-3 px-2 sm:px-3 w-[13%]">Ngày kết thúc</th>
                  <th className="py-3 px-2 sm:px-3 w-[15%]">Trạng thái</th>
                  <th className="py-3 px-2 sm:px-3 w-[17%] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-2 sm:px-3 align-top break-words">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                        {pkg.name}
                      </div>
                      {pkg.notes && (
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {pkg.notes}
                        </div>
                      )}
                    </td>

                    {/* Responsible User */}
                    <td className="py-3 px-2 sm:px-3 align-top break-words text-slate-700 font-medium">
                      {pkg.responsibleUser || 'Chưa gán'}
                    </td>

                    {!embedded && (
                      <td className="py-3 px-2 sm:px-3 align-top break-words text-slate-700 font-semibold">
                        {pkg.projectName}
                      </td>
                    )}

                    <td className="py-3 px-2 sm:px-3 align-top break-words text-slate-600">
                      {pkg.startDate || 'Chưa xác định'}
                    </td>
                    <td className="py-3 px-2 sm:px-3 align-top break-words text-slate-600">
                      {pkg.endDate || 'Chưa xác định'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-2 sm:px-3 align-top">
                      {renderStatusBadge(pkg.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-1 sm:px-2 text-right align-top whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/packages/${pkg.id}`)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors"
                        >
                          <span>Xem</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        {(isAdmin || isManager) && (
                          <button
                            onClick={() => openEditModal(pkg)}
                            className="inline-flex items-center gap-1 px-1.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-medium cursor-pointer"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Sửa</span>
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(pkg.id)}
                            className="inline-flex items-center gap-1 px-1.5 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg text-[10px] font-medium cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Xóa</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPackage ? 'Cập nhật Gói thầu' : 'Thêm Gói thầu Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dự án trực thuộc *</label>
            <select
              value={formProjectId}
              onChange={(e) => setFormProjectId(Number(e.target.value))}
              disabled={Boolean(projectId)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
              required
            >
              <option value="">-- Chọn dự án --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên gói thầu thi công *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ví dụ: Gói thầu Thi công Cầu chính & Đường dẫn"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Người phụ trách chính (CHT)</label>
              <select
                value={formUserId}
                onChange={(e) => setFormUserId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
              >
                <option value="">-- Chưa chỉ định --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.username})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trạng thái thi công</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
              >
                <option value="not_started">Chưa thi công</option>
                <option value="on_track">Đúng tiến độ</option>
                <option value="at_risk">Nguy cơ chậm</option>
                <option value="delayed">Chậm tiến độ</option>
                <option value="paused">Tạm dừng</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi chú gói thầu</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Quy mô gói thầu, vị trí địa lý, nhà thầu liên danh..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-amber-400 text-slate-900 font-bold rounded-lg hover:bg-amber-300 cursor-pointer shadow-xs"
            >
              {submitting ? 'Đang lưu...' : 'Lưu gói thầu'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};