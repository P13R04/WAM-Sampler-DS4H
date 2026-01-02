/**
 * Tests unitaires pour le WAM Sampler
 * Teste les fonctions individuelles et les composants isolés
 *
 * Usage: node test-units.mjs
 *
 * @author Pierre Constantin, Baptiste Giacchero
 */

export class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.results = { passed: 0, failed: 0, total: 0 };
  }

  test(description, fn) {
    this.tests.push({ description, fn });
  }

  async run() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 Suite: ${this.name}`);
    console.log('='.repeat(60));

    for (const { description, fn } of this.tests) {
      this.results.total++;
      try {
        await fn();
        console.log(`✅ ${description}`);
        this.results.passed++;
      } catch (error) {
        console.error(`❌ ${description}`);
        console.error(`   Erreur: ${error.message}`);
        this.results.failed++;
      }
    }

    return this.results;
  }
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

export function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`
    );
  }
}

export function assertArrayEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      message || `Arrays not equal:\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`
    );
  }
}

export function assertThrows(fn, message) {
  try {
    fn();
    throw new Error(message || 'Expected function to throw');
  } catch (error) {
    // Success - function threw as expected
    if (error.message === (message || 'Expected function to throw')) {
      throw error;
    }
  }
}

// ==================== Tests PresetManager ====================

async function testPresetManagerSuite() {
  const suite = new TestSuite('PresetManager');

  suite.test('Génération d\'ID unique', () => {
    const id1 = generateUniqueId();
    const id2 = generateUniqueId();
    assert(id1 !== id2, 'Les IDs doivent être uniques');
    assert(typeof id1 === 'string', 'ID doit être une chaîne');
    assert(id1.length > 0, 'ID ne doit pas être vide');
  });

  suite.test('Validation du nom de preset', () => {
    assert(isValidPresetName('Test Preset'), 'Nom valide accepté');
    assert(!isValidPresetName(''), 'Nom vide rejeté');
    assert(!isValidPresetName('   '), 'Nom avec espaces uniquement rejeté');
    assert(isValidPresetName('Test 123'), 'Nom avec chiffres accepté');
  });

  suite.test('Détection de preset factory', () => {
    assert(isFactoryPreset('[Factory] Basic Kit'), 'Détecte [Factory] prefix');
    assert(!isFactoryPreset('User Preset'), 'Rejette preset user');
    assert(!isFactoryPreset('Factory Preset'), 'Rejette sans []');
  });

  suite.test('Formatage du nom factory', () => {
    assertEquals(formatFactoryName('Basic Kit'), '[Factory] Basic Kit');
    assertEquals(formatFactoryName('[Factory] Basic Kit'), '[Factory] Basic Kit');
  });

  suite.test('Extraction du nom de base', () => {
    assertEquals(extractBaseName('[Factory] Basic Kit'), 'Basic Kit');
    assertEquals(extractBaseName('User Preset'), 'User Preset');
  });

  return suite.run();
}

// ==================== Tests State Management ====================

async function testStateManagementSuite() {
  const suite = new TestSuite('State Management');

  suite.test('Création d\'un état vide', () => {
    const state = createEmptyState();
    assert(state.master !== undefined, 'Master présent');
    assert(Array.isArray(state.pads), 'Pads est un tableau');
    assertEquals(state.pads.length, 16, '16 pads créés');
  });

  suite.test('Validation d\'un état complet', () => {
    const validState = {
      master: { volume: 0.8, muted: false },
      pads: Array(16).fill(null).map(() => ({
        volume: 0.5,
        pan: 0,
        pitch: 0,
        trimStart: 0,
        trimEnd: 1
      })),
      waveforms: []
    };
    assert(isValidState(validState), 'État valide accepté');
  });

  suite.test('Rejet d\'un état invalide', () => {
    const invalidStates = [
      { master: null, pads: [] },
      { master: { volume: 0.8 }, pads: null },
      { master: { volume: 2.0 }, pads: [] }, // volume > 1
      { master: { volume: 0.8 }, pads: Array(10).fill({}) }, // pas 16 pads
    ];
    
    invalidStates.forEach((state, i) => {
      assert(!isValidState(state), `État invalide ${i} rejeté`);
    });
  });

  suite.test('Clonage profond d\'état', () => {
    const original = createEmptyState();
    original.master.volume = 0.7;
    original.pads[0].volume = 0.9;
    
    const cloned = deepCloneState(original);
    
    assertEquals(cloned.master.volume, 0.7, 'Master volume cloné');
    assertEquals(cloned.pads[0].volume, 0.9, 'Pad volume cloné');
    
    // Modifier le clone ne doit pas affecter l'original
    cloned.master.volume = 0.5;
    assertEquals(original.master.volume, 0.7, 'Original non modifié');
  });

  suite.test('Fusion d\'états', () => {
    const base = createEmptyState();
    const overlay = {
      master: { volume: 0.9 },
      pads: [{ volume: 0.8 }]
    };
    
    const merged = mergeStates(base, overlay);
    
    assertEquals(merged.master.volume, 0.9, 'Master volume fusionné');
    assertEquals(merged.pads[0].volume, 0.8, 'Pad 0 volume fusionné');
    assert(merged.master.muted !== undefined, 'Propriétés de base conservées');
  });

  return suite.run();
}

