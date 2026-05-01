import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────
   MOTION HOOK — respects prefers-reduced-motion
───────────────────────────────────────── */
const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = (e) => setReduced(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return reduced;
};

/* ─────────────────────────────────────────
   INTERSECTION OBSERVER HOOK
───────────────────────────────────────── */
const useInView = (threshold = 0.1) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

/* ─────────────────────────────────────────
   REVEAL COMPONENT
───────────────────────────────────────── */
const Reveal = ({ children, delay = 0, y = 28, x = 0, scale = 1, className = "" }) => {
  const [ref, inView] = useInView(0.08);
  const reduced = usePrefersReducedMotion();
  const active = inView || reduced;
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "none" : `translateY(${y}px) translateX(${x}px) scale(${scale})`,
        transition: reduced ? "none" : `opacity .7s ${delay}ms cubic-bezier(.22,1,.36,1), transform .7s ${delay}ms cubic-bezier(.22,1,.36,1)`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
};

/* ─────────────────────────────────────────
   STAGGER WRAPPER — animates children in sequence
───────────────────────────────────────── */
const Stagger = ({ children, baseDelay = 0, step = 80 }) => {
  const reduced = usePrefersReducedMotion();
  return (
    <>
      {Array.isArray(children)
        ? children.map((child, i) =>
            <Reveal key={i} delay={reduced ? 0 : baseDelay + i * step}>{child}</Reveal>
          )
        : <Reveal delay={baseDelay}>{children}</Reveal>
      }
    </>
  );
};

/* ─────────────────────────────────────────
   SMOOTH SCROLL HELPER
───────────────────────────────────────── */
const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

/* ─────────────────────────────────────────
   CUSTOM SVG COMPONENTS
───────────────────────────────────────── */

// Shield logo mark with hexagon frame
const ShieldMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#1c1c1c" />
    <path d="M16 6L7 10v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12v-6l-9-4z" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M13 16l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Decorative hexagonal grid background accent
const HexGrid = ({ width = 420, height = 320, opacity = 0.045 }) => {
  const hexes = [];
  const R = 28, dx = R * 1.732, dy = R * 1.5;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 10; col++) {
      const x = col * dx + (row % 2 === 0 ? 0 : dx / 2);
      const y = row * dy;
      const pts = Array.from({ length: 6 }, (_, k) => {
        const a = (Math.PI / 3) * k - Math.PI / 6;
        return `${x + R * Math.cos(a)},${y + R * Math.sin(a)}`;
      }).join(" ");
      hexes.push(<polygon key={`${row}-${col}`} points={pts} fill="none" stroke="#1c1c1c" strokeWidth="0.8" />);
    }
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ opacity }}>
      {hexes}
    </svg>
  );
};

// Animated scanning beam illustration for hero
const ScanIllustration = () => (
  <svg width="480" height="340" viewBox="0 0 480 340" fill="none" aria-hidden="true">
    {/* Background card */}
    <rect x="60" y="40" width="360" height="260" rx="16" fill="#fff" stroke="#E8E4DB" strokeWidth="1.5" />
    {/* Inner card sections */}
    <rect x="84" y="68" width="180" height="12" rx="4" fill="#F3F1EC" />
    <rect x="84" y="88" width="120" height="8" rx="3" fill="#EAE7E0" />
    <rect x="84" y="116" width="312" height="1" fill="#EDEAD4" />
    {/* Wallet row */}
    <circle cx="102" cy="145" r="14" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1" />
    <path d="M97 145h10M102 140v10" stroke="#0369a1" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="124" y="138" width="100" height="8" rx="3" fill="#EAE7E0" />
    <rect x="124" y="150" width="68" height="6" rx="2.5" fill="#F3F1EC" />
    {/* Transaction amount */}
    <rect x="320" y="138" width="56" height="16" rx="5" fill="#FEF2F2" />
    <rect x="328" y="142" width="40" height="8" rx="2" fill="#FECACA" />
    {/* Code lines */}
    <rect x="84" y="175" width="60" height="7" rx="2.5" fill="#E0F2FE" />
    <rect x="152" y="175" width="100" height="7" rx="2.5" fill="#F3F1EC" />
    <rect x="84" y="190" width="40" height="7" rx="2.5" fill="#DCF7E9" />
    <rect x="132" y="190" width="72" height="7" rx="2.5" fill="#F3F1EC" />
    <rect x="212" y="190" width="48" height="7" rx="2.5" fill="#FEF3C7" />
    <rect x="84" y="205" width="80" height="7" rx="2.5" fill="#F3E8FF" />
    <rect x="172" y="205" width="56" height="7" rx="2.5" fill="#F3F1EC" />
    {/* Scan line — animates via CSS */}
    <line x1="60" y1="160" x2="420" y2="160" stroke="#1c1c1c" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.15" className="scan-line" />
    {/* Shield badge overlay */}
    <rect x="148" y="240" width="184" height="42" rx="12" fill="#fff" stroke="#E8E4DB" strokeWidth="1.5" />
    <circle cx="172" cy="261" r="10" fill="#F0FDF4" />
    <path d="M172 254l-5 2.5v3.5c0 3 2.2 5.8 5 6.5 2.8-.7 5-3.5 5-6.5v-3.5l-5-2.5z" fill="none" stroke="#16a34a" strokeWidth="1.3" strokeLinejoin="round" />
    <rect x="190" y="254" width="78" height="7" rx="2.5" fill="#DCFCE7" />
    <rect x="190" y="265" width="52" height="6" rx="2" fill="#EAE7E0" />
    {/* Green check circle */}
    <circle cx="310" cy="261" r="10" fill="#DCFCE7" />
    <path d="M306 261l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Corner accent dots */}
    <circle cx="76" cy="56" r="3" fill="#E8E4DB" />
    <circle cx="404" cy="56" r="3" fill="#E8E4DB" />
    <circle cx="76" cy="284" r="3" fill="#E8E4DB" />
    <circle cx="404" cy="284" r="3" fill="#E8E4DB" />
  </svg>
);

