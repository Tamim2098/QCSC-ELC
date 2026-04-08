import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import {
  collection, doc, deleteDoc, setDoc,
  updateDoc, onSnapshot, query, orderBy, addDoc, serverTimestamp
} from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  LayoutDashboard, Users, MessageSquare, Images,
  LogOut, Menu, X, Upload, Check, Trash2, Eye,
  Bell, Clock, CheckCircle2, Mail, Phone,
  Loader2, ChevronUp, Image, Pencil
} from 'lucide-react';

// ── Cloudinary upload ──
const uploadToCloudinary = async (file) => {
  const cloudName = "dac4g49sw";
  const uploadPreset = "rover_image";
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
  const json = await res.json();
  if (json.secure_url) return json.secure_url;
  throw new Error(json.error?.message || 'Cloudinary upload failed');
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
};

const IcCommittee = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const NAV = [
  { id: 'overview',      label: 'Overview',      Icon: LayoutDashboard },
  { id: 'registrations', label: 'Registrations', Icon: Users },
  { id: 'messages',      label: 'Messages',      Icon: MessageSquare },
  { id: 'gallery',       label: 'Gallery',       Icon: Images },
  { id: 'Members',       label: 'Members',       Icon: IcCommittee },
];

const GOLD        = '#C9A84C';
const GOLD_FAINT  = 'rgba(201,168,76,0.10)';
const GOLD_BORDER = 'rgba(201,168,76,0.25)';
const BG_ROOT     = '#faf7f0';
const BG_CARD     = '#ffffff';
const TEXT_DARK   = '#1a1a1a';
const TEXT_MUTED  = '#6b7280';
const BORDER      = 'rgba(201,168,76,0.18)';

const StatusBadge = ({ v }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
    padding: '3px 10px', borderRadius: 100,
    background: v === 'approved' ? 'rgba(34,197,94,0.08)' : GOLD_FAINT,
    border: `1px solid ${v === 'approved' ? 'rgba(34,197,94,0.30)' : GOLD_BORDER}`,
    color: v === 'approved' ? '#16a34a' : GOLD,
  }}>
    {v === 'approved' ? <CheckCircle2 size={9}/> : <Clock size={9}/>}
    {v === 'approved' ? 'Approved' : 'Pending'}
  </span>
);

const Avatar = ({ url, name = '?', size = 44, onClick }) => {
  const ini = name.split(' ').filter(Boolean).map(w => w[0]).slice(0,2).join('').toUpperCase();
  return url
    ? <img src={url} alt={name} onClick={onClick} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GOLD_BORDER}`, flexShrink: 0, cursor: onClick ? 'pointer' : 'default', transition: 'border-color 0.2s, transform 0.2s' }}
        onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.transform = 'scale(1.05)'; }}}
        onMouseLeave={e => { e.currentTarget.style.borderColor = GOLD_BORDER; e.currentTarget.style.transform = 'scale(1)'; }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05))`, border: `2px solid ${GOLD_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cinzel',serif", fontSize: size * 0.3, fontWeight: 700, color: GOLD, flexShrink: 0 }}>{ini}</div>;
};

const Btn = ({ children, onClick, color = GOLD, disabled = false }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: `${color}10`, border: `1px solid ${color}40`,
    borderRadius: 8, padding: '6px 13px', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600, color,
    display: 'inline-flex', alignItems: 'center', gap: 5,
    transition: 'all 0.2s', whiteSpace: 'nowrap', opacity: disabled ? 0.5 : 1,
  }}
    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = `${color}20`; e.currentTarget.style.borderColor = `${color}70`; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${color}20`; }}}
    onMouseLeave={e => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >{children}</button>
);

const SectionHdr = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 4 }}>
    <div style={{ width: 3, height: 14, background: GOLD, borderRadius: 2 }} />
    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: TEXT_MUTED, whiteSpace: 'nowrap' }}>{children}</span>
    <div style={{ flex: 1, height: 1, background: GOLD_BORDER }} />
  </div>
);

const SectionPill = ({ children }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: GOLD_FAINT, border: `1px solid ${GOLD_BORDER}`, borderRadius: 100, padding: '5px 14px', fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, animation: 'jpulse 2s infinite', display: 'inline-block' }} />
    {children}
  </span>
);

const PageTitle = ({ pill, title, accent }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', marginBottom: 12 }}>
      <SectionPill>{pill}</SectionPill>
    </div>
    <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 700, color: TEXT_DARK, lineHeight: 1.15, margin: 0 }}>
      {title}{accent && <> <span style={{ color: GOLD }}>{accent}</span></>}
    </h1>
  </div>
);

const Card = ({ children, style = {}, hover = true }) => (
  <div
    style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 16, boxShadow: '0 2px 12px rgba(201,168,76,0.06)', transition: 'box-shadow 0.25s, border-color 0.25s', ...style }}
    onMouseEnter={hover ? e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,168,76,0.12)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'; } : undefined}
    onMouseLeave={hover ? e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(201,168,76,0.06)'; e.currentTarget.style.borderColor = BORDER; } : undefined}
  >{children}</div>
);

const Load = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <Loader2 size={26} color={GOLD} style={{ animation: 'adSpin 0.8s linear infinite' }} />
      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: TEXT_MUTED, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Loading…</span>
    </div>
  </div>
);

