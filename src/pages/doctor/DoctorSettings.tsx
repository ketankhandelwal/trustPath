import { useState } from 'react';
import { PageHeader, PasswordInput, PasswordStrength, ToggleRow, useToast } from '../../components/shared';
import { Icon } from '../../components/Icon';
import { doctorChangePassword, logout } from '../../api/auth';

interface Props {
  onLogout: () => void;
  user?: { name: string; email: string; initials: string };
}

export default function DoctorSettings({ onLogout, user }: Props) {
  const [tab, setTab] = useState('account');
  const toast = useToast();

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    onLogout();
  };

  return (
    <>
      <PageHeader title="Settings" sub="Manage your profile, security and preferences"/>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
        <div className="col gap-2">
          {[{id:'account',label:'Account',icon:'user'},{id:'security',label:'Security',icon:'lock'},{id:'notifications',label:'Notifications',icon:'bell'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={'nav-item' + (tab === t.id ? ' active' : '')}>
              <Icon name={t.icon} size={14}/>{t.label}
            </button>
          ))}
          <div className="divider" style={{ margin: '12px 0' }}/>
          <button onClick={handleLogout} className="nav-item" style={{ color: 'var(--rose)' }}>
            <Icon name="logout" size={14}/>Logout
          </button>
        </div>

        <div className="col gap-16">
          {tab === 'account' && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Profile</div>
              <div className="text-xs text-dim" style={{ marginBottom: 18 }}>Your information at Nidan Pathology</div>
              <div className="row gap-16">
                <div className="avatar xl" style={{ width: 64, height: 64, fontSize: 20 }}>{user?.initials || 'DR'}</div>
                <div className="col gap-4">
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.name || 'Doctor'}</div>
                  <div className="text-xs text-dim">{user?.email || ''}</div>
                  <div className="text-xs text-dim">Doctor · Nidan Pathology</div>
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                <div className="row end gap-8">
                  <button className="btn primary" onClick={() => toast('Profile updated')}>Save changes</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'security' && <DoctorSecurityTab onLogout={handleLogout}/>}

          {tab === 'notifications' && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Notifications</div>
              {[{label:'Report is completed',sub:'Email + in-app',on:true},{label:'Report status changes',sub:'In-app only',on:true},{label:'Weekly summary',sub:'Every Monday morning',on:false}].map((n,i) => <ToggleRow key={i} {...n}/>)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DoctorSecurityTab({ onLogout }: { onLogout: () => void }) {
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const toast = useToast();

  const handleChange = async () => {
    try {
      await doctorChangePassword(cur, pw);
      setCur(''); setPw(''); setPw2('');
      toast('Password updated');
    } catch { toast('Failed to change password — check current password'); }
  };

  return (
    <>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Change password</div>
        <div className="text-xs text-dim" style={{ marginBottom: 18 }}>Use at least 8 characters</div>
        <div className="col gap-12" style={{ maxWidth: 420 }}>
          <div><label className="field-label">Current password</label><PasswordInput value={cur} onChange={setCur} show={show} onToggle={() => setShow(!show)}/></div>
          <div><label className="field-label">New password</label><PasswordInput value={pw} onChange={setPw} show={show}/><PasswordStrength value={pw}/></div>
          <div><label className="field-label">Confirm new password</label><PasswordInput value={pw2} onChange={setPw2} show={show}/>{pw2 && pw !== pw2 && <div style={{ fontSize: 11, color: 'var(--rose)', marginTop: 4 }}>Passwords don't match</div>}</div>
          <button className="btn primary" style={{ alignSelf: 'flex-start', marginTop: 4 }} disabled={!cur || !pw || pw !== pw2} onClick={handleChange}>Update password</button>
        </div>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div className="row between">
          <div className="col"><div style={{ fontWeight: 600, fontSize: 14 }}>Logout</div><div className="text-xs text-dim" style={{ marginTop: 4 }}>Sign out of your account.</div></div>
          <button className="btn danger" onClick={onLogout}><Icon name="logout" size={13}/>Logout</button>
        </div>
      </div>
    </>
  );
}
