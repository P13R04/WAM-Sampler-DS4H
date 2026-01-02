/**
 * WAM Sampler GUI - Web Component compact
 * 
 * Interface utilisateur compacte (320px) avec :
 * - Grille 4×4 de pads
 * - Mapping clavier universel (détection via KeyboardEvent.code)
 * - Drag & drop pour charger des samples
 * - Contrôles master (volume, mute)
 * - Status bar informatif
 * 
 * Mapping clavier universel (codes physiques) :
 * - Rangée numérique : Digit1-4, Digit5-8
 * - Rangée AZERTY/QWERTY : KeyA/Q, KeyZ/W, KeyE, KeyR, KeyT, KeyY, KeyU, KeyI
 * - Rangée AZERTY/QWERTY : KeyQ/A, KeyS, KeyD, KeyF, KeyG, KeyH, KeyJ, KeyK
 * - Rangée inférieure : KeyW/Z, KeyX, KeyC, KeyV
 * 
 * Total : 16 pads mappés universellement
 * 
 * @author Pierre Constantin, Baptiste Giacchero
 */

// Styles inline pour éviter dépendance externe
const styles = `
:host {
  display: block;
  font-family: 'Segoe UI', Tahoma, sans-serif;
  color: #0f172a;
  width: 820px;
  background: linear-gradient(135deg, #0b1224, #1e293b);
  border: 2px solid #1d4ed8;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  overflow: hidden;
}

.sam-wrapper {
  padding: 14px;
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 340px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  user-select: none;
}

.pad {
  background: linear-gradient(145deg, #1e293b, #0f172a);
  border: 2px solid #334155;
  border-radius: 8px;
  aspect-ratio: 1 / 1;
  min-height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.12s ease;
  position: relative;
  overflow: hidden;
}

.bank-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.bank-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0b1224, #1e293b);
  color: #cbd5e1;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
}

.bank-btn.active {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  color: #fff;
  border-color: #1e40af;
  box-shadow: 0 6px 14px rgba(30,64,175,0.35);
}

.pad::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(96,165,250,0.1), transparent);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.pad:hover::before {
  opacity: 1;
}

.pad.loaded {
  border-color: #22c55e;
  color: #e2e8f0;
  box-shadow: 0 0 12px rgba(34,197,94,0.3);
}

.pad.selected {
  border-color: #60a5fa;
  box-shadow: 0 0 16px rgba(96,165,250,0.6);
}

.pad:active {
  transform: scale(0.96);
}

.pad-key {
  font-size: 10px;
  color: #64748b;
  margin-top: 4px;
}

.status {
  background: #0f172a;
  color: #cbd5e1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #334155;
  font-size: 12px;
  line-height: 1.5;
  min-height: 40px;
}

.preset-menu {
  background: rgba(15, 23, 42, 0.9);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #334155;
  margin-bottom: 12px;
}

.preset-menu h3 {
  margin: 0 0 8px 0;
  color: #60a5fa;
  font-size: 14px;
  font-weight: 600;
}

.preset-menu select {
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #334155;
  background: #0f172a;
  color: #e2e8f0;
  margin-bottom: 8px;
  font-size: 13px;
}

.preset-menu-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.preset-menu button {
  padding: 6px 12px;
  font-size: 12px;
}

.effects-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.adsr-controls {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.effect-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.effect-control label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}

.effect-control input[type="range"] {
  width: 100%;
}

.effect-control span {
  font-size: 11px;
  color: #cbd5e1;
  text-align: right;
}

.effect-control button {
  padding: 8px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  color: #cbd5e1;
  border: 1px solid #334155;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s ease;
}

.effect-control button:hover {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  border-color: #3b82f6;
}

.effect-control button.active {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  border-color: #60a5fa;
  box-shadow: 0 0 12px rgba(96,165,250,0.4);
}

.small-input {
  display: flex;
  gap: 8px;
  align-items: center;
  color: #cbd5e1;
  font-size: 13px;
  padding: 6px 0;
}

input[type="range"] {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #1e293b;
  outline: none;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  transition: all 0.15s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  background: #60a5fa;
  transform: scale(1.1);
}

input[type="file"] {
  display: none;
}

label {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 600;
}

.mute-active {
  background: linear-gradient(135deg, #dc2626, #991b1b) !important;
}

.effects-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.adsr-controls {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.effect-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.effect-control label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}

.effect-control input[type="range"] {
  width: 100%;
}

.effect-control span {
  font-size: 11px;
  color: #cbd5e1;
  text-align: right;
}

.effect-control button {
  padding: 8px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  color: #cbd5e1;
  border: 1px solid #334155;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s ease;
}

.effect-control button:hover {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  border-color: #3b82f6;
}

.effect-control button.active {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  border-color: #60a5fa;
  box-shadow: 0 0 12px rgba(96,165,250,0.4);
}
`;

/**
 * Mapping clavier universel (KeyboardEvent.code)
 * Fonctionne sur tous les layouts (AZERTY, QWERTY, QWERTZ, etc.)
 */
// Presets de mapping physique 4×4 (départ en bas-gauche)
// Utilise KeyboardEvent.code (physique) pour rester universel.
// AZERTY: la touche "A" physique émet code "KeyQ", etc.
const KEYMAPS = {
  azerty: {
    // Bas (0-3): W,X,C,V → codes physiques: KeyZ, KeyX, KeyC, KeyV
    'KeyZ': 0, 'KeyX': 1, 'KeyC': 2, 'KeyV': 3,
    // Rangée 2 (4-7): Q,S,D,F → codes: KeyA, KeyS, KeyD, KeyF
    'KeyA': 4, 'KeyS': 5, 'KeyD': 6, 'KeyF': 7,
    // Rangée 3 (8-11): A,Z,E,R → codes physiques: KeyQ, KeyW, KeyE, KeyR
    'KeyQ': 8, 'KeyW': 9, 'KeyE': 10, 'KeyR': 11,
    // Haut (12-15): 1,2,3,4 → codes physiques: Digit1, Digit2, Digit3, Digit4
    'Digit1': 12, 'Digit2': 13, 'Digit3': 14, 'Digit4': 15,
  },
  qwerty: {
    // Bas (0-3): W,X,C,V → codes: KeyW, KeyX, KeyC, KeyV
    'KeyW': 0, 'KeyX': 1, 'KeyC': 2, 'KeyV': 3,
    // Rangée 2 (4-7): Q,S,D,F (codes QWERTY)
    'KeyQ': 4, 'KeyS': 5, 'KeyD': 6, 'KeyF': 7,
    // Rangée 3 (8-11): A,Z,E,R (codes QWERTY)
    'KeyA': 8, 'KeyZ': 9, 'KeyE': 10, 'KeyR': 11,
    // Haut (12-15): 1,2,3,4 → Digit1-4
    'Digit1': 12, 'Digit2': 13, 'Digit3': 14, 'Digit4': 15,
  }

};



// Mapping actif (par défaut azerty)
let KEY_MAPPING = KEYMAPS.azerty;

/**
 * Labels visuels pour les touches (affichés sur les pads)
 * Utilise les codes physiques pour être universel
 */
const KEY_LABELS = [
  'W', 'X', 'C', 'V',
  'Q', 'S', 'D', 'F',
  'A', 'Z', 'E', 'R',
  '1', '2', '3', '4'
];

export default class SamplerElement extends HTMLElement {
  constructor(plugin) {
    super();
    this.plugin = plugin || null;
    this.audioNode = plugin?.audioNode || null;
    this.attachShadow({ mode: 'open' });
    
    // État interne
    this._selectedPad = 0;
    this._mutedVolume = 1.0;

    // per-bank in-memory storage (buffers not serializable) to keep state when switching tabs
    this._banks = {
      A: this._makeEmptyBank(),
      B: this._makeEmptyBank(),
      C: this._makeEmptyBank(),
      D: this._makeEmptyBank()
    };

    // Recording state
    this._mediaStream = null;
    this._mediaRecorder = null;
    this._recChunks = [];
    this._recBlob = null;
    this._recSource = null;
    this._recAnalyser = null;
    this._recAnimationId = null;
    this._lastRecBlobUrl = null;
    // Create panel state
    this._createBuffer = null; // AudioBuffer loaded into Create panel
    this._createName = '';
    
    // Effects state
    this._fxReversed = false;
    this._fxAdsrEnabled = false;
    
    this._render();
    
    // If plugin already attached, wire midi checkbox
    try {
      if (this.plugin && this._midiEnable) {
        this._midiEnable.checked = !!(this.plugin && this.plugin._midiEnabled);
        this._midiEnable.onchange = (e) => {
          if (!this.plugin) return;
          if (e.target.checked) this.plugin.enableMidi(); else this.plugin.disableMidi();
        };
      }
    } catch (e) { /* ignore */ }
  }

  /**
   * Injecte le plugin après construction (utile quand l'élément est créé via document.createElement)
   * @param {SamplerPlugin} plugin - Instance du plugin WAM
   */
  setPlugin(plugin) {
    this.plugin = plugin;
    this.audioNode = plugin?.audioNode || null;
    // Wire MIDI enable checkbox if present
    try {
      if (this._midiEnable) {
        this._midiEnable.checked = !!(plugin && plugin._midiEnabled);
        this._midiEnable.onchange = (e) => {
          if (!this.plugin) return;
          if (e.target.checked) this.plugin.enableMidi(); else this.plugin.disableMidi();
        };
      }
    } catch (e) { /* ignore */ }
  }

