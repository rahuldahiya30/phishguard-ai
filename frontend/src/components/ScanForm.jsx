import { useState } from 'react';
import { scanInput } from '../api';

const PLACEHOLDERS = {
  email: `From: security@paypa1-verification.com
Subject: URGENT: Your account has been suspended!

Dear Customer, unusual activity has been detected.
Click here to verify: http://paypa1-secure.xyz/login`,
  url: `https://paypa1-secure-login.xyz/verify?token=abc123`
};

export default function ScanForm({ onScanComplete, onScanStart }) {
  const [text, setText] = useState('');
  const [type, setType] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true); setError(null);
    onScanStart?.();
    try {
      const result = await scanInput(text, type);
      onScanComplete(result);
      setText('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Backend unreachable. Is uvicorn running?');
    } finally { setLoading(false); }
  };

  return (
    <div className="glass anim-2 section-gap" style={{ padding: '24px', marginBottom: '16px' }}>
      <div className="sec-label">Threat Input</div>

      {/* Type toggle */}
      <div className="type-toggle" style={{ marginBottom: '14px' }}>
        {['email','url'].map(t => (
          <button key={t} className={`type-btn${type===t?' active':''}`}
            onClick={() => setType(t)}>
            {t === 'email' ? '✉ Email' : '🔗 URL'}
          </button>
        ))}
      </div>

      {/* Input */}
      <textarea
        className="threat-input"
        style={{ height: type === 'url' ? '80px' : '160px', marginBottom: '12px' }}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={PLACEHOLDERS[type]}
        spellCheck={false}
      />

      {/* Char count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          {text.length.toLocaleString()} / 10,000 chars
        </span>
        {text.length > 0 && (
          <button onClick={() => setText('')}
            style={{ fontSize: '11px', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
            Clear ×
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 14px', marginBottom: '12px',
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
          borderRadius: 'var(--radius-sm)', fontSize: '12px',
          color: '#fda4af', fontFamily: 'var(--font-mono)'
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Submit */}
      <button
        className={`btn-scan${loading ? ' scanning' : ''}`}
        onClick={handleSubmit}
        disabled={!text.trim()}>
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span style={{
              width: '14px', height: '14px', border: '2px solid currentColor',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite', display: 'inline-block'
            }} />
            Analyzing with Claude AI + VirusTotal...
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>▶</span> Run Threat Scan
          </span>
        )}
      </button>
    </div>
  );
}