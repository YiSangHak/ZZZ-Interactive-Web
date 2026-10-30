import { isMobileExperience } from "./config.js";
import { appState, actions } from "./core/state.js";
import {
  pauseGridAmbient,
  playGridAmbient,
  playModalAudio,
  stopModalAudio,
  playAudio,
} from "./core/audio.js";

const modal = document.getElementById("video-modal");
const video = document.getElementById("modal-video");
const trackingCanvas = document.getElementById("modal-tracking-canvas");
const cameraLabel = document.getElementById("modal-cam");
const title = document.getElementById("modal-title");
const description = document.getElementById("modal-description");
const footer = document.getElementById("modal-footer");
const videoWrapper = document.querySelector(".modal-video-wrapper");
const modalWindow = document.querySelector(".modal-window");
const header = document.getElementById("modal-header");

function fitModalMedia() {
  // Portrait layouts use their own rotated viewport sizing.
  if (window.matchMedia("(orientation: portrait) and (max-width: 1024px)").matches) {
    modalWindow.style.removeProperty("--modal-media-width");
    return;
  }
  const windowStyle = getComputedStyle(modalWindow);
  const footerStyle = getComputedStyle(footer);
  const availableHeight = window.innerHeight * 0.9
    - parseFloat(windowStyle.paddingTop)
    - parseFloat(windowStyle.paddingBottom)
    - header.offsetHeight
    - footer.offsetHeight
    - parseFloat(footerStyle.marginTop);
  modalWindow.style.setProperty("--modal-media-width", `${Math.max(0, Math.floor(availableHeight * 16 / 9))}px`);
}

const modalSizeObserver = new ResizeObserver(fitModalMedia);
modalSizeObserver.observe(header);
modalSizeObserver.observe(footer);
window.addEventListener("resize", fitModalMedia);

// Add custom channel surfaces here; ordinary video channels use the fallback.
const surfaces = {
  cam001: { element: document.getElementById("modal-cam001-canvas"), display: "block" },
  cam007: { element: document.getElementById("modal-cam007-screen"), display: "flex" },
  cam008: { element: document.getElementById("modal-cam008-canvas"), display: "block" },
  cam009: { element: document.getElementById("modal-cam009-terminal"), display: "block" },
};

function resetModalMedia() {
  appState.activeCameraId = null;
  for (const element of [cameraLabel, title, description, footer]) element.style.color = "";
  videoWrapper.style.borderColor = "";
  video.pause();
  video.srcObject = null;
  video.removeAttribute("src");
  video.load();
  video.classList.remove("mirror", "cam005-feed");
  video.style.display = "none";
  trackingCanvas.style.display = "none";
  for (const { element } of Object.values(surfaces)) element.style.display = "none";
}

export function openModal(monitor) {
  if (isMobileExperience) return;
  pauseGridAmbient();
  resetModalMedia();
  appState.activeCameraId = monitor.id || monitor.dataset.id.toLowerCase().replace("-", "");
  const surface = surfaces[monitor.id];
  if (surface) {
    surface.element.style.display = surface.display;
    if (monitor.id === "cam009") surface.element.scrollTop = surface.element.scrollHeight;
  } else if (monitor.id === "cam005") {
    actions.resetCam005Analysis?.();
    video.style.display = "block";
    trackingCanvas.style.display = "block";
    video.classList.add("mirror", "cam005-feed");
    video.srcObject = monitor.querySelector("video").srcObject;
    playAudio(video);
  } else {
    const source = monitor.querySelector("source");
    if (source) {
      video.style.display = "block";
      video.src = source.src;
      playAudio(video);
    }
  }
  cameraLabel.textContent = monitor.dataset.id;
  title.textContent = monitor.dataset.title;
  description.textContent = monitor.dataset.description.replace(". ", ".\n");
  fitModalMedia();
  modal.classList.add("show");
  document.body.classList.add("modal-open");
  playModalAudio(monitor.dataset.id);
}

export function closeModal() {
  if (appState.activeCameraId === null) return;
  modal.classList.remove("show");
  document.body.classList.remove("modal-open");
  stopModalAudio();
  resetModalMedia();
  playGridAmbient();
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
