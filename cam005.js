import {
    FilesetResolver,
    FaceLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";


/*====================================
DOM
====================================*/

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

const cam005Label =
    cam005Monitor.querySelector(".label");

const statusPanel =
    document.getElementById("cam005-status");

const statusTitle =
    statusPanel.querySelector(".status-title");

const statusValue =
    statusPanel.querySelector(".status-value");

const modalCam =
    document.getElementById("modal-cam");

const modalTitle =
    document.getElementById("modal-title");

const modalDescription =
    document.getElementById("modal-description");

const modalFooter =
    document.getElementById("modal-footer");

const modalVideoWrapper =
    document.querySelector(".modal-video-wrapper");


/*====================================
CONFIG
====================================*/

const MAX_SUBJECTS = 3;

const SUBJECT_MATCH_DISTANCE = 0.18;

const SUBJECT_LOST_TIMEOUT = 1000;

const FACE_BOX_PADDING = 10;

const LANDMARK_POINT_RADIUS = 5;


/* Colors */

const SYSTEM_COLOR =
    "#8AFF8A";

const WARNING_COLOR =
    "#FF4A4A";


/* Analysis */

const ANALYSIS_DURATION =
    3000;


/* Score result blink */

const SCORE_BLINK_COUNT =
    5;

const SCORE_BLINK_INTERVAL =
    180;


/* Warning blink */

const WARNING_BLINK_INTERVAL =
    250;


/* Sleep Score */

const WARNING_THRESHOLD =
    60;

const WARNING_PROBABILITY =
    0.5;


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

    trackingStarted: false,

    warning: false

};


/*====================================
SUBJECT STATE
====================================*/

const subjects = [];


/*====================================
UTILITY
====================================*/

function randomInteger(
    min,
    max
) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;

}


/*====================================
SLEEP SCORE
====================================*/

function generateSleepScore() {

    /*
    50% → WARNING
    20 ~ 59

    50% → NORMAL
    60 ~ 95
    */

    const isWarning =
        Math.random() <
        WARNING_PROBABILITY;


    if (isWarning) {

        return randomInteger(
            20,
            59
        );

    }


    return randomInteger(
        60,
        95
    );

}


/*====================================
GLOBAL WARNING UI
====================================*/

function applyGlobalWarning(
    active
) {

    cam005State.warning =
        active;


    if (active) {

        /* CAM005 */

        cam005Monitor.style.borderColor =
            WARNING_COLOR;

        cam005Monitor.style.borderWidth =
            "2px";


        /* CAM005 LABEL */

        cam005Label.style.color =
            WARNING_COLOR;

        cam005Label.style.borderColor =
            WARNING_COLOR;


        /* STATUS PANEL */

        statusPanel.style.color =
            WARNING_COLOR;

        statusPanel.style.borderColor =
            WARNING_COLOR;


        /*
        CAM005 modal only
        */

        if (
            window.isCam005ModalOpen
        ) {

            modalCam.style.color =
                WARNING_COLOR;

            modalTitle.style.color =
                WARNING_COLOR;

            modalDescription.style.color =
                WARNING_COLOR;

            modalFooter.style.color =
                WARNING_COLOR;

            modalVideoWrapper.style.borderColor =
                WARNING_COLOR;

        }

    } else {

        cam005Monitor.style.borderColor =
            "";

        cam005Monitor.style.borderWidth =
            "";

        cam005Label.style.color =
            "";

        cam005Label.style.borderColor =
            "";

        statusPanel.style.color =
            "";

        statusPanel.style.borderColor =
            "";


        if (
            window.isCam005ModalOpen
        ) {

            modalCam.style.color =
                "";

            modalTitle.style.color =
                "";

            modalDescription.style.color =
                "";

            modalFooter.style.color =
                "";

            modalVideoWrapper.style.borderColor =
                "";

        }

    }

}


/*====================================
CAM005 STATUS
====================================*/

