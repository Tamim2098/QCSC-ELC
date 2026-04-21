import 
{ useState, useEffect, useRef } from "react";
import { Target, Telescope, ChevronLeft, ChevronRight } from "lucide-react";

const photos = [
  { src: "https://res.cloudinary.com/dac4g49sw/image/upload/v1775489741/474800435_122200826684177912_1022015056818942231_n_lmuwqx.jpg", alt: "ELC Event 1" },
  { src: "https://res.cloudinary.com/dac4g49sw/image/upload/v1776783385/474898911_122200837022177912_8630447348248634942_n_y90bb7.jpg", alt: "ELC Event 5" },
  { src: "https://res.cloudinary.com/dac4g49sw/image/upload/v1776783385/474772727_122200837052177912_481391247374957293_n_nfbkfw.jpg", alt: "ELC Event 6" },
  { src: "https://res.cloudinary.com/dac4g49sw/image/upload/v1776783384/474659250_122200836998177912_285125131815005310_n_p5wigx.jpg", alt: "ELC Event 7" },
  { src: "https://res.cloudinary.com/dac4g49sw/image/upload/v1776783384/474758016_122200837040177912_5567179679501009620_n_kohs5w.jpg", alt: "ELC Event 8" },
  { src: "https://res.cloudinary.com/dac4g49sw/image/upload/v1775489700/482084760_122206481870177912_2524492896742230006_n_fizgvt.jpg", alt: "ELC Event 9" },
  { src: "https://res.cloudinary.com/dac4g49sw/image/upload/v1775489533/480782315_122206481846177912_7712895587866807742_n_vrg0qq.jpg", alt: "ELC Event 10" },
];

