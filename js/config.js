// Durations are milliseconds unless the setting describes animation physics.

export const appConfig = Object.freeze({
  scanDurationMs: 1000,
  descriptionTypeIntervalMs: 35,
  inactivityTimeoutMs: 60_000,
  activityThrottleMs: 1_000,
  ambientAudio: "assets/audio/CAM-grid-ambient.wav",
});

export const webcamConstraints = {
  video: {
    facingMode: "user",
    width: { ideal: 1280 },
    height: { ideal: 720 },
    aspectRatio: 16 / 9,
  },
  audio: false,
};

export const modalAudioSources = Object.freeze({
  "CAM-001": "assets/audio/CAM-001-audio.wav",
  "CAM-002": "assets/audio/CAM-002-audio.wav",
  "CAM-003": "assets/audio/CAM-003-audio.wav",
  "CAM-004": "assets/audio/CAM-004-audio.wav",
  "CAM-006": "assets/audio/CAM-006-audio.wav",
  "CAM-007": "assets/audio/CAM-007-audio.wav",
  "CAM-009": "assets/audio/CAM-009-audio.wav",
});

export const cam001Config = Object.freeze({
  EEG_CHANNEL_COUNT: 5,
  EEG_HISTORY_LENGTH: 700,
  EEG_SAMPLE_INTERVAL: 24,
  EEG_BG_COLOR: "#111111",
  EEG_LINE_COLOR: "rgba(255, 255, 255, 0.68)",
  EEG_LINE_WIDTH: 1.4,
  EEG_AMPLITUDE: 0.25,
});

export const cam005Config = Object.freeze({
  MAX_SUBJECTS: 3,
  SUBJECT_MATCH_DISTANCE: 0.18,
  SUBJECT_LOST_TIMEOUT: 1000,
  FACE_BOX_PADDING: 10,
  LANDMARK_POINT_RADIUS: 5,
  SYSTEM_COLOR: "#8AFF8A",
  WARNING_COLOR: "#FF4A4A",
  ANALYSIS_DURATION: 3000,
  SCORE_BLINK_COUNT: 5,
  SCORE_BLINK_INTERVAL: 180,
  WARNING_BLINK_INTERVAL: 250,
  WARNING_THRESHOLD: 60,
  WARNING_PROBABILITY: 0.5,
  WARNING_AUDIO_REPEAT_COUNT: 1,
});

export const cam007Config = Object.freeze({
  SEARCH_DURATION_MIN: 2800,
  SEARCH_DURATION_MAX: 4200,
  DETECTED_DURATION: 2200,
  FAILED_DURATION: 1100,
  RETRY_DURATION: 950,
  FREQUENCY_MIN: 6.8,
  FREQUENCY_MAX: 8.4,
});

export const cam008Config = Object.freeze({
  COLOR_BG: "#111111",
  COLOR_SYSTEM: "#8AFF8A",
  COLOR_WARNING: "#FF4A4A",
  COLOR_TEXT: "rgba(138, 255, 138, .70)",
  COLOR_GROUND: "rgba(138, 255, 138, .55)",
  SHEEP_BASE_HEIGHT: 56,
  FENCE_BASE_HEIGHT: 38,
  GRID_SPEED: 400,
  GAME_BASE_SPEED: 300,
  SPEED_INCREASE_PER_COUNT: 0.025,
  MAX_SPEED_MULTIPLIER: 1.85,
  GRAVITY: 1550,
  JUMP_POWER: 560,
  AUTO_JUMP_DISTANCE: 175,
});

export const cam009Config = Object.freeze({
  TYPE_SPEED_MIN: 22,
  TYPE_SPEED_MAX: 48,
  LINE_DELAY_MIN: 160,
  LINE_DELAY_MAX: 420,
  COMMAND_DELAY_MIN: 650,
  COMMAND_DELAY_MAX: 1400,
  MAX_LINES: 45,
});
