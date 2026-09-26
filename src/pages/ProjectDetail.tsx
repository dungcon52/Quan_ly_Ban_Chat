import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  FolderGit2,
  AlertTriangle,
  Lightbulb,
  ClockAlert,
  ArrowLeft,
  ArrowRight,
  User,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Plus,
  Edit,
  Truck,
  Users,
} from 'lucide-react';
import { projectService } from '../services/api.ts';
import { Project, Package } from '../types/index.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { PackagesManagement } from './PackagesManagement.tsx';
import { Modal } from '../components/Modal.tsx';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [machineryStats, setMachineryStats] = useState({ total: 0, operating: 0, standby: 0, maintenance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState<Project['status']>('active');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadProjectDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getDashboard(Number(id));
      setProject(data.project);
      setPackages(data.packages || []);
      if (data.machineryStats) {
        setMachineryStats(data.machineryStats);
      }
    } catch (err: any) {
      console.error('Failed to load project detail:', err);
      setError('Không thể tải chi tiết dự án.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectDetail();
  }, [id]);

  const { calculatedStartDate, calculatedEndDate } = useMemo(() => {
    const validStartDates = (packages || [])
      .map((p: any) => p.startDate)
      .filter((d): d is string => Boolean(d && d !== 'Chưa xác định'))
      .sort();

    const validEndDates = (packages || [])
      .map((p: any) => p.endDate)
      .filter((d): d is string => Boolean(d && d !== 'Chưa xác định'))
      .sort();

    return {
      calculatedStartDate: validStartDates[0] || project?.startDate || 'Chưa xác định',
      calculatedEndDate: validEndDates[validEndDates.length - 1] || project?.plannedEndDate || 'Chưa xác định',
    };
  }, [packages, project]);

  const openEditModal = () => {
    if (!project) return;
    setFormCode(project.code);
    setFormName(project.name);
    setFormLocation(project.location || '');
    setFormStatus(project.status);
    setFormNotes(project.notes || '');
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;

    setFormError(null);
    try {
      setSubmitting(true);
      await projectService.update(Number(id), {
        code: formCode,
        name: formName,
        location: formLocation || undefined,
        status: formStatus,
        notes: formNotes || undefined,
      });
      setIsEditModalOpen(false);
      await loadProjectDetail();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Có lỗi xảy ra khi cập nhật dự án.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm font-medium">Đang tải thông tin dự án...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Tổng quan
        </button>
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error || 'Không tìm thấy dự án yêu cầu.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Tổng quan
        </button>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={openEditModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Chỉnh sửa dự án</span>
            </button>
          )}
          <button
            onClick={loadProjectDetail}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Project Meta Card */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-700 text-white rounded-md">
                {project.code}
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                  project.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : project.status === 'delayed'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {project.status === 'active'
                  ? 'Đang triển khai'
                  : project.status === 'delayed'
                  ? 'Chậm tiến độ'
                  : 'Kế hoạch'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
              {project.name}
            </h1>

            {project.location && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Địa điểm: <strong className="text-slate-800 font-medium">{project.location}</strong>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/80 shrink-0">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                Bắt đầu: <strong className="text-slate-800 font-semibold">{calculatedStartDate}</strong>
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                Dự kiến kết thúc: <strong className="text-slate-800 font-semibold">{calculatedEndDate}</strong>
              </span>
            </div>
          </div>
        </div>

        {project.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <strong>Ghi chú dự án:</strong> {project.notes}
          </div>
        )}
      </div>

      {/* Thẻ Thống kê Nhân sự & Máy móc */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Thẻ Công nhân */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Công nhân đang đi làm</div>
            <div className="text-2xl font-extrabold text-indigo-600 mt-0.5">{project.currentManpower || 0}</div>
          </div>
        </div>

        {/* Thẻ Máy móc thiết bị chuẩn dạng Tổng quan */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Máy móc thiết bị</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-cyan-600">
                  {machineryStats.operating}
                </span>
                <span className="text-sm font-bold text-slate-400">
                  / {machineryStats.total} máy công trường ({machineryStats.total > 0 ? Math.round((machineryStats.operating / machineryStats.total) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 font-medium">{machineryStats.operating} đang chạy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-slate-600 font-medium">{machineryStats.standby} chờ việc</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-slate-600 font-medium">{machineryStats.maintenance} đang hỏng</span>
            </div>
          </div>
        </div>
      </div>

      <PackagesManagement projectId={Number(id)} embedded />

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa dự án"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
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
                onChange={(event) => setFormCode(event.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trạng thái *</label>
              <select
                value={formStatus}
                onChange={(event) => setFormStatus(event.target.value as Project['status'])}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium cursor-pointer"
              >
                <option value="active">Đang triển khai</option>
                <option value="delayed">Chậm tiến độ</option>
                <option value="planned">Kế hoạch</option>
                <option value="completed">Đã hoàn thành</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên dự án *</label>
            <input
              type="text"
              value={formName}
              onChange={(event) => setFormName(event.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Địa điểm</label>
            <input
              type="text"
              value={formLocation}
              onChange={(event) => setFormLocation(event.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
            <span>
              Thời gian dự án được <strong>tự động đồng bộ</strong> theo ngày bắt đầu sớm nhất và kết thúc muộn nhất của các gói thầu con.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi chú</label>
            <textarea
              rows={3}
              value={formNotes}
              onChange={(event) => setFormNotes(event.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-amber-400 text-slate-900 font-bold rounded-lg hover:bg-amber-300 disabled:opacity-60 cursor-pointer shadow-2xs"
            >
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};