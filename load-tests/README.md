# Тестирование ставок и параллельной нагрузки (Bidding Simulation & Load Tests)

Этот каталог содержит инструменты для симуляции параллельных ставок реальными пользователями и нагрузочного тестирования обработки батчей (Redis Queue + Batch Processing).

---

## 1. Симуляция параллельных ставок пользователями из БД (`simulate_parallel_bids.mjs`)

Скрипт автоматически:
- Подключается к базе данных (через контейнер PostgreSQL `car-auction-db` или локальный инстанс).
- Получает текущих активных пользователей из таблицы `users`.
- Автоматически исключает продавца текущего аукциона (согласно правилам домена Cars & Bids).
- Генерирует валидные JWT-токены для каждого пользователя.
- Запускает **параллельные одновременные ставки** от всех пользователей через `Promise.all`.
- Дожидается обработки очереди воркером `BidQueueProcessor` и выводит итоговую таблицу ставок, победителя и рост цены.

### Быстрый старт (любой активный аукцион):
```bash
node load-tests/simulate_parallel_bids.mjs
```

### Запуск на конкретном аукционе:
```bash
node load-tests/simulate_parallel_bids.mjs 19a66da9-2a16-4f2c-8bb4-5666d38ef148
# или с флагом
node load-tests/simulate_parallel_bids.mjs --auctionId=19a66da9-2a16-4f2c-8bb4-5666d38ef148
```

### Параметры запуска:
| Параметр | По умолчанию | Описание |
|---|---|---|
| `--auctionId=<UUID>` | Первый активный | UUID целевого аукциона |
| `--rounds=<N>` | `3` | Количество раундов параллельных ставок |
| `--type=<quick\|custom>` | `quick` | Тип ставки: `quick` (быстрая ставка) или `custom` (возрастающие суммы) |
| `--baseUrl=<URL>` | `http://localhost:8080/api/v1` | URL бэкенда |

Пример с несколькими раундами:
```bash
node load-tests/simulate_parallel_bids.mjs --rounds=5 --type=quick
```

---

## 2. Spring Boot Integration Test (`ParallelBiddingSimulationTest.kt`)

Автоматизированный интеграционный тест JUnit 5 в бэкенде:
`bidapi/src/test/kotlin/com/oblapleon/bidapi/feature/bid/ParallelBiddingSimulationTest.kt`

Тест выполняет:
- Выбор целевого аукциона (из БД или по флагу `-Dauction.id=<UUID>`).
- Выборку реальных пользователей из `userRepository`.
- Параллельный запуск пула потоков с `CountDownLatch` для синхронного импульса запросов.
- Проверку ответа `202 Accepted`, дренаж очереди Redis и валидацию отсутствия гонок и корректного прироста цены.

### Запуск через Gradle:
```bash
cd bidapi
./gradlew test --tests com.oblapleon.bidapi.feature.bid.ParallelBiddingSimulationTest
```

### Запуск на конкретном аукционе:
```bash
./gradlew test --tests com.oblapleon.bidapi.feature.bid.ParallelBiddingSimulationTest -Dauction.id=19a66da9-2a16-4f2c-8bb4-5666d38ef148
```

---

## 3. Нагрузочное тестирование k6 (`place_bids_load_test.js`)

Для тестирования оптимизации обработки ставок (Batch Processing) мы используем инструмент [k6](https://k6.io/).

### Установка k6
**На macOS:**
```bash
brew install k6
```

**На Linux (Debian/Ubuntu):**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Запуск k6:
```bash
k6 run -e AUCTION_ID=ваш-uuid-аукциона -e TOKEN=ваш-jwt-токен place_bids_load_test.js
```
