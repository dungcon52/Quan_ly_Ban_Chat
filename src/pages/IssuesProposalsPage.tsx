import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Lightbulb,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  FolderGit2,
} from 'lucide-react';
import { reportService } from '../services/api.ts';
import { DailyReport } from '../types/index.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

export const IssuesProposalsPage: React.FC = () => {
  const { isManager } = useAuth();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'difficulties' | 'proposals'>('difficulties');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await reportService.getAll();
      setReports(data);
    } catch (err) {
      console.error('Failed to load issues/proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveDifficulty = async (reportId: number) => {
    try {
      setResolvingId(reportId);
      await reportService.resolveDifficulty(reportId);
      await loadData();
    } catch (err) {
      console.error('Error resolving difficulty:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const handleResolveProposal = async (reportId: number) => {
    try {
      setResolvingId(reportId);
      await reportService.resolveProposal(reportId);
      await loadData();
    } catch (err) {
      console.error('Error resolving proposal:', err);
    } finally {
      setResolvingId(null);
    }
  };

  // Filter items
  const difficultiesList = reports
    .filter((r) => r.difficulties && r.difficulties.trim() !== '')
    .filter((r) => (statusFilter === 'all' ? true : r.difficultiesStatus === statusFilter));

  const proposalsList = reports
    .filter((r) => r.proposals && r.proposals.trim() !== '')
    .filter((r) => (statusFilter === 'all' ? true : r.proposalsStatus === statusFilter));

  const openDiffCount = reports.filter((r) => r.difficulties && r.difficultiesStatus === 'open').length;
  const openPropCount = reports.filter((r) => r.proposals && r.proposalsStatus === 'open').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Quản lý Vướng mắc & Đề xuất Hiện trường
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi, xử lý và lưu vết các vấn đề phát sinh từ các gói thầu
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        {/* Main Tab */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('difficulties')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'difficulties'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Vướng mắc</span>
            {openDiffCount > 0 && (
              <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">
                {openDiffCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('proposals')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'proposals'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Đề xuất</span>
            {openPropCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                {openPropCount}
              </span>
            )}
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">Tất cả</option>
            <option value="open">Chưa xử lý</option>
            <option value="resolved">Đã xử lý</option>
          </select>
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
            <span className="text-xs">Đang tải dữ liệu...</span>
          </div>
        ) : activeTab === 'difficulties' ? (
          difficultiesList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
              Không có vướng mắc nào phù hợp với bộ lọc.
            </div>
          ) : (
            difficultiesList.map((item) => (
              <div
                key={item.id}
                className={`p-4 bg-white rounded-xl border text-xs transition-all shadow-2xs ${
                  item.difficultiesStatus === 'open'
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 font-mono font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                        {item.packageCode}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {item.packageName}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        Ngày {item.reportDate} ({item.reportType === 'morning' ? '08:00' : '20:00'})
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        Người báo: <strong>{item.creatorName}</strong>
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 pt-1">
                      {item.difficulties}
                    </p>

                    {item.difficultiesStatus === 'resolved' && (
                      <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã được CHT xử lý</span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    {item.difficultiesStatus === 'open' ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 font-bold rounded-md">
                        🔴 Chưa xử lý
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-md">
                        🟢 Đã xử lý
                      </span>
                    )}

                    {item.difficultiesStatus === 'open' && isManager && (
                      <button
                        onClick={() => handleResolveDifficulty(item.id)}
                        disabled={resolvingId === item.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg border border-emerald-300 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Xác nhận đã xử lý</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )
        ) : proposalsList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            Không có đề xuất nào phù hợp với bộ lọc.
          </div>
        ) : (
          proposalsList.map((item) => (
            <div
              key={item.id}
              className={`p-4 bg-white rounded-xl border text-xs transition-all shadow-2xs ${
                item.proposalsStatus === 'open'
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 font-mono font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                      {item.packageCode}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {item.packageName}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">
                      Ngày {item.reportDate} ({item.reportType === 'morning' ? '08:00' : '20:00'})
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">
                      Người đề xuất: <strong>{item.creatorName}</strong>
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 pt-1">
                    {item.proposals}
                  </p>

                  {item.proposalsStatus === 'resolved' && (
                    <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã được CHT phê duyệt / điều chuyển</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  {item.proposalsStatus === 'open' ? (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 font-bold rounded-md">
                      🟡 Chờ xử lý
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-md">
                      🟢 Đã xử lý
                    </span>
                  )}

                  {item.proposalsStatus === 'open' && isManager && (
                    <button
                      onClick={() => handleResolveProposal(item.id)}
                      disabled={resolvingId === item.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg border border-emerald-300 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Xác nhận đã xử lý</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
