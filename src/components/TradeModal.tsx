'use client';

import { useState, useEffect } from 'react';
import DatePicker from './DatePicker';
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
}

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Partial<Trade>) => void;
  trade: Trade | null;
}

export default function TradeModal({ isOpen, onClose, onSave, trade }: TradeModalProps) {
  const { currency, setCurrency, symbol } = useCurrency();

  // Format date to YYYY-MM-DD using LOCAL timezone (not UTC)
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    symbol: '',
    tradeType: 'BUY',
    instrumentType: 'STOCK',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    stopLoss: '',
    takeProfit: '',
    status: 'OPEN',
    notes: '',
    tradeDate: formatDateToYYYYMMDD(new Date()),
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (trade) {
      // Parse the date string directly if it's in YYYY-MM-DD format
      const tradeDateStr = trade.tradeDate.split('T')[0];
      setFormData({
        symbol: trade.symbol,
        tradeType: trade.tradeType,
        instrumentType: trade.instrumentType || 'STOCK',
        entryPrice: trade.entryPrice.toString(),
        exitPrice: trade.exitPrice?.toString() || '',
        quantity: trade.quantity.toString(),
        stopLoss: trade.stopLoss?.toString() || '',
        takeProfit: trade.takeProfit?.toString() || '',
        status: trade.status,
        notes: trade.notes || '',
        tradeDate: tradeDateStr,
      });
    } else {
      setFormData({
        symbol: '',
        tradeType: 'BUY',
        instrumentType: 'STOCK',
        entryPrice: '',
        exitPrice: '',
        quantity: '',
        stopLoss: '',
        takeProfit: '',
        status: 'OPEN',
        notes: '',
        tradeDate: formatDateToYYYYMMDD(new Date()),
      });
    }
    setError('');
  }, [trade, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.symbol || !formData.entryPrice || !formData.quantity || !formData.tradeDate) {
      setError('Please fill in all required fields');
      return;
    }

    onSave({
      symbol: formData.symbol,
      tradeType: formData.tradeType,
      instrumentType: formData.instrumentType,
      entryPrice: parseFloat(formData.entryPrice),
      exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : null,
      quantity: parseFloat(formData.quantity),
      stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
      takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : null,
      status: formData.exitPrice ? 'CLOSED' : formData.status,
      notes: formData.notes || null,
      tradeDate: formData.tradeDate,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl p-4 sm:p-6 max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-800 shadow-2xl shadow-black/50 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {trade ? 'Edit Trade' : 'Add New Trade'}
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              {trade ? 'Update your trade details' : 'Enter your trade information'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Currency Selector */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <label className="block text-xs sm:text-sm text-gray-400 mb-2">Currency</label>
          <div className="flex gap-2">
            {/* <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-semibold transition-all duration-200 text-sm ${
                currency === 'USD'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-base sm:text-lg">$</span>
                <span>USD</span>
              </span>
            </button> */}
            <button
              type="button"
              onClick={() => setCurrency('INR')}
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-semibold transition-all duration-200 text-sm ${
                currency === 'INR'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-base sm:text-lg">₹</span>
                <span>INR</span>
              </span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Instrument Type */}
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1">Instrument Type *</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
              {[
                { value: 'STOCK', label: 'Stock', icon: '📊' },
                { value: 'FUTURES', label: 'Futures', icon: '📈' },
                { value: 'OPTIONS', label: 'Options', icon: '⚡' },
                { value: 'INDEX', label: 'Index', icon: '📉' },
                { value: 'FOREX', label: 'Forex', icon: '💱' },
                { value: 'CRYPTO', label: 'Crypto', icon: '₿' },
                { value: 'COMMODITY', label: 'Cmdty', icon: '🛢️' },
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, instrumentType: type.value })}
                  className={`py-2 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all flex flex-col items-center gap-0.5 sm:gap-1 ${
                    formData.instrumentType === type.value
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
                  }`}
                >
                  <span className="text-sm sm:text-base">{type.icon}</span>
                  <span className="truncate w-full text-center">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Symbol and Trade Type */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">Symbol *</label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
                placeholder="Nifty 50"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">Trade Type *</label>
              <select
                value={formData.tradeType}
                onChange={(e) => setFormData({ ...formData, tradeType: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
              >
                <option value="BUY" className="bg-gray-900">BUY</option>
                <option value="SELL" className="bg-gray-900">SELL</option>
              </select>
            </div>
          </div>

          {/* Entry and Exit Price */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">Entry Price ({symbol}) *</label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.entryPrice}
                  onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                  className="w-full pl-7 sm:pl-8 pr-2 sm:pr-4 py-2 sm:py-2.5 rounded-xl bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
                  placeholder="100.00"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">Exit Price ({symbol})</label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.exitPrice}
                  onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
                  className="w-full pl-7 sm:pl-8 pr-2 sm:pr-4 py-2 sm:py-2.5 rounded-xl bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
                  placeholder="110.00"
                />
              </div>
            </div>
          </div>

          {/* Quantity and Trade Date */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">Quantity *</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
                placeholder="10"
                required
              />
            </div>
            <DatePicker
              value={formData.tradeDate}
              onChange={(date) => setFormData({ ...formData, tradeDate: date })}
              label="Trade Date"
              required
            />
          </div>

          {/* Stop Loss and Take Profit */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">Stop Loss ({symbol})</label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-red-500 text-sm">{symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.stopLoss}
                  onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
                  className="w-full pl-7 sm:pl-8 pr-2 sm:pr-4 py-2 sm:py-2.5 rounded-xl bg-gray-900/50 border border-red-900/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all text-sm"
                  placeholder="95.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">Take Profit ({symbol})</label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-emerald-500 text-sm">{symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.takeProfit}
                  onChange={(e) => setFormData({ ...formData, takeProfit: e.target.value })}
                  className="w-full pl-7 sm:pl-8 pr-2 sm:pr-4 py-2 sm:py-2.5 rounded-xl bg-gray-900/50 border border-emerald-900/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
                  placeholder="120.00"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          {!formData.exitPrice && (
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
              >
                <option value="OPEN" className="bg-gray-900">Open</option>
                <option value="CLOSED" className="bg-gray-900">Closed</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all min-h-[80px] sm:min-h-[100px] resize-none text-sm"
              placeholder="Add any notes about this trade..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl transition-all duration-200 border border-gray-700 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200 text-sm"
            >
              {trade ? 'Update Trade' : 'Add Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