const None = ({ t }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px', color: TEXT_MUTED, fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
    <div style={{ width: 48, height: 48, borderRadius: '50%', background: GOLD_FAINT, border: `1px solid ${GOLD_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 20 }}>—</div>
    {t}
  </div>
);

const Lightbox = ({ url, name, onClose }) => {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(26,26,26,0.92)', backdropFilter: 'blur(18px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeInFull 0.25s ease' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, width: 40, height: 40, borderRadius: '50%', background: GOLD_FAINT, border: `1px solid ${GOLD_BORDER}`, color: GOLD, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.2)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = GOLD_FAINT; e.currentTarget.style.transform = 'scale(1)'; }}
      ><X size={16}/></button>
      <img src={url} alt={name} onClick={e => e.stopPropagation()} style={{ maxWidth: '88vw', maxHeight: '78vh', objectFit: 'contain', borderRadius: 16, border: `1px solid ${GOLD_BORDER}`, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}/>
      {name && <p style={{ marginTop: 16, fontFamily: "'Cinzel',serif", fontSize: 12, color: 'rgba(250,247,240,0.6)', letterSpacing: '0.06em' }}>{name}</p>}
    </div>
  );
};

const TypeBadge = ({ type }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
    padding: '3px 10px', borderRadius: 100,
    background: type === 'president' ? GOLD_FAINT : 'rgba(99,102,241,0.08)',
    border: `1px solid ${type === 'president' ? GOLD_BORDER : 'rgba(99,102,241,0.25)'}`,
    color: type === 'president' ? GOLD : '#6366f1',
  }}>
    {type === 'president' ? '★ Leader' : 'Member'}
  </span>
);

const Toast = ({ toasts }) => (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9998, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: BG_CARD,
        border: `1px solid ${t.type === 'success' ? 'rgba(34,197,94,0.30)' : t.type === 'error' ? 'rgba(239,68,68,0.30)' : GOLD_BORDER}`,
        borderLeft: `3px solid ${t.type === 'success' ? '#16a34a' : t.type === 'error' ? '#dc2626' : GOLD}`,
        borderRadius: 12, padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(201,168,76,0.12)',
        animation: 'toastIn 0.3s cubic-bezier(.34,1.56,.64,1)',
        pointerEvents: 'auto', minWidth: 220, maxWidth: 320,
      }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>
          {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
        </span>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: TEXT_DARK, margin: 0, lineHeight: 1.4 }}>{t.msg}</p>
      </div>
    ))}
  </div>
);

const ConfirmDialog = ({ open, msg, onOk, onCancel }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9990, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,26,26,0.55)', backdropFilter: 'blur(8px)', animation: 'fadeInFull 0.18s ease' }}>
      <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '28px 28px 22px', maxWidth: 380, width: '90%', boxShadow: '0 24px 64px rgba(201,168,76,0.15)', animation: 'slideDown 0.22s ease', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(239,68,68,0.5),transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trash2 size={16} color="#dc2626"/>
          </div>
          <p style={{ fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>Confirm Delete</p>
        </div>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: TEXT_MUTED, margin: '0 0 22px', lineHeight: 1.65 }}>{msg}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 20px', borderRadius: 9, background: 'transparent', border: `1px solid ${BORDER}`, color: TEXT_MUTED, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.background = GOLD_FAINT; e.currentTarget.style.color = TEXT_DARK; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEXT_MUTED; }}
          >Cancel</button>
          <button onClick={onOk} style={{ padding: '9px 20px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.30)', color: '#dc2626', fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 6 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.50)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)'; }}
          ><Trash2 size={12}/> Delete</button>
        </div>
      </div>
    </div>
  );
};

const inp = (focused, name) => ({
  width: '100%',
  background: focused === name ? 'rgba(201,168,76,0.04)' : '#faf7f0',
  border: `1px solid ${focused === name ? 'rgba(201,168,76,0.55)' : BORDER}`,
  borderRadius: 10, padding: '11px 14px',
  color: TEXT_DARK, fontSize: 13,
  fontFamily: "'DM Sans',sans-serif", outline: 'none',
  transition: 'border 0.22s, background 0.22s, box-shadow 0.22s',
  boxShadow: focused === name ? '0 0 0 3px rgba(201,168,76,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
  caretColor: GOLD,
});

// ══ COMMITTEE PANEL ══════════════════════════════════════════
const CommitteePanel = ({
  committee, ld, isMobile,
  newMember, setNewMember,
  memberPhoto, setMemberPhoto,
  memberUploading, handleAddMember, memberFileRef,
  del, setLb,
  session, sessionDraft, setSessionDraft, sessionSaving, handleSaveSession,
  handleEditMember,
  toastFn,
}) => {
  const [editMember, setEditMember] = useState(null);
  const [editDraft, setEditDraft]   = useState({});
  const [editPhoto, setEditPhoto]   = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [focused, setFocused]       = useState('');
  const editFileRef = useRef(null);

  const openEdit = m => {
    setEditMember(m);
    setEditDraft({ name: m.name || '', role: m.role || '', facebook: m.facebook || '', type: m.type || 'member' });
    setEditPhoto(null);
  };
  const closeEdit = () => { setEditMember(null); setEditPhoto(null); };
  const saveEdit  = async () => {
    if (!editDraft.name.trim()) return;
    setEditSaving(true);
    await handleEditMember(editMember.id, editDraft, editPhoto);
    setEditSaving(false);
    closeEdit();
  };

  return (
    <div>
      <PageTitle pill="Management" title="Manage" accent="Members"/>

      {/* Session Year */}
      <Card style={{ padding: '18px 22px', marginBottom: 18, position: 'relative', overflow: 'hidden' }} hover={false}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(99,102,241,0.45),transparent)' }} />
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: TEXT_MUTED, letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 10px' }}>Session Year</p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={sessionDraft}
            onChange={e => setSessionDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveSession(); }}
            placeholder="e.g. 2025 – 2026"
            style={{ flex: 1, minWidth: 140, ...inp(focused, 'session') }}
            onFocus={() => setFocused('session')} onBlur={() => setFocused('')}
          />
          <button onClick={handleSaveSession} disabled={sessionSaving || sessionDraft.trim() === session}
            style={{ background: (sessionSaving||sessionDraft.trim()===session)?'rgba(99,102,241,0.06)':'rgba(99,102,241,0.10)', border:'1px solid rgba(99,102,241,0.30)', borderRadius:9, padding:'10px 18px', cursor:(sessionSaving||sessionDraft.trim()===session)?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600, color:'#6366f1', display:'inline-flex', alignItems:'center', gap:6, transition:'all 0.2s', opacity:(sessionSaving||sessionDraft.trim()===session)?0.5:1 }}
            onMouseEnter={e => { if (!sessionSaving && sessionDraft.trim()!==session) e.currentTarget.style.background='rgba(99,102,241,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background=(sessionSaving||sessionDraft.trim()===session)?'rgba(99,102,241,0.06)':'rgba(99,102,241,0.10)'; }}
          >
            {sessionSaving ? <><Loader2 size={12} style={{ animation:'adSpin 0.8s linear infinite' }}/> Saving…</> : <><Check size={12}/> Save</>}
          </button>
          {session && sessionDraft.trim()===session && (
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:'#16a34a', display:'flex', alignItems:'center', gap:5 }}>
              <CheckCircle2 size={11}/> Live: <strong style={{ fontFamily:"'Cinzel',serif", marginLeft:3 }}>{session}</strong>
            </span>
          )}
        </div>
      </Card>

      {/* Add New Member */}
      <Card style={{ padding: '22px 24px', marginBottom: 28, position: 'relative', overflow: 'hidden' }} hover={false}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${GOLD}80,transparent)` }} />
        <SectionHdr>Add New Member</SectionHdr>
        <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
            <input type="text" placeholder="Full Name *" required value={newMember.name}
              onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))}
              style={inp(focused, 'nm_name')}
              onFocus={() => setFocused('nm_name')} onBlur={() => setFocused('')}
            />
            <div style={{ position: 'relative' }}>
              <input type="text"
                placeholder={newMember.type === 'president' ? 'Role (Optional for Leader)' : 'Role (e.g. Secretary) *'}
                value={newMember.role}
                onChange={e => setNewMember(p => ({ ...p, role: e.target.value }))}
                style={{ ...inp(focused, 'nm_role'), paddingRight: newMember.type === 'president' ? 82 : 14 }}
                onFocus={() => setFocused('nm_role')} onBlur={() => setFocused('')}
              />
              {newMember.type === 'president' && (
                <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontFamily:"'DM Sans',sans-serif", fontSize:8.5, fontWeight:600, letterSpacing:'0.10em', textTransform:'uppercase', color:GOLD, background:GOLD_FAINT, border:`1px solid ${GOLD_BORDER}`, borderRadius:4, padding:'2px 7px', pointerEvents:'none' }}>Optional</span>
              )}
            </div>
            <input type="url" placeholder="Facebook URL (Optional)" value={newMember.facebook}
              onChange={e => setNewMember(p => ({ ...p, facebook: e.target.value }))}
              style={inp(focused, 'nm_fb')}
              onFocus={() => setFocused('nm_fb')} onBlur={() => setFocused('')}
            />
            <select value={newMember.type} onChange={e => setNewMember(p => ({ ...p, type: e.target.value }))}
              style={{ ...inp(focused, 'nm_type'), cursor: 'pointer', background: '#faf7f0' }}
              onFocus={() => setFocused('nm_type')} onBlur={() => setFocused('')}
            >
              <option value="president">President / Leader</option>
              <option value="member">General Member</option>
            </select>
          </div>

          {/* Photo Upload — mobile-friendly */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <input type="file" accept="image/*" hidden ref={memberFileRef}
              onChange={e => { if (e.target.files[0]) setMemberPhoto(e.target.files[0]); }}
            />
            <button type="button" onClick={() => memberFileRef.current?.click()}
              style={{ background: memberPhoto ? 'rgba(34,197,94,0.07)' : GOLD_FAINT, border: `1px solid ${memberPhoto ? 'rgba(34,197,94,0.30)' : GOLD_BORDER}`, borderRadius: 9, padding: '10px 16px', cursor: 'pointer', color: memberPhoto ? '#16a34a' : GOLD, fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', maxWidth: '100%' }}
              onMouseEnter={e => { e.currentTarget.style.background = memberPhoto ? 'rgba(34,197,94,0.14)' : 'rgba(201,168,76,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = memberPhoto ? 'rgba(34,197,94,0.07)' : GOLD_FAINT; }}
            >
              {memberPhoto ? <CheckCircle2 size={13}/> : <Upload size={13}/>}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                {memberPhoto ? memberPhoto.name : 'Choose Photo (Optional)'}
              </span>
            </button>
            {memberPhoto && (
              <button type="button" onClick={() => { setMemberPhoto(null); if (memberFileRef.current) memberFileRef.current.value = ''; }}
                style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 8, padding: '7px 11px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}
              >
                <X size={11}/> Remove
              </button>
            )}
          </div>

          <div>
            <button type="submit" disabled={memberUploading}
              style={{ background: memberUploading ? GOLD_FAINT : GOLD, border: memberUploading ? `1px solid ${GOLD_BORDER}` : 'none', borderRadius: 10, padding: '13px 28px', cursor: memberUploading ? 'not-allowed' : 'pointer', fontFamily: "'Cinzel',serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: memberUploading ? GOLD : '#ffffff', display: 'inline-flex', alignItems: 'center', gap: 7, opacity: memberUploading ? 0.7 : 1, boxShadow: memberUploading ? 'none' : '0 4px 20px rgba(201,168,76,0.35)', transition: 'all 0.2s' }}
              onMouseEnter={e => { if (!memberUploading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,168,76,0.45)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = memberUploading ? 'none' : '0 4px 20px rgba(201,168,76,0.35)'; }}
            >
              {memberUploading ? <><Loader2 size={13} style={{ animation: 'adSpin 0.8s linear infinite' }}/> Adding…</> : <><Users size={13}/> Add Member</>}
            </button>
          </div>
        </form>
      </Card>

      {/* Member List */}
      <SectionHdr>Current Members ({committee.length})</SectionHdr>
      {ld.c ? <Load/> : committee.length === 0 ? <None t="No members added yet."/> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {committee.map(member => (
            <Card key={member.id} style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flexShrink: 0 }}>
                  <Avatar
                    url={member.photo}
                    name={member.name || '?'}
                    size={50}
                    onClick={member.photo ? () => setLb({ url: member.photo, name: member.name }) : undefined}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <p style={{ fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 700, color: TEXT_DARK, margin: 0, lineHeight: 1.2 }}>
                      {member.name}
                    </p>
                    <TypeBadge type={member.type}/>
                  </div>
                  {member.role && (
                    <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11.5, color: TEXT_MUTED, margin: 0 }}>
                      {member.role}
                    </p>
                  )}
                  {member.facebook && (
                    <a href={member.facebook} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: GOLD, textDecoration: 'none', marginTop: 3, display: 'inline-block' }}>
                      Facebook ↗
                    </a>
                  )}
                  {/* Mobile action buttons inline under info */}
                  <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
                    <Btn onClick={() => openEdit(member)} color="#6366f1"><Pencil size={12}/> Edit</Btn>
                    <Btn onClick={() => del('committee', member.id)} color="#dc2626"><Trash2 size={12}/> Delete</Btn>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editMember && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9990, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,26,26,0.6)', backdropFilter: 'blur(10px)', animation: 'fadeInFull 0.18s ease', padding: 16 }}>
          <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 22, padding: '26px 24px', width: '100%', maxWidth: 430, boxShadow: '0 32px 80px rgba(201,168,76,0.18)', animation: 'slideDown 0.22s ease', position: 'relative', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: '22px 22px 0 0', background: 'linear-gradient(90deg,transparent,rgba(99,102,241,0.55),transparent)' }}/>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pencil size={15} color="#6366f1"/>
                </div>
                <p style={{ fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>Edit Member</p>
              </div>
              <button onClick={closeEdit} style={{ width: 30, height: 30, borderRadius: 8, background: GOLD_FAINT, border: `1px solid ${GOLD_BORDER}`, cursor: 'pointer', color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = GOLD_FAINT; }}
              ><X size={13}/></button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, padding: '12px 14px', background: '#faf7f0', border: `1px solid ${BORDER}`, borderRadius: 12 }}>
              <Avatar url={editPhoto ? URL.createObjectURL(editPhoto) : editMember.photo} name={editDraft.name || '?'} size={52}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: TEXT_MUTED, letterSpacing: '0.10em', textTransform: 'uppercase', margin: '0 0 7px' }}>Profile Photo</p>
                <button type="button" onClick={() => editFileRef.current?.click()}
                  style={{ background: GOLD_FAINT, border: `1px solid ${GOLD_BORDER}`, borderRadius: 8, padding: '7px 13px', cursor: 'pointer', color: GOLD, fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = GOLD_FAINT}
                >
                  <Upload size={11}/>
                  <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {editPhoto ? editPhoto.name : 'Change Photo'}
                  </span>
                </button>
              </div>
              <input type="file" accept="image/*" hidden ref={editFileRef} onChange={e => setEditPhoto(e.target.files[0])}/>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'name', ph: 'Full Name *', type: 'text' },
                { key: 'role', ph: editDraft.type === 'president' ? 'Role (Optional)' : 'Role (e.g. Secretary)', type: 'text' },
                { key: 'facebook', ph: 'Facebook URL (Optional)', type: 'url' },
              ].map(f => (
                <input key={f.key} type={f.type} placeholder={f.ph} value={editDraft[f.key] || ''}
                  onChange={e => setEditDraft(p => ({ ...p, [f.key]: e.target.value }))}
                  style={inp(focused, `ed_${f.key}`)}
                  onFocus={() => setFocused(`ed_${f.key}`)} onBlur={() => setFocused('')}
                />
              ))}
              <select value={editDraft.type} onChange={e => setEditDraft(p => ({ ...p, type: e.target.value }))}
                style={{ ...inp(focused, 'ed_type'), cursor: 'pointer' }}
                onFocus={() => setFocused('ed_type')} onBlur={() => setFocused('')}
              >
                <option value="president">President / Leader</option>
                <option value="member">General Member</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={closeEdit} style={{ padding: '9px 18px', borderRadius: 9, background: 'transparent', border: `1px solid ${BORDER}`, color: TEXT_MUTED, fontFamily: "'DM Sans',sans-serif", fontSize: 12, cursor: 'pointer', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.background = GOLD_FAINT; e.currentTarget.style.color = TEXT_DARK; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEXT_MUTED; }}
              >Cancel</button>
              <button onClick={saveEdit} disabled={editSaving || !editDraft.name.trim()}
                style={{ padding: '9px 20px', borderRadius: 9, background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.28)', color: '#6366f1', fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: editSaving ? 'not-allowed' : 'pointer', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 6, opacity: editSaving ? 0.6 : 1 }}
                onMouseEnter={e => { if (!editSaving) e.currentTarget.style.background = 'rgba(99,102,241,0.20)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.10)'; }}
              >
                {editSaving ? <><Loader2 size={12} style={{ animation: 'adSpin 0.8s linear infinite' }}/> Saving…</> : <><Check size={12}/> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ══ MAIN ══════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [tab, setTab]       = useState('overview');
  const [drawer, setDrawer] = useState(false);
  const [regs, setRegs]     = useState([]);
  const [msgs, setMsgs]     = useState([]);
  const [gals, setGals]     = useState([]);
  const [committee, setCommittee] = useState([]);
  const [newMember, setNewMember] = useState({ name: '', role: '', facebook: '', type: 'member' });
  const [memberPhoto, setMemberPhoto]         = useState(null);
  const [memberUploading, setMemberUploading] = useState(false);
  const [session, setSession]         = useState('2025 – 2026');
  const [sessionDraft, setSessionDraft] = useState('');
  const [sessionSaving, setSessionSaving] = useState(false);
  const [ld, setLd]     = useState({ r: true, m: true, g: true, c: true });
  const [uploading, setUp]  = useState(false);
  const [exp, setExp]       = useState(null);
  const [lb, setLb]         = useState(null);
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const fileRef       = useRef(null);
  const memberFileRef = useRef(null);

  const toast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  const confirmDel = (msg, onOk) => setConfirm({ msg, onOk });

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, 'elc_applications'), orderBy('submittedAt', 'desc')), s => { setRegs(s.docs.map(d => ({ id: d.id, ...d.data() }))); setLd(p => ({ ...p, r: false })); });
    const u2 = onSnapshot(query(collection(db, 'messages'),  orderBy('createdAt',  'desc')), s => { setMsgs(s.docs.map(d => ({ id: d.id, ...d.data() }))); setLd(p => ({ ...p, m: false })); });
    const u3 = onSnapshot(query(collection(db, 'gallery'),   orderBy('uploadedAt', 'desc')), s => { setGals(s.docs.map(d => ({ id: d.id, ...d.data() }))); setLd(p => ({ ...p, g: false })); });
    const u4 = onSnapshot(query(collection(db, 'committee'), orderBy('createdAt',  'asc')),  s => { setCommittee(s.docs.map(d => ({ id: d.id, ...d.data() }))); setLd(p => ({ ...p, c: false })); });
    const u5 = onSnapshot(doc(db, 'settings', 'committee'), s => { if (s.exists() && s.data().session) { setSession(s.data().session); setSessionDraft(s.data().session); } });
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, []);

  const logout  = async () => { await signOut(auth); navigate('/login'); };
  const del     = (col, id) => confirmDel('This item will be permanently deleted. Are you sure?', async () => { await deleteDoc(doc(db, col, id)); toast('Item deleted successfully.'); });
  const approve = id => updateDoc(doc(db, 'elc_applications', id), { status: 'approved' });
  const markR   = id => updateDoc(doc(db, 'messages', id), { read: true });
  const go      = id => { setTab(id); setDrawer(false); };

  const handleUpload = async e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUp(true);
    let ok = 0, fail = 0;
    for (const f of files) {
      try { const url = await uploadToCloudinary(f); await addDoc(collection(db, 'gallery'), { url, uploadedAt: serverTimestamp() }); ok++; }
      catch (err) { console.error(err); fail++; }
    }
    setUp(false); e.target.value = '';
    if (ok)   toast(`${ok} photo(s) uploaded successfully!`, 'success');
    if (fail) toast(`${fail} photo(s) failed to upload.`, 'error');
  };

  // ── FIXED: handleAddMember ──
  const handleAddMember = async e => {
    e.preventDefault();
    if (!newMember.name.trim()) { toast('Please enter a name.', 'error'); return; }
    if (newMember.type !== 'president' && !newMember.role.trim()) { toast('Please enter a role.', 'error'); return; }
    setMemberUploading(true);
    try {
      let photoUrl = null;
      if (memberPhoto) {
        try { photoUrl = await uploadToCloudinary(memberPhoto); }
        catch (imgErr) { console.error('Photo upload failed:', imgErr); toast('Photo upload failed, adding without photo.', 'error'); }
      }
      const memberData = {
        name:      newMember.name.trim(),
        role:      newMember.role.trim(),
        facebook:  newMember.facebook.trim(),
        type:      newMember.type,
        photo:     photoUrl,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'committee'), memberData);
      toast('Member added successfully!', 'success');
      setNewMember({ name: '', role: '', facebook: '', type: 'member' });
      setMemberPhoto(null);
      if (memberFileRef.current) memberFileRef.current.value = '';
    } catch (error) {
      console.error('Add member error:', error);
      toast('Error adding member: ' + error.message, 'error');
    } finally {
      setMemberUploading(false);
    }
  };

  const handleSaveSession = async () => {
    if (!sessionDraft.trim()) return;
    setSessionSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'committee'), { session: sessionDraft.trim() }, { merge: true });
      toast('Session year saved!', 'success');
    } catch (e) { toast('Error: ' + e.message, 'error'); }
    finally { setSessionSaving(false); }
  };

  const handleEditMember = async (id, draft, newPhoto) => {
    try {
      const existing = committee.find(m => m.id === id);
      let photoUrl = existing?.photo || null;
      if (newPhoto) photoUrl = await uploadToCloudinary(newPhoto);
      await updateDoc(doc(db, 'committee', id), {
        name:     draft.name.trim(),
        role:     draft.role.trim(),
        facebook: draft.facebook.trim(),
        type:     draft.type,
        ...(newPhoto ? { photo: photoUrl } : {}),
      });
      toast('Member updated successfully!', 'success');
    } catch (e) { toast('Error updating: ' + e.message, 'error'); }
  };

  const pending = regs.filter(r => r.status !== 'approved').length;
  const unread  = msgs.filter(m => !m.read).length;

  // ── OVERVIEW ──
  const Overview = () => (
    <div>
      <PageTitle pill="Control Center" title="Dashboard" accent="Overview"/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Total Regs',  value: regs.length,                              Icon: Users,        color: GOLD },
          { label: 'Pending',     value: pending,                                   Icon: Clock,        color: '#f59e0b' },
          { label: 'Approved',    value: regs.filter(r => r.status==='approved').length, Icon: CheckCircle2, color: '#16a34a' },
          { label: 'Messages',    value: msgs.length,                               Icon: MessageSquare, color: '#6366f1' },
          { label: 'Unread',      value: unread,                                    Icon: Bell,         color: '#ec4899' },
          { label: 'Photos',      value: gals.length,                               Icon: Image,        color: '#8b5cf6' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 16px', position: 'relative', overflow: 'hidden', transition: 'all 0.25s', cursor: 'default', boxShadow: '0 2px 8px rgba(201,168,76,0.06)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${color}18`; e.currentTarget.style.borderColor = `${color}50`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(201,168,76,0.06)'; e.currentTarget.style.borderColor = BORDER; }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,transparent,${color}80,transparent)` }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: TEXT_MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>{label}</p>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}10`, border: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color}/>
              </div>
            </div>
            <p style={{ fontFamily: "'Cinzel',serif", fontSize: 34, fontWeight: 700, color, lineHeight: 1, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      <SectionHdr>Recent Registrations</SectionHdr>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {regs.slice(0, 6).map(r => (
          <Card key={r.id} style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 13 }}>
            <Avatar url={r.photoUrl} name={r.name_en || '?'} size={42} onClick={r.photoUrl ? () => setLb({ url: r.photoUrl, name: r.name_en }) : undefined}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13.5, fontWeight: 500, color: TEXT_DARK, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name_en}</p>
              {r.institution && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: TEXT_MUTED, margin: '2px 0 0' }}>{r.institution}</p>}
            </div>
            <StatusBadge v={r.status}/>
          </Card>
        ))}
        {!ld.r && regs.length === 0 && <None t="No registrations yet."/>}
      </div>
    </div>
  );

  // ── REGISTRATIONS ──
  const Registrations = () => (
    <div>
      <PageTitle pill="Management" title="Registrations"/>
      {ld.r ? <Load/> : regs.length === 0 ? <None t="No registrations yet."/> : regs.map(r => (
        <Card key={r.id} style={{ marginBottom: 10, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Avatar url={r.photoUrl} name={r.name_en || '?'} size={52} onClick={r.photoUrl ? () => setLb({ url: r.photoUrl, name: r.name_en }) : undefined}/>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                  <p style={{ fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>{r.name_en}</p>
                  <StatusBadge v={r.status}/>
                </div>
                {r.institution && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: TEXT_MUTED, margin: 0 }}>{r.institution}{r.class ? ` · Class ${r.class}` : ''}</p>}
              </div>
              <div style={{ display: 'flex', gap: 7, flexShrink: 0, flexWrap: 'wrap' }}>
                <Btn onClick={() => setExp(exp === r.id ? null : r.id)}>
                  {exp === r.id ? <><ChevronUp size={12}/> Close</> : <><Eye size={12}/> Details</>}
                </Btn>
                {r.status !== 'approved' && <Btn onClick={() => approve(r.id)} color="#16a34a"><Check size={12}/> Approve</Btn>}
                <Btn onClick={() => del('elc_applications', r.id)} color="#dc2626"><Trash2 size={12}/> Delete</Btn>
              </div>
            </div>
          </div>

          {exp === r.id && (
            <div style={{ borderTop: `1px solid ${BORDER}`, padding: '20px 20px', background: '#faf7f0', animation: 'slideDown 0.25s ease' }}>
              {[
                { sec: 'Full Name',             fields: [['Name', r.name_en]] },
                { sec: "Parents' Names",         fields: [["Father's Name", r.father], ["Mother's Name", r.mother]] },
                { sec: 'Date of Birth & Gender', fields: [['Date of Birth', r.dob], ['Gender', r.gender]] },
                { sec: 'Address',                fields: [['Present Address', r.addr_present], ['Permanent Address', r.addr_perm]] },
                { sec: 'Institution & Class',    fields: [['Institution', r.institution], ['Class', r.class], ['Section', r.section], ['Roll No.', r.roll]] },
                { sec: 'Contact Information',    fields: [['Email', r.email], ['Phone', r.phone]] },
                { sec: 'Guardian Consent',       fields: [['Guardian Name', r.guardian], ['Relation', r.relation]] },
              ].map(({ sec, fields }) => {
                const valid = fields.filter(([, v]) => v);
                if (!valid.length) return null;
                return (
                  <div key={sec} style={{ marginBottom: 18 }}>
                    <SectionHdr>{sec}</SectionHdr>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                      {valid.map(([k, v]) => (
                        <div key={k} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '10px 13px' }}>
                          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 8.5, color: TEXT_MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px', fontWeight: 600 }}>{k}</p>
                          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: TEXT_DARK, margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ))}
    </div>
  );

  // ── MESSAGES ──
  const Messages = () => (
    <div>
      <PageTitle pill="Inbox" title="Messages"/>
      {ld.m ? <Load/> : msgs.length === 0 ? <None t="No messages yet."/> : msgs.map(m => (
        <div key={m.id} style={{
          background: BG_CARD,
          border: `1px solid ${m.read ? BORDER : 'rgba(99,102,241,0.35)'}`,
          borderLeft: `3px solid ${m.read ? GOLD_BORDER : '#6366f1'}`,
          borderRadius: 14, marginBottom: 10, padding: '16px 20px',
          boxShadow: m.read ? '0 2px 8px rgba(201,168,76,0.05)' : '0 4px 16px rgba(99,102,241,0.08)',
          transition: 'all 0.2s',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5, flexWrap: 'wrap' }}>
                <p style={{ fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 700, color: TEXT_DARK, margin: 0 }}>{m.name}</p>
                {!m.read && (
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 8.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 100, padding: '2px 9px', color: '#6366f1', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Bell size={8}/> New
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {m.phone && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: TEXT_MUTED, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={10}/> {m.phone}</p>}
                {m.email && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: TEXT_MUTED, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={10}/> {m.email}</p>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
              {!m.read && <Btn onClick={() => markR(m.id)} color="#6366f1"><Eye size={12}/> Mark Read</Btn>}
              <Btn onClick={() => del('messages', m.id)} color="#dc2626"><Trash2 size={12}/> Delete</Btn>
            </div>
          </div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: TEXT_MUTED, background: '#faf7f0', border: `1px solid ${BORDER}`, padding: '12px 15px', borderRadius: 10, margin: 0, lineHeight: 1.75, borderLeft: `2px solid ${GOLD_BORDER}` }}>{m.message}</p>
        </div>
      ))}
    </div>
  );

  // ── GALLERY ──
  const GalleryGrid = React.memo(({ gals, onOpen, onDel }) => {
    const [visibleIds, setVisibleIds] = useState(new Set());
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 24;
    const loaderRef = useRef(null);
    const shown = gals.slice(0, page * PAGE_SIZE);

    useEffect(() => {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) setVisibleIds(p => new Set([...p, e.target.dataset.id])); });
      }, { threshold: 0.05, rootMargin: '100px' });
      document.querySelectorAll('.gal-item').forEach(el => obs.observe(el));
      return () => obs.disconnect();
    }, [shown.length]);

    useEffect(() => {
      if (!loaderRef.current) return;
      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && shown.length < gals.length) setPage(p => p + 1);
      }, { threshold: 1 });
      obs.observe(loaderRef.current);
      return () => obs.disconnect();
    }, [shown.length, gals.length]);

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10 }}>
          {shown.map((g, idx) => (
            <div key={g.id} className="gal-card gal-item" data-id={g.id}
              style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '1/1', border: `1px solid ${BORDER}`, cursor: 'pointer', background: '#f3ede0', transition: 'all 0.25s', opacity: visibleIds.has(g.id) ? 1 : 0, transform: visibleIds.has(g.id) ? 'translateY(0)' : 'translateY(10px)', transitionDelay: `${(idx % 8) * 0.03}s`, boxShadow: '0 2px 8px rgba(201,168,76,0.06)' }}
              onClick={() => onOpen(g)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(201,168,76,0.18)`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = visibleIds.has(g.id) ? 'translateY(0)' : 'translateY(10px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(201,168,76,0.06)'; }}
            >
              {visibleIds.has(g.id) ? (
                <img src={g.url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#f3ede0' }}/>
              )}
              <button className="gal-del" onClick={e => { e.stopPropagation(); onDel(g.id); }}
                style={{ position: 'absolute', top: 7, right: 7, width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.90)', border: '1px solid rgba(220,38,38,0.30)', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', backdropFilter: 'blur(6px)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.10)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.60)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.90)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.30)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <Trash2 size={11}/>
              </button>
            </div>
          ))}
        </div>
        {shown.length < gals.length && (
          <div ref={loaderRef} style={{ display: 'flex', justifyContent: 'center', padding: '20px 0', gap: 6, alignItems: 'center' }}>
            <Loader2 size={18} color={GOLD} style={{ animation: 'adSpin 0.8s linear infinite' }}/>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: TEXT_MUTED }}>Loading more…</span>
          </div>
        )}
        {shown.length >= gals.length && gals.length > PAGE_SIZE && (
          <p style={{ textAlign: 'center', fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: TEXT_MUTED, letterSpacing: '0.1em', padding: '12px 0' }}>All {gals.length} photos loaded</p>
        )}
      </>
    );
  });

  const Gallery = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
        <PageTitle pill="Media" title="Photo Gallery"/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          {gals.length > 0 && (
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: TEXT_MUTED, letterSpacing: '0.10em', background: GOLD_FAINT, border: `1px solid ${GOLD_BORDER}`, borderRadius: 7, padding: '5px 11px', fontWeight: 500 }}>
              {gals.length} photo{gals.length !== 1 ? 's' : ''}
            </span>
          )}
          <button onClick={() => fileRef.current.click()} disabled={uploading}
            style={{ background: uploading ? GOLD_FAINT : GOLD, border: uploading ? `1px solid ${GOLD_BORDER}` : 'none', borderRadius: 10, padding: '11px 20px', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: "'Cinzel',serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: uploading ? GOLD : '#ffffff', display: 'flex', alignItems: 'center', gap: 7, opacity: uploading ? 0.7 : 1, boxShadow: uploading ? 'none' : '0 4px 20px rgba(201,168,76,0.35)', transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0 }}
            onMouseEnter={e => { if (!uploading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(201,168,76,0.45)'; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = uploading ? 'none' : '0 4px 20px rgba(201,168,76,0.35)'; }}
          >
            {uploading ? <><Loader2 size={13} style={{ animation: 'adSpin 0.8s linear infinite' }}/> Uploading…</> : <><Upload size={13}/> Upload Photo</>}
          </button>
        </div>
        <input type="file" multiple accept="image/*" hidden ref={fileRef} onChange={handleUpload}/>
      </div>
      {ld.g ? <Load/> : gals.length === 0
        ? <None t="No photos yet — click Upload Photo to get started."/>
        : <GalleryGrid gals={gals} onOpen={g => setLb({ url: g.url, name: 'Gallery Photo' })} onDel={id => del('gallery', id)}/>
      }
    </div>
  );

  const CONTENT = {
    overview:      <Overview/>,
    registrations: <Registrations/>,
    messages:      <Messages/>,
    gallery:       <Gallery/>,
    Members: <CommitteePanel
      committee={committee} ld={ld} isMobile={isMobile}
      newMember={newMember} setNewMember={setNewMember}
      memberPhoto={memberPhoto} setMemberPhoto={setMemberPhoto}
      memberUploading={memberUploading} handleAddMember={handleAddMember}
      memberFileRef={memberFileRef} del={del} setLb={setLb}
      session={session} sessionDraft={sessionDraft} setSessionDraft={setSessionDraft}
      sessionSaving={sessionSaving} handleSaveSession={handleSaveSession}
      handleEditMember={handleEditMember}
      toastFn={toast}
    />,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${BG_ROOT}; }

        @keyframes adSpin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn    { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeInFull{ from { opacity:0; } to { opacity:1; } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes jpulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.65)} }
        @keyframes toastIn   { from{opacity:0;transform:translateX(20px) scale(0.95)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes orbFloat  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(16px,22px)} }

        .page-in { animation: fadeIn 0.28s ease; }
        .ad-sc::-webkit-scrollbar       { width: 5px; }
        .ad-sc::-webkit-scrollbar-track { background: transparent; }
        .ad-sc::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.20); border-radius: 10px; }
        .nav-btn { transition: all 0.18s !important; }
        .nav-btn:hover { background: rgba(201,168,76,0.08) !important; }
        input::placeholder { color: rgba(107,114,128,0.55); font-style: italic; }
        select option { background: #faf7f0; color: #1a1a1a; }

        .ad-bg-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: linear-gradient(rgba(201,168,76,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.07) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black, transparent);
        }
        .ad-bg-vignette {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(240,234,218,0.4) 100%);
        }
        .ad-orb-1 { position:fixed; width:380px; height:380px; border-radius:50%; pointer-events:none; z-index:0; background:radial-gradient(circle,rgba(201,168,76,0.10) 0%,transparent 70%); top:-100px; right:-60px; filter:blur(65px); animation:orbFloat 13s ease-in-out infinite; }
        .ad-orb-2 { position:fixed; width:280px; height:280px; border-radius:50%; pointer-events:none; z-index:0; background:radial-gradient(circle,rgba(201,168,76,0.08) 0%,transparent 70%); bottom:5%; left:-50px; filter:blur(60px); animation:orbFloat 17s ease-in-out infinite reverse; }
        .ad-orb-3 { position:fixed; width:200px; height:200px; border-radius:50%; pointer-events:none; z-index:0; background:radial-gradient(circle,rgba(201,168,76,0.06) 0%,transparent 70%); top:45%; left:48%; filter:blur(55px); animation:orbFloat 10s ease-in-out infinite; animation-delay:4s; }
      `}</style>

      <div className="ad-bg-grid"/>
      <div className="ad-bg-vignette"/>
      <div className="ad-orb-1"/>
      <div className="ad-orb-2"/>
      <div className="ad-orb-3"/>

      <div style={{ display: 'flex', height: '100dvh', background: BG_ROOT, overflow: 'hidden', fontFamily: "'DM Sans',sans-serif", position: 'relative' }}>

        {/* Mobile Header */}
        {isMobile && (
          <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300, height: 58, background: 'rgba(250,247,240,0.97)', backdropFilter: 'blur(18px)', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', boxShadow: '0 2px 12px rgba(201,168,76,0.08)' }}>
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: '0.08em' }}>Admin Panel</span>
            <button onClick={() => setDrawer(d => !d)} style={{ width: 38, height: 38, borderRadius: 10, background: GOLD_FAINT, border: `1px solid ${GOLD_BORDER}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, transition: 'all 0.2s' }}>
              {drawer ? <X size={16}/> : <Menu size={16}/>}
            </button>
          </header>
        )}

        {isMobile && drawer && <div onClick={() => setDrawer(false)} style={{ position: 'fixed', top: 58, left: 0, right: 0, bottom: 0, zIndex: 198, background: 'rgba(26,26,26,0.40)', backdropFilter: 'blur(4px)' }}/>}

        {/* Sidebar */}
        <aside style={{
          width: isMobile ? '72vw' : 230, maxWidth: isMobile ? 248 : 230, flexShrink: 0,
          height: isMobile ? 'calc(100dvh - 58px)' : '100dvh',
          background: 'rgba(250,247,240,0.97)',
          borderRight: `1px solid ${BORDER}`,
          display: 'flex', flexDirection: 'column',
          position: isMobile ? 'fixed' : 'relative',
          left: isMobile ? (drawer ? 0 : '-80vw') : 0,
          top: isMobile ? 58 : 0, zIndex: 199,
          transition: 'left 0.3s cubic-bezier(.4,0,.2,1)',
          boxShadow: isMobile && drawer ? '8px 0 40px rgba(201,168,76,0.12)' : '2px 0 16px rgba(201,168,76,0.06)',
          backdropFilter: 'blur(18px)',
        }}>
          {!isMobile && (
            <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${BORDER}`, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg,rgba(201,168,76,0.06) 0%,rgba(250,247,240,0.9) 100%)` }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${GOLD}80,transparent)` }}/>
              <p style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: '0.08em', margin: 0 }}>Admin Panel</p>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, color: TEXT_MUTED, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '2px 0 0', fontStyle: 'italic' }}>Control Center</p>
            </div>
          )}

          <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: TEXT_MUTED, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '4px 10px 10px', margin: 0, fontWeight: 600 }}>Navigation</p>
            {NAV.map(n => {
              const active = tab === n.id;
              const badge  = n.id === 'registrations' ? pending : n.id === 'messages' ? unread : 0;
              return (
                <button key={n.id} className="nav-btn" onClick={() => go(n.id)} style={{
                  width: '100%',
                  background: active ? GOLD_FAINT : 'transparent',
                  border: `1px solid ${active ? GOLD_BORDER : 'transparent'}`,
                  borderRadius: 11, padding: '11px 13px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  color: active ? GOLD : TEXT_MUTED,
                  textAlign: 'left', position: 'relative',
                }}>
                  {active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: GOLD, borderRadius: '0 2px 2px 0' }}/>}
                  <n.Icon size={15} color={active ? GOLD : TEXT_MUTED}/>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: active ? 600 : 400, flex: 1 }}>{n.label}</span>
                  {badge > 0 && (
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9.5, fontWeight: 600, background: n.id === 'messages' ? 'rgba(99,102,241,0.10)' : GOLD_FAINT, border: `1px solid ${n.id === 'messages' ? 'rgba(99,102,241,0.28)' : GOLD_BORDER}`, color: n.id === 'messages' ? '#6366f1' : GOLD, borderRadius: 100, padding: '1px 8px', minWidth: 20, textAlign: 'center' }}>{badge}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div style={{ padding: '12px 10px', borderTop: `1px solid ${BORDER}` }}>
            <button onClick={logout} style={{ width: '100%', background: 'transparent', border: '1px solid rgba(220,38,38,0.18)', borderRadius: 11, padding: '11px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, justifyContent: 'center', color: 'rgba(220,38,38,0.55)', fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, transition: 'all 0.2s', letterSpacing: '0.04em' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.35)'; e.currentTarget.style.color = '#dc2626'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.18)'; e.currentTarget.style.color = 'rgba(220,38,38,0.55)'; }}
            >
              <LogOut size={14}/> Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ad-sc" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '72px 14px 36px' : '32px 30px', background: 'transparent', position: 'relative', zIndex: 1 }}>
          <div className="page-in" key={tab} style={{ maxWidth: 940, margin: '0 auto' }}>
            {CONTENT[tab]}
          </div>
        </main>

        {lb && <Lightbox url={lb.url} name={lb.name} onClose={() => setLb(null)}/>}
        <Toast toasts={toasts}/>
        <ConfirmDialog
          open={!!confirm}
          msg={confirm?.msg}
          onOk={() => { confirm?.onOk(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      </div>
    </>
  );
}