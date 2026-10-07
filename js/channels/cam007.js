import { clamp, randomRange } from "../core/math.js";
import { cam007Config } from "../config.js";

const {
  SEARCH_DURATION_MIN,
  SEARCH_DURATION_MAX,
  DETECTED_DURATION,
  FAILED_DURATION,
  RETRY_DURATION,
  FREQUENCY_MIN,
  FREQUENCY_MAX,
} = cam007Config;

// CAM007 SIGNAL RECOVERY SYSTEM
const gridScreen = document.getElementById("cam007-screen");
const modalScreen = document.getElementById("modal-cam007-screen");

// STATE
const state = {
  mode: "SEARCHING",
  progress: 0,
  attempt: 1,
  frequency: 7.338,
  searchStartedAt: performance.now(),
  searchDuration: 3200,
  modeStartedAt: performance.now(),
  lastFrequencyUpdate: 0,
};

// CREATE SCREEN

function createScreen(container, isModal) {
  if (!container) {
    return null;
  }
  container.innerHTML = "";
  /* CONTENT */
  const content = document.createElement("div");
  content.className = isModal ? "cam007-content cam007-content-modal" : "cam007-content";
  const header = document.createElement("div");
  header.className = "cam007-header";
  header.innerHTML = '<span>ZZZ / SIGNAL RECOVERY</span><span>RX 07 · AUTO</span>';
  /* STATE */
  const stateLabel = document.createElement("div");
  stateLabel.className = "cam007-state";
  /* MAIN */
  const main = document.createElement("div");
  main.className = isModal ? "cam007-main cam007-main-modal" : "cam007-main";
  /* LOGO */
  const logo = document.createElement("div");
  logo.className = isModal ? "cam007-logo cam007-logo-modal" : "cam007-logo";
  const logoImage = document.createElement("img");
  logoImage.src = "assets/images/cam007-logo.svg";
  logoImage.alt = "ZZZ";
  logo.appendChild(logoImage);
  const visual = document.createElement("div");
  visual.className = "cam007-spectrum";
  visual.setAttribute("aria-hidden", "true");
  const svgNS = "http://www.w3.org/2000/svg";
  const spectrum = document.createElementNS(svgNS, "svg");
  spectrum.setAttribute("viewBox", "0 0 480 100");
  spectrum.setAttribute("preserveAspectRatio", "none");
  for (let index = 0; index < 60; index++) {
    const height = 8 + Math.abs(Math.sin(index * 1.7) * Math.cos(index * 0.31)) * 65;
    const bar = document.createElementNS(svgNS, "rect");
    bar.setAttribute("x", String(index * 8 + 2));
    bar.setAttribute("y", String((100 - height) / 2));
    bar.setAttribute("width", "2");
    bar.setAttribute("height", String(height));
    spectrum.appendChild(bar);
  }
  const scanHead = document.createElement("div");
  scanHead.className = "cam007-scan-head";
  visual.append(spectrum, scanHead);
  /* STATUS */
  const statusRow = document.createElement("div");
  statusRow.className = isModal ? "cam007-status-row cam007-status-row-modal" : "cam007-status-row";
  const statusText = document.createElement("span");
  const progressText = document.createElement("span");
  statusRow.appendChild(statusText);
  statusRow.appendChild(progressText);
  /* PROGRESS */
  const progressTrack = document.createElement("div");
  progressTrack.className = isModal
    ? "cam007-progress-track cam007-progress-track-modal"
    : "cam007-progress-track";
  const progressBar = document.createElement("div");
  progressBar.className = "cam007-progress-bar";
  progressTrack.appendChild(progressBar);
  /* META */
  const meta = document.createElement("div");
  meta.className = "cam007-meta";
  const metaFrequency = document.createElement("span");
  const metaNode = document.createElement("span");
  const metaSync = document.createElement("span");
  const metaAttempt = document.createElement("span");
  meta.appendChild(metaFrequency);
  meta.appendChild(metaNode);
  meta.appendChild(metaSync);
  meta.appendChild(metaAttempt);
  /* MESSAGE */
  const message = document.createElement("div");
  message.className = "cam007-small";
  /* ASSEMBLE */
  content.appendChild(header);
  content.appendChild(stateLabel);
  content.appendChild(main);
  content.appendChild(logo);
  content.appendChild(visual);
  content.appendChild(statusRow);
  content.appendChild(progressTrack);
  content.appendChild(meta);
  content.appendChild(message);
  container.appendChild(content);
  return {
    container,
    content,
    stateLabel,
    main,
    logo,
    logoImage,
    statusRow,
    statusText,
    progressText,
    progressTrack,
    progressBar,
    meta,
    metaFrequency,
    metaNode,
    metaSync,
    metaAttempt,
    message,
  };
}

