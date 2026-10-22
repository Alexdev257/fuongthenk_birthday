"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";

const SCENES = [
  { id: "prologue", label: "Chiếc hộp", duration: 7 },
  { id: "clockwork", label: "Nhịp đầu", duration: 7 },
  { id: "garden", label: "Vườn giấy", duration: 9 },
  { id: "melody", label: "Giai điệu", duration: 8 },
  { id: "reveal", label: "Kéo rèm", duration: 8 },
  { id: "gift", label: "Món quà", duration: 11 },
  { id: "finale", label: "Lời chúc", duration: 12 },
] as const;

const TOTAL_DURATION = SCENES.reduce((total, scene) => total + scene.duration, 0);
const sceneStarts = SCENES.map((_, index) => SCENES.slice(0, index).reduce((total, scene) => total + scene.duration, 0));
const petals = Array.from({ length: 26 }, (_, index) => ({
  left: (index * 41 + 7) % 98,
  delay: (index * 0.29) % 4.8,
  duration: 5.1 + (index % 5) * 0.55,
  size: 7 + (index % 4) * 3,
  drift: -42 + (index % 8) * 12,
}));
const stars = Array.from({ length: 34 }, (_, index) => ({
  left: (index * 43 + 5) % 100,
  top: (index * 31 + 9) % 92,
  delay: (index % 9) * 0.24,
  size: 1 + (index % 3),
}));
const dialMarks = Array.from({ length: 36 }, (_, index) => index);

function formatTime(value: number) {
  const seconds = Math.max(0, Math.floor(value));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function Flower({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg className={`flower ${className}`} style={{ "--delay": `${delay}s` } as React.CSSProperties} viewBox="0 0 120 188" fill="none" aria-hidden="true">
      <path d="M61 74c-9 34-9 72-4 112" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M57 125C37 109 20 113 13 130c18 12 33 11 46 2M58 149c18-20 36-19 46-3-15 16-32 18-47 10" fill="#b7dfd2" stroke="currentColor" strokeWidth="2.5" />
      <g className="flower-bloom">
        {[0, 72, 144, 216, 288].map((rotation, index) => <ellipse key={rotation} cx="60" cy="50" rx="20" ry="38" transform={`rotate(${rotation} 60 50)`} fill={index % 2 ? "#d8f1ff" : "#fff"} stroke="#367cba" strokeWidth="2" />)}
        <circle cx="60" cy="50" r="15" fill="#2e75b9" /><circle cx="55" cy="44" r="4" fill="#fff" fillOpacity=".78" />
      </g>
    </svg>
  );
}

function Sparkle({ className = "" }: { className?: string }) {
  return <svg className={`sparkle ${className}`} viewBox="0 0 40 40" aria-hidden="true"><path d="M20 1c0 12.4-6.6 19-19 19 12.4 0 19 6.6 19 19 0-12.4 6.6-19 19-19-12.4 0-19-6.6-19-19Z" fill="currentColor" /></svg>;
}

function PlayIcon({ playing }: { playing: boolean }) {
  return playing ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6v12M16 6v12" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z" /></svg>;
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return muted ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 7 9H3v6h4l4 4V5Zm4 6 6 6m0-6-6 6" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 7 9H3v6h4l4 4V5Zm4.5 4a4 4 0 0 1 0 6m2.5-8.5a8 8 0 0 1 0 11" /></svg>;
}

function FullscreenIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M8 21H3v-5m13 5h5v-5" /></svg>;
}

function SceneFrame({ active, children, className }: { active: boolean; children: React.ReactNode; className: string }) {
  return <section className={`movie-scene ${className} ${active ? "is-active" : ""}`} aria-hidden={!active}>{children}</section>;
}

function MusicBox({ open = false, className = "" }: { open?: boolean; className?: string }) {
  return (
    <div className={`music-box ${open ? "box-open" : ""} ${className}`} aria-hidden="true">
      <div className="box-aura" />
      <div className="box-lid"><div className="lid-inlay"><span>F</span><i>✿</i></div></div>
      <div className="box-stage"><i /><b /><span>one of one</span></div>
      <div className="box-body"><div className="box-drawer"><span /></div><i className="body-line" /></div>
      <div className="box-feet"><i /><i /></div>
      <div className="winding-key"><i /><b /></div>
    </div>
  );
}

