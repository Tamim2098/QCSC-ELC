import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";
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
    const dots = Array.from({ length: 45 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.1 + 0.3,
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
          ctx.strokeStyle = `rgba(201,168,76,${0.04 * (1 - dist / 90)})`;
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

/* ─── Avatar ───────────────────────────────────────────────────────────── */
const Avatar = ({ name, size = 64 }) => {
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'rgba(201,168,76,0.10)',
      border: '1px solid rgba(201,168,76,0.30)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Cinzel', serif",
      fontSize: size * 0.28, fontWeight: 700,
      color: '#C9A84C', flexShrink: 0, letterSpacing: '0.05em',
    }}>
      {initials}
    </div>
  );
};

/* ─── Role display helper ───────────────────────────────────────────────── */
const getRoleLabel = (member) => {
  if (member.role && member.role.trim()) {
    return member.role.trim();
  }
  if (member.type === 'president') return 'President';
  return '';
};

const isLeader = (member) => member.type === 'president';

/* ─── Main Component ───────────────────────────────────────────────────── */
const Members = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [visibleCards, setVisibleCards] = useState(new Set());
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState('2025 – 2026');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRefs = useRef({});
  const observerRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const h = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  /* ── Firestore: Members ─────────────────────────────────────────────── */
  useEffect(() => {
    let unsubscribe;
    const setupListener = () => {
      try {
        const q = query(collection(db, 'committee'), orderBy('createdAt', 'asc'));
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setMembers(data);
            setLoading(false);
            setError(null);
          },
          (err) => {
            console.warn('orderBy(createdAt) failed, falling back:', err.message);
            const q2 = collection(db, 'committee');
            unsubscribe = onSnapshot(
              q2,
              (snapshot) => {
                const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setMembers(data);
                setLoading(false);
                setError(null);
              },
              (err2) => {
                console.error('Members fetch error:', err2);
                setError(err2.message);
                setLoading(false);
              }
            );
          }
        );
      } catch (e) {
        console.error('Setup error:', e);
        setError(e.message);
        setLoading(false);
      }
    };
    setupListener();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  /* ── Firestore: Session setting ─────────────────────────────────────── */
  useEffect(() => {
    const unsubSession = onSnapshot(
      doc(db, 'settings', 'committee'),
      (s) => {
        if (s.exists() && s.data().session) setSession(s.data().session);
      },
      (err) => console.warn('Session fetch failed:', err.message)
    );
    return () => unsubSession();
  }, []);

  /* ── Sort: presidents first, then members ───────────────────────────── */
  const sortedMembers = [...members].sort((a, b) => {
    const aScore = a.type === 'president' ? 0 : 1;
    const bScore = b.type === 'president' ? 0 : 1;
    return aScore - bScore;
  });

  /* ── Stats ──────────────────────────────────────────────────────────── */
  const presidentCount = members.filter(m => m.type === 'president').length;
  const memberCount    = members.filter(m => m.type !== 'president').length;

  /* ── IntersectionObserver ─────────────────────────────────────────── */
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisibleCards((prev) => new Set([...prev, e.target.dataset.id]));
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -10px 0px' }
    );
    const timer = setTimeout(() => {
      Object.values(cardRefs.current).forEach((el) => {
        if (el) observerRef.current.observe(el);
      });
    }, 50);
    return () => {
      clearTimeout(timer);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [sortedMembers]);

  /* ── Loading Screen ───────────────────────────────────────────────── */
  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
          @keyframes mbSpin { to { transform: rotate(360deg); } }
          @keyframes mbPulseRing { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
          @keyframes mbDotBlink { 0%,80%,100%{opacity:0;transform:scale(0.7)} 40%{opacity:1;transform:scale(1)} }
          .mb-ld-dot { display:inline-block;width:5px;height:5px;border-radius:50%;background:rgba(201,168,76,0.6);animation:mbDotBlink 1.4s ease-in-out infinite; }
          .mb-ld-dot:nth-child(2){animation-delay:0.2s}
          .mb-ld-dot:nth-child(3){animation-delay:0.4s}
          @keyframes orbFloat { 0%,100%{transform:translate(0,0)} 50%{transform:translate(16px,20px)} }
        `}</style>
        <div style={{
          minHeight: '100vh', background: '#faf7f0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 20, position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{ position:'absolute',width:350,height:350,borderRadius:'50%',background:'radial-gradient(circle,rgba(201,168,76,0.12) 0%,transparent 70%)',top:-80,right:-80,filter:'blur(60px)',animation:'orbFloat 13s ease-in-out infinite' }} />
          <div style={{ position:'absolute',width:260,height:260,borderRadius:'50%',background:'radial-gradient(circle,rgba(201,168,76,0.09) 0%,transparent 70%)',bottom:'8%',left:-60,filter:'blur(60px)',animation:'orbFloat 17s ease-in-out infinite reverse' }} />
          <div style={{ position: 'relative', width: 56, height: 56 }}>
            <div style={{ position:'absolute',inset:-6,borderRadius:'50%',border:'1px solid rgba(201,168,76,0.15)',animation:'mbPulseRing 2s ease-in-out infinite' }} />
            <div style={{ position:'absolute',inset:0,borderRadius:'50%',border:'1px solid rgba(201,168,76,0.12)' }} />
            <div style={{ position:'absolute',inset:0,borderRadius:'50%',border:'2px solid transparent',borderTopColor:'rgba(201,168,76,0.8)',borderRightColor:'rgba(201,168,76,0.2)',animation:'mbSpin 0.9s linear infinite' }} />
            <div style={{ position:'absolute',top:'50%',left:'50%',marginLeft:-3,marginTop:-3,width:6,height:6,borderRadius:'50%',background:'rgba(201,168,76,0.6)',animation:'mbPulseRing 1.8s ease-in-out infinite' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily:"'Cinzel', serif",fontSize:12,fontWeight:700,color:'rgba(201,168,76,0.8)',letterSpacing:'0.25em',textTransform:'uppercase',margin:'0 0 8px' }}>
              Loading Members
            </p>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:5 }}>
              <span style={{ fontSize:11,color:'rgba(0,0,0,0.28)',letterSpacing:'0.06em' }}>Fetching members</span>
              <span className="mb-ld-dot" /><span className="mb-ld-dot" /><span className="mb-ld-dot" />
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Error Screen ─────────────────────────────────────────────────── */
  if (error) {
    return (
      <div style={{
        minHeight: '100vh', background: '#faf7f0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, fontFamily: "'DM Sans', sans-serif",
      }}>
        <p style={{ fontSize: 13, color: 'rgba(200,50,50,0.7)' }}>Failed to load members</p>
        <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', maxWidth: 340, textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  /* ── Reveal animation helper ────────────────────────────────────────── */
  const rev = (d) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.8s cubic-bezier(.16,1,.3,1) ${d}s, transform 0.8s cubic-bezier(.16,1,.3,1) ${d}s`,
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        .mb-root * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Member card ── */
        .mb-card {
          background: #ffffff;
          border: 1px solid rgba(201,168,76,0.15);
          border-radius: 20px;
          padding: 22px 16px 18px;
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 11px;
          opacity: 0; transform: translateY(18px);
          transition: opacity 0.5s ease, transform 0.5s ease,
                      border-color 0.3s, box-shadow 0.3s;
          position: relative; overflow: hidden;
          box-shadow: 0 2px 12px rgba(201,168,76,0.06), 0 1px 4px rgba(0,0,0,0.04);
        }
        .mb-card::before {
          content: ''; position: absolute; top: 0; left: 15%; right: 15%; height: 1.5px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent);
        }
        .mb-card::after {
          content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 2px;
          background: linear-gradient(180deg, rgba(201,168,76,0.4) 0%, transparent 60%);
        }
        .mb-card.in-view { opacity: 1; transform: translateY(0); }
        .mb-card:hover {
          border-color: rgba(201,168,76,0.35);
          box-shadow: 0 10px 40px rgba(201,168,76,0.15), 0 4px 16px rgba(0,0,0,0.06);
          transform: translateY(-4px);
        }
        .mb-card.president-card {
          border-color: rgba(201,168,76,0.32);
          background: linear-gradient(160deg, #fffdf7 0%, #ffffff 60%);
          box-shadow: 0 4px 20px rgba(201,168,76,0.12), 0 1px 4px rgba(0,0,0,0.04);
        }
        .mb-card.president-card:hover {
          border-color: rgba(201,168,76,0.55);
          box-shadow: 0 14px 48px rgba(201,168,76,0.22), 0 4px 16px rgba(0,0,0,0.06);
        }

        /* ── Stat card ── */
        .mb-stat-card {
          background: #ffffff;
          border: 1px solid rgba(201,168,76,0.18);
          border-radius: 16px; padding: 16px 24px;
          text-align: center; min-width: 100px;
          transition: border-color 0.3s, box-shadow 0.3s;
          box-shadow: 0 2px 12px rgba(201,168,76,0.06);
        }
        .mb-stat-card:hover {
          border-color: rgba(201,168,76,0.38);
          box-shadow: 0 6px 28px rgba(201,168,76,0.14);
        }

        /* ── Facebook link ── */
        .mb-fb-link {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 5px;
          padding: 6px 13px;
          border-radius: 100px;
          background: rgba(24,119,242,0.07);
          border: 1px solid rgba(24,119,242,0.20);
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 600;
          color: #1877F2;
          letter-spacing: 0.04em;
          transition: all 0.25s; margin-top: 4px;
        }
        .mb-fb-link:hover {
          background: rgba(24,119,242,0.15);
          border-color: rgba(24,119,242,0.45);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(24,119,242,0.18);
        }

        /* ── Photo ── */
        .mb-photo {
          width: 64px; height: 64px; border-radius: 50%;
          object-fit: cover; border: 2px solid rgba(201,168,76,0.25);
          display: block; box-shadow: 0 4px 16px rgba(201,168,76,0.15);
          transition: border-color 0.3s, transform 0.3s;
        }
        .mb-card:hover .mb-photo {
          border-color: rgba(201,168,76,0.55);
          transform: scale(1.05);
        }
        .president-card .mb-photo {
          border-color: rgba(201,168,76,0.5);
          box-shadow: 0 4px 20px rgba(201,168,76,0.25);
          width: 72px; height: 72px;
        }
        @media (min-width: 640px) { .mb-photo { width: 72px; height: 72px; } .president-card .mb-photo { width: 80px; height: 80px; } }

        /* ── Grid ── */
        .mb-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (min-width: 560px)  { .mb-grid { grid-template-columns: repeat(3,1fr); gap: 14px; } }
        @media (min-width: 900px)  { .mb-grid { grid-template-columns: repeat(4,1fr); gap: 16px; } }
        @media (min-width: 1100px) { .mb-grid { grid-template-columns: repeat(5,1fr); gap: 18px; } }

        /* ── Scanlines ── */
        .mb-scanlines {
          position: absolute; inset: 0; pointer-events: none; z-index: 5; border-radius: inherit;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(201,168,76,0.008) 2px, rgba(201,168,76,0.008) 4px);
        }

        /* ── Pulse dot ── */
        @keyframes goldPulse { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0.5)} 60%{box-shadow:0 0 0 6px rgba(201,168,76,0)} }
        .gold-pulse { width:5px;height:5px;border-radius:50%;background:#C9A84C;animation:goldPulse 2.4s infinite;flex-shrink:0; }

        /* ── Orb float ── */
        @keyframes orbFloat { 0%,100%{transform:translate(0,0)} 50%{transform:translate(18px,24px)} }

        /* ── President badge ── */
        .mb-president-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.14em; color: #7a4f00;
          background: linear-gradient(135deg, rgba(201,168,76,0.22), rgba(201,168,76,0.10));
          border: 1px solid rgba(201,168,76,0.45);
          border-radius: 6px; padding: 3px 8px;
          text-transform: uppercase;
        }

        /* ── Role badge (general member) ── */
        .mb-role-badge {
          display: inline-block;
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; font-weight: 500;
          color: rgba(0,0,0,0.42);
          letter-spacing: 0.06em;
          background: rgba(0,0,0,0.04);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 6px; padding: 3px 9px;
          text-transform: capitalize;
          margin-top: 3px;
        }
      `}</style>

      <div className="mb-root">
        <div style={{
          minHeight: '100svh',
          background: '#faf7f0',
          padding: 'clamp(100px,12vw,130px) clamp(16px,4vw,56px) clamp(80px,10vw,120px)',
          position: 'relative', overflow: 'hidden',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {/* Mouse follow highlight */}
          <div style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(201,168,76,0.07), transparent 55%)`,
            transition: 'background .08s',
          }} />

          {/* Grid pattern */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(201,168,76,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.07) 1px,transparent 1px)',
            backgroundSize: '52px 52px',
            maskImage: 'radial-gradient(ellipse 70% 50% at 50% 0%,black,transparent)',
          }} />

          {/* Vignette */}
          <div style={{ position:'absolute',inset:0,zIndex:2,pointerEvents:'none',background:'radial-gradient(ellipse 100% 100% at 50% 50%,transparent 50%,rgba(240,234,218,0.45) 100%)' }} />

          {/* Orbs */}
          {[
            { w:380,h:380,color:'rgba(201,168,76,0.11)',top:'-100px',left:'-60px',dur:'13s',dir:'normal' },
            { w:280,h:280,color:'rgba(201,168,76,0.08)',bottom:'5%',right:'-50px',dur:'17s',dir:'reverse' },
            { w:200,h:200,color:'rgba(201,168,76,0.07)',top:'45%',left:'48%',dur:'10s',dir:'normal',delay:'4s' },
          ].map((o, i) => (
            <div key={i} style={{
              position:'absolute',width:o.w,height:o.h,borderRadius:'50%',
              background:`radial-gradient(circle,${o.color} 0%,transparent 70%)`,
              top:o.top,left:o.left,bottom:o.bottom,right:o.right,
              filter:'blur(60px)',zIndex:1,pointerEvents:'none',
              animation:`orbFloat ${o.dur} ease-in-out infinite ${o.delay||'0s'}`,
              animationDirection:o.dir,
            }} />
          ))}

          <ParticleField />

          <div style={{ maxWidth:'1200px', margin:'0 auto', position:'relative', zIndex:10 }}>

            {/* ── HEADER ── */}
            <div style={{ textAlign:'center', marginBottom:'44px' }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:'18px', ...rev(0.06) }}>
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
                  ELC Members
                </span>
              </div>

              <div style={rev(0.16)}>
                <p style={{
                  fontFamily:"'DM Sans', sans-serif",
                  fontSize:'10px', color:'rgba(201,168,76,0.65)',
                  letterSpacing:'.28em', textTransform:'uppercase',
                  marginBottom:'10px', fontWeight:600,
                }}>
                  Sapper College | English Language Club
                </p>
                <h2 style={{
                  fontFamily:"'Cinzel', serif",
                  fontSize:'clamp(2.6rem,7.5vw,5rem)',
                  fontWeight:700, color:'#1a1a1a', lineHeight:1.1, letterSpacing:'0.04em',
                }}>
                  Our{' '}
                  <em style={{ color:'#C9A84C', fontStyle:'normal' }}>Members</em>
                </h2>
              </div>

              <p style={{ fontSize:'14px', color:'rgba(0,0,0,0.38)', fontWeight:300, letterSpacing:'.06em', marginTop:'14px', ...rev(0.28) }}>
                The proud members of Sapper College English Language Club
              </p>

              <div style={{ display:'flex', alignItems:'center', gap:'14px', maxWidth:'220px', margin:'20px auto 0', ...rev(0.28) }}>
                <div style={{ flex:1, height:'1px', background:'linear-gradient(to left,transparent,rgba(201,168,76,0.35))' }} />
                <div style={{ width:'6px',height:'6px',background:'#C9A84C',transform:'rotate(45deg)',flexShrink:0 }} />
                <div style={{ flex:1, height:'1px', background:'linear-gradient(to right,transparent,rgba(201,168,76,0.35))' }} />
              </div>
            </div>

            {/* ── STATS ── */}
            {members.length > 0 && (
              <div style={{ ...rev(0.32), display:'flex', justifyContent:'center', gap:'12px', flexWrap:'wrap', marginBottom:'36px' }}>
                <div className="mb-stat-card">
                  <div style={{ fontFamily:"'Cinzel', serif", fontSize:26, fontWeight:700, color:'#C9A84C', lineHeight:1 }}>
                    {members.length}
                  </div>
                  <div style={{ fontSize:10, fontWeight:500, color:'rgba(0,0,0,0.3)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:5 }}>
                    Total Members
                  </div>
                </div>
                {presidentCount > 0 && (
                  <div className="mb-stat-card">
                    <div style={{ fontFamily:"'Cinzel', serif", fontSize:26, fontWeight:700, color:'#C9A84C', lineHeight:1 }}>
                      {presidentCount}
                    </div>
                    <div style={{ fontSize:10, fontWeight:500, color:'rgba(0,0,0,0.3)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:5 }}>
                      President
                    </div>
                  </div>
                )}
                {memberCount > 0 && (
                  <div className="mb-stat-card">
                    <div style={{ fontFamily:"'Cinzel', serif", fontSize:26, fontWeight:700, color:'#C9A84C', lineHeight:1 }}>
                      {memberCount}
                    </div>
                    <div style={{ fontSize:10, fontWeight:500, color:'rgba(0,0,0,0.3)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:5 }}>
                      Members
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── MEMBERS GRID ── */}
            {sortedMembers.length > 0 ? (
              <div className="mb-grid">
                {sortedMembers.map((member, idx) => {
                  const roleLabel = getRoleLabel(member);
                  const leader    = isLeader(member);

                  return (
                    <div
                      key={member.id}
                      className={`mb-card${visibleCards.has(member.id) ? ' in-view' : ''}${leader ? ' president-card' : ''}`}
                      style={{ transitionDelay: `${(idx % 5) * 0.07}s` }}
                      data-id={member.id}
                      ref={(el) => { cardRefs.current[member.id] = el; }}
                    >
                      <div className="mb-scanlines" />

                      {/* Photo or Avatar */}
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="mb-photo" />
                      ) : (
                        <Avatar name={member.name} size={leader ? 72 : 64} />
                      )}

                      {/* Name + Role */}
                      <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap: 4 }}>
                        <p style={{
                          fontFamily:"'DM Sans', sans-serif",
                          fontSize: leader ? 14 : 13,
                          fontWeight: leader ? 600 : 500,
                          color: leader ? '#1a1a1a' : 'rgba(0,0,0,0.78)',
                          lineHeight:1.35,
                        }}>
                          {member.name}
                        </p>

                        {/* Role label */}
                        {roleLabel ? (
                          leader ? (
                            <span className="mb-president-badge">
                              {roleLabel}
                            </span>
                          ) : (
                            <span className="mb-role-badge">
                              {roleLabel}
                            </span>
                          )
                        ) : leader ? (
                          <span className="mb-president-badge">President</span>
                        ) : null}
                      </div>

                      {/* Facebook link */}
                      {member.facebook && member.facebook.trim() && (
                        <a
                          href={member.facebook.trim()}
                          target="_blank"
                          rel="noreferrer"
                          className="mb-fb-link"
                          title="Facebook Profile"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" fill="#1877F2" />
                          </svg>
                          Facebook
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'70px 20px', fontFamily:"'DM Sans', sans-serif" }}>
                <div style={{ fontSize:28, opacity:0.15, marginBottom:12, color:'#C9A84C' }}>— —</div>
                <p style={{ fontSize:13, color:'rgba(0,0,0,0.25)' }}>No members found.</p>
              </div>
            )}

            {/* ── SESSION BADGE ── */}
            <div style={{ display:'flex', justifyContent:'center', marginTop:'48px', ...rev(0.5) }}>
              <div style={{
                display:'inline-flex', alignItems:'center', gap:10,
                background:'#ffffff',
                border:'1px solid rgba(201,168,76,0.22)',
                borderRadius:12, padding:'10px 22px',
                boxShadow:'0 2px 16px rgba(201,168,76,0.08)',
              }}>
                <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:11, color:'rgba(0,0,0,0.28)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Session</span>
                <span style={{ fontFamily:"'Cinzel', serif", fontSize:13, color:'#C9A84C', fontWeight:700 }}>{session}</span>
                <span style={{ width:1, height:14, background:'rgba(201,168,76,0.25)' }} />
                <span style={{ fontFamily:"'DM Sans', sans-serif", fontSize:11, color:'rgba(0,0,0,0.28)', letterSpacing:'0.1em' }}>{members.length} Members</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Members;