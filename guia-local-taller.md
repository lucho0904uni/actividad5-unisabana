# Guía local de verificación del taller

Este documento sirve como guía práctica para **probar localmente** todos los puntos principales del taller de pruebas de carga y rendimiento sobre consultas de multas de tránsito.

---

## 1. Objetivo de esta guía

Verificar de forma local que el repositorio cumple con:

- estructura pedida en `perf/`
- ejecución de escenarios de carga
- documentación del ejercicio
- artefactos de salida
- pipeline conceptual reproducible en entorno local
- cobertura de los puntos evaluados en la rúbrica

---

## 2. Pre-requisitos

Antes de probar localmente, verifica lo siguiente:

### Software requerido
- Node.js 18+
- k6 instalado
- Java 17+
- Maven o `mvnw`
- acceso al servicio de multas o al proyecto Spring Boot local

### Verificaciones rápidas

```bash
node -v
k6 version
java -version
mvn -version
```

Si tu servicio corre localmente, valida que esté disponible. Ejemplo:

```bash
curl "http://localhost:8080/multas/consulta?cedula=12345678"
```

---

## 3. Revisión de estructura del taller

Confirma que el proyecto contiene esta estructura:

```text
perf/
 ├─ scripts/
 ├─ data/
 ├─ results/
 ├─ dashboards/
 ├─ ci/
 └─ README.md
```

### Checklist
- [ ] existe `perf/scripts/`
- [ ] existe `perf/data/`
- [ ] existe `perf/results/`
- [ ] existe `perf/dashboards/`
- [ ] existe `perf/ci/`
- [ ] existe `perf/README.md`
- [ ] existe `README.md` en raíz
- [ ] existe `package.json`
- [ ] existe `defectos.md`

---

## 4. Variables de entorno sugeridas

### Linux / macOS

```bash
export BASE_URL=http://localhost:8080
export API_PATH=/multas/consulta
export REQUEST_METHOD=GET
export TIMEOUT_MS=2000
```

### Windows PowerShell

```powershell
$env:BASE_URL="http://localhost:8080"
$env:API_PATH="/multas/consulta"
$env:REQUEST_METHOD="GET"
$env:TIMEOUT_MS="2000"
```

---

## 5. Prueba local equivalente al pipeline Opción B

La opción B levanta la aplicación Spring Boot y luego ejecuta k6 localmente sobre `localhost`.

### Paso 1: compilar la aplicación

Con wrapper:

```bash
./mvnw -DskipTests clean package
```

Con Maven instalado:

```bash
mvn -DskipTests clean package
```

### Paso 2: levantar la aplicación

Con wrapper:

```bash
./mvnw spring-boot:run
```

Con Maven instalado:

```bash
mvn spring-boot:run
```

### Paso 3: validar healthcheck

```bash
curl http://localhost:8080/actuator/health
```

### Paso 4: validar endpoint funcional

```bash
curl "http://localhost:8080/multas/consulta?cedula=12345678"
```

---

## 6. Pruebas por escenario

### 6.1 Nivel 1 - Smoke

Objetivo: comprobar que el entorno responde.

```bash
npm run test:smoke
```

Validar:
- [ ] el script ejecuta sin fallar
- [ ] se genera `perf/results/smoke.json`
- [ ] no hay error masivo de conexión

### 6.2 Nivel 2 - Baseline

Objetivo: establecer línea base.

```bash
npm run test:baseline
```

Validar:
- [ ] se genera `perf/results/baseline.json`
- [ ] existen métricas de latencia
- [ ] existen métricas de error rate

### 6.3 Nivel 3 - Load

Objetivo: validar carga esperada.

```bash
npm run test:load
```

Validar:
- [ ] se genera `perf/results/load.json`
- [ ] el servicio mantiene respuesta estable
- [ ] los errores no superan el umbral definido

### 6.4 Escenarios extendidos

```bash
npm run test:stress
npm run test:spike
npm run test:soak
```

Validar:
- [ ] se generan `stress.json`, `spike.json` y `soak.json`
- [ ] se observa comportamiento consistente con cada objetivo

---

## 7. Qué revisar en los resultados

En cada archivo JSON de `perf/results/` revisa al menos:

- latencia p95
- latencia p99
- tasa de errores
- duración promedio
- estabilidad general

### Referencias sugeridas del taller

- p95 ≤ 300 ms
- p99 ≤ 800 ms
- error rate < 1%

---

## 8. Validación de documentación

Verifica que el `README.md` principal cubra:

- [ ] objetivo del ejercicio
- [ ] estructura del proyecto
- [ ] conceptos clave
- [ ] herramienta usada
- [ ] alcance funcional
- [ ] modelos de carga
- [ ] SLA / SLO
- [ ] datos de prueba
- [ ] escenarios implementados
- [ ] matriz de pruebas
- [ ] scripts implementados
- [ ] variables de entorno
- [ ] ejecución paso a paso
- [ ] resultados y artefactos
- [ ] integración continua
- [ ] gestión de defectos
- [ ] buenas prácticas
- [ ] conclusión

---

## 9. Validación local del pipeline

Aunque el pipeline corre en GitHub Actions, localmente puedes reproducir lo esencial:

```bash
mkdir -p perf/results
BASE_URL=http://localhost:8080 SCENARIO=smoke k6 run perf/scripts/multas_k6.js -o json=perf/results/smoke.json
BASE_URL=http://localhost:8080 SCENARIO=baseline k6 run perf/scripts/multas_k6.js -o json=perf/results/baseline.json
BASE_URL=http://localhost:8080 SCENARIO=load k6 run perf/scripts/multas_k6.js -o json=perf/results/load.json
```

---

## 10. Registro de defectos

Después de las pruebas, registra hallazgos en `defectos.md`.

Ejemplos de hallazgos:
- latencia alta en consultas por placa
- timeouts en stress
- degradación progresiva en soak
- aumento de errores 5xx bajo spike

---

## 11. Checklist final de auditoría local

### Estructura
- [ ] estructura `perf/` correcta
- [ ] scripts presentes
- [ ] dataset presente
- [ ] resultados documentados
- [ ] pipeline presente

### Escenarios
- [ ] smoke probado
- [ ] baseline probado
- [ ] load probado
- [ ] stress probado
- [ ] spike probado
- [ ] soak probado

### Evidencia
- [ ] JSONs generados en `perf/results/`
- [ ] hallazgos registrados
- [ ] README revisado

### Entrega
- [ ] la solución está alineada con el taller
- [ ] la solución es reproducible localmente
- [ ] la solución puede demostrarse en clase o sustentación

---

## 12. Recomendación de ejecución mínima para entrega

Si no puedes correr todos los escenarios por tiempo, ejecuta como mínimo:

```bash
npm run test:smoke
npm run test:baseline
npm run test:load
```

Y deja documentado:
- resultados observados
- si cumple o no SLO
- principales hallazgos
- acciones de mejora

---

## 13. Conclusión

Con esta guía puedes validar localmente que el repositorio cubre los puntos principales del taller y preparar la evidencia necesaria para la entrega.
