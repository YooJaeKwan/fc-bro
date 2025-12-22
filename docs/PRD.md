# 📄 Product Requirements Document (PRD)

**Project Name**: 아마추어 축구팀 통합 관리 플랫폼 (FC BRO)
**작성일**: 2025-12-22 (Updated)
**버전**: v2.0 (Current Implementation)

## 1. 🎯 제품 개요
아마추어 축구팀의 팀원 관리, 일정 관리, 참석률 분석, 팀 편성까지 한 번에 가능한 통합 관리 플랫폼.
팀 총무(관리자)와 팀원(일반)이 함께 사용하며, 실제 운영 데이터를 기반으로 한 대시보드와 직관적인 일정 관리를 제공한다.

## 2. 👥 주요 사용자 및 권한
| 사용자 유형 | 역할 | 권한 및 기능 |
|------------|------|--------------|
| **총무 (Admin)** | 관리자 | 팀 정보 관리, 일정 생성/수정/삭제, 팀원 정보 수정(레벨 등), 게스트 초청 |
| **팀원 (Member)** | 일반 사용자 | 일정 조회, 참석 투표(참석/불참/미정), 내 프로필 관리, 대시보드 조회 |

## 3. 🔑 핵심 기능 상세

### 3.1 🔐 사용자 관리 (Auth & Profile)
*   **카카오 로그인**: NextAuth.js + Kakao OAuth 연동.
    *   로그인 시 기존 회원은 자동 대시보드 이동.
    *   신규 회원은 회원가입(추가 정보 입력) 페이지로 이동.
*   **프로필 정보**: 이름(실명), 닉네임, 카카오 ID, 전화번호, 활동 지역, 생년월일, 주발, 등번호.
*   **포지션 시스템**:
    *   **주 포지션** 1개 + **부 포지션** 2개 선택 가능.
    *   Select UI 기반의 중복 방지 로직 적용 (주포지션 선택 시 부포지션에서 제외).
    *   **지원 포지션 코드**:
        *   공격: ST, CF, SS, LWF, RWF
        *   미드필더: AMC, MC, DM
        *   수비: DC, DR, DL, DRL, DRLC
        *   골키퍼: GK

### 3.2 📅 일정 관리 (Schedule)
*   **일정 등록 (총무 전용)**:
    *   **유형**: 자체경기(Internal), 매치(Match/vs팀), 훈련(Training).
    *   **시간 자동 계산**: 시작 시간 입력 시 집합 시간(20분 전) 자동 설정.
    *   **장소**: 자주 쓰는 장소 추천 및 직접 입력.
    *   쿼터 시간, 휴식 시간, 상세 설명 입력.
*   **참석 관리**:
    *   일정별 참석/불참/미정(Pending) 투표 기능.
    *   실시간 참석 현황(참석자 수/비율) 표시.
*   **게스트(용병) 시스템**:
    *   비회원 게스트 초대 및 등록 가능.
    *   게스트 정보: 이름, 포지션, 실력 등급, 초대한 사람.

### 3.3 📊 대시보드 (Dashboard)
실제 DB 데이터를 기반으로 실시간 통계 제공:
*   **팀 현황**: 총 팀원 수, 활성 멤버 수(최근 30일 활동).
*   **평균 참석률**: 전체 일정 대비 평균 참석 비율.
*   **다음 경기 (D-Day)**: 가장 가까운 예정 경기 정보 및 카운트다운.
*   **우수 출석왕**: 참석률 기반 상위 5명 랭킹 (메달 표시).

### 3.4 ⚽ 경기 기록 및 팀 운영 (In Progress)
*   **팀 편성**: 참석 확정 인원 대상 팀(조끼) 배정 로직 (저장: JSON).
*   **경기 기록**: `SchedulePlayerStat`을 통한 개인별 득점, 어시스트, 평점 기록.

## 4. �️ 기술 스택 (Current Stack)

| 영역 | 기술 스택 | 비고 |
|------|-----------|------|
| **Frontend** | **Next.js 15 (App Router)** | React 19, Server Components |
| **Language** | **TypeScript** | Strict typing 적용 |
| **UI Framework** | **Tailwind CSS** | Styling |
| **UI Components**| **shadcn/ui** | Radix UI 기반 컴포넌트 (Dialog, Select, Card 등) |
| **Icons** | lucide-react | 아이콘 라이브러리 |
| **Database** | **PostgreSQL** | NeonDB (Serverless Postgres) |
| **ORM** | **Prisma** | 스키마 관리 및 DB Client |
| **Auth** | **NextAuth.js v4** | Kakao Provider |
| **Forms** | react-hook-form + zod | 폼 유효성 검사 |
| **Visualization**| reCharts | 대시보드 차트/통계 |

## 5. 📊 데이터베이스 모델 (Schema Summary)

### Key Models
*   **User**: `id`, `kakaoId`, `role` (ADMIN/MEMBER), `mainPosition`, `subPositions`, `level`.
*   **Schedule**: `id`, `type`, `matchDate`, `location`, `status` (SCHEDULED/COMPLETED), `teamFormation`(JSON).
*   **ScheduleAttendance**: `scheduleId`, `userId`, `status`, `isGuest` (게스트 여부).
*   **SchedulePlayerStat**: `goals`, `assists`, `rating` (경기 후 기록).
*   **Team**: (확장 예정) 현재는 단일 팀 구조로 운영 중이나 DB상 존재.

## 6. 📌 우선순위 및 향후 계획

### ✅ 완료 (Done)
- [x] 프로젝트 초기 세팅 (Next.js 15 + Tailwind)
- [x] DB 스키마 설계 및 Prisma 연동
- [x] 카카오 로그인 및 자동 회원가입/로그인 플로우
- [x] 포지션 선택 시스템 (주/부 포지션 로직 개선)
- [x] 일정 생성, 조회, 참석 투표 기능
- [x] 메인 대시보드 (실시간 데이터 연동)

### 🚀 진행 중 / 예정 (Todo)
- [ ] **팀 편성 알고리즘**: 포지션/실력 기반 자동 밸런싱.
- [ ] **매치 결과 입력 UI**: 쿼터별 점수 및 개인 기록 입력 화면.
- [ ] **전술 보드**: 드래그 앤 드롭으로 포메이션 짜기.
- [ ] **커뮤니티**: 공지사항 및 게시판 댓글 기능 고도화.