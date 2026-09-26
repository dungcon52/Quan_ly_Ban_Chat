import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  Truck, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Calendar,
  Moon,
  Sun,
  X,
  FileText
} from 'lucide-react';
import { reportService } from '../services/api.ts';
import { DelayedActivity } from '../types/index.ts';
import { ProjectsManagement } from './ProjectsManagement.tsx';

export const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => new Intl.DateTimeFormat('en-CA').format(new Date()));
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');

  const [delayedActivities, setDelayedActivities] = useState<DelayedActivity[]>([]);
  const [totalManpower, setTotalManpower] = useState(0);
  const [machineryStats, setMachineryStats] = useState({ operating: 0, total: 0, maintenance: 0, standby: 0 });
  const [shiftsData, setShiftsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State quản lý Modal xem chi tiết phiếu
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [reportDetail, setReportDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadData = async (dateStr: string) => {
    try {
      setLoading(true);
      setError(null);
      const statusData: any = await reportService.getReportingStatus(dateStr);
      setTotalManpower(statusData.manpower ?? 0);
      setMachineryStats(statusData.machinery ?? { operating: 0, total: 0, maintenance: 0, standby: 0 });
      setShiftsData(statusData.shifts ?? null);
      setDelayedActivities(statusData.delayedActivities || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Không thể tải dữ liệu Tổng quan. Vui lòng kiểm tra lại kết nối.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  // Hàm mở và nạp chi tiết báo cáo cho Modal
  const handleOpenReportDetail = async (reportId: number) => {
    setSelectedReportId(reportId);
    setLoadingDetail(true);
    try {
      const detail = await reportService.getById(reportId);
      setReportDetail(detail);
    } catch (err) {
      console.error('Failed to load report detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedReportId(null);
    setReportDetail(null);
  };

  // Logic kiểm soát thời gian
  const now = new Date();
  const todayFormatted = new Intl.DateTimeFormat('en-CA').format(now);
  const isToday = selectedDate === todayFormatted;
  const isPast = selectedDate < todayFormatted;
  const currentHour = now.getHours();

  const isShiftOverdue = isPast || (isToday && (activeTab === 'morning' ? currentHour >= 8 : currentHour >= 20));
  const currentShift = activeTab === 'morning' ? shiftsData?.morning : shiftsData?.evening;
  const missingCount = (currentShift?.total || 0) - (currentShift?.reportedCount || 0);

  return (
    <div className="space-y-6">
      {/* Top Header kèm Bộ chọn ngày */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Tổng quan công trường
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Điều hành nhân lực, thiết bị và kiểm soát nộp báo cáo theo ca
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500 hidden md:inline">Ngày:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            />
          </div>

          <button
            onClick={() => loadData(selectedDate)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 2 Card Nguồn lực */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Thẻ 1: Quân số */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Công nhân vào ca (08:00)
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-2">
            {totalManpower} <span className="text-sm font-normal text-slate-500">người</span>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-2 text-[11px]">
            {shiftsData?.morning?.total > shiftsData?.morning?.reportedCount ? (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Mới tính trên {shiftsData?.morning?.reportedCount}/{shiftsData?.morning?.total} gói đã nộp sáng {selectedDate}
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Đã chốt đủ quân số 100% gói thầu
              </span>
            )}
          </div>
        </div>

        {/* Thẻ 2: Thiết bị Máy móc */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Huy động máy móc thiết bị
            </span>
            <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <div className="text-3xl font-extrabold text-cyan-600">
              {machineryStats.operating}
            </div>
            <div className="text-sm text-slate-500 font-medium">
              / {machineryStats.total} máy công trường ({machineryStats.total > 0 ? Math.round((machineryStats.operating / machineryStats.total) * 100) : 0}%)
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
            <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              {machineryStats.operating} đang chạy
            </span>
            <span className="text-slate-600 font-medium inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
              {machineryStats.standby} chờ việc
            </span>
            <span className={`${machineryStats.maintenance > 0 ? 'text-red-600 font-bold' : 'text-slate-500 font-medium'} inline-flex items-center gap-1`}>
              <span className={`w-2 h-2 rounded-full ${machineryStats.maintenance > 0 ? 'bg-red-500' : 'bg-slate-300'} inline-block`}></span>
              {machineryStats.maintenance} đang hỏng
            </span>
          </div>
        </div>
      </div>

      {/* BẢNG THEO DÕI BÁO CÁO THEO CA */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Thanh chọn Tab */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('morning')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'morning'
                  ? 'bg-amber-400 text-slate-900 shadow-xs'
                  : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Ca sáng 08:00 (Điểm danh nguồn lực)</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${activeTab === 'morning' ? 'bg-amber-500 text-slate-900' : 'bg-slate-200'}`}>
                {shiftsData?.morning?.reportedCount || 0}/{shiftsData?.morning?.total || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('evening')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'evening'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Ca tối 20:00 (Sản lượng & Ca đêm)</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${activeTab === 'evening' ? 'bg-indigo-700 text-white' : 'bg-slate-200'}`}>
                {shiftsData?.evening?.reportedCount || 0}/{shiftsData?.evening?.total || 0}
              </span>
            </button>
          </div>

          <div className="text-xs font-medium text-slate-500">
            Ngày kiểm tra: <strong className="text-slate-800">{selectedDate}</strong>
            {missingCount > 0 && (
              <span className="ml-2 text-red-600 font-bold">(Còn thiếu {missingCount} gói)</span>
            )}
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Gói thầu</th>
                <th className="px-4 py-3">Dự án</th>
                <th className="px-4 py-3">Chỉ huy trưởng</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                {activeTab === 'morning' ? (
                  <>
                    <th className="px-4 py-3 text-center">Quân số</th>
                    <th className="px-4 py-3 text-center">Máy móc</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-center">Làm ca đêm?</th>
                    <th className="px-4 py-3">Vướng mắc / Đề xuất</th>
                  </>
                )}
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentShift?.packages.map((pkg: any) => (
                <tr 
                  key={pkg.packageId} 
                  className={`hover:bg-slate-50/80 transition-colors ${
                    !pkg.hasReported && isShiftOverdue ? 'bg-red-50/20' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <div>{pkg.packageCode}</div>
                    <div className="text-[11px] text-slate-500 font-normal">{pkg.packageName}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{pkg.projectName}</td>
                  <td className="px-4 py-3 text-slate-800">
                    <span className="font-semibold">{pkg.responsibleUser}</span>
                    {pkg.responsibleUserPhone && (
                      <div className="text-[10px] text-slate-400">{pkg.responsibleUserPhone}</div>
                    )}
                  </td>
                  
                  {/* Cột Trạng thái */}
                  <td className="px-4 py-3 text-center">
                    {pkg.hasReported ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> Đã nộp
                      </span>
                    ) : !isShiftOverdue ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium text-[11px]">
                        <Clock className="w-3 h-3 text-slate-500" /> Chờ báo cáo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold text-[11px]">
                        <AlertCircle className="w-3 h-3" /> {isPast ? 'Thiếu báo cáo' : 'Chưa nộp'}
                      </span>
                    )}
                  </td>

                  {activeTab === 'morning' ? (
                    <>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">
                        {pkg.manpower} <span className="font-normal text-slate-400 text-[10px]">người</span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">
                        {pkg.machineryCount} <span className="font-normal text-slate-400 text-[10px]">máy</span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-center">
                        {pkg.hasReported ? (
                          pkg.nightShift ? (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">🌙 Có ca đêm</span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Không</span>
                          )
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                        {pkg.difficulties ? (
                          <span className="text-amber-700 font-medium">⚠️ {pkg.difficulties}</span>
                        ) : pkg.hasReported ? (
                          <span className="text-slate-400">Bình thường</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </>
                  )}

                  {/* Cột Thao tác */}
                  <td className="px-4 py-3 text-right">
                    {!pkg.hasReported ? (
                      <button
                        onClick={() => navigate(`/daily-reports/new?packageId=${pkg.packageId}&reportType=${activeTab}&reportDate=${selectedDate}`)}
                        className={`inline-flex items-center gap-1 px-2 py-1 font-bold rounded text-[11px] cursor-pointer shadow-2xs transition-colors ${
                          !isShiftOverdue 
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                            : 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>
                          {isPast 
                            ? `Nộp bù ngày ${selectedDate.slice(5)}` 
                            : !isShiftOverdue 
                              ? 'Vào báo cáo' 
                              : 'Nộp muộn'}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenReportDetail(pkg.reportId)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 font-semibold rounded-md border border-slate-300 shadow-2xs text-[11px] cursor-pointer transition-colors"
                      >
                        <span>Xem báo cáo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* BẢNG CÔNG TÁC CHẬM TIẾN ĐỘ */}
      {/* BẢNG CÔNG TÁC CHẬM TIẾN ĐỘ */}
      <section className="bg-white rounded-xl border border-red-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-red-50/70 border-b border-red-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h2 className="text-sm font-bold text-red-900">Công tác chậm tiến độ</h2>
              <p className="text-xs text-red-700 mt-0.5">
                Các công tác bị trễ so với biểu đồ tiến độ kế hoạch tính đến ngày {selectedDate}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
            {delayedActivities.length} công tác
          </span>
        </div>

        {delayedActivities.length === 0 ? (
          <div className="p-8 text-center text-sm text-emerald-700">
            Hiện không có công tác nào bị chậm tiến độ tính đến ngày {selectedDate}.
          </div>
        ) : (
          /* Thêm max-h-[320px] overflow-y-auto để giới hạn chiều cao và thêm thanh cuộn */
          <div className="max-h-[320px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 bg-slate-50">Công tác</th>
                  <th className="px-4 py-3 bg-slate-50">Gói thầu</th>
                  <th className="px-4 py-3 bg-slate-50">Dự án</th>
                  <th className="px-4 py-3 text-center bg-slate-50">Tiến độ</th>
                  <th className="px-4 py-3 text-center bg-slate-50">Chậm</th>
                  <th className="px-4 py-3 text-right bg-slate-50">Xem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {delayedActivities.map((activity) => (
                  <tr key={activity.activityId} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {activity.activityName}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {activity.packageCode} - {activity.packageName}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {activity.projectName}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">
                      {activity.progressPercent}%
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-red-600">
                      {activity.delayDays} ngày
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/packages/${activity.packageId}`)}
                        className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
                      >
                        Mở <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Danh sách dự án */}
      <ProjectsManagement embedded />

      {/* MODAL POPUP XEM CHI TIẾT BÁO CÁO */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-150">
            
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 truncate pr-4">
                Chi tiết Báo cáo: {reportDetail?.packageName || 'Đang tải...'} ({reportDetail?.reportDate})
              </h3>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nội dung Modal */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {loadingDetail ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                  <p>Đang tải nội dung phiếu...</p>
                </div>
              ) : reportDetail ? (
                <>
                  {/* Hộp tóm tắt đầu phiếu */}
                  <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Thời gian ca:</div>
                      <div className="font-semibold text-slate-900 mt-0.5">
                        {reportDetail.reportType === 'morning' ? 'Ca sáng (08:00)' : 'Ca tối (20:00)'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Người báo cáo:</div>
                      <div className="font-semibold text-slate-900 mt-0.5">
                        {reportDetail.creatorName || 'Quản trị viên'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Nhân công:</div>
                      <div className="font-bold text-indigo-600 mt-0.5 text-sm">
                        {reportDetail.manpower || 0} người
                      </div>
                    </div>
                  </div>

                  {/* Bảng hạng mục công tác */}
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2">Hạng mục công tác thực hiện:</h4>
                    {reportDetail.items && reportDetail.items.length > 0 ? (
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2">Tên công tác thi công</th>
                              <th className="px-3 py-2">Vị trí</th>
                              <th className="px-3 py-2 text-right">Khối lượng / % Tiến độ</th>
                              <th className="px-3 py-2">Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {reportDetail.items.map((it: any) => (
                              <tr key={it.id}>
                                <td className="px-3 py-2.5 font-semibold text-slate-900">{it.activityName}</td>
                                <td className="px-3 py-2.5 text-slate-600">{it.location || '-'}</td>
                                <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                                  {it.quantity !== null ? `${it.quantity} ${it.unit || ''}` : `${it.progressPercent}%`}
                                </td>
                                <td className="px-3 py-2.5 text-slate-500">{it.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Không có công tác nào được ghi nhận trong phiếu này.</p>
                    )}
                  </div>

                  {/* Bảng máy móc */}
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-amber-600">
                      <Truck className="w-4 h-4" />
                      <span>Máy móc & Thiết bị hoạt động trong ca ({reportDetail.machinery?.length || 0}):</span>
                    </h4>
                    {reportDetail.machinery && reportDetail.machinery.length > 0 ? (
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2">Mã & Tên thiết bị</th>
                              <th className="px-3 py-2">Biển số</th>
                              <th className="px-3 py-2 text-center">Giờ làm việc</th>
                              <th className="px-3 py-2 text-center">Tình trạng</th>
                              <th className="px-3 py-2">Ghi chú ca máy</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {reportDetail.machinery.map((m: any) => (
                              <tr key={m.id}>
                                <td className="px-3 py-2 font-medium text-slate-900">{m.name} ({m.code})</td>
                                <td className="px-3 py-2 text-slate-600">{m.licensePlate || '-'}</td>
                                <td className="px-3 py-2 text-center font-bold text-emerald-600">{m.operatingHours}h</td>
                                <td className="px-3 py-2 text-center">
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px]">Tốt</span>
                                </td>
                                <td className="px-3 py-2 text-slate-500">{m.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Ca này không điều động máy móc.</p>
                    )}
                  </div>

                  {/* Vướng mắc & Đề xuất (nếu có) */}
                  {(reportDetail.difficulties || reportDetail.proposals) && (
                    <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1.5">
                      {reportDetail.difficulties && (
                        <div>
                          <span className="font-bold text-amber-900">Vướng mắc: </span>
                          <span className="text-amber-800">{reportDetail.difficulties}</span>
                        </div>
                      )}
                      {reportDetail.proposals && (
                        <div>
                          <span className="font-bold text-indigo-900">Đề xuất: </span>
                          <span className="text-indigo-800">{reportDetail.proposals}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-red-500">Không tìm thấy dữ liệu phiếu báo cáo.</div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer shadow-2xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};