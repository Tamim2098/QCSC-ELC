import collegeBg from "../assets/college.jpg";

const Hero = () => {
  const handleExploreClick = () => {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      const navbarHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--navbar-height') || '56'
      );
      const top = aboutSection.getBoundingClientRect().top + window.scrollY - navbarHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .hero-section {
          position: relative;
          width: 100%;
          height: calc(100vh - var(--navbar-height, 56px));
          min-height: 520px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background-color: #0a0c14;
        }

        .hero-bg {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: center center;
          display: block;
          z-index: 0;
        }

        .hero-overlay {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: linear-gradient(
            to bottom,
            rgba(10, 12, 20, 0.40) 0%,
            rgba(10, 12, 20, 0.62) 45%,
            rgba(10, 12, 20, 0.85) 100%
          );
          z-index: 1;
        }

        .hero-content {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 0 20px;
          max-width: 860px;
          width: 100%;
          opacity: 0;
          animation: heroFadeUp 0.9s ease 0.5s forwards;
        }

        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(201, 168, 76, 0.12);
          border: 1px solid rgba(201, 168, 76, 0.40);
          border-radius: 50px;
          padding: 7px 18px;
          margin-bottom: 28px;
        }
        .hero-badge-dot {
          width: 6px; height: 6px;
          background: #C9A84C;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        .hero-badge-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #C9A84C;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }

        .hero-tagline {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #C9A84C;
          margin-bottom: 16px;
        }

        .hero-title {
          font-family: 'Cinzel', serif;
          font-size: clamp(30px, 5.5vw, 62px);
          font-weight: 700;
          color: #ffffff;
          line-height: 1.15;
          letter-spacing: 0.04em;
          margin-bottom: 10px;
        }
        .hero-title-gold { color: #C9A84C; }

        .hero-divider {
          width: 64px; height: 2px;
          background: #C9A84C;
          margin: 22px auto;
          border-radius: 2px;
        }

        .hero-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(14px, 2vw, 17px);
          font-weight: 300;
          color: rgba(255,255,255,0.72);
          line-height: 1.75;
          max-width: 580px;
          margin: 0 auto 40px;
          letter-spacing: 0.02em;
        }

        .hero-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .btn-primary {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          color: #ffffff;
          background: #C9A84C;
          padding: 13px 32px;
          border-radius: 6px;
          transition: all 0.22s;
          box-shadow: 0 4px 20px rgba(201,168,76,0.35);
          white-space: nowrap;
          display: inline-block;
        }
        .btn-primary:hover {
          background: #b8923d;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(201,168,76,0.45);
          color: #ffffff;
        }

        .btn-secondary {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #ffffff;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.30);
          padding: 12px 30px;
          border-radius: 6px;
          transition: all 0.22s;
          white-space: nowrap;
          display: inline-block;
          cursor: pointer;
        }
        .btn-secondary:hover {
          border-color: rgba(255,255,255,0.65);
          background: rgba(255,255,255,0.07);
          color: #ffffff;
        }

        .hero-scroll {
          position: absolute;
          bottom: 36px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          opacity: 0;
          animation: heroFadeUp 0.9s ease 1.1s forwards;
        }
        .scroll-line {
          width: 1px; height: 40px;
          background: linear-gradient(to bottom, rgba(201,168,76,0.6), transparent);
          animation: scrollPulse 1.8s ease infinite;
        }
        .scroll-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(201,168,76,0.55);
          writing-mode: vertical-rl;
          transform: rotate(180deg);
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.5; transform: scaleY(1); }
          50%       { opacity: 1;   transform: scaleY(1.12); }
        }

        @media (max-width: 640px) {
          .hero-section { height: calc(100svh - var(--navbar-height, 56px)); }
          .hero-scroll  { display: none; }
        }
      `}</style>

      <section className="hero-section">
        <img src={collegeBg} alt="" className="hero-bg" />
        <div className="hero-overlay" />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            <span className="hero-badge-text">Est. Qadirabad Cantonment</span>
          </div>

          <p className="hero-tagline">Sapper College | English Language Club</p>

          <h1 className="hero-title">
            Speak with <span className="hero-title-gold">Confidence.</span>
            <br />
            Lead with <span className="hero-title-gold">Language.</span>
          </h1>

          <div className="hero-divider" />

          <p className="hero-subtitle">
            The English Language Club of Sapper College empowers students to master
            communication, build leadership, and connect with the world through
            the power of language.
          </p>

          <div className="hero-buttons">
            <a href="/join" className="btn-primary">Join ELC</a>
            <button onClick={handleExploreClick} className="btn-secondary">Explore More</button>
          </div>
        </div>

        <div className="hero-scroll">
          <span className="scroll-text">Scroll</span>
          <div className="scroll-line" />
        </div>
      </section>
    </>
  );
};

export default Hero;