import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/elc-logo.png";

export const NAVBAR_HEIGHT = 56;

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState(location.pathname);

  // অন্য পেজ থেকে About এ আসার পর স্মুথ স্ক্রল করার লজিক
  useEffect(() => {
    if (location.pathname === "/" && location.state?.scrollTo === "about") {
      // 300ms অপেক্ষা করবে যাতে ইউজার প্রথমে Hero সেকশন দেখতে পারে, তারপর স্ক্রল হবে
      const timer = setTimeout(() => {
        const aboutSection = document.getElementById("about");
        if (aboutSection) {
          const top = aboutSection.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
          window.scrollTo({ top, behavior: 'smooth' });
        }
        // স্ক্রল হয়ে গেলে রাউট স্টেট ক্লিয়ার করা, যাতে রিলোড দিলে আবার স্ক্রল না হয়
        navigate("/", { replace: true, state: {} });
      }, 300); 

      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  // রাউট পরিবর্তন হলে Active লিংক আপডেট করা
  useEffect(() => {
    if (location.pathname !== "/") {
      setActivePath(location.pathname);
    }
  }, [location.pathname]);

  // Scroll Spy: স্ক্রল করার সময় Home এবং About এর Active স্টেট চেক করা
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      if (location.pathname === "/") {
        const aboutSection = document.getElementById("about");
        if (aboutSection) {
          const rect = aboutSection.getBoundingClientRect();
          // যদি About সেকশন স্ক্রিনের মাঝামাঝি চলে আসে
          if (rect.top <= window.innerHeight * 0.6) {
            setActivePath("/about");
          } else {
            setActivePath("/");
          }
        } else {
          setActivePath("/");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const navLinks = [
    { label: "Home",    to: "/" },
    { label: "About",   to: "/about" },
    { label: "Members", to: "/members" },
    { label: "Gallery", to: "/gallery" },
    { label: "Contact", to: "/contact" },
  ];

  // যেকোনো লিংকে ক্লিক করার ফাংশন
  const handleNavClick = (e, label, to) => {
    if (label === "About") {
      e.preventDefault();
      if (location.pathname === "/") {
        // হোম পেজেই থাকলে সরাসরি স্ক্রল করবে
        const aboutSection = document.getElementById("about");
        if (aboutSection) {
          const top = aboutSection.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      } else {
        // অন্য পেজে থাকলে Home পেজে যাবে এবং স্টেট হিসেবে 'about' পাঠাবে
        navigate("/", { state: { scrollTo: "about" } });
      }
    } else if (label === "Home") {
      if (location.pathname === "/") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // অন্য কোনো পেজে গেলে একদম উপরে স্ক্রল করে রাখবে
      if (location.pathname !== to) {
        window.scrollTo(0, 0);
      }
    }
    setMenuOpen(false); // ক্লিক করলে মোবাইল মেনু বন্ধ হবে
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

        :root { --navbar-height: ${NAVBAR_HEIGHT}px; }

        @keyframes navSlideDown {
          from { transform: translateY(-100%); }
          to   { transform: translateY(0); }
        }
        .elc-nav-inner {
          animation: navSlideDown 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transition: box-shadow 0.35s ease;
        }
        .elc-nav-inner.scrolled {
          box-shadow: 0 4px 28px rgba(0,0,0,0.10);
        }

        @keyframes logoFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .elc-logo {
          animation: logoFadeUp 0.5s ease 0.4s forwards;
          opacity: 0;
        }

        @keyframes linkFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .elc-desktop-links > *:nth-child(1) { animation: linkFadeUp 0.4s ease 0.42s forwards; opacity: 0; }
        .elc-desktop-links > *:nth-child(2) { animation: linkFadeUp 0.4s ease 0.48s forwards; opacity: 0; }
        .elc-desktop-links > *:nth-child(3) { animation: linkFadeUp 0.4s ease 0.54s forwards; opacity: 0; }
        .elc-desktop-links > *:nth-child(4) { animation: linkFadeUp 0.4s ease 0.60s forwards; opacity: 0; }
        .elc-desktop-links > *:nth-child(5) { animation: linkFadeUp 0.4s ease 0.66s forwards; opacity: 0; }
        .elc-desktop-links > *:nth-child(6) { animation: linkFadeUp 0.4s ease 0.72s forwards; opacity: 0; }
        .elc-desktop-links > *:nth-child(7) { animation: linkFadeUp 0.4s ease 0.78s forwards; opacity: 0; }
        .elc-desktop-links > *:nth-child(8) { animation: linkFadeUp 0.4s ease 0.84s forwards; opacity: 0; }
        .elc-desktop-links > *:nth-child(9) { animation: linkFadeUp 0.4s ease 0.90s forwards; opacity: 0; }

        /* Nav link underline hover & active state */
        .elc-link {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          color: #3d3d3d;
          padding: 5px 10px;
          position: relative;
          white-space: nowrap;
          transition: color 0.2s;
        }
        .elc-link::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 10px; right: 10px;
          height: 2px;
          background: #C9A84C;
          border-radius: 2px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.25s ease;
        }
        .elc-link:hover, .elc-link.active { color: #C9A84C; }
        .elc-link:hover::after, .elc-link.active::after { transform: scaleX(1); }

        /* Join Button */
        .elc-join {
          font-family: 'Cinzel', serif;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-decoration: none;
          color: #fff;
          background: #C9A84C;
          padding: 7px 18px;
          border-radius: 6px;
          white-space: nowrap;
          display: inline-block;
          box-shadow: 0 4px 20px rgba(201,168,76,0.35);
          transition: all 0.22s;
        }
        .elc-join:hover {
          background: #b8923d;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(201,168,76,0.45);
        }
        .elc-join:active { transform: translateY(0); }

        /* Mobile backdrop */
        @keyframes backdropFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .elc-backdrop {
          position: fixed;
          inset: 0;
          top: ${NAVBAR_HEIGHT}px;
          background: rgba(0,0,0,0.32);
          z-index: 48;
          animation: backdropFade 0.25s ease forwards;
          cursor: pointer;
        }

        /* Mobile menu */
        @keyframes menuSlideDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .elc-mobile-menu {
          position: fixed;
          top: ${NAVBAR_HEIGHT}px;
          left: 0;
          right: 0;
          z-index: 49;
          background: #fff;
          border-top: 2px solid #C9A84C;
          box-shadow: 0 16px 48px rgba(0,0,0,0.14);
          padding: 8px 20px 22px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          animation: menuSlideDown 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        /* Mobile links */
        @keyframes mobileFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .elc-mobile-link {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #3d3d3d;
          text-decoration: none;
          padding: 13px 0;
          border-bottom: 1px solid #f0ebe0;
          opacity: 0;
          transition: color 0.2s, padding-left 0.22s ease;
          animation: mobileFadeUp 0.4s ease forwards;
        }
        .elc-mobile-link:nth-child(1) { animation-delay: 0.08s; }
        .elc-mobile-link:nth-child(2) { animation-delay: 0.14s; }
        .elc-mobile-link:nth-child(3) { animation-delay: 0.20s; }
        .elc-mobile-link:nth-child(4) { animation-delay: 0.26s; }
        .elc-mobile-link:nth-child(5) { animation-delay: 0.32s; }
        .elc-mobile-link:nth-child(6) { animation-delay: 0.38s; }
        .elc-mobile-link:nth-child(7) { animation-delay: 0.44s; }
        
        .elc-mobile-link:hover, .elc-mobile-link.active { 
          color: #C9A84C; 
          padding-left: 8px; 
        }

        .elc-mobile-join-wrap {
          opacity: 0;
          animation: mobileFadeUp 0.4s ease 0.50s forwards;
        }

        /* Responsive */
        .elc-hamburger     { display: none !important; }
        .elc-desktop-links { display: flex !important; }

        @media (max-width: 1023px) {
          .elc-desktop-links { display: none !important; }
          .elc-hamburger     { display: flex !important; }
        }
      `}</style>

      <header style={{
        width: "100%",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <nav>
          <div
            className={`elc-nav-inner${scrolled ? " scrolled" : ""}`}
            style={{ background: "#ffffff", borderBottom: "1px solid #ede8da" }}
          >
            <div style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "0 18px",
              height: NAVBAR_HEIGHT,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxSizing: "border-box",
            }}>

              {/* Logo */}
              <Link to="/" className="elc-logo" onClick={(e) => handleNavClick(e, "Home", "/")} style={{
                display: "flex", alignItems: "center", gap: 10,
                textDecoration: "none", flexShrink: 0,
              }}>
                <img src={logo} alt="ELC Logo"
                  style={{ width: 38, height: 38, objectFit: "contain" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{
                    fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700,
                    color: "#1a1a1a", letterSpacing: "0.06em", lineHeight: 1, whiteSpace: "nowrap",
                  }}>English Language Club</span>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 8, color: "#C9A84C",
                    letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, whiteSpace: "nowrap",
                  }}>Sapper College | Qadirabad Cantonment</span>
                </div>
              </Link>

              {/* Desktop Links */}
              <div className="elc-desktop-links" style={{ alignItems: "center", gap: 0 }}>
                {navLinks.map(({ label, to }) => (
                  <Link
                    key={label} 
                    to={to}
                    onClick={(e) => handleNavClick(e, label, to)}
                    className={`elc-link${activePath === to ? " active" : ""}`}
                  >
                    {label}
                  </Link>
                ))}
                <div style={{
                  width: 1, height: 18, background: "#e0d8c8",
                  margin: "0 12px", flexShrink: 0,
                }} />
                <Link to="/join" className="elc-join">Join ELC</Link>
              </div>

              {/* Hamburger */}
              <button
                className="elc-hamburger"
                onClick={() => setMenuOpen(prev => !prev)}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: 8,
                  flexDirection: "column", gap: 5, alignItems: "center", justifyContent: "center",
                }}
                aria-label="Toggle menu"
              >
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    display: "block", width: 22, height: 2,
                    background: menuOpen ? "#C9A84C" : "#3d3d3d",
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    transform: menuOpen
                      ? i === 0 ? "rotate(45deg) translate(5px, 5px)"
                      : i === 2 ? "rotate(-45deg) translate(5px, -5px)"
                      : "none"
                      : "none",
                    opacity: menuOpen && i === 1 ? 0 : 1,
                  }} />
                ))}
              </button>

            </div>
          </div>

          {/* Mobile Backdrop */}
          {menuOpen && (
            <div className="elc-backdrop" onClick={() => setMenuOpen(false)} />
          )}

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="elc-mobile-menu">
              {navLinks.map(({ label, to }) => (
                <Link
                  key={label} 
                  to={to}
                  onClick={(e) => handleNavClick(e, label, to)}
                  className={`elc-mobile-link${activePath === to ? " active" : ""}`}
                >
                  {label}
                </Link>
              ))}
              <div className="elc-mobile-join-wrap">
                <Link
                  to="/join"
                  onClick={() => setMenuOpen(false)}
                  className="elc-join"
                  style={{ display: "block", textAlign: "center", marginTop: 16 }}
                >Join ELC</Link>
              </div>
            </div>
          )}

        </nav>
      </header>
    </>
  );
};

export default Navbar;