// SCREEN REFERENCES
const gridUI = createScreen(gridScreen, false);
const modalUI = createScreen(modalScreen, true);
const screens = [gridUI, modalUI].filter(Boolean);

// RESET VISIBILITY

function resetScreenVisibility(ui) {
  ui.content.dataset.mode = state.mode.toLowerCase();
  ui.logo.style.display = "none";
  ui.statusRow.style.display = "flex";
  ui.progressTrack.style.display = "block";
  ui.progressBar.style.width = "0%";
  ui.meta.style.display = "grid";
  ui.message.style.display = "block";
  ui.stateLabel.classList.remove("warning");
  ui.stateLabel.classList.remove("detected");
  ui.content.classList.remove("signal-detected");
}

// SEARCH MODE

function renderSearching(ui) {
  resetScreenVisibility(ui);
  ui.stateLabel.textContent = "NO SIGNAL";
  ui.main.textContent = "SEARCHING";
  ui.statusRow.style.display = "flex";
  ui.progressTrack.style.display = "block";
  ui.statusText.textContent = "SIGNAL SCAN";
  ui.progressText.textContent = `${Math.floor(state.progress)}%`;
  ui.progressBar.style.width = `${state.progress}%`;
  ui.content.style.setProperty("--scan-position", `${state.progress}%`);
  ui.metaFrequency.textContent = `FREQ ${state.frequency.toFixed(3)} MHz`;
  ui.metaNode.textContent = "NODE UNKNOWN";
  ui.metaSync.textContent = "SYNC SCANNING";
  ui.metaAttempt.textContent = `ATTEMPT ${String(state.attempt).padStart(3, "0")}`;
  ui.message.textContent = "SCANNING REMOTE SURVEILLANCE BAND...";
}

// DETECTED MODE

function renderDetected(ui) {
  resetScreenVisibility(ui);
  ui.stateLabel.textContent = "SIGNAL DETECTED";
  ui.stateLabel.classList.add("detected");
  ui.main.textContent = "SIGNAL FOUND";
  ui.statusText.textContent = "VERIFYING IDENTITY";
  ui.progressText.textContent = "LOCKED";
  ui.progressBar.style.width = "100%";
  ui.logo.style.display = "flex";
  /*
        CSS Animation 재시작
        */
  ui.logoImage.classList.remove("signal-lock");
  void ui.logoImage.offsetWidth;
  ui.logoImage.classList.add("signal-lock");
  ui.content.classList.add("signal-detected");
  ui.metaFrequency.textContent = `FREQ ${state.frequency.toFixed(3)} MHz`;
  ui.metaNode.textContent = "NODE ZZZ";
  ui.metaSync.textContent = "SYNC TEMPORARY LOCK";
  ui.metaAttempt.textContent = `ATTEMPT ${String(state.attempt).padStart(3, "0")}`;
  ui.message.textContent = "VERIFYING REMOTE SIGNAL...";
}

// FAILED MODE

function renderFailed(ui) {
  resetScreenVisibility(ui);
  ui.stateLabel.textContent = "CONNECTION FAILED";
  ui.stateLabel.classList.add("warning");
  ui.main.textContent = "SIGNAL LOST";
  ui.statusText.textContent = "CONNECTION INTERRUPTED";
  ui.progressText.textContent = "OFFLINE";
  ui.metaFrequency.textContent = `FREQ ${state.frequency.toFixed(3)} MHz`;
  ui.metaNode.textContent = "NODE UNKNOWN";
  ui.metaSync.textContent = "SYNC FAILED";
  ui.metaAttempt.textContent = `ATTEMPT ${String(state.attempt).padStart(3, "0")}`;
  ui.message.textContent = "REMOTE SURVEILLANCE CHANNEL UNAVAILABLE";
}

