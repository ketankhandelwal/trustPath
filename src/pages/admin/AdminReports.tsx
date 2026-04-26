import { useEffect, useRef, useState } from 'react';
import { PageHeader, StatusChip, EmptyState, Modal, RowMenu, useToast } from '../../components/shared';
import { Icon } from '../../components/Icon';
import { listReports, createReport, updateReport, updateReportStatus, downloadReport, listDoctors } from '../../api/admin';

const STATUSES = ['Completed', 'In Progress', 'Incomplete'];
const INVESTIGATIONS = ['CBC','LFT','KFT','Lipid Profile','HbA1c','TSH','Urine R/M','Vitamin D','Vitamin B12','Creatinine','ESR','CRP','Culture & Sensitivity'];
const PANELS = ['Complete Blood Count','Liver Function Panel','Kidney Function Panel','Lipid Profile','Thyroid Panel (T3/T4/TSH)','Diabetes Panel (HbA1c, FBS)','Vitamin Panel (B12, D)','Iron Studies'];

type Report = Record<string, unknown>;

export default function AdminReports({ openUploadOnMount }: { openUploadOnMount?: boolean }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [upload, setUpload] = useState(!!openUploadOnMount);
  const [editing, setEditing] = useState<Report | null>(null);
  const [preview, setPreview] = useState<Report | null>(null);
  const toast = useToast();

  const load = async (status?: string) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, limit: 50, sort_by: 'created_at', sort_dir: 'desc' };
      if (status && status !== 'All') params.status = status.toLowerCase().replace(' ', '_');
      if (q) params.q = q;
      const res = await listReports(params);
      const payload = res.data?.data;
      const d = payload?.reports || payload?.items || payload;
      setReports(Array.isArray(d) ? d : []);
    } catch { setReports([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(statusFilter); }, [statusFilter]);

  const filtered = reports.filter(r => {
    if (!q) return true;
    const t = q.toLowerCase();
    return String(r.patient_name || r.patient || '').toLowerCase().includes(t) ||
      String(r.reg_no || r.regNo || '').toLowerCase().includes(t) ||
      String(r.investigation || '').toLowerCase().includes(t);
  });

  const handleSave = async (data: Report, file?: File | null) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v != null && v !== '') fd.append(k, String(v)); });
    if (!data.referred_by) fd.append('referred_by', 'Self');
    if (!data.report_name) fd.append('report_name', file?.name || String(data.investigation || data.panel || 'Report'));
    if (file) fd.append('file', file);
    try {
      if (data.id) {
        await updateReport(String(data.id), fd);
        toast('Report updated');
      } else {
        await createReport(fd);
        toast('Report uploaded');
      }
      load(statusFilter);
    } catch { toast('Failed to save report'); }
    setUpload(false);
    setEditing(null);
  };

  const handleStatus = async (id: unknown, status: string) => {
    try {
      await updateReportStatus(String(id), status.toLowerCase().replace(' ', '_'));
      toast(`Marked as ${status}`);
      load(statusFilter);
    } catch { toast('Failed to update status'); }
  };

  const handleDownload = async (r: Report) => {
    try {
      const res = await downloadReport(String(r.id));
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = String(r.name || r.reg_no || 'report'); a.click();
    } catch { toast('Download failed'); }
  };

  const getStatusLabel = (s: string) => {
    if (s === 'completed') return 'Completed';
    if (s === 'in_progress') return 'In Progress';
    if (s === 'incomplete') return 'Incomplete';
    return s;
  };

  const counts: Record<string, number> = { All: reports.length };

  return (
    <>
      <PageHeader
        title="Reports"
        sub={`${filtered.length} reports · managing all lab reports`}
        actions={
          <button className="btn primary" onClick={() => setUpload(true)}>
            <Icon name="upload" size={13}/>Upload Report
          </button>
        }
      />

      <div className="row gap-4" style={{ marginBottom: 12 }}>
        {['All','Completed','In Progress','Incomplete'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className="btn sm" style={{ background: statusFilter === s ? 'var(--navy-tint)' : 'var(--surface)', color: statusFilter === s ? 'var(--navy)' : 'var(--ink-2)', borderColor: statusFilter === s ? 'var(--navy-tint-2)' : 'var(--border-strong)' }}>
            {s} <span className="mono" style={{ marginLeft: 4, opacity: 0.7, fontSize: 11 }}>{counts[s] ?? ''}</span>
          </button>
        ))}
      </div>

      <div className="filterbar">
        <div className="search-box">
          <Icon name="search" size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }}/>
          <input className="input" placeholder="Search by patient, reg no, investigation…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(statusFilter)}/>
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
                <th>Referred By</th>
                <th>Sample Date</th>
                <th>Status</th>
                <th style={{ width: 32 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={String(r.id)}>
                  <td>
                    <button onClick={() => setPreview(r)} className="col" style={{ lineHeight: 1.25, textAlign: 'left' }}>
                      <span style={{ fontWeight: 500 }}>{String(r.name || r.patient_name || '—')}</span>
                      <span className="text-xs text-dim mono">{String(r.reg_no || r.regNo || '')}</span>
                    </button>
                  </td>
                  <td>{String(r.patient_name || r.patient || '—')} <span className="text-dim">{String(r.age || '')}/{String(r.sex || '')}</span></td>
                  <td>{String(r.investigation || r.panel || '—')}</td>
                  <td className="text-muted">{String(r.referred_by || r.referredBy || '—')}</td>
                  <td className="mono text-muted">{String((r.sample_date || r.sampleDate || '').toString().slice(0,10))}</td>
                  <td><StatusChip status={getStatusLabel(String(r.status || ''))}/></td>
                  <td>
                    <RowMenu items={[
                      { label: 'Preview', icon: 'eye', action: () => setPreview(r) },
                      { label: 'Edit details', icon: 'edit', action: () => setEditing(r) },
                      { label: 'Download file', icon: 'download', action: () => handleDownload(r) },
                      ...(STATUSES.filter(s => s !== getStatusLabel(String(r.status || ''))).map(s => ({
                        label: `Mark as ${s}`, icon: s === 'Completed' ? 'check' : s === 'In Progress' ? 'clock' : 'warning',
                        action: () => handleStatus(r.id, s),
                      }))),
                    ]}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && <EmptyState title="No reports found" sub="Adjust filters or upload a new report."/>}
      </div>

      {upload && <UploadReportModal onClose={() => setUpload(false)} onSave={handleSave}/>}
      {editing && <EditReportModal report={editing} onClose={() => setEditing(null)} onSave={handleSave}/>}
      {preview && <ReportPreviewModal report={preview} onClose={() => setPreview(null)} onEdit={() => { setEditing(preview); setPreview(null); }} onDownload={() => handleDownload(preview)}/>}
    </>
  );
}

