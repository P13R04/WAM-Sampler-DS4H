/**
 * Tests d'intégration pour PresetManager
 * Teste le cycle complet : sauvegarde → serveur → rechargement
 * 
 * Usage:
 * 1. Démarrer le serveur: cd server && npm start
 * 2. Ouvrir dans un navigateur: node --experimental-modules test-preset-manager.mjs
 * 3. Ou tester via navigateur avec test-integration.html
 * 
 * @author Pierre Constantin, Baptiste Giacchero
 */

import PresetManager from '../samplerPlugin/src/PresetManager.js';

const SERVER_URL = 'http://localhost:3000';
let presetManager;
let testResults = [];

// Utilitaires
const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ ÉCHEC: ${message}`);
    testResults.push({ status: 'fail', message });
    throw new Error(message);
  }
  console.log(`✅ OK: ${message}`);
  testResults.push({ status: 'pass', message });
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock AudioNode pour les tests
class MockAudioNode {
  constructor() {
    this.pads = Array.from({ length: 16 }, () => ({
      buffer: null,
      originalBuffer: null,
      volume: 0.5,
      pan: 0,
      pitch: 0,
      trimStart: 0,
      trimEnd: 1
    }));
    this.master = { volume: 0.8, muted: false };
  }

  getState() {
    return {
      master: this.master,
      pads: this.pads.map(p => ({
        volume: p.volume,
        pan: p.pan,
        pitch: p.pitch,
        trimStart: p.trimStart,
        trimEnd: p.trimEnd
      })),
      waveforms: []
    };
  }

  setState(state) {
    if (state.master) this.master = state.master;
    if (state.pads) {
      state.pads.forEach((padState, i) => {
        if (this.pads[i]) {
          Object.assign(this.pads[i], padState);
        }
      });
    }
  }

  loadSample(padIndex, buffer) {
    if (this.pads[padIndex]) {
      this.pads[padIndex].buffer = buffer;
      this.pads[padIndex].originalBuffer = buffer;
    }
  }
}

// Tests

async function testInit() {
  console.log('\n📋 Test 1: Initialisation PresetManager');
  
  presetManager = new PresetManager('test-wam-sampler', SERVER_URL);
  await sleep(100); // Attendre le health check
  
  assert(presetManager !== null, 'PresetManager créé');
  assert(presetManager.serverUrl === SERVER_URL, 'URL serveur correcte');
  console.log(`   Mode: ${presetManager.isOnline ? 'Online (REST API)' : 'Offline (localStorage)'}`);
}

async function testSavePresetOnline() {
  console.log('\n📋 Test 2: Sauvegarder un preset (mode online)');
  
  const mockNode = new MockAudioNode();
  const state = mockNode.getState();
  const samples = [
    { padIndex: 0, url: '/samples/test-kick.wav', name: 'kick.wav' }
  ];

  const saved = await presetManager.savePreset('Test Integration Preset', state, samples);
  
  assert(saved !== null, 'Preset sauvegardé');
  assert(saved.name === 'Test Integration Preset', 'Nom correct');
  if (presetManager.isOnline) {
    assert(saved.id !== undefined, 'ID généré par serveur');
  }
  console.log('   Preset sauvegardé avec succès');
}

async function testListPresets() {
  console.log('\n📋 Test 3: Lister les presets');
  
  const presets = await presetManager.listPresets();
  
  assert(Array.isArray(presets), 'Retourne un tableau');
  assert(presets.length > 0, 'Au moins un preset existe');
  assert(presets.includes('Test Integration Preset'), 'Notre preset est dans la liste');
  console.log(`   ${presets.length} preset(s) trouvé(s)`);
}

async function testLoadPreset() {
  console.log('\n📋 Test 4: Charger un preset');
  
  const preset = await presetManager.loadPreset('Test Integration Preset');
  
  assert(preset !== null, 'Preset chargé');
  assert(preset.state !== null, 'État présent');
  assert(preset.state.master !== undefined, 'Master volume présent');
  assert(preset.state.master.volume === 0.8, 'Volume master correct');
  assert(Array.isArray(preset.samples), 'Samples présents');
  assert(preset.samples.length === 1, 'Un sample dans le preset');
  console.log('   Preset chargé avec succès');
}

async function testUpdatePreset() {
  console.log('\n📋 Test 5: Mettre à jour un preset');
  
  const mockNode = new MockAudioNode();
  mockNode.master.volume = 0.9; // Changer le volume
  const state = mockNode.getState();
  
  const updated = await presetManager.savePreset('Test Integration Preset', state, []);
  
  assert(updated !== null, 'Preset mis à jour');
  
  // Recharger et vérifier
  const reloaded = await presetManager.loadPreset('Test Integration Preset');
  assert(reloaded.state.master.volume === 0.9, 'Modification persistée');
  console.log('   Preset mis à jour avec succès');
}

async function testCategoryListing() {
  console.log('\n📋 Test 6: Lister par catégorie');
  
  const categories = await presetManager.listPresetsByCategory();
  
  assert(categories !== null, 'Catégories retournées');
  assert(Array.isArray(categories.factory), 'Catégorie factory existe');
  assert(Array.isArray(categories.user), 'Catégorie user existe');
  console.log(`   Factory: ${categories.factory.length}, User: ${categories.user.length}`);
}

async function testFactoryPreset() {
  console.log('\n📋 Test 7: Sauvegarder un factory preset');
  
  const mockNode = new MockAudioNode();
  const state = mockNode.getState();
  
  const factory = await presetManager.saveFactoryPreset('Test Factory', state, []);
  
  assert(factory !== null, 'Factory preset sauvegardé');
  assert(factory.name.includes('[Factory]'), 'Nom contient [Factory]');
  
  const categories = await presetManager.listPresetsByCategory();
  assert(categories.factory.some(n => n.includes('Test Factory')), 'Factory preset dans la bonne catégorie');
  console.log('   Factory preset créé avec succès');
}

async function testDeletePreset() {
  console.log('\n📋 Test 8: Supprimer un preset');
  
  const deleted = await presetManager.deletePreset('Test Integration Preset');
  
  assert(deleted === true, 'Suppression confirmée');
  
  const presets = await presetManager.listPresets();
  assert(!presets.includes('Test Integration Preset'), 'Preset supprimé de la liste');
  console.log('   Preset supprimé avec succès');
}

async function testOfflineMode() {
  console.log('\n📋 Test 9: Mode offline (localStorage fallback)');
  
  // Skip test in Node.js (localStorage not available)
  if (typeof window === 'undefined') {
    console.log('   ⚠️ Test skipped in Node.js (localStorage requires browser)');
    console.log('   → Tester manuellement dans test-integration.html');
    return;
  }
  
  // Forcer le mode offline
  const originalOnline = presetManager.isOnline;
  presetManager.isOnline = false;
  
  const mockNode = new MockAudioNode();
  const state = mockNode.getState();
  
  // Sauvegarder en mode offline
  const saved = await presetManager.savePreset('Test Offline Preset', state, []);
  assert(saved !== null, 'Preset sauvegardé en mode offline');
  
  // Lister
  const presets = await presetManager.listPresets();
  assert(presets.includes('Test Offline Preset'), 'Preset trouvé en localStorage');
  
  // Charger
  const loaded = await presetManager.loadPreset('Test Offline Preset');
  assert(loaded !== null, 'Preset chargé depuis localStorage');
  assert(loaded.state.master.volume === 0.8, 'Données correctes');
  
  // Supprimer
  const deleted = await presetManager.deletePreset('Test Offline Preset');
  assert(deleted === true, 'Preset supprimé en mode offline');
  
  // Restaurer le mode original
  presetManager.isOnline = originalOnline;
  console.log('   Mode offline testé avec succès');
}

async function testCompleteWorkflow() {
  console.log('\n📋 Test 10: Workflow complet (créer → modifier → supprimer)');
  
  const mockNode = new MockAudioNode();
  
  // 1. Créer
  mockNode.master.volume = 0.7;
  let state = mockNode.getState();
  await presetManager.savePreset('Workflow Test', state, []);
  console.log('   ✓ Créé');
  
  // 2. Charger et vérifier
  let loaded = await presetManager.loadPreset('Workflow Test');
  assert(loaded.state.master.volume === 0.7, 'Volume initial correct');
  console.log('   ✓ Chargé et vérifié');
  
  // 3. Modifier
  mockNode.setState(loaded.state);
  mockNode.master.volume = 0.85;
  state = mockNode.getState();
  await presetManager.savePreset('Workflow Test', state, []);
  console.log('   ✓ Modifié');
  
  // 4. Recharger et vérifier modification
  loaded = await presetManager.loadPreset('Workflow Test');
  assert(loaded.state.master.volume === 0.85, 'Volume modifié correct');
  console.log('   ✓ Modification persistée');
  
  // 5. Supprimer
  await presetManager.deletePreset('Workflow Test');
  const presets = await presetManager.listPresets();
  assert(!presets.includes('Workflow Test'), 'Preset supprimé');
  console.log('   ✓ Supprimé');
  
  console.log('   Workflow complet validé!');
}

async function testStateIntegrity() {
  console.log('\n📋 Test 11: Intégrité de l\'état');
  
  const mockNode = new MockAudioNode();
  
  // Configurer un état complexe
  mockNode.master = { volume: 0.75, muted: false };
  mockNode.pads[0] = {
    buffer: null,
    volume: 0.6,
    pan: -0.5,
    pitch: 2,
    trimStart: 0.1,
    trimEnd: 0.9
  };
  mockNode.pads[1] = {
    buffer: null,
    volume: 0.8,
    pan: 0.3,
    pitch: -3,
    trimStart: 0.2,
    trimEnd: 0.8
  };
  
  const state = mockNode.getState();
  const samples = [
    { padIndex: 0, url: '/samples/kick.wav', name: 'kick.wav' },
    { padIndex: 1, url: '/samples/snare.wav', name: 'snare.wav' }
  ];
  
  // Sauvegarder
  await presetManager.savePreset('State Integrity Test', state, samples);
  
  // Charger
  const loaded = await presetManager.loadPreset('State Integrity Test');
  
  // Vérifier chaque propriété
  assert(loaded.state.master.volume === 0.75, 'Master volume préservé');
  assert(loaded.state.pads[0].volume === 0.6, 'Pad 0 volume préservé');
  assert(loaded.state.pads[0].pan === -0.5, 'Pad 0 pan préservé');
  assert(loaded.state.pads[0].pitch === 2, 'Pad 0 pitch préservé');
  assert(loaded.state.pads[0].trimStart === 0.1, 'Pad 0 trimStart préservé');
  assert(loaded.state.pads[0].trimEnd === 0.9, 'Pad 0 trimEnd préservé');
  assert(loaded.samples.length === 2, 'Tous les samples préservés');
  assert(loaded.samples[0].padIndex === 0, 'Sample 0 padIndex correct');
  assert(loaded.samples[1].padIndex === 1, 'Sample 1 padIndex correct');
  
  // Nettoyer
  await presetManager.deletePreset('State Integrity Test');
  
  console.log('   Intégrité de l\'état validée');
}

async function cleanupFactoryPreset() {
  console.log('\n🧹 Nettoyage: Supprimer factory preset de test');
  try {
    await presetManager.deletePreset('[Factory] Test Factory');
    console.log('   Factory preset nettoyé');
  } catch (e) {
    console.log('   Pas de nettoyage nécessaire');
  }
}

// Exécution des tests
async function runTests() {
  console.log('🧪 Tests d\'intégration PresetManager\n');
  console.log('⏳ Démarrage des tests...\n');
  
  try {
    await testInit();
    await testSavePresetOnline();
    await testListPresets();
    await testLoadPreset();
    await testUpdatePreset();
    await testCategoryListing();
    await testFactoryPreset();
    await testDeletePreset();
    await testOfflineMode();
    await testCompleteWorkflow();
    await testStateIntegrity();
    await cleanupFactoryPreset();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ TOUS LES TESTS D\'INTÉGRATION SONT PASSÉS! 🎉');
    console.log('='.repeat(50));
    console.log(`\nRésultats: ${testResults.filter(r => r.status === 'pass').length} passed, ${testResults.filter(r => r.status === 'fail').length} failed\n`);
    
    return true;
  } catch (error) {
    console.error('\n❌ TESTS ÉCHOUÉS:', error.message);
    console.log(`\nRésultats: ${testResults.filter(r => r.status === 'pass').length} passed, ${testResults.filter(r => r.status === 'fail').length} failed\n`);
    return false;
  }
}

// Support Node.js et navigateur
if (typeof window === 'undefined') {
  // Node.js
  runTests().then(success => process.exit(success ? 0 : 1));
} else {
  // Navigateur
  window.runPresetManagerTests = runTests;
  console.log('Tests chargés. Appelez window.runPresetManagerTests() pour lancer.');
}

export { runTests };
