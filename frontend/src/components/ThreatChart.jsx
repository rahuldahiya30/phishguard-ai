import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const PIE_COLORS = { SAFE:'#10b981', LOW:'#f59e0b', MEDIUM:'#f97316', HIGH:'#f43f5e', CRITICAL:'#be123c' };

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#060d18', border:'1px solid rgba(255,255,255,0.1)', padding:'10px 14px', borderRadius:'8px', fontFamily:'IBM Plex Mono,monospace', fontSize:'12px' }}>
      {label && <div style={{ color:'#3d5168', marginBottom:'6px', fontSize:'10px' }}>{label}</div>}
      {payload.map((p,i) => <div key={i} style={{ color:p.color }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  );
};

// Animated placeholder bars for empty state
const EmptyBars = () => (
  <div style={{ height:160, display:'flex', alignItems:'flex-end', gap:8, padding:'0 8px' }}>
    {[40,65,30,80,55,70,45,90,60,75,35,85,50,95].map((h,i) => (
      <div key={i} style={{
        flex:1, borderRadius:'3px 3px 0 0',
        background:`rgba(34,211,238,${0.04 + (i%3)*0.02})`,
        height:`${h}%`,
        animation:`pulse-bar 2s ${i*0.1}s ease-in-out infinite`,
        border:'1px solid rgba(34,211,238,0.08)',
        borderBottom:'none',
      }} />
    ))}
    <style>{`
      @keyframes pulse-bar {
        0%,100% { opacity:0.4; }
        50% { opacity:1; }
      }
    `}</style>
  </div>
);

// Animated donut placeholder
const EmptyDonut = () => (
  <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center' }}>
    <div style={{ position:'relative', width:120, height:120 }}>
      <svg width="120" height="120" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(34,211,238,0.06)" strokeWidth="14"/>
        <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="14"
          strokeDasharray="80 203" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="8s" repeatCount="indefinite"/>
        </circle>
        <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(244,63,94,0.12)" strokeWidth="14"
          strokeDasharray="50 233" strokeDashoffset="-90" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="12s" repeatCount="indefinite"/>
        </circle>
      </svg>
      <div style={{
        position:'absolute', inset:0, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        fontSize:'10px', color:'var(--text-3)', fontFamily:'IBM Plex Mono,monospace',
        lineHeight:1.4
      }}>
        <span>NO</span><span>DATA</span>
      </div>
    </div>
  </div>
);

export default function ThreatChart({ stats }) {
  const hasData = stats && stats.total_scans > 0;
  const hasTrends = stats?.daily_trends?.length > 0;
  const pieData = Object.entries(stats?.risk_distribution || {}).map(([name,value]) => ({name,value}));

  return (
    <div className="chart-grid section-gap" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'16px' }}>

      {/* Threat Trends */}
      <div className="glass" style={{ padding:'20px', position:'relative', overflow:'hidden' }}>
        {/* Corner accent */}
        <div style={{ position:'absolute', top:0, right:0, width:60, height:60,
          background:'linear-gradient(225deg, rgba(34,211,238,0.08), transparent)',
          borderBottom:'1px solid rgba(34,211,238,0.1)', borderLeft:'1px solid rgba(34,211,238,0.1)',
          borderRadius:'0 12px 0 0' }} />
        <div className="sec-label">Threat Trends — 14 days</div>
        {hasTrends ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={stats.daily_trends} margin={{top:4,right:4,left:-28,bottom:0}}>
              <XAxis dataKey="date" tick={{fill:'#3d5168',fontSize:9,fontFamily:'IBM Plex Mono'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#3d5168',fontSize:9,fontFamily:'IBM Plex Mono'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Line type="monotone" dataKey="total" stroke="#22d3ee" strokeWidth={2} dot={false} name="Total"/>
              <Line type="monotone" dataKey="threats" stroke="#f43f5e" strokeWidth={2} dot={false} name="Threats"/>
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <>
            <EmptyBars/>
            <div style={{ textAlign:'center', marginTop:8, fontSize:11, color:'var(--text-3)', fontFamily:'IBM Plex Mono,monospace' }}>
              Run your first scan to see trends
            </div>
          </>
        )}
      </div>

      {/* Risk Distribution */}
      <div className="glass" style={{ padding:'20px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, right:0, width:60, height:60,
          background:'linear-gradient(225deg, rgba(244,63,94,0.06), transparent)',
          borderBottom:'1px solid rgba(244,63,94,0.08)', borderLeft:'1px solid rgba(244,63,94,0.08)',
          borderRadius:'0 12px 0 0' }} />
        <div className="sec-label">Risk Distribution</div>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={62} dataKey="value" paddingAngle={3} strokeWidth={0}>
                {pieData.map((e,i) => <Cell key={i} fill={PIE_COLORS[e.name]||'#3d5168'}/>)}
              </Pie>
              <Tooltip content={<Tip/>}/>
              <Legend wrapperStyle={{fontSize:'10px',fontFamily:'IBM Plex Mono,monospace',color:'#8b9ab0'}}/>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <>
            <EmptyDonut/>
            <div style={{ textAlign:'center', marginTop:4, fontSize:11, color:'var(--text-3)', fontFamily:'IBM Plex Mono,monospace' }}>
              Threat breakdown appears after scans
            </div>
          </>
        )}
      </div>
    </div>
  );
}