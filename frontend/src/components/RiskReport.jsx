import { useState } from 'react';

const LEVEL_CONFIG = {
  SAFE:     { color: '#10b981', glow: 'rgba(16,185,129,0.15)', pct: '20%',  emoji: '✓' },
  LOW:      { color: '#f59e0b', glow: 'rgba(245,158,11,0.15)', pct: '40%',  emoji: '!' },
  MEDIUM:   { color: '#f97316', glow: 'rgba(249,115,22,0.15)', pct: '60%',  emoji: '!!' },
  HIGH:     { color: '#f43f5e', glow: 'rgba(244,63,94,0.15)',  pct: '80%',  emoji: '⚠' },
  CRITICAL: { color: '#f43f5e', glow: 'rgba(244,63,94,0.2)',   pct: '100%', emoji: '✖' },
};

export default function RiskReport({ result }) {
  const [open, setOpen] = useState(true);
  if (!result) return null;
  const cfg = LEVEL_CONFIG[result.risk_level] || LEVEL_CONFIG.MEDIUM;
  const scorePct = `${(result.risk_score / 10) * 100}%`;

  return (
    <div className={`glass level-${result.risk_level} anim-3 section-gap`}
      style={{
        marginBottom: '16px', overflow: 'hidden',
        boxShadow: `0 0 40px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        border: `1px solid ${cfg.color}30`,
      }}>

      {/* Top gradient bar */}
      <div style={{
        height: '3px',
        background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}40, transparent)`,
      }} />

      <div style={{ padding: '24px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div className="sec-label" style={{ marginBottom: '6px' }}>Analysis Result</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              ID #{result.id} &nbsp;·&nbsp; {result.input_type.toUpperCase()} scan
            </div>
          </div>
          <span className={`level-badge level-${result.risk_level}`}>
            {cfg.emoji} {result.risk_level}
          </span>
        </div>

        {/* Score + Metrics */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Score ring */}
          <div className="score-ring"
            style={{ '--ring-color': cfg.color, '--ring-pct': scorePct, '--bg-3': '#091220' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: cfg.color, lineHeight: 1 }}>
              {result.risk_score}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>/10</div>
          </div>

          {/* Metrics */}
          <div className="metric-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1, minWidth: '200px' }}>
            {[
              { label: 'Risk Level', value: result.risk_level, color: cfg.color },
              { label: 'Recommendation', value: result.recommendation, color: cfg.color },
            ].map((m, i) => (
              <div key={i} style={{
                background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)',
                padding: '14px 16px', border: `1px solid ${cfg.color}20`,
              }}>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: m.color }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-3)', marginBottom: '6px', letterSpacing: '0.1em' }}>
            <span>THREAT SCORE</span><span>{result.risk_score}/10</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: scorePct, borderRadius: '999px',
              background: `linear-gradient(90deg, ${cfg.color}80, ${cfg.color})`,
              transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: `0 0 10px ${cfg.color}`,
            }} />
          </div>
        </div>

        {/* Indicators */}
        {result.indicators?.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div className="sec-label">
              Phishing Indicators ({result.indicators.length} detected)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {result.indicators.map((ind, i) => (
                <span key={i} className="ind-chip">{ind}</span>
              ))}
            </div>
          </div>
        )}

        {/* Report */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div className="sec-label" style={{ marginBottom: 0 }}>Intelligence Report</div>
            <button onClick={() => setOpen(!open)} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-bright)',
              color: 'var(--text-2)', fontSize: '11px', padding: '4px 12px',
              borderRadius: '999px', cursor: 'pointer', fontFamily: 'var(--font-display)',
              transition: 'all 0.15s'
            }}>
              {open ? '▲ Collapse' : '▼ Expand'}
            </button>
          </div>

          {open && (
            <div style={{
              background: 'rgba(0,0,0,0.35)', borderRadius: 'var(--radius-sm)',
              padding: '20px', borderLeft: `3px solid ${cfg.color}60`,
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              {result.report.split('\n').filter(p => p.trim()).map((para, i) => (
                <p key={i} style={{
                  color: para.startsWith('**') ? 'var(--cyan)' : 'var(--text-2)',
                  fontSize: '13px', lineHeight: '1.85',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: i < result.report.split('\n').filter(p=>p.trim()).length - 1 ? '14px' : 0,
                }}>
                  {para.replace(/\*\*/g, '')}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}