import { useEffect, useState } from 'react';
import { StatusChip, TrendLine, EmptyState } from '../../components/shared';
import { Icon } from '../../components/Icon';
import { listMyReports } from '../../api/doctor';

const TREND = [18,22,19,25,23,28,24,30,27,32,29,35,31,38];

interface Props {
  onRefer: () => void;
  onNavigate: (page: string) => void;
  user?: { name: string; email: string; initials: string };
}

export default function DoctorDashboard({ onRefer, onNavigate, user }: Props) {
  const [reports, setReports] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ total: 0, completed: 0, inProgress: 0, incomplete: 0 });

  useEffect(() => {
    listMyReports({ limit: 8, sort_by: 'created_at', sort_dir: 'desc' })
      .then(res => {
        const r = res.data?.data?.reports || res.data?.data || [];
        setReports(r.slice(0, 8));
        const total = res.data?.data?.total || r.length;
        const completed = r.filter((x: Record<string, unknown>) => x.status === 'completed').length;
        const inProgress = r.filter((x: Record<string, unknown>) => x.status === 'in_progress').length;
        const incomplete = r.filter((x: Record<string, unknown>) => x.status === 'incomplete').length;
        setCounts({ total, completed, inProgress, incomplete });
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const firstName = (user?.name || 'Doctor').split(' ')[1] || (user?.name || 'Doctor');

  return (
    <>
      <div style={{ borderRadius: 12, padding: 24, background: 'linear-gradient(135deg, #1E3A5F 0%, #254976 100%)', color: '#fff', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>
        <div className="row between" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <div className="chip" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', marginBottom: 10 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Good {getGreeting()}, Dr. {firstName}</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>You have <span style={{ color: '#fff', fontWeight: 600 }}>{counts.completed} completed reports</span> ready to download.</p>
          </div>
          <button className="btn" onClick={onRefer} style={{ background: '#fff', color: 'var(--navy)', height: 40, padding: '0 18px', fontWeight: 600 }}>
            <Icon name="userPlus" size={14}/>Refer Patient
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Reports', value: counts.total, icon: 'reports', color: 'var(--navy)' },
          { label: 'Completed', value: counts.completed, icon: 'check', color: 'var(--green)' },
          { label: 'In Progress', value: counts.inProgress, icon: 'clock', color: 'var(--amber)' },
          { label: 'Incomplete', value: counts.incomplete, icon: 'warning', color: 'var(--rose)' },
        ].map((s, i) => (
          <div key={i} className="stat">
            <div className="row between">
              <span className="stat-label">{s.label}</span>
              <div style={{ color: s.color }}><Icon name={s.icon} size={14}/></div>
            </div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="row between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)' }}>
            <div className="col">
              <div style={{ fontWeight: 600, fontSize: 14 }}>Recent reports</div>
              <div className="text-xs text-dim">Your patients' latest results</div>
            </div>
            <button className="btn ghost sm" onClick={() => onNavigate('reports')}>View all <Icon name="arrowRight" size={12}/></button>
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}><span className="spinner dark"/></div>
          ) : reports.length > 0 ? (
            <table className="tbl">
              <thead><tr><th>Patient</th><th>Investigation</th><th>Date</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr key={String(r.id || i)}>
                    <td>
                      <div className="col" style={{ lineHeight: 1.25 }}>
                        <span style={{ fontWeight: 500 }}>{String(r.patient_name || r.patient || '—')}</span>
                        <span className="text-xs text-dim">{String(r.age || '')}/{String(r.sex || '')}</span>
                      </div>
                    </td>
                    <td>{String(r.investigation || '—')}</td>
                    <td className="mono text-muted">{String((r.sample_date || r.sampleDate || '').toString().slice(0,10))}</td>
                    <td><StatusChip status={normalizeStatus(String(r.status || ''))}/></td>
                    <td style={{ width: 40 }}>
                      <button className="btn ghost sm icon-only"><Icon name={r.status === 'completed' ? 'download' : 'eye'} size={13}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState title="No reports yet" sub="Reports will appear here once uploaded by the lab."/>}
        </div>

        <div className="col gap-16">
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>This month</div>
            <div className="text-xs text-dim" style={{ marginBottom: 14 }}>{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
            <div className="col gap-10">
              {[{ label: 'Reports received', value: String(counts.total), trend: '+12%', up: true },{ label: 'Avg. turnaround', value: '18h', trend: '−2h', up: false }].map((m, i) => (
                <div key={i} className="row between" style={{ fontSize: 13 }}>
                  <span style={{ color: 'var(--ink-3)' }}>{m.label}</span>
                  <div className="row gap-8">
                    <span className={`text-xs ${m.up ? '' : 'text-dim'}`} style={{ color: m.up ? 'var(--green)' : 'var(--ink-4)' }}>{m.trend}</span>
                    <span style={{ fontWeight: 600 }}>{m.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <TrendLine data={TREND} color="var(--navy)" width={280} height={44}/>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Quick actions</div>
            <div className="col gap-6">
              {[{icon:'userPlus',label:'Refer a new patient',action:onRefer},{icon:'reports',label:'View all my reports',action:()=>onNavigate('reports')}].map((q, i) => (
                <button key={i} onClick={q.action} className="row gap-10" style={{ padding: 10, borderRadius: 8, textAlign: 'left' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  <Icon name={q.icon} size={14} color="var(--navy)"/>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{q.label}</span>
                  <Icon name="chevronRight" size={13} color="var(--ink-4)" style={{ marginLeft: 'auto' }}/>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function normalizeStatus(s: string) {
  if (s === 'completed') return 'Completed';
  if (s === 'in_progress') return 'In Progress';
  if (s === 'incomplete') return 'Incomplete';
  return s;
}
