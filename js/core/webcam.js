import { webcamConstraints } from "../config.js";

export async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(webcamConstraints);
    document.getElementById("webcam").srcObject = stream;
  } catch (error) {
    if (document.documentElement.classList.contains("mobile-tracking")) {
      document.querySelector("#cam005-status .status-title").textContent = "CAMERA UNAVAILABLE";
      document.querySelector("#cam005-status .status-value").textContent = "카메라 권한을 허용한 뒤 새로고침해주세요";
      document.getElementById("capture-message").textContent = "카메라 권한을 허용한 뒤 새로고침해주세요.";
    }
    console.error("웹캠을 시작할 수 없습니다.", error);
  }
}
