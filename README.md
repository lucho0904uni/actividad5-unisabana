# Actividad 5 - Taller de pruebas de carga y rendimiento

Este repositorio contiene un ejercicio completo de **pruebas de carga y rendimiento** sobre un servicio de **consultas de multas de tránsito**, estructurado según los puntos solicitados en el taller y dejando todo en la **rama principal (`main`)**.

## 1. Objetivo del ejercicio

Diseñar, documentar y ejecutar escenarios de rendimiento para medir el comportamiento del sistema cuando se consultan multas de tránsito por diferentes criterios, por ejemplo:

- **cédula**
- **placa**
- **licencia**
- **comparendo**

El enfoque del ejercicio es evaluar:

- latencia
- throughput
- tasa de errores
- estabilidad bajo carga
- degradación ante estrés
- recuperación ante picos
- estabilidad prolongada

---

## 2. Estructura del proyecto

La solución fue organizada con la estructura pedida por el taller:

```text
perf/
 ├─ scripts/                 # .jmx (JMeter), .js (k6) o .scala (Gatling)
 ├─ data/                    # datos de prueba (CSV, JSON)
 ├─ results/                 # reportes y artefactos (HTML/CSV/JTL)
 ├─ dashboards/              # plantillas de dashboards (Grafana, etc.)
 ├─ ci/                      # pipelines (GitHub Actions/Jenkins/GitLab CI)
 └─ README.md                # documentación técnica del ejercicio
```

Además, en la raíz del repositorio se dejaron:

- `README.md`: documento principal del ejercicio
- `package.json`: scripts de ejecución
- `defectos.md`: registro de hallazgos de rendimiento

---

## 3. Conceptos clave del taller aplicados

### Prueba de rendimiento
Evalúa la capacidad del sistema bajo distintos niveles de demanda, observando tiempos de respuesta, throughput, consumo de recursos y errores.

### Prueba de carga
Verifica el comportamiento del sistema con una carga esperada u operativa.

### Prueba de estrés
Empuja el sistema más allá de su capacidad habitual para identificar su punto de quiebre y comportamiento degradado.

### Prueba de picos (spike)
Aplica incrementos bruscos de tráfico para evaluar resiliencia y recuperación.

### Prueba de resistencia (soak)
Mantiene carga prolongada para detectar degradación, fugas de memoria o acumulación de recursos.

### SLA / SLO / SLI
Se definieron objetivos medibles para evaluar la calidad del servicio.

---

## 4. Herramienta utilizada

Se usa **k6** como herramienta principal porque:

- funciona bien desde línea de comandos
- permite versionar scripts fácilmente
- se integra con CI/CD
- genera métricas claras para reportes

> Para instalar k6 en Linux (Debian/Ubuntu), la documentación oficial indica agregar el repositorio de k6 con su llave GPG y luego instalarlo con `apt-get install k6`; también existe una acción oficial de Grafana para GitHub Actions (`grafana/setup-k6-action`) que simplifica la instalación en CI. citeturn0search1turn0search2

---

## 5. Alcance funcional

El ejercicio está orientado a consultas de multas de tránsito sobre un endpoint configurable mediante variables de entorno.

### Consultas soportadas por GET

- `/multas/consulta?cedula=12345678`
- `/multas/consulta?placa=ABC123`
- `/multas/consulta?licencia=LIC001122`
- `/multas/consulta?comparendo=CMP-2026-0001`

### Consultas soportadas por POST

```json
{
  "tipo": "cedula",
  "valor": "12345678"
}
```

---

## 6. Modelos de carga aplicados

Se trabaja principalmente con un **modelo cerrado (closed model)** basado en **usuarios virtuales (VUs)**.

Esto permite controlar:

- número de usuarios concurrentes
- ramp-up
- carga sostenida
- descenso controlado

---

## 7. SLA / SLO sugeridos

Estos valores pueden ajustarse según el entorno real:

| Métrica | Objetivo |
|---|---|
| p95 latencia | ≤ 300 ms |
| p99 latencia | ≤ 800 ms |
| error rate | < 1% |
| throughput base | ≥ 100 req/s |

