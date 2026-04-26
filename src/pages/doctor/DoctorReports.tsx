import { useEffect, useState } from 'react';
import { PageHeader, StatusChip, EmptyState, Modal, useToast } from '../../components/shared';
import { Icon } from '../../components/Icon';
import { listMyReports, getMyReport, downloadMyReport } from '../../api/doctor';

type Report = Record<string, unknown>;

export default function DoctorReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [preview, setPreview] = useState<Report | null>(null);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 50, sort_by: 'created_at', sort_dir: 'desc' };
      if (statusFilter !== 'All') params.status = statusFilter.toLowerCase().replace(' ', '_');
      const res = await listMyReports(params);
      setReports(res.data?.data?.reports || res.data?.data || []);
    } catch { setReports([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const filtered = reports.filter(r => {
    if (!q) return true;
    const t = q.toLowerCase();
    return String(r.patient_name || r.patient || '').toLowerCase().includes(t) ||
      String(r.reg_no || '').toLowerCase().includes(t) ||
      String(r.investigation || '').toLowerCase().includes(t);
  });

  const handleDownload = async (r: Report) => {
    try {
      const res = await downloadMyReport(String(r.id));
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = String(r.name || r.reg_no || 'report'); a.click();
      toast('Download started');
    } catch { toast('Download failed'); }
  };

  const handlePreview = async (r: Report) => {
    try {
      const res = await getMyReport(String(r.id));
      setPreview(res.data?.data || r);
    } catch { setPreview(r); }
  };

  const normalizeStatus = (s: string) => {
    if (s === 'completed') return 'Completed';
    if (s === 'in_progress') return 'In Progress';
    if (s === 'incomplete') return 'Incomplete';
    return s;
  };

  return (
    <>
      <PageHeader title="My Reports" sub={`${filtered.length} reports for your patients`}/>

      <div className="row gap-4" style={{ marginBottom: 12 }}>
        {['All','Completed','In Progress','Incomplete'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className="btn sm" style={{ background: statusFilter === s ? 'var(--navy-tint)' : 'var(--surface)', color: statusFilter === s ? 'var(--navy)' : 'var(--ink-2)', borderColor: statusFilter === s ? 'var(--navy-tint-2)' : 'var(--border-strong)' }}>
            {s}
          </button>
        ))}
      </div>

      <div className="filterbar">
        <div className="search-box">
          <Icon name="search" size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }}/>
          <input className="input" placeholder="Search by patient, reg no, investigation…" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
        <button className="btn sm ghost" onClick={() => { setQ(''); setStatusFilter('All'); }}>Clear</button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><span className="spinner dark"/></div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Report</th>
                <th>Patient</th>
                <th>Investigation</th>
                <th>Sample Date</th>
                <th>Status</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={String(r.id || i)}>
                  <td>
                    <button onClick={() => handlePreview(r)} className="col" style={{ lineHeight: 1.25, textAlign: 'left' }}>
                      <span style={{ fontWeight: 500 }}>{String(r.name || r.patient_name || '—')}</span>
                      <span className="text-xs text-dim mono">{String(r.reg_no || r.regNo || '')}</span>
                    </button>
                  </td>
                  <td>
                    <div className="col" style={{ lineHeight: 1.25 }}>
                      <span style={{ fontWeight: 500 }}>{String(r.patient_name || r.patient || '—')}</span>
                      <span className="text-xs text-dim">{String(r.age || '')}/{String(r.sex || '')}</span>
                    </div>
                  </td>
                  <td>{String(r.investigation || '—')}</td>
                  <td className="mono text-muted">{String((r.sample_date || r.sampleDate || '').toString().slice(0,10))}</td>
                  <td><StatusChip status={normalizeStatus(String(r.status || ''))}/></td>
                  <td>
                    <div className="row gap-4">
                      <button className="btn ghost sm icon-only" onClick={() => handlePreview(r)} title="Preview">
                        <Icon name="eye" size={13}/>
                      </button>
                      {normalizeStatus(String(r.status || '')) === 'Completed' && (
                        <button className="btn ghost sm icon-only" onClick={() => handleDownload(r)} title="Download">
                          <Icon name="download" size={13}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && <EmptyState title="No reports found" icon="reports" sub="Reports will appear here once uploaded by the lab."/>}
      </div>

      {preview && <ReportPreviewModal report={preview} onClose={() => setPreview(null)} onDownload={() => { handleDownload(preview); setPreview(null); }}/>}
    </>
  );
}

function ReportPreviewModal({ report, onClose, onDownload }: { report: Report; onClose: () => void; onDownload: () => void }) {
  const isCompleted = report.status === 'completed' || report.status === 'Completed';
  return (
    <Modal title={String(report.name || report.patient_name || '—')} subtitle={String(report.reg_no || report.regNo || '')} size="lg" icon="reports" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Close</button>{isCompleted && <button className="btn primary" onClick={onDownload}><Icon name="download" size={13}/>Download Report</button>}</>}
    >
      <div className="col gap-14" style={{ fontSize: 13 }}>
        {[['Patient', String(report.patient_name || report.patient || '—')],['Age / Sex', `${report.age}/${report.sex}`],['Investigation', String(report.investigation || '—')],['Sample Date', String((report.sample_date || report.sampleDate || '').toString().slice(0,10))],['Status', String(report.status || '—')],['Reg No', String(report.reg_no || report.regNo || '—')]].map(([k,v]) => (
          <div key={k} className="row between" style={{ padding: '8px 0', borderBottom: '1px solid var(--divider)' }}>
            <span style={{ color: 'var(--ink-4)', fontWeight: 500 }}>{k}</span>
            <span style={{ fontWeight: 500 }}>{v}</span>
          </div>
        ))}
        {!isCompleted && (
          <div style={{ padding: 14, background: 'var(--amber-bg)', border: '1px solid #F0D090', borderRadius: 8 }}>
            <div className="row gap-8">
              <Icon name="clock" size={14} color="var(--amber)"/>
              <span style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 500 }}>Report not yet available for download — check back once status is Completed.</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
