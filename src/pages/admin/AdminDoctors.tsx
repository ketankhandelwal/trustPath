import { useEffect, useState } from 'react';
import { PageHeader, StatusChip, EmptyState, Modal, RowMenu, useToast } from '../../components/shared';
import { Icon } from '../../components/Icon';
import { listDoctors, createDoctor, updateDoctor, toggleDoctorStatus } from '../../api/admin';

const SPECIALTIES = ['General Physician','Cardiologist','Pediatrician','Gynaecologist','Orthopedic','Dermatologist','Endocrinologist','ENT','Oncologist','Pulmonologist','Neurologist','Urologist'];

type Doctor = Record<string, unknown>;

export default function AdminDoctors({ openAddOnMount, onOpenDoctor }: { openAddOnMount?: boolean; onOpenDoctor?: (d: Doctor) => void }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(!!openAddOnMount);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [selected, setSelected] = useState<Set<unknown>>(new Set());
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await listDoctors({ page: 1, limit: 50, sort_by: 'created_at', sort_dir: 'desc' });
      const payload = res.data?.data;
      const d = payload?.doctors || payload?.items || payload;
      setDoctors(Array.isArray(d) ? d : []);
    } catch { setDoctors([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = doctors.filter(d => {
    if (statusFilter !== 'All') {
      const active = String(d.status || d.is_active);
      if (statusFilter === 'Active' && active !== 'active' && active !== 'true') return false;
      if (statusFilter === 'Inactive' && active !== 'inactive' && active !== 'false') return false;
    }
    if (q) {
      const t = q.toLowerCase();
      if (!String(d.name || '').toLowerCase().includes(t) && !String(d.email || '').toLowerCase().includes(t) && !String(d.phone || '').includes(q)) return false;
    }
    return true;
  });

  const handleSave = async (doc: Doctor) => {
    try {
      if (doc.id) {
        await updateDoctor(String(doc.id), doc);
        toast(`Doctor ${doc.name} updated`);
      } else {
        await createDoctor(doc);
        toast(`Doctor ${doc.name} added · login credentials sent`);
      }
      load();
    } catch { toast('Failed to save doctor'); }
    setShowAdd(false);
    setEditing(null);
  };

  const handleToggle = async (id: unknown) => {
    try {
      await toggleDoctorStatus(String(id));
      toast('Doctor status updated');
      load();
    } catch { toast('Failed to update status'); }
  };

  const getInitials = (name: string) => name.split(' ').filter(x => x !== 'Dr.').slice(0, 2).map(s => s[0]).join('').toUpperCase();
  const getStatusLabel = (d: Doctor) => {
    if (d.status === 'active' || d.is_active === true || d.status === 'Active') return 'Active';
    return 'Inactive';
  };

  return (
    <>
      <PageHeader
        title="Doctors"
        sub={`${filtered.length} of ${doctors.length} doctors`}
        actions={
          <>
            <button className="btn primary" onClick={() => setShowAdd(true)}>
              <Icon name="userPlus" size={13}/>Add Doctor
            </button>
          </>
        }
      />

      <div className="filterbar">
        <div className="search-box">
          <Icon name="search" size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }}/>
          <input className="input" placeholder="Search by name, phone, email…" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
        <div className="hsep"/>
        <select className="select" style={{ width: 120 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option>All</option><option>Active</option><option>Inactive</option>
        </select>
        <button className="btn sm ghost" onClick={() => { setQ(''); setStatusFilter('All'); }}>Clear</button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><span className="spinner dark"/></div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 28, paddingRight: 0 }}>
                  <input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(d => d.id)) : new Set())}/>
                </th>
                <th>Doctor</th>
                <th>Speciality</th>
                <th>Hospital</th>
                <th>Contact</th>
                <th>Login ID</th>
                <th>Status</th>
                <th>Added</th>
                <th style={{ width: 32 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={String(d.id)} className={selected.has(d.id) ? 'selected' : ''}>
                  <td style={{ paddingRight: 0 }}>
                    <input type="checkbox" checked={selected.has(d.id)} onChange={e => {
                      const ns = new Set(selected); e.target.checked ? ns.add(d.id) : ns.delete(d.id); setSelected(ns);
                    }}/>
                  </td>
                  <td>
                    <button onClick={() => onOpenDoctor?.(d)} className="row gap-10" style={{ textAlign: 'left' }}>
                      <div className="avatar">{getInitials(String(d.name || ''))}</div>
                      <div className="col" style={{ lineHeight: 1.25 }}>
                        <span style={{ fontWeight: 500 }}>{String(d.name || '—')}</span>
                        <span className="text-xs text-dim mono">{String(d.id || '')}</span>
                      </div>
                    </button>
                  </td>
                  <td>{String(d.speciality || '—')}</td>
                  <td className="text-muted">{String(d.hospital || '—')}</td>
                  <td>
                    <div className="col" style={{ lineHeight: 1.25 }}>
                      <span style={{ fontSize: 12 }}>{String(d.phone || '—')}</span>
                      <span className="text-xs text-dim">{String(d.email || '')}</span>
                    </div>
                  </td>
                  <td className="mono text-xs">{String(d.login_id || '—')}</td>
                  <td><StatusChip status={getStatusLabel(d)}/></td>
                  <td className="text-muted text-xs mono">{String((d.created_at || d.createdAt || '').toString().slice(0, 10))}</td>
                  <td>
                    <RowMenu items={[
                      { label: 'Edit details', icon: 'edit', action: () => setEditing(d) },
                      { label: getStatusLabel(d) === 'Active' ? 'Deactivate' : 'Activate', icon: getStatusLabel(d) === 'Active' ? 'close' : 'check', action: () => handleToggle(d.id) },
                    ]}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && <EmptyState title="No doctors match your filters" sub="Try clearing filters or adjusting your search."/>}
      </div>

      {(showAdd || editing) && (
        <DoctorForm doctor={editing} onClose={() => { setShowAdd(false); setEditing(null); }} onSave={handleSave}/>
      )}
    </>
  );
}

