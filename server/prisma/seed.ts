import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // --- WORKERS ---
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const workersData = [
    {
      name: 'Ramesh Kumar (Chennai)',
      phone: '9876543210',
      password: hashedPassword,
      city: 'Chennai',
      pincode: '600045',
      zone: 'Tambaram',
      platform: 'zomato',
      avgDailyHours: 10,
      avgDailyEarnings: 800,
      monthsActive: 24,
      riskScore: 75,
      riskTier: 'High',
    },
    {
      name: 'Suresh Iyer (Chennai)',
      phone: '9876543211',
      password: hashedPassword,
      city: 'Chennai',
      pincode: '600020',
      zone: 'Adyar',
      platform: 'swiggy',
      avgDailyHours: 8,
      avgDailyEarnings: 600,
      monthsActive: 12,
      riskScore: 60,
      riskTier: 'Medium',
    },
    {
      name: 'Amit Patel (Mumbai)',
      phone: '9876543212',
      password: hashedPassword,
      city: 'Mumbai',
      pincode: '400050',
      zone: 'Bandra',
      platform: 'both',
      avgDailyHours: 12,
      avgDailyEarnings: 1200,
      monthsActive: 36,
      riskScore: 65,
      riskTier: 'Medium',
    },
    {
      name: 'Kiran Gowda (Bengaluru)',
      phone: '9876543213',
      password: hashedPassword,
      city: 'Bengaluru',
      pincode: '560034',
      zone: 'Koramangala',
      platform: 'zomato',
      avgDailyHours: 6,
      avgDailyEarnings: 500,
      monthsActive: 6,
      riskScore: 40,
      riskTier: 'Low',
    },
    {
      name: 'Raj Singh (Delhi)',
      phone: '9876543214',
      password: hashedPassword,
      city: 'Delhi',
      pincode: '110001',
      zone: 'Connaught Place',
      platform: 'swiggy',
      avgDailyHours: 9,
      avgDailyEarnings: 750,
      monthsActive: 18,
      riskScore: 85,
      riskTier: 'High',
    }
  ];

  const workers = [];
  for (const data of workersData) {
    const worker = await prisma.worker.upsert({
      where: { phone: data.phone },
      update: {},
      create: data,
    });
    workers.push(worker);
  }

  // Admin user
  await prisma.worker.upsert({
    where: { phone: '9999999999' },
    update: {},
    create: {
      name: 'Admin User',
      phone: '9999999999',
      password: hashedPassword,
      city: 'Chennai',
      pincode: '000000',
      zone: 'HQ',
      platform: '-',
      avgDailyHours: 0,
      avgDailyEarnings: 0,
      monthsActive: 0,
      riskScore: 0,
      riskTier: 'Low',
      isAdmin: true,
    }
  });

  // --- POLICIES ---
  const monday = new Date();
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Give Ramesh (Chennai High Risk) a Pro Shield
  const rameshPolicy = await prisma.policy.create({
    data: {
      workerId: workers[0].id,
      tier: 'pro',
      weeklyPremium: 130, // Adjusted high risk
      maxWeeklyPayout: 2500,
      coverageStart: monday,
      coverageEnd: sunday,
      status: 'active'
    }
  });

  // Give Amit (Mumbai) a Standard Shield
  const amitPolicy = await prisma.policy.create({
    data: {
      workerId: workers[2].id,
      tier: 'standard',
      weeklyPremium: 65, // Adjusted medium risk
      maxWeeklyPayout: 1200,
      coverageStart: monday,
      coverageEnd: sunday,
      status: 'active'
    }
  });

  // Give Kiran (Bengaluru) a Basic Shield
  await prisma.policy.create({
    data: {
      workerId: workers[3].id,
      tier: 'basic',
      weeklyPremium: 26, // Adjusted low risk
      maxWeeklyPayout: 500,
      coverageStart: monday,
      coverageEnd: sunday,
      status: 'active'
    }
  });

  // --- HISTORICAL CLAIMS (For analytics) ---
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  
  // Create a past trigger
  const pastTrigger1 = await prisma.disruptionTrigger.create({
    data: {
      triggerType: 'heavy_rain',
      city: 'Chennai',
      zone: 'Tambaram',
      startedAt: fourWeeksAgo,
      endedAt: new Date(fourWeeksAgo.getTime() + 4 * 60 * 60 * 1000),
      severityLevel: 'severe',
      dataSource: 'Historical Seed',
    }
  });

  // Claim for Ramesh
  await prisma.claim.create({
    data: {
      workerId: workers[0].id,
      policyId: rameshPolicy.id,
      triggerId: pastTrigger1.id,
      triggeredAt: pastTrigger1.startedAt,
      hoursCovered: 4,
      calculatedPayout: 320, // 80/hr * 4
      fraudScore: 10,
      fraudFlags: '[]',
      status: 'paid',
      createdAt: fourWeeksAgo,
    }
  });

  // --- RECENT AUTO-TRIGGERED BUT FLAGGED CLAIM ---
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  
  const currentTrigger = await prisma.disruptionTrigger.create({
    data: {
      triggerType: 'flood',
      city: 'Mumbai',
      zone: 'Bandra',
      startedAt: twoHoursAgo,
      severityLevel: 'severe',
      dataSource: 'Flood Alert API (mock)',
    }
  });

  // Flagged claim for Amit (GPS mismatch)
  await prisma.claim.create({
    data: {
      workerId: workers[2].id,
      policyId: amitPolicy.id,
      triggerId: currentTrigger.id,
      triggeredAt: currentTrigger.startedAt,
      hoursCovered: 7, // Standard cap
      calculatedPayout: 700, // 100/hr * 7
      fraudScore: 85, // High fraud risk
      fraudFlags: '["location mismatch — GPS shows worker in Pune, not in registered zone Bandra"]',
      status: 'flagged',
    }
  });

  // --- GPS PINGS ---
  // Seed recent normal GPS ping for Ramesh
  await prisma.gpsPing.create({
    data: {
      workerId: workers[0].id,
      latitude: 12.9229, // Tambaram lat
      longitude: 80.1275, // Tambaram lon
      zone: 'Tambaram',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
    }
  });

  // Seed mismatch GPS ping for Amit (causing the flag above)
  await prisma.gpsPing.create({
    data: {
      workerId: workers[2].id,
      latitude: 18.5204, // Pune lat
      longitude: 73.8567, // Pune lon
      zone: 'Pune', // Mismatch! He is registered in Bandra
      timestamp: twoHoursAgo, 
    }
  });

  console.log('✅ Seed completed: 5 workers, 3 policies, 2 triggers, 2 claims (1 paid, 1 flagged)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
