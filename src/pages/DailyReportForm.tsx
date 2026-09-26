import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Building2,
  FolderGit2,
  Truck,
  Lock,
} from 'lucide-react';
import { projectService, packageService, activityService, reportService, machineryService } from '../services/api.ts';
import { Package, Activity, Machinery } from '../types/index.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

interface ReportItemInput {
  activityId: number;
  activityCode: string;
  activityName: string;
  unit?: string | null;
  plannedQuantity?: number | null;
  currentCumulative: number;
  isQuantityBased: boolean;
  location: string;
  quantity?: number | '';
  progressPercent?: number | '';
  notes: string;
}

interface ReportMachineryInput {
  machineryId: number;
  code: string;
  name: string;
  type: string;
  licensePlate?: string | null;
  driverName?: string | null;
  operatingHours: number | '';
  fuelLiters: number | '';
  status: 'operating' | 'standby' | 'broken';
  notes: string;
}

export const DailyReportForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPackageId = searchParams.get('packageId');
  const preselectedReportType = searchParams.get('reportType') as 'morning' | 'evening' | null;
  const preselectedDate = searchParams.get('reportDate');

  const isLockedContext = Boolean(preselectedPackageId && preselectedDate && preselectedReportType);

  const { currentUser } = useAuth();

  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | ''>(
    preselectedPackageId ? Number(preselectedPackageId) : ''
  );
  const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);

  // Form states
  const [reportDate, setReportDate] = useState<string>(
    preselectedDate || new Intl.DateTimeFormat('en-CA').format(new Date())
  );
  const [reportType, setReportType] = useState<'morning' | 'evening'>(
    preselectedReportType || 'morning'
  );
  const [manpower, setManpower] = useState<number | ''>(25);
  const [notes, setNotes] = useState<string>('');
  const [difficulties, setDifficulties] = useState<string>('');
  const [proposals, setProposals] = useState<string>('');

  const [items, setItems] = useState<ReportItemInput[]>([]);

  // Machinery state
  const [packageMachinery, setPackageMachinery] = useState<any[]>([]);
  const [selectedMachinery, setSelectedMachinery] = useState<ReportMachineryInput[]>([]);
  const [machineryLoading, setMachineryLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Load packages list
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const data = await packageService.getAll();
        setPackages(data);
        if (!selectedPackageId && data.length > 0) {
          setSelectedPackageId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching packages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  // When selected package changes, load activities for that package
  useEffect(() => {
    if (!selectedPackageId) {
      setAvailableActivities([]);
      setItems([]);
      return;
    }

    const fetchActivities = async () => {
      try {
        const data = await activityService.getAll(Number(selectedPackageId));
        setAvailableActivities(data);

        const initialItems: ReportItemInput[] = data
          .filter((act) => act.status === 'in_progress' || act.status === 'not_started')
          .slice(0, 3)
          .map((act) => ({
            activityId: act.id,
            activityCode: act.code,
            activityName: act.name,
            unit: act.unit,
            plannedQuantity: act.plannedQuantity,
            currentCumulative: act.actualCumulative || 0,
            isQuantityBased: !!(act.plannedQuantity && act.plannedQuantity > 0),
            location: act.location || '',
            quantity: '',
            progressPercent: act.completionPercent || '',
            notes: '',
          }));

        setItems(initialItems);
      } catch (err) {
        console.error('Error fetching activities:', err);
      }
    };

    fetchActivities();
  }, [selectedPackageId]);

  // Handle adding an activity to items
  const handleAddActivity = (actId: number) => {
    const act = availableActivities.find((a) => a.id === actId);
    if (!act) return;

    if (items.some((i) => i.activityId === actId)) {
      alert('Công tác này đã có trong danh sách báo cáo bên dưới.');
      return;
    }

    const isQty = !!(act.plannedQuantity && act.plannedQuantity > 0);

    setItems((prev) => [
      ...prev,
      {
        activityId: act.id,
        activityCode: act.code,
        activityName: act.name,
        unit: act.unit,
        plannedQuantity: act.plannedQuantity,
        currentCumulative: act.actualCumulative || 0,
        isQuantityBased: isQty,
        location: act.location || '',
        quantity: '',
        progressPercent: act.completionPercent || '',
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ReportItemInput, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Fetch available machinery for this project on the selected report date
  useEffect(() => {
    if (!selectedPackageId) {
      setPackageMachinery([]);
      setSelectedMachinery([]);
      return;
    }

    const fetchMachinery = async () => {
      try {
        setMachineryLoading(true);
        const list = await machineryService.getAvailableForPackage(Number(selectedPackageId), reportDate);
        setPackageMachinery(list);
        setSelectedMachinery([]);
      } catch (err) {
        console.error('Error fetching available machinery:', err);
      } finally {
        setMachineryLoading(false);
      }
    };

    fetchMachinery();
  }, [selectedPackageId, reportDate]);

  // Thêm máy vào danh sách làm việc trong ca
  const handleAddMachine = (machId: number) => {
    const mach = packageMachinery.find((m) => m.id === machId);
    if (!mach) return;

    if (mach.hasConflict) {
      alert(`Máy ${mach.name} (${mach.code}) đã được báo cáo làm việc ở gói thầu khác hôm nay.`);
      return;
    }

    if (selectedMachinery.some((m) => m.machineryId === machId)) {
      alert('Thiết bị này đã được thêm vào ca làm việc.');
      return;
    }

    setSelectedMachinery((prev) => [
      ...prev,
      {
        machineryId: mach.id,
        code: mach.code,
        name: mach.name,
        type: mach.type,
        licensePlate: mach.licensePlate,
        driverName: mach.driverName,
        operatingHours: 8,
        fuelLiters: '',
        status: 'operating',
        notes: '',
      },
    ]);
  };

  const handleRemoveMachine = (machineryId: number) => {
    setSelectedMachinery((prev) => prev.filter((m) => m.machineryId !== machineryId));
  };

  const handleMachineFieldChange = (machineryId: number, field: keyof ReportMachineryInput, value: any) => {
    setSelectedMachinery((prev) =>
      prev.map((m) => (m.machineryId === machineryId ? { ...m, [field]: value } : m))
    );
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPackageId) {
      setError('Vui lòng chọn gói thầu.');
      return;
    }

    if (items.length === 0) {
      setError('Báo cáo phải ghi nhận ít nhất 1 hạng mục công tác thi công.');
      return;
    }

    const formattedItems = items.map((i) => ({
      activityId: i.activityId,
      location: i.location,
      quantity: i.isQuantityBased ? (i.quantity !== '' ? Number(i.quantity) : 0) : null,
      progressPercent: !i.isQuantityBased ? (i.progressPercent !== '' ? Number(i.progressPercent) : 0) : null,
      notes: i.notes || null,
    }));

    const formattedMachinery = selectedMachinery.map((m) => ({
      machineryId: m.machineryId,
      operatingHours: m.operatingHours !== '' ? Number(m.operatingHours) : 8,
      fuelLiters: m.fuelLiters !== '' ? Number(m.fuelLiters) : null,
      status: m.status,
      notes: m.notes || null,
    }));

    try {
      setSubmitting(true);
      await reportService.create({
        packageId: Number(selectedPackageId),
        reportDate,
        reportType,
        manpower: manpower !== '' ? Number(manpower) : 0,
        notes: notes || null,
        difficulties: difficulties.trim() || null,
        proposals: proposals.trim() || null,
        items: formattedItems,
        machinery: formattedMachinery,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(`/packages/${selectedPackageId}`);
      }, 1200);
    } catch (err: any) {
      console.error('Submit report error:', err);
      const msg = err.response?.data?.error || 'Có lỗi xảy ra khi lưu phiếu báo cáo.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Lọc ra các máy còn khả dụng để hiện trong dropdown chọn nhanh
  const selectableMachines = packageMachinery.filter(
    (m) => !selectedMachinery.some((s) => s.machineryId === m.id)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <span className="text-xs text-slate-400">Phiếu báo cáo nhật trình hiện trường</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Form Title Banner */}
        <div className="p-6 border-b border-amber-200 bg-amber-50 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Lập Báo cáo Thi công Công trường</h1>
            <p className="text-xs text-slate-600 mt-1">
              Ghi nhận tiến độ công tác, nhân lực và vướng mắc ca thi công
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-500">Người lập phiếu:</div>
            <div className="text-sm font-semibold text-amber-700">
              {currentUser?.fullName || 'Kỹ thuật hiện trường'}
            </div>
          </div>
        </div>

        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <strong className="font-semibold block">Thông báo lỗi:</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="m-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Đã gửi báo cáo ngày thành công! Đang chuyển tiếp về Dashboard gói thầu...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: General Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Thông tin ca báo cáo
              </h3>
              {isLockedContext && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[11px]">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Đang lập theo lịch trình chỉ định
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Package selector */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Gói thầu thi công <span className="text-red-500">*</span></span>
                  {preselectedPackageId && <Lock className="w-3 h-3 text-slate-400" />}
                </label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value ? Number(e.target.value) : '')}
                  disabled={Boolean(preselectedPackageId)}
                  className={`w-full px-3 py-2 text-xs border rounded-lg font-medium transition-colors ${
                    preselectedPackageId
                      ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed select-none'
                      : 'bg-white border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer'
                  }`}
                  required
                >
                  <option value="">-- Chọn gói thầu --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.code} - {pkg.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Report Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Ngày báo cáo <span className="text-red-500">*</span></span>
                  {preselectedDate && <Lock className="w-3 h-3 text-slate-400" />}
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  disabled={Boolean(preselectedDate)}
                  className={`w-full px-3 py-2 text-xs border rounded-lg font-medium transition-colors ${
                    preselectedDate
                      ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed select-none'
                      : 'bg-white border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer'
                  }`}
                  required
                />
              </div>

              {/* Report Shift */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Loại ca báo cáo <span className="text-red-500">*</span></span>
                  {preselectedReportType && <Lock className="w-3 h-3 text-slate-400" />}
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  disabled={Boolean(preselectedReportType)}
                  className={`w-full px-3 py-2 text-xs border rounded-lg font-medium transition-colors ${
                    preselectedReportType
                      ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed select-none'
                      : 'bg-white border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer'
                  }`}
                  required
                >
                  <option value="morning">Ca sáng (Mốc 08:00)</option>
                  <option value="evening">Ca tối (Mốc 20:00)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Manpower */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tổng số nhân công hiện trường (người) <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={manpower}
                  onChange={(e) => setManpower(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ví dụ: 30"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Work Activities */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Chi tiết công tác thi công trong ca
                </h3>
                <p className="text-[11px] text-slate-500">
                  Nhập khối lượng hoặc % tiến độ thực hiện trong lần báo cáo này
                </p>
              </div>

              {availableActivities.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddActivity(Number(e.target.value));
                        e.target.value = '';
                      }
                    }}
                    className="px-2.5 py-1.5 text-xs bg-slate-100 border border-slate-300 rounded-lg font-medium text-slate-700 cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      + Thêm công tác từ gói thầu...
                    </option>
                    {availableActivities.map((act) => (
                      <option key={act.id} value={act.id}>
                        {act.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                Chưa có công tác nào được thêm. Hãy chọn công tác ở danh sách trên.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => {
                  const qtyVal = typeof item.quantity === 'number' ? item.quantity : 0;
                  const newCumulative = item.currentCumulative + qtyVal;
                  const newPercent =
                    item.plannedQuantity && item.plannedQuantity > 0
                      ? Math.round((newCumulative / item.plannedQuantity) * 100)
                      : null;

                  return (
                    <div
                      key={item.activityId}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 text-base">
                            {item.activityName}
                          </h4>
                          {item.isQuantityBased ? (
                            <div className="text-[11px] text-slate-500 mt-1">
                              Kế hoạch:{' '}
                              <strong className="text-slate-700">
                                {item.plannedQuantity} {item.unit}
                              </strong>{' '}
                              | Lũy kế trước ca:{' '}
                              <strong className="text-slate-700">
                                {item.currentCumulative} {item.unit}
                              </strong>
                            </div>
                          ) : (
                            <div className="text-[11px] text-blue-600 mt-1">
                              Công tác đánh giá theo % hoàn thành
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                          title="Xóa khỏi phiếu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Vị trí thi công
                          </label>
                          <input
                            type="text"
                            value={item.location}
                            onChange={(e) => handleItemChange(index, 'location', e.target.value)}
                            placeholder="Ví dụ: VT16, Trạm 1..."
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        {item.isQuantityBased ? (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Khối lượng lần này ({item.unit}) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  'quantity',
                                  e.target.value === '' ? '' : Number(e.target.value)
                                )
                              }
                              placeholder="0.00"
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 font-semibold text-slate-900"
                              required
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Tiến độ (% hoàn thành lũy kế) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.progressPercent}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  'progressPercent',
                                  e.target.value === '' ? '' : Number(e.target.value)
                                )
                              }
                              placeholder="0 - 100%"
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 font-semibold text-blue-700"
                              required
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Ghi chú chất lượng / cấu kiện
                          </label>
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                            placeholder="Ví dụ: Đã lấy mẫu rùa nén..."
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      {item.isQuantityBased && qtyVal > 0 && (
                        <div className="p-2 bg-amber-50/80 rounded border border-amber-200/80 flex items-center justify-between text-[11px] text-amber-900">
                          <span>
                            Lũy kế sau báo cáo:{' '}
                            <strong className="font-bold">{newCumulative} {item.unit}</strong>
                          </span>
                          <span className="font-bold">
                            Tương đương {newPercent}% kế hoạch
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Machinery & Equipment (Đã thu gọn tinh gọn) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-500" />
                  3. Máy móc & Thiết bị hoạt động trong ca ({selectedMachinery.length} máy)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chọn các máy thực sự nổ máy làm việc trong ca từ kho thiết bị dự án.
                </p>
              </div>

              {/* Dropdown chọn nhanh máy móc */}
              {!machineryLoading && selectableMachines.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddMachine(Number(e.target.value));
                        e.target.value = '';
                      }
                    }}
                    className="px-2.5 py-1.5 text-xs bg-slate-100 border border-slate-300 rounded-lg font-medium text-slate-700 cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      + Chọn máy đưa vào ca...
                    </option>
                    {selectableMachines.map((m) => (
                      <option 
                        key={m.id} 
                        value={m.id}
                        disabled={m.hasConflict}
                      >
                        {m.code} - {m.name} {m.hasConflict ? `(Bận tại ${m.conflictPackageCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {machineryLoading ? (
              <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-slate-200">
                <Truck className="w-4 h-4 animate-pulse mx-auto mb-1 text-amber-500" />
                Đang kiểm tra danh mục máy móc của dự án...
              </div>
            ) : selectedMachinery.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                Ca này chưa phân công máy nào hoạt động. Hãy chọn từ danh sách trên nếu có nổ máy thi công.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedMachinery.map((mach) => (
                  <div
                    key={mach.machineryId}
                    className="p-3 bg-amber-50/40 rounded-lg border border-amber-300 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[11px]">
                          {mach.code}
                        </span>
                        <strong className="text-xs text-slate-900">{mach.name}</strong>
                        {mach.licensePlate && (
                          <span className="text-[10px] text-slate-500 font-mono bg-white px-1 rounded border border-slate-200">
                            {mach.licensePlate}
                          </span>
                        )}
                        {mach.driverName && (
                          <span className="text-[11px] text-slate-500 hidden sm:inline">• Lái máy: {mach.driverName}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMachine(mach.machineryId)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                        title="Bỏ máy khỏi ca"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs pt-1 border-t border-amber-200/50">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                          Số giờ làm việc (giờ)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          value={mach.operatingHours}
                          onChange={(e) =>
                            handleMachineFieldChange(
                              mach.machineryId,
                              'operatingHours',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                          Nhiên liệu (Lít)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={mach.fuelLiters}
                          onChange={(e) =>
                            handleMachineFieldChange(
                              mach.machineryId,
                              'fuelLiters',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          placeholder="VD: 35"
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                          Tình trạng máy
                        </label>
                        <select
                          value={mach.status}
                          onChange={(e) =>
                            handleMachineFieldChange(mach.machineryId, 'status', e.target.value as any)
                          }
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 cursor-pointer"
                        >
                          <option value="operating">Hoạt động bình thường</option>
                          <option value="standby">Chờ việc / Dự phòng</option>
                          <option value="broken">Gặp sự cố / Hỏng hóc</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                          Ghi chú ca máy
                        </label>
                        <input
                          type="text"
                          value={mach.notes}
                          onChange={(e) =>
                            handleMachineFieldChange(mach.machineryId, 'notes', e.target.value)
                          }
                          placeholder="VD: Đào móng VT16..."
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Difficulties & Proposals */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              4. Vướng mắc, Đề xuất & Ghi chú chung
            </h3>

            <div>
              <label className="block text-xs font-semibold text-red-700 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Vướng mắc tại hiện trường (nếu có)</span>
              </label>
              <textarea
                rows={2}
                value={difficulties}
                onChange={(e) => setDifficulties(e.target.value)}
                placeholder="Ví dụ: Mưa lớn sạt lở taluy tuyến móng VT17, thiếu thép D20..."
                className="w-full px-3 py-2 text-xs bg-white border border-red-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-400"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Vướng mắc sẽ được đưa lên Dashboard để CHT xử lý.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>Đề xuất giải pháp / điều chuyển vật tư máy móc (nếu có)</span>
              </label>
              <textarea
                rows={2}
                value={proposals}
                onChange={(e) => setProposals(e.target.value)}
                placeholder="Ví dụ: Đề xuất mượn thêm máy ủi hỗ trợ san gạt..."
                className="w-full px-3 py-2 text-xs bg-white border border-amber-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ghi chú chung của ca thi công
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú thêm về điều kiện thời tiết, an toàn lao động..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Đang gửi báo cáo...' : 'GỬI BÁO CÁO NGÀY'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};