function UploadReportModal({ onClose, onSave }: { onClose: () => void; onSave: (d: Report, file: File | null) => void }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [f, setF] = useState<Report>({ patient_name: '', age: '', sex: 'male', referred_by: 'Self', investigation: INVESTIGATIONS[0], panel: PANELS[0], status: 'in_progress', sample_date: new Date().toISOString().slice(0,10), reg_no: '', lab_no: '' });
  const set = (k: string, v: unknown) => setF(x => ({ ...x, [k]: v }));
  const fileRef = useRef<HTMLInputElement>(null);

  const steps = [{n:1,label:'Upload file'},{n:2,label:'Patient details'},{n:3,label:'Report details'},{n:4,label:'Review & save'}];
  const canNext = () => { if (step === 1) return !!file; if (step === 2) return !!(f.patient_name && f.age); if (step === 3) return !!f.investigation; return true; };

  return (
    <Modal title="Upload Report" size="xl" icon="upload" onClose={onClose}
      footer={
        <>
          <div className="text-xs text-dim" style={{ marginRight: 'auto' }}>Step {step} of {steps.length}</div>
          {step > 1 && <button className="btn" onClick={() => setStep(step-1)}>Back</button>}
          {step < 4 && <button className="btn primary" disabled={!canNext()} onClick={() => setStep(step+1)}>Continue</button>}
          {step === 4 && <button className="btn primary" onClick={() => onSave(f, file)}>Upload report</button>}
        </>
      }
    >
      <div className="row gap-8" style={{ marginBottom: 20 }}>
        {steps.map((s, i) => (
          <div key={s.n} className="row gap-8" style={{ flex: i < steps.length-1 ? 1 : 0, alignItems: 'center' }}>
            <div className="row gap-6" style={{ opacity: step >= s.n ? 1 : 0.4, flexShrink: 0 }}>
              <div style={{ width: 22, height: 22, borderRadius: 999, background: step > s.n ? 'var(--green)' : step === s.n ? 'var(--navy)' : 'var(--surface-3)', color: step >= s.n ? '#fff' : 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                {step > s.n ? <Icon name="check" size={12}/> : s.n}
              </div>
              <span style={{ fontSize: 12, fontWeight: step === s.n ? 600 : 500, color: step === s.n ? 'var(--ink)' : 'var(--ink-3)' }}>{s.label}</span>
            </div>
            {i < steps.length-1 && <div style={{ flex: 1, height: 1, background: step > s.n ? 'var(--green)' : 'var(--divider)' }}/>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="col gap-16">
          <input ref={fileRef} type="file" accept=".pdf,.png,.doc,.docx" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)}/>
          {file ? (
            <div style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--navy-tint)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="filePdf" size={22}/>
              </div>
              <div className="col grow">
                <div style={{ fontWeight: 600 }}>{file.name}</div>
                <div className="text-xs text-dim">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <button className="btn sm" onClick={() => setFile(null)}>Replace</button>
            </div>
          ) : (
            <div onClick={() => fileRef.current?.click()} style={{ padding: '36px 20px', border: '2px dashed var(--border-strong)', borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: 'var(--surface-2)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--navy-tint)', color: 'var(--navy)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon name="upload" size={20}/>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Drop file here or click to browse</div>
              <div className="text-xs text-dim" style={{ marginTop: 4 }}>PDF, PNG, Word · Max 25 MB</div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
          <div><label className="field-label">Patient name</label><input className="input" placeholder="Full name" value={String(f.patient_name || '')} onChange={e => set('patient_name', e.target.value)}/></div>
          <div><label className="field-label">Age</label><input className="input" placeholder="e.g. 45" value={String(f.age || '')} onChange={e => set('age', e.target.value)}/></div>
          <div><label className="field-label">Sex</label><select className="select" value={String(f.sex || 'male')} onChange={e => set('sex', e.target.value)}><option value="male">M</option><option value="female">F</option><option value="other">Other</option></select></div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="field-label">Referred by</label>
            <ReferredByInput value={String(f.referred_by || '')} onChange={v => set('referred_by', v)}/>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><label className="field-label">Registration number</label><input className="input mono" placeholder="NDN/2026/xxxxxx" value={String(f.reg_no || '')} onChange={e => set('reg_no', e.target.value)}/><div className="field-hint">Auto-generated if left blank</div></div>
          <div><label className="field-label">Lab number</label><input className="input mono" placeholder="L-xxxxx" value={String(f.lab_no || '')} onChange={e => set('lab_no', e.target.value)}/></div>
          <div><label className="field-label">Sample date</label><input className="input" type="date" value={String(f.sample_date || '')} onChange={e => set('sample_date', e.target.value)}/></div>
          <div><label className="field-label">Status</label><select className="select" value={String(f.status || '')} onChange={e => set('status', e.target.value)}><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="incomplete">Incomplete</option></select></div>
          <div><label className="field-label">Panel</label><select className="select" value={String(f.panel || '')} onChange={e => set('panel', e.target.value)}>{PANELS.map(p => <option key={p}>{p}</option>)}</select></div>
          <div><label className="field-label">Investigation</label><select className="select" value={String(f.investigation || '')} onChange={e => set('investigation', e.target.value)}>{INVESTIGATIONS.map(i => <option key={i}>{i}</option>)}</select></div>
        </div>
      )}

      {step === 4 && (
        <div className="col gap-12">
          {file && (
            <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div className="row gap-10">
                <Icon name="filePdf" size={24} color="var(--navy)"/>
                <div className="col"><div style={{ fontWeight: 600 }}>{file.name}</div><div className="text-xs text-dim">Ready to upload</div></div>
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {[
              ['Patient', `${f.patient_name || '—'} · ${f.age}/${f.sex}`],
              ['Referred by', f.referred_by || 'Self'],
              ['Registration', f.reg_no || '(auto)'],
              ['Investigation', f.investigation],
              ['Panel', f.panel],
              ['Sample date', f.sample_date],
            ].map(([k, v], i) => (
              <div key={i} style={{ padding: '10px 14px', borderBottom: i < 4 ? '1px solid var(--divider)' : 'none', borderRight: i % 2 === 0 ? '1px solid var(--divider)' : 'none', background: 'var(--surface)' }}>
                <div className="text-xs text-dim">{String(k ?? '')}</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{String(v || '—')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function EditReportModal({ report, onClose, onSave }: { report: Report; onClose: () => void; onSave: (d: Report, file: null) => void }) {
  const [f, setF] = useState<Report>(report);
  const set = (k: string, v: unknown) => setF(x => ({ ...x, [k]: v }));
  return (
    <Modal title={`Edit · ${String(report.reg_no || report.regNo || '')}`} subtitle={String(report.name || '')} size="lg" icon="edit" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => onSave(f, null)}>Save changes</button></>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1 / -1' }}><label className="field-label">Patient name</label><input className="input" value={String(f.patient_name || f.patient || '')} onChange={e => set('patient_name', e.target.value)}/></div>
        <div><label className="field-label">Age</label><input className="input" value={String(f.age || '')} onChange={e => set('age', e.target.value)}/></div>
        <div><label className="field-label">Sex</label><select className="select" value={String(f.sex || 'M')} onChange={e => set('sex', e.target.value)}><option>M</option><option>F</option></select></div>
        <div><label className="field-label">Sample date</label><input className="input" type="date" value={String(f.sample_date || f.sampleDate || '')} onChange={e => set('sample_date', e.target.value)}/></div>
        <div><label className="field-label">Investigation</label><select className="select" value={String(f.investigation || '')} onChange={e => set('investigation', e.target.value)}>{INVESTIGATIONS.map(i => <option key={i}>{i}</option>)}</select></div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="field-label">Status</label>
          <div className="row gap-8">
            {[['in_progress','In Progress'],['completed','Completed'],['incomplete','Incomplete']].map(([val, label]) => (
              <button key={val} type="button" onClick={() => set('status', val)} className="btn sm" style={{ borderColor: f.status === val ? 'var(--navy)' : 'var(--border-strong)', background: f.status === val ? 'var(--navy-tint)' : 'var(--surface)', color: f.status === val ? 'var(--navy)' : 'var(--ink-2)' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ReferredByInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listDoctors({ is_active: true, page: 1, limit: 500, sort_by: 'name' })
      .then(res => {
        const data = res.data?.data?.items || res.data?.data || res.data?.doctors || res.data || [];
        setDoctors(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = [{ id: 'self', name: 'Self' }, ...doctors].filter(d =>
    d.name.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="row" style={{ position: 'relative' }}>
        <input
          className="input"
          placeholder="Doctor name or Self"
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          style={{ paddingRight: 32 }}
        />
        <button type="button" onClick={() => setOpen(o => !o)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 0 }}>
          <Icon name="chevronDown" size={14}/>
        </button>
      </div>
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', zIndex: 100, top: '100%', left: 0, right: 0, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', maxHeight: 200, overflowY: 'auto' }}>
          {filtered.map(d => (
            <div key={d.id} onMouseDown={() => { onChange(d.name); setOpen(false); }}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, fontWeight: d.id === 'self' ? 600 : 400 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {d.name}{d.id !== 'self' && d.hospital ? ` (${d.hospital})` : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportPreviewModal({ report, onClose, onEdit, onDownload }: { report: Report; onClose: () => void; onEdit: () => void; onDownload: () => void }) {
  return (
    <Modal title={String(report.name || report.patient_name || '—')} subtitle={String(report.reg_no || report.regNo || '')} size="lg" icon="reports" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Close</button><button className="btn" onClick={onDownload}><Icon name="download" size={13}/>Download</button><button className="btn primary" onClick={onEdit}><Icon name="edit" size={13}/>Edit</button></>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: '#fff', padding: 24, minHeight: 340, fontSize: 12, color: '#2A3B56' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--navy)', marginBottom: 12 }}>NIDAN PATHOLOGY</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: 12 }}>
            <div><b>Patient:</b> {String(report.patient_name || report.patient || '—')}</div>
            <div><b>Age/Sex:</b> {String(report.age || '')}/{String(report.sex || '')}</div>
            <div><b>Referred by:</b> {String(report.referred_by || report.referredBy || '—')}</div>
            <div><b>Sample date:</b> {String((report.sample_date || report.sampleDate || '').toString().slice(0,10))}</div>
          </div>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy)', marginBottom: 8 }}>{String(report.panel || report.investigation || '—')}</div>
          <div className="text-xs text-dim">Report file attached — download to view full results.</div>
        </div>
        <div className="col gap-12" style={{ fontSize: 12 }}>
          {[['Reg No', report.reg_no || report.regNo],['Lab No', report.lab_no || report.labNo],['Patient', report.patient_name || report.patient],['Referred by', report.referred_by || report.referredBy],['Investigation', report.investigation],['Status', report.status]].map(([k,v]) => (
            <div key={String(k)} className="row between">
              <span style={{ color: 'var(--ink-4)' }}>{String(k ?? '')}</span>
              <span style={{ fontWeight: 500 }}>{String(v || '—')}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
