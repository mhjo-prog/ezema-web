import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  onQuizStart: () => void;
}

const NAV_ITEMS = [
  { label: "About", path: "/about" },
  { label: "Wellness", path: "/wellness" },
  { label: "Stories", path: "/sasang" },
  { label: "Test", path: "/test", isPrimary: true },
];


export default function Header({ onQuizStart: _onQuizStart }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, loginWithKakao, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [_isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isSmallMobile, setIsSmallMobile] = useState(() => window.innerWidth <= 480);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmallMobile(window.innerWidth <= 480);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const logoColor = ["/sasang", "/wellness"].some((p) =>
    location.pathname.startsWith(p)
  )
    ? "#000000"
    : "#0774C4";

  const handleNavClick = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleLoginClick = () => {
    setMenuOpen(false);
    loginWithKakao();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Logo — position/size varies by route */}
      {(() => {
        const isLarge = location.pathname === "/" || location.pathname === "/about";
        return (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "fixed",
              top: 0,
              left: isLarge ? 0 : 0,
              right: isLarge ? "auto" : 0,
              width: isLarge ? "auto" : "100%",
              display: isSmallMobile ? "none" : "flex",
              alignItems: "flex-start",
              justifyContent: isLarge ? "flex-start" : "center",
              pointerEvents: "none",
              zIndex: 51,
            }}
          >
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                alignSelf: "center",
                pointerEvents: "auto",
              }}
            >
              <img
                src="/keepslow-logo.png"
                alt="KeepSlow"
                style={{
                  height: isLarge ? "96px" : "52px",
                  width: "auto",
                  display: "block",
                  marginTop: isLarge ? "0px" : "10px",
                  marginLeft: isLarge ? "24px" : "0px",
                }}
              />
            </button>
          </motion.div>
        );
      })()}

      {/* Nav — pill when scrolled */}
      <motion.header
        style={{
          position: "fixed",
          top: isSmallMobile ? 0 : scrolled ? "8px" : 0,
          left: isSmallMobile ? 0 : "auto",
          right: isSmallMobile ? 0 : "16px",
          transform: "none",
          zIndex: 50,
          height: "56px",
          width: isSmallMobile ? "100%" : "auto",
          borderRadius: isSmallMobile ? 0 : scrolled ? "40px" : "0",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: isSmallMobile ? "0 16px" : scrolled ? "4px 12px" : "0 24px",
          marginTop: isSmallMobile ? 0 : scrolled ? "-2px" : "0",
          marginRight: isSmallMobile ? 0 : scrolled ? "12px" : "0",
          transition: "all 0.3s ease",
          background: isSmallMobile ? "transparent" : scrolled ? "rgba(245,245,245,0.95)" : "transparent",
          backdropFilter: isSmallMobile ? "none" : scrolled ? "blur(12px)" : "none",
          boxShadow: isSmallMobile ? "none" : scrolled ? "0 2px 20px rgba(0,0,0,0.08)" : "none",
          borderBottom: "none",
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Right: desktop nav + login + mobile hamburger */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", alignSelf: "center", width: isSmallMobile ? "100%" : "auto", position: isSmallMobile ? "relative" : "static" as const }}>
          {/* Mobile center logo */}
          {isSmallMobile && (
            <button
              onClick={() => navigate("/")}
              style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              <img src="/keepslow-logo.png" alt="KeepSlow" style={{ height: "40px", width: "auto", display: "block" }} />
            </button>
          )}

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden md:flex" style={{ alignItems: "center", gap: "4px" }}>
            {NAV_ITEMS.map((item) => {
              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + "/");
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#000000" : "#444444",
                    padding: "7px 12px",
                    border: "none",
                    borderBottom: "none",
                    borderRadius: 0,
                    transition: "color 0.18s, font-weight 0.18s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#000000";
                    e.currentTarget.style.fontWeight = "700";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = isActive ? "#000000" : "#444444";
                    e.currentTarget.style.fontWeight = isActive ? "700" : "500";
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Mypage button — desktop */}
          {/* <button
            className="hidden md:flex"
            onClick={() => user ? navigate("/mypage") : loginWithKakao()}
            disabled={isLoading}
            style={{
              alignItems: "center",
              fontSize: "0.8125rem",
              fontWeight: location.pathname === "/mypage" ? 700 : 500,
              color: location.pathname === "/mypage" ? "#000000" : "#444444",
              padding: "7px 12px",
              border: "none",
              borderRadius: 0,
              background: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              opacity: isLoading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#000000"; e.currentTarget.style.fontWeight = "700"; }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = location.pathname === "/mypage" ? "#000000" : "#444444";
              e.currentTarget.style.fontWeight = location.pathname === "/mypage" ? "700" : "500";
            }}
          >
            Mypage
          </button> */}

          {/* Translate — desktop */}
          <div className="hidden md:flex" style={{ alignItems: "center" }}>
            <TranslateWidget />
          </div>

          {/* Desktop login/user — hidden on mobile */}
          <div className="hidden md:flex" style={{ alignItems: "center" }}>
            {user ? (
              <button
                onClick={() => navigate("/mypage")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "5px 12px 5px 5px",
                  border: "1px solid #eeeeee",
                  borderRadius: "24px",
                  background: "white",
                  cursor: "pointer",
                  transition: "box-shadow 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
              >
                {user.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt={user.nickname}
                    style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#000000" }}>
                    {user.nickname.charAt(0)}
                  </div>
                )}
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#000000", letterSpacing: "0.01em" }}>
                  Mypage
                </span>
              </button>
            ) : (
              <button
                onClick={handleLoginClick}
                disabled={isLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  background: "#FEE500",
                  border: "none",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#3C1E1E",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                  transition: "opacity 0.15s, transform 0.1s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.currentTarget.style.transform = "scale(1.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {isLoading ? (
                  <span
                    style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid rgba(60,30,30,0.2)",
                      borderTop: "2px solid #3C1E1E",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "ks-spin 0.75s linear infinite",
                    }}
                  />
                ) : (
                  <KakaoIcon />
                )}
                {isLoading ? "로그인 중..." : "Mypage"}
              </button>
            )}
          </div>

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
              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + "/");
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

            {/* Mypage — mobile */}
            {/* <button
              onClick={() => { setMenuOpen(false); user ? navigate("/mypage") : loginWithKakao(); }}
              disabled={isLoading}
              style={{
                padding: "14px 20px",
                textAlign: "left",
                fontSize: "0.9375rem",
                fontWeight: location.pathname === "/mypage" ? 700 : 500,
                color: location.pathname === "/mypage" ? logoColor : "#333333",
                background: "none",
                border: "none",
                borderBottom: "1px solid #f5f5f5",
                cursor: isLoading ? "not-allowed" : "pointer",
                width: "100%",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              Mypage
            </button> */}

            {/* Mobile translate */}
            <div style={{ borderTop: "1px solid #f5f5f5", padding: "8px 12px" }}>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {LANGUAGES.map((lang) => {
                  const isActive = lang.code === getCurrentLang();
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setMenuOpen(false);
                        if (lang.code === getCurrentLang()) return;
                        const expired = "expires=Thu, 01 Jan 1970 00:00:00 UTC";
                        document.cookie = `googtrans=; ${expired}; path=/`;
                        document.cookie = `googtrans=; ${expired}; path=/; domain=.${window.location.hostname}`;
                        document.cookie = `googtrans=; ${expired}; path=/; domain=${window.location.hostname}`;
                        if (lang.code !== "ko") {
                          document.cookie = `googtrans=/ko/${lang.code}; path=/`;
                          document.cookie = `googtrans=/ko/${lang.code}; path=/; domain=.${window.location.hostname}`;
                        }
                        window.location.reload();
                      }}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "20px",
                        border: `1px solid ${isActive ? "#111111" : "#e8e8e8"}`,
                        background: isActive ? "#111111" : "#ffffff",
                        color: isActive ? "#ffffff" : "#444444",
                        fontSize: "0.75rem",
                        fontWeight: isActive ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile login/logout */}
            <div style={{ borderTop: "1px solid #f0f0f0" }}>
              {user ? (
                <>
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/mypage"); }}
                    style={{
                      width: "100%",
                      padding: "14px 20px",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      color: location.pathname === "/mypage" ? "#000000" : "#333333",
                      background: "none",
                      border: "none",
                      borderBottom: "1px solid #f5f5f5",
                      cursor: "pointer",
                    }}
                  >
                    {user.profile_image ? (
                      <img src={user.profile_image} alt={user.nickname} style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#000000" }}>
                        {user.nickname.charAt(0)}
                      </div>
                    )}
                    Mypage
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{ width: "100%", padding: "14px 20px", textAlign: "left", fontSize: "0.875rem", fontWeight: 500, color: "#888", background: "none", border: "none", cursor: "pointer" }}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLoginClick}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "#3C1E1E",
                    background: "#FEE500",
                    border: "none",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  <KakaoIcon />
                  {isLoading ? "로그인 중..." : "Mypage"}
                </button>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <style>{`@keyframes ks-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

const LANGUAGES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh-CN", label: "中文" },
  { code: "th", label: "ภาษาไทย" },
  { code: "vi", label: "Tiếng Việt" },
];

function getCurrentLang(): string {
  const match = document.cookie.match(/googtrans=\/ko\/([^;]+)/);
  return match ? match[1] : "ko";
}

function TranslateWidget() {
  const [open, setOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(getCurrentLang);
  const ref = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const changeLanguage = (code: string) => {
    setOpen(false);
    if (code === currentLang) return;
    // 기존 쿠키를 경로/도메인 모든 변형으로 먼저 삭제
    const expired = "expires=Thu, 01 Jan 1970 00:00:00 UTC";
    document.cookie = `googtrans=; ${expired}; path=/`;
    document.cookie = `googtrans=; ${expired}; path=/; domain=.${window.location.hostname}`;
    document.cookie = `googtrans=; ${expired}; path=/; domain=${window.location.hostname}`;
    if (code !== "ko") {
      document.cookie = `googtrans=/ko/${code}; path=/`;
      document.cookie = `googtrans=/ko/${code}; path=/; domain=.${window.location.hostname}`;
    }
    setCurrentLang(code);
    window.location.reload();
  };

  const isTranslated = currentLang !== "ko";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="언어 선택"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "6px 10px",
          background: isTranslated ? "#111111" : "none",
          border: isTranslated ? "none" : "none",
          borderRadius: "20px",
          cursor: "pointer",
          color: isTranslated ? "#ffffff" : "#444444",
          fontSize: "0.8125rem",
          fontWeight: isTranslated ? 600 : 500,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!isTranslated) e.currentTarget.style.color = "#000000";
        }}
        onMouseLeave={(e) => {
          if (!isTranslated) e.currentTarget.style.color = "#444444";
        }}
      >
        <GlobeIcon color={isTranslated ? "#ffffff" : "currentColor"} />
        {isTranslated && (
          <span>{LANGUAGES.find((l) => l.code === currentLang)?.label}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              background: "#ffffff",
              border: "1px solid #e8e8e8",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
              overflow: "hidden",
              minWidth: "120px",
              zIndex: 200,
              transformOrigin: "top right",
            }}
          >
            {LANGUAGES.map((lang, i) => {
              const isActive = lang.code === currentLang;
              return (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "11px 16px",
                    background: isActive ? "#f5f5f5" : "none",
                    border: "none",
                    borderBottom: i < LANGUAGES.length - 1 ? "1px solid #f5f5f5" : "none",
                    fontSize: "0.8125rem",
                    fontWeight: isActive ? 700 : 500,
                    color: "#111111",
                    cursor: "pointer",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#f9f9f9"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "none"; }}
                >
                  {lang.label}
                  {isActive && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: "8px", flexShrink: 0 }}>
                      <path d="M2 6l3 3 5-5" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GlobeIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3C7.03 3 3 6.36 3 10.5c0 2.64 1.64 4.97 4.13 6.34L6.07 20.5a.5.5 0 0 0 .72.55l4.44-2.96A10.9 10.9 0 0 0 12 18c4.97 0 9-3.36 9-7.5S16.97 3 12 3z"
        fill="#3C1E1E"
      />
    </svg>
  );
}