  /**
   * Render initial du composant
   * @private
   */
  _render() {
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="sam-wrapper layout">
        <div class="left-col">
          <div class="header">
            <h2>Sampler 16</h2>
          </div>

          <!-- Menu de Presets (déplacé du state) -->
          <div class="preset-menu">
            <h3>🎵 Presets</h3>
            <select id="preset-select" title="Sélectionnez un preset">
              <option value="">-- Select Preset --</option>
            </select>
            <div class="preset-menu-actions">
              <button id="btn-load-preset" title="Charger le preset sélectionné">📂 Load</button>
              <button id="btn-save-preset" title="Sauvegarder l'état actuel">💾 Save</button>
            </div>
          </div>

          <div class="bank-buttons" role="tablist">
            <button class="bank-btn" data-bank="A">A</button>
            <button class="bank-btn" data-bank="B">B</button>
            <button class="bank-btn" data-bank="C">C</button>
            <button class="bank-btn" data-bank="D">D</button>
          </div>

          <div class="controls small-controls">
            <button id="btn-master-mute">Mute</button>
            <label>Volume <input id="rng-volume" type="range" min="0" max="1" step="0.01" value="1" /></label>
            <span id="vol-value">100%</span>
          </div>

          <div class="grid" id="grid"></div>
        </div>

        <div class="right-col">
          <div class="wavepanel">
            <canvas id="wave-canvas" width="600" height="140" style="width:100%;height:140px;border-radius:8px;background:#081226;border:1px solid #334155"></canvas>
            <div class="trimbars">
              <div class="trim-left">
                <label>Start</label>
                <input type="range" id="trim-left" min="0" max="1" step="0.001" value="0" />
                <span id="trim-left-val">0%</span>
              </div>
              <div class="trim-right">
                <label>End</label>
                <input type="range" id="trim-right" min="0" max="1" step="0.001" value="1" />
                <span id="trim-right-val">100%</span>
              </div>
            </div>
          </div>

          <div class="panel-switch">
            <button class="zone-btn" data-zone="create">Create</button>
            <button class="zone-btn" data-zone="state">State</button>
            <button class="zone-btn" data-zone="params">Params</button>
            <button class="zone-btn" data-zone="freesound">Freesound</button>
            <button class="zone-btn" data-zone="effects">Effects</button>
            <button class="zone-btn" data-zone="rec">Rec</button>
          </div>

          <div class="zone-container">
            <div id="zone-create" class="zone" style="display:none">
              <h3 style="margin:0 0 12px 0;color:#e2e8f0;font-size:14px">🎵 Charger Sample sur le Pad Sélectionné</h3>
              <div class="file-controls" style="margin-bottom:16px;padding:12px;background:#0f172a;border-radius:6px;border:1px solid #334155">
                <button id="btn-load" style="padding:8px 12px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:8px">📁 Charger Sample</button>
                <button id="btn-clear" style="padding:8px 12px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:8px">🗑️ Vider Pad</button>
                <button id="btn-clear-all" style="padding:8px 12px;background:#dc2626;color:white;border:none;border-radius:4px;cursor:pointer">🧹 Vider Tout</button>
                <input type="file" id="file-input" accept="audio/*" style="display:none" />
              </div>
              
              <h3 style="margin:16px 0 12px 0;color:#e2e8f0;font-size:14px">✂️ Couper le Sample</h3>
              <div style="padding:12px;background:#0f172a;border-radius:6px;border:1px solid #334155;margin-bottom:16px">
                <p style="font-size:11px;color:#94a3b8;margin:0 0 8px 0">💡 Glissez les barres bleues sur le canvas pour ajuster le trim</p>
                <button id="btn-apply-trim" style="padding:8px 12px;background:#10b981;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold">✂️ Couper et Appliquer le Trim</button>
              </div>
              
              <h3 style="margin:16px 0 12px 0;color:#e2e8f0;font-size:14px">🎹 Créer Instrument (Avancé)</h3>
              <div style="padding:12px;background:#0f172a;border-radius:6px;border:1px solid #334155">
                <button id="btn-import-create" style="padding:8px 12px;background:#8b5cf6;color:white;border:none;border-radius:4px;cursor:pointer;margin-bottom:8px">📥 Importer Audio Long</button>
                <input type="file" id="create-file-input" accept="audio/*" style="display:none" />
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
                  <div>
                    <label style="display:block;font-size:11px;color:#94a3b8;margin-bottom:4px">Gamme</label>
                    <select id="instrument-scale" style="width:100%;padding:6px;border-radius:4px;border:1px solid #334155;background:#0b1224;color:#e2e8f0">
                      <option value="chromatic">Chromatique</option>
                      <option value="whole">Par tons entiers</option>
                      <option value="major">Majeure</option>
                      <option value="minor">Mineure</option>
                    </select>
                  </div>
                  <div>
                    <label style="display:block;font-size:11px;color:#94a3b8;margin-bottom:4px">Note MIDI de base</label>
                    <input id="instrument-root" type="number" min="0" max="127" value="60" style="width:100%;padding:6px;border-radius:4px;border:1px solid #334155;background:#0b1224;color:#e2e8f0" />
                  </div>
                </div>
                <button id="btn-slice-create" style="padding:8px 12px;background:#f59e0b;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:8px;margin-right:8px">✂️ Slicer (silences)</button>
                <button id="btn-create-instrument" style="padding:8px 12px;background:#ec4899;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:8px">🎹 Créer Instrument</button>
              </div>
            </div>
            <div id="zone-state" class="zone" style="display:none">
              <h3 style="margin:0 0 16px 0;color:#e2e8f0;font-size:14px">🔧 Test State API</h3>
              
              <div style="padding:16px;background:#0f172a;border-radius:6px;border:1px solid #334155;margin-bottom:16px">
                <h4 style="margin:0 0 12px 0;color:#e2e8f0;font-size:13px">📤 Exporter l'état</h4>
                <p style="margin:0 0 12px 0;font-size:12px;color:#94a3b8;line-height:1.5">
                  Exporte l'état complet du plugin (samples, trims, effets, presets) dans un fichier JSON.
                </p>
                <button id="btn-export-state" style="padding:10px 16px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:500">📤 Exporter State</button>
              </div>
              
              <div style="padding:16px;background:#0f172a;border-radius:6px;border:1px solid #334155;margin-bottom:16px">
                <h4 style="margin:0 0 12px 0;color:#e2e8f0;font-size:13px">📥 Importer un état</h4>
                <p style="margin:0 0 12px 0;font-size:12px;color:#94a3b8;line-height:1.5">
                  Charge un fichier JSON d'état pour restaurer tous les paramètres du plugin.
                </p>
                <button id="btn-import-state" style="padding:10px 16px;background:#8b5cf6;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:500">📥 Importer State</button>
                <input type="file" id="state-file-input" accept=".json" style="display:none" />
              </div>
              
              <div style="padding:16px;background:#0f172a;border-radius:6px;border:1px solid #334155">
                <h4 style="margin:0 0 12px 0;color:#e2e8f0;font-size:13px">🔍 Afficher l'état actuel</h4>
                <p style="margin:0 0 12px 0;font-size:12px;color:#94a3b8;line-height:1.5">
                  Affiche l'état JSON dans la console pour débogage.
                </p>
                <button id="btn-log-state" style="padding:10px 16px;background:#10b981;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:500">🔍 Log State</button>
              </div>
            </div>
            <div id="zone-params" class="zone" style="display:none">
              <div class="params-controls">
                <label>Audio input</label>
                <select id="device-select"></select>
                <button id="btn-refresh-devices">Refresh</button>
                <div style="margin-top:8px">
                  <label><input type="checkbox" id="midi-enable" /> Enable MIDI</label>
                </div>
              </div>
            </div>
            <div id="zone-freesound" class="zone" style="display:none">
              <div class="freesound-controls">
                <div style="display:flex;gap:8px;align-items:center">
                  <label style="white-space:nowrap">Freesound API key</label>
                  <input id="freesound-api-key" placeholder="Token (ex: ABC...)"></input>
                  <button id="btn-save-freesound-key">Save</button>
                </div>
                <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
                  <input id="freesound-query" placeholder="Search freesound..." style="flex:1" />
                  <button id="btn-freesound-search">Search</button>
                </div>
                <div id="freesound-results" style="margin-top:8px;max-height:220px;overflow:auto;border:1px solid #223344;padding:6px;border-radius:6px;background:#071226"></div>
              </div>
            </div>
            <div id="zone-effects" class="zone" style="display:none">
              <div class="effects-grid">
                <div class="effect-control">
                  <label>Volume</label>
                  <input type="range" id="fx-volume" min="0" max="1" step="0.01" value="0.5" />
                  <span id="fx-volume-val">50%</span>
                </div>
                <div class="effect-control">
                  <label>Pan</label>
                  <input type="range" id="fx-pan" min="-1" max="1" step="0.01" value="0" />
                  <span id="fx-pan-val">0</span>
                </div>
                <div class="effect-control">
                  <label>Tone</label>
                  <input type="range" id="fx-tone" min="-1" max="1" step="0.01" value="0" />
                  <span id="fx-tone-val">0</span>
                </div>
                <div class="effect-control">
                  <label>Pitch</label>
                  <input type="range" id="fx-pitch" min="-24" max="24" step="1" value="0" />
                  <span id="fx-pitch-val">0</span>
                </div>
                <div class="effect-control">
                  <button id="fx-reverse">🔄 Reverse</button>
                  <button id="fx-adsr-enable">Enable ADSR</button>
                </div>
              </div>
              <div class="adsr-controls" id="adsr-section" style="display:none;margin-top:12px">
                <div class="effect-control">
                  <label>Attack</label>
                  <input type="range" id="fx-attack" min="0" max="1" step="0.01" value="0.2" />
                  <span id="fx-attack-val">0.20</span>
                </div>
                <div class="effect-control">
                  <label>Decay</label>
                  <input type="range" id="fx-decay" min="0" max="1" step="0.01" value="0.2" />
                  <span id="fx-decay-val">0.20</span>
                </div>
                <div class="effect-control">
                  <label>Sustain</label>
                  <input type="range" id="fx-sustain" min="0" max="1" step="0.01" value="1" />
                  <span id="fx-sustain-val">1.00</span>
                </div>
                <div class="effect-control">
                  <label>Release</label>
                  <input type="range" id="fx-release" min="0" max="1" step="0.01" value="0.3" />
                  <span id="fx-release-val">0.30</span>
                </div>
              </div>
            </div>
            <div id="zone-rec" class="zone" style="display:none">
              <div class="rec-controls">
                <button id="btn-rec">🔴 REC</button>
                <button id="btn-stop" disabled>⏹️ STOP</button>
                <button id="btn-play-rec" disabled>▶️ PLAY</button>
                <span id="rec-timer" style="margin-left:12px;font-family:monospace;font-size:14px;color:#60a5fa">00:00.0</span>
                <span id="rec-status" style="margin-left:12px;font-size:12px;color:#94a3b8">Prêt</span>
              </div>
              <canvas id="rec-canvas" width="600" height="80" style="width:100%;height:80px;border-radius:6px;background:#071021;border:1px solid #334155;margin-top:8px"></canvas>
              
              <!-- Panel de résultat d'enregistrement -->
              <div id="rec-result-panel" style="display:none;margin-top:12px;padding:12px;background:#0f172a;border-radius:6px;border:1px solid #334155">
                <h4 style="margin:0 0 8px 0;color:#e2e8f0;font-size:14px">✓ Enregistrement terminé</h4>
                <audio id="rec-audio-preview" controls style="width:100%;margin-bottom:12px"></audio>
                
                <p style="font-size:11px;color:#94a3b8;margin:8px 0">💡 Glissez les barres bleues sur le canvas pour ajuster le trim</p>
                
                <div style="display:flex;gap:8px;align-items:center">
                  <button id="btn-assign-to-selected" style="padding:8px 12px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold">📥 Assigner au pad sélectionné</button>
                  <button id="btn-download-rec" style="padding:8px 12px;background:#10b981;color:white;border:none;border-radius:4px;cursor:pointer">⬇️ Télécharger</button>
                </div>
              </div>
            </div>
          </div>
    `;
  }

  async _onFreesoundSearch() {
    try {
      const key = (this._fsKeyInput?.value || '').trim();
      const q = (this._fsQuery?.value || '').trim();
      if (!q) { this._setStatus('Entrez une requête Freesound'); return; }
      this._setStatus('Recherche Freesound...');
      const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(q)}&fields=id,name,previews&filter=duration:[0 TO 30]&page_size=20`;
      const headers = key ? { Authorization: `Token ${key}` } : {};
      const resp = await fetch(url, { headers });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const results = data.results || [];
      this._renderFreesoundResults(results, key);
      this._setStatus(`Résultats: ${results.length}`);
    } catch (e) {
      console.warn('Freesound search failed', e);
      this._setStatus('✗ Freesound recherche échouée');
    }
  }

  _renderFreesoundResults(results, key) {
    if (!this._fsResults) return;
    this._fsResults.innerHTML = '';
    for (const r of results) {
      const dlUrl = `https://freesound.org/apiv2/sounds/${r.id}/download/?token=${encodeURIComponent(key)}`;
      const item = document.createElement('div');
      item.draggable = true;
      item.ondragstart = (ev) => { try { ev.dataTransfer.setData('text/plain', dlUrl); } catch (e) { /* ignore */ } };
      item.style.padding = '6px';
      item.style.borderBottom = '1px solid #102233';

      const title = document.createElement('div');
      title.textContent = r.name || `sound ${r.id}`;
      title.style.color = '#cbd5e1';
      title.style.fontSize = '12px';
      title.style.marginBottom = '6px';
      item.appendChild(title);

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '6px';

      // Preview button (uses preview URL when available)
      const previewUrl = r.previews?.['preview-hq-mp3'] || r.previews?.['preview-lq-mp3'] || null;
      if (previewUrl) {
        const btnPrev = document.createElement('button');
        btnPrev.textContent = '▶';
        btnPrev.onclick = () => {
          try {
            if (this._fsPreviewAudio) { this._fsPreviewAudio.pause(); this._fsPreviewAudio = null; }
            this._fsPreviewAudio = new Audio(previewUrl);
            this._fsPreviewAudio.play();
          } catch (e) { console.warn('preview failed', e); }
        };
        controls.appendChild(btnPrev);
      }

      const btnLoad = document.createElement('button');
      btnLoad.textContent = 'Load → Create';
      btnLoad.onclick = async () => {
        try {
          await this._loadUrlIntoCreate(dlUrl, previewUrl);
        } catch (e) { console.warn('load into create failed', e); }
      };
      controls.appendChild(btnLoad);

      const a = document.createElement('a');
      a.href = dlUrl;
      a.textContent = '⬇️';
      a.target = '_blank';
      a.style.marginLeft = '6px';
      controls.appendChild(a);

      item.appendChild(controls);
      this._fsResults.appendChild(item);
    }
  }

  async _loadUrlIntoCreate(dlUrl, fallbackPreview = null) {
    try {
      // Try download endpoint first
      let response = await fetch(dlUrl);
      if (!response.ok) {
        if (fallbackPreview) response = await fetch(fallbackPreview);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.plugin.audioContext.decodeAudioData(arrayBuffer);
      this._loadBufferIntoCreate(audioBuffer, `freesound_${Date.now()}`);
    } catch (e) {
      console.warn('loadUrlIntoCreate failed', e);
      this._setStatus('✗ Échec chargement Freesound');
    }
  }

  /**
   * Lifecycle : composant monté dans le DOM
   */
  connectedCallback() {
    // Ensure current bank visual set
    requestAnimationFrame(() => this._switchBank(this._currentBank || 'A'));
    this._grid = this.shadowRoot.getElementById('grid');
    this._status = this.shadowRoot.getElementById('status');
    this._fileInput = this.shadowRoot.getElementById('file-input');
    this._muteBtn = this.shadowRoot.getElementById('btn-master-mute');
    this._volumeRange = this.shadowRoot.getElementById('rng-volume');
    this._volValue = this.shadowRoot.getElementById('vol-value');
    this._padFileNames = new Array(16).fill('');
    this._waveCanvas = this.shadowRoot.getElementById('wave-canvas');
    this._waveCtx = this._waveCanvas.getContext && this._waveCanvas.getContext('2d');
    this._trimLeft = this.shadowRoot.getElementById('trim-left');
    this._trimRight = this.shadowRoot.getElementById('trim-right');
    this._trimLeftVal = this.shadowRoot.getElementById('trim-left-val');
    this._trimRightVal = this.shadowRoot.getElementById('trim-right-val');
    
    // Setup interactions de trim sur le canvas principal
    this._mainTrimDragging = null; // 'start' | 'end' | null
    if (this._waveCanvas) {
      this._waveCanvas.addEventListener('mousedown', (e) => this._onMainCanvasMouseDown(e));
      this._waveCanvas.addEventListener('mousemove', (e) => this._onMainCanvasMouseMove(e));
      this._waveCanvas.addEventListener('mouseup', () => this._onMainCanvasMouseUp());
      this._waveCanvas.addEventListener('mouseleave', () => this._onMainCanvasMouseUp());
      this._waveCanvas.style.cursor = 'pointer';
    }
    
    this._zoneContainer = this.shadowRoot.querySelector('.zone-container');
    this._currentZone = null;
    this._lastPlayedBuffer = null;

    // default bank
    this._currentBank = 'A';
    // per-pad waveform summaries (downsampled) for quick redraw and persistence
    this._waveforms = new Array(16).fill(null);

    this._buildGrid();
    this._bindEvents();
    this._setupKeyboard();

    // trimbars
    if (this._trimLeft) this._trimLeft.oninput = () => this._onTrimChange();
    if (this._trimRight) this._trimRight.oninput = () => this._onTrimChange();
    
    // Bouton pour couper/appliquer le trim
    this._btnApplyTrim = this.shadowRoot.getElementById('btn-apply-trim');
    if (this._btnApplyTrim) this._btnApplyTrim.onclick = () => this._applyTrimToCurrentPad();
    
    // State tab bindings
    this._btnExportState = this.shadowRoot.getElementById('btn-export-state');
    this._btnImportState = this.shadowRoot.getElementById('btn-import-state');
    this._btnLogState = this.shadowRoot.getElementById('btn-log-state');
    this._stateFileInput = this.shadowRoot.getElementById('state-file-input');
    if (this._btnExportState) this._btnExportState.onclick = () => this._exportState();
    if (this._btnImportState) this._btnImportState.onclick = () => { if (this._stateFileInput) this._stateFileInput.click(); };
    if (this._btnLogState) this._btnLogState.onclick = () => this._logState();
    if (this._stateFileInput) this._stateFileInput.onchange = (e) => { const f = e.target.files?.[0]; if (f) this._importState(f); e.target.value = ''; };
    
    // State tab bindings
    this._btnExportState = this.shadowRoot.getElementById('btn-export-state');
    this._btnImportState = this.shadowRoot.getElementById('btn-import-state');
    this._stateFileInput = this.shadowRoot.getElementById('state-file-input');
    if (this._btnExportState) this._btnExportState.onclick = () => this._exportState();
    if (this._btnImportState) this._btnImportState.onclick = () => { if (this._stateFileInput) this._stateFileInput.click(); };
    if (this._stateFileInput) this._stateFileInput.onchange = (e) => { const f = e.target.files?.[0]; if (f) this._importState(f); e.target.value = ''; };
    
    // Bouton pour couper/appliquer le trim
    this._btnApplyTrim = this.shadowRoot.getElementById('btn-apply-trim');
    if (this._btnApplyTrim) this._btnApplyTrim.onclick = () => this._applyTrimToCurrentPad();
    
    // State tab bindings
    this._btnExportState = this.shadowRoot.getElementById('btn-export-state');
    this._btnImportState = this.shadowRoot.getElementById('btn-import-state');
    this._stateFileInput = this.shadowRoot.getElementById('state-file-input');
    if (this._btnExportState) this._btnExportState.onclick = () => this._exportState();
    if (this._btnImportState) this._btnImportState.onclick = () => { if (this._stateFileInput) this._stateFileInput.click(); };
    if (this._stateFileInput) this._stateFileInput.onchange = (e) => { const f = e.target.files?.[0]; if (f) this._importState(f); e.target.value = ''; };

    // draw initial empty waveform
    if (this._waveCtx) this._clearWaveCanvas();

    // zone switcher
    this.shadowRoot.querySelectorAll('.zone-btn').forEach((b) => {
      b.onclick = (e) => this._switchZone(e.target.dataset.zone);
    });

    // bank buttons
    this.shadowRoot.querySelectorAll('.bank-btn').forEach((b) => {
      b.onclick = (e) => this._switchBank(e.target.dataset.bank);
    });

    // Preset input name (nouveau champ dans le menu principal)
    this._presetNameInput = this.shadowRoot.getElementById('preset-name-input');
    if (!this._presetNameInput) {
      // Créer dynamiquement le champ si pas présent
      const presetMenu = this.shadowRoot.querySelector('.preset-menu');
      if (presetMenu) {
        const input = document.createElement('input');
        input.id = 'preset-name-input';
        input.type = 'text';
        input.placeholder = 'Nom du preset';
        input.style.cssText = 'width:100%;padding:6px;border-radius:4px;border:1px solid #334155;background:#0f172a;color:#e2e8f0;margin-bottom:8px;font-size:12px';
        const select = presetMenu.querySelector('select');
        if (select) {
          presetMenu.insertBefore(input, select);
          this._presetNameInput = input;
        }
      }
    }

    // Params: device select and refresh
    this._deviceSelect = this.shadowRoot.getElementById('device-select');
    this._refreshDevicesBtn = this.shadowRoot.getElementById('btn-refresh-devices');
    this._midiEnable = this.shadowRoot.getElementById('midi-enable');
    if (this._refreshDevicesBtn) this._refreshDevicesBtn.onclick = () => this._populateDeviceList();
    this._populateDeviceList();

    // Recording controls
    this._btnRec = this.shadowRoot.getElementById('btn-rec');
    this._btnStop = this.shadowRoot.getElementById('btn-stop');
    this._btnPlayRec = this.shadowRoot.getElementById('btn-play-rec');
    this._recCanvas = this.shadowRoot.getElementById('rec-canvas');
    this._recTimer = this.shadowRoot.getElementById('rec-timer');
    this._recStatus = this.shadowRoot.getElementById('rec-status');
    this._recResultPanel = this.shadowRoot.getElementById('rec-result-panel');
    this._recAudioPreview = this.shadowRoot.getElementById('rec-audio-preview');
    this._recStartTime = 0;
    this._recTimerInterval = null;
    
    if (this._btnRec) this._btnRec.onclick = () => this._startRecording();
    if (this._btnStop) this._btnStop.onclick = () => this._stopRecording();
    if (this._btnPlayRec) this._btnPlayRec.onclick = () => this._playRecording();
    
    // Nouveaux boutons d'assignation rapide
    const btnAssignToSelected = this.shadowRoot.getElementById('btn-assign-to-selected');
    const btnAssignToNextEmpty = this.shadowRoot.getElementById('btn-assign-to-next-empty');
    const btnDiscardRec = this.shadowRoot.getElementById('btn-discard-rec');
    
    if (btnAssignToSelected) btnAssignToSelected.onclick = () => {
      if (this._lastRecBlobUrl) {
        this._loadBlobUrlToPad(this._lastRecBlobUrl, this._selectedPad);
        this._hideRecResult();
        this._setStatus(`✓ Sample assigné au pad ${this._selectedPad + 1}`);
      }
    };
    
    if (btnAssignToNextEmpty) btnAssignToNextEmpty.onclick = () => {
      if (this._lastRecBlobUrl) {
        const emptyPad = this._findNextEmptyPad();
        if (emptyPad >= 0) {
          this._loadBlobUrlToPad(this._lastRecBlobUrl, emptyPad);
          this._selectPad(emptyPad);
          this._hideRecResult();
          this._setStatus(`✓ Sample assigné au pad ${emptyPad + 1}`);
        } else {
          this._setStatus('⚠️ Aucun pad vide disponible');
        }
      }
    };
    
    if (btnDiscardRec) btnDiscardRec.onclick = () => {
      if (this._lastRecBlobUrl) {
        URL.revokeObjectURL(this._lastRecBlobUrl);
        this._lastRecBlobUrl = null;
      }
      this._hideRecResult();
      this._setStatus('🗑️ Enregistrement annulé');
    };
    
    this._btnDownloadRec = this.shadowRoot.getElementById('btn-download-rec');
    this._btnAssignToSelected = this.shadowRoot.getElementById('btn-assign-to-selected');
    
    if (this._btnDownloadRec) this._btnDownloadRec.onclick = () => this._downloadRecording();
    if (this._btnAssignToSelected) this._btnAssignToSelected.onclick = () => this._assignRecordingToSelectedPad();
    
    // Trim bars pour le canvas d'enregistrement (valeurs par défaut)
    this._recTrimStart = 0;
    this._recTrimEnd = 1;
    this._recTrimDragging = null; // 'start' | 'end' | null
    
    // Setup des événements pour les trim bars sur le canvas d'enregistrement
    if (this._recCanvas) {
      this._recCanvas.addEventListener('mousedown', (e) => this._onRecCanvasMouseDown(e));
      this._recCanvas.addEventListener('mousemove', (e) => this._onRecCanvasMouseMove(e));
      this._recCanvas.addEventListener('mouseup', () => this._onRecCanvasMouseUp());
      this._recCanvas.addEventListener('mouseleave', () => this._onRecCanvasMouseUp());
      this._recCanvas.style.cursor = 'pointer';
    }

    // Create panel bindings
    this._createFileInput = this.shadowRoot.getElementById('create-file-input');
    this._btnImportCreate = this.shadowRoot.getElementById('btn-import-create');
    this._btnSliceCreate = this.shadowRoot.getElementById('btn-slice-create');
    this._btnCreateInstrument = this.shadowRoot.getElementById('btn-create-instrument');
    this._instrumentScale = this.shadowRoot.getElementById('instrument-scale');
    this._instrumentRoot = this.shadowRoot.getElementById('instrument-root');
    if (this._btnImportCreate) this._btnImportCreate.onclick = () => { if (this._createFileInput) this._createFileInput.click(); };
    if (this._createFileInput) this._createFileInput.onchange = (e) => { const f = e.target.files?.[0]; if (f) this._loadFileIntoCreate(f); e.target.value = ''; };
    if (this._btnSliceCreate) this._btnSliceCreate.onclick = () => this._createSlicesFromCreateBuffer();
    if (this._btnCreateInstrument) this._btnCreateInstrument.onclick = () => this._createInstrumentFromCreateBuffer();

    // Effects panel bindings
    this._fxVolume = this.shadowRoot.getElementById('fx-volume');
    this._fxPan = this.shadowRoot.getElementById('fx-pan');
    this._fxTone = this.shadowRoot.getElementById('fx-tone');
    this._fxPitch = this.shadowRoot.getElementById('fx-pitch');
    this._fxReverse = this.shadowRoot.getElementById('fx-reverse');
    this._fxAdsrEnable = this.shadowRoot.getElementById('fx-adsr-enable');
    this._fxAttack = this.shadowRoot.getElementById('fx-attack');
    this._fxDecay = this.shadowRoot.getElementById('fx-decay');
    this._fxSustain = this.shadowRoot.getElementById('fx-sustain');
    this._fxRelease = this.shadowRoot.getElementById('fx-release');
    this._adsrSection = this.shadowRoot.getElementById('adsr-section');

    if (this._fxVolume) this._fxVolume.oninput = (e) => this._onFxVolumeChange(e.target.value);
    if (this._fxPan) this._fxPan.oninput = (e) => this._onFxPanChange(e.target.value);
    if (this._fxTone) this._fxTone.oninput = (e) => this._onFxToneChange(e.target.value);
    if (this._fxPitch) this._fxPitch.oninput = (e) => this._onFxPitchChange(e.target.value);
    if (this._fxReverse) this._fxReverse.onclick = () => this._onFxReverseClick();
    if (this._fxAdsrEnable) this._fxAdsrEnable.onclick = () => this._onFxAdsrEnableClick();
    if (this._fxAttack) this._fxAttack.oninput = (e) => this._onFxAttackChange(e.target.value);
    if (this._fxDecay) this._fxDecay.oninput = (e) => this._onFxDecayChange(e.target.value);
    if (this._fxSustain) this._fxSustain.oninput = (e) => this._onFxSustainChange(e.target.value);
    if (this._fxRelease) this._fxRelease.oninput = (e) => this._onFxReleaseChange(e.target.value);

    // Freesound bindings
    this._fsKeyInput = this.shadowRoot.getElementById('freesound-api-key');
    this._btnSaveFsKey = this.shadowRoot.getElementById('btn-save-freesound-key');
    this._fsQuery = this.shadowRoot.getElementById('freesound-query');
    this._btnFsSearch = this.shadowRoot.getElementById('btn-freesound-search');
    this._fsResults = this.shadowRoot.getElementById('freesound-results');

    // Load saved key
    try {
      const saved = window.localStorage.getItem('freesound_api_key');
      if (saved && this._fsKeyInput) this._fsKeyInput.value = saved;
    } catch (e) { /* ignore */ }

    if (this._btnSaveFsKey) this._btnSaveFsKey.onclick = () => {
      try {
        const k = (this._fsKeyInput?.value || '').trim();
        if (k) window.localStorage.setItem('freesound_api_key', k);
        this._setStatus(k ? 'Freesound key saved' : 'Cleared Freesound key');
      } catch (e) { console.warn('save freesound key failed', e); }
    };

    if (this._btnFsSearch) this._btnFsSearch.onclick = () => this._onFreesoundSearch();

    // Initialiser les presets factory si nécessaire
    if (this._presetMgr) {
      this._initializeFactoryPresets().catch(e => {
        console.warn('Failed to initialize factory presets:', e);
      });
    }
  }

  /**
   * Construire la grille de 16 pads
   * @private
   */
  _buildGrid() {
    this._grid.innerHTML = '';
    // Ordre d'affichage pour que le pad 1 soit en bas-gauche
    // Lignes affichées de haut en bas: [13-16], [9-12], [5-8], [1-4]
    const displayOrder = [
      12,13,14,15,
       8, 9,10,11,
       4, 5, 6, 7,
       0, 1, 2, 3,
    ];
    for (const i of displayOrder) {
      const pad = document.createElement('div');
      pad.className = 'pad';
      pad.dataset.index = i;
      
      const label = document.createElement('div');
      label.textContent = i + 1;
      
      const keyHint = document.createElement('div');
      keyHint.className = 'pad-key';
      keyHint.textContent = KEY_LABELS[i];

      const fileHint = document.createElement('div');
      fileHint.className = 'pad-key';
      fileHint.style.fontSize = '9px';
      fileHint.style.color = '#a3a3a3';
      fileHint.textContent = (this._padFileNames[i] || '').slice(0, 12);
      
      pad.appendChild(label);
      pad.appendChild(keyHint);
      pad.appendChild(fileHint);
      
      if (i === this._selectedPad) pad.classList.add('selected');
      this._grid.appendChild(pad);
    }
  }

  /**
   * Lier les événements UI
   * @private
   */
  _bindEvents() {
    // Clic sur un pad : sélection + lecture
    // If multiple pads visually overlap at the click point, play them all.
    this._grid.addEventListener('click', (e) => {
      // Determine click point
      const x = e.clientX;
      const y = e.clientY;

      // Find all pad elements whose bounding rect contains the click point
      const pads = Array.from(this._grid.querySelectorAll('.pad')).filter((p) => {
        const r = p.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      });
      if (!pads || pads.length === 0) return;

      // Select the topmost pad (first in list) and play all pads found
      const topPad = pads[0];
      const topIndex = Number(topPad.dataset.index);
      this._selectPad(topIndex);
      // play each pad, keep velocity constant
      for (const p of pads) {
        const index = Number(p.dataset.index);
        console.log(`[GUI] click -> playing pad ${index}`);
        this._playPad(index, 0.85);
      }
    });

    // Drag & drop sur la grille
    this._grid.addEventListener('dragover', (e) => { e.preventDefault(); });
    this._grid.addEventListener('drop', async (e) => {
      e.preventDefault();
      const padEl = e.target.closest('.pad');
      const targetIndex = padEl ? Number(padEl.dataset.index) : this._selectedPad;
      const file = e.dataTransfer?.files?.[0];
      if (file) { this._selectedPad = targetIndex; this._loadFile(file); return; }
      const url = e.dataTransfer?.getData('text/plain') || e.dataTransfer?.getData('text/uri-list');
      if (url) {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.plugin.audioContext.decodeAudioData(arrayBuffer);
          this.audioNode.loadSample(targetIndex, audioBuffer);
          this._markLoaded(targetIndex, true);
          this._padFileNames[targetIndex] = (new URL(url, location.href)).pathname.split('/').pop();
          this._updatePadFilename(targetIndex);
          const summary = this._computeWaveformSummary(audioBuffer, 512);
          this._waveforms[targetIndex] = summary;
          try { this._saveCurrentBank(); } catch (e) { console.warn('save bank after drop load failed', e); }
        } catch (err) { console.warn('drop load failed', err); }
      }
    });

    // Bouton "Charger"
    const btnLoad = this.shadowRoot.getElementById('btn-load');
    if (btnLoad) btnLoad.onclick = () => { if (this._fileInput) this._fileInput.click(); };
    
    this._fileInput.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) this._loadFile(file);
      e.target.value = ''; // Reset pour permettre rechargement du même fichier
    };

    // Bouton "Vider"
    const btnClear = this.shadowRoot.getElementById('btn-clear');
    if (btnClear) btnClear.onclick = () => { this._clearPad(); };

    // Bouton "Vider tout"
    const btnClearAll = this.shadowRoot.getElementById('btn-clear-all');
    if (btnClearAll) btnClearAll.onclick = () => { this._clearAll(); };
    // Presets UI (avec serveur REST + fallback localStorage)
    import('../PresetManager.js').then(({ default: PresetManager }) => {
      this._presetMgr = new PresetManager('wam-sampler-clean', 'http://localhost:3000');
      this._refreshPresetSelect();

      const btnSavePreset = this.shadowRoot.getElementById('btn-save-preset');
      const presetNameInput = this.shadowRoot.getElementById('preset-name');
      if (btnSavePreset) btnSavePreset.onclick = async () => {
        const name = presetNameInput ? (presetNameInput.value || '').trim() : '';
        if (!name) { this._setStatus('✗ Nom de preset requis'); return; }
        
        try {
          const state = this.audioNode.getState() || {};
          // include trims and waveform summaries in the saved state
          state.trims = {
            left: Number(this._trimLeft?.value || 0),
            right: Number(this._trimRight?.value || 1)
          };
          state.waveforms = this._waveforms.map(w => w ? Array.from(w) : null);
          const samples = this._collectSampleRefs();
          await this._presetMgr.savePreset(name, state, samples);
          await this._refreshPresetSelect();
          this._setStatus(`✓ Preset sauvegardé: ${name}`);
        } catch (e) {
          this._setStatus(`✗ Erreur sauvegarde: ${e.message}`);
        }
      };

      const btnLoadPreset = this.shadowRoot.getElementById('btn-load-preset');
      const presetSelect = this.shadowRoot.getElementById('preset-select');
      if (btnLoadPreset) btnLoadPreset.onclick = async () => {
        const select = presetSelect;
        const name = select ? select.value : '';
        if (!name) return;

        try {
          const preset = await this._presetMgr.loadPreset(name);
          if (!preset || !preset.state) { 
            this._setStatus('✗ Preset introuvable'); 
            return; 
          }
          this.audioNode.setState(preset.state);
          
          // Clear UI for pads that are not part of the preset samples so
          // previous filenames/waveforms don't remain visible.
          try {
            const presetPadIndexes = new Set((preset.samples || []).map(s => s && s.padIndex).filter(i => i !== undefined));
            for (let i = 0; i < 16; i += 1) {
              if (!presetPadIndexes.has(i)) {
                this._padFileNames[i] = '';
                this._waveforms[i] = null;
                this._markLoaded(i, false);
                this._updatePadFilename(i);
                if (i === this._selectedPad) this._drawSelectedWaveform(i);
              }
            }
          } catch (e) {
            console.warn('Failed to clear UI for empty preset pads', e);
          }

          // Recharger les samples depuis leurs URLs si disponibles
          if (preset.samples && preset.samples.length > 0) {
            await this._loadSamplesFromUrls(preset.samples);
          }

          // Ensure audio node pads get restored (setState already called), but also apply trims explicitly
          if (preset.state && Array.isArray(preset.state.pads)) {
            for (let i = 0; i < preset.state.pads.length; i++) {
              const ps = preset.state.pads[i];
              if (ps && typeof ps.trimStart === 'number' && typeof ps.trimEnd === 'number') {
                try {
                  if (this.audioNode && typeof this.audioNode.setPadTrimStart === 'function') {
                    this.audioNode.setPadTrimStart(i, ps.trimStart);
                    this.audioNode.setPadTrimEnd(i, ps.trimEnd);
                  } else if (this.audioNode && this.audioNode.pads && this.audioNode.pads[i]) {
                    this.audioNode.pads[i].trimStart = ps.trimStart;
                    this.audioNode.pads[i].trimEnd = ps.trimEnd;
                  }
                } catch (e) { console.warn('apply pad trim failed', e); }
              }
            }
            // Update UI trimbars to reflect selected pad
            const selPadState = preset.state.pads[this._selectedPad];
            if (selPadState) {
              if (this._trimLeft) this._trimLeft.value = selPadState.trimStart ?? 0;
              if (this._trimRight) this._trimRight.value = selPadState.trimEnd ?? 1;
            }
          } else if (preset.state.trims) {
            // Fallback global trims saved in state
            const t = preset.state.trims;
            if (this._trimLeft) this._trimLeft.value = t.left ?? 0;
            if (this._trimRight) this._trimRight.value = t.right ?? 1;
          }

          // Restore waveform summaries if present
          if (preset.state.waveforms && Array.isArray(preset.state.waveforms)) {
            this._waveforms = preset.state.waveforms.map(w => (w ? Float32Array.from(w) : null));
            // redraw selected pad waveform
            this._drawSelectedWaveform(this._selectedPad);
          }
          
          this._setStatus(`✓ Preset chargé: ${name}`);
          // persist loaded preset into current bank memory so switching tabs keeps it
          try { this._saveCurrentBank(); } catch (e) { console.warn('save bank after load failed', e); }
        } catch (e) {
          this._setStatus(`✗ Erreur chargement: ${e.message}`);
        }
      };

      const btnDeletePreset = this.shadowRoot.getElementById('btn-delete-preset');
      if (btnDeletePreset) btnDeletePreset.onclick = async () => {
        const select = presetSelect;
        const name = select ? select.value : '';
        if (!name) return;

        try {
          await this._presetMgr.deletePreset(name);
          await this._refreshPresetSelect();
          this._setStatus(`✓ Preset supprimé: ${name}`);
        } catch (e) {
          this._setStatus(`✗ Erreur suppression: ${e.message}`);
        }
      };
    }).catch((e) => console.warn('PresetManager non disponible:', e));

    // Toggle layout (AZERTY/QWERTY)
    // Ajout d'un petit switch via double-clic sur le titre pour basculer le mapping
    const headerTitle = this.shadowRoot.querySelector('.header h2');
    if (headerTitle) {
      headerTitle.title = 'Double-clic: basculer layout AZERTY/QWERTY';
      headerTitle.ondblclick = () => {
        KEY_MAPPING = (KEY_MAPPING === KEYMAPS.azerty) ? KEYMAPS.qwerty : KEYMAPS.azerty;
        const layoutName = (KEY_MAPPING === KEYMAPS.azerty) ? 'AZERTY' : 'QWERTY';
        this._setStatus(`Layout: ${layoutName}`);
      };
    }

    // Slider volume master (guarded)
    if (this._volumeRange) {
      this._volumeRange.oninput = (e) => {
        const v = Number(e.target.value);
        try {
          if (this.audioNode) this.audioNode.masterVolume = v;
        } catch (err) { console.warn('apply master volume failed', err); }
        if (this._volValue) this._volValue.textContent = `${Math.round(v * 100)}%`;
      };
    }

    // Bouton mute/unmute (guarded)
    if (this._muteBtn) {
      this._muteBtn.onclick = () => {
        try {
          const current = this.audioNode?.masterGain?.gain?.value ?? (this._mutedVolume || 0);
          if (current > 0) {
            this._mutedVolume = current;
            if (this.audioNode) this.audioNode.masterVolume = 0;
            if (this._volumeRange) this._volumeRange.value = 0;
            if (this._volValue) this._volValue.textContent = '0%';
            this._muteBtn.textContent = 'Unmute';
            this._muteBtn.classList.add('mute-active');
          } else {
            if (this.audioNode) this.audioNode.masterVolume = this._mutedVolume;
            if (this._volumeRange) this._volumeRange.value = this._mutedVolume;
            if (this._volValue) this._volValue.textContent = `${Math.round(this._mutedVolume * 100)}%`;
            this._muteBtn.textContent = 'Mute';
            this._muteBtn.classList.remove('mute-active');
          }
        } catch (err) {
          console.warn('mute toggle failed', err);
        }
      };
    }
  }

  /**
   * Setup du mapping clavier universel
   * Utilise KeyboardEvent.code pour détecter les touches physiques
   * @private
   */
  _setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Ignore si l'utilisateur tape dans un champ de saisie (support Shadow DOM)
      try {
        const path = (e.composedPath && e.composedPath()) || [];
        const isTyping = path.some((node) => {
          if (!node) return false;
          const tag = node.tagName;
          // Allow keyboard shortcuts to work when interacting with non-text inputs
          // (ranges, buttons, selects). Only treat true typing-elements as blocking.
          if (tag === 'TEXTAREA') return true;
          if (node.isContentEditable) return true;
          if (node.getAttribute && node.getAttribute('role') === 'textbox') return true;
          if (tag === 'INPUT') {
            const t = (node.type || '').toLowerCase();
            const textTypes = ['text', 'search', 'email', 'tel', 'url', 'password'];
            return textTypes.includes(t);
          }
          return false;
        });
        if (isTyping) return;
      } catch (err) {
        // Fallback : vérifier activeElement
        const active = document.activeElement;
        if (active) {
          const tag = active.tagName;
          if (tag === 'TEXTAREA' || active.isContentEditable) return;
          if (tag === 'INPUT') {
            const t = (active.type || '').toLowerCase();
            const textTypes = ['text', 'search', 'email', 'tel', 'url', 'password'];
            if (textTypes.includes(t)) return;
          }
        }
      }

      const padIndex = KEY_MAPPING[e.code];
      if (padIndex !== undefined) {
        e.preventDefault(); // Empêcher actions par défaut
        this._selectPad(padIndex);
        this._playPad(padIndex, 0.9);
      }
    });
  }

  /**
   * Sélectionner un pad
   * @param {number} index - Index du pad (0-15)
   * @private
   */
  _selectPad(index) {
    this._selectedPad = index;
    this._grid.querySelectorAll('.pad').forEach((pad) => {
      const isSelected = Number(pad.dataset.index) === index;
      pad.classList.toggle('selected', isSelected);
    });
    this._setStatus(`Pad ${index + 1} sélectionné.`);
    // redraw waveform for selected pad
    this._drawSelectedWaveform(index);
  }

  /**
   * Jouer un pad
   * @param {number} index - Index du pad
   * @param {number} velocity - Vélocité (0-1)
   * @private
   */
  _playPad(index, velocity = 1.0) {
    this.audioNode.playPad(index, velocity);
  }

  /**
   * Charger un fichier audio dans le pad sélectionné
   * @param {File} file - Fichier audio
   * @private
   */
  async _loadFile(file) {
    try {
      this._setStatus(`Chargement de ${file.name}...`);
      
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.plugin.audioContext.decodeAudioData(arrayBuffer);
      
      this.audioNode.loadSample(this._selectedPad, audioBuffer);
      this._markLoaded(this._selectedPad, true);
      this._padFileNames[this._selectedPad] = file.name;
      this._updatePadFilename(this._selectedPad);
      // compute and store a downsampled waveform summary for quick redraw and persistence
      try {
        const summary = this._computeWaveformSummary(audioBuffer, 512);
        this._waveforms[this._selectedPad] = summary;
        this._drawSelectedWaveform(this._selectedPad);
      } catch (e) {
        console.warn('Impossible de calculer waveform summary:', e);
      }
      
      this._setStatus(`✓ Sample chargé sur pad ${this._selectedPad + 1} : ${file.name}`);
      try { this._saveCurrentBank(); } catch (e) { console.warn('save bank after loadFile failed', e); }
    } catch (err) {
      this._setStatus(`✗ Erreur de chargement : ${err.message}`);
      console.error('Erreur chargement sample:', err);
    }
  }

  /**
   * Vider le pad sélectionné
   * @private
   */
  _clearPad() {
    const pad = this.audioNode.pads?.[this._selectedPad];
    if (pad) {
      pad.buffer = null;
      pad.originalBuffer = null;
      pad.activeSources = [];
      this._markLoaded(this._selectedPad, false);
      this._padFileNames[this._selectedPad] = '';
      this._updatePadFilename(this._selectedPad);
      this._setStatus(`✓ Pad ${this._selectedPad + 1} vidé.`);
      try { this._saveCurrentBank(); } catch (e) { console.warn('save bank after clearPad failed', e); }
    }
  }

  /**
   * Vider tous les pads
   */
  _clearAll() {
    for (let i = 0; i < 16; i += 1) {
      const p = this.audioNode.pads?.[i];
      if (p) {
        p.buffer = null;
        p.originalBuffer = null;
        p.activeSources = [];
      }
      this._padFileNames[i] = '';
      this._markLoaded(i, false);
      this._updatePadFilename(i);
    }
    this._setStatus('✓ Tous les pads ont été vidés.');
    try { this._saveCurrentBank(); } catch (e) { console.warn('save bank after clearAll failed', e); }
  }

  /**
   * Marquer visuellement un pad comme chargé/vide
   * @param {number} index - Index du pad
   * @param {boolean} loaded - True si chargé
   * @private
   */
  _markLoaded(index, loaded) {
    const padEl = this._grid.querySelector(`[data-index="${index}"]`);
    if (padEl) padEl.classList.toggle('loaded', loaded);
  }

  /**
   * Collecte les références des samples actuellement chargés
   * @returns {Array} [{padIndex, url, name}]
   * @private
   */
  _collectSampleRefs() {
    const refs = [];
    for (let i = 0; i < 16; i++) {
      const fileName = this._padFileNames[i];
      if (fileName) {
        refs.push({
          padIndex: i,
          url: '', // URL sera remplie lors du futur upload serveur
          name: fileName
        });
      }
    }
    return refs;
  }

  /**
   * Charge les samples depuis leurs URLs (après chargement preset)
   * @param {Array} samples - [{padIndex, url, name}]
   * @private
   */
  async _loadSamplesFromUrls(samples) {
    const base = (this._presetMgr && this._presetMgr.serverUrl) ? this._presetMgr.serverUrl.replace(/\/$/, '') : '';
    for (const sample of samples) {
      if (!sample || !sample.url || sample.padIndex === undefined) continue;
      
      try {
        let url = sample.url;
        if (url.startsWith('/')) {
          // relative path on server -> prefix with server base
          if (!base) {
            console.warn('Preset sample URL is server-relative but PresetManager serverUrl is unknown:', url);
          }
          url = `${base}${url}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.plugin.audioContext.decodeAudioData(arrayBuffer);

        this.audioNode.loadSample(sample.padIndex, audioBuffer);
        this._markLoaded(sample.padIndex, true);
        this._padFileNames[sample.padIndex] = sample.name;
        this._updatePadFilename(sample.padIndex);
        // compute waveform summary for persistence and quick redraw
        try {
          const summary = this._computeWaveformSummary(audioBuffer, 512);
          this._waveforms[sample.padIndex] = summary;
        } catch (e) { console.warn('wave summary failed', e); }
      } catch (e) {
        console.warn(`Échec chargement sample ${sample.name}:`, e);
      }
    }
    try { this._saveCurrentBank(); } catch (e) { /* ignore */ }
  }

  async _populateDeviceList() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter(d => d.kind === 'audioinput');
      if (!this._deviceSelect) return;
      this._deviceSelect.innerHTML = inputs.map(d => `<option value="${d.deviceId}">${(d.label || 'Input')}</option>`).join('');
    } catch (e) {
      console.warn('enumerateDevices failed', e);
    }
  }

  async _startRecording() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('getUserMedia not supported');
      
      // Cacher le panel de résultat précédent
      this._hideRecResult();
      
      const deviceId = this._deviceSelect?.value;
      const constraints = { audio: deviceId ? { deviceId: { exact: deviceId } } : true };
      this._mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // create analyser for live waveform drawing using plugin audio context
      const ctx = this.plugin?.audioContext || new (window.AudioContext || window.webkitAudioContext)();
      this._recSource = ctx.createMediaStreamSource(this._mediaStream);
      this._recAnalyser = ctx.createAnalyser();
      this._recAnalyser.fftSize = 2048;
      this._recSource.connect(this._recAnalyser);

      // start MediaRecorder to collect data
      this._recChunks = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : (MediaRecorder.isTypeSupported('audio/wav') ? 'audio/wav' : 'audio/webm');
      this._mediaRecorder = new MediaRecorder(this._mediaStream, { mimeType: mime });
      this._mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size) this._recChunks.push(e.data); };
      this._mediaRecorder.onstop = async () => {
        this._recBlob = new Blob(this._recChunks, { type: this._recChunks[0]?.type || 'audio/webm' });
        if (this._lastRecBlobUrl) URL.revokeObjectURL(this._lastRecBlobUrl);
        this._lastRecBlobUrl = URL.createObjectURL(this._recBlob);
        this._showRecResult(this._lastRecBlobUrl);
      };
      this._mediaRecorder.start();
      
      // UI updates
      if (this._btnRec) this._btnRec.disabled = true;
      if (this._btnStop) this._btnStop.disabled = false;
      if (this._btnPlayRec) this._btnPlayRec.disabled = true; // Désactiver le bouton play pendant l'enregistrement
      if (this._recStatus) this._recStatus.textContent = '🔴 Enregistrement...';
      
      // Start timer
      this._recStartTime = Date.now();
      this._updateRecTimer();
      this._recTimerInterval = setInterval(() => this._updateRecTimer(), 100);
      
      this._drawRecAnalyser();
      this._setStatus('🎙️ Enregistrement en cours...');
    } catch (e) {
      console.error('startRecording failed', e);
      this._setStatus('✗ Erreur enregistrement: ' + e.message);
      if (this._btnRec) this._btnRec.disabled = false;
      if (this._btnStop) this._btnStop.disabled = true;
      if (this._recStatus) this._recStatus.textContent = 'Erreur';
    }
  }

  _drawRecAnalyser() {
    if (!this._recAnalyser || !this._recCanvas) return;
    const canvas = this._recCanvas;
    const ctx = canvas.getContext('2d');
    const bufferLength = this._recAnalyser.fftSize;
    const data = new Float32Array(bufferLength);
    const draw = () => {
      this._recAnimationId = requestAnimationFrame(draw);
      this._recAnalyser.getFloatTimeDomainData(data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#071021';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#60a5fa';
      ctx.beginPath();
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = data[i] * 0.5 + 0.5;
        const y = v * canvas.height;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
    };
    draw();
  }

  async _stopRecording() {
    try {
      if (this._mediaRecorder && this._mediaRecorder.state !== 'inactive') this._mediaRecorder.stop();
      if (this._recAnimationId) cancelAnimationFrame(this._recAnimationId);
      if (this._recTimerInterval) {
        clearInterval(this._recTimerInterval);
        this._recTimerInterval = null;
      }
      if (this._recSource && this._recAnalyser) {
        try { this._recSource.disconnect(); this._recAnalyser.disconnect(); } catch (e) {}
      }
      if (this._mediaStream) {
        this._mediaStream.getTracks().forEach(t => t.stop());
        this._mediaStream = null;
      }
      
      // UI updates
      if (this._btnRec) this._btnRec.disabled = false;
      if (this._btnStop) this._btnStop.disabled = true;
      if (this._btnPlayRec) this._btnPlayRec.disabled = false; // Activer le bouton play après l'enregistrement
      if (this._recStatus) this._recStatus.textContent = 'Prêt';
      
      this._setStatus('⏹️ Enregistrement arrêté');
    } catch (e) {
      console.warn('stopRecording failed', e);
      if (this._btnRec) this._btnRec.disabled = false;
      if (this._btnStop) this._btnStop.disabled = true;
    }
  }

  async _playRecording() {
    // Jouer uniquement la partie trimée de l'enregistrement
    if (!this._recFullAudioBuffer || !this.plugin?.audioContext) {
      // Fallback: jouer l'audio complet si pas de buffer
      if (this._recAudioPreview && this._recAudioPreview.src) {
        this._recAudioPreview.currentTime = this._recTrimStart * (this._recAudioPreview.duration || 0);
        this._recAudioPreview.play();
        const trimmedDuration = (this._recTrimEnd - this._recTrimStart) * (this._recAudioPreview.duration || 0);
        setTimeout(() => {
          if (this._recAudioPreview) this._recAudioPreview.pause();
        }, trimmedDuration * 1000);
        this._setStatus('▶️ Lecture de la partie trimée...');
        return;
      }
      this._setStatus('✗ Aucun enregistrement à jouer');
      return;
    }

    try {
      // Créer un buffer source pour jouer uniquement la partie trimée
      const ctx = this.plugin.audioContext;
      const buffer = this._recFullAudioBuffer;
      const startTime = this._recTrimStart * buffer.duration;
      const endTime = this._recTrimEnd * buffer.duration;
      const duration = endTime - startTime;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0, startTime, duration);
      
      this._setStatus(`▶️ Lecture trimée: ${Math.round(this._recTrimStart * 100)}% à ${Math.round(this._recTrimEnd * 100)}%`);
    } catch (e) {
      console.warn('playRecording failed', e);
      this._setStatus('✗ Erreur lecture');
    }
  }

  _updateRecTimer() {
    if (!this._recTimer || !this._recStartTime) return;
    const elapsed = (Date.now() - this._recStartTime) / 1000;
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    const tenths = Math.floor((elapsed % 1) * 10);
    this._recTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
  }

  async _showRecResult(blobUrl) {
    if (!this._recResultPanel || !this._recAudioPreview) return;
    
    // Afficher le panel de résultat
    this._recResultPanel.style.display = 'block';
    
    // Configurer l'audio preview
    this._recAudioPreview.src = blobUrl;
    
    // Réinitialiser les trim bars
    this._recTrimStart = 0;
    this._recTrimEnd = 1;
    
    // Décoder l'audio pour afficher la waveform avec trim bars ET pour le playback trimé
    try {
      const resp = await fetch(blobUrl);
      const arrayBuffer = await resp.arrayBuffer();
      const audioBuffer = await this.plugin.audioContext.decodeAudioData(arrayBuffer);
      this._recWaveformData = this._computeWaveformSummary(audioBuffer, 512);
      this._recFullAudioBuffer = audioBuffer; // Stocker pour le playback
      this._drawRecWaveformWithTrims();
    } catch (e) {
      console.warn('Failed to decode recording for waveform', e);
    }
    
    // Scroll vers le résultat
    this._recResultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    this._setStatus('✓ Enregistrement terminé - Glissez les barres bleues pour ajuster le trim');
  }

  _drawRecWaveformWithTrims() {
    if (!this._recCanvas || !this._recWaveformData) return;
    
    const canvas = this._recCanvas;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    // Fond
    ctx.fillStyle = '#071021';
    ctx.fillRect(0, 0, w, h);
    
    // Dessiner la waveform complète en gris
    const summary = this._recWaveformData;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const sy = h / 2;
    for (let i = 0; i < summary.length; i++) {
      const x = (i / summary.length) * w;
      const y = sy - (summary[i] * (h / 2));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Dessiner la partie sélectionnée (entre les trim bars) en bleu
    const startX = this._recTrimStart * w;
    const endX = this._recTrimEnd * w;
    const startIdx = Math.floor(summary.length * this._recTrimStart);
    const endIdx = Math.ceil(summary.length * this._recTrimEnd);
    const segment = summary.slice(startIdx, endIdx);
    
    if (segment.length > 0) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < segment.length; i++) {
        const x = startX + (i / segment.length) * (endX - startX);
        const y = sy - (segment[i] * (h / 2));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Remplir la zone sélectionnée
      ctx.fillStyle = 'rgba(96,165,250,0.1)';
      ctx.fillRect(startX, 0, endX - startX, h);
    }
    
    // Dessiner les trim bars
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    
    // Barre de gauche (start)
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, h);
    ctx.stroke();
    
    // Barre de droite (end)
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, h);
    ctx.stroke();
    
    // Afficher les pourcentages
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px monospace';
    ctx.fillText(`${Math.round(this._recTrimStart * 100)}%`, startX + 4, 14);
    ctx.fillText(`${Math.round(this._recTrimEnd * 100)}%`, endX - 30, 14);
  }
  
  _onRecCanvasMouseDown(e) {
    if (!this._recWaveformData || !this._recCanvas) return;
    
    const rect = this._recCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;
    const relX = x / w;
    
    const startX = this._recTrimStart;
    const endX = this._recTrimEnd;
    const threshold = 10 / w; // 10px de tolérance
    
    if (Math.abs(relX - startX) < threshold) {
      this._recTrimDragging = 'start';
    } else if (Math.abs(relX - endX) < threshold) {
      this._recTrimDragging = 'end';
    }
  }
  
  _onRecCanvasMouseMove(e) {
    if (!this._recTrimDragging || !this._recCanvas) return;
    
    const rect = this._recCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;
    const relX = Math.max(0, Math.min(1, x / w));
    
    if (this._recTrimDragging === 'start') {
      this._recTrimStart = Math.min(relX, this._recTrimEnd - 0.01);
    } else if (this._recTrimDragging === 'end') {
      this._recTrimEnd = Math.max(relX, this._recTrimStart + 0.01);
    }
    
    this._drawRecWaveformWithTrims();
  }
  
  _onRecCanvasMouseUp() {
    this._recTrimDragging = null;
  }

  _hideRecResult() {
    if (this._recResultPanel) {
      this._recResultPanel.style.display = 'none';
    }
    if (this._recAudioPreview) {
      this._recAudioPreview.src = '';
    }
    if (this._recTimer) {
      this._recTimer.textContent = '00:00.0';
    }
    // Nettoyer la waveform
    this._recWaveformData = null;
    this._recTrimStart = 0;
    this._recTrimEnd = 1;
  }

  _findNextEmptyPad() {
    // Chercher le premier pad vide (sans buffer chargé)
    for (let i = 0; i < 16; i++) {
      if (!this.audioNode || !this.audioNode.pads || !this.audioNode.pads[i]) continue;
      if (!this.audioNode.pads[i].buffer) {
        return i;
      }
    }
    return -1; // Aucun pad vide
  }

  _createRecPreviewElement(blobUrl) {
    // Méthode obsolète - remplacée par _showRecResult
    // Conservée pour compatibilité
    this._showRecResult(blobUrl);
  }

  async _loadBlobUrlToPad(blobUrl, padIndex = 0) {
    try {
      const resp = await fetch(blobUrl);
      const arrayBuffer = await resp.arrayBuffer();
      const audioBuffer = await this.plugin.audioContext.decodeAudioData(arrayBuffer);
      this.audioNode.loadSample(padIndex, audioBuffer);
      this._markLoaded(padIndex, true);
      this._padFileNames[padIndex] = 'recording';
      this._updatePadFilename(padIndex);
      this._waveforms[padIndex] = this._computeWaveformSummary(audioBuffer, 512);
      this._drawSelectedWaveform(this._selectedPad);
      try { this._saveCurrentBank(); } catch (e) { /* ignore */ }
    } catch (e) {
      console.warn('loadBlobUrlToPad failed', e);
    }
  }

  async _assignRecordingToSelectedPad() {
    if (!this._recFullAudioBuffer) {
      this._setStatus('✗ Aucun enregistrement disponible');
      return;
    }
    
    const padIndex = this._selectedPad;
    try {
      // Créer un buffer coupé avec uniquement la partie trimée
      const originalBuffer = this._recFullAudioBuffer;
      const trimStart = this._recTrimStart;
      const trimEnd = this._recTrimEnd;
      
      const startSample = Math.floor(originalBuffer.length * trimStart);
      const endSample = Math.ceil(originalBuffer.length * trimEnd);
      const newLength = endSample - startSample;
      
      if (newLength <= 0) {
        this._setStatus('✗ Sélection invalide');
        return;
      }
      
      // Créer un nouveau buffer avec uniquement la partie sélectionnée
      const ctx = this.plugin.audioContext;
      const trimmedBuffer = ctx.createBuffer(
        originalBuffer.numberOfChannels,
        newLength,
        originalBuffer.sampleRate
      );
      
      // Copier les données
      for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
        const originalData = originalBuffer.getChannelData(channel);
        const trimmedData = trimmedBuffer.getChannelData(channel);
        for (let i = 0; i < newLength; i++) {
          trimmedData[i] = originalData[startSample + i];
        }
      }
      
      // Charger le buffer coupé dans le pad
      this.audioNode.loadSample(padIndex, trimmedBuffer);
      this._markLoaded(padIndex, true);
      this._padFileNames[padIndex] = 'recording-trimmed';
      this._updatePadFilename(padIndex);
      this._waveforms[padIndex] = this._computeWaveformSummary(trimmedBuffer, 512);
      this._drawSelectedWaveform(padIndex);
      
      // Réinitialiser les trim bars à 0-100% puisque le buffer est déjà coupé
      if (this._trimLeft) this._trimLeft.value = 0;
      if (this._trimRight) this._trimRight.value = 1;
      if (this._trimLeftVal) this._trimLeftVal.textContent = '0%';
      if (this._trimRightVal) this._trimRightVal.textContent = '100%';
      
      if (this.audioNode && typeof this.audioNode.setPadTrimStart === 'function') {
        this.audioNode.setPadTrimStart(padIndex, 0);
        this.audioNode.setPadTrimEnd(padIndex, 1);
      } else if (this.audioNode && this.audioNode.pads && this.audioNode.pads[padIndex]) {
        this.audioNode.pads[padIndex].trimStart = 0;
        this.audioNode.pads[padIndex].trimEnd = 1;
      }
      
      // Cacher le panel de résultat
      this._hideRecResult();
      
      try { this._saveCurrentBank(); } catch (e) { /* ignore */ }
      
      this._setStatus(`✂️ Enregistrement coupé (${Math.round(trimStart * 100)}%-${Math.round(trimEnd * 100)}%) assigné au pad ${padIndex + 1}`);
    } catch (e) {
      console.error('assignRecordingToSelectedPad failed', e);
      this._setStatus(`✗ Erreur assignation: ${e.message}`);
    }
  }

  /* ----- Create panel helpers ----- */
  async _loadFileIntoCreate(file) {
    try {
      this._setStatus(`Chargement (create): ${file.name}...`);
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.plugin.audioContext.decodeAudioData(arrayBuffer);
      this._loadBufferIntoCreate(audioBuffer, file.name);
    } catch (e) {
      console.warn('loadFileIntoCreate failed', e);
      this._setStatus('✗ Échec import pour Create');
    }
  }

  _loadBufferIntoCreate(audioBuffer, name = '') {
    this._createBuffer = audioBuffer;
    this._createName = name || '';
    try {
      const summary = this._computeWaveformSummary(audioBuffer, 512);
      // show summary on the waveform canvas by temporarily assigning to selected pad
      this._waveforms[this._selectedPad] = summary;
      this._drawSelectedWaveform(this._selectedPad);
      // reset trimbars for create preview
      if (this._trimLeft) this._trimLeft.value = 0;
      if (this._trimRight) this._trimRight.value = 1;
      this._setStatus(`✓ Importé dans Create: ${this._createName}`);
    } catch (e) {
      console.warn('loadBufferIntoCreate draw failed', e);
    }
  }

  async _downloadRecording() {
    if (!this._recBlob) { this._setStatus('Aucun enregistrement à télécharger'); return; }
    try {
      // Try to decode recorded blob and export as WAV for maximum compatibility
      try {
        const arrayBuffer = await this._recBlob.arrayBuffer();
        const audioCtx = this.plugin?.audioContext || new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const wavBuffer = this._encodeWav(audioBuffer);
        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
        const filename = `${(this._createName || 'recording')}.wav`;
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this._setStatus(`✓ Enregistrement téléchargé: ${filename}`);
        return;
      } catch (convErr) {
        console.warn('WAV conversion failed, falling back to raw blob download', convErr);
        // fallback to raw blob download below
      }

      const ext = (this._recBlob.type && this._recBlob.type.split('/')[1]) || 'webm';
      const filename = `${(this._createName || 'recording')}.${ext.replace(/[^a-z0-9\.\-_]/gi, '')}`;
      const urlRaw = URL.createObjectURL(this._recBlob);
      const aRaw = document.createElement('a');
      aRaw.href = urlRaw;
      aRaw.download = filename;
      document.body.appendChild(aRaw);
      aRaw.click();
      aRaw.remove();
      URL.revokeObjectURL(urlRaw);
      this._setStatus(`✓ Enregistrement téléchargé: ${filename}`);
    } catch (e) {
      console.warn('downloadRecording failed', e);
      this._setStatus('✗ Échec téléchargement');
    }
  }

  _encodeWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitsPerSample = 16;

    const samples = audioBuffer.length * numChannels;
    const blockAlign = numChannels * bitsPerSample / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples * bitsPerSample / 8;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    let offset = 0;

    function writeString(s) {
      for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i));
    }

    writeString('RIFF');
    view.setUint32(offset, 36 + dataSize, true); offset += 4; // file size - 8
    writeString('WAVE');
    writeString('fmt ');
    view.setUint32(offset, 16, true); offset += 4; // subchunk1 size
    view.setUint16(offset, format, true); offset += 2; // audio format (PCM)
    view.setUint16(offset, numChannels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, byteRate, true); offset += 4;
    view.setUint16(offset, blockAlign, true); offset += 2;
    view.setUint16(offset, bitsPerSample, true); offset += 2;
    writeString('data');
    view.setUint32(offset, dataSize, true); offset += 4;

    // Write interleaved PCM16 samples
    const channelData = [];
    for (let ch = 0; ch < numChannels; ch++) channelData.push(audioBuffer.getChannelData(ch));
    let sampleIndex = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = channelData[ch][i];
        // clamp
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
        sampleIndex++;
      }
    }
    return buffer;
  }

  async _loadRecordingIntoCreate() {
    if (!this._recBlob) { this._setStatus('Aucun enregistrement'); return; }
    try {
      const arrayBuffer = await this._recBlob.arrayBuffer();
      const audioBuffer = await this.plugin.audioContext.decodeAudioData(arrayBuffer);
      this._loadBufferIntoCreate(audioBuffer, 'recording');
    } catch (e) {
      console.warn('loadRecordingIntoCreate failed', e);
      this._setStatus('✗ Échec chargement enregistrement dans Create');
    }
  }

  async _createSlicesFromCreateBuffer() {
    if (!this._createBuffer) { this._setStatus('Aucun sample dans Create'); return; }
    try {
      const slices = this._detectSilences(this._createBuffer, {threshold: 0.005, minSliceSec: 0.06});
      if (!slices || slices.length === 0) { this._setStatus('Aucun slice détecté'); return; }
      const maxPads = 16;
      let count = 0;
      for (let i = 0; i < slices.length && count < maxPads; i++) {
        const s = slices[i];
        const buf = this._sliceBuffer(this._createBuffer, s.start, s.end);
        const padIndex = count;
        this.audioNode.loadSample(padIndex, buf);
        this._markLoaded(padIndex, true);
        this._padFileNames[padIndex] = `${this._createName || 'slice'}_${count+1}`;
        this._waveforms[padIndex] = this._computeWaveformSummary(buf, 512);
        // set pad trim metadata relative to the slice
        try {
          const totalSec = this._createBuffer.duration;
          const trimStart = s.start / totalSec;
          const trimEnd = s.end / totalSec;
          if (typeof this.audioNode.setPadTrimStart === 'function') {
            this.audioNode.setPadTrimStart(padIndex, trimStart);
            this.audioNode.setPadTrimEnd(padIndex, trimEnd);
          } else if (this.audioNode.pads && this.audioNode.pads[padIndex]) {
            this.audioNode.pads[padIndex].trimStart = trimStart;
            this.audioNode.pads[padIndex].trimEnd = trimEnd;
          }
        } catch (e) { console.warn('apply slice trims failed', e); }
        count++;
      }
      // update UI and save bank
      this._buildGrid();
      this._setStatus(`✓ Slicer créé: ${count} slices chargés`);
      try { this._saveCurrentBank(); } catch (e) { console.warn('save bank after slicer failed', e); }
    } catch (e) {
      console.warn('createSlices failed', e);
      this._setStatus('✗ Erreur during slicing');
    }
  }

  _detectSilences(audioBuffer, opts = {}) {
    const threshold = opts.threshold ?? 0.005;
    const minSliceSec = opts.minSliceSec ?? 0.05;
    const frameSize = 1024;
    const hop = 512;
    const data = audioBuffer.getChannelData(0);
    const sr = audioBuffer.sampleRate;
    const frames = [];
    for (let i = 0; i < data.length; i += hop) {
      let sum = 0;
      const end = Math.min(i + frameSize, data.length);
      for (let j = i; j < end; j++) sum += data[j] * data[j];
      const rms = Math.sqrt(sum / (end - i));
      frames.push(rms);
    }
    // detect regions where rms > threshold
    const segments = [];
    let inSound = false;
    let segStartFrame = 0;
    for (let i = 0; i < frames.length; i++) {
      if (!inSound && frames[i] > threshold) { inSound = true; segStartFrame = i; }
      if (inSound && frames[i] <= threshold) { // possible end
        const segEndFrame = i;
        const startSample = Math.max(0, segStartFrame * hop - frameSize);
        const endSample = Math.min(data.length, segEndFrame * hop + frameSize);
        const dur = (endSample - startSample) / sr;
        if (dur >= minSliceSec) segments.push({ start: startSample / sr, end: endSample / sr });
        inSound = false;
      }
    }
    // if ended while inSound
    if (inSound) {
      const startSample = Math.max(0, segStartFrame * hop - frameSize);
      const endSample = data.length;
      const dur = (endSample - startSample) / sr;
      if (dur >= minSliceSec) segments.push({ start: startSample / sr, end: endSample / sr });
    }
    return segments;
  }

  _sliceBuffer(buffer, startSec, endSec) {
    const sr = buffer.sampleRate;
    const startSample = Math.max(0, Math.floor(startSec * sr));
    const endSample = Math.min(buffer.length, Math.floor(endSec * sr));
    const len = Math.max(0, endSample - startSample);
    const out = this.plugin.audioContext.createBuffer(buffer.numberOfChannels, len, sr);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = out.getChannelData(ch);
      for (let i = 0; i < len; i++) dst[i] = src[startSample + i];
    }
    return out;
  }

  async _createInstrumentFromCreateBuffer() {
    if (!this._createBuffer) { this._setStatus('Aucun sample dans Create'); return; }
    try {
      const scale = this._instrumentScale?.value || 'chromatic';
      const root = Number(this._instrumentRoot?.value || 60);
      const offsets = this._getScaleOffsets(scale, 16);
      const maxPads = 16;
      for (let i = 0; i < Math.min(offsets.length, maxPads); i++) {
        const semitone = offsets[i];
        const rate = Math.pow(2, semitone / 12);
        const pitched = await this._renderPitchBuffer(this._createBuffer, rate);
        this.audioNode.loadSample(i, pitched);
        this._markLoaded(i, true);
        this._padFileNames[i] = `${this._createName || 'inst'}_${i+1}`;
        this._waveforms[i] = this._computeWaveformSummary(pitched, 512);
      }
      this._buildGrid();
      this._setStatus('✓ Instrument créé (16 notes)');
      try { this._saveCurrentBank(); } catch (e) { console.warn('save bank after instrument failed', e); }
    } catch (e) {
      console.warn('createInstrument failed', e);
      this._setStatus('✗ Erreur création instrument');
    }
  }

  _getScaleOffsets(scale, count = 16) {
    // Returns an array of semitone offsets (relative) for count notes
    let pattern = [];
    if (scale === 'chromatic') {
      pattern = [0,1,2,3,4,5,6,7,8,9,10,11];
    } else if (scale === 'whole') {
      pattern = [0,2,4,6,8,10];
    } else if (scale === 'major') {
      pattern = [0,2,4,5,7,9,11];
    } else if (scale === 'minor') {
      pattern = [0,2,3,5,7,8,10];
    } else {
      pattern = [0,1,2,3,4,5,6,7,8,9,10,11];
    }
    const offsets = [];
    let octave = 0;
    while (offsets.length < count) {
      for (let i = 0; i < pattern.length && offsets.length < count; i++) {
        offsets.push(pattern[i] + octave * 12);
      }
      octave += 1;
    }
    return offsets.slice(0, count);
  }

  async _renderPitchBuffer(buffer, rate) {
    try {
      const sr = this.plugin.audioContext.sampleRate || buffer.sampleRate;
      const outLength = Math.max(1, Math.ceil(buffer.length / rate));
      const offline = new OfflineAudioContext(buffer.numberOfChannels, outLength, sr);
      const src = offline.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = rate;
      src.connect(offline.destination);
      src.start(0);
      const rendered = await offline.startRendering();
      return rendered;
    } catch (e) {
      console.warn('renderPitchBuffer failed', e);
      return buffer;
    }
  }

  /* ----- Effects panel handlers ----- */
  _onFxVolumeChange(value) {
    const v = Number(value);
    if (this.shadowRoot.getElementById('fx-volume-val')) {
      this.shadowRoot.getElementById('fx-volume-val').textContent = `${Math.round(v * 100)}%`;
    }
    // Apply to audio node if available
    if (this.audioNode && typeof this.audioNode.setMasterVolume === 'function') {
      this.audioNode.setMasterVolume(v);
    } else if (this.audioNode && this.audioNode.masterGain) {
      this.audioNode.masterGain.gain.value = v;
    }
  }

  _onFxPanChange(value) {
    const v = Number(value);
    if (this.shadowRoot.getElementById('fx-pan-val')) {
      this.shadowRoot.getElementById('fx-pan-val').textContent = v.toFixed(2);
    }
    // Apply to audio node panner if available
    if (this.audioNode && this.audioNode.panNode && this.audioNode.panNode.pan) {
      this.audioNode.panNode.pan.value = v;
    }
  }

  _onFxToneChange(value) {
    const v = Number(value);
    if (this.shadowRoot.getElementById('fx-tone-val')) {
      this.shadowRoot.getElementById('fx-tone-val').textContent = v.toFixed(2);
    }
    // Apply tone (low/high shelf filters)
    if (this.audioNode && this.audioNode.lowShelfNode && this.audioNode.highShelfNode) {
      if (v < 0) {
        this.audioNode.highShelfNode.gain.value = Math.abs(v) * 30;
        this.audioNode.lowShelfNode.gain.value = 0;
      } else if (v > 0) {
        this.audioNode.lowShelfNode.gain.value = -v * 30;
        this.audioNode.highShelfNode.gain.value = 0;
      } else {
        this.audioNode.lowShelfNode.gain.value = 0;
        this.audioNode.highShelfNode.gain.value = 0;
      }
    }
  }

  _onFxPitchChange(value) {
    const v = Number(value);
    if (this.shadowRoot.getElementById('fx-pitch-val')) {
      this.shadowRoot.getElementById('fx-pitch-val').textContent = v;
    }
    // Store pitch for playback (would need to be applied per-pad on play)
    if (this.audioNode) {
      this.audioNode.pitchShift = v;
    }
  }

  _onFxReverseClick() {
    this._fxReversed = !this._fxReversed;
    if (this._fxReverse) {
      if (this._fxReversed) {
        this._fxReverse.classList.add('active');
      } else {
        this._fxReverse.classList.remove('active');
      }
    }
    // Reverse current selected pad buffer
    const padIndex = this._selectedPad;
    if (this.audioNode && this.audioNode.pads && this.audioNode.pads[padIndex]) {
      const pad = this.audioNode.pads[padIndex];
      if (pad.buffer) {
        const reversed = this._reverseBuffer(pad.buffer);
        pad.buffer = reversed;
        pad.originalBuffer = reversed;
        this._waveforms[padIndex] = this._computeWaveformSummary(reversed, 512);
        this._drawSelectedWaveform(padIndex);
        this._setStatus(`Pad ${padIndex + 1} reversed`);
      }
    }
  }

  _reverseBuffer(buffer) {
    const ctx = this.plugin.audioContext;
    const reversed = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = reversed.getChannelData(ch);
      for (let i = 0; i < buffer.length; i++) {
        dst[i] = src[buffer.length - 1 - i];
      }
    }
    return reversed;
  }

  _onFxAdsrEnableClick() {
    this._fxAdsrEnabled = !this._fxAdsrEnabled;
    if (this._adsrSection) {
      this._adsrSection.style.display = this._fxAdsrEnabled ? 'grid' : 'none';
    }
    if (this._fxAdsrEnable) {
      if (this._fxAdsrEnabled) {
        this._fxAdsrEnable.classList.add('active');
        this._fxAdsrEnable.textContent = 'Disable ADSR';
      } else {
        this._fxAdsrEnable.classList.remove('active');
        this._fxAdsrEnable.textContent = 'Enable ADSR';
      }
    }
    // Enable/disable ADSR on audio node
    if (this.audioNode) {
      this.audioNode.adsrEnabled = this._fxAdsrEnabled;
    }
  }

  _onFxAttackChange(value) {
    const v = Number(value);
    if (this.shadowRoot.getElementById('fx-attack-val')) {
      this.shadowRoot.getElementById('fx-attack-val').textContent = v.toFixed(2);
    }
    if (this.audioNode && this.audioNode.adsrAttack !== undefined) {
      this.audioNode.adsrAttack = v;
    }
  }

  _onFxDecayChange(value) {
    const v = Number(value);
    if (this.shadowRoot.getElementById('fx-decay-val')) {
      this.shadowRoot.getElementById('fx-decay-val').textContent = v.toFixed(2);
    }
    if (this.audioNode && this.audioNode.adsrDecay !== undefined) {
      this.audioNode.adsrDecay = v;
    }
  }

  _onFxSustainChange(value) {
    const v = Number(value);
    if (this.shadowRoot.getElementById('fx-sustain-val')) {
      this.shadowRoot.getElementById('fx-sustain-val').textContent = v.toFixed(2);
    }
    if (this.audioNode && this.audioNode.adsrSustain !== undefined) {
      this.audioNode.adsrSustain = v;
    }
  }

  _onFxReleaseChange(value) {
    const v = Number(value);
    if (this.shadowRoot.getElementById('fx-release-val')) {
      this.shadowRoot.getElementById('fx-release-val').textContent = v.toFixed(2);
    }
    if (this.audioNode && this.audioNode.adsrRelease !== undefined) {
      this.audioNode.adsrRelease = v;
    }
  }

  _onTrimChange() {
    const left = Number(this._trimLeft?.value || 0);
    const right = Number(this._trimRight?.value || 1);
    if (this._trimLeftVal) this._trimLeftVal.textContent = left.toFixed(3);
    if (this._trimRightVal) this._trimRightVal.textContent = right.toFixed(3);
    // Apply trims to the currently selected pad in the audio node
    try {
      if (this.audioNode) {
        // ensure trims apply to audioNode for the selected pad and persist to pad metadata
        for (let i = 0; i < 16; i++) {
          if (i !== this._selectedPad) continue;
          try {
            if (typeof this.audioNode.setPadTrimStart === 'function') {
              this.audioNode.setPadTrimStart(i, (i === this._selectedPad) ? left : (this.audioNode.pads?.[i]?.trimStart ?? 0));
              this.audioNode.setPadTrimEnd(i, (i === this._selectedPad) ? right : (this.audioNode.pads?.[i]?.trimEnd ?? 1));
            } else if (this.audioNode.pads && this.audioNode.pads[i]) {
              this.audioNode.pads[i].trimStart = (i === this._selectedPad) ? left : (this.audioNode.pads[i].trimStart ?? 0);
              this.audioNode.pads[i].trimEnd = (i === this._selectedPad) ? right : (this.audioNode.pads[i].trimEnd ?? 1);
            }
          } catch (e) { console.warn('apply trim per-pad failed', e); }
        }
      }
    } catch (e) {
      console.warn('Unable to apply trims to audioNode:', e);
    }
    this._drawSelectedWaveform(this._selectedPad);
    try { this._saveCurrentBank(); } catch (e) { /* ignore */ }
  }

  _computeWaveformSummary(audioBuffer, length = 512) {
    if (!audioBuffer || !audioBuffer.getChannelData) return null;
    const channelData = audioBuffer.getChannelData(0);
    if (!channelData) return null;
    const out = new Float32Array(length);
    const step = Math.max(1, Math.floor(channelData.length / length));
    for (let i = 0; i < length; i++) {
      let max = 0;
      const start = i * step;
      const end = Math.min(channelData.length, start + step);
      for (let j = start; j < end; j++) {
        const v = Math.abs(channelData[j]);
        if (v > max) max = v;
      }
      out[i] = max;
    }
    return out;
  }

  _clearWaveCanvas() {
    if (!this._waveCtx || !this._waveCanvas) return;
    this._waveCtx.clearRect(0, 0, this._waveCanvas.width, this._waveCanvas.height);
    this._waveCtx.fillStyle = '#071029';
    this._waveCtx.fillRect(0, 0, this._waveCanvas.width, this._waveCanvas.height);
  }

  _drawSelectedWaveform(padIndex) {
    if (!this._waveCtx || !this._waveCanvas) return;
    const summary = (typeof padIndex === 'number' && this._waveforms[padIndex]) ? this._waveforms[padIndex] : null;
    this._clearWaveCanvas();
    const ctx = this._waveCtx;
    const w = this._waveCanvas.width;
    const h = this._waveCanvas.height;
    
    if (!summary) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      return;
    }

    const left = Number(this._trimLeft?.value || 0);
    const right = Number(this._trimRight?.value || 1);
    const sy = h / 2;
    
    // Dessiner la waveform complète en gris
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < summary.length; i++) {
      const x = (i / summary.length) * w;
      const y = sy - (summary[i] * (h / 2));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Dessiner la partie sélectionnée en bleu
    const startIdx = Math.floor(summary.length * left);
    const endIdx = Math.max(startIdx + 1, Math.floor(summary.length * right));
    const segment = summary.slice(startIdx, endIdx);
    const startX = left * w;
    const endX = right * w;
    
    if (segment.length > 0) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < segment.length; i++) {
        const x = startX + (i / segment.length) * (endX - startX);
        const y = sy - (segment[i] * (h / 2));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Remplir la zone sélectionnée
      ctx.fillStyle = 'rgba(96,165,250,0.1)';
      ctx.fillRect(startX, 0, endX - startX, h);
    }
    
    // Dessiner les trim bars
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    
    // Barre de gauche
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, h);
    ctx.stroke();
    
    // Barre de droite
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, h);
    ctx.stroke();
    
    // Afficher les pourcentages
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px monospace';
    ctx.fillText(`${Math.round(left * 100)}%`, startX + 4, 14);
    ctx.fillText(`${Math.round(right * 100)}%`, endX - 30, 14);
  }

  _switchZone(zone) {
    this._currentZone = zone;
    const zones = this.shadowRoot.querySelectorAll('.zone');
    zones.forEach(z => z.style.display = (z.id === `zone-${zone}`) ? 'block' : 'none');
    this._setStatus(`Zone: ${zone}`);
  }

  _makeEmptyBank() {
    return {
      buffers: new Array(16).fill(null), // AudioBuffer refs
      pads: new Array(16).fill(null), // per-pad metadata (trimStart/trimEnd)
      waveforms: new Array(16).fill(null),
      padFileNames: new Array(16).fill(''),
      master: { volume: 1.0, muted: false }
    };
  }

  _saveCurrentBank() {
    try {
      const bank = this._banks[this._currentBank];
      if (!bank) return;
      // store buffers and meta from audioNode
      for (let i = 0; i < 16; i++) {
        const padObj = this.audioNode?.pads?.[i];
        bank.buffers[i] = padObj?.originalBuffer || padObj?.buffer || null;
        bank.pads[i] = {
          trimStart: padObj?.trimStart ?? 0,
          trimEnd: padObj?.trimEnd ?? 1
        };
        bank.waveforms[i] = this._waveforms[i] ? this._waveforms[i].slice(0) : null;
        bank.padFileNames[i] = this._padFileNames[i] || '';
      }
      bank.master = { volume: Number(this._volumeRange?.value || 1), muted: !!this._muteBtn?.classList.contains('mute-active') };
    } catch (e) { console.warn('save bank failed', e); }
  }

  _restoreBank(bankId) {
    try {
      const bank = this._banks[bankId];
      if (!bank) return;
      // restore buffers into audioNode
      for (let i = 0; i < 16; i++) {
        const buf = bank.buffers[i];
        if (buf && typeof this.audioNode?.loadSample === 'function') {
          this.audioNode.loadSample(i, buf);
          this._markLoaded(i, true);
        } else {
          // clear pad buffer
          const p = this.audioNode?.pads?.[i];
          if (p) { p.buffer = null; p.originalBuffer = null; p.activeSources = []; }
          this._markLoaded(i, false);
        }
        this._waveforms[i] = bank.waveforms[i] ? Float32Array.from(bank.waveforms[i]) : null;
        this._padFileNames[i] = bank.padFileNames[i] || '';
      }
      // apply trims stored in bank to audio node
      if (bank.pads && this.audioNode) {
        for (let i = 0; i < 16; i++) {
          const meta = bank.pads[i];
          if (!meta) continue;
          try {
            if (typeof this.audioNode.setPadTrimStart === 'function') {
              this.audioNode.setPadTrimStart(i, meta.trimStart ?? 0);
              this.audioNode.setPadTrimEnd(i, meta.trimEnd ?? 1);
            } else if (this.audioNode.pads && this.audioNode.pads[i]) {
              this.audioNode.pads[i].trimStart = meta.trimStart ?? 0;
              this.audioNode.pads[i].trimEnd = meta.trimEnd ?? 1;
            }
          } catch (e) { console.warn('apply pad trim during restore failed', e); }
        }
      }
      // apply per-pad trims for current selected pad
      const selPadMeta = bank.pads[this._selectedPad];
      if (selPadMeta) {
        if (this._trimLeft) this._trimLeft.value = selPadMeta.trimStart ?? 0;
        if (this._trimRight) this._trimRight.value = selPadMeta.trimEnd ?? 1;
      }
      // master
      if (bank.master) {
        if (this._volumeRange) this._volumeRange.value = bank.master.volume ?? 1;
        if (this._volValue) this._volValue.textContent = `${Math.round((bank.master.volume ?? 1) * 100)}%`;
        if (bank.master.muted) this._muteBtn?.classList.add('mute-active'); else this._muteBtn?.classList.remove('mute-active');
      }
      // rebuild grid to update names and loaded classes
      this._buildGrid();
      this._drawSelectedWaveform(this._selectedPad);
    } catch (e) { console.warn('restore bank failed', e); }
  }

  _switchBank(bank) {
    // Save current bank state, then switch and restore target bank
    try {
      if (this._currentBank && this._currentBank !== bank) this._saveCurrentBank();
    } catch (e) { console.warn('error saving current bank', e); }

    this._currentBank = bank;
    this.shadowRoot.querySelectorAll('.bank-btn').forEach(b => b.classList.toggle('active', b.dataset.bank === bank));

    // restore bank into UI/audio
    try { this._restoreBank(bank); } catch (e) { console.warn('error restoring bank', e); }

    this._setStatus(`Bank: ${bank}`);
  }

  _updatePadFilename(index) {
    const padEl = this._grid.querySelector(`[data-index="${index}"]`);
    if (!padEl) return;
    const hints = padEl.querySelectorAll('.pad-key');
    const fileHint = hints[1];
    if (fileHint) fileHint.textContent = (this._padFileNames[index] || '').slice(0, 12);
  }

  async _refreshPresetSelect() {
    const select = this.shadowRoot.getElementById('preset-select');
    if (!select || !this._presetMgr) return;
    
    try {
      const { factory, user } = await this._presetMgr.listPresetsByCategory();
      
      let html = '<option value="">-- Select Preset --</option>';
      
      // Factory presets group
      if (factory.length > 0) {
        html += '<optgroup label="🏭 Factory Presets">';
        factory.forEach(name => {
          // Afficher le nom sans le préfixe [Factory]
          const displayName = name.replace(/^\[Factory\]\s*/, '');
          html += `<option value="${name}">${displayName}</option>`;
        });
        html += '</optgroup>';
      }
      
      // User presets group
      if (user.length > 0) {
        html += '<optgroup label="👤 User Presets">';
        user.forEach(name => {
          html += `<option value="${name}">${name}</option>`;
        });
        html += '</optgroup>';
      }
      
      select.innerHTML = html;
    } catch (e) {
      console.warn('Error refreshing preset list:', e);
      this._setStatus('⚠️ Erreur chargement presets');
    }
  }

  /**
   * Initialiser les presets factory par défaut
   * Appelée une seule fois au premier chargement
   * @private
   */
  async _initializeFactoryPresets() {
    if (!this._presetMgr) return;
    
    // Vérifier si les presets factory existent déjà
    try {
      const existing = await this._presetMgr.listPresets();
      const hasFactory = existing.some(name => name.startsWith('[Factory]'));
      if (hasFactory) return; // Déjà initialisés
    } catch (e) {
      console.warn('Could not check existing factory presets:', e);
    }

    // Créer les presets factory par défaut
    const factoryPresets = [
      {
        name: 'Empty',
        state: {
          masterVolume: 1.0,
          pads: Array(16).fill(null).map(() => ({
            volume: 1.0,
            pan: 0,
            pitch: 0,
            tone: 0,
            trimStart: 0,
            trimEnd: 1,
            reverse: false
          }))
        },
        samples: []
      },
      {
        name: 'Drums Kit',
        state: {
          masterVolume: 0.8,
          pads: [
            { volume: 1.0, pan: 0, pitch: 0, tone: 0.2, trimStart: 0, trimEnd: 1, reverse: false },  // Kick
            { volume: 0.9, pan: 0, pitch: 0, tone: 0.3, trimStart: 0, trimEnd: 1, reverse: false },  // Snare
            { volume: 0.7, pan: -0.3, pitch: 2, tone: 0.5, trimStart: 0, trimEnd: 1, reverse: false }, // Hi-hat
            { volume: 0.7, pan: 0.3, pitch: 2, tone: 0.5, trimStart: 0, trimEnd: 1, reverse: false },  // Hi-hat open
            ...Array(12).fill(null).map(() => ({ volume: 1.0, pan: 0, pitch: 0, tone: 0, trimStart: 0, trimEnd: 1, reverse: false }))
          ]
        },
        samples: []
      },
      {
        name: 'Bass Heavy',
        state: {
          masterVolume: 0.9,
          pads: Array(16).fill(null).map((_, i) => ({
            volume: 1.0,
            pan: (i % 4 - 1.5) / 2, // Spread pan
            pitch: -12 + (i % 4) * 2, // Descending pitch
            tone: -0.5, // Bas de spectre
            trimStart: 0,
            trimEnd: 1,
            reverse: false
          }))
        },
        samples: []
      }
    ];

    // Sauvegarder chaque preset factory
    for (const preset of factoryPresets) {
      try {
        await this._presetMgr.saveFactoryPreset(preset.name, preset.state, preset.samples);
        console.log(`✓ Factory preset created: ${preset.name}`);
      } catch (e) {
        console.warn(`Failed to create factory preset ${preset.name}:`, e);
      }
    }
  }

  /**
   * Mettre à jour la barre de status
   * @param {string} msg - Message à afficher
   * @private
   */
  _setStatus(msg) {
    try {
      if (!this._status) {
        this._status = this.shadowRoot && this.shadowRoot.getElementById ? this.shadowRoot.getElementById('status') : null;
      }
      if (this._status) {
        this._status.textContent = msg;
      } else {
        // Fallback to console when status element isn't ready
        console.log('Sampler status:', msg);
      }
    } catch (e) {
      console.warn('setStatus failed', e);
    }
  }

  // Méthodes pour interactions de trim sur le canvas principal
  _onMainCanvasMouseDown(e) {
    if (!this._waveforms[this._selectedPad] || !this._waveCanvas) return;
    
    const rect = this._waveCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;
    const relX = x / w;
    
    const startX = parseFloat(this._trimLeft?.value || 0);
    const endX = parseFloat(this._trimRight?.value || 1);
    const threshold = 10 / w; // 10px de tolérance
    
    if (Math.abs(relX - startX) < threshold) {
      this._mainTrimDragging = 'start';
    } else if (Math.abs(relX - endX) < threshold) {
      this._mainTrimDragging = 'end';
    }
  }
  
  _onMainCanvasMouseMove(e) {
    if (!this._mainTrimDragging || !this._waveCanvas) return;
    
    const rect = this._waveCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;
    const relX = Math.max(0, Math.min(1, x / w));
    
    if (this._mainTrimDragging === 'start') {
      const newVal = Math.min(relX, parseFloat(this._trimRight?.value || 1) - 0.01);
      if (this._trimLeft) this._trimLeft.value = newVal;
      if (this._trimLeftVal) this._trimLeftVal.textContent = `${Math.round(newVal * 100)}%`;
    } else if (this._mainTrimDragging === 'end') {
      const newVal = Math.max(relX, parseFloat(this._trimLeft?.value || 0) + 0.01);
      if (this._trimRight) this._trimRight.value = newVal;
      if (this._trimRightVal) this._trimRightVal.textContent = `${Math.round(newVal * 100)}%`;
    }
    
    this._drawSelectedWaveform(this._selectedPad);
  }
  
  _onMainCanvasMouseUp() {
    if (this._mainTrimDragging) {
      // Appliquer les changements au pad
      this._onTrimChange();
      this._mainTrimDragging = null;
    }
  }

  // Méthode pour couper l'audio et appliquer le trim
  async _applyTrimToCurrentPad() {
    const padIndex = this._selectedPad;
    const padObj = this.audioNode?.pads?.[padIndex];
    if (!padObj || !padObj.originalBuffer) {
      this._setStatus('✗ Aucun sample chargé sur ce pad');
      return;
    }

    try {
      const originalBuffer = padObj.originalBuffer;
      const trimStart = parseFloat(this._trimLeft?.value || 0);
      const trimEnd = parseFloat(this._trimRight?.value || 1);
      
      // Calculer les échantillons
      const startSample = Math.floor(originalBuffer.length * trimStart);
      const endSample = Math.ceil(originalBuffer.length * trimEnd);
      const newLength = endSample - startSample;
      
      if (newLength <= 0) {
        this._setStatus('✗ Sélection invalide');
        return;
      }
      
      // Créer un nouveau buffer avec uniquement la partie sélectionnée
      const ctx = this.plugin.audioContext;
      const trimmedBuffer = ctx.createBuffer(
        originalBuffer.numberOfChannels,
        newLength,
        originalBuffer.sampleRate
      );
      
      // Copier les données
      for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
        const originalData = originalBuffer.getChannelData(channel);
        const trimmedData = trimmedBuffer.getChannelData(channel);
        for (let i = 0; i < newLength; i++) {
          trimmedData[i] = originalData[startSample + i];
        }
      }
      
      // Charger le nouveau buffer coupé
      this.audioNode.loadSample(padIndex, trimmedBuffer);
      this._markLoaded(padIndex, true);
      
      // Réinitialiser les trim à 0-100% puisque le buffer est maintenant coupé
      if (this._trimLeft) this._trimLeft.value = 0;
      if (this._trimRight) this._trimRight.value = 1;
      if (this._trimLeftVal) this._trimLeftVal.textContent = '0%';
      if (this._trimRightVal) this._trimRightVal.textContent = '100%';
      
      if (typeof this.audioNode.setPadTrimStart === 'function') {
        this.audioNode.setPadTrimStart(padIndex, 0);
        this.audioNode.setPadTrimEnd(padIndex, 1);
      }
      
      // Mettre à jour la waveform
      this._waveforms[padIndex] = this._computeWaveformSummary(trimmedBuffer, 512);
      this._drawSelectedWaveform(padIndex);
      
      this._setStatus(`✂️ Sample coupé: ${Math.round(trimStart * 100)}% à ${Math.round(trimEnd * 100)}%`);
      try { this._saveCurrentBank(); } catch (e) { /* ignore */ }
    } catch (e) {
      console.error('applyTrimToCurrentPad failed', e);
      this._setStatus(`✗ Erreur: ${e.message}`);
    }
  }

  // Méthodes pour import/export d'état
  _exportState() {
    try {
      const state = this.audioNode?.getState?.();
      if (!state) {
        this._setStatus('✗ Impossible d\'exporter l\'état');
        return;
      }
      const json = JSON.stringify(state, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sampler-state-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this._setStatus('📤 État exporté');
    } catch (e) {
      console.error('exportState failed', e);
      this._setStatus(`✗ Erreur export: ${e.message}`);
    }
  }

  async _importState(file) {
    try {
      const text = await file.text();
      const state = JSON.parse(text);
      this.audioNode?.setState?.(state);
      this._setStatus('📥 État importé');
      // Recharger l'UI
      window.location.reload();
    } catch (e) {
      console.error('importState failed', e);
      this._setStatus(`✗ Erreur import: ${e.message}`);
    }
  }

  _logState() {
    try {
      const state = this.audioNode?.getState?.();
      if (!state) {
        this._setStatus('✗ Impossible de récupérer l\'état');
        console.warn('No state available');
        return;
      }
      console.group('🔍 Sampler State');
      console.log('Full state:', state);
      console.log('Pads:', state.pads);
      console.log('Master:', state.master);
      console.log('Waveforms:', state.waveforms ? `${state.waveforms.length} waveforms` : 'none');
      console.groupEnd();
      this._setStatus('🔍 État affiché dans la console');
    } catch (e) {
      console.error('logState failed', e);
      this._setStatus(`✗ Erreur: ${e.message}`);
    }
  }
}

// Enregistrer le custom element pour permettre document.createElement('wam-sampler')
if (!customElements.get('wam-sampler')) {
  customElements.define('wam-sampler', SamplerElement);
}
