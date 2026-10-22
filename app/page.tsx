"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";

const SCENES = [
  { id: "opening", label: "Mở đầu", duration: 6 },
  { id: "letter", label: "Lá thư", duration: 8 },
  { id: "garden", label: "Khu vườn", duration: 8 },
  { id: "stars", label: "Vì sao", duration: 8 },
  { id: "reveal", label: "Bí mật", duration: 7 },
  { id: "cake", label: "Điều ước", duration: 12 },
  { id: "finale", label: "Lời chúc", duration: 12 },
] as const;

const TOTAL_DURATION = SCENES.reduce((sum, scene) => sum + scene.duration, 0);
const sceneStarts = SCENES.map((_, index) => SCENES.slice(0, index).reduce((sum, scene) => sum + scene.duration, 0));
const petals = Array.from({ length: 24 }, (_, index) => ({ left: (index * 37 + 9) % 96, delay: (index * 0.31) % 4, duration: 4.8 + (index % 6) * 0.48, size: 8 + (index % 4) * 3, drift: -32 + (index % 7) * 11 }));
const stars = Array.from({ length: 38 }, (_, index) => ({ left: (index * 47 + 3) % 100, top: (index * 29 + 7) % 92, delay: (index % 8) * 0.28, size: 1 + (index % 3) }));

