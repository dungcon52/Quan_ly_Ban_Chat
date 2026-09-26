import { pgTable, serial, text, integer, boolean, timestamp, doublePrecision } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone'), // Số điện thoại liên hệ
  email: text('email'), // Email công việc
  position: text('position'), // Chức vụ BCH (vd: Chỉ huy phó, Kỹ thuật thi công...)
  department: text('department'), // Bộ phận / Hạng mục phụ trách (vd: Kết cấu, MEP, QS...)
  role: text('role').notNull(), // 'admin' | 'manager' | 'site_entry'
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  location: text('location'),
  startDate: text('start_date'),
  plannedEndDate: text('planned_end_date'),
  status: text('status').notNull().default('active'), // 'planned' | 'active' | 'completed' | 'delayed' | 'cancelled'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User Project assignments
export const userProjects = pgTable('user_projects', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  projectId: integer('project_id').references(() => projects.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Packages table
export const packages = pgTable('packages', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id).notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  responsibleUserId: integer('responsible_user_id').references(() => users.id),
  startDate: text('start_date'),
  endDate: text('end_date'),
  progressPercent: doublePrecision('progress_percent'),
  progressAdjustment: doublePrecision('progress_adjustment'),
  status: text('status').notNull().default('in_progress'), // 'not_started' | 'in_progress' | 'completed' | 'delayed'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Activities table
export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  packageId: integer('package_id').references(() => packages.id).notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  unit: text('unit'), // 'm3', 'tấn', 'm2', etc.
  plannedQuantity: doublePrecision('planned_quantity'), // null if % based
  actualVolume: doublePrecision('actual_volume'),
  progressPercent: doublePrecision('progress_percent'),
  progressAdjustment: doublePrecision('progress_adjustment'),
  cumulativeAdjustment: doublePrecision('cumulative_adjustment'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  location: text('location'), // e.g. VT01-VT20, Zone 1
  status: text('status').notNull().default('in_progress'), // 'not_started' | 'in_progress' | 'completed' | 'delayed'
  isCritical: boolean('is_critical').default(false).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Daily Work Reports table
export const dailyWorkReports = pgTable('daily_work_reports', {
  id: serial('id').primaryKey(),
  packageId: integer('package_id').references(() => packages.id).notNull(),
  reportDate: text('report_date').notNull(), // YYYY-MM-DD
  reportType: text('report_type').notNull(), // 'morning' | 'evening'
  createdBy: integer('created_by').references(() => users.id).notNull(),
  manpower: integer('manpower').notNull().default(0),
  nightShift: boolean('night_shift').notNull().default(false),
  notes: text('notes'),
  difficulties: text('difficulties'),
  difficultiesStatus: text('difficulties_status').default('open'), // 'open' | 'resolved'
  difficultiesResolvedAt: timestamp('difficulties_resolved_at'),
  difficultiesResolvedBy: integer('difficulties_resolved_by').references(() => users.id),
  proposals: text('proposals'),
  proposalsStatus: text('proposals_status').default('open'), // 'open' | 'resolved'
  proposalsResolvedAt: timestamp('proposals_resolved_at'),
  proposalsResolvedBy: integer('proposals_resolved_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Daily Work Report Items table
export const dailyWorkReportItems = pgTable('daily_work_report_items', {
  id: serial('id').primaryKey(),
  dailyReportId: integer('daily_report_id').references(() => dailyWorkReports.id, { onDelete: 'cascade' }).notNull(),
  activityId: integer('activity_id').references(() => activities.id).notNull(),
  location: text('location'),
  quantity: doublePrecision('quantity'),
  progressPercent: doublePrecision('progress_percent'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Machinery / Equipment table
export const machinery = pgTable('machinery', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // Tên máy, ví dụ: "Máy xúc bánh xích Komatsu PC200"
  code: text('code').notNull().unique(), // Mã / Số hiệu máy, ví dụ: "MX-01"
  licensePlate: text('license_plate'), // Biển kiểm soát nếu có
  type: text('type').notNull().default('Máy xúc đào'), // 'Máy xúc đào' | 'Máy ủi' | 'Xe lu rung' | 'Cần cẩu' | 'Xe bồn' | 'Xe tải ben' | 'Máy khoan cọc' | 'Khác'
  currentPackageId: integer('current_package_id').references(() => packages.id), // Nullable if in central yard / kho bãi
  assignedDate: text('assigned_date'), // YYYY-MM-DD
  status: text('status').notNull().default('active'), // 'active' (đang làm việc) | 'idle' (rảnh / kho) | 'maintenance' (bảo dưỡng / hỏng)
  driverName: text('driver_name'), // Lái máy / người vận hành
  driverPhone: text('driver_phone'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Machinery Transfers history
export const machineryTransfers = pgTable('machinery_transfers', {
  id: serial('id').primaryKey(),
  machineryId: integer('machinery_id').references(() => machinery.id, { onDelete: 'cascade' }).notNull(),
  fromPackageId: integer('from_package_id').references(() => packages.id),
  toPackageId: integer('to_package_id').references(() => packages.id).notNull(),
  transferDate: text('transfer_date').notNull(), // YYYY-MM-DD
  reason: text('reason'), // Lý do điều chuyển máy
  transferredBy: integer('transferred_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Daily Work Report Machinery usage
export const dailyWorkReportMachinery = pgTable('daily_work_report_machinery', {
  id: serial('id').primaryKey(),
  dailyReportId: integer('daily_report_id').references(() => dailyWorkReports.id, { onDelete: 'cascade' }).notNull(),
  machineryId: integer('machinery_id').references(() => machinery.id).notNull(),
  operatingHours: doublePrecision('operating_hours').default(8), // Số giờ máy hoạt động trong ca
  fuelLiters: doublePrecision('fuel_liters'), // Nhiên liệu tiêu thụ (lít)
  status: text('status').notNull().default('operating'), // 'operating' | 'standby' | 'broken'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  responsiblePackages: many(packages),
  createdReports: many(dailyWorkReports),
  assignedProjects: many(userProjects),
  transferredMachinery: many(machineryTransfers),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  packages: many(packages),
  userProjects: many(userProjects),
}));

export const packagesRelations = relations(packages, ({ one, many }) => ({
  project: one(projects, {
    fields: [packages.projectId],
    references: [projects.id],
  }),
  responsibleUser: one(users, {
    fields: [packages.responsibleUserId],
    references: [users.id],
  }),
  activities: many(activities),
  dailyReports: many(dailyWorkReports),
  assignedMachinery: many(machinery),
  transfersFrom: many(machineryTransfers, { relationName: 'transfersFrom' }),
  transfersTo: many(machineryTransfers, { relationName: 'transfersTo' }),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  package: one(packages, {
    fields: [activities.packageId],
    references: [packages.id],
  }),
  reportItems: many(dailyWorkReportItems),
}));

export const dailyWorkReportsRelations = relations(dailyWorkReports, ({ one, many }) => ({
  package: one(packages, {
    fields: [dailyWorkReports.packageId],
    references: [packages.id],
  }),
  creator: one(users, {
    fields: [dailyWorkReports.createdBy],
    references: [users.id],
  }),
  items: many(dailyWorkReportItems),
  machineryList: many(dailyWorkReportMachinery),
}));

export const dailyWorkReportItemsRelations = relations(dailyWorkReportItems, ({ one }) => ({
  report: one(dailyWorkReports, {
    fields: [dailyWorkReportItems.dailyReportId],
    references: [dailyWorkReports.id],
  }),
  activity: one(activities, {
    fields: [dailyWorkReportItems.activityId],
    references: [activities.id],
  }),
}));

export const machineryRelations = relations(machinery, ({ one, many }) => ({
  currentPackage: one(packages, {
    fields: [machinery.currentPackageId],
    references: [packages.id],
  }),
  transfers: many(machineryTransfers),
  dailyUsages: many(dailyWorkReportMachinery),
}));

export const machineryTransfersRelations = relations(machineryTransfers, ({ one }) => ({
  machinery: one(machinery, {
    fields: [machineryTransfers.machineryId],
    references: [machinery.id],
  }),
  fromPackage: one(packages, {
    fields: [machineryTransfers.fromPackageId],
    references: [packages.id],
    relationName: 'transfersFrom',
  }),
  toPackage: one(packages, {
    fields: [machineryTransfers.toPackageId],
    references: [packages.id],
    relationName: 'transfersTo',
  }),
  user: one(users, {
    fields: [machineryTransfers.transferredBy],
    references: [users.id],
  }),
}));

export const dailyWorkReportMachineryRelations = relations(dailyWorkReportMachinery, ({ one }) => ({
  report: one(dailyWorkReports, {
    fields: [dailyWorkReportMachinery.dailyReportId],
    references: [dailyWorkReports.id],
  }),
  machinery: one(machinery, {
    fields: [dailyWorkReportMachinery.machineryId],
    references: [machinery.id],
  }),
}));
