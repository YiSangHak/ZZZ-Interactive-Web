const monitors =
    document.querySelectorAll(".monitor");

const cursorUI =
    document.getElementById("cursor-ui");

const ring =
    document.querySelector(".ring");

const progressText =
    document.getElementById("progress-text");

const infoPanel =
    document.getElementById("info-panel");

const crosshair =
    document.getElementById("crosshair");

const infoDescription =
    document.getElementById("info-description");

let typingTimeout;


/*====================================
MODAL DOM
====================================*/

const modal =
    document.getElementById("video-modal");

const modalVideo =
    document.getElementById("modal-video");


const modalCam001Canvas =
    document.getElementById(
        "modal-cam001-canvas"
    );


const modalCam007Screen =
    document.getElementById(
        "modal-cam007-screen"
    );


const modalCam008Canvas =
    document.getElementById(
        "modal-cam008-canvas"
    );


const modalCam009Terminal =
    document.getElementById(
        "modal-cam009-terminal"
    );


const modalTrackingCanvas =
    document.getElementById(
        "modal-tracking-canvas"
    );


const modalCam =
    document.getElementById(
        "modal-cam"
    );


const modalTitle =
    document.getElementById(
        "modal-title"
    );


const modalDescription =
    document.getElementById(
        "modal-description"
    );


let isModalOpen =
    false;


/*====================================
CAM MODAL STATE
====================================*/

window.isCam001ModalOpen =
    false;

window.isCam005ModalOpen =
    false;

window.isCam007ModalOpen =
    false;

window.isCam008ModalOpen =
    false;

window.isCam009ModalOpen =
    false;


/*====================================
CURSOR CONFIG
====================================*/

const circumference =
    parseFloat(
        getComputedStyle(
            document.documentElement
        )
            .getPropertyValue(
                "--ring-length"
            )
    );


const root =
    getComputedStyle(
        document.documentElement
    );


const cursorOffset =
    parseFloat(
        root.getPropertyValue(
            "--cursor-offset"
        )
    );


let progress =
    0;

let animation;

let scanStartTime =
    0;

const scanDuration =
    1000;


/*====================================
MONITOR EVENTS
====================================*/

monitors.forEach(
    monitor => {

        monitor.addEventListener(
            "mouseenter",
            () => {

                if (
                    isModalOpen
                ) {

                    return;

                }


                progress =
                    0;


                progressText.textContent =
                    0;


                scanStartTime =
                    performance.now();


                ring.style.strokeDashoffset =
                    circumference;


                cursorUI.style.display =
                    "block";


                cancelAnimationFrame(
                    animation
                );


                animate(
                    monitor
                );

            }
        );


        monitor.addEventListener(
            "mouseleave",
            () => {

                if (
                    isModalOpen
                ) {

                    return;

                }


                cursorUI.style.display =
                    "none";


                progress =
                    0;


                progressText.textContent =
                    0;


                infoPanel.classList.remove(
                    "show"
                );


                clearTimeout(
                    typingTimeout
                );


                infoDescription.innerHTML =
                    "";


                cancelAnimationFrame(
                    animation
                );

            }
        );


        monitor.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                if (
                    isModalOpen
                ) {

                    return;

                }


                openModal(
                    monitor
                );

            }
        );

    }
);


/*====================================
MOUSE
====================================*/

document.addEventListener(
    "mousemove",
    event => {

        crosshair.style.left =
            event.clientX +
            "px";


        crosshair.style.top =
            event.clientY +
            "px";


        if (
            isModalOpen
        ) {

            return;

        }


        cursorUI.style.left =
            (
                event.clientX +
                cursorOffset
            ) +
            "px";


        cursorUI.style.top =
            (
                event.clientY +
                cursorOffset
            ) +
            "px";


        infoPanel.style.left =
            (
                event.clientX +
                cursorOffset
            ) +
            "px";


        infoPanel.style.top =
            (
                event.clientY +
                cursorOffset
            ) +
            "px";

    }
);


/*====================================
SCAN
====================================*/

function animate(
    monitor
) {

    const elapsed =
        performance.now() -
        scanStartTime;


    progress =
        (
            elapsed /
            scanDuration
        ) *
        100;


    if (
        progress >
        100
    ) {

        progress =
            100;

    }


    progressText.textContent =
        `${Math.floor(
            progress
        )}%`;


    const offset =
        circumference -
        (
            progress /
            100
        ) *
        circumference;


    ring.style.strokeDashoffset =
        offset;


    if (
        progress <
        100
    ) {

        animation =
            requestAnimationFrame(
                () =>
                    animate(
                        monitor
                    )
            );

    } else {

        progressText.textContent =
            "100%";


        showInfoPanel(
            monitor
        );

    }

}


/*====================================
INFO PANEL
====================================*/

function showInfoPanel(
    monitor
) {

    cursorUI.style.display =
        "none";


    const id =
        monitor.dataset.id;


    const title =
        monitor.dataset.title;


    const description =
        monitor.dataset.description;


    document
        .getElementById(
            "info-cam"
        )
        .textContent =
        id;


    document
        .getElementById(
            "info-title"
        )
        .textContent =
        title;


    infoPanel.classList.add(
        "show"
    );


    typeDescription(
        description
    );

}


