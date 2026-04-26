import { useState } from 'react';
import { PageHeader, useToast } from '../../components/shared';
import { Icon } from '../../components/Icon';
import { referPatient } from '../../api/doctor';

const INVESTIGATIONS = ['CBC','LFT','KFT','Lipid Profile','HbA1c','TSH','Urine R/M','Vitamin D','Vitamin B12','Creatinine','ESR','CRP','Culture & Sensitivity'];

export default function DoctorRefer({ onSuccess }: { onSuccess?: () => void }) {
  const [f, setF] = useState({ patient_name: '', age: '', sex: 'M', phone: '', address: '', investigation: INVESTIGATIONS[0], notes: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();
  const set = (k: string, v: string) => setF(x => ({ ...x, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await referPatient(f);
      setDone(true);
      toast('Patient referred successfully');
      setTimeout(() => { setDone(false); setF({ patient_name: '', age: '', sex: 'M', phone: '', address: '', investigation: INVESTIGATIONS[0], notes: '' }); onSuccess?.(); }, 2000);
    } catch { toast('Failed to refer patient — please try again'); }
    finally { setLoading(false); }
  };

  if (done) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 420 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-bg)', color: 'var(--green)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Icon name="check" size={24}/>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>Patient referred</h2>
          <p style={{ color: 'var(--ink-3)', margin: 0 }}>The lab has been notified. You'll receive the report once it's ready.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Refer Patient" sub="Send a new patient to Nidan Pathology for investigation"/>

      <div style={{ maxWidth: 640 }}>
        <form onSubmit={submit} className="col gap-16">
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Patient information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
              <div>
                <label className="field-label">Patient name <span style={{ color: 'var(--rose)' }}>*</span></label>
                <input className="input" placeholder="Full name" value={f.patient_name} onChange={e => set('patient_name', e.target.value)} required/>
              </div>
              <div>
                <label className="field-label">Age <span style={{ color: 'var(--rose)' }}>*</span></label>
                <input className="input" placeholder="e.g. 45" value={f.age} onChange={e => set('age', e.target.value)} required/>
              </div>
              <div>
                <label className="field-label">Sex</label>
                <select className="select" value={f.sex} onChange={e => set('sex', e.target.value)}>
                  <option>M</option><option>F</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="field-label">Phone</label>
                <input className="input" placeholder="+91 98xxx xxxxx" value={f.phone} onChange={e => set('phone', e.target.value)}/>
              </div>
              <div style={{ gridColumn: '2 / -1' }}>
                <label className="field-label">Address</label>
                <input className="input" placeholder="Patient address" value={f.address} onChange={e => set('address', e.target.value)}/>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Investigation required</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="field-label">Investigation <span style={{ color: 'var(--rose)' }}>*</span></label>
                <select className="select" value={f.investigation} onChange={e => set('investigation', e.target.value)}>
                  {INVESTIGATIONS.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="field-label">Notes <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}>(optional)</span></label>
                <textarea className="textarea" placeholder="Clinical notes, urgency, special instructions…" value={f.notes} onChange={e => set('notes', e.target.value)}/>
              </div>
            </div>
          </div>

          <div className="row end gap-8">
            <button type="button" className="btn" onClick={() => setF({ patient_name: '', age: '', sex: 'M', phone: '', address: '', investigation: INVESTIGATIONS[0], notes: '' })}>Reset</button>
            <button type="submit" className="btn primary" disabled={loading || !f.patient_name || !f.age}>
              {loading ? <span className="spinner"/> : <><Icon name="send" size={13}/>Submit referral</>}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
