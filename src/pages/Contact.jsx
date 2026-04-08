import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/* ─── Particle Canvas ──────────────────────────────────────────────────── */
const ParticleField = () => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    const dots = Array.from({ length: 55 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.2 + 0.3,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
        if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(201,168,76,0.18)';
        ctx.fill();
      });
      dots.forEach((a, i) => dots.slice(i + 1).forEach(b => {
        const dx = a.x - b.x, dy = a.y - b.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(201,168,76,${0.045 * (1 - dist / 90)})`;
          ctx.lineWidth = 0.5; ctx.stroke();
        }
      }));
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
    />
  );
};

/* ─── SVG Icons ────────────────────────────────────────────────────────── */
const IconLocation = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C7.58 2 4 5.58 4 10c0 6.56 7.28 11.5 7.58 11.7.13.09.28.13.42.13s.29-.04.42-.13C12.72 21.5 20 16.56 20 10c0-4.42-3.58-8-8-8z" fill="rgba(201,168,76,0.15)" stroke="#C9A84C" strokeWidth="1.5" />
    <circle cx="12" cy="10" r="2.8" fill="rgba(201,168,76,0.25)" stroke="#C9A84C" strokeWidth="1.4" />
  </svg>
);
const IconPhone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="2" width="14" height="20" rx="3" fill="rgba(201,168,76,0.12)" stroke="#C9A84C" strokeWidth="1.5" />
    <circle cx="12" cy="17.5" r="1.1" fill="#C9A84C" />
    <path d="M9 5.5h6" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const IconEmail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" fill="rgba(201,168,76,0.12)" stroke="#C9A84C" strokeWidth="1.5" />
    <path d="M3 7l9 6 9-6" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" fill="rgba(201,168,76,0.12)" stroke="#C9A84C" strokeWidth="1.5" />
    <path d="M12 7v5l3 3" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconSend = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 2L15 22l-4-9-9-4 20-7z" fill="currentColor" />
  </svg>
);
const IconCheck = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconFb = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" fill="#1877F2" />
  </svg>
);

/* ─── Main Component ───────────────────────────────────────────────────── */
const Contact = () => {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', subject: '', message: '' });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const h = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "messages"), {
        ...form, read: false, createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("দুঃখিত, মেসেজ পাঠানো যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: <IconLocation />, label: 'Address',      value: 'Qadirabad Cantonment Sapper College, Natore, Bangladesh' },
    { icon: <IconPhone />,    label: 'Phone',        value: '+880 1309-123887' },
    { icon: <IconEmail />,    label: 'Email',        value: 'elc@qcsc.edu.bd' },
    { icon: <IconClock />,    label: 'Active Hours', value: 'Sat – Thu • 9:00 AM – 4:00 PM' },
  ];

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
    boxShadow: focused === name
      ? '0 0 0 4px rgba(201,168,76,0.10)'
      : '0 1px 3px rgba(0,0,0,0.05)',
    resize: 'none',
    letterSpacing: '.01em',
    caretColor: '#C9A84C',
  });

  const rev = (d) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.8s cubic-bezier(.16,1,.3,1) ${d}s, transform 0.8s cubic-bezier(.16,1,.3,1) ${d}s`,
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .croot *, .croot *::before, .croot *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .croot input::placeholder,
        .croot textarea::placeholder { color: rgba(0,0,0,0.25); font-style: italic; }

        .croot input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 40px #f9f6ef inset !important;
          -webkit-text-fill-color: #1a1a1a !important;
        }

        .info-item { transition: transform .28s ease; cursor: default; }
        .info-item:hover { transform: translateX(5px); }
        .info-item:hover .info-icon-box {
          background: rgba(201,168,76,0.18) !important;
          border-color: rgba(201,168,76,0.45) !important;
          box-shadow: 0 4px 20px rgba(201,168,76,0.18) !important;
        }

        .fb-link {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          font-size: 12.5px; font-weight: 500; font-family: 'DM Sans', sans-serif;
          text-decoration: none; color: rgba(0,0,0,0.45);
          background: rgba(24,119,242,0.06);
          border: 1px solid rgba(24,119,242,0.18);
          padding: 12px 20px; border-radius: 12px;
          transition: all .3s; margin-top: 20px; letter-spacing: .04em;
          position: relative; overflow: hidden;
        }
        .fb-link:hover {
          background: rgba(24,119,242,0.12);
          border-color: rgba(24,119,242,0.35);
          color: #1877F2; transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(24,119,242,0.14);
        }

        .c-submit {
          width: 100%; margin-top: 4px;
          background: #C9A84C;
          border: none; border-radius: 11px; padding: 15px;
          font-family: 'Cinzel', serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: .18em; text-transform: uppercase; color: #ffffff;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 9px;
          transition: all .3s cubic-bezier(.16,1,.3,1);
          box-shadow: 0 4px 20px rgba(201,168,76,0.35);
          position: relative; overflow: hidden;
        }
        .c-submit:hover:not(:disabled) {
          background: #b8923d;
          transform: translateY(-3px);
          box-shadow: 0 10px 32px rgba(201,168,76,0.45);
        }
        .c-submit:active:not(:disabled) { transform: translateY(0); }
        .c-submit:disabled {
          background: #e0d9cb;
          color: rgba(0,0,0,0.25);
          box-shadow: none; cursor: not-allowed;
        }

        .c-again {
          margin-top: 26px; background: transparent;
          border: 1px solid rgba(0,0,0,0.12); border-radius: 9px;
          padding: 10px 24px; color: rgba(0,0,0,0.32);
          font-size: 9px; letter-spacing: .22em; text-transform: uppercase;
          cursor: pointer; transition: all .25s; font-family: 'DM Sans', sans-serif;
          font-weight: 600;
        }
        .c-again:hover { border-color: rgba(201,168,76,0.45); color: #C9A84C; }

        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.5); }
          60%       { box-shadow: 0 0 0 6px rgba(201,168,76,0); }
        }
        .gold-pulse {
          width: 5px; height: 5px; border-radius: 50%; background: #C9A84C;
          animation: goldPulse 2.4s infinite; flex-shrink: 0;
        }

        @keyframes spin360 { to { transform: rotate(360deg); } }
        .c-spin {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
          animation: spin360 .65s linear infinite; flex-shrink: 0;
        }

        @keyframes ringPop { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
        .success-ring { animation: ringPop .5s .1s cubic-bezier(.16,1,.3,1) both; }

        @keyframes successSlide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .success-wrap { animation: successSlide .55s cubic-bezier(.16,1,.3,1); }

        @keyframes orbFloat {
          0%, 100% { transform: translate(0,0); }
          50%       { transform: translate(18px, 24px); }
        }

        .form-row { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 480px) { .form-row { grid-template-columns: 1fr 1fr; } }

        .contact-grid { display: grid; grid-template-columns: 1fr; gap: 22px; }
        @media (min-width: 1024px) { .contact-grid { grid-template-columns: 1fr 1.65fr; gap: 40px; align-items: start; } }

        .scanlines {
          position: absolute; inset: 0; pointer-events: none; z-index: 5; border-radius: inherit;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(201,168,76,0.012) 2px, rgba(201,168,76,0.012) 4px);
        }
      `}</style>

      <div className="croot">
        <div style={{
          minHeight: '100svh',
          background: '#faf7f0',
          padding: 'clamp(100px,12vw,130px) clamp(16px,4vw,56px) clamp(80px,10vw,120px)',
          position: 'relative', overflow: 'hidden',
          fontFamily: "'DM Sans', sans-serif",
        }}>

          <div style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(201,168,76,0.07), transparent 55%)`,
            transition: 'background .08s',
          }} />

          <div style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(201,168,76,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.07) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
            maskImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, black, transparent)',
          }} />

          <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(240,234,218,0.45) 100%)' }} />

          {[
            { w:380,h:380, color:'rgba(201,168,76,0.12)', top:'-100px',  left:'-60px',   dur:'13s', dir:'normal' },
            { w:280,h:280, color:'rgba(201,168,76,0.09)', bottom:'5%',   right:'-50px',  dur:'17s', dir:'reverse' },
            { w:200,h:200, color:'rgba(201,168,76,0.07)', top:'45%',     left:'48%',     dur:'10s', dir:'normal', delay:'4s' },
          ].map((o, i) => (
            <div key={i} style={{
              position:'absolute', width:o.w, height:o.h, borderRadius:'50%',
              background:`radial-gradient(circle,${o.color} 0%,transparent 70%)`,
              top:o.top, left:o.left, bottom:o.bottom, right:o.right,
              filter:'blur(60px)', zIndex:1, pointerEvents:'none',
              animation:`orbFloat ${o.dur} ease-in-out infinite ${o.delay||'0s'}`,
              animationDirection: o.dir,
            }} />
          ))}

          <ParticleField />

          <div style={{ position: 'relative', zIndex: 10, maxWidth: '1220px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px', ...rev(0.06) }}>
                <span style={{
                  display:'inline-flex', alignItems:'center', gap:'8px',
                  border:'1px solid rgba(201,168,76,0.40)',
                  borderRadius:'100px', padding:'7px 18px',
                  fontSize:'9.5px', fontWeight:600,
                  letterSpacing:'.22em', textTransform:'uppercase', color:'#C9A84C',
                  background:'rgba(201,168,76,0.08)',
                  fontFamily:"'DM Sans', sans-serif",
                }}>
                  <span className="gold-pulse" />
                  Get In Touch
                </span>
              </div>

              <div style={rev(0.16)}>
                <p style={{
                  fontFamily:"'DM Sans', sans-serif",
                  fontSize:'10px', color:'rgba(201,168,76,0.65)',
                  letterSpacing:'.28em', textTransform:'uppercase',
                  marginBottom:'10px', fontWeight:600,
                }}>
                  Sapper College · English Language Club
                </p>
                <h2 style={{
                  fontFamily:"'Cinzel', serif",
                  fontSize:'clamp(2.6rem,7.5vw,5rem)',
                  fontWeight:700, color:'#1a1a1a', lineHeight:1.1, letterSpacing:'0.04em',
                }}>
                  Contact{' '}
                  <em style={{ color:'#C9A84C', fontStyle:'normal' }}>Us</em>
                </h2>
              </div>

              <p style={{ fontSize:'14px', color:'rgba(0,0,0,0.38)', fontWeight:300, letterSpacing:'.06em', marginTop:'14px', ...rev(0.28) }}>
                We'd love to hear from you — reach out anytime
              </p>

              <div style={{ display:'flex', alignItems:'center', gap:'14px', maxWidth:'220px', margin:'20px auto 0', ...rev(0.28) }}>
                <div style={{ flex:1, height:'1px', background:'linear-gradient(to left, transparent, rgba(201,168,76,0.35))' }} />
                <div style={{ width:'6px',height:'6px',background:'#C9A84C',transform:'rotate(45deg)',flexShrink:0 }} />
                <div style={{ flex:1, height:'1px', background:'linear-gradient(to right, transparent, rgba(201,168,76,0.35))' }} />
              </div>
            </div>

            {/* Grid */}
            <div className="contact-grid">

              {/* LEFT — Info */}
              <div style={rev(0.32)}>
                <div style={{
                  background:'#ffffff',
                  border:'1px solid rgba(201,168,76,0.20)',
                  borderRadius:'24px', position:'relative', overflow:'hidden',
                  boxShadow:'0 8px 48px rgba(201,168,76,0.10), 0 2px 12px rgba(0,0,0,0.06)',
                }}>
                  <div className="scanlines" />
                  <div style={{ position:'absolute',top:0,left:0,right:0,height:'2px',background:'linear-gradient(90deg,transparent 8%,#C9A84C 50%,transparent 92%)',zIndex:3,opacity:0.6 }} />
                  <div style={{ position:'absolute',top:0,left:0,bottom:0,width:'2px',background:'linear-gradient(180deg,rgba(201,168,76,0.5) 0%,transparent 55%)',zIndex:3 }} />
                  <div style={{ position:'absolute',bottom:0,right:0,width:'44px',height:'44px',borderRight:'1px solid rgba(201,168,76,0.20)',borderBottom:'1px solid rgba(201,168,76,0.20)',borderRadius:'0 0 22px 0',zIndex:3 }} />

                  <div style={{ padding:'clamp(24px,4vw,36px) clamp(22px,4vw,32px)' }}>
                    <p style={{ fontFamily:"'Cinzel', serif", fontSize:'clamp(1.05rem,2.5vw,1.3rem)', fontWeight:700, color:'#1a1a1a', marginBottom:'3px', letterSpacing:'.04em' }}>
                      Our Information
                    </p>
                    <p style={{ fontSize:'11.5px', color:'rgba(0,0,0,0.35)', letterSpacing:'.07em', marginBottom:'22px', fontWeight:400 }}>
                      Find us or drop a message
                    </p>

                    {contactInfo.map((item, i) => (
                      <div className="info-item" key={i} style={{
                        display:'flex', alignItems:'flex-start', gap:'14px',
                        padding:'14px 0',
                        borderBottom: i < contactInfo.length - 1 ? '1px solid rgba(201,168,76,0.10)' : 'none',
                      }}>
                        <div className="info-icon-box" style={{
                          width:'40px', height:'40px', flexShrink:0, borderRadius:'12px',
                          background:'rgba(201,168,76,0.09)',
                          border:'1px solid rgba(201,168,76,0.20)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          transition:'all .3s',
                        }}>
                          {item.icon}
                        </div>
                        <div>
                          <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:'9px', fontWeight:600, letterSpacing:'.22em', textTransform:'uppercase', color:'rgba(201,168,76,0.70)', marginBottom:'4px', display:'block' }}>
                            {item.label}
                          </span>
                          <p style={{ fontSize:'13px', color:'rgba(0,0,0,0.55)', lineHeight:1.65, fontWeight:400 }}>
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}

                    <a href="https://www.facebook.com/qcscelc" target="_blank" rel="noreferrer" className="fb-link">
                      <IconFb />
                      Follow us on Facebook
                    </a>

                    <div style={{
                      borderRadius:'16px', overflow:'hidden',
                      border:'1px solid rgba(201,168,76,0.18)',
                      marginTop:'20px', height:'158px', position:'relative',
                      boxShadow:'0 4px 20px rgba(0,0,0,0.08)',
                    }}>
                      <iframe
                        title="QCSC Location"
                        src="https://maps.google.com/maps?q=Qadirabad+Cantonment+Sapper+College+Natore+Bangladesh&output=embed&z=15"
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        style={{ width:'100%', height:'100%', border:'none', display:'block', filter:'saturate(0.7) brightness(1.05)' }}
                      />
                      <div style={{
                        position:'absolute', top:'10px', left:'10px', zIndex:3,
                        background:'rgba(255,255,255,0.94)', border:'1px solid rgba(201,168,76,0.35)',
                        borderRadius:'7px', padding:'4px 12px',
                        fontSize:'9px', letterSpacing:'.18em', textTransform:'uppercase',
                        color:'#C9A84C', backdropFilter:'blur(8px)',
                        fontFamily:"'DM Sans', sans-serif", fontWeight:600,
                      }}>
                        QCSC · Natore
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* RIGHT — Form */}
              <div style={rev(0.46)}>
                <div style={{
                  background:'#ffffff',
                  border:'1px solid rgba(201,168,76,0.20)',
                  borderRadius:'24px', position:'relative', overflow:'hidden',
                  boxShadow:'0 8px 48px rgba(201,168,76,0.10), 0 2px 12px rgba(0,0,0,0.06)',
                }}>
                  <div className="scanlines" />
                  <div style={{ position:'absolute',top:0,left:0,right:0,height:'2px',background:'linear-gradient(90deg,transparent 8%,#C9A84C 50%,transparent 92%)',zIndex:3,opacity:0.6 }} />
                  <div style={{ position:'absolute',top:0,right:0,bottom:0,width:'2px',background:'linear-gradient(180deg,rgba(201,168,76,0.45) 0%,transparent 55%)',zIndex:3 }} />
                  <div style={{ position:'absolute',bottom:0,right:0,width:'44px',height:'44px',borderRight:'1px solid rgba(201,168,76,0.20)',borderBottom:'1px solid rgba(201,168,76,0.20)',borderRadius:'0 0 22px 0',zIndex:3 }} />

                  <div style={{ padding:'clamp(24px,4vw,36px) clamp(22px,4vw,32px)' }}>

                    {submitted ? (
                      <div className="success-wrap" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'52px 20px 44px', textAlign:'center' }}>
                        <div className="success-ring" style={{
                          width:'76px', height:'76px', borderRadius:'50%',
                          background:'rgba(201,168,76,0.10)',
                          border:'1px solid rgba(201,168,76,0.35)',
                          display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'22px',
                          boxShadow:'0 0 0 10px rgba(201,168,76,0.05), 0 8px 36px rgba(201,168,76,0.15)',
                        }}>
                          <IconCheck />
                        </div>
                        <p style={{ fontFamily:"'Cinzel', serif", fontSize:'clamp(1.3rem,5vw,1.75rem)', fontWeight:700, color:'#1a1a1a', marginBottom:'10px', letterSpacing:'.04em' }}>
                          Message Sent!
                        </p>
                        <p style={{ fontSize:'13px', color:'rgba(0,0,0,0.40)', lineHeight:1.85, maxWidth:'300px', fontWeight:300 }}>
                          Thank you for reaching out.<br />
                          We'll get back to you as soon as possible.
                        </p>
                        <button className="c-again" onClick={() => { setSubmitted(false); setForm({ name:'', phone:'', subject:'', message:'' }); }}>
                          Send Another
                        </button>
                      </div>
                    ) : (
                      <>
                        <p style={{ fontFamily:"'Cinzel', serif", fontSize:'clamp(1.05rem,2.5vw,1.3rem)', fontWeight:700, color:'#1a1a1a', marginBottom:'3px', letterSpacing:'.04em' }}>
                          Send a Message
                        </p>
                        <p style={{ fontSize:'11.5px', color:'rgba(0,0,0,0.35)', letterSpacing:'.07em', marginBottom:'28px', fontWeight:400 }}>
                          All fields are required
                        </p>

                        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

                          <div className="form-row">
                            <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                              <label style={{ fontSize:'9px',fontWeight:600,letterSpacing:'.22em',textTransform:'uppercase',color:'rgba(0,0,0,0.35)',fontFamily:"'DM Sans', sans-serif" }}>
                                Full Name
                              </label>
                              <input name="name" type="text" required placeholder="Your full name"
                                value={form.name} onChange={handleChange} style={inp('name')}
                                onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                              <label style={{ fontSize:'9px',fontWeight:600,letterSpacing:'.22em',textTransform:'uppercase',color:'rgba(0,0,0,0.35)',fontFamily:"'DM Sans', sans-serif" }}>
                                Phone
                              </label>
                              <input name="phone" type="tel" required placeholder="01XXXXXXXXX"
                                value={form.phone} onChange={handleChange} style={inp('phone')}
                                onFocus={() => setFocused('phone')} onBlur={() => setFocused('')} />
                            </div>
                          </div>

                          <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                            <label style={{ fontSize:'9px',fontWeight:600,letterSpacing:'.22em',textTransform:'uppercase',color:'rgba(0,0,0,0.35)',fontFamily:"'DM Sans', sans-serif" }}>
                              Subject
                            </label>
                            <input name="subject" type="text" required placeholder="What is this about?"
                              value={form.subject} onChange={handleChange} style={inp('subject')}
                              onFocus={() => setFocused('subject')} onBlur={() => setFocused('')} />
                          </div>

                          <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                            <label style={{ fontSize:'9px',fontWeight:600,letterSpacing:'.22em',textTransform:'uppercase',color:'rgba(0,0,0,0.35)',fontFamily:"'DM Sans', sans-serif" }}>
                              Message
                            </label>
                            <textarea name="message" required rows={5} placeholder="Write your message here..."
                              value={form.message} onChange={handleChange}
                              style={{ ...inp('message'), resize:'none', lineHeight:'1.65' }}
                              onFocus={() => setFocused('message')} onBlur={() => setFocused('')} />
                            <p style={{ fontSize:'9px',color:'rgba(0,0,0,0.22)',textAlign:'right',fontFamily:"'DM Sans',sans-serif",letterSpacing:'.04em',fontWeight:500 }}>
                              {form.message.length} / 1000
                            </p>
                          </div>

                          <button type="submit" className="c-submit" disabled={submitting}>
                            {submitting
                              ? <><span className="c-spin" /> Sending...</>
                              : <><IconSend /> Send Message</>
                            }
                          </button>

                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;