/*====================================
TYPE DESCRIPTION
====================================*/

function typeDescription(
    text
) {

    clearTimeout(
        typingTimeout
    );


    let index =
        0;


    infoDescription.innerHTML =
        '<span class="cursor">█</span>';


    function type() {

        if (
            index <
            text.length
        ) {

            infoDescription.innerHTML =
                text.slice(
                    0,
                    index + 1
                ) +
                '<span class="cursor">█</span>';


            index++;


            typingTimeout =
                setTimeout(
                    type,
                    35
                );

        }

    }


    type();

}


/*====================================
RESET MODAL MEDIA
====================================*/

function resetModalMedia() {

    /* CAM STATE */

    window.isCam001ModalOpen =
        false;

    window.isCam005ModalOpen =
        false;

    window.isCam007ModalOpen =
        false;

    window.isCam008ModalOpen =
        false;

    window.isCam009ModalOpen =
        false;


    /* VIDEO */

    modalVideo.pause();


    modalVideo.srcObject =
        null;


    modalVideo.removeAttribute(
        "src"
    );


    modalVideo.load();


    modalVideo.classList.remove(
        "mirror"
    );


    modalVideo.classList.remove(
        "cam005-feed"
    );


    modalVideo.style.display =
        "none";


    /* CAM001 */

    modalCam001Canvas.style.display =
        "none";


    /* CAM007 */

    modalCam007Screen.style.display =
        "none";


    /* CAM008 */

    modalCam008Canvas.style.display =
        "none";


    /* CAM009 */

    modalCam009Terminal.style.display =
        "none";


    /* CAM005 */

    modalTrackingCanvas.style.display =
        "none";

}


/*====================================
OPEN MODAL
====================================*/

function openModal(
    monitor
) {

    isModalOpen =
        true;


    cancelAnimationFrame(
        animation
    );


    clearTimeout(
        typingTimeout
    );


    cursorUI.style.display =
        "none";


    infoPanel.classList.remove(
        "show"
    );


    resetModalMedia();


    /*================================
    CAM001
    ================================*/

    if (
        monitor.id ===
        "cam001"
    ) {

        window.isCam001ModalOpen =
            true;


        modalCam001Canvas.style.display =
            "block";

    }


    /*================================
    CAM007
    ================================*/

    else if (
        monitor.id ===
        "cam007"
    ) {

        window.isCam007ModalOpen =
            true;


        modalCam007Screen.style.display =
            "flex";

    }


    /*================================
    CAM008
    ================================*/

    else if (
        monitor.id ===
        "cam008"
    ) {

        window.isCam008ModalOpen =
            true;


        modalCam008Canvas.style.display =
            "block";

    }


    /*================================
    CAM009
    ================================*/

    else if (
        monitor.id ===
        "cam009"
    ) {

        window.isCam009ModalOpen =
            true;


        modalCam009Terminal.style.display =
            "block";


        modalCam009Terminal.scrollTop =
            modalCam009Terminal.scrollHeight;

    }


    /*================================
    CAM005
    ================================*/

    else if (
        monitor.id ===
        "cam005"
    ) {

        window.isCam005ModalOpen =
            true;


        const monitorVideo =
            monitor.querySelector(
                "video"
            );


        modalVideo.style.display =
            "block";


        modalTrackingCanvas.style.display =
            "block";


        modalVideo.classList.add(
            "mirror"
        );


        modalVideo.classList.add(
            "cam005-feed"
        );


        modalVideo.srcObject =
            monitorVideo.srcObject;


        modalVideo.play()
            .catch(
                () => { }
            );

    }


    /*================================
    NORMAL VIDEO
    ================================*/

    else {

        const sourceElement =
            monitor.querySelector(
                "source"
            );


        if (
            sourceElement
        ) {

            modalVideo.style.display =
                "block";


            modalVideo.src =
                sourceElement.src;


            modalVideo.play()
                .catch(
                    () => { }
                );

        }

    }


    /*================================
    MODAL TEXT
    ================================*/

    modalCam.textContent =
        monitor.dataset.id;


    modalTitle.textContent =
        monitor.dataset.title;


    modalDescription.textContent =
        monitor.dataset.description;


    modal.classList.add(
        "show"
    );


    document.body.classList.add(
        "modal-open"
    );

}


/*====================================
CLOSE MODAL
====================================*/

function closeModal() {

    modal.classList.remove(
        "show"
    );


    document.body.classList.remove(
        "modal-open"
    );


    resetModalMedia();


    isModalOpen =
        false;

}


/*====================================
MODAL EVENTS
====================================*/

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeModal();

        }

    }
);


modal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            modal
        ) {

            closeModal();

        }

    }
);


/*====================================
CAM005 WEBCAM
====================================*/

const webcam =
    document.getElementById(
        "webcam"
    );


async function startWebcam() {

    try {

        const stream =
            await navigator
                .mediaDevices
                .getUserMedia({

                    video: {

                        facingMode:
                            "user",

                        width: {
                            ideal:
                                1280
                        },

                        height: {
                            ideal:
                                720
                        },

                        aspectRatio:
                            16 / 9

                    },

                    audio:
                        false

                });


        webcam.srcObject =
            stream;

    }


    catch (
    error
    ) {

        console.error(
            error
        );

    }

}


startWebcam();