// ==================== Tests Audio Processing ====================

async function testAudioProcessingSuite() {
  const suite = new TestSuite('Audio Processing');

  suite.test('Calcul de trim valide', () => {
    const result = calculateTrimRegion(0.2, 0.8, 100);
    assertEquals(result.startSample, 20, 'Start sample correct');
    assertEquals(result.endSample, 80, 'End sample correct');
    assertEquals(result.duration, 60, 'Duration correcte');
  });

  suite.test('Trim avec valeurs inversées', () => {
    const result = calculateTrimRegion(0.8, 0.2, 100);
    assertEquals(result.startSample, 20, 'Start corrigé');
    assertEquals(result.endSample, 80, 'End corrigé');
  });

  suite.test('Trim hors limites', () => {
    const result = calculateTrimRegion(-0.1, 1.5, 100);
    assertEquals(result.startSample, 0, 'Start limité à 0');
    assert(result.endSample <= 100, 'End limité à length');
  });

  suite.test('Conversion note MIDI vers fréquence', () => {
    assertEquals(midiToFreq(69), 440, 'A4 = 440 Hz');
    assertEquals(Math.round(midiToFreq(60)), 262, 'C4 ≈ 262 Hz');
    assert(midiToFreq(81) > midiToFreq(69), 'Notes plus hautes = fréquence plus haute');
  });

  suite.test('Calcul de pitch ratio', () => {
    assertEquals(pitchToRatio(0), 1.0, 'Pitch 0 = ratio 1.0');
    assertEquals(Math.round(pitchToRatio(12) * 100) / 100, 2.0, 'Pitch +12 = ratio 2.0');
    assertEquals(Math.round(pitchToRatio(-12) * 100) / 100, 0.5, 'Pitch -12 = ratio 0.5');
  });

  suite.test('Conversion dB vers gain', () => {
    assertEquals(dbToGain(0), 1.0, '0 dB = gain 1.0');
    assert(Math.abs(dbToGain(-6) - 0.5) < 0.01, '-6 dB ≈ gain 0.5');
    assertEquals(dbToGain(-Infinity), 0, '-∞ dB = gain 0');
  });

  suite.test('Conversion gain vers dB', () => {
    assertEquals(gainToDb(1.0), 0, 'Gain 1.0 = 0 dB');
    assert(Math.abs(gainToDb(0.5) - (-6)) < 0.1, 'Gain 0.5 ≈ -6 dB');
    assertEquals(gainToDb(0), -Infinity, 'Gain 0 = -∞ dB');
  });

  suite.test('Normalisation de pan (-1 à 1)', () => {
    assertEquals(normalizePan(0), 0, 'Centre = 0');
    assertEquals(normalizePan(-1), -1, 'Gauche = -1');
    assertEquals(normalizePan(1), 1, 'Droite = 1');
    assertEquals(normalizePan(-2), -1, 'Limité à -1');
    assertEquals(normalizePan(2), 1, 'Limité à 1');
  });

  return suite.run();
}

// ==================== Tests Waveform Drawing ====================

async function testWaveformDrawingSuite() {
  const suite = new TestSuite('Waveform Drawing');

  suite.test('Calcul de downsampling', () => {
    const ratio = calculateDownsampleRatio(44100, 800);
    assert(ratio > 1, 'Ratio de downsampling calculé');
    const approximate = Math.floor(44100 / ratio);
    assert(Math.abs(approximate - 800) < 100, 'Approxime la largeur cible');
  });

  suite.test('Extraction de min/max d\'un buffer', () => {
    const buffer = new Float32Array([0.5, -0.3, 0.8, -0.9, 0.2]);
    const { min, max } = getBufferMinMax(buffer, 0, 5);
    assert(Math.abs(min - (-0.9)) < 0.0001, 'Min correct');
    assert(Math.abs(max - 0.8) < 0.0001, 'Max correct');
  });

  suite.test('Calcul de position canvas vers sample', () => {
    const sampleIndex = canvasXToSampleIndex(400, 800, 1000);
    assertEquals(sampleIndex, 500, 'Position à 50% = sample 500');
  });

  suite.test('Calcul de position sample vers canvas', () => {
    const x = sampleIndexToCanvasX(500, 1000, 800);
    assertEquals(x, 400, 'Sample 500 (50%) = x 400');
  });

  suite.test('Détection de clic sur trim bar', () => {
    const tolerance = 5;
    assert(isNearTrimBar(100, 100, tolerance), 'Clic exact sur bar');
    assert(isNearTrimBar(100, 103, tolerance), 'Clic proche de bar');
    assert(!isNearTrimBar(100, 110, tolerance), 'Clic loin de bar');
  });

  return suite.run();
}

