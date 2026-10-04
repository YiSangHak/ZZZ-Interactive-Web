import { isMobileExperience } from "./config.js";
import { captureTrackingFrame } from "./core/capture.js";

if (isMobileExperience) {
  const button = document.getElementById("capture-button");
  const message = document.getElementById("capture-message");
  const video = document.getElementById("webcam");
  const beauty = document.getElementById("beauty-canvas");
  const overlay = document.getElementById("tracking-canvas");
  let messageTimer;

  function showMessage(text) {
    clearTimeout(messageTimer);
    message.textContent = text;
    messageTimer = setTimeout(() => { message.textContent = ""; }, 5000);
  }

  function updateReadyState() {
    button.disabled = !video.videoWidth || video.readyState < 2;
  }
  video.addEventListener("loadeddata", updateReadyState);
  video.addEventListener("playing", updateReadyState);
  video.addEventListener("emptied", updateReadyState);
  updateReadyState();

  button.addEventListener("click", async (event) => {
    event.stopPropagation();
    if (!video.videoWidth || video.readyState < 2) {
      showMessage("카메라가 준비될 때까지 기다려주세요.");
      return;
    }
    button.disabled = true;
    try {
      const { width, height } = video.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const image = captureTrackingFrame(video, overlay,
        Math.max(1, Math.round(width * pixelRatio)),
        Math.max(1, Math.round(height * pixelRatio)),
        document.documentElement.classList.contains("beauty-ready") ? beauty : null);
      const blob = await new Promise((resolve) => image.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Image capture failed");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ZZZ-CAM-005-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      showMessage("스크린샷을 다운로드했습니다.");
    } catch (error) {
      console.error("스크린샷을 저장할 수 없습니다.", error);
      showMessage("저장하지 못했습니다. 다시 눌러주세요.");
    } finally {
      updateReadyState();
    }
  });
}
