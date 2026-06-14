import { config } from './config.js';
import { SharedArray } from 'k6/data';

export const consultas = new SharedArray('consultas', function () {
  return JSON.parse(open('../data/consultas.json'));
});

export function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (config.authToken) {
    headers.Authorization = `Bearer ${config.authToken}`;
  }

  return headers;
}

export function buildConsulta() {
  const item = consultas[Math.floor(Math.random() * consultas.length)];
  return item;
}

export function buildUrl(baseUrl, apiPath, consulta) {
  const query = `${encodeURIComponent(consulta.tipo)}=${encodeURIComponent(consulta.valor)}`;
  return `${baseUrl}${apiPath}?${query}`;
}

export function buildBody(consulta) {
  return JSON.stringify({
    tipo: consulta.tipo,
    valor: consulta.valor,
  });
}
