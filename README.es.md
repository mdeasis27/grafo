# Grafo

<!-- community-badges -->
[![CI](https://github.com/mdeasis27/grafo/actions/workflows/ci.yml/badge.svg)](https://github.com/mdeasis27/grafo/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
<!-- /community-badges -->

[English](README.md) · [Probar demo](https://grafo-manueldeasis27-2515s-projects.vercel.app/es/app) · [Caso de estudio](https://manueldeasis.com/es/projects/grafo) · [Código](https://github.com/mdeasis27/grafo)

![Interfaz interactiva local real](docs/images/cover.png)

Selecciona entidades y relaciones y compara recuperación de uno o varios saltos.

## Dos situaciones para comparar

**Ruta sustentada:** Pregunta sobre región de competidor de Organización A La ruta del grafo resuelve la relación.

![Ruta sustentada](docs/images/scenario-a.es.png)

**Fuera de ontología:** Pregunta sobre el clima No existe una ruta de grafo sustentada.

![Fuera de ontología](docs/images/scenario-b.es.png)

## Caso de uso de negocio

Una respuesta de relación puede requerir más de un pasaje.

**Quién lo usa:** Analista de ontología.

**La decisión:** Responder desde el grafo o rechazar por estar fuera de alcance.

Recorrer nodos y aristas confirmados y comparar la ruta con un pasaje único.

### Prueba la decisión

**Ruta sustentada:** Pregunta sobre región de competidor de Organización A La ruta del grafo resuelve la relación.

**Fuera de ontología:** Pregunta sobre el clima No existe una ruta de grafo sustentada.

Elige un escenario, modifica sus controles y ejecuta el cálculo local. Avanza por la visualización paso a paso o revela todo. Reinicia antes de comparar el segundo escenario.

## Cómo probarlo

Abre `/en/app` (inglés, por defecto) o `/es/app` (español). Cambia los datos del escenario y ejecuta el cálculo. Inspecciona la decisión, evidencia y traza calculada. La reproducción revela pasos locales ya completados; no mide un modelo en vivo. Reiniciar empieza un escenario local nuevo. Cambiar de idioma reinicia el escenario; la interfaz muestra un aviso de reinicio.

La demo principal no requiere cuenta, clave de API ni base de datos. Los enlaces públicos apuntan al despliegue existente; el rediseño local está pendiente de publicación.

## Instalación y verificación local

Requiere Node.js 22 y pnpm 10.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
node node_modules/typescript/bin/tsc --noEmit --incremental false
pnpm lint
pnpm build
```

Abre `http://localhost:3000/en/app`. La validación registrada cubre pruebas, lint, TypeScript y builds de producción. Consulta los [resultados de comandos](docs/quality/decision-lab-verification.json) y las [comprobaciones de componentes en navegador](docs/quality/decision-lab-browser.json). Estas pruebas usan componentes React y CSS de producción con navegación de idioma controlada; no certifican rutas de Next ni el despliegue público.

## Arquitectura

- `app/[lang]/`: experiencia web por idioma.
- `lib/experience/`: adaptador local tipado, validación y trazas.
- `design-system/`: tokens visuales, controles de idioma y presentación de ejecución y reproducción.
- `app/api/`: integraciones opcionales de servidor; la demo principal no las requiere.

Tecnología: Next.js 16, TypeScript, Python, Vitest, pytest, Tailwind CSS v4.

## Evidencia y límites

Nodos y aristas resaltados muestran la ruta real junto al baseline de un pasaje.

Recorrido destacado del grafo junto a una base de un solo pasaje; limitado a la ontología local.

Hace inspeccionable cada salto del grafo.

**Límites:** Solo hay aristas locales confirmadas en la ontología. Estos prototipos de portafolio no afirman impacto medido en producción.

Los datos son ejemplos ficticios o anónimos. Las integraciones opcionales requieren sus propias credenciales y configuración. Los secretos pertenecen al gestor configurado, nunca a archivos locales de secretos ni Git. Usa el flujo existente `infisical run -- <command>` si necesitas integraciones en vivo. La demo local no publica ni despliega automáticamente.

![Captura real de la demo en español](docs/images/demo.es.png)

<!-- community-section -->
## Licencia y contribución

Publicado bajo la [licencia MIT](LICENSE). Se aceptan issues y pull requests: lee antes [CONTRIBUTING.md](CONTRIBUTING.md) y el [Código de Conducta](CODE_OF_CONDUCT.md). Para reportar una vulnerabilidad, consulta [SECURITY.md](SECURITY.md).
<!-- /community-section -->
