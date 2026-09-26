import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/index.ts';
import {
  users,
  projects,
  packages,
  activities,
  dailyWorkReports,
  dailyWorkReportItems,
  userProjects,
  machinery,
  machineryTransfers,
  dailyWorkReportMachinery,
} from '../db/schema.ts';
import { eq, and, desc, asc, sql, inArray, ne, or, ilike, not } from 'drizzle-orm';
import { verifyToken, generateToken, hashPassword, verifyPassword, TokenPayload } from '../db/auth.ts';

export const apiRouter = Router();

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// ----------------------------------------------------
// HELPER: DATE FORMATTING & PARSING (Chống lỗi tuyệt đối)
// ----------------------------------------------------

function formatDateDDMMYYYY(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function parseDateToTimestamp(dateStr: string | null | undefined, isEndOfDay = false): number | null {
  if (!dateStr) return null;
  let cleanStr = dateStr.trim();
  
  if (cleanStr.includes('/')) {
    const parts = cleanStr.split('/');
    if (parts.length === 3) {
      cleanStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  const timeSuffix = isEndOfDay ? 'T23:59:59' : 'T00:00:00';
  const timestamp = new Date(`${cleanStr}${timeSuffix}`).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

// ----------------------------------------------------
// AUTHENTICATION & MIDDLEWARES
// ----------------------------------------------------

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
      return next();
    }
  }

  const activeUserIdHeader = req.headers['x-user-id'];
  if (activeUserIdHeader) {
    const uid = Number(activeUserIdHeader);
    const [foundUser] = await db.select().from(users).where(eq(users.id, uid));
    if (foundUser && foundUser.isActive) {
      req.user = {
        userId: foundUser.id,
        username: foundUser.username,
        fullName: foundUser.fullName,
        role: foundUser.role as 'admin' | 'manager' | 'site_entry',
      };
      return next();
    }
  }

  const [firstAdmin] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  if (firstAdmin) {
    req.user = {
      userId: firstAdmin.id,
      username: firstAdmin.username,
      fullName: firstAdmin.fullName,
      role: 'admin',
    };
    return next();
  }

  return res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn' });
}

export function requireRole(allowedRoles: ('admin' | 'manager' | 'site_entry')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này.' });
    }
    next();
  };
}

// ----------------------------------------------------
// CALCULATION ENGINES
// ----------------------------------------------------

async function calculatePackageProgress(packageId: number): Promise<number> {
  const pkgActivities = await db.select().from(activities).where(eq(activities.packageId, packageId));
  if (pkgActivities.length === 0) return 0;
  const progressValues = await Promise.all(pkgActivities.map((activity) => calculateActivityProgress(activity)));
  return Math.round(progressValues.reduce((sum, progress) => sum + progress.completionPercent, 0) / pkgActivities.length);
}

async function calculatePackageSchedule(packageId: number) {
  const packageActivities = await db
    .select({ startDate: activities.startDate, endDate: activities.endDate })
    .from(activities)
    .where(eq(activities.packageId, packageId));

  const startDates = packageActivities
    .map((activity) => activity.startDate)
    .filter((date): date is string => Boolean(date))
    .sort();
  const endDates = packageActivities
    .map((activity) => activity.endDate)
    .filter((date): date is string => Boolean(date))
    .sort();

  return {
    startDate: startDates[0] || null,
    endDate: endDates[endDates.length - 1] || null,
    startDateFormatted: formatDateDDMMYYYY(startDates[0]),
    endDateFormatted: formatDateDDMMYYYY(endDates[endDates.length - 1]),
  };
}

