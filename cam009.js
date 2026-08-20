(() => {

    /*====================================
    CAM009
    ZZZ CENTRAL ARCHIVE TERMINAL
    ====================================*/

    const gridTerminal =
        document.getElementById(
            "cam009-terminal"
        );

    const modalTerminal =
        document.getElementById(
            "modal-cam009-terminal"
        );


    /*====================================
    CONFIG
    ====================================*/

    const TYPE_SPEED_MIN =
        22;

    const TYPE_SPEED_MAX =
        48;

    const LINE_DELAY_MIN =
        160;

    const LINE_DELAY_MAX =
        420;

    const COMMAND_DELAY_MIN =
        650;

    const COMMAND_DELAY_MAX =
        1400;

    const MAX_LINES =
        45;


    /*====================================
    STATE
    ====================================*/

    const terminalLines = [];

    let currentTypingLine =
        null;


    /*====================================
    UTILITIES
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


    function randomItem(
        array
    ) {

        return array[
            Math.floor(
                Math.random() *
                array.length
            )
        ];

    }


    function wait(
        milliseconds
    ) {

        return new Promise(
            resolve => {

                setTimeout(
                    resolve,
                    milliseconds
                );

            }
        );

    }


    function createSubjectId() {

        return String(
            randomInteger(
                1,
                99999
            )
        ).padStart(
            5,
            "0"
        );

    }


    function createNodeId() {

        return `NODE-${String(
            randomInteger(
                1,
                12
            )
        ).padStart(
            2,
            "0"
        )}`;

    }


    function createCamId() {

        return `CAM-${String(
            randomInteger(
                1,
                9
            )
        ).padStart(
            3,
            "0"
        )}`;

    }


    function createSleepScore() {

        return randomInteger(
            20,
            95
        );

    }


    /*====================================
    LOG TYPE
    ====================================*/

    const LINE_TYPE = {

        SYSTEM:
            "system",

        COMMAND:
            "command",

        RESPONSE:
            "response",

        WARNING:
            "warning",

        SUCCESS:
            "success",

        MUTED:
            "muted"

    };


    /*====================================
    RENDER
    ====================================*/

    function createLineElement(
        line
    ) {

        const element =
            document.createElement(
                "div"
            );


        element.className =
            `terminal-line ${line.type}`;


        element.textContent =
            line.text;


        return element;

    }


    function renderTerminal(
        container
    ) {

        if (
            !container
        ) {

            return;

        }


        container.innerHTML =
            "";


        terminalLines.forEach(
            line => {

                container.appendChild(
                    createLineElement(
                        line
                    )
                );

            }
        );


        /*
        현재 입력 중인 줄
        */

        if (
            currentTypingLine
        ) {

            const typingElement =
                document.createElement(
                    "div"
                );


            typingElement.className =
                `terminal-line ${currentTypingLine.type}`;


            typingElement.innerHTML =
                `${escapeHTML(
                    currentTypingLine.text
                )}<span class="terminal-cursor">█</span>`;


            container.appendChild(
                typingElement
            );

        }


        /*
        항상 최신 로그가 보이도록
        */

        container.scrollTop =
            container.scrollHeight;

    }


    function renderAll() {

        renderTerminal(
            gridTerminal
        );


        /*
        Modal도 동일 세션 표시
        */

        renderTerminal(
            modalTerminal
        );

    }


    function escapeHTML(
        string
    ) {

        return string
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            );

    }


    /*====================================
    LINE STORAGE
    ====================================*/

    function addLine(
        text,
        type = LINE_TYPE.RESPONSE
    ) {

        terminalLines.push({

            text,

            type

        });


        while (
            terminalLines.length >
            MAX_LINES
        ) {

            terminalLines.shift();

        }


        renderAll();

    }


    function addEmptyLine() {

        addLine(
            "",
            LINE_TYPE.MUTED
        );

    }


    /*====================================
    TYPE LINE
    ====================================*/

    async function typeLine(
        text,
        type = LINE_TYPE.COMMAND
    ) {

        currentTypingLine = {

            text:
                "",

            type

        };


        renderAll();


        for (
            let index = 0;
            index < text.length;
            index++
        ) {

            currentTypingLine.text +=
                text[index];


            renderAll();


            const character =
                text[index];


            /*
            SPACE나 기호 뒤에는
            아주 미세한 리듬 변화
            */

            let delay =
                randomInteger(
                    TYPE_SPEED_MIN,
                    TYPE_SPEED_MAX
                );


            if (
                character === " "
            ) {

                delay +=
                    randomInteger(
                        10,
                        30
                    );

            }


            await wait(
                delay
            );

        }


        terminalLines.push({

            text,

            type

        });


        currentTypingLine =
            null;


        while (
            terminalLines.length >
            MAX_LINES
        ) {

            terminalLines.shift();

        }


        renderAll();

    }


    /*====================================
    SYSTEM RESPONSE
    ====================================*/

    async function systemResponse(
        text,
        type = LINE_TYPE.RESPONSE
    ) {

        await wait(
            randomInteger(
                LINE_DELAY_MIN,
                LINE_DELAY_MAX
            )
        );


        addLine(
            `> ${text}`,
            type
        );

    }


    /*====================================
    COMMAND GENERATORS
    ====================================*/

    async function runSubjectScan() {

        const subjectId =
            createSubjectId();


        const score =
            createSleepScore();


        await typeLine(
            `ZZZ@ARCHIVE:~$ scan --subject ${subjectId}`
        );


        await systemResponse(
            `SUBJECT ${subjectId} LOCATED`
        );


        await systemResponse(
            `BIOMETRIC RECORD LINKED / ${createNodeId()}`
        );


        await systemResponse(
            `SLEEP SCORE: ${score}`
        );


        if (
            score < 60
        ) {

            await systemResponse(
                "STATUS: SLEEP DEFICIENCY",
                LINE_TYPE.WARNING
            );


            await systemResponse(
                "WARNING FLAG REGISTERED",
                LINE_TYPE.WARNING
            );

        } else {

            await systemResponse(
                "STATUS: COMPLIANT",
                LINE_TYPE.SUCCESS
            );

        }

    }


    async function runArchiveRecord() {

        const subjectId =
            createSubjectId();


        await typeLine(
            `ZZZ@ARCHIVE:~$ archive --record ${subjectId}`
        );


        await systemResponse(
            "TRANSFER INITIALIZED"
        );


        await systemResponse(
            `TARGET: ${createNodeId()}`
        );


        await systemResponse(
            `${randomInteger(
                18,
                46
            )} DATA BLOCKS RECEIVED`
        );


        await systemResponse(
            "RECORD STORED",
            LINE_TYPE.SUCCESS
        );

    }


    async function runCameraSync() {

        const cam =
            createCamId();


        await typeLine(
            `ZZZ@ARCHIVE:~$ sync --surveillance ${cam}`
        );


        await systemResponse(
            `CONNECTING TO ${cam}...`
        );


        await systemResponse(
            randomItem([
                "LIVE SIGNAL ACQUIRED",
                "SURVEILLANCE STREAM ACTIVE",
                "CHANNEL RESPONSE CONFIRMED",
                "REMOTE SENSOR ONLINE"
            ])
        );


        await systemResponse(
            `LATENCY ${randomInteger(
                12,
                87
            )}MS`
        );


        await systemResponse(
            "CONNECTION STABLE",
            LINE_TYPE.SUCCESS
        );

    }


    async function runProtocolCheck() {

        const protocol =
            String(
                randomInteger(
                    1,
                    24
                )
            ).padStart(
                2,
                "0"
            );


        await typeLine(
            `ZZZ@ARCHIVE:~$ protocol --verify SLP-${protocol}`
        );


        await systemResponse(
            `LOADING SLEEP PROTOCOL SLP-${protocol}`
        );


        await systemResponse(
            randomItem([
                "COMPLIANCE TABLE VERIFIED",
                "SLEEP WINDOW CONFIRMED",
                "SUBJECT LIMITS VERIFIED",
                "MONITORING RULESET ACTIVE"
            ])
        );


        await systemResponse(
            "PROTOCOL VALID",
            LINE_TYPE.SUCCESS
        );

    }


    async function runDatabaseQuery() {

        await typeLine(
            "ZZZ@ARCHIVE:~$ database --status"
        );


        await systemResponse(
            `ARCHIVE CAPACITY: ${randomInteger(
                61,
                94
            )}%`
        );


        await systemResponse(
            `ACTIVE SUBJECTS: ${randomInteger(
                1204,
                9811
            )}`
        );


        await systemResponse(
            `LIVE CHANNELS: ${randomInteger(
                7,
                9
            )}/09`
        );


        await systemResponse(
            "DATABASE STATUS: NOMINAL",
            LINE_TYPE.SUCCESS
        );

    }


    async function runSleepViolationCheck() {

        const subjectId =
            createSubjectId();


        const score =
            randomInteger(
                20,
                59
            );


        await typeLine(
            `ZZZ@ARCHIVE:~$ inspect --subject ${subjectId} --sleep`
        );


        await systemResponse(
            `SUBJECT ${subjectId} / ANALYSIS COMPLETE`
        );


        await systemResponse(
            `SLEEP SCORE: ${score}`,
            LINE_TYPE.WARNING
        );


        await systemResponse(
            randomItem([
                "INSUFFICIENT SLEEP DETECTED",
                "SLEEP PROTOCOL DEVIATION",
                "REST CYCLE BELOW THRESHOLD",
                "COMPLIANCE FAILURE DETECTED"
            ]),
            LINE_TYPE.WARNING
        );


        await systemResponse(
            `REPORT FORWARDED TO ${createNodeId()}`,
            LINE_TYPE.WARNING
        );

    }


    async function runOperatorNote() {

        const subjectId =
            createSubjectId();


        const notes = [

            "SUBJECT REMAINS UNDER OBSERVATION",

            "NO MANUAL INTERVENTION REQUIRED",

            "EXTENDED MONITORING AUTHORIZED",

            "SLEEP RECORD MARKED FOR REVIEW",

            "SURVEILLANCE PERIOD EXTENDED",

            "SUBJECT MOVEMENT WITHIN TOLERANCE"

        ];


        await typeLine(
            `ZZZ@ARCHIVE:~$ note --subject ${subjectId}`
        );


        await systemResponse(
            randomItem(
                notes
            )
        );


        await systemResponse(
            "OPERATOR NOTE SAVED",
            LINE_TYPE.SUCCESS
        );

    }


    /*====================================
    BOOT SEQUENCE
    ====================================*/

    async function bootTerminal() {

        addLine(
            "ZZZ CENTRAL ARCHIVE TERMINAL",
            LINE_TYPE.SYSTEM
        );


        await wait(
            220
        );


        addLine(
            "SLEEP SURVEILLANCE ADMINISTRATION",
            LINE_TYPE.MUTED
        );


        await wait(
            180
        );


        addLine(
            "SECURE TERMINAL / CHANNEL 09",
            LINE_TYPE.MUTED
        );


        await wait(
            350
        );


        addLine(
            ""
        );


        await systemResponse(
            "AUTHORIZATION ACCEPTED",
            LINE_TYPE.SUCCESS
        );


        await systemResponse(
            "ARCHIVE NETWORK CONNECTED"
        );


        await systemResponse(
            "SURVEILLANCE DATABASE ONLINE"
        );


        await systemResponse(
            "AWAITING OPERATOR INPUT..."
        );


        addEmptyLine();


        await wait(
            700
        );

    }


    /*====================================
    TERMINAL LOOP
    ====================================*/

    const terminalCommands = [

        runSubjectScan,

        runArchiveRecord,

        runCameraSync,

        runProtocolCheck,

        runDatabaseQuery,

        runSleepViolationCheck,

        runOperatorNote

    ];


    async function terminalLoop() {

        await bootTerminal();


        while (
            true
        ) {

            /*
            같은 명령만 반복되지 않도록
            랜덤 명령 선택
            */

            const command =
                randomItem(
                    terminalCommands
                );


            await command();


            addEmptyLine();


            await wait(
                randomInteger(
                    COMMAND_DELAY_MIN,
                    COMMAND_DELAY_MAX
                )
            );

        }

    }


    /*====================================
    START
    ====================================*/

    terminalLoop();

})();