// @ts-check
import {
  ThreeViewer,
  ViewerStore,
  GLTFPlugin,
  EnvironmentPlugin,
  OrbitControlsPlugin,
  CameraPlugin,
  EighthWallSDK,
  EXRLoader,
  autorun,
  THREE
} from '../shared-assets/dist/trikomi.esm.js';

/** @type {ThreeViewer} */
let viewer;
/** @type {GLTFPlugin} */
let gltfPlugin;
/** @type {EnvironmentPlugin} */
let envPlugin;
/** @type {OrbitControlsPlugin} */
let orbitPlugin;
/** @type {CameraPlugin} */
let cameraPlugin;
/** @type {EighthWallSDK} */
let eighthWallSDK;
/** @type {any} */
let currentHdrTexture = null;
let activeModelIndex = 0;

const AVAILABLE_MODELS = [
  { name: 'Aviator Classic', url: '../shared-assets/models/glasses1.glb', scale: 0.3 },
  { name: 'Sport Wrap', url: '../shared-assets/models/glasses2.glb', scale: 0.3 },
  { name: 'Wayfarer Style', url: '../shared-assets/models/glasses3.glb', scale: 0.3 },
  { name: 'Round Metal', url: '../shared-assets/models/glasses4.glb', scale: 0.3 },
  { name: 'Clubmaster', url: '../shared-assets/models/glasses5.glb', scale: 0.3 },
  { name: 'Hexagonal', url: '../shared-assets/models/glasses6.glb', scale: 0.3 }
];

/**
 * Safely applies color to Three.js / WebGPU TSL / MeshPhysicalMaterial
 * @param {any} mat 
 * @param {string} colorHex 
 */
function applyMaterialColor(mat, colorHex) {
  if (!mat || !colorHex) return;
  if (Array.isArray(mat)) {
    mat.forEach((m) => applyMaterialColor(m, colorHex));
    return;
  }
  try {
    if (mat.color) {
      if (typeof mat.color.set === 'function') {
        mat.color.set(colorHex);
      } else if (mat.color.value && typeof mat.color.value.set === 'function') {
        mat.color.value.set(colorHex);
      } else {
        mat.color = new THREE.Color(colorHex);
      }
    } else if (mat.colorNode && mat.colorNode.value && typeof mat.colorNode.value.set === 'function') {
      mat.colorNode.value.set(colorHex);
    }
    mat.needsUpdate = true;
  } catch (err) {
    console.warn("⚠️ [applyMaterialColor Warning]:", err);
  }
}

