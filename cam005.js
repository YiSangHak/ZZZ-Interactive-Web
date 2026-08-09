import {
    FilesetResolver,
    FaceLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const webcam =
    document.getElementById("webcam");

const canvas =
    document.getElementById("tracking-canvas");

const ctx =
    canvas.getContext("2d");

const modalCanvas =
    document.getElementById("modal-tracking-canvas");

const modalCtx =
    modalCanvas.getContext("2d");

const cam005Monitor =
    document.getElementById("cam005");

const videoModal =
    document.getElementById("video-modal");

const statusTitle =
    document.querySelector("#cam005-status .status-title");

const statusValue =
    document.querySelector("#cam005-status .status-value");


/*====================================
CAM005 CONFIG
====================================*/

const MAX_SUBJECTS = 3;

const EYE_THRESHOLD = 0.014;

const EYE_CLOSE_FRAMES = 20;

const SUBJECT_MATCH_DISTANCE = 0.18;

const FACE_BOX_PADDING = 10;

const EYE_BOX_PADDING = 8;

const SYSTEM_COLOR = "#8AFF8A";

const WARNING_COLOR = "#FF4A4A";


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


/*====================================
MEDIAPIPE
====================================*/

let faceLandmarker;


/*====================================
CAM005 STATE
====================================*/

const cam005State = {

    mode: "NO_SUBJECT",

    trackingStarted: false,

    modalOpen: false,

    boxColor: SYSTEM_COLOR

};


/*====================================
SUBJECT STATE
====================================*/

const subjects = [];

let nextSubjectId = 1;


/*====================================
GENERAL STATE
====================================*/

let trackingTimeout = null;


/*====================================
CAM005 STATUS
====================================*/

function setState(mode) {

    if (cam005State.mode === mode) return;

    cam005State.mode = mode;

    cam005Monitor.classList.remove("warning");

    statusTitle.parentElement.classList.remove("warning");

    if (window.isCam005ModalOpen) {

        videoModal.classList.toggle(
            "warning",
            mode === "WARNING"
        );

    }

    switch (mode) {

        case "NO_SUBJECT":

            statusTitle.textContent =
                "SIGNAL LOST";

            statusValue.textContent =
                "NO SUBJECT";

            cam005State.boxColor =
                SYSTEM_COLOR;

            break;


        case "SUBJECT_DETECTED":

            statusTitle.textContent =
                "SUBJECT";

            statusValue.textContent =
                "DETECTED";

            cam005State.boxColor =
                SYSTEM_COLOR;

            break;


        case "TRACKING":

            statusTitle.textContent =
                "STATUS";

            statusValue.textContent =
                "TRACKING";

            cam005State.boxColor =
                SYSTEM_COLOR;

            break;


        case "WARNING":

            statusTitle.textContent =
                "WARNING";

            statusValue.textContent =
                "EYES CLOSED";

            cam005State.boxColor =
                WARNING_COLOR;

            statusTitle.parentElement.classList.add(
                "warning"
            );

            cam005Monitor.classList.add(
                "warning"
            );

            break;

    }

}


/*====================================
CREATE SUBJECT
====================================*/

function createSubject(centerX, centerY) {

    const subject = {

        id: nextSubjectId,

        centerX: centerX,

        centerY: centerY,

        eyeClosedFrames: 0,

        eyesClosed: false,

        warning: false

    };

    nextSubjectId++;

    subjects.push(subject);

    return subject;

}


/*====================================
RESET SUBJECTS
====================================*/

function resetSubjects() {

    subjects.length = 0;

    nextSubjectId = 1;

}


/*====================================
MATCH SUBJECT
====================================*/

function matchSubjects(faceData) {

    const matchedSubjects = [];

    const availableSubjects = [
        ...subjects
    ];

    faceData.forEach(face => {

        let closestSubject = null;

        let closestDistance =
            SUBJECT_MATCH_DISTANCE;

        availableSubjects.forEach(subject => {

            const distance =
                Math.hypot(

                    face.centerX -
                    subject.centerX,

                    face.centerY -
                    subject.centerY

                );

            if (distance < closestDistance) {

                closestDistance = distance;

                closestSubject = subject;

            }

        });


        if (closestSubject) {

            closestSubject.centerX =
                face.centerX;

            closestSubject.centerY =
                face.centerY;

            matchedSubjects.push({
                face,
                subject: closestSubject
            });

            const index =
                availableSubjects.indexOf(
                    closestSubject
                );

            availableSubjects.splice(
                index,
                1
            );

        }

    });


    faceData.forEach(face => {

        const alreadyMatched =
            matchedSubjects.some(
                item => item.face === face
            );

        if (alreadyMatched) return;

        if (subjects.length >= MAX_SUBJECTS) {
            return;
        }

        const subject =
            createSubject(
                face.centerX,
                face.centerY
            );

        matchedSubjects.push({
            face,
            subject
        });

    });


    return matchedSubjects;

}


/*====================================
CREATE FACE DATA
====================================*/

function getFaceData(landmarks) {

    let minX = 1;

    let minY = 1;

    let maxX = 0;

    let maxY = 0;


    for (const point of landmarks) {

        if (point.x < minX) {
            minX = point.x;
        }

        if (point.y < minY) {
            minY = point.y;
        }

        if (point.x > maxX) {
            maxX = point.x;
        }

        if (point.y > maxY) {
            maxY = point.y;
        }

    }


    return {

        landmarks,

        centerX:
            (minX + maxX) / 2,

        centerY:
            (minY + maxY) / 2,

        minX,

        minY,

        maxX,

        maxY

    };

}


/*====================================
EYE DETECTION
====================================*/

function getDistance(a, b) {

    return Math.hypot(

        a.x - b.x,

        a.y - b.y

    );

}


function isEyesClosed(landmarks) {

    const leftTop =
        landmarks[159];

    const leftBottom =
        landmarks[145];

    const rightTop =
        landmarks[386];

    const rightBottom =
        landmarks[374];


    const leftEye =
        getDistance(
            leftTop,
            leftBottom
        );

    const rightEye =
        getDistance(
            rightTop,
            rightBottom
        );


    const average =
        (leftEye + rightEye) / 2;


    return average < EYE_THRESHOLD;

}


/*====================================
EYE BOX
====================================*/

function getEyeBox(
    landmarks,
    indices,
    canvas
) {

    let minX = 1;

    let minY = 1;

    let maxX = 0;

    let maxY = 0;


    for (const index of indices) {

        const point =
            landmarks[index];

        minX =
            Math.min(
                minX,
                point.x
            );

        minY =
            Math.min(
                minY,
                point.y
            );

        maxX =
            Math.max(
                maxX,
                point.x
            );

        maxY =
            Math.max(
                maxY,
                point.y
            );

    }


    const padding =
        EYE_BOX_PADDING;


    return {

        x:
            minX *
            canvas.width -
            padding,

        y:
            minY *
            canvas.height -
            padding,

        w:
            (maxX - minX) *
            canvas.width +
            padding * 2,

        h:
            (maxY - minY) *
            canvas.height +
            padding * 2

    };

}


/*====================================
FACE BOX
====================================*/

function getFaceBox(
    face,
    canvas
) {

    const padding =
        FACE_BOX_PADDING;


    return {

        x:
            face.minX *
            canvas.width -
            padding,

        y:
            face.minY *
            canvas.height -
            padding,

        w:
            (face.maxX - face.minX) *
            canvas.width +
            padding * 2,

        h:
            (face.maxY - face.minY) *
            canvas.height +
            padding * 2

    };

}


/*====================================
DRAW SUBJECT
====================================*/

function drawSubject(
    context,
    canvas,
    face,
    subject
) {

    const faceBox =
        getFaceBox(
            face,
            canvas
        );

    faceBox.x =
        canvas.width -
        faceBox.x -
        faceBox.w;


    const leftEyeBox =
        getEyeBox(
            face.landmarks,
            LEFT_EYE_INDEX,
            canvas
        );


    const rightEyeBox =
        getEyeBox(
            face.landmarks,
            RIGHT_EYE_INDEX,
            canvas
        );

    leftEyeBox.x =
        canvas.width -
        leftEyeBox.x -
        leftEyeBox.w;

    rightEyeBox.x =
        canvas.width -
        rightEyeBox.x -
        rightEyeBox.w;


    const color =
        subject.warning
            ? WARNING_COLOR
            : SYSTEM_COLOR;


    context.strokeStyle =
        color;

    context.fillStyle =
        color;

    context.lineWidth = 2;


    /* FACE */

    context.strokeRect(

        faceBox.x,

        faceBox.y,

        faceBox.w,

        faceBox.h

    );


    /* LEFT EYE */

    context.strokeRect(

        leftEyeBox.x,

        leftEyeBox.y,

        leftEyeBox.w,

        leftEyeBox.h

    );


    /* RIGHT EYE */

    context.strokeRect(

        rightEyeBox.x,

        rightEyeBox.y,

        rightEyeBox.w,

        rightEyeBox.h

    );


    /* SUBJECT LABEL */

    const label =
        `SUBJECT-${String(
            subject.id
        ).padStart(2, "0")}`;


    context.font =
        "12px 'JetBrains Mono', monospace";


    context.textBaseline =
        "bottom";


    context.fillText(

        label,

        faceBox.x,

        faceBox.y - 6

    );

}


/*====================================
DRAW ALL SUBJECTS
====================================*/

function drawSubjects(
    context,
    canvas,
    matchedSubjects
) {

    matchedSubjects.forEach(
        item => {

            drawSubject(

                context,

                canvas,

                item.face,

                item.subject

            );

        }
    );

}


/*====================================
UPDATE SUBJECT STATES
====================================*/

function updateSubjectStates(
    matchedSubjects
) {

    let hasWarning = false;


    matchedSubjects.forEach(
        item => {

            const subject =
                item.subject;

            const eyesClosed =
                isEyesClosed(
                    item.face.landmarks
                );


            if (eyesClosed) {

                subject.eyeClosedFrames++;

            } else {

                subject.eyeClosedFrames = 0;

            }


            if (
                subject.eyeClosedFrames >
                EYE_CLOSE_FRAMES
            ) {

                subject.eyesClosed =
                    true;

                subject.warning =
                    true;

            } else {

                subject.eyesClosed =
                    false;

                subject.warning =
                    false;

            }


            if (subject.warning) {

                hasWarning = true;

            }

        }
    );


    return hasWarning;

}


/*====================================
CREATE FACE LANDMARKER
====================================*/

async function createFaceLandmarker() {

    const vision =
        await FilesetResolver.forVisionTasks(

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

                numFaces: MAX_SUBJECTS

            }

        );


    console.log(
        "MediaPipe Ready"
    );


    requestAnimationFrame(
        detectFace
    );

}


