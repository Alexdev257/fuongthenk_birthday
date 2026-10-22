import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import { startBirthdayMusic } from "../app/birthday-music.ts";

class AudioParamMock {
  value = 0;
  setValueAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime() {}
  setTargetAtTime(value) { this.value = value; }
}

class AudioNodeMock {
  gain = new AudioParamMock();
  frequency = new AudioParamMock();
  detune = new AudioParamMock();
  threshold = new AudioParamMock();
  knee = new AudioParamMock();
  ratio = new AudioParamMock();
  attack = new AudioParamMock();
  release = new AudioParamMock();
  onended = null;
  ended = false;
  connect(node) { return node; }
  disconnect() {}
  start(time) { this.startTime = time; }
  stop(time = 0) { this.stopTime = time; }
}

class AudioContextMock {
  static instances = [];
  currentTime = 0;
  sampleRate = 1000;
  state = "running";
  destination = new AudioNodeMock();
  oscillators = [];
  completions = [];
  closeCalls = 0;
  constructor() { AudioContextMock.instances.push(this); }
  createGain() { return new AudioNodeMock(); }
  createBiquadFilter() { return new AudioNodeMock(); }
  createDynamicsCompressor() { return new AudioNodeMock(); }
  createConvolver() { return new AudioNodeMock(); }
  createOscillator() { const node = new AudioNodeMock(); this.oscillators.push(node); return node; }
  createBufferSource() { const node = new AudioNodeMock(); this.completions.push(node); return node; }
  createBuffer(channels, length, rate) {
    return { numberOfChannels: channels, duration: length / rate, getChannelData: () => new Float32Array(length) };
  }
  resume() { this.state = "running"; return Promise.resolve(); }
  suspend() { this.state = "suspended"; return Promise.resolve(); }
  close() { this.closeCalls += 1; this.state = "closed"; return Promise.resolve(); }
  advanceTo(time) {
    if (this.state !== "running") return;
    this.currentTime = time;
    for (const node of [...this.oscillators, ...this.completions]) {
      const end = node.stopTime ?? node.startTime;
      if (!node.ended && end <= time) { node.ended = true; node.onended?.(); }
    }
  }
}

test("complete the final rendition and reverb after the film, then stop permanently", () => {
  globalThis.window = { AudioContext: AudioContextMock };
  const audio = startBirthdayMusic(30);
  assert.ok(audio);
  const lastVoiceEnd = Math.max(...audio.context.oscillators.map(node => node.stopTime));
  assert.ok(lastVoiceEnd > 30, "the last full rendition continues past the 30-second film");
  assert.ok(audio.endTime >= lastVoiceEnd + 1.8, "preserve the full reverb tail");
  const scheduledVoices = audio.context.oscillators.length;
  audio.context.advanceTo(30);
  assert.equal(audio.context.state, "running", "the film ending must not cut the music");
  audio.context.advanceTo(audio.endTime - .01);
  assert.equal(audio.context.state, "running");
  audio.context.advanceTo(audio.endTime + .01);
  assert.equal(audio.context.state, "closed");
  audio.context.advanceTo(3600);
  assert.equal(audio.context.oscillators.length, scheduledVoices, "no new loop after completion");
  audio.dispose();
  assert.equal(audio.context.closeCalls, 1, "cleanup is safe to repeat");
});

test("an explicit pause delays completion, and replay disposes the old audio", async () => {
  globalThis.window = { AudioContext: AudioContextMock };
  const original = startBirthdayMusic(30);
  await original.context.suspend();
  original.context.advanceTo(500);
  assert.equal(original.context.currentTime, 0);
  assert.equal(original.context.state, "suspended");
  await original.context.resume();
  original.context.advanceTo(4);
  original.dispose();
  assert.equal(original.context.state, "closed");
  assert.equal(original.context.completions[0].onended, null, "old completion cannot affect a replay");
  const replay = startBirthdayMusic(30);
  assert.equal(replay.context.oscillators[0].startTime, .08);
  assert.notEqual(replay.context, original.context);
  replay.dispose();
});

test("support Safari's audio constructor and a device with no Web Audio", () => {
  globalThis.window = {};
  assert.equal(startBirthdayMusic(30), null);
  globalThis.window = { webkitAudioContext: AudioContextMock };
  const audio = startBirthdayMusic(30);
  assert.ok(audio);
  audio.dispose();
});

