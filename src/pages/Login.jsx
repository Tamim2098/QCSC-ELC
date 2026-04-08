import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const GOLD        = '#C9A84C';
const GOLD_FAINT  = 'rgba(201,168,76,0.10)';
const GOLD_BORDER = 'rgba(201,168,76,0.25)';
const BG_ROOT     = '#faf7f0';
const BG_CARD     = '#ffffff';
const TEXT_DARK   = '#1a1a1a';
const TEXT_MUTED  = '#6b7280';
const BORDER      = 'rgba(201,168,76,0.18)';

const Login = () => {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [focused, setFocused]     = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showPass, setShowPass]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin-dashboard');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inp = (name) => ({
    width: '100%',
    background: focused === name ? 'rgba(201,168,76,0.04)' : BG_ROOT,
    border: `1px solid ${focused === name ? 'rgba(201,168,76,0.55)' : error ? 'rgba(220,38,38,0.25)' : BORDER}`,
    borderRadius: 10,
    padding: '11px 14px',
    color: TEXT_DARK,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    transition: 'border 0.22s, background 0.22s, box-shadow 0.22s',
    boxShadow: focused === name ? '0 0 0 3px rgba(201,168,76,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
    caretColor: GOLD,
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .lr *, .lr *::before, .lr *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .lr input::placeholder { color: rgba(107,114,128,0.55); font-style: italic; }
        .lr input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 40px ${BG_ROOT} inset !important;
          -webkit-text-fill-color: ${TEXT_DARK} !important;
        }

        .lr-page {
          min-height: 100svh;
          background: ${BG_ROOT};
          display: flex; align-items: center; justify-content: center;
          padding: 24px 16px;
          position: relative; overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        .lr-bg-grid {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.07) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent);
        }
        .lr-bg-vig {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background: radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(240,234,218,0.45) 100%);
        }
        .lr-orb-1 { position:absolute; width:380px; height:380px; border-radius:50%; pointer-events:none; z-index:0; background:radial-gradient(circle,rgba(201,168,76,0.11) 0%,transparent 70%); top:-100px; left:-60px; filter:blur(60px); animation:lrOrb 13s ease-in-out infinite; }
        .lr-orb-2 { position:absolute; width:280px; height:280px; border-radius:50%; pointer-events:none; z-index:0; background:radial-gradient(circle,rgba(201,168,76,0.08) 0%,transparent 70%); bottom:5%; right:-50px; filter:blur(60px); animation:lrOrb 17s ease-in-out infinite reverse; }
        .lr-orb-3 { position:absolute; width:200px; height:200px; border-radius:50%; pointer-events:none; z-index:0; background:radial-gradient(circle,rgba(201,168,76,0.06) 0%,transparent 70%); top:45%; left:48%; filter:blur(55px); animation:lrOrb 10s ease-in-out infinite; animation-delay:4s; }
        @keyframes lrOrb { 0%,100%{transform:translate(0,0)} 50%{transform:translate(16px,22px)} }

        .lr-rv { opacity:0; transform:translateY(18px); transition:opacity .7s ease,transform .7s ease; }
        .lr-rv.in { opacity:1; transform:translateY(0); }
        .d1{transition-delay:.06s} .d2{transition-delay:.16s} .d3{transition-delay:.26s} .d4{transition-delay:.36s} .d5{transition-delay:.46s}

        .lr-card {
          width:100%; max-width:420px;
          background: ${BG_CARD};
          border: 1px solid ${BORDER};
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 8px 48px rgba(201,168,76,0.10), 0 2px 12px rgba(0,0,0,0.06);
          position: relative; z-index: 10;
        }
        .lr-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:2px;
          background: linear-gradient(90deg, transparent 8%, ${GOLD} 50%, transparent 92%);
          opacity:.65; z-index:3;
        }
        .lr-scanlines {
          position:absolute; inset:0; pointer-events:none; z-index:2; border-radius:inherit;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(201,168,76,0.010) 2px, rgba(201,168,76,0.010) 4px);
        }
        .lr-corner {
          position:absolute; bottom:0; right:0; width:40px; height:40px;
          border-right:1px solid ${GOLD_BORDER}; border-bottom:1px solid ${GOLD_BORDER};
          border-radius:0 0 20px 0; pointer-events:none; z-index:3;
        }

        .lr-hdr {
          background: linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(250,247,240,0.9) 100%);
          border-bottom: 1px solid ${BORDER};
          padding: 28px 28px 22px;
          text-align: center;
          position: relative; overflow: hidden;
        }
        .lr-hdr::before {
          content:''; position:absolute; inset:0;
          background: repeating-linear-gradient(-55deg, transparent, transparent 30px, rgba(201,168,76,0.018) 30px, rgba(201,168,76,0.018) 31px);
        }

        .lr-pill {
          display:inline-flex; align-items:center; gap:8px;
          background:${GOLD_FAINT}; border:1px solid ${GOLD_BORDER};
          border-radius:100px; padding:5px 14px;
          font-family:'DM Sans',sans-serif;
          font-size:9.5px; font-weight:600; letter-spacing:.22em; text-transform:uppercase; color:${GOLD};
          margin-bottom:14px; position:relative; z-index:1;
        }
        .lr-dot {
          width:5px; height:5px; border-radius:50%; background:${GOLD};
          animation:lrPulse 2.4s infinite; display:inline-block;
        }
        @keyframes lrPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.65)} }

        .lr-body { padding: 28px; }

        .lr-flabel {
          display:block; font-family:'DM Sans',sans-serif;
          font-size:9px; font-weight:600; letter-spacing:.22em; text-transform:uppercase;
          color:${TEXT_MUTED}; margin-bottom:7px;
        }

        .pass-wrap { position:relative; }
        .pass-tog {
          position:absolute; right:12px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; padding:4px;
          color:${TEXT_MUTED}; transition:color .2s;
        }
        .pass-tog:hover { color:${GOLD}; }

        .lr-err {
          display:flex; align-items:center; gap:8px;
          background:rgba(220,38,38,0.05); border:1px solid rgba(220,38,38,0.22);
          border-radius:10px; padding:10px 14px;
          animation:errShake .4s ease;
        }
        @keyframes errShake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-5px)} 40%{transform:translateX(5px)}
          60%{transform:translateX(-3px)} 80%{transform:translateX(3px)}
        }

        .lr-btn {
          width:100%; background:${GOLD};
          border:none; border-radius:10px; padding:14px;
          font-family:'Cinzel',serif; font-size:11px; font-weight:700;
          letter-spacing:.18em; text-transform:uppercase; color:#fff;
          cursor:pointer; transition:background .25s,transform .2s,box-shadow .25s;
          box-shadow:0 4px 20px rgba(201,168,76,.35);
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .lr-btn:hover:not(:disabled) { background:#b8923d; transform:translateY(-2px); box-shadow:0 8px 28px rgba(201,168,76,.45); }
        .lr-btn:active:not(:disabled) { transform:translateY(0); }
        .lr-btn:disabled { opacity:.65; cursor:not-allowed; }

        .lr-spin {
          width:14px; height:14px; border-radius:50%;
          border:2px solid rgba(255,255,255,.30); border-top-color:#fff;
          animation:lrSpin .7s linear infinite;
        }
        @keyframes lrSpin { to{transform:rotate(360deg)} }

        .lr-div { display:flex; align-items:center; gap:12px; margin:22px 0; }
        .lr-divl { flex:1; height:1px; background:${GOLD_BORDER}; }

        .lr-back {
          display:inline-flex; align-items:center; gap:6px;
          font-family:'DM Sans',sans-serif; font-size:12px;
          color:${TEXT_MUTED}; cursor:pointer; background:none; border:none;
          letter-spacing:.06em; transition:color .2s;
        }
        .lr-back:hover { color:${GOLD}; }
      `}</style>

      <div className="lr">
        <div className="lr-page">
          <div className="lr-bg-grid" />
          <div className="lr-bg-vig" />
          <div className="lr-orb-1" />
          <div className="lr-orb-2" />
          <div className="lr-orb-3" />

          <div className={`lr-card lr-rv d1 ${isVisible ? 'in' : ''}`}>
            <div className="lr-scanlines" />
            <div className="lr-corner" />

            {/* Header */}
            <div className="lr-hdr">
              <div style={{ position:'absolute', top:0, left:0, bottom:0, width:2, background:`linear-gradient(180deg,rgba(201,168,76,0.5) 0%,transparent 55%)`, zIndex:3 }} />

              <div className={`lr-rv d1 ${isVisible ? 'in' : ''}`}>
                <div className="lr-pill">
                  <span className="lr-dot" />
                  Admin Access
                </div>
              </div>

              <div className={`lr-rv d2 ${isVisible ? 'in' : ''}`}>
                <h2 style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(1.1rem,4vw,1.55rem)', fontWeight:700, color:TEXT_DARK, lineHeight:1.2, position:'relative', zIndex:1, marginBottom:5, letterSpacing:'.04em' }}>
                  English Language <span style={{ color:GOLD }}>Club</span>
                </h2>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:TEXT_MUTED, letterSpacing:'.14em', textTransform:'uppercase', position:'relative', zIndex:1, fontWeight:500 }}>
                  Qadirabad Cantonment Sapper College
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="lr-body">

              {error && (
                <div className="lr-err" style={{ marginBottom:20 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(220,38,38,0.75)" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#dc2626' }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Email */}
                <div className={`lr-rv d3 ${isVisible ? 'in' : ''}`}>
                  <label className="lr-flabel">Email Address</label>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={focused==='email' ? GOLD : TEXT_MUTED} strokeWidth="1.8" strokeLinecap="round" style={{ transition:'stroke .2s' }}>
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <input
                      type="email" required
                      placeholder="admin@elcsc.edu.bd"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{ ...inp('email'), paddingLeft:40 }}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused('')}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className={`lr-rv d4 ${isVisible ? 'in' : ''}`}>
                  <label className="lr-flabel">Password</label>
                  <div className="pass-wrap">
                    <div style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', zIndex:1 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={focused==='password' ? GOLD : TEXT_MUTED} strokeWidth="1.8" strokeLinecap="round" style={{ transition:'stroke .2s' }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                    </div>
                    <input
                      type={showPass ? 'text' : 'password'} required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ ...inp('password'), paddingLeft:40, paddingRight:44 }}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused('')}
                    />
                    <button type="button" className="pass-tog" onClick={() => setShowPass(p => !p)}>
                      {showPass ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <div className={`lr-rv d5 ${isVisible ? 'in' : ''}`} style={{ marginTop:4 }}>
                  <button type="submit" className="lr-btn" disabled={loading}>
                    {loading ? <><div className="lr-spin"/> Signing In…</> : 'Sign In →'}
                  </button>
                </div>

              </form>

              {/* Divider */}
              <div className="lr-div">
                <div className="lr-divl"/>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:GOLD, letterSpacing:'.20em', textTransform:'uppercase', opacity:.55 }}>
                  Secure Login
                </span>
                <div className="lr-divl"/>
              </div>

              {/* Back */}
              <div style={{ textAlign:'center' }}>
                <button className="lr-back" onClick={() => navigate('/')}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Back to Main Site
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;