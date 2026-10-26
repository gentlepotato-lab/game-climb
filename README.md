# game-climb

- 몽보리 클라임(MongBori Climb). 노란 모란앵무새가 커튼 줄을 타고 오르는 도트 게임
- GP Lab의 `game` 네임스페이스 서비스
- 배포 위치: `Desktop\Lab\game\climb`

## 스택

| 계층 | 기술 |
|---|---|
| 프론트 | Phaser 3, Vite 5, TypeScript 5, 갈무리 글꼴 |
| 백엔드 | Express 4, `pg`, `tsx` |
| DB | PostgreSQL 17, DB `gp-lab`, 스키마 `game_climb` |

## 구조

```
.
├── backend/
│   ├── src/
│   │   ├── index.ts         Express 진입점
│   │   ├── app.ts           미들웨어와 자리 접두사(API = "/api")
│   │   ├── config.ts        .env 읽기
│   │   ├── db.ts            커넥션 풀, DB_INIT
│   │   └── routes/runs.ts   기록 저장, 이번 주 랭킹
│   └── sql/                 001_init.sql과 날짜 붙은 마이그레이션
├── frontend/
│   ├── index.html           패널 셋(시작, 난이도 선택, 결과)
│   ├── src/main.ts          패널 흐름과 결과 처리
│   ├── src/ui/              start.ts(닉네임), screens.ts(패널 전환)
│   ├── src/game/            Phaser 장면과 오브젝트
│   ├── src/api/client.ts    /api 요청
│   └── vite.config.ts       base '/', 개발 프록시(/api 한 줄), 백엔드 자동 기동
└── lab.ps1                  실행 스크립트
```

## 포트

| 계층 | 포트 | 비고 |
|---|---|---|
| 엣지 | `8201` | 게이트웨이가 리스닝 |
| 내부 API | `18201` | Express |
| 개발 서버 | `28201` | Vite dev |

- 규칙: `[계층][네임스페이스][서비스]`, `2`=game, `01`=climb
- 정의 원본: `Desktop\Gateway\nginx\conf\conf.d\00-default.conf`

## 실행

```powershell
.\lab.ps1 api-bg    # 백엔드 :18201 백그라운드
.\lab.ps1 api       # 백엔드 포그라운드(로그 확인)
.\lab.ps1 build     # 프론트 빌드 → frontend\dist
.\lab.ps1 dev       # Vite 개발 서버 :28201(백엔드가 꺼져 있으면 같이 띄움)
.\lab.ps1 stop      # 백엔드 정지
.\lab.ps1 status    # 포트, dist 빌드 시각
```

- 실서비스는 **게이트웨이 필수**. Nginx가 `frontend\dist`를 직접 서빙한다.
- 배포는 `.\lab.ps1 build`뿐이다. 복사 단계가 없고 Nginx 재시작도 필요 없다.

## 접속

| 경로 | 주소 |
|---|---|
| PC, 호스트명 | http://climb.game.localhost/ |
| PC, 엣지 포트 | http://localhost:8201/ |
| LAN, 폰 | http://192.168.45.8:8201/ |
| 개발 서버 | http://localhost:28201/ |

- SPA는 **루트**에 있다(`base: '/'`).
- API는 모두 `/api` 아래(`backend/src/app.ts`의 `API = "/api"`). 판(v1, v2 …)은 나누지 않는다.
- 게이트웨이의 `allowlist.conf`에 등록된 곳에서만 열린다.

### 이름 규칙

한 자원은 **한 자리, 한 라우터 파일**을 갖는다. 둘의 이름이 늘 맞물린다.
이름은 상위 낱말을 앞에 둔다.

| 자원 | API | 라우터 |
|---|---|---|
| 기록 | `/api/runs` | `routes/runs.ts` |
| 이번 주 랭킹 | `/api/runs/leaderboard` | `routes/runs.ts` |
| 기동 확인 | `/api/health` | `app.ts` |

- 자리 접두사는 `app.ts` 한 곳에서만 붙인다. 라우터 파일 안에서 또 붙이지 않는다.

## 기록과 닉네임

로그인이 없다. 첫 화면에서 닉네임을 적고 시작하면, 판이 끝날 때 그 닉네임으로
기록이 저장된다. 닉네임은 그 브라우저의 `localStorage`에만 남는다.

- 닉네임은 1자부터 20자까지. 백엔드와 DB(`runs_display_name_chk`)가 같은 값으로 막는다.
- 누구나 기록을 남길 수 있다. 랭킹은 닉네임을 글자로만 그린다(`main.ts`의 `leaderboardRow`).
- 로그인을 걷어내기 전의 기록은 가입 때 적은 닉네임으로 채웠다(`sql/2026-10-27_runs_display_name.sql`).
- `users` 테이블과 `runs.user_id`는 아직 남아 있다. 다음 배포에서 지운다(Expand/Contract).

## DB

- 스키마 변경은 `backend\sql\<날짜>_<이름>.sql`과 `_rollback.sql`을 짝으로 둔다.
- `sql\001_init.sql`은 새 환경에서 스키마를 처음부터 세운다. 마이그레이션을 추가하면
  이 파일도 같은 모양으로 고친다.
- `backend\.env`의 `DB_INIT`은 `0`. `1`이면 기동할 때마다 `001_init.sql`이 돈다.

## 환경 변수

- `backend\.env`: `backend\.env.example` 참고
- `frontend\.env`: 지금은 없어도 된다. 포트를 바꿀 때만 `frontend\.env.example`을 참고한다.
- 실제 `.env`는 추적하지 않음

## 브랜치 전략

```
feat/*  →  develop  →  main
```

- 원격: `gentlepotato-lab/game-climb`
- 작업은 `develop`에서 `feat/*`를 따서 하고, 끝나면 `develop`에 머지한다.
- `main`으로의 머지와 전환은 개발이 어느 정도 끝나고 서비스를 시작하기 직전에 한다.
- `build`는 어느 브랜치에서든 한다. 게이트웨이가 작업 트리의 `dist`를 직접 읽으므로
  그때 빌드한 것이 바로 서빙된다.
  - `dist/`는 추적하지 않으므로 브랜치 전환만으로는 실서비스가 바뀌지 않음

## 참고

| 문서 | 내용 |
|---|---|
| `..\..\README.md` | GP Lab 전체 구성, 실행, 포트 규칙 |
| `..\..\WORKFLOW.md` | 개발, 배포 워크플로 |
| `..\..\..\Gateway\README.md` | 게이트웨이 상세, DB 마이그레이션 기록 |
