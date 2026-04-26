import { useState } from 'react';
import { PageHeader, PasswordInput, PasswordStrength, ToggleRow, useToast } from '../../components/shared';
import { Icon } from '../../components/Icon';
import { adminChangePassword, logout } from '../../api/auth';

interface Props {
  onLogout: () => void;
  user?: { name: string; email: string; initials: string };
}

export default function AdminSettings({ onLogout, user }: Props) {
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
      <PageHeader title="Settings" sub="Manage your admin account, security and preferences"/>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
        <div className="col gap-2">
          {[{id:'account',label:'Account',icon:'user'},{id:'security',label:'Security',icon:'lock'},{id:'notifications',label:'Notifications',icon:'bell'},{id:'team',label:'Team access',icon:'shield'}].map(t => (
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
              <div className="text-xs text-dim" style={{ marginBottom: 18 }}>Visible to doctors you interact with</div>
              <div className="row gap-16">
                <div className="avatar xl" style={{ width: 64, height: 64, fontSize: 20 }}>{user?.initials || 'AD'}</div>
                <div className="col gap-4">
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.name || 'Admin'}</div>
                  <div className="text-xs text-dim">Admin · Nidan Pathology</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 20 }}>
                <div><label className="field-label">Email</label><input className="input" defaultValue={user?.email || ''} disabled/></div>
              </div>
              <div className="row end gap-8" style={{ marginTop: 18 }}>
                <button className="btn primary" onClick={() => toast('Profile updated')}>Save changes</button>
              </div>
            </div>
          )}

          {tab === 'security' && <SecurityTab onLogout={handleLogout}/>}

          {tab === 'notifications' && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Email notifications</div>
              {[{label:'New patient referral',sub:'When a doctor refers a new patient',on:true},{label:'Report status changes',sub:'When completion status is updated',on:true},{label:'Doctor account activity',sub:'New doctor additions or deactivations',on:false},{label:'Weekly summary',sub:'Every Monday 9 AM',on:true}].map((n,i) => <ToggleRow key={i} {...n}/>)}
            </div>
          )}

          {tab === 'team' && (
            <div className="card">
              <div className="row between" style={{ padding: 16, borderBottom: '1px solid var(--divider)' }}>
                <div className="col"><div style={{ fontWeight: 600, fontSize: 14 }}>Admins</div><div className="text-xs text-dim">New admins can only be created by developer</div></div>
                <span className="chip outline">Dev-only</span>
              </div>
              <div style={{ padding: 4 }}>
                {[{name:'Admin',role:'Owner · Developer',email:'admin@nidan.com',initials:'AD'}].map((p,i) => (
                  <div key={i} className="row gap-12" style={{ padding: 12 }}>
                    <div className="avatar">{p.initials}</div>
                    <div className="col grow"><div style={{ fontWeight: 500 }}>{p.name}</div><div className="text-xs text-dim">{p.email}</div></div>
                    <span className="chip navy">{p.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SecurityTab({ onLogout }: { onLogout: () => void }) {
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const toast = useToast();

  const handleChange = async () => {
    try {
      await adminChangePassword(cur, pw);
      setCur(''); setPw(''); setPw2('');
      toast('Password updated');
    } catch { toast('Failed to change password — check current password'); }
  };

  return (
    <>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Change password</div>
        <div className="text-xs text-dim" style={{ marginBottom: 18 }}>Use at least 10 characters</div>
        <div className="col gap-12" style={{ maxWidth: 420 }}>
          <div><label className="field-label">Current password</label><PasswordInput value={cur} onChange={setCur} show={show} onToggle={() => setShow(!show)}/></div>
          <div><label className="field-label">New password</label><PasswordInput value={pw} onChange={setPw} show={show}/><PasswordStrength value={pw}/></div>
          <div><label className="field-label">Confirm new password</label><PasswordInput value={pw2} onChange={setPw2} show={show}/>{pw2 && pw !== pw2 && <div style={{ fontSize: 11, color: 'var(--rose)', marginTop: 4 }}>Passwords don't match</div>}</div>
          <button className="btn primary" style={{ alignSelf: 'flex-start', marginTop: 4 }} disabled={!cur || !pw || pw !== pw2} onClick={handleChange}>Update password</button>
        </div>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div className="row between">
          <div className="col">
            <div style={{ fontWeight: 600, fontSize: 14 }}>Logout</div>
            <div className="text-xs text-dim" style={{ marginTop: 4 }}>Sign out of your account on this device.</div>
          </div>
          <button className="btn danger" onClick={onLogout}><Icon name="logout" size={13}/>Logout</button>
        </div>
      </div>
    </>
  );
}
