/* eslint-disable no-underscore-dangle */
/**
 * WAM Sampler Plugin - Factory principal
 * 
 * Point d'entrée pour le plugin Web Audio Module.
 * Respecte le standard WAM 2.0 :
 * - createInstance() : création d'une instance du plugin
 * - createAudioNode() : création du DSP Node
 * - createGui() : création de l'interface graphique (optionnelle)
 * 
 * @author Pierre Constantin, Baptiste Giacchero
 */

import { ParamMgrFactory } from '../host/vendor/sdk-parammgr/index.js';
import SamplerNode from './Node.js';
import { createElement } from './gui/index.js';

/**
 * Obtient l'URL de base du module
 * @param {URL} relativeURL 
 * @returns {string}
 */
const getBaseUrl = (relativeURL) => {
  const baseURL = relativeURL.href.substring(0, relativeURL.href.lastIndexOf('/'));
  return baseURL;
};

/**
 * Plugin principal du sampler WAM
 * Factory pour créer le Node DSP et la GUI
 * 
 * @class SamplerPlugin
 * @extends {WebAudioModule}
 */
export default class SamplerPlugin {
  // keep lightweight fields
  descriptor = {};
  state = {};
  // MIDI handling (plugin-level, host-agnostic)
  _midiEnabled = false;
  _midiAccess = null;
  _midiInputs = new Map();
  _recentNotes = new Map();
  static MIDI_BASE = 36; // C1
  static NUM_PADS = 16;
  _baseURL = getBaseUrl(new URL('.', import.meta.url));
  _descriptorUrl = `${this._baseURL}/descriptor.json`;

  /**
   * Charge le fichier descriptor.json
   * Contient les métadonnées du plugin (nom, version, vendor, etc.)
   */
  async _loadDescriptor() {
    const url = this._descriptorUrl;
    if (!url) throw new TypeError('Descriptor not found');
    
    const response = await fetch(url);
    const descriptor = await response.json();
    Object.assign(this.descriptor, descriptor);
  }

  /**
   * Initialisation du plugin
   * @param {Object} state - État initial (optionnel)
   */
  async initialize(state) {
    await this._loadDescriptor();
    this.state = state || {};
    return this;
  }

  // Static factory compatible with previous shim: createInstance(groupId, audioContext, initialState)
  static async createInstance(groupId, audioContext, initialState) {
    const plugin = new SamplerPlugin();
    plugin.groupId = groupId;
    plugin.audioContext = audioContext;
    await plugin.initialize(initialState);
    if (typeof plugin.createAudioNode === 'function') {
      try {
        plugin.audioNode = await plugin.createAudioNode(initialState);
      } catch (err) {
        console.error('SamplerPlugin.createInstance: createAudioNode failed', err);
        if (err && err.stack) console.error(err.stack);
        throw err;
      }
    }
    plugin.module = plugin;
    return plugin;
  }

  /**
   * Création du nœud audio DSP
   * C'est ici que le moteur audio est instancié
   * 
   * @param {Object} initialState - État initial des paramètres
   * @returns {Promise<SamplerNode>}
   */
  async createAudioNode(initialState) {
    // Créer le nœud DSP
    const samplerNode = new SamplerNode(this.audioContext);

    // No dev fallback: rely on the host to initialize the WAM environment
    // (i.e. call addFunctionModule(audioContext.audioWorklet, initializeWamEnv, ...)).
    // If the host did not do so, ParamMgrFactory.create will fail; we catch
    // that failure below and rethrow an informative error to guide the developer.

    // Configuration des paramètres exposés pour automation WAM
    const internalParamsConfig = this._createParamsConfig(samplerNode);

    // Create internal AudioParams and mappings so hosts can automate native AudioParams.
    const { internalParams, paramsMapping } = this._createInternalParamsAndMapping(samplerNode);

    // Créer le gestionnaire de paramètres (ParamMgr)
    const optionsIn = { internalParamsConfig: internalParams, paramsMapping };
    let paramMgrNode;
    try {
      paramMgrNode = await ParamMgrFactory.create(this, optionsIn);
    } catch (err) {
      const guidance = `ParamMgrFactory.create failed: ensure the host initialized the WAM environment in the AudioWorklet global scope before creating the plugin. Call the host helper (e.g. initializeWamEnv via addFunctionModule) or run inside an official WAM host. Original error: ${err && err.message ? err.message : err}`;
      const e = new Error(guidance);
      e.cause = err;
      console.error('SamplerPlugin.createAudioNode: ParamMgr initialization failed', err);
      throw e;
    }

    // Lier le param manager au Node DSP
    samplerNode.setup(paramMgrNode);

    // Restaurer l'état initial si fourni
    if (initialState) samplerNode.setState(initialState);

    // Attach convenience: expose playPad on plugin for external callers
    this.audioNode = samplerNode;

    // Auto-enable MIDI if available (host-independent)
    try {
      if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess) {
        // Do not await here — start initialization in background
        this.enableMidi().catch(() => {});
      }
    } catch (e) {}

