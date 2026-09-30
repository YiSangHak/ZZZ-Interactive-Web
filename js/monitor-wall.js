import { appConfig } from "./config.js";
import { appState } from "./core/state.js";
import { openModal } from "./modal.js";

const monitors = document.querySelectorAll(".monitor");
const cursorUI = document.getElementById("cursor-ui");
const ring = document.querySelector(".ring");
const progressText = document.getElementById("progress-text");
const infoPanel = document.getElementById("info-panel");
const crosshair = document.getElementById("crosshair");
const infoDescription = document.getElementById("info-description");
let typingTimeout;

// CURSOR CONFIG
const circumference = parseFloat(
  getComputedStyle(document.documentElement).getPropertyValue("--ring-length"),
);

const root = getComputedStyle(document.documentElement);

const cursorOffset = parseFloat(root.getPropertyValue("--cursor-offset"));

let progress = 0;
let scanAnimationFrame;
let scanStartTime = 0;
const scanDuration = appConfig.scanDurationMs;

// MONITOR EVENTS
monitors.forEach((monitor) => {
  monitor.addEventListener("mouseenter", () => {
    if (appState.activeCameraId !== null) {
      return;
    }

    progress = 0;

    progressText.textContent = 0;

    scanStartTime = performance.now();

    ring.style.strokeDashoffset = circumference;

    cursorUI.style.display = "block";

    cancelAnimationFrame(scanAnimationFrame);

    animateScan(monitor);
  });

  monitor.addEventListener("mouseleave", () => {
    if (appState.activeCameraId !== null) {
      return;
    }

    cursorUI.style.display = "none";

    progress = 0;

    progressText.textContent = 0;

    infoPanel.classList.remove("show");

    clearTimeout(typingTimeout);

    infoDescription.innerHTML = "";

    cancelAnimationFrame(scanAnimationFrame);
  });

  monitor.addEventListener("click", (event) => {
    event.stopPropagation();

    if (appState.activeCameraId !== null) {
      return;
    }

    cancelAnimationFrame(scanAnimationFrame);
    clearTimeout(typingTimeout);
    cursorUI.style.display = "none";
    infoPanel.classList.remove("show");
    openModal(monitor);
  });
});

// MOUSE
document.addEventListener("mousemove", (event) => {
  crosshair.style.left = event.clientX + "px";

  crosshair.style.top = event.clientY + "px";

  if (appState.activeCameraId !== null) {
    return;
  }

  cursorUI.style.left = event.clientX + cursorOffset + "px";

  cursorUI.style.top = event.clientY + cursorOffset + "px";

  infoPanel.style.left = event.clientX + cursorOffset + "px";

  infoPanel.style.top = event.clientY + cursorOffset + "px";
});

// SCAN

function animateScan(monitor) {
  const elapsed = performance.now() - scanStartTime;

  progress = (elapsed / scanDuration) * 100;

  if (progress > 100) {
    progress = 100;
  }

  progressText.textContent = `${Math.floor(progress)}%`;

  const offset = circumference - (progress / 100) * circumference;

  ring.style.strokeDashoffset = offset;

  if (progress < 100) {
    scanAnimationFrame = requestAnimationFrame(() => animateScan(monitor));
  } else {
    progressText.textContent = "100%";

    showInfoPanel(monitor);
  }
}

// INFO PANEL

function showInfoPanel(monitor) {
  cursorUI.style.display = "none";

  const id = monitor.dataset.id;

  const title = monitor.dataset.title;

  const description = monitor.dataset.description;

  document.getElementById("info-cam").textContent = id;

  document.getElementById("info-title").textContent = title;

  infoPanel.classList.add("show");

  typeDescription(description);
}

// TYPE DESCRIPTION

function typeDescription(text) {
  clearTimeout(typingTimeout);

  let index = 0;

  infoDescription.innerHTML = '<span class="cursor">█</span>';

  function type() {
    if (index < text.length) {
      infoDescription.innerHTML = text.slice(0, index + 1) + '<span class="cursor">█</span>';

      index++;

      typingTimeout = setTimeout(type, appConfig.descriptionTypeIntervalMs);
    }
  }

  type();
}