async function calculatePackageStatus(packageId: number, fallbackStatus: string): Promise<string> {
  const pkgActivities = await db.select().from(activities).where(eq(activities.packageId, packageId));
  if (pkgActivities.length === 0) {
    return fallbackStatus || 'not_started';
  }

  let hasDelayedCritical = false;
  let hasAtRiskCritical = false;
  let hasDelayedNormal = false;
  let hasAtRiskNormal = false;
  let allCompleted = true;

  for (const act of pkgActivities) {
    const actProg = await calculateActivityProgress(act);
    const isCritical = Boolean((act as any).isCritical);

    if (actProg.status !== 'completed') {
      allCompleted = false;
    }

    if (actProg.status === 'delayed') {
      if (isCritical) hasDelayedCritical = true;
      else hasDelayedNormal = true;
    } else if (actProg.status === 'at_risk') {
      if (isCritical) hasAtRiskCritical = true;
      else hasAtRiskNormal = true;
    }
  }

  if (allCompleted) return 'completed';
  if (hasDelayedCritical || hasDelayedNormal) return 'delayed';
  if (hasAtRiskCritical || hasAtRiskNormal) return 'at_risk';
  
  return fallbackStatus === 'paused' ? 'paused' : 'in_progress';
}

async function calculateActivityAutomaticValues(activityId: number, plannedQuantity: number | null) {
  if (plannedQuantity && plannedQuantity > 0) {
    const items = await db
      .select({ quantity: dailyWorkReportItems.quantity })
      .from(dailyWorkReportItems)
      .where(eq(dailyWorkReportItems.activityId, activityId));
    const actualCumulative = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    return {
      actualCumulative: actualCumulative > 0 ? actualCumulative : null,
      completionPercent: Math.min(100, Math.round((actualCumulative / plannedQuantity) * 100)),
    };
  }

  const latestItems = await db
    .select({ progress: dailyWorkReportItems.progressPercent })
    .from(dailyWorkReportItems)
    .innerJoin(dailyWorkReports, eq(dailyWorkReportItems.dailyReportId, dailyWorkReports.id))
    .where(eq(dailyWorkReportItems.activityId, activityId))
    .orderBy(desc(dailyWorkReports.reportDate), desc(dailyWorkReports.id))
    .limit(1);

  return {
    actualCumulative: null,
    completionPercent: Number(latestItems[0]?.progress) || 0,
  };
}

async function calculateActivityProgress(activity: typeof activities.$inferSelect) {
  const automatic = await calculateActivityAutomaticValues(activity.id, activity.plannedQuantity);
  const planned = Number(activity.plannedQuantity) || 0;

  let actualVolume: number | null = null;
  const anyAct = activity as any;
  if (anyAct.actualVolume !== null && anyAct.actualVolume !== undefined) {
    actualVolume = Number(anyAct.actualVolume);
  } else if (anyAct.actualCumulative !== null && anyAct.actualCumulative !== undefined) {
    actualVolume = Number(anyAct.actualCumulative);
  } else if (automatic.actualCumulative !== null && automatic.actualCumulative > 0) {
    actualVolume = automatic.actualCumulative + (anyAct.cumulativeAdjustment ?? 0);
  }

  let completionPercent = 0;
  if (planned > 0 && actualVolume !== null) {
    completionPercent = Math.max(0, Math.min(100, Math.round((actualVolume / planned) * 100)));
  } else if (anyAct.progressPercent !== null && anyAct.progressPercent !== undefined) {
    completionPercent = Math.max(0, Math.min(100, Number(anyAct.progressPercent)));
  } else {
    completionPercent = Math.max(0, Math.min(100, automatic.completionPercent + (anyAct.progressAdjustment ?? 0)));
  }

  let finalStatus = activity.status;
  if (completionPercent >= 100) {
    finalStatus = 'completed';
  }

  const computedStatus = getProgressStatus(
    completionPercent,
    activity.startDate,
    activity.endDate,
    finalStatus || 'in_progress'
  );

  return {
    actualVolume,
    actualCumulative: actualVolume,
    completionPercent,
    status: computedStatus,
  };
}