function setState(
    mode
) {

    if (
        cam005State.mode ===
        mode
    ) {

        return;

    }


    cam005State.mode =
        mode;


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


        case "ANALYZING":

            statusTitle.textContent =
                "LIVE ANALYSIS";

            statusValue.textContent =
                "ANALYZING";

            break;


        case "TRACKING":

            statusTitle.textContent =
                "STATUS";

            statusValue.textContent =
                "TRACKING";

            break;


        case "WARNING":

            statusTitle.textContent =
                "WARNING";

            statusValue.textContent =
                "LOW SLEEP SCORE";

            break;

    }

}


/*====================================
SUBJECT ID
====================================*/

function getAvailableSubjectId() {

    for (
        let id = 1;
        id <= MAX_SUBJECTS;
        id++
    ) {

        const alreadyUsed =
            subjects.some(
                subject =>
                    subject.id === id
            );


        if (!alreadyUsed) {

            return id;

        }

    }


    return null;

}


/*====================================
CREATE SUBJECT
====================================*/

function createSubject(
    centerX,
    centerY
) {

    const id =
        getAvailableSubjectId();


    if (
        id === null
    ) {

        return null;

    }


    const now =
        performance.now();


    const subject = {

        id,

        centerX,
        centerY,

        analysisStartedAt:
            now,

        sleepScore:
            null,

        analysisComplete:
            false,

        warning:
            false,

        lastSeenAt:
            now

    };


    subjects.push(
        subject
    );


    return subject;

}


/*====================================
REMOVE LOST SUBJECTS
====================================*/

function removeLostSubjects() {

    const now =
        performance.now();


    for (
        let i =
            subjects.length - 1;

        i >= 0;

        i--
    ) {

        const subject =
            subjects[i];


        if (
            now -
            subject.lastSeenAt >
            SUBJECT_LOST_TIMEOUT
        ) {

            subjects.splice(
                i,
                1
            );

        }

    }

}


/*====================================
MATCH SUBJECTS
====================================*/

