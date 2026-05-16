'use client';

import { useState, useEffect, useCallback } from 'react';

interface UserProfile {
  username: string;
  total_clicks: number;
  xp_balance: number;
}

interface Transaction {
  id: string;
  clicks_spent: number;
  xp_received: number;
  timestamp: string;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayClicks, setTodayClicks] = useState(0);
  const [swapAmount, setSwapAmount] = useState('');
  const [message, setMessage] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');

  const loadData = useCallback(async () => {
    const storedUsername = localStorage.getItem('clickUsername');
    if (!storedUsername) {
      window.location.href = '/';
      return;
    }

    setUsername(storedUsername);

    try {
      const res = await fetch(`/api/user?username=${encodeURIComponent(storedUsername)}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setTodayClicks(data.todayClicks || 0);
        setTransactions(data.transactions || []);
      } else {
        setProfile({
          username: storedUsername,
          total_clicks: 0,
          xp_balance: 0
        });
        setTodayClicks(0);
      }
    } catch {
      setProfile({
        username: storedUsername,
        total_clicks: 0,
        xp_balance: 0
      });
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSwap = async () => {
    const amount = parseInt(swapAmount, 10);
    if (!amount || amount <= 0) {
      setMessage('Please enter a valid amount');
      return;
    }

    if (amount > todayClicks) {
      setMessage(`Not enough clicks (you have ${todayClicks})`);
      return;
    }

    try {
      const res = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, clicks: amount })
      });

      const data = await res.json();

      if (data.success) {
        setMessage(`+${data.xpGained} XP gained!`);
        setSwapAmount('');
        loadData();
      } else {
        setMessage(data.message);
      }
    } catch {
      setMessage('Connection error');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[#dce87a] text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#dce87a]">DASHBOARD</h1>
          <a
            href="/"
            className="px-4 py-2 bg-[#0f1117] border border-[#1f2937] rounded-lg hover:border-[#dce87a] transition-colors"
          >
            Back to Game
          </a>
        </div>

        <div className="bg-[#0f1117] border border-[#1f2937] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Profile</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Username</p>
              <p className="text-white text-xl font-bold">{profile?.username}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Clicks</p>
              <p className="text-white text-xl font-bold">{profile?.total_clicks?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">XP Balance</p>
              <p className="text-[#dce87a] text-xl font-bold">{profile?.xp_balance?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0f1117] border border-[#1f2937] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Swap Clicks to XP</h2>
          <p className="text-gray-400 text-sm mb-4">Available clicks today: <span className="text-white font-bold">{todayClicks}</span></p>
          <p className="text-gray-400 text-sm mb-4">Rate: 100 clicks = 1 XP</p>

          <div className="flex gap-4">
            <input
              type="number"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              placeholder="Enter clicks to swap"
              min="1"
              max={todayClicks}
              className="flex-1 px-4 py-2 bg-[#030407] border border-[#1f2937] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#dce87a]"
            />
            <button
              onClick={handleSwap}
              className="px-6 py-2 bg-[#dce87a] text-[#030407] font-bold rounded-lg hover:bg-[#c8d470] transition-colors"
            >
              SWAP
            </button>
          </div>

          {message && (
            <p className={`mt-4 text-sm ${message.includes('+') ? 'text-[#dce87a]' : 'text-red-400'}`}>{message}</p>
          )}
        </div>

        <div className="bg-[#0f1117] border border-[#1f2937] rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Transaction History</h2>

          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-[#1f2937]">
                    <th className="text-left py-2">Date</th>
                    <th className="text-right py-2">Clicks Spent</th>
                    <th className="text-right py-2">XP Received</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-[#1f2937] last:border-0">
                      <td className="py-3 text-gray-400 text-sm">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-white">
                        {tx.clicks_spent.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-[#dce87a] font-bold">
                        +{tx.xp_received}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}