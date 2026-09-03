# Нагрузочное тестирование

Для тестирования оптимизации обработки ставок (Batch Processing) мы используем инструмент [k6](https://k6.io/).

## Установка k6

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

## Запуск тестов

Скрипт `place_bids_load_test.js` эмулирует плавное нарастание нагрузки до 1000 пользователей, отправляющих ставки (Quick Bid). 

Перед запуском вам понадобится запустить бэкенд и создать тестовый аукцион (получив его `ID` и токен доступа авторизованного пользователя).

Для запуска используйте команду (находясь в директории `load-tests`):

```bash
k6 run -e AUCTION_ID=ваш-uuid-аукциона -e TOKEN=ваш-jwt-токен place_bids_load_test.js
```

### Настройки
- Базовый URL по умолчанию: `http://localhost:8080/api/v1`. Вы можете изменить его, передав переменную окружения `-e BASE_URL=https://ваша-api`.
- Тест проверяет, что 95% запросов выполняются быстрее 100 мс, так как эндпоинт отправки ставки асинхронный (он просто пишет в Redis).
- Ожидаемая нагрузка доходит до 1000 запросов в секунду (VUs=1000). В логах бэкенда вы должны увидеть логи `Processing batch of X bids`, где X может достигать больших значений, подтверждая работу батчинга.
