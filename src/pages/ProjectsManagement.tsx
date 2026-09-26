import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  Calendar,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { projectService } from '../services/api.ts';
import { Project } from '../types/index.ts';
import { Modal } from '../components/Modal.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

interface ProjectsManagementProps {
  embedded?: boolean;
}

export const ProjectsManagement: React.FC<ProjectsManagementProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStatus, setFormStatus] = useState<any>('active');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAll();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormCode(`PRJ00${projects.length + 1}`);
    setFormName('');
    setFormLocation('');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('');
    setFormStatus('active');
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setFormCode(p.code);
    setFormName(p.name);
    setFormLocation(p.location || '');
    setFormStartDate(p.startDate || '');
    setFormEndDate(p.plannedEndDate || '');
    setFormStatus(p.status);
    setFormNotes(p.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      setSubmitting(true);
      if (editingProject) {
        await projectService.update(editingProject.id, {
          code: formCode,
          name: formName,
          location: formLocation || undefined,
          startDate: formStartDate || undefined,
          plannedEndDate: formEndDate || undefined,
          status: formStatus,
          notes: formNotes || undefined,
        });
      } else {
        await projectService.create({
          code: formCode,
          name: formName,
          location: formLocation || undefined,
          startDate: formStartDate || undefined,
          plannedEndDate: formEndDate || undefined,
          status: formStatus,
          notes: formNotes || undefined,
        });
      }
      setIsModalOpen(false);
      await loadProjects();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Có lỗi xảy ra khi lưu thông tin dự án.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dự án này? Thao tác sẽ bị từ chối nếu dự án đã có gói thầu.')) {
      return;
    }
    try {
      await projectService.delete(id);
      await loadProjects();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Không thể xóa dự án.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {embedded ? 'Danh sách Dự án' : 'Quản lý Danh mục Dự án'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Danh sách các công trình, dự án trọng điểm đang thi công
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm dự án mới</span>
          </button>
        )}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
          <span className="text-xs">Đang tải danh sách dự án...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
          Chưa có dự án nào trong hệ thống.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      proj.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : proj.status === 'delayed'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {proj.status === 'active'
                      ? 'Đang triển khai'
                      : proj.status === 'delayed'
                      ? 'Chậm tiến độ'
                      : 'Kế hoạch'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  {proj.name}
                </h3>

                {proj.location && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{proj.location}</span>
                  </div>
                )}

                {proj.notes && (
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {proj.notes}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  <span>
                    Số gói thầu: <strong className="text-slate-800">{proj.packageCount || 0}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Đang thi công: <strong className="text-emerald-700">{proj.activePackages || 0}</strong>
                  </span>
                  {proj.delayedPackages ? (
                    <>
                      <span>•</span>
                      <span className="text-red-600 font-semibold">
                        {proj.delayedPackages} gói chậm
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/projects/${proj.id}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg"
                >
                  <span>Mở chi tiết dự án</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditModal(proj);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(proj.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Cập nhật Dự án' : 'Thêm Dự án Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã dự án *</label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trạng thái *</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-medium"
              >
                <option value="active">Đang triển khai (Active)</option>
                <option value="delayed">Chậm tiến độ (Delayed)</option>
                <option value="planned">Kế hoạch (Planned)</option>
                <option value="completed">Đã hoàn thành (Completed)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên dự án *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ví dụ: Điện mặt trời Bản Chát 1,2"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-medium text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Địa điểm</label>
            <input
              type="text"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="Ví dụ: Lai Châu"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi chú</label>
            <textarea
              rows={3}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-amber-400 text-slate-900 font-bold rounded hover:bg-amber-300"
            >
              {submitting ? 'Đang lưu...' : 'Lưu dự án'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
