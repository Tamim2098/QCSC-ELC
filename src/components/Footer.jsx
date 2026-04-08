import React, { useState, useEffect } from 'react';

const Footer = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const year = new Date().getFullYear();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .footer-root * { box-sizing: border-box; margin: 0; padding: 0; }

        .footer-wrap {
          position: relative;
          background: #faf7f0; /* Light theme background */
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          border-top: 1px solid rgba(201, 168, 76, 0.2); /* Subtle gold border on top */
        }

        /* Subtle grid bg for light theme */
        .footer-grid-bg {
          position: absolute; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: radial-gradient(ellipse 80% 100% at 50% 100%, black 10%, transparent 100%);
        }

        /* Light theme orb */
        .footer-orb {
          position: absolute;
          width: 220px; height: 220px; border-radius: 50%;
          background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%);
          bottom: -60px; left: 50%; transform: translateX(-50%);
          filter: blur(50px); z-index: 0;
        }

        .footer-inner {
          position: relative; z-index: 10;
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 24px 20px; /* Adjusted padding */
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        /* divider with diamond */
        .footer-divider {
          display: flex; align-items: center; gap: 10px;
          width: 100%; max-width: 300px;
        }
        .footer-div-line {
          flex: 1; height: 1px;
          background: linear-gradient(to right, transparent, rgba(201,168,76,0.3));
        }
        .footer-div-line.rev {
          background: linear-gradient(to left, transparent, rgba(201,168,76,0.3));
        }
        .footer-diamond {
          color: #C9A84C;
          font-size: 10px;
          line-height: 1;
        }

        /* copyright text */
        .footer-copy {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: rgba(0,0,0,0.6); /* Darker text for light bg */
          letter-spacing: 0.1em;
          text-align: center;
          text-transform: uppercase;
        }

        /* reveal */
        .footer-reveal {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .footer-reveal.show {
          opacity: 1;
          transform: translateY(0);
        }
        .fd1 { transition-delay: 0.1s; }
        .fd2 { transition-delay: 0.22s; }
      `}</style>

      <div className="footer-root">
        <div className="footer-wrap">
          <div className="footer-grid-bg" />
          <div className="footer-orb" />

          <div className="footer-inner">

            <div className={`footer-reveal fd1 ${isVisible ? 'show' : ''}`}>
              <div className="footer-divider">
                <div className="footer-div-line rev" />
                <span className="footer-diamond">⬧</span>
                <div className="footer-div-line" />
              </div>
            </div>

            <p className={`footer-copy footer-reveal fd2 ${isVisible ? 'show' : ''}`}>
              © {year} · English Language Club · Sapper College
            </p>

          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;