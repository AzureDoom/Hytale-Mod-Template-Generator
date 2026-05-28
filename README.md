# Hytale Mod Template Generator

A full-stack web application that scaffolds ready-to-build Hytale mod projects. Fill out a form, click **Generate**, and download a ZIP containing a fully configured Gradle project, complete with a manifest, main class, build file, Gradle wrapper, version catalog, and license, ready to open in IntelliJ IDEA or any other IDE.

The generator supports both standalone single-mod projects and multi-project workspaces. Multi-project workspaces generate a root Hytale workspace with a shared `common` module plus one or more mod subprojects.

---

## Table of Contents

- [Features](#features)
- [Generated Project Tooling](#generated-project-tooling)
- [Generated Layouts](#generated-layouts)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Project Configuration Options](#project-configuration-options)
- [Production Build & Deployment](#production-build--deployment)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Live version loading** — fetches available Hytale versions from the Hytale Maven repository (release and pre-release patchlines), with a built-in fallback list if the repository is unreachable.
- **Flexible build configuration** — choose between Groovy DSL and Kotlin DSL, Java or Kotlin as the project language, and three version catalog modes (`none`, `basic`, `rich`).
- **Standalone or multi-project generation** — generate either a traditional standalone mod project or a multi-project Hytale workspace with a shared `common` module and multiple mod subprojects.
- **Per-module publishing configuration** — multi-project workspaces can generate separate HytalePublisher project IDs/slugs for each mod module, allowing every module to publish independently.
- **Full Gradle wrapper bundling** — the server fetches and caches `gradle-wrapper.jar` from GitHub so the downloaded project works offline without requiring a Gradle installation.
- **Manifest generation** — produces a `manifest.json` with correct dependency maps, CurseForge ID, pack inclusion flag, and disabled-by-default support.
- **License file generation** — supports 15 open-source licenses plus a Proprietary option (MIT, Apache-2.0, GPL-3.0, AGPL-3.0, and more).
- **ZIP download** — the entire scaffolded project is streamed directly to the browser as a ZIP archive with UNIX permissions set on `gradlew`.

---

## Generated Project Tooling

Generated projects are built around my Hytale Gradle tooling.

- **Hytale Tools Gradle Plugin**  
  Standalone projects and individual mod subprojects use the [`com.azuredoom.hytale-tools`](https://plugins.gradle.org/plugin/com.azuredoom.hytale-tools) plugin to provide Hytale-focused build support and project conventions.  
  Source: [`AzureDoom/Hytale-Gradle-Plugin`](https://github.com/AzureDoom/Hytale-Gradle-Plugin)

- **Hytale Workspace Gradle Plugin**  
  Multi-project workspaces use the [`com.azuredoom.hytale-workspace`](https://plugins.gradle.org/plugin/com.azuredoom.hytale-workspace) plugin at the root project. The generated workspace includes a shared `common` module plus one or more mod modules, and configures workspace-level tasks such as running, staging, validating, and updating all mods together.  
  Source: [`AzureDoom/Hytale-Gradle-Plugin`](https://github.com/AzureDoom/Hytale-Gradle-Plugin)

- **Hytale Publisher Gradle Plugin**  
  Publishing support is handled through the [`com.azuredoom.hytalepublisher`](https://plugins.gradle.org/plugin/com.azuredoom.hytalepublisher) plugin, which provides the publishing workflow for generated Hytale mod projects. In multi-project workspaces, publisher configuration can be generated per module so each mod subproject can publish to its own Modtale, CurseForge, or Modifold project.  
  Source: [`AzureDoom/HytalePublisher`](https://github.com/AzureDoom/HytalePublisher)

---

---

## Generated Layouts

The generator supports two project layouts.

### Standalone mod

Standalone mode is the default. It generates one Gradle project containing one mod.

```text
my-mod/
├── build.gradle
├── settings.gradle
├── gradle.properties
├── src/main/java/...
├── src/main/resources/manifest.json
├── gradle/wrapper/
├── gradlew
└── gradlew.bat
```

When Kotlin DSL is selected, `build.gradle` and `settings.gradle` are generated as `build.gradle.kts` and `settings.gradle.kts`.

### Multi-project workspace

Multi-project mode generates a root workspace project, a shared common module, and one or more mod subprojects.

```text
my-workspace/
├── build.gradle
├── settings.gradle
├── gradle.properties
├── common/
│   └── build.gradle
├── my_mod/
│   ├── build.gradle
│   ├── src/main/java/...
│   └── src/main/resources/manifest.json
├── economy/
│   ├── build.gradle
│   ├── src/main/java/...
│   └── src/main/resources/manifest.json
├── gradle/wrapper/
├── gradlew
└── gradlew.bat
```

The main Mod ID is used as the host mod project. Extra modules entered in Additional mod modules are added as additional mod subprojects.

Each mod subproject:

- applies `com.azuredoom.hytale-tools`
- depends on `project(":common")`
- receives its own generated `manifest.json`
- receives its own generated main class
- can receive its own publisher IDs when HytalePublisher is enabled

The root project applies `com.azuredoom.hytale-workspace` and configures the workspace’s `modProjects` and `hostProject`.

## Architecture

```
hytale-generator-webapp/   ← npm workspace root
├── frontend/              ← React 18 + TypeScript + Vite (port 5173 in dev)
└── server/                ← Express + TypeScript (port 3001 in dev)
```

The frontend is a single-page React application. In development the Vite dev server proxies `/api/*` requests to the backend. In production the Express server serves the pre-built frontend from `frontend/dist` and handles all API routes under `/api`.

---

## Prerequisites

| Tool    | Minimum version | Notes                                                                 |
|---------|-----------------|-----------------------------------------------------------------------|
| Node.js | 22 LTS          | 24 LTS recommended                                                    |
| npm     | 10              | Comes with Node 20+                                                   |
| Java    | 25              | Required only to **run** the generated projects, not to run this tool |

No global npm packages are required. All tooling (`tsx`, `vite`, `tsc`) is installed locally as dev dependencies.

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/AzureDoom/Hytale-Mod-Template-Generator
```

### 2. Install dependencies

```bash
npm install
```

This installs dependencies for all workspaces (`frontend` and `server`) in a single step.

### 3. Configure the server environment

Copy the example environment file and edit it as needed:

```bash
cp server/.env.example server/.env
```

> If `.env.example` does not exist yet, create `server/.env` manually — see the [Environment Variables](#environment-variables) section for all supported keys.

The minimum viable `.env` for local development is:

```env
PORT=3001
APP_ORIGIN=http://localhost:5173
GRADLE_DISTRIBUTION_URL=https://services.gradle.org/distributions/gradle-9.5.1-bin.zip
```

### 4. Start the development servers

```bash
npm run dev
```

This runs both the backend and frontend concurrently using `npm-run-all`:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

The Vite proxy (`/api → http://localhost:3001`) is configured in `frontend/vite.config.ts`. If you change `PORT` in `.env`, update the proxy target to match.

> **Note on the Gradle wrapper cache:** The first time you generate a project the server will fetch `gradle-wrapper.jar` from GitHub and cache it in `server/cache/`. Subsequent generations reuse the cached file.

---

## Environment Variables

All variables are read from `server/.env` (loaded by `dotenv` at startup). Every variable has a sensible default so the server starts without a `.env` file during development.

| Variable                      | Default                                                          | Description                                                                                                                          |
|-------------------------------|------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `PORT`                        | `3001`                                                           | Port the Express server listens on.                                                                                                  |
| `APP_ORIGIN`                  | `*`                                                              | CORS allowed origin. Set to your frontend URL in production (e.g. `https://yoursite.com`). `*` allows all origins.                   |
| `GRADLE_DISTRIBUTION_URL`     | `https://services.gradle.org/distributions/gradle-9.5.1-bin.zip` | Gradle distribution URL embedded in generated `gradle-wrapper.properties`. The server derives the wrapper JAR version from this URL. |
| `HYTALE_MAVEN_RELEASE_URL`    | `https://maven.hytale.com/release`                               | Base URL of the Hytale Maven release repository, used to fetch available versions.                                                   |
| `HYTALE_MAVEN_PRERELEASE_URL` | `https://maven.hytale.com/pre-release`                           | Base URL of the Hytale Maven pre-release repository.                                                                                 |
| `SHOW_STATUS_BANNER`          | *(unset / false)*                                                | Set to `true` to show a live status banner in the UI (useful for maintenance notices).                                               |

---

## API Reference

All routes are mounted under `/api`.

### `GET /api/health`

Returns a simple liveness check.

**Response**
```json
{ "ok": true }
```

---

### `GET /api/versions?patchline=release`

Returns available Hytale versions for the given patchline, fetched from the Hytale Maven repository. Falls back to a hardcoded list if the repository is unreachable.

**Query parameters**

| Parameter   | Values                   | Default   |
|-------------|--------------------------|-----------|
| `patchline` | `release`, `pre-release` | `release` |

**Response**
```json
{
  "patchline": "release",
  "versions": ["2026.02.19-1a311a592"],
  "source": "hytale-maven",
  "url": "https://maven.hytale.com/release/..."
}
```

`source` is `"hytale-maven"` when versions were fetched live, or `"fallback"` when the built-in list was used.

---

### `GET /api/app-config`

Returns runtime configuration flags consumed by the frontend.

**Response**
```json
{ "showStatusBanner": false }
```

---

### `POST /api/generate`

Generates a scaffolded Hytale mod project and returns it as a ZIP file download.

**Request body** — `application/json`

See [Project Configuration Options](#project-configuration-options) for all fields. The request can generate either a standalone mod project or a multi-project workspace depending on the `projectLayout` field.

**Responses**

| Status | Description                                                                              |
|--------|------------------------------------------------------------------------------------------|
| `200`  | ZIP file (`application/zip`) — `Content-Disposition: attachment; filename="<modId>.zip"` |
| `400`  | Validation error — plain-text message describing which fields failed.                    |
| `500`  | Generation error — plain-text error message.                                             |

---

### `GET /api/status`

Returns a live health snapshot of every upstream service the generator depends on, plus a couple of related AzureDoom hosts.

**Response**

```json
{
  "overall": "up",
  "generatedAt": "2026-04-28T15:00:00.000Z",
  "services": [
    {
      "id": "hytale-maven-release",
      "name": "Hytale Maven (release)",
      "url": "https://maven.hytale.com/release",
      "required": true,
      "state": "up",
      "latencyMs": 142,
      "httpStatus": 200,
      "message": "OK (200)",
      "checkedAt": "2026-04-28T15:00:00.000Z"
    }
  ]
}
```
Returns HTTP 503 when any required service is down so external
uptime monitors can alert on the response code directly. The
response is cached for 5 seconds to absorb auto-refresh traffic.

---

## Project Configuration Options

These are the fields accepted by `POST /api/generate` and rendered in the form UI.

| Field                          | Type                                | Required | Description                                                                                                                                                                                                                                                   |
|--------------------------------|-------------------------------------|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `projectLayout`                | `"standalone"` \| `"multi-project"` |          | Project layout to generate. `standalone` creates one mod project. `multi-project` creates a root workspace with `common` plus one or more mod subprojects. Default: `standalone`.                                                                             |
| `additionalModIds`             | string                              |          | Newline- or comma-separated list of extra mod module names used only when `projectLayout` is `multi-project`. The primary `modId` is always included as the host mod project.                                                                                 |
| `patchline`                    | `"release"` \| `"pre-release"`      | ✓        | Hytale release channel.                                                                                                                                                                                                                                       |
| `hytaleVersion`                | string                              | ✓        | Target Hytale server version (e.g. `2026.02.19-1a311a592`).                                                                                                                                                                                                   |
| `group`                        | string                              | ✓        | Java/Kotlin package group (e.g. `com.example.mymod`).                                                                                                                                                                                                         |
| `manifestGroup`                | string                              | ✓        | Manifest group identifier (e.g. `com.example`).                                                                                                                                                                                                               |
| `modName`                      | string                              | ✓        | Human-readable mod name.                                                                                                                                                                                                                                      |
| `modId`                        | string                              | ✓        | Mod identifier — used as the project folder name.                                                                                                                                                                                                             |
| `mainClass`                    | string                              | ✓        | Simple or fully-qualified main class name.                                                                                                                                                                                                                    |
| `modAuthor`                    | string                              | ✓        | Author name — used in the manifest and license file.                                                                                                                                                                                                          |
| `modDescription`               | string                              | ✓        | Short description of the mod.                                                                                                                                                                                                                                 |
| `modUrl`                       | string (URL)                        | ✓        | Project website URL.                                                                                                                                                                                                                                          |
| `version`                      | string                              | ✓        | Initial mod version (e.g. `0.0.1`).                                                                                                                                                                                                                           |
| `modLicense`                   | string                              | ✓        | License identifier. Supported values: `MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `GPL-2.0-only`, `GPL-3.0-only`, `LGPL-2.1-only`, `LGPL-3.0-only`, `AGPL-3.0-only`, `MPL-2.0`, `EPL-2.0`, `ISC`, `CC0-1.0`, `Unlicense`, `EUPL-1.2`, `Proprietary`. |
| `buildDsl`                     | `"groovy"` \| `"kotlin"`            |          | Build script DSL. Default: `groovy`.                                                                                                                                                                                                                          |
| `projectLanguage`              | `"java"` \| `"kotlin"`              |          | Source language. Default: `java`.                                                                                                                                                                                                                             |
| `javaVersion`                  | number                              |          | Java toolchain version. Default: `25`.                                                                                                                                                                                                                        |
| `versionCatalogMode`           | `"none"` \| `"basic"` \| `"rich"`   |          | Controls whether a `gradle/libs.versions.toml` is generated. Default: `none`.                                                                                                                                                                                 |
| `manifestDependencies`         | string                              |          | Comma- or newline-separated `key=value` dependency map. Default: `Hytale:AssetModule=*`.                                                                                                                                                                      |
| `manifestOptionalDependencies` | string                              |          | Same format as `manifestDependencies` but for optional deps. Default: empty.                                                                                                                                                                                  |
| `curseforgeID`                 | string                              |          | CurseForge project ID for the update checker. Default: empty.                                                                                                                                                                                                 |
| `disabledByDefault`            | boolean                             |          | Whether the mod is disabled by default. Default: `false`.                                                                                                                                                                                                     |
| `includesPack`                 | boolean                             |          | Whether the mod bundles an asset pack. Default: `true`.                                                                                                                                                                                                       |
| `usePublisher`                 | boolean                             |          | Whether to include the HytalePublisher Gradle plugin. Default: `false`.                                                                                                                                                                                       |
| `publishModtale`               | boolean                             |          | Whether to enable Modtale publishing when `usePublisher` is enabled. Default: `true`.                                                                                                                                                                         |
| `modtaleProjectId`             | string                              |          | Modtale project ID. In standalone projects this is written as `modtale_project_id`. In multi-project workspaces it is used as the default host module value.                                                                                                  |
| `publishCurseforge`            | boolean                             |          | Whether to enable CurseForge publishing when `usePublisher` is enabled. Default: `true`.                                                                                                                                                                      |
| `curseforgeProjectId`          | string                              |          | CurseForge publishing project ID. In multi-project workspaces each module receives its own `<module>_curseforge_project_id` property.                                                                                                                         |
| `publishModifold`              | boolean                             |          | Whether to enable Modifold publishing when `usePublisher` is enabled. Default: `true`.                                                                                                                                                                        |
| `modifoldProjectSlug`          | string                              |          | Modifold project slug. In multi-project workspaces each module receives its own `<module>_modifold_project_slug` property.                                                                                                                                    |

### Multi-project publishing properties

When HytalePublisher is enabled for a multi-project workspace, the generated `gradle.properties` uses module-specific publishing keys instead of one shared set of IDs.

For example, a workspace with:

```text
modId = replace_me
additionalModIds = economy, magic
```

can generate publishing properties like:

```text
# replace_me publishing
replace_me_modtale_project_id = your-replace_me-modtale-project-id
replace_me_curseforge_project_id = 123456
replace_me_modifold_project_slug = replace_me

# economy publishing
economy_modtale_project_id = your-economy-modtale-project-id
economy_curseforge_project_id = 123456
economy_modifold_project_slug = economy

# magic publishing
magic_modtale_project_id = your-magic-modtale-project-id
magic_curseforge_project_id = 123456
magic_modifold_project_slug = magic
```

Each generated mod subproject reads its own keys, so modules can publish independently.

---

## Production Build & Deployment

### Build

```bash
npm run build
```

This runs `tsc` + `vite build` for the frontend first, then `tsc` for the server. Outputs:

- `frontend/dist/` — static assets
- `server/dist/` — compiled JavaScript

### Server

```bash
npm start
```

This runs `node server/dist/index.js`. The Express server is responsible for serving the frontend's static files and handling all API requests. Make sure your `server/.env` (or environment) contains the production values before starting.

A minimal production `.env`:

```env
PORT=3001
APP_ORIGIN=https://yoursite.com
GRADLE_DISTRIBUTION_URL=https://services.gradle.org/distributions/gradle-9.5.1-bin.zip
```

### Reverse proxy (recommended)

It is recommended to run the app behind a reverse proxy such as nginx or Caddy. Example nginx snippet:

```nginx
server {
    listen 443 ssl;
    server_name yoursite.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker (optional)

A minimal single-stage `Dockerfile` you can use as a starting point:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY frontend/package.json ./frontend/
COPY server/package.json ./server/
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/cache ./server/cache
COPY --from=build /app/frontend/dist ./frontend/dist
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/package.json ./package.json
RUN npm install --omit=dev --workspace server
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "server/dist/index.js"]
```

---

## Project Structure

```
hytale-generator-webapp/
├── package.json                   # Workspace root — dev/build/start scripts
│
├── frontend/
│   ├── index.html
│   ├── vite.config.ts             # Vite config; dev proxy → :3001
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                # Root component, version loading, form submit
│       ├── types.ts               # Shared TypeScript types (mirrors server)
│       ├── components/
│       │   ├── ProjectForm.tsx    # Form UI, including standalone/multi-project layout selection
│       │   └── PreviewPanel.tsx   # Live preview of generated standalone or workspace file names
│       └── lib/
│           ├── api.ts             # fetch wrappers for all API endpoints
│           └── defaults.ts        # Default form values
│
└── server/
    ├── .env                       # Local environment (not committed)
    ├── package.json
    ├── tsconfig.json
    ├── cache/                     # Gradle wrapper JAR cache (auto-created)
    └── src/
        ├── index.ts               # Express app setup and server listen
        ├── config.ts              # Typed config from environment variables
        ├── types.ts               # Core domain types (Patchline, BuildDsl, etc.)
        ├── validation.ts          # Zod schema for POST /api/generate
        ├── assets.ts              # Static asset paths
        ├── routes/
        │   ├── health.ts          # GET /api/health
        │   ├── versions.ts        # GET /api/versions
        │   ├── app-config.ts      # GET /api/app-config
        │   └── generate.ts        # POST /api/generate — ZIP assembly
        └── services/
            ├── templates.ts       # Gradle file, workspace file, manifest, main class generators
            ├── licenses.ts        # License text for all supported identifiers
            ├── string-utils.ts    # slugify, escapeJava, parseMainClass helpers
            ├── versions.ts        # Hytale Maven version fetcher with fallback
            └── wrapper.ts         # Gradle wrapper JAR fetcher and cache
```

---

## Troubleshooting

**`Could not fetch gradle-wrapper.jar`**
The server fetches the JAR from GitHub on first run. If your server has no outbound internet access, copy a `gradle-wrapper-<version>.jar` into `server/cache/` manually and restart.

**Versions list shows only the fallback version**
The Hytale Maven repository is unreachable or returned an unexpected response. The app continues to work with the built-in fallback list. Check `HYTALE_MAVEN_RELEASE_URL` / `HYTALE_MAVEN_PRERELEASE_URL` in your `.env` if you expect live versions.

**CORS errors in the browser**
Ensure `APP_ORIGIN` in `server/.env` matches the exact origin of your frontend (e.g. `https://yoursite.com` — no trailing slash, correct scheme).

**`tsx` not found when running `npm run dev`**
Run `npm install` from the workspace root, not from inside `server/`. The `tsx` binary is a dev dependency of the `server` workspace and must be installed via the root workspace command.

**Port conflicts**
Change `PORT` in `server/.env` for the backend. For the frontend dev server, update the `server.port` field in `frontend/vite.config.ts` and the proxy target to match.

**The multi-project option does not appear in the UI**  
Make sure `frontend/src/components/ProjectForm.tsx` includes the `projectLayout` select field, then rebuild the frontend with `npm run build`, restart the server, reload nginx if applicable, and hard-refresh the browser cache.

**Generated multi-project publishing uses placeholder IDs**  
Each module gets its own publishing properties in `gradle.properties`. Replace the generated placeholder values such as `economy_curseforge_project_id = 123456` with the real project IDs before publishing.