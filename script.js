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

const modal =
    document.getElementById("video-modal");

const modalVideo =
    document.getElementById("modal-video");

const modalCam =
    document.getElementById("modal-cam");

const modalTitle =
    document.getElementById("modal-title");

const modalDescription =
    document.getElementById("modal-description");


let isModalOpen = false;

window.isCam005ModalOpen = false;


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


let progress = 0;

let animation;

let scanStartTime = 0;

const scanDuration = 1000;


/*====================================
MONITOR EVENTS
====================================*/

monitors.forEach(monitor => {

    monitor.addEventListener(
        "mouseenter",
        () => {

            if (isModalOpen) return;

            progress = 0;

            progressText.textContent = 0;

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

            if (isModalOpen) return;

            cursorUI.style.display =
                "none";

            progress = 0;

            progressText.textContent = 0;

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
        e => {

            e.stopPropagation();

            if (isModalOpen) return;

            openModal(
                monitor
            );

        }
    );

});


/*====================================
MOUSE
====================================*/

document.addEventListener(
    "mousemove",
    e => {

        crosshair.style.left =
            e.clientX + "px";

        crosshair.style.top =
            e.clientY + "px";


        if (isModalOpen) return;


        cursorUI.style.left =
            (
                e.clientX +
                cursorOffset
            ) + "px";


        cursorUI.style.top =
            (
                e.clientY +
                cursorOffset
            ) + "px";


        infoPanel.style.left =
            (
                e.clientX +
                cursorOffset
            ) + "px";


        infoPanel.style.top =
            (
                e.clientY +
                cursorOffset
            ) + "px";

    }
);


/*====================================
SCAN
====================================*/

function animate(monitor) {

    const elapsed =
        performance.now() -
        scanStartTime;


    progress =
        (
            elapsed /
            scanDuration
        ) * 100;


    if (progress > 100) {
        progress = 100;
    }


    progressText.textContent =
        `${Math.floor(progress)}%`;


    const offset =
        circumference -
        (
            progress /
            100
        ) *
        circumference;


    ring.style.strokeDashoffset =
        offset;


    if (progress < 100) {

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

function showInfoPanel(monitor) {

    cursorUI.style.display =
        "none";


    const id =
        monitor.dataset.id;

    const title =
        monitor.dataset.title;

    const description =
        monitor.dataset.description;


    document
        .getElementById("info-cam")
        .textContent =
        id;


    document
        .getElementById("info-title")
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

function typeDescription(text) {

    clearTimeout(
        typingTimeout
    );


    let index = 0;


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
OPEN MODAL
====================================*/

function openModal(monitor) {

    isModalOpen = true;


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


    window.isCam005ModalOpen =
        monitor.id === "cam005";


    const monitorVideo =
        monitor.querySelector(
            "video"
        );


    const sourceElement =
        monitor.querySelector(
            "source"
        );


    /*
    ================================
    NORMAL CAM
    ================================
    */

    if (sourceElement) {

        modalVideo.classList.remove(
            "mirror"
        );

        modalVideo.classList.remove(
            "cam005-feed"
        );


        modalVideo.srcObject =
            null;


        modalVideo.src =
            sourceElement.src;

    }


    /*
    ================================
    CAM005
    ================================
    */

    else {

        modalVideo.classList.add(
            "mirror"
        );

        modalVideo.classList.add(
            "cam005-feed"
        );


        modalVideo.removeAttribute(
            "src"
        );


        modalVideo.srcObject =
            monitorVideo.srcObject;

    }


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


    modalVideo.classList.remove(
        "mirror"
    );


    modalVideo.classList.remove(
        "cam005-feed"
    );


    modalVideo.pause();


    modalVideo.srcObject =
        null;


    modalVideo.removeAttribute(
        "src"
    );


    modalVideo.load();


    isModalOpen = false;


    window.isCam005ModalOpen =
        false;

}


/*====================================
MODAL EVENTS
====================================*/

document.addEventListener(
    "keydown",
    e => {

        if (
            e.key === "Escape"
        ) {

            closeModal();

        }

    }
);


modal.addEventListener(
    "click",
    e => {

        if (
            e.target === modal
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
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        },

                        aspectRatio:
                            16 / 9

                    },

                    audio: false

                });


        webcam.srcObject =
            stream;

    }


    catch (err) {

        console.error(
            err
        );

    }

}


startWebcam();