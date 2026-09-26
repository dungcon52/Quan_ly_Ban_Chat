import { db } from './index.ts';
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
} from './schema.ts';
import { hashPassword } from './auth.ts';
import { count } from 'drizzle-orm';

export async function seedMachineryIfEmpty() {
  try {
    const machCount = await db.select({ value: count() }).from(machinery);
    if (machCount[0].value > 0) {
      return;
    }

    console.log('Seeding initial machinery equipment and transfer data...');
    const allPackages = await db.select().from(packages);
    const allUsers = await db.select().from(users);

    const pkg1 = allPackages.find((p) => p.code === 'PKG001') || allPackages[0];
    const pkg2 = allPackages.find((p) => p.code === 'PKG002') || allPackages[1];
    const pkg3 = allPackages.find((p) => p.code === 'PKG003') || allPackages[2];
    const pkg4 = allPackages.find((p) => p.code === 'PKG004') || allPackages[3];
    const adminUser = allUsers.find((u) => u.role === 'admin') || allUsers[0];
    const chtAn = allUsers.find((u) => u.username === 'cht_an') || allUsers[0];

    // Seed machinery
    const [m1] = await db.insert(machinery).values({
      code: 'MX-01',
      name: 'Máy xúc bánh xích Komatsu PC200-8',
      licensePlate: '29XA-1892',
      type: 'Máy xúc đào',
      currentPackageId: pkg1?.id,
      assignedDate: '2026-08-15',
      status: 'active',
      driverName: 'Nguyễn Văn Hùng',
      driverPhone: '0981123456',
      notes: 'Đào hố móng các vị trí trụ VT01 đến VT10, công suất 110kW',
    }).returning();

    const [m2] = await db.insert(machinery).values({
      code: 'MX-02',
      name: 'Máy xúc bánh xích Hitachi ZX200-5G',
      licensePlate: '29XA-3421',
      type: 'Máy xúc đào',
      currentPackageId: pkg2?.id,
      assignedDate: '2026-09-08',
      status: 'active',
      driverName: 'Lê Văn Tuấn',
      driverPhone: '0972345678',
      notes: 'Thi công đào đắp san nền trạm biến áp TBA 01',
    }).returning();

    const [m3] = await db.insert(machinery).values({
      code: 'MU-01',
      name: 'Máy ủi Caterpillar D6R',
      licensePlate: '29XA-0912',
      type: 'Máy ủi',
      currentPackageId: pkg1?.id,
      assignedDate: '2026-08-15',
      status: 'active',
      driverName: 'Đặng Quốc Huy',
      driverPhone: '0912987654',
      notes: 'San ủi mặt bằng đường công vụ và bãi tập kết vật liệu',
    }).returning();

    const [m4] = await db.insert(machinery).values({
      code: 'LU-01',
      name: 'Xe lu rung Sakai SV520DH',
      licensePlate: '29XA-5678',
      type: 'Xe lu rung',
      currentPackageId: pkg1?.id,
      assignedDate: '2026-08-20',
      status: 'active',
      driverName: 'Phạm Văn Nam',
      driverPhone: '0963334455',
      notes: 'Lu lèn nền đường công vụ và móng công trình, tải trọng 12 tấn',
    }).returning();

    const [m5] = await db.insert(machinery).values({
      code: 'CC-01',
      name: 'Cần trục bánh xích Zoomlion QUY50',
      licensePlate: '29XA-7711',
      type: 'Cần cẩu',
      currentPackageId: pkg2?.id,
      assignedDate: '2026-09-01',
      status: 'active',
      driverName: 'Hoàng Minh Đức',
      driverPhone: '0945667788',
      notes: 'Cẩu lắp kết cấu thép máy biến áp và xà trạm',
    }).returning();

    const [m6] = await db.insert(machinery).values({
      code: 'TB-01',
      name: 'Xe tải ben Howo 4 chân 371HP',
      licensePlate: '29H-678.90',
      type: 'Xe tải ben',
      currentPackageId: pkg1?.id,
      assignedDate: '2026-08-25',
      status: 'active',
      driverName: 'Vũ Đình Toàn',
      driverPhone: '0934556677',
      notes: 'Vận chuyển đất đá thải và vật liệu cát đá dăm',
    }).returning();

    const [m7] = await db.insert(machinery).values({
      code: 'KC-01',
      name: 'Máy khoan cọc nhồi Bauer BG25',
      licensePlate: '29XA-4321',
      type: 'Máy khoan cọc',
      currentPackageId: pkg3?.id,
      assignedDate: '2026-09-05',
      status: 'idle',
      driverName: 'Bùi Thế Vinh',
      driverPhone: '0918776655',
      notes: 'Chờ bàn giao mặt bằng tuyến móng cọc TBA 02',
    }).returning();

    const [m8] = await db.insert(machinery).values({
      code: 'MP-01',
      name: 'Máy phát điện Cummins 250kVA',
      licensePlate: 'MP-250KVA',
      type: 'Máy phát điện',
      currentPackageId: pkg4?.id,
      assignedDate: '2026-09-06',
      status: 'active',
      driverName: 'Tổ cơ điện',
      driverPhone: '0909112233',
      notes: 'Cấp điện thi công ca ngày & ca đêm tại ngăn lộ Than Uyên',
    }).returning();

    // Sample transfer history: MX-02 transferred from PKG001 to PKG002
    if (pkg1 && pkg2) {
      await db.insert(machineryTransfers).values({
        machineryId: m2.id,
        fromPackageId: pkg1.id,
        toPackageId: pkg2.id,
        transferDate: '2026-09-08',
        reason: 'Tập trung máy xúc phục vụ đào hố móng khẩn cấp trạm TBA 01',
        transferredBy: chtAn?.id || adminUser?.id,
        notes: 'Đã bàn giao biên bản kiểm tra tình trạng máy ngày 08/09/2026',
      });
    }

    // Attach sample machinery to recent daily reports
    const recentReports = await db.select().from(dailyWorkReports);
    for (const report of recentReports) {
      if (report.packageId === pkg1?.id) {
        await db.insert(dailyWorkReportMachinery).values([
          { dailyReportId: report.id, machineryId: m1.id, operatingHours: 7.5, status: 'operating', notes: 'Đào hố móng' },
          { dailyReportId: report.id, machineryId: m3.id, operatingHours: 6.0, status: 'operating', notes: 'San gạt mặt bằng' },
        ]);
      } else if (report.packageId === pkg2?.id) {
        await db.insert(dailyWorkReportMachinery).values([
          { dailyReportId: report.id, machineryId: m2.id, operatingHours: 8.0, status: 'operating', notes: 'Đào móng bệ MBA' },
          { dailyReportId: report.id, machineryId: m5.id, operatingHours: 4.5, status: 'operating', notes: 'Cẩu lắp cấu kiện' },
        ]);
      }
    }

    console.log('Machinery equipment successfully seeded!');
  } catch (err) {
    console.error('Error seeding machinery:', err);
  }
}

