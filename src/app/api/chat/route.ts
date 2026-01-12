import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

interface Trade {
  id: string;
  symbol: string;
  tradeType: string;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  profitLoss: number | null;
  status: string;
  notes: string | null;
  isStarred: boolean;
  tradeDate: Date;
  createdAt: Date;
}

interface Goal {
  id: string;
  month: number;
  year: number;
  targetPnL: number | null;
  targetWinRate: number | null;
  maxTradesPerDay: number | null;
}

interface Mistake {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  frequency: number;
}

interface TradingRule {
  id: string;
  rule: string;
  isActive: boolean;
  order: number;
}

interface NotificationSettings {
  id: string;
  weeklyReports: boolean;
  goalAlerts: boolean;
  lastWeeklyReport: Date | null;
}

async function getUserData(userId: string) {
  // Fetch all user data
  const [trades, goals, mistakes, rules, notifications] = await Promise.all([
    prisma.trade.findMany({
      where: { userId },
      orderBy: { tradeDate: 'desc' },
    }),
    prisma.goal.findMany({
      where: { userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    }),
    prisma.mistake.findMany({
      where: { userId },
      orderBy: { frequency: 'desc' },
    }),
    prisma.tradingRule.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    }),
    prisma.notificationSettings.findFirst({
      where: { userId },
    }),
  ]);

  return { trades, goals, mistakes, rules, notifications };
}

function calculateStats(trades: Trade[]) {
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const totalTrades = trades.length;
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
  const profitableTrades = closedTrades.filter(t => (t.profitLoss || 0) > 0).length;
  const losingTrades = closedTrades.filter(t => (t.profitLoss || 0) < 0).length;
  const winRate = closedTrades.length > 0 ? (profitableTrades / closedTrades.length) * 100 : 0;
  
  // Calculate average win/loss
  const wins = closedTrades.filter(t => (t.profitLoss || 0) > 0);
  const losses = closedTrades.filter(t => (t.profitLoss || 0) < 0);
  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / losses.length : 0;
  
  // Largest win/loss
  const largestWin = Math.max(0, ...closedTrades.map(t => t.profitLoss || 0));
  const largestLoss = Math.min(0, ...closedTrades.map(t => t.profitLoss || 0));

  // Profit factor
  const grossProfit = wins.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.profitLoss || 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  return {
    totalTrades,
    closedTrades: closedTrades.length,
    openTrades: trades.filter(t => t.status === 'OPEN').length,
    profitableTrades,
    losingTrades,
    totalPnL,
    winRate,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
    profitFactor,
  };
}

function getTradesByDate(trades: Trade[], dateStr: string) {
  const targetDate = new Date(dateStr);
  return trades.filter(t => {
    const tradeDate = new Date(t.tradeDate);
    return tradeDate.toDateString() === targetDate.toDateString();
  });
}

function getTradesByMonth(trades: Trade[], month: number, year: number) {
  return trades.filter(t => {
    const tradeDate = new Date(t.tradeDate);
    return tradeDate.getMonth() + 1 === month && tradeDate.getFullYear() === year;
  });
}

function formatTradesForContext(trades: Trade[]) {
  return trades.map(t => ({
    symbol: t.symbol,
    type: t.tradeType,
    entryPrice: t.entryPrice,
    exitPrice: t.exitPrice,
    quantity: t.quantity,
    profitLoss: t.profitLoss,
    status: t.status,
    date: new Date(t.tradeDate).toLocaleDateString(),
    notes: t.notes,
    isStarred: t.isStarred,
  }));
}