    return samplerNode;
  }

  // --- MIDI control (plugin-level) ---
  async enableMidi() {
    if (this._midiEnabled) return true;
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) return false;
    try {
      this._midiAccess = await navigator.requestMIDIAccess();
      const attach = (input) => {
        if (!input) return;
        const id = input.name || input.id || String(Math.random());
        // avoid double attachment
        if (this._midiInputs.has(id)) return;
        const handler = (ev) => { this._onMidiMessage(ev, id); };
        try {
          input.addEventListener('midimessage', handler);
          this._midiInputs.set(id, { input, handler });
        } catch (err) {
          // fallback if addEventListener unsupported
          try { input.onmidimessage = handler; this._midiInputs.set(id, { input, handler }); } catch (_) {}
        }
      };

      for (const input of this._midiAccess.inputs.values()) attach(input);
      this._midiAccess.onstatechange = (ev) => {
        // Re-attach handlers for current inputs, avoiding duplicates
        for (const input of this._midiAccess.inputs.values()) attach(input);
      };
      this._midiEnabled = true;
      return true;
    } catch (e) {
      console.warn('enableMidi failed', e);
      return false;
    }
  }

  disableMidi() {
    if (!this._midiEnabled) return;
    try {
      for (const { input, handler } of this._midiInputs.values()) {
        try { input.removeEventListener && input.removeEventListener('midimessage', handler); } catch (_) {}
        try { input.onmidimessage = null; } catch (_) {}
      }
      this._midiInputs.clear();
      if (this._midiAccess) this._midiAccess.onstatechange = null;
      this._midiAccess = null;
    } catch (e) {
      console.warn('disableMidi failed', e);
    }
    this._midiEnabled = false;
  }

  _onMidiMessage(ev, inputId) {
    try {
      const data = ev.data || [];
      const statusByte = data[0] || 0;

      // Ignore system real-time messages (Active Sensing 0xFE, Clock, etc.)
      if (statusByte >= 0xf0) return;

      const command = statusByte & 0xf0;
      if (command !== 0x90) return; // only Note On

      const note = data[1] || 0;
      const velocity = data[2] || 0;
      if (velocity === 0) return; // treat as note-off

      // Debounce per-note globally to avoid rapid duplicate triggers
      const now = performance.now ? performance.now() : Date.now();
      const last = this._recentNotes.get(note) || 0;
      if (now - last < 50) return; // debounce duplicates within 50ms
      this._recentNotes.set(note, now);

      // Enforce configured MIDI base range (default 36..51)
      const minNote = SamplerPlugin.MIDI_BASE;
      const maxNote = SamplerPlugin.MIDI_BASE + SamplerPlugin.NUM_PADS - 1;
      if (note < minNote || note > maxNote) return;

      const padIndex = note - minNote;
      const vel = Math.min(1, velocity / 127);
      if (this.audioNode && typeof this.audioNode.playPad === 'function') {
        this.audioNode.playPad(padIndex, vel);
      }
    } catch (e) {
      console.warn('midi message handler error', e);
    }
  }

  /**
   * Création de la configuration des paramètres
   * 
   * Chaque paramètre expose:
   * - defaultValue, minValue, maxValue : range du paramètre
   * - onChange : callback appelé quand le paramètre change
   * 
   * Total : 1 (masterVolume) + 16 pads × 7 params = 113 paramètres
   * 
   * @private
   * @param {SamplerNode} samplerNode - Node DSP
   * @returns {Object} Configuration des paramètres
   */
  _createParamsConfig(samplerNode) {
    const config = {
      // Paramètre global
      masterVolume: {
        defaultValue: 1.0,
        minValue: 0,
        maxValue: 2,
        onChange: (value) => { samplerNode.masterVolume = value; }
      }
    };

    // Paramètres par pad (16 pads × 7 params)
    for (let i = 0; i < 16; i += 1) {
      // Volume du pad
      config[`pad${i}_volume`] = {
        defaultValue: 1.0,
        minValue: 0,
        maxValue: 2,
        onChange: (value) => { samplerNode.setPadVolume(i, value); }
      };
      
      // Pan (panoramique stéréo)
      config[`pad${i}_pan`] = {
        defaultValue: 0,
        minValue: -1,
        maxValue: 1,
        onChange: (value) => { samplerNode.setPadPan(i, value); }
      };

      // Pitch (vitesse de lecture)
      config[`pad${i}_pitch`] = {
        defaultValue: 1.0,
        minValue: 0.5,
        maxValue: 2.0,
        onChange: (value) => { samplerNode.setPadPitch(i, value); }
      };

      // Trim start (début du sample, 0-1)
      config[`pad${i}_trimStart`] = {
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        onChange: (value) => { samplerNode.setPadTrimStart(i, value); }
      };

      // Trim end (fin du sample, 0-1)
      config[`pad${i}_trimEnd`] = {
        defaultValue: 1,
        minValue: 0,
        maxValue: 1,
        onChange: (value) => { samplerNode.setPadTrimEnd(i, value); }
      };

      // Tone (fréquence du filtre lowpass, -1 fermé à +1 ouvert)
      config[`pad${i}_tone`] = {
        defaultValue: 1.0,  // Fully open par défaut
        minValue: -1,
        maxValue: 1,
        onChange: (value) => { samplerNode.setPadTone(i, value); }
      };

      // Reverse (lecture inversée, 0 ou 1)
      config[`pad${i}_reverse`] = {
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        onChange: (value) => { samplerNode.setPadReverse(i, value > 0.5); }
      };
    }

    return config;
  }

  /**
   * Build internal params config mapping to real AudioParams when possible
   * and build paramsMapping for conversions (eg. tone -> filter.frequency).
   * @private
   * @param {SamplerNode} samplerNode
   * @returns {{ internalParams: Object, paramsMapping: Object }}
   */
  _createInternalParamsAndMapping(samplerNode) {
    const internal = {};
    const mapping = {};

    // master volume -> AudioParam
    if (samplerNode.masterGain && samplerNode.masterGain.gain) {
      internal.masterVolume = samplerNode.masterGain.gain;
    }

    // per-pad internal params
    for (let i = 0; i < 16; i += 1) {
      const pad = samplerNode.pads[i];
      if (!pad) continue;

      // expose gain and pan as native AudioParams
      if (pad.gainNode && pad.gainNode.gain) internal[`pad${i}_volume`] = pad.gainNode.gain;
      if (pad.pannerNode && pad.pannerNode.pan) internal[`pad${i}_pan`] = pad.pannerNode.pan;

      // expose filter frequency as a dedicated internal param and map external tone to it
      if (pad.filterNode && pad.filterNode.frequency) {
        const minFreq = 200;
        const maxFreq = 20000;
        internal[`pad${i}_filter_frequency`] = pad.filterNode.frequency;
        // paramsMapping: map external pad{i}_tone (-1..1) -> filter frequency (minFreq..maxFreq)
        mapping[`pad${i}_tone`] = {
          [`pad${i}_filter_frequency`]: {
            sourceRange: [-1, 1],
            targetRange: [minFreq, maxFreq]
          }
        };
      }

      // Non-AudioParam controls: pitch, trim, reverse -> use onChange callbacks
      internal[`pad${i}_pitch`] = {
        defaultValue: pad.pitch || 1.0,
        minValue: 0.5,
        maxValue: 2.0,
        onChange: (v) => { samplerNode.setPadPitch(i, v); }
      };

      internal[`pad${i}_trimStart`] = {
        defaultValue: pad.trimStart || 0,
        minValue: 0,
        maxValue: 1,
        onChange: (v) => { samplerNode.setPadTrimStart(i, v); }
      };

      internal[`pad${i}_trimEnd`] = {
        defaultValue: pad.trimEnd || 1,
        minValue: 0,
        maxValue: 1,
        onChange: (v) => { samplerNode.setPadTrimEnd(i, v); }
      };

      internal[`pad${i}_reverse`] = {
        defaultValue: pad.reverse ? 1 : 0,
        minValue: 0,
        maxValue: 1,
        onChange: (v) => { samplerNode.setPadReverse(i, v > 0.5); }
      };
    }

    return { internalParams: internal, paramsMapping: mapping };
  }

  /**
   * Création de l'interface graphique
   * La GUI est optionnelle (le plugin peut fonctionner en mode headless)
   * 
   * @returns {Promise<HTMLElement>} Web Component de la GUI
   */
  async createGui() {
    return createElement(this);
  }
}
