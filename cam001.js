(() => {

    /*====================================
    CAM001 EEG MONITOR
    ====================================*/

    const cam001Canvas =
        document.getElementById("cam001-canvas");

    const cam001Ctx =
        cam001Canvas.getContext("2d");

    const modalCam001Canvas =
        document.getElementById("modal-cam001-canvas");

    const modalCam001Ctx =
        modalCam001Canvas.getContext("2d");


    /*====================================
    CONFIG
    ====================================*/

    const EEG_CHANNEL_COUNT =
        5;

    const EEG_HISTORY_LENGTH =
        700;

    const EEG_SAMPLE_INTERVAL =
        24;

    const EEG_BG_COLOR =
        "#111111";

    const EEG_LINE_COLOR =
        "rgba(255, 255, 255, 0.68)";

    const EEG_LINE_WIDTH =
        1.4;

    const EEG_AMPLITUDE =
        0.25;


    /*====================================
    CHANNEL DATA
    ====================================*/

    const eegChannels =
        Array.from(
            {
                length:
                    EEG_CHANNEL_COUNT
            },
            (_, index) => ({

                history:
                    [],

                phaseSlow:
                    Math.random() *
                    Math.PI *
                    2,

                phaseMedium:
                    Math.random() *
                    Math.PI *
                    2,

                phaseFast:
                    Math.random() *
                    Math.PI *
                    2,

                slowSpeed:
                    0.035 +
                    Math.random() *
                    0.012,

                mediumSpeed:
                    0.085 +
                    Math.random() *
                    0.025,

                fastSpeed:
                    0.22 +
                    Math.random() *
                    0.06,

                noise:
                    0,

                drift:
                    Math.random() *
                    0.2 -
                    0.1,

                channelOffset:
                    index *
                    0.37

            })
        );


    /*====================================
    UTIL
    ====================================*/

    function clamp(
        value,
        min,
        max
    ) {

        return Math.min(
            Math.max(
                value,
                min
            ),
            max
        );

    }


    /*====================================
    GENERATE EEG SAMPLE
    ====================================*/

    function generateEEGSample(
        channel
    ) {

        /*
        서로 다른 주기의 파형을 합성해
        자연스럽게 이어지는 EEG 신호 생성
        */

        channel.phaseSlow +=
            channel.slowSpeed;

        channel.phaseMedium +=
            channel.mediumSpeed;

        channel.phaseFast +=
            channel.fastSpeed;


        /*
        이전 노이즈 값을 유지하면서
        조금씩 변화시켜 연속성 확보
        */

        channel.noise =
            channel.noise *
            0.84 +
            (
                Math.random() *
                2 -
                1
            ) *
            0.16;


        channel.drift +=
            (
                Math.random() *
                2 -
                1
            ) *
            0.003;


        channel.drift =
            clamp(
                channel.drift,
                -0.18,
                0.18
            );


        const slowWave =
            Math.sin(
                channel.phaseSlow +
                channel.channelOffset
            ) *
            0.58;


        const mediumWave =
            Math.sin(
                channel.phaseMedium
            ) *
            0.22;


        const fastWave =
            Math.sin(
                channel.phaseFast
            ) *
            0.07;


        const noiseWave =
            channel.noise *
            0.20;


        return (
            slowWave +
            mediumWave +
            fastWave +
            noiseWave +
            channel.drift
        );

    }


    /*====================================
    PUSH SAMPLE
    ====================================*/

    function pushEEGSamples() {

        eegChannels.forEach(
            channel => {

                const value =
                    generateEEGSample(
                        channel
                    );


                channel.history.push(
                    value
                );


                if (
                    channel.history.length >
                    EEG_HISTORY_LENGTH
                ) {

                    channel.history.shift();

                }

            }
        );

    }


    /*====================================
    PRE-FILL HISTORY
    ====================================*/

    /*
    처음부터 Canvas 전체에
    파형이 보이도록 데이터 미리 생성
    */

    for (
        let i = 0;
        i < EEG_HISTORY_LENGTH;
        i++
    ) {

        pushEEGSamples();

    }


    /*====================================
    CANVAS RESIZE
    ====================================*/

    function resizeCanvas(
        targetCanvas
    ) {

        const rect =
            targetCanvas.getBoundingClientRect();


        if (
            rect.width <= 0 ||
            rect.height <= 0
        ) {

            return false;

        }


        const dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );


        const width =
            Math.round(
                rect.width *
                dpr
            );


        const height =
            Math.round(
                rect.height *
                dpr
            );


        if (
            targetCanvas.width !== width ||
            targetCanvas.height !== height
        ) {

            targetCanvas.width =
                width;

            targetCanvas.height =
                height;

        }


        return true;

    }


    /*====================================
    DRAW EEG
    ====================================*/

    function drawEEG(
        context,
        targetCanvas
    ) {

        if (
            !resizeCanvas(
                targetCanvas
            )
        ) {

            return;

        }


        const width =
            targetCanvas.width;

        const height =
            targetCanvas.height;


        context.clearRect(
            0,
            0,
            width,
            height
        );


        context.fillStyle =
            EEG_BG_COLOR;


        context.fillRect(
            0,
            0,
            width,
            height
        );


        const rowHeight =
            height /
            EEG_CHANNEL_COUNT;


        eegChannels.forEach(
            (
                channel,
                channelIndex
            ) => {

                const history =
                    channel.history;


                if (
                    history.length <
                    2
                ) {

                    return;

                }


                const baseY =
                    rowHeight *
                    (
                        channelIndex +
                        0.5
                    );


                const amplitude =
                    rowHeight *
                    EEG_AMPLITUDE;


                context.beginPath();


                context.strokeStyle =
                    EEG_LINE_COLOR;


                context.lineWidth =
                    EEG_LINE_WIDTH *
                    Math.min(
                        window.devicePixelRatio || 1,
                        2
                    );


                context.lineJoin =
                    "round";


                context.lineCap =
                    "round";


                for (
                    let i = 0;
                    i < history.length;
                    i++
                ) {

                    const x =
                        (
                            i /
                            (
                                history.length -
                                1
                            )
                        ) *
                        width;


                    const y =
                        baseY -
                        history[i] *
                        amplitude;


                    if (
                        i === 0
                    ) {

                        context.moveTo(
                            x,
                            y
                        );

                    } else {

                        context.lineTo(
                            x,
                            y
                        );

                    }

                }


                context.stroke();

            }
        );

    }


    /*====================================
    ANIMATION
    ====================================*/

    let lastSampleTime =
        performance.now();


    function animateEEG(
        now
    ) {

        /*
        화면 주사율과 독립적으로
        일정한 속도로 데이터 생성
        */

        while (
            now -
            lastSampleTime >=
            EEG_SAMPLE_INTERVAL
        ) {

            pushEEGSamples();

            lastSampleTime +=
                EEG_SAMPLE_INTERVAL;

        }


        /*
        Grid CAM001
        */

        drawEEG(
            cam001Ctx,
            cam001Canvas
        );


        /*
        CAM001 Modal
        */

        if (
            window.isCam001ModalOpen
        ) {

            drawEEG(
                modalCam001Ctx,
                modalCam001Canvas
            );

        }


        requestAnimationFrame(
            animateEEG
        );

    }


    requestAnimationFrame(
        animateEEG
    );

})();