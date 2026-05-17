'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
interface GameState { username:string; clicks:number; points:number; xpBalance:number; dailyLimit:number; isPlaying:boolean; message:string; isLoading:boolean; maintenance_mode:string; }
export default function GamePage() {
  const [state, setState] = useState<GameState>({ username:'', clicks:0, points:0, xpBalance:0, dailyLimit:1000, isPlaying:false, message:'', isLoading:true, maintenance_mode:'false' });
  const [usernameInput, setUsernameInput] = useState('');
  const [isClicking, setIsClicking] = useState(false);
  const [particles, setParticles] = useState<{id:number,x:number,y:number}[]>([]);
  const pid = useRef(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const loadSettings = useCallback(async () => {
    try { const res = await fetch('/api/settings'); const data = await res.json(); setState(prev => ({ ...prev, maintenance_mode: data.maintenance_mode||'false', dailyLimit: parseInt(data.daily_click_limit||'1000',10), isLoading:false })); }
    catch { setState(prev => ({ ...prev, isLoading:false })); }
  }, []);
  useEffect(() => {
    loadSettings();
    const stored = localStorage.getItem('clickUsername');
    if (stored) {
      setState(prev => ({ ...prev, username:stored, isPlaying:true, isLoading:false }));
      fetch('/api/user', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:stored}) })
        .then(r=>r.json()).then(data => { if(data.user) setState(prev => ({ ...prev, xpBalance:data.user.xp_balance||0, clicks:data.user.today_clicks||0, points:data.user.total_clicks||0 })); }).catch(()=>{});
    }
  }, [loadSettings]);
  const spawnParticle = (e: React.MouseEvent) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const id = ++pid.current;
    setParticles(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 700);
  };
  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); if (!usernameInput.trim()) return; localStorage.setItem('clickUsername', usernameInput.trim()); setState(prev => ({ ...prev, username:usernameInput.trim(), isPlaying:true, message:'' })); };
  const handleClick = async (e: React.MouseEvent) => {
    if (!state.username || isClicking) return;
    setIsClicking(true); spawnParticle(e);
    try {
      const res = await fetch('/api/click', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:state.username}) });
      const data = await res.json();
      if (data.success) setState(prev => ({ ...prev, clicks:data.clicks, points:data.points, message:'' }));
      else setState(prev => ({ ...prev, message:data.message }));
    } catch { setState(prev => ({ ...prev, message:'Connection error' })); }
    setTimeout(() => setIsClicking(false), 150);
  };
  const handleLogout = () => { localStorage.removeItem('clickUsername'); setState({ username:'', clicks:0, points:0, xpBalance:0, dailyLimit:1000, isPlaying:false, message:'', isLoading:false, maintenance_mode:'false' }); };
  const progress = Math.min((state.clicks / state.dailyLimit) * 100, 100);
  if (state.isLoading) return <div className="min-h-screen bg-[#030407] flex items-center justify-center"><div className="w-10 h-10 border-2 border-[#dce87a] border-t-transparent rounded-full animate-spin"/></div>;
  return (
    <div className="min-h-screen bg-[#030407] flex flex-col relative overflow-hidden" style={{maxWidth:'430px',margin:'0 auto'}}>
      <div className="fixed inset-0 pointer-events-none" style={{maxWidth:'430px'}}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#dce87a]/8 rounded-full blur-[100px]"/>
        <div className="absolute bottom-20 -right-10 w-60 h-60 bg-blue-500/8 rounded-full blur-[80px]"/>
        <div className="absolute inset-0 opacity-[0.07]" style={{backgroundImage:'radial-gradient(#ffffff 0.5px, transparent 0.5px)',backgroundSize:'28px 28px'}}/>
      </div>
      {!state.isPlaying ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-5 relative">
              <div className="absolute inset-0 bg-[#dce87a]/30 blur-2xl rounded-full"/>
              <div className="relative w-full h-full rounded-3xl bg-[#dce87a] flex items-center justify-center shadow-[0_0_40px_rgba(220,232,122,0.4)]">
                <span className="text-[#030407] font-black text-3xl">J</span>
              </div>
            </div>
            <h1 className="text-4xl font-black tracking-widest text-white">JUTIS</h1>
            <p className="text-[10px] text-[#dce87a] tracking-[0.5em] uppercase mt-1">Click · Earn · Swap</p>
          </div>
          <div className="px-4 py-1.5 border border-[#dce87a]/20 rounded-full bg-[#dce87a]/5">
            <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#dce87a]">Protocol v4.0 Active</span>
          </div>
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-3">
            <input type="text" value={usernameInput} onChange={(e)=>setUsernameInput(e.target.value)} placeholder="Enter your username" maxLength={30} className="w-full px-5 py-4 bg-white/4 border border-white/10 rounded-3xl text-white text-center placeholder:text-gray-700 focus:outline-none focus:border-[#dce87a]/40 transition-all text-sm"/>
            <button type="submit" className="w-full py-4 bg-[#dce87a] text-[#030407] font-black rounded-3xl text-xs tracking-[0.3em] uppercase shadow-[0_0_30px_rgba(220,232,122,0.3)] hover:bg-[#c8d470] transition-all">START PLAYING</button>
          </form>
          <div className="grid grid-cols-2 gap-3 w-full">
            {[['Neural Swaps','40+ Chains'],['Encryption','Military P2P'],['Latency','Sub 10ms'],['Security','Non-Custodial']].map(([k,v])=>(
              <div key={k} className="bg-white/3 border border-white/8 rounded-2xl p-4">
                <p className="text-[9px] text-[#dce87a] uppercase tracking-widest font-bold">{k}</p>
                <p className="text-white text-xs mt-1 font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col relative z-10">
          <div className="flex items-center justify-between px-6 pt-14 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#dce87a] shadow-[0_0_8px_rgba(220,232,122,1)] animate-pulse"/>
              <span className="text-[9px] font-black tracking-[0.3em] text-white uppercase">Mainnet Node</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#dce87a] to-blue-500 p-[1px]">
              <div className="w-full h-full rounded-full bg-[#030407] flex items-center justify-center">
                <span className="text-white text-[10px] font-black">{state.username[0]?.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-6 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-2">Portfolio Delta</p>
            <h2 className="text-5xl font-black text-white tracking-tight">{state.points.toLocaleString()}</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#dce87a]/10 rounded-full border border-[#dce87a]/20 mt-2">
              <span className="w-1 h-1 rounded-full bg-[#dce87a]"/>
              <span className="text-[10px] font-black text-[#dce87a]">{state.username}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 px-6 mb-6">
            <div className="bg-white/3 border border-white/8 rounded-2xl p-3 text-center">
              <p className="text-[8px] text-gray-600 uppercase tracking-widest mb-1">Clicks</p>
              <p className="text-white text-base font-black">{state.clicks}</p>
              <p className="text-gray-700 text-[8px]">/{state.dailyLimit}</p>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-3 text-center">
              <p className="text-[8px] text-gray-600 uppercase tracking-widest mb-1">Points</p>
              <p className="text-[#dce87a] text-base font-black">{state.points}</p>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-3 text-center">
              <p className="text-[8px] text-gray-600 uppercase tracking-widest mb-1">XP</p>
              <p className="text-blue-400 text-base font-black">{state.xpBalance}</p>
            </div>
          </div>
          <div className="px-6 mb-6">
            <div className="h-px bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#dce87a] to-blue-400 transition-all duration-500" style={{width:`${progress}%`}}/>
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[8px] text-gray-700 uppercase tracking-widest">Daily Progress</span>
              <span className="text-[8px] text-[#dce87a] font-bold">{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center px-6 pb-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full border border-[#dce87a]/10 scale-[1.4] animate-spin" style={{animationDuration:'20s'}}/>
              <div className="absolute inset-0 rounded-full border border-white/5 scale-[1.7] animate-spin" style={{animationDuration:'35s',animationDirection:'reverse'}}/>
              <div className="absolute inset-0 rounded-full bg-[#dce87a]/5 blur-2xl scale-150"/>
              <button ref={btnRef} onClick={handleClick} disabled={state.maintenance_mode==='true'}
                className={`relative w-48 h-48 rounded-full bg-white text-[#030407] flex items-center justify-center transition-all duration-100 select-none overflow-hidden shadow-[0_0_60px_rgba(220,232,122,0.15)] hover:bg-[#dce87a] active:scale-95 disabled:opacity-40 ${isClicking?'scale-95 bg-[#dce87a]':'scale-100'}`}>
                <span className="text-5xl font-black">⚡</span>
                {particles.map(p=>(
                  <span key={p.id} className="absolute text-[#030407] font-black text-sm pointer-events-none select-none"
                    style={{left:p.x,top:p.y,animation:'floatUp 0.7s ease-out forwards',transform:'translate(-50%,-50%)'}}>+1</span>
                ))}
              </button>
              <p className="text-center text-[9px] text-gray-700 uppercase tracking-[0.3em] mt-4">Connect to Portal</p>
            </div>
          </div>
          {state.message && <p className="text-center text-xs text-gray-600 px-6 pb-2">{state.message}</p>}
          <div className="px-6 pb-10 pt-2">
            <div className="flex gap-3">
              <button onClick={()=>window.location.href='/dashboard'} className="flex-1 py-4 bg-white/4 border border-white/10 rounded-[2rem] text-white text-[10px] font-black uppercase tracking-widest hover:border-[#dce87a]/30 transition-all">📊 Dashboard</button>
              <button onClick={handleLogout} className="flex-1 py-4 bg-white/4 border border-white/10 rounded-[2rem] text-red-400 text-[10px] font-black uppercase tracking-widest hover:border-red-400/30 transition-all">🚪 Logout</button>
            </div>
            <a href="/admin" className="block text-center text-[8px] text-gray-800 hover:text-gray-600 uppercase tracking-widest mt-5 transition-colors">Admin Panel</a>
          </div>
        </div>
      )}
      <style jsx>{`@keyframes floatUp{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-200%) scale(2)}}`}</style>
    </div>
  );
}
