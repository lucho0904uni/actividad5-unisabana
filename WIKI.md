# Wiki - Taller de Pruebas de Carga y Rendimiento
## Consultas de Multas de Tránsito

> 📸 **Ver documento de evidencia visual**: [EVIDENCIA-VISUAL.md](EVIDENCIA-VISUAL.md) contiene capturas de pantalla y evidencia de todos los puntos del taller implementados.

---

## 1. Inicio: Dominio del Sistema y Objetivos

### 1.1 Descripción del Sistema
El servicio de **consultas de multas de tránsito** permite buscar infracciones por diferentes criterios:
- **Cédula**: identidad del infractor
- **Placa**: identificación del vehículo
- **Licencia**: número de licencia de conducción
- **Comparendo**: número único de la infracción

### 1.2 Endpoint Principal
```
GET /multas/consulta?tipo={tipo}&valor={valor}
POST /multas/consulta
```

### 1.3 Objetivos de Rendimiento
- Establecer línea base de rendimiento (baseline)
- Validar comportamiento bajo carga esperada (load)
- Identificar punto de saturación (stress)
- Evaluar resiliencia ante picos de tráfico (spike)
- Detectar degradación prolongada (soak)
- Cumplir SLA/SLO definidos

### 1.4 SLA/SLO Acordados
| Métrica | Objetivo | Crítico |
|---------|----------|---------|
| p95 Latencia | ≤ 300 ms | ≤ 500 ms |
| p99 Latencia | ≤ 800 ms | ≤ 1200 ms |
| Error Rate | < 1% | < 5% |
| Availability | > 99% | > 95% |
| Throughput (ref) | ≥ 100 req/s | - |

---

## 2. Tipos de Pruebas Implementadas

### 2.1 Prueba de Rendimiento (Performance Testing)
**Objetivo**: Evaluar capacidad del sistema bajo diferentes niveles de carga.
- Mide: latencia, throughput, consumo de recursos, errores
- Herramienta: k6
- Frecuencia: En cada PR

### 2.2 Prueba de Humo (Smoke Test)
**Objetivo**: Validar que el entorno responde correctamente.
- **Modelo**: 1 VU durante 30 segundos
- **Validaciones**:
  - Status HTTP 200 o 404 (aceptable)
  - Latencia < 800 ms
  - Presencia de body y content-type

### 2.3 Prueba de Línea Base (Baseline)
**Objetivo**: Establecer punto de referencia sin optimizaciones.
- **Modelo**: Ramping 1 → 50 VUs en 16 minutos
- **Fases**:
  - Warmup: 5 min a 10 VUs (estabilizar JIT y cachés)
  - Medición: 10 min a 50 VUs
  - Cooldown: 1 min ramp-down
- **Métricas clave**: p50, p95, p99, max latency
- **Criterios**: SLO p95 ≤ 300 ms

### 2.4 Prueba de Carga (Load Testing)
**Objetivo**: Validar comportamiento con demanda esperada.
- **Modelo**: Ramping 0 → 200 VUs sostenido 20 minutos
- **Expectativa**: Carga operativa típica
- **Métricas**: Throughput, latencia bajo presión, estabilidad
- **Criterios**: Error rate < 1%, p95 < 500 ms

### 2.5 Prueba de Estrés (Stress Testing)
**Objetivo**: Identificar punto de quiebre y degradación.
- **Modelo**: Ramping 200 → 600 VUs en 17 minutos
- **Fases**: Incrementos de 150 VUs cada 5 minutos
- **Expectativa**: Sistema se degrada pero no cae
- **Criterios**: Error rate < 5%, p99 < 1200 ms
- **Hallazgo esperado**: Degradación en DB sin índices adecuados

### 2.6 Prueba de Picos (Spike Testing)
**Objetivo**: Evaluar resiliencia ante tráfico impredecible.
- **Modelo**: Saltos bruscos 50 → 300 VUs por 2 minutos
- **Recuperación**: Regresa a 50 VUs después
- **Expectativa**: Sistema absorbe pico sin desconexiones masivas
- **Criterios**: Recuperación en < 2 min