export async function seedDatabase() {
  try {
    const userCount = await db.select({ value: count() }).from(users);
    if (userCount[0].value > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }

    console.log('Seeding initial data for Construction Management System...');

    // 1. Create Users
    const [adminUser] = await db.insert(users).values({
      username: 'admin',
      passwordHash: hashPassword('123456'),
      fullName: 'Quản trị viên Hệ thống',
      role: 'admin',
      isActive: true,
    }).returning();

    const [chtAn] = await db.insert(users).values({
      username: 'cht_an',
      passwordHash: hashPassword('123456'),
      fullName: 'Nguyễn Văn An (CHT Trưởng)',
      role: 'manager',
      isActive: true,
    }).returning();

    const [chtBinh] = await db.insert(users).values({
      username: 'cht_binh',
      passwordHash: hashPassword('123456'),
      fullName: 'Trần Văn Bình (CHT Phó)',
      role: 'manager',
      isActive: true,
    }).returning();

    const [ktBao] = await db.insert(users).values({
      username: 'kt_bao',
      passwordHash: hashPassword('123456'),
      fullName: 'Trần Quốc Bảo (Kỹ thuật hiện trường)',
      role: 'site_entry',
      isActive: true,
    }).returning();

    const [ktLong] = await db.insert(users).values({
      username: 'kt_long',
      passwordHash: hashPassword('123456'),
      fullName: 'Lê Hoàng Long (Kỹ thuật hiện trường)',
      role: 'site_entry',
      isActive: true,
    }).returning();

    // 2. Create Project
    const [project1] = await db.insert(projects).values({
      code: 'PRJ001',
      name: 'Điện mặt trời Bản Chát 1,2',
      location: 'Lai Châu',
      startDate: '2026-08-01',
      plannedEndDate: '2027-04-30',
      status: 'active',
      notes: 'Dự án nguồn năng lượng tái tạo trọng điểm quốc gia, thi công đập và lòng hồ Bản Chát.',
    }).returning();

    // Assign users to project
    await db.insert(userProjects).values([
      { userId: adminUser.id, projectId: project1.id },
      { userId: chtAn.id, projectId: project1.id },
      { userId: chtBinh.id, projectId: project1.id },
      { userId: ktBao.id, projectId: project1.id },
      { userId: ktLong.id, projectId: project1.id },
    ]);

    // 3. Create Packages
    const [pkg1] = await db.insert(packages).values({
      projectId: project1.id,
      code: 'PKG001',
      name: 'Thi công móng trụ đường dây 35kV',
      responsibleUserId: chtAn.id,
      startDate: '2026-08-15',
      endDate: '2026-11-30',
      status: 'in_progress',
      notes: 'Tuyến đường dây 35kV vượt địa hình đồi núi dốc, gồm 20 vị trí trụ VT01 đến VT20.',
    }).returning();

    const [pkg2] = await db.insert(packages).values({
      projectId: project1.id,
      code: 'PKG002',
      name: 'Thi công trạm biến áp 1 (TBA 01)',
      responsibleUserId: chtBinh.id,
      startDate: '2026-08-20',
      endDate: '2026-12-15',
      status: 'in_progress',
      notes: 'Trạm 110/35kV khu vực bờ trái hồ thủy điện Bản Chát.',
    }).returning();

    const [pkg3] = await db.insert(packages).values({
      projectId: project1.id,
      code: 'PKG003',
      name: 'Thi công trạm biến áp 2 (TBA 02)',
      responsibleUserId: chtBinh.id,
      startDate: '2026-09-01',
      endDate: '2026-12-30',
      status: 'delayed',
      notes: 'Chậm mặt bằng bàn giao tuyến đường công vụ.',
    }).returning();

    const [pkg4] = await db.insert(packages).values({
      projectId: project1.id,
      code: 'PKG004',
      name: 'Than Uyên mở rộng',
      responsibleUserId: chtAn.id,
      startDate: '2026-09-05',
      endDate: '2027-02-28',
      status: 'in_progress',
      notes: 'Hạng mục mở rộng ngăn lộ trạm nguồn đấu nối Than Uyên.',
    }).returning();

    const [pkg5] = await db.insert(packages).values({
      projectId: project1.id,
      code: 'PKG005',
      name: 'Đúc và hạ cục tải neo phao pin',
      responsibleUserId: chtAn.id,
      startDate: '2026-10-01',
      endDate: '2027-03-31',
      status: 'not_started',
      notes: 'Chuẩn bị bãi đúc phao và khối neo bê tông dưới lòng hồ.',
    }).returning();

    // 4. Create Activities for PKG001
    const [act1] = await db.insert(activities).values({
      packageId: pkg1.id,
      code: 'ACT001',
      name: 'Đào móng trụ',
      unit: 'm3',
      plannedQuantity: 1500,
      location: 'VT01-VT20',
      startDate: '2026-08-15',
      endDate: '2026-09-10',
      status: 'completed',
      notes: 'Đã hoàn thành đào toàn bộ 20 vị trí hố móng trụ.',
    }).returning();

    const [act2] = await db.insert(activities).values({
      packageId: pkg1.id,
      code: 'ACT002',
      name: 'Gia công và lắp dựng cốt thép móng',
      unit: 'tấn',
      plannedQuantity: 45,
      location: 'VT01-VT20',
      startDate: '2026-08-25',
      endDate: '2026-10-15',
      status: 'in_progress',
      notes: 'Đang triển khai vị trí VT16 - VT18.',
    }).returning();

    const [act3] = await db.insert(activities).values({
      packageId: pkg1.id,
      code: 'ACT003',
      name: 'Lắp dựng ván khuôn cốp pha móng',
      unit: 'm2',
      plannedQuantity: 800,
      location: 'VT01-VT20',
      startDate: '2026-08-28',
      endDate: '2026-10-20',
      status: 'in_progress',
      notes: 'Sử dụng cốp pha thép định hình kết hợp gỗ.',
    }).returning();

    const [act4] = await db.insert(activities).values({
      packageId: pkg1.id,
      code: 'ACT004',
      name: 'Đổ bê tông móng trụ (Mác 250)',
      unit: 'm3',
      plannedQuantity: 1000,
      location: 'VT01-VT20',
      startDate: '2026-09-01',
      endDate: '2026-11-15',
      status: 'in_progress',
      notes: 'Đổ bê tông thương phẩm kết hợp phụ gia đông kết nhanh.',
    }).returning();

    const [act5] = await db.insert(activities).values({
      packageId: pkg1.id,
      code: 'ACT005',
      name: 'Lắp đặt phụ kiện tiếp địa và néo',
      unit: null,
      plannedQuantity: null,
      location: 'VT01-VT20',
      startDate: '2026-09-10',
      endDate: '2026-11-20',
      status: 'in_progress',
      notes: 'Đánh giá theo % tiến độ hoàn thành các bãi tiếp địa.',
    }).returning();

    // Activities for PKG002
    const [act6] = await db.insert(activities).values({
      packageId: pkg2.id,
      code: 'ACT006',
      name: 'Đào hố móng máy biến áp chính',
      unit: 'm3',
      plannedQuantity: 650,
      location: 'TBA 01',
      startDate: '2026-08-20',
      endDate: '2026-09-05',
      status: 'completed',
    }).returning();

    const [act7] = await db.insert(activities).values({
      packageId: pkg2.id,
      code: 'ACT007',
      name: 'Đổ bê tông bệ móng máy biến áp',
      unit: 'm3',
      plannedQuantity: 350,
      location: 'TBA 01',
      startDate: '2026-09-06',
      endDate: '2026-10-10',
      status: 'in_progress',
    }).returning();

    const [act8] = await db.insert(activities).values({
      packageId: pkg2.id,
      code: 'ACT008',
      name: 'Lắp đặt giá đỡ và kết cấu thép thiết bị',
      unit: null,
      plannedQuantity: null,
      location: 'TBA 01',
      startDate: '2026-09-12',
      endDate: '2026-10-30',
      status: 'in_progress',
    }).returning();

    // 5. Create Daily Reports
    // Report 1: 14/09 morning
    const [rep1] = await db.insert(dailyWorkReports).values({
      packageId: pkg1.id,
      reportDate: '2026-09-14',
      reportType: 'morning',
      createdBy: ktBao.id,
      manpower: 32,
      nightShift: true,
      notes: 'Đêm qua thi công ca đêm đổ bê tông móng trụ VT14-VT15 liên tục 8 tiếng, đảm bảo nhiệt độ bê tông ổn định.',
    }).returning();

    await db.insert(dailyWorkReportItems).values([
      { dailyReportId: rep1.id, activityId: act4.id, location: 'VT14-VT15', quantity: 65, progressPercent: null, notes: 'Bê tông thương phẩm xe bồn 4 chuyến' },
    ]);

    // Report 2: 14/09 evening
    const [rep2] = await db.insert(dailyWorkReports).values({
      packageId: pkg1.id,
      reportDate: '2026-09-14',
      reportType: 'evening',
      createdBy: ktBao.id,
      manpower: 36,
      nightShift: false,
      notes: 'Hoàn thành công tác buộc thép và ghép ván khuôn hố móng VT16 trước 17:30.',
    }).returning();

    await db.insert(dailyWorkReportItems).values([
      { dailyReportId: rep2.id, activityId: act2.id, location: 'VT16', quantity: 3.5, progressPercent: null, notes: 'Thép móng D22, D20 gia công tại bãi' },
      { dailyReportId: rep2.id, activityId: act3.id, location: 'VT16', quantity: 48, progressPercent: null, notes: 'Ván khuôn móng trụ' },
    ]);

    // Report 3: 15/09 morning
    const [rep3] = await db.insert(dailyWorkReports).values({
      packageId: pkg1.id,
      reportDate: '2026-09-15',
      reportType: 'morning',
      createdBy: ktBao.id,
      manpower: 30,
      nightShift: false,
      notes: 'Bàn giao ca sáng, tổ chức nghiệm thu cốt thép VT16 chuẩn bị đổ bê tông.',
      difficulties: 'Thiếu thép D20 tại vị trí VT17 do xe vận chuyển vật tư chưa cập bãi Lai Châu.',
      difficultiesStatus: 'open',
      proposals: 'Đề xuất điều chuyển 1 máy đào từ Than Uyên (PKG004) sang hỗ trợ bạt taluy VT18.',
      proposalsStatus: 'open',
    }).returning();

    await db.insert(dailyWorkReportItems).values([
      { dailyReportId: rep3.id, activityId: act4.id, location: 'VT16', quantity: 45, progressPercent: null, notes: 'Đổ hoàn thiện móng VT16' },
      { dailyReportId: rep3.id, activityId: act5.id, location: 'VT01-VT10', quantity: null, progressPercent: 40, notes: 'Đã đóng cọc tiếp địa hoàn tất 8/20 vị trí' },
    ]);

    // Report 4: 15/09 evening
    const [rep4] = await db.insert(dailyWorkReports).values({
      packageId: pkg1.id,
      reportDate: '2026-09-15',
      reportType: 'evening',
      createdBy: ktBao.id,
      manpower: 38,
      nightShift: true,
      notes: 'Tối nay tiếp tục thi công ca đêm tăng ca ghép cốt thép và cốp pha vị trí VT17.',
      difficulties: 'Đường bùn lầy sau trận mưa lớn khiến xe bồn bê tông khó leo dốc vào VT18.',
      difficultiesStatus: 'resolved',
      difficultiesResolvedBy: chtAn.id,
      difficultiesResolvedAt: new Date(),
      proposals: 'Đã liên hệ đội gạt đường phụ trách san gạt sỏi đá dăm tạm thời.',
      proposalsStatus: 'resolved',
      proposalsResolvedBy: chtAn.id,
      proposalsResolvedAt: new Date(),
    }).returning();

    await db.insert(dailyWorkReportItems).values([
      { dailyReportId: rep4.id, activityId: act2.id, location: 'VT17', quantity: 2.8, progressPercent: null },
      { dailyReportId: rep4.id, activityId: act3.id, location: 'VT17', quantity: 35, progressPercent: null },
      { dailyReportId: rep4.id, activityId: act4.id, location: 'VT16', quantity: 35, progressPercent: null },
      { dailyReportId: rep4.id, activityId: act5.id, location: 'VT01-VT14', quantity: null, progressPercent: 65, notes: 'Tiếp tục hoàn thiện các bãi tiếp địa' },
    ]);

    // Report 5: 15/09 morning for PKG002
    const [rep5] = await db.insert(dailyWorkReports).values({
      packageId: pkg2.id,
      reportDate: '2026-09-15',
      reportType: 'morning',
      createdBy: ktLong.id,
      manpower: 24,
      nightShift: false,
      notes: 'Triển khai đổ bê tông bệ móng máy biến áp chính đợt 1.',
      difficulties: 'Cần phối hợp lịch ngắt điện đường dây thi công gần trạm.',
      difficultiesStatus: 'open',
      proposals: 'Xin duyệt phương án an toàn đóng điện thử nghiệm.',
      proposalsStatus: 'open',
    }).returning();

    await db.insert(dailyWorkReportItems).values([
      { dailyReportId: rep5.id, activityId: act7.id, location: 'TBA 01', quantity: 55, progressPercent: null },
      { dailyReportId: rep5.id, activityId: act8.id, location: 'TBA 01', quantity: null, progressPercent: 35 },
    ]);

    console.log('Database seeding successfully finished!');
  } catch (err) {
    console.error('Database seed error:', err);
  }
}
