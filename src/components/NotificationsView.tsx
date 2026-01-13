'use client';

import { useState, useEffect } from 'react';

interface NotificationSettings {
  id: string;
  weeklyReports: boolean;
  goalAlerts: boolean;
  lastWeeklyReport: string | null;
}

interface NotificationsViewProps {
  userEmail: string;
}

export default function NotificationsView({ userEmail }: NotificationsViewProps) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch notification settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to fetch notification settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = async (field: 'weeklyReports' | 'goalAlerts') => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [field]: !settings[field],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setMessage({ type: 'success', text: 'Settings updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      setMessage({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestReport = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/notifications/test-report', {
        method: 'POST',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Test report sent to your email!' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: 'Failed to send test report' });
      }
    } catch (error) {
      console.error('Failed to send test report:', error);
      setMessage({ type: 'error', text: 'Failed to send test report' });
    } finally {
      setSaving(false);
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
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        Notification Settings
      </h3>

      {/* Message */}
      {message && (
        <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border text-sm sm:text-base ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Email Info */}
          <div className="bg-gray-900/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-800">
            <div className="text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">Notifications will be sent to</div>
            <div className="text-white font-medium flex items-center gap-2 text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-emerald-400 break-all">{userEmail}</span>
            </div>
          </div>

          {/* Notification Options */}
          <div className="space-y-3 sm:space-y-4">
            {/* Weekly Reports */}
            <div className="bg-gray-900/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-800 hover:border-gray-700 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">Weekly Performance Reports</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 ml-10 sm:ml-13 pl-0 sm:pl-13">
                    Receive a detailed weekly digest every Friday at 8:00 PM IST with your trading 
                    performance, win rate, total P&L, and insights from the week.
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('weeklyReports')}
                  disabled={saving}
                  className={`relative w-11 h-6 sm:w-14 sm:h-8 rounded-full transition-all flex-shrink-0 ${
                    settings?.weeklyReports 
                      ? 'bg-emerald-500' 
                      : 'bg-gray-600'
                  }`}
                >
                  <span 
                    className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full transition-transform shadow-md ${
                      settings?.weeklyReports ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              
              {settings?.lastWeeklyReport && (
                <div className="mt-2 sm:mt-3 ml-10 sm:ml-13 text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Last sent: {new Date(settings.lastWeeklyReport).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </div>
              )}
            </div>

            {/* Goal Alerts */}
            <div className="bg-gray-900/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-800 hover:border-gray-700 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">Goal Alerts</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 ml-10 sm:ml-13">
                    Get notified when you're approaching your monthly targets. Receive alerts at 
                    50%, 75%, and 100% of your P&L and win rate goals.
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('goalAlerts')}
                  disabled={saving}
                  className={`relative w-11 h-6 sm:w-14 sm:h-8 rounded-full transition-all flex-shrink-0 ${
                    settings?.goalAlerts 
                      ? 'bg-emerald-500' 
                      : 'bg-gray-600'
                  }`}
                >
                  <span 
                    className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full transition-transform shadow-md ${
                      settings?.goalAlerts ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Test Email */}
          <div className="bg-gray-900/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-800">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm sm:text-base">Test Your Notifications</h4>
                <p className="text-xs sm:text-sm text-gray-400">Send a test weekly report to verify your email settings.</p>
              </div>
            </div>
            <button
              onClick={handleSendTestReport}
              disabled={saving || !settings?.weeklyReports}
              className={`w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm font-semibold ${
                settings?.weeklyReports
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : 'Send Test Report'}
            </button>
          </div>

          {/* Info Note */}
          <div className="bg-gray-900/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-800">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-white font-semibold text-sm sm:text-base">How Notifications Work</h4>
            </div>
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-start gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm text-gray-400">Weekly reports are sent every <span className="text-blue-400 font-medium">Friday at 8:00 PM IST</span></span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm text-gray-400">Goal alerts trigger when you close a trade that brings you closer to your target</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm text-gray-400">You can unsubscribe at any time by toggling the settings</span>
              </li>
            </ul>
          </div>

          {/* Schedule Info */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-emerald-500/20">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-400 font-semibold text-sm sm:text-base">Next Weekly Report</p>
                <p className="text-xs sm:text-sm text-gray-400">Friday, 8:00 PM IST</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
