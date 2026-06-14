# Documentación técnica del ejercicio de rendimiento

## Estructura

```text
perf/
 ├─ scripts/                 # scripts k6
 ├─ data/                    # datasets de prueba
 ├─ results/                 # resultados y artefactos
 ├─ dashboards/              # visualización y monitoreo
 ├─ ci/                      # pipelines CI
 └─ README.md                # este documento
```

## Contenido por carpeta

### scripts/
Contiene los scripts de ejecución:
- `multas_k6.js`
- `register_voter_k6.js`

### data/
Contiene el dataset parametrizado:
- `voter.csv`

### results/
Se generan artefactos por escenario:
- `smoke.json`
- `baseline.json`
- `load.json`
- `stress.json`
- `spike.json`
- `soak.json`
- `app.log`

### dashboards/
Espacio para plantillas de observabilidad.

### ci/
Pipeline base para ejecución automatizada con GitHub Actions y k6.

## Pipeline opción B

El pipeline está preparado para el enfoque **opción B**:

1. construir la aplicación Spring Boot dentro del workflow
2. levantar la aplicación localmente en el runner
3. esperar disponibilidad del servicio
4. ejecutar escenarios de k6 contra `http://localhost:8080`
5. publicar artefactos en `perf/results/`

## Niveles implementados en CI

- nivel 1: smoke
- nivel 2: baseline
- nivel 3: load

## Variables de entorno usadas

- **BASE_URL**: URL base del servicio (por defecto `http://localhost:8080`)
- **API_PATH**: ruta del endpoint de consulta (por defecto `/multas/consulta`)
- **TIMEOUT_MS**: timeout en milisegundos para las peticiones (por defecto `2000` → `2000ms`)
- **SCENARIO**: escenario k6 a ejecutar (smoke, baseline, load, stress, spike, soak)

Usar estas variables al ejecutar localmente o en CI para ajustar puerto/ruta/tiempos.

## Requisitos del pipeline

Para que el workflow funcione correctamente, el repositorio debe contener una aplicación Spring Boot con Maven y un endpoint accesible en:

- `http://localhost:8080/multas/consulta`

Idealmente también con healthcheck en:

- `http://localhost:8080/actuator/health`

Si el proyecto usa otro puerto o ruta, deben ajustarse el YAML y las variables.