// ==================== Tests MIDI ====================

async function testMidiSuite() {
  const suite = new TestSuite('MIDI Processing');

  suite.test('Parsing de message MIDI Note On', () => {
    const data = new Uint8Array([0x90, 60, 100]); // Note On, C4, velocity 100
    const msg = parseMidiMessage(data);
    assertEquals(msg.type, 'noteon', 'Type Note On');
    assertEquals(msg.note, 60, 'Note C4');
    assertEquals(msg.velocity, 100, 'Velocity 100');
  });

  suite.test('Parsing de message MIDI Note Off', () => {
    const data = new Uint8Array([0x80, 60, 0]); // Note Off, C4
    const msg = parseMidiMessage(data);
    assertEquals(msg.type, 'noteoff', 'Type Note Off');
    assertEquals(msg.note, 60, 'Note C4');
  });

  suite.test('Mapping note MIDI vers pad', () => {
    assertEquals(midiNoteToPad(60), 0, 'C4 = pad 0');
    assertEquals(midiNoteToPad(61), 1, 'C#4 = pad 1');
    assertEquals(midiNoteToPad(75), 15, 'Eb5 = pad 15');
    assertEquals(midiNoteToPad(76), -1, 'Note hors range = -1');
    assertEquals(midiNoteToPad(59), -1, 'Note hors range = -1');
  });

  suite.test('Mapping pad vers note MIDI', () => {
    assertEquals(padToMidiNote(0), 60, 'Pad 0 = C4');
    assertEquals(padToMidiNote(15), 75, 'Pad 15 = Eb5');
  });

  suite.test('Détection de velocity nulle = Note Off', () => {
    const data1 = new Uint8Array([0x90, 60, 0]); // Note On velocity 0
    const msg1 = parseMidiMessage(data1);
    assertEquals(msg1.type, 'noteoff', 'Note On velocity 0 = Note Off');
  });

  return suite.run();
}

// ==================== Tests URL/Storage ====================

async function testStorageSuite() {
  const suite = new TestSuite('Storage & URLs');

  suite.test('Construction d\'URL API', () => {
    const url = buildApiUrl('http://localhost:3000', '/api/presets', { q: 'test' });
    assert(url.includes('/api/presets'), 'Path inclus');
    assert(url.includes('q=test'), 'Query param inclus');
  });

  suite.test('Validation d\'URL serveur', () => {
    assert(isValidServerUrl('http://localhost:3000'), 'localhost valide');
    assert(isValidServerUrl('https://api.example.com'), 'HTTPS valide');
    assert(!isValidServerUrl('ftp://example.com'), 'FTP invalide');
    assert(!isValidServerUrl('not a url'), 'Chaîne invalide');
  });

  suite.test('Clé localStorage pour preset', () => {
    const key = getPresetStorageKey('wam-sampler', 'My Preset');
    assert(key.startsWith('wam-sampler:'), 'Prefix correct');
    assert(key.includes('My Preset'), 'Nom inclus');
  });

  suite.test('Liste des presets depuis localStorage', () => {
    // Mock localStorage
    const mockStorage = {
      'wam-sampler:preset:Preset1': '{}',
      'wam-sampler:preset:Preset2': '{}',
      'other:data': '{}'
    };
    
    const presets = listPresetsFromStorage('wam-sampler', mockStorage);
    assertEquals(presets.length, 2, '2 presets trouvés');
    assert(presets.includes('Preset1'), 'Preset1 trouvé');
    assert(presets.includes('Preset2'), 'Preset2 trouvé');
  });

  return suite.run();
}

// ==================== Fonctions utilitaires pour les tests ====================

function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function isValidPresetName(name) {
  return typeof name === 'string' && name.trim().length > 0;
}

function isFactoryPreset(name) {
  return name.startsWith('[Factory]');
}

function formatFactoryName(name) {
  return name.startsWith('[Factory]') ? name : `[Factory] ${name}`;
}

function extractBaseName(name) {
  return name.replace(/^\[Factory\]\s*/, '');
}