function getProgressStatus(
  progress: number,
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  fallbackStatus: string
) {
  if (progress >= 100) return 'completed';

  const start = parseDateToTimestamp(startDate, false);
  const end = parseDateToTimestamp(endDate, true);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (start !== null && todayStart < start && progress <= 0) {
    return 'not_started';
  }

  if (progress > 0 && (fallbackStatus === 'not_started' || !fallbackStatus)) {
    fallbackStatus = 'in_progress';
  }

  if (start !== null && end !== null && end > start) {
    if (todayStart >= start) {
      if (todayStart > end && progress < 100) {
        return 'delayed';
      }

      const totalDuration = end - start;
      const elapsed = Math.min(todayStart, end) - start;
      const plannedProgress = (elapsed / totalDuration) * 100;

      if (progress + 0.5 < plannedProgress) {
        return 'at_risk';
      }
    }
  }

  return progress > 0 ? 'in_progress' : (fallbackStatus || 'not_started');
}

// ----------------------------------------------------
// 1. AUTHENTICATION & USERS ROUTES
// ----------------------------------------------------

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role as any,
    };
    res.json({ token: generateToken(payload), user: payload });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi đăng nhập' });
  }
});

apiRouter.get('/auth/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const [dbUser] = await db.select().from(users).where(eq(users.id, req.user!.userId));
  res.json({ user: req.user, details: dbUser });
});

apiRouter.get('/users', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const list = await db.select().from(users).orderBy(asc(users.id));
  res.json(list);
});

// ----------------------------------------------------
// 2. PROJECTS ROUTES
// ----------------------------------------------------

apiRouter.get('/projects', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allProjects = await db.select().from(projects).orderBy(asc(projects.id));
    const projectStats = await Promise.all(
      allProjects.map(async (prj) => {
        const pkgs = await db.select().from(packages).where(eq(packages.projectId, prj.id));
        return {
          ...prj,
          startDate: formatDateDDMMYYYY(prj.startDate),
          plannedEndDate: formatDateDDMMYYYY(prj.plannedEndDate),
          packageCount: pkgs.length,
        };
      })
    );
    res.json(projectStats);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách dự án' });
  }
});