// RETRY MODE

function renderRetry(ui) {
  resetScreenVisibility(ui);
  ui.stateLabel.textContent = "RECOVERY PROTOCOL";
  ui.main.textContent = "RECONNECTING";
  ui.statusText.textContent = "REINITIALIZING RECEIVER";
  ui.progressText.textContent = "RETRY";
  ui.metaFrequency.textContent = "FREQ RESET";
  ui.metaNode.textContent = "NODE UNKNOWN";
  ui.metaSync.textContent = "SYNC RESETTING";
  ui.metaAttempt.textContent = `ATTEMPT ${String(state.attempt).padStart(3, "0")}`;
  ui.message.textContent = "REINITIALIZING SIGNAL RECEIVER...";
}

// RENDER MODE

function renderMode() {
  screens.forEach((ui) => {
    if (state.mode === "SEARCHING") {
      renderSearching(ui);
      return;
    }
    if (state.mode === "DETECTED") {
      renderDetected(ui);
      return;
    }
    if (state.mode === "FAILED") {
      renderFailed(ui);
      return;
    }
    renderRetry(ui);
  });
}

// UPDATE SEARCH DISPLAY

function updateSearchDisplay() {
  if (state.mode !== "SEARCHING") {
    return;
  }
  screens.forEach((ui) => {
    ui.progressText.textContent = `${Math.floor(state.progress)}%`;
    ui.progressBar.style.width = `${state.progress}%`;
    ui.content.style.setProperty("--scan-position", `${state.progress}%`);
    ui.metaFrequency.textContent = `FREQ ${state.frequency.toFixed(3)} MHz`;
  });
}

// START SEARCH

function startSearch() {
  const now = performance.now();
  state.mode = "SEARCHING";
  state.progress = 0;
  state.searchStartedAt = now;
  state.modeStartedAt = now;
  state.searchDuration = randomRange(SEARCH_DURATION_MIN, SEARCH_DURATION_MAX);
  state.frequency = randomRange(FREQUENCY_MIN, FREQUENCY_MAX);
  state.lastFrequencyUpdate = now;
  renderMode();
}

// SET MODE

function setMode(mode) {
  state.mode = mode;
  state.modeStartedAt = performance.now();
  renderMode();
}

// UPDATE

function update(now) {
  // SEARCHING
  if (state.mode === "SEARCHING") {
    const elapsed = now - state.searchStartedAt;
    state.progress = clamp((elapsed / state.searchDuration) * 100, 0, 100);
    /*
            Frequency는 매 프레임 랜덤하게
            떨지 않고 120ms마다 아주 조금만 변경.
            */
    if (now - state.lastFrequencyUpdate >= 120) {
      state.frequency += randomRange(-0.012, 0.012);
      state.frequency = clamp(state.frequency, FREQUENCY_MIN, FREQUENCY_MAX);
      state.lastFrequencyUpdate = now;
    }
    updateSearchDisplay();
    if (state.progress >= 100) {
      setMode("DETECTED");
    }
    return;
  }
  const elapsed = now - state.modeStartedAt;
  // DETECTED
  if (state.mode === "DETECTED") {
    if (elapsed >= DETECTED_DURATION) {
      setMode("FAILED");
    }
    return;
  }
  // FAILED
  if (state.mode === "FAILED") {
    if (elapsed >= FAILED_DURATION) {
      setMode("RETRY");
    }
    return;
  }
  // RETRY
  if (elapsed >= RETRY_DURATION) {
    state.attempt++;
    startSearch();
  }
}

// MAIN LOOP

function animate(now) {
  update(now);
  requestAnimationFrame(animate);
}

// START
startSearch();
requestAnimationFrame(animate);
