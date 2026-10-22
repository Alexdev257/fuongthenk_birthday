export const BIRTHDAY_MUSIC_VOLUME = 0.12;

export function startBirthdayMusic(minimumDuration: number) {
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  const context = new AudioCtx();
  const voices = new Set<OscillatorNode>();
  const trackVoice = (oscillator: OscillatorNode, gain: GainNode) => {
    voices.add(oscillator);
    oscillator.onended = () => {
      voices.delete(oscillator);
      oscillator.disconnect();
      gain.disconnect();
    };
  };
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  const compressor = context.createDynamicsCompressor();
  const dry = context.createGain();
  const reverb = context.createConvolver();
  const wet = context.createGain();
  const impulse = context.createBuffer(2, Math.floor(context.sampleRate * 1.8), context.sampleRate);

  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let index = 0; index < data.length; index += 1) {
      const decay = Math.pow(1 - index / data.length, 2.8);
      data[index] = (Math.random() * 2 - 1) * decay;
    }
  }

  master.gain.value = BIRTHDAY_MUSIC_VOLUME;
  filter.type = "lowpass";
  filter.frequency.value = 5200;
  compressor.threshold.value = -22;
  compressor.knee.value = 18;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.012;
  compressor.release.value = 0.28;
  dry.gain.value = 0.88;
  wet.gain.value = 0.13;
  reverb.buffer = impulse;
  dry.connect(master);
  reverb.connect(wet).connect(master);
  master.connect(filter).connect(compressor).connect(context.destination);

  const beat = 0.44;
  const melody = [
    { midi: 67, beats: 0.5, chord: [48, 55, 60] }, { midi: 67, beats: 0.5 }, { midi: 69, beats: 1 }, { midi: 67, beats: 1 }, { midi: 72, beats: 1 }, { midi: 71, beats: 2 },
    { midi: 67, beats: 0.5, chord: [43, 50, 55] }, { midi: 67, beats: 0.5 }, { midi: 69, beats: 1 }, { midi: 67, beats: 1 }, { midi: 74, beats: 1 }, { midi: 72, beats: 2 },
    { midi: 67, beats: 0.5, chord: [48, 55, 60] }, { midi: 67, beats: 0.5 }, { midi: 79, beats: 1 }, { midi: 76, beats: 1 }, { midi: 72, beats: 1 }, { midi: 71, beats: 1 }, { midi: 69, beats: 2 },
    { midi: 77, beats: 0.5, chord: [53, 60, 65] }, { midi: 77, beats: 0.5 }, { midi: 76, beats: 1 }, { midi: 72, beats: 1 }, { midi: 74, beats: 1, chord: [43, 50, 55] }, { midi: 72, beats: 2, chord: [48, 55, 60] },
  ];
  const midiToFrequency = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

  const connectWithSpace = (node: AudioNode) => {
    node.connect(dry);
    node.connect(reverb);
  };

  const scheduleBell = (midi: number, start: number, duration: number, accented: boolean) => {
    const frequency = midiToFrequency(midi);
    const body = context.createOscillator();
    const shimmer = context.createOscillator();
    const bodyGain = context.createGain();
    const shimmerGain = context.createGain();
    body.type = "sine";
    shimmer.type = "sine";
    body.frequency.setValueAtTime(frequency, start);
    shimmer.frequency.setValueAtTime(frequency * 2.01, start);
    body.detune.setValueAtTime(-2, start);
    bodyGain.gain.setValueAtTime(0.0001, start);
    bodyGain.gain.exponentialRampToValueAtTime(accented ? 0.105 : 0.078, start + 0.018);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(0.7, duration + 0.62));
    shimmerGain.gain.setValueAtTime(0.0001, start);
    shimmerGain.gain.exponentialRampToValueAtTime(accented ? 0.026 : 0.018, start + 0.012);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.48);
    body.connect(bodyGain);
    shimmer.connect(shimmerGain);
    connectWithSpace(bodyGain);
    connectWithSpace(shimmerGain);
    trackVoice(body, bodyGain);
    trackVoice(shimmer, shimmerGain);
    body.start(start);
    shimmer.start(start);
    body.stop(start + Math.max(0.75, duration + 0.68));
    shimmer.stop(start + 0.52);
    return start + Math.max(0.75, duration + 0.68);
  };

  const schedulePad = (midis: number[], start: number, duration: number) => {
    midis.forEach((midi, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(midiToFrequency(midi), start);
      oscillator.detune.setValueAtTime(index * 2 - 2, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(index === 0 ? 0.017 : 0.009, start + 0.34);
      gain.gain.setValueAtTime(index === 0 ? 0.017 : 0.009, start + Math.max(0.36, duration - 0.48));
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      connectWithSpace(gain);
      trackVoice(oscillator, gain);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.04);
    });
    return start + duration + 0.04;
  };

  // Schedule whole renditions on the audio clock. The last rendition and its
  // natural reverb must finish even after the visual timeline stops.
  const melodyDuration = melody.reduce((sum, note) => sum + note.beats * beat, 0);
  const repeatGap = beat * 1.6;
  const leadIn = 0.08;
  const repetitions = Math.max(1, Math.ceil(
    (minimumDuration - leadIn + repeatGap) / (melodyDuration + repeatGap),
  ));
  let nextNoteTime = context.currentTime + leadIn;
  let finalSoundEnd = nextNoteTime;
  for (let repetition = 0; repetition < repetitions; repetition += 1) {
    for (const note of melody) {
      const duration = note.beats * beat;
      finalSoundEnd = Math.max(finalSoundEnd,
        scheduleBell(note.midi, nextNoteTime, duration, Boolean(note.chord)));
      if (note.chord) {
        finalSoundEnd = Math.max(finalSoundEnd,
          schedulePad(note.chord, nextNoteTime, Math.max(duration, beat * 5.7)));
      }
      nextNoteTime += duration;
    }
    if (repetition < repetitions - 1) nextNoteTime += repeatGap;
  }

  // A silent sample ends on the same clock as the notes. Unlike a wall-clock
  // timeout it also respects an explicit pause, including on iOS.
  const completion = context.createBufferSource();
  completion.buffer = context.createBuffer(1, 1, context.sampleRate);
  completion.connect(master);
  const endTime = finalSoundEnd + impulse.duration + 0.1;
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    completion.onended = null;
    completion.stop();
    completion.disconnect();
    for (const voice of voices) {
      voice.onended = null;
      voice.stop();
      voice.disconnect();
    }
    voices.clear();
    master.disconnect();
    if (context.state !== "closed") void context.close().catch(() => {});
  };
  completion.onended = dispose;
  completion.start(endTime);
  return { context, master, dispose, endTime };
}

