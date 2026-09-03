import http from 'k6/http';
import { check, sleep } from 'k6';

// Конфигурация нагрузочного теста
export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Разгон до 50 виртуальных пользователей (VUs) за 10 секунд
    { duration: '30s', target: 200 },  // Постепенное увеличение до 200 VUs
    { duration: '30s', target: 1000 }, // Резкий скачок (spike) до 1000 VUs для проверки батчинга
    { duration: '30s', target: 1000 }, // Удержание нагрузки 1000 VUs на 30 секунд
    { duration: '10s', target: 0 },   // Плавное снижение до 0
  ],
  thresholds: {
    // 95% запросов должны выполняться быстрее 100 мс (т.к. эндпоинт просто пишет в Redis)
    http_req_duration: ['p(95)<100'],
    // Меньше 1% запросов могут падать с ошибками
    http_req_failed: ['rate<0.01'], 
  },
};

// Замените на реальные ID аукциона и токен
const AUCTION_ID = __ENV.AUCTION_ID || '123e4567-e89b-12d3-a456-426614174000';
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/api/v1';
const TEST_TOKEN = __ENV.TOKEN || 'fake-token-for-testing'; // При необходимости передайте токен через env: k6 run -e TOKEN=mytoken ...

// Основная функция, выполняемая каждым виртуальным пользователем (VU)
export default function () {
  const url = `${BASE_URL}/auctions/${AUCTION_ID}/bids/quick`;
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_TOKEN}`, 
    },
  };

  // Выполняем POST запрос (Quick Bid)
  const res = http.post(url, JSON.stringify({}), params);

  // Проверяем, что запрос был успешно принят (202 Accepted или 200 OK)
  check(res, {
    'status is 202 or 201': (r) => r.status === 202 || r.status === 201 || r.status === 200,
  });

  // Задержка от 0.5 до 1.5 секунд между ставками от одного пользователя
  sleep(Math.random() * 1 + 0.5);
}