function PetalRain({ className = "" }: { className?: string }) {
  return <div className={`petal-rain ${className}`} aria-hidden="true">{petals.map((petal, index) => <i key={index} style={{ left: `${petal.left}%`, width: petal.size, height: petal.size * 1.55, animationDelay: `${petal.delay}s`, animationDuration: `${petal.duration}s`, "--drift": `${petal.drift}px` } as React.CSSProperties} />)}</div>;
}

function CakeModel({ active, shouldLoad }: { active: boolean; shouldLoad: boolean }) {
  const ModelViewer = "model-viewer" as React.ElementType;
  const [modelState, setModelState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!shouldLoad || typeof window === "undefined") return;
    void import("@google/model-viewer").catch(() => setModelState("error"));
  }, [shouldLoad]);

  return (
    <div className={`model-stage ${active ? "model-live" : ""} model-${modelState}`}>
      <div className="model-spotlight" /><div className="model-arch" /><div className="model-turntable"><i /></div>
      {shouldLoad && <ModelViewer className="cake-model" src="/models/fuongthenn-birthday-cake.glb" poster="/models/fuongthenn-cake-preview.png" alt="Mô hình 3D bánh sinh nhật trắng xanh có nơ và hoa dành cho FuongThenn" camera-orbit="24deg 72deg 2.75m" min-camera-orbit="auto 60deg 2.25m" max-camera-orbit="auto 84deg 3.5m" field-of-view="27deg" shadow-intensity="1.2" shadow-softness=".9" exposure="1.08" environment-image="neutral" loading="eager" camera-controls auto-rotate rotation-per-second="10deg" interaction-prompt="none" disable-zoom reveal="auto" onLoad={() => setModelState("ready")} onError={() => setModelState("error")}>
        <div slot="progress-bar" className="model-progress"><span /></div>
      </ModelViewer>}
      {modelState === "error" && <div className="model-fallback" role="img" aria-label="Biểu tượng chiếc bánh sinh nhật"><strong>✿</strong><p>Món quà vẫn đang ở đây</p><small>Hãy giữ điều ước thật gần nhé</small></div>}
      <p className="model-hint">Chạm &amp; kéo để xoay món quà 3D</p>
    </div>
  );
}

