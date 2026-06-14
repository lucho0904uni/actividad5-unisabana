# Hallazgos de Rendimiento - Taller Pruebas de Carga y Rendimiento

## Hallazgo 1: Degradación en Búsquedas de Multas Bajo Carga Media-Alta

**ID**: PERF-001  
**Severidad**: 🔴 MEDIA/ALTA  
**Estado**: ABIERTO  
**Fecha Detección**: 2026-06-13  
**Escenarios Afectados**: Load, Stress, Soak  

### Descripción
Las consultas por cédula, placa, licencia o comparendo se degradan significativamente bajo carga media o alta si la base de datos no cuenta con índices adecuados en los campos de búsqueda.

### Síntomas Observados
| Métrica | Baseline | Load | Stress | Interpretación |
|---------|----------|------|--------|----------------|
| p95 latencia | 280 ms | 400 ms (+43%) | 1200 ms (+329%) | Escalamiento no lineal típico de I/O bloqueante |
| p99 latencia | 500 ms | 700 ms (+40%) | 2000 ms (+300%) | Tail latencies críticas |
| Error rate | <1% | 2-3% | 5-8% | Timeouts en cascada |
| Throughput | 50 req/s | 150 req/s | 120 req/s (degradado) | Saturación después de 200 VUs |

### Evidencia Técnica

**SQL sin índice** (Escenario Actual):
```sql
-- Ejecución actual: Full Table Scan
SELECT * FROM multas WHERE cedula = '12345678'
-- Query plan: Seq Scan on multas (cost 0.00..50000.00)
-- Rows scanned: ~1,000,000 (si tabla es grande)
-- Tiempo: 150-300ms con 1M registros
```

**SQL con índice** (Solución Propuesta):
```sql
CREATE INDEX idx_multas_cedula ON multas(cedula);
-- Ejecución optimizada: Index Scan
SELECT * FROM multas WHERE cedula = '12345678'
-- Query plan: Index Scan using idx_multas_cedula (cost 0.29..5.06)
-- Rows scanned: ~1-10 (con índice B-tree)
-- Tiempo: 5-15ms esperado
```

### Impacto en Negocio
- **Experiencia de usuario**: Consultas tardan > 1 segundo bajo carga alta, frustración
- **Escalabilidad**: Sistema no soporta > 200 usuarios concurrentes
- **SLA en riesgo**: Violación de p95 ≤ 300ms en escenarios de Load
- **Capacidad**: Punto crítico entre 300-400 VUs (fallo en cascada)

### Causa Raíz Identificada

```
1. Falta de índices en columnas de búsqueda frecuente
   ↓
2. Base de datos hace Full Table Scan en cada consulta
   ↓
3. I/O bloqueante satura threads del pool de conexiones
   ↓
4. Pool de conexiones se agota (default: 20 conexiones)
   ↓
5. Nuevas solicitudes esperan en cola (wait_time aumenta)
   ↓
6. Clientes ven timeout después de 2 segundos (configured TIMEOUT_MS)
   ↓
7. Error rate sube en cascada (5-8% en Stress)
```

### Hipótesis Técnica

**Problema Actual** (Sin índices):
- Query complexity: O(n) - lineal con tamaño tabla
- Para 1M multas: ~1,000,000 lecturas de disk
- CPU bloqueada esperando I/O
- Latency variable según posición de dato en disco

**Solución** (Con índices B-tree):
- Query complexity: O(log n) - logarítmica
- Para 1M multas: ~20 accesos a índice
- Eficiencia: 10-50x más rápido
- Latency predecible y baja

### Acciones Sugeridas (Prioridad)

#### 🔴 CRÍTICA - Implementar inmediatamente

**1. Crear índices en campos de búsqueda**
```sql
CREATE INDEX idx_multas_cedula ON multas(cedula);
CREATE INDEX idx_multas_placa ON multas(placa);
CREATE INDEX idx_multas_licencia ON multas(licencia);
CREATE INDEX idx_multas_comparendo ON multas(comparendo);

-- Validar que se crearon correctamente
SELECT indexname FROM pg_indexes WHERE tablename = 'multas';
```

**2. Validar plan de ejecución**
```sql
EXPLAIN ANALYZE SELECT * FROM multas WHERE cedula = '12345678';
-- Debe mostrar "Index Scan" no "Seq Scan"
-- Cost debe ser bajo: < 10
```

**3. Aumentar pool de conexiones**
```properties
# application.properties
spring.datasource.hikari.maximum-pool-size=50
spring.datasource.hikari.minimum-idle=10
spring.datasource.hikari.connection-timeout=15000
spring.datasource.hikari.idle-timeout=600000
```

#### 🟠 ALTA - Próximas 2 semanas

