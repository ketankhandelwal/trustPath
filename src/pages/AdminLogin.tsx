import { useState } from 'react';
import { Logo } from '../components/shared';
import { Icon } from '../components/Icon';
import { adminLogin } from '../api/auth';

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('admin@nidanpathology.com');
  const [password, setPassword] = useState('Admin@123');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(email, password);
      const token = res.data?.data?.token || res.data?.token;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', 'admin');
      }
      onLogin();
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-pane">
        <div className="row gap-10">
          <Logo size={32} />
          <div className="col" style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Nidan Pathology</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Admin Console</div>
          </div>
        </div>

        <div style={{ maxWidth: 380, width: '100%', alignSelf: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Admin sign in</h1>
          <p style={{ color: 'var(--ink-3)', margin: '0 0 28px' }}>Manage doctors, reports and referrals for Nidan Pathology Lab.</p>

          <form onSubmit={submit} className="col gap-14">
            {error && (
              <div style={{ padding: '10px 12px', background: 'var(--rose-bg)', border: '1px solid #F3C7C2', borderRadius: 8, fontSize: 13, color: 'var(--rose)' }}>
                {error}
              </div>
            )}
            <div>
              <label className="field-label">Email</label>
              <input className="input" style={{ height: 38 }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@nidanlabs.in" />
            </div>
            <div>
              <label className="field-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" style={{ height: 38, paddingRight: 36 }} type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" />
                <button type="button" onClick={() => setShow(!show)} className="btn ghost sm icon-only" style={{ position: 'absolute', right: 4, top: 5 }}>
                  <Icon name={show ? 'eyeOff' : 'eye'} size={13} color="var(--ink-3)" />
                </button>
              </div>
            </div>
            <button className="btn primary lg" style={{ height: 40, justifyContent: 'center' }} disabled={loading || !email || !password}>
              {loading ? <span className="spinner" /> : <>Sign in <Icon name="arrowRight" size={14} /></>}
            </button>
          </form>
        </div>

        <div className="row between" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
          <div>© 2026 Nidan Pathology · NABL Accredited</div>
        </div>
      </div>

      <div className="auth-side">
        <div>
          <span className="chip" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
            Admin Console
          </span>
        </div>
        <div>
          <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.02em', maxWidth: 440 }}>
            Complete lab management in one place.
          </div>
          <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.7)', maxWidth: 420, fontSize: 14, lineHeight: 1.6 }}>
            Upload reports, manage doctors, track referrals — all synced in real time.
          </div>
          <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 440 }}>
            {[{ n: '2,400+', l: 'Reports monthly' }, { n: '180+', l: 'Partner doctors' }, { n: '< 24h', l: 'Turnaround' }, { n: 'NABL', l: 'Accredited lab' }].map((s, i) => (
              <div key={i} style={{ padding: 14, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>{s.n}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>nidan-pathology.in</div>
      </div>
    </div>
  );
}
