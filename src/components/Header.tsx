import { motion } from "framer-motion";
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

  const logoColor = ["/sasang", "/wellness"].some((p) =>
    location.pathname.startsWith(p)
  ) ? "#000000" : "#0774C4";

  const handleNavClick = (path: string) => {
    if (path === "/quiz") {
      onQuizStart();
    } else {
      navigate(path);
    }
  };

  return (
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
        padding: "0 32px",
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
          color: "#111111",
          textTransform: "uppercase",
          userSelect: "none",
          padding: "0 16px",
        }}
      >
        KeepSlow
      </button>

      {/* Right nav */}
      <nav style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
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
              onMouseEnter={(e) => {
                e.currentTarget.style.color = accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isPrimary ? accent : isActive ? accent : "#444444";
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </motion.header>
  );
}
