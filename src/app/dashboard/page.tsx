'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TradeModal from '@/components/TradeModal';
import TradeCard from '@/components/TradeCard';
import StatsCard from '@/components/StatsCard';
import ConfirmModal from '@/components/ConfirmModal';
import DatePicker from '@/components/DatePicker';
import CalendarView from '@/components/CalendarView';
import AnalyticsView from '@/components/AnalyticsView';
import GoalsView from '@/components/GoalsView';
import LearningCenter from '@/components/LearningCenter';
import NotificationsView from '@/components/NotificationsView';
import AIChatbot from '@/components/AIChatbot';
import { CurrencyProvider, useCurrency } from '@/context/CurrencyContext';

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
  tradeDate: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

type TabType = 'dashboard' | 'calendar' | 'analytics' | 'goals' | 'learning' | 'notifications';

function DashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; tradeId: string | null }>({
    isOpen: false,
    tradeId: null,
  });
  const router = useRouter();
  const { formatAmount } = useCurrency();

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch {
      router.push('/login');
    }
  };

  const fetchTrades = async () => {
    try {
      // Fetch all trades for calendar view (without filters)
      const allRes = await fetch('/api/trades');
      if (allRes.ok) {
        const allData = await allRes.json();
        // Normalize isStarred to always be a boolean
        const normalizedAllTrades = allData.trades.map((trade: Trade) => ({
          ...trade,
          isStarred: trade.isStarred ?? false,
        }));
        setAllTrades(normalizedAllTrades);
      }

      // Fetch filtered trades for dashboard view
      let url = '/api/trades';
      const params = new URLSearchParams();
      
      if (selectedDate) {
        const date = new Date(selectedDate);
        const startDate = new Date(date.setHours(0, 0, 0, 0)).toISOString();
        const endDate = new Date(date.setHours(23, 59, 59, 999)).toISOString();
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }
      
      if (filterStatus) {
        params.append('status', filterStatus);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Normalize isStarred to always be a boolean
        const normalizedTrades = data.trades.map((trade: Trade) => ({
          ...trade,
          isStarred: trade.isStarred ?? false,
        }));
        setTrades(normalizedTrades);
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTrades();
    }
  }, [user, selectedDate, filterStatus]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleAddTrade = () => {
    setEditingTrade(null);
    setIsModalOpen(true);
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setIsModalOpen(true);
  };

  const handleDeleteTrade = async (id: string) => {
    setDeleteConfirm({ isOpen: true, tradeId: id });
  };

  const handleToggleStar = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleStar' }),
      });
      if (res.ok) {
        // Update local state
        setTrades(trades.map(t => 
          t.id === tradeId ? { ...t, isStarred: !t.isStarred } : t
        ));
        setAllTrades(allTrades.map(t => 
          t.id === tradeId ? { ...t, isStarred: !t.isStarred } : t
        ));
      }
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.tradeId) return;
    
    try {
      const res = await fetch(`/api/trades/${deleteConfirm.tradeId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTrades();
      }
    } catch (error) {
      console.error('Failed to delete trade:', error);
    } finally {
      setDeleteConfirm({ isOpen: false, tradeId: null });
    }
  };

  const handleSaveTrade = async (tradeData: Partial<Trade>) => {
    try {
      const url = editingTrade ? `/api/trades/${editingTrade.id}` : '/api/trades';
      const method = editingTrade ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchTrades();
      }
    } catch (error) {
      console.error('Failed to save trade:', error);
    }
  };

  // Calculate stats
  const totalTrades = trades.length;
  const profitableTrades = trades.filter((t) => t.profitLoss && t.profitLoss > 0).length;
  const totalProfitLoss = trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
  const winRate = totalTrades > 0 ? ((profitableTrades / trades.filter(t => t.status === 'CLOSED').length) * 100) || 0 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-emerald-500"></div>
          <p className="text-gray-400 text-sm">Loading your trades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Trade Ledger Pro</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 hidden sm:block">Welcome, <span className="text-white font-medium">{user?.name}</span></span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl transition-all duration-200 text-sm font-medium border border-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-gray-900/50 border-b border-gray-800 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-4 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-4 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar
              </span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-4 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </span>
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-4 py-4 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'goals'
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Goals
              </span>
            </button>
            <button
              onClick={() => setActiveTab('learning')}
              className={`px-4 py-4 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'learning'
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Learning
              </span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-4 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'notifications'
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifications
              </span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatsCard
                title="Total Trades"
                value={totalTrades.toString()}
                icon="📊"
              />
              <StatsCard
                title="Win Rate"
                value={`${winRate.toFixed(1)}%`}
                icon="🎯"
                color={winRate >= 50 ? 'green' : 'red'}
              />
              <StatsCard
                title="Total P&L"
                value={formatAmount(totalProfitLoss)}
                icon={totalProfitLoss >= 0 ? '📈' : '📉'}
                color={totalProfitLoss >= 0 ? 'green' : 'red'}
              />
              <StatsCard
                title="Profitable Trades"
                value={profitableTrades.toString()}
                icon="✅"
                color="green"
              />
            </div>

            {/* Filters and Add Button */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6 p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
              <div className="flex flex-wrap items-end gap-4">
                <div className="w-48">
                  <DatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    label="Filter by Date"
                    placeholder="Select date..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Filter by Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  >
                    <option value="" className="bg-gray-900">All</option>
                    <option value="OPEN" className="bg-gray-900">Open</option>
                    <option value="CLOSED" className="bg-gray-900">Closed</option>
                  </select>
                </div>
                {(selectedDate || filterStatus) && (
                  <button
                    onClick={() => {
                      setSelectedDate('');
                      setFilterStatus('');
                    }}
                    className="px-4 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Filters
                  </button>
                )}
              </div>
              <button
                onClick={handleAddTrade}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transform transition-all duration-200 hover:scale-[1.02] flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Trade
              </button>
            </div>

            {/* Trades List */}
            {trades.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/50 rounded-2xl border border-gray-800">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-800 rounded-2xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No trades yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">Start tracking your trades by adding your first entry to see your performance analytics</p>
                <button
                  onClick={handleAddTrade}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200"
                >
                  Add Your First Trade
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trades.map((trade) => (
                  <TradeCard
                    key={trade.id}
                    trade={trade}
                    onEdit={() => handleEditTrade(trade)}
                    onDelete={() => handleDeleteTrade(trade.id)}
                    onToggleStar={() => handleToggleStar(trade.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Calendar Tab Content */}
        {activeTab === 'calendar' && (
          <CalendarView trades={allTrades} />
        )}

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && (
          <AnalyticsView trades={allTrades} />
        )}

        {/* Goals Tab Content */}
        {activeTab === 'goals' && (
          <GoalsView trades={allTrades} />
        )}

        {/* Learning Tab Content */}
        {activeTab === 'learning' && (
          <LearningCenter trades={allTrades} onToggleStar={handleToggleStar} />
        )}

        {/* Notifications Tab Content */}
        {activeTab === 'notifications' && (
          <NotificationsView userEmail={user?.email || ''} />
        )}
      </main>

      {/* Trade Modal */}
      <TradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTrade}
        trade={editingTrade}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Trade"
        message="Are you sure you want to delete this trade? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, tradeId: null })}
      />

      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <CurrencyProvider>
      <DashboardContent />
    </CurrencyProvider>
  );
}
