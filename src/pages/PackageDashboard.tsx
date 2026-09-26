import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  Check,
  RefreshCw,
  Plus,
  Truck,
} from 'lucide-react';
import { packageService, reportService } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Activity } from '../types/index.ts';
import { ActivitiesManagement } from './ActivitiesManagement.tsx';

export const PackageDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isManager } = useAuth();

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'in_progress' | 'not_started' | 'completed'>('in_progress');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await packageService.getDashboard(Number(id));
      setData(res);
    } catch (err: any) {
      console.error('Failed to load package dashboard:', err);
      setError('Không thể tải Dashboard gói thầu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleResolveDifficulty = async (reportId: number) => {
    try {
      setResolvingId(reportId);
      await reportService.resolveDifficulty(reportId);
      await loadData();
    } catch (err) {
      console.error('Resolve error:', err);
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
      console.error('Resolve proposal error:', err);
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm font-medium">Đang tải Dashboard gói thầu...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error || 'Không tìm thấy thông tin gói thầu.'}
        </div>
      </div>
    );
  }

  const { package: pkg, projectName, projectCode, responsibleUser, latestReport, difficulties, proposals } = data;

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => navigate(`/projects/${pkg.projectId}`)}
            className="hover:text-slate-800 font-medium cursor-pointer"
          >
            {projectName}
          </button>
          <span>/</span>
          <span className="font-semibold text-slate-800">{pkg.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/daily-reports/new?packageId=${pkg.id}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nhập báo cáo ngày</span>
          </button>
          <button
            onClick={loadData}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
            title="Làm mới số liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Package Hero Card */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                  pkg.status === 'in_progress'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : pkg.status === 'delayed'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : pkg.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {pkg.status === 'in_progress'
                  ? 'Đang thi công'
                  : pkg.status === 'delayed'
                  ? 'Chậm tiến độ'
                  : pkg.status === 'completed'
                  ? 'Đã hoàn thành'
                  : 'Chưa triển khai'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {pkg.name}
            </h1>
            <p className="text-xs text-slate-500">
              Thuộc dự án: <strong className="text-slate-800">{projectName}</strong>
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4 text-slate-400" />
                <span>
                  Người chịu trách nhiệm chính:{' '}
                  <strong className="text-slate-900 font-semibold">{responsibleUser}</strong>
                </span>
              </div>
              {pkg.startDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>
                    Kế hoạch: <strong>{pkg.startDate}</strong> →{' '}
                    <strong>{pkg.endDate || 'Chưa định'}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cụm 3 thẻ cân đối: Công nhân - Máy móc - Báo cáo gần nhất */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
            {/* Thẻ 1: Công nhân */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center gap-3 min-w-[145px]">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Công nhân</div>
                <div className="text-xl font-bold text-indigo-600 leading-tight">
                  {data.currentManpower ?? 0} <span className="text-xs font-normal text-slate-500">người</span>
                </div>
              </div>
            </div>

            {/* Thẻ 2: Máy móc */}
            <div className="p-3.5 bg-cyan-50/70 border border-cyan-100 rounded-xl flex items-center gap-3 min-w-[145px]">
              <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Máy móc</div>
                <div className="text-xl font-bold text-cyan-600 leading-tight">
                  {data.currentMachinery ?? 0} <span className="text-xs font-normal text-slate-500">thiết bị</span>
                </div>
              </div>
            </div>

            {/* Thẻ 3: Báo cáo gần nhất */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-center min-w-[175px]">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">BC gần nhất:</span>
                <span className="font-medium text-slate-600">
                  {latestReport?.reportDate
                    ? `${latestReport.reportDate.slice(5)} (${latestReport.reportType === 'morning' ? '08h' : '20h'})`
                    : 'Chưa có'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[11px]">
                <span className="text-slate-500 truncate max-w-[95px]">
                  {latestReport?.creatorName || 'Chưa có'}
                </span>
                <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                  {latestReport?.manpower ?? 0} người
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quản lý danh mục công tác thi công trực tiếp */}
      <ActivitiesManagement 
        packageId={pkg.id} 
        embedded 
        onDataChange={loadData} 
      />

      {/* Vướng mắc & Đề xuất trên Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VƯỚNG MẮC (Difficulties) */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              Vướng mắc tại hiện trường ({difficulties?.length || 0})
            </h3>
            <span className="text-[11px] text-slate-400">Không xóa lịch sử</span>
          </div>

          {!difficulties || difficulties.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs italic">
              Hiện không có vướng mắc nào được ghi nhận cho gói thầu này.
            </div>
          ) : (
            <div className="space-y-3">
              {difficulties.map((item: any) => (
                <div
                  key={item.reportId}
                  className={`p-3.5 rounded-lg border text-xs transition-colors ${
                    item.status === 'open'
                      ? 'bg-red-50/60 border-red-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {item.status === 'open' ? (
                          <span className="font-bold text-red-600 flex items-center gap-1">
                            🔴 Chưa xử lý
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            🟢 Đã xử lý
                          </span>
                        )}
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">
                          {item.reportDate} (Người báo: <strong>{item.creatorName}</strong>)
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 text-xs mt-1">
                        {item.content}
                      </p>
                    </div>

                    {item.status === 'open' && isManager && (
                      <button
                        onClick={() => handleResolveDifficulty(item.reportId)}
                        disabled={resolvingId === item.reportId}
                        className="shrink-0 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Đánh dấu đã xử lý</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ĐỀ XUẤT (Proposals) */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Đề xuất từ hiện trường ({proposals?.length || 0})
            </h3>
            <span className="text-[11px] text-slate-400">Không xóa lịch sử</span>
          </div>

          {!proposals || proposals.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs italic">
              Hiện không có đề xuất nào được ghi nhận cho gói thầu này.
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map((item: any) => (
                <div
                  key={item.reportId}
                  className={`p-3.5 rounded-lg border text-xs transition-colors ${
                    item.status === 'open'
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {item.status === 'open' ? (
                          <span className="font-bold text-amber-600 flex items-center gap-1">
                            🟡 Chờ xử lý
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            🟢 Đã xử lý
                          </span>
                        )}
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">
                          {item.reportDate} (Người đề xuất: <strong>{item.creatorName}</strong>)
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 text-xs mt-1">
                        {item.content}
                      </p>
                    </div>

                    {item.status === 'open' && isManager && (
                      <button
                        onClick={() => handleResolveProposal(item.reportId)}
                        disabled={resolvingId === item.reportId}
                        className="shrink-0 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Đánh dấu đã xử lý</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};