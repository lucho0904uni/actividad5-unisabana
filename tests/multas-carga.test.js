import http from 'k6/http';
import { check, sleep } from 'k6';
import { config } from '../scenarios/config.js';
import { buildConsulta, buildUrl, buildBody, getHeaders } from '../scenarios/helpers.js';

const scenarioName = __ENV.SCENARIO || 'smoke';

export const options = {
  thresholds: config.thresholds,
  scenarios: {
    [scenarioName]: config.scenarios[scenarioName] || config.scenarios.smoke,
  },
};

export default function () {
  const consulta = buildConsulta();
  const headers = getHeaders();

  let response;

  if (config.requestMethod === 'POST') {
    response = http.post(`${config.baseUrl}${config.apiPath}`, buildBody(consulta), {
      headers,
      timeout: config.timeout,
    });
  } else {
    response = http.get(buildUrl(config.baseUrl, config.apiPath, consulta), {
      headers,
      timeout: config.timeout,
    });
  }

  check(response, {
    'status es 200 o 404 controlado': (r) => [200, 404].includes(r.status),
    'tiempo de respuesta < 2s': (r) => r.timings.duration < 2000,
    'content-type informado': (r) => !!r.headers['Content-Type'],
  });

  sleep(1);
}
