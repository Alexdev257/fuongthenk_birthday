"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const wishes = [
  { title: "Bình yên", text: "Mong những ngày phía trước luôn dịu dàng với FuongThenn.", color: "sky" },
  { title: "Rực rỡ", text: "Mong bạn luôn tự tin tỏa sáng theo cách rất riêng của mình.", color: "blue" },
  { title: "May mắn", text: "Mong mọi điều bạn chờ đợi đều tìm được đường để ghé thăm.", color: "indigo" },
];

const petals = [
  [7, 12, 0.1, 0.8], [16, 72, 0.4, 1.1], [26, 28, 0.2, 0.9],
  [38, 83, 0.8, 1.2], [49, 8, 0.5, 0.8], [61, 70, 0.3, 1.1],
  [73, 17, 0.7, 0.9], [85, 77, 0, 1.2], [94, 34, 0.6, 0.9],
] as const;

function Flower({ className = "", small = false }: { className?: string; small?: boolean }) {
  return (
    <svg className={className} width={small ? 42 : 74} height={small ? 42 : 74} viewBox="0 0 74 74" fill="none" aria-hidden="true">
      <path d="M37 38C23 45 17 54 17 68" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 49C20 45 14 46 10 53C18 58 25 57 30 53" fill="#BCE9FF" stroke="currentColor" strokeWidth="1.5" />
      <path d="M44 49C53 44 60 46 63 53C55 59 48 57 43 54" fill="#D6F2FF" stroke="currentColor" strokeWidth="1.5" />
      <g className="flower-head">
        {[0, 72, 144, 216, 288].map((rotation, index) => (
          <ellipse key={rotation} cx="37" cy="19" rx="9" ry="16" transform={`rotate(${rotation} 37 19)`} fill={index % 2 ? "#D6F2FF" : "#F8FCFF"} stroke="currentColor" strokeWidth="1.5" />
        ))}
        <circle cx="37" cy="19" r="7" fill="#3478E5" />
        <circle cx="34.5" cy="16.5" r="2" fill="white" fillOpacity=".8" />
      </g>
    </svg>
  );
}

function Sparkle({ className = "" }: { className?: string }) {
  return <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M14 1C14 9.5 9.5 14 1 14C9.5 14 14 18.5 14 27C14 18.5 18.5 14 27 14C18.5 14 14 9.5 14 1Z" fill="currentColor" /></svg>;
}

function SoundIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6.7 8.5H3v7h3.7L11 19V5Zm4.2 5.2 5.6 5.6m0-5.6-5.6 5.6" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6.7 8.5H3v7h3.7L11 19V5Zm4.3 4a4 4 0 0 1 0 6m2.6-8.6a8 8 0 0 1 0 11.2" /></svg>
  );
}

