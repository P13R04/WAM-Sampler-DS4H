/* eslint-disable no-underscore-dangle */
/**
 * WAM Sampler Plugin - Factory principal
 * 
 * Point d'entrée pour le plugin Web Audio Module.
 * Respecte le standard WAM 2.0
 * 
 * @author Pierre Constantin, Baptiste Giacchero
 */

import { WebAudioModule } from '@webaudiomodules/sdk';
import { ParamMgrFactory } from '@webaudiomodules/sdk-parammgr';
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
export default class SamplerPlugin extends WebAudioModule {
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



  /**
   * Création du nœud audio DSP
   * C'est ici que le moteur audio est instancié
   * 
   * @param {Object} initialState - État initial des paramètres
   * @returns {Promise<SamplerNode>}
   */
  async createAudioNode(initialState) {
    const samplerNode = new SamplerNode(this.audioContext);

    // Configuration des paramètres internes (AudioParams natifs)
    const internalParamsConfig = {};
    
    // Master volume
    if (samplerNode.masterGain && samplerNode.masterGain.gain) {
      internalParamsConfig.masterVolume = samplerNode.masterGain.gain;
    }

    // Paramètres par pad
    for (let i = 0; i < 16; i += 1) {
      const pad = samplerNode.pads[i];
      if (!pad) continue;

      // Volume et pan via AudioParams natifs
      if (pad.gainNode && pad.gainNode.gain) {
        internalParamsConfig[`pad${i}_volume`] = pad.gainNode.gain;
      }
      if (pad.pannerNode && pad.pannerNode.pan) {
        internalParamsConfig[`pad${i}_pan`] = pad.pannerNode.pan;
      }

      // Tone/filter frequency via AudioParam
      if (pad.filterNode && pad.filterNode.frequency) {
        internalParamsConfig[`pad${i}_filter_frequency`] = pad.filterNode.frequency;
      }

      // Paramètres non-AudioParam avec onChange
      internalParamsConfig[`pad${i}_pitch`] = {
        defaultValue: 1.0,
        minValue: 0.5,
        maxValue: 2.0,
        onChange: (v) => { samplerNode.setPadPitch(i, v); }
      };

      internalParamsConfig[`pad${i}_trimStart`] = {
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        onChange: (v) => { samplerNode.setPadTrimStart(i, v); }
      };

      internalParamsConfig[`pad${i}_trimEnd`] = {
        defaultValue: 1,
        minValue: 0,
        maxValue: 1,
        onChange: (v) => { samplerNode.setPadTrimEnd(i, v); }
      };

      internalParamsConfig[`pad${i}_reverse`] = {
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        onChange: (v) => { samplerNode.setPadReverse(i, v > 0.5); }
      };
    }

    // Mapping tone (-1..1) vers filter frequency (200..20000Hz)
    const paramsMapping = {};
    for (let i = 0; i < 16; i += 1) {
      paramsMapping[`pad${i}_tone`] = {
        [`pad${i}_filter_frequency`]: {
          sourceRange: [-1, 1],
          targetRange: [200, 20000]
        }
      };
    }

    const optionsIn = { internalParamsConfig, paramsMapping };
    const paramMgrNode = await ParamMgrFactory.create(this, optionsIn);
    samplerNode.setup(paramMgrNode);
    
    if (initialState) samplerNode.setState(initialState);

    // Auto-enable MIDI
    try {
      if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess) {
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



  createGui() {
    return createElement(this);
  }
}
