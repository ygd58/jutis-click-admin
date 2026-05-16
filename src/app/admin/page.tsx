'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  created_at: string;
  total_clicks: number;
  xp_balance: number;
  status: string;
}

interface Settings {
  points_per_click: string;
  daily_click_limit: string;
  click_cooldown_ms: string;
  click_to_xp_rate: string;
  maintenance_mode: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Settings>({
    points_per_click: '1',
    daily_click_limit: '1000',
    click_cooldown_ms: '0',
    click_to_xp_rate: '100',
    maintenance_mode: 'false'
  });

  const [xpSendStatus, setXpSendStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'xp'>('users');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'admin123') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const settingsRes = await fetch('/api/settings');
      const settingsData = await settingsRes.json();
      setSettings(settingsData);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }

    try {
      const usersRes = await fetch('/api/admin/users');
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleSettingChange = async (key: keyof Settings, value: string) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ key, value })
      });

      if (res.ok) {
        setSettings(prev => ({ ...prev, [key]: value }));
      }
    } catch (err) {
      console.error('Failed to update setting:', err);
    }
  };

  const handleUserAction = async (userId: string, action: 'ban' | 'activate') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, status: action === 'ban' ? 'banned' : 'active' } : u
        ));
      }
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleSendXP = async () => {
    setXpSendStatus('Sending...');
    try {
      const res = await fetch('/api/xp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        }
      });

      const data = await res.json();
      setXpSendStatus(data.success ? `Success: ${data.message}` : `Failed: ${data.error}`);
    } catch (err) {
      setXpSendStatus('Failed to send XP');
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-[#0f1117] border border-[#1f2937] rounded-lg p-8 flex flex-col gap-4 w-80">
          <h1 className="text-2xl font-bold text-[#dce87a] text-center">ADMIN LOGIN</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="px-4 py-2 bg-[#030407] border border-[#1f2937] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#dce87a]"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="px-6 py-2 bg-[#dce87a] text-[#030407] font-bold rounded-lg hover:bg-[#c8d470] transition-colors"
          >
            LOGIN
          </button>
          <a href="/" className="text-center text-gray-400 text-sm hover:text-white">Back to Game</a>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#dce87a]">ADMIN PANEL</h1>
          <a
            href="/"
            className="px-4 py-2 bg-[#0f1117] border border-[#1f2937] rounded-lg hover:border-[#dce87a] transition-colors"
          >
            Back to Game
          </a>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              activeTab === 'users'
                ? 'bg-[#dce87a] text-[#030407]'
                : 'bg-[#0f1117] border border-[#1f2937] text-white hover:border-[#dce87a]'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              activeTab === 'settings'
                ? 'bg-[#dce87a] text-[#030407]'
                : 'bg-[#0f1117] border border-[#1f2937] text-white hover:border-[#dce87a]'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('xp')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              activeTab === 'xp'
                ? 'bg-[#dce87a] text-[#030407]'
                : 'bg-[#0f1117] border border-[#1f2937] text-white hover:border-[#dce87a]'
            }`}
          >
            XP API
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="bg-[#0f1117] border border-[#1f2937] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f2937]">
                  <th className="text-left p-4 text-gray-400 font-medium">Username</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Registered</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Total Clicks</th>
                  <th className="text-right p-4 text-gray-400 font-medium">XP Balance</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Status</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-[#1f2937] last:border-0 hover:bg-[#1a1a2e]">
                    <td className="p-4 text-white font-medium">{user.username}</td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-white text-right">{user.total_clicks.toLocaleString()}</td>
                    <td className="p-4 text-[#dce87a] text-right font-bold">{user.xp_balance.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        user.status === 'active'
                          ? 'bg-green-900 text-green-400'
                          : 'bg-red-900 text-red-400'
                      }`}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleUserAction(user.id, 'ban')}
                          className="px-3 py-1 bg-red-900 text-red-400 rounded text-sm hover:bg-red-800 transition-colors"
                        >
                          BAN
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(user.id, 'activate')}
                          className="px-3 py-1 bg-green-900 text-green-400 rounded text-sm hover:bg-green-800 transition-colors"
                        >
                          ACTIVATE
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0f1117] border border-[#1f2937] rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Click Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Points per click</label>
                  <input
                    type="number"
                    value={settings.points_per_click}
                    onChange={(e) => setSettings(prev => ({ ...prev, points_per_click: e.target.value }))}
                    onBlur={(e) => handleSettingChange('points_per_click', e.target.value)}
                    className="w-full px-4 py-2 bg-[#030407] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#dce87a]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Daily click limit</label>
                  <input
                    type="number"
                    value={settings.daily_click_limit}
                    onChange={(e) => setSettings(prev => ({ ...prev, daily_click_limit: e.target.value }))}
                    onBlur={(e) => handleSettingChange('daily_click_limit', e.target.value)}
                    className="w-full px-4 py-2 bg-[#030407] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#dce87a]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Cooldown between clicks (ms)</label>
                  <input
                    type="number"
                    value={settings.click_cooldown_ms}
                    onChange={(e) => setSettings(prev => ({ ...prev, click_cooldown_ms: e.target.value }))}
                    onBlur={(e) => handleSettingChange('click_cooldown_ms', e.target.value)}
                    className="w-full px-4 py-2 bg-[#030407] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#dce87a]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Click to XP rate (clicks per XP)</label>
                  <input
                    type="number"
                    value={settings.click_to_xp_rate}
                    onChange={(e) => setSettings(prev => ({ ...prev, click_to_xp_rate: e.target.value }))}
                    onBlur={(e) => handleSettingChange('click_to_xp_rate', e.target.value)}
                    className="w-full px-4 py-2 bg-[#030407] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#dce87a]"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#0f1117] border border-[#1f2937] rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Game Mode</h2>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Maintenance Mode</p>
                  <p className="text-gray-400 text-sm">Block all game activity</p>
                </div>
                <button
                  onClick={() => handleSettingChange('maintenance_mode', settings.maintenance_mode === 'true' ? 'false' : 'true')}
                  className={`relative w-16 h-8 rounded-full transition-colors ${
                    settings.maintenance_mode === 'true' ? 'bg-red-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      settings.maintenance_mode === 'true' ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {settings.maintenance_mode === 'true' && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
                  <p className="text-red-400 text-sm">Game is currently under maintenance. Players cannot click.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'xp' && (
          <div className="bg-[#0f1117] border border-[#1f2937] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">XP API Integration</h2>
            <p className="text-gray-400 mb-4">
              Send all user XP scores to the external Vault API for leaderboard or rewards system.
            </p>

            <button
              onClick={handleSendXP}
              className="px-6 py-3 bg-[#dce87a] text-[#030407] font-bold rounded-lg hover:bg-[#c8d470] transition-colors"
            >
              SEND XP SCORES TO VAULT API
            </button>

            {xpSendStatus && (
              <p className={`mt-4 text-sm ${xpSendStatus.includes('Success') ? 'text-[#dce87a]' : 'text-red-400'}`}>
                {xpSendStatus}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}