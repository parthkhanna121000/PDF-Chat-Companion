"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./landing.css";

// Set NEXT_PUBLIC_REPO_URL in .env.local to your real GitHub repo URL.
// If unset, GitHub links are simply hidden (no invented URLs).
const REPO_URL = process.env.NEXT_PUBLIC_REPO_URL ?? "";

const NODES = [
  { id: "a", x: 120, y: 70, label: "Problem framing", note: "Why the document exists and what it sets out to solve.", ev: [{ p: 3, t: "Freight costs put pressure on operating margin." }], rel: ["b"] },
  { id: "b", x: 480, y: 70, label: "Methodology", note: "How the analysis was done.", ev: [{ p: 5, t: "Regional cost data was compared year over year." }], rel: ["a", "d"] },
  { id: "c", x: 60, y: 190, label: "Key terms", note: "Terms the document relies on, explained in plain language.", ev: [{ p: 4, t: "Operating margin: profit from operations as a share of revenue." }, { p: 9, t: "Logistics cost: what it costs to move goods to customers." }], rel: ["a"] },
  { id: "d", x: 540, y: 190, label: "Findings", note: "Core claims, each tied to the passage that supports it.", ev: [{ p: 12, t: "Operating margin improved as logistics costs declined." }, { p: 14, t: "Contracts were renegotiated during the year." }], rel: ["b", "e", "f"] },
  { id: "e", x: 160, y: 310, label: "Limitations", note: "Caveats the authors state, kept next to the claims they qualify.", ev: [{ p: 27, t: "Currency volatility remains a key exposure." }], rel: ["d"] },
  { id: "f", x: 440, y: 310, label: "Open questions", note: "Gaps and follow-ups surfaced from the text.", ev: [{ p: 31, t: "Whether the savings will last next year." }], rel: ["d"] },
];

const SENT = "Heteroscedastic residual variance undermines the efficiency of ordinary least squares estimators.";
const SIMPLE = "When the size of the errors changes across your data, the standard line-fitting method becomes less reliable, like using one ruler on things that stretch differently.".split(" ");
const TERMS = [["Heteroscedastic", "error size varies across the data"], ["Least squares", "the standard way to fit a line"]];
const AN = [
  { id: "b", x: 30, y: 110, w: 200, h: 120, t: "Browser", s: "ChatApp.tsx", s2: "messages · uploadedPdf" },
  { id: "u", x: 350, y: 30, w: 200, h: 70, t: "/api/upload", s: "app/api/upload/route.ts" },
  { id: "c", x: 350, y: 240, w: 200, h: 70, t: "/api/chat", s: "app/api/chat/route.ts" },
  { id: "p", x: 670, y: 30, w: 200, h: 70, t: "PDF parser", s: "lib/pdf-parser.ts" },
  { id: "a", x: 670, y: 240, w: 200, h: 70, t: "Anthropic API", s: "lib/anthropic.ts" },
];
const FLOWS = [
  { name: "Upload a PDF", on: ["b", "u", "p"], lx: 450, ly1: 54, ly2: 120, lf: "PDF file", lb: "extracted text",
    fwd: [[230, 150], [290, 150], [290, 65], [350, 65], [550, 65], [670, 65]], back: [[670, 85], [550, 85], [310, 85], [310, 165], [230, 165]] },
  { name: "Ask a question", on: ["b", "c", "a"], lx: 450, ly1: 264, ly2: 330, lf: "question + history + text", lb: "streamed tokens (SSE)",
    fwd: [[230, 190], [290, 190], [290, 275], [350, 275], [550, 275], [670, 275]], back: [[670, 295], [550, 295], [310, 295], [310, 185], [230, 185]] },
];

const QA = [
  { q: "What drove the margin improvement?", a: "Lower logistics costs across regions were the main driver, according to the financial review.", p: 12, hl: "Operating margin improved as logistics costs declined across all regions." },
  { q: "What risks does the report mention?", a: "Currency volatility and supplier concentration are flagged as the main exposures.", p: 27, hl: "Currency volatility and supplier concentration remain key exposures." },
  { q: "How did revenue change year over year?", a: "Revenue grew modestly, led by the services segment.", p: 8, hl: "Services led growth, lifting total revenue year over year." },
];
const PASS = [
  { id: 0, p: 8, t: "Revenue grew modestly across the year, led by the services segment." },
  { id: 1, p: 12, t: "Operating margin improved as logistics costs declined across all regions." },
  { id: 2, p: 27, t: "Currency volatility and supplier concentration remain key exposures." },
];
const EDITS = [
  { l: "Shorten", t: "Margins rose as logistics costs fell." },
  { l: "More formal", t: "Operating margin increased owing to reduced logistics expenditure across all regions." },
  { l: "Simplify", t: "The company kept more of each sale because shipping got cheaper everywhere." },
];
const TOOLS = [
  { t: "Read PDFs", d: "Upload a PDF and its text is extracted so you can ask questions about it.", tag: "In the app" },
  { t: "Edit with instructions", d: "Select a passage and ask for a rewrite: shorter, more formal, or simpler. Preview only.", tag: "Concept" },
  { t: "Show the source", d: "Answers point back to the passage and page they came from. Click a reference to see it.", tag: "Concept" },
];
const ROWS = [
  { p: 8, t: PASS[0].t, w: 35, hit: false },
  { p: 12, t: PASS[1].t, w: 92, hit: true },
  { p: 14, t: "Logistics contracts were renegotiated during the year.", w: 78, hit: true },
  { p: 27, t: PASS[2].t, w: 22, hit: false },
];
const A1 = ["Margins", "improved", "because", "logistics", "costs", "fell"];
const A2 = ["across", "all", "regions."];
type VP = { rm: boolean };
const loop = (rm: boolean, d = 4.5) => (rm ? { duration: 0 } : { duration: d, repeat: Infinity, ease: "easeInOut" as const });

