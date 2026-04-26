import { useEffect, useState } from 'react';
import { PageHeader, StatusChip, EmptyState } from '../../components/shared';
import { Icon } from '../../components/Icon';
import { listReferrals } from '../../api/admin';

type Referral = Record<string, unknown>;

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    listReferrals({ page: 1, limit: 50, sort_by: 'created_at', sort_dir: 'desc' })
      .then(res => setReferrals(res.data?.data?.referrals || res.data?.data || []))
      .catch(() => setReferrals([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = referrals.filter(r => {
    if (!q) return true;
    const t = q.toLowerCase();
    return String(r.patient_name || r.patient || '').toLowerCase().includes(t) ||
      String(r.doctor_name || r.doctorName || '').toLowerCase().includes(t);
  });

  return (
    <>
      <PageHeader title="Referrals" sub={`${filtered.length} patient referrals`}/>

      <div className="filterbar">
        <div className="search-box">
          <Icon name="search" size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }}/>
          <input className="input" placeholder="Search by patient or doctor…" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
        <button className="btn sm ghost" onClick={() => setQ('')}>Clear</button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><span className="spinner dark"/></div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Referred By</th>
                <th>Investigation</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={String(r.id || i)}>
                  <td>
                    <div className="col" style={{ lineHeight: 1.25 }}>
                      <span style={{ fontWeight: 500 }}>{String(r.patient_name || r.patient || '—')}</span>
                      <span className="text-xs text-dim">{String(r.age || '')} {String(r.sex || '')}</span>
                    </div>
                  </td>
                  <td>{String(r.doctor_name || r.doctorName || r.referred_by || '—')}</td>
                  <td>{String(r.investigation || r.test_required || '—')}</td>
                  <td><StatusChip status={String(r.status || 'Pending')}/></td>
                  <td className="mono text-muted">{String((r.created_at || r.createdAt || '').toString().slice(0,10))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && <EmptyState title="No referrals yet" icon="refer" sub="Referrals from doctors will appear here."/>}
      </div>
    </>
  );
}
