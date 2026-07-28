# 🏛️ Architecture & Integration Guide — Trikomi 3D Vanilla JS Demos

### 🌐 Trikomi Platform Ecosystem Bridge:
- **`victorshell2`** ([SaaS Portal Architecture](file:///media/vijaykc/projects/victorshell2/ARCHITECTURE.md)): Main SaaS website, user authentication, subscription management, and Super Admin License Manager.
- **`3dviewer`** ([Source SDK Architecture](file:///media/vijaykc/projects/3dviewer/ARCHITECTURE.md)): Monorepo source code for `@trikomi/core` rendering engines and WASM security modules.
- **`3dviewer-demo`** ([React Demos Architecture](file:///media/vijaykc/projects/3dviewer-demo/ARCHITECTURE.md)): Public React & TypeScript reference applications.
- **`vanilla-demos` (This Repository)**: Public zero-framework HTML5/ESM showcase hosted live on GitHub Pages.

## 1. Overview
The `vanilla-demos` repository provides zero-framework reference implementations built with pure **HTML5**, **CSS3**, and **JavaScript (ESM)**. It demonstrates how e-commerce store developers can integrate photorealistic 3D product configurators directly into **Shopify (Liquid)**, **WooCommerce (PHP)**, or custom store themes without requiring React or Vue dependencies.

## 2. Architecture & Design Patterns

```
   ┌──────────────────────┐          ┌──────────────────────┐
   │    HTML Storefront   │          │   Vanilla app.js     │
   │  (Liquid / PHP Theme)│─────────►│ (DOM Event Listeners)│
   └──────────────────────┘          └──────────┬───────────┘
                                                │ Imperative API
                                                ▼
                                     ┌──────────────────────┐
                                     │   trikomi.esm.js     │
                                     │  (Standalone SDK)    │
                                     └──────────────────────┘
```

### A. Zero-Framework Runtime
The entire application footprint consists of standard HTML, CSS, and an `app.js` module script. Application logic remains lightweight (~50–120 lines) because complex WebGL scene graph operations, WebGPU fallback node polyfilling, and mesh classification are encapsulated within `trikomi.esm.js`.

### B. Shared Asset Structure (`shared-assets/`)
All demonstration entrypoints share a single asset repository:
- `shared-assets/dist/version.js`: Central SDK version constant (`SDK_VERSION`).
- `shared-assets/dist/trikomi.esm.js?v=${SDK_VERSION}`: Standalone ESM SDK bundle with dynamic cache-busting query parameter.
- `shared-assets/assets/`: EXR reflection lighting maps and GLTF models referenced via `assetBaseUrl: '../shared-assets/assets/'`.

### C. License Validation & Cache-Busting Mechanism
When initialized, the SDK checks `window.trikomi_config` for an `apiKey` (which fetches a fresh JWT) or a `fallbackJwt` string. To prevent stale browser caching when SDK binaries are updated, all entrypoints import `SDK_VERSION` and append dynamic version query strings (`?v=${SDK_VERSION}`). The internal WASM security module verifies that the root domain (e.g., `github.io` for `victorshell-3d.github.io`) is authorized in the ES256 signed payload before instantiating diamond dispersion nodes or advanced features.

**Main-Domain Validation Architecture**: To grant clients full flexibility, the WASM license validator strictly enforces domain identity on the **root main-domain** level. It ignores subdomains (e.g., `app.example.com` becomes `example`) and top-level domains (e.g., `example.co.uk` becomes `example`). This allows users to seamlessly deploy a single license across multiple sites, staging environments, and regional domains without requiring distinct seats.

## 3. Directory Layout
```
vanilla-demos/
├── 3d-viewer/                 # Generic 3D model inspection studio
├── eyewear-tryon/             # AR eyewear preview and try-on studio
├── face-mocap/                # Real-time webcam AR face tracking demo
├── jewelry-configurator/      # Luxury ring & diamond PDP studio
├── sportswear-configurator/   # 3D sportswear customizer & logo placement
├── shared-assets/             # Pre-compiled SDK bundle & static 3D models
│   ├── dist/                  # trikomi.esm.js standalone bundle
│   ├── assets/                # WASM modules and textures
│   ├── models/                # GLTF 3D models
│   └── environments/          # EXR HDR reflection lighting maps
└── ARCHITECTURE.md            # Architecture documentation
```
