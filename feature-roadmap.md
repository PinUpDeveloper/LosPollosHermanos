# AgroToken Feature Roadmap

Этот roadmap отделён от [roadmap.md](/C:/Users/hp/LosPollosHermanos/roadmap.md).

`roadmap.md` отвечает за доведение core MVP до submission-grade состояния.

Этот документ отвечает за продуктовые фичи, которые усиливают:
- доверие к агро-RWA
- demo-эффект для жюри
- позиционирование AgroToken как trust infrastructure, а не просто crowdfunding UI

Дата: `2026-04-05`

## Product Thesis

AgroToken нужно подавать не как платформу для краудфандинга.
AgroToken нужно подавать как `Trust Layer for Agriculture`.

Короткая формулировка:
- `AgroToken = Bloomberg + Stripe + Proof-of-Reserve для фермерского урожая`
- фермер получает капитал до сбора урожая
- инвестор получает прозрачный, дробный и проверяемый доступ к реальному активу
- Solana используется как слой расчётов, владения, подтверждения статуса и верификации

## Главная Цель

Собрать такой feature set, чтобы жюри увидело:
- реальный use case для Solana
- прозрачную связь между реальным активом и on-chain состоянием
- понятный trust model для инвестора
- потенциал проекта как платформы, а не разовой демки

## Приоритеты

### Must Have
- Dynamic Trust Score
- Live Proof Stream
- Investor Passport for Farmers
- Portfolio Forecast
- Milestone-Based Funding

### Wow Factor
- Insurance / Safety Buffer
- Real Asset Bundle
- Community Verification

### Pitch Layer
- единое позиционирование `Trust Layer for Agriculture`
- demo script, где trust visibly grows along campaign lifecycle
- понятные инвесторские метрики, а не просто токены и транзакции

## Phase 1. Dynamic Trust Score

Цель:
Сделать доверие к кампании измеримым и визуально понятным.

Суть:
Показывать не только `riskScore`, а агрегированный `Trust Score 0-100`, который объясняет, почему кампании можно или нельзя доверять.

Источники score:
- AI risk score
- proof-of-asset status: `UPLOADED / VERIFIED / REJECTED`
- funding progress
- farmer history
- on-chain consistency
- скорость прохождения lifecycle milestone-ов

Подача в UI:
- `Trust Score 78/100`
- `High Trust / Medium Trust / Watch Carefully`
- 3 причины доверия рядом с числом

Что уже сделано:
- backend scoring service
- trust fields в campaign response
- trust badge на campaign card
- trust block на campaign details page

Что осталось:
- добавить `on-chain consistency` в расчёт
- добавить динамику score после `verify-proof`, `buy`, `confirm_harvest`, `distribute`
- добавить визуальное объяснение изменения trust score по шагам

Definition of Done:
- trust score приходит в `GET /api/campaigns`
- trust score виден на marketplace и campaign page
- trust score меняется после ключевых lifecycle событий
- в демо можно показать, почему score вырос или упал

## Phase 2. Live Proof Stream

Цель:
Превратить текущий `ProofTimeline` в живую ленту доверия.

События:
- campaign created
- proof uploaded
- oracle verified
- 25% funded
- 50% funded
- 100% funded
- harvest confirmed
- payout distributed

Что должно быть видно:
- timestamp каждого события
- кто подтвердил событие
- ссылка на Solana Explorer или tx id
- proof hash и verifier wallet для proof-событий

Почему это важно:
- это выглядит как `audit trail`
- это резко усиливает ощущение прозрачности
- это сильный wow-элемент для жюри

Definition of Done:
- timeline строится из реальных campaign events
- для каждого события есть время и тип
- важные события кликабельны и ведут в explorer или раскрывают on-chain контекст

## Phase 3. Investor Passport for Farmers

Цель:
Сделать доверие к фермеру накопительным, а не одноразовым.

Что показывать:
- сколько кампаний создано
- сколько дошло до distribution
- средний срок до harvest confirmation
- средняя доходность по завершённым циклам
- доля кампаний с `VERIFIED` proof
- `Reliability Badge`: Bronze / Silver / Gold

Почему это важно:
- жюри увидит платформенный эффект
- инвестор увидит не только актив, но и историю исполнителя
- это готовая основа для future underwriting layer

Definition of Done:
- у farmer profile есть агрегированные historical metrics
- badge и trust metrics показываются рядом с campaign owner
- investor может быстро сравнить двух фермеров

## Phase 4. Portfolio Forecast

