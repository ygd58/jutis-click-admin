'use client';
import { useState, useEffect, useRef } from 'react';

const C = {
  bg:'#1a1d23', card:'#232730', card2:'#2a2e38',
  line:'#2e323c', mute:'#9aa1ac', fg:'#e6e8ec',
  lime:'#dce87a', ink:'#0a0b0f',
  green:'#4ade80', red:'#f87171', blue:'#4a9eff',
};

function JutisMark({ size=32 }: {size?:number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{display:'block',filter:'drop-shadow(0 0 6px rgba(220,232,122,.4))'}}>
      <circle cx="16" cy="16" r="15.5" fill={C.bg}/>
      <circle cx="16" cy="16" r="15.5" fill="none" stroke={C.line} strokeWidth="1"/>
      <g transform="translate(16 16)">
        <rect x="-9" y="-9" width="18" height="18" fill="none" stroke={C.lime} strokeWidth="1.8" rx="4" transform="rotate(45)"/>
        <rect x="-9" y="-9" width="18" height="18" fill="none" stroke={C.fg} strokeWidth="1" strokeOpacity=".22" rx="4" transform="rotate(12)"/>
        <rect x="-1.75" y="-6.5" width="3.5" height="13" fill={C.lime} rx="1.75"/>
      </g>
    </svg>
  );
}

