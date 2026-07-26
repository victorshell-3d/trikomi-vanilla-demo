# 🍦 3D Viewer Vanilla Demos (`vanilla-demos`) — Public E-Commerce Reference Suite

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-ff69b4?style=for-the-badge&logo=github)](https://victorshell-3d.github.io/trikomi-vanilla-demo/)
[![Platform Ecosystem](https://img.shields.io/badge/Trikomi_Ecosystem-Vanilla_Demos-00f2fe?style=for-the-badge)](https://victorshell.com)
[![SDK Version](https://img.shields.io/badge/SDK-v1.0.7--beta-emerald?style=for-the-badge)](https://victorshell.com)

---

## 📌 Repository Role & Context

This repository (`vanilla-demos`) provides standalone, zero-framework reference implementations built with pure **HTML5**, **CSS3**, and **JavaScript (ESM)**. It is specifically designed for developers integrating 3D customization directly into **Shopify**, **WooCommerce**, **Magento**, or custom Liquid/PHP themes without relying on React or Vue.

### 🌐 Trikomi Platform Ecosystem Bridge:
- **`victorshell2`** ([Main Portal](https://victorshell.com)): Main SaaS website, user authentication, subscription management, and Super Admin License Issuer.
- **`3dviewer`** (Source SDK Repo): Monorepo source codebase containing `@trikomi/core` rendering engines and WASM security modules.
- **`3dviewer-demo`** ([React Demos](https://github.com/victorshell-3d/trikomi-react-demo/)): Public React & TypeScript reference applications.
- **`vanilla-demos` (This Repository)**: Public zero-framework ESM showcase hosted live on GitHub Pages.

---

## 🛍️ Included Vanilla Demonstrations

| Demo Directory | Use Case | Live GitHub Pages Link |
| :--- | :--- | :--- |
| **`jewelry-configurator/`** | Luxury Ring & Diamond PDP Studio | [💎 Launch Studio](https://victorshell-3d.github.io/trikomi-vanilla-demo/jewelry-configurator/) |
| **`sportswear-configurator/`** | 3D Sportswear Customizer | [🎽 Launch Customizer](https://victorshell-3d.github.io/trikomi-vanilla-demo/sportswear-configurator/) |
| **`eyewear-tryon/`** | Eyewear Studio & AR Preview | [👓 Launch Try-On](https://victorshell-3d.github.io/trikomi-vanilla-demo/eyewear-tryon/) |
| **`face-mocap/`** | Webcam Face Tracking & AR Overlay | [📸 Launch MoCap](https://victorshell-3d.github.io/trikomi-vanilla-demo/face-mocap/) |
| **`3d-viewer/`** | Product Material Inspector | [🔍 Launch Inspector](https://victorshell-3d.github.io/trikomi-vanilla-demo/3d-viewer/) |

---

## 📊 Current Status (v1.0.7 - Active Beta)

- [x] Shared single asset directory (`shared-assets/`) containing ESM bundles, models, and environments.
- [x] Zero framework dependencies (loads standard ES modules via `trikomi.esm.js`).
- [x] Domain-bound cryptographic license validation via `window.trikomi_lic`.
- [x] Sub-50ms lightweight cold startup time for PageSpeed optimization.

---

## 🛣️ Development Roadmap

- [ ] Automated version query parameter cache-busting script (`trikomi.esm.js?v=1.0.7`).
- [ ] Ready-to-use Shopify Liquid snippet (`trikomi-3d-pdp.liquid`) template.
- [ ] WordPress / WooCommerce shortcode integration plugin.

---

## 📄 License & Terms

Provided for evaluation and integration reference. For commercial license keys, enterprise SLAs, or custom 3D configurator development, visit [victorshell.com](https://victorshell.com).
