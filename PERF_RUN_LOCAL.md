# Cómo ejecutar las pruebas de rendimiento localmente (VS Code)

Este documento explica cómo reproducir los escenarios de pruebas localmente, tomar capturas de pantalla y guardar artefactos para la entrega del taller.

## Requisitos

- Node.js (v14+)
- k6 (instalado en Windows; se instaló con `winget` en este entorno)
- Git (opcional)
- Visual Studio Code

## Estructura relevante del repositorio

- `perf/scripts/` — scripts k6 (`multas_k6.js`)
- `perf/data/` — datasets (`voter.csv`)
- `perf/results/` — resultados (.json)
- `perf/ci/` — workflow GitHub Actions
- `scenarios/` — helpers y configuración para tests k6

## Archivos útiles añadidos

- `perf/mock-server.js` — mock HTTP para `/multas/consulta` y `/actuator/health` (útil si la app real no está disponible).
- `perf/run-k6-with-mock.ps1` — lanza mock, espera healthcheck y ejecuta k6; detiene el mock al finalizar.

## Cómo ejecutar desde VS Code (paso a paso)

1. Abrir la carpeta del proyecto en VS Code.
2. Abrir una terminal integrada (PowerShell) en VS Code: `Terminal > New Terminal`.
3. Verificar `k6`:

```powershell
k6 version
```

Si `k6` no está disponible, instálalo (ejemplo con winget):

```powershell
winget install --id GrafanaLabs.k6 -e --accept-source-agreements --accept-package-agreements
```

4. Ejecutar las pruebas con mock (recomendado si la app local no está corriendo):

```powershell
# Smoke rápido contra mock
powershell -NoProfile -ExecutionPolicy Bypass -File perf\run-k6-with-mock.ps1 -Port 8081 -Scenario smoke

# Baseline (aprox. 16 minutos):
powershell -NoProfile -ExecutionPolicy Bypass -File perf\run-k6-with-mock.ps1 -Port 8081 -Scenario baseline

# Load (aprox. 32 minutos):
powershell -NoProfile -ExecutionPolicy Bypass -File perf\run-k6-with-mock.ps1 -Port 8081 -Scenario load
```

5. Ejecutar directamente con `k6` (si no quieres usar el mock helper):

```powershell
# $env:BASE_URL='http://localhost:8080'  # o http://localhost:8081 si usas el mock
# $env:DATA_FILE='../data/voter.csv'
# & 'C:\Program Files\k6\k6.exe' run perf/scripts/multas_k6.js --env SCENARIO=smoke -o json=perf/results/smoke.json
```

## Dónde se guardan los resultados

- `perf/results/<scenario>.json` — salida JSON de k6 (ej. `baseline.json`, `load.json`, `smoke.json`).

Usa esos archivos para generar reportes o tomar capturas de pantalla del resumen que `k6` imprime al terminar. También puedes abrir el JSON en VS Code para capturas.

## Recomendaciones para capturas de pantalla

1. Ejecuta el comando en la terminal integrada y, al completarse, toma una captura de la salida final de `k6` (resumen con thresholds y total results).
2. Abre `perf/results/<scenario>.json` en VS Code (Explorer) y toma captura de los campos `metrics` y `checks` para evidencia.
3. Captura la gráfica/tabla en la UI de la herramienta que uses (Grafana o similar) si la integras.

## Qué validar en cada escenario

- Smoke/poquito: quick check de disponibilidad. SLOs básicos.
- Baseline: línea base, p95 ≤ 300ms, p99 ≤ 800ms, error rate < 1%.
- Load: rampa a 200 VUs y sostenimiento; validar estabilidad y error rate.

## Interpretación rápida

- Si `http_req_failed` > 1% → investigar timeouts/conexiones/403.
- Si `p(95)` > 300ms → investigar cuellos (DB, CPU, GC, conexiones).

## Ejecución en CI

- El workflow `perf/ci/perf-tests.yml` ya está configurado para: compilar la app (Maven), levantarla, esperar `http://localhost:8080/actuator/health`, y ejecutar `smoke`, `baseline`, `load`.
- Ajusta variables en el YAML si tu app usa otro puerto o ruta.

## Notas finales

- Las corridas `baseline` y `load` son largas; reserva tiempo y recursos antes de ejecutarlas.
- Para la entrega, adjunta los JSON en `perf/results/`, capturas de la salida de `k6` y breve análisis en `defectos.md` o en la wiki.
