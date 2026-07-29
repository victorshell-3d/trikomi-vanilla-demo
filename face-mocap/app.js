import {
  ThreeViewer,
  ViewerStore,
  GLTFPlugin,
  FaceMocapPlugin,
  THREE
} from '../shared-assets/dist/trikomi.esm.js';

const AVAILABLE_MODELS = [
  { id: 'glasses', name: 'Aviator Glasses', url: '../shared-assets/models/glasses.glb', scale: 1, isGlasses: true },
  { id: 'raccoon', name: 'Raccoon Mask', url: '../shared-assets/models/raccoon_head_small.glb', scale: 36, hasMorphTargets: true }
];

const videoElement = document.getElementById('webcam-video');
const debugCanvas = document.getElementById('debug-canvas');
const container = document.getElementById('canvas-container');
const stageContainer = document.getElementById('stage-container');
const loadingOverlay = document.getElementById('loading-overlay');
const modelNameDisplay = document.getElementById('model-name-display');

let viewer;
let store;
let mocapPlugin;
let gltfPlugin;
let currentModelIndex = 0;

// Update aspect-ratio matched stage layout to keep MediaPipe matrix perfectly aligned
function updateLayout() {
  if (!videoElement || !stageContainer) return;
  const vw = videoElement.videoWidth;
  const vh = videoElement.videoHeight;
  if (!vw || !vh) return;

  if (debugCanvas) {
    debugCanvas.width = vw;
    debugCanvas.height = vh;
  }

  const videoRatio = vw / vh;
  const windowRatio = window.innerWidth / window.innerHeight;

  if (windowRatio > videoRatio) {
    stageContainer.style.height = '100vh';
    stageContainer.style.width = `${100 * videoRatio}vh`;
  } else {
    stageContainer.style.width = '100vw';
    stageContainer.style.height = `${100 / videoRatio}vw`;
  }

  if (viewer && typeof viewer.handleResize === 'function') {
    viewer.handleResize();
  }
}

if (videoElement) {
  videoElement.addEventListener('loadeddata', updateLayout);
}
window.addEventListener('resize', updateLayout);

// Initialize Webcam Stream
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720, facingMode: 'user' }
  }).then(stream => {
    if (videoElement) {
      videoElement.srcObject = stream;
    }
  }).catch(err => {
    console.error('Webcam access error:', err);
  });
}

// 1. Initialize ViewerStore & ThreeViewer
store = new ViewerStore();
store.backgroundColor = 'transparent';

