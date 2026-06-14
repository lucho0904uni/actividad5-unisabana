# Guía de Pruebas por Punto del Taller

Esta guía describe cómo verificar cada punto del taller de pruebas de carga y rendimiento con el proyecto actual. Está pensada para documentar cada punto con evidencias visuales usando Visual Studio Code.

---

## 1. Preparar el entorno en Visual Studio Code

1. Abre el proyecto en Visual Studio Code:
   - `File > Open Folder...`
   - Selecciona `actividad5-carga-main`
2. Abre el terminal integrado:
   - `Terminal > New Terminal`
   - Confirma que el terminal está en la carpeta raíz del proyecto.
3. Verifica el entorno:
   ```powershell
   node -v
   k6 version
   java -version
   mvn -version
   ```
4. Si falta `k6`, instálalo según tu sistema operativo:
   - Windows: https://grafana.com/docs/k6/latest/get-started/installation/
   - Linux/macOS: usar paquete oficial o instalador.

> Sugerencia: toma un screenshot del terminal con las versiones y guárdalo junto a la documentación.

---

## 2. Punto 1: Verificar la estructura del taller

### Qué revisar
- `perf/scripts/`
- `perf/data/`
- `perf/results/`
- `perf/dashboards/`
- `perf/ci/`
- `perf/README.md`
- `README.md`
- `package.json`
- `defectos.md`

### Cómo verificar
1. En el Explorador de VS Code, expande `perf/`.
2. Confirma que cada carpeta y archivo existe.
3. Abre `perf/README.md` y verifica que describe la estructura.

### Evidencia
- Captura la vista del Explorador con `perf/` expandido.
- Captura `perf/README.md` abierta en el editor.

---

## 3. Punto 2: Revisar SLA/SLO y objetivos de calidad

### Qué revisar
- Definición de SLO en `WIKI.md`
- `thresholds` en `perf/scripts/multas_k6.js`
- `scenarios/config.js`

### Cómo verificar
1. Abre `WIKI.md` y busca la sección de SLA/SLO.
2. Abre `perf/scripts/multas_k6.js` y busca el bloque `thresholds`.
3. Abre `scenarios/config.js` y confirma las mismas metas.

### Evidencia
- Captura del bloque `thresholds` en `multas_k6.js`.
- Captura del texto de SLA/SLO en `WIKI.md`.

---

## 4. Punto 3: Ejecutar los 6 escenarios principales

### Escenarios implementados
- smoke
- baseline
- load
- stress
- spike
- soak

### Comandos para ejecutar
```powershell
npm run test:smoke
npm run test:baseline
npm run test:load
npm run test:stress
npm run test:spike
npm run test:soak
```

### Cómo verificar
1. Ejecuta cada comando en el terminal integrado.
2. Espera a que termine cada prueba.
3. Comprueba que se genera el archivo JSON correspondiente en `perf/results/`.

### Evidencia
- Captura del terminal luego de ejecutar `npm run test:smoke`.
- Captura del Explorador mostrando `perf/results/smoke.json`.
- Repite para `baseline`, `load`, `stress`, `spike` y `soak`.

---

## 5. Punto 4: Verificar parametrización y datos de prueba

### Qué revisar
- `data/consultas.json`
- `perf/data/voter.csv`
- `perf/scripts/multas_k6.js`
- `scenarios/helpers.js`

### Cómo verificar
1. Abre `data/consultas.json` y confirma que contiene varios tipos de búsqueda.
2. Abre `perf/scripts/multas_k6.js` y busca el uso de `SharedArray` o la lectura de datos.
3. Abre `scenarios/helpers.js` y revisa cómo se construyen las consultas.

### Evidencia
- Captura de `consultas.json` abierto en VS Code.
- Captura del código de selección aleatoria de datos en `multas_k6.js`.
- Captura de `buildConsulta` o `buildUrl` en `scenarios/helpers.js`.

---

## 6. Punto 5: Verificaciones y checks

### Qué revisar
- Bloque de `check()` en `perf/scripts/multas_k6.js`
- Thresholds de `http_req_failed` y latencia

### Cómo verificar
1. Abre `perf/scripts/multas_k6.js`.
2. Busca la función `check(response, {...})`.
3. Confirma que valida estado, latencia y contenido.
4. Revisa que las métricas y `thresholds` estén definidas.

### Evidencia
- Captura del bloque `check` completo.
- Captura de los thresholds en `multas_k6.js`.

---

## 7. Punto 6: Validar la integración CI/CD

### Qué revisar
- `perf/ci/perf-tests.yml`
- `package.json` con scripts de ejecución
- `README.md`/`WIKI.md` con descripción del pipeline

### Cómo verificar
1. Abre `perf/ci/perf-tests.yml`.
2. Confirma que usa GitHub Actions y define los pasos: checkout, setup Java, setup Node, setup k6, compilar, ejecutar tests.
3. Revisa `README.md` y `WIKI.md` para ver la ruta del pipeline.

### Evidencia
- Captura de `perf/ci/perf-tests.yml` con los pasos listados.
- Captura del texto de pipeline en `WIKI.md`.

---

## 8. Punto 7: Documentación completa

