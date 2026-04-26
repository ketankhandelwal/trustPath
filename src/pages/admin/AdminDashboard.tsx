import { useEffect, useState } from 'react';
import { PageHeader, StatusChip, TrendLine, Bar, EmptyState } from '../../components/shared';
import { Icon } from '../../components/Icon';
import { listReports } from '../../api/admin';
import { listDoctors } from '../../api/admin';

interface Props {
  onNavigate: (page: string, opts?: Record<string, unknown>) => void;
}

const REPORT_TREND = [18,22,19,25,23,28,24,30,27,32,29,35,31,38];
const REFERRAL_TREND = [8,12,10,15,13,18,14,20,17,22,19,25,21,28];

export default function AdminDashboard({ onNavigate }: Props) {
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, incomplete: 0, activeDocs: 0, referrals: 0 });
  const [recentReports, setRecentReports] = useState<Record<string, unknown>[]>([]);
  const [topDoctors, setTopDoctors] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      listReports({ limit: 7, sort_by: 'created_at', sort_dir: 'desc' }),
      listDoctors({ limit: 20, is_active: true }),
    ]).then(([rRes, dRes]) => {
      const reports: Record<string, unknown>[] = rRes.data?.data?.reports || rRes.data?.data || [];
      const doctors: Record<string, unknown>[] = dRes.data?.data?.doctors || dRes.data?.data || [];
      const total = rRes.data?.data?.total || reports.length;
      const completed = reports.filter((r) => r.status === 'completed').length;
      const inProgress = reports.filter((r) => r.status === 'in_progress' || r.status === 'In Progress').length;
      const incomplete = reports.filter((r) => r.status === 'incomplete' || r.status === 'Incomplete').length;
      setStats({ total, completed, inProgress, incomplete, activeDocs: doctors.length, referrals: 214 });
      setRecentReports(reports.slice(0, 7));
      setTopDoctors(doctors.slice(0, 5));
    }).catch(() => {
      setStats({ total: 0, completed: 0, inProgress: 0, incomplete: 0, activeDocs: 0, referrals: 0 });
    }).finally(() => setLoading(false));
  }, []);

  const { total, completed, inProgress, incomplete, activeDocs } = stats;

  const kpis = [
    { label: 'Total Reports', value: total, delta: '+12.4%', up: true, trend: REPORT_TREND },
    { label: 'Active Doctors', value: activeDocs, delta: '+3 this month', up: true, trend: [8,9,10,10,11,11,12,12,13,14,15,15,16,17] },
    { label: 'Referrals', value: 214, delta: '+18.2%', up: true, trend: REFERRAL_TREND },
    { label: 'Pending Review', value: inProgress + incomplete, delta: `${incomplete} incomplete`, up: false, trend: [9,12,8,11,10,14,12,13,15,11,10,12,13,11] },
  ];

  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}><span className="spinner dark"/></div>;

  return (
    <>
      <PageHeader
        title="Dashboard"
        sub={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Overview of lab activity`}
        actions={
          <>
            <button className="btn primary" onClick={() => onNavigate('reports', { openUpload: true })}>
              <Icon name="upload" size={13}/>Upload Report
            </button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {kpis.map((k, i) => (
          <div key={i} className="stat">
            <div className="row between">
              <span className="stat-label">{k.label}</span>
              <TrendLine data={k.trend} width={64} height={22} fill={false} color={k.up ? 'var(--green)' : 'var(--amber)'}/>
            </div>
            <div className="stat-value">{k.value.toLocaleString()}</div>
            <div className={`stat-delta ${k.up ? 'up' : 'down'}`}>
              <Icon name={k.up ? 'trend' : 'activity'} size={12}/>
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="row between" style={{ marginBottom: 14 }}>
            <div className="col">
              <div style={{ fontWeight: 600, fontSize: 14 }}>Report Volume</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>Last 14 days</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
            {REPORT_TREND.map((v, i) => (
              <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', height: `${(v / Math.max(...REPORT_TREND)) * 100}%`, background: i === REPORT_TREND.length - 1 ? 'var(--navy)' : 'var(--navy-tint-2)', borderRadius: '4px 4px 0 0', minHeight: 2 }}/>
                <div style={{ fontSize: 10, color: 'var(--ink-4)', flexShrink: 0 }}>{i + 10}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Status Breakdown</div>
          <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 14 }}>All reports</div>
          <StatusDonut completed={completed} inProgress={inProgress} incomplete={incomplete} total={total || 1}/>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Completed', value: completed, color: 'var(--green)' },
              { label: 'In Progress', value: inProgress, color: 'var(--amber)' },
              { label: 'Incomplete', value: incomplete, color: 'var(--rose)' },
            ].map(s => (
              <div key={s.label} className="row between" style={{ fontSize: 12 }}>
                <div className="row gap-6">
                  <span style={{ width: 8, height: 8, background: s.color, borderRadius: 2 }}/>
                  <span style={{ color: 'var(--ink-2)' }}>{s.label}</span>
                </div>
                <div className="row gap-8">
                  <span className="mono" style={{ color: 'var(--ink-3)' }}>{total ? ((s.value/total)*100).toFixed(1) : '0.0'}%</span>
                  <span className="mono" style={{ fontWeight: 600 }}>{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="row between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Recent Reports</div>
            <button className="btn ghost sm" onClick={() => onNavigate('reports')}>
              View all <Icon name="arrowRight" size={12}/>
            </button>
          </div>
          {recentReports.length > 0 ? (
            <table className="tbl">
              <thead><tr><th>Patient</th><th>Investigation</th><th>Referred By</th><th>Status</th></tr></thead>
              <tbody>
                {recentReports.map((r, i) => (
                  <tr key={String(r.id || i)}>
                    <td>
                      <div className="col" style={{ lineHeight: 1.25 }}>
                        <span style={{ fontWeight: 500 }}>{String(r.patient_name || r.patient || '—')}</span>
                        <span className="text-xs text-dim mono">{String(r.reg_no || r.regNo || '')}</span>
                      </div>
                    </td>
                    <td>{String(r.investigation || r.panel || '—')}</td>
                    <td className="text-muted">{String(r.referred_by || r.referredBy || '—')}</td>
                    <td><StatusChip status={normalizeStatus(String(r.status || ''))}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <EmptyState title="No reports yet" sub="Upload the first report to get started."/>}
        </div>

        <div className="card">
          <div className="row between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Top Referring Doctors</div>
            <button className="btn ghost sm" onClick={() => onNavigate('doctors')}>View all <Icon name="arrowRight" size={12}/></button>
          </div>
          {topDoctors.length > 0 ? (
            <div style={{ padding: '8px 4px' }}>
              {topDoctors.map((d, i) => {
                const reports = Number(d.reports_shared || d.reportsShared || 0);
                const maxR = Number(topDoctors[0].reports_shared || topDoctors[0].reportsShared || 1);
                const name = String(d.name || '');
                const av = name.split(' ').filter((x: string) => x !== 'Dr.').slice(0, 2).map((s: string) => s[0]).join('').toUpperCase();
                return (
                  <div key={String(d.id || i)} style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)', fontWeight: 600, width: 16 }}>{i+1}</div>
                    <div className="avatar">{av}</div>
                    <div className="col grow" style={{ minWidth: 0, gap: 4 }}>
                      <div className="row between">
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{name}</span>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>{reports}</span>
                      </div>
                      <Bar value={reports} max={maxR} color="var(--navy-3)"/>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState title="No doctors yet" sub="Add doctors to see referral stats."/>}
        </div>
      </div>
    </>
  );
}

function normalizeStatus(s: string) {
  if (s === 'completed') return 'Completed';
  if (s === 'in_progress') return 'In Progress';
  if (s === 'incomplete') return 'Incomplete';
  return s;
}

function StatusDonut({ completed, inProgress, incomplete, total, size = 140 }: { completed: number; inProgress: number; incomplete: number; total: number; size?: number }) {
  const r = size/2 - 12;
  const c = 2 * Math.PI * r;
  const segs = [{ val: completed, color: 'var(--green)' },{ val: inProgress, color: 'var(--amber)' },{ val: incomplete, color: 'var(--rose)' }];
  let offset = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth="14"/>
        {segs.map((s, i) => {
          const frac = s.val / total;
          const dash = frac * c;
          const el = (<circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.color} strokeWidth="14" strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset} strokeLinecap="butt"/>);
          offset += dash;
          return el;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{total}</div>
        <div className="text-xs text-dim">Reports</div>
      </div>
    </div>
  );
}