function createEmptyState() {
  return {
    master: { volume: 0.8, muted: false },
    pads: Array(16).fill(null).map(() => ({
      volume: 0.5,
      pan: 0,
      pitch: 0,
      trimStart: 0,
      trimEnd: 1
    })),
    waveforms: []
  };
}

function isValidState(state) {
  if (!state || !state.master || !Array.isArray(state.pads)) return false;
  if (state.pads.length !== 16) return false;
  if (state.master.volume < 0 || state.master.volume > 1) return false;
  return true;
}

function deepCloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function mergeStates(base, overlay) {
  const result = deepCloneState(base);
  if (overlay.master) Object.assign(result.master, overlay.master);
  if (overlay.pads) {
    overlay.pads.forEach((pad, i) => {
      if (result.pads[i]) Object.assign(result.pads[i], pad);
    });
  }
  return result;
}

function calculateTrimRegion(start, end, length) {
  // Clamp values between 0 and 1
  const s = Math.max(0, Math.min(1, Math.min(start, end)));
  const e = Math.min(1, Math.max(start, end));
  return {
    startSample: Math.floor(s * length),
    endSample: Math.floor(e * length),
    duration: Math.floor((e - s) * length)
  };
}

function midiToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function pitchToRatio(semitones) {
  return Math.pow(2, semitones / 12);
}

function dbToGain(db) {
  if (db === -Infinity) return 0;
  return Math.pow(10, db / 20);
}

function gainToDb(gain) {
  if (gain === 0) return -Infinity;
  return 20 * Math.log10(gain);
}

function normalizePan(value) {
  return Math.max(-1, Math.min(1, value));
}

function calculateDownsampleRatio(bufferLength, targetWidth) {
  return Math.max(1, Math.floor(bufferLength / targetWidth));
}

function getBufferMinMax(buffer, start, end) {
  let min = Infinity, max = -Infinity;
  for (let i = start; i < end; i++) {
    min = Math.min(min, buffer[i]);
    max = Math.max(max, buffer[i]);
  }
  return { min, max };
}

function canvasXToSampleIndex(x, canvasWidth, bufferLength) {
  return Math.floor((x / canvasWidth) * bufferLength);
}

function sampleIndexToCanvasX(index, bufferLength, canvasWidth) {
  return Math.floor((index / bufferLength) * canvasWidth);
}

function isNearTrimBar(barPos, mousePos, tolerance) {
  return Math.abs(barPos - mousePos) <= tolerance;
}

function parseMidiMessage(data) {
  const status = data[0] & 0xF0;
  const note = data[1];
  const velocity = data[2];
  
  if (status === 0x90 && velocity > 0) {
    return { type: 'noteon', note, velocity };
  } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
    return { type: 'noteoff', note, velocity: 0 };
  }
  return { type: 'unknown' };
}

function midiNoteToPad(note) {
  const pad = note - 60;
  return (pad >= 0 && pad < 16) ? pad : -1;
}

function padToMidiNote(pad) {
  return 60 + pad;
}

function buildApiUrl(baseUrl, path, params = {}) {
  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

function isValidServerUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function getPresetStorageKey(pluginId, presetName) {
  return `${pluginId}:preset:${presetName}`;
}

function listPresetsFromStorage(pluginId, storage) {
  const prefix = `${pluginId}:preset:`;
  return Object.keys(storage)
    .filter(key => key.startsWith(prefix))
    .map(key => key.replace(prefix, ''));
}

// ==================== Exécution ====================

async function runAllTests() {
  console.log('\n🧪 Tests unitaires WAM Sampler');
  console.log('='.repeat(60));
  
  const suites = [
    testPresetManagerSuite,
    testStateManagementSuite,
    testAudioProcessingSuite,
    testWaveformDrawingSuite,
    testMidiSuite,
    testStorageSuite
  ];
  
  const allResults = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  for (const suiteFunc of suites) {
    const result = await suiteFunc();
    allResults.passed += result.passed;
    allResults.failed += result.failed;
    allResults.total += result.total;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSULTATS GLOBAUX');
  console.log('='.repeat(60));
  console.log(`Total: ${allResults.total} tests`);
  console.log(`✅ Réussis: ${allResults.passed}`);
  console.log(`❌ Échoués: ${allResults.failed}`);
  console.log(`Taux de réussite: ${((allResults.passed / allResults.total) * 100).toFixed(1)}%`);
  
  if (allResults.failed === 0) {
    console.log('\n🎉 TOUS LES TESTS UNITAIRES SONT PASSÉS!\n');
    return true;
  } else {
    console.log('\n⚠️ Certains tests ont échoué.\n');
    return false;
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(success => process.exit(success ? 0 : 1));
}

export { runAllTests };