// Exercise the actual page callbacks and animation frames with a deterministic
// hook host, without a browser or a real 38-second delay per case.
async function mountFilm() {
  const slots = [];
  const effects = [];
  const frames = new Map();
  const listeners = new Map();
  let cursor = 0;
  let frameId = 0;
  globalThis.HTMLInputElement = class {};
  globalThis.HTMLButtonElement = class {};
  globalThis.window = {
    AudioContext: AudioContextMock,
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
    addEventListener: (type, callback) => listeners.set(type, callback),
    removeEventListener: type => listeners.delete(type),
  };
  globalThis.__birthdayHooks = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value, next => { slots[index].value = typeof next === "function" ? next(slots[index].value) : next; }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useMemo(calculate) { cursor++; return calculate(); },
    useCallback(callback) { cursor++; return callback; },
    useEffect(callback, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || deps.some((dep, i) => !Object.is(dep, previous.deps[i]))) {
        effects.push(() => { previous?.cleanup?.(); slots[index] = { deps, cleanup: callback() }; });
      }
    },
  };
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  let compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  compiled = compiled
    .replace(/^import .* from "react\/jsx-runtime";$/m, "const _jsx = (type, props) => ({type, props}), _jsxs = _jsx;")
    .replace(/^import \{ (.*) \} from "react";$/m, "const { $1 } = globalThis.__birthdayHooks;")
    .replace(/^import BlueBouquet from .*;$/m, 'const BlueBouquet = "blue-bouquet";')
    .replace('"./birthday-music"', JSON.stringify(new URL("../app/birthday-music.ts", import.meta.url).href));
  const { default: Home } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
  const render = () => { cursor = 0; const tree = Home(); while (effects.length) effects.shift()(); return tree; };
  const walk = (tree, predicate) => {
    if (!tree || typeof tree !== "object") return null;
    if (predicate(tree)) return tree;
    const children = [tree.props?.children].flat(Infinity);
    for (const child of children) { const match = walk(child, predicate); if (match) return match; }
    return null;
  };
  return {
    render,
    button(tree, containerClass) {
      const container = walk(tree, node => typeof node.props?.className === "string" && node.props.className.split(" ").includes(containerClass));
      return walk(container, node => node.type === "button");
    },
    key(key) { listeners.get("keydown")?.({ target: {}, code: key, key, preventDefault() {} }); },
    frame(time) { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(time)); return render(); },
    frameCount: () => frames.size,
    unmount() { for (const slot of slots) slot?.cleanup?.(); delete globalThis.__birthdayHooks; },
  };
}

test("the actual film stays on its last scene until the replay button is clicked", async () => {
  const film = await mountFilm();
  let tree = film.render();
  film.button(tree, "cover-card").props.onClick();
  tree = film.render();
  const original = AudioContextMock.instances.at(-1);
  for (let time = 0; time <= 31000; time += 100) tree = film.frame(time);
  assert.match(tree.props.className, /scene-finale/);
  assert.equal(film.frameCount(), 0, "visual playback stops scheduling frames");
  original.advanceTo(30);
  assert.equal(original.state, "running", "music keeps playing after the visuals finish");
  const count = AudioContextMock.instances.length;
  for (const key of ["Space", "ArrowLeft", "ArrowRight"]) { film.key(key); tree = film.render(); }
  assert.match(tree.props.className, /scene-finale/);
  original.advanceTo(100);
  assert.equal(original.state, "closed");
  for (const key of ["Space", "ArrowLeft", "ArrowRight", "m"]) { film.key(key); tree = film.render(); }
  assert.match(tree.props.className, /scene-finale/);
  assert.equal(AudioContextMock.instances.length, count, "keys cannot restart finished music");
  film.button(tree, "finale-ticket").props.onClick();
  tree = film.render();
  assert.match(tree.props.className, /scene-prologue/);
  assert.equal(AudioContextMock.instances.length, count + 1);
  assert.equal(AudioContextMock.instances.at(-1).oscillators[0].startTime, .08);
  film.key("Space"); film.render();
  assert.equal(AudioContextMock.instances.at(-1).state, "suspended");
  for (let i = 0; i < 6; i++) { film.key("ArrowRight"); tree = film.render(); }
  assert.match(tree.props.className, /scene-finale/);
  assert.equal(AudioContextMock.instances.at(-1).state, "running", "seeking to the end while paused still lets the song finish");
  film.unmount();
  assert.equal(AudioContextMock.instances.at(-1).state, "closed");
});
