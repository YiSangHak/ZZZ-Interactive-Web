import { appConfig, modalAudioSources } from "../config.js";

export function createAudio(source, { loop = false, volume = 1 } = {}) {
  const audio = new Audio(source);
  audio.loop = loop;
  audio.volume = volume;
  return audio;
}

// Browsers may reject playback until the visitor interacts with the page.

export function playAudio(audio) {
  audio.play().catch(() => {});
}

export function stopAudio(audio) {
  audio.pause();
  audio.currentTime = 0;
}
const gridAmbientAudio = createAudio(appConfig.ambientAudio, { loop: true });
const modalAudio = createAudio("", { loop: true });

export function playGridAmbient() {
  playAudio(gridAmbientAudio);
}

export function pauseGridAmbient() {
  gridAmbientAudio.pause();
}

export function stopGridAmbient() {
  stopAudio(gridAmbientAudio);
}

export function playModalAudio(cameraId) {
  const source = modalAudioSources[cameraId];
  if (!source) return;
  stopAudio(modalAudio);
  modalAudio.src = source;
  playAudio(modalAudio);
}

export function stopModalAudio() {
  stopAudio(modalAudio);
  modalAudio.removeAttribute("src");
  modalAudio.load();
}
