import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

export function Logo({ size = 28, white = false }: { size?: number; white?: boolean }) {
  const bg = white ? '#ffffff' : '#1E3A5F';
  const fg = white ? '#1E3A5F' : '#ffffff';
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.25, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: white ? 'none' : 'inset 0 -1px 0 rgba(0,0,0,0.14)' }}>
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
        <path d="M6 18V6l12 12V6" stroke={fg} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="18" cy="18" r="1.6" fill={fg}/>
      </svg>
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = { 'Completed': 'green', 'In Progress': 'amber', 'Incomplete': 'rose', 'Active': 'green', 'Inactive': 'rose', 'Pending': 'amber' };
  return <span className={`chip dot ${map[status] || 'outline'}`}>{status}</span>;
}

interface SidebarProps {
  role: 'admin' | 'doctor';
  current: string;
  onNavigate: (page: string) => void;
  counts?: { doctors?: number; reports?: number; referrals?: number };
  user?: { name: string; email: string; initials: string };
}
export function Sidebar({ role, current, onNavigate, counts = {}, user }: SidebarProps) {
  const adminNav = [
    { section: 'Overview' },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { section: 'Manage' },
    { id: 'doctors', label: 'Doctors', icon: 'doctors', count: counts.doctors },
    { id: 'reports', label: 'Reports', icon: 'reports', count: counts.reports },
    { id: 'referrals', label: 'Referrals', icon: 'referrals', count: counts.referrals },
    { section: 'Account' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];
  const doctorNav = [
    { section: 'Overview' },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { section: 'Patients' },
    { id: 'refer', label: 'Refer Patient', icon: 'userPlus' },
    { id: 'reports', label: 'My Reports', icon: 'reports', count: counts.reports },
    { section: 'Account' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];
  const nav = role === 'admin' ? adminNav : doctorNav;
  const initials = user?.initials || (role === 'admin' ? 'AD' : 'DR');
  const name = user?.name || (role === 'admin' ? 'Admin' : 'Doctor');
  const email = user?.email || '';
  return (
    <aside className="sidebar">
      <div className="brand">
        <Logo size={28}/>
        <div className="col" style={{ lineHeight: 1.2 }}>
          <div className="brand-name">Nidan Pathology</div>
          <div className="brand-sub">{role === 'admin' ? 'Admin Console' : 'Doctor Portal'}</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '6px 10px', overflow: 'auto' }}>
        {nav.map((item, i) => {
          if ('section' in item) return <div key={i} className="nav-section">{item.section}</div>;
          return (
            <button key={item.id} className={'nav-item' + (current === item.id ? ' active' : '')} onClick={() => onNavigate(item.id!)}>
              <Icon name={item.icon!} size={15}/>
              <span>{item.label}</span>
              {item.count != null && <span className="nav-count">{item.count}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: 10, borderTop: '1px solid var(--divider)' }}>
        <div style={{ padding: 10, borderRadius: 'var(--r-md)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar">{initials}</div>
          <div className="col" style={{ lineHeight: 1.25, minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface TopbarProps {
  crumbs?: string[];
  actions?: React.ReactNode;
}
export function Topbar({ crumbs = [], actions }: TopbarProps) {
  return (
    <div className="topbar">
      <div className="crumbs grow">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon name="chevronRight" size={12}/>}
            <span className={i === crumbs.length - 1 ? 'current' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="row gap-8">{actions}</div>
    </div>
  );
}

interface ModalProps {
  title: string;
  subtitle?: string;
  size?: 'md' | 'lg' | 'xl';
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  icon?: string;
}
export function Modal({ title, subtitle, size = 'md', onClose, children, footer, icon }: ModalProps) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  const cls = size === 'lg' ? 'modal lg' : size === 'xl' ? 'modal xl' : 'modal';
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={cls}>
        <div className="modal-head">
          <div className="row gap-10">
            {icon && (
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--navy-tint)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={icon} size={15}/>
              </div>
            )}
            <div className="col">
              <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
              {subtitle && <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{subtitle}</div>}
            </div>
          </div>
          <button className="btn icon-only sm ghost" onClick={onClose}><Icon name="close" size={14}/></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div className="col">
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      <div className="row gap-8">{actions}</div>
    </div>
  );
}

export function TrendLine({ data, color = 'var(--navy)', width = 260, height = 48, fill = true }: { data: number[]; color?: string; width?: number; height?: number; fill?: boolean }) {
  const max = Math.max(...data); const min = Math.min(...data); const range = max - min || 1;
  const w = width, h = height;
  const pts = data.map((v, i) => { const x = (i / (data.length - 1)) * w; const y = h - ((v - min) / range) * (h - 8) - 4; return [x, y]; });
  const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = d + ` L ${w},${h} L 0,${h} Z`;
  const gid = `g${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {fill && (<><defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.16"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs><path d={area} fill={`url(#${gid})`}/></>)}
      <path d={d} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.5" fill={color}/>
    </svg>
  );
}

export function Bar({ value, max, color = 'var(--navy)', height = 4 }: { value: number; max: number; color?: string; height?: number }) {
  return (
    <div style={{ width: '100%', height, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color }}/>
    </div>
  );
}

export function EmptyState({ icon = 'search', title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div className="empty">
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, color: 'var(--ink-4)' }}>
        <Icon name={icon} size={18}/>
      </div>
      <div style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{title}</div>
      {sub && <div style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// Toast
type ToastFn = (msg: string, icon?: string) => void;
const ToastCtx = createContext<ToastFn>(() => {});
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: string; msg: string; icon: string }[]>([]);
  const push = useCallback<ToastFn>((msg, icon = 'check') => {
    const id = Math.random().toString(36).slice(2);
    setItems((xs) => [...xs, { id, msg, icon }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack">
        {items.map((t) => (
          <div key={t.id} className="toast">
            <Icon name={t.icon} size={14} color="#8ff0bf"/>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

export function PasswordInput({ value, onChange, show, onToggle }: { value: string; onChange: (v: string) => void; show: boolean; onToggle?: () => void }) {
  return (
    <div style={{ position: 'relative' }}>
      <input className="input" type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder="••••••••••"/>
      {onToggle && (
        <button type="button" onClick={onToggle} className="btn ghost sm icon-only" style={{ position: 'absolute', right: 4, top: 3 }}>
          <Icon name={show ? 'eyeOff' : 'eye'} size={13} color="var(--ink-3)"/>
        </button>
      )}
    </div>
  );
}

export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^a-zA-Z0-9]/.test(value)) score++;
  const labels = ['Weak','Weak','Fair','Good','Strong','Excellent'];
  const colors = ['var(--rose)','var(--rose)','var(--amber)','var(--amber)','var(--green)','var(--green)'];
  return (
    <div className="row gap-8" style={{ marginTop: 6 }}>
      <div className="row gap-2 grow">
        {[0,1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[score] : 'var(--border)' }}/>)}
      </div>
      <span style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>{labels[score]}</span>
    </div>
  );
}

export function ToggleRow({ label, sub, on: initial }: { label: string; sub?: string; on: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="row between" style={{ padding: '12px 0', borderBottom: '1px solid var(--divider)' }}>
      <div className="col">
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {sub && <div className="text-xs text-dim">{sub}</div>}
      </div>
      <button type="button" onClick={() => setOn(!on)} style={{ width: 34, height: 20, borderRadius: 999, background: on ? 'var(--navy)' : 'var(--border-strong)', position: 'relative', transition: 'background 160ms' }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 16, height: 16, borderRadius: 999, background: '#fff', transition: 'left 160ms', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}/>
      </button>
    </div>
  );
}

export function RowMenu({ items, trigger }: { items: { label: string; icon: string; action: () => void; danger?: boolean }[]; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn ghost sm icon-only" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
        {trigger || <Icon name="more" size={14}/>}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-lg)', width: 190, zIndex: 20, padding: 4 }}>
          {items.map((item, i) => (
            <button key={i} onClick={() => { item.action(); setOpen(false); }} className="row gap-8" style={{ padding: '7px 10px', width: '100%', textAlign: 'left', borderRadius: 4, fontSize: 13, color: item.danger ? 'var(--rose)' : 'inherit' }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
              <Icon name={item.icon} size={13}/>{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