// Pipeline flow diagram for engine section
const PipelineFlow = () => (
  <svg width="100%" viewBox="0 0 760 80" fill="none" aria-label="Transaction security pipeline" style={{ overflow: "visible" }}>
    {["Intercept", "Simulate EVM", "Heuristics", "GoPlus API", "Verdict"].map((label, i) => {
      const x = i * 160 + 40;
      const isLast = i === 4;
      return (
        <g key={i}>
          <rect x={x} y="16" width="120" height="48" rx="10"
            fill={isLast ? "#1c1c1c" : "#fff"}
            stroke={isLast ? "#1c1c1c" : "#E8E4DB"} strokeWidth="1.5" />
          <text x={x + 60} y="43" textAnchor="middle"
            fontSize="12" fontFamily="Outfit, sans-serif" fontWeight="600"
            fill={isLast ? "#fff" : "#333"}>
            {label}
          </text>
          {!isLast && (
            <>
              <line x1={x + 120} y1="40" x2={x + 155} y2="40" stroke="#D0CCC3" strokeWidth="1.5" strokeDasharray="3 2" />
              <polygon points={`${x + 154},36 ${x + 160},40 ${x + 154},44`} fill="#D0CCC3" />
            </>
          )}
        </g>
      );
    })}
  </svg>
);