function formatTime(value: number) {
  const seconds = Math.max(0, Math.floor(value));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function Flower({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg className={`flower ${className}`} style={{ "--delay": `${delay}s` } as React.CSSProperties} viewBox="0 0 120 180" fill="none" aria-hidden="true">
      <path d="M60 76C48 110 48 139 53 178" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M53 126C35 109 20 111 12 126c16 14 31 15 43 6M56 143c18-19 35-18 44-3-14 15-31 18-45 9" fill="#a9dbc9" stroke="currentColor" strokeWidth="3" />
      <g className="flower-bloom">
        {[0, 72, 144, 216, 288].map((rotation, index) => <ellipse key={rotation} cx="60" cy="52" rx="22" ry="39" transform={`rotate(${rotation} 60 52)`} fill={index % 2 ? "#c9ecff" : "#fafdff"} stroke="#3b87d1" strokeWidth="2" />)}
        <circle cx="60" cy="52" r="16" fill="#377fd0" /><circle cx="54" cy="46" r="4" fill="#fff" fillOpacity=".72" />
      </g>
    </svg>
  );
}

function Sparkle({ className = "" }: { className?: string }) {
  return <svg className={`sparkle ${className}`} viewBox="0 0 40 40" aria-hidden="true"><path d="M20 1c0 12.4-6.6 19-19 19 12.4 0 19 6.6 19 19 0-12.4 6.6-19 19-19-12.4 0-19-6.6-19-19Z" fill="currentColor" /></svg>;
}

function Cloud({ className = "" }: { className?: string }) {
  return <span className={`cloud ${className}`} aria-hidden="true"><i /><b /></span>;
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

function CakeModel({ active }: { active: boolean }) {
  const ModelViewer = "model-viewer" as React.ElementType;
  useEffect(() => { if (active && typeof window !== "undefined") void import("@google/model-viewer"); }, [active]);
  return (
    <div className={`model-stage ${active ? "model-live" : ""}`}>
      <div className="model-halo" />
      <ModelViewer className="cake-model" src="/models/fuongthenn-birthday-cake.glb" poster="/models/fuongthenn-cake-preview.png" alt="Mô hình 3D bánh sinh nhật hoa xanh trắng dành cho FuongThenn" camera-orbit="28deg 73deg 2.8m" min-camera-orbit="auto 62deg 2.25m" max-camera-orbit="auto 82deg 3.6m" field-of-view="28deg" shadow-intensity="1.15" shadow-softness=".85" exposure="1.08" environment-image="neutral" auto-rotate rotation-per-second="12deg" interaction-prompt="none" disable-zoom reveal="auto">
        <div slot="progress-bar" className="model-progress"><span /></div>
      </ModelViewer>
      <div className="model-floor" /><span className="model-orbit orbit-one" /><span className="model-orbit orbit-two" />
    </div>
  );
}

function startAmbientAudio() {
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  const context = new AudioCtx();
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  master.gain.value = 0.16;
  filter.type = "lowpass";
  filter.frequency.value = 1900;
  master.connect(filter).connect(context.destination);
  const notes = [261.63, 329.63, 392, 523.25, 392, 329.63];
  let cursor = 0;
  const playNote = () => {
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = cursor % 2 ? "sine" : "triangle";
    oscillator.frequency.value = notes[cursor % notes.length];
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
    oscillator.connect(gain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + 1.35);
    cursor += 1;
  };
  playNote();
  const timer = window.setInterval(playNote, 920);
  return { context, master, timer };
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const audioRef = useRef<ReturnType<typeof startAmbientAudio>>(null);

  const sceneIndex = useMemo(() => {
    const index = SCENES.findIndex((scene, itemIndex) => elapsed < sceneStarts[itemIndex] + scene.duration);
    return index === -1 ? SCENES.length - 1 : index;
  }, [elapsed]);
  const sceneElapsed = elapsed - sceneStarts[sceneIndex];
  const wishReleased = sceneIndex > 5 || (sceneIndex === 5 && sceneElapsed > 8.2);

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
    if (!audioRef.current) audioRef.current = startAmbientAudio();
    return audioRef.current;
  }, []);
  const beginFilm = () => {
    setStarted(true); setPlaying(true); setElapsed(0); elapsedRef.current = 0;
    const audio = ensureAudio();
    if (audio) audio.master.gain.setTargetAtTime(muted ? 0 : 0.16, audio.context.currentTime, 0.08);
  };
  const togglePlayback = () => {
    if (!started) return beginFilm();
    if (elapsed >= TOTAL_DURATION) { setElapsed(0); elapsedRef.current = 0; setPlaying(true); void ensureAudio()?.context.resume(); return; }
    setPlaying((value) => { const next = !value; const audio = ensureAudio(); if (audio) void (next ? audio.context.resume() : audio.context.suspend()); return next; });
  };
  const toggleMuted = () => {
    setMuted((value) => { const next = !value; const audio = ensureAudio(); if (audio) audio.master.gain.setTargetAtTime(next ? 0 : 0.16, audio.context.currentTime, 0.08); return next; });
  };
  const seek = (value: number) => { const next = Math.max(0, Math.min(TOTAL_DURATION, value)); elapsedRef.current = next; setElapsed(next); };
  const jumpScene = (index: number) => seek(sceneStarts[index] + 0.05);
  const toggleFullscreen = () => { if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.(); else void document.exitFullscreen?.(); };

  return (
    <main className={`film-app scene-${SCENES[sceneIndex].id} ${started ? "film-started" : ""}`}>
      <div className="film-grain" aria-hidden="true" />
      <header className="film-header">
        <div className="film-brand"><span>✿</span><p>FOR FUONGTHENN<small>AN INTERACTIVE BIRTHDAY FILM</small></p></div>
        <div className="film-chapter"><span>{String(sceneIndex + 1).padStart(2, "0")}</span><p>{SCENES[sceneIndex].label}</p></div>
      </header>

      <div className="scene-stack" aria-live="polite">
        <SceneFrame active={sceneIndex === 0} className="opening-scene">
          <div className="day-orb" /><Cloud className="cloud-opening-one" /><Cloud className="cloud-opening-two" />
          <div className="opening-copy"><p>MỘT NGÀY THẬT ĐẶC BIỆT</p><h1>FuongThenn,</h1><h2>vũ trụ có một bí mật nhỏ.</h2><span>Một món quà đang trên đường tìm đến bạn.</span></div>
          <Flower className="opening-flower flower-left" /><Flower className="opening-flower flower-right" delay={-.8} />
          <Sparkle className="opening-sparkle sparkle-a" /><Sparkle className="opening-sparkle sparkle-b" />
        </SceneFrame>

        <SceneFrame active={sceneIndex === 1} className="letter-scene">
          <Cloud className="letter-cloud cloud-one" /><Cloud className="letter-cloud cloud-two" /><Cloud className="letter-cloud cloud-three" />
          <div className="flying-envelope" aria-hidden="true"><div className="envelope-front"><span>♥</span></div><i /><b /></div>
          <div className="scene-caption caption-bottom"><p>CHƯƠNG I · TÍN HIỆU ĐẦU TIÊN</p><h2>Một lá thư rơi xuống từ mây.</h2><span>“Hãy mang điều dịu dàng nhất đến cho FuongThenn.”</span></div><div className="flight-path" />
        </SceneFrame>

        <SceneFrame active={sceneIndex === 2} className="garden-scene">
          <div className="garden-sun" /><div className="hill hill-back" /><div className="hill hill-front" />
          <div className="flower-field" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <Flower key={index} className={`field-flower field-${index + 1}`} delay={index * -.23} />)}</div>
          <div className="scene-caption caption-center"><p>CHƯƠNG II · MẬT MÃ CỦA KHU VƯỜN</p><h2>Mỗi cánh hoa giữ một lời chúc.</h2><div className="wish-words"><span>Bình yên</span><span>Rực rỡ</span><span>May mắn</span></div></div>
          <span className="butterfly butterfly-one">⌁</span><span className="butterfly butterfly-two">⌁</span>
        </SceneFrame>

        <SceneFrame active={sceneIndex === 3} className="stars-scene">
          <div className="star-field" aria-hidden="true">{stars.map((star, index) => <i key={index} style={{ left: `${star.left}%`, top: `${star.top}%`, width: star.size, height: star.size, animationDelay: `${star.delay}s` }} />)}</div>
          <div className="moon"><span /><i /></div><div className="planet-ring" /><div className="comet" />
          <svg className="constellation" viewBox="0 0 280 180" aria-hidden="true"><path d="M15 130 68 64l62 31 48-72 83 51-42 84-89-63-47 55Z" />{[[15,130],[68,64],[130,95],[178,23],[261,74],[219,158],[83,150]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="5" />)}</svg>
          <div className="scene-caption caption-left light"><p>CHƯƠNG III · CHUYẾN ĐI CỦA NHỮNG VÌ SAO</p><h2>Cả bầu trời cùng chỉ về một hướng.</h2><span>Đích đến đã ở rất gần…</span></div>
        </SceneFrame>

        <SceneFrame active={sceneIndex === 4} className="reveal-scene">
          <div className="reveal-rays" /><div className="petal-storm" aria-hidden="true">{petals.map((petal, index) => <i key={index} style={{ left: `${petal.left}%`, width: petal.size, height: petal.size * 1.55, animationDelay: `${petal.delay}s`, animationDuration: `${petal.duration}s`, "--drift": `${petal.drift}px` } as React.CSSProperties} />)}</div>
          <div className="name-reveal"><p>NGƯỜI MÀ CẢ CÂU CHUYỆN CHỜ ĐỢI</p><h2>FuongThenn</h2><span>Hóa ra, tất cả hoa, mây và ánh sao đều đang chuẩn bị cho ngày đặc biệt của bạn.</span><div><i /> dành riêng cho bạn <i /></div></div>
          <Sparkle className="reveal-sparkle reveal-one" /><Sparkle className="reveal-sparkle reveal-two" />
        </SceneFrame>

        <SceneFrame active={sceneIndex === 5} className={`cake-scene ${wishReleased ? "wish-released" : ""}`}>
          <div className="cake-stars" aria-hidden="true">{stars.slice(0, 20).map((star, index) => <i key={index} style={{ left: `${star.left}%`, top: `${star.top}%`, animationDelay: `${star.delay}s` }} />)}</div>
          <div className="cake-copy"><p>CHƯƠNG IV · ĐIỀU ƯỚC CUỐI CÙNG</p><h2>{wishReleased ? "Điều ước đã bay đến những vì sao." : "Nhắm mắt và ước một điều thật đẹp."}</h2><span>{wishReleased ? "Mong điều ấy sớm trở thành sự thật, FuongThenn nhé." : "Một ngọn nến đang chờ bạn…"}</span><div className="wish-countdown"><i /><i /><i /></div></div>
          <CakeModel active={sceneIndex === 5} /><div className={`magic-flame ${wishReleased ? "flame-out" : ""}`}><i /><span /></div>
          {wishReleased && <div className="wish-burst" aria-hidden="true">{Array.from({ length: 32 }, (_, index) => <i key={index} style={{ "--i": index } as React.CSSProperties} />)}</div>}
        </SceneFrame>

        <SceneFrame active={sceneIndex === 6} className="finale-scene">
          <div className="finale-petals" aria-hidden="true">{petals.map((petal, index) => <i key={index} style={{ left: `${petal.left}%`, width: petal.size, height: petal.size * 1.55, animationDelay: `${petal.delay}s`, animationDuration: `${petal.duration}s`, "--drift": `${petal.drift}px` } as React.CSSProperties} />)}</div>
          <Flower className="finale-flower flower-one" /><Flower className="finale-flower flower-two" delay={-.9} /><Flower className="finale-flower flower-three" delay={-1.8} />
          <div className="finale-card"><p>VÀ CUỐI CÙNG…</p><h2>Happy Birthday,</h2><h3>FuongThenn!</h3><span>Chúc bạn một tuổi mới trong trẻo như mây, dịu dàng như hoa và rực rỡ như cả bầu trời đêm.</span><strong>Luôn được yêu thương, luôn là chính mình<br />và luôn có thật nhiều lý do để mỉm cười.</strong><div className="final-seal">F<small>✿</small></div></div>
          <Sparkle className="finale-sparkle final-sparkle-a" /><Sparkle className="finale-sparkle final-sparkle-b" />
        </SceneFrame>
      </div>

      {!started && <div className="premiere-overlay"><div className="premiere-orbit orbit-a" /><div className="premiere-orbit orbit-b" /><div className="premiere-mark">✿</div><p>MỘT BỘ PHIM NHỎ DÀNH RIÊNG CHO</p><h1>FuongThenn</h1><span>01:01 · Bật âm thanh để cảm nhận trọn vẹn</span><button type="button" onClick={beginFilm}><i><PlayIcon playing={false} /></i> Bắt đầu câu chuyện</button><small>Trải nghiệm toàn màn hình · Không cần cuộn</small></div>}

      <div className={`film-controls ${started ? "controls-visible" : ""}`}>
        <div className="chapter-dots" aria-label="Chọn phân cảnh">{SCENES.map((scene, index) => <button type="button" key={scene.id} className={index === sceneIndex ? "active" : ""} onClick={() => jumpScene(index)} aria-label={`Đi đến cảnh ${scene.label}`}><i /><span>{scene.label}</span></button>)}</div>
        <div className="control-row"><button className="icon-button primary-control" type="button" onClick={togglePlayback} aria-label={playing ? "Tạm dừng phim" : "Phát phim"}><PlayIcon playing={playing} /></button><span className="timecode">{formatTime(elapsed)}</span><input className="film-scrubber" type="range" min="0" max={TOTAL_DURATION} step="0.05" value={elapsed} onChange={(event) => seek(Number(event.target.value))} style={{ "--progress": `${(elapsed / TOTAL_DURATION) * 100}%` } as React.CSSProperties} aria-label="Tua phim" /><span className="timecode duration">{formatTime(TOTAL_DURATION)}</span><button className="icon-button" type="button" onClick={toggleMuted} aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}><VolumeIcon muted={muted} /></button><button className="icon-button fullscreen-button" type="button" onClick={toggleFullscreen} aria-label="Toàn màn hình"><FullscreenIcon /></button></div>
      </div>
    </main>
  );
}