async function handleGetProjectDetail(req: AuthenticatedRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) return res.status(404).json({ error: 'Không tìm thấy dự án' });

    const rawPackages = await db
      .select({
        package: packages,
        responsibleUser: { id: users.id, fullName: users.fullName },
      })
      .from(packages)
      .leftJoin(users, eq(packages.responsibleUserId, users.id))
      .where(eq(packages.projectId, id))
      .orderBy(asc(packages.id));

    const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date());

    const pkgsWithProgress = await Promise.all(
      rawPackages.map(async ({ package: pkg, responsibleUser }) => {
        const pkgActivities = await db.select().from(activities).where(eq(activities.packageId, pkg.id));
        const pkgReports = await db
          .select()
          .from(dailyWorkReports)
          .where(eq(dailyWorkReports.packageId, pkg.id))
          .orderBy(desc(dailyWorkReports.reportDate), desc(dailyWorkReports.id));

        const latestReport = pkgReports[0] || null;
        const todayReports = pkgReports.filter((r) => r.reportDate === todayStr);
        const latestReportToday = todayReports[0] || null;

        const pkgMachineryToday = await db
          .select({ machineryId: dailyWorkReportMachinery.machineryId })
          .from(dailyWorkReportMachinery)
          .innerJoin(dailyWorkReports, eq(dailyWorkReportMachinery.dailyReportId, dailyWorkReports.id))
          .where(and(eq(dailyWorkReports.packageId, pkg.id), eq(dailyWorkReports.reportDate, todayStr)));

        const activityProgress = await Promise.all(pkgActivities.map((activity) => calculateActivityProgress(activity)));
        const automaticProgress = pkgActivities.length > 0
          ? Math.round(activityProgress.reduce((sum, item) => sum + item.completionPercent, 0) / pkgActivities.length)
          : 0;
        
        const schedule = await calculatePackageSchedule(pkg.id);
        const smartStatus = await calculatePackageStatus(pkg.id, pkg.status);

        return {
          ...pkg,
          ...schedule,
          startDate: formatDateDDMMYYYY(pkg.startDate),
          endDate: formatDateDDMMYYYY(pkg.endDate),
          responsibleUser: responsibleUser?.fullName || 'Chưa phân công',
          activitiesCount: pkgActivities.length,
          overallProgress: automaticProgress,
          status: smartStatus,
          latestReportDate: formatDateDDMMYYYY(latestReport?.reportDate),
          currentManpower: latestReportToday?.manpower ?? (latestReport?.reportDate === todayStr ? latestReport.manpower : 0),
          currentMachinery: new Set(pkgMachineryToday.map((m) => m.machineryId)).size,
        };
      })
    );

    const packageIds = rawPackages.map(p => p.package.id);
    let projectMachineryStats = { total: 0, operating: 0, standby: 0, maintenance: 0 };

    if (packageIds.length > 0) {
      const projectMachines = await db
        .select()
        .from(machinery)
        .where(inArray(machinery.currentPackageId, packageIds));

      projectMachineryStats.total = projectMachines.length;
      projectMachineryStats.operating = projectMachines.filter(m => m.status === 'active').length;
      projectMachineryStats.standby = projectMachines.filter(m => m.status === 'idle').length;
      projectMachineryStats.maintenance = projectMachines.filter(m => m.status === 'maintenance' || m.status === 'broken').length;
    }

    const totalProjectManpower = pkgsWithProgress.reduce((sum, p) => sum + p.currentManpower, 0);

    res.json({
      project: {
        ...project,
        startDate: formatDateDDMMYYYY(project.startDate),
        plannedEndDate: formatDateDDMMYYYY(project.plannedEndDate),
        currentManpower: totalProjectManpower,
        currentMachinery: projectMachineryStats.operating,
      },
      packages: pkgsWithProgress,
      currentManpower: totalProjectManpower,
      currentMachinery: projectMachineryStats.operating,
      machineryStats: projectMachineryStats,
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy thông tin dự án' });
  }
}

apiRouter.get('/projects/:id', authMiddleware, handleGetProjectDetail);
apiRouter.get('/dashboard/projects/:id', authMiddleware, handleGetProjectDetail);

apiRouter.post('/projects', authMiddleware, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, name, location, startDate, plannedEndDate, status, notes } = req.body;
    const [created] = await db.insert(projects).values({ code, name, location, startDate, plannedEndDate, status, notes }).returning();
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo dự án' });
  }
});

apiRouter.put('/projects/:id', authMiddleware, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { code, name, location, startDate, plannedEndDate, status, notes } = req.body;
    const [updated] = await db.update(projects).set({ code, name, location, startDate, plannedEndDate, status, notes, updatedAt: new Date() }).where(eq(projects.id, id)).returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật dự án' });
  }
});

apiRouter.delete('/projects/:id', authMiddleware, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.delete(projects).where(eq(projects.id, id));
    res.json({ message: 'Xóa dự án thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi xóa dự án' });
  }
});

// ----------------------------------------------------
// 3. PACKAGES ROUTES
// ----------------------------------------------------

