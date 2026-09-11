(() => {

    /*====================================
    CAM008 SHEEP COUNTING SIMULATION
    ====================================*/

    const gridCanvas =
        document.getElementById("cam008-canvas");

    const gridCtx =
        gridCanvas.getContext("2d");

    const modalCanvas =
        document.getElementById("modal-cam008-canvas");

    const modalCtx =
        modalCanvas.getContext("2d");


    /*====================================
    ASSETS
    ====================================*/

    const sheepImage =
        new Image();

    sheepImage.src =
        "assets/images/cam008-sheep.png";


    const fenceImage =
        new Image();

    fenceImage.src =
        "assets/images/cam008-fence.png";

    const gameAudio =
        new Audio(
            "assets/audio/CAM-008-audio.mp3"
        );


    gameAudio.loop =
        true;


    gameAudio.volume =
        0.15;



    const gameOverAudio =
        new Audio(
            "assets/audio/CAM-008-gameover.wav"
        );


    gameOverAudio.volume =
        0.6;

    const jumpAudio =
        new Audio(
            "assets/audio/CAM-008-jump.wav"
        );

    jumpAudio.volume =
        0.4;

        

    function playGameAudio() {

        gameAudio.pause();

        gameAudio.currentTime =
            0;


        gameAudio.play()
            .catch(
                () => { }
            );

    }


    function stopGameAudio() {

        gameAudio.pause();

        gameAudio.currentTime =
            0;

    }


    function stopGameOverAudio() {

        gameOverAudio.pause();

        gameOverAudio.currentTime =
            0;

    }


    /*====================================
    COLORS
    ====================================*/

    const COLOR_BG =
        "#111111";

    const COLOR_SYSTEM =
        "#8AFF8A";

    const COLOR_WARNING =
        "#FF4A4A";

    const COLOR_TEXT =
        "rgba(138, 255, 138, .70)";

    const COLOR_GROUND =
        "rgba(138, 255, 138, .55)";


    /*====================================
    VISUAL CONFIG
    ====================================*/

    const SHEEP_BASE_HEIGHT =
        56;

    const FENCE_BASE_HEIGHT =
        38;


    /*====================================
    SPEED CONFIG
    ====================================*/

    /*
    GRID:
    항상 이 속도로 고정
    */

    const GRID_SPEED =
        400;


    /*
    MODAL:
    시작 속도
    */

    const GAME_BASE_SPEED =
        300;


    /*
    울타리 하나를 넘을 때마다
    2.5%씩 속도 증가
    */

    const SPEED_INCREASE_PER_COUNT =
        0.025;


    /*
    최대 속도 제한

    300 × 1.85
    ≈ 555
    */

    const MAX_SPEED_MULTIPLIER =
        1.85;


    /*====================================
    JUMP CONFIG
    ====================================*/

    const GRAVITY =
        1550;

    const JUMP_POWER =
        560;


    /*
    GRID 자동 점프 시작 거리
    */

    const AUTO_JUMP_DISTANCE =
        175;


    /*====================================
    GRID DEMO STATE
    ====================================*/

    const demo = {

        initialized:
            false,

        internalCount:
            0,

        sheepY:
            0,

        velocityY:
            0,

        grounded:
            true,

        fenceX:
            0,

        counted:
            false,

        autoJumped:
            false,

        time:
            0

    };


    /*====================================
    MODAL GAME STATE
    ====================================*/

    const game = {

        mode:
            "READY",

        count:
            0,

        sheepY:
            0,

        velocityY:
            0,

        grounded:
            true,

        fenceX:
            0,

        counted:
            false,

        time:
            0

    };


    let wasModalOpen =
        false;


    let modalWidth =
        800;

    let modalHeight =
        450;


    /*====================================
    UTILITIES
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


    function randomRange(
        min,
        max
    ) {

        return (
            min +
            Math.random() *
            (
                max -
                min
            )
        );

    }


    /*====================================
    IMAGE RATIO
    ====================================*/

    function getImageRatio(
        image,
        fallbackRatio
    ) {

        if (
            image.naturalWidth &&
            image.naturalHeight
        ) {

            return (
                image.naturalWidth /
                image.naturalHeight
            );

        }


        return fallbackRatio;

    }


    /*====================================
    CANVAS PREP
    ====================================*/

    function prepareCanvas(
        canvas,
        context
    ) {

        const rect =
            canvas.getBoundingClientRect();


        if (
            rect.width <= 0 ||
            rect.height <= 0
        ) {

            return null;

        }


        const dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );


        const pixelWidth =
            Math.round(
                rect.width *
                dpr
            );


        const pixelHeight =
            Math.round(
                rect.height *
                dpr
            );


        if (
            canvas.width !==
            pixelWidth ||
            canvas.height !==
            pixelHeight
        ) {

            canvas.width =
                pixelWidth;

            canvas.height =
                pixelHeight;

        }


        context.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );


        /*
        Pixel Art 선명하게 유지
        */

        context.imageSmoothingEnabled =
            false;


        return {

            width:
                rect.width,

            height:
                rect.height

        };

    }


    /*====================================
    WORLD METRICS
    ====================================*/

    function getMetrics(
        width,
        height
    ) {

        const scale =
            clamp(
                height / 300,
                0.72,
                1.55
            );


        /* SHEEP */

        const sheepHeight =
            SHEEP_BASE_HEIGHT *
            scale;


        const sheepRatio =
            getImageRatio(
                sheepImage,
                1.35
            );


        const sheepWidth =
            sheepHeight *
            sheepRatio;


        /* FENCE */

        const fenceHeight =
            FENCE_BASE_HEIGHT *
            scale;


        const fenceRatio =
            getImageRatio(
                fenceImage,
                0.75
            );


        const fenceWidth =
            fenceHeight *
            fenceRatio;


        /* WORLD */

        const groundY =
            height *
            0.78;


        const sheepX =
            width *
            0.20;


        return {

            scale,

            sheepWidth,

            sheepHeight,

            fenceWidth,

            fenceHeight,

            groundY,

            sheepX

        };

    }


    /*====================================
    MODAL SPEED
    ====================================*/

    function getGameSpeedMultiplier(
        count
    ) {

        return clamp(

            1 +
            count *
            SPEED_INCREASE_PER_COUNT,

            1,

            MAX_SPEED_MULTIPLIER

        );

    }


    /*====================================
    RESET FENCE
    ====================================*/

    function resetFence(
        state,
        width,
        scale
    ) {

        state.fenceX =
            width +
            randomRange(
                100,
                220
            ) *
            scale;


        state.counted =
            false;


        /*
        GRID DEMO만
        새로운 Fence마다
        자동 점프 가능 상태로 초기화
        */

        if (
            Object.prototype
                .hasOwnProperty.call(
                    state,
                    "autoJumped"
                )
        ) {

            state.autoJumped =
                false;

        }

    }


    /*====================================
    JUMP
    ====================================*/

    function jump(
        state,
        scale
    ) {

        if (
            !state.grounded
        ) {

            return;

        }


        state.velocityY =
            -JUMP_POWER *
            scale;


        state.grounded =
            false;


        /*
        MODAL GAME에서만
        JUMP 효과음 재생
        */

        if (
            state === game
        ) {

            jumpAudio.currentTime =
                0;


            jumpAudio.play()
                .catch(
                    () => { }
                );

        }

    }


    /*====================================
    INIT GRID DEMO
    ====================================*/

    function initializeDemo(
        width,
        height
    ) {

        const metrics =
            getMetrics(
                width,
                height
            );


        demo.internalCount =
            0;


        demo.velocityY =
            0;


        demo.grounded =
            true;


        demo.sheepY =
            metrics.groundY -
            metrics.sheepHeight;


        demo.time =
            0;


        demo.autoJumped =
            false;


        resetFence(
            demo,
            width,
            metrics.scale
        );


        demo.initialized =
            true;

    }


    /*====================================
    RESET MODAL GAME
    ====================================*/

    function resetGame(
        width,
        height,
        mode = "READY"
    ) {

        const metrics =
            getMetrics(
                width,
                height
            );


        game.mode =
            mode;


        game.count =
            0;


        game.velocityY =
            0;


        game.grounded =
            true;


        game.sheepY =
            metrics.groundY -
            metrics.sheepHeight;


        game.time =
            0;


        resetFence(
            game,
            width,
            metrics.scale
        );

    }


    /*====================================
    JUMP PHYSICS
    ====================================*/

    function updateJumpPhysics(
        state,
        metrics,
        dt
    ) {

        const floorY =
            metrics.groundY -
            metrics.sheepHeight;


        if (
            state.grounded
        ) {

            state.sheepY =
                floorY;

            return;

        }


        state.velocityY +=
            GRAVITY *
            metrics.scale *
            dt;


        state.sheepY +=
            state.velocityY *
            dt;


        if (
            state.sheepY >=
            floorY
        ) {

            state.sheepY =
                floorY;


            state.velocityY =
                0;


            state.grounded =
                true;

        }

    }


    /*====================================
    COLLISION
    ====================================*/

    function isColliding(
        state,
        metrics
    ) {

        /*
        실제 PNG보다 조금 작은 Hitbox
        */

        const sheepBox = {

            x:
                metrics.sheepX +
                metrics.sheepWidth *
                0.12,

            y:
                state.sheepY +
                metrics.sheepHeight *
                0.12,

            width:
                metrics.sheepWidth *
                0.76,

            height:
                metrics.sheepHeight *
                0.78

        };


        const fenceBox = {

            x:
                state.fenceX +
                metrics.fenceWidth *
                0.15,

            y:
                metrics.groundY -
                metrics.fenceHeight +
                metrics.fenceHeight *
                0.05,

            width:
                metrics.fenceWidth *
                0.70,

            height:
                metrics.fenceHeight *
                0.95

        };


        return (

            sheepBox.x <
            fenceBox.x +
            fenceBox.width &&

            sheepBox.x +
            sheepBox.width >
            fenceBox.x &&

            sheepBox.y <
            fenceBox.y +
            fenceBox.height &&

            sheepBox.y +
            sheepBox.height >
            fenceBox.y

        );

    }


    /*====================================
    UPDATE GRID DEMO
    ====================================*/

    function updateDemo(
        width,
        height,
        dt
    ) {

        const metrics =
            getMetrics(
                width,
                height
            );


        if (
            !demo.initialized
        ) {

            initializeDemo(
                width,
                height
            );

        }


        demo.time +=
            dt;


        /*
        GRID에서는 항상
        GRID_SPEED 고정.
        절대 빨라지지 않는다.
        */

        demo.fenceX -=
            GRID_SPEED *
            metrics.scale *
            dt;


        /*
        Fence 하나당
        정확히 한 번만 자동 점프
        */

        const jumpPoint =
            metrics.sheepX +
            AUTO_JUMP_DISTANCE *
            metrics.scale;


        if (
            !demo.autoJumped &&
            demo.grounded &&
            demo.fenceX <=
            jumpPoint &&
            demo.fenceX >
            metrics.sheepX
        ) {

            jump(
                demo,
                metrics.scale
            );


            demo.autoJumped =
                true;

        }


        updateJumpPhysics(
            demo,
            metrics,
            dt
        );


        /*
        내부 카운트는 다음 Fence 상태 관리에만 사용.
        화면에는 표시하지 않는다.
        */

        if (
            !demo.counted &&
            demo.fenceX +
            metrics.fenceWidth <
            metrics.sheepX
        ) {

            demo.internalCount++;

            demo.counted =
                true;

        }


        /*
        Fence가 화면 밖으로 나가면
        새로운 Fence 생성
        */

        if (
            demo.fenceX +
            metrics.fenceWidth <
            0
        ) {

            resetFence(
                demo,
                width,
                metrics.scale
            );

        }

    }


    /*====================================
    UPDATE MODAL GAME
    ====================================*/

    function updateGame(
        width,
        height,
        dt
    ) {

        if (
            game.mode !==
            "PLAYING"
        ) {

            return;

        }


        const metrics =
            getMetrics(
                width,
                height
            );


        game.time +=
            dt;


        /*
        MODAL은 COUNT가 올라갈수록
        Chrome Dino처럼 점차 빨라진다.
        */

        const speedMultiplier =
            getGameSpeedMultiplier(
                game.count
            );


        game.fenceX -=
            GAME_BASE_SPEED *
            metrics.scale *
            speedMultiplier *
            dt;


        updateJumpPhysics(
            game,
            metrics,
            dt
        );


        /*
        충돌
        */

        if (
            isColliding(
                game,
                metrics
            )
        ) {

            game.mode =
                "GAME_OVER";


            stopGameAudio();


            gameOverAudio.currentTime =
                0;


            gameOverAudio.play()
                .catch(
                    () => { }
                );


            return;

        }


        /*
        Fence 통과 성공
        */

        if (
            !game.counted &&
            game.fenceX +
            metrics.fenceWidth <
            metrics.sheepX
        ) {

            game.count++;

            game.counted =
                true;

        }


        /*
        다음 Fence
        */

        if (
            game.fenceX +
            metrics.fenceWidth <
            0
        ) {

            resetFence(
                game,
                width,
                metrics.scale
            );

        }

    }


    /*====================================
    DRAW SCENE
    ====================================*/

    function drawScene(
        context,
        width,
        height,
        state,
        showCount
    ) {

        const metrics =
            getMetrics(
                width,
                height
            );


        /*================================
        BACKGROUND
        ================================*/

        context.fillStyle =
            COLOR_BG;


        context.fillRect(
            0,
            0,
            width,
            height
        );


        /*================================
        COUNT
        ================================*/

        /*
        GRID = false
        MODAL = true
        */

        if (
            showCount
        ) {

            context.fillStyle =
                COLOR_SYSTEM;


            context.font =
                `500 ${Math.round(
                    17 *
                    metrics.scale
                )}px 'JetBrains Mono', monospace`;


            context.textBaseline =
                "top";


            context.fillText(

                `COUNT: ${String(
                    state.count
                ).padStart(
                    3,
                    "0"
                )}`,

                20 *
                metrics.scale,

                20 *
                metrics.scale

            );

        }


        /*================================
        GROUND
        ================================*/

        context.strokeStyle =
            COLOR_GROUND;


        context.lineWidth =
            Math.max(
                1,
                metrics.scale
            );


        context.beginPath();


        context.moveTo(
            0,
            metrics.groundY
        );


        context.lineTo(
            width,
            metrics.groundY
        );


        context.stroke();


        /*================================
        SHEEP BOB
        ================================*/

        let bob =
            0;


        if (
            state.grounded
        ) {

            bob =
                Math.sin(
                    state.time *
                    14
                ) *
                1.5 *
                metrics.scale;

        }


        /*================================
        SHEEP
        ================================*/

        if (
            sheepImage.complete &&
            sheepImage.naturalWidth
        ) {

            context.drawImage(

                sheepImage,

                metrics.sheepX,

                state.sheepY +
                bob,

                metrics.sheepWidth,

                metrics.sheepHeight

            );

        }


        /*================================
        FENCE
        ================================*/

        if (
            fenceImage.complete &&
            fenceImage.naturalWidth
        ) {

            context.drawImage(

                fenceImage,

                state.fenceX,

                metrics.groundY -
                metrics.fenceHeight,

                metrics.fenceWidth,

                metrics.fenceHeight

            );

        }

    }


    /*====================================
    DRAW MODAL GAME UI
    ====================================*/

    function drawGameUI(
        context,
        width,
        height
    ) {

        const metrics =
            getMetrics(
                width,
                height
            );


        context.textAlign =
            "center";


        /*================================
        READY
        ================================*/

        if (
            game.mode ===
            "READY"
        ) {

            context.fillStyle =
                COLOR_SYSTEM;


            context.font =
                `500 ${Math.round(
                    18 *
                    metrics.scale
                )}px 'JetBrains Mono', monospace`;


            context.fillText(

                "PRESS SPACE TO START",

                width / 2,

                height *
                0.30

            );

        }


        /*================================
        PLAYING
        ================================*/

        else if (
            game.mode ===
            "PLAYING"
        ) {

            context.fillStyle =
                COLOR_TEXT;


            context.font =
                `${Math.round(
                    11 *
                    metrics.scale
                )}px 'JetBrains Mono', monospace`;


            context.fillText(

                "SPACE : JUMP",

                width / 2,

                height -
                34 *
                metrics.scale

            );

        }


        /*================================
        GAME OVER
        ================================*/

        else if (
            game.mode ===
            "GAME_OVER"
        ) {

            context.fillStyle =
                "rgba(0, 0, 0, .72)";


            context.fillRect(
                0,
                0,
                width,
                height
            );


            context.fillStyle =
                COLOR_WARNING;


            context.font =
                `700 ${Math.round(
                    21 *
                    metrics.scale
                )}px 'JetBrains Mono', monospace`;


            context.fillText(

                "GOOD NIGHT!",

                width / 2,

                height *
                0.39

            );


            context.fillStyle =
                COLOR_TEXT;


            context.font =
                `${Math.round(
                    13 *
                    metrics.scale
                )}px 'JetBrains Mono', monospace`;


            context.fillText(

                `FINAL COUNT: ${String(
                    game.count
                ).padStart(
                    3,
                    "0"
                )}`,

                width / 2,

                height *
                0.49

            );


            context.fillStyle =
                COLOR_SYSTEM;


            context.fillText(

                "PRESS SPACE TO RESTART",

                width / 2,

                height *
                0.59

            );

        }


        context.textAlign =
            "start";

    }


    /*====================================
    RENDER GRID
    ====================================*/

    function renderGrid(
        dt
    ) {

        const size =
            prepareCanvas(
                gridCanvas,
                gridCtx
            );


        if (
            !size
        ) {

            return;

        }


        updateDemo(
            size.width,
            size.height,
            dt
        );


        /*
        GRID에서는 COUNT 숨김
        */

        drawScene(

            gridCtx,

            size.width,

            size.height,

            demo,

            false

        );

    }


    /*====================================
    RENDER MODAL
    ====================================*/

    function renderModal(
        dt
    ) {

        const size =
            prepareCanvas(
                modalCanvas,
                modalCtx
            );


        if (
            !size
        ) {

            return;

        }


        modalWidth =
            size.width;


        modalHeight =
            size.height;


        /*
        모달을 새로 열 때마다
        READY / COUNT 000
        */

        if (
            !wasModalOpen
        ) {

            resetGame(
                modalWidth,
                modalHeight,
                "READY"
            );


            wasModalOpen =
                true;

        }


        updateGame(
            modalWidth,
            modalHeight,
            dt
        );


        /*
        MODAL에서는 COUNT 표시
        */

        drawScene(

            modalCtx,

            modalWidth,

            modalHeight,

            game,

            true

        );


        drawGameUI(

            modalCtx,

            modalWidth,

            modalHeight

        );

    }


    /*====================================
    KEYBOARD INPUT
    ====================================*/

    document.addEventListener(
        "keydown",
        event => {

            /*
            CAM008 Modal이 아닐 때
            SPACE 무시
            */

            if (
                !window.isCam008ModalOpen
            ) {

                return;

            }


            if (
                event.code !==
                "Space"
            ) {

                return;

            }


            event.preventDefault();


            const metrics =
                getMetrics(
                    modalWidth,
                    modalHeight
                );


            /*================================
            START
            ================================*/

            if (
                game.mode ===
                "READY"
            ) {

                resetGame(
                    modalWidth,
                    modalHeight,
                    "PLAYING"
                );


                stopGameOverAudio();


                playGameAudio();


                return;

            }


            /*================================
            RESTART
            ================================*/

            if (
                game.mode ===
                "GAME_OVER"
            ) {

                resetGame(
                    modalWidth,
                    modalHeight,
                    "PLAYING"
                );


                stopGameOverAudio();


                playGameAudio();


                return;

            }


            /*================================
            JUMP
            ================================*/

            if (
                game.mode ===
                "PLAYING"
            ) {

                jump(
                    game,
                    metrics.scale
                );

            }

        }
    );


    /*====================================
    MAIN LOOP
    ====================================*/

    let previousTime =
        performance.now();


    function animate(
        now
    ) {

        const dt =
            Math.min(

                (
                    now -
                    previousTime
                ) /
                1000,

                0.033

            );


        previousTime =
            now;


        /* GRID */

        renderGrid(
            dt
        );


        /* MODAL */

        if (
            window.isCam008ModalOpen
        ) {

            renderModal(
                dt
            );

        } else {

            if (
                wasModalOpen
            ) {

                stopGameAudio();

                stopGameOverAudio();

            }


            wasModalOpen =
                false;

        }


        requestAnimationFrame(
            animate
        );

    }


    requestAnimationFrame(
        animate
    );

})();