function DoctorForm({ doctor, onClose, onSave }: { doctor: Doctor | null; onClose: () => void; onSave: (d: Doctor) => void }) {
  const [f, setF] = useState<Doctor>(doctor || { name: '', phone: '', email: '', speciality: SPECIALTIES[0], hospital: '', address: '', status: 'active', login_id: '', password: '' });
  const set = (k: string, v: unknown) => setF(x => ({ ...x, [k]: v }));
  const isEdit = !!doctor?.id;
  return (
    <Modal
      title={isEdit ? `Edit ${String(doctor?.name || '')}` : 'Add Doctor'}
      subtitle={isEdit ? 'Update details and permissions' : 'Create a new doctor profile and login credentials'}
      size="lg" icon={isEdit ? 'edit' : 'userPlus'} onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={() => onSave(f)}>{isEdit ? 'Save changes' : 'Create doctor account'}</button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="field-label">Full name</label>
          <input className="input" placeholder="Dr. Name Surname" value={String(f.name || '')} onChange={e => set('name', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Phone number</label>
          <input className="input" placeholder="+91 98xxx xxxxx" value={String(f.phone || '')} onChange={e => set('phone', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Email</label>
          <input className="input" placeholder="name@clinic.in" value={String(f.email || '')} onChange={e => set('email', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Speciality</label>
          <select className="select" value={String(f.speciality || '')} onChange={e => set('speciality', e.target.value)}>
            {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Hospital</label>
          <input className="input" placeholder="e.g. Apollo Hospitals" value={String(f.hospital || '')} onChange={e => set('hospital', e.target.value)}/>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="field-label">Address</label>
          <textarea className="textarea" placeholder="Clinic / practice address" value={String(f.address || '')} onChange={e => set('address', e.target.value)}/>
        </div>
        {!isEdit && (
          <>
            <div>
              <label className="field-label">Login ID</label>
              <input className="input mono" placeholder="e.g. dr_sharma" value={String(f.login_id || '')} onChange={e => set('login_id', e.target.value)}/>
            </div>
            <div>
              <label className="field-label">Password</label>
              <input className="input" type="password" placeholder="Temporary password" value={String(f.password || '')} onChange={e => set('password', e.target.value)}/>
            </div>
          </>
        )}
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="field-label">Status</label>
          <div className="row gap-8">
            {['active','inactive'].map(s => (
              <button key={s} type="button" onClick={() => set('status', s)} className="btn sm" style={{ borderColor: f.status === s ? 'var(--navy)' : 'var(--border-strong)', background: f.status === s ? 'var(--navy-tint)' : 'var(--surface)', color: f.status === s ? 'var(--navy)' : 'var(--ink-2)', fontWeight: 500, textTransform: 'capitalize' }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
