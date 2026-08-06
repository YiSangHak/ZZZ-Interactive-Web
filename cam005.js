import {
    FilesetResolver,
    FaceLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const webcam = document.getElementById("webcam");

const canvas =
    document.getElementById("tracking-canvas");

const ctx =
    canvas.getContext("2d");

const modalCanvas =
    document.getElementById("modal-tracking-canvas");

const modalCtx =
    modalCanvas.getContext("2d");

let faceLandmarker;

const cam005Monitor =
    document.getElementById("cam005");

const videoModal =
    document.getElementById("video-modal");

const EYE_THRESHOLD = 0.014;
const EYE_CLOSE_FRAMES = 20;

const LEFT_EYE_INDEX = [
    33, 7, 163, 144, 145, 153,
    154, 155, 133, 173, 157,
    158, 159, 160, 161, 246
];

const RIGHT_EYE_INDEX = [
    362, 382, 381, 380, 374, 373,
    390, 249, 263, 466, 388,
    387, 386, 385, 384, 398
];

const FACE_BOX_PADDING = 10;
const EYE_BOX_PADDING = 8;

/*====================================
CAM005 STATE
====================================*/

const statusTitle =
    document.querySelector("#cam005-status .status-title");

const statusValue =
    document.querySelector("#cam005-status .status-value");

const cam005State = {

    mode: "NO_SUBJECT",

    trackingStarted: false,

    modalOpen: false,

    boxColor: "#8AFF8A",

    eyesClosed: false,

    eyeClosedFrames: 0

};

let trackingTimeout = null;

function setState(mode) {

    if (cam005State.mode === mode) return;

    cam005State.mode = mode;

    // 이전 상태 초기화
    cam005Monitor.classList.remove("warning");
    statusTitle.parentElement.classList.remove("warning");
    videoModal.classList.remove("warning");

    switch (mode) {

        case "NO_SUBJECT":

            statusTitle.textContent =
                "SIGNAL LOST";

            statusValue.textContent =
                "NO SUBJECT";

            cam005State.boxColor = "#8AFF8A";

            break;

        case "SUBJECT_DETECTED":

            statusTitle.textContent =
                "SUBJECT";

            statusValue.textContent =
                "DETECTED";

            cam005State.boxColor = "#8AFF8A";

            break;

        case "TRACKING":

            statusTitle.textContent =
                "STATUS";

            statusValue.textContent =
                "TRACKING";

            cam005State.boxColor = "#8AFF8A";

            break;

        case "WARNING":

            statusTitle.textContent = "WARNING";

            statusValue.textContent = "EYES CLOSED";

            cam005State.boxColor = "#FF4A4A";

            statusTitle.parentElement.classList.add("warning");

            cam005Monitor.classList.add("warning");

            videoModal.classList.add("warning");

            break;

    }

}

async function createFaceLandmarker() {

    const vision = await FilesetResolver.forVisionTasks(

        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"

    );

    faceLandmarker =
        await FaceLandmarker.createFromOptions(

            vision,

            {

                baseOptions: {

                    modelAssetPath:
                        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"

                },

                runningMode: "VIDEO",

                numFaces: 1

            }

        );

    console.log("MediaPipe Ready");

    requestAnimationFrame(detectFace);

}

function drawTracking(
    ctx,
    canvas,
    faceBox,
    leftEyeBox,
    rightEyeBox
) {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.strokeStyle = cam005State.boxColor;

    ctx.lineWidth = 2;

    // 얼굴
    ctx.strokeRect(
        faceBox.x,
        faceBox.y,
        faceBox.w,
        faceBox.h
    );

    // 왼쪽 눈
    ctx.strokeRect(
        leftEyeBox.x,
        leftEyeBox.y,
        leftEyeBox.w,
        leftEyeBox.h
    );

    // 오른쪽 눈
    ctx.strokeRect(
        rightEyeBox.x,
        rightEyeBox.y,
        rightEyeBox.w,
        rightEyeBox.h
    );

}

function getDistance(a, b) {

    return Math.hypot(

        a.x - b.x,

        a.y - b.y

    );

}

function isEyesClosed(landmarks) {

    const leftTop = landmarks[159];
    const leftBottom = landmarks[145];

    const rightTop = landmarks[386];
    const rightBottom = landmarks[374];

    const leftEye = getDistance(leftTop, leftBottom);

    const rightEye = getDistance(rightTop, rightBottom);

    const average =

        (leftEye + rightEye) / 2;

    window.eyeValue = average;

    return average < EYE_THRESHOLD;

}

function getEyeBox(landmarks, indices, canvas) {

    let minX = 1;
    let minY = 1;

    let maxX = 0;
    let maxY = 0;

    for (const index of indices) {

        const p = landmarks[index];

        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);

        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);

    }

    const padding = EYE_BOX_PADDING;

    return {

        x: minX * canvas.width - padding,

        y: minY * canvas.height - padding,

        w: (maxX - minX) * canvas.width + padding * 2,

        h: (maxY - minY) * canvas.height + padding * 2

    };

}

async function detectFace() {

    if (!webcam.videoWidth) {

        requestAnimationFrame(detectFace);

        return;

    }

    if (
        canvas.width !== webcam.videoWidth ||
        canvas.height !== webcam.videoHeight
    ) {

        canvas.width = webcam.videoWidth;
        canvas.height = webcam.videoHeight;

    }

    if (
        modalCanvas.width !== webcam.videoWidth ||
        modalCanvas.height !== webcam.videoHeight
    ) {

        modalCanvas.width = webcam.videoWidth;
        modalCanvas.height = webcam.videoHeight;

    }

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    modalCtx.clearRect(
        0,
        0,
        modalCanvas.width,
        modalCanvas.height
    );

    const result =
        faceLandmarker.detectForVideo(

            webcam,
            performance.now()

        );

    if (result.faceLandmarks.length > 0) {

        if (!cam005State.trackingStarted) {

            cam005State.trackingStarted = true;

            setState("SUBJECT_DETECTED");

            clearTimeout(trackingTimeout);

            trackingTimeout = setTimeout(() => {

                setState("TRACKING");

            }, 800);

        }

        const landmarks =
            result.faceLandmarks[0];

        let minX = 1;
        let minY = 1;

        let maxX = 0;
        let maxY = 0;

        const eyesClosed =
            isEyesClosed(landmarks);

        if (eyesClosed) {

            cam005State.eyeClosedFrames++;

        } else {

            cam005State.eyeClosedFrames = 0;

        }

        if (cam005State.eyeClosedFrames > EYE_CLOSE_FRAMES) {

            setState("WARNING");

        } else if (cam005State.mode === "WARNING") {

            setState("TRACKING");

        }

        for (const point of landmarks) {

            if (point.x < minX) minX = point.x;
            if (point.y < minY) minY = point.y;

            if (point.x > maxX) maxX = point.x;
            if (point.y > maxY) maxY = point.y;

        }

        const padding = FACE_BOX_PADDING;

        const faceBox = {

            x: minX * canvas.width - padding,

            y: minY * canvas.height - padding,

            w: (maxX - minX) * canvas.width + padding * 2,

            h: (maxY - minY) * canvas.height + padding * 2

        };

        const leftEyeBox =
            getEyeBox(
                landmarks,
                LEFT_EYE_INDEX,
                canvas
            );

        const rightEyeBox =
            getEyeBox(
                landmarks,
                RIGHT_EYE_INDEX,
                canvas
            );

        drawTracking(
            ctx,
            canvas,
            faceBox,
            leftEyeBox,
            rightEyeBox
        );

        if (window.isCam005ModalOpen) {

            const modalLeftEyeBox =
                getEyeBox(
                    landmarks,
                    LEFT_EYE_INDEX,
                    modalCanvas
                );

            const modalRightEyeBox =
                getEyeBox(
                    landmarks,
                    RIGHT_EYE_INDEX,
                    modalCanvas
                );

            const modalFaceBox = {

                x: minX * modalCanvas.width - padding,

                y: minY * modalCanvas.height - padding,

                w: (maxX - minX) * modalCanvas.width + padding * 2,

                h: (maxY - minY) * modalCanvas.height + padding * 2

            };

            drawTracking(
                modalCtx,
                modalCanvas,
                modalFaceBox,
                modalLeftEyeBox,
                modalRightEyeBox
            );

        }

    } else {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        modalCtx.clearRect(
            0,
            0,
            modalCanvas.width,
            modalCanvas.height
        );

        clearTimeout(trackingTimeout);

        cam005State.trackingStarted = false;

        setState("NO_SUBJECT");

    }

    requestAnimationFrame(detectFace);

}

createFaceLandmarker();