Цель:
Сделать investor dashboard похожим на инвестиционный продукт, а не на список покупок токенов.

Что показывать:
- expected harvest date
- projected payout
- pessimistic / base / optimistic scenario
- risk-adjusted return
- realized return после distribution

Как считать в MVP:
- простые сценарии на основе price per token, total supply, risk tier и статусной стадии кампании
- не пытаться сразу строить real quant model

Почему это важно:
- dashboard становится бизнесово убедительным
- жюри видит value для инвестора
- повышается perceived maturity продукта

Definition of Done:
- investor dashboard показывает projected outcomes по каждой инвестиции
- пользователь видит expected vs realized return
- trust score и risk score влияют на forecast narrative

## Phase 5. Milestone-Based Funding

Цель:
Не отдавать весь капитал фермеру сразу, а разбивать funding на trust-based этапы.

Пример модели:
- 30% после запуска кампании
- 30% после подтверждения посева
- 40% после подтверждения промежуточного агро-статуса

Почему это важно:
- решает реальную проблему доверия
- показывает, зачем нужны proof, oracle и Solana
- делает AgroToken похожим на настоящий agri-finance protocol

Что нужно:
- milestone model в backend
- статусы milestone-ов
- release logic в UI и, позже, on-chain
- привязка trust score к прохождению milestone-ов

Definition of Done:
- у кампании есть milestone plan
- каждый milestone можно подтвердить
- funding release логически привязан к milestone-ам
- в демо можно показать controlled capital release

## Phase 6. Insurance / Safety Buffer

Цель:
Показать, что AgroToken умеет не только продавать доступ к риску, но и управлять риском.

Идея:
- 2-5% funding уходит в reserve pool
- размер buffer зависит от risk profile кампании
- в случае срыва цикла reserve покрывает часть потерь

В MVP:
- можно реализовать как narrative layer и mock accounting
- не обязательно сразу делать полный on-chain reserve engine

Definition of Done:
- в campaign economics видно reserve percentage
- investor понимает, как safety buffer снижает downside risk
- это отражено в pitch и в UI кампании

## Phase 7. Real Asset Bundle

Цель:
Расширить объект токенизации с одного урожая до полноценного агро-цикла.

Состав bundle:
- land proof
- crop plan
- insurance document
- harvest confirmation

Почему это важно:
- проект выглядит как протокол токенизации агроактивов
- trust layer становится глубже, чем один PDF и один hash

Definition of Done:
- у кампании есть несколько asset artifacts
- каждый артефакт имеет статус, hash и verification context
- UI показывает bundle как единый verified asset package

## Phase 8. Community Verification

Цель:
Сделать верификацию сетевой и масштабируемой.

Идея:
- локальные агрономы
- кооперативы
- сертифицированные verifiers
- verifier reputation on-chain или в reputation layer

Что инвестор должен видеть:
- кто подтвердил proof
- насколько надёжен verifier
- сколько проверок verifier провёл ранее

Почему это важно:
- это усиливает network effects
- это делает продукт менее централизованным
- это очень хорошо звучит для жюри

Definition of Done:
- у verifier есть профиль и reputation metrics
- campaign proof может быть привязан к конкретному verifier
- investor видит identity и reputation verifier-а

## Demo Roadmap

Лучший порядок demo:
1. фермер создаёт кампанию
2. система показывает `Trust Score`
3. показывается proof hash и verifier flow
4. инвестор покупает долю
5. открывается Solana Explorer / verification panel
6. harvest confirmed
7. payout distributed
8. investor portfolio показывает realized return

## Delivery Order

Строгий порядок реализации feature roadmap:
1. Dynamic Trust Score
2. Live Proof Stream
3. Investor Passport for Farmers
4. Portfolio Forecast
5. Milestone-Based Funding
6. Insurance / Safety Buffer
7. Real Asset Bundle
8. Community Verification

## Strategic Rule

Пока core demo flow не стабилен, нельзя распыляться на все идеи сразу.

Если приходится выбирать, брать только то, что:
- усиливает trust
- усиливает demo
- усиливает perceived maturity проекта

Главные 5 фич для ближайшей реализации:
1. Dynamic Trust Score
2. Live Proof Stream
3. Investor Passport for Farmers
4. Portfolio Forecast
5. Milestone-Based Funding

## Final Positioning

AgroToken — это не просто токенизация урожая.

AgroToken — это программируемый слой доверия для сельскохозяйственных real-world assets:
- proof-backed issuance
- live verifiability on Solana
- AI trust scoring
- automated payout distribution