apiRouter.get('/packages', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    let query = db
      .select({
        package: packages,
        projectName: projects.name,
        responsibleUser: { id: users.id, fullName: users.fullName },
      })
      .from(packages)
      .innerJoin(projects, eq(packages.projectId, projects.id))
      .leftJoin(users, eq(packages.responsibleUserId, users.id));

    const result = projectId
      ? await query.where(eq(packages.projectId, projectId)).orderBy(asc(packages.id))
      : await query.orderBy(asc(packages.id));

    const formatted = await Promise.all(result.map(async (r) => {
      const overallProgress = await calculatePackageProgress(r.package.id);
      const schedule = await calculatePackageSchedule(r.package.id);
      const smartStatus = await calculatePackageStatus(r.package.id, r.package.status);

      return {
        ...r.package,
        ...schedule,
        startDate: formatDateDDMMYYYY(r.package.startDate),
        endDate: formatDateDDMMYYYY(r.package.endDate),
        projectName: r.projectName,
        responsibleUser: r.responsibleUser?.fullName || 'Chưa phân công',
        overallProgress,
        status: smartStatus,
      };
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách gói thầu' });
  }
});

apiRouter.get('/packages/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [result] = await db
      .select({
        package: packages,
        project: projects,
        responsibleUser: { id: users.id, fullName: users.fullName },
      })
      .from(packages)
      .innerJoin(projects, eq(packages.projectId, projects.id))
      .leftJoin(users, eq(packages.responsibleUserId, users.id))
      .where(eq(packages.id, id));

    if (!result) return res.status(404).json({ error: 'Không tìm thấy gói thầu' });

    const pkgActivities = await db.select().from(activities).where(eq(activities.packageId, id)).orderBy(asc(activities.id));
    const activitiesWithStats = await Promise.all(
      pkgActivities.map(async (act) => {
        const prog = await calculateActivityProgress(act);
        return {
          ...act,
          startDate: formatDateDDMMYYYY(act.startDate),
          endDate: formatDateDDMMYYYY(act.endDate),
          ...prog,
        };
      })
    );

    const schedule = await calculatePackageSchedule(id);
    const smartStatus = await calculatePackageStatus(id, result.package.status);

    res.json({
      package: {
        ...result.package,
        ...schedule,
        startDate: formatDateDDMMYYYY(result.package.startDate),
        endDate: formatDateDDMMYYYY(result.package.endDate),
        status: smartStatus,
      },
      project: result.project,
      responsibleUser: result.responsibleUser?.fullName || 'Chưa phân công',
      activities: activitiesWithStats,
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy thông tin gói thầu' });
  }
});

apiRouter.post('/packages', authMiddleware, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId, code, name, responsibleUserId, status, notes } = req.body;
    const [created] = await db.insert(packages).values({
      projectId,
      code,
      name,
      responsibleUserId: responsibleUserId ? Number(responsibleUserId) : null,
      status: status || 'in_progress',
      notes,
    }).returning();
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo gói thầu' });
  }
});

apiRouter.put('/packages/:id', authMiddleware, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { code, name, responsibleUserId, status, notes } = req.body;
    const [updated] = await db.update(packages).set({
      code,
      name,
      responsibleUserId: responsibleUserId ? Number(responsibleUserId) : null,
      status,
      notes,
      updatedAt: new Date(),
    }).where(eq(packages.id, id)).returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật gói thầu' });
  }
});

apiRouter.delete('/packages/:id', authMiddleware, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.delete(packages).where(eq(packages.id, id));
    res.json({ message: 'Xóa gói thầu thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi xóa gói thầu' });
  }
});

// ----------------------------------------------------
// 4. ACTIVITIES ROUTES
// ----------------------------------------------------

