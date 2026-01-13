'use client';

import { useMemo } from 'react';
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

interface AnalyticsViewProps {
  trades: Trade[];
}

export default function AnalyticsView({ trades }: AnalyticsViewProps) {
  const { formatAmount } = useCurrency();

  // Risk Analysis Calculations
  const riskAnalysis = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.profitLoss !== null);
    
    if (closedTrades.length === 0) {
      return {
        avgRiskReward: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0,
      };
    }

    // Calculate Risk/Reward for each trade
    const riskRewards = closedTrades
      .filter(t => t.stopLoss && t.takeProfit)
      .map(t => {
        const risk = Math.abs(t.entryPrice - (t.stopLoss || t.entryPrice));
        const reward = Math.abs((t.takeProfit || t.entryPrice) - t.entryPrice);
        return risk > 0 ? reward / risk : 0;
      });
    const avgRiskReward = riskRewards.length > 0 
      ? riskRewards.reduce((a, b) => a + b, 0) / riskRewards.length 
      : 0;

    // Calculate Max Drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;
    closedTrades.forEach(trade => {
      cumulative += trade.profitLoss || 0;
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Calculate Sharpe Ratio (simplified - using daily returns std dev)
    const returns = closedTrades.map(t => t.profitLoss || 0);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

    // Profit Factor
    const grossProfit = closedTrades.filter(t => (t.profitLoss || 0) > 0).reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const grossLoss = Math.abs(closedTrades.filter(t => (t.profitLoss || 0) < 0).reduce((sum, t) => sum + (t.profitLoss || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    // Average Win/Loss
    const wins = closedTrades.filter(t => (t.profitLoss || 0) > 0);
    const losses = closedTrades.filter(t => (t.profitLoss || 0) < 0);
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / losses.length : 0;

    // Largest Win/Loss
    const largestWin = Math.max(0, ...closedTrades.map(t => t.profitLoss || 0));
    const largestLoss = Math.min(0, ...closedTrades.map(t => t.profitLoss || 0));

    return {
      avgRiskReward,
      maxDrawdown,
      sharpeRatio,
      profitFactor,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
    };
  }, [trades]);

  // Trade Distribution Data
  const distribution = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    
    // By Symbol
    const bySymbol: Record<string, { count: number; pnl: number }> = {};
    closedTrades.forEach(trade => {
      if (!bySymbol[trade.symbol]) {
        bySymbol[trade.symbol] = { count: 0, pnl: 0 };
      }
      bySymbol[trade.symbol].count++;
      bySymbol[trade.symbol].pnl += trade.profitLoss || 0;
    });

    // By Trade Type
    const byType = {
      BUY: { count: 0, pnl: 0 },
      SELL: { count: 0, pnl: 0 },
    };
    closedTrades.forEach(trade => {
      const type = trade.tradeType as 'BUY' | 'SELL';
      if (byType[type]) {
        byType[type].count++;
        byType[type].pnl += trade.profitLoss || 0;
      }
    });

    // By Day of Week
    const byDayOfWeek: Record<string, { count: number; pnl: number }> = {
      'Sunday': { count: 0, pnl: 0 },
      'Monday': { count: 0, pnl: 0 },
      'Tuesday': { count: 0, pnl: 0 },
      'Wednesday': { count: 0, pnl: 0 },
      'Thursday': { count: 0, pnl: 0 },
      'Friday': { count: 0, pnl: 0 },
      'Saturday': { count: 0, pnl: 0 },
    };
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    closedTrades.forEach(trade => {
      const day = dayNames[new Date(trade.tradeDate).getDay()];
      byDayOfWeek[day].count++;
      byDayOfWeek[day].pnl += trade.profitLoss || 0;
    });

    return { bySymbol, byType, byDayOfWeek };
  }, [trades]);

  // Simple Pie Chart Component
  const PieChart = ({ data, title }: { data: { label: string; value: number; color: string }[]; title: string }) => {
    const total = data.reduce((sum, d) => sum + Math.abs(d.value), 0);
    let currentAngle = 0;

    const paths = data.map((item, index) => {
      const percentage = total > 0 ? Math.abs(item.value) / total : 0;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (currentAngle - 90) * Math.PI / 180;
      
      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      if (percentage === 0) return null;
      
      return (
        <path
          key={index}
          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={item.color}
          className="transition-all hover:opacity-80"
        />
      );
    });

    return (
      <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
        <h4 className="text-xs sm:text-sm font-medium text-gray-400 mb-2 sm:mb-3">{title}</h4>
        <div className="flex items-center gap-3 sm:gap-4">
          <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-24 sm:h-24">
            {total > 0 ? paths : (
              <circle cx="50" cy="50" r="40" fill="#374151" />
            )}
          </svg>
          <div className="flex-1 space-y-0.5 sm:space-y-1">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-gray-400 truncate">{item.label}</span>
                <span className="text-white ml-auto">{Math.abs(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Bar Chart Component
  const BarChart = ({ data, title }: { data: { label: string; value: number }[]; title: string }) => {
    const maxValue = Math.max(...data.map(d => Math.abs(d.value)), 1);

    return (
      <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
        <h4 className="text-xs sm:text-sm font-medium text-gray-400 mb-2 sm:mb-3">{title}</h4>
        <div className="space-y-1.5 sm:space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-xs text-gray-400 w-8 sm:w-12 truncate">{item.label.slice(0, 3)}</span>
              <div className="flex-1 h-4 sm:h-6 bg-gray-700 rounded-lg overflow-hidden">
                <div
                  className={`h-full rounded-lg transition-all ${item.value >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${(Math.abs(item.value) / maxValue) * 100}%` }}
                />
              </div>
              <span className={`text-[10px] sm:text-xs font-medium w-6 sm:w-8 text-right ${item.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const symbolData = Object.entries(distribution.bySymbol)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map((entry, index) => ({
      label: entry[0],
      value: entry[1].count,
      color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
    }));

  const typeData = [
    { label: 'BUY', value: distribution.byType.BUY.count, color: '#10b981' },
    { label: 'SELL', value: distribution.byType.SELL.count, color: '#ef4444' },
  ];

  const dayData = Object.entries(distribution.byDayOfWeek).map(([day, data]) => ({
    label: day,
    value: data.count,
  }));

  const dayPnLData = Object.entries(distribution.byDayOfWeek).map(([day, data]) => ({
    label: day,
    value: Math.round(data.pnl),
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Risk Analysis Section */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">📊</span>
          Risk Analysis
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
            <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Avg Risk/Reward</div>
            <div className={`text-lg sm:text-2xl font-bold ${riskAnalysis.avgRiskReward >= 1 ? 'text-emerald-400' : 'text-yellow-400'}`}>
              1:{riskAnalysis.avgRiskReward.toFixed(2)}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Target: 1:2+</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
            <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Max Drawdown</div>
            <div className="text-lg sm:text-2xl font-bold text-red-400">
              {formatAmount(-riskAnalysis.maxDrawdown)}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Peak to trough</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
            <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Sharpe Ratio</div>
            <div className={`text-lg sm:text-2xl font-bold ${riskAnalysis.sharpeRatio >= 1 ? 'text-emerald-400' : riskAnalysis.sharpeRatio >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
              {riskAnalysis.sharpeRatio.toFixed(2)}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Risk-adjusted return</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
            <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Profit Factor</div>
            <div className={`text-lg sm:text-2xl font-bold ${riskAnalysis.profitFactor >= 1.5 ? 'text-emerald-400' : riskAnalysis.profitFactor >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
              {riskAnalysis.profitFactor === Infinity ? '∞' : riskAnalysis.profitFactor.toFixed(2)}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Gross profit / loss</div>
          </div>
        </div>

        {/* Additional Risk Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-2 sm:mt-4">
          <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
            <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Average Win</div>
            <div className="text-base sm:text-xl font-bold text-emerald-400">
              {formatAmount(riskAnalysis.avgWin)}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
            <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Average Loss</div>
            <div className="text-base sm:text-xl font-bold text-red-400">
              {formatAmount(riskAnalysis.avgLoss)}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
            <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Largest Win</div>
            <div className="text-base sm:text-xl font-bold text-emerald-400">
              {formatAmount(riskAnalysis.largestWin)}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
            <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Largest Loss</div>
            <div className="text-base sm:text-xl font-bold text-red-400">
              {formatAmount(riskAnalysis.largestLoss)}
            </div>
          </div>
        </div>
      </div>

      {/* Trade Distribution Section */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">📈</span>
          Trade Distribution
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-4">
          <PieChart data={symbolData.length > 0 ? symbolData : [{ label: 'No Data', value: 1, color: '#374151' }]} title="By Symbol (Top 5)" />
          <PieChart data={typeData} title="By Trade Type" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
          <BarChart data={dayData} title="Trades by Day of Week" />
          <BarChart data={dayPnLData} title="P&L by Day of Week" />
        </div>
      </div>

      {/* Symbol Performance Table */}
      <div className="bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-700">
          <h4 className="text-xs sm:text-sm font-medium text-white">Symbol Performance</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900/50">
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-400">Symbol</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-400">Trades</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-400">P&L</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-400">Avg P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {Object.entries(distribution.bySymbol)
                .sort((a, b) => b[1].pnl - a[1].pnl)
                .map(([symbol, data]) => (
                  <tr key={symbol} className="hover:bg-gray-800/50">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white font-medium">{symbol}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-300 text-right">{data.count}</td>
                    <td className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-right ${data.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatAmount(data.pnl)}
                    </td>
                    <td className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right ${(data.pnl / data.count) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatAmount(data.pnl / data.count)}
                    </td>
                  </tr>
                ))}
              {Object.keys(distribution.bySymbol).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-500 text-xs sm:text-sm">
                    No closed trades yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
