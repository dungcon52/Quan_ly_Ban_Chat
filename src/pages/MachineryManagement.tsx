import React, { useEffect, useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  User,
  Phone,
  RefreshCw,
  Building2,
  ArrowRightLeft,
} from 'lucide-react';
import { machineryService, projectService, packageService } from '../services/api.ts';
import { Machinery, Project, Package } from '../types/index.ts';
import { Modal } from '../components/Modal.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

export const MachineryManagement: React.FC = () => {
  const { isAdmin, role } = useAuth();
  const canManage = isAdmin || role === 'manager';

  const [machineryList, setMachineryList] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<any | null>(null);

  // Form State
  const [formProjectId, setFormProjectId] = useState<number | ''>('');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Máy xúc đào');
  const [formLicensePlate, setFormLicensePlate] = useState('');
  const [formDriverName, setFormDriverName] = useState('');
  const [formDriverPhone, setFormDriverPhone] = useState('');
  const [formStatus, setFormStatus] = useState<string>('idle');
  const [formNotes, setFormNotes] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [machData, projData, pkgsData] = await Promise.all([
        machineryService.getAll({
          status: selectedStatus || undefined,
          type: selectedType || undefined,
          search: search || undefined,
        }),
        projectService.getAll(),
        packageService.getAll(),
      ]);
      setMachineryList(machData);
      setProjects(projData);
      setPackages(pkgsData);

      if (!selectedProjectId && projData.length > 0) {
        setSelectedProjectId(String(projData[0].id));
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu máy móc:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedType, search]);

  // Bộ lọc danh sách theo Dự án
  const filteredMachineryList = useMemo(() => {
    return machineryList.filter((m: any) => {
      if (!selectedProjectId) return true;

      const targetProjId = Number(selectedProjectId);

      // Nếu máy đã điều chuyển đi (không còn gói thầu nào thuộc dự án này)
      if (m.status === 'transferred' && !m.currentPackageId) {
        return false;
      }

      if (m.currentPackageId) {
        const pkg = packages.find((p) => p.id === Number(m.currentPackageId));
        if (pkg && Number(pkg.projectId) === targetProjId) return true;
      }

      if (m.projectId && Number(m.projectId) === targetProjId) return true;

      const targetProj = projects.find((p) => p.id === targetProjId);
      if (
        targetProj &&
        m.projectName &&
        m.projectName.trim().toLowerCase() === targetProj.name.trim().toLowerCase()
      ) {
        return true;
      }

      return false;
    });
  }, [machineryList, selectedProjectId, projects, packages]);

  // 4 Cards Thống kê trạng thái
  const stats = useMemo(() => {
    const list = filteredMachineryList;
    return {
      total: list.length,
      active: list.filter((m: any) => m.status === 'active' || m.status === 'operating').length,
      idle: list.filter((m: any) => m.status === 'idle' || m.status === 'standby').length,
      maintenance: list.filter((m: any) => m.status === 'maintenance' || m.status === 'broken').length,
    };
  }, [filteredMachineryList]);

  // Mở modal thêm máy mới
  const openCreateModal = () => {
    setEditingMachine(null);
    setFormProjectId(selectedProjectId ? Number(selectedProjectId) : (projects[0]?.id || ''));
    setFormCode(`MC-${Date.now().toString().slice(-4)}`);
    setFormName('');
    setFormType('Máy xúc đào');
    setFormLicensePlate('');
    setFormDriverName('');
    setFormDriverPhone('');
    setFormStatus('idle'); // Máy mới vào dự án luôn ở bãi chờ việc
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Mở modal cập nhật máy
  const openEditModal = (mach: any) => {
    setEditingMachine(mach);

    let pId: number | '' = '';
    if (mach.currentPackageId) {
      const pkg = packages.find((p) => p.id === Number(mach.currentPackageId));
      if (pkg) pId = Number(pkg.projectId);
    }
    if (!pId && mach.projectId) pId = Number(mach.projectId);
    if (!pId && mach.projectName) {
      const proj = projects.find((p) => p.name.trim().toLowerCase() === mach.projectName.trim().toLowerCase());
      if (proj) pId = Number(proj.id);
    }
    if (!pId && selectedProjectId) pId = Number(selectedProjectId);

    setFormProjectId(pId);
    setFormCode(mach.code || '');
    setFormName(mach.name || '');
    setFormType(mach.type || 'Máy xúc đào');
    setFormLicensePlate(mach.licensePlate || '');
    setFormDriverName(mach.driverName || '');
    setFormDriverPhone(mach.driverPhone || '');
    setFormStatus(mach.status === 'maintenance' || mach.status === 'broken' ? 'maintenance' : (mach.status || 'idle'));
    setFormNotes(mach.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const isTransferring = formStatus === 'transferred';

    if (!isTransferring && !formProjectId) {
      setFormError('Bắt buộc phải gán thiết bị vào một Dự án cụ thể.');
      return;
    }
    if (!formCode.trim() || !formName.trim()) {
      setFormError('Vui lòng nhập đầy đủ Mã máy và Tên thiết bị.');
      return;
    }

    try {
      setFormSubmitting(true);

      let targetPackageId: number | null = null;

      // Nếu KHÔNG PHẢI điều chuyển đi, tìm gói thầu của dự án để gán máy
      if (!isTransferring && formProjectId) {
        const matchedPkg = packages.find((p) => Number(p.projectId) === Number(formProjectId));
        if (!matchedPkg) {
          setFormError('Dự án tiếp nhận chưa có gói thầu nào. Vui lòng tạo ít nhất 1 Gói thầu trước!');
          setFormSubmitting(false);
          return;
        }
        targetPackageId = matchedPkg.id;
      }

      const payload = {
        name: formName.trim(),
        code: formCode.trim(),
        type: formType,
        projectId: isTransferring ? null : Number(formProjectId),
        currentPackageId: isTransferring ? null : targetPackageId, // Điều chuyển đi -> ngắt gói thầu
        licensePlate: formLicensePlate.trim() || null,
        driverName: formDriverName.trim() || null,
        driverPhone: formDriverPhone.trim() || null,
        status: isTransferring ? 'transferred' : formStatus,
        notes: formNotes.trim() || null,
      };

      if (editingMachine) {
        await machineryService.update(editingMachine.id, payload as any);
        if (isTransferring) {
          showToast(`Đã xuất điều chuyển máy "${formName}" ra khỏi công trường!`);
        } else {
          showToast(`Cập nhật thông tin máy "${formName}" thành công!`);
        }
      } else {
        await machineryService.create(payload as any);
        showToast(`Đăng ký máy "${formName}" vào dự án thành công (Trạng thái: Chờ việc)!`);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Lỗi khi lưu máy móc:', err);
      setFormError(err.response?.data?.error || err.message || 'Có lỗi xảy ra khi lưu máy móc.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (mach: any) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa máy móc "${mach.name}" (${mach.code}) khỏi hệ thống?`)) return;
    try {
      await machineryService.delete(mach.id);
      showToast(`Đã xóa thiết bị "${mach.name}" thành công.`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Lỗi khi xóa thiết bị.');
    }
  };

  const machineTypes = [
    'Máy xúc đào',
    'Máy ủi',
    'Xe lu rung',
    'Xe ben tự đổ',
    'Cần cẩu bánh xích',
    'Cần cẩu tháp',
    'Máy bơm bê tông',
    'Máy khoan cọc nhồi',
    'Máy phát điện công nghiệp',
    'Xe bồn tưới nước',
    'Khác',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2.5 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Quản lý Máy móc & Thiết bị Thi công</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân bổ theo từng dự án, trạng thái hoạt động tự động theo báo cáo ca ngày
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Đăng ký Máy móc mới
            </button>
          )}
          <button
            onClick={loadData}
            title="Tải lại dữ liệu"
            className="p-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Cards Thống kê trạng thái giãn đều */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tổng máy dự án</span>
            <Truck className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
          <span className="text-[11px] text-slate-400">Thuộc dự án chọn</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Đang hoạt động</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{stats.active}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Có ca thi công hôm nay</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>Chờ việc / Bãi</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{stats.idle}</p>
          <span className="text-[11px] text-amber-600 font-medium">Chưa có ca làm hôm nay</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-2xs bg-gradient-to-br from-white to-red-50/30">
          <div className="flex items-center justify-between text-red-700 text-xs font-semibold">
            <span>Bảo dưỡng / Hỏng</span>
            <Wrench className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-700 mt-2">{stats.maintenance}</p>
          <span className="text-[11px] text-red-600 font-medium">Đang sửa chữa</span>
        </div>
      </div>

      {/* Thanh bộ lọc */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã máy, tên máy, biển số, lái máy..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:bg-white"
          />
        </div>

        <div className="w-64">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-amber-50/50 border border-amber-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-bold text-slate-800 cursor-pointer"
          >
            <option value="">-- Toàn bộ dự án --</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.code} - {proj.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-40">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="">-- Trạng thái --</option>
            <option value="active">Đang hoạt động</option>
            <option value="idle">Chờ việc / Bãi</option>
            <option value="maintenance">Bảo dưỡng / Hỏng</option>
            <option value="transferred">Đang điều chuyển</option>
          </select>
        </div>

        <div className="w-40">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="">-- Chủng loại --</option>
            {machineTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
          Đang tải danh sách máy móc...
        </div>
      ) : filteredMachineryList.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
          <Truck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Dự án hiện chưa có máy móc nào</p>
          <p className="text-xs text-slate-400 mt-1">Chọn dự án khác hoặc bấm "Đăng ký Máy móc mới" để gán thiết bị vào công trình này.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 w-[16%]">Mã & Chủng loại</th>
                  <th className="py-3 px-3.5 w-[28%]">Tên thiết bị / Biển số</th>
                  <th className="py-3 px-3.5 w-[24%]">Dự án quản lý</th>
                  <th className="py-3 px-3.5 w-[18%]">Lái máy / Phụ trách</th>
                  <th className="py-3 px-3.5 text-center w-[14%]">Hiện trạng</th>
                  {(isAdmin || canManage) && (
                    <th className="py-3 px-3.5 text-right w-[12%] whitespace-nowrap">Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMachineryList.map((mach: any) => {
                  let matchedProj = projects.find((p) => p.id === mach.projectId);
                  if (!matchedProj && mach.currentPackageId) {
                    const pkg = packages.find((p) => p.id === Number(mach.currentPackageId));
                    if (pkg) matchedProj = projects.find((p) => p.id === pkg.projectId);
                  }

                  const isActive = mach.status === 'active' || mach.status === 'operating';
                  const isMaintenance = mach.status === 'maintenance' || mach.status === 'broken';
                  const isTransferred = mach.status === 'transferred';

                  return (
                    <tr key={mach.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Mã & Chủng loại */}
                      <td className="py-3 px-3.5 align-middle">
                        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block text-[11px]">
                          {mach.code}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">{mach.type}</div>
                      </td>

                      {/* Tên & Biển số */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="font-bold text-slate-900 text-sm">{mach.name}</div>
                        {mach.licensePlate ? (
                          <span className="inline-block text-[11px] text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mt-1">
                            {mach.licensePlate}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic mt-1 block">Không có biển số</span>
                        )}
                        {mach.notes && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">{mach.notes}</p>
                        )}
                      </td>

                      {/* Dự án quản lý */}
                      <td className="py-3 px-3.5 align-middle">
                        {isTransferred ? (
                          <span className="inline-flex items-center gap-1 text-purple-600 font-medium italic">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Đang điều chuyển
                          </span>
                        ) : matchedProj || mach.projectName ? (
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {matchedProj ? `${matchedProj.code} - ${matchedProj.name}` : mach.projectName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa gán dự án</span>
                        )}
                      </td>

                      {/* Lái máy */}
                      <td className="py-3 px-3.5 align-middle">
                        {mach.driverName ? (
                          <div className="space-y-0.5">
                            <div className="font-medium text-slate-800 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{mach.driverName}</span>
                            </div>
                            {mach.driverPhone && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{mach.driverPhone}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chưa chỉ định</span>
                        )}
                      </td>

                      {/* Hiện trạng */}
                      <td className="py-3 px-3.5 text-center align-middle whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Đang hoạt động
                          </span>
                        ) : isMaintenance ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-red-50 text-red-700 border-red-200">
                            Bảo dưỡng / Hỏng
                          </span>
                        ) : isTransferred ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-purple-50 text-purple-700 border-purple-200">
                            Đang điều chuyển
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                            Chờ việc / Bãi
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      {(isAdmin || canManage) && (
                        <td className="py-3 px-3.5 text-right align-middle whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(mach)}
                              title="Chỉnh sửa hoặc điều chuyển máy"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-amber-600 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Sửa</span>
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(mach)}
                                title="Xóa thiết bị"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-white hover:bg-red-50 hover:border-red-300 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
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
        </div>
      )}

      {/* Modal Thêm & Cập nhật / Điều chuyển */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMachine ? 'Cập nhật Thông tin & Điều chuyển Máy móc' : 'Đăng ký Thiết bị Máy móc mới'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Dự án trực thuộc */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Dự án trực thuộc tiếp nhận <span className="text-red-500">*</span>
            </label>
            <select
              value={formProjectId}
              onChange={(e) => setFormProjectId(e.target.value ? Number(e.target.value) : '')}
              required={formStatus !== 'transferred'}
              disabled={Boolean(editingMachine && formStatus === 'transferred')}
              className={`w-full px-3 py-2 border rounded-lg font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                editingMachine && formStatus === 'transferred'
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-50/30 border-amber-300 cursor-pointer'
              }`}
            >
              <option value="">-- Chọn Dự án thi công tiếp nhận --</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.code} - {proj.name}
                </option>
              ))}
            </select>
            {editingMachine && formStatus === 'transferred' && (
              <p className="text-[11px] text-purple-600 mt-1 font-medium">
                * Khi chọn "Chuyển dự án", máy sẽ rút khỏi dự án này để vận chuyển. Khi đến công trường mới, người quản lý chỉ cần sửa máy và chọn lại dự án mới tiếp nhận.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Số hiệu / Mã máy <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="VD: CC-01, MX-02..."
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Chủng loại máy <span className="text-red-500">*</span>
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer font-medium"
              >
                {machineTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên thiết bị chi tiết <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="VD: Cần trục bánh xích Zoomlion QUY50"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-semibold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Biển số / Số đăng ký</label>
              <input
                type="text"
                value={formLicensePlate}
                onChange={(e) => setFormLicensePlate(e.target.value)}
                placeholder="VD: 29XA-7711"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            {/* Trạng thái máy */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tình trạng / Hiện trạng</label>
              {!editingMachine ? (
                <input
                  type="text"
                  disabled
                  value="Chờ việc / Bãi tập kết"
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 font-medium"
                />
              ) : editingMachine.status === 'active' || editingMachine.status === 'operating' ? (
                <select
                  value={formStatus === 'maintenance' || formStatus === 'broken' ? 'maintenance' : 'active'}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer font-medium"
                >
                  <option value="active">Đang hoạt động trong ca</option>
                  <option value="maintenance">Gặp sự cố: Báo hỏng / Bảo dưỡng</option>
                </select>
              ) : (
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer font-medium"
                >
                  <option value="idle">Sẵn sàng / Chờ việc tại bãi</option>
                  <option value="maintenance">Hỏng hóc / Đang bảo dưỡng</option>
                  <option value="transferred">Chuyển dự án (Đang vận chuyển)</option>
                </select>
              )}
              <p className="text-[10px] text-slate-500 mt-1">
                * Trạng thái "Đang hoạt động" sẽ tự kích hoạt khi máy được đưa vào Báo cáo ca ngày (08h / 20h).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lái máy / Người phụ trách</label>
              <input
                type="text"
                value={formDriverName}
                onChange={(e) => setFormDriverName(e.target.value)}
                placeholder="VD: Hoàng Minh Đức"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số điện thoại liên hệ</label>
              <input
                type="text"
                value={formDriverPhone}
                onChange={(e) => setFormDriverPhone(e.target.value)}
                placeholder="VD: 0945667788"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {formStatus === 'transferred' ? 'Ghi chú điều chuyển (Lý do, xe vận chuyển...)' : 'Ghi chú thiết bị'}
            </label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
              placeholder={formStatus === 'transferred' ? 'Ghi chú thông tin xe vận chuyển, dự kiến ngày đến...' : 'Ghi chú nguồn gốc, tình trạng bàn giao...'}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
            >
              {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {formStatus === 'transferred' ? 'Xác nhận chuyển dự án' : editingMachine ? 'Lưu thay đổi' : 'Đăng ký thiết bị'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};