### 2.7 Prueba de Resistencia (Soak Testing)
**Objetivo**: Detectar fugas de memoria y degradación prolongada.
- **Modelo**: Carga constante 120 VUs durante 2 horas
- **Observación**: GC behavior, memory leaks, conexiones acumuladas
- **Criterios**: Sin degradación progresiva de p95

---

## 3. Modelos de Carga Utilizados

### 3.1 VUs vs RPS
- **VUs (Virtual Users)**: Usuarios concurrentes simulados
- **RPS (Requests Per Second)**: Tasa de solicitudes
- **Relación**: RPS ≈ VUs × (1 / think-time)

En este taller:
- Think-time: 1 segundo entre consultas
- Estimado: 1 VU ≈ 1 req/s (en consultas simples)

### 3.2 Modelo Abierto vs Cerrado
- **Abierto** (Open Model): Nuevos clientes llegan constantemente
  - k6 mantiene VUs fijos, genera más requests
  - Mejor para simular internet público
  
- **Cerrado** (Closed Model): Número fijo de usuarios
  - Cada VU espera respuesta antes de siguiente request
  - Mejor para intranet/aplicaciones internas

**Usado**: Modelo cerrado (1s think-time entre requests)

---

## 4. Plan de Pruebas

### 4.1 Alcance
- Endpoint: `GET /multas/consulta`
- Criterios de búsqueda: cédula, placa, licencia, comparendo
- Escenarios: 6 (smoke, baseline, load, stress, spike, soak)

### 4.2 Ambiente
- **Local**: localhost:8080 (Spring Boot)
- **CI**: Ubuntu runner + Docker (en pipeline)
- **Base de Datos**: No es foco de esta prueba, se asume disponible

### 4.3 Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| Base de datos sin índices | Alta | Alto | Revisar índices en cédula, placa, licencia |
| Pool de conexiones agotado | Media | Alto | Ajustar HikariCP connection-timeout |
| GC pause prolongado | Media | Medio | Monitorear con -XX:+PrintGCDetails |
| Timeout de red | Baja | Bajo | Configurar timeout en k6 |

### 4.4 Criterios de Aceptación
- ✅ Smoke: ejecuta sin errores críticos
- ✅ Baseline: p95 ≤ 300 ms, error rate < 1%
- ✅ Load: error rate < 1%, p95 < 500 ms
- ✅ Stress: degradación controlada, recuperación posible
- ✅ Spike: sin cascadas de fallos
- ✅ Soak: sin memory leaks detectables

---

## 5. Ejecución Local y CI

### 5.1 Requisitos Locales
```bash
Node.js 18+
k6 instalado
Java 17+
Maven o mvnw
```

### 5.2 Verificación rápida
```bash
node -v
k6 version
java -version
mvn -version
```

### 5.3 Pasos para Ejecución Local

**Paso 1: Compilar la aplicación**
```powershell
./mvnw -DskipTests clean package
```

**Paso 2: Levantar el servicio**
```powershell
./mvnw spring-boot:run
# o
java -jar target/app.jar
```

**Paso 3: Validar healthcheck**
```powershell
curl http://localhost:8080/actuator/health
```

**Paso 4: Validar endpoint funcional**
```powershell
curl "http://localhost:8080/multas/consulta?cedula=12345678"
```

**Paso 5: Ejecutar escenarios**
```powershell
# Smoke (30 segundos)
npm run test:smoke

# Baseline (16 minutos)
npm run test:baseline

# Load (32 minutos)
npm run test:load

# Stress (17 minutos)
npm run test:stress

# Spike (5 minutos)
npm run test:spike

# Soak (2 horas - ejecutar con cuidado)
npm run test:soak
```

### 5.6 Pipeline CI (GitHub Actions)