function matchSubjects(
    faceData
) {

    removeLostSubjects();


    const matchedSubjects = [];

    const availableSubjects = [
        ...subjects
    ];


    /*
    기존 Subject와 현재 얼굴 매칭
    */

    faceData.forEach(face => {

        let closestSubject =
            null;

        let closestDistance =
            SUBJECT_MATCH_DISTANCE;


        availableSubjects.forEach(
            subject => {

                const distance =
                    Math.hypot(

                        face.centerX -
                        subject.centerX,

                        face.centerY -
                        subject.centerY

                    );


                if (
                    distance <
                    closestDistance
                ) {

                    closestDistance =
                        distance;

                    closestSubject =
                        subject;

                }

            }
        );


        if (
            closestSubject
        ) {

            closestSubject.centerX =
                face.centerX;

            closestSubject.centerY =
                face.centerY;

            closestSubject.lastSeenAt =
                performance.now();


            matchedSubjects.push({

                face,

                subject:
                    closestSubject

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


    /*
    새로운 얼굴에 Subject ID 생성
    */

    faceData.forEach(face => {

        const alreadyMatched =
            matchedSubjects.some(
                item =>
                    item.face === face
            );


        if (
            alreadyMatched
        ) {

            return;

        }


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


        if (
            !subject
        ) {

            return;

        }


        matchedSubjects.push({

            face,

            subject

        });

    });


    return matchedSubjects;

}


/*====================================
FACE DATA
====================================*/

function getFaceData(
    landmarks
) {

    let minX = 1;
    let minY = 1;

    let maxX = 0;
    let maxY = 0;


    for (
        const point
        of landmarks
    ) {

        if (
            point.x < minX
        ) {

            minX =
                point.x;

        }


        if (
            point.y < minY
        ) {

            minY =
                point.y;

        }


        if (
            point.x > maxX
        ) {

            maxX =
                point.x;

        }


        if (
            point.y > maxY
        ) {

            maxY =
                point.y;

        }

    }


    return {

        landmarks,

        centerX:
            (
                minX +
                maxX
            ) / 2,

        centerY:
            (
                minY +
                maxY
            ) / 2,

        minX,
        minY,
        maxX,
        maxY

    };

}


/*====================================
UPDATE SUBJECT ANALYSIS
====================================*/

function updateSubjectAnalysis(
    subject
) {

    /*
    분석 완료 후에는
    점수를 다시 계산하지 않는다.
    */

    if (
        subject.analysisComplete
    ) {

        return;

    }


    const elapsed =
        performance.now() -
        subject.analysisStartedAt;


    /*
    3초 분석
    */

    if (
        elapsed <
        ANALYSIS_DURATION
    ) {

        return;

    }


    /*
    결과를 한 번만 생성
    */

    subject.sleepScore =
        generateSleepScore();


    subject.analysisComplete =
        true;


    subject.warning =
        subject.sleepScore <
        WARNING_THRESHOLD;

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
            (
                face.maxX -
                face.minX
            ) *
            canvas.width +
            padding * 2,

        h:
            (
                face.maxY -
                face.minY
            ) *
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
    landmarks,
    color
) {

    context.fillStyle =
        color;


    for (
        const index
        of ANALYSIS_LANDMARK_INDEX
    ) {

        const point =
            landmarks[index];


        if (
            !point
        ) {

            continue;

        }


        /*
        Webcam mirror correction
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

    const faceBox =
        getFaceBox(
            face,
            canvas
        );


    /*
    Webcam mirror correction
    */

    faceBox.x =
        canvas.width -
        faceBox.x -
        faceBox.w;


    /*
    Normal / Warning Color
    */

    const color =
        subject.warning
            ? WARNING_COLOR
            : SYSTEM_COLOR;


    /*
    ====================================
    WARNING BLINK
    ====================================

    WARNING 상태에서는
    Bounding Box + Header + Text만 점멸.

    얼굴 Landmark Points는
    계속 표시한다.
    */

    let showWarningUI =
        true;


    if (
        subject.warning &&
        subject.analysisComplete
    ) {

        const blinkPhase =
            Math.floor(

                performance.now() /
                WARNING_BLINK_INTERVAL

            );


        showWarningUI =
            blinkPhase % 2 === 0;

    }


    context.save();


    /*================================
    UI CONFIG
    ================================*/

    const headerHeight =
        68;

    const headerPaddingX =
        10;

    const subjectFontSize =
        24;

    const scoreFontSize =
        24;

    const boxLineWidth =
        5;


    const headerX =
        faceBox.x;

    const headerY =
        faceBox.y -
        headerHeight;

    const headerWidth =
        faceBox.w;


    /*================================
    LANDMARK POINTS
    ================================

    얼굴 점은 WARNING 점멸과 관계없이
    항상 표시한다.
    ================================*/

    drawLandmarkPoints(

        context,

        canvas,

        face.landmarks,

        color

    );


    /*================================
    BLINKING WARNING UI
    ================================*/

    if (
        showWarningUI
    ) {


        /*================================
        BOUNDING BOX
        ================================*/

        context.strokeStyle =
            color;

        context.lineWidth =
            boxLineWidth;


        context.strokeRect(

            faceBox.x,

            faceBox.y,

            faceBox.w,

            faceBox.h

        );


        /*================================
        HEADER BACKGROUND
        ================================*/

        context.fillStyle =
            color;


        context.fillRect(

            headerX,

            headerY,

            headerWidth,

            headerHeight

        );


        /*================================
        SUBJECT ID
        ================================*/

        const subjectLabel =
            `SUBJECT-${String(
                subject.id
            ).padStart(
                2,
                "0"
            )}`;


        context.fillStyle =
            "#000000";


        context.font =
            `${subjectFontSize}px 'JetBrains Mono', monospace`;


        context.textBaseline =
            "top";


        context.fillText(

            subjectLabel,

            headerX +
            headerPaddingX,

            headerY +
            6

        );


        /*================================
        ANALYSIS / SCORE
        ================================*/

        let scoreLabel;

        let showScore =
            true;


        if (
            !subject.analysisComplete
        ) {

            const elapsed =
                performance.now() -
                subject.analysisStartedAt;


            const progress =
                Math.min(

                    elapsed /
                    ANALYSIS_DURATION,

                    1

                );


            const percent =
                Math.floor(
                    progress *
                    100
                );


            scoreLabel =
                `ANALYZING ${percent}%`;

        } else {

            scoreLabel =
                `SLEEP SCORE: ${subject.sleepScore}`;


            /*
            NORMAL 상태일 때만
            결과 텍스트 5회 점멸.

            WARNING 상태에서는
            Header 전체 점멸을 사용한다.
            */

            if (
                !subject.warning
            ) {

                const timeSinceResult =
                    performance.now() -
                    (
                        subject.analysisStartedAt +
                        ANALYSIS_DURATION
                    );


                const blinkDuration =
                    SCORE_BLINK_COUNT *
                    SCORE_BLINK_INTERVAL *
                    2;


                if (
                    timeSinceResult <
                    blinkDuration
                ) {

                    const blinkPhase =
                        Math.floor(

                            timeSinceResult /
                            SCORE_BLINK_INTERVAL

                        );


                    showScore =
                        blinkPhase % 2 === 0;

                }

            }

        }


        context.font =
            `${scoreFontSize}px 'JetBrains Mono', monospace`;


        if (
            showScore
        ) {

            context.fillText(

                scoreLabel,

                headerX +
                headerPaddingX,

                headerY +
                36

            );

        }

    }


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
GLOBAL STATUS
====================================*/

function updateGlobalStatus(
    matchedSubjects
) {

    /*
    한 명이라도 WARNING이면
    CAM005 전체 WARNING
    */

    const hasWarning =
        matchedSubjects.some(
            item =>
                item.subject
                    .analysisComplete &&
                item.subject
                    .warning
        );


    if (
        hasWarning
    ) {

        setState(
            "WARNING"
        );


        applyGlobalWarning(
            true
        );


        return;

    }


    applyGlobalWarning(
        false
    );


    /*
    아직 분석 중인 Subject 확인
    */

    const isAnalyzing =
        matchedSubjects.some(
            item =>
                !item.subject
                    .analysisComplete
        );


    if (
        isAnalyzing
    ) {

        setState(
            "ANALYZING"
        );

    } else {

        setState(
            "TRACKING"
        );

    }

}


/*====================================
CREATE FACE LANDMARKER
====================================*/

async function createFaceLandmarker() {

    const vision =
        await FilesetResolver
            .forVisionTasks(

                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"

            );


    faceLandmarker =
        await FaceLandmarker
            .createFromOptions(

                vision,

                {

                    baseOptions: {

                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"

                    },

                    runningMode:
                        "VIDEO",

                    numFaces:
                        MAX_SUBJECTS

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

    if (
        !webcam.videoWidth
    ) {

        requestAnimationFrame(
            detectFace
        );

        return;

    }


    /*================================
    CANVAS SIZE
    ================================*/

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


    /*================================
    CLEAR
    ================================*/

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


    /*================================
    FACE DETECTION
    ================================*/

    const result =
        faceLandmarker
            .detectForVideo(

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


    /*================================
    NO SUBJECT
    ================================*/

    if (
        detectedFaces.length ===
        0
    ) {

        cam005State.trackingStarted =
            false;


        removeLostSubjects();


        applyGlobalWarning(
            false
        );


        setState(
            "NO_SUBJECT"
        );


        requestAnimationFrame(
            detectFace
        );


        return;

    }


    /*================================
    FIRST DETECTION
    ================================*/

    if (
        !cam005State
            .trackingStarted
    ) {

        cam005State
            .trackingStarted =
            true;


        setState(
            "SUBJECT_DETECTED"
        );

    }


    /*================================
    MATCH SUBJECTS
    ================================*/

    const matchedSubjects =
        matchSubjects(
            detectedFaces
        );


    /*================================
    ANALYZE
    ================================*/

    matchedSubjects.forEach(
        item => {

            updateSubjectAnalysis(
                item.subject
            );

        }
    );


    /*================================
    GLOBAL STATUS
    ================================*/

    updateGlobalStatus(
        matchedSubjects
    );


    /*================================
    DRAW GRID
    ================================*/

    drawSubjects(

        ctx,

        canvas,

        matchedSubjects

    );


    /*================================
    DRAW MODAL
    ================================*/

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