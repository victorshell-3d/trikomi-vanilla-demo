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

/** @type {Array<{ id: string, name: string, color: string, mat: any, mesh: any, isDiamond: boolean }>} */
let scannedMaterials = [];

function renderDynamicMaterialControls() {
  const container = $('#dynamic-materials-container');
  container.empty();

  if (!scannedMaterials || scannedMaterials.length === 0) return;

  const GEM_PRESETS = [
    { name: 'Diamond', color: '#ffffff', addPrice: 0 },
    { name: 'Emerald', color: '#00ff88', addPrice: 400 },
    { name: 'Sapphire', color: '#0077ff', addPrice: 350 },
    { name: 'Ruby', color: '#ff0055', addPrice: 500 },
    { name: 'Black Diamond', color: '#111111', addPrice: 250 },
  ];

  const METAL_PRESETS = [
    { name: '18K Yellow Gold', color: '#ffd700', addPrice: 0 },
    { name: 'Platinum', color: '#e5e4e2', addPrice: 600 },
    { name: 'Rose Gold', color: '#b76e79', addPrice: 150 },
    { name: 'Black Titanium', color: '#111111', addPrice: 250 },
  ];

  scannedMaterials.forEach((item, index) => {
    const isGem = item.isDiamond || item.name.toLowerCase().includes('gem') || item.name.toLowerCase().includes('diamond');
    const presets = isGem ? GEM_PRESETS : METAL_PRESETS;
    const cardId = `mat_card_${index}`;
    const displayName = item.name.replace(/_/g, ' ');

    let presetsHtml = '';
    presets.forEach((preset, idx) => {
      const activeClass = idx === 0 ? 'active' : '';
      const dotShadow = preset.color === '#ffffff' ? 'box-shadow: 0 0 6px rgba(255,255,255,0.8);' : '';
      presetsHtml += `
        <button class="preset-card dyn-swatch-${cardId} ${activeClass}" data-color="${preset.color}" data-add-price="${preset.addPrice}">
          <span class="color-dot" style="background: ${preset.color}; ${dotShadow}"></span>
          <span class="preset-name">${preset.name}</span>
        </button>
      `;
    });

    const sectionHtml = `
      <div class="section" id="sec_${cardId}">
        <div class="section-label" style="display: flex; justify-content: space-between; align-items: center;">
          <span style="text-transform: capitalize; font-weight: 700;">${displayName}</span>
          <input type="color" class="dyn-picker-${cardId}" value="${item.color}" style="border: none; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; background: transparent;" title="Custom Color Picker">
        </div>
        <div class="preset-grid">
          ${presetsHtml}
        </div>
      </div>
    `;

    container.append(sectionHtml);

    // Event Handler for Preset Swatches
    $(`.dyn-swatch-${cardId}`).on('click', function () {
      $(`.dyn-swatch-${cardId}`).removeClass('active');
      $(this).addClass('active');

      const colorHex = $(this).attr('data-color');
      if (colorHex) {
        console.log(`✨ Changing Material [${item.name}] Color:`, colorHex);
        setMaterialColor(item, colorHex);
        item.color = colorHex;
        $(`.dyn-picker-${cardId}`).val(colorHex);
      }
      if (window.recalculatePrice) window.recalculatePrice();
    });

    // Event Handler for Custom Color Picker
    $(`.dyn-picker-${cardId}`).on('input change', function () {
      const colorHex = $(this).val();
      if (colorHex) {
        console.log(`🎨 Custom Picker [${item.name}] Color:`, colorHex);
        setMaterialColor(item, colorHex);
        item.color = colorHex;
      }
    });
  });
}

