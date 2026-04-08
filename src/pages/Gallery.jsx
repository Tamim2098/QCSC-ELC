import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

/* ─── Particle Canvas (Same as Members Page) ───────────────────────────── */
const ParticleField = () => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    const dots = Array.from({ length: 30 }, () => ({
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
        ctx.fillStyle = 'rgba(201,168,76,0.12)';
        ctx.fill();
      });
      dots.forEach((a, i) => dots.slice(i + 1).forEach(b => {
        const dx = a.x - b.x, dy = a.y - b.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(201,168,76,${0.04 * (1 - dist / 80)})`;
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

const Gallery = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [visibleItems, setVisibleItems] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const sectionRef = useRef(null);
  const itemRefs = useRef({});

  // Fetch images from Firebase
  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("uploadedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const images = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGalleryImages(images);
      setLoading(false);
    });
    const t = setTimeout(() => setIsVisible(true), 80);
    return () => { unsubscribe(); clearTimeout(t); };
  }, []);

  // Mouse position for highlight effect
  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    if (galleryImages.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set([...prev, entry.target.dataset.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    Object.values(itemRefs.current).forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [galleryImages]);

  // Lightbox navigation (keyboard + touch)
  useEffect(() => {
    if (lightbox === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox((p) => (p + 1) % galleryImages.length);
      if (e.key === 'ArrowLeft') setLightbox((p) => (p - 1 + galleryImages.length) % galleryImages.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightbox, galleryImages.length]);

  // Touch navigation for lightbox
  const touchStart = useRef(null);
  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      setLightbox((p) => diff > 0 ? (p + 1) % galleryImages.length : (p - 1 + galleryImages.length) % galleryImages.length);
    }
    touchStart.current = null;
  };

  // Reveal animation helper
  const rev = (d) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.7s ease ${d}s, transform 0.7s ease ${d}s`,
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .gallery-root * { box-sizing: border-box; margin: 0; padding: 0; }
        .gallery-page {
          min-height: 100svh;
          background: #faf7f0;
          padding: clamp(100px, 12vw, 130px) clamp(16px, 4vw, 56px) clamp(80px, 10vw, 120px);
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }
        /* Mouse follow highlight */
        .mouse-highlight {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(600px circle at var(--x) var(--y), rgba(201,168,76,0.07), transparent 55%);
          transition: background 0.08s;
        }
        /* Grid pattern */
        .grid-pattern {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(201,168,76,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.07) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(ellipse 70% 50% at 50% 0%, black, transparent);
        }
        /* Vignette */
        .vignette {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background: radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(240,234,218,0.45) 100%);
        }
        /* Orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          z-index: 1;
          pointer-events: none;
          animation: orbFloat 12s ease-in-out infinite;
        }
        .orb-1 { width: 380px; height: 380px; top: -100px; left: -60px; background: radial-gradient(circle, rgba(201,168,76,0.11) 0%, transparent 70%); }
        .orb-2 { width: 280px; height: 280px; bottom: 5%; right: -50px; background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%); animation-direction: reverse; }
        .orb-3 { width: 200px; height: 200px; top: 45%; left: 48%; background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%); animation-delay: 4s; }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(16px, 20px); }
        }
        /* Section label */
        .section-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(201,168,76,0.40);
          border-radius: 100px;
          padding: 7px 18px;
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #C9A84C;
          background: rgba(201,168,76,0.08);
          font-family: 'DM Sans', sans-serif;
        }
        .gold-pulse {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #C9A84C;
          animation: goldPulse 2.4s infinite;
        }
        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.5); }
          60% { box-shadow: 0 0 0 6px rgba(201,168,76,0); }
        }
        /* Header */
        .gallery-header {
          text-align: center;
          margin-bottom: 44px;
        }
        .gallery-title {
          font-family: 'Cinzel', serif;
          font-size: clamp(2.6rem, 7.5vw, 5rem);
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.1;
          letter-spacing: 0.04em;
          margin: 12px 0 8px;
        }
        .gallery-title em {
          color: #C9A84C;
          font-style: normal;
        }
        .gallery-subtitle {
          font-size: 14px;
          color: rgba(0,0,0,0.38);
          font-weight: 300;
          letter-spacing: 0.06em;
          margin-top: 14px;
        }
        .gallery-divider {
          display: flex;
          align-items: center;
          gap: 14px;
          max-width: 220px;
          margin: 20px auto 0;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to left, transparent, rgba(201,168,76,0.35));
        }
        .divider-line.rev {
          background: linear-gradient(to right, transparent, rgba(201,168,76,0.35));
        }
        .divider-dot {
          width: 6px;
          height: 6px;
          background: #C9A84C;
          transform: rotate(45deg);
        }
        /* Masonry Grid */
        .masonry-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 560px) { .masonry-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; } }
        @media (min-width: 900px) { .masonry-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; } }
        @media (min-width: 1100px) { .masonry-grid { grid-template-columns: repeat(5, 1fr); gap: 18px; } }
        .masonry-item {
          background: #ffffff;
          border: 1px solid rgba(201,168,76,0.15);
          border-radius: 20px;
          padding: 12px;
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.3s, box-shadow 0.3s;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(201,168,76,0.06), 0 1px 4px rgba(0,0,0,0.04);
        }
        .masonry-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 15%;
          right: 15%;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent);
        }
        .masonry-item::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, rgba(201,168,76,0.4) 0%, transparent 60%);
        }
        .masonry-item.in-view {
          opacity: 1;
          transform: translateY(0);
        }
        .masonry-item:hover {
          border-color: rgba(201,168,76,0.35);
          box-shadow: 0 10px 40px rgba(201,168,76,0.15), 0 4px 16px rgba(0,0,0,0.06);
          transform: translateY(-4px);
        }
        .masonry-item:hover::after {
          background: linear-gradient(180deg, rgba(201,168,76,0.7) 0%, transparent 70%);
        }
        .scanlines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 5;
          border-radius: inherit;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(201,168,76,0.008) 2px, rgba(201,168,76,0.008) 4px);
        }
        .gallery-image {
          width: 100%;
          height: 160px;
          object-fit: cover;
          border-radius: 12px;
          display: block;
        }
        .image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s ease;
          display: flex;
          align-items: flex-end;
          padding: 12px;
          border-radius: 12px;
        }
        .masonry-item:hover .image-overlay {
          opacity: 1;
        }
        .overlay-text {
          font-size: 11px;
          color: rgba(255,255,255,0.85);
          font-weight: 500;
        }
        /* Lightbox */
        .lightbox-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.95);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: lbFadeIn 0.2s ease;
          padding: 16px;
        }
        @keyframes lbFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .lightbox-content {
          position: relative;
          max-width: min(92vw, 900px);
          max-height: 85svh;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,0.8);
          animation: lbSlideIn 0.25s ease;
        }
        @keyframes lbSlideIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .lightbox-image {
          display: block;
          max-width: 100%;
          max-height: 85svh;
          object-fit: contain;
          border-radius: 12px;
        }
        .lb-close {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255,255,255,0.7);
          z-index: 2001;
          font-size: 20px;
        }
        .lb-nav-btn {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255,255,255,0.6);
          font-size: 20px;
          z-index: 2001;
        }
        .lb-prev { left: 12px; }
        .lb-next { right: 12px; }
        .lb-counter {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          z-index: 2001;
        }
        /* Loading Keyframes (Added These) */
        @keyframes galSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes galPulseRing {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 0.3; }
        }
        @keyframes galDotBlink {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }

        /* Loading */
        .loading-spinner {
          position: relative;
          width: 56px;
          height: 56px;
          margin: 0 auto 20px;
        }
        .spinner-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px solid rgba(201,168,76,0.1);
          animation: galPulseRing 2s ease-in-out infinite;
        }
        .spinner-static {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(201,168,76,0.12);
        }
        .spinner-arc {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: rgba(201,168,76,0.7);
          border-right-color: rgba(201,168,76,0.2);
          animation: galSpin 0.9s linear infinite;
        }
        .spinner-dot {
          position: absolute;
          inset: 50%;
          margin-left: -3px;
          margin-top: -3px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(201,168,76,0.5);
          animation: galPulseRing 1.8s ease-in-out infinite;
        }
        .loading-text {
          font-family: 'Cinzel', serif;
          font-size: 12px;
          font-weight: 700;
          color: rgba(201,168,76,0.55);
          letter-spacing: 0.25em;
          text-transform: uppercase;
          margin: 0 0 8px;
        }
        .loading-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          margin-top: 8px;
        }
        .loading-dot {
          display: inline-block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(201,168,76,0.5);
          animation: galDotBlink 1.4s ease-in-out infinite;
        }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }
        .loading-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
          opacity: 0.4;
        }
        .loading-divider-line {
          width: 30px;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(201,168,76,0.3));
        }
      `}</style>

      {/* Mouse highlight effect */}
      <div
        className="mouse-highlight"
        style={{ '--x': `${mousePos.x}px`, '--y': `${mousePos.y}px` }}
      />

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="lightbox-backdrop"
          onClick={() => setLightbox(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button className="lb-close" onClick={() => setLightbox(null)}>✕</button>
          <button
            className="lb-nav-btn lb-prev"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((p) => (p - 1 + galleryImages.length) % galleryImages.length);
            }}
          >
            ‹
          </button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={galleryImages[lightbox].url}
              alt="Gallery Item"
              className="lightbox-image"
            />
          </div>
          <button
            className="lb-nav-btn lb-next"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((p) => (p + 1) % galleryImages.length);
            }}
          >
            ›
          </button>
          <div className="lb-counter">
            {lightbox + 1} / {galleryImages.length}
          </div>
        </div>
      )}

      {/* Main Gallery Page */}
      <div className="gallery-page">
        <div className="grid-pattern" />
        <div className="vignette" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <ParticleField />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>

          {/* Header */}
          <div className="gallery-header">
            <div className="g-reveal gd1" style={rev(0.06)}>
              <span className="section-label">
                <span className="gold-pulse" />Our Memories
              </span>
            </div>
            <h1 className="gallery-title g-reveal gd2" style={rev(0.16)}>
              Photo <em>Gallery</em>
            </h1>
            <p className="gallery-subtitle g-reveal gd3" style={rev(0.28)}>
              Moments captured from our activities &amp; events
            </p>
            <div className="gallery-divider" style={rev(0.28)}>
              <div className="divider-line rev" />
              <div className="divider-dot" />
              <div className="divider-line" />
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div className="loading-spinner">
                <div className="spinner-ring" />
                <div className="spinner-static" />
                <div className="spinner-arc" />
                <div className="spinner-dot" />
              </div>
              <p className="loading-text">Loading Gallery</p>
              <div className="loading-dots">
                <span className="loading-dot" />
                <span className="loading-dot" />
                <span className="loading-dot" />
              </div>
              <div className="loading-divider">
                <div className="loading-divider-line" />
                <span style={{ color: 'rgba(201,168,76,0.4)', fontSize: 10 }}>⬧</span>
                <div className="loading-divider-line rev" />
              </div>
            </div>
          ) : (
            // Gallery Grid
            <div className="masonry-grid">
              {galleryImages.map((item, idx) => (
                <div
                  key={item.id}
                  className={`masonry-item ${visibleItems.has(item.id) ? 'in-view' : ''}`}
                  style={{ transitionDelay: `${(idx % 8) * 0.06}s` }}
                  data-id={item.id}
                  ref={(el) => { itemRefs.current[item.id] = el; }}
                  onClick={() => setLightbox(idx)}
                >
                  <div className="scanlines" />
                  <img
                    src={item.url}
                    alt="Gallery Item"
                    className="gallery-image"
                    loading="lazy"
                  />
                  <div className="image-overlay">
                    <span className="overlay-text">Tap to expand ↗</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Gallery;