const About = () => {
  const [current, setCurrent] = useState(0);
  const [locked, setLocked] = useState(false);
  const [entering, setEntering] = useState(null);
  const [exiting, setExiting] = useState(null);
  const autoRef = useRef(null);
  const total = photos.length;

  useEffect(() => {
    photos.forEach(p => { const img = new Image(); img.src = p.src; });
  }, []);

  const DURATION = 340;

  const goTo = (next, dir) => {
    if (locked || next === current) return;
    setLocked(true);

    const exitDir = dir === "next" ? "to-left" : "to-right";
    const enterDir = dir === "next" ? "from-right" : "from-left";

    setExiting({ index: current, dir: exitDir });
    setEntering({ index: next, dir: enterDir });

    setTimeout(() => {
      setCurrent(next);
      setExiting(null);
      setEntering(null);
      setLocked(false);
    }, DURATION);
  };

  const startAuto = () => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setCurrent(prev => {
        const next = (prev + 1) % total;
        goTo(next, "next");
        return prev;
      });
    }, 4000);
  };

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoRef.current);
  }, []);

  const handleNext = () => { goTo((current + 1) % total, "next"); startAuto(); };
  const handlePrev = () => { goTo((current - 1 + total) % total, "prev"); startAuto(); };
  const handleDot  = (i) => { goTo(i, i > current ? "next" : "prev"); startAuto(); };

  const getImgClass = (i) => {
    if (entering && entering.index === i) return `rsc-img rsc-img--enter-${entering.dir}`;
    if (exiting  && exiting.index  === i) return `rsc-img rsc-img--exit-${exiting.dir}`;
    if (i === current && !entering && !exiting) return "rsc-img rsc-img--active";
    return "rsc-img rsc-img--hidden";
  };

  const getImgZ = (i) => {
    if (entering && entering.index === i) return 2;
    if (exiting  && exiting.index  === i) return 1;
    if (i === current) return 2;
    return 0;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes orbFloat { 0%,100%{transform:translate(0,0)} 50%{transform:translate(18px,24px)} }

        .about-root {
          --gold: #C9A84C;
          --gold-border: rgba(201,168,76,0.25);
          --dark: #1a1a1a;
          --muted: #6b7280;
          font-family: 'DM Sans', sans-serif;
          background: #faf7f0;
          overflow-x: hidden;
          position: relative;
        }

        .about-bg-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.07) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent);
        }
        .about-bg-vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(240,234,218,0.45) 100%);
        }
        .about-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
        }

        .about-section {
          max-width: 1100px;
          margin: 0 auto;
          padding: 96px 24px;
          position: relative;
          z-index: 1;
        }

        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .rsc-wrap { position: relative; width: 100%; }

        .rsc-shadow {
          border-radius: 22px;
          box-shadow:
            0 24px 56px rgba(0,0,0,0.12),
            0 4px 16px rgba(0,0,0,0.06),
            0 0 0 1px rgba(201,168,76,0.14);
        }

        .rsc-frame {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 20px;
          overflow: hidden;
          background: #e8e0cc;
          isolation: isolate;
        }

        .rsc-border {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          border: 1.5px solid rgba(201,168,76,0.3);
          pointer-events: none;
          z-index: 10;
        }

        .rsc-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          will-change: opacity, transform;
          transition:
            opacity   0.34s cubic-bezier(0.4,0,0.2,1),
            transform 0.34s cubic-bezier(0.4,0,0.2,1);
        }
        .rsc-img--active           { opacity:1; transform:scale(1) translateX(0);     z-index:2; }
        .rsc-img--hidden           { opacity:0; transform:scale(1) translateX(0);     z-index:0; transition:none; }
        .rsc-img--enter-from-right { opacity:0; transform:scale(1.04) translateX(30px); }
        .rsc-img--enter-from-left  { opacity:0; transform:scale(1.04) translateX(-30px); }
        .rsc-img--exit-to-left     { opacity:0; transform:scale(0.97) translateX(-20px); }
        .rsc-img--exit-to-right    { opacity:0; transform:scale(0.97) translateX(20px); }

        .rsc-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 35%,
            rgba(7,12,10,0.45) 70%,
            rgba(7,12,10,0.85) 100%
          );
          z-index: 3;
          pointer-events: none;
        }

        .rsc-label {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 16px 18px 48px;
          z-index: 5;
        }
        .rsc-label-title {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(201,168,76,0.9);
          margin: 0;
        }
        .rsc-label-counter {
          color: rgba(255,255,255,0.45);
          font-size: 12px;
          margin: 3px 0 0;
          font-weight: 300;
        }

        .rsc-dots {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 5px;
          z-index: 6;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 90%;
        }
        .rsc-dot {
          height: 3px;
          border-radius: 3px;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: width 0.3s cubic-bezier(0.4,0,0.2,1), background 0.3s ease;
          background: rgba(255,255,255,0.25);
          width: 8px;
        }
        .rsc-dot.active { width: 28px; background: var(--gold); }

        .rsc-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 7;
          width: 40px; height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.93);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--dark);
          box-shadow: 0 4px 14px rgba(0,0,0,0.14);
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .rsc-btn:hover {
          background: var(--gold);
          color: #fff;
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 6px 20px rgba(201,168,76,0.4);
        }
        .rsc-btn-prev { left: -18px; }
        .rsc-btn-next { right: -18px; }

        .section-label {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .section-label-line { width:36px; height:2px; background:var(--gold); border-radius:2px; }
        .section-label-text {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--gold);
        }
        .section-title {
          font-family: 'Cinzel', serif;
          font-size: clamp(24px, 3.5vw, 40px);
          font-weight: 700;
          color: var(--dark);
          line-height: 1.2;
          margin: 0 0 20px;
        }
        .section-title em { color: var(--gold); font-style: normal; }
        .section-body {
          font-size: 15px;
          color: var(--muted);
          line-height: 1.85;
          margin: 0 0 12px;
        }
        .mv-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 32px;
        }
        .mv-card {
          background: #ffffff;
          border: 1px solid var(--gold-border);
          border-radius: 10px;
          padding: 22px 20px;
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.25s, border-color 0.25s;
          box-shadow: 0 2px 12px rgba(201,168,76,0.06);
        }
        .mv-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--gold);
          border-radius: 10px 10px 0 0;
        }
        .mv-card:hover {
          box-shadow: 0 8px 32px rgba(201,168,76,0.16);
          border-color: rgba(201,168,76,0.45);
        }
        .mv-icon { color: var(--gold); margin-bottom: 12px; }
        .mv-title {
          font-family: 'Cinzel', serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--dark);
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .mv-text { font-size: 12.5px; color: var(--muted); line-height: 1.75; margin: 0; }

        @keyframes aboutFadeUp {
          from { opacity:0; transform:translateY(32px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .about-animate { opacity: 0; }
        .about-animate.in-view { animation: aboutFadeUp 0.75s ease forwards; }
        .about-animate.delay-1 { animation-delay: 0.12s; }

        @media (max-width: 860px) {
          .about-grid { grid-template-columns: 1fr; gap: 52px; }
        }
        @media (max-width: 520px) {
          .about-section { padding: 64px 18px; }
          .mv-grid { grid-template-columns: 1fr; }
          .rsc-btn-prev { left: 6px; }
          .rsc-btn-next { right: 6px; }
        }
      `}</style>

      {/* ✅ id="about" এখানে যোগ করা হয়েছে */}
      <div id="about" className="about-root">

        <div className="about-bg-grid" />
        <div className="about-bg-vignette" />

        <div className="about-orb" style={{
          width:380, height:380,
          background:'radial-gradient(circle,rgba(201,168,76,0.11) 0%,transparent 70%)',
          top:-100, left:-60,
          animation:'orbFloat 13s ease-in-out infinite',
        }} />
        <div className="about-orb" style={{
          width:280, height:280,
          background:'radial-gradient(circle,rgba(201,168,76,0.08) 0%,transparent 70%)',
          bottom:'5%', right:-50,
          animation:'orbFloat 17s ease-in-out infinite reverse',
        }} />
        <div className="about-orb" style={{
          width:200, height:200,
          background:'radial-gradient(circle,rgba(201,168,76,0.07) 0%,transparent 70%)',
          top:'45%', left:'48%',
          animation:'orbFloat 10s ease-in-out infinite',
          animationDelay:'4s',
        }} />

        <section className="about-section">
          <div className="about-grid">

            {/* ── Left: Image Carousel ── */}
            <div
              className="about-animate"
              ref={el => {
                if (!el) return;
                const obs = new IntersectionObserver(
                  ([e]) => { if (e.isIntersecting) { el.classList.add("in-view"); obs.disconnect(); } },
                  { threshold: 0.15 }
                );
                obs.observe(el);
              }}
            >
              <div className="rsc-wrap">
                <div className="rsc-shadow">
                  <div className="rsc-frame">
                    <div className="rsc-border" />

                    {photos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo.src}
                        alt={photo.alt}
                        className={getImgClass(i)}
                        style={{ zIndex: getImgZ(i) }}
                      />
                    ))}

                    <div className="rsc-overlay" />

                    <div className="rsc-label">
                      <p className="rsc-label-title">Our Activities</p>
                      <p className="rsc-label-counter">
                        {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                      </p>
                    </div>

                    <div className="rsc-dots">
                      {photos.map((_, i) => (
                        <button
                          key={i}
                          className={`rsc-dot${i === current ? " active" : ""}`}
                          onClick={() => handleDot(i)}
                          aria-label={`Go to photo ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button className="rsc-btn rsc-btn-prev" onClick={handlePrev} aria-label="Previous">
                  <ChevronLeft size={18} strokeWidth={2} />
                </button>
                <button className="rsc-btn rsc-btn-next" onClick={handleNext} aria-label="Next">
                  <ChevronRight size={18} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* ── Right: Text ── */}
            <div
              className="about-animate delay-1"
              ref={el => {
                if (!el) return;
                const obs = new IntersectionObserver(
                  ([e]) => { if (e.isIntersecting) { el.classList.add("in-view"); obs.disconnect(); } },
                  { threshold: 0.15 }
                );
                obs.observe(el);
              }}
            >
              <div className="section-label">
                <div className="section-label-line" />
                <span className="section-label-text">About Us</span>
              </div>
              <h2 className="section-title">
                Building <em>Leaders</em><br />Through Language
              </h2>
              <p className="section-body">
                The English Language Club (ELC) of Qadirabad Cantonment Sapper
                College was founded with a singular vision — to create a space
                where students could grow beyond textbooks and discover the
                transformative power of effective communication.
              </p>
              <p className="section-body">
                Over the years, ELC has become one of the most vibrant student
                clubs on campus, organizing debates, writing workshops, English
                olympiads, and cultural programs across the region.
              </p>

              <div className="mv-grid">
                <div className="mv-card">
                  <div className="mv-icon"><Target size={22} strokeWidth={1.5} /></div>
                  <div className="mv-title">Our Mission</div>
                  <p className="mv-text">
                    To empower every student with the English skills needed to
                    communicate, lead, and succeed in the modern world.
                  </p>
                </div>
                <div className="mv-card">
                  <div className="mv-icon"><Telescope size={22} strokeWidth={1.5} /></div>
                  <div className="mv-title">Our Vision</div>
                  <p className="mv-text">
                    A Sapper College where every graduate speaks with confidence,
                    writes with clarity, and leads with purpose.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>
    </>
  );
};

export default About;