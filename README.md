# Trikomi 3D Platform — Vanilla JS E-Commerce Showcase

[![Trikomi 3D Platform](https://img.shields.io/badge/Trikomi_3D_Platform-Vanilla_JS-00f2fe?style=for-the-badge)](https://victorshell.com)
[![SDK Bundle](https://img.shields.io/badge/SDK-Standalone_ESM-emerald?style=for-the-badge)](https://victorshell.com)
[![Platforms](https://img.shields.io/badge/Platforms-Shopify_|_WooCommerce_|_Custom-purple?style=for-the-badge)](https://victorshell.com)

Welcome to the **Trikomi 3D Platform** Vanilla JS demonstration suite. This repository contains standalone, zero-framework reference implementations built with pure **HTML5**, **CSS3**, and **JavaScript (ESM)**, engineered specifically for seamless integration into custom web store themes, **Shopify**, **WooCommerce**, and **Magento**.

---

## 🎯 Purpose & Executive Summary

The primary objective of this repository is to demonstrate how e-commerce store developers and digital agencies can integrate state-of-the-art 3D product customization, real-time WebAR try-on, and photorealistic diamond rendering into storefronts **without relying on React, Vue, or heavy framework runtimes**.

### Key Advantages:
- **Zero Framework Footprint**: Built with standard web technologies (`index.html`, `styles.css`, `app.js`). Can be dropped directly into liquid templates, PHP themes, or static CMS blocks.
- **Encapsulated 3D Math**: Complex raycasting, WebGPU/WebGL color node polyfilling, mesh classification, and camera controls are fully encapsulated inside the `trikomi.esm.js` SDK bundle. Application scripts (`app.js`) remain minimal (~50–120 lines).
- **Sub-50ms Theme Initialization**: Fast startup time ensuring zero impact on Google PageSpeed Insights or e-commerce Core Web Vitals.
- **Dynamic PDP Price Syncing**: Features real-time price calculation engines that seamlessly update storefront cart totals as users customize materials, gemstone finishes, and product add-ons.

---

## 🛍️ Demonstration Suite Overview

| Demo Directory | Industry / Use Case | Key Features |
| :--- | :--- | :--- |
| **`sportswear-configurator/`** | Custom Apparel & Teamwear | 3D jersey customizer with texture compositing, dynamic part colors, and chest logo/text raycasting with exact top-down UV placement. |
| **`jewelry-configurator/`** | Luxury Fine Jewelry & PDP Studio | Solitaire & Halo diamond ring configurator with dispersion shaders, gemstone finishes (Amethyst, Emerald, Sapphire), precious metal swatches, carat weight selectors, and dynamic cart price updates ($2,450.00). |
| **`face-mocap/`** | Beauty, Eyewear & AR Accessories | Real-time webcam facial tracking with MediaPipe landmark debug canvas and 3D face accessory overlays. Features aspect-ratio auto-scaling and unmirrored UI text overlays. |
| **`eyewear-tryon/`** | Glasses Try-On Studio | Named eyewear AR try-on studio with glassmorphic UI controls, snapshot capture, and 8thWall attribution compliance. |
| **`3d-viewer/`** | Product Inspection Studio | Multi-model 3D inspector with dynamic material slot scanning (*Frame*, *Lenses*, *Temples*), HDR lighting environment dropdowns, and target slot color controls. |

---

## 📁 Repository Structure

```
vanilla-demos/
├── 3d-viewer/                 # Generic 3D model inspection studio
│   ├── index.html             # HTML layout structure
│   ├── styles.css             # Full-viewport (100vh) responsive CSS
│   ├── app.js                 # Theme integration script
│   └── test-automation.js     # Headless E2E verification test
├── eyewear-tryon/             # AR eyewear preview and try-on studio
├── face-mocap/                # Real-time webcam AR face tracking demo
├── jewelry-configurator/      # Luxury ring & diamond PDP studio
├── sportswear-configurator/   # 3D sportswear customizer & logo placement
├── shared-assets/             # Pre-compiled SDK bundle & static 3D models
│   ├── dist/
│   │   └── trikomi.esm.js     # Standalone ESM SDK bundle
│   ├── models/                # GLTF/GLB 3D models
│   └── environments/          # EXR HDR reflection lighting maps
└── README.md                  # Suite documentation
```

---

## 🚀 How to Integrate into Shopify / WooCommerce

### 1. Include the SDK Bundle
Upload `trikomi.esm.js` to your theme assets folder (`assets/trikomi.esm.js` in Shopify or `wp-content/themes/your-theme/js/trikomi.esm.js` in WordPress):

```html
<script type="module">
  import { ThreeViewer, ViewerStore, GLTFPlugin } from './assets/trikomi.esm.js';

  const container = document.getElementById('canvas-container');
  const store = new ViewerStore();
  const viewer = new ThreeViewer(container, store);

  viewer.addPlugin(new GLTFPlugin());
  viewer.loadModelFromUrl('./assets/product-model.glb');
</script>
```

### 2. Bind Material Swatches to PDP Buttons
Easily bind your HTML color swatch buttons to mutate 3D material properties:

```js
import { applyMaterialColor, scanModelMaterialGroups } from './assets/trikomi.esm.js';

let materialGroups = new Map();

// Update scanned slots once the 3D model loads
setTimeout(() => {
  materialGroups = scanModelMaterialGroups(viewer.scene);
}, 1000);

// Listen to swatch button clicks
document.querySelectorAll('.color-swatch').forEach(button => {
  button.addEventListener('click', (e) => {
    const colorHex = e.target.getAttribute('data-color');
    const targetSlot = materialGroups.get('Frame');
    
    if (targetSlot) {
      targetSlot.materials.forEach(mat => applyMaterialColor(mat, colorHex));
    }
  });
});
```

---

## 📄 License & Terms

This demonstration software is provided for evaluation and integration reference purposes. For commercial licensing inquiries, enterprise SLAs, or custom 3D configurator development, please visit [victorshell.com](https://victorshell.com).
