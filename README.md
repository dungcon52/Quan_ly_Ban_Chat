# Hệ thống Quản lý Tiến độ Thi công Xây dựng (Construction Site Management System)

Dự án được xây dựng theo kiến trúc **Full-Stack chuẩn công nghiệp (Full-Stack TypeScript Architecture)**, bao gồm đầy đủ **Frontend (React 19)**, **Backend API Server (Node.js + Express 4)**, và **Cơ sở dữ liệu quan hệ (PostgreSQL Cloud SQL + Drizzle ORM)**.

---

## 1. Kiến trúc Tổng thể (System Architecture)

```
┌────────────────────────────────────────────────────────┐
│                   FRONTEND (React 19)                  │
│   • Vite 6 + Tailwind CSS v4 + Lucide Icons + Recharts │
│   • Multi-Role Authentication Context (JWT Bearer)     │
│   • Phân hệ: Dashboard, Gói thầu, Báo cáo 08h/20h      │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / REST APIs
                            ▼
┌────────────────────────────────────────────────────────┐
│               BACKEND SERVER (Node.js + Express)       │
│   • Entry point: server.ts (Port 3000)                 │
│   • API Router: src/server/routes.ts                   │
│   • JWT Authentication & Role-Based Access Control     │
│   • Scrypt Password Hashing & Security Guards          │
└───────────────────────────┬────────────────────────────┘
                            │ Drizzle ORM Queries
                            ▼
┌────────────────────────────────────────────────────────┐
│         DATABASE (PostgreSQL - Cloud SQL Instance)     │
│   • Tables: users, projects, packages, activities,     │
│             daily_work_reports, daily_work_report_items│
│   • Foreign Keys, Cascades & Relational Integrity       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Cấu trúc Thư mục Chuẩn (Project Directory Structure)

```
├── server.ts                  # Entry point máy chủ Express (Port 3000, Vite middleware & APIs)
├── drizzle.config.ts          # Cấu hình Drizzle ORM kết nối PostgreSQL
├── package.json               # Cấu hình phụ thuộc & scripts khởi chạy dev/build/start
├── tsconfig.json              # Thiết lập TypeScript cho toàn bộ project
├── vite.config.ts             # Cấu hình Vite bundler & Tailwind CSS plugin
├── index.html                 # Điểm vào HTML chính của ứng dụng
├── .env.example               # Mẫu khai báo các biến môi trường (Database, Port, Secret)
│
├── src/
│   ├── server/                # === TẦNG BACKEND (SERVER-SIDE) ===
│   │   └── routes.ts          # Toàn bộ hệ thống REST API endpoints & Middlewares
│   │
│   ├── db/                    # === TẦNG CƠ SỞ DỮ LIỆU (DATABASE) ===
│   │   ├── index.ts           # Khởi tạo connection pool pg và Drizzle ORM instance
│   │   ├── schema.ts          # Định nghĩa cấu trúc các bảng PostgreSQL và quan hệ (Relations)
│   │   ├── auth.ts            # Mã hóa mật khẩu (scrypt), phát hành và xác thực JWT token
│   │   └── seed.ts            # Khởi tạo dữ liệu mẫu (Tài khoản, Dự án, Gói thầu, Báo cáo)
│   │
│   ├── services/              # === TẦNG KẾT NỐI API (API CLIENT) ===
│   │   └── api.ts             # Axios client gọi các API endpoints từ Frontend tới Backend
│   │
│   ├── contexts/              # === QUẢN LÝ TRẠNG THÁI TOÀN CỤC ===
│   │   └── AuthContext.tsx    # Lưu trữ phiên đăng nhập, thông tin tài khoản & quyền hạn
│   │
│   ├── components/            # === CÁC THÀNH PHẦN UI TÁI SỬ DỤNG ===
│   │   ├── Header.tsx         # Thanh điều hướng trên, thông tin tài khoản & đăng xuất
│   │   ├── Sidebar.tsx        # Menu chức năng theo phân quyền & chỉ báo hệ thống
│   │   ├── Modal.tsx          # Hộp thoại modal tương tác
│   │   ├── Layout.tsx         # Khung giao diện chuẩn
│   │   └── SystemStatusModal.tsx # Kiểm tra trạng thái Backend & Database thời gian thực
│   │
│   ├── pages/                 # === CÁC TRANG CHỨC NĂNG (FRONTEND) ===
│   │   ├── LoginPage.tsx              # Màn hình đăng nhập & tra cứu tài khoản
│   │   ├── DashboardOverview.tsx      # Tổng quan tiến độ dự án & cảnh báo công trường
│   │   ├── ProjectsManagement.tsx     # Quản lý danh mục dự án
│   │   ├── ProjectDetail.tsx          # Chi tiết dự án và danh sách gói thầu
│   │   ├── PackageDetail.tsx          # Dashboard gói thầu, tiến độ công tác & nhân công
│   │   ├── DailyReportForm.tsx        # Lập phiếu báo cáo thi công ca sáng (08h) & ca tối (20h)
│   │   ├── DailyReportsList.tsx       # Nhật ký danh sách tất cả các báo cáo ca
│   │   ├── ReportingStatusPage.tsx    # Theo dõi kỷ luật nộp báo cáo ca của các gói thầu
│   │   ├── DifficultiesProposals.tsx  # Theo dõi & phê duyệt vướng mắc, kiến nghị
│   │   └── UsersManagement.tsx        # Quản trị tài khoản & phân quyền (Chỉ dành cho Admin)
│   │
│   ├── types/
│   │   └── index.ts           # Toàn bộ Types & Interfaces dùng chung cho hệ thống
│   │
│   ├── App.tsx                # Định tuyến React Router v7 & kiểm soát quyền truy cập
│   ├── main.tsx               # Khởi chạy ứng dụng React
│   └── index.css              # Global styles với Tailwind CSS v4
```

---

## 3. Cơ sở Dữ liệu Quan hệ (PostgreSQL Database Schema)

Hệ thống lưu trữ trên **PostgreSQL (Cloud SQL)** với 6 bảng cốt lõi:

1. **`users`**: Tài khoản người dùng (`id`, `username`, `password_hash`, `full_name`, `role`, `is_active`, `created_at`).
2. **`projects`**: Thông tin các dự án công trình (`id`, `code`, `name`, `location`, `start_date`, `planned_end_date`, `status`, `notes`).
3. **`user_projects`**: Phân công kỹ sư/chỉ huy trưởng phụ trách dự án (`id`, `user_id`, `project_id`).
4. **`packages`**: Các gói thầu thuộc dự án (`id`, `project_id`, `code`, `name`, `responsible_user_id`, `start_date`, `end_date`, `status`).
5. **`activities`**: Danh mục công tác thi công thuộc từng gói thầu (`id`, `package_id`, `code`, `name`, `unit`, `planned_quantity`, `location`, `status`).
6. **`daily_work_reports`**: Phiếu báo cáo thi công ca ngày (`id`, `package_id`, `report_date`, `report_type` [morning/evening], `created_by`, `manpower`, `night_shift`, `difficulties`, `proposals`).
7. **`daily_work_report_items`**: Chi tiết sản lượng từng công tác trong ca (`id`, `daily_report_id`, `activity_id`, `location`, `quantity`, `progress_percent`, `notes`).

---

## 4. Hệ thống REST API (Backend Endpoints)

| Nhóm chức năng | Phương thức | Endpoint | Mô tả | Phân quyền |
| :--- | :--- | :--- | :--- | :--- |
| **Hệ thống** | `GET` | `/api/health` | Kiểm tra trạng thái máy chủ | Public |
| | `GET` | `/api/system/info` | Thống kê số bản ghi thực tế trong PostgreSQL | Public |
| **Xác thực** | `POST` | `/api/auth/login` | Đăng nhập tài khoản & nhận JWT token | Public |
| | `GET` | `/api/auth/me` | Lấy thông tin tài khoản hiện tại | Đã đăng nhập |
| **Người dùng** | `GET` | `/api/users` | Lấy danh sách tài khoản | Admin |
| | `POST` | `/api/users` | Tạo tài khoản mới (Mã hóa scrypt) | Admin |
| | `PUT` | `/api/users/:id` | Cập nhật tài khoản / Đổi mật khẩu | Admin |
| **Dự án** | `GET` | `/api/projects` | Danh sách dự án | Mọi vai trò |
| | `POST` | `/api/projects` | Tạo dự án mới | Admin / Manager |
| | `GET` | `/api/projects/:id`| Chi tiết dự án và gói thầu | Mọi vai trò |
| **Gói thầu** | `GET` | `/api/packages` | Danh sách gói thầu | Mọi vai trò |
| | `GET` | `/api/packages/:id`| Chi tiết gói thầu & công tác | Mọi vai trò |
| | `POST` | `/api/packages` | Tạo gói thầu mới | Admin / Manager |
| | `GET` | `/api/dashboard/packages/:id` | Báo cáo phân tích tiến độ, nhân công | Mọi vai trò |
| **Báo cáo ngày** | `GET` | `/api/daily-reports` | Lịch sử các báo cáo ca | Mọi vai trò |
| | `POST` | `/api/daily-reports` | Lập báo cáo ca mới (Sáng 08h / Tối 20h) | Mọi vai trò |
| | `GET` | `/api/reporting-status` | Kiểm tra tình trạng nộp báo cáo các gói | Mọi vai trò |
| **Vướng mắc** | `GET` | `/api/issues` | Danh sách vướng mắc & kiến nghị | Mọi vai trò |
| | `POST` | `/api/issues/:id/resolve-difficulty` | Đánh dấu đã giải quyết vướng mắc | Manager / Admin |

---

## 5. Tài khoản & Phân quyền Truy cập

Tất cả các tài khoản mặc định đã được cấp mật khẩu ban đầu là: **`123456`**

- **Quản trị viên (`admin`):** Toàn quyền quản trị hệ thống, quản lý tài khoản người dùng, tạo/sửa/xóa dự án, gói thầu và công tác.
- **Chỉ huy trưởng (`cht_an`):** Giám sát tiến độ các gói thầu, xử lý vướng mắc, xem bảng phân tích dashboard và tình trạng báo cáo.
- **Kỹ thuật hiện trường (`kt_bao`):** Chuyên trách lập phiếu báo cáo thi công ca sáng (08:00) và ca tối (20:00), cập nhật số lượng nhân công và khối lượng hoàn thành.

---

## 6. Hướng dẫn Chạy Ứng dụng

### Chạy chế độ Phát triển (Development)
```bash
npm run dev
# Khởi động máy chủ Express tại port 3000 với tsx và Vite middleware
```

### Kiểm tra cú pháp và kiểu dữ liệu (Linting)
```bash
npm run lint
```

### Đóng gói Production (Production Build)
```bash
npm run build
# 1. Biên dịch Frontend thành các static files trong thư mục /dist
# 2. Biên dịch Backend server.ts thành file bundle dist/server.cjs duy nhất
```

### Khởi chạy Production
```bash
npm start
# Khởi chạy máy chủ node dist/server.cjs phục vụ cả API và static frontend
```
