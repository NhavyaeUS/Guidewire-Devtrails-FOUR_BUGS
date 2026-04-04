import { Router, Response, Request } from 'express';
import { getWeather, getScenarioWeather } from '../services/weather';

const router = Router();

// GET /api/mock/weather/:city
router.get('/weather/:city', async (req: Request, res: Response) => {
  const city = req.params.city as string;
  const scenario = req.query.scenario as string;

  if (scenario) {
    res.json(getScenarioWeather(city, scenario));
  } else {
    try {
      const weather = await getWeather(city);
      res.json(weather);
    } catch (e) {
      res.json(getScenarioWeather(city, 'normal'));
    }
  }
});

// GET /api/mock/flood-alert/:city/:zone
router.get('/flood-alert/:city/:zone', (req: Request, res: Response) => {
  const city = (req.params.city as string).toLowerCase();
  const zone = (req.params.zone as string).toLowerCase();
  
  // Seed realistic scenario: Chennai Tambaram floods during NE monsoon (Oct-Dec)
  const isTambaram = city === 'chennai' && zone === 'tambaram';
  const month = new Date().getMonth(); // 0-11
  const isMonsoon = month >= 9 && month <= 11; // Oct, Nov, Dec
  
  // Force alert via query param for testing
  const force = req.query.force === 'true';

  if (force || (isTambaram && isMonsoon)) {
    res.json({
      alert: true,
      severity: 'severe',
      started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    });
  } else {
    res.json({
      alert: false,
      severity: 'none',
      started_at: null
    });
  }
});

// GET /api/mock/curfew/:city/:zone
router.get('/curfew/:city/:zone', (req: Request, res: Response) => {
  const force = req.query.force === 'true';
  // Return false by default unless forced
  res.json({
    active: force,
    reason: force ? 'Civic Unrest Simulation' : null,
    started_at: force ? new Date().toISOString() : null
  });
});

// GET /api/mock/platform-orders/:worker_id
router.get('/platform-orders/:worker_id', (req: Request, res: Response) => {
  const { worker_id } = req.params;
  const fromStr = req.query.from as string;
  const toStr = req.query.to as string;
  
  if (!fromStr || !toStr) {
    return res.status(400).json({ error: 'Missing from/to params' });
  }

  const from = new Date(fromStr).getTime();
  const to = new Date(toStr).getTime();
  
  // Generate random mock orders within the window
  // For fraud testing, if force_activity query param is present, generate 4 orders
  const forceActivity = req.query.force_activity === 'true';
  const numOrders = forceActivity ? 4 : Math.floor(Math.random() * 2);

  const orders = [];
  for (let i = 0; i < numOrders; i++) {
    const randomTime = from + Math.random() * (to - from);
    orders.push({
      id: `ord_${Math.random().toString(36).substring(7)}`,
      workerId: worker_id,
      completedAt: new Date(randomTime).toISOString(),
      amount: Math.floor(Math.random() * 50) + 30
    });
  }

  res.json({
    worker_id,
    period_start: fromStr,
    period_end: toStr,
    order_count: orders.length,
    orders
  });
});

// GET /api/mock/gps/:worker_id/latest
router.get('/gps/:worker_id/latest', async (req: Request, res: Response) => {
  // Use Prisma to get the actual mocked ping from the DB if it exists
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const ping = await prisma.gpsPing.findFirst({
      where: { workerId: req.params.worker_id },
      orderBy: { timestamp: 'desc' }
    });
    
    if (ping) {
      res.json(ping);
    } else {
      res.status(404).json({ error: 'No GPS history found for worker' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch GPS data' });
  } finally {
    await prisma.$disconnect();
  }
});

// GET /api/mock/current-conditions
router.get('/current-conditions', async (req: Request, res: Response) => {
  try {
    const weather = await getWeather('Chennai');
    res.json({
      city: 'Chennai',
      condition: weather.weather_description,
      temperature: weather.temperature,
      windSpeed: weather.wind_speed,
      rainChance: Math.floor(Math.random() * 20), // Mocked for now
      currentDisruptions: [] // No active disruptions by default
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch current conditions' });
  }
});

export default router;
