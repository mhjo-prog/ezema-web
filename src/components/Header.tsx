import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

interface HeaderProps {
  onQuizStart: () => void;
}

const NAV_ITEMS = [
  { label: "사상체질 이야기", path: "/sasang" },
  { label: "Wellness", path: "/wellness" },
  { label: "체질 진단", path: "/quiz", isPrimary: true },
];

export default function Header({ onQuizStart }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const logoColor = ["/sasang", "/wellness"].some((p) =>
    location.pathname.startsWith(p)
  ) ? "#000000" : "#0774C4";

  const handleNavClick = (path: string) => {
    setMenuOpen(false);
    if (path === "/quiz") {
      onQuizStart();
    } else {
      navigate(path);
    }
  };

  return (
    <>
      <motion.header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: "56px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "0 24px",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #f0f0f0",
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Left: empty */}
        <div />

        {/* Center logo */}
        <button
          onClick={() => navigate("/")}
          style={{
            fontWeight: 700,
            fontSize: "1.05rem",
            letterSpacing: "0.12em",
            color: logoColor,
            textTransform: "uppercase",
            userSelect: "none",
            padding: "0 16px",
          }}
        >
          KeepSlow
        </button>

        {/* Right: desktop nav + mobile hamburger */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden md:flex" style={{ alignItems: "center", gap: "4px" }}>
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
              const isPrimary = !!item.isPrimary;
              const accent = logoColor;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: isPrimary ? 600 : 500,
                    color: isPrimary ? accent : isActive ? accent : "#444444",
                    padding: "7px 12px",
                    border: "none",
                    borderBottom: !isPrimary && isActive ? `2px solid ${accent}` : "2px solid transparent",
                    borderRadius: 0,
                    transition: "color 0.18s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = isPrimary ? accent : isActive ? accent : "#444444"; }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Mobile hamburger — hidden on desktop */}
          <button
            className="md:hidden flex flex-col items-center justify-center"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="메뉴"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              gap: "5px",
              width: "36px",
              height: "36px",
            }}
          >
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: "block", width: "20px", height: "2px", background: "#333", borderRadius: "2px" }}
            />
            <motion.span
              animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.15 }}
              style={{ display: "block", width: "20px", height: "2px", background: "#333", borderRadius: "2px" }}
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: "block", width: "20px", height: "2px", background: "#333", borderRadius: "2px" }}
            />
          </button>
        </div>
      </motion.header>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              top: "64px",
              right: "16px",
              zIndex: 49,
              minWidth: "180px",
              background: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
              border: "1px solid #eeeeee",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              transformOrigin: "top right",
            }}
          >
            {NAV_ITEMS.map((item, index) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
              const isPrimary = !!item.isPrimary;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  style={{
                    padding: "14px 20px",
                    textAlign: "left",
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    color: isActive ? logoColor : "#333333",
                    background: "none",
                    border: "none",
                    borderBottom: index < NAV_ITEMS.length - 1 ? "1px solid #f5f5f5" : "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
