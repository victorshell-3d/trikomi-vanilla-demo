import {
  ThreeViewer,
  ViewerStore,
  OrbitControlsPlugin,
  CenterModelPlugin,
  SportswearConfigurator,
  makeAutoObservable,
  reaction
} from '../shared-assets/dist/trikomi.esm.js';

const AVAILABLE_MODELS = [
  { name: 'Rugby Jersey', url: '../shared-assets/models/RugbyJersey.gltf', svg: '../shared-assets/textures/JSY-85 RL.svg', mat: 'main' },
  { name: 'Basketball Singlet', url: '../shared-assets/models/BasketballSinglet.gltf', svg: '../shared-assets/textures/BAS20_01.svg', mat: 'main' },
  { name: 'Soccer Jersey', url: '../shared-assets/models/SoccerJersey.gltf', svg: '../shared-assets/textures/FTB20_01.svg', mat: 'main' }
];

class ConfigStore {
  parts = [];
  logos = [];
  texts = [];
  selectedLogoId = null;
  selectedTextId = null;
  fabricType = 'mesh';
  viewTrigger = null;
  generateScreenshotsTrigger = 0;
  orderScreenshots = [];
  isLoading = true;

  constructor() {
    makeAutoObservable(this);
  }

  setPartsFromColors(colors) {
    const premiumPalette = ['#1A1A1A', '#D4AF37', '#F0F0F0', '#0A1128', '#780000'];
    this.parts = colors.map((colorHex, index) => ({
      id: `part-${index}`,
      name: `Color Layer ${index + 1}`,
      originalColor: colorHex.toUpperCase(),
      color: premiumPalette[index % premiumPalette.length]
    }));
  }

  setIsLoading(loading) {
    this.isLoading = loading;
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = loading ? 'flex' : 'none';
  }
  setSelectedLogo(id) { this.selectedLogoId = id; if (id) this.selectedTextId = null; }
  setSelectedText(id) { this.selectedTextId = id; if (id) this.selectedLogoId = null; }
  removeLogo(id) { this.logos = this.logos.filter(l => l.id !== id); }
  removeText(id) { this.texts = this.texts.filter(t => t.id !== id); }
  updateLogo(id, updates) {
    const idx = this.logos.findIndex(l => l.id === id);
    if (idx !== -1) this.logos[idx] = { ...this.logos[idx], ...updates };
  }
  updateText(id, updates) {
    const idx = this.texts.findIndex(t => t.id === id);
    if (idx !== -1) this.texts[idx] = { ...this.texts[idx], ...updates };
  }
  setCenterUV(uv) { this.centerUV = uv; }
  setOrderScreenshots(shots) { this.orderScreenshots = shots; }
}

const configStore = new ConfigStore();
const container = document.getElementById('three-container');
const modelNameDisplay = document.getElementById('model-name-display');
const colorsContainer = document.getElementById('colors-container');

// Engine Setup
const engineStore = new ViewerStore();
engineStore.backgroundColor = 'transparent';
engineStore.showStats = true;

window.trikomi_config = {
  apiKey: 'vk_live_mvsugpsup02xd1i7',
  fallbackJwt: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJraWQiOiJ2a19saXZlX212c3VncHN1cDAyeGQxaTciLCJkIjpbImdpdGh1Yi5pbyIsImxvY2FsaG9zdCIsInZpY3RvcnNoZWxsLmNvbSIsIjEyNy4wLjAuMSJdLCJwbHVnaW5zIjpbIjNEIFZpZXdlciIsIkpld2VscnkgQ29uZmlndXJhdG9yIiwiU3BvcnRzd2VhciBDb25maWd1cmF0b3IiLCJCb3ggUGFja2FnaW5nIENvbmZpZ3VyYXRvciIsIkZhY2UgTW90aW9uIENhcHR1cmUiLCJFeWV3ZWFyIFZpcnR1YWwgVHJ5LU9uIiwiMzYwXHUwMGIwIFZpcnR1YWwgVG91ciIsIlZpcnR1YWwgM0QgRXhoaWJpdGlvbiJdLCJmZWF0dXJlcyI6WyJWU1QwMDIiLCJWU1QwMDMiLCJWU1QwMDUiLCJWU1QwMDYiLCJWU1QwMDgiLCJWU1QxMDMiLCJWU1QxMDciLCJWU1Q5MDEiLCJWU1QwMDEiLCJWU1QwMDQiLCJWU1QyMDEiLCJWU1QxMDQiLCJWU1QxMDYiLCJWU1QyMDIiLCJWU1QyMDMiLCJWU1QyMDQiLCJWU1QzMDEiLCJWU1QzMDIiLCJWU1QzMDMiLCJWU1QzMDQiLCJWU1QzMDUiLCJWU1QzMDYiLCJWU1Q0MDEiLCJWU1Q0MDIiLCJWU1Q0MDMiLCJWU1Q0MDQiLCJWU1Q0MDUiLCJWU1Q1MDEiLCJWU1Q1MDIiLCJWU1Q1MDMiLCJWU1Q1MDgiLCJWU1Q1MTIiLCJWU1QyMDUiLCJWU1QyMDYiXSwiZSI6MjEwMTA2MTQyMDAwMCwidSI6MSwiYiI6ZmFsc2V9.wYdTAP91vsvkhl8ZBvKzwMULPKLGEPMULrYXEvUxYH63HJ4_yPjB90ixjsNbQBzExA3ii22HS7ndXr2W_p42Hg'
};
const viewer = new ThreeViewer(container, engineStore, {
  assetBaseUrl: '../shared-assets/assets/'
});

