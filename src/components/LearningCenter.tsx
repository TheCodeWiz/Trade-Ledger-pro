'use client';

import { useState, useEffect } from 'react';
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
  isStarred: boolean;
  tradeDate: string;
  createdAt: string;
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

interface LearningCenterProps {
  trades: Trade[];
  onToggleStar: (tradeId: string) => void;
}

type TabType = 'mistakes' | 'bestTrades' | 'rules';

export default function LearningCenter({ trades, onToggleStar }: LearningCenterProps) {
  const { formatAmount } = useCurrency();
  const [activeTab, setActiveTab] = useState<TabType>('mistakes');
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [rules, setRules] = useState<TradingRule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [newMistake, setNewMistake] = useState({ title: '', description: '', category: '' });
  const [newRule, setNewRule] = useState('');
  const [isAddingMistake, setIsAddingMistake] = useState(false);
  const [isAddingRule, setIsAddingRule] = useState(false);

  const starredTrades = trades.filter(t => t.isStarred);

  const categories = ['Emotional', 'Technical', 'Risk Management', 'Timing', 'Position Sizing', 'Other'];

  // Fetch mistakes and rules
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mistakesRes, rulesRes] = await Promise.all([
          fetch('/api/mistakes'),
          fetch('/api/rules'),
        ]);

        if (mistakesRes.ok) {
          const mistakesData = await mistakesRes.json();
          setMistakes(mistakesData);
        }

        if (rulesRes.ok) {
          const rulesData = await rulesRes.json();
          setRules(rulesData);
        }
      } catch (error) {
        console.error('Failed to fetch learning data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Add mistake
  const handleAddMistake = async () => {
    if (!newMistake.title.trim()) return;

    try {
      const response = await fetch('/api/mistakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMistake),
      });

      if (response.ok) {
        const data = await response.json();
        setMistakes([data, ...mistakes]);
        setNewMistake({ title: '', description: '', category: '' });
        setIsAddingMistake(false);
      }
    } catch (error) {
      console.error('Failed to add mistake:', error);
    }
  };

  // Increment mistake frequency
  const handleIncrementMistake = async (id: string) => {
    try {
      const response = await fetch(`/api/mistakes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'increment' }),
      });

      if (response.ok) {
        setMistakes(mistakes.map(m => 
          m.id === id ? { ...m, frequency: m.frequency + 1 } : m
        ));
      }
    } catch (error) {
      console.error('Failed to increment mistake:', error);
    }
  };

  // Delete mistake
  const handleDeleteMistake = async (id: string) => {
    try {
      const response = await fetch(`/api/mistakes/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMistakes(mistakes.filter(m => m.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete mistake:', error);
    }
  };

  // Add rule
  const handleAddRule = async () => {
    if (!newRule.trim()) return;

    try {
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: newRule }),
      });

      if (response.ok) {
        const data = await response.json();
        setRules([...rules, data]);
        setNewRule('');
        setIsAddingRule(false);
      }
    } catch (error) {
      console.error('Failed to add rule:', error);
    }
  };

  // Toggle rule active status
  const handleToggleRule = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        setRules(rules.map(r => 
          r.id === id ? { ...r, isActive: !isActive } : r
        ));
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  // Delete rule
  const handleDeleteRule = async (id: string) => {
    try {
      const response = await fetch(`/api/rules/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setRules(rules.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 sm:gap-2 bg-gray-800/50 p-1 sm:p-1.5 rounded-xl border border-gray-700 w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('mistakes')}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'mistakes'
              ? 'bg-emerald-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          📝 <span className="hidden sm:inline">Mistake Log</span>
        </button>
        <button
          onClick={() => setActiveTab('bestTrades')}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'bestTrades'
              ? 'bg-emerald-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          ⭐ <span className="hidden sm:inline">Best Trades</span> ({starredTrades.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'rules'
              ? 'bg-emerald-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          📋 <span className="hidden sm:inline">Trading Rules</span>
        </button>
      </div>

      {/* Mistake Log Tab */}
      {activeTab === 'mistakes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Mistake Log</h3>
            <button
              onClick={() => setIsAddingMistake(!isAddingMistake)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all text-sm font-medium border border-gray-700"
            >
              {isAddingMistake ? 'Cancel' : '+ Add Mistake'}
            </button>
          </div>

          {/* Add Mistake Form */}
          {isAddingMistake && (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-4 animate-slideDown">
              <input
                type="text"
                value={newMistake.title}
                onChange={(e) => setNewMistake({ ...newMistake, title: e.target.value })}
                placeholder="What mistake did you make?"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
              <div className="flex gap-4">
                <select
                  value={newMistake.category}
                  onChange={(e) => setNewMistake({ ...newMistake, category: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddMistake}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all"
                >
                  Add
                </button>
              </div>
              <textarea
                value={newMistake.description}
                onChange={(e) => setNewMistake({ ...newMistake, description: e.target.value })}
                placeholder="What happened? How can you avoid this?"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none"
              />
            </div>
          )}

          {/* Mistakes List */}
          <div className="space-y-3">
            {mistakes.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-gray-400">No mistakes logged yet. Learning from mistakes is key to improvement!</p>
              </div>
            ) : (
              mistakes.map(mistake => (
                <div key={mistake.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-red-400 text-xl font-bold">{mistake.frequency}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-medium">{mistake.title}</h4>
                      {mistake.category && (
                        <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full">
                          {mistake.category}
                        </span>
                      )}
                    </div>
                    {mistake.description && (
                      <p className="text-sm text-gray-400">{mistake.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleIncrementMistake(mistake.id)}
                      className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-all"
                      title="Log again"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteMistake(mistake.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Best Trades Tab */}
      {activeTab === 'bestTrades' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Best Trades Archive</h3>
            <p className="text-sm text-gray-400">Star trades from Dashboard to add them here</p>
          </div>

          {starredTrades.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700">
              <div className="text-4xl mb-2">⭐</div>
              <p className="text-gray-400">No starred trades yet. Star your best trades from the Dashboard to archive them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {starredTrades.map(trade => (
                <div key={trade.id} className="bg-gray-800/50 rounded-xl p-4 border border-yellow-500/30 relative">
                  <button
                    onClick={() => onToggleStar(trade.id)}
                    className="absolute top-3 right-3 text-yellow-400 hover:text-yellow-300 transition-all"
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg font-bold text-white">{trade.symbol}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      trade.tradeType === 'BUY' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {trade.tradeType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <div className="text-gray-400">Entry</div>
                      <div className="text-white font-medium">{formatAmount(trade.entryPrice)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Exit</div>
                      <div className="text-white font-medium">{trade.exitPrice ? formatAmount(trade.exitPrice) : '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Quantity</div>
                      <div className="text-white font-medium">{trade.quantity}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">P&L</div>
                      <div className={`font-bold ${(trade.profitLoss || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trade.profitLoss ? formatAmount(trade.profitLoss) : '-'}
                      </div>
                    </div>
                  </div>

                  {trade.notes && (
                    <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                      <div className="text-xs text-gray-400 mb-1">Setup / Psychology</div>
                      <div className="text-sm text-gray-300">{trade.notes}</div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-3">
                    {new Date(trade.tradeDate).toLocaleDateString('en-US', { 
                      year: 'numeric', month: 'short', day: 'numeric' 
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trading Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Trading Rules Checklist</h3>
            <button
              onClick={() => setIsAddingRule(!isAddingRule)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all text-sm font-medium border border-gray-700"
            >
              {isAddingRule ? 'Cancel' : '+ Add Rule'}
            </button>
          </div>

          {/* Add Rule Form */}
          {isAddingRule && (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 flex gap-4 animate-slideDown">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="Enter your trading rule..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
              />
              <button
                onClick={handleAddRule}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all"
              >
                Add
              </button>
            </div>
          )}

          {/* Rules List */}
          <div className="space-y-2">
            {rules.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-gray-400">No trading rules yet. Define your rules to stay disciplined!</p>
              </div>
            ) : (
              rules.map((rule, index) => (
                <div 
                  key={rule.id} 
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    rule.isActive 
                      ? 'bg-gray-800/50 border-gray-700' 
                      : 'bg-gray-900/30 border-gray-800 opacity-60'
                  }`}
                >
                  <button
                    onClick={() => handleToggleRule(rule.id, rule.isActive)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      rule.isActive 
                        ? 'bg-emerald-500 border-emerald-500' 
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {rule.isActive && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className="text-gray-400 text-sm font-medium w-6">{index + 1}.</span>
                  <span className={`flex-1 ${rule.isActive ? 'text-white' : 'text-gray-500 line-through'}`}>
                    {rule.rule}
                  </span>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {rules.length > 0 && (
            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">
                  {rules.filter(r => r.isActive).length} / {rules.length} rules active
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
