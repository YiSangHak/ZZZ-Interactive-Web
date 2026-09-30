import { webcamConstraints } from "../config.js";

export async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(webcamConstraints);
    document.getElementById("webcam").srcObject = stream;
  } catch (error) {
    console.error("웹캠을 시작할 수 없습니다.", error);
  }
}