viewer.addPlugin(new OrbitControlsPlugin());
const centerPlugin = new CenterModelPlugin({ center: true, floor: false, fitCamera: true });
viewer.addPlugin(centerPlugin);

viewer.camera.position.set(0, 1, 3);
viewer.directionalLight.position.set(2, 5, 3);
viewer.directionalLight.intensity = 1;

// Instantiate SDK SportswearConfigurator
const configurator = new SportswearConfigurator(viewer, configStore, '../shared-assets/textures/');

let currentModelIndex = 0;

function loadModelIndex(index) {
  if (index < 0 || index >= AVAILABLE_MODELS.length) return;
  currentModelIndex = index;
  const modelDef = AVAILABLE_MODELS[index];
  if (modelNameDisplay) modelNameDisplay.textContent = modelDef.name;
  configurator.loadModel(modelDef, centerPlugin);
}

// Render Layer Color Inputs
function renderColorParts() {
  if (!colorsContainer) return;
  colorsContainer.innerHTML = '';
  configStore.parts.forEach(part => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;';
    row.innerHTML = `
      <label style="font-size:12px; font-weight:500; color:#334155;">${part.name}</label>
      <input type="color" value="${part.color}" style="border:none; background:none; cursor:pointer; width:32px; height:32px;">
    `;
    colorsContainer.appendChild(row);

    const input = row.querySelector('input');
    if (input) {
      input.addEventListener('input', (e) => {
        part.color = e.target.value;
        configurator.refreshCompositorTexture();
      });
    }
  });
}

reaction(() => configStore.parts.map(p => p.id).join(','), () => renderColorParts());

// UI Model Switcher
const prevBtn = document.getElementById('prev-model-btn');
const nextBtn = document.getElementById('next-model-btn');
if (prevBtn) prevBtn.addEventListener('click', () => loadModelIndex((currentModelIndex - 1 + AVAILABLE_MODELS.length) % AVAILABLE_MODELS.length));
if (nextBtn) nextBtn.addEventListener('click', () => loadModelIndex((currentModelIndex + 1) % AVAILABLE_MODELS.length));

// View Angle Buttons
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.getAttribute('data-view');
    if (view) configurator.changeView(view);
  });
});

// Fabric Finish Buttons
document.querySelectorAll('.fabric-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.fabric-btn').forEach(b => b.classList.remove('active-fabric'));
    btn.classList.add('active-fabric');
    const fabric = btn.getAttribute('data-fabric');
    if (fabric) configStore.fabricType = fabric;
  });
});

// Logo Upload
const logoInput = document.getElementById('upload-logo');
if (logoInput) {
  logoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const id = `logo-${Date.now()}`;
        const targetX = configStore.centerUV ? configStore.centerUV.x * 2048 - 150 : 874;
        const targetY = configStore.centerUV ? configStore.centerUV.y * 2048 - 150 : 874;

        configStore.logos.push({
          id,
          src: event.target.result,
          x: targetX, y: targetY, width: 300, height: 300, rotation: 0
        });
        configStore.setSelectedLogo(id);
      };
      reader.readAsDataURL(file);
    }
  });
}

// Text Addition
const addTextBtn = document.getElementById('add-text-btn');
if (addTextBtn) {
  addTextBtn.addEventListener('click', () => {
    const textVal = prompt('Enter custom text:', 'TRIKOMI 10');
    if (textVal) {
      const id = `text-${Date.now()}`;
      const targetX = configStore.centerUV ? configStore.centerUV.x * 2048 : 1024;
      const targetY = configStore.centerUV ? configStore.centerUV.y * 2048 : 800;

      configStore.texts.push({
        id,
        text: textVal,
        fontFamily: 'Inter',
        color: '#FFFFFF',
        x: targetX, y: targetY, fontSize: 72, rotation: 0
      });
      configStore.setSelectedText(id);
    }
  });
}

// Mobile Sidebar Toggle
const mobileBtn = document.getElementById('mobile-toggle-btn');
const sidebar = document.getElementById('sidebar-wrapper');
if (mobileBtn && sidebar) {
  mobileBtn.addEventListener('click', () => sidebar.classList.toggle('active'));
}

// Initial Model Load
loadModelIndex(0);
