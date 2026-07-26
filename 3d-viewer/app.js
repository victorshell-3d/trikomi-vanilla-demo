import { SDK_VERSION } from '../shared-assets/dist/version.js';
import {
  ThreeViewer,
  ViewerStore,
  GLTFPlugin,
  EnvironmentPlugin,
  OrbitControlsPlugin,
  CameraPlugin,
  BloomPlugin,
  EXRLoader,
  autorun,
  THREE,
  applyMaterialColor,
  scanModelMaterialGroups
} from `../shared-assets/dist/trikomi.esm.js?v=${SDK_VERSION}`;

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
/** @type {BloomPlugin} */
let bloomPlugin;
/** @type {any} */
let currentHdrTexture = null;
/** @type {Map<string, any>} */
let modelMaterialGroups = new Map();

function updateViewerMaterialGroups() {
  if (viewer && viewer.scene) {
    modelMaterialGroups = scanModelMaterialGroups(viewer.scene, false);
    console.log(`✨ Scanned ${modelMaterialGroups.size} groupwise material slots in 3D Viewer:`, Array.from(modelMaterialGroups.keys()));

    const slotSelect = $('#select-material-slot');
    slotSelect.empty();
    slotSelect.append('<option value="all">All Material Slots</option>');

    modelMaterialGroups.forEach((_grp, key) => {
      slotSelect.append(`<option value="${key}">${key}</option>`);
    });
  }
}

$(document).ready(function () {
  console.log("🚀 Initializing Trikomi 3D Viewer App with Bloom & Groupwise Controls...");

  const container = $('#canvas-container')[0];
  const store = new ViewerStore();

  // Assign license file path with SDK version cache-busting parameter
  window.trikomi_lic = `../shared-assets/assets/v3d_victorshell_com.lic?v=${SDK_VERSION}`;

  // 1. Initialize ViewerStore Initial Defaults cleanly
  store.setAutoRotate(true);
  store.setBackgroundColor('#0d1117');
  store.setShowEnvironment(true);
  store.setActiveModelName('Glasses Frame 1');
  store.setShowSidebar(true);

  // Enable Bloom Post-Processing in ViewerStore
  store.setBloomEnabled(false);


  // 2. Instantiate Core ThreeViewer with assetBaseUrl pointing to shared-assets/assets
  viewer = new ThreeViewer(container, store, {
    assetBaseUrl: '../shared-assets/assets/'
  });

  // 3. Attach Modular Plugins (including BloomPlugin)
  gltfPlugin = new GLTFPlugin();
  envPlugin = new EnvironmentPlugin();
  orbitPlugin = new OrbitControlsPlugin();
  cameraPlugin = new CameraPlugin();
  bloomPlugin = new BloomPlugin();

  viewer.addPlugin(gltfPlugin);
  viewer.addPlugin(envPlugin);
  viewer.addPlugin(orbitPlugin);
  viewer.addPlugin(cameraPlugin);
  viewer.addPlugin(bloomPlugin);

  // 4. Load Initial Model & HDR Environment from shared assets
  viewer.loadModelFromUrl('../shared-assets/models/glasses1.glb');
  loadHdrEnvironment('../shared-assets/environments/studio.exr');

  // Fade out loading overlay once initialized
  setTimeout(() => {
    updateViewerMaterialGroups();
    $('#loading-overlay').addClass('fade-out');
  }, 800);

  // Helper to load HDR Environment
  function loadHdrEnvironment(envUrl) {
    if (envUrl && EXRLoader) {
      console.log("🎨 Loading HDR Environment:", envUrl);
      const loader = new EXRLoader();
      loader.load(envUrl, function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        currentHdrTexture = texture;
        if (store.showEnvironment) {
          viewer.scene.environment = currentHdrTexture;
        }
      });
    }
  }

  // -------------------------------------------------------------
  // MobX Store-to-UI Reactive Observers
  // -------------------------------------------------------------
  autorun(() => {
    $('#active-model-name').text(store.activeModelName);
  });

  autorun(() => {
    const isRotate = store.autoRotate;
    if (orbitPlugin && orbitPlugin.controls) {
      orbitPlugin.controls.autoRotate = isRotate;
    }
    if (isRotate) {
      $('#tb-autorotate, #toggle-autorotate-btn').addClass('active');
      $('#toggle-autorotate-btn').text('ON');
    } else {
      $('#tb-autorotate, #toggle-autorotate-btn').removeClass('active');
      $('#toggle-autorotate-btn').text('OFF');
    }
  });

  autorun(() => {
    const bg = store.backgroundColor;
    $('.bg-card').removeClass('active');
    $(`.bg-card[data-color="${bg}"]`).addClass('active');
  });

  autorun(() => {
    const isShowEnv = store.showEnvironment;
    if (isShowEnv) {
      $('#toggle-reflections-btn').addClass('active').text('ON');
      if (currentHdrTexture && viewer && viewer.scene) {
        viewer.scene.environment = currentHdrTexture;
      }
    } else {
      $('#toggle-reflections-btn').removeClass('active').text('OFF');
      if (viewer && viewer.scene) {
        viewer.scene.environment = null;
      }
    }
  });

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
  // User UI Event Handlers
  // -------------------------------------------------------------
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

  $('#tb-reset').on('click', function () {
    console.log("🎥 Resetting camera view...");
    if (orbitPlugin) {
      orbitPlugin.resetView();
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
      link.download = `${store.activeModelName.toLowerCase().replace(/\s+/g, '-')}-snapshot.png`;
      link.click();
    }
  });

  $('#select-model').on('change', function () {
    const modelUrl = $(this).val();
    const modelText = $('#select-model option:selected').text();
    if (modelUrl) {
      console.log("📦 Loading model:", modelUrl);
      store.setActiveModelName(modelText.split('(')[0].trim());
      viewer.loadModelFromUrl(modelUrl);
      setTimeout(() => {
        updateViewerMaterialGroups();
      }, 1000);
    }
  });

  $('.material-card').on('click', function () {
    $('.material-card').removeClass('active');
    $(this).addClass('active');

    const colorHex = $(this).attr('data-material-color');
    const selectedSlot = $('#select-material-slot').val();

    if (colorHex && viewer && viewer.scene) {
      console.log(`🎨 Changing Material Color for slot "${selectedSlot}":`, colorHex);
      if (selectedSlot === 'all') {
        modelMaterialGroups.forEach(grp => {
          grp.materials.forEach(mat => applyMaterialColor(mat, colorHex));
        });
      } else if (modelMaterialGroups.has(selectedSlot)) {
        const grp = modelMaterialGroups.get(selectedSlot);
        grp.materials.forEach(mat => applyMaterialColor(mat, colorHex));
      } else {
        viewer.scene.traverse((node) => {
          if (/** @type {any} */ (node).isMesh && /** @type {any} */ (node).material) {
            applyMaterialColor(/** @type {any} */(node).material, colorHex);
          }
        });
      }
    }
  });

  $('#select-env').on('change', function () {
    const envUrl = $(this).val();
    loadHdrEnvironment(envUrl);
  });

  $('.bg-card').on('click', function () {
    const colorHex = $(this).attr('data-color');
    if (colorHex) {
      console.log("🖌️ Mutating ViewerStore backgroundColor:", colorHex);
      store.setBackgroundColor(colorHex);
    }
  });

  $('#toggle-reflections-btn').on('click', function () {
    store.setShowEnvironment(!store.showEnvironment);
  });

  $('#toggle-autorotate-btn, #tb-autorotate').on('click', function () {
    store.setAutoRotate(!store.autoRotate);
  });
});
