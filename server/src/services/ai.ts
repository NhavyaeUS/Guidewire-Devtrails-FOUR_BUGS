import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here'
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

function parseJsonResponse(text: string): any {
  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {}
  }
  return null;
}

export async function profileRisk(workerData: {
  city: string; zone: string; earnings: number; hours: number;
  platform: string; months: number;
}): Promise<{
  risk_score: number; risk_tier: string;
  explanation: string; key_risk_factors: string[];
}> {
  if (!genAI) {
    // Fallback baseline
    const baseScore = workerData.city === 'Chennai' ? 72 : workerData.city === 'Mumbai' ? 65 : 45;
    const score = Math.min(100, Math.max(1, baseScore + (workerData.hours > 10 ? 10 : 0) - (workerData.months > 12 ? 5 : 0)));
    const tier = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';
    return {
      risk_score: score,
      risk_tier: tier,
      explanation: `AI analysis temporarily unavailable — using baseline estimate. Your zone in ${workerData.city} has ${tier.toLowerCase()} historical disruption risk.`,
      key_risk_factors: ['City flood history', 'Working hours exposure', 'Zone vulnerability']
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(
      `You are a risk analyst for a parametric income insurance product for gig delivery workers in India. Given the following worker profile: city = ${workerData.city}, delivery zone = ${workerData.zone}, avg daily earnings = ₹${workerData.earnings}, avg daily working hours = ${workerData.hours}, platform = ${workerData.platform}, months active = ${workerData.months}. Analyze the risk of income disruption due to external events (weather, pollution, civic disruptions) in this worker's typical operating area. Return a JSON object with: risk_score (integer 1–100), risk_tier (Low/Medium/High), explanation (1 sentence, plain language for the worker to read), and key_risk_factors (array of 2–3 short strings). Return ONLY the JSON object, no other text.`
    );

    const text = result.response.text();
    const parsed = parseJsonResponse(text);
    if (parsed && parsed.risk_score) return parsed;
  } catch (error) {
    console.error('AI risk profiling failed:', error);
  }

  // Fallback
  return {
    risk_score: 50, risk_tier: 'Medium',
    explanation: 'AI analysis temporarily unavailable — using baseline estimate.',
    key_risk_factors: ['City risk profile', 'Working hours']
  };
}

export async function calculatePremium(data: {
  tier: string; basePremium: number; city: string; zone: string;
  riskScore: number; riskTier: string; earnings: number;
  rainDays?: number; heatDays?: number; aqiDays?: number; civicEvents?: number;
}): Promise<{
  adjusted_premium: number; adjustment_reason: string;
  adjustment_direction: string;
}> {
  if (!genAI) {
    const factor = data.riskScore > 70 ? 1.3 : data.riskScore > 40 ? 1.1 : 0.9;
    const adjusted = Math.round(data.basePremium * factor);
    return {
      adjusted_premium: adjusted,
      adjustment_reason: `AI analysis temporarily unavailable — baseline adjustment of ${factor > 1 ? '+' : ''}${Math.round((factor - 1) * 100)}% based on risk score.`,
      adjustment_direction: factor > 1 ? 'increase' : factor < 1 ? 'decrease' : 'no_change'
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(
      `You are an actuarial pricing engine for parametric gig worker insurance. Base weekly premium for ${data.tier} plan is ₹${data.basePremium}. Worker risk profile: city = ${data.city}, zone = ${data.zone}, risk_score = ${data.riskScore}, risk_tier = ${data.riskTier}, avg_daily_earnings = ₹${data.earnings}. Historical disruption frequency for this city (past 12 months): heavy rain days = ${data.rainDays || 25}, extreme heat days = ${data.heatDays || 15}, high AQI days = ${data.aqiDays || 20}, civic disruption events = ${data.civicEvents || 3}. Calculate an adjusted weekly premium. Return JSON: adjusted_premium (integer, ₹), adjustment_reason (1 sentence explaining the change to the worker), adjustment_direction (increase/decrease/no_change). Return ONLY the JSON object.`
    );

    const text = result.response.text();
    const parsed = parseJsonResponse(text);
    if (parsed && parsed.adjusted_premium) return parsed;
  } catch (error) {
    console.error('AI premium calculation failed:', error);
  }

  return {
    adjusted_premium: data.basePremium,
    adjustment_reason: 'AI analysis temporarily unavailable — using base premium.',
    adjustment_direction: 'no_change'
  };
}

export async function detectFraudAI(data: {
  claimHistory: any[]; triggerType: string; city: string; zone: string;
  hours: number; payout: number; gpsResult: string; activityResult: string;
}): Promise<{
  fraud_risk_score: number; flags: string[];
  recommendation: string; explanation: string;
}> {
  if (!genAI) {
    return {
      fraud_risk_score: 15,
      flags: [],
      recommendation: 'approve',
      explanation: 'AI analysis temporarily unavailable — baseline auto-approve applied.'
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(
      `You are a fraud detection specialist for a parametric insurance platform. Analyze this claim for suspicious patterns. Worker claim history (last 8 weeks): ${JSON.stringify(data.claimHistory)}. Current claim: trigger_type = ${data.triggerType}, city = ${data.city}, zone = ${data.zone}, claimed_hours = ${data.hours}, calculated_payout = ₹${data.payout}. GPS validation result: ${data.gpsResult}. Activity validation result: ${data.activityResult}. Identify if there are any suspicious patterns. Return JSON: fraud_risk_score (integer 0–100), flags (array of specific red flags found, empty array if none), recommendation (approve/review/reject), explanation (1–2 sentences for the admin reviewer). Return ONLY the JSON object.`
    );

    const text = result.response.text();
    const parsed = parseJsonResponse(text);
    if (parsed && typeof parsed.fraud_risk_score === 'number') return parsed;
  } catch (error) {
    console.error('AI fraud detection failed:', error);
  }

  return {
    fraud_risk_score: 20,
    flags: [],
    recommendation: 'approve',
    explanation: 'AI analysis temporarily unavailable — baseline scoring applied.'
  };
}

export async function predictAnalytics(data: {
  historicalData: any; forecast: any;
}): Promise<{
  high_risk_cities: string[]; estimated_payout_liability: number;
  recommended_reserve: number; operational_suggestion: string;
}> {
  if (!genAI) {
    return {
      high_risk_cities: ['Chennai', 'Mumbai'],
      estimated_payout_liability: 125000,
      recommended_reserve: 187500,
      operational_suggestion: 'AI analysis temporarily unavailable — using baseline predictions. Consider monitoring Chennai and Mumbai closely during monsoon season.'
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(
      `You are a predictive analytics engine for an insurance company covering gig delivery workers in India. Here is the claims and premium data for the past 4 weeks broken down by city: ${JSON.stringify(data.historicalData)}. Next week's weather forecast summary by city: ${JSON.stringify(data.forecast)}. Predict: which 2–3 cities are highest risk for claims next week, estimated total payout liability (in ₹), recommended reserve amount, and one operational suggestion for the insurer. Return JSON: high_risk_cities (array), estimated_payout_liability (integer), recommended_reserve (integer), operational_suggestion (string). Return ONLY the JSON object.`
    );

    const text = result.response.text();
    const parsed = parseJsonResponse(text);
    if (parsed && parsed.high_risk_cities) return parsed;
  } catch (error) {
    console.error('AI predictive analytics failed:', error);
  }

  return {
    high_risk_cities: ['Chennai', 'Mumbai'],
    estimated_payout_liability: 125000,
    recommended_reserve: 187500,
    operational_suggestion: 'AI analysis temporarily unavailable — monitor monsoon-prone cities.'
  };
}
