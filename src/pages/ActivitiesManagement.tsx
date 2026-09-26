import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Hammer,
  Plus,
  Edit,
  Trash2,
  Filter,
  RefreshCw,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { activityService, packageService } from '../services/api.ts';
import { Activity, Package } from '../types/index.ts';
import { Modal } from '../components/Modal.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

interface ActivitiesManagementProps {
  packageId?: number;
  embedded?: boolean;
  onDataChange?: () => void;
}

export const ActivitiesManagement: React.FC<ActivitiesManagementProps> = ({
  packageId,
  embedded = false,
  onDataChange,
}) => {
  const [searchParams] = useSearchParams();
  const filterPackageId = searchParams.get('packageId');

  const { isAdmin, isManager } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    packageId?.toString() || filterPackageId || ''
  );
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formPackageId, setFormPackageId] = useState<number | ''>('');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formPlannedQty, setFormPlannedQty] = useState<number | ''>('');
  const [formProgress, setFormProgress] = useState<number | ''>('');
  const [formCumulative, setFormCumulative] = useState<number | ''>('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState<string>('in_progress');
  const [formIsCritical, setFormIsCritical] = useState<boolean>(false);
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [acts, pkgs] = await Promise.all([
        activityService.getAll(
          packageId || (selectedPackageId ? Number(selectedPackageId) : undefined)
        ),
        packageService.getAll(),
      ]);
      setActivities(acts);
      setPackages(pkgs);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPackageId, packageId]);

  const handleCumulativeChange = (valStr: string) => {
    if (valStr === '') {
      setFormCumulative('');
      return;
    }
    const val = Number(valStr);
    setFormCumulative(val);

    const planned = Number(formPlannedQty);
    if (!isNaN(val) && planned > 0) {
      const calcPercent = Math.max(0, Math.min(100, Math.round((val / planned) * 100)));
      setFormProgress(calcPercent);
      if (calcPercent >= 100) {
        setFormStatus('completed');
      } else if (formStatus === 'completed') {
        setFormStatus('in_progress');
      }
    }
  };

  const handleProgressChange = (valStr: string) => {
    if (valStr === '') {
      setFormProgress('');
      return;
    }
    const val = Number(valStr);
    setFormProgress(val);

    const planned = Number(formPlannedQty);
    if (!isNaN(val) && planned > 0) {
      const calcVolume = Math.round((val / 100) * planned * 100) / 100;
      setFormCumulative(calcVolume);
    }

    if (val >= 100) {
      setFormStatus('completed');
    } else if (formStatus === 'completed') {
      setFormStatus('in_progress');
    }
  };

  const handlePlannedQtyChange = (valStr: string) => {
    if (valStr === '') {
      setFormPlannedQty('');
      return;
    }
    const val = Number(valStr);
    setFormPlannedQty(val);

    const actual = Number(formCumulative);
    if (val > 0 && formCumulative !== '' && !isNaN(actual)) {
      const calcPercent = Math.max(0, Math.min(100, Math.round((actual / val) * 100)));
      setFormProgress(calcPercent);
    }
  };

  const openCreateModal = () => {
    setEditingActivity(null);
    setFormPackageId(packageId || (selectedPackageId ? Number(selectedPackageId) : packages[0]?.id || ''));
    setFormCode(`ACT_${Date.now()}`);
    setFormName('');
    setFormUnit('m3');
    setFormPlannedQty('');
    setFormProgress('');
    setFormCumulative('');
    setFormStartDate(new Intl.DateTimeFormat('en-CA').format(new Date()));
    setFormEndDate('');
    setFormLocation('');
    setFormStatus('in_progress');
    setFormIsCritical(false);
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (act: Activity) => {
    setEditingActivity(act);
    setFormPackageId(act.packageId);
    setFormCode(act.code);
    setFormName(act.name);
    setFormUnit(act.unit || '');
    setFormPlannedQty(act.plannedQuantity ?? '');

    const planned = Number(act.plannedQuantity) || 0;
    const currentActual = act.actualVolume ?? (act as any).actualCumulative;
    setFormCumulative(currentActual !== null && currentActual !== undefined ? Number(currentActual) : '');

    if (planned > 0 && currentActual !== null && currentActual !== undefined) {
      const calculatedPercent = Math.max(0, Math.min(100, Math.round((Number(currentActual) / planned) * 100)));
      setFormProgress(calculatedPercent);
    } else {
      setFormProgress(act.progressPercent ?? act.completionPercent ?? '');
    }

    setFormStartDate(act.startDate || '');
    setFormEndDate(act.endDate || '');
    setFormLocation(act.location || '');
    setFormStatus(act.status || 'in_progress');
    setFormIsCritical(Boolean((act as any).isCritical));
    setFormNotes(act.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formPackageId) {
      setFormError('Vui lòng chọn Gói thầu trực thuộc.');
      return;
    }
    if (!formName.trim()) {
      setFormError('Vui lòng nhập tên công tác.');
      return;
    }

    try {
      setSubmitting(true);
      const planned = formPlannedQty !== '' ? Number(formPlannedQty) : null;
      const actual = formCumulative !== '' ? Number(formCumulative) : null;
      let percent = formProgress !== '' ? Number(formProgress) : null;

      if (planned && planned > 0 && actual !== null) {
        percent = Math.max(0, Math.min(100, Math.round((actual / planned) * 100)));
      }

      let status = formStatus;
      if (percent !== null && percent >= 100) {
        status = 'completed';
      }

      const payload = {
        packageId: Number(formPackageId),
        code: formCode || `ACT_${Date.now()}`,
        name: formName.trim(),
        unit: formUnit.trim() || undefined,
        plannedQuantity: planned ?? undefined,
        actualVolume: actual ?? undefined,
        progressPercent: percent ?? undefined,
        startDate: formStartDate || undefined,
        endDate: formEndDate || undefined,
        location: formLocation.trim() || undefined,
        status: status as any,
        isCritical: formIsCritical,
        notes: formNotes.trim() || undefined,
      };

      if (editingActivity) {
        await activityService.update(editingActivity.id, payload);
      } else {
        await activityService.create(payload);
      }

      setIsModalOpen(false);
      await loadData();
      onDataChange?.();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Có lỗi xảy ra khi lưu công tác.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa công tác này?')) return;
    try {
      await activityService.delete(id);
      await loadData();
      onDataChange?.();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Không thể xóa công tác.');
    }
  };

  // 👉 HÀM RENDER HUY HIỆU TRẠNG THÁI CHUẨN 6 MỐC NGHIỆP VỤ
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">Hoàn thành</span>;
      case 'delayed':
        return <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-red-50 text-red-700 border border-red-200 inline-block">Chậm tiến độ</span>;
      case 'at_risk':
        return <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-block">Nguy cơ chậm</span>;
      case 'paused':
        return <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-300 inline-block">Tạm dừng</span>;
      case 'not_started':
        return <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200 inline-block">Chưa thi công</span>;
      case 'in_progress':
      default:
        return <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-block">Đúng tiến độ</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Quản lý Danh mục Công tác Thi công
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Định nghĩa khối lượng kế hoạch, đơn vị tính và theo dõi tiến độ lũy kế từng công tác
          </p>
        </div>

        {(isAdmin || isManager) && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm công tác mới</span>
          </button>
        )}
      </div>

      {/* Filter by Package */}
      {!embedded && (
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600">Lọc theo Gói thầu:</span>
          <select
            value={selectedPackageId}
            onChange={(e) => setSelectedPackageId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 cursor-pointer"
          >
            <option value="">Tất cả các gói thầu</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Activities Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
            <span className="text-xs">Đang tải danh sách công tác...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Không tìm thấy công tác nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-2 sm:px-3 w-[18%]">Tên công tác thi công</th>
                  {!embedded && <th className="py-3 px-2 sm:px-3 w-[13%]">Gói thầu</th>}
                  <th className="py-3 px-2 sm:px-3 w-[10%]">Vị trí</th>
                  <th className="py-3 px-2 sm:px-3 w-[10%]">Ngày bắt đầu</th>
                  <th className="py-3 px-2 sm:px-3 w-[10%]">Ngày kết thúc</th>
                  <th className="py-3 px-2 sm:px-3 w-[10%]">Kế hoạch</th>
                  <th className="py-3 px-2 sm:px-3 w-[10%]">Lũy kế thực tế</th>
                  <th className="py-3 px-2 sm:px-3 w-[11%]">% Hoàn thành</th>
                  <th className="py-3 px-2 sm:px-3 w-[10%]">Trạng thái</th>
                  {(isAdmin || isManager) && (
                    <th className="py-3 px-2 sm:px-3 w-[14%] text-right">Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((act) => {
                  const planned = Number(act.plannedQuantity) || 0;
                  const actual = act.actualVolume !== null && act.actualVolume !== undefined 
                    ? Number(act.actualVolume) 
                    : ((act as any).actualCumulative !== null && (act as any).actualCumulative !== undefined ? Number((act as any).actualCumulative) : null);

                  const displayPercent = planned > 0 && actual !== null 
                    ? Math.max(0, Math.min(100, Math.round((actual / planned) * 100))) 
                    : (act.progressPercent ?? act.completionPercent ?? 0);

                  const displayActual = actual;
                  const isCritical = Boolean((act as any).isCritical);

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-2 sm:px-3 align-top break-words">
                        <div className="flex items-start gap-1.5">
                          {isCritical && (
                            <span className="shrink-0 mt-0.5 px-1 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded text-[9px] font-bold tracking-tighter">
                              TRỌNG YẾU
                            </span>
                          )}
                          <div className="font-bold text-slate-900 text-sm leading-snug">
                            {act.name}
                          </div>
                        </div>
                        {act.notes && (
                          <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                            {act.notes}
                          </div>
                        )}
                      </td>

                      {!embedded && (
                        <td className="py-3 px-2 sm:px-3 align-top break-words font-semibold text-slate-800">
                          {act.packageName || 'Gói thầu'}
                        </td>
                      )}

                      <td className="py-3 px-2 sm:px-3 align-top break-words text-slate-600">
                        {act.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{act.location}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-2 sm:px-3 align-top break-words text-slate-600">
                        {act.startDate || <span className="text-slate-400">Chưa xác định</span>}
                      </td>
                      <td className="py-3 px-2 sm:px-3 align-top break-words text-slate-600">
                        {act.endDate || <span className="text-slate-400">Chưa xác định</span>}
                      </td>

                      <td className="py-3 px-2 sm:px-3 align-top break-words font-medium text-slate-700">
                        {act.plannedQuantity !== null && act.plannedQuantity !== undefined ? (
                          <span>{act.plannedQuantity} {act.unit}</span>
                        ) : (
                          <span className="text-slate-400 italic">Theo %</span>
                        )}
                      </td>

                      <td className="py-3 px-2 sm:px-3 align-top break-words font-bold text-slate-900">
                        {displayActual !== null && displayActual !== undefined ? (
                          <span className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200 font-mono">
                            {displayActual} {act.unit}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-2 sm:px-3 align-top">
                        <div className="flex items-center gap-2">
                          <div className="w-full max-w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                displayPercent >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, displayPercent)}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800">{displayPercent}%</span>
                        </div>
                      </td>

                      <td className="py-3 px-2 sm:px-3 align-top">
                        {renderStatusBadge(act.status)}
                      </td>

                      {(isAdmin || isManager) && (
                        <td className="py-3 px-2 sm:px-3 text-right align-top">
                          <div className="flex flex-wrap justify-end items-center gap-1">
                            <button
                              onClick={() => openEditModal(act)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-medium cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(act.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-md text-xs font-medium cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa</span>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Create / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingActivity ? 'Cập nhật Công tác' : 'Thêm Công tác Mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Gói thầu trực thuộc *</label>
            <select
              value={formPackageId}
              onChange={(e) => setFormPackageId(Number(e.target.value))}
              disabled={Boolean(packageId)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
              required
            >
              <option value="">-- Chọn gói thầu --</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên công tác thi công *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ví dụ: Đào hố móng trụ, Đổ bê tông bản mặt cầu, v.v."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="p-3 bg-red-50/50 border border-red-200 rounded-lg flex items-start gap-2.5">
            <input
              type="checkbox"
              id="isCriticalCheckbox"
              checked={formIsCritical}
              onChange={(e) => setFormIsCritical(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500 cursor-pointer"
            />
            <label htmlFor="isCriticalCheckbox" className="cursor-pointer select-none">
              <span className="font-bold text-red-900 block">Đánh dấu là công tác trọng yếu / đường găng</span>
              <span className="text-[11px] text-red-700">Nếu công tác này chậm hoặc có nguy cơ chậm, gói thầu sẽ tự động chuyển sang trạng thái cảnh báo tương ứng.</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trạng thái công tác</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium cursor-pointer"
              >
                <option value="in_progress">Đúng tiến độ</option>
                <option value="at_risk">Nguy cơ chậm</option>
                <option value="delayed">Chậm tiến độ</option>
                <option value="paused">Tạm dừng</option>
                <option value="not_started">Chưa thi công</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vị trí thi công mặc định</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="Ví dụ: Tuyến VT01 - VT20"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày kết thúc</label>
              <input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tiến độ (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formProgress}
                onChange={(e) => handleProgressChange(e.target.value)}
                placeholder="0 - 100%"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-blue-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lũy kế thực tế {formUnit ? `(${formUnit})` : ''}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formCumulative}
                onChange={(e) => handleCumulativeChange(e.target.value)}
                placeholder="Ví dụ: 996"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-amber-700 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Đơn vị tính</label>
              <input
                type="text"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                placeholder="m3, tấn, m..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Khối lượng kế hoạch</label>
              <input
                type="number"
                step="any"
                min="0"
                value={formPlannedQty}
                onChange={(e) => handlePlannedQtyChange(e.target.value)}
                placeholder="Ví dụ: 1500"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi chú công tác</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Yêu cầu kỹ thuật..."
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
              className="px-4 py-2 bg-amber-400 text-slate-900 font-bold rounded-lg hover:bg-amber-300 cursor-pointer shadow-2xs"
            >
              {submitting ? 'Đang lưu...' : 'Lưu công tác'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};