apiRouter.get('/activities', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const packageId = req.query.packageId ? Number(req.query.packageId) : undefined;
    let query = db
      .select({
        activity: activities,
        packageName: packages.name,
        packageCode: packages.code,
      })
      .from(activities)
      .innerJoin(packages, eq(activities.packageId, packages.id));

    const list = packageId
      ? await query.where(eq(activities.packageId, packageId)).orderBy(asc(activities.id))
      : await query.orderBy(asc(activities.id));

    const enriched = await Promise.all(
      list.map(async (item) => {
        const prog = await calculateActivityProgress(item.activity);
        return {
          ...item.activity,
          startDate: formatDateDDMMYYYY(item.activity.startDate),
          endDate: formatDateDDMMYYYY(item.activity.endDate),
          packageName: item.packageName,
          packageCode: item.packageCode,
          ...prog,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách công tác' });
  }
});

apiRouter.post('/activities', authMiddleware, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { packageId, code, name, unit, plannedQuantity, startDate, endDate, location, status, isCritical, notes, progressPercent, actualVolume } = req.body;
    const [created] = await db.insert(activities).values({
      packageId,
      code,
      name,
      unit: unit || null,
      plannedQuantity: plannedQuantity ? Number(plannedQuantity) : null,
      actualVolume: actualVolume !== undefined && actualVolume !== '' ? Number(actualVolume) : null,
      progressPercent: progressPercent !== undefined && progressPercent !== '' ? Number(progressPercent) : null,
      startDate,
      endDate,
      location: location || null,
      status: status || 'in_progress',
      isCritical: Boolean(isCritical),
      notes,
    }).returning();
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo công tác' });
  }
});

apiRouter.put('/activities/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, code, unit, plannedQuantity, actualVolume, progressPercent, startDate, endDate, location, status, isCritical, notes } = req.body;

    const [updated] = await db.update(activities).set({
      name: name ? String(name).trim() : undefined,
      code: code ? String(code).trim() : undefined,
      unit: unit !== undefined ? (unit ? String(unit).trim() : null) : undefined,
      plannedQuantity: plannedQuantity !== undefined && plannedQuantity !== '' ? Number(plannedQuantity) : null,
      actualVolume: actualVolume !== undefined && actualVolume !== '' ? Number(actualVolume) : null,
      progressPercent: progressPercent !== undefined && progressPercent !== '' ? Number(progressPercent) : null,
      startDate: startDate || null,
      endDate: endDate || null,
      location: location !== undefined ? (location ? String(location).trim() : null) : undefined,
      status: status || undefined,
      isCritical: isCritical !== undefined ? Boolean(isCritical) : undefined,
      notes: notes !== undefined ? (notes ? String(notes).trim() : null) : undefined,
      updatedAt: new Date(),
    }).where(eq(activities.id, id)).returning();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật công tác' });
  }
});

apiRouter.delete('/activities/:id', authMiddleware, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.delete(activities).where(eq(activities.id, id));
    res.json({ message: 'Xóa công tác thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi xóa công tác' });
  }
});

// ----------------------------------------------------
// 5. DAILY REPORTS ROUTES
// ----------------------------------------------------

apiRouter.get('/daily-reports', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = await db.select().from(dailyWorkReports).orderBy(desc(dailyWorkReports.reportDate));
    const formatted = reports.map(r => ({
      ...r,
      reportDate: formatDateDDMMYYYY(r.reportDate),
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách báo cáo' });
  }
});

apiRouter.post('/daily-reports', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { packageId, reportDate, reportType, manpower, nightShift, notes, difficulties, proposals } = req.body;
    const [report] = await db.insert(dailyWorkReports).values({
      packageId: Number(packageId),
      reportDate,
      reportType,
      createdBy: req.user!.userId,
      manpower: manpower ? Number(manpower) : 0,
      nightShift: Boolean(nightShift),
      notes,
      difficulties,
      proposals,
    }).returning();
    res.status(201).json({ message: 'Gửi báo cáo thành công', reportId: report.id });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lưu báo cáo' });
  }
});

// ----------------------------------------------------
// 6. MACHINERY & EQUIPMENT MANAGEMENT ROUTES
// ----------------------------------------------------

apiRouter.get('/machinery', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await db.select().from(machinery).orderBy(asc(machinery.code));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách máy móc' });
  }
});

apiRouter.post('/machinery', authMiddleware, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, code, type, status, currentPackageId, driverName, driverPhone } = req.body;
    const [created] = await db.insert(machinery).values({
      name,
      code,
      type: type || 'Máy xúc đào',
      status: status || 'idle',
      currentPackageId: currentPackageId ? Number(currentPackageId) : null,
      driverName,
      driverPhone,
    }).returning();
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo máy móc' });
  }
});