function Bouquet() {
  return (
    <svg className="bouquet" viewBox="0 0 440 440" fill="none" aria-label="Bó hoa xanh dành tặng FuongThenn" role="img">
      <defs>
        <linearGradient id="paper" x1="130" y1="170" x2="313" y2="392" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" /><stop offset="1" stopColor="#DDEEFF" /></linearGradient>
        <linearGradient id="petal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FDFEFF" /><stop offset="1" stopColor="#9FD7FF" /></linearGradient>
        <filter id="shadow" x="70" y="55" width="310" height="365" filterUnits="userSpaceOnUse"><feDropShadow dx="0" dy="16" stdDeviation="13" floodColor="#2674CA" floodOpacity=".2" /></filter>
      </defs>
      <circle cx="220" cy="207" r="156" fill="#EAF6FF" />
      <circle cx="220" cy="207" r="132" stroke="#B8DFFF" strokeDasharray="4 12" />
      <g filter="url(#shadow)">
        <path d="m122 167 92 67L112 346c-13 26 11 50 36 36l74-42 74 42c25 14 49-10 36-36L230 234l88-67-196 0Z" fill="url(#paper)" stroke="#2870CA" strokeWidth="2" />
        <path d="m122 167 92 67-36 75-56-142Zm196 0-88 67 37 75 51-142Z" fill="#CDE9FF" />
        <path d="M161 155c28 43 46 73 60 135m55-137c-30 39-46 79-55 137m-6-142c3 43 5 84 6 142" stroke="#4D9B7F" strokeWidth="5" strokeLinecap="round" />
        <path d="M177 219c-33-18-50-11-60 9 25 14 47 10 64-1m83-2c29-21 51-17 61 1-21 17-44 18-64 7" fill="#A8DFC9" stroke="#4D9B7F" strokeWidth="2" />
        {[
          { x: 149, y: 140, rx: 23, ry: 36, rotations: [-28, 44, 116, 188, 260], cls: "bouquet-flower-one" },
          { x: 220, y: 113, rx: 25, ry: 39, rotations: [0, 72, 144, 216, 288], cls: "bouquet-flower-two" },
          { x: 290, y: 146, rx: 22, ry: 34, rotations: [20, 92, 164, 236, 308], cls: "bouquet-flower-three" },
        ].map((flower) => (
          <g className={`bouquet-flower ${flower.cls}`} key={flower.x}>
            {flower.rotations.map((rotation) => <ellipse key={rotation} cx={flower.x} cy={flower.y} rx={flower.rx} ry={flower.ry} transform={`rotate(${rotation} ${flower.x} ${flower.y})`} fill="url(#petal)" stroke="#3478E5" strokeWidth="2" />)}
            <circle cx={flower.x} cy={flower.y} r={flower.x === 220 ? 15 : 13} fill="#2469CD" />
          </g>
        ))}
        <path d="M168 321c32 26 69 29 107 0" stroke="#2870CA" strokeWidth="5" strokeLinecap="round" />
        <path d="M221 318c-23-17-47 1-37 21 8 16 28 8 37-3 9 11 29 19 37 3 10-20-14-38-37-21Z" fill="#6BB7F2" stroke="#2870CA" strokeWidth="2" />
      </g>
      <g fill="#3478E5"><circle cx="78" cy="145" r="5" /><circle cx="353" cy="104" r="4" /><circle cx="367" cy="261" r="6" /></g>
      <path d="M93 85c0 13-7 20-20 20 13 0 20 7 20 20 0-13 7-20 20-20-13 0-20-7-20-20Zm268 83c0 10-5 15-15 15 10 0 15 5 15 15 0-10 5-15 15-15-10 0-15-5-15-15Z" fill="#85CBFF" />
    </svg>
  );
}