### Criterios de aceptación

- aprobar si `p95 <= 300 ms`
- aprobar si `p99 <= 800 ms`
- aprobar si `error rate < 1%`
- reprobar si hay degradación severa, timeouts o inestabilidad sostenida

---

## 8. Datos de prueba

Se incluye un dataset en:

- `perf/data/voter.csv`

Este archivo contiene más de 200 registros parametrizados con datos de ejemplo para evitar que todas las consultas sean idénticas y reducir el riesgo de una “caché feliz”.

Campos incluidos:

- `id`
- `name`
- `age`
- `gender`
- `alive`
- `tipo`
- `valor`

---

## 9. Escenarios de prueba implementados

Se implementaron **varios escenarios de carga**, alineados con el taller.

### 9.1 Smoke
Valida rápidamente que el entorno responde y que el script está correctamente configurado.

- **Modelo**: constant-vus
- **Carga**: 1 VU
- **Duración**: 1 minuto
- **Objetivo**: validar disponibilidad y respuesta inicial

### 9.2 Baseline
Establece una línea base de rendimiento para comparar optimizaciones o degradaciones futuras.

- **Modelo**: ramping-vus
- **Duración**: 5 min de calentamiento + 10 min a 50 VUs + 1 min de descenso
- **Objetivo**: medir p50, p95, p99 y error rate base

### 9.3 Load
Representa la carga operativa esperada del sistema.

- **Modelo**: ramping-vus
- **Duración**: rampa de 0 a 200 VUs en 10 min + 20 min sostenidos + 2 min de descenso
- **Objetivo**: medir estabilidad bajo demanda normal/esperada

### 9.4 Stress
Empuja el sistema hacia niveles altos de utilización para identificar el punto de quiebre.

- **Modelo**: ramping-vus
- **Duración**: crecimiento progresivo hasta 600 VUs
- **Objetivo**: detectar saturación, aumento de latencias y errores

### 9.5 Spike
Simula un incremento brusco de tráfico para evaluar elasticidad y recuperación.

- **Modelo**: ramping-vus
- **Duración**: salto de 50 a 300 VUs, sostenimiento corto y recuperación
- **Objetivo**: evaluar tolerancia a ráfagas repentinas

### 9.6 Soak
Mantiene una carga prolongada para detectar fugas o degradaciones acumulativas.

- **Modelo**: constant-vus
- **Carga**: 120 VUs
- **Duración**: 2 horas
- **Objetivo**: revisar estabilidad prolongada

---

## 10. Matriz de pruebas de rendimiento

| Escenario | Modelo | Duración | SLO | Resultado esperado | Artefacto |
|---|---|---|---|---|---|
| Smoke | 1 VU | 1 min | disponibilidad básica | Responde correctamente | `perf/results/smoke.json` |
| Baseline | 50 VUs | 15 min aprox. | p95 < 300 ms | Línea base medible | `perf/results/baseline.json` |
| Load | 0→200 VUs | 30 min aprox. | p95 < 500 ms | Estabilidad bajo carga | `perf/results/load.json` |
| Stress | 200→600 VUs | 15+ min | error < 1% idealmente | Punto de quiebre | `perf/results/stress.json` |
| Spike | 50→300 VUs | 4–5 min | recuperación estable | Resiliencia | `perf/results/spike.json` |
| Soak | 120 VUs | 2 h | estabilidad sostenida | Sin degradación grave | `perf/results/soak.json` |

---

## 11. Scripts implementados

### Script principal
- `perf/scripts/multas_k6.js`

Este script:

- toma registros aleatorios del CSV
- consulta multas por distintos criterios
- soporta `GET` y `POST`
- valida código HTTP
- valida latencia
- registra métricas de k6

### Script adicional del taller
- `perf/scripts/register_voter_k6.js`

Se deja como referencia complementaria para escenarios de payload tipo registro.

---

## 12. Variables de entorno

El ejercicio soporta estas variables:

