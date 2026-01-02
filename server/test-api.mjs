/**
 * Tests pour l'API REST du serveur WAM Sampler
 * 
 * Utilisation:
 * 1. Démarrer le serveur: npm start (dans server/)
 * 2. Exécuter les tests: node test-api.mjs
 * 
 * @author Pierre Constantin, Baptiste Giacchero
 */

const API_URL = 'http://localhost:3000/api';
let testPresetId = null;

// Utilitaires
const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ ÉCHEC: ${message}`);
    process.exit(1);
  }
  console.log(`✅ OK: ${message}`);
};

const request = async (path, options = {}) => {
  const url = `${API_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    
    return { status: res.status, ok: res.ok, data };
  } catch (error) {
    console.error(`❌ Erreur requête ${path}:`, error.message);
    throw error;
  }
};

// Tests

async function testHealthCheck() {
  console.log('\n📋 Test 1: Health Check');
  const { status, data } = await request('/health');
  assert(status === 200, 'Status 200');
  assert(data.ok === true, 'Health check OK');
  assert(data.server === 'wam-sampler', 'Server name correct');
  console.log('   Health:', data);
}

async function testCreatePreset() {
  console.log('\n📋 Test 2: Créer un preset');
  
  const preset = {
    name: 'Test Preset',
    parameters: {
      master: { volume: 0.8, muted: false },
      pads: [
        { volume: 0.5, pan: 0, trimStart: 0, trimEnd: 1 }
      ]
    },
    samples: [
      { padIndex: 0, url: '/samples/kick.wav', name: 'kick.wav' }
    ],
    user: 'tester',
    isPublic: false
  };

  const { status, data } = await request('/presets', {
    method: 'POST',
    body: JSON.stringify(preset)
  });

  assert(status === 201, 'Status 201 Created');
  assert(data.id, 'Preset a un ID');
  assert(data.name === 'Test Preset', 'Nom correct');
  assert(data.user === 'tester', 'User correct');
  assert(data.created, 'Date de création');
  
  testPresetId = data.id;
  console.log('   Preset créé:', data.id);
}

async function testGetAllPresets() {
  console.log('\n📋 Test 3: Lister tous les presets');
  
  const { status, data } = await request('/presets');
  
  assert(status === 200, 'Status 200');
  assert(Array.isArray(data), 'Retourne un tableau');
  assert(data.length > 0, 'Au moins un preset existe');
  console.log(`   ${data.length} preset(s) trouvé(s)`);
}

async function testGetPresetById() {
  console.log('\n📋 Test 4: Récupérer un preset par ID');
  
  const { status, data } = await request(`/presets/${testPresetId}`);
  
  assert(status === 200, 'Status 200');
  assert(data.id === testPresetId, 'ID correct');
  assert(data.name === 'Test Preset', 'Nom correct');
  assert(data.parameters, 'Paramètres présents');
  console.log('   Preset récupéré:', data.name);
}

async function testUpdatePreset() {
  console.log('\n📋 Test 5: Mettre à jour un preset');
  
  const updates = {
    name: 'Test Preset Updated',
    parameters: { master: { volume: 0.9 } }
  };

  const { status, data } = await request(`/presets/${testPresetId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });

  assert(status === 200, 'Status 200');
  assert(data.name === 'Test Preset Updated', 'Nom mis à jour');
  assert(data.updated !== data.created, 'Date de mise à jour différente');
  console.log('   Preset mis à jour');
}

async function testSearchPresets() {
  console.log('\n📋 Test 6: Rechercher des presets');
  
  const { status, data } = await request('/presets?q=Updated');
  
  assert(status === 200, 'Status 200');
  assert(Array.isArray(data), 'Retourne un tableau');
  assert(data.length > 0, 'Au moins un résultat trouvé');
  assert(data[0].name.includes('Updated'), 'Résultat correspond à la recherche');
  console.log(`   ${data.length} résultat(s) trouvé(s)`);
}

async function testFilterPresetsByUser() {
  console.log('\n📋 Test 7: Filtrer par utilisateur');
  
  const { status, data } = await request('/presets?user=tester');
  
  assert(status === 200, 'Status 200');
  assert(Array.isArray(data), 'Retourne un tableau');
  assert(data.every(p => p.user === 'tester'), 'Tous les presets appartiennent au user');
  console.log(`   ${data.length} preset(s) pour user 'tester'`);
}

async function testGetNonExistentPreset() {
  console.log('\n📋 Test 8: Preset inexistant (404)');
  
  const { status, data } = await request('/presets/non-existent-id');
  
  assert(status === 404, 'Status 404 Not Found');
  assert(data.error, 'Message d\'erreur présent');
  console.log('   404 correct pour preset inexistant');
}

async function testCreatePresetWithoutName() {
  console.log('\n📋 Test 9: Créer preset sans nom (400)');
  
  const { status, data } = await request('/presets', {
    method: 'POST',
    body: JSON.stringify({ parameters: {} })
  });

  assert(status === 400, 'Status 400 Bad Request');
  assert(data.error, 'Message d\'erreur présent');
  console.log('   400 correct pour preset sans nom');
}

async function testDeletePreset() {
  console.log('\n📋 Test 10: Supprimer un preset');
  
  const { status, data } = await request(`/presets/${testPresetId}`, {
    method: 'DELETE'
  });

  assert(status === 200, 'Status 200');
  assert(data.ok === true, 'Suppression confirmée');
  assert(data.deleted === testPresetId, 'ID correct');
  
  // Vérifier que le preset n'existe plus
  const { status: status2 } = await request(`/presets/${testPresetId}`);
  assert(status2 === 404, 'Preset n\'existe plus');
  
  console.log('   Preset supprimé');
}

async function testUploadSample() {
  console.log('\n📋 Test 11: Upload sample (simulation)');
  console.log('   ⚠️  Test upload nécessite FormData (non disponible en Node sans package)');
  console.log('   → Tester manuellement avec curl ou le front-end');
  console.log('   Exemple: curl -F "audio=@sample.wav" http://localhost:3000/api/samples');
}

async function testFactoryPresets() {
  console.log('\n📋 Test 12: Presets Factory');
  
  // Créer un factory preset
  const factoryPreset = {
    name: '[Factory] Test Factory',
    parameters: { master: { volume: 1.0 } },
    samples: [],
    isFactory: true,
    isPublic: true
  };

  const { status, data } = await request('/presets', {
    method: 'POST',
    body: JSON.stringify(factoryPreset)
  });

  assert(status === 201, 'Factory preset créé');
  assert(data.name.includes('[Factory]'), 'Nom contient [Factory]');
  
  // Nettoyer
  await request(`/presets/${data.id}`, { method: 'DELETE' });
  console.log('   Factory preset testé et supprimé');
}

// Exécution des tests
async function runTests() {
  console.log('🧪 Tests API REST - WAM Sampler\n');
  console.log('⏳ Vérification du serveur...');
  
  try {
    await testHealthCheck();
    await testCreatePreset();
    await testGetAllPresets();
    await testGetPresetById();
    await testUpdatePreset();
    await testSearchPresets();
    await testFilterPresetsByUser();
    await testGetNonExistentPreset();
    await testCreatePresetWithoutName();
    await testFactoryPresets();
    await testDeletePreset();
    await testUploadSample();
    
    console.log('\n✅ TOUS LES TESTS SONT PASSÉS! 🎉\n');
  } catch (error) {
    console.error('\n❌ TESTS ÉCHOUÉS:', error.message);
    process.exit(1);
  }
}

runTests();
