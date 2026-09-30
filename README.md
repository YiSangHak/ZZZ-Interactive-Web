# ZZZ Interactive Web

수면감찰청의 9개 감시 채널을 탐색하는 인터랙티브 웹 전시입니다.
빌드 과정 없이 브라우저의 JavaScript 모듈을 사용합니다.

## 실행

프로젝트 루트에서 정적 서버를 실행한 뒤 `http://localhost:8000`을 엽니다.

```sh
python3 -m http.server 8000
```

모듈을 사용하므로 HTML 파일을 직접 더블클릭하는 `file://` 방식 대신 서버로 실행합니다.
웹캠은 localhost 또는 HTTPS에서 카메라 권한이 필요합니다.
CAM-005 얼굴 추적은 기존 MediaPipe CDN과 모델 다운로드를 사용하므로 인터넷 연결이 필요합니다.

## 파일 구조

- `index.html`: 화면 마크업, 채널 이름·설명·영상 경로
- `js/main.js`: 앱 시작 및 기본 채널 로딩
- `js/config.js`: 스캔 시간, 비활동 시간, 카메라 옵션, 채널별 연출 설정
- `js/monitor-wall.js`: 마우스 커서, 스캔 링, 채널 설명 타이핑
- `js/modal.js`: 채널 모달 열기·닫기 및 미디어 전환
- `js/intro.js`: 전시 시작 화면과 비활동 복귀
- `js/core/`: 공유 상태, 오디오, 웹캠, 수학 함수
- `js/channels/`: EEG, 얼굴 추적, 신호 탐색, 양 세기, 기록 단말의 개별 로직
- `styles/main.css`: 스타일 진입점과 적용 순서
- `styles/`: 기본 변수, 인트로, 모니터, 커서, 모달, 채널, 반응형 스타일
- `assets/`: 영상·오디오·이미지

## 자주 수정하는 설정

`js/config.js`의 `appConfig`에서 스캔 시간과 설명 타이핑 간격, 60초 비활동 복귀 시간을 조정합니다.
각 `camXXXConfig`에서 해당 채널의 속도·색상·분석 시간 등을 조정합니다.
시간은 기본적으로 밀리초이며, 양 세기 물리 값은 기존 초 단위 업데이트를 따릅니다.
`SPEED_INCREASE_PER_COUNT`는 울타리 하나당 증가 비율, `MAX_SPEED_MULTIPLIER`는 최대 속도 배수입니다.
공통 CSS 색상·글꼴·커서 크기는 `styles/base.css`의 `:root`에서 조정합니다.
화면 크기별 변경은 `styles/responsive.css`에서 관리합니다.

## 채널과 상태 관리

`appState.activeCameraId`에는 열린 채널 ID(예: `cam008`) 또는 `null`을 저장합니다.
개별 채널은 이 값을 읽으며, 모달에서 상태를 변경합니다.
CAM-005는 외부 라이브러리 로딩이 다른 채널을 막지 않도록 HTML에서 별도 모듈로 로딩합니다.
분석 초기화 함수는 `actions.resetCam005Analysis`로 등록합니다.

일반 영상 채널은 HTML의 `source`만으로 모달에 연결됩니다.
새로운 캔버스나 DOM 기반 채널은 `js/modal.js`의 `surfaces`에 화면 요소와 표시 방식을 추가합니다.
기본 모달 오디오는 `modalAudioSources`에서 관리하고, CAM-005·008의 상태별 오디오는 각 채널에서 관리합니다.

## 수정 후 확인

1. 인트로에서 클릭·키 입력으로 진입하고, 비활동 시 복귀하는지 확인합니다.
2. 채널 위에 마우스를 올려 스캔과 설명 표시를 확인합니다.
3. 9개 채널 모달을 열고 Escape 및 바깥 영역 클릭으로 닫습니다.
4. CAM-005 카메라 권한·추적, CAM-008 시작·점프·재시작을 확인합니다.
5. 세로 화면과 터치 입력을 확인합니다.

서식 기준은 `.prettierrc.json`에 있습니다. Prettier 3으로 HTML·CSS·JavaScript를 정리할 수 있습니다.
