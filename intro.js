/* ===============================
ZZZ INTRO / SESSION CONTROLLER
=============================== */

const introScreen =
    document.getElementById("intro-screen");


/* ===============================
CONFIG
=============================== */

const INACTIVITY_TIMEOUT = 60_000;

const ACTIVITY_THROTTLE = 1_000;


/* ===============================
SESSION STATE
=============================== */

const session = {

    active: false,

    inactivityTimer: null,

    lastActivityReset: 0

};


/* ===============================
ENTER EXPERIENCE
=============================== */

function enterExperience() {

    if (session.active) return;


    session.active = true;


    introScreen.classList.add("hidden");

    if (
        window.ZZZ &&
        typeof window.ZZZ.playGridAmbient === "function"
    ) {

        window.ZZZ.playGridAmbient();

    }


    resetInactivityTimer();

}


/* ===============================
RETURN TO INTRO
=============================== */

function returnToIntro() {

    if (!session.active) return;


    session.active = false;


    clearInactivityTimer();


    /*
    이전 관객이 열어둔 Modal이 있다면
    기존 script.js의 closeModal()을 이용해
    정상적인 방식으로 종료한다.
    */

    if (
        window.ZZZ &&
        typeof window.ZZZ.closeModal === "function"
    ) {

        window.ZZZ.closeModal();

        window.ZZZ.stopGridAmbient()

    }


    /*
    INTRO를 다시 표시한다.
    */

    introScreen.classList.remove("hidden");

}


/* ===============================
INACTIVITY TIMER
=============================== */

function resetInactivityTimer() {

    if (!session.active) return;


    clearInactivityTimer();


    session.inactivityTimer =
        setTimeout(
            returnToIntro,
            INACTIVITY_TIMEOUT
        );

}


/* ===============================
CLEAR TIMER
=============================== */

function clearInactivityTimer() {

    if (!session.inactivityTimer) return;


    clearTimeout(
        session.inactivityTimer
    );


    session.inactivityTimer = null;

}


/* ===============================
POINTER ACTIVITY
=============================== */

function handlePointerMove() {

    if (!session.active) return;


    const now =
        Date.now();


    /*
    pointermove는 매우 자주 발생하므로
    1초에 한 번만 inactivity timer를 갱신한다.
    */

    if (
        now - session.lastActivityReset
        < ACTIVITY_THROTTLE
    ) {

        return;

    }


    session.lastActivityReset = now;


    resetInactivityTimer();

}


/* ===============================
POINTER DOWN
=============================== */

function handlePointerDown() {

    /*
    INTRO 상태라면
    클릭 / 터치로 Experience 진입.
    */

    if (!session.active) {

        enterExperience();

        return;

    }


    /*
    Experience 상태에서는
    사용자 활동으로 처리.
    */

    resetInactivityTimer();

}


/* ===============================
KEYBOARD
=============================== */

function handleKeyDown(event) {

    /*
    INTRO 상태라면
    아무 키 입력으로 Experience 진입.
    */

    if (!session.active) {

        event.preventDefault();

        enterExperience();

        return;

    }


    /*
    Experience 상태에서는
    기존 CAM / Modal keyboard event를
    방해하지 않고 inactivity만 갱신한다.
    */

    resetInactivityTimer();

}


/* ===============================
EVENT LISTENERS
=============================== */

window.addEventListener(
    "pointermove",
    handlePointerMove,
    { passive: true }
);


window.addEventListener(
    "pointerdown",
    handlePointerDown,
    { passive: true }
);


window.addEventListener(
    "keydown",
    handleKeyDown
);


/* ===============================
INITIAL STATE
=============================== */

session.active = false;

clearInactivityTimer();

introScreen.classList.remove("hidden");