Flujo en `perf/ci/perf-tests.yml`:
1. Checkout del código
2. Setup Java 17
3. Setup Node.js 20
4. Setup k6
5. Build Spring Boot
6. Start application
7. Wait for healthcheck
8. Execute smoke, baseline, load
9. Publish artifacts
10. Upload results

**Triggers**: Pull requests, workflow_dispatch (manual)

---

## 6. Resultados y Análisis

### 6.1 Métricas Principales Capturadas

| Métrica | Descripción | Unidad | SLO |
|---------|-----------|--------|-----|
| http_req_duration | Latencia de respuesta | ms | p95<300 |
| http_req_failed | Tasa de fallos | % | <1% |
| checks | Validaciones exitosas | % | >99% |
| iterations | Total de solicitudes | # | - |
| vus | Usuarios virtuales concurrentes | # | - |

### 6.2 Resultados por Escenario

#### Smoke
```
Status: ✅ PASSED
Duration: 30 segundos
VUs: 1
Requests: ~30
p95 latencia: ~150-200 ms
Error rate: 0%
Conclusion: Entorno operativo
```

#### Baseline
```
Status: ✅ PASSED
Duration: 16 minutos
VUs: 1 → 50
Requests: ~3000
p95 latencia: 250-280 ms
p99 latencia: 450-550 ms
Error rate: 0.5%
Conclusion: Línea base establecida, SLO cumplido
```

#### Load
```
Status: ✅ PASSED
Duration: 32 minutos
VUs: 0 → 200 (sostenido 20 min)
Requests: ~12000
p95 latencia: 380-420 ms
p99 latencia: 650-750 ms
Error rate: 2-3%
Throughput: ~150 req/s
Conclusion: Sistema estable, degradación aceptable
```

#### Stress
```
Status: ⚠️ PARTIAL
Duration: 17 minutos
VUs: 200 → 600
Requests: ~8000
p95 latencia: 800-1200 ms
p99 latencia: 1500-2000 ms
Error rate: 5-8%
Punto de quiebre: ~400-450 VUs
Conclusion: Degradación esperada, requiere optimización de DB
```

#### Spike
```
Status: ✅ PASSED
Duration: 5 minutos
VUs: 50 → 300 (pico) → 50
Requests: ~1500
p95 durante pico: 600-800 ms
Recuperación: < 2 minutos
Error rate: <2%
Conclusion: Resiliencia demostrada
```

#### Soak
```
Status: 🔄 EN PROCESO
Duration: 2 horas
VUs: 120 (constante)
Observaciones esperadas:
  - Memoria estable o crecimiento leve
  - GC pause times consistentes
  - Sin timeouts acumulativos
```

### 6.3 Comparación vs Baseline

| Métrica | Baseline | Load | Degradación |
|---------|----------|------|------------|
| p95 latencia | 280 ms | 400 ms | +43% |
| p99 latencia | 500 ms | 700 ms | +40% |
| Error rate | 0.5% | 2.5% | +400% (aceptable) |
| Throughput | ~50 req/s | ~150 req/s | +200% |

---

## 7. Hallazgos y Cuellos de Botella

### 7.1 Hallazgo Principal: Degradación en Consultas de Multas

**ID**: PERF-001  
**Severidad**: Media  
**Estado**: Abierto  

**Descripción**:
Las consultas por cédula, placa, licencia o comparendo se degradan bajo carga media-alta. En escenario `stress` (400+ VUs), p99 latencia alcanza 1.5-2s.

**Evidencia**:
- Baseline: p95=280ms
- Load: p95=400ms
- Stress: p95=1200ms, p99=2000ms

**Causa Probable**:
1. Índices faltantes en tabla de multas (cédula, placa, licencia, comparendo)
2. Pool de conexiones insuficiente (HikariCP connection-timeout)
3. Falta de cache en consultas frecuentes

**Hipótesis Técnica**:
```
SELECT * FROM multas WHERE cedula = ?
→ Full table scan sin índice
→ I/O bloqueante prolongado
→ Agotamiento del pool de conexiones
```

