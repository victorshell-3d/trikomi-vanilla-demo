# Contributing to Trikomi Vanilla JS Demos

Thank you for your interest in contributing to the Trikomi Vanilla JS Demos! This repository serves as the definitive reference for zero-framework HTML5 integrations of the `@trikomi/core` SDK.

## 1. How to Contribute

We welcome community contributions via the standard GitHub **Fork & Pull Request** workflow.

1. **Fork this repository** to your GitHub account.
2. **Clone your fork** locally: `git clone https://github.com/your-username/vanilla-demos.git`
3. **Create a branch** for your work: `git checkout -b feature/amazing-new-demo` or `git checkout -b fix/safari-bug`
4. **Commit your changes** clearly and concisely.
5. **Push to your fork** and open a **Pull Request** against our `main` branch.

## 2. Development Environment

Because this repository strictly avoids build tools (no Webpack, Vite, or Babel), the setup is incredibly simple. 

1. You simply need a local HTTP server to avoid CORS issues when loading local ES modules and EXR textures.
2. If you have Node.js installed, you can run: `npx serve .`
3. Alternatively, use VS Code's "Live Server" extension on any of the `index.html` files.

## 3. Code Style & Requirements

*   **Zero Frameworks:** Do not introduce React, Vue, jQuery, or build steps. All code must remain pure Vanilla JS (ESM), HTML5, and CSS3.
*   **Modular Scripts:** Keep application logic in `app.js` and import the Trikomi SDK directly from the `shared-assets/dist/trikomi.esm.js` bundle.
*   **Asset Management:** Do not duplicate large 3D models or HDR EXR environments. Reference existing assets in the `../shared-assets/assets/` directory whenever possible.

## 4. Pull Request Guidelines

1. Clearly describe the problem you are solving or the new integration technique you are demonstrating.
2. If you are adding a completely new industry demo, ensure it lives in its own dedicated directory alongside the existing folders.
3. Test your changes across modern browsers (Chrome, Firefox, Safari) to ensure standard ES modules function correctly.

We appreciate your contributions to making the Trikomi ecosystem more accessible to all developers!
