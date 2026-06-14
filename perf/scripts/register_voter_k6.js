import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8087';
const API_PATH = __ENV.API_PATH || '/multas/consulta';
const SCENARIO = __ENV.SCENARIO || 'baseline';
const TIMEOUT_MS = Number(__ENV.TIMEOUT_MS || 2000);
const DATA_FILE = __ENV.DATA_FILE || 'perf/data/voter.csv';

const rows = new SharedArray('register-data', function () {
  const csv = open(DATA_FILE).trim().split('\n');
  const headers = csv[0].split(',');
  return csv.slice(1).map((line) => {
    const values = line.split(',');
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index];
      return acc;
    }, {});
  });
});

const scenarios = {
  baseline: {
    executor: 'ramping-vus',
    startVUs: 1,
    stages: [
      { duration: '5m', target: 10 },
      { duration: '10m', target: 50 },
      { duration: '1m', target: 0 },
    ],
  },
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '10m', target: 200 },
      { duration: '20m', target: 200 },
      { duration: '2m', target: 0 },
    ],
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 200,
    stages: [
      { duration: '5m', target: 300 },
      { duration: '5m', target: 450 },
      { duration: '5m', target: 600 },
      { duration: '2m', target: 0 },
    ],
  },
};

export const options = {
  scenarios: {
    [SCENARIO]: scenarios[SCENARIO] || scenarios.baseline,
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300', 'p(99)<800'],
    checks: ['rate>0.99'],
  },
};

function pickRow() {
  return rows[Math.floor(Math.random() * rows.length)];
}

export default function () {
  const item = pickRow();
  const payload = JSON.stringify({
    name: item.name,
    id: Number(item.id),
    age: Number(item.age),
    gender: item.gender,
    alive: item.alive === 'true',
  });

  const response = http.post(`${BASE_URL}${API_PATH}`, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: `${TIMEOUT_MS}ms`,
  });

  check(response, {
    'status 200': (r) => r.status === 200,
    'latencia < 800 ms': (r) => r.timings.duration < 800,
    'body presente': (r) => typeof r.body !== 'undefined',
  });

  sleep(1);
}
