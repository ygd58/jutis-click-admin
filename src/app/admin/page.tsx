'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/realtime-js';

interface User {
  id: string;
  username: string;
  total_clicks: number;
  xp_balance: number;
  status: 'active' | 'banned';
  created_at: string;
}

interface Settings {
  points_per_click: string;
  daily_click_limit: string;
  click_cooldown_ms: string;
  click_to_xp_rate: string;
  maintenance_mode: string;
}

export default function AdminPanel() {
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
      setupRealtime();
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
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const setupRealtime = () => {
    if (!supabase) return;

    // Users tablosunu dinle
    const usersChannel: RealtimeChannel = supabase
      .channel('users-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('User update:', payload);
          
          if (payload.eventType === 'UPDATE') {
            setUsers(prev =>
              prev.map(u =>
                u.id === payload.new.id
                  ? {
                      id: payload.new.id,
                      username: payload.new.username,
                      total_clicks: payload.new.total_clicks,
                      xp_balance: payload.new.xp_balance,
                      status: payload.new.status,
                      created_at: payload.new.created_at
                    }
                  : u
              )
            );
          } else if (payload.eventType === 'INSERT') {
            setUsers(prev => [
              ...prev,
              {
                id: payload.new.id,
                username: payload.new.username,
                total_clicks: payload.new.total_clicks,
                xp_balance: payload.new.xp_balance,
                status: payload.new.status,
                created_at: payload.new.created_at
              }
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
    };
  };

  const updateSetting = async (key: string, value: string) => {
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
      <main className="min-h-screen flex items-center justify-center bg-[#030407]">
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
    <main className="min-h-screen p-8 bg-[#030407]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#dce87a]">ADMIN PANEL 🔴 LIVE</h1>
          <a href="/" className="px-4 py-2 bg-[#0f1117] border border-[#1f2937] rounded-lg hover:border-[#dce87a] transition-colors">
            Back to Game
          </a>
        </div>

        <div className="flex gap-2 mb-6">
          {['users', 'settings', 'xp'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'users' | 'settings' | 'xp')}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                activeTab === tab
                  ? 'bg-[#dce87a] text-[#030407]'
                  : 'bg-[#0f1117] border border-[#1f2937] text-white hover:border-[#dce87a]'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="grid gap-4">
            <div className="bg-[#0f1117] border border-[#1f2937] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#1f2937]">
                  <tr>
                    <th className="px-4 py-2 text-left text-[#dce87a]">Username</th>
                    <th className="px-4 py-2 text-right text-[#dce87a]">Clicks</th>
                    <th className="px-4 py-2 text-right text-[#dce87a]">XP</th>
                    <th className="px-4 py-2 text-center text-[#dce87a]">Status</th>
                    <th className="px-4 py-2 text-center text-[#dce87a]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2937]">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-[#1a1f2e] transition-colors">
                      <td className="px-4 py-3 text-white">{user.username}</td>
                      <td className="px-4 py-3 text-right text-[#dce87a] font-bold">{user.total_clicks}</td>
                      <td className="px-4 py-3 text-right text-blue-400 font-bold">{user.xp_balance}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          user.status === 'active'
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-red-900/30 text-red-400'
                        }`}>
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleUserAction(user.id, user.status === 'active' ? 'ban' : 'activate')}
                          className="px-3 py-1 text-xs font-bold rounded transition-colors"
                          style={{
                            backgroundColor: user.status === 'active' ? '#ef4444' : '#22c55e',
                            color: '#030407'
                          }}
                        >
                          {user.status === 'active' ? 'BAN' : 'ACTIVATE'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="grid gap-4">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="bg-[#0f1117] border border-[#1f2937] rounded-lg p-4">
                <label className="block text-sm font-bold text-[#dce87a] mb-2 uppercase">{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateSetting(key, e.target.value)}
                  className="w-full px-4 py-2 bg-[#030407] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-[#dce87a]"
                />
              </div>
            ))}
          </div>
        )}

        {/* XP TAB */}
        {activeTab === 'xp' && (
          <div className="bg-[#0f1117] border border-[#1f2937] rounded-lg p-8">
            <button
              onClick={handleSendXP}
              className="w-full px-6 py-3 bg-[#dce87a] text-[#030407] font-bold rounded-lg hover:bg-[#c8d470] transition-colors mb-4"
            >
              SEND XP
            </button>
            {xpSendStatus && (
              <p className={`text-center font-bold ${xpSendStatus.includes('Success') ? 'text-green-400' : 'text-red-400'}`}>
                {xpSendStatus}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
