# AgroToken Roadmap

Этот roadmap задаёт строгий порядок работ для превращения текущего репозитория в submission-grade MVP для `Кейса 1: Tokenization of Real-World Assets (RWA)`.

Порядок обязателен. Нельзя переходить к следующему блоку, пока не закрыт предыдущий критический этап.

## Фаза 1. Завершить Solana Core

Цель: довести смарт-контракт до цельного и рабочего жизненного цикла актива.

1. Стабилизировать `create_campaign`
- проверить модель аккаунтов для `campaign`, `token_mint`, `vault` и `usdc_mint`
- финализировать детерминированную PDA-деривацию
- проверить ограничения по размеру метаданных и токенов
- подтвердить корректность модели authority для vault

2. Завершить `buy_tokens`
- проверить путь оплаты USDC со стороны инвестора
- проверить mint долей в token account инвестора
- подтвердить переход статуса из `ACTIVE` в `FUNDED`
- покрыть проверки переполнения supply и невалидных amount

3. Завершить `confirm_harvest`
- зафиксировать корректную авторизацию вызывающей стороны
- финализировать модель записи выручки от продажи урожая
- решить, происходит ли перевод harvest revenue при confirm или перед distribute
- задокументировать точный список ожидаемых аккаунтов

4. Завершить `distribute`
- использовать строгую модель пар аккаунтов: share token account держателя и payout USDC account держателя
- проверять mint, ownership и корректность payout account
- подтвердить корректность пропорционального распределения
- определить поведение для rounding remainder
- подтвердить переход статуса в `DISTRIBUTED`

5. Завершить `burn_tokens`
- оставить текущую signer-based модель burn, если не меняется custody-модель
- сжигать оставшиеся share tokens из holder accounts
- закрывать пустые holder token accounts
- решить, нужно ли закрытие mint сейчас или это будет отложено

6. Пересмотреть cancel flow
- определить, нужен ли `cancel_campaign` в demo scope
- если нужен, описать refund flow и требования к аккаунтам
- если не нужен, не включать его в демо и отметить как future work

## Фаза 2. Построить Anchor Test Suite

Цель: доказать корректность контракта до интеграции остальных слоёв.

1. Заменить placeholder test file
- убрать bootstrap-only тест
- создать переиспользуемые fixture helpers для farmer, investor, oracle, mint и token accounts

2. Написать тесты для `create_campaign`
- PDA derivation
- создание mint
- создание vault
- сохранение metadata

3. Написать тесты для `buy_tokens`
- перевод USDC в vault
- mint долей инвестору
- корректный учёт supply
- переход в funded state

4. Написать тесты для `confirm_harvest`
- вызов от авторизованной стороны
- отклонение неавторизованного вызова
- переход статуса
- сохранение revenue

5. Написать тесты для `distribute`
- корректность payout для нескольких инвесторов
- обработка zero-balance accounts
- отклонение невалидных payout accounts

6. Написать тесты для `burn_tokens`
- holder-signed burn сценарий
- поведение при закрытии token account
- отклонение невалидного signer

7. Довести `anchor test` до полностью зелёного состояния

## Фаза 3. Убрать Backend Mocks и Перейти на Реальную Solana Integration

Цель: отказаться от фейковых транзакций и строковых placeholder-адресов.

1. Переработать `SolanaService`
- перестать кодировать plain strings как transaction payload
- подключить реальный Solana Java SDK или совместимую стратегию построения транзакций
- выдавать настоящие unsigned transactions для подписи на frontend

2. Убрать fake address derivation
- удалить placeholder `campaign:wallet:id`
- удалить placeholder `mint:id`
- сохранять реальные on-chain адреса, полученные из фактического flow

3. Синхронизировать backend status с on-chain state
- использовать базу как metadata cache, а не как независимый source of truth
- по возможности опираться на on-chain status для campaign lifecycle
- исключить тихое расхождение между DB и chain