function buildSystemPrompt(
  stats: ReturnType<typeof calculateStats>,
  trades: Trade[],
  goals: Goal[],
  mistakes: Mistake[],
  rules: TradingRule[],
  notifications: NotificationSettings | null
) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Get current month trades and stats
  const currentMonthTrades = getTradesByMonth(trades, currentMonth, currentYear);
  const currentMonthStats = calculateStats(currentMonthTrades);

  // Get current goal
  const currentGoal = goals.find(g => g.month === currentMonth && g.year === currentYear);

  // Get recent trades (last 10)
  const recentTrades = trades.slice(0, 10);

  // Get starred trades
  const starredTrades = trades.filter(t => t.isStarred);

  return `You are Trade Ledger Pro AI, an intelligent trading assistant for a personal trading journal application. You help traders analyze their performance, track their progress, and provide insights based on their trading data.

Current Date: ${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

## OVERALL TRADING STATISTICS
- Total Trades: ${stats.totalTrades}
- Closed Trades: ${stats.closedTrades}
- Open Trades: ${stats.openTrades}
- Total P&L: ₹${stats.totalPnL.toFixed(2)}
- Win Rate: ${stats.winRate.toFixed(1)}%
- Profitable Trades: ${stats.profitableTrades}
- Losing Trades: ${stats.losingTrades}
- Average Win: ₹${stats.avgWin.toFixed(2)}
- Average Loss: ₹${stats.avgLoss.toFixed(2)}
- Largest Win: ₹${stats.largestWin.toFixed(2)}
- Largest Loss: ₹${stats.largestLoss.toFixed(2)}
- Profit Factor: ${stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}

## CURRENT MONTH (${currentDate.toLocaleString('default', { month: 'long' })} ${currentYear}) STATISTICS
- Trades This Month: ${currentMonthStats.totalTrades}
- Month P&L: ₹${currentMonthStats.totalPnL.toFixed(2)}
- Month Win Rate: ${currentMonthStats.winRate.toFixed(1)}%

## CURRENT MONTH GOALS
${currentGoal ? `
- Target P&L: ${currentGoal.targetPnL ? `₹${currentGoal.targetPnL}` : 'Not set'}
- Target Win Rate: ${currentGoal.targetWinRate ? `${currentGoal.targetWinRate}%` : 'Not set'}
- Max Trades Per Day: ${currentGoal.maxTradesPerDay || 'Not set'}
` : 'No goals set for this month.'}

## RECENT TRADES (Last 10)
${recentTrades.length > 0 ? formatTradesForContext(recentTrades).map((t, i) => 
  `${i + 1}. ${t.symbol} (${t.type}) - ${t.status} - P&L: ${t.profitLoss !== null ? `₹${t.profitLoss.toFixed(2)}` : 'Open'} - Date: ${t.date}`
).join('\n') : 'No trades recorded yet.'}

## STARRED/BEST TRADES
${starredTrades.length > 0 ? formatTradesForContext(starredTrades).map((t, i) => 
  `${i + 1}. ${t.symbol} (${t.type}) - P&L: ₹${t.profitLoss?.toFixed(2) || 0} - Date: ${t.date}${t.notes ? ` - Notes: ${t.notes}` : ''}`
).join('\n') : 'No starred trades.'}

## TRADING MISTAKES TRACKED
${mistakes.length > 0 ? mistakes.map((m, i) => 
  `${i + 1}. ${m.title} (Category: ${m.category || 'Uncategorized'}, Frequency: ${m.frequency})${m.description ? ` - ${m.description}` : ''}`
).join('\n') : 'No mistakes tracked.'}

## TRADING RULES

${rules.filter(r => r.isActive).length > 0 ? rules.filter(r => r.isActive).map((r, i) => 
  `${i + 1}. ${r.rule}`
).join('\n') : 'No active trading rules.'}

## NOTIFICATION SETTINGS
- Weekly Reports: ${notifications?.weeklyReports ? 'Enabled' : 'Disabled'}
- Goal Alerts: ${notifications?.goalAlerts ? 'Enabled' : 'Disabled'}

## GUIDELINES
1. Answer questions about the user's trading performance, statistics, and history.
2. Provide insights and analysis based on the data.
3. Help identify patterns, strengths, and areas for improvement.
4. When asked about specific dates or months, provide relevant trade information.
5. Be encouraging but honest about trading performance.
6. Suggest improvements based on the user's mistakes and rules.
7. Keep responses concise but informative.
8. Use the data provided to give personalized advice.
9. If asked about data not available, politely explain what data is available.
10. ALWAYS use Indian Rupee symbol (₹) for currency, NEVER use dollar sign ($). Format all monetary values with ₹.`;
}

async function callGeminiAPI(systemPrompt: string, userMessage: string) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here') {
    throw new Error('Gemini API key not configured. Please add your GEMINI_API_KEY to the .env file.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nUser Question: ${userMessage}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Gemini API error:', errorData);
    throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response generated from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication using session
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get all user data
    const { trades, goals, mistakes, rules, notifications } = await getUserData(session.userId);

    // Calculate overall stats
    const stats = calculateStats(trades);

    // Build system prompt with user data
    const systemPrompt = buildSystemPrompt(stats, trades, goals, mistakes, rules, notifications);

    // Call Gemini API
    const response = await callGeminiAPI(systemPrompt, message);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