- `BASE_URL`: URL base del servicio
- `API_PATH`: ruta del endpoint
- `REQUEST_METHOD`: `GET` o `POST`
- `AUTH_TOKEN`: token opcional
- `SCENARIO`: `smoke | baseline | load | stress | spike | soak`
- `TIMEOUT_MS`: timeout HTTP en milisegundos
- `DATA_FILE`: dataset CSV a utilizar

### Ejemplo de configuración

```bash
export BASE_URL=http://localhost:8080
export API_PATH=/multas/consulta
export REQUEST_METHOD=GET
export SCENARIO=baseline
export TIMEOUT_MS=2000
```

En Windows PowerShell:

```powershell
$env:BASE_URL="http://localhost:8080"
$env:API_PATH="/multas/consulta"
$env:REQUEST_METHOD="GET"
$env:SCENARIO="baseline"
$env:TIMEOUT_MS="2000"
```

---

## 13. Ejecución paso a paso

### 13.1 Instalar dependencias

```bash
npm install
```

### 13.2 Ejecutar smoke

```bash
npm run test:smoke
```

### 13.3 Ejecutar baseline

```bash
npm run test:baseline
```

### 13.4 Ejecutar carga

```bash
npm run test:load
```

### 13.5 Ejecutar estrés

```bash
npm run test:stress
```

### 13.6 Ejecutar spike

```bash
npm run test:spike
```

### 13.7 Ejecutar soak

```bash
npm run test:soak
```

---

## 14. Resultados y artefactos

Los resultados de cada corrida se almacenan en:

- `perf/results/`

Artefactos esperados:

- `smoke.json`
- `baseline.json`
- `load.json`
- `stress.json`
- `spike.json`
- `soak.json`

Si se desea complementar, el proyecto puede ampliarse con:

- reportes HTML
- artefactos CSV/JTL
- dashboards de Grafana
- integración con Prometheus

---

## 15. Integración continua

Se deja un pipeline base en:

- `perf/ci/perf-tests.yml`

Objetivo del pipeline:

- ejecutar escenarios clave en PR o de forma manual
- generar artefactos
- servir como base para gates de calidad

### Recomendación de uso en CI

- correr `smoke`, `baseline` y `load` en PR
- correr `stress` y `soak` on-demand
- fallar el pipeline si se incumplen SLOs

> Grafana mantiene acciones oficiales para GitHub Actions, entre ellas `grafana/setup-k6-action`, pensadas para instalar y ejecutar k6 en CI/CD de forma más simple que una instalación manual por APT. citeturn0search2turn0search11

---

## 16. Gestión de defectos

Se documentó un hallazgo inicial en:

- `defectos.md`

Este archivo permite registrar:

- descripción del defecto
- evidencia
- hipótesis técnica
- impacto
- estado
- acción sugerida

---

## 17. Buenas prácticas aplicadas

- parametrización de datos
- separación por carpetas según tipo de artefacto
- escenarios versionados
- documentación reproducible
- umbrales de validación en k6
- estructura preparada para CI/CD

---

## 18. Revisión frente al taller

### Cumplimientos actuales

- estructura `perf/` solicitada
- varios escenarios de carga
- script principal de k6 versionado
- dataset de prueba
- README principal bien estructurado
- pipeline CI incluido
- archivo de defectos incluido

### Ajustes pendientes para una entrega más fuerte

1. agregar resultados reales de ejecución en `perf/results/`
2. complementar con evidencia visual o reportes HTML si el docente lo pide
3. ajustar validaciones funcionales al contrato real del API
4. convertir el pipeline desde instalación manual a la acción oficial de k6 para mayor alineación tecnológica
5. si el taller exige gates estrictos, agregar validación explícita de umbrales y fallo controlado del pipeline

---

## 19. Conclusión

Este repositorio ya queda organizado para cumplir con el taller, incluyendo:

- estructura pedida
- varios escenarios de carga
- documentación en README
- datos de prueba
- pipeline base
- matriz de escenarios
- registro de defectos

La base ya está lista para ejecutar, medir, documentar resultados y completar la entrega académica.