apiRouter.post('/machinery/:id/transfer', authMiddleware, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { toPackageId, reason } = req.body;
    const [machRecord] = await db.select().from(machinery).where(eq(machinery.id, id));
    if (!machRecord) return res.status(404).json({ error: 'Không tìm thấy thiết bị' });

    const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date());
    await db.insert(machineryTransfers).values({
      machineryId: id,
      fromPackageId: machRecord.currentPackageId,
      toPackageId: Number(toPackageId),
      transferDate: todayStr,
      reason: reason || 'Điều chuyển thiết bị',
      transferredBy: req.user!.userId,
    });

    await db.update(machinery).set({ currentPackageId: Number(toPackageId), assignedDate: todayStr }).where(eq(machinery.id, id));
    res.json({ message: 'Điều chuyển máy thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi điều chuyển thiết bị' });
  }
});

// ----------------------------------------------------
// 7. REPORTING STATUS & DASHBOARDS
// ----------------------------------------------------

apiRouter.get('/dashboard/packages/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db
      .select({
        package: packages,
        projectName: projects.name,
        projectCode: projects.code,
        responsibleUser: { id: users.id, fullName: users.fullName },
      })
      .from(packages)
      .innerJoin(projects, eq(packages.projectId, projects.id))
      .leftJoin(users, eq(packages.responsibleUserId, users.id))
      .where(eq(packages.id, id));

    if (!row) return res.status(404).json({ error: 'Không tìm thấy gói thầu' });

    const allActivities = await db.select().from(activities).where(eq(activities.packageId, id)).orderBy(asc(activities.id));
    const activitiesWithCalculation = await Promise.all(
      allActivities.map(async (act) => {
        const prog = await calculateActivityProgress(act);
        return {
          ...act,
          startDate: formatDateDDMMYYYY(act.startDate),
          endDate: formatDateDDMMYYYY(act.endDate),
          ...prog,
        };
      })
    );

    const schedule = await calculatePackageSchedule(id);
    const smartStatus = await calculatePackageStatus(id, row.package.status);

    res.json({
      package: {
        ...row.package,
        ...schedule,
        startDate: formatDateDDMMYYYY(row.package.startDate),
        endDate: formatDateDDMMYYYY(row.package.endDate),
        status: smartStatus,
      },
      projectName: row.projectName,
      projectCode: row.projectCode,
      responsibleUser: row.responsibleUser?.fullName || 'Chưa phân công',
      activities: {
        inProgress: activitiesWithCalculation.filter(a => a.status === 'in_progress'),
        notStarted: activitiesWithCalculation.filter(a => a.status === 'not_started'),
        completed: activitiesWithCalculation.filter(a => a.status === 'completed'),
        atRisk: activitiesWithCalculation.filter(a => a.status === 'at_risk'),
        delayed: activitiesWithCalculation.filter(a => a.status === 'delayed'),
        all: activitiesWithCalculation,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải Package Dashboard' });
  }
});

apiRouter.get('/reporting-status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dateStr = (req.query.date as string) || new Intl.DateTimeFormat('en-CA').format(new Date());

    const allPackages = await db.select().from(packages);
    const reportsToday = await db
      .select()
      .from(dailyWorkReports)
      .where(eq(dailyWorkReports.reportDate, dateStr));

    const totalManpower = reportsToday.reduce((sum, r) => sum + (r.manpower || 0), 0);

    const reportIdsToday = reportsToday.map(r => r.id);
    let machineryStats = { operating: 0, total: 0, maintenance: 0, standby: 0 };
    
    const allMachinery = await db.select().from(machinery);
    machineryStats.total = allMachinery.length;
    machineryStats.maintenance = allMachinery.filter(m => m.status === 'maintenance' || m.status === 'broken').length;
    machineryStats.standby = allMachinery.filter(m => m.status === 'idle').length;
    
    if (reportIdsToday.length > 0) {
      const machUsings = await db
        .select({ machineryId: dailyWorkReportMachinery.machineryId })
        .from(dailyWorkReportMachinery)
        .where(inArray(dailyWorkReportMachinery.dailyReportId, reportIdsToday));
      
      const uniqueActiveMachines = new Set(machUsings.map(m => m.machineryId));
      machineryStats.operating = uniqueActiveMachines.size;
    }

    const morningReports = reportsToday.filter(r => r.reportType === 'morning');
    const eveningReports = reportsToday.filter(r => r.reportType === 'evening');

    const formatShiftPackages = async (type: 'morning' | 'evening') => {
      const targetReports = type === 'morning' ? morningReports : eveningReports;
      return Promise.all(
        allPackages.map(async (pkg) => {
          const report = targetReports.find(r => r.packageId === pkg.id);
          const [project] = await db.select().from(projects).where(eq(projects.id, pkg.projectId));
          const [user] = pkg.responsibleUserId ? await db.select().from(users).where(eq(users.id, pkg.responsibleUserId)) : [null];

          let machCount = 0;
          if (report) {
            const machs = await db.select().from(dailyWorkReportMachinery).where(eq(dailyWorkReportMachinery.dailyReportId, report.id));
            machCount = machs.length;
          }

          return {
            packageId: pkg.id,
            packageCode: pkg.code,
            packageName: pkg.name,
            projectName: project?.name || '',
            responsibleUser: user?.fullName || 'Chưa phân công',
            responsibleUserPhone: user?.phone || '',
            hasReported: Boolean(report),
            reportId: report?.id || null,
            manpower: report?.manpower || 0,
            machineryCount: machCount,
            nightShift: report?.nightShift || false,
            difficulties: report?.difficulties || null,
          };
        })
      );
    };

    const morningPkgList = await formatShiftPackages('morning');
    const eveningPkgList = await formatShiftPackages('evening');

    const allActivities = await db.select().from(activities);
    const delayedActivities = [];

    for (const act of allActivities) {
      const prog = await calculateActivityProgress(act);
      if (prog.status === 'delayed' || prog.status === 'at_risk') {
        const [pkg] = await db.select().from(packages).where(eq(packages.id, act.packageId));
        const [project] = pkg ? await db.select().from(projects).where(eq(projects.id, pkg.projectId)) : [null];

        let delayDays = 0;
        if (act.endDate) {
          const endTimestamp = parseDateToTimestamp(act.endDate, true) || 0;
          const refTimestamp = parseDateToTimestamp(dateStr, false) || 0;
          if (refTimestamp > endTimestamp && prog.completionPercent < 100) {
            delayDays = Math.ceil((refTimestamp - endTimestamp) / (1000 * 60 * 60 * 24));
          } else {
            delayDays = 2;
          }
        }

        delayedActivities.push({
          activityId: act.id,
          activityName: act.name,
          packageId: pkg?.id,
          packageCode: pkg?.code || '',
          packageName: pkg?.name || '',
          projectName: project?.name || '',
          progressPercent: prog.completionPercent,
          status: prog.status,
          delayDays: Math.max(1, delayDays),
        });
      }
    }

    res.json({
      manpower: totalManpower,
      machinery: machineryStats,
      shifts: {
        morning: {
          total: allPackages.length,
          reportedCount: morningReports.length,
          packages: morningPkgList,
        },
        evening: {
          total: allPackages.length,
          reportedCount: eveningReports.length,
          packages: eveningPkgList,
        },
      },
      delayedActivities,
    });
  } catch (err: any) {
    console.error('Reporting status error:', err);
    res.status(500).json({ error: 'Lỗi lấy trạng thái báo cáo tổng quan: ' + (err.message || 'Lỗi server') });
  }
});