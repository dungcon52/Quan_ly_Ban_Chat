export type UserRole = 'admin' | 'manager' | 'site_entry';

export interface User {
id: number;
  username: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  position?: string | null;
  department?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: number;
  code: string;
  name: string;
  location?: string;
  startDate?: string;
  plannedEndDate?: string;
  status: 'planned' | 'active' | 'completed' | 'delayed' | 'cancelled';
  notes?: string;
  packageCount?: number;
  activePackages?: number;
  delayedPackages?: number;
  hasNightShift?: boolean;
  latestReportDate?: string | null;
  unresolvedDifficultiesCount?: number;
  unresolvedProposalsCount?: number;
  currentManpower?: number;
  currentMachinery?: number;
}

export interface Package {
  id: number;
  projectId: number;
  code: string;
  name: string;
  responsibleUserId?: number | null;
  responsibleUser?: string;
  projectName?: string;
  startDate?: string;
  endDate?: string;
  progressPercent?: number | null;
  progressAdjustment?: number | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  notes?: string;
  activitiesCount?: number;
  overallProgress?: number;
  latestReportDate?: string | null;
  nightShiftActive?: boolean;
  openDifficulties?: number;
  openProposals?: number;
  currentManpower?: number;
  currentMachinery?: number;
}

export interface DelayedActivity {
  activityId: number;
  activityName: string;
  packageId: number;
  packageName: string;
  packageCode: string;
  projectId: number;
  projectName: string;
  progressPercent: number;
  startDate?: string | null;
  endDate?: string | null;
  delayDays: number;
}

export interface Activity {
  id: number;
  packageId: number;
  code: string;
  name: string;
  unit?: string | null;
  plannedQuantity?: number | null;
  actualVolume?: number | null;
  progressPercent?: number | null;
  startDate?: string;
  endDate?: string;
  location?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  notes?: string;
  actualCumulative?: number | null;
  completionPercent?: number;
  progressAdjustment?: number | null;
  cumulativeAdjustment?: number | null;
  isQuantityBased?: boolean;
  packageName?: string;
  packageCode?: string;
}

export interface DailyReportItem {
  id?: number;
  activityId: number;
  activityName?: string;
  activityCode?: string;
  unit?: string | null;
  plannedQuantity?: number | null;
  location?: string;
  quantity?: number | null;
  progressPercent?: number | null;
  notes?: string;
}

export interface DailyReport {
  id: number;
  packageId: number;
  packageName?: string;
  packageCode?: string;
  projectName?: string;
  reportDate: string;
  reportType: 'morning' | 'evening';
  createdBy: number;
  creatorName?: string;
  manpower: number;
  nightShift: boolean;
  notes?: string;
  difficulties?: string;
  difficultiesStatus?: 'open' | 'resolved';
  difficultiesResolvedAt?: string;
  proposals?: string;
  proposalsStatus?: 'open' | 'resolved';
  proposalsResolvedAt?: string;
  createdAt?: string;
  items?: DailyReportItem[];
  itemsCount?: number;
  machinery?: DailyReportMachinery[];
  machineryCount?: number;
}

export interface Machinery {
  id: number;
  code: string;
  name: string;
  licensePlate?: string | null;
  type: string;
  currentPackageId?: number | null;
  currentPackageName?: string | null;
  currentPackageCode?: string | null;
  assignedDate?: string | null;
  status: 'active' | 'idle' | 'maintenance';
  driverName?: string | null;
  driverPhone?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  transfersCount?: number;
  totalOperatingHours?: number;
}

export interface MachineryTransfer {
  id: number;
  machineryId: number;
  machineryName?: string;
  machineryCode?: string;
  machineryType?: string;
  fromPackageId?: number | null;
  fromPackageName?: string | null;
  fromPackageCode?: string | null;
  toPackageId: number;
  toPackageName?: string;
  toPackageCode?: string;
  transferDate: string;
  reason?: string | null;
  transferredBy?: number | null;
  transferredByName?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface DailyReportMachinery {
  id?: number;
  dailyReportId?: number;
  machineryId: number;
  name?: string;
  code?: string;
  licensePlate?: string | null;
  type?: string;
  operatingHours?: number;
  fuelLiters?: number | null;
  status: 'operating' | 'standby' | 'broken';
  notes?: string | null;
}

export interface PackageReportingStatus {
  packageId: number;
  packageCode: string;
  packageName: string;
  projectName: string;
  responsibleUser: string;
  morning: {
    reported: boolean;
    reportId?: number;
    reporter?: string;
    manpower?: number;
    nightShift?: boolean;
  };
  evening: {
    reported: boolean;
    reportId?: number;
    reporter?: string;
    manpower?: number;
    nightShift?: boolean;
  };
  nightShiftActive: boolean;
  currentManpower: number;
  machineryCount: number;
}
