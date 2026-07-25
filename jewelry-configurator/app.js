import {
  ThreeViewer,
  ViewerStore,
  GLTFPlugin,
  EnvironmentPlugin,
  OrbitControlsPlugin,
  CameraPlugin,
  DiamondPlugin,
  BloomPlugin,
  EXRLoader,
  autorun,
  THREE,
  applyMaterialColor,
  scanModelMaterialGroups
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
/** @type {DiamondPlugin} */
let diamondPlugin;
/** @type {BloomPlugin} */
let bloomPlugin;
/** @type {any} */
let currentHdrTexture = null;
/** @type {Map<string, any>} */
let modelMaterialGroups = new Map();

function updateJewelryMaterialGroups() {
  if (viewer && viewer.scene) {
    modelMaterialGroups = scanModelMaterialGroups(viewer.scene, true);
    console.log(`✨ Scanned ${modelMaterialGroups.size} groupwise jewelry material slots:`, Array.from(modelMaterialGroups.keys()));
  }
}

$(document).ready(function () {
  console.log("💍 Initializing Trikomi Luxury 3D Jewelry Configurator Studio with Bloom & Groupwise Controls...");

  const container = $('#canvas-container')[0];
  const store = new ViewerStore();

  // Assign license file path from shared assets
  window.trikomi_lic = '../shared-assets/assets/v3d_victorshell_com.lic';

  // 1. Initialize ViewerStore Initial Defaults cleanly
  store.setAutoRotate(true);
  store.setBackgroundColor('#070814');
  store.setShowEnvironment(true);
  store.setActiveModelName('Classic Solitaire Ring');
  store.setShowSidebar(true);

  // Enable Bloom Post-Processing in ViewerStore
  store.setBloomEnabled(true);


  // 2. Instantiate Core ThreeViewer with assetBaseUrl pointing to shared-assets/assets
  viewer = new ThreeViewer(container, store, {
    assetBaseUrl: '../shared-assets/assets/'
  });

  // 3. Attach Modular Plugins (including BloomPlugin & DiamondPlugin)
  gltfPlugin = new GLTFPlugin();
  envPlugin = new EnvironmentPlugin();
  orbitPlugin = new OrbitControlsPlugin();
  cameraPlugin = new CameraPlugin();
  diamondPlugin = new DiamondPlugin();
  bloomPlugin = new BloomPlugin();

  viewer.addPlugin(gltfPlugin);
  viewer.addPlugin(envPlugin);
  viewer.addPlugin(orbitPlugin);
  viewer.addPlugin(cameraPlugin);
  viewer.addPlugin(diamondPlugin);
  viewer.addPlugin(bloomPlugin);

  // 4. Load Initial Ring Model & Diamond Studio Environment from shared assets
  viewer.loadModelFromUrl('../shared-assets/models/ring.glb');
  loadHdrEnvironment('../shared-assets/environments/diamond_env.exr');

  // Scan model material groups after load
  setTimeout(() => {
    updateJewelryMaterialGroups();
    $('#loading-overlay').addClass('fade-out');
  }, 1000);

  // Helper to load HDR Environment
  function loadHdrEnvironment(envUrl) {
    if (envUrl && EXRLoader) {
      console.log("💎 Loading Diamond Studio HDR Environment:", envUrl);
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
  // Dynamic E-Commerce Price Calculator Logic
  // -------------------------------------------------------------
  function recalculatePrice() {
    const basePrice = parseInt($('#select-ring option:selected').attr('data-base-price') || '2450', 10);
    const gemPrice = parseInt($('.gem-card.active').attr('data-add-price') || '0', 10);
    const metalPrice = parseInt($('.metal-card.active').attr('data-add-price') || '0', 10);
    const caratPrice = parseInt($('.carat-btn.active').attr('data-add-price') || '0', 10);

    const totalPrice = basePrice + gemPrice + metalPrice + caratPrice;
    const formattedPrice = '$' + totalPrice.toLocaleString('en-US') + '.00';
    $('#pdp-price').text(formattedPrice);
  }

  recalculatePrice();

  // -------------------------------------------------------------
  // MobX Store-to-UI Reactive Observers
  // -------------------------------------------------------------
  autorun(() => {
    const isRotate = store.autoRotate;
    if (orbitPlugin && orbitPlugin.controls) {
      orbitPlugin.controls.autoRotate = isRotate;
    }
    if (isRotate) {
      $('#tb-autorotate').addClass('active');
    } else {
      $('#tb-autorotate').removeClass('active');
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

  $('#tb-autorotate').on('click', function () {
    store.setAutoRotate(!store.autoRotate);
  });

  $('#select-ring').on('change', function () {
    const ringUrl = $(this).val();
    const ringName = $('#select-ring option:selected').text();
    if (ringUrl) {
      console.log("💍 Loading ring design:", ringUrl);
      $('#pdp-title').text(ringName);
      store.setActiveModelName(ringName);
      viewer.loadModelFromUrl(ringUrl);
      recalculatePrice();

      setTimeout(() => {
        updateJewelryMaterialGroups();
      }, 1000);
    }
  });

  // Groupwise Gemstone Finish Swatches
  $('.gem-card').on('click', function () {
    $('.gem-card').removeClass('active');
    $(this).addClass('active');

    const colorHex = $(this).attr('data-gem-color');
    recalculatePrice();

    if (colorHex) {
      console.log("💎 Changing Groupwise Gemstone Color:", colorHex);
      const gemGroup = modelMaterialGroups.get('Center Gemstone & Diamonds');
      if (gemGroup && gemGroup.materials.length > 0) {
        gemGroup.materials.forEach(mat => applyMaterialColor(mat, colorHex));
      } else if (viewer && viewer.scene) {
        // Fallback traversal
        viewer.scene.traverse((node) => {
          if (/** @type {any} */ (node).isMesh && /** @type {any} */ (node).material) {
            const mat = /** @type {any} */ (node).material;
            const matName = (mat.name || '').toLowerCase();
            const nodeName = (node.name || '').toLowerCase();
            if (nodeName.includes('diamond') || nodeName.includes('gem') || matName.includes('diamond')) {
              applyMaterialColor(mat, colorHex);
            }
          }
        });
      }
    }
  });

  // Groupwise Precious Metal Band Swatches
  $('.metal-card').on('click', function () {
    $('.metal-card').removeClass('active');
    $(this).addClass('active');

    const colorHex = $(this).attr('data-metal-color');
    recalculatePrice();

    if (colorHex) {
      console.log("✨ Changing Groupwise Metal Band Color:", colorHex);
      const settingGroup = modelMaterialGroups.get('Setting & Band');
      const shankGroup = modelMaterialGroups.get('Ring Shank Band');
      const prongGroup = modelMaterialGroups.get('Prongs & Accents');

      const targetGroups = [settingGroup, shankGroup, prongGroup].filter(Boolean);
      if (targetGroups.some(g => g && g.materials.length > 0)) {
        targetGroups.forEach(grp => {
          grp?.materials.forEach(mat => applyMaterialColor(mat, colorHex));
        });
      } else if (viewer && viewer.scene) {
        // Fallback traversal
        viewer.scene.traverse((node) => {
          if (/** @type {any} */ (node).isMesh && /** @type {any} */ (node).material) {
            const mat = /** @type {any} */ (node).material;
            const matName = (mat.name || '').toLowerCase();
            const nodeName = (node.name || '').toLowerCase();
            if (!nodeName.includes('diamond') && !nodeName.includes('gem') && !matName.includes('diamond')) {
              applyMaterialColor(mat, colorHex);
            }
          }
        });
      }
    }
  });

  $('.carat-btn').on('click', function () {
    $('.carat-btn').removeClass('active');
    $(this).addClass('active');
    recalculatePrice();
  });

  $('.ring-size-btn').on('click', function () {
    $('.ring-size-btn').removeClass('active');
    $(this).addClass('active');
  });

  $('#btn-add-to-cart').on('click', function () {
    const ringName = $('#pdp-title').text();
    const carat = $('.carat-btn.active').attr('data-carat');
    const size = $('.ring-size-btn.active').attr('data-size');
    const price = $('#pdp-price').text();

    const toastMsg = `Added ${carat} CT ${ringName} (${size}) for ${price} to cart!`;
    console.log("🛒 Shopping Cart Toast:", toastMsg);

    $('#toast-message').text(toastMsg);
    $('#toast').addClass('show');

    setTimeout(() => {
      $('#toast').removeClass('show');
    }, 3500);
  });
});