function Cake({ blown }: { blown: boolean }) {
  return (
    <svg className="cake" viewBox="0 0 420 390" fill="none" aria-hidden="true">
      <defs><linearGradient id="cakeSide" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#DDF2FF" /><stop offset="1" stopColor="#8CCAF5" /></linearGradient><filter id="cakeShadow" x="48" y="80" width="324" height="285" filterUnits="userSpaceOnUse"><feDropShadow dx="0" dy="18" stdDeviation="14" floodColor="#1C5DA7" floodOpacity=".17" /></filter></defs>
      <ellipse cx="210" cy="336" rx="153" ry="22" fill="#B9DCFA" opacity=".5" />
      <g filter="url(#cakeShadow)">
        <path d="M88 205h244v111c0 23-55 42-122 42S88 339 88 316V205Z" fill="url(#cakeSide)" stroke="#2367B7" strokeWidth="3" />
        <ellipse cx="210" cy="205" rx="122" ry="48" fill="#FAFDFF" stroke="#2367B7" strokeWidth="3" />
        <path d="M89 205c7 22 28 22 38 4 12-22 28-18 39 2 10 18 30 17 40-1 11-21 29-21 40 0 10 18 30 19 40 1 12-20 28-24 40-2 10 18 31 18 38-4" stroke="#78BFF1" strokeWidth="14" strokeLinecap="round" />
        <path d="M115 289c15 12 31 12 46 0m45 14c15 12 31 12 46 0m39-14c7 6 14 9 22 9" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity=".75" />
        <rect x="199" y="116" width="22" height="85" rx="8" fill="#F7FBFF" stroke="#2367B7" strokeWidth="3" />
        <path d="m201 129 18 12m-18 14 18 12" stroke="#78BFF1" strokeWidth="5" />
        {!blown ? <g className="flame"><path d="M210 111c-21-15-16-36 4-57 0 16 18 22 10 43-3 8-8 13-14 14Z" fill="#76C7FF" stroke="#2367B7" strokeWidth="2" /><path d="M212 103c-9-8-5-18 3-28 0 9 7 13 3 22-1 3-3 5-6 6Z" fill="white" /></g> : <path className="smoke" d="M210 109c-18-16 18-22 0-40-13-13 9-20 5-34" stroke="#8CB4D0" strokeWidth="4" strokeLinecap="round" />}
        <g fill="#3A84D7"><circle cx="145" cy="200" r="8" /><circle cx="275" cy="197" r="7" /><circle cx="188" cy="220" r="6" /><circle cx="238" cy="217" r="6" /></g>
      </g>
    </svg>
  );
}

