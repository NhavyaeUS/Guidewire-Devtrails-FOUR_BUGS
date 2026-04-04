import { PrismaClient } from '@prisma/client';
import { runFraudDetection } from './src/services/fraud';

const prisma = new PrismaClient();

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('--- GIGSHIELD FRAUD DETECTION TEST SUITE ---\n');

  // 1. Setup Test Worker & Policy
  const worker = await prisma.worker.create({
    data: {
      name: 'Test Worker',
      phone: `+91${Date.now().toString().slice(-9)}${Math.floor(Math.random()*10)}`,
      password: 'hashedpassword',
      city: 'Chennai',
      pincode: '600001',
      zone: 'Parrys Corner',
      platform: 'zomato',
      avgDailyHours: 8,
      avgDailyEarnings: 800,
      monthsActive: 0, // new worker (triggers new account penalty)
    }
  });

  console.log(`✅ Created Sandbox Worker: ${worker.id}\n`);

  // -------------------------------------------------------------
  // Test 1: Impossible Speed + Location Jump
  // Simulate teleportation from Chennai to Delhi in 1 minute
  // -------------------------------------------------------------
  console.log('🧪 TEST 1: SPOOFING (Impossible Speed & Location Jump)');
  
  const now = Date.now();
  
  // Ping 1: Chennai (1 min ago)
  await prisma.gpsPing.create({
    data: {
      workerId: worker.id,
      latitude: 13.0827,
      longitude: 80.2707,
      zone: 'Parrys Corner',
      isActive: true,
      timestamp: new Date(now - 60 * 1000) 
    }
  });

  // Ping 2: Delhi (Now)
  await prisma.gpsPing.create({
    data: {
      workerId: worker.id,
      latitude: 28.7041,
      longitude: 77.1025,
      zone: 'Connaught Place',
      isActive: true,
      timestamp: new Date(now)
    }
  });

  const spoofResult = await runFraudDetection(worker.id, {
    triggerType: 'heavy_rain',
    city: 'Chennai',
    zone: 'Connaught Place',
    hours: 3,
    payout: 500,
    triggeredAt: new Date(now + 100)
  });

  console.log('Result Score:', spoofResult.fraudScore);
  console.log('Recommendation:', spoofResult.recommendation.toUpperCase());
  console.log('Flags:', spoofResult.flags.join('\n       '));
  console.log('\n-------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // Test 2: Clean Scenario 
  // (Using a different worker to prevent duplicate conflict)
  // -------------------------------------------------------------
  console.log('🧪 TEST 2: CLEAN LEGITIMATE CLAIM');
  const cleanWorker = await prisma.worker.create({
    data: {
      name: 'Honest Worker',
      phone: `+91${Date.now().toString().slice(-9)}${Math.floor(Math.random()*10)}`,
      password: 'hashedpassword',
      city: 'Mumbai',
      pincode: '400001',
      zone: 'Colaba',
      platform: 'swiggy',
      avgDailyHours: 8,
      avgDailyEarnings: 800,
      monthsActive: 14, // Tenured worker => better historical score
    }
  });

  // Tenured worker with prior approved claims (mock 100 trips)
  for(let i=0; i<10; i++) {
    await prisma.claim.create({
      data: {
        workerId: cleanWorker.id,
        policyId: 'dummy-policy',
        triggerId: 'dummy-trigger',
        triggeredAt: new Date(now - 86400000 * 5),
        hoursCovered: 3,
        calculatedPayout: 300,
        status: 'paid'
      }
    }); // 10 approved claims to build trust
  }

  // Realistic movement (2 pings in Mumbai, 10 mins apart, 1.5km distance)
  await prisma.gpsPing.create({
    data: {
      workerId: cleanWorker.id,
      latitude: 18.9100,
      longitude: 72.8200,
      zone: 'Colaba',
      isActive: true,
      timestamp: new Date(now - 10 * 60 * 1000) 
    }
  });
  await prisma.gpsPing.create({
    data: {
      workerId: cleanWorker.id,
      latitude: 18.9220,
      longitude: 72.8330, // Approx 1.5km
      zone: 'Colaba',
      isActive: true,
      timestamp: new Date(now)
    }
  });

  const cleanResult = await runFraudDetection(cleanWorker.id, {
    triggerType: 'heat_wave',
    city: 'Mumbai',
    zone: 'Colaba',
    hours: 2,
    payout: 300,
    triggeredAt: new Date(now + 100)
  });

  console.log('Result Score:', cleanResult.fraudScore);
  console.log('Recommendation:', cleanResult.recommendation.toUpperCase());
  if (cleanResult.flags.length > 0) {
    console.log('Flags:', cleanResult.flags.join('\n       '));
  } else {
    console.log('Flags: NONE. (System recognized tenured worker with perfect history)');
  }
  console.log('\n-------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // Test 3: Duplicate Claim Test 
  // (Try submitting another claim for the clean worker)
  // -------------------------------------------------------------
  console.log('🧪 TEST 3: DUPLICATE CLAIM ATTEMPT');
  
  // First, submit an approved claim for today
  await prisma.claim.create({
    data: {
      workerId: cleanWorker.id,
      policyId: 'dummy-policy',
      triggerId: 'dummy-trigger',
      triggeredAt: new Date(),
      hoursCovered: 2,
      calculatedPayout: 300,
      status: 'approved'
    }
  });

  // Run detection again on the same day window
  const duplicateResult = await runFraudDetection(cleanWorker.id, {
    triggerType: 'heavy_rain',
    city: 'Mumbai',
    zone: 'Colaba',
    hours: 3,
    payout: 400,
    triggeredAt: new Date()
  });

  console.log('Result Score:', duplicateResult.fraudScore);
  console.log('Recommendation:', duplicateResult.recommendation.toUpperCase());
  console.log('Flags:', duplicateResult.flags.join('\n       '));

  console.log('\n-------------------------------------------------------------\n');
  console.log('🎉 TESTS COMPLETE!');
  
  await prisma.$disconnect();
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