### Qué revisar
- `README.md`
- `WIKI.md`
- `MATRIZ-RENDIMIENTO.md`
- `REFLEXION-TECNICA.md`
- `VERIFICACION-FINAL.md`
- `defectos.md`
- `guia-local-taller.md`
- `GUIA-PRUEBAS-POR-PUNTO.md`
- `EVIDENCIA-VISUAL.md`

### Cómo verificar
1. Abre cada archivo en el editor.
2. Confirma que tiene contenido explicativo y que cubre los puntos del taller.
3. Usa la vista previa de Markdown (`Ctrl+Shift+V`) para validar formato.

### Evidencia
- Captura de la vista previa de `WIKI.md`.
- Captura de la vista previa de `MATRIZ-RENDIMIENTO.md`.
- Captura del contenido de `REFLEXION-TECNICA.md`.

---

## 9. Punto 8: Registrar hallazgos y defectos

### Qué revisar
- `defectos.md`
- `EVIDENCIA-VISUAL.md`
- `VERIFICACION-FINAL.md`

### Cómo verificar
1. Abre `defectos.md` y revisa los hallazgos registrados.
2. Comprueba que cada hallazgo incluye síntomas, causas y soluciones.
3. Abre `VERIFICACION-FINAL.md` para ver el checklist final.
4. Abre `EVIDENCIA-VISUAL.md` para ver la documentación de cada punto.

### Evidencia
- Captura de `defectos.md` con los tres hallazgos.
- Captura del checklist completo en `VERIFICACION-FINAL.md`.
- Captura de `EVIDENCIA-VISUAL.md` con mapeo de puntos.

---

## 10. Punto 9: Comprobar resultados de las pruebas

### Archivos mínimos esperados
- `perf/results/smoke.json`
- `perf/results/baseline.json`
- `perf/results/load.json`
- `perf/results/stress.json`
- `perf/results/spike.json`
- `perf/results/soak.json`

### Cómo verificar
1. En el Explorador, expande `perf/results/`.
2. Abre cada JSON para confirmar que contiene métricas de resumen.
3. Busca en cada archivo los campos:
   - `http_req_duration`
   - `http_req_failed`
   - `checks`
   - `iterations`
   - `vus_max`

### Evidencia
- Captura del Explorador con `perf/results/` expandido.
- Captura del contenido de `baseline.json` o `load.json` mostrando métricas.

---

## 11. Punto 10: Verificación final y puntuación esperada

### Qué revisar
- `VERIFICACION-FINAL.md`
- `EVIDENCIA-VISUAL.md`

### Cómo verificar
1. Abre `VERIFICACION-FINAL.md`.
2. Confirma que todos los puntos están marcados con ✅.
3. Abre `EVIDENCIA-VISUAL.md` y revisa el mapeo de los 10 puntos del taller.
4. Si falta algo, completa la evidencia con nueva captura.

### Evidencia
- Captura de la sección de checklist de `VERIFICACION-FINAL.md`.
- Captura de la sección de mapeo de puntos en `EVIDENCIA-VISUAL.md`.

---

## 12. Cómo documentar evidencia visual en VS Code

1. Abre el archivo o el terminal que quieras documentar.
2. Usa la herramienta de captura de pantalla de Windows (`Win+Shift+S`) o tu software preferido.
3. Guarda las capturas con nombres claros, por ejemplo:
   - `01-estructura.png`
   - `02-sla-slo.png`
   - `03-smoke-terminal.png`
   - `04-baseline-result.png`
4. Añade un resumen breve en `EVIDENCIA-VISUAL.md` o en la wiki:
   - qué se probó
   - qué archivo / comando se usó
   - resultado obtenido

---

## 13. Ejemplo de reporte de prueba por punto

- Punto 1: Ver estructura del repositorio
  - Resultado: ✅ `perf/` completo
  - Evidencia: `01-estructura.png`
- Punto 2: Ver SLA/SLO
  - Resultado: ✅ `thresholds` en `multas_k6.js`
  - Evidencia: `02-sla-slo.png`
- Punto 3: Ejecutar smoke, baseline, load
  - Resultado: ✅ Archivos JSON generados
  - Evidencia: `03-smoke-terminal.png`, `04-baseline-result.png`
- Punto 4: Ver datos parametrizados
  - Resultado: ✅ `consultas.json` y `helpers.js`
  - Evidencia: `05-parametrizacion.png`

---

## 14. Links rápidos dentro del proyecto

- `README.md`
- `guia-local-taller.md`
- `GUIA-PRUEBAS-POR-PUNTO.md`
- `WIKI.md`
- `MATRIZ-RENDIMIENTO.md`
- `REFLEXION-TECNICA.md`
- `VERIFICACION-FINAL.md`
- `EVIDENCIA-VISUAL.md`
- `defectos.md`
- `perf/scripts/multas_k6.js`
- `perf/ci/perf-tests.yml`
- `perf/results/`

---

## 15. Recomendaciones para entregar

1. Asegúrate de que `perf/results/` contiene los archivos esperados.
2. Comprueba que `EVIDENCIA-VISUAL.md` documenta cada punto.
3. Revisa `VERIFICACION-FINAL.md` para marcar el cumplimiento.
4. Si haces capturas, organízalas y enlázalas en la wiki o en tu entrega.
5. Empuja los cambios a GitHub cuando esté todo validad.
