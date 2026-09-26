import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { LoginPage } from './pages/LoginPage.tsx';

import { DashboardOverview } from './pages/DashboardOverview.tsx';
import { ProjectDetail } from './pages/ProjectDetail.tsx';
import { PackageDashboard } from './pages/PackageDashboard.tsx';
import { DailyReportForm } from './pages/DailyReportForm.tsx';
import { DailyReportsList } from './pages/DailyReportsList.tsx';
import { IssuesProposalsPage } from './pages/IssuesProposalsPage.tsx';
import { ProjectsManagement } from './pages/ProjectsManagement.tsx';
import { PackagesManagement } from './pages/PackagesManagement.tsx';
import { ActivitiesManagement } from './pages/ActivitiesManagement.tsx';
import { MachineryManagement } from './pages/MachineryManagement.tsx';
import { UsersManagement } from './pages/UsersManagement.tsx';
import { RefreshCw } from 'lucide-react';

const AppLayout: React.FC = () => {
  const { currentUser, loading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm font-medium">Đang tải phiên làm việc...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-60 min-w-0">
        {/* Top Header */}
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            {/* 1. Tổng quan (Dashboard) */}
            <Route path="/" element={<DashboardOverview />} />

            {/* 2. Dự án (Projects & Project Detail) */}
            <Route path="/projects" element={<ProjectsManagement />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />

            {/* 3. Gói thầu (Packages & Package Dashboard) */}
            <Route path="/packages" element={<PackagesManagement />} />
            <Route path="/packages/:id" element={<PackageDashboard />} />

            {/* 4. Công tác (Activities Management) */}
            <Route path="/activities" element={<ActivitiesManagement />} />

            {/* 4.1 Máy móc thiết bị (Machinery Management) */}
            <Route path="/machinery" element={<MachineryManagement />} />

            {/* 5. Báo cáo ngày (Daily Reports) */}
            <Route path="/daily-reports" element={<DailyReportsList />} />
            <Route path="/daily-reports/new" element={<DailyReportForm />} />

            {/* 7. Vướng mắc & Đề xuất */}
            <Route path="/issues" element={<IssuesProposalsPage />} />

            {/* 8. Quản trị Người dùng (Admin only) */}
            {isAdmin && <Route path="/users" element={<UsersManagement />} />}

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