4. Реализовать holders lookup
- заменить placeholder response
- получать holders из token ownership или из корректно поддерживаемой investment-модели
- определить response contract для frontend

5. Ужесточить запись транзакций
- записывать investment только после подтверждённой отправки transaction
- сохранять tx signature и campaign reference
- избегать дублей при retry

## Фаза 4. Завершить Frontend Wallet Flow

Цель: сделать так, чтобы веб-приложение показывало реальный пользовательский сценарий через Phantom.

1. Доделать buy flow на странице кампании
- получить реальную unsigned transaction с backend
- десериализовать transaction
- подписать через Phantom
- отправить в Solana RPC
- зафиксировать investment в backend

2. Доработать кабинет фермера
- заменить хардкод формы на реальные пользовательские поля
- подключить `confirm harvest`
- подключить `distribute`
- показывать transaction status и итоговый campaign status

3. Доработать кабинет инвестора
- получать реальный portfolio data
- показывать owned shares
- показывать invested amount
- показывать expected и realized returns

4. Убрать зависимость демо от fallback-only поведения
- оставить fallback data только для локальной разработки при необходимости
- не использовать fallback в финальном демо и подаче

## Фаза 5. Построить Proof-of-Asset Layer

Цель: сделать связь между реальным активом и токеном убедительной и видимой.

1. Определить proof-of-asset data model
- document URL или storage reference
- SHA-256 hash
- upload timestamp
- verifier или oracle metadata

2. Показать proof details в UI
- страница кампании должна явно показывать proof hash, proof status и verification context
- связь между физическим активом и токеном должна быть понятной без дополнительных объяснений

3. Добавить verification narrative
- объяснить, как oracle или verifier подтверждает результат по урожаю
- отразить это и в UI, и в README

## Фаза 6. Добавить Solana Verification Experience

Цель: поднять оценку по `Use of Solana` и `Demo`.

1. Добавить on-chain verification panel на страницу кампании
- campaign PDA
- mint address
- vault address
- status
- total supply
- tokens sold
- proof hash

2. Добавить ссылки или copy actions для on-chain идентификаторов

3. Сделать verification panel частью demo script

## Фаза 7. Добавить Одну Отличающую Фичу

Цель: поднять `Innovation`, не ломая MVP.

Выбрать ровно одну фичу, если core flow ещё не закрыт.

Предпочтительные варианты:

1. `Live Verify on Solana`
- получать и показывать campaign state напрямую из chain
- сравнивать on-chain state с backend/frontend представлением

2. `Risk Score`
- считать простой score кампании по региону, типу культуры, полноте proof и oracle status

3. `Proof Timeline`
- показывать временную шкалу кампании от создания до выплаты

Рекомендация:

- в первую очередь делать `Live Verify on Solana`

## Фаза 8. Подготовка Демо

Цель: сделать judging demo максимально надёжным.

1. Подготовить devnet wallets
- farmer wallet
- investor wallet
- oracle wallet

2. Подготовить mock USDC balances и тестовые кампании заранее

3. Отрепетировать один основной demo flow
- создать кампанию
- купить доли
- показать владение
- подтвердить harvest
- выполнить distribute
- показать итоговый результат

4. Не включать нестабильные optional features в живое демо

## Фаза 9. Документация и Submission

Цель: добрать баллы за `Completeness`, `Demo` и общую убедительность.

1. Держать `README.md` актуальным
- проблема
- решение
- архитектура
- setup
- user flow
- использование Solana
- объяснение proof-of-asset

2. Добавить визуальные материалы
- скриншоты
- архитектурную диаграмму
- demo GIF или видео-ссылку, если есть

3. Подготовить презентацию
- проблема
- решение
- почему Solana
- архитектура
- демо
- рыночный потенциал

4. Финальная чистка репозитория
- убрать мёртвый код и очевидные placeholders
- проверить консистентность naming
- проверить инструкции по окружению

5. Сдача
- задеплоить program
- запушить GitHub-репозиторий
- отправить проект на `colosseum.com`

