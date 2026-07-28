# 🤖 AGENTS.md — AI & Developer Working Guidelines

[![Repository](https://img.shields.io/badge/Repository-vanilla--demos-00f2fe?style=for-the-badge)](https://victorshell-3d.github.io/trikomi-vanilla-demo/)
[![Role](https://img.shields.io/badge/Role-Public_Vanilla_JS_Demos-emerald?style=for-the-badge)](https://victorshell.com)

---

## 📌 Context & Scope
`vanilla-demos` is a **public open-source reference repository** hosted on GitHub Pages (`victorshell-3d.github.io/trikomi-vanilla-demo/`). It provides zero-framework HTML5, CSS3, and JavaScript (ESM) reference implementations for Shopify and WooCommerce theme developers.

---

## 🛡️ Guidelines & Conventions

1. **Zero-Framework Purity:**
   - Keep application scripts (`app.js`) strictly zero-framework (pure vanilla ESM JavaScript). Do NOT introduce React, Vue, or heavy npm bundlers into demo subdirectories.

2. **Automated SDK Cache-Busting Rule:**
   - Always import `SDK_VERSION` from `shared-assets/dist/version.js` and append dynamic version query parameters:
     ```javascript
     import { SDK_VERSION } from '../shared-assets/dist/version.js';
     import { ThreeViewer, ... } from '../shared-assets/dist/trikomi.esm.js';
     window.trikomi_config = { apiKey: 'vk_live_...' };
     ```

3. **Centralized Asset Base URL:**
   - Ensure `ThreeViewer` instances point to `assetBaseUrl: '../shared-assets/assets/'` so EXR environments and GLTF models load correctly without 404 errors.