function startMusicBoxAudio() {
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  const context = new AudioCtx();
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  master.gain.value = 0.15;
  filter.type = "lowpass";
  filter.frequency.value = 2600;
  master.connect(filter).connect(context.destination);
  const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 783.99, 659.25, 523.25, 587.33, 659.25];
  let cursor = 0;
  const playNote = () => {
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const shimmer = context.createOscillator();
    const gain = context.createGain();
    const shimmerGain = context.createGain();
    oscillator.type = "sine";
    shimmer.type = "triangle";
    oscillator.frequency.value = melody[cursor % melody.length];
    shimmer.frequency.value = oscillator.frequency.value * 2;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.052, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
    shimmerGain.gain.setValueAtTime(0.0001, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.012, now + 0.018);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    oscillator.connect(gain).connect(master);
    shimmer.connect(shimmerGain).connect(master);
    oscillator.start(now); shimmer.start(now);
    oscillator.stop(now + 1.08); shimmer.stop(now + .58);
    cursor += 1;
  };
  playNote();
  const timer = window.setInterval(playNote, 610);
  return { context, master, timer };
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const audioRef = useRef<ReturnType<typeof startMusicBoxAudio>>(null);

  const sceneIndex = useMemo(() => {
    const index = SCENES.findIndex((scene, itemIndex) => elapsed < sceneStarts[itemIndex] + scene.duration);
    return index === -1 ? SCENES.length - 1 : index;
  }, [elapsed]);
  const sceneElapsed = elapsed - sceneStarts[sceneIndex];
  const wishReleased = sceneIndex > 5 || (sceneIndex === 5 && sceneElapsed > 7.2);

  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);
  useEffect(() => {
    if (!started || !playing) { lastFrameRef.current = null; return; }
    let frame = 0;
    const tick = (time: number) => {
      if (lastFrameRef.current === null) lastFrameRef.current = time;
      const delta = Math.min((time - lastFrameRef.current) / 1000, 0.1);
      lastFrameRef.current = time;
      const next = Math.min(TOTAL_DURATION, elapsedRef.current + delta);
      elapsedRef.current = next;
      setElapsed(next);
      if (next >= TOTAL_DURATION) setPlaying(false);
      else frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, started]);
  useEffect(() => () => { if (audioRef.current) { window.clearInterval(audioRef.current.timer); void audioRef.current.context.close(); } }, []);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = startMusicBoxAudio();
    return audioRef.current;
  }, []);
  const beginFilm = useCallback(() => {
    setStarted(true); setPlaying(true); setElapsed(0); elapsedRef.current = 0;
    const audio = ensureAudio();
    if (audio) audio.master.gain.setTargetAtTime(muted ? 0 : 0.15, audio.context.currentTime, 0.07);
  }, [ensureAudio, muted]);
  const togglePlayback = useCallback(() => {
    if (!started) return beginFilm();
    if (elapsedRef.current >= TOTAL_DURATION) { setElapsed(0); elapsedRef.current = 0; setPlaying(true); void ensureAudio()?.context.resume(); return; }
    setPlaying((value) => { const next = !value; const audio = ensureAudio(); if (audio) void (next ? audio.context.resume() : audio.context.suspend()); return next; });
  }, [beginFilm, ensureAudio, started]);
  const toggleMuted = useCallback(() => {
    setMuted((value) => { const next = !value; const audio = ensureAudio(); if (audio) audio.master.gain.setTargetAtTime(next ? 0 : 0.15, audio.context.currentTime, 0.07); return next; });
  }, [ensureAudio]);
  const seek = useCallback((value: number) => { const next = Math.max(0, Math.min(TOTAL_DURATION, value)); elapsedRef.current = next; setElapsed(next); }, []);
  const jumpScene = useCallback((index: number) => seek(sceneStarts[index] + 0.05), [seek]);
  const toggleFullscreen = useCallback(() => { if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.(); else void document.exitFullscreen?.(); }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return;
      if (event.code === "Space") { event.preventDefault(); togglePlayback(); }
      if (event.key === "ArrowRight") seek(elapsedRef.current + 5);
      if (event.key === "ArrowLeft") seek(elapsedRef.current - 5);
      if (event.key.toLowerCase() === "m") toggleMuted();
      if (event.key.toLowerCase() === "f") toggleFullscreen();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [seek, toggleFullscreen, toggleMuted, togglePlayback]);

  const darkScene = ["clockwork", "melody", "reveal", "gift"].includes(SCENES[sceneIndex].id);

  return (
    <main className={`film-app scene-${SCENES[sceneIndex].id} ${darkScene ? "dark-scene" : ""} ${started ? "film-started" : ""}`}>
      <div className="film-texture" aria-hidden="true" /><div className="film-vignette" aria-hidden="true" />
      <div className="edge-progress" aria-hidden="true"><i style={{ width: `${(elapsed / TOTAL_DURATION) * 100}%` }} /></div>
      <p className="sr-only" aria-live="polite">Cảnh {sceneIndex + 1}: {SCENES[sceneIndex].label}</p>

      <header className="film-header">
        <div className="film-signature"><span>F</span><p>THE BLUE MUSIC BOX<small>ONE OF ONE · FOR FUONGTHENN</small></p></div>
        <div className="chapter-chip"><span>{String(sceneIndex + 1).padStart(2, "0")}</span><p>{SCENES[sceneIndex].label}</p></div>
      </header>

      <div className="scene-stack">
        <SceneFrame active={sceneIndex === 0} className="prologue-scene">
          <div className="porcelain-grid" /><div className="prologue-orbit orbit-one" /><div className="prologue-orbit orbit-two" />
          <div className="story-copy prologue-copy"><p>MỘT PHIÊN BẢN DUY NHẤT</p><h1>Có một chiếc hộp<br /><em>chỉ mở hôm nay.</em></h1><span>Bên trong là một giai điệu đã học cách gọi tên bạn.</span></div>
          <MusicBox open className="hero-box" />
          <Flower className="prologue-flower flower-a" /><Flower className="prologue-flower flower-b" delay={-1.4} />
          <Sparkle className="prologue-sparkle sparkle-a" /><Sparkle className="prologue-sparkle sparkle-b" />
        </SceneFrame>

        <SceneFrame active={sceneIndex === 1} className="clockwork-scene">
          <div className="clock-stars" aria-hidden="true">{stars.map((star, index) => <i key={index} style={{ left: `${star.left}%`, top: `${star.top}%`, width: star.size, height: star.size, animationDelay: `${star.delay}s` }} />)}</div>
          <div className="clock-dial" aria-hidden="true"><div className="dial-marks">{dialMarks.map((mark) => <i key={mark} style={{ "--mark": mark } as React.CSSProperties} />)}</div><div className="clock-hand hand-long" /><div className="clock-hand hand-short" /><div className="dial-center">✿</div><span>HÔM NAY</span></div>
          <div className="story-copy clock-copy"><p>CHƯƠNG I · NHỊP ĐẦU TIÊN</p><h2>Thời gian dừng lại<br />một nhịp.</h2><span>Đủ lâu để cả thế giới nhớ rằng hôm nay là ngày của FuongThenn.</span></div>
          <div className="clock-ring ring-one" /><div className="clock-ring ring-two" />
        </SceneFrame>

        <SceneFrame active={sceneIndex === 2} className="garden-scene">
          <div className="paper-sun"><span /></div><div className="paper-hill hill-one" /><div className="paper-hill hill-two" /><div className="paper-hill hill-three" />
          <div className="garden-platform"><i /><b /></div>
          <div className="garden-flowers" aria-hidden="true">{Array.from({ length: 11 }, (_, index) => <Flower key={index} className={`garden-flower garden-flower-${index + 1}`} delay={index * -.31} />)}</div>
          <div className="story-copy garden-copy"><p>CHƯƠNG II · KHU VƯỜN BẬT MỞ</p><h2>Hoa không nở theo mùa.<br /><em>Hoa nở theo nụ cười.</em></h2><span>Và hôm nay, cả khu vườn chọn nở vì bạn.</span></div>
          <span className="paper-bird bird-one">⌁</span><span className="paper-bird bird-two">⌁</span>
        </SceneFrame>

        <SceneFrame active={sceneIndex === 3} className="melody-scene">
          <div className="melody-stars" aria-hidden="true">{stars.map((star, index) => <i key={index} style={{ left: `${star.left}%`, top: `${star.top}%`, animationDelay: `${star.delay}s` }} />)}</div>
          <svg className="music-staff" viewBox="0 0 900 390" fill="none" aria-hidden="true"><path d="M-20 110C185 0 302 232 492 122s282-16 435 66M-28 155C174 43 306 274 498 166s277-9 436 66M-35 200C169 88 311 318 504 211s273-4 437 66M-42 245C166 133 314 360 510 256s268 1 438 67" />{[[105,99],[236,184],[373,109],[520,203],[665,116],[792,235]].map(([x,y], index) => <g key={`${x}-${y}`} className={`staff-note note-${index + 1}`}><circle cx={x} cy={y} r="13" /><path d={`M${x + 12} ${y}v-70`} /></g>)}</svg>
          <div className="wish-constellation" aria-hidden="true"><span>BÌNH YÊN</span><span>RỰC RỠ</span><span>MAY MẮN</span><span>ĐƯỢC YÊU</span></div>
          <div className="story-copy melody-copy"><p>CHƯƠNG III · GIAI ĐIỆU BIẾT NÓI</p><h2>Mỗi nốt nhạc giữ<br />một lời chúc.</h2><span>Nghe thật kỹ nhé — tên bạn đang nằm giữa điệp khúc.</span></div>
        </SceneFrame>

        <SceneFrame active={sceneIndex === 4} className="reveal-scene">
          <div className="stage-light" /><div className="curtain curtain-left"><i /><i /><i /></div><div className="curtain curtain-right"><i /><i /><i /></div>
          <PetalRain className="reveal-petals" />
          <div className="reveal-title"><p>VÀ NHÂN VẬT CHÍNH LÀ</p><span className="reveal-kicker">một người thật đặc biệt</span><h2>Fuong<span>Thenn</span></h2><div><i /> one of one <i /></div></div>
          <Sparkle className="reveal-sparkle sparkle-one" /><Sparkle className="reveal-sparkle sparkle-two" />
        </SceneFrame>

        <SceneFrame active={sceneIndex === 5} className={`gift-scene ${wishReleased ? "wish-released" : ""}`}>
          <div className="gift-stars" aria-hidden="true">{stars.slice(0, 22).map((star, index) => <i key={index} style={{ left: `${star.left}%`, top: `${star.top}%`, animationDelay: `${star.delay}s` }} />)}</div>
          <div className="story-copy gift-copy"><p>CHƯƠNG IV · MÓN QUÀ CUỐI</p><h2>{wishReleased ? "Điều ước đã được cất vào giai điệu." : "Một vòng quay cho một điều ước."}</h2><span>{wishReleased ? "Từ giờ, mỗi lần nhớ lại, điều đẹp đẽ ấy sẽ gần bạn thêm một chút." : "Nhắm mắt một giây — phần còn lại cứ để chiếc hộp nhạc lo."}</span><div className="wish-beats"><i /><i /><i /></div></div>
          <CakeModel active={sceneIndex === 5} shouldLoad={sceneIndex >= 4} />
          <div className={`wish-aura ${wishReleased ? "released" : ""}`}><i /><span /></div>
          {wishReleased && <div className="wish-burst" aria-hidden="true">{Array.from({ length: 34 }, (_, index) => <i key={index} style={{ "--i": index } as React.CSSProperties} />)}</div>}
        </SceneFrame>

        <SceneFrame active={sceneIndex === 6} className="finale-scene">
          <PetalRain className="finale-petals" /><div className="finale-sun" /><div className="finale-ribbon ribbon-left" /><div className="finale-ribbon ribbon-right" />
          <Flower className="finale-flower flower-left" /><Flower className="finale-flower flower-right" delay={-1.1} />
          <div className="finale-ticket"><div className="ticket-number">NO. 01</div><p>THE BLUE MUSIC BOX PRESENTS</p><h2>Happy Birthday</h2><h3>FuongThenn!</h3><div className="ticket-rule"><i>✿</i></div><span>Chúc bạn một tuổi mới dịu dàng với chính mình,<br />can đảm với những điều mình yêu,<br />và luôn có thật nhiều lý do để mỉm cười.</span><strong>May your days bloom in blue.</strong><button type="button" onClick={beginFilm}>↻&nbsp;&nbsp; Mở hộp nhạc lần nữa</button></div>
        </SceneFrame>
      </div>

      {!started && <div className="premiere-overlay"><div className="cover-rays" /><div className="cover-flower cover-flower-left"><Flower /></div><div className="cover-flower cover-flower-right"><Flower delay={-1.3} /></div><div className="cover-card"><div className="cover-emblem"><i /><span>F</span><b>✿</b></div><p>AN ORIGINAL BIRTHDAY MUSIC BOX</p><h1><small>For</small>FuongThenn</h1><div className="cover-divider"><i /> one of one <i /></div><span>62 giây · Hoa sứ · Giai điệu · Món quà 3D</span><button type="button" onClick={beginFilm}><i><PlayIcon playing={false} /></i><span>Vặn khóa &amp; mở hộp</span></button><small><b>ÂM THANH BẬT</b> · Không cần cuộn</small></div></div>}

      <div className={`film-controls ${started ? "controls-visible" : ""}`}>
        <div className="chapter-track" aria-label="Chọn phân cảnh">{SCENES.map((scene, index) => <button type="button" key={scene.id} className={index === sceneIndex ? "active" : ""} onClick={() => jumpScene(index)} aria-label={`Đi đến cảnh ${scene.label}`}><i /><span>{String(index + 1).padStart(2, "0")}</span></button>)}</div>
        <div className="control-row"><button className="icon-button primary-control" type="button" onClick={togglePlayback} aria-label={playing ? "Tạm dừng phim" : "Phát phim"}><PlayIcon playing={playing} /></button><span className="timecode">{formatTime(elapsed)}</span><input className="film-scrubber" type="range" min="0" max={TOTAL_DURATION} step="0.05" value={elapsed} onChange={(event) => seek(Number(event.target.value))} style={{ "--progress": `${(elapsed / TOTAL_DURATION) * 100}%` } as React.CSSProperties} aria-label="Tua phim" /><span className="timecode duration">{formatTime(TOTAL_DURATION)}</span><button className="icon-button" type="button" onClick={toggleMuted} aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}><VolumeIcon muted={muted} /></button><button className="icon-button fullscreen-button" type="button" onClick={toggleFullscreen} aria-label="Toàn màn hình"><FullscreenIcon /></button></div>
      </div>
    </main>
  );
}