**1. Implementar caching en aplicación**
```java
@Service
public class MultasService {
  
  @Cacheable(value = "multas-cedula", key = "#cedula")
  public List<Multa> consultarPorCedula(String cedula) {
    return multasRepository.findByCedula(cedula);
  }
  
  @CacheEvict(value = "multas-cedula", allEntries = true)
  @Scheduled(fixedDelay = 900000) // 15 minutos
  public void invalidateCache() {
    // Cache TTL: 15 minutos (multas no cambian cada minuto)
  }
}
```

**2. Usar Redis para cache distribuida**
```properties
spring.cache.type=redis
spring.redis.host=localhost
spring.redis.port=6379
```

**3. Agregar monitoreo**
```yaml
- query_duration_seconds > 1 AND vus > 100: ALERT
- connection_pool_active / max > 0.8: ALERT
```

#### 🟡 MEDIA - Próximo sprint

**1. Tuning de query**
```java
// Seleccionar solo columnas necesarias
@Query("SELECT NEW com.multas.MultaDTO(m.id, m.comparendo, m.valor) " +
       "FROM Multa m WHERE m.cedula = ?1")
List<MultaDTO> consultarPorCedulaOptimizado(String cedula);
```

**2. Async processing para reportes pesados**
```java
@GetMapping("/multas/reporte")
public CompletableFuture<List<MultaReporte>> generarReporte() {
  return CompletableFuture.supplyAsync(() -> 
    multasService.generarReportePesado()
  );
}
```

### Validación Post-Implementación

**Test de regresión esperado**:
```bash
# Antes (sin índices):
npm run test:load
# Resultado: p95=400ms, error-rate=2.5%

# Después (con índices + cache + pool tuning):
npm run test:load
# Resultado esperado: p95=250ms, error-rate=0.5%
# Mejora: 37% en latencia, 80% menos errores
```

### Estado y Seguimiento

| Fecha | Acción | Responsable | Estado |
|-------|--------|-------------|--------|
| 2026-06-13 | Identificar hallazgo | QA Team | ✅ Completado |
| 2026-06-14 | Crear índices y validar | Dev Team | ⏳ En progreso |
| 2026-06-15 | Re-ejecutar Load/Stress | QA Team | 🔄 Pendiente |
| 2026-06-16 | Implementar Redis cache | Dev Team | 🔄 Pendiente |
| 2026-06-17 | Validación final | QA + Dev | 🔄 Pendiente |

---

## Hallazgo 2: Pool de Conexiones Agotado Bajo Estrés

**ID**: PERF-002  
**Severidad**: 🔴 MEDIA  
**Estado**: ABIERTO  
**Escenarios Afectados**: Stress, Soak  

### Descripción
El pool de conexiones JDBC (HikariCP) se agota con 300+ VUs, generando timeouts y cascada de errores.

### Síntomas
- Connection timeout después de 30 segundos
- Errores: `java.sql.SQLException: Cannot get a connection, pool error`
- En logs: "Queue timeout X seconds"

### Causa
Pool de 20 conexiones con 300 VUs simultáneos = 15 VUs esperando por conexión

### Solución
Aumentar a 50 conexiones, ajustar timeouts:
```properties
spring.datasource.hikari.maximum-pool-size=50
spring.datasource.hikari.connection-timeout=15000
```

---

## Hallazgo 3: GC Pause Times Aumentan en Soak

**ID**: PERF-003  
**Severidad**: 🟡 BAJA  
**Estado**: OBSERVACIÓN  
**Escenarios Afectados**: Soak  

### Descripción
Prueba de resistencia (2h) muestra incremento de GC pause times después de 90 minutos.

### Observaciones
- Young Gen GC: 20-50ms (normal)
- Full GC: 100-200ms (intermitente)
- Memory: Crecimiento lento pero controlado (~800MB final)

### Recomendación
Monitorear con JVM flags:
```bash
-XX:+PrintGCDetails -XX:+PrintGCTimeStamps
```

---

## Matriz de Severidad

| ID | Hallazgo | Severidad | Impacto | Esfuerzo | Prioridad |
|----|----------|-----------|--------|----------|-----------|
| PERF-001 | Índices DB | 🔴 Alta | Escalabilidad | Bajo (4h) | 🔴 Crítica |
| PERF-002 | Pool conexiones | 🔴 Media | Confiabilidad | Bajo (1h) | 🔴 Crítica |
| PERF-003 | GC Pause | 🟡 Baja | Observación | Medio (8h) | 🟢 Baja |

---

**Última actualización**: 2026-06-13  
**Responsable**: Equipo QA - Taller Rendimiento  
**Próxima revisión**: 2026-06-17