window.trikomi_config = { apiKey: 'vk_live_demo_key', fallbackJwt: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJkIjpbInZpY3RvcnNoZWxsLTNkLmdpdGh1Yi5pbyIsImxvY2FsaG9zdCIsIjEyNy4wLjAuMSIsInZpY3RvcnNoZWxsLmNvbSJdLCJwbHVnaW5zIjpbIjNEIFZpZXdlciIsIkpld2VscnkgQ29uZmlndXJhdG9yIiwiU3BvcnRzd2VhciBDb25maWd1cmF0b3IiLCJCb3ggUGFja2FnaW5nIENvbmZpZ3VyYXRvciIsIkZhY2UgTW90aW9uIENhcHR1cmUiLCJFeWV3ZWFyIFZpcnR1YWwgVHJ5LU9uIiwiMzYwXHUwMGIwIFZpcnR1YWwgVG91ciIsIlZpcnR1YWwgM0QgRXhoaWJpdGlvbiJdLCJmZWF0dXJlcyI6WyJWU1QwMDIiLCJWU1QwMDMiLCJWU1QwMDUiLCJWU1QwMDYiLCJWU1QwMDgiLCJWU1QxMDMiLCJWU1QxMDciLCJWU1Q0MDYiLCJWU1Q5MDEiLCJWU1QwMDEiLCJWU1QwMDQiLCJWU1QyMDEiLCJWU1QxMDQiLCJWU1QxMDYiLCJWU1QyMDIiLCJWU1QyMDMiLCJWU1QyMDQiLCJWU1QzMDEiLCJWU1QzMDIiLCJWU1QzMDMiLCJWU1QzMDQiLCJWU1QzMDUiLCJWU1QzMDYiLCJWU1Q0MDEiLCJWU1Q0MDIiLCJWU1Q0MDMiLCJWU1Q0MDQiLCJWU1Q0MDUiLCJWU1Q1MDEiLCJWU1Q1MDIiLCJWU1Q1MDMiLCJWU1Q1MDgiLCJWU1Q1MTIiLCJWU1QyMDUiLCJWU1QyMDYiLCJWU1Q1MDUiLCJWU1Q1MDYiLCJWU1Q1MDciLCJWU1Q1MDkiLCJWU1Q1MTAiLCJWU1Q1MTEiXSwiZSI6MjEwMDY1MDc2MTAwMCwidSI6MSwiYiI6ZmFsc2V9.gopHWyC4ZckjelH4xCb7vZlbnNdz78CAlNG_RE8WvklawoujG0BjeU9DIdAaVCf1HYAzouuKalwkN3nMD-xG2g' };
viewer = new ThreeViewer(container, store, {
  assetBaseUrl: '../shared-assets/assets/'
});

// Configure Camera for MediaPipe Facial Projection (~63deg FOV)
viewer.camera.position.set(0, 0, 0);
viewer.camera.rotation.set(0, 0, 0);
viewer.camera.lookAt(0, 0, -1);
viewer.camera.fov = 63;
viewer.camera.updateProjectionMatrix();

// 2. Attach Plugins
gltfPlugin = new GLTFPlugin();
viewer.addPlugin(gltfPlugin);

mocapPlugin = new FaceMocapPlugin('../shared-assets/wasm');
viewer.addPlugin(mocapPlugin);

if (videoElement) mocapPlugin.setVideoSource(videoElement);
if (debugCanvas) mocapPlugin.setDebugCanvas(debugCanvas);

// Load Head Occluder 3D Mesh
mocapPlugin.loadOccluder('../shared-assets/models/head_occluder.obj').catch(err => {
  console.warn('Occluder load warning:', err);
});

// Pre-load and Register Avatar Models
AVAILABLE_MODELS.forEach((def) => {
  gltfPlugin.gltfLoader.load(def.url, (gltf) => {
    let modelGroup;
    if (def.isGlasses) {
      gltf.scene.scale.set(100, 100, 100);
      modelGroup = new THREE.Group();
      modelGroup.add(gltf.scene);
    } else {
      modelGroup = gltf.scene;
    }

    viewer.scene.add(modelGroup);

    mocapPlugin.registerModel({
      id: def.id,
      model: modelGroup,
      scale: def.scale || 1,
      hasMorphTargets: def.hasMorphTargets !== false
    });

    if (def.id === AVAILABLE_MODELS[currentModelIndex].id) {
      mocapPlugin.activeModelId = def.id;
      if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
  });
});

function switchAvatar(index) {
  if (index < 0 || index >= AVAILABLE_MODELS.length) return;
  currentModelIndex = index;
  const def = AVAILABLE_MODELS[index];
  if (modelNameDisplay) modelNameDisplay.textContent = def.name;
  mocapPlugin.activeModelId = def.id;
}

// UI Control Listeners
const toggleGridBtn = document.getElementById('toggle-grid-btn');
const gridStatusText = document.getElementById('grid-status-text');
if (toggleGridBtn) {
  toggleGridBtn.addEventListener('click', () => {
    mocapPlugin.debugGrid = !mocapPlugin.debugGrid;
    toggleGridBtn.classList.toggle('active', mocapPlugin.debugGrid);
    if (gridStatusText) gridStatusText.textContent = mocapPlugin.debugGrid ? 'ON' : 'OFF';
  });
}

const toggleOccluderBtn = document.getElementById('toggle-occluder-btn');
const occluderStatusText = document.getElementById('occluder-status-text');
if (toggleOccluderBtn) {
  toggleOccluderBtn.addEventListener('click', () => {
    if (mocapPlugin.occluderVisible) {
      mocapPlugin.hideOccluder();
    } else {
      mocapPlugin.showOccluder();
    }
    toggleOccluderBtn.classList.toggle('active', mocapPlugin.occluderVisible);
    if (occluderStatusText) occluderStatusText.textContent = mocapPlugin.occluderVisible ? 'ON' : 'OFF';
  });
}

const toggleLipstickBtn = document.getElementById('toggle-lipstick-btn');
const lipstickStatusText = document.getElementById('lipstick-status-text');
if (toggleLipstickBtn) {
  toggleLipstickBtn.addEventListener('click', () => {
    mocapPlugin.lipstickVisible = !mocapPlugin.lipstickVisible;
    toggleLipstickBtn.classList.toggle('active', mocapPlugin.lipstickVisible);
    if (lipstickStatusText) lipstickStatusText.textContent = mocapPlugin.lipstickVisible ? 'ON' : 'OFF';
  });
}

const lipstickColorPicker = document.getElementById('lipstick-color-picker');
if (lipstickColorPicker) {
  lipstickColorPicker.addEventListener('input', (e) => {
    mocapPlugin.lipstickColor = e.target.value;
  });
}

const prevBtn = document.getElementById('prev-model-btn');
const nextBtn = document.getElementById('next-model-btn');
if (prevBtn) prevBtn.addEventListener('click', () => switchAvatar((currentModelIndex - 1 + AVAILABLE_MODELS.length) % AVAILABLE_MODELS.length));
if (nextBtn) nextBtn.addEventListener('click', () => switchAvatar((currentModelIndex + 1) % AVAILABLE_MODELS.length));
