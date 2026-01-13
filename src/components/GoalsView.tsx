'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCurrency } from '@/context/CurrencyContext';

interface Trade {
  id: string;
  symbol: string;
  tradeType: string;
  instrumentType: string;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  profitLoss: number | null;
  status: string;
  notes: string | null;
  tradeDate: string;
  createdAt: string;
}

interface Goal {
  id: string;
  month: number;
  year: number;
  targetPnL: number | null;
  targetWinRate: number | null;
  maxTradesPerDay: number | null;
}

interface GoalsViewProps {
  trades: Trade[];
}

export default function GoalsView({ trades }: GoalsViewProps) {
  const { formatAmount, symbol } = useCurrency();
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    targetPnL: '',
    targetWinRate: '',
    maxTradesPerDay: '',
  });

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Fetch current month's goal
  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const response = await fetch(`/api/goals?month=${currentMonth}&year=${currentYear}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentGoal(data);
          if (data) {
            setFormData({
              targetPnL: data.targetPnL?.toString() || '',
              targetWinRate: data.targetWinRate?.toString() || '',
              maxTradesPerDay: data.maxTradesPerDay?.toString() || '',
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch goal:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGoal();
  }, [currentMonth, currentYear]);

  // Calculate current month's performance
  const monthlyStats = useMemo(() => {
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0);

    const monthTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.tradeDate);
      return tradeDate >= monthStart && tradeDate <= monthEnd;
    });

    const closedTrades = monthTrades.filter(t => t.status === 'CLOSED');
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const wins = closedTrades.filter(t => (t.profitLoss || 0) > 0).length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

    // Trades per day calculation
    const tradesByDay: Record<string, number> = {};
    monthTrades.forEach(trade => {
      const dateKey = trade.tradeDate.split('T')[0];
      tradesByDay[dateKey] = (tradesByDay[dateKey] || 0) + 1;
    });
    const maxTradesInDay = Math.max(0, ...Object.values(tradesByDay));

    // Calculate streaks
    const sortedDates = [...new Set(closedTrades.map(t => t.tradeDate.split('T')[0]))].sort();
    let currentWinStreak = 0;
    let currentLoseStreak = 0;
    let maxWinStreak = 0;
    let maxLoseStreak = 0;
    let profitableDays = 0;
    let losingDays = 0;

    sortedDates.forEach(date => {
      const dayTrades = closedTrades.filter(t => t.tradeDate.split('T')[0] === date);
      const dayPnL = dayTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
      
      if (dayPnL > 0) {
        profitableDays++;
        currentWinStreak++;
        currentLoseStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if (dayPnL < 0) {
        losingDays++;
        currentLoseStreak++;
        currentWinStreak = 0;
        maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
      }
    });

    return {
      totalTrades: monthTrades.length,
      closedTrades: closedTrades.length,
      totalPnL,
      winRate,
      maxTradesInDay,
      currentWinStreak,
      currentLoseStreak,
      maxWinStreak,
      maxLoseStreak,
      profitableDays,
      losingDays,
    };
  }, [trades, currentMonth, currentYear]);

  const handleSaveGoal = async () => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: currentMonth,
          year: currentYear,
          targetPnL: formData.targetPnL ? parseFloat(formData.targetPnL) : null,
          targetWinRate: formData.targetWinRate ? parseFloat(formData.targetWinRate) : null,
          maxTradesPerDay: formData.maxTradesPerDay ? parseInt(formData.maxTradesPerDay) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentGoal(data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  };

  // Progress calculations
  const pnlProgress = currentGoal?.targetPnL 
    ? Math.min(100, Math.max(0, (monthlyStats.totalPnL / currentGoal.targetPnL) * 100))
    : 0;
  
  const winRateProgress = currentGoal?.targetWinRate
    ? Math.min(100, Math.max(0, (monthlyStats.winRate / currentGoal.targetWinRate) * 100))
    : 0;

  const tradesPerDayStatus = currentGoal?.maxTradesPerDay
    ? monthlyStats.maxTradesInDay <= currentGoal.maxTradesPerDay
    : true;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Monthly Goals Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🎯</span>
          {monthNames[currentMonth - 1]} {currentYear} Goals
        </h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm font-medium border border-gray-700"
        >
          {isEditing ? 'Cancel' : currentGoal ? 'Edit Goals' : 'Set Goals'}
        </button>
      </div>

      {/* Goal Setting Form */}
      {isEditing && (
        <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700 animate-slideDown">
          <h4 className="text-white font-medium mb-3 sm:mb-4 text-sm sm:text-base">Set Your Monthly Targets</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">Target P&L ({symbol})</label>
              <input
                type="number"
                value={formData.targetPnL}
                onChange={(e) => setFormData({ ...formData, targetPnL: e.target.value })}
                placeholder="e.g., 10000"
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">Target Win Rate (%)</label>
              <input
                type="number"
                value={formData.targetWinRate}
                onChange={(e) => setFormData({ ...formData, targetWinRate: e.target.value })}
                placeholder="e.g., 60"
                min="0"
                max="100"
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">Max Trades Per Day</label>
              <input
                type="number"
                value={formData.maxTradesPerDay}
                onChange={(e) => setFormData({ ...formData, maxTradesPerDay: e.target.value })}
                placeholder="e.g., 5"
                min="1"
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm sm:text-base"
              />
            </div>
          </div>
          <button
            onClick={handleSaveGoal}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm sm:text-base"
          >
            Save Goals
          </button>
        </div>
      )}

      {/* Progress Trackers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* P&L Progress */}
        <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-gray-700">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-sm text-gray-400">P&L Target</span>
            <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
              pnlProgress >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 
              pnlProgress >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 
              'bg-gray-700 text-gray-400'
            }`}>
              {pnlProgress.toFixed(0)}%
            </span>
          </div>
          <div className="h-2.5 sm:h-3 bg-gray-700 rounded-full overflow-hidden mb-1.5 sm:mb-2">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                monthlyStats.totalPnL >= 0 ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.abs(pnlProgress))}%` }}
            />
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className={monthlyStats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {formatAmount(monthlyStats.totalPnL)}
            </span>
            <span className="text-gray-500">
              / {currentGoal?.targetPnL ? formatAmount(currentGoal.targetPnL) : 'Not set'}
            </span>
          </div>
        </div>

        {/* Win Rate Progress */}
        <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-gray-700">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-sm text-gray-400">Win Rate Target</span>
            <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
              winRateProgress >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 
              winRateProgress >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 
              'bg-gray-700 text-gray-400'
            }`}>
              {winRateProgress.toFixed(0)}%
            </span>
          </div>
          <div className="h-2.5 sm:h-3 bg-gray-700 rounded-full overflow-hidden mb-1.5 sm:mb-2">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, winRateProgress)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-blue-400">{monthlyStats.winRate.toFixed(1)}%</span>
            <span className="text-gray-500">
              / {currentGoal?.targetWinRate ? `${currentGoal.targetWinRate}%` : 'Not set'}
            </span>
          </div>
        </div>

        {/* Max Trades Per Day */}
        <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-gray-700">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-sm text-gray-400">Max Trades/Day</span>
            <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
              tradesPerDayStatus ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {tradesPerDayStatus ? '✓ On Track' : '⚠ Exceeded'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">
            {monthlyStats.maxTradesInDay}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            Limit: {currentGoal?.maxTradesPerDay || 'Not set'}
          </div>
        </div>
      </div>

      {/* Streaks Section */}
      <div>
        <h4 className="text-sm sm:text-md font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <span className="text-lg sm:text-xl">🔥</span>
          Streaks & Consistency
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-0.5 sm:mb-1">
              {monthlyStats.currentWinStreak}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-400">Current Win Streak</div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Best: {monthlyStats.maxWinStreak}</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-0.5 sm:mb-1">
              {monthlyStats.currentLoseStreak}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-400">Current Lose Streak</div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Worst: {monthlyStats.maxLoseStreak}</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-0.5 sm:mb-1">
              {monthlyStats.profitableDays}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-400">Profitable Days</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-0.5 sm:mb-1">
              {monthlyStats.losingDays}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-400">Losing Days</div>
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700">
        <h4 className="text-sm sm:text-md font-semibold text-white mb-3 sm:mb-4">Monthly Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">{monthlyStats.totalTrades}</div>
            <div className="text-xs sm:text-sm text-gray-400">Total Trades</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">{monthlyStats.closedTrades}</div>
            <div className="text-xs sm:text-sm text-gray-400">Closed Trades</div>
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-bold ${monthlyStats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatAmount(monthlyStats.totalPnL)}
            </div>
            <div className="text-xs sm:text-sm text-gray-400">Total P&L</div>
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-bold ${monthlyStats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
              {monthlyStats.winRate.toFixed(1)}%
            </div>
            <div className="text-xs sm:text-sm text-gray-400">Win Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
