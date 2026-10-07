import { appConfig, modalAudioSources, isMobileExperience } from "../config.js";

export function createAudio(source, { loop = false, volume = 1 } = {}) {
  const audio = new Audio(source);
  audio.muted = isMobileExperience;
  audio.loop = loop;
  audio.volume = volume;
  return audio;
}

// Browsers may reject playback until the visitor interacts with the page.

export function playAudio(audio) {
  if (isMobileExperience && audio instanceof HTMLAudioElement) return;
  audio.play().catch(() => {});
}

export function stopAudio(audio) {
  audio.pause();
  audio.currentTime = 0;
}
const gridAmbientAudio = createAudio(appConfig.ambientAudio, { loop: true });
const modalAudio = createAudio("", { loop: true });
let terminalAudioContext = null;
let terminalAudioEnabled = false;
const terminalTones = new Set();

// Generate a brief digital key sound at the actual terminal input time.
export function playTerminalKey(isEnter = false) {
  playTerminalTone(isEnter ? 4200 : 4800 + Math.random() * 100,
    isEnter ? 0.045 : 0.018, isEnter ? 0.032 : 0.022);
}

export function playTerminalResult(type) {
  if (type === "success") {
    playTerminalTone(2800, 0.045, 0.03);
    playTerminalTone(3600, 0.065, 0.03, 0.065);
  } else if (type === "warning") {
    playTerminalTone(1800, 0.065, 0.035);
    playTerminalTone(1800, 0.065, 0.035, 0.1);
  }
}

function playTerminalTone(frequency, duration, peakVolume, delay = 0) {
  if (!terminalAudioEnabled || document.hidden || terminalAudioContext?.state !== "running") return;
  const context = terminalAudioContext;
  const now = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  // A steady, high sine pulse avoids the descending arcade-like chirp.
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peakVolume, now + 0.001);
  gain.gain.setValueAtTime(peakVolume, now + duration * 0.55);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.onended = () => {
    terminalTones.delete(oscillator);
    oscillator.disconnect();
    gain.disconnect();
  };
  terminalTones.add(oscillator);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

export function playGridAmbient() {
  if (!appConfig.gridAmbientEnabled) return;
  playAudio(gridAmbientAudio);
}

export function pauseGridAmbient() {
  gridAmbientAudio.pause();
}

export function stopGridAmbient() {
  stopAudio(gridAmbientAudio);
}

export function playModalAudio(cameraId) {
  stopModalAudio();
  if (cameraId === "CAM-009" && !isMobileExperience) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    terminalAudioContext ??= new AudioContextClass();
    terminalAudioEnabled = true;
    terminalAudioContext.resume().catch(() => {});
    return;
  }
  const source = modalAudioSources[cameraId];
  if (!source) return;
  stopAudio(modalAudio);
  modalAudio.src = source;
  playAudio(modalAudio);
}

export function stopModalAudio() {
  terminalAudioEnabled = false;
  for (const oscillator of terminalTones) oscillator.stop();
  terminalTones.clear();
  if (terminalAudioContext) terminalAudioContext.suspend().catch(() => {});
  stopAudio(modalAudio);
  modalAudio.removeAttribute("src");
  modalAudio.load();
}