function VisEvidence({ rm }: VP) {
  return (
    <div className="cv">
      <p className="ctext">Margins improved because{" "}
        <span className="ctok"><span>logistics costs fell</span>
          <motion.i className="cul" animate={rm ? { scaleX: 1 } : { scaleX: [0, 1, 1, 1, 0] }} transition={loop(rm)} />
        </span>
        <motion.em className="cchip" animate={rm ? { scale: 1, opacity: 1 } : { scale: [0, 0, 1.2, 1, 1], opacity: [0, 0, 1, 1, 0] }} transition={loop(rm)}>p. 12</motion.em>
      </p>
      <p className="mono">Source underlined in the document</p>
    </div>
  );
}
function VisExplain({ rm }: VP) {
  return (
    <div className="cv">
      <p className="ctext">The results show a <span className="csel"><motion.i className="cbg" animate={rm ? { scaleX: 1 } : { scaleX: [0, 1, 1, 1, 0] }} transition={loop(rm)} /><span>heteroscedastic variance</span></span> across runs.</p>
      <motion.div className="cpills" animate={rm ? { opacity: 1, y: 0 } : { opacity: [0, 0, 1, 1, 0], y: [8, 8, 0, 0, 8] }} transition={loop(rm)}>
        {["Simplify", "Technical", "Example"].map((x, i) => <span key={x} className={`cpill ${i === 0 ? "on" : ""}`}>{x}</span>)}
      </motion.div>
    </div>
  );
}
function VisBrief({ rm }: VP) {
  const rows = [["Summary", 90], ["Findings", 75], ["Limitations", 60]] as const;
  return (
    <div className="cv cb">
      {rows.map(([l, w], i) => (
        <div key={l}>
          <p className="mono">{l}</p>
          <motion.div className="cbl" style={{ width: `${w}%` }} animate={rm ? { scaleX: 1 } : { scaleX: [0, 0, 1, 1, 0] }} transition={rm ? { duration: 0 } : { duration: 4.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.1 + i * 0.15, 0.4 + i * 0.15, 0.9, 1] }} />
        </div>
      ))}
    </div>
  );
}
const CONCEPTS = [
  { t: "Evidence-linked answers", d: "Connect answer claims to specific pages and highlighted passages.", V: VisEvidence },
  { t: "Explain this passage", d: "Select text and request a simpler or more technical explanation.", V: VisExplain },
  { t: "Research brief generator", d: "Turn a long PDF into a structured brief with findings and limitations.", V: VisBrief },
];

const FALLBACK = { q: "", a: "I couldn't find that in this sample document. Try asking about margins, risks, or revenue.", p: 0, hl: "" };
const ALL = [...QA, FALLBACK];
const STEPS = [
  { t: "Upload and process", d: "Your PDF is uploaded and its text is extracted.", tag: "upload", lines: ["> POST /api/upload", "> extracting text…", "✓ document ready"] },
  { t: "Retrieve context", d: "Your question is matched to the relevant passages.", tag: "context", lines: ["Q: What drove the margin?", "→ passage 1 (relevant)", "→ passage 2 (relevant)"] },
  { t: "Generate and stream", d: "The model answers from that context and streams it back.", tag: "stream", lines: ['data: "Lower"', 'data: " logistics"', 'data: " costs…"'] },
];

