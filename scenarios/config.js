export const config = {
  baseUrl: __ENV.BASE_URL || 'http://localhost:8087',
  apiPath: __ENV.API_PATH || '/multas/consulta',
  requestMethod: (__ENV.REQUEST_METHOD || 'GET').toUpperCase(),
  authToken: __ENV.AUTH_TOKEN || '',
  // timeout is expressed as a string with unit (k6 accepts e.g. '2000ms' or '30s')
  timeout: `${Number(__ENV.TIMEOUT_MS || 2000)}ms`,
  // Align thresholds with workshop SLOs: p95 <= 300ms, p99 <= 800ms, errors < 1%
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300', 'p(99)<800'],
    checks: ['rate>0.99'],
  },
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
    },
    media: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 5 },
        { duration: '2m', target: 15 },
        { duration: '2m', target: 25 },
        { duration: '1m', target: 0 },
      ],
    },
    spike: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '30s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 5 },
        { duration: '30s', target: 0 },
      ],
    },
    stress: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 30 },
        { duration: '2m', target: 60 },
        { duration: '2m', target: 80 },
        { duration: '1m', target: 0 },
      ],
    },
  },
};
