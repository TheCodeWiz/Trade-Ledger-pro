'use client';

import { useState, useMemo } from 'react';
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

interface CalendarViewProps {
  trades: Trade[];
}

type ViewMode = 'month' | 'year';

interface DayStats {
  trades: number;
  pnl: number;
  winRate: number;
}

interface MonthStats {
  trades: number;
  pnl: number;
  winRate: number;
}

export default function CalendarView({ trades }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { formatAmount } = useCurrency();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate stats for each day in the current month
  const dailyStats = useMemo(() => {
    const stats: Record<string, DayStats> = {};
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    trades.forEach((trade) => {
      const tradeDate = new Date(trade.tradeDate);
      if (tradeDate.getFullYear() === year && tradeDate.getMonth() === month) {
        const day = tradeDate.getDate();
        const key = `${year}-${month}-${day}`;
        
        if (!stats[key]) {
          stats[key] = { trades: 0, pnl: 0, winRate: 0 };
        }
        
        stats[key].trades += 1;
        stats[key].pnl += trade.profitLoss || 0;
      }
    });

    // Calculate win rate for each day
    Object.keys(stats).forEach((key) => {
      const [y, m, d] = key.split('-').map(Number);
      const dayTrades = trades.filter((t) => {
        const td = new Date(t.tradeDate);
        return td.getFullYear() === y && td.getMonth() === m && td.getDate() === d && t.status === 'CLOSED';
      });
      const profitable = dayTrades.filter((t) => t.profitLoss && t.profitLoss > 0).length;
      stats[key].winRate = dayTrades.length > 0 ? (profitable / dayTrades.length) * 100 : 0;
    });

    return stats;
  }, [trades, currentDate]);

  // Calculate stats for each month in the current year
  const monthlyStats = useMemo(() => {
    const stats: Record<number, MonthStats> = {};
    const year = currentDate.getFullYear();

    for (let month = 0; month < 12; month++) {
      stats[month] = { trades: 0, pnl: 0, winRate: 0 };
    }

    trades.forEach((trade) => {
      const tradeDate = new Date(trade.tradeDate);
      if (tradeDate.getFullYear() === year) {
        const month = tradeDate.getMonth();
        stats[month].trades += 1;
        stats[month].pnl += trade.profitLoss || 0;
      }
    });

    // Calculate win rate for each month
    for (let month = 0; month < 12; month++) {
      const monthTrades = trades.filter((t) => {
        const td = new Date(t.tradeDate);
        return td.getFullYear() === year && td.getMonth() === month && t.status === 'CLOSED';
      });
      const profitable = monthTrades.filter((t) => t.profitLoss && t.profitLoss > 0).length;
      stats[month].winRate = monthTrades.length > 0 ? (profitable / monthTrades.length) * 100 : 0;
    }

    return stats;
  }, [trades, currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToPrevYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
  };

  const goToNextYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (month: number) => {
    const today = new Date();
    return month === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  const formatCompactAmount = (amount: number): string => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000000) {
      return `${amount >= 0 ? '' : '-'}${(absAmount / 1000000).toFixed(1)}M`;
    } else if (absAmount >= 1000) {
      return `${amount >= 0 ? '' : '-'}${(absAmount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(0);
  };

  return (
    <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 bg-gray-800/50 border-b border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 sm:gap-2 bg-gray-900 rounded-xl p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                viewMode === 'month'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                viewMode === 'year'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Year
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1 sm:gap-2">
            {viewMode === 'year' && (
              <button
                onClick={goToPrevYear}
                className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                title="Previous Year"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            )}
            {viewMode === 'month' && (
              <button
                onClick={goToPrevMonth}
                className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                title="Previous Month"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            <span className="text-white font-semibold min-w-[100px] sm:min-w-[140px] text-center text-xs sm:text-base">
              {viewMode === 'month'
                ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : currentDate.getFullYear()}
            </span>
            
            {viewMode === 'month' && (
              <button
                onClick={goToNextMonth}
                className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                title="Next Month"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            {viewMode === 'year' && (
              <button
                onClick={goToNextYear}
                className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                title="Next Year"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7m-8-14l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-emerald-500"></div>
              <span className="text-gray-400">Profit</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-red-500"></div>
              <span className="text-gray-400">Loss</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-gray-700"></div>
              <span className="text-gray-400">No Trades</span>
            </div>
          </div>
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="p-2 sm:p-4">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-[10px] sm:text-xs font-medium text-gray-500 py-1 sm:py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty cells for days before the first day of month */}
            {Array.from({ length: startingDay }).map((_, index) => (
              <div key={`empty-${index}`} className="h-16 sm:h-24 md:h-28" />
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
              const stats = dailyStats[key];
              const hasTrades = stats && stats.trades > 0;
              const isProfit = stats && stats.pnl > 0;
              const isLoss = stats && stats.pnl < 0;
              
              return (
                <div
                  key={day}
                  className={`
                    h-[70px] sm:h-24 md:h-28 p-1 sm:p-2 rounded-lg sm:rounded-xl border transition-all flex flex-col overflow-hidden
                    ${isToday(day) ? 'ring-1 sm:ring-2 ring-emerald-500 ring-offset-1 sm:ring-offset-2 ring-offset-gray-900' : ''}
                    ${hasTrades
                      ? isProfit
                        ? 'bg-emerald-500/20 border-emerald-500/30 hover:bg-emerald-500/30'
                        : isLoss
                        ? 'bg-red-500/20 border-red-500/30 hover:bg-red-500/30'
                        : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                      : 'bg-gray-800/30 border-gray-800 hover:bg-gray-800/50'
                    }
                  `}
                >
                  <span className={`text-[10px] sm:text-sm font-medium ${isToday(day) ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {day}
                  </span>
                  
                  {hasTrades && (
                    <div className="mt-auto flex flex-col items-start min-w-0">
                      <div className={`text-[9px] sm:text-sm font-bold leading-tight truncate w-full ${isProfit ? 'text-emerald-400' : isLoss ? 'text-red-400' : 'text-gray-400'}`}>
                        {stats.pnl >= 0 ? '+' : ''}{formatCompactAmount(stats.pnl)}
                      </div>
                      <div className="text-[7px] sm:text-xs text-gray-500 leading-tight truncate w-full">
                        {stats.trades} trade{stats.trades !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Year View */}
      {viewMode === 'year' && (
        <div className="p-2 sm:p-4">
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
            {monthNamesShort.map((monthName, monthIndex) => {
              const stats = monthlyStats[monthIndex];
              const hasTrades = stats && stats.trades > 0;
              const isProfit = stats && stats.pnl > 0;
              const isLoss = stats && stats.pnl < 0;
              
              return (
                <div
                  key={monthIndex}
                  onClick={() => {
                    setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
                    setViewMode('month');
                  }}
                  className={`
                    p-2 sm:p-4 rounded-lg sm:rounded-xl border cursor-pointer transition-all min-h-[100px] sm:min-h-[130px]
                    ${isCurrentMonth(monthIndex) ? 'ring-1 sm:ring-2 ring-emerald-500 ring-offset-1 sm:ring-offset-2 ring-offset-gray-900' : ''}
                    ${hasTrades
                      ? isProfit
                        ? 'bg-emerald-500/20 border-emerald-500/30 hover:bg-emerald-500/30'
                        : isLoss
                        ? 'bg-red-500/20 border-red-500/30 hover:bg-red-500/30'
                        : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                      : 'bg-gray-800/30 border-gray-800 hover:bg-gray-800/50'
                    }
                  `}
                >
                  <div className="text-center overflow-hidden">
                    <span className={`text-sm sm:text-lg font-semibold ${isCurrentMonth(monthIndex) ? 'text-emerald-400' : 'text-white'}`}>
                      {monthName}
                    </span>
                    
                    {hasTrades ? (
                      <div className="mt-1.5 sm:mt-3 flex flex-col items-center min-w-0">
                        <div className={`text-[10px] sm:text-xl font-bold leading-tight truncate w-full ${isProfit ? 'text-emerald-400' : isLoss ? 'text-red-400' : 'text-gray-400'}`}>
                          {stats.pnl >= 0 ? '+' : ''}<span className="sm:hidden">{formatCompactAmount(stats.pnl)}</span><span className="hidden sm:inline">{formatAmount(stats.pnl)}</span>
                        </div>
                        <div className="text-[8px] sm:text-xs text-gray-500 leading-tight">
                          {stats.trades} trade{stats.trades !== 1 ? 's' : ''}
                        </div>
                        <div className="text-[8px] sm:text-xs text-gray-400 leading-tight">
                          Win: {stats.winRate.toFixed(0)}%
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1.5 sm:mt-3 text-[9px] sm:text-sm text-gray-600">
                        No trades
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="p-2 sm:p-4 bg-gray-800/30 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-1 sm:gap-4">
          <div className="text-center px-1">
            <div className="text-base sm:text-2xl font-bold text-white">
              {viewMode === 'month'
                ? Object.values(dailyStats).reduce((sum, s) => sum + s.trades, 0)
                : Object.values(monthlyStats).reduce((sum, s) => sum + s.trades, 0)}
            </div>
            <div className="text-[8px] sm:text-xs text-gray-500 uppercase tracking-wider leading-tight">
              Total<br className="sm:hidden" /> Trades
            </div>
          </div>
          <div className="text-center px-1">
            {(() => {
              const totalPnl = viewMode === 'month'
                ? Object.values(dailyStats).reduce((sum, s) => sum + s.pnl, 0)
                : Object.values(monthlyStats).reduce((sum, s) => sum + s.pnl, 0);
              return (
                <>
                  <div className={`text-base sm:text-2xl font-bold truncate ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatAmount(totalPnl)}
                  </div>
                  <div className="text-[8px] sm:text-xs text-gray-500 uppercase tracking-wider leading-tight">
                    {viewMode === 'month' ? 'Monthly' : 'Yearly'}<br className="sm:hidden" /> P&L
                  </div>
                </>
              );
            })()}
          </div>
          <div className="text-center px-1">
            {(() => {
              const relevantTrades = trades.filter((t) => {
                const td = new Date(t.tradeDate);
                if (viewMode === 'month') {
                  return td.getFullYear() === currentDate.getFullYear() && 
                         td.getMonth() === currentDate.getMonth() && 
                         t.status === 'CLOSED';
                } else {
                  return td.getFullYear() === currentDate.getFullYear() && t.status === 'CLOSED';
                }
              });
              const profitable = relevantTrades.filter((t) => t.profitLoss && t.profitLoss > 0).length;
              const winRate = relevantTrades.length > 0 ? (profitable / relevantTrades.length) * 100 : 0;
              
              return (
                <>
                  <div className={`text-base sm:text-2xl font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {winRate.toFixed(1)}%
                  </div>
                  <div className="text-[8px] sm:text-xs text-gray-500 uppercase tracking-wider leading-tight">
                    Win<br className="sm:hidden" /> Rate
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
