'use client';
import { useState, useEffect, useRef } from 'react';

const C = { bg:'#1a1d23',card:'#232730',card2:'#2a2e38',line:'#2e323c',mute:'#9aa1ac',fg:'#e6e8ec',lime:'#dce87a',ink:'#0a0b0f',green:'#4ade80',red:'#f87171',blue:'#4a9eff' };

export default function AdminPage() {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string,string>>({});
  const [tab, setTab] = useState<'users'|'settings'|'xp'>('users');
  const [loading, setLoading] = useState(false);
  const [xpStatus, setXpStatus] = useState('');
  const timerRef = useRef<any>();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === 'admin123') { setAuth(true); setError(''); }
    else setError('Invalid password');
  };

  const loadData = async () => {
    try {
      const [uRes, sRes] = await Promise.all([fetch('/api/admin/users'), fetch('/api/settings')]);
      const uData = await uRes.json(); const sData = await sRes.json();
      if (Array.isArray(uData)) setUsers(uData);
      if (sData && typeof sData === 'object') setSettings(sData);
    } catch {}
  };

  useEffect(() => {
    if (!auth) return;
    loadData();
    timerRef.current = setInterval(loadData, 3000);
    return () => clearInterval(timerRef.current);
  }, [auth]);

  const handleBan = async (id: string, action: string) => {
    try {
      await fetch(`/api/admin/users/${id}`, { method:'PUT', headers:{'Content-Type':'application/json','x-admin-password':pw}, body:JSON.stringify({action}) });
      setUsers(p => p.map(u => u.id===id ? {...u, status:action==='ban'?'banned':'active'} : u));
    } catch {}
  };

  const handleSetting = async (key: string, value: string) => {
    setSettings(p => ({...p,[key]:value}));
    try { await fetch('/api/admin/settings', { method:'PUT', headers:{'Content-Type':'application/json','x-admin-password':pw}, body:JSON.stringify({key,value}) }); } catch {}
  };

  const handleXP = async () => {
    setLoading(true); setXpStatus('Sending...');
    try {
      const r = await fetch('/api/xp/send', { method:'POST', headers:{'Content-Type':'application/json','x-admin-password':pw} });
      const d = await r.json();
      setXpStatus(d.success ? `✅ ${d.message}` : `❌ ${d.error||'Error'}`);
    } catch { setXpStatus('❌ Connection error'); }
    setLoading(false);
  };

  if (!auth) return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <form onSubmit={handleLogin} style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:24,padding:32,width:'100%',maxWidth:360,display:'flex',flexDirection:'column',gap:16}}>
        <div style={{textAlign:'center'}}>
          <div style={{color:C.lime,fontSize:24,fontWeight:900,letterSpacing:4}}>JUTIS</div>
          <div style={{color:C.mute,fontSize:11,letterSpacing:'0.3em',marginTop:4}}>ADMIN PANEL</div>
        </div>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Enter admin password"
          style={{padding:'14px 18px',background:C.bg,border:`1px solid ${C.line}`,borderRadius:14,color:C.fg,fontSize:14,outline:'none',textAlign:'center',width:'100%'}}/>
        {error && <div style={{color:C.red,fontSize:12,textAlign:'center'}}>{error}</div>}
        <button type="submit" style={{padding:14,background:C.lime,color:C.ink,fontWeight:900,borderRadius:14,border:'none',cursor:'pointer',fontSize:13,letterSpacing:'0.2em'}}>LOGIN</button>
        <a href="/game" style={{color:C.mute,fontSize:11,textAlign:'center',textDecoration:'none'}}>← Back to Game</a>
      </form>
    </div>
  );

  const totalClicks = users.reduce((s,u)=>s+u.total_clicks,0);
  const totalXP = users.reduce((s,u)=>s+u.xp_balance,0);

  return (
    <div style={{minHeight:'100vh',background:C.bg,color:C.fg,fontFamily:'system-ui'}}>
      <div style={{background:C.card,borderBottom:`1px solid ${C.line}`,padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{color:C.lime,fontWeight:900,fontSize:18,letterSpacing:3}}>ADMIN</span>
          <span style={{padding:'3px 10px',borderRadius:999,background:`${C.green}20`,border:`1px solid ${C.green}40`,color:C.green,fontSize:10,fontWeight:700}}>🟢 LIVE</span>
        </div>
        <a href="/game" style={{padding:'8px 16px',background:C.bg,border:`1px solid ${C.line}`,borderRadius:10,color:C.mute,fontSize:12,fontWeight:700,textDecoration:'none'}}>← Game</a>
      </div>

      <div style={{maxWidth:900,margin:'0 auto',padding:20}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
          {[['Users',users.length,C.fg],['Active',users.filter(u=>u.status==='active').length,C.green],['Clicks',totalClicks.toLocaleString(),C.lime],['XP',totalXP.toLocaleString(),C.blue]].map(([l,v,col])=>(
            <div key={String(l)} style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,padding:'16px',textAlign:'center'}}>
              <div style={{color:C.mute,fontSize:9,letterSpacing:'0.3em',marginBottom:6}}>{l}</div>
              <div style={{color:col as string,fontSize:22,fontWeight:900}}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {(['users','settings','xp'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'10px 20px',borderRadius:12,border:`1px solid ${tab===t?C.lime:C.line}`,cursor:'pointer',fontWeight:700,fontSize:12,background:tab===t?C.lime:C.card,color:tab===t?C.ink:C.mute}}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {tab==='users' && (
          <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:20,overflow:'hidden'}}>
            <div style={{padding:'14px 20px',borderBottom:`1px solid ${C.line}`,display:'flex',justifyContent:'space-between'}}>
              <span style={{fontWeight:700}}>Users ({users.length})</span>
              <span style={{color:C.mute,fontSize:11}}>↻ auto-refresh 3s</span>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:C.card2}}>
                {['Username','Clicks','XP','Status',''].map(h=>(
                  <th key={h} style={{padding:'10px 16px',textAlign:h==='Clicks'||h==='XP'?'right':'left',color:C.mute,fontSize:10,letterSpacing:'0.2em'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {users.map((u,i)=>(
                  <tr key={u.id} style={{borderTop:`1px solid ${C.line}`,background:i%2?C.card2:'transparent'}}>
                    <td style={{padding:'12px 16px',fontWeight:700}}>@{u.username}</td>
                    <td style={{padding:'12px 16px',textAlign:'right',color:C.lime,fontWeight:900}}>{u.total_clicks.toLocaleString()}</td>
                    <td style={{padding:'12px 16px',textAlign:'right',color:C.blue,fontWeight:900}}>{u.xp_balance.toLocaleString()}</td>
                    <td style={{padding:'12px 16px'}}>
                      <span style={{padding:'4px 10px',borderRadius:999,fontSize:10,fontWeight:700,background:u.status==='active'?`${C.green}20`:`${C.red}20`,color:u.status==='active'?C.green:C.red}}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{padding:'12px 16px'}}>
                      <button onClick={()=>handleBan(u.id,u.status==='active'?'ban':'activate')}
                        style={{padding:'6px 14px',borderRadius:8,border:'none',cursor:'pointer',fontSize:11,fontWeight:700,background:u.status==='active'?`${C.red}20`:`${C.green}20`,color:u.status==='active'?C.red:C.green}}>
                        {u.status==='active'?'BAN':'ACTIVATE'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length===0 && <div style={{padding:40,textAlign:'center',color:C.mute}}>No users yet</div>}
          </div>
        )}

        {tab==='settings' && (
          <div style={{display:'grid',gap:10}}>
            {Object.entries(settings).map(([key,value])=>(
              <div key={key} style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:16,padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
                <div>
                  <div style={{color:C.lime,fontSize:10,letterSpacing:'0.3em',fontWeight:700}}>{key.replace(/_/g,' ').toUpperCase()}</div>
                </div>
                {key==='maintenance_mode' ? (
                  <button onClick={()=>handleSetting(key,value==='true'?'false':'true')}
                    style={{padding:'10px 20px',borderRadius:12,border:`1px solid ${value==='true'?C.red:C.green}40`,cursor:'pointer',fontWeight:700,fontSize:12,background:value==='true'?`${C.red}20`:`${C.green}20`,color:value==='true'?C.red:C.green}}>
                    {value==='true'?'🔴 ENABLED':'🟢 DISABLED'}
                  </button>
                ) : (
                  <input type="text" defaultValue={value} onBlur={e=>handleSetting(key,e.target.value)}
                    style={{width:120,padding:'10px 14px',background:C.bg,border:`1px solid ${C.line}`,borderRadius:10,color:C.fg,fontSize:14,fontWeight:700,textAlign:'center',outline:'none'}}/>
                )}
              </div>
            ))}
          </div>
        )}

        {tab==='xp' && (
          <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:20,padding:32,textAlign:'center'}}>
            <div style={{color:C.mute,fontSize:11,letterSpacing:'0.3em',marginBottom:8}}>MASS XP DISTRIBUTION</div>
            <div style={{color:C.fg,fontSize:14,marginBottom:24}}>Send XP to all active users</div>
            <button onClick={handleXP} disabled={loading}
              style={{padding:'16px 40px',background:C.lime,color:C.ink,fontWeight:900,borderRadius:16,border:'none',cursor:'pointer',fontSize:14,letterSpacing:'0.2em',opacity:loading?0.6:1}}>
              {loading?'SENDING...':'⚡ SEND XP TO ALL'}
            </button>
            {xpStatus && <div style={{marginTop:16,padding:'14px 20px',background:C.bg,borderRadius:12,color:xpStatus.includes('✅')?C.green:C.red,fontWeight:700}}>{xpStatus}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