function playChime() {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, now + index * 0.12);
    gain.gain.linearRampToValueAtTime(0.08, now + index * 0.12 + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.7);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now + index * 0.12);
    oscillator.stop(now + index * 0.12 + 0.72);
  });
  window.setTimeout(() => void ctx.close(), 1400);
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [activeWish, setActiveWish] = useState<number | null>(null);
  const [blown, setBlown] = useState(false);
  const [progress, setProgress] = useState(0);
  const storyRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("is-visible"); }), { threshold: 0.16 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const startStory = useCallback(() => {
    setStarted(true);
    if (!muted) playChime();
    window.setTimeout(() => storyRef.current?.scrollIntoView({ behavior: "smooth" }), 180);
  }, [muted]);

  const blowCandle = () => {
    if (blown) return;
    setBlown(true);
    if (!muted) playChime();
  };

  return (
    <main className={started ? "story-started" : ""}>
      <div className="scroll-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
      <nav className="nav-shell" aria-label="Điều hướng chính">
        <a className="brand" href="#top" aria-label="Về đầu trang"><span className="brand-flower">✿</span><span>FOR FUONGTHENN</span></a>
        <div className="nav-actions">
          <span className="nav-note">một ngày thật đặc biệt</span>
          <button className="sound-button" type="button" onClick={() => { setMuted((value) => !value); if (muted) playChime(); }} aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}>
            <SoundIcon muted={muted} /><span>{muted ? "Bật nhạc" : "Âm thanh"}</span>
          </button>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        {petals.map(([left, top, delay, scale], index) => <span className={`floating-petal petal-${(index % 3) + 1}`} key={`${left}-${top}`} style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s`, transform: `scale(${scale})` }} />)}
        <div className="hero-copy">
          <div className="eyebrow"><span /> Một câu chuyện dành riêng cho</div>
          <h1>FuongThenn,<span>hôm nay vũ trụ</span>có một bí mật nhỏ.</h1>
          <p className="hero-lede">Có một món quà đã đi qua mây xanh, những vì sao và cả một khu vườn đầy hoa — chỉ để tìm đến đúng một người.</p>
          <button className="primary-button" type="button" onClick={startStory}><span>Mở câu chuyện</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 12 10 0m-4-4 4 4-4 4" /></svg></button>
          <p className="micro-copy">Chạm để bắt đầu · Có một chút phép màu</p>
        </div>
        <div className="hero-art">
          <span className="art-label label-one">một bó hoa</span><span className="art-label label-two">cho riêng bạn</span>
          <Sparkle className="sparkle sparkle-one" /><Sparkle className="sparkle sparkle-two" /><Bouquet />
          <div className="orbit-text" aria-hidden="true">HAPPY • BIRTHDAY • FUONGTHENN •</div>
        </div>
        <a className="scroll-cue" href="#story" aria-label="Cuộn xuống câu chuyện"><span>CUỘN ĐỂ KHÁM PHÁ</span><i /></a>
      </section>

      <section className="story-section" id="story" ref={storyRef}>
        <div className="section-intro" data-reveal><p className="section-number">01 · CHUYỆN BẮT ĐẦU</p><h2>Mọi điều đẹp đẽ đều bắt đầu từ một tín hiệu rất nhỏ.</h2><p>Và sáng nay, tín hiệu ấy xuất hiện trên bầu trời.</p></div>
        <div className="chapter-list">
          <article className="chapter chapter-cloud" data-reveal>
            <div className="chapter-visual cloud-scene" aria-hidden="true"><span className="sun-disc" /><span className="cloud cloud-a" /><span className="cloud cloud-b" /><span className="tiny-star star-a">✦</span><span className="tiny-star star-b">✦</span><div className="letter"><span className="letter-heart">♥</span><span className="letter-line" /><span className="letter-line short" /></div><span className="dotted-path" /></div>
            <div className="chapter-copy"><p className="chapter-kicker">CHƯƠNG I · TÍN HIỆU ĐẦU TIÊN</p><h3>Một lá thư rơi xuống từ mây.</h3><p>Nó không ghi địa chỉ, chỉ có một dòng thật nhỏ: “Hãy mang điều dịu dàng nhất đến cho FuongThenn.”</p><span className="chapter-stamp">gửi bằng phép màu ✦</span></div>
          </article>
          <article className="chapter chapter-garden" data-reveal>
            <div className="chapter-copy"><p className="chapter-kicker">CHƯƠNG II · MẬT MÃ CỦA KHU VƯỜN</p><h3>Những bông hoa đã biết câu trả lời.</h3><p>Mỗi cánh hoa giữ một lời chúc. Càng nở rộ, chúng càng thì thầm: bình yên, rực rỡ và thật nhiều may mắn.</p><span className="chapter-stamp">ba điều luôn ở bên bạn ✿</span></div>
            <div className="chapter-visual garden-scene" aria-hidden="true"><span className="garden-hill hill-back" /><span className="garden-hill hill-front" /><Flower className="garden-flower flower-a" /><Flower className="garden-flower flower-b" small /><Flower className="garden-flower flower-c" /><Flower className="garden-flower flower-d" small /><span className="butterfly">⌁</span></div>
          </article>
          <article className="chapter chapter-stars" data-reveal>
            <div className="chapter-visual star-scene" aria-hidden="true"><span className="planet-ring" /><span className="moon-face"><i /><b /></span><span className="comet" /><span className="constellation"><i /><i /><i /><i /></span><p>f · t</p></div>
            <div className="chapter-copy"><p className="chapter-kicker">CHƯƠNG III · CHUYẾN ĐI CỦA NHỮNG VÌ SAO</p><h3>Cả bầu trời cùng chỉ về một hướng.</h3><p>Những vì sao xếp thành một con đường xanh lấp lánh. Ở cuối con đường ấy là khoảnh khắc hôm nay — và là bạn.</p><span className="chapter-stamp">đích đến đã ở rất gần ☾</span></div>
          </article>
          <article className="chapter chapter-reveal" data-reveal>
            <div className="reveal-inner"><p className="chapter-kicker">CHƯƠNG IV · NGƯỜI CÂU CHUYỆN CHỜ ĐỢI</p><p className="tiny-intro">Lá thư cuối cùng cũng mở ra, và bên trong chỉ có một cái tên…</p><h3>FuongThenn</h3><p>Hóa ra, tất cả hoa, mây và ánh sao đều đang chuẩn bị cho ngày đặc biệt của bạn.</p><div className="signature-line"><span /> dành riêng cho bạn <span /></div></div>
            <Flower className="corner-flower corner-flower-a" /><Flower className="corner-flower corner-flower-b" /><Sparkle className="corner-sparkle" />
          </article>
        </div>
      </section>

      <section className="wish-garden" id="wishes">
        <div className="wish-heading" data-reveal><p className="section-number light">02 · KHU VƯỜN LỜI CHÚC</p><h2>Ba bông hoa, ba điều thật lòng.</h2><p>Chạm vào từng bông hoa để nghe khu vườn thì thầm.</p></div>
        <div className="wish-flowers" data-reveal>
          {wishes.map((wish, index) => <button className={`wish-flower wish-${wish.color} ${activeWish === index ? "active" : ""}`} key={wish.title} type="button" onClick={() => { setActiveWish(index); if (!muted) playChime(); }} aria-expanded={activeWish === index}><span className="wish-bloom" aria-hidden="true"><i /><i /><i /><i /><i /><b /></span><span className="wish-stem" aria-hidden="true"><i /></span><strong>{wish.title}</strong></button>)}
        </div>
        <div className={`wish-message ${activeWish !== null ? "visible" : ""}`} aria-live="polite">{activeWish !== null ? <><span>✦</span><p>{wishes[activeWish].text}</p><span>✦</span></> : <p>Chọn một bông hoa nhé</p>}</div>
      </section>

      <section className={`finale ${blown ? "wish-made" : ""}`} id="finale">
        {blown && <div className="celebration" aria-hidden="true">{Array.from({ length: 32 }).map((_, index) => <i key={index} style={{ "--i": index } as React.CSSProperties} />)}</div>}
        <div className="finale-copy" data-reveal><p className="section-number">03 · ĐIỀU ƯỚC CUỐI CÙNG</p><h2>{blown ? "Điều ước đã bay đến những vì sao!" : "Còn một ngọn nến đang chờ FuongThenn."}</h2><p>{blown ? "Chúc cho điều bạn vừa ước sớm trở thành một phần thật đẹp của những ngày phía trước." : "Nhắm mắt lại, nghĩ về một điều thật đẹp — rồi chạm để thổi nến nhé."}</p><button className="candle-button" type="button" onClick={blowCandle} disabled={blown}>{blown ? "Điều ước đã được gửi ✦" : "Thổi nến nào"}</button></div>
        <div className="cake-wrap" data-reveal><Cake blown={blown} /><span className="cake-note">make a wish</span></div>
      </section>

      <section className="birthday-card">
        <div className="card-shell" data-reveal>
          <div className="card-topline"><span>WITH LOVE</span><span>✦</span><span>JUST FOR YOU</span></div><Sparkle className="card-sparkle card-sparkle-a" /><Sparkle className="card-sparkle card-sparkle-b" /><Flower className="card-flower card-flower-a" /><Flower className="card-flower card-flower-b" />
          <p className="card-small">Và cuối cùng…</p><h2>Happy Birthday,</h2><h3>FuongThenn!</h3><p className="card-message">Chúc bạn một tuổi mới ngập tràn những điều trong trẻo như mây, dịu dàng như hoa và rực rỡ như cả bầu trời đêm. Mong bạn luôn được yêu thương, được là chính mình và gặp thật nhiều lý do để mỉm cười.</p><div className="card-seal"><span>F</span><small>✿</small></div><p className="card-closing">Một ngày sinh nhật thật hạnh phúc nhé!</p>
        </div>
      </section>

      <footer><a className="brand footer-brand" href="#top"><span className="brand-flower">✿</span><span>FOR FUONGTHENN</span></a><p>Được gói bằng hoa, mây và thật nhiều yêu thương.</p><a href="#top" className="back-top">Trở về đầu trang ↑</a></footer>
    </main>
  );
}
