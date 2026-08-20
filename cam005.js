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

const statusTitle =
    document.querySelector("#cam005-status .status-title");

const statusValue =
    document.querySelector("#cam005-status .status-value");


/*====================================
CAM005 CONFIG
====================================*/

const MAX_SUBJECTS = 3;

const SUBJECT_MATCH_DISTANCE = 0.18;

const FACE_BOX_PADDING = 10;

const SYSTEM_COLOR = "#8AFF8A";

const LANDMARK_POINT_RADIUS = 4;


/*====================================
LANDMARK POINTS
====================================*/

const ANALYSIS_LANDMARK_INDEX = [

    /* LEFT EYEBROW */
    70, 63, 105, 66, 107,

    /* RIGHT EYEBROW */
    336, 296, 334, 293, 300,

    /* LEFT EYE */
    33, 160, 158, 133, 153, 144,

    /* RIGHT EYE */
    362, 385, 387, 263, 373, 380,

    /* NOSE */
    168, 6, 197, 195, 4, 1, 2, 98, 327,

    /* MOUTH */
    61, 40, 37, 0, 267, 270, 291,
    321, 314, 17, 84, 91

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

    trackingStarted: false

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


    switch (mode) {

        case "NO_SUBJECT":

            statusTitle.textContent =
                "SIGNAL LOST";

            statusValue.textContent =
                "NO SUBJECT";

            break;


        case "SUBJECT_DETECTED":

            statusTitle.textContent =
                "SUBJECT";

            statusValue.textContent =
                "DETECTED";

            break;


        case "TRACKING":

            statusTitle.textContent =
                "STATUS";

            statusValue.textContent =
                "TRACKING";

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

        centerY: centerY

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

        if (
            subjects.length >=
            MAX_SUBJECTS
        ) {

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
DRAW LANDMARK POINTS
====================================*/

function drawLandmarkPoints(
    context,
    canvas,
    landmarks
) {

    context.fillStyle =
        SYSTEM_COLOR;


    for (
        const index
        of ANALYSIS_LANDMARK_INDEX
    ) {

        const point =
            landmarks[index];


        if (!point) continue;


        /*
        웹캠 영상이 mirror 상태이므로
        X 좌표만 반전
        */

        const x =
            canvas.width -
            point.x *
            canvas.width;

        const y =
            point.y *
            canvas.height;


        context.beginPath();


        context.arc(

            x,

            y,

            LANDMARK_POINT_RADIUS,

            0,

            Math.PI * 2

        );


        context.fill();

    }

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

    /*
    ================================
    FACE BOUNDING BOX
    ================================
    */

    const faceBox =
        getFaceBox(
            face,
            canvas
        );


    /*
    웹캠 영상이 mirror 상태이므로
    Bounding Box의 X 좌표만 반전
    */

    faceBox.x =
        canvas.width -
        faceBox.x -
        faceBox.w;


    context.save();


    /*
    ================================
    BOUNDING BOX
    ================================
    */

    context.strokeStyle =
        SYSTEM_COLOR;

    context.lineWidth = 2;


    context.strokeRect(

        faceBox.x,

        faceBox.y,

        faceBox.w,

        faceBox.h

    );


    /*
    ================================
    FACIAL LANDMARK POINTS
    ================================
    */

    drawLandmarkPoints(

        context,

        canvas,

        face.landmarks

    );


    /*
    ================================
    SUBJECT LABEL
    ================================
    */

    const label =
        `SUBJECT-${String(
            subject.id
        ).padStart(2, "0")}`;


    context.fillStyle =
        SYSTEM_COLOR;


    context.font =
        "13px 'JetBrains Mono', monospace";


    context.textBaseline =
        "bottom";


    context.fillText(

        label,

        faceBox.x,

        faceBox.y - 8

    );


    context.restore();

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


    /*
    ================================
    CANVAS SIZE
    ================================
    */

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


    /*
    ================================
    CLEAR
    ================================
    */

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


    /*
    ================================
    DETECT
    ================================
    */

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


    /*
    ================================
    NO SUBJECT
    ================================
    */

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


    /*
    ================================
    SUBJECT DETECTED
    ================================
    */

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

                    setState(
                        "TRACKING"
                    );

                },

                800

            );

    }


    /*
    ================================
    MATCH SUBJECTS
    ================================
    */

    const matchedSubjects =
        matchSubjects(
            detectedFaces
        );


    /*
    ================================
    DRAW GRID
    ================================
    */

    drawSubjects(

        ctx,

        canvas,

        matchedSubjects

    );


    /*
    ================================
    DRAW MODAL
    ================================
    */

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