export default function GamePage() {
  const [username, setUsername] = useState('');
  const [input, setInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [points, setPoints] = useState(0);
  const [xp, setXp] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [dailyLimit, setDailyLimit] = useState(1000);
  const [message, setMessage] = useState('');
  const [isClicking, setIsClicking] = useState(false);
  const [particles, setParticles] = useState<{id:number,x:number,y:number}[]>([]);
  const [activeTab, setActiveTab] = useState<'game'|'wallet'|'swap'|'profile'>('game');
  const pid = useRef(0);
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('jutisUsername');
    if (stored) {
      setUsername(stored);
      setIsPlaying(true);
      loadUser(stored);
    }
    fetch('/api/settings').then(r=>r.json()).then(d=>{
      setDailyLimit(parseInt(d.daily_click_limit||'1000'));
    }).catch(()=>{});
  }, []);

  const loadUser = async (u: string) => {
    try {
      const r = await fetch('/api/user', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:u}) });
      const d = await r.json();
      if (d.user) { setPoints(d.user.total_clicks||0); setXp(d.user.xp_balance||0); setClicks(d.user.today_clicks||0); }
    } catch {}
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    localStorage.setItem('jutisUsername', input.trim());
    setUsername(input.trim());
    setIsPlaying(true);
  };

  const handleTap = async (e: React.MouseEvent) => {
    if (!username || isClicking || energy <= 0) return;
    setIsClicking(true);
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const id = ++pid.current;
      setParticles(prev=>[...prev,{id, x:e.clientX-rect.left, y:e.clientY-rect.top}]);
      setTimeout(()=>setParticles(prev=>prev.filter(p=>p.id!==id)), 700);
    }
    setEnergy(e=>Math.max(0,e-1));
    try {
      const r = await fetch('/api/click', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username}) });
      const d = await r.json();
      if (d.success) { setClicks(d.clicks); setPoints(d.points); setMessage(''); }
      else setMessage(d.message);
    } catch { setMessage('Connection error'); }
    setTimeout(()=>setIsClicking(false), 100);
  };

  // Energy regen
  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(()=>setEnergy(e=>Math.min(100,e+1)), 3000);
    return ()=>clearInterval(t);
  }, [isPlaying]);

  const progress = Math.min((clicks/dailyLimit)*100, 100);
  const level = Math.floor(points/500)+1;
  const rank = points < 100 ? 'Newcomer' : points < 500 ? 'Clicker' : points < 2000 ? 'Trader' : 'Whale';

  if (!isPlaying) return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,maxWidth:430,margin:'0 auto'}}>
      <div style={{marginBottom:32,textAlign:'center'}}>
        <JutisMark size={64}/>
        <div style={{color:C.fg,fontSize:28,fontWeight:900,letterSpacing:4,marginTop:12}}>JUTIS</div>
        <div style={{color:C.lime,fontSize:10,letterSpacing:'0.4em',marginTop:4}}>CANT CLICKER · v0.9</div>
      </div>
      <div style={{padding:'4px 16px',borderRadius:999,border:`1px solid ${C.lime}33`,background:`${C.lime}0a`,color:C.lime,fontSize:10,letterSpacing:'0.3em',marginBottom:32}}>
        PROTOCOL v4.0 ACTIVE
      </div>
      <form onSubmit={handleLogin} style={{width:'100%',display:'flex',flexDirection:'column',gap:12}}>
        <input type="text" value={input} onChange={e=>setInput(e.target.value)} placeholder="Enter your username" maxLength={30}
          style={{width:'100%',padding:'16px 20px',background:C.card,border:`1px solid ${C.line}`,borderRadius:16,color:C.fg,fontSize:14,textAlign:'center',outline:'none',boxSizing:'border-box'}}/>
        <button type="submit" style={{width:'100%',padding:'16px',background:C.lime,color:C.ink,fontWeight:900,borderRadius:16,border:'none',cursor:'pointer',fontSize:13,letterSpacing:'0.3em'}}>
          START PLAYING
        </button>
      </form>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,width:'100%',marginTop:24}}>
        {[['Neural Swaps','40+ Chains'],['Encryption','Military P2P'],['Latency','Sub 10ms'],['Security','Non-Custodial']].map(([k,v])=>(
          <div key={k} style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:14,padding:'12px 14px'}}>
            <div style={{color:C.lime,fontSize:9,letterSpacing:'0.3em',fontWeight:700}}>{k}</div>
            <div style={{color:C.fg,fontSize:12,marginTop:4,fontWeight:600}}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',maxWidth:430,margin:'0 auto',position:'relative'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'52px 20px 12px'}}>
        <JutisMark size={32}/>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{color:C.fg,fontWeight:900,letterSpacing:3,fontSize:14}}>JUTIS</span>
          <span style={{padding:'3px 8px',borderRadius:999,background:C.card,border:`1px solid ${C.line}`,color:C.mute,fontSize:10}}>Android · v0.9</span>
        </div>
        <div style={{width:36,height:36,borderRadius:'50%',background:`${C.lime}22`,border:`1px solid ${C.lime}44`,display:'flex',alignItems:'center',justifyContent:'center',color:C.lime,fontWeight:900,fontSize:13}}>
          {username[0]?.toUpperCase()}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'game' && (
        <div style={{flex:1,display:'flex',flexDirection:'column',padding:'0 20px'}}>
          {/* User info bar */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:C.card,border:`1px solid ${C.line}`,borderRadius:16,padding:'12px 16px',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:`${C.lime}22`,border:`1px solid ${C.lime}44`,display:'flex',alignItems:'center',justifyContent:'center',color:C.lime,fontWeight:900}}>
                {username[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{color:C.fg,fontWeight:700,fontSize:13}}>@{username}</div>
                <div style={{color:C.mute,fontSize:10}}>LVL {level} · {rank}</div>
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{color:C.lime,fontWeight:900,fontSize:16}}>{points}</div>
              <div style={{color:C.mute,fontSize:10}}>CANT</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
            {[['+1','PER TAP'],[String(clicks),'TODAY'],[`${Math.floor(clicks/Math.max(1,dailyLimit)*8)}/8`,'LEVEL']].map(([v,l])=>(
              <div key={l} style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:14,padding:'12px 8px',textAlign:'center'}}>
                <div style={{color:C.fg,fontWeight:900,fontSize:18}}>{v}</div>
                <div style={{color:C.mute,fontSize:9,letterSpacing:'0.2em',marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>

          {/* Energy bar */}
          <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:14,padding:'12px 16px',marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{color:C.lime,fontSize:11,fontWeight:700}}>⚡ Energy</span>
              <span style={{color:energy < 30 ? C.red : C.mute,fontSize:11}}>{energy}/100</span>
            </div>
            <div style={{height:6,background:C.line,borderRadius:3,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${energy}%`,background:`linear-gradient(90deg,${C.lime},#a8d448)`,borderRadius:3,transition:'width 0.3s'}}/>
            </div>
          </div>

          {/* XP bar */}
          <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:14,padding:'12px 16px',marginBottom:20}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{color:C.blue,fontSize:11,fontWeight:700}}>XP to {rank === 'Newcomer' ? 'Clicker' : rank === 'Clicker' ? 'Trader' : 'Whale'}</span>
              <span style={{color:C.mute,fontSize:11}}>{points % 500}/{500}</span>
            </div>
            <div style={{height:6,background:C.line,borderRadius:3,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${(points%500)/500*100}%`,background:`linear-gradient(90deg,${C.blue},#7ab8ff)`,borderRadius:3,transition:'width 0.3s'}}/>
            </div>
          </div>

          {/* TAP BUTTON */}
          <div style={{display:'flex',justifyContent:'center',alignItems:'center',flex:1,paddingBottom:16}}>
            <div ref={btnRef} onClick={handleTap} style={{position:'relative',cursor:'pointer',userSelect:'none'}}>
              {/* Rings */}
              <div style={{position:'absolute',inset:-24,borderRadius:'50%',border:`1px solid ${C.lime}15`,animation:'spin 20s linear infinite'}}/>
              <div style={{position:'absolute',inset:-40,borderRadius:'50%',border:`1px solid ${C.lime}08`,animation:'spin 35s linear infinite reverse'}}/>
              {/* Glow */}
              <div style={{position:'absolute',inset:-20,borderRadius:'50%',background:`${C.lime}08`,filter:'blur(20px)'}}/>
              {/* Main circle */}
              <div style={{
                width:180,height:180,borderRadius:'50%',
                background:`radial-gradient(circle at 40% 40%, ${C.lime}, #a8d448)`,
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:`0 0 60px ${C.lime}30, 0 0 120px ${C.lime}10`,
                transform:isClicking?'scale(0.94)':'scale(1)',
                transition:'transform 0.1s',
              }}>
                <JutisMark size={72}/>
              </div>
              {/* Particles */}
              {particles.map(p=>(
                <div key={p.id} style={{position:'absolute',left:p.x,top:p.y,color:C.lime,fontWeight:900,fontSize:16,pointerEvents:'none',
                  animation:'floatUp 0.7s ease-out forwards',transform:'translate(-50%,-50%)'}}>+1</div>
              ))}
            </div>
          </div>

          <div style={{textAlign:'center',color:C.mute,fontSize:10,letterSpacing:'0.3em',paddingBottom:8}}>
            {energy <= 0 ? 'ENERGY RECHARGING...' : 'TAP TO EARN CANT'}
          </div>
          {message && <div style={{textAlign:'center',color:C.red,fontSize:11,paddingBottom:8}}>{message}</div>}

          {/* Daily progress */}
          <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:14,padding:'10px 16px',marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{color:C.mute,fontSize:10}}>Daily Progress</span>
              <span style={{color:C.lime,fontSize:10,fontWeight:700}}>{clicks}/{dailyLimit}</span>
            </div>
            <div style={{height:4,background:C.line,borderRadius:2,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${progress}%`,background:C.lime,borderRadius:2}}/>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wallet' && (
        <div style={{flex:1,padding:'0 20px'}}>
          <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:20,padding:20,marginBottom:16,textAlign:'center'}}>
            <div style={{color:C.mute,fontSize:10,letterSpacing:'0.2em',marginBottom:8}}>PORTFOLIO DELTA</div>
            <div style={{color:C.fg,fontSize:40,fontWeight:900}}>{points.toLocaleString()}</div>
            <div style={{color:C.lime,fontSize:12,marginTop:4}}>CANT</div>
            <div style={{marginTop:12,padding:'6px 16px',borderRadius:999,background:`${C.lime}15`,border:`1px solid ${C.lime}30`,display:'inline-block'}}>
              <span style={{color:C.lime,fontSize:10,fontWeight:700}}>+12.4% 24H</span>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            {['Send','Receive','Swap'].map(a=>(
              <button key={a} style={{flex:1,padding:'12px 4px',background:C.card,border:`1px solid ${C.line}`,borderRadius:14,color:C.fg,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                {a}
              </button>
            ))}
          </div>
          {[['CANT','Active Yield',points,'+8.1%',C.lime],['XP','Experience',xp,'Stable',C.blue]].map(([sym,sub,bal,chg,col]:any[])=>(
            <div key={sym} style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:`${col}22`,display:'flex',alignItems:'center',justifyContent:'center',color:col,fontWeight:900,fontSize:12}}>{String(sym).slice(0,2)}</div>
                <div><div style={{color:C.fg,fontWeight:700,fontSize:13}}>{sym}</div><div style={{color:C.mute,fontSize:10}}>{sub}</div></div>
              </div>
              <div style={{textAlign:'right'}}><div style={{color:C.fg,fontWeight:700}}>{Number(bal).toLocaleString()}</div><div style={{color:col,fontSize:10}}>{chg}</div></div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'profile' && (
        <div style={{flex:1,padding:'0 20px'}}>
          <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:20,padding:24,textAlign:'center',marginBottom:16}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:`${C.lime}22`,border:`2px solid ${C.lime}44`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',fontSize:24,fontWeight:900,color:C.lime}}>
              {username[0]?.toUpperCase()}
            </div>
            <div style={{color:C.fg,fontWeight:900,fontSize:18}}>@{username}</div>
            <div style={{color:C.lime,fontSize:11,marginTop:4}}>LVL {level} · {rank}</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
            {[['Total Clicks',points,'CANT'],['XP Balance',xp,'XP'],['Today',clicks,'Clicks'],['Daily Limit',dailyLimit,'Max']].map(([l,v,u])=>(
              <div key={String(l)} style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,padding:'14px 16px',textAlign:'center'}}>
                <div style={{color:C.mute,fontSize:9,letterSpacing:'0.2em'}}>{l}</div>
                <div style={{color:C.fg,fontSize:22,fontWeight:900,margin:'4px 0'}}>{Number(v).toLocaleString()}</div>
                <div style={{color:C.lime,fontSize:9}}>{u}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:10}}>
            <a href="/admin" style={{flex:1,padding:'14px',background:C.card,border:`1px solid ${C.line}`,borderRadius:16,color:C.mute,textAlign:'center',textDecoration:'none',fontSize:12,fontWeight:700}}>Admin</a>
            <button onClick={()=>{localStorage.removeItem('jutisUsername');window.location.reload();}}
              style={{flex:1,padding:'14px',background:`${C.red}15`,border:`1px solid ${C.red}30`,borderRadius:16,color:C.red,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{display:'flex',background:C.card,borderTop:`1px solid ${C.line}`,padding:'12px 0 28px'}}>
        {[['game','⚡','Game'],['wallet','💼','Wallet'],['swap','🔄','Swap'],['profile','👤','Profile']].map(([tab,icon,label])=>(
          <button key={tab} onClick={()=>setActiveTab(tab as any)}
            style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'none',border:'none',cursor:'pointer',
              color:activeTab===tab ? C.lime : C.mute}}>
            <span style={{fontSize:20}}>{icon}</span>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:'0.15em'}}>{label}</span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes floatUp{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-250%) scale(2)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{-webkit-tap-highlight-color:transparent}
      `}</style>
    </div>
  );
}
