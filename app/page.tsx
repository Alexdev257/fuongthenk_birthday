"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import BlueBouquet from "./blue-bouquet";
import { BIRTHDAY_MUSIC_VOLUME, startBirthdayMusic } from "./birthday-music";

const SCENES = [
  { id: "prologue", label: "Lời mời", duration: 3.5 },
  { id: "clockwork", label: "Đúng lúc", duration: 3.5 },
  { id: "garden", label: "Khu vườn", duration: 4 },
  { id: "melody", label: "Ánh nhạc", duration: 3.5 },
  { id: "reveal", label: "Tên của bạn", duration: 3.5 },
  { id: "gift", label: "Điều ước", duration: 5 },
  { id: "finale", label: "Tấm thiệp", duration: 7 },
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
const MEMORY_PHOTOS = {
  white: "/memories/fuongthenn-portrait-white.jpg",
  noir: "/memories/fuongthenn-portrait-noir.jpg",
  studio: "/memories/fuongthenn-portrait-studio.jpg",
  soft: "/memories/fuongthenn-portrait-soft.jpg",
  sea: "/memories/fuongthenn-by-the-sea.jpg",
} as const;
const luxuryParticles = Array.from({ length: 18 }, (_, index) => ({
  left: (index * 47 + 9) % 96,
  top: (index * 29 + 13) % 88,
  depth: 40 + (index % 6) * 34,
  delay: -(index % 9) * 0.72,
  duration: 6.5 + (index % 5) * 1.15,
  size: 3 + (index % 4) * 2,
}));

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

function CrystalBloom({ className = "" }: { className?: string }) {
  return (
    <div className={`crystal-bloom ${className}`} aria-hidden="true">
      <div className="crystal-stem">
        <span className="stem-light" />
        <i className="crystal-leaf leaf-left"><b /></i>
        <i className="crystal-leaf leaf-right"><b /></i>
      </div>
      <div className="crystal-blossom">
        <span className="petal-ring petal-ring-back">{Array.from({ length: 7 }, (_, index) => <i key={index} style={{ "--petal": index } as React.CSSProperties} />)}</span>
        <span className="petal-ring petal-ring-front">{Array.from({ length: 5 }, (_, index) => <i key={index} style={{ "--petal": index } as React.CSSProperties} />)}</span>
        <b className="crystal-heart"><i /><i /><i /></b>
      </div>
    </div>
  );
}

function CinematicDepth() {
  return (
    <div className="luxury-depth" aria-hidden="true">
      <div className="depth-aurora aurora-one" /><div className="depth-aurora aurora-two" />
      <div className="depth-orbit orbit-near"><i /><b /></div><div className="depth-orbit orbit-far"><i /></div>
      <div className="depth-particles">{luxuryParticles.map((particle, index) => <i key={index} style={{ left: `${particle.left}%`, top: `${particle.top}%`, width: particle.size, height: particle.size, animationDelay: `${particle.delay}s`, animationDuration: `${particle.duration}s`, "--depth": `${particle.depth}px` } as React.CSSProperties} />)}</div>
    </div>
  );
}

function PortraitFrame({ src, className = "", caption }: { src: string; className?: string; caption?: string }) {
  return (
    <div className={`portrait-frame ${className}`} style={{ "--portrait": `url("${src}")` } as React.CSSProperties} role="img" aria-label="Một khoảnh khắc của FuongThenn">
      <i className="portrait-glass" />
      {caption && <span>{caption}</span>}
    </div>
  );
}

function OrbitalBloom({ className = "" }: { className?: string }) {
  return (
    <div className={`orbital-bloom ${className}`} aria-hidden="true">
      <i className="bloom-halo bloom-halo-outer" /><i className="bloom-halo bloom-halo-inner" />
      <div className="bloom-monogram"><span>F</span><small>ONE OF ONE</small></div>
      <CrystalBloom className="bloom-crystal" />
      <div className="bloom-gems">{Array.from({ length: 8 }, (_, index) => <i key={index} style={{ "--gem": index } as React.CSSProperties} />)}</div>
    </div>
  );
}

function PlayIcon({ playing }: { playing: boolean }) {
  return playing ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6v12M16 6v12" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z" /></svg>;
}

function SceneFrame({ active, children, className }: { active: boolean; children: React.ReactNode; className: string }) {
  return <section className={`movie-scene ${className} ${active ? "is-active" : ""}`} aria-hidden={!active}>{children}</section>;
}

function MusicBox({ open = false, className = "" }: { open?: boolean; className?: string }) {
  return (
    <div className={`music-box ${open ? "box-open" : ""} ${className}`} aria-hidden="true">
      <div className="box-aura" />
      <div className="box-crown"><i /><i /><i /></div>
      <div className="box-lid"><i className="lid-edge" /><div className="lid-inlay"><b className="lid-glass" /><span>F</span><i>✿</i></div></div>
      <div className="box-hinges"><i /><i /></div>
      <div className="box-stage"><i className="stage-ring" /><b className="stage-disc" /><span>one of one</span><em className="box-mechanism"><i /><b /></em></div>
      <div className="box-body"><span className="body-glaze" /><div className="box-drawer"><i /><span /></div><i className="body-line" /><b className="body-stud stud-left" /><b className="body-stud stud-right" /></div>
      <div className="box-feet"><i /><i /></div>
      <div className="winding-key"><span /><i /><b /></div>
      <div className="box-plinth"><i /><b /></div>
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
      <div className="model-spotlight" /><div className="model-arch"><i /><b /></div>
      <div className="model-orbit model-orbit-one"><i /></div><div className="model-orbit model-orbit-two"><i /></div>
      <div className="model-crown"><i /><i /><i /><i /><i /></div><div className="model-turntable"><i /><b /></div>
      {shouldLoad && <ModelViewer className="cake-model" src="/models/fuongthenn-birthday-cake.glb" poster="/models/fuongthenn-cake-preview.png" alt="Mô hình 3D bánh sinh nhật trắng xanh có nơ và hoa dành cho FuongThenn" camera-orbit="24deg 72deg 4.05m" min-camera-orbit="auto 60deg 3.2m" max-camera-orbit="auto 84deg 5.2m" camera-target="0m 0.06m 0m" field-of-view="30deg" shadow-intensity="1.35" shadow-softness=".82" exposure="1.12" environment-image="neutral" loading="eager" camera-controls auto-rotate rotation-per-second="12deg" interpolation-decay="120" interaction-prompt="none" disable-zoom reveal="auto" onLoad={() => setModelState("ready")} onError={() => setModelState("error")}>
        <div slot="progress-bar" className="model-progress"><span /></div>
      </ModelViewer>}
      {modelState === "error" && <div className="model-fallback" role="img" aria-label="Biểu tượng chiếc bánh sinh nhật"><strong>✿</strong><p>Món quà vẫn đang ở đây</p><small>Hãy giữ điều ước thật gần nhé</small></div>}
      <p className="model-hint">Chạm &amp; kéo để xoay món quà 3D</p>
    </div>
  );
}
export default function Home() {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const finaleLockedRef = useRef(false);
  const lastFrameRef = useRef<number | null>(null);
  const audioRef = useRef<ReturnType<typeof startBirthdayMusic>>(null);
  const filmRef = useRef<HTMLElement>(null);

  const sceneIndex = useMemo(() => {
    const index = SCENES.findIndex((scene, itemIndex) => elapsed < sceneStarts[itemIndex] + scene.duration);
    return index === -1 ? SCENES.length - 1 : index;
  }, [elapsed]);
  const sceneElapsed = elapsed - sceneStarts[sceneIndex];
  const wishReleased = sceneIndex > 5 || (sceneIndex === 5 && sceneElapsed > 2.8);

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
      if (next >= TOTAL_DURATION) {
        finaleLockedRef.current = true;
        setPlaying(false);
      } else frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, started]);
  useEffect(() => () => { audioRef.current?.dispose(); }, []);

  const beginFilm = useCallback(() => {
    finaleLockedRef.current = false;
    lastFrameRef.current = null;
    setStarted(true); setPlaying(true); setElapsed(0); elapsedRef.current = 0;
    audioRef.current?.dispose();
    const audio = startBirthdayMusic(TOTAL_DURATION);
    audioRef.current = audio;
    if (audio) {
      audio.master.gain.setTargetAtTime(muted ? 0 : BIRTHDAY_MUSIC_VOLUME, audio.context.currentTime, 0.07);
      void audio.context.resume().catch(() => {});
    }
  }, [muted]);
  const togglePlayback = useCallback(() => {
    if (!started) return beginFilm();
    // Only the replay button can unlock the final card and start a fresh film.
    if (finaleLockedRef.current || elapsedRef.current >= TOTAL_DURATION) return;
    const next = !playing;
    setPlaying(next);
    const audio = audioRef.current;
    if (audio && audio.context.state !== "closed") {
      void (next ? audio.context.resume() : audio.context.suspend()).catch(() => {});
    }
  }, [beginFilm, playing, started]);
  const toggleMuted = useCallback(() => {
    const next = !muted;
    setMuted(next);
    const audio = audioRef.current;
    if (audio && audio.context.state !== "closed") audio.master.gain.setTargetAtTime(next ? 0 : BIRTHDAY_MUSIC_VOLUME, audio.context.currentTime, 0.07);
  }, [muted]);
  const seek = useCallback((value: number) => {
    if (!started || finaleLockedRef.current) return;
    const next = Math.max(0, Math.min(TOTAL_DURATION, value));
    elapsedRef.current = next;
    setElapsed(next);
    if (next >= TOTAL_DURATION) {
      finaleLockedRef.current = true;
      setPlaying(false);
      const audio = audioRef.current;
      if (audio?.context.state === "suspended") void audio.context.resume().catch(() => {});
    }
  }, [started]);
  const toggleFullscreen = useCallback(() => { if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.(); else void document.exitFullscreen?.(); }, []);
  const moveCamera = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    event.currentTarget.style.setProperty("--tilt-x", `${y * -2.4}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${x * 3.2}deg`);
    event.currentTarget.style.setProperty("--drift-x", `${x * -13}px`);
    event.currentTarget.style.setProperty("--drift-y", `${y * -9}px`);
  }, []);
  const resetCamera = useCallback(() => {
    filmRef.current?.style.setProperty("--tilt-x", "0deg");
    filmRef.current?.style.setProperty("--tilt-y", "0deg");
    filmRef.current?.style.setProperty("--drift-x", "0px");
    filmRef.current?.style.setProperty("--drift-y", "0px");
  }, []);

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
    <main ref={filmRef} onPointerMove={moveCamera} onPointerLeave={resetCamera} className={`film-app scene-${SCENES[sceneIndex].id} ${darkScene ? "dark-scene" : ""} ${started ? "film-started" : ""}`}>
      <div className="film-texture" aria-hidden="true" /><div className="film-vignette" aria-hidden="true" />
      <CinematicDepth />
      <div className="edge-progress" aria-hidden="true"><i style={{ width: `${(elapsed / TOTAL_DURATION) * 100}%` }} /></div>
      <p className="sr-only" aria-live="polite">Cảnh {sceneIndex + 1}: {SCENES[sceneIndex].label}</p>

      <div className="scene-stack">
        <SceneFrame active={sceneIndex === 0} className="prologue-scene">
          <div className="porcelain-grid" /><div className="prologue-orbit orbit-one" /><div className="prologue-orbit orbit-two" />
          <div className="story-copy prologue-copy"><p>LỜI MỜI · THE BLUE CONSERVATORY</p><h1>Có một cánh cửa<br /><em>chỉ mở hôm nay.</em></h1><span>Bước thật khẽ nhé — khu vườn này đã chuẩn bị một điều đặc biệt cho bạn.</span></div>
          <MusicBox open className="hero-box" />
          <CrystalBloom className="prologue-crystal" />
          <Flower className="prologue-flower flower-a" /><Flower className="prologue-flower flower-b" delay={-1.4} />
          <Sparkle className="prologue-sparkle sparkle-a" /><Sparkle className="prologue-sparkle sparkle-b" />
        </SceneFrame>

        <SceneFrame active={sceneIndex === 1} className="clockwork-scene">
          <div className="clock-stars" aria-hidden="true">{stars.map((star, index) => <i key={index} style={{ left: `${star.left}%`, top: `${star.top}%`, width: star.size, height: star.size, animationDelay: `${star.delay}s` }} />)}</div>
          <div className="clock-jewels" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} style={{ "--jewel": index } as React.CSSProperties} />)}</div>
          <div className="clock-dial" aria-hidden="true"><div className="dial-marks">{dialMarks.map((mark) => <i key={mark} style={{ "--mark": mark } as React.CSSProperties} />)}</div><div className="clock-hand hand-long" /><div className="clock-hand hand-short" /><div className="dial-center">✿</div><span>HÔM NAY</span></div>
          <div className="story-copy clock-copy"><p>CHƯƠNG I · ĐÚNG KHOẢNH KHẮC</p><h2>Thời gian giữ lại<br />một nhịp.</h2><span>Để hôm nay không trôi qua như mọi ngày — vì hôm nay là ngày của FuongThenn.</span></div>
          <div className="clock-ring ring-one" /><div className="clock-ring ring-two" />
        </SceneFrame>

        <SceneFrame active={sceneIndex === 2} className="garden-scene">
          <div className="paper-sun"><span /></div><div className="paper-hill hill-one" /><div className="paper-hill hill-two" /><div className="paper-hill hill-three" />
          <div className="garden-dome" aria-hidden="true"><i /><b /><span>✦</span></div>
          <div className="garden-platform"><i /><b /></div>
          <BlueBouquet className="garden-bouquet" active={started && playing && sceneIndex === 2} loadModel={started && sceneIndex >= 1 && sceneIndex <= 2} />
          <div className="story-copy garden-copy"><p>CHƯƠNG II · KHU VƯỜN PHA LÊ</p><h2>Mỗi cánh hoa mang<br /><em>một điều dịu dàng.</em></h2><span>Chúng không nở theo mùa — chúng nở theo nụ cười của bạn.</span></div>
          <span className="paper-bird bird-one">⌁</span><span className="paper-bird bird-two">⌁</span>
        </SceneFrame>

        <SceneFrame active={sceneIndex === 3} className="melody-scene">
          <div className="melody-stars" aria-hidden="true">{stars.map((star, index) => <i key={index} style={{ left: `${star.left}%`, top: `${star.top}%`, animationDelay: `${star.delay}s` }} />)}</div>
          <div className="melody-disc" aria-hidden="true"><i /><i /><i /><b>F</b><span>♪</span></div>
          <svg className="music-staff" viewBox="0 0 900 390" fill="none" aria-hidden="true"><path d="M-20 110C185 0 302 232 492 122s282-16 435 66M-28 155C174 43 306 274 498 166s277-9 436 66M-35 200C169 88 311 318 504 211s273-4 437 66M-42 245C166 133 314 360 510 256s268 1 438 67" />{[[105,99],[236,184],[373,109],[520,203],[665,116],[792,235]].map(([x,y], index) => <g key={`${x}-${y}`} className={`staff-note note-${index + 1}`}><circle cx={x} cy={y} r="13" /><path d={`M${x + 12} ${y}v-70`} /></g>)}</svg>
          <div className="wish-constellation" aria-hidden="true"><span>BÌNH YÊN</span><span>RỰC RỠ</span><span>MAY MẮN</span><span>ĐƯỢC YÊU</span></div>
          <div className="story-copy melody-copy"><p>CHƯƠNG III · ÁNH SÁNG BIẾT HÁT</p><h2>Mỗi nốt nhạc giữ<br />một lời chúc.</h2><span>Bình yên, rực rỡ, may mắn và được yêu — tất cả đang tìm đường đến bạn.</span></div>
        </SceneFrame>

        <SceneFrame active={sceneIndex === 4} className="reveal-scene">
          <div className="stage-light" /><div className="curtain curtain-left"><i /><i /><i /></div><div className="curtain curtain-right"><i /><i /><i /></div>
          <div className="reveal-halo" aria-hidden="true"><i /><b /><span>F</span></div>
          <PetalRain className="reveal-petals" />
          <div className="reveal-title"><p>TẤT CẢ NHỮNG ĐIỀU ĐẸP ĐẼ ẤY</p><span className="reveal-kicker">đều viết thành một cái tên</span><h2>Fuong<span>Thenn</span></h2><div><i /> one of one <i /></div></div>
          <Sparkle className="reveal-sparkle sparkle-one" /><Sparkle className="reveal-sparkle sparkle-two" />
        </SceneFrame>

        <SceneFrame active={sceneIndex === 5} className={`gift-scene ${wishReleased ? "wish-released" : ""}`}>
          <div className="gift-stars" aria-hidden="true">{stars.slice(0, 22).map((star, index) => <i key={index} style={{ left: `${star.left}%`, top: `${star.top}%`, animationDelay: `${star.delay}s` }} />)}</div>
          <div className="story-copy gift-copy"><p>CHƯƠNG IV · MÓN QUÀ CUỐI</p><h2>{wishReleased ? "Điều ước đã được cất vào giai điệu." : "Một vòng quay cho một điều ước."}</h2><span>{wishReleased ? "Từ giờ, mỗi lần nhớ lại, điều đẹp đẽ ấy sẽ gần bạn thêm một chút." : "Nhắm mắt một giây — phần còn lại cứ để chiếc hộp nhạc lo."}</span><div className="wish-beats"><i /><i /><i /></div></div>
          <CakeModel active={sceneIndex === 5} shouldLoad={sceneIndex >= 4} />
          <CrystalBloom className="gift-crystal crystal-one" /><CrystalBloom className="gift-crystal crystal-two" />
          <div className={`wish-aura ${wishReleased ? "released" : ""}`}><i /><span /></div>
          {wishReleased && <div className="wish-burst" aria-hidden="true">{Array.from({ length: 34 }, (_, index) => <i key={index} style={{ "--i": index } as React.CSSProperties} />)}</div>}
        </SceneFrame>

        <SceneFrame active={sceneIndex === 6} className="finale-scene">
          <PetalRain className="finale-petals" /><div className="finale-sun" /><div className="finale-ribbon ribbon-left" /><div className="finale-ribbon ribbon-right" />
          <Flower className="finale-flower flower-left" /><Flower className="finale-flower flower-right" delay={-1.1} />
          <BlueBouquet className="finale-bouquet" active={started && sceneIndex === 6} />
          <div className="finale-layout">
            <div className="finale-gallery" aria-label="Những khoảnh khắc đáng yêu của FuongThenn">
              <PortraitFrame src={MEMORY_PHOTOS.sea} className="memory-photo memory-photo-sea" caption="BLUE DAY" />
              <PortraitFrame src={MEMORY_PHOTOS.noir} className="memory-photo memory-photo-noir" caption="LOVELY" />
              <PortraitFrame src={MEMORY_PHOTOS.white} className="memory-photo memory-photo-white" caption="ONE OF ONE" />
              <PortraitFrame src={MEMORY_PHOTOS.studio} className="memory-photo memory-photo-studio" caption="SHINE" />
              <PortraitFrame src={MEMORY_PHOTOS.soft} className="memory-photo memory-photo-soft" caption="SMILE" />
              <i className="memory-tape tape-one" /><i className="memory-tape tape-two" />
              <span className="memory-sticker sticker-flower">✿</span><span className="memory-sticker sticker-heart">♡</span>
            </div>
            <div className="finale-ticket"><div className="ticket-number">FOR YOU · NO. 01</div><p>TẤM THIỆP CUỐI KHU VƯỜN</p><h2>Happy Birthday</h2><h3>FuongThenn!</h3><div className="ticket-rule"><i>✿</i></div><span>Chúc bạn một tuổi mới dịu dàng với chính mình,<br />can đảm với những điều mình yêu,<br />và luôn có thật nhiều lý do để mỉm cười.</span><strong>May your days bloom in blue.</strong><button type="button" onClick={beginFilm}>↻&nbsp;&nbsp; Xem lại thước phim</button></div>
          </div>
        </SceneFrame>
      </div>

      {!started && <div className="premiere-overlay"><div className="cover-corners"><i /><i /><i /><i /></div><div className="cover-rays" /><div className="cover-jewel-world"><i className="cover-halo halo-outer" /><i className="cover-halo halo-inner" /><b className="cover-diamond diamond-one" /><b className="cover-diamond diamond-two" /><b className="cover-diamond diamond-three" /></div><OrbitalBloom className="premiere-bloom" /><div className="cover-flower cover-flower-left"><Flower /></div><div className="cover-flower cover-flower-right"><Flower delay={-1.3} /></div><CrystalBloom className="cover-crystal cover-crystal-left" /><CrystalBloom className="cover-crystal cover-crystal-right" /><div className="cover-card"><div className="cover-emblem"><i /><span>F</span><b>✿</b></div><p>A PRIVATE BIRTHDAY FILM · ONE OF ONE</p><h1><small>The Blue Conservatory</small>FuongThenn</h1><div className="cover-divider"><i /> made with love <i /></div><span>Một khu vườn ánh sáng, hoa và điều ước đang chờ bạn phía sau cánh cửa.</span><button type="button" onClick={beginFilm}><i><PlayIcon playing={false} /></i><span>Mở cánh cửa</span></button><small><b>BẬT ÂM THANH</b> · Không cần cuộn</small></div></div>}
    </main>
  );
}
