import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Filter,
  Calendar,
  User,
  Users,
  Eye,
  Trash2,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { reportService, packageService, projectService } from '../services/api.ts';
import { DailyReport, Package, Project } from '../types/index.ts';
import { Modal } from '../components/Modal.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

export const DailyReportsList: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, currentUser } = useAuth();

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Detail Modal
  const [activeReport, setActiveReport] = useState<DailyReport | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, packagesData, projectsData] = await Promise.all([
        reportService.getAll({
          packageId: selectedPackageId ? Number(selectedPackageId) : undefined,
          date: selectedDate || undefined,
        }),
        packageService.getAll(),
        projectService.getAll(),
      ]);
      setReports(reportsData);
      setPackages(packagesData);
      setProjects(projectsData);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPackageId, selectedDate]);

  // Lọc danh sách gói thầu dựa theo dự án được chọn
  const filteredPackages = selectedProjectId
    ? packages.filter((p) => p.projectId === Number(selectedProjectId))
    : packages;

  const handleViewDetail = async (reportId: number) => {
    try {
      setDetailLoading(true);
      const detailed = await reportService.getById(reportId);
      setActiveReport(detailed);
    } catch (err) {
      console.error('Error fetching report detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (reportId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu báo cáo này?')) {
      return;
    }
    try {
      await reportService.delete(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (activeReport?.id === reportId) {
        setActiveReport(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Lỗi khi xóa báo cáo.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Lịch sử Báo cáo Thi công Ngày
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tổng hợp toàn bộ các phiếu báo cáo ca sáng (08:00) và ca tối (20:00)
          </p>
        </div>

        <button
          onClick={() => navigate('/daily-reports/new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo phiếu báo cáo mới</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Filter className="w-4 h-4" />
          <span>Bộ lọc:</span>
        </div>

        {/* Filter by Project */}
        <select
          value={selectedProjectId}
          onChange={(e) => {
            setSelectedProjectId(e.target.value);
            setSelectedPackageId(''); // Reset gói thầu khi thay đổi dự án
          }}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium cursor-pointer"
        >
          <option value="">Tất cả dự án</option>
          {projects.map((proj) => (
            <option key={proj.id} value={proj.id}>
              {proj.name}
            </option>
          ))}
        </select>

        {/* Filter by Package */}
        <select
          value={selectedPackageId}
          onChange={(e) => setSelectedPackageId(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium cursor-pointer"
        >
          <option value="">Tất cả gói thầu</option>
          {filteredPackages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} - {p.name}
            </option>
          ))}
        </select>

        {/* Filter by Date */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium cursor-pointer"
        />

        {(selectedProjectId || selectedPackageId || selectedDate) && (
          <button
            onClick={() => {
              setSelectedProjectId('');
              setSelectedPackageId('');
              setSelectedDate('');
            }}
            className="text-xs text-amber-600 hover:underline font-semibold cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
            <span className="text-xs">Đang tải danh sách báo cáo...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Không tìm thấy phiếu báo cáo nào phù hợp với điều kiện lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ngày / Ca</th>
                  <th className="py-3 px-4">Gói thầu</th>
                  <th className="py-3 px-4">Người báo cáo</th>
                  <th className="py-3 px-4">Nhân công</th>
                  <th className="py-3 px-4">Công tác</th>
                  <th className="py-3 px-4">Vướng mắc / Đề xuất</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Date / Shift */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{r.reportDate}</div>
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                          r.reportType === 'morning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {r.reportType === 'morning' ? 'Ca sáng (08:00)' : 'Ca tối (20:00)'}
                      </span>
                    </td>

                    {/* Package */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{r.packageName}</div>
                    </td>

                    {/* Reporter */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.creatorName}</span>
                      </div>
                    </td>

                    {/* Manpower */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {r.manpower} người
                      </span>
                    </td>

                    {/* Items count */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-600">
                        <strong>{r.itemsCount || 0}</strong> công tác
                      </span>
                    </td>

                    {/* Difficulties / Proposals tags */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        {r.difficulties && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate ${
                              r.difficultiesStatus === 'open'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                            title={r.difficulties}
                          >
                            {r.difficultiesStatus === 'open' ? '🔴 Vướng mắc' : '🟢 Đã xử lý VM'}: {r.difficulties}
                          </span>
                        )}
                        {r.proposals && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate ${
                              r.proposalsStatus === 'open'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                            title={r.proposals}
                          >
                            {r.proposalsStatus === 'open' ? '🟡 Đề xuất' : '🟢 Đã xử lý ĐX'}: {r.proposals}
                          </span>
                        )}
                        {!r.difficulties && !r.proposals && (
                          <span className="text-slate-400 text-[11px]">Bình thường</span>
                        )}
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleViewDetail(r.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 font-semibold rounded-md border border-slate-300 shadow-2xs text-xs cursor-pointer transition-colors"
                          title="Xem chi tiết phiếu"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Xem</span>
                        </button>

                        {(isAdmin || r.createdBy === currentUser?.id) && (
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 font-semibold rounded-md border border-red-200 shadow-2xs text-xs cursor-pointer transition-colors"
                            title="Xóa phiếu"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
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

      {/* Detail Modal */}
      <Modal
        isOpen={!!activeReport}
        onClose={() => setActiveReport(null)}
        title={`Chi tiết Báo cáo: ${activeReport?.packageName || ''} (${activeReport?.reportDate || ''})`}
        maxWidth="2xl"
      >
        {activeReport && (
          <div className="space-y-4 text-xs">
            {/* Meta summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block">Thời gian ca:</span>
                <strong className="text-slate-800 font-bold">
                  {activeReport.reportType === 'morning' ? 'Ca sáng (08:00)' : 'Ca tối (20:00)'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Người báo cáo:</span>
                <strong className="text-slate-800 font-bold">{activeReport.creatorName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Nhân công:</span>
                <strong className="text-slate-800 font-bold">{activeReport.manpower} người</strong>
              </div>
            </div>

            {/* Activities Table */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Hạng mục công tác thực hiện:</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[220px] w-1/2">Tên công tác thi công</th>
                      <th className="py-2.5 px-3">Vị trí</th>
                      <th className="py-2.5 px-3">Khối lượng / % Tiến độ</th>
                      <th className="py-2.5 px-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeReport.items && activeReport.items.length > 0 ? (
                      activeReport.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900 text-xs">
                            {item.activityName || `Công tác #${item.activityId}`}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{item.location || '-'}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {item.quantity !== null && item.quantity !== undefined
                              ? `${item.quantity} ${item.unit || ''}`
                              : item.progressPercent !== null && item.progressPercent !== undefined
                              ? `${item.progressPercent}%`
                              : '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-500 italic">{item.notes || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">
                          Không có chi tiết công tác.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Machinery Table */}
            {activeReport.machinery && activeReport.machinery.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-500" />
                  Máy móc & Thiết bị hoạt động trong ca ({activeReport.machinery.length}):
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Mã & Tên thiết bị</th>
                        <th className="py-2.5 px-3">Biển số</th>
                        <th className="py-2.5 px-3 text-center">Giờ làm việc</th>
                        <th className="py-2.5 px-3 text-center">Nhiên liệu</th>
                        <th className="py-2.5 px-3 text-center">Tình trạng</th>
                        <th className="py-2.5 px-3">Ghi chú ca máy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeReport.machinery.map((mach: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded text-[11px] border border-amber-200 mr-1.5">
                              {mach.code || mach.machineryCode}
                            </span>
                            <span className="font-semibold text-slate-900">{mach.name || mach.machineryName}</span>
                          </td>
                          <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                            {mach.licensePlate || '-'}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-emerald-700">
                            {mach.operatingHours}h
                          </td>
                          <td className="py-2 px-3 text-center font-medium text-slate-700">
                            {mach.fuelLiters ? `${mach.fuelLiters} L` : '-'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                mach.status === 'operating'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : mach.status === 'broken'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {mach.status === 'operating'
                                ? 'Tốt'
                                : mach.status === 'broken'
                                ? 'Sự cố'
                                : 'Chờ việc'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500 italic text-[11px]">
                            {mach.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Difficulties */}
            {activeReport.difficulties && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900">
                <strong className="block text-red-800 font-bold mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  Vướng mắc hiện trường ({activeReport.difficultiesStatus === 'open' ? 'Chưa xử lý' : 'Đã xử lý'}):
                </strong>
                <p>{activeReport.difficulties}</p>
              </div>
            )}

            {/* Proposals */}
            {activeReport.proposals && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                <strong className="block text-amber-800 font-bold mb-1 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  Đề xuất giải pháp ({activeReport.proposalsStatus === 'open' ? 'Chờ xử lý' : 'Đã xử lý'}):
                </strong>
                <p>{activeReport.proposals}</p>
              </div>
            )}

            {/* General notes */}
            {activeReport.notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                <strong className="block text-slate-600 font-bold mb-1">Ghi chú chung:</strong>
                <p>{activeReport.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};