$(document).ready(function () {
  console.log("👓 Initializing Trikomi Eyewear Studio (3D ThreeViewer Scene)...");

  const container = $('#canvas-container')[0];
  const store = new ViewerStore();

  // Assign license file path from shared assets
  window.trikomi_lic = '../shared-assets/assets/v3d_victorshell_com.lic';

  // 1. Initialize ViewerStore Initial Defaults
  store.setAutoRotate(true);
  store.setBackgroundColor('#090c15');
  store.setShowEnvironment(true);
  store.setActiveModelName('Aviator Classic');
  store.setShowSidebar(true);
  store.setBloomEnabled(false);

  // 2. Instantiate Core ThreeViewer
  viewer = new ThreeViewer(container, store, {
    assetBaseUrl: '../shared-assets/assets/'
  });

  // 3. Attach standard 3D viewer plugins for 3D view mode
  gltfPlugin = new GLTFPlugin();
  envPlugin = new EnvironmentPlugin();
  orbitPlugin = new OrbitControlsPlugin();
  cameraPlugin = new CameraPlugin();

  viewer.addPlugin(gltfPlugin);
  viewer.addPlugin(envPlugin);
  viewer.addPlugin(orbitPlugin);
  viewer.addPlugin(cameraPlugin);

  // 4. Load initial model into 3D view mode via GLTFPlugin
  gltfPlugin.loadModel(AVAILABLE_MODELS[0].url);

  // 5. Instantiate EighthWallSDK for AR tracking mode
  if (typeof EighthWallSDK === 'function') {
    eighthWallSDK = new EighthWallSDK(store, AVAILABLE_MODELS, viewer);
  }

  loadHdrEnvironment('../shared-assets/environments/studio.exr');

  // Fade out loading overlay
  setTimeout(() => {
    $('#loading-overlay').addClass('fade-out');
  }, 800);

  // Helper to load HDR Environment
  function loadHdrEnvironment(envUrl) {
    if (envUrl && EXRLoader) {
      console.log("👓 Loading Eyewear Studio HDR Environment:", envUrl);
      const loader = new EXRLoader();
      loader.load(envUrl, function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        currentHdrTexture = texture;
        if (store.showEnvironment && viewer && viewer.scene) {
          viewer.scene.environment = currentHdrTexture;
        }
      });
    }
  }

  // -------------------------------------------------------------
  // MobX Store-to-UI Reactive Observers
  // -------------------------------------------------------------
  autorun(() => {
    const show = store.showSidebar;
    if (show) {
      $('#sidebar-panel').removeClass('hidden');
      $('#tb-toggle-sidebar').addClass('active');
    } else {
      $('#sidebar-panel').addClass('hidden');
      $('#tb-toggle-sidebar').removeClass('active');
    }
  });

  // -------------------------------------------------------------
  // Dual Mode AR Toggle Handler
  // -------------------------------------------------------------
  let isArActive = false;
  function toggleArMode() {
    if (!isArActive) {
      if (typeof window.XR8 === 'undefined' || typeof window.XR8.FaceController === 'undefined') {
        alert('8thWall XR8 library (xr.js) must be loaded for face AR tracking.');
        return;
      }
      try {
        console.log("🚀 [AR Mode]: Starting 8thWall face tracking pipeline...");
        const canvas = viewer?.renderer?.domElement;
        if (eighthWallSDK && canvas) {
          eighthWallSDK.initialize(canvas);

          eighthWallSDK.changeModel(activeModelIndex);
        }
        isArActive = true;
        $('#ar-status-dot').css({ background: '#00ff88', boxShadow: '0 0 8px #00ff88' });
        $('#ar-status-text').text('Live 8thWall AR Tracking Active');
        $('#btn-toggle-camera').html('<span>🔴</span> Exit 8thWall AR Mode');
      } catch (err) {
        console.warn("⚠️ AR init warning:", err);
      }
    } else {
      console.log("🎥 [3D Mode]: Stopping 8thWall AR — returning to ThreeViewer...");
      if (eighthWallSDK && typeof eighthWallSDK.stop === 'function') {
        eighthWallSDK.stop();
      }
      isArActive = false;
      $('#ar-status-dot').css({ background: '#06b6d4', boxShadow: '0 0 8px #06b6d4' });
      $('#ar-status-text').text('3D Studio Mode (8thWall Offline)');
      $('#btn-toggle-camera').html('<span>📷</span> Enable 8thWall AR Try-On');
    }
  }

  // -------------------------------------------------------------
  // User UI Event Handlers
  // -------------------------------------------------------------
  $('#btn-toggle-camera').on('click', function () {
    toggleArMode();
  });

  $('#tb-toggle-sidebar').on('click', function () {
    store.setShowSidebar(!store.showSidebar);
  });

  $('#tb-fullscreen').on('click', function () {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  });

  $('#tb-snapshot').on('click', function () {
    console.log("📸 Taking HD snapshot...");
    if (viewer && viewer.renderer && viewer.scene && viewer.camera) {
      if (viewer.isInitialized) {
        viewer.renderer.render(viewer.scene, viewer.camera);
      }
      const dataUrl = viewer.renderer.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `3d-${store.activeModelName.toLowerCase().replace(/\s+/g, '-')}-snapshot.png`;
      link.click();
    }
  });

  $('#tb-autorotate').on('click', function () {
    const next = !store.autoRotate;
    store.setAutoRotate(next);
    if (next) $('#tb-autorotate').addClass('active');
    else $('#tb-autorotate').removeClass('active');
  });

  // Eyewear Model Selection Handler
  $('.frame-card').on('click', function () {
    $('.frame-card').removeClass('active');
    $(this).addClass('active');

    const modelName = $(this).attr('data-name');
    const modelUrl = $(this).attr('data-model');
    activeModelIndex = parseInt($(this).attr('data-index') || '0', 10);

    if (modelName) {
      console.log("👓 Changing 3D Eyewear Model:", activeModelIndex, modelName, modelUrl);
      store.setActiveModelName(modelName);

      if (eighthWallSDK && typeof eighthWallSDK.changeModel === 'function') {
        eighthWallSDK.changeModel(activeModelIndex);
      }
    }
  });

  // Frame Material Color Swatches
  $('.frame-swatch').on('click', function () {
    $('.frame-swatch').removeClass('active');
    $(this).addClass('active');

    const colorHex = $(this).attr('data-color');
    if (colorHex && viewer && viewer.scene) {
      console.log("👓 Changing Frame Color:", colorHex);
      viewer.scene.traverse((node) => {
        if (node.isMesh && node.material) {
          const mat = node.material;
          const nodeName = (node.name || '').toLowerCase();
          const matName = (mat.name || '').toLowerCase();
          if (!nodeName.includes('lens') && !matName.includes('lens') && !nodeName.includes('glass')) {
            applyMaterialColor(mat, colorHex);
          }
        }
      });
    }
  });

  // Lens Tint Color Swatches
  $('.lens-swatch').on('click', function () {
    $('.lens-swatch').removeClass('active');
    $(this).addClass('active');

    const colorHex = $(this).attr('data-color');
    if (colorHex && viewer && viewer.scene) {
      console.log("🕶️ Changing Lens Tint Color:", colorHex);
      viewer.scene.traverse((node) => {
        if (node.isMesh && node.material) {
          const mat = node.material;
          const nodeName = (node.name || '').toLowerCase();
          const matName = (mat.name || '').toLowerCase();
          if (nodeName.includes('lens') || matName.includes('lens') || nodeName.includes('glass')) {
            applyMaterialColor(mat, colorHex);
          }
        }
      });
    }
  });
});