function setMaterialColor(item, colorHex) {
  if (!item) return;

  // Grab the live material directly from item.mesh in case DiamondPlugin swapped it!
  const liveMat = item.mesh ? item.mesh.material : item.mat;
  if (!liveMat) return;

  const mats = Array.isArray(liveMat) ? liveMat : [liveMat];
  mats.forEach(m => {
    if (m.color && m.color.value && typeof m.color.value.set === 'function') {
      m.color.value.set(colorHex);
    } else if (m.color && typeof m.color.set === 'function') {
      m.color.set(colorHex);
    } else if (m.colorNode && m.colorNode.value && typeof m.colorNode.value.set === 'function') {
      m.colorNode.value.set(colorHex);
    } else {
      applyMaterialColor(m, colorHex);
    }
    m.needsUpdate = true;
  });
}

function updateJewelryMaterialGroups() {
  if (!viewer || !viewer.scene) return;

  const scannedMap = new Map();

  viewer.scene.traverse((child) => {
    if (/** @type {any} */ (child).isMesh || /** @type {any} */ (child).isInstancedMesh) {
      const mesh = /** @type {any} */ (child);
      if (!mesh.material) return;

      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      mats.forEach((mat) => {
        if (!mat) return;

        let displayName = mesh.name;
        if (mesh.parent && mesh.parent.name && mesh.parent.name !== 'Scene' && mesh.parent.name !== 'ModelGroup') {
          displayName = mesh.parent.name + ' - ' + mesh.name;
        }
        if (!displayName || displayName.trim() === '') displayName = mat.name || 'Jewelry Part';

        // Key by mesh ID to ensure ALL meshes (Center Gem, Side Diamonds, Shank, Prongs) get separate controls
        const key = mesh.uuid + '_' + (mat.uuid || '');

        if (!scannedMap.has(key)) {
          let hexColor = '#ffffff';
          let isDiamond = false;

          if (mat.color && mat.color.value && mat.color.value.isColor) {
            hexColor = '#' + mat.color.value.getHexString();
            isDiamond = true;
          } else if (mat.color && mat.color.isColor) {
            hexColor = '#' + mat.color.getHexString();
            if (mat.name && mat.name.toLowerCase().includes('diamond')) isDiamond = true;
          } else {
            const matName = (mat.name || '').toLowerCase();
            const meshName = (mesh.name || '').toLowerCase();
            if (matName.includes('diamond') || matName.includes('gem') || meshName.includes('diamond') || meshName.includes('gem')) {
              isDiamond = true;
            }
          }

          scannedMap.set(key, {
            id: key,
            name: displayName,
            color: hexColor,
            mat: mat,
            mesh: mesh,
            isDiamond
          });
        }
      });
    }
  });

  scannedMaterials = Array.from(scannedMap.values());
  console.log(`✨ Scanned ${scannedMaterials.length} mesh material slots in 3D model:`, scannedMaterials.map(m => m.name));
  renderDynamicMaterialControls();
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


  // 2. Instantiate Core ThreeViewer with assetBaseUrl pointing to shared-assets/
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
  viewer.loadModelFromUrl('../shared-assets/models/ring.glb').then(res => {
    orbitPlugin.resetView();
    updateJewelryMaterialGroups();
    $('#loading-overlay').addClass('fade-out');
  });
  loadHdrEnvironment('../shared-assets/environments/diamond_env.exr');


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
    let addonPrice = 0;

    $('.preset-card.active').each(function () {
      addonPrice += parseInt($(this).attr('data-add-price') || '0', 10);
    });

    const caratPrice = parseInt($('.carat-btn.active').attr('data-add-price') || '0', 10);

    const totalPrice = basePrice + addonPrice + caratPrice;
    const formattedPrice = '$' + totalPrice.toLocaleString('en-US') + '.00';
    $('#pdp-price').text(formattedPrice);
  }

  window.recalculatePrice = recalculatePrice;
  recalculatePrice();

  // -------------------------------------------------------------
  // Toolbar & Ring Selection Event Handlers
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
      viewer.loadModelFromUrl(ringUrl).then(() => {
        updateJewelryMaterialGroups();
        if (orbitPlugin) {
          console.log("🎥 Resetting orbit controls view after ring model load...");
          orbitPlugin.resetView();
        }
      });
      recalculatePrice();
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
