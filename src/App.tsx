import { useEffect, useState } from 'react';
import './index.css';

import { ToastProvider } from './components/shared';
import { Sidebar, Topbar } from './components/shared';
import { getMe } from './api/auth';

import AdminLogin from './pages/AdminLogin';
import DoctorLogin from './pages/DoctorLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminReports from './pages/admin/AdminReports';
import AdminReferrals from './pages/admin/AdminReferrals';
import AdminSettings from './pages/admin/AdminSettings';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorRefer from './pages/doctor/DoctorRefer';
import DoctorReports from './pages/doctor/DoctorReports';
import DoctorSettings from './pages/doctor/DoctorSettings';

type Role = 'admin' | 'doctor' | null;
type AdminPage = 'dashboard' | 'doctors' | 'reports' | 'referrals' | 'settings';
type DoctorPage = 'dashboard' | 'refer' | 'reports' | 'settings';

export default function App() {
  return (
    <ToastProvider>
      <AppInner/>
    </ToastProvider>
  );
}

function AppInner() {
  const [role, setRole] = useState<Role>(() => (localStorage.getItem('role') as Role) || null);
  const [user, setUser] = useState<{ name: string; email: string; initials: string } | undefined>();
  const [adminPage, setAdminPage] = useState<AdminPage>('dashboard');
  const [doctorPage, setDoctorPage] = useState<DoctorPage>('dashboard');
  const [pageOpts, setPageOpts] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (role && localStorage.getItem('token')) {
      getMe().then(res => {
        const u = res.data?.data || res.data;
        if (u) {
          const name = u.name || u.email || (role === 'admin' ? 'Admin' : 'Doctor');
          const email = u.email || '';
          const initials = name.split(' ').slice(0, 2).map((s: string) => s[0]).join('').toUpperCase();
          setUser({ name, email, initials });
        }
      }).catch(() => {});
    }
  }, [role]);

  const navigateAdmin = (page: string, opts: Record<string, unknown> = {}) => {
    setAdminPage(page as AdminPage);
    setPageOpts(opts);
  };

  const navigateDoctor = (page: string) => {
    setDoctorPage(page as DoctorPage);
  };

  const handleLogout = () => {
    setRole(null);
    setUser(undefined);
    setAdminPage('dashboard');
    setDoctorPage('dashboard');
  };

  if (!role) {
    return <LoginSelector onLogin={(r) => { setRole(r); setPageOpts({}); }}/>;
  }

  if (role === 'admin') {
    return (
      <div className="app-root">
        <Sidebar role="admin" current={adminPage} onNavigate={navigateAdmin} user={user}/>
        <div className="main-col">
          <Topbar crumbs={['Nidan Pathology', adminPageTitle(adminPage)]}/>
          <div className="page">
            {adminPage === 'dashboard' && <AdminDashboard onNavigate={navigateAdmin}/>}
            {adminPage === 'doctors' && <AdminDoctors openAddOnMount={!!pageOpts.openAdd}/>}
            {adminPage === 'reports' && <AdminReports openUploadOnMount={!!pageOpts.openUpload}/>}
            {adminPage === 'referrals' && <AdminReferrals/>}
            {adminPage === 'settings' && <AdminSettings onLogout={handleLogout} user={user}/>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <Sidebar role="doctor" current={doctorPage} onNavigate={navigateDoctor} user={user}/>
      <div className="main-col">
        <Topbar crumbs={['Nidan Pathology', doctorPageTitle(doctorPage)]}/>
        <div className="page">
          {doctorPage === 'dashboard' && <DoctorDashboard onRefer={() => navigateDoctor('refer')} onNavigate={navigateDoctor} user={user}/>}
          {doctorPage === 'refer' && <DoctorRefer onSuccess={() => navigateDoctor('dashboard')}/>}
          {doctorPage === 'reports' && <DoctorReports/>}
          {doctorPage === 'settings' && <DoctorSettings onLogout={handleLogout} user={user}/>}
        </div>
      </div>
    </div>
  );
}

function adminPageTitle(page: AdminPage) {
  const m: Record<AdminPage, string> = { dashboard: 'Dashboard', doctors: 'Doctors', reports: 'Reports', referrals: 'Referrals', settings: 'Settings' };
  return m[page];
}

function doctorPageTitle(page: DoctorPage) {
  const m: Record<DoctorPage, string> = { dashboard: 'Dashboard', refer: 'Refer Patient', reports: 'My Reports', settings: 'Settings' };
  return m[page];
}

function LoginSelector({ onLogin }: { onLogin: (r: Role) => void }) {
  const [mode, setMode] = useState<'admin' | 'doctor'>('admin');
  return (
    <div style={{ position: 'relative' }}>
      {mode === 'admin'
        ? <AdminLogin onLogin={() => onLogin('admin')}/>
        : <DoctorLogin onLogin={() => onLogin('doctor')}/>
      }
      <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
        <button
          className="btn sm"
          style={{ background: 'rgba(15,26,43,0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
          onClick={() => setMode(mode === 'admin' ? 'doctor' : 'admin')}
        >
          Switch to {mode === 'admin' ? 'Doctor' : 'Admin'} login
        </button>
      </div>
    </div>
  );
}
