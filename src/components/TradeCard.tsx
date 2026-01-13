'use client';

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
  isStarred?: boolean;
  tradeDate: string;
  createdAt: string;
}

interface TradeCardProps {
  trade: Trade;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStar?: () => void;
}

export default function TradeCard({ trade, onEdit, onDelete, onToggleStar }: TradeCardProps) {
  const { formatAmount } = useCurrency();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get instrument type display info
  const getInstrumentBadge = (type: string) => {
    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      STOCK: { bg: 'bg-blue-500/15 border-blue-500/30', text: 'text-blue-400', icon: '📊' },
      FUTURES: { bg: 'bg-purple-500/15 border-purple-500/30', text: 'text-purple-400', icon: '📈' },
      OPTIONS: { bg: 'bg-orange-500/15 border-orange-500/30', text: 'text-orange-400', icon: '⚡' },
      INDEX: { bg: 'bg-cyan-500/15 border-cyan-500/30', text: 'text-cyan-400', icon: '📉' },
      FOREX: { bg: 'bg-green-500/15 border-green-500/30', text: 'text-green-400', icon: '💱' },
      CRYPTO: { bg: 'bg-yellow-500/15 border-yellow-500/30', text: 'text-yellow-400', icon: '₿' },
      COMMODITY: { bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400', icon: '🛢️' },
    };
    return badges[type] || badges.STOCK;
  };

  const instrumentBadge = getInstrumentBadge(trade.instrumentType || 'STOCK');

  return (
    <div className={`bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl p-3 sm:p-6 border ${trade.isStarred ? 'border-yellow-500/30' : 'border-gray-800'} hover:border-gray-700 transition-all duration-300 shadow-xl shadow-black/20 group`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-5">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-xl font-bold text-white tracking-tight truncate mb-1.5">{trade.symbol}</h3>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <span
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-xs font-bold uppercase tracking-wider ${
                trade.status === 'OPEN'
                  ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {trade.status}
            </span>
            <span
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-xs font-bold uppercase tracking-wider ${
                trade.tradeType === 'BUY'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}
            >
              {trade.tradeType}
            </span>
            <span className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-xs font-medium border ${instrumentBadge.bg} ${instrumentBadge.text}`}>
              {trade.instrumentType || 'STOCK'}
            </span>
          </div>
          <p className="text-gray-500 text-[10px] sm:text-sm flex items-center gap-1 mt-1.5">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(trade.tradeDate)}</span>
          </p>
        </div>
        {/* Star Button */}
        {onToggleStar && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
            className={`p-1.5 sm:p-2 rounded-lg transition-all flex-shrink-0 ${trade.isStarred ? 'text-yellow-400 bg-yellow-500/20' : 'text-gray-600 hover:text-yellow-400 hover:bg-gray-800'}`}
            title={trade.isStarred ? 'Unstar trade' : 'Star as best trade'}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={trade.isStarred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        )}
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-gray-700/50">
          <p className="text-gray-500 text-[9px] sm:text-xs uppercase tracking-wider mb-0.5">Entry Price</p>
          <p className="text-white font-semibold text-xs sm:text-lg truncate">{formatAmount(trade.entryPrice)}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-gray-700/50">
          <p className="text-gray-500 text-[9px] sm:text-xs uppercase tracking-wider mb-0.5">Exit Price</p>
          <p className="text-white font-semibold text-xs sm:text-lg truncate">{formatAmount(trade.exitPrice)}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-gray-700/50">
          <p className="text-gray-500 text-[9px] sm:text-xs uppercase tracking-wider mb-0.5">Quantity</p>
          <p className="text-white font-semibold text-xs sm:text-lg">{trade.quantity}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-gray-700/50">
          <p className="text-gray-500 text-[9px] sm:text-xs uppercase tracking-wider mb-0.5">P&L</p>
          <p
            className={`font-bold text-xs sm:text-lg truncate ${
              trade.profitLoss === null
                ? 'text-gray-500'
                : trade.profitLoss >= 0
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}
          >
            {trade.profitLoss !== null
              ? `${trade.profitLoss >= 0 ? '+' : ''}${formatAmount(trade.profitLoss)}`
              : '-'}
          </p>
        </div>
      </div>

      {/* Stop Loss / Take Profit */}
      {(trade.stopLoss || trade.takeProfit) && (
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4 pt-3 sm:pt-4 border-t border-gray-800">
          {trade.stopLoss && (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 flex-shrink-0"></div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-[9px] sm:text-xs uppercase tracking-wider">Stop Loss</p>
                <p className="text-red-400 font-semibold text-[11px] sm:text-base truncate">{formatAmount(trade.stopLoss)}</p>
              </div>
            </div>
          )}
          {trade.takeProfit && (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-500 text-[9px] sm:text-xs uppercase tracking-wider">Take Profit</p>
                <p className="text-emerald-400 font-semibold text-[11px] sm:text-base truncate">{formatAmount(trade.takeProfit)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="mb-3 sm:mb-4 pt-3 sm:pt-4 border-t border-gray-800">
          <p className="text-gray-500 text-[9px] sm:text-xs uppercase tracking-wider mb-1">Notes</p>
          <p className="text-gray-400 text-[11px] sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3">{trade.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-800">
        <button
          onClick={onEdit}
          className="flex-1 py-2 sm:py-2.5 px-2 sm:px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg sm:rounded-xl transition-all duration-200 text-[11px] sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2 border border-gray-700"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 py-2 sm:py-2.5 px-2 sm:px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg sm:rounded-xl transition-all duration-200 text-[11px] sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2 border border-red-500/30"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
