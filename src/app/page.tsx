'use client';

import { useState, useEffect, useCallback } from 'react';

interface GameState {
  username: string;
  clicks: number;
  points: number;
  dailyLimit: number;
  isPlaying: boolean;
  message: string;
  isLoading: boolean;
  maintenance_mode: string;
}

export default function GamePage() {
  const [state, setState] = useState<GameState>({
    username: '',
    clicks: 0,
    points: 0,
    dailyLimit: 1000,
    isPlaying: false,
    message: '',
    isLoading: true,
    maintenance_mode: 'false'
  });
  const [usernameInput, setUsernameInput] = useState('');

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setState(prev => ({
        ...prev,
        maintenance_mode: data.maintenance_mode || 'false',
        dailyLimit: parseInt(data.daily_click_limit || '1000', 10),
        isLoading: false
      }));
    } catch {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadSettings();

    const storedUsername = localStorage.getItem('clickUsername');
    if (storedUsername) {
      setState(prev => ({
        ...prev,
        username: storedUsername,
        isPlaying: true,
        message: `Welcome back, ${storedUsername}!`
      }));
    }
  }, [loadSettings]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setState(prev => ({ ...prev, message: 'Please enter a username' }));
      return;
    }

    localStorage.setItem('clickUsername', usernameInput.trim());
    setState(prev => ({
      ...prev,
      username: usernameInput.trim(),
      isPlaying: true,
      message: `Welcome, ${usernameInput.trim()}!`
    }));
  };

  const handleClick = async () => {
    if (!state.username) return;

    if (state.maintenance_mode === 'true') {
      setState(prev => ({ ...prev, message: 'Game is under maintenance' }));
      return;
    }

    try {
      const res = await fetch('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: state.username })
      });

      const data = await res.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          clicks: data.clicks,
          points: data.points,
          message: `+${data.points - (prev.points)} points!`
        }));
      } else {
        setState(prev => ({ ...prev, message: data.message }));
      }
    } catch {
      setState(prev => ({ ...prev, message: 'Connection error' }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clickUsername');
    setState({
      username: '',
      clicks: 0,
      points: 0,
      dailyLimit: 1000,
      isPlaying: false,
      message: '',
      isLoading: false,
      maintenance_mode: 'false'
    });
  };

  if (state.isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#dce87a] text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-[#dce87a] mb-8 tracking-tight">JUTIS CLICK</h1>

      {!state.isPlaying ? (
        <form onSubmit={handleLogin} className="flex flex-col items-center gap-4">
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="Enter your nickname"
            maxLength={30}
            className="px-6 py-3 bg-[#0f1117] border border-[#1f2937] rounded-lg text-white text-lg w-72 text-center placeholder:text-gray-500 focus:outline-none focus:border-[#dce87a]"
          />
          <button
            type="submit"
            className="px-8 py-3 bg-[#dce87a] text-[#030407] font-bold rounded-lg hover:bg-[#c8d470] transition-colors"
          >
            START PLAYING
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">Playing as</p>
            <p className="text-[#dce87a] text-2xl font-bold">{state.username}</p>
          </div>

          <button
            onClick={handleClick}
            disabled={state.maintenance_mode === 'true'}
            className="click-button pulse-glow w-48 h-48 rounded-full bg-[#dce87a] text-[#030407] text-6xl font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none"
          >
            +
          </button>

          <div className="grid grid-cols-2 gap-8 text-center">
            <div className="bg-[#0f1117] p-4 rounded-lg border border-[#1f2937]">
              <p className="text-gray-400 text-sm">Today&apos;s Clicks</p>
              <p className="text-white text-3xl font-bold">{state.clicks}</p>
              <p className="text-gray-500 text-xs">/ {state.dailyLimit}</p>
            </div>
            <div className="bg-[#0f1117] p-4 rounded-lg border border-[#1f2937]">
              <p className="text-gray-400 text-sm">Points</p>
              <p className="text-[#dce87a] text-3xl font-bold">{state.points}</p>
            </div>
          </div>

          {state.message && (
            <p className="text-gray-400 text-sm">{state.message}</p>
          )}

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-2 bg-[#0f1117] border border-[#1f2937] rounded-lg hover:border-[#dce87a] transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-[#0f1117] border border-[#1f2937] rounded-lg hover:border-[#ef4444] text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <footer className="absolute bottom-4 text-gray-600 text-sm">
        <a href="/admin" className="hover:text-gray-400">Admin</a>
      </footer>
    </main>
  );
}