function ExplainScene({ rm }: { rm: boolean }) {
  const [ph, setPh] = useState(rm ? 4 : 0);
  const [cy, setCy] = useState(0);
  useEffect(() => {
    if (rm) { setPh(4); return; }
    setPh(0);
    const ts = ([[500, 1], [1300, 2], [2700, 3], [3800, 4]] as number[][]).map(([t, v]) => setTimeout(() => setPh(v), t));
    ts.push(setTimeout(() => setCy((c) => c + 1), 14000));
    return () => ts.forEach(clearTimeout);
  }, [cy, rm]);
  const pos = [{ left: "6%", top: "64%", opacity: 0 }, { left: "6%", top: "43%", opacity: 1 }, { left: "70%", top: "53%", opacity: 1 }, { left: "20%", top: "80%", opacity: 1 }, { left: "20%", top: "80%", opacity: 0 }][ph];
  return (
    <div className="xs" aria-hidden>
      <div className="xp">
        <p className="mono" style={{ marginBottom: 6 }}>4.2 Model diagnostics</p>
        <p>Residual plots were inspected for each fitted model. <span key={ph >= 2 ? "s" : "n"} className={ph >= 2 ? "ul" : ""}>{SENT}</span> Corrective measures follow in section 4.3.</p>
        <AnimatePresence>
          {(ph === 3 || ph === 4) && (
            <motion.div className="xpop" initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}>
              {["Explain simply", "Define terms", "Example"].map((x, i) => <motion.span key={x} className={`cpill ${i === 0 && ph === 4 ? "on" : ""}`} animate={i === 0 && ph === 4 ? { scale: [1, 0.92, 1] } : {}}>{x}</motion.span>)}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.svg className="xcur" width="18" height="22" viewBox="0 0 16 20" animate={pos} transition={{ duration: ph === 2 ? 1.1 : 0.6, ease: "easeInOut" }}>
          <path d="M1 1l12 9-5 1 3 7-3 1-3-7-4 4z" fill="#202B48" stroke="#fff" />
        </motion.svg>
      </div>
      <div className="xai">
        {ph < 4 ? <p className="mono">Select text, then ask AI</p> : (
          <>
            <p className="mono">Explain simply</p>
            <div className="stat3" key={cy}><span className="dots"><i /><i /><i /></span></div>
            <p>{SIMPLE.map((w, i) => <motion.span key={cy + "-" + i} initial={{ opacity: rm ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ delay: rm ? 0 : 1.1 + i * 0.045 }}>{w} </motion.span>)}</p>
            <div className="xterms">
              {TERMS.map(([t, m], i) => (
                <motion.div key={t} className="xterm" initial={{ opacity: rm ? 1 : 0, y: rm ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rm ? 0 : 2.5 + i * 0.25 }}><b>{t}</b> {m}</motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ArchDiagram({ rm }: { rm: boolean }) {
  const [fi, setFi] = useState(0);
  const f = FLOWS[fi];
  const d = (pts: number[][]) => pts.map((q, i) => `${i ? "L" : "M"}${q[0]} ${q[1]}`).join(" ");
  const mono = { fontFamily: "JetBrains Mono, monospace" } as React.CSSProperties;
  return (
    <div className="archbox">
      <div className="seg dark" role="tablist" aria-label="Request flow">
        {FLOWS.map((x, i) => <button key={x.name} role="tab" aria-selected={i === fi} className={i === fi ? "on" : ""} onClick={() => setFi(i)}>{x.name}</button>)}
      </div>
      <svg viewBox="0 0 900 340" role="img" aria-label={`Request flow: ${f.name}`}>
        {FLOWS.map((x, i) => [x.fwd, x.back].map((pts, j) => <path key={i + "-" + j} d={d(pts)} fill="none" stroke={i === fi ? "#536BA6" : "#2c3550"} strokeWidth="1.5" strokeDasharray={i === fi ? "5 5" : undefined} />))}
        {AN.map((n) => (
          <g key={n.id}>
            <motion.rect x={n.x} y={n.y} width={n.w} height={n.h} rx="8" fill="#1d2538" strokeWidth="1.5" animate={{ stroke: f.on.includes(n.id) ? "#536BA6" : "#38425f" }} />
            <text x={n.x + 16} y={n.y + 30} fill="#fff" fontSize="15" fontWeight="700">{n.t}</text>
            <text x={n.x + 16} y={n.y + 50} fill="#8ea3d6" fontSize="10.5" style={mono}>{n.s}</text>
            {n.s2 && <text x={n.x + 16} y={n.y + 72} fill="#8ea3d6" fontSize="10.5" style={mono}>{n.s2}</text>}
          </g>
        ))}
        <text x={f.lx} y={f.ly1} textAnchor="middle" fill="#cdd5ea" fontSize="11" style={mono}>{f.lf} →</text>
        <text x={f.lx} y={f.ly2} textAnchor="middle" fill="#8ea3d6" fontSize="11" style={mono}>← {f.lb}</text>
        {!rm && (
          <g key={fi}>
            <motion.circle r="5" fill="#fff" initial={{ cx: f.fwd[0][0], cy: f.fwd[0][1] }} animate={{ cx: f.fwd.map((q) => q[0]), cy: f.fwd.map((q) => q[1]) }} transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }} />
            {[0, 1, 2].map((k) => (
              <motion.circle key={k} r="4" fill="#8ea3d6" initial={{ cx: f.back[0][0], cy: f.back[0][1] }} animate={{ cx: f.back.map((q) => q[0]), cy: f.back.map((q) => q[1]) }} transition={{ duration: 2.6, repeat: Infinity, ease: "linear", delay: 1.3 + k * 0.18 }} />
            ))}
          </g>
        )}
      </svg>
      <p className="mono archcap">Derived from the project’s route handlers and lib modules</p>
    </div>
  );
}

function DocArt({ rm }: { rm: boolean }) {
  const bars = [60, 82, 94, 70, 88, 52, 76];
  return (
    <svg viewBox="0 0 420 320" className="docart" role="img" aria-label="Illustration: a document with a highlighted passage explained in plain words">
      <motion.g animate={rm ? {} : { y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
        <rect x="30" y="52" width="170" height="220" rx="6" fill="#E9E8E3" stroke="#DCDAD4" transform="rotate(-6 115 160)" />
        <rect x="70" y="30" width="180" height="230" rx="6" fill="#fff" stroke="#DCDAD4" />
        <rect x="90" y="52" width="60" height="7" rx="3" fill="#202B48" />
        {bars.map((w, i) => <rect key={i} x="90" y={74 + i * 22} width={w * 1.3} height="6" rx="3" fill="#DCDAD4" />)}
        <rect x="90" y="118" width="124" height="14" fill="rgba(83,107,166,.2)" />
        <motion.rect x="90" y="132" width="124" height="2.5" fill="#536BA6" style={{ transformBox: "fill-box", transformOrigin: "left" }} animate={rm ? { scaleX: 1 } : { scaleX: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.25, 0.85, 1] }} />
      </motion.g>
      <motion.path d="M214 128 C 250 128, 255 150, 290 150" fill="none" stroke="#536BA6" strokeWidth="1.5" strokeDasharray="4 4" animate={rm ? {} : { strokeDashoffset: [0, -16] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
      <motion.g initial={{ opacity: rm ? 1 : 0, scale: rm ? 1 : 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4, type: "spring" }} style={{ transformBox: "fill-box", transformOrigin: "left center" }}>
        <rect x="290" y="108" width="115" height="100" rx="10" fill="#202B48" />
        <text x="304" y="130" fill="#8ea3d6" fontSize="9" style={{ fontFamily: "JetBrains Mono, monospace" }}>IN PLAIN WORDS</text>
        {[86, 70, 78].map((w, i) => <motion.rect key={i} x="304" y={144 + i * 16} width={w} height="6" rx="3" fill="#fff" opacity=".85" style={{ transformBox: "fill-box", transformOrigin: "left" }} animate={rm ? { scaleX: 1 } : { scaleX: [0, 1, 1, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 0.5 + i * 0.3, times: [0, 0.3, 0.85, 1] }} />)}
      </motion.g>
      <motion.circle cx="214" cy="125" r="5" fill="#536BA6" animate={rm ? {} : { r: [5, 9, 5], opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
    </svg>
  );
}

export function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  const [sel, setSel] = useState(NODES[3]);
  const [touched, setTouched] = useState(false);
  const [prog, setProg] = useState(0);
  const [qi, setQi] = useState(0);
  const [typed, setTyped] = useState(0);
  const [picked, setPicked] = useState(false);
  const [phase, setPhase] = useState<"think" | "retrieve" | "stream">("think");
  const [run, setRun] = useState(0);
  const [shown, setShown] = useState("");
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState(0);
  const [editOpt, setEditOpt] = useState(0);
  const [refId, setRefId] = useState(1);
  const [applied, setApplied] = useState(false);
  const [rm, setRm] = useState(false); // set after mount so server and client first render match
  useEffect(() => { setRm(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  useEffect(() => {
    if (touched || rm) return;
    const id = setInterval(() => setSel((c) => NODES[(NODES.findIndex((n) => n.id === c.id) + 1) % NODES.length]), 3800);
    return () => clearInterval(id);
  }, [touched, rm]);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const cur = ALL[qi];
  const done = phase === "stream" && typed >= cur.a.length;
  const s1 = tab === 2 && refId === 1 ? "ul" : tab === 1 ? (applied ? "ins2" : "sel") : "";
  const s2 = tab === 2 && refId === 2 ? "ul" : "";
  const s1t = tab === 1 && applied ? EDITS[editOpt].t : PASS[1].t;

  const ask = (text: string, idx?: number, auto = false) => {
    const t = text.trim();
    if (!t) return;
    const l = t.toLowerCase();
    const i = idx ?? (/margin|cost|logistic|profit/.test(l) ? 0 : /risk|currency|supplier|threat/.test(l) ? 1 : /revenue|growth|sales|year/.test(l) ? 2 : 3);
    if (!auto) setPicked(true);
    setShown(t); setQi(i); setTyped(0); setPhase("think"); setRun((r) => r + 1);
  };
  useEffect(() => {
    if (phase === "stream") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setPhase("stream"); return; }
    const id = setTimeout(() => setPhase(phase === "think" ? "retrieve" : "stream"), phase === "think" ? 800 : 1100);
    return () => clearTimeout(id);
  }, [phase, run]);
  useEffect(() => {
    if (phase !== "stream") return;
    const len = ALL[qi].a.length;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setTyped(len); return; }
    const id = setInterval(() => setTyped((t) => Math.min(t + 1, len)), 22);
    return () => clearInterval(id);
  }, [phase, run]);
  useEffect(() => {
    if (picked || !done) return;
    const n = (qi + 1) % QA.length;
    const id = setTimeout(() => ask(QA[n].q, n, true), 3500);
    return () => clearTimeout(id);
  }, [done, qi, picked]);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setStep((x) => (x + 1) % STEPS.length), 4500);
    return () => clearInterval(id);
  }, [paused]);
  const spot = (e: React.PointerEvent) => {
    const c = (e.target as HTMLElement).closest(".card") as HTMLElement | null;
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", `${e.clientX - r.left}px`);
    c.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  // Reveal bento cards once as they scroll into view
  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".bento .card, section .head, section .statement"));
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.2, root: document.querySelector(".lp") });
    cards.forEach((c, i) => { c.classList.add("rv"); c.style.transitionDelay = `${i * 80}ms`; io.observe(c); });
    return () => io.disconnect();
  }, []);

  return (
    <div className="lp" onScroll={(e) => { const t = e.currentTarget; setProg(t.scrollTop / Math.max(1, t.scrollHeight - t.clientHeight)); }}>
      <div className="pbar" style={{ transform: `scaleX(${prog})` }} />
      <header className={`nav ${prog > 0.01 ? "sc" : ""}`}>
        <div className="wrap">
          <a href="#top" className="brand"><i aria-hidden />PDF Chat Companion</a>
          <nav aria-label="Primary">
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#how">How it works</a></li>
              <li><a href="#architecture">Architecture</a></li>
            </ul>
          </nav>
          <div className="row">
            {REPO_URL && <a className="btn s sm" href={REPO_URL} target="_blank" rel="noopener noreferrer">GitHub</a>}
            <button className="btn p sm" onClick={onLaunch}>Open app</button>
          </div>
        </div>
      </header>

      <main id="top">
        <div className="wrap hero">
          <div>
            <p className="mono">Document intelligence / AI-powered workspace</p>
            <h1 style={{ marginTop: 20 }}>Your documents. Finally, in context.</h1>
            <p className="lead">Ask questions across your PDFs. Explore the information that matters and get contextual answers grounded in your uploaded documents.</p>
            <div className="row">
              <button className="btn p" onClick={onLaunch}>Try it now</button>
              <a className="btn s" href="#how">See how it works</a>
              {REPO_URL && (
                <a className="btn s" href={REPO_URL} target="_blank" rel="noopener noreferrer">View on GitHub</a>
              )}
            </div>
            <p className="mono cap">PDF Q&amp;A · Document context · Streamed responses</p>
          </div>
          <div className="app" role="group" aria-label="Interactive demo of PDF Chat Companion">
            <div className="doc">
              <p className="mono" style={{ marginBottom: 10 }}>annual_report_2024.pdf</p>
              <div className="page">
                <b style={{ color: "#202B48", fontSize: ".8rem" }}>3. Financial Review</b>
                <div className="bar" /><div className="bar" style={{ width: "80%" }} />
                {phase !== "think" && cur.hl && <div className="hl" key={run}>{cur.hl}</div>}
                <div className="bar" /><div className="bar" style={{ width: "60%" }} />
                <span className="pg mono">p. {cur.p}</span>
              </div>
            </div>
            <div className="chat">
              <div className="sugg">
                {QA.map((x, i) => (
                  <button key={x.q} className={`sg ${i === qi ? "on" : ""}`} onClick={() => ask(x.q, i)}>{x.q}</button>
                ))}
              </div>
              <div className="q" key={"q" + run}>{shown || QA[0].q}</div>
              {phase === "think" && <div className="stat"><span className="dots"><i /><i /><i /></span>Reading your question…</div>}
              {phase === "retrieve" && (
                <div className="stat col">
                  <span className="mono">Retrieving passages</span>
                  <div className="psg shim">{cur.hl || "No close match found in this document."}{cur.p > 0 && <span className="chip">p. {cur.p}</span>}</div>
                </div>
              )}
              {phase === "stream" && (
                <div className="a">{cur.a.slice(0, typed)}{done ? (cur.p > 0 && <span className="chip">p. {cur.p}</span>) : <span className="cur" />}</div>
              )}
              {phase === "stream" && !done && <p className="mono sse">data: {"{ \"text\": \""}{cur.a.slice(Math.max(0, typed - 10), typed)}{"\" }"}</p>}
              <form className="ask" onSubmit={(e) => { e.preventDefault(); ask(draft); setDraft(""); }}>
                <input aria-label="Ask a question about the sample document" placeholder="Ask about this document…" value={draft} onChange={(e) => setDraft(e.target.value)} />
                <button type="submit" className="btn p sm">Ask</button>
              </form>
              <p className="mono" style={{ fontSize: ".6rem" }}>Interactive demo · sample content</p>
            </div>
          </div>
        </div>

        <section>
          <div className="wrap">
            <p className="mono" style={{ marginBottom: 20 }}>The problem</p>
            <p className="statement">Long documents hide what matters. You scroll, search for keywords, and lose your place — <span>the answer is in there, but the context isn’t.</span></p>
          </div>
        </section>

        <section id="features">
          <div className="wrap">
            <div className="head"><h2>Built around the questions you actually ask.</h2><p>Four capabilities that make up the current application.</p></div>
            <div className="bento" onPointerMove={spot}>
              <article className="card a1">
                <p className="mono">01 / Question answering</p>
                <h3>Underline it. Ask AI. Get it in plain language.</h3>
                <p>Select a hard sentence and ask for a simpler explanation, with the key terms defined. Illustrative example.</p>
                <ExplainScene rm={rm} />
              </article>
              <article className="card a2">
                <p className="mono">02 / Retrieval</p>
                <h3>Relevant context. Better-grounded answers.</h3>
                <p>Your question is answered using the text of the uploaded document as context.</p>
                <div className="scan" aria-hidden><i /><i /><i /></div>
                <div className="flow seq"><span className="node">Q</span>→<span className="node">passages</span>→<span className="node">A</span></div>
              </article>
              <article className="card a3">
                <p className="mono">03 / Streaming</p>
                <h3>Answers that arrive as they are generated.</h3>
                <p>Responses stream to the interface over Server-Sent Events.</p>
                <div className="tok" aria-hidden><div>data: "Lower"</div><div>data: " logistics"</div><div>data: " costs"<span className="cur" /></div></div>
              </article>
              <article className="card a4">
                <p className="mono">04 / History</p>
                <h3>Keep the conversation connected.</h3>
                <p>Earlier messages are sent with each question, so follow-ups build on the conversation.</p>
                <div className="flow seq"><span className="node">Q1</span>→<span className="node">A1</span>→<span className="node">Follow-up</span></div>
              </article>
            </div>
            <div className="row" style={{ marginTop: 32, justifyContent: "center" }}>
              <button className="btn p" onClick={onLaunch}>Start using it</button>
            </div>
          </div>
        </section>

        <section id="tools">
          <div className="wrap">
            <div className="head"><h2>See the page. Edit the page. Trace every answer.</h2><p>A look at working inside a PDF. Interactive preview with a sample document.</p></div>
            <div className="viewer">
              <div className="vbar">
                <span className="mono">annual_report_2024.pdf</span>
                <div className="seg" role="tablist" aria-label="Viewer mode">
                  {["View", "Edit", "Ask AI"].map((m, i) => (
                    <button key={m} role="tab" aria-selected={i === tab} className={i === tab ? "on" : ""} onClick={() => setTab(i)}>{m}{i === 1 && <em className="mono"> concept</em>}</button>
                  ))}
                </div>
                <span className="mono">p. 12</span>
              </div>
              <div className="vbody">
                <div className="paper">
                  <p className="mono">3. Financial Review</p>
                  <p>{PASS[0].t} The sections below summarise performance for the period.</p>
                  <p><span key={`${tab}-${refId}-${editOpt}-${applied}-a`} className={s1}>{s1t}</span> Regional results are broken down in the tables that follow.</p>
                  <p><span key={`${tab}-${refId}-b`} className={s2}>{PASS[2].t}</span> Mitigation steps are described in the next section.</p>
                  <span className="pno">12</span>
                </div>
                <aside className="vside" key={tab}>
                  {tab === 0 && (<>
                    <p className="mono">Outline</p>
                    <ol className="outl"><li>1. Overview</li><li className="on">3. Financial Review</li><li>5. Risks</li></ol>
                    <p className="note">Switch to Ask AI to see which text an answer comes from.</p>
                  </>)}
                  {tab === 1 && (<>
                    <p className="mono">Modify the selected sentence</p>
                    <div className="chips2" role="group" aria-label="Edit instruction">
                      {EDITS.map((x, i) => <button key={x.l} className={`sg ${applied && i === editOpt ? "on" : ""}`} onClick={() => { setEditOpt(i); setApplied(true); }}>{x.l}</button>)}
                      <button className="sg" onClick={() => setApplied(false)}>Reset</button>
                    </div>
                    <div className="diff" key={`${editOpt}-${applied}`}>
                      <del>{PASS[1].t}</del>
                      {applied && <ins>{EDITS[editOpt].t.split(" ").map((w, i) => <span key={i} style={{ animationDelay: `${i * 0.06}s` }}>{w} </span>)}</ins>}
                    </div>
                  </>)}
                  {tab === 2 && (<>
                    <div className="q" style={{ alignSelf: "flex-end" }}>What changed in margins, and what are the risks?</div>
                    <div className="ans">Margins improved because logistics costs fell
                      <button className={`ref ${refId === 1 ? "on" : ""}`} onClick={() => setRefId(1)} onMouseEnter={() => setRefId(1)} aria-label="Reference 1, page 12">1</button>, while currency volatility remains a risk
                      <button className={`ref ${refId === 2 ? "on" : ""}`} onClick={() => setRefId(2)} onMouseEnter={() => setRefId(2)} aria-label="Reference 2, page 27">2</button>.</div>
                    <p className="mono">Source {refId}: p. {PASS[refId].p} · underlined in the document</p>
                  </>)}
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section id="how">
          <div className="wrap">
            <div className="head"><h2>How it works</h2><p>Three stages from file to answer.</p></div>
            <div className="stepper" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
              <div className="slist">
                {STEPS.map((x, i) => (
                  <button key={x.t} className={`sbtn ${i === step ? "on" : ""}`} onClick={() => setStep(i)} aria-pressed={i === step}>
                    <span className="mono">0{i + 1}</span><h3>{x.t}</h3><p>{x.d}</p>
                    {i === step && <i key={step} className="prog" style={{ animationPlayState: paused ? "paused" : "running" }} />}
                  </button>
                ))}
              </div>
              <div className="stage" aria-hidden key={step}>
                <div className="win"><span className="wd" /><span className="wd" /><span className="wd" /><span className="mono wt">{["Upload", "Retrieve", "Generate"][step]}</span></div>
                <div className="scene">
                  {step === 0 && (<>
                    <div className="drop"><span className="mono">Drop a PDF here</span></div>
                    <div className="fchip"><b>PDF</b>annual_report_2024.pdf</div>
                    <svg className="mcur" viewBox="0 0 16 20" width="18" height="22"><path d="M1 1l12 9-5 1 3 7-3 1-3-7-4 4z" fill="#202B48" stroke="#fff" /></svg>
                    <div className="upc">
                      <div className="upn"><b>PDF</b>annual_report_2024.pdf</div>
                      <div className="upb"><i /></div>
                      <div className="ups mono"><span>Uploading…</span><span>Extracting text…</span><span>Ready to chat</span></div>
                    </div>
                  </>)}
                  {step === 1 && (<>
                    <div className="qin"><span className="typed mono">What drove the margin improvement?</span><i className="caret" /></div>
                    <p className="mono toplab">Top matches</p>
                    <div className="rows">
                      {ROWS.map((x, i) => (
                        <div key={x.p} className={`mrow ${x.hit ? "rh" : "rm"}`} style={{ animationDelay: `${0.2 + i * 0.12}s, 3.2s` }}>
                          <span className="mono">p. {x.p}</span><span className="rt">{x.t}</span>
                          <span className="rb"><i style={{ "--w": `${x.w}%`, animationDelay: `${1.9 + i * 0.2}s` } as React.CSSProperties} /></span>
                        </div>
                      ))}
                    </div>
                  </>)}
                  {step === 2 && (<>
                    <div className="q" style={{ alignSelf: "flex-end" }}>What drove the margin improvement?</div>
                    <div className="stat3"><span className="dots"><i /><i /><i /></span></div>
                    <div className="a3">
                      {A1.map((w, i) => <span key={w} style={{ animationDelay: `${1.2 + i * 0.12}s` }}>{w} </span>)}
                      <em className="pop">1</em>{" "}
                      {A2.map((w, i) => <span key={w} style={{ animationDelay: `${2.1 + i * 0.12}s` }}>{w} </span>)}
                    </div>
                    <div className="srcc">
                      <span className="mono">Source · p. 12</span>
                      <span className="ul" style={{ animationDelay: "3.4s" }}>{PASS[1].t}</span>
                    </div>
                  </>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="wrap map">
            <div>
              <motion.span className="tag mono" initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>Exploration / Planned capability</motion.span>
              <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>Don’t just read the document. See how its ideas connect.</motion.h2>
              <p style={{ marginTop: 20, maxWidth: 440 }}>A concept for turning a PDF into a map of its sections, terms, claims and evidence. It tours the map on its own; select any node to take over. Sample content.</p>
              <div className="detail" aria-live="polite">
                <AnimatePresence mode="wait">
                  <motion.div key={sel.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                    <p className="mono">{sel.label}</p>
                    <p style={{ marginTop: 8 }}>{sel.note}</p>
                    <ul className="evl">
                      {sel.ev.map((e, i) => (
                        <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.12 }}><span className="chip">p. {e.p}</span>{e.t}</motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            <motion.div className="mapbox" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}>
              <svg viewBox="0 0 700 380" role="group" aria-label="Concept knowledge map">
                {NODES.flatMap((n) => n.rel.filter((r) => r > n.id).map((r) => {
                  const m = NODES.find((x) => x.id === r)!;
                  const on = sel.id === n.id || sel.id === r;
                  return <motion.line key={n.id + r} className="xl" x1={n.x + 50} y1={n.y + 16} x2={m.x + 50} y2={m.y + 16} strokeWidth="1.2" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} animate={{ stroke: on ? "#536BA6" : "#DCDAD4" }} />;
                }))}
                {NODES.map((n, i) => (
                  <motion.line key={n.id} x1="350" y1="190" x2={n.x + 50} y2={n.y + 16} strokeWidth={sel.id === n.id ? 2 : 1.5}
                    animate={{ stroke: sel.id === n.id ? "#536BA6" : "#DCDAD4" }}
                    initial={{ pathLength: rm ? 1 : 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.9, delay: 0.15 + i * 0.08 }} />
                ))}
                {!rm && (
                  <motion.circle key={sel.id} r="4" fill="#536BA6" initial={{ cx: 350, cy: 190, opacity: 0 }}
                    animate={{ cx: [350, sel.x + 50], cy: [190, sel.y + 16], opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
                )}
                <motion.g style={{ transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 160, damping: 16 }}>
                  <rect x="270" y="165" width="160" height="50" rx="4" fill="#202B48" />
                  <text x="350" y="195" textAnchor="middle" style={{ fill: "#fff" }}>Document</text>
                </motion.g>
                {NODES.map((n, i) => (
                  <motion.g key={n.id} tabIndex={0} role="button" aria-label={n.label} onClick={() => { setTouched(true); setSel(n); }}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (setTouched(true), setSel(n))}
                    style={{ transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties}
                    initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                    whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.5 + i * 0.08 }}>
                    <motion.rect x={n.x} y={n.y} width="100" height="32" rx="4" strokeWidth="1.5"
                      animate={{ fill: sel.id === n.id ? "#EEF1F8" : "#FFFFFF", stroke: sel.id === n.id ? "#536BA6" : "#DCDAD4" }} />
                    <text x={n.x + 50} y={n.y + 20} textAnchor="middle">{n.label}</text>
                  </motion.g>
                ))}
                {sel.ev.map((e, i) => {
                  const cx = sel.x + 50, cy = sel.y + 16;
                  const dx = cx - 350, dy = cy - 190, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
                  const off = (i - (sel.ev.length - 1) / 2) * 40;
                  const sx = Math.min(Math.max(cx + ux * 80 - uy * off, 40), 660), sy = Math.min(Math.max(cy + uy * 80 + ux * off, 22), 358);
                  return (
                    <g key={sel.id + i}>
                      <motion.line x1={cx} y1={cy} x2={sx} y2={sy} stroke="#536BA6" strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
                      <motion.g style={{ transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.25 + i * 0.1 }}>
                        <rect x={sx - 27} y={sy - 11} width="54" height="22" rx="11" fill="#EEF1F8" stroke="#536BA6" />
                        <text x={sx} y={sy + 4} textAnchor="middle" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, fill: "#536BA6" }}>p. {e.p}</text>
                      </motion.g>
                    </g>
                  );
                })}
              </svg>
            </motion.div>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="head"><h2>Where it could go next.</h2><p>Concepts only — none of these are available in the app today.</p></div>
            <div className="concepts">
              {CONCEPTS.map((c, i) => {
                const V = c.V;
                return (
                  <motion.article className="ccard" key={c.t}
                    initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, delay: i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
                    whileHover={{ y: -6 }}>
                    <span className="mono">Concept</span>
                    <div className="cvis"><V rm={rm} /></div>
                    <h3>{c.t}</h3><p>{c.d}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="architecture">
          <div className="wrap">
            <div className="head"><h2>Architecture</h2><p>How a request moves through the project. Pick a flow to watch it travel.</p></div>
            <ArchDiagram rm={rm} />
          </div>
        </section>

        <section className="final">
          <div className="wrap cta">
            <div>
              <h2>Make every document easier to understand.</h2>
              <p>Upload a PDF, ask a question, and see the answer traced back to the page it came from.</p>
              <div className="row">
                <button className="btn p" onClick={onLaunch}>Open the app</button>
                {REPO_URL && (
                  <a className="btn s" href={REPO_URL} target="_blank" rel="noopener noreferrer">Explore the project on GitHub</a>
                )}
              </div>
            </div>
            <DocArt rm={rm} />
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div><b className="brand">PDF Chat Companion</b><p>Ask questions of your PDFs, grounded in their content.</p></div>
          <nav aria-label="Footer"><a href="#features">Features</a><a href="#how">How it works</a><a href="#architecture">Architecture</a>
            {REPO_URL && <a href={REPO_URL} target="_blank" rel="noopener noreferrer">GitHub</a>}</nav>
          <p className="mono">Next.js · TypeScript · Server-Sent Events</p>
        </div>
      </footer>
    </div>
  );
}