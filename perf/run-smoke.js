const http = require('http');
const fs = require('fs');
const { performance } = require('perf_hooks');

const baseUrl = process.env.BASE_URL || 'http://localhost:8087';
const apiPath = process.env.API_PATH || '/multas/consulta';

const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'consultas.json'), 'utf8'));

async function doRequest(tipo, valor) {
  const url = new URL(`${baseUrl}${apiPath}`);
  url.searchParams.set(tipo, valor);

  return new Promise((resolve) => {
    const start = performance.now();
    http.get(url.toString(), (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const duration = performance.now() - start;
        resolve({ status: res.statusCode, duration: Math.round(duration), body: Buffer.concat(chunks).toString() });
      });
    }).on('error', (err) => {
      const duration = performance.now() - start;
      resolve({ status: 0, duration: Math.round(duration), error: String(err) });
    });
  });
}

(async function main() {
  console.log(`Running smoke requests against ${baseUrl}${apiPath}`);
  for (const item of data) {
    const res = await doRequest(item.tipo, item.valor);
    if (res.status === 200) {
      console.log(`OK ${item.tipo}=${item.valor} ${res.duration}ms`);
    } else {
      console.log(`ERR ${item.tipo}=${item.valor} status=${res.status} ${res.duration}ms ${res.error || ''}`);
    }
  }
  console.log('Smoke run complete');
})();
