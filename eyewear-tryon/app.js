import {
  ThreeViewer,
  ViewerStore,
  GLTFPlugin,
  EnvironmentPlugin,
  OrbitControlsPlugin,
  CameraPlugin,
  EighthWallSDK,
  EXRLoader,
  makeAutoObservable,
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

const AVAILABLE_MODELS = [
  { name: 'Aviator Classic', url: '../shared-assets/models/glasses1.glb' },
  { name: 'Sport Wrap', url: '../shared-assets/models/glasses2.glb' },
  { name: 'Wayfarer Style', url: '../shared-assets/models/glasses3.glb' },
  { name: 'Round Metal', url: '../shared-assets/models/glasses4.glb' },
  { name: 'Clubmaster', url: '../shared-assets/models/glasses5.glb' },
  { name: 'Hexagonal', url: '../shared-assets/models/glasses6.glb' }
];

// 1. Create ViewerStore instance (ViewerStore constructor already initializes MobX auto-observables)
const store = new ViewerStore();
store.isArActive = false;
store.modelIndex = 0;
store.glassConfigs = { meshes: [], materials: [] };
store.materialProps = {};
store.showSidebar = true;
store.setShowSidebar = function (val) { this.showSidebar = val; };

$(document).ready(function () {
  console.log("👓 Initializing Trikomi Eyewear Studio (Pure Vanilla JS)...");

  const container = $('#canvas-container')[0];
  window.trikomi_config = {
    apiKey: 'vk_live_mvsugpsup02xd1i7',
    fallbackJwt: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJraWQiOiJ2a19saXZlX212c3VncHN1cDAyeGQxaTciLCJkIjpbImdpdGh1Yi5pbyIsImxvY2FsaG9zdCIsInZpY3RvcnNoZWxsLmNvbSIsIjEyNy4wLjAuMSJdLCJwbHVnaW5zIjpbIjNEIFZpZXdlciIsIkpld2VscnkgQ29uZmlndXJhdG9yIiwiU3BvcnRzd2VhciBDb25maWd1cmF0b3IiLCJCb3ggUGFja2FnaW5nIENvbmZpZ3VyYXRvciIsIkZhY2UgTW90aW9uIENhcHR1cmUiLCJFeWV3ZWFyIFZpcnR1YWwgVHJ5LU9uIiwiMzYwXHUwMGIwIFZpcnR1YWwgVG91ciIsIlZpcnR1YWwgM0QgRXhoaWJpdGlvbiJdLCJmZWF0dXJlcyI6WyJWU1QwMDIiLCJWU1QwMDMiLCJWU1QwMDUiLCJWU1QwMDYiLCJWU1QwMDgiLCJWU1QxMDMiLCJWU1QxMDciLCJWU1Q5MDEiLCJWU1QwMDEiLCJWU1QwMDQiLCJWU1QyMDEiLCJWU1QxMDQiLCJWU1QxMDYiLCJWU1QyMDIiLCJWU1QyMDMiLCJWU1QyMDQiLCJWU1QzMDEiLCJWU1QzMDIiLCJWU1QzMDMiLCJWU1QzMDQiLCJWU1QzMDUiLCJWU1QzMDYiLCJWU1Q0MDEiLCJWU1Q0MDIiLCJWU1Q0MDMiLCJWU1Q0MDQiLCJWU1Q0MDUiLCJWU1Q1MDEiLCJWU1Q1MDIiLCJWU1Q1MDMiLCJWU1Q1MDgiLCJWU1Q1MTIiLCJWU1QyMDUiLCJWU1QyMDYiXSwiZSI6MjEwMTA2MTQyMDAwMCwidSI6MSwiYiI6ZmFsc2V9.wYdTAP91vsvkhl8ZBvKzwMULPKLGEPMULrYXEvUxYH63HJ4_yPjB90ixjsNbQBzExA3ii22HS7ndXr2W_p42Hg'
  };

  // 1. Instantiate ThreeViewer
  viewer = new ThreeViewer(container, store, {
    assetBaseUrl: '../shared-assets/assets/'
  });

  // 2. Attach ThreeViewer Plugins
  gltfPlugin = new GLTFPlugin();
  envPlugin = new EnvironmentPlugin();
  orbitPlugin = new OrbitControlsPlugin();
  cameraPlugin = new CameraPlugin();

  viewer.addPlugin(gltfPlugin);
  viewer.addPlugin(envPlugin);
  viewer.addPlugin(orbitPlugin);
  viewer.addPlugin(cameraPlugin);

  // 3. Instantiate EighthWallSDK for AR mode
  if (typeof EighthWallSDK === 'function') {
    eighthWallSDK = new EighthWallSDK(store, AVAILABLE_MODELS, viewer);
  }

  // 4. Initial load of default model in 3D Studio mode
  load3DStudioModel(0);

  // Load HDR Environment
  if (EXRLoader) {
    const loader = new EXRLoader();
    loader.load('../shared-assets/environments/studio.exr', function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      currentHdrTexture = texture;
      if (viewer && viewer.scene) {
        viewer.scene.environment = currentHdrTexture;
      }
    });
  }

  // Fade out initial loading overlay
  setTimeout(() => {
    $('#loading-overlay').addClass('fade-out');
  }, 800);

  // -------------------------------------------------------------
  // Helper: Load Model in 3D Studio Mode & Extract Materials
  // -------------------------------------------------------------
  function load3DStudioModel(index) {
    const modelDef = AVAILABLE_MODELS[index];
    if (!modelDef || !gltfPlugin) return Promise.resolve();

    console.log("👓 Loading 3D Model:", index, modelDef.name);
    return gltfPlugin.loadModel(modelDef.url).then((loadedModel) => {
      if (orbitPlugin && typeof orbitPlugin.resetView === 'function') {
        try { orbitPlugin.resetView(); } catch (e) { }
      }

      // Extract materials for UI color swatches
      const extractedMatNames = [];
      loadedModel.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(mat => {
            if (mat.name && !extractedMatNames.includes(mat.name)) {
              extractedMatNames.push(mat.name);
            }
          });
        }
      });
      store.glassConfigs.materials = extractedMatNames;

      // Re-apply preserved material colors
      applyPreservedColorsToScene();
      return loadedModel;
    });
  }

  // -------------------------------------------------------------
  // Helper: Apply Preserved Material Colors to 3D Scene
  // -------------------------------------------------------------
  function applyPreservedColorsToScene() {
    if (!store.materialProps) return;

    const applyToNode = (node) => {
      if (node.isMesh && node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach(mat => {
          const props = store.materialProps[mat.name];
          if (props && props.color && mat.color && typeof mat.color.set === 'function') {
            mat.color.set(props.color);
            mat.needsUpdate = true;
          }
        });
      }
    };

    if (viewer && viewer.scene) {
      viewer.scene.traverse(applyToNode);
    }
    if (eighthWallSDK && eighthWallSDK.faceGroup) {
      eighthWallSDK.faceGroup.traverse(applyToNode);
    }
  }

  // -------------------------------------------------------------
  // Helper: Update Material Color in AR or 3D Studio Mode
  // -------------------------------------------------------------
  function changeMaterialColor(isLens, colorHex) {
    const materials = store.glassConfigs.materials || [];
    materials.forEach((matName) => {
      const isTarget = isLens
        ? (matName.toLowerCase().includes('lens') || matName.toLowerCase().includes('glass'))
        : (!matName.toLowerCase().includes('lens') && !matName.toLowerCase().includes('glass'));

      if (isTarget) {
        if (!store.materialProps[matName]) store.materialProps[matName] = {};
        store.materialProps[matName].color = colorHex;

        if (store.isArActive && eighthWallSDK) {
          eighthWallSDK.changeColor(matName, colorHex);
        }
      }
    });

    // Explicitly apply to current active scene/AR group
    applyPreservedColorsToScene();
  }

  // -------------------------------------------------------------
  // User UI Event Listeners (Direct Vanilla JS Event Handlers)
  // -------------------------------------------------------------

  // AR / 3D Mode Toggle
  $('#btn-toggle-camera').on('click', function () {
    if (!store.isArActive && (typeof window.XR8 === 'undefined' || typeof window.XR8.FaceController === 'undefined')) {
      alert('8thWall XR8 library (xr.js) must be loaded for face AR tracking.');
      return;
    }

    store.isArActive = !store.isArActive;

    if (store.isArActive) {
      // ENTER AR MODE
      console.log("🚀 Starting 8thWall AR WebAR scene...");
      $('#ar-status-dot').css({ background: '#00ff88', boxShadow: '0 0 8px #00ff88' });
      $('#ar-status-text').text('Live 8thWall AR Tracking Active');
      $('#btn-toggle-camera').html('<span>🔴</span> Exit 8thWall AR Mode');

      if (viewer && typeof viewer.pause === 'function') viewer.pause();
      if (viewer && viewer.renderer && viewer.renderer.domElement) {
        viewer.renderer.domElement.style.display = 'none';
      }

      if (eighthWallSDK) {
        eighthWallSDK.initialize();
        eighthWallSDK.changeModel(store.modelIndex).then(() => {
          applyPreservedColorsToScene();
        }).catch(console.error);
      }
      $('#attribution-overlay').removeClass('hidden');
    } else {
      // EXIT AR MODE -> BACK TO 3D STUDIO
      console.log("🎥 Returning to 3D Studio scene...");
      $('#ar-status-dot').css({ background: '#06b6d4', boxShadow: '0 0 8px #06b6d4' });
      $('#ar-status-text').text('3D Studio Mode (8thWall Offline)');
      $('#btn-toggle-camera').html('<span>📷</span> Enable 8thWall AR Try-On');
      $('#attribution-overlay').addClass('hidden');

      if (eighthWallSDK) {
        eighthWallSDK.stop();
      }

      try {
        document.documentElement.removeAttribute('style');
        document.body.removeAttribute('style');
      } catch (e) { }

      if (viewer && viewer.renderer && viewer.renderer.domElement) {
        viewer.renderer.domElement.style.display = 'block';
        viewer.renderer.domElement.style.width = '100%';
        viewer.renderer.domElement.style.height = '100%';
      }

      if (viewer && typeof viewer.handleResize === 'function') viewer.handleResize();
      if (viewer && typeof viewer.play === 'function') viewer.play();

      load3DStudioModel(store.modelIndex);
    }
  });

  // Eyewear Model Selection Card Click
  $('.frame-card').on('click', function () {
    $('.frame-card').removeClass('active');
    $(this).addClass('active');

    const modelName = $(this).attr('data-name');
    const idx = parseInt($(this).attr('data-index') || '0', 10);

    if (modelName !== undefined) {
      console.log("👓 Selected Eyewear Model:", idx, modelName);
      store.activeModelName = modelName;
      store.modelIndex = idx;

      if (store.isArActive) {
        if (eighthWallSDK) {
          eighthWallSDK.changeModel(idx).then(() => {
            applyPreservedColorsToScene();
          }).catch(console.error);
        }
      } else {
        load3DStudioModel(idx);
      }
    }
  });

  // Frame Color Swatches Click
  $('.frame-swatch').on('click', function () {
    $('.frame-swatch').removeClass('active');
    $(this).addClass('active');

    const colorHex = $(this).attr('data-color');
    if (colorHex) {
      console.log("👓 Frame Color Click:", colorHex);
      changeMaterialColor(false, colorHex);
    }
  });

  // Lens Color Swatches Click
  $('.lens-swatch').on('click', function () {
    $('.lens-swatch').removeClass('active');
    $(this).addClass('active');

    const colorHex = $(this).attr('data-color');
    if (colorHex) {
      console.log("🕶️ Lens Color Click:", colorHex);
      changeMaterialColor(true, colorHex);
    }
  });

  // Toolbar Button Handlers
  $('#tb-toggle-sidebar').on('click', function () {
    store.showSidebar = !store.showSidebar;
    if (store.showSidebar) {
      $('#sidebar-panel').removeClass('hidden');
      $('#tb-toggle-sidebar').addClass('active');
    } else {
      $('#sidebar-panel').addClass('hidden');
      $('#tb-toggle-sidebar').removeClass('active');
    }
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

    let canvasElement = null;
    let filePrefix = '3d';

    if (store.isArActive && typeof window.XR8 !== 'undefined') {
      try {
        const xrScene = window.XR8.Threejs.xrScene();
        if (xrScene && xrScene.renderer) {
          xrScene.renderer.render(xrScene.scene, xrScene.camera);
          canvasElement = xrScene.renderer.domElement;
        }
      } catch (err) { }
      if (!canvasElement) canvasElement = document.getElementById('camerafeed') || document.querySelector('canvas');
      filePrefix = 'ar';
    } else {
      if (viewer && viewer.renderer && viewer.scene && viewer.camera) {
        if (viewer.isInitialized) {
          viewer.renderer.render(viewer.scene, viewer.camera);
        }
        canvasElement = viewer.renderer.domElement;
      }
    }

    if (canvasElement) {
      try {
        const dataUrl = canvasElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${filePrefix}-${(store.activeModelName || 'glasses').toLowerCase().replace(/\s+/g, '-')}-snapshot.png`;
        link.click();
      } catch (err) {
        console.warn("⚠️ Failed to generate snapshot:", err);
        alert("Snapshot failed. This might be due to WebGL preserveDrawingBuffer settings in AR mode.");
      }
    } else {
      console.warn("⚠️ Could not locate rendering canvas for snapshot.");
    }
  });

  $('#tb-autorotate').on('click', function () {
    store.autoRotate = !store.autoRotate;
    if (store.autoRotate) $('#tb-autorotate').addClass('active');
    else $('#tb-autorotate').removeClass('active');
  });

  $('#tb-reset').on('click', function () {
    console.log("🎥 Resetting 3D View...");
    if (orbitPlugin && typeof orbitPlugin.resetView === 'function') {
      try {
        orbitPlugin.resetView();
      } catch (err) {
        console.warn("⚠️ Reset View error:", err);
      }
    }
  });
});
