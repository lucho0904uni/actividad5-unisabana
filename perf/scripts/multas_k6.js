import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Configuration from environment variables
const SCENARIO = __ENV.SCENARIO || 'smoke';
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8087';
const API_PATH = __ENV.API_PATH || '/multas/consulta';
const REQUEST_METHOD = (__ENV.REQUEST_METHOD || 'GET').toUpperCase();
const TIMEOUT_MS = Number(__ENV.TIMEOUT_MS || 2000);
const DATA_FILE = __ENV.DATA_FILE || '../../data/consultas.json';

// Load test data from JSON file
const consultas = new SharedArray('consultas-data', function () {
  return JSON.parse(open(DATA_FILE));
});

// Define all scenarios with consistent configuration
const scenarios = {
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '30s',
  },
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
  spike: {
    executor: 'ramping-vus',
    startVUs: 50,
    stages: [
      { duration: '1m', target: 50 },
      { duration: '30s', target: 300 },
      { duration: '2m', target: 300 },
      { duration: '1m', target: 50 },
      { duration: '1m', target: 0 },
    ],
  },
  soak: {
    executor: 'constant-vus',
    vus: 120,
    duration: '2h',
  },
};

// Define SLA/SLO thresholds aligned with requirements
const thresholds = {
  http_req_failed: ['rate<0.01'],           // Error rate < 1%
  http_req_duration: ['p(95)<300', 'p(99)<800'], // p95 <= 300ms, p99 <= 800ms
  checks: ['rate>0.99'],                    // Checks > 99%
};

export const options = {
  scenarios: {
    [SCENARIO]: scenarios[SCENARIO] || scenarios.smoke,
  },
  thresholds,
};

function pickRow() {
  return consultas[Math.floor(Math.random() * consultas.length)];
}

function buildHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (__ENV.AUTH_TOKEN) {
    headers.Authorization = `Bearer ${__ENV.AUTH_TOKEN}`;
  }

  return headers;
}

function buildUrl(item) {
  const query = `${encodeURIComponent(item.tipo)}=${encodeURIComponent(item.valor)}`;
  return `${BASE_URL}${API_PATH}?${query}`;
}

function buildBody(item) {
  return JSON.stringify({
    tipo: item.tipo,
    valor: item.valor,
  });
}

export default function () {
  const item = pickRow();
  const params = {
    headers: buildHeaders(),
    timeout: `${TIMEOUT_MS}ms`,
  };

  let response;

  if (REQUEST_METHOD === 'POST') {
    response = http.post(`${BASE_URL}${API_PATH}`, buildBody(item), params);
  } else {
    response = http.get(buildUrl(item), params);
  }

  check(response, {
    'status permitido': (r) => [200, 404].includes(r.status),
    'latencia individual < 800 ms': (r) => r.timings.duration < 800,
    'respuesta con body': (r) => typeof r.body !== 'undefined',
    'content-type presente': (r) => {
      return !!(r.headers['Content-Type'] || r.headers['content-type']);
    },
  });

  sleep(1);
}