// Waveform / threat activity SVG accent
const ThreatWave = () => (
  <svg width="100%" height="48" viewBox="0 0 800 48" preserveAspectRatio="none" aria-hidden="true">
    <polyline
      points="0,36 40,28 80,38 120,20 160,34 200,14 240,30 280,8 320,26 360,40 400,18 440,32 480,10 520,28 560,38 600,16 640,30 680,22 720,36 760,14 800,28"
      fill="none" stroke="#E8E4DB" strokeWidth="1.5" strokeLinejoin="round" />
    <polyline
      points="0,40 40,32 80,42 120,24 160,38 200,18 240,34 280,12 320,30 360,44 400,22 440,36 480,14 520,32 560,42 600,20 640,34 680,26 720,40 760,18 800,32"
      fill="none" stroke="#F0EDE6" strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

// Section divider with subtle wave
const WaveDivider = ({ flip = false }) => (
  <div style={{ overflow: "hidden", lineHeight: 0, transform: flip ? "scaleY(-1)" : "none" }}>
    <svg viewBox="0 0 1440 28" preserveAspectRatio="none" style={{ width: "100%", height: 28, display: "block" }}>
      <path d="M0,14 C240,28 480,0 720,14 C960,28 1200,0 1440,14 L1440,28 L0,28 Z" fill="#F0EDE6" />
    </svg>
  </div>
);

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const articles = [
  {
    tag: "Incident Report", tagColor: "#b91c1c", tagBg: "#fef2f2",
    date: "July 18, 2024", readTime: "8 min read",
    title: "WazirX Blind Sign Exploit — $235M Lost to a Payload Discrepancy",
    summary: "Attackers created a deliberate mismatch between what WazirX's custody UI displayed and the actual EVM payload users were authorizing. Users believed they were signing routine transactions. The raw bytes told a completely different story — one that drained $235 million from the exchange's multisig wallet.",
    defense: "ChainGuardian's Simulation Sandbox ignores the frontend entirely and simulates the raw EVM payload directly. The discrepancy between the displayed transaction and the actual bytes would have been flagged before the confirmation dialog appeared — giving users a clear warning that what they saw was not what they were signing.",
    loss: "$235,000,000", vector: "Blind Signing / Payload Spoofing",
    link: "https://en.wikipedia.org/wiki/2024_WazirX_hack", linkLabel: "Wikipedia Report",
  },
  {
    tag: "Threat Analysis", tagColor: "#92400e", tagBg: "#fffbeb",
    date: "Annual Report · 2023–2024", readTime: "12 min read",
    title: "Inferno & Pink Drainers — $300M Stolen Through Phishing Infrastructure",
    summary: "Two professional drainer-as-a-service operations ran coordinated phishing campaigns across Twitter, Discord, and paid ad networks. Victims landed on pixel-perfect copies of Uniswap, OpenSea, and Blur — with one invisible difference: the contract addresses pointed to drainer contracts loaded with obfuscated malicious opcodes.",
    defense: "Zero-Day Phishing Domain mapping catches typosquatted domains before the page loads, using Levenshtein distance scoring against our registry of verified dApps. EVM Bytecode Heuristic Scanning then flags obfuscated malicious logic in the connected contract — even when it's buried inside DELEGATECALL chains designed to hide it.",
    loss: "$300,000,000+", vector: "Phishing / Malicious Smart Contract",
    link: "https://www.chainalysis.com/blog/2023-crypto-scams-phishing/", linkLabel: "Chainalysis Report",
  },
  {
    tag: "Post-Mortem", tagColor: "#5b21b6", tagBg: "#f5f3ff",
    date: "December 2, 2021", readTime: "6 min read",
    title: "BadgerDAO Frontend Hijack — $120M Through Unlimited Token Approvals",
    summary: "Attackers injected a malicious script into BadgerDAO's Cloudflare account, serving a compromised frontend to all visitors. The script silently appended additional spend approvals — set to uint256.max — onto legitimate transactions. Users confirmed what looked normal in their wallets. They weren't looking at the same thing we were.",
    defense: "ChainGuardian's payload interception operates independently of the webpage interface. It reads the transaction object directly from the wallet provider API. Any approval set to uint256.max triggers an immediate block and a plain-English explanation, regardless of what the UI showed. The BadgerDAO attack would have been stopped on the first affected transaction.",
    loss: "$120,000,000", vector: "Frontend Injection / Unlimited Approval",
    link: "https://rekt.news/badger-rekt/", linkLabel: "Full Post-Mortem on Rekt",
  },
  {
    tag: "Rug Pull Analysis", tagColor: "#075985", tagBg: "#f0f9ff",
    date: "2024", readTime: "5 min read",
    title: "Froggy Coin — How Whale Concentration Predicted the Collapse",
    summary: "Froggy Coin followed a textbook rug pattern: aggressive social media hype, coordinated influencer posts, and a token structure where the development team silently held 94% of supply across a handful of wallets. When the FOMO peak arrived, they drained the liquidity pool completely. The token lost 99.95% of its value in minutes.",
    defense: "Slither Static Analysis would have flagged abnormal mint privileges coded into the contract on deployment. Real-time Whale Concentration mapping would have displayed the supply distribution — 94% held in 3 wallets — as a risk warning before the first dollar entered the liquidity pool. The data was always there. Nobody was looking at it.",
    loss: "99.95% collapse", vector: "Rug Pull / Liquidity Drain",
    link: "https://crypto.news/biggest-crypto-rug-pulls/", linkLabel: "Full Case Study",
  },
  {
    tag: "Honeypot Dissection", tagColor: "#065f46", tagBg: "#ecfdf5",
    date: "November 1, 2021", readTime: "7 min read",
    title: "Squid Game ($SQUID) — A Honeypot Hidden in Plain Bytecode",
    summary: "The $SQUID token launched on Netflix series hype and gained 75,000% in days. There was one thing coded directly into the contract that nobody checked: buyers could not sell. A hidden transfer restriction function blocked all outgoing transactions for non-whitelisted addresses. Developers walked away with $3.3M. Holders were left with worthless tokens and no recourse.",
    defense: "GoPlus Security API integration checks is_honeypot, cannot_sell_all, and hidden_owner parameters in real time against every token before a swap is constructed. The $SQUID contract would have returned positive flags on all three. The transaction would have been blocked before it ever reached the mempool.",
    loss: "$3,300,000", vector: "Honeypot / Hidden Sell Restriction",
    link: "https://www.wired.com/story/squid-game-coin-crypto-scam/", linkLabel: "Wired Investigation",
  },
];

const layers = [
  { num: "01", title: "Zero-Day Phishing Defense", detail: "Levenshtein distance algorithm checks every domain against our verified registry of known dApps. A two-character typo in a URL gets caught before the page renders." },
  { num: "02", title: "EVM Bytecode Heuristic Scanner", detail: "We read raw opcodes before the ABI decodes them. Obfuscated DELEGATECALL chains, self-destructing proxies, and hidden fallback functions are flagged regardless of what the frontend shows." },
  { num: "03", title: "GoPlus Token Security API", detail: "Real-time checks for is_honeypot, cannot_sell_all, hidden_owner, and 20+ other risk parameters on every token — executed before your swap hits the mempool." },
  { num: "04", title: "Unlimited Approval Detection", detail: "Any allowance set to uint256.max triggers an immediate block. We explain exactly what the approval would have allowed, in plain language, not hex." },
  { num: "05", title: "Whale Concentration Mapping", detail: "Live on-chain supply distribution analysis before you buy. If three wallets hold 80% of a token's supply, you see that number before you sign." },
  { num: "06", title: "Slither Static Analysis", detail: "Industry-standard Ethereum contract vulnerability scanner integrated into your signing flow. Reentrancy, integer overflow, dangerous delegatecall — all checked." },
  { num: "07", title: "Verified Protocol Registry Bypass", detail: "Known-safe dApps — Uniswap, Aave, Compound, 1inch — skip the scan entirely. Zero added latency when the destination is already verified and trusted." },
  { num: "08", title: "Multilingual Alert System", detail: "Security warnings in Hindi, English, Bengali, Tamil, and Telugu. Protection that only works in English isn't protection for most of the people who need it most." },
];

/* ─────────────────────────────────────────
   EXTERNAL LINK ICON
───────────────────────────────────────── */
const ExternalIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2.5 9.5l7-7M4 2.5h5.5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ─────────────────────────────────────────
   ARTICLE CARD COMPONENT
───────────────────────────────────────── */
const ArticleCard = ({ a, i, expanded, setExpanded }) => {
  const isOpen = expanded === i;
  const defenseRef = useRef(null);
  const [defH, setDefH] = useState(0);

  useEffect(() => {
    if (defenseRef.current) setDefH(defenseRef.current.scrollHeight);
  }, [isOpen]);

  return (
    <div className="card" style={{ position: "relative" }}>
      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 20, bottom: 20, width: 3,
        background: a.tagColor, borderRadius: "0 2px 2px 0",
        opacity: 0.3,
        transition: "opacity .2s",
      }} className="card-accent" />

      <div style={{ padding: "28px 34px 26px 40px" }}>
        {/* Meta row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="tag" style={{ color: a.tagColor, background: a.tagBg }}>{a.tag}</span>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "#BBB", fontWeight: 500 }}>
              {a.date} · {a.readTime}
            </span>
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <span className="pill-loss">▼ {a.loss}</span>
            <span className="pill-vec">{a.vector}</span>
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: "'Lora',serif", fontSize: "clamp(17px,2vw,21px)",
          fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.35,
          color: "#111", marginBottom: 14,
        }}>
          {a.title}
        </h3>

        {/* Summary */}
        <p style={{ fontFamily: "'Lora',serif", fontSize: 15.5, lineHeight: 1.88, color: "#555", marginBottom: 22 }}>
          {a.summary}
        </p>

        {/* Collapsible defense — animated height */}
        <div style={{
          overflow: "hidden",
          maxHeight: isOpen ? (defH || 400) + "px" : "0px",
          transition: "max-height .45s cubic-bezier(.22,1,.36,1), opacity .35s ease",
          opacity: isOpen ? 1 : 0,
        }}>
          <div ref={defenseRef}>
            <div style={{
              background: "#F5F4F0", borderLeft: "3px solid #1c1c1c",
              borderRadius: "0 10px 10px 0", padding: "18px 22px", marginBottom: 22,
            }}>
              <div style={{
                fontFamily: "'Outfit',sans-serif", fontSize: 10.5, fontWeight: 700,
                letterSpacing: ".12em", textTransform: "uppercase", color: "#AAA", marginBottom: 12,
              }}>
                ChainGuardian Defense
              </div>
              <p style={{ fontFamily: "'Lora',serif", fontSize: 15.5, lineHeight: 1.85, color: "#333" }}>
                {a.defense}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <button
            className="read-btn"
            onClick={() => setExpanded(isOpen ? null : i)}
            aria-expanded={isOpen}
          >
            <span style={{
              display: "inline-block", width: 14, lineHeight: 1,
              transition: "transform .3s cubic-bezier(.22,1,.36,1)",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}>↓</span>
            {isOpen ? "Collapse" : "How We Stop This"}
          </button>
          <a href={a.link} target="_blank" rel="noopener noreferrer" className="ext-link">
            {a.linkLabel} <ExternalIcon />
          </a>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN APP
───────────────────────────────────────── */
export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [activeNav, setActiveNav] = useState("");

  // Track scroll for nav state + active section highlight
  useEffect(() => {
    const sections = ["top", "about", "reports", "engine", "experience"];
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      // Active nav detection
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && window.scrollY >= el.offsetTop - 100) {
          setActiveNav(sections[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = (id) => (e) => { e.preventDefault(); scrollTo(id); };

  return (
    <div style={{ fontFamily: "'Lora', Georgia, serif", background: "#F9F8F5", color: "#1c1c1c", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #F9F8F5; }
        ::-webkit-scrollbar-thumb { background: #D5D0C6; border-radius: 3px; }

        /* Nav */
        .nav-a {
          font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 500;
          color: #777; text-decoration: none; letter-spacing: -0.01em;
          transition: color .2s; padding: 4px 0; position: relative;
        }
        .nav-a::after {
          content: ''; position: absolute; bottom: -2px; left: 0; right: 0;
          height: 1.5px; background: #1c1c1c; transform: scaleX(0);
          transition: transform .25s cubic-bezier(.22,1,.36,1); transform-origin: left;
        }
        .nav-a:hover, .nav-a.active { color: #1c1c1c; }
        .nav-a:hover::after, .nav-a.active::after { transform: scaleX(1); }

        /* Buttons */
        .btn-primary {
          font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 15px;
          background: #1c1c1c; color: #fff; border: none; border-radius: 10px;
          padding: 14px 32px; cursor: pointer; letter-spacing: -0.02em;
          transition: background .2s, transform .18s, box-shadow .2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
        .btn-primary:hover { background: #2d2d2d; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.16); }
        .btn-primary:active { transform: translateY(0); }
        .btn-ghost {
          font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 14px;
          background: #fff; color: #1c1c1c; border: 1.5px solid #DDD9D0;
          border-radius: 10px; padding: 13px 26px; cursor: pointer;
          letter-spacing: -0.02em; transition: border-color .2s, background .2s, transform .18s;
        }
        .btn-ghost:hover { border-color: #1c1c1c; background: #FAFAF8; transform: translateY(-1px); }

        /* Cards */
        .card {
          background: #fff; border: 1px solid #E8E4DB; border-radius: 18px;
          overflow: hidden; transition: box-shadow .3s cubic-bezier(.22,1,.36,1), transform .3s cubic-bezier(.22,1,.36,1);
        }
        .card:hover { box-shadow: 0 12px 48px rgba(0,0,0,0.09); transform: translateY(-3px); }
        .card:hover .card-accent { opacity: 0.8 !important; }

        /* Tags & pills */
        .tag {
          display: inline-block; font-family: 'Outfit', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: .05em;
          border-radius: 100px; padding: 4px 13px; text-transform: uppercase;
        }
        .pill-loss {
          font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500;
          color: #b91c1c; background: #fef2f2; border: 1px solid #FECACA;
          border-radius: 6px; padding: 4px 10px; display: inline-flex; align-items: center;
        }
        .pill-vec {
          font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500;
          color: #666; background: #F3F1EC; border: 1px solid #E5E1D6;
          border-radius: 6px; padding: 4px 10px; display: inline-flex; align-items: center;
        }

        /* Read button */
        .read-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
          color: #1c1c1c; border: 1.5px solid #1c1c1c; border-radius: 8px;
          padding: 9px 18px; cursor: pointer; background: transparent;
          letter-spacing: -0.01em; transition: background .2s, color .2s, box-shadow .2s;
        }
        .read-btn:hover { background: #1c1c1c; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .ext-link {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500;
          color: #999; text-decoration: none; transition: color .2s, gap .2s;
        }
        .ext-link:hover { color: #1c1c1c; gap: 8px; }

        /* Layout helpers */
        .eyebrow {
          font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: .14em; text-transform: uppercase; color: #AAA; margin-bottom: 18px;
        }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .divider { height: 1px; background: #E8E4DB; }
        .w { max-width: 1080px; margin: 0 auto; padding: 0 48px; }
        .footer-a {
          font-family: 'Outfit', sans-serif; font-size: 13px; color: #AAA;
          text-decoration: none; transition: color .2s;
        }
        .footer-a:hover { color: #1c1c1c; }

        /* Layer table */
        .layer-row {
          display: grid; grid-template-columns: 52px 250px 1fr;
          gap: 0; padding: 26px 20px; border-bottom: 1px solid #EDEAD4;
          align-items: start; transition: background .2s, padding .2s;
          cursor: default; border-radius: 10px;
        }
        .layer-row:last-child { border-bottom: none; }
        .layer-row:hover { background: #faf9f6; }

        /* Stat cells */
        .stat-cell {
          text-align: center; padding: 28px 24px;
          border-right: 1px solid #EDEAD4;
          transition: background .2s;
        }
        .stat-cell:last-child { border-right: none; }
        .stat-cell:hover { background: #FAFAF8; }

        /* Scan line animation */
        @keyframes scanMove {
          0% { transform: translateY(-120px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(280px); opacity: 0; }
        }
        .scan-line { animation: scanMove 3.5s ease-in-out infinite; }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
          html { scroll-behavior: auto; }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .w { padding: 0 24px; }
          .layer-row { grid-template-columns: 40px 1fr; }
          .layer-row > div:last-child { grid-column: 1 / -1; padding-top: 8px; }
          .stat-cell { border-right: none; border-bottom: 1px solid #EDEAD4; }
        }
      `}</style>

      {/* ══════════════════════════════
          NAV
      ══════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 300,
        background: scrolled ? "rgba(249,248,245,.96)" : "transparent",
        backdropFilter: scrolled ? "blur(18px)" : "none",
        borderBottom: scrolled ? "1px solid #E8E4DB" : "1px solid transparent",
        transition: "background .35s, border-color .35s, backdrop-filter .35s",
      }}>
        <div className="w" style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#top" onClick={nav("top")} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#1c1c1c" }}>
            <ShieldMark size={32} />
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "-0.03em" }}>ChainGuardian</span>
          </a>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {[["reports", "Threat Reports"], ["engine", "How It Works"], ["about", "About"]].map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={nav(id)}
                className={`nav-a${activeNav === id ? " active" : ""}`}
              >
                {label}
              </a>
            ))}
            <button className="btn-primary" onClick={nav("cta")} style={{ padding: "9px 20px", fontSize: 13 }}>
              Install Free →
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════
          HERO
      ══════════════════════════════ */}
      <section id="top" style={{ paddingTop: 130, paddingBottom: 0, position: "relative", overflow: "hidden" }}>
        {/* Background hex grid accent — top right */}
        <div style={{ position: "absolute", top: 60, right: -40, opacity: 1, pointerEvents: "none" }}>
          <HexGrid width={380} height={300} opacity={0.05} />
        </div>

        <div className="w" style={{ paddingBottom: 80 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 480px", gap: 64, alignItems: "center" }}>
            {/* Left: copy */}
            <div>
              <Reveal>
                <div className="eyebrow" style={{ marginBottom: 24 }}>Web3 Security Extension</div>
              </Reveal>
              <Reveal delay={80}>
                <h1 style={{
                  fontFamily: "'Lora',serif",
                  fontSize: "clamp(40px,5.2vw,68px)",
                  fontWeight: 600, letterSpacing: "-0.032em", lineHeight: 1.08,
                  color: "#111", marginBottom: 28, maxWidth: 620,
                }}>
                  Stop wallet drains<br />
                  <em style={{ fontStyle: "italic", color: "#999" }}>before you sign.</em>
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p style={{ fontFamily: "'Lora',serif", fontSize: 18.5, lineHeight: 1.84, color: "#666", maxWidth: 540, marginBottom: 40 }}>
                  ChainGuardian decompiles smart contracts, simulates payloads, and catches zero-day phishing attacks in under 500ms — before your confirmation click does anything.
                </p>
              </Reveal>
              <Reveal delay={230}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 56 }}>
                  <button className="btn-primary" style={{ fontSize: 16, padding: "15px 36px" }}>
                    Add to Chrome — Free
                  </button>
                  <button className="btn-ghost" style={{ fontSize: 15 }}>
                    Watch 2-min Demo
                  </button>
                </div>
              </Reveal>
              <Reveal delay={300}>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  {["Open source", "0 data leaves your browser", "All EVM chains"].map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'Outfit',sans-serif", fontSize: 13, color: "#AAA", fontWeight: 500 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6.5" stroke="#D0CCC3" />
                        <path d="M4.5 7l2 2 3-3" stroke="#1c1c1c" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right: illustration */}
            <Reveal delay={200} y={20}>
              <div style={{ position: "relative" }}>
                {/* Subtle shadow card behind illustration */}
                <div style={{
                  position: "absolute", inset: -8, borderRadius: 24,
                  background: "linear-gradient(135deg, #F0EDE6 0%, #E8E4DB 100%)",
                  transform: "rotate(-2deg) scale(0.97)",
                  zIndex: 0,
                }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <ScanIllustration />
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Stats bar — full width, pinned to bottom of hero */}
        <Reveal delay={400}>
          <div style={{ borderTop: "1px solid #E8E4DB", borderBottom: "1px solid #E8E4DB", background: "#fff" }}>
            <div className="w" style={{ padding: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
                {[
                  { n: "<500ms", l: "Scan latency per transaction" },
                  { n: "$658M+", l: "Attack value documented" },
                  { n: "8 layers", l: "Independent security checks" },
                  { n: "0 bytes", l: "Data sent externally" },
                ].map((s, i) => (
                  <div key={i} className="stat-cell">
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: "-0.04em", color: "#111", marginBottom: 4 }}>{s.n}</div>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12.5, color: "#999", fontWeight: 500 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══════════════════════════════
          ABOUT / WHAT WE DO
      ══════════════════════════════ */}
      <section id="about" style={{ padding: "96px 0" }}>
        <div className="w">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 88, alignItems: "start" }}>
            <Reveal>
              <div className="eyebrow">What ChainGuardian Does</div>
              <h2 style={{
                fontFamily: "'Lora',serif", fontSize: "clamp(26px,3.2vw,40px)",
                fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.18, color: "#111",
              }}>
                Your wallet reads<br />the frontend.<br />
                <em style={{ fontStyle: "italic", color: "#999" }}>We read the bytecode.</em>
              </h2>
              {/* Decorative waveform accent */}
              <div style={{ marginTop: 36, marginBottom: 8 }}>
                <ThreatWave />
              </div>
              <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#CCC", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Real-time threat activity
              </p>
            </Reveal>
            <Reveal delay={110}>
              <div style={{ paddingTop: 6 }}>
                {[
                  "Every wallet shows you a human-readable summary of what you're about to sign. That summary is generated by the dApp's frontend — the same frontend an attacker controls. ChainGuardian doesn't read the summary. It reads the raw EVM payload.",
                  "We simulate your transaction against a local EVM fork, run eight independent security checks, cross-reference it with live threat intelligence APIs, and return a verdict in under 500 milliseconds.",
                  "If something looks wrong, we block it and explain why in plain language. If everything is clean, you never see us at all. That's what good security infrastructure should feel like.",
                ].map((p, i) => (
                  <p key={i} style={{
                    fontFamily: "'Lora',serif", fontSize: 16.5, lineHeight: 1.9,
                    color: "#555", marginBottom: i < 2 ? 20 : 0,
                  }}>
                    {p}
                  </p>
                ))}
                <div style={{ marginTop: 36, display: "flex", gap: 12 }}>
                  <button className="btn-ghost" onClick={nav("reports")} style={{ fontSize: 14 }}>
                    Read threat reports →
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ══════════════════════════════
          THREAT REPORTS
      ══════════════════════════════ */}
      <section id="reports" style={{ padding: "96px 0" }}>
        <div className="w">
          {/* Section header */}
          <Reveal>
            <div className="eyebrow">Threat Intelligence Reports</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "end", marginBottom: 56 }}>
              <h2 style={{
                fontFamily: "'Lora',serif", fontSize: "clamp(26px,3.2vw,40px)",
                fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.18, color: "#111",
              }}>
                Every major exploit we've catalogued — and how we stop the next one.
              </h2>
              <p style={{ fontFamily: "'Lora',serif", fontSize: 15.5, color: "#888", lineHeight: 1.82 }}>
                These are documented, real-world attacks. Each one had a detectable signature in the bytecode. None of the victims had a tool that knew to look.
              </p>
            </div>
          </Reveal>

          {/* Article cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {articles.map((a, i) => (
              <Reveal key={i} delay={i * 60} y={20}>
                <ArticleCard a={a} i={i} expanded={expanded} setExpanded={setExpanded} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ══════════════════════════════
          8-LAYER ENGINE
      ══════════════════════════════ */}
      <section id="engine" style={{ padding: "96px 0" }}>
        <div className="w">
          {/* Header */}
          <Reveal>
            <div className="eyebrow">Security Architecture</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "end", marginBottom: 52 }}>
              <h2 style={{
                fontFamily: "'Lora',serif", fontSize: "clamp(26px,3.2vw,40px)",
                fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.18, color: "#111",
              }}>
                Eight independent checks.<br />One verdict. Under 500ms.
              </h2>
              <div className="mono" style={{ fontSize: 12.5, color: "#CCC", lineHeight: 2.1 }}>
                <div><span style={{ color: "#22c55e" }}>✓</span> avg_latency: 430ms</div>
                <div><span style={{ color: "#22c55e" }}>✓</span> runs_locally: true</div>
                <div><span style={{ color: "#22c55e" }}>✓</span> data_exfiltrated: 0</div>
              </div>
            </div>
          </Reveal>

          {/* Pipeline SVG */}
          <Reveal delay={80}>
            <div style={{ marginBottom: 36, overflowX: "auto", paddingBottom: 4 }}>
              <div style={{ minWidth: 640 }}>
                <PipelineFlow />
              </div>
            </div>
          </Reveal>

          {/* Layer table */}
          <Reveal delay={120}>
            <div style={{ background: "#fff", border: "1px solid #E8E4DB", borderRadius: 18, overflow: "hidden" }}>
              <div style={{ padding: "0 0" }}>
                {layers.map((l, i) => (
                  <div key={i} className="layer-row">
                    <div className="mono" style={{ fontSize: 11, color: "#CCC", fontWeight: 500, paddingTop: 2 }}>{l.num}</div>
                    <div style={{ paddingRight: 32 }}>
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 600, color: "#111", letterSpacing: "-0.02em", lineHeight: 1.35 }}>
                        {l.title}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Lora',serif", fontSize: 14.5, color: "#666", lineHeight: 1.78 }}>{l.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="divider" />

      {/* ══════════════════════════════
          THE EXPERIENCE — 3 States
      ══════════════════════════════ */}
      <section id="experience" style={{ padding: "96px 0" }}>
        <div className="w">
          <Reveal>
            <div className="eyebrow">The Experience</div>
            <h2 style={{
              fontFamily: "'Lora',serif", fontSize: "clamp(26px,3.2vw,40px)",
              fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.18, color: "#111",
              maxWidth: 480, marginBottom: 52,
            }}>
              You should only notice it<br />
              <em style={{ fontStyle: "italic", color: "#999" }}>when it saves you.</em>
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
            {[
              {
                title: "Safe transaction",
                desc: "Verified protocol, clean payload, no suspicious approvals. ChainGuardian clears it in the background. You sign. Done. You never see us.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 2L4 5.5V11c0 4.2 2.9 8.1 7 9.3 4.1-1.2 7-5.1 7-9.3V5.5L11 2z" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M8 11l2.5 2.5 4-4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                bg: "#f0fdf4", border: "#bbf7d0", iconBg: "#dcfce7",
              },
              {
                title: "Risk detected",
                desc: "A phishing domain, unusual approval scope, or suspicious contract pattern. We pause the transaction and show exactly what triggered the warning.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 3L2 19h18L11 3z" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round" />
                    <line x1="11" y1="10" x2="11" y2="14" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="11" cy="16.5" r=".75" fill="#d97706" />
                  </svg>
                ),
                bg: "#fffbeb", border: "#fde68a", iconBg: "#fef9c3",
              },
              {
                title: "Transaction blocked",
                desc: "A drainer contract, honeypot token, or unlimited approval was about to execute. Blocked outright. Your funds stay where they were.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="8.5" stroke="#dc2626" strokeWidth="1.5" />
                    <path d="M8 8l6 6M14 8l-6 6" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ),
                bg: "#fef2f2", border: "#fecaca", iconBg: "#fee2e2",
              },
            ].map((c, i) => (
              <Reveal key={i} delay={i * 90} y={24} scale={0.98}>
                <div style={{
                  background: c.bg, border: `1px solid ${c.border}`,
                  borderRadius: 18, padding: "28px 30px",
                  transition: "transform .25s, box-shadow .25s",
                }}>
                  <div style={{
                    width: 48, height: 48, background: c.iconBg,
                    border: `1.5px solid ${c.border}`, borderRadius: 14,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 22,
                  }}>
                    {c.icon}
                  </div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 12, letterSpacing: "-0.02em" }}>
                    {c.title}
                  </div>
                  <p style={{ fontFamily: "'Lora',serif", fontSize: 15, color: "#666", lineHeight: 1.82 }}>
                    {c.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ══════════════════════════════
          CTA
      ══════════════════════════════ */}
      <section id="cta" style={{ padding: "108px 0", position: "relative", overflow: "hidden" }}>
        {/* Background hex accent - bottom left */}
        <div style={{ position: "absolute", bottom: -60, left: -60, opacity: 1, pointerEvents: "none" }}>
          <HexGrid width={340} height={260} opacity={0.04} />
        </div>

        <div className="w" style={{ textAlign: "center", position: "relative" }}>
          <Reveal>
            <div className="eyebrow" style={{ marginBottom: 22 }}>Get Protected</div>
            <h2 style={{
              fontFamily: "'Lora',serif",
              fontSize: "clamp(32px,5vw,60px)",
              fontWeight: 600, letterSpacing: "-0.032em", lineHeight: 1.1,
              color: "#111", maxWidth: 600, margin: "0 auto 26px",
            }}>
              The next drain target<br />
              <em style={{ fontStyle: "italic", color: "#999" }}>won't be you.</em>
            </h2>
            <p style={{
              fontFamily: "'Lora',serif", fontSize: 18, lineHeight: 1.82,
              color: "#888", maxWidth: 460, margin: "0 auto 48px",
            }}>
              Free. Lightweight. Runs entirely in your browser. No data leaves your machine. Installed in 30 seconds.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
              <button className="btn-primary" style={{ fontSize: 17, padding: "17px 44px" }}>
                Add to Chrome — Free
              </button>
              <button className="btn-ghost" style={{ fontSize: 15, padding: "16px 30px" }}>
                Add to Firefox
              </button>
            </div>
            <div style={{ display: "flex", gap: 28, justifyContent: "center", flexWrap: "wrap" }}>
              {["Open source on GitHub", "No wallet keys stored", "All EVM chains supported", "MIT Licensed"].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'Outfit',sans-serif", fontSize: 13.5, color: "#BBB", fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6.5" stroke="#D0CCC3" />
                    <path d="M4.5 7l2 2 3-3" stroke="#1c1c1c" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════
          FOOTER
      ══════════════════════════════ */}
      <footer style={{ borderTop: "1px solid #E8E4DB", background: "#fff" }}>
        <div className="w" style={{ padding: "36px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldMark size={26} />
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "-0.03em" }}>ChainGuardian</span>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: "#DDD", marginLeft: 10 }}>© 2024</span>
          </div>
          <div style={{ display: "flex", gap: 26 }}>
            {["GitHub", "Twitter / X", "Documentation", "Audit Report", "Privacy"].map(l => (
              <a key={l} href="#" className="footer-a">{l}</a>
            ))}
          </div>
          <div className="mono" style={{ fontSize: 11, color: "#CCC" }}>v2.1.4 · Audited by OpenZeppelin</div>
        </div>
      </footer>
    </div>
  );
}
