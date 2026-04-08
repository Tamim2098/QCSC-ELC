import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// ── Auto-redirect success screen ──
const SuccessScreen = ({ onNavigate }) => {
  const [count, setCount] = React.useState(3);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => {
        if (c <= 1) { clearInterval(interval); onNavigate(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(250,247,240,0.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, animation: 'fadeInFull 0.5s ease', padding: '24px',
    }}>
      <style>{`
        @keyframes fadeInFull { from{opacity:0} to{opacity:1} }
        @keyframes popIn { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
      `}</style>
      <div style={{
        width: 76, height: 76, borderRadius: '50%',
        background: 'rgba(201,168,76,0.10)',
        border: '1px solid rgba(201,168,76,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'popIn 0.5s 0.3s both',
        boxShadow: '0 0 0 10px rgba(201,168,76,0.05), 0 8px 36px rgba(201,168,76,0.15)',
      }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <p style={{ fontFamily: "'Cinzel',serif", fontSize: 'clamp(1.3rem,5vw,1.8rem)', fontWeight: 700, color: '#1a1a1a', marginTop: 22, textAlign: 'center', letterSpacing: '0.04em' }}>
        Application Submitted!
      </p>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: 'rgba(0,0,0,0.40)', marginTop: 8, textAlign: 'center', maxWidth: 300, lineHeight: 1.85, fontWeight: 300 }}>
        Thank you for applying to ELC.<br />We'll review your application and get back to you shortly.
      </p>

      <div style={{ marginTop: 28, position: 'relative', width: 56, height: 56 }}>
        <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(201,168,76,0.12)" strokeWidth="3" />
          <circle cx="28" cy="28" r="24" fill="none" stroke="#C9A84C" strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 24}`}
            strokeDashoffset={`${2 * Math.PI * 24 * (1 - count / 3)}`}
            style={{ transition: 'stroke-dashoffset 0.9s linear' }}
          />
        </svg>
        <span style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 700, color: '#C9A84C',
        }}>{count}</span>
      </div>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(0,0,0,0.25)', marginTop: 10, letterSpacing: '0.1em' }}>
        Redirecting to Home...
      </p>
    </div>
  );
};

const Join = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState('');
  const [gender, setGender] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const photoInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name_en: '', father: '', mother: '',
    dob: '', addr_present: '', addr_perm: '',
    class: '', section: '', roll: '',
    email: '', phone: '', guardian: '', relation: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const h = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = "dac4g49sw";
    const uploadPreset = "elc_image";
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
    const json = await res.json();
    if (json.secure_url) return json.secure_url;
    throw new Error(json.error?.message || 'Upload failed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gender) { alert('Please select your gender.'); return; }
    setLoading(true);
    try {
      let photoUrl = '';
      if (photoFile) {
        try { photoUrl = await uploadToCloudinary(photoFile); }
        catch (imgErr) {
          console.error('Photo upload failed:', imgErr);
          const proceed = window.confirm('Photo upload failed. Submit without photo?');
          if (!proceed) { setLoading(false); return; }
        }
      }
      await addDoc(collection(db, 'elc_applications'), {
        ...formData, gender, photoUrl,
        status: 'pending',
        submittedAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      alert('Submission failed: ' + (err.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateHome = () => {
    navigate('/', { replace: true });
    setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }), 50);
  };

  const inp = (name) => ({
    width: '100%',
    background: focused === name ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.7)',
    border: `1px solid ${focused === name ? 'rgba(201,168,76,0.60)' : 'rgba(0,0,0,0.10)'}`,
    borderRadius: '11px',
    padding: '13px 16px',
    color: '#1a1a1a',
    fontSize: '13.5px',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    transition: 'border .25s, background .25s, box-shadow .25s',
    boxShadow: focused === name ? '0 0 0 4px rgba(201,168,76,0.10)' : '0 1px 3px rgba(0,0,0,0.05)',
    letterSpacing: '.01em',
    caretColor: '#C9A84C',
  });

  const lbl = {
    display: 'block',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '9px', fontWeight: 600,
    letterSpacing: '.22em', textTransform: 'uppercase',
    color: 'rgba(0,0,0,0.35)', marginBottom: '7px',
  };

  const rev = (d) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.8s cubic-bezier(.16,1,.3,1) ${d}s, transform 0.8s cubic-bezier(.16,1,.3,1) ${d}s`,
  });

  const sectionHeader = (title) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', marginTop: '4px' }}>
      <span style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fontWeight: 600,
        letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.75)',
        whiteSpace: 'nowrap',
      }}>{title}</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(201,168,76,0.15)' }} />
    </div>
  );

  const dividerLine = (
    <div style={{ height: '1px', background: 'rgba(201,168,76,0.10)', margin: '24px 0' }} />
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .join-root *, .join-root *::before, .join-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .join-root input::placeholder,
        .join-root textarea::placeholder { color: rgba(0,0,0,0.25); font-style: italic; }

        .join-root input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 40px #f9f6ef inset !important;
          -webkit-text-fill-color: #1a1a1a !important;
        }

        @keyframes orbFloat {
          0%, 100% { transform: translate(0,0); }
          50% { transform: translate(18px, 24px); }
        }
        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.5); }
          60% { box-shadow: 0 0 0 6px rgba(201,168,76,0); }
        }
        .gold-pulse {
          width: 5px; height: 5px; border-radius: 50%; background: #C9A84C;
          animation: goldPulse 2.4s infinite; flex-shrink: 0;
        }

        .scanlines {
          position: absolute; inset: 0; pointer-events: none; z-index: 5; border-radius: inherit;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(201,168,76,0.012) 2px, rgba(201,168,76,0.012) 4px);
        }

        .photo-upload-box {
          position: absolute; top: 18px; right: 20px;
          width: 68px; height: 86px;
          border: 1px dashed rgba(201,168,76,0.40);
          border-radius: 8px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: rgba(201,168,76,0.04);
          gap: 5px; cursor: pointer; overflow: hidden;
          transition: border-color 0.2s, background 0.2s;
          z-index: 6;
        }
        .photo-upload-box:hover { border-color: rgba(201,168,76,0.70); background: rgba(201,168,76,0.08); }

        .gender-opt {
          display: flex; align-items: center; gap: 7px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(0,0,0,0.45);
          padding: 10px 14px; border-radius: 11px;
          border: 1px solid rgba(0,0,0,0.10); background: rgba(255,255,255,0.7);
          transition: all 0.22s; flex: 1; justify-content: center; min-width: 80px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .gender-opt.selected {
          border-color: rgba(201,168,76,0.60);
          background: rgba(201,168,76,0.07);
          color: #C9A84C;
        }
        .gender-dot {
          width: 14px; height: 14px; border-radius: 50%;
          border: 1.5px solid rgba(0,0,0,0.18);
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.2s; flex-shrink: 0;
        }
        .gender-opt.selected .gender-dot { border-color: #C9A84C; }
        .gender-dot-fill {
          width: 7px; height: 7px; border-radius: 50%; background: #C9A84C;
          transform: scale(0); transition: transform 0.2s;
        }
        .gender-opt.selected .gender-dot-fill { transform: scale(1); }

        .j-submit {
          width: 100%; background: #C9A84C;
          border: none; border-radius: 11px; padding: 15px;
          font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700;
          letter-spacing: .18em; text-transform: uppercase; color: #ffffff;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 9px;
          transition: all .3s cubic-bezier(.16,1,.3,1);
          box-shadow: 0 4px 20px rgba(201,168,76,0.35);
          margin-top: 4px;
        }
        .j-submit:hover:not(:disabled) {
          background: #b8923d; transform: translateY(-3px);
          box-shadow: 0 10px 32px rgba(201,168,76,0.45);
        }
        .j-submit:active:not(:disabled) { transform: translateY(0); }
        .j-submit:disabled { background: #e0d9cb; color: rgba(0,0,0,0.25); box-shadow: none; cursor: not-allowed; }

        @keyframes spin360 { to { transform: rotate(360deg); } }
        .c-spin {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          animation: spin360 .65s linear infinite; flex-shrink: 0;
        }

        .r2 { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media(min-width: 480px) { .r2 { grid-template-columns: 1fr 1fr; } }
        .r3 { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media(min-width: 480px) { .r3 { grid-template-columns: 1fr 1fr 1fr; } }
      `}</style>

      {submitted && <SuccessScreen onNavigate={handleNavigateHome} />}

      <div className="join-root" style={{
        minHeight: '100svh',
        background: '#faf7f0',
        padding: 'clamp(100px,12vw,130px) clamp(16px,4vw,56px) clamp(80px,10vw,120px)',
        position: 'relative', overflow: 'hidden',
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Mouse radial glow */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(201,168,76,0.07), transparent 55%)`,
          transition: 'background .08s',
        }} />

        {/* Grid bg */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(201,168,76,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.07) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, black, transparent)',
        }} />

        {/* Vignette */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(240,234,218,0.45) 100%)' }} />

        {/* Orbs */}
        {[
          { w: 380, h: 380, color: 'rgba(201,168,76,0.12)', top: '-100px', left: '-60px', dur: '13s', dir: 'normal' },
          { w: 280, h: 280, color: 'rgba(201,168,76,0.09)', bottom: '5%', right: '-50px', dur: '17s', dir: 'reverse' },
          { w: 200, h: 200, color: 'rgba(201,168,76,0.07)', top: '45%', left: '48%', dur: '10s', dir: 'normal', delay: '4s' },
        ].map((o, i) => (
          <div key={i} style={{
            position: 'absolute', width: o.w, height: o.h, borderRadius: '50%',
            background: `radial-gradient(circle,${o.color} 0%,transparent 70%)`,
            top: o.top, left: o.left, bottom: o.bottom, right: o.right,
            filter: 'blur(60px)', zIndex: 1, pointerEvents: 'none',
            animation: `orbFloat ${o.dur} ease-in-out infinite ${o.delay || '0s'}`,
            animationDirection: o.dir,
          }} />
        ))}

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '780px', margin: '0 auto' }}>

          {/* ── Header ── */}
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px', ...rev(0.06) }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                border: '1px solid rgba(201,168,76,0.40)',
                borderRadius: '100px', padding: '7px 18px',
                fontSize: '9.5px', fontWeight: 600,
                letterSpacing: '.22em', textTransform: 'uppercase', color: '#C9A84C',
                background: 'rgba(201,168,76,0.08)',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <span className="gold-pulse" />
                Membership Application
              </span>
            </div>

            <div style={rev(0.16)}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '10px', color: 'rgba(201,168,76,0.65)',
                letterSpacing: '.28em', textTransform: 'uppercase',
                marginBottom: '10px', fontWeight: 600,
              }}>
                Sapper College · English Language Club
              </p>
              <h2 style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(2.4rem,7vw,4.5rem)',
                fontWeight: 700, color: '#1a1a1a', lineHeight: 1.1, letterSpacing: '0.04em',
              }}>
                Join{' '}
                <em style={{ color: '#C9A84C', fontStyle: 'normal' }}>ELC</em>
              </h2>
            </div>

            <p style={{ fontSize: '14px', color: 'rgba(0,0,0,0.38)', fontWeight: 300, letterSpacing: '.06em', marginTop: '14px', ...rev(0.28) }}>
              Fill out the form below to become a member
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '220px', margin: '20px auto 0', ...rev(0.28) }}>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.35))' }} />
              <div style={{ width: '6px', height: '6px', background: '#C9A84C', transform: 'rotate(45deg)', flexShrink: 0 }} />
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.35))' }} />
            </div>
          </div>

          {/* ── Main Card ── */}
          <div style={{ ...rev(0.38) }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid rgba(201,168,76,0.20)',
              borderRadius: '24px', position: 'relative', overflow: 'hidden',
              boxShadow: '0 8px 48px rgba(201,168,76,0.10), 0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <div className="scanlines" />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,transparent 8%,#C9A84C 50%,transparent 92%)', zIndex: 3, opacity: 0.6 }} />
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '2px', background: 'linear-gradient(180deg,rgba(201,168,76,0.5) 0%,transparent 55%)', zIndex: 3 }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '44px', height: '44px', borderRight: '1px solid rgba(201,168,76,0.20)', borderBottom: '1px solid rgba(201,168,76,0.20)', borderRadius: '0 0 22px 0', zIndex: 3 }} />

              {/* ── Letterhead ── */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(252,249,242,0.95) 0%, rgba(248,244,234,0.98) 100%)',
                borderBottom: '1px solid rgba(201,168,76,0.15)',
                padding: 'clamp(22px,4vw,32px) clamp(20px,4vw,32px)',
                textAlign: 'center', position: 'relative', overflow: 'visible',
              }}>
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit',
                  background: 'repeating-linear-gradient(-55deg, transparent, transparent 30px, rgba(201,168,76,0.025) 30px, rgba(201,168,76,0.025) 31px)',
                }} />

                {/* Photo upload */}
                <input type="file" accept="image/*" ref={photoInputRef} onChange={handlePhotoChange} style={{ display: 'none' }} />
                <div className="photo-upload-box" onClick={() => photoInputRef.current.click()} title="Click to upload photo">
                  {photo ? (
                    <img src={photo} alt="passport" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5">
                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '8px', color: 'rgba(201,168,76,0.55)', letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.4 }}>
                        Upload{'\n'}Photo
                      </span>
                    </>
                  )}
                </div>

                {/* ELC Emblem */}
                <div style={{
                  width: 58, height: 58, borderRadius: '50%',
                  background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.30)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px', position: 'relative', zIndex: 1,
                  boxShadow: '0 4px 20px rgba(201,168,76,0.15)',
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '11px', color: 'rgba(201,168,76,0.65)', letterSpacing: '0.08em', marginBottom: '5px', fontStyle: 'italic', position: 'relative', zIndex: 1 }}>
                  "Speak with Confidence, Write with Clarity"
                </p>
                <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 'clamp(0.88rem,3.5vw,1.15rem)', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3, marginBottom: '3px', position: 'relative', zIndex: 1, letterSpacing: '0.04em' }}>
                  Qadirabad Cantonment Sapper College
                </h3>
                <p style={{ fontFamily: "'Cinzel',serif", fontSize: 'clamp(0.78rem,3vw,0.95rem)', fontWeight: 600, color: '#C9A84C', lineHeight: 1.3, marginBottom: '3px', position: 'relative', zIndex: 1 }}>
                  English Language Club
                </p>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: 'rgba(0,0,0,0.38)', position: 'relative', zIndex: 1 }}>
                  Qadirabad Cantonment, Natore
                </p>
                <div style={{
                  display: 'inline-block',
                  border: '1px solid rgba(201,168,76,0.35)', borderRadius: '5px',
                  padding: '5px 18px', marginTop: '12px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '10px', fontWeight: 600,
                  letterSpacing: '.18em', textTransform: 'uppercase',
                  color: 'rgba(201,168,76,0.75)', position: 'relative', zIndex: 1,
                }}>
                  Membership Application Form
                </div>
              </div>

              {/* ── Form Body ── */}
              <form onSubmit={handleSubmit} style={{ padding: 'clamp(24px,4vw,36px) clamp(22px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: '0' }}>

                {sectionHeader('Full Name')}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '24px' }}>
                  <label style={lbl}>Full Name in English</label>
                  <input type="text" name="name_en" required placeholder="Full Name in English"
                    value={formData.name_en} onChange={handleChange}
                    style={inp('name_en')} onFocus={() => setFocused('name_en')} onBlur={() => setFocused('')} />
                </div>

                {dividerLine}

                {sectionHeader("Parents' Names")}
                <div className="r2" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <label style={lbl}>Father's Name</label>
                    <input type="text" name="father" required placeholder="Father's full name"
                      value={formData.father} onChange={handleChange}
                      style={inp('father')} onFocus={() => setFocused('father')} onBlur={() => setFocused('')} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <label style={lbl}>Mother's Name</label>
                    <input type="text" name="mother" required placeholder="Mother's full name"
                      value={formData.mother} onChange={handleChange}
                      style={inp('mother')} onFocus={() => setFocused('mother')} onBlur={() => setFocused('')} />
                  </div>
                </div>

                {dividerLine}

                {sectionHeader('Date of Birth & Gender')}
                <div className="r2" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <label style={lbl}>Date of Birth</label>
                    <input type="date" name="dob" required
                      value={formData.dob} onChange={handleChange}
                      style={{ ...inp('dob'), colorScheme: 'light' }}
                      onFocus={() => setFocused('dob')} onBlur={() => setFocused('')} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <label style={lbl}>Gender</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {['Male', 'Female'].map((g) => (
                        <div key={g} className={`gender-opt${gender === g ? ' selected' : ''}`} onClick={() => setGender(g)}>
                          <div className="gender-dot"><div className="gender-dot-fill" /></div>
                          <span>{g}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {dividerLine}

                {sectionHeader('Address')}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <label style={lbl}>Present Address</label>
                    <input type="text" name="addr_present" required placeholder="Village, Upazila, District"
                      value={formData.addr_present} onChange={handleChange}
                      style={inp('addr_present')} onFocus={() => setFocused('addr_present')} onBlur={() => setFocused('')} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <label style={lbl}>Permanent Address</label>
                    <input type="text" name="addr_perm" required placeholder="Village, Upazila, District"
                      value={formData.addr_perm} onChange={handleChange}
                      style={inp('addr_perm')} onFocus={() => setFocused('addr_perm')} onBlur={() => setFocused('')} />
                  </div>
                </div>

                {dividerLine}

                {sectionHeader('Institution & Class Details')}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <label style={lbl}>Institution</label>
                    <input type="text" name="institution"
                      defaultValue="Qadirabad Cantonment Sapper College"
                      onChange={handleChange}
                      style={inp('institution')} onFocus={() => setFocused('institution')} onBlur={() => setFocused('')} />
                  </div>
                  <div className="r3">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      <label style={lbl}>Class</label>
                      <input type="text" name="class" required placeholder="e.g. Class XI"
                        value={formData.class} onChange={handleChange}
                        style={inp('class')} onFocus={() => setFocused('class')} onBlur={() => setFocused('')} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      <label style={lbl}>Section</label>
                      <input type="text" name="section" required placeholder="e.g. Science-A"
                        value={formData.section} onChange={handleChange}
                        style={inp('section')} onFocus={() => setFocused('section')} onBlur={() => setFocused('')} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      <label style={lbl}>Roll No.</label>
                      <input type="text" name="roll" required placeholder="Roll No."
                        value={formData.roll} onChange={handleChange}
                        style={inp('roll')} onFocus={() => setFocused('roll')} onBlur={() => setFocused('')} />
                    </div>
                  </div>
                </div>

                {dividerLine}

                {sectionHeader('Contact Information')}
                <div className="r2" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <label style={lbl}>Email</label>
                    <input type="email" name="email" placeholder="your@email.com"
                      value={formData.email} onChange={handleChange}
                      style={inp('email')} onFocus={() => setFocused('email')} onBlur={() => setFocused('')} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <label style={lbl}>Phone</label>
                    <input type="tel" name="phone" required placeholder="01XXXXXXXXX"
                      value={formData.phone} onChange={handleChange}
                      style={inp('phone')} onFocus={() => setFocused('phone')} onBlur={() => setFocused('')} />
                  </div>
                </div>

                {dividerLine}

                {sectionHeader('Guardian Consent')}
                <div style={{
                  background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)',
                  borderRadius: '14px', padding: '18px 20px', marginBottom: '24px',
                }}>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '12.5px', color: 'rgba(0,0,0,0.45)', lineHeight: 1.85, marginBottom: '16px' }}>
                    I hereby grant permission for my son/daughter to join the English Language Club at Qadirabad Cantonment Sapper College.
                  </p>
                  <div className="r2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      <label style={lbl}>Guardian's Name</label>
                      <input type="text" name="guardian" required placeholder="Guardian's full name"
                        value={formData.guardian} onChange={handleChange}
                        style={inp('guardian')} onFocus={() => setFocused('guardian')} onBlur={() => setFocused('')} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      <label style={lbl}>Relation</label>
                      <input type="text" name="relation" required placeholder="e.g. Father / Mother"
                        value={formData.relation} onChange={handleChange}
                        style={inp('relation')} onFocus={() => setFocused('relation')} onBlur={() => setFocused('')} />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button type="submit" className="j-submit" disabled={loading}>
                  {loading
                    ? <><span className="c-spin" /> Submitting...</>
                    : <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M22 2L15 22l-4-9-9-4 20-7z" fill="currentColor" />
                        </svg>
                        Submit Application
                      </>
                  }
                </button>

              </form>
            </div>
          </div>

          {/* Footer note */}
          <p style={{ textAlign: 'center', marginTop: '20px', fontFamily: "'DM Sans',sans-serif", fontSize: '12px', color: 'rgba(0,0,0,0.28)', letterSpacing: '.06em', ...rev(0.52) }}>
            After submission, our team will review your application within 24–48 hours.
          </p>

        </div>
      </div>
    </>
  );
};

export default Join;