/*====================================
DETECT FACE
====================================*/

async function detectFace() {

    if (!webcam.videoWidth) {

        requestAnimationFrame(
            detectFace
        );

        return;

    }


    /* CANVAS SIZE */

    if (
        canvas.width !==
        webcam.videoWidth ||

        canvas.height !==
        webcam.videoHeight
    ) {

        canvas.width =
            webcam.videoWidth;

        canvas.height =
            webcam.videoHeight;

    }


    if (
        modalCanvas.width !==
        webcam.videoWidth ||

        modalCanvas.height !==
        webcam.videoHeight
    ) {

        modalCanvas.width =
            webcam.videoWidth;

        modalCanvas.height =
            webcam.videoHeight;

    }


    /* CLEAR */

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


    /* DETECT */

    const result =
        faceLandmarker.detectForVideo(

            webcam,

            performance.now()

        );


    const detectedFaces =
        result.faceLandmarks
            .slice(
                0,
                MAX_SUBJECTS
            )
            .map(
                getFaceData
            );


    /* NO SUBJECT */

    if (
        detectedFaces.length === 0
    ) {

        clearTimeout(
            trackingTimeout
        );

        cam005State.trackingStarted =
            false;

        resetSubjects();

        setState(
            "NO_SUBJECT"
        );

        requestAnimationFrame(
            detectFace
        );

        return;

    }


    /* SUBJECT DETECTED */

    if (
        !cam005State.trackingStarted
    ) {

        cam005State.trackingStarted =
            true;

        setState(
            "SUBJECT_DETECTED"
        );


        clearTimeout(
            trackingTimeout
        );


        trackingTimeout =
            setTimeout(

                () => {

                    if (
                        cam005State.mode !==
                        "WARNING"
                    ) {

                        setState(
                            "TRACKING"
                        );

                    }

                },

                800

            );

    }


    /* MATCH */

    const matchedSubjects =
        matchSubjects(
            detectedFaces
        );


    /* UPDATE STATES */

    const hasWarning =
        updateSubjectStates(
            matchedSubjects
        );


    /* GLOBAL WARNING */

    if (hasWarning) {

        setState(
            "WARNING"
        );

    } else if (
        cam005State.mode ===
        "WARNING"
    ) {

        setState(
            "TRACKING"
        );

    }


    /* DRAW GRID */

    drawSubjects(

        ctx,

        canvas,

        matchedSubjects

    );


    /* DRAW MODAL */

    if (
        window.isCam005ModalOpen
    ) {

        drawSubjects(

            modalCtx,

            modalCanvas,

            matchedSubjects

        );

    }


    requestAnimationFrame(
        detectFace
    );

}


/*====================================
START
====================================*/

createFaceLandmarker();