export default function Footer() {
  return (
    <footer
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "12px 40px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <a
          href="https://www.instagram.com/keepslow_family/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", opacity: 0.5, transition: "opacity 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.5"; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
                <stop offset="0%" stopColor="#fdf497"/>
                <stop offset="5%" stopColor="#fdf497"/>
                <stop offset="45%" stopColor="#fd5949"/>
                <stop offset="60%" stopColor="#d6249f"/>
                <stop offset="90%" stopColor="#285AEB"/>
              </radialGradient>
            </defs>
            <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)"/>
            <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none"/>
            <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
          </svg>
        </a>
        <p style={{ fontSize: "12px", color: "#ccc", margin: 0 }}>
          © 2026 KeepSlow. All rights reserved.
        </p>
      </div>
      <p style={{ fontSize: "11px", color: "#ccc", margin: 0, textAlign: "center", lineHeight: 1.8, display: "none" }}>
        BigBrown, 606-87-02388<br />
        10F, 437 Teheran-ro, Gangnam-gu, Seoul (Samyoung Building)
      </p>
    </footer>
  );
}
