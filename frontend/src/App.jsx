import { useState, useEffect } from 'react';
import ScanForm from './components/ScanForm';
import RiskReport from './components/RiskReport';
import ThreatChart from './components/ThreatChart';
import { getHistory, getStats } from './api';

const RISK_COLOR = {
  SAFE:'#10b981', LOW:'#f59e0b',
  MEDIUM:'#f97316', HIGH:'#f43f5e', CRITICAL:'#f43f5e'
};

const NAV_ITEMS = [
  { id:'scan',    icon:'▶', label:'Scan'    },
  { id:'results', icon:'◈', label:'Results' },
  { id:'history', icon:'≡', label:'History' },
  { id:'stats',   icon:'◎', label:'Stats'   },
];

export default function App() {
  const [result, setResult]     = useState(null);
  const [history, setHistory]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [scanning, setScanning] = useState(false);
  const [activeNav, setActiveNav] = useState('scan');
  const [time, setTime]         = useState(new Date());

  useEffect(() => {
    refresh();
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const refresh = async () => {
    try {
      const [h, s] = await Promise.all([getHistory(), getStats()]);
      setHistory(h);
      setStats(s);
    } catch(e) { console.error(e); }
  };

  const handleScanComplete = (r) => {
    setResult(r);
    setScanning(false);
    setActiveNav('results');
    refresh();
  };

  const pad = n => String(n).padStart(2, '0');
  const clock = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;

  const scrollTo = (id) => {
    setActiveNav(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior:'smooth', block:'start' });
  };

  return (
    <div style={{ minHeight:'100vh' }}>
      <style>{`
        @keyframes countUp {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes ping {
          0%   { transform:scale(0.8); opacity:0.6; }
          100% { transform:scale(1.4); opacity:0; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        position:'sticky', top:0, zIndex:100,
        background:'rgba(4,8,15,0.9)',
        borderBottom:'1px solid rgba(255,255,255,0.07)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
      }}>
        <div className="header-pad" style={{
          maxWidth:1200, margin:'0 auto', padding:'0 32px',
          height:64, display:'flex', alignItems:'center', justifyContent:'space-between'
        }}>

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width:36, height:36, borderRadius:8,
              background:'linear-gradient(135deg,#22d3ee,#06b6d4)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, fontWeight:800, color:'#04080f',
            }}>PG</div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, letterSpacing:'-0.01em', lineHeight:1 }}>
                Phish<span style={{ color:'var(--cyan)' }}>Guard</span>
                <span style={{ fontSize:10, color:'var(--text-3)', fontFamily:'var(--font-mono)', fontWeight:400, marginLeft:8 }}>v1.0</span>
              </div>
              <div style={{ fontSize:10, color:'var(--text-3)', letterSpacing:'0.1em', marginTop:2 }}>
                AI THREAT INTELLIGENCE
              </div>
            </div>
          </div>

          {/* Desktop stats */}
          <div className="desktop-stats" style={{ display:'flex', alignItems:'center', gap:32 }}>
            {[
              { l:'Total Scans', v: stats?.total_scans ?? '—',     c:'var(--cyan)'  },
              { l:'Threats',     v: stats?.high_risk_count ?? '—',  c:'var(--red)'   },
              { l:'Safe',        v: stats?.safe_count ?? '—',       c:'var(--green)' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{
                  fontSize:22, fontWeight:800,
                  color: stats ? s.c : 'var(--text-3)',
                  lineHeight:1,
                  animation: stats ? `countUp 0.4s ${i*0.1}s both` : 'none',
                }}>{s.v}</div>
                <div style={{ fontSize:9, color:'var(--text-3)', letterSpacing:'0.15em', marginTop:3 }}>
                  {s.l.toUpperCase()}
                </div>
              </div>
            ))}

            {/* Clock */}
            <div style={{
              fontFamily:'var(--font-mono)', fontSize:13, color:'var(--cyan)',
              background:'var(--cyan-glow)', border:'1px solid var(--cyan-border)',
              padding:'6px 14px', borderRadius:8,
              minWidth:88, textAlign:'center',
            }}>{clock}</div>
          </div>
        </div>

        {/* Status bar */}
        <div className="status-bar" style={{
          borderTop:'1px solid rgba(255,255,255,0.04)',
          background:'rgba(0,0,0,0.2)',
          padding:'6px 32px',
        }}>
          <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', gap:24 }}>
            {[
              { label:'Claude AI',   status:'Online',    color:'var(--green)' },
              { label:'VirusTotal',  status:'Online',    color:'var(--green)' },
              { label:'SQLite DB',   status:'Connected', color:'var(--green)' },
              { label:'Threat Feed', status:'Active',    color:'var(--cyan)'  },
            ].map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{
                  width:5, height:5, borderRadius:'50%',
                  background:s.color, boxShadow:`0 0 6px ${s.color}`,
                  animation:`pulse-dot 2s ${i*0.4}s infinite`,
                }} />
                <span style={{ fontSize:10, color:'var(--text-3)', letterSpacing:'0.08em' }}>{s.label}</span>
                <span style={{ fontSize:10, color:s.color }}>{s.status}</span>
              </div>
            ))}
            <span style={{ marginLeft:'auto', fontSize:10, color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>
              {clock}
            </span>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="main-pad" style={{ maxWidth:1200, margin:'0 auto', padding:'28px 32px 40px' }}>

        {/* Charts */}
        <div id="section-stats">
          <ThreatChart stats={stats} />
        </div>

        {/* Scan form */}
        <div id="section-scan">
          <ScanForm onScanComplete={handleScanComplete} onScanStart={() => setScanning(true)} />
        </div>

        {/* Scanning indicator */}
        {scanning && (
          <div className="glass anim-1" style={{
            marginBottom:16, padding:'16px 20px',
            border:'1px solid var(--cyan-border)',
            display:'flex', alignItems:'center', gap:14,
          }}>
            <div style={{
              width:8, height:8, borderRadius:'50%',
              background:'var(--cyan)', boxShadow:'0 0 10px var(--cyan)',
              animation:'blink 1s infinite', flexShrink:0,
            }} />
            <div>
              <div style={{ fontSize:13, color:'var(--cyan)', fontWeight:600, marginBottom:2 }}>
                Scanning in progress...
              </div>
              <div style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>
                Claude AI analysis · VirusTotal cross-reference · Risk scoring
              </div>
            </div>
          </div>
        )}

        {/* Results section */}
        <div id="section-results">
          {!result && !scanning && (
            <div className="glass" style={{
              padding:'48px 24px', textAlign:'center',
              marginBottom:16, position:'relative', overflow:'hidden',
            }}>
              {/* Animated rings */}
              <div style={{
                position:'absolute', inset:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                pointerEvents:'none',
              }}>
                {[120, 180, 240].map((size, i) => (
                  <div key={i} style={{
                    position:'absolute',
                    width:size, height:size, borderRadius:'50%',
                    border:`1px solid rgba(34,211,238,${0.06 - i*0.015})`,
                    animation:`ping ${3 + i}s ${i*0.8}s ease-out infinite`,
                  }} />
                ))}
              </div>

              {/* Content */}
              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{
                  width:64, height:64, borderRadius:'50%',
                  background:'rgba(34,211,238,0.08)',
                  border:'1px solid rgba(34,211,238,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  margin:'0 auto 20px',
                  fontSize:24, color:'var(--cyan)',
                }}>◎</div>

                <div style={{ fontSize:15, fontWeight:700, color:'var(--text-1)', marginBottom:8 }}>
                  Ready to Scan
                </div>
                <div style={{ fontSize:12, color:'var(--text-3)', fontFamily:'var(--font-mono)', lineHeight:1.7 }}>
                  Paste a suspicious email or URL above<br/>
                  Claude AI + VirusTotal will analyze it instantly
                </div>

                {/* Feature pills */}
                <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:20, flexWrap:'wrap' }}>
                  {[
                    { icon:'◈', label:'Claude AI Analysis', color:'var(--cyan)'  },
                    { icon:'◉', label:'VirusTotal Intel',   color:'#10b981'      },
                    { icon:'◎', label:'Risk Scoring 0–10',  color:'var(--amber)' },
                  ].map((f, i) => (
                    <div key={i} style={{
                      display:'flex', alignItems:'center', gap:6,
                      background:'rgba(255,255,255,0.03)',
                      border:'1px solid rgba(255,255,255,0.07)',
                      borderRadius:999, padding:'6px 14px',
                      fontSize:11, color:'var(--text-2)',
                      fontFamily:'var(--font-mono)',
                    }}>
                      <span style={{ color:f.color, fontSize:12 }}>{f.icon}</span>
                      {f.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <RiskReport result={result} />
        </div>

        {/* History */}
        <div id="section-history" className="glass anim-4" style={{ overflow:'hidden' }}>
          <div style={{
            padding:'20px 24px', borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div className="sec-label" style={{ marginBottom:0 }}>
              Scan History
              <span style={{ color:'var(--text-3)', fontWeight:400, marginLeft:8 }}>
                ({history.length})
              </span>
            </div>
            <button onClick={refresh} style={{
              background:'var(--surface)', border:'1px solid var(--border-bright)',
              color:'var(--text-2)', fontSize:11, padding:'5px 12px',
              borderRadius:999, cursor:'pointer', fontFamily:'var(--font-display)',
              transition:'all 0.15s',
            }}>↻ Refresh</button>
          </div>

          {history.length === 0 ? (
            <div style={{ padding:'40px', textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:12, opacity:0.2 }}>≡</div>
              <div style={{ fontSize:12, color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>
                // no scan records yet — your history will appear here
              </div>
            </div>
          ) : (
            <>
              {/* Table header — desktop only */}
              <div className="history-cols history-row" style={{
                gridTemplateColumns:'60px 1fr 110px 70px 150px',
                padding:'10px 20px',
                borderBottom:'1px solid var(--border)',
              }}>
                {['ID','Preview','Risk','Score','Action'].map(h => (
                  <span key={h} style={{
                    fontSize:9, color:'var(--text-3)',
                    letterSpacing:'0.2em', textTransform:'uppercase',
                  }}>{h}</span>
                ))}
              </div>

              {history.map((s, i) => (
                <div key={s.id} className="history-row" style={{
                  gridTemplateColumns:'60px 1fr 110px 70px 150px',
                  animationDelay:`${i*0.03}s`,
                }}>
                  <span style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>
                    #{String(s.id).padStart(4,'0')}
                  </span>
                  <div style={{ overflow:'hidden', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{
                      fontSize:10, color:'var(--cyan)',
                      fontFamily:'var(--font-mono)',
                      padding:'1px 6px',
                      background:'var(--cyan-glow)',
                      borderRadius:4, flexShrink:0,
                    }}>{s.input_type}</span>
                    <span style={{
                      fontSize:12, color:'var(--text-2)',
                      fontFamily:'var(--font-mono)',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>{s.input_preview}</span>
                  </div>
                  <div>
                    <span style={{
                      fontSize:11, fontWeight:600,
                      color:RISK_COLOR[s.risk_level],
                      fontFamily:'var(--font-mono)',
                      background:`${RISK_COLOR[s.risk_level]}15`,
                      padding:'3px 10px', borderRadius:999,
                      border:`1px solid ${RISK_COLOR[s.risk_level]}30`,
                    }}>{s.risk_level}</span>
                  </div>
                  <span style={{ fontSize:14, fontWeight:700, color:RISK_COLOR[s.risk_level] }}>
                    {s.risk_score}/10
                  </span>
                  <span style={{ fontSize:11, color:'var(--text-2)', fontFamily:'var(--font-mono)' }}>
                    {s.recommendation}
                  </span>
                </div>
              ))}
            </>
          )}

              {/* ── FOOTER ── */}
          <footer style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            padding: '24px 32px',
            marginTop: '8px',
          }}>
            <div style={{
              maxWidth: 1200,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}>

              {/* Left — branding */}
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: 'linear-gradient(135deg,#22d3ee,#06b6d4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: '#04080f',
                }}>PG</div>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: 'var(--text-2)',
                  fontFamily: 'var(--font-display)',
                }}>
                  Phish<span style={{ color:'var(--cyan)' }}>Guard</span> AI
                </span>
              </div>

              {/* Center — made with love */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: 'var(--text-3)',
                fontFamily: 'var(--font-mono)',
              }}>
                <span>crafted with</span>
                <span style={{
                  color: '#f43f5e',
                  fontSize: 14,
                  animation: 'heartbeat 1.5s ease infinite',
                }}>♥</span>
                <span>by</span>
                <span style={{
                  color: 'var(--text-1)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-display)',
                  background: 'linear-gradient(90deg, var(--cyan), #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Rahul Dahiya</span>
              </div>

              {/* Right — links */}
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <a href="https://github.com/rahuldahiya30/phishguard-ai"
                  target="_blank" rel="noreferrer"
                  style={{
                    fontSize: 11, color: 'var(--text-3)',
                    fontFamily: 'var(--font-mono)',
                    textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.color='var(--cyan)'}
                  onMouseLeave={e => e.target.style.color='var(--text-3)'}
                >
                  ⌥ GitHub
                </a>
                <div style={{
                  fontSize: 11, color: 'var(--text-3)',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: 'var(--green)',
                    boxShadow: '0 0 6px var(--green)',
                    display: 'inline-block',
                  }} />
                  All systems operational
                </div>
              </div>

            </div>

            <style>{`
              @keyframes heartbeat {
                0%,100% { transform: scale(1);   }
                14%      { transform: scale(1.3); }
                28%      { transform: scale(1);   }
                42%      { transform: scale(1.2); }
                70%      { transform: scale(1);   }
              }
            `}</style>
          </footer>

        </div>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mobile-nav" style={{ justifyContent:'space-around' }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => scrollTo(item.id)} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            background:'none', border:'none', cursor:'pointer',
            color: activeNav===item.id ? 'var(--cyan)' : 'var(--text-3)',
            padding:'6px 16px', borderRadius:8,
            transition:'color 0.15s',
            fontFamily:'var(--font-display)',
          }}>
            <span style={{ fontSize:16 }}>{item.icon}</span>
            <span style={{ fontSize:10, letterSpacing:'0.05em' }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}