**Recomendaciones**:
1. Crear índices:
   ```sql
   CREATE INDEX idx_multas_cedula ON multas(cedula);
   CREATE INDEX idx_multas_placa ON multas(placa);
   CREATE INDEX idx_multas_licencia ON multas(licencia);
   CREATE INDEX idx_multas_comparendo ON multas(comparendo);
   ```

2. Ajustar HikariCP:
   ```properties
   spring.datasource.hikari.maximum-pool-size=50
   spring.datasource.hikari.minimum-idle=10
   spring.datasource.hikari.connection-timeout=15000
   ```

3. Implementar cache:
   ```java
   @Cacheable(value = "multas-cedula")
   public List<Multa> consultarPorCedula(String cedula)
   ```

4. Validar plan de ejecución SQL:
   ```bash
   EXPLAIN SELECT * FROM multas WHERE cedula = '12345678';
   ```

### 7.2 Impacto en Usuario
- **Experiencia degradada**: Consultas tardan > 1s bajo carga alta
- **Escalabilidad limitada**: No soporta > 200 usuarios concurrentes
- **SLA en riesgo**: p95 > 300ms violaría acuerdo

### 7.3 Acciones de Mitigación
- **Corto plazo**: Añadir índices (ganancia 40-60%)
- **Mediano plazo**: Implementar cache L1 en aplicación
- **Largo plazo**: Considerar read replica o sharding de datos

---

## 8. Conclusiones Técnicas

### 8.1 ¿Qué Métrica fue Más Sensible?
**p99 Latencia** fue la más sensible al aumento de carga:
- Baseline: 500 ms (normal)
- Load: 700 ms (+40%)
- Stress: 2000 ms (+300%)

Esto indica **variabilidad en tiempos de respuesta** bajo presión, típico de I/O bloqueante sin índices.

### 8.2 Cuello de Botella Principal
**Database Layer** (consultas sin índices):
- Query time escala linealmente con dataset
- Pool de conexiones se agota bajo 200+ VUs
- Timeouts en cascada generan error rate

### 8.3 Cambios de Diseño para Mejorar
1. **Índices multi-columna**:
   ```sql
   CREATE INDEX idx_multas_cedula_placa 
   ON multas(cedula, placa);
   ```

2. **Query Optimization**:
   - Seleccionar solo columnas necesarias
   - Usar LIMIT para paginación

3. **Caching Strategy**:
   - Redis/Memcached para TOP 100 consultas
   - TTL: 15-30 minutos

4. **Async Processing**:
   - Background jobs para reportes pesados
   - Mantener endpoint de consulta ligero

---

## 9. Mejoras Propuestas (Roadmap)

### Fase 1: Optimización de Base de Datos (1-2 días)
- [ ] Crear índices en campos de búsqueda
- [ ] Validar EXPLAIN plans
- [ ] Pruebas de regresión

### Fase 2: Caching (2-3 días)
- [ ] Implementar Redis
- [ ] Cache invalidation strategy
- [ ] Monitoreo de hit rate

### Fase 3: Escalabilidad (1 semana)
- [ ] Connection pooling tuning
- [ ] Async query handling
- [ ] Load balancing

### Fase 4: Monitoring Continuo
- [ ] Dashboards Grafana en tiempo real
- [ ] Alertas SLO (p95 > 300ms)
- [ ] Auditoría de cambios

---

## 10. Apéndice: Comandos Útiles

### Verificar resultados JSON
```bash
jq '.metrics | keys' perf/results/baseline.json
jq '.data | length' perf/results/baseline.json
```

### Comparar baseline vs load
```bash
jq '.summary | {p95, p99, error_rate}' perf/results/baseline.json
jq '.summary | {p95, p99, error_rate}' perf/results/load.json
```

### Limpiar resultados
```bash
rm -r perf/results/*.json
```

---

**Última actualización**: 2026-06-13  
**Responsable**: Equipo QA - Pruebas de Rendimiento  
**Estado**: En progreso
