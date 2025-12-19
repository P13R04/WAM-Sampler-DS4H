/* eslint-disable no-underscore-dangle */
/**
 * WAM Sampler Node - Moteur DSP principal
 * 
 * Architecture :
 * - 16 pads audio indépendants (SamplePad)
 * - Chaque pad : buffer, gain, pan, filter (tone), pitch, trim, reverse
 * - Polyphonie limitée par pad (3 voix max pour éviter fuites mémoire)
 * - Master gain pour contrôle global
 * - Séparation stricte DSP/GUI : aucune logique UI ici
 * 
 * @author Pierre Constantin, Baptiste Giacchero
 */

import { CompositeAudioNode } from '../sdk/CompositeAudioNode.js';

/**
 * Inverse un AudioBuffer (lecture reverse)
 * @param {AudioContext} context - Contexte audio
 * @param {AudioBuffer} buffer - Buffer à inverser
 * @returns {AudioBuffer} Nouveau buffer inversé
 */
function reverseBuffer(context, buffer) {
  const reversed = context.createBuffer(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  for (let ch = 0; ch < buffer.numberOfChannels; ch += 1) {
    const input = buffer.getChannelData(ch);
    const output = reversed.getChannelData(ch);
    for (let i = 0; i < input.length; i += 1) {
      output[i] = input[input.length - 1 - i];
    }
  }

  return reversed;
}

/**
 * Classe représentant un pad de sample individuel
 * 
 * Chaque pad encapsule :
 * - Un buffer audio (original + reversed si besoin)
 * - Graphe audio : gain → filter → panner
 * - Paramètres : volume, pan, pitch, tone, trim, reverse
 * - Polyphonie : pool de sources actives (max 3)
 */
class SamplePad {
  constructor(context, index, owner) {
    this.context = context;
    this.index = index;
    this.owner = owner || null;
    
    // Nœuds audio
    this.gainNode = context.createGain();
    this.pannerNode = context.createStereoPanner();
    this.filterNode = context.createBiquadFilter();
    
    // Configuration du filtre lowpass
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 20000; // Ouvert par défaut
    this.filterNode.Q.value = 1.0;
    
    // Connexions : gain → filter → panner → [output externe]
    this.gainNode.connect(this.filterNode);
    this.filterNode.connect(this.pannerNode);
    
    // État du pad
    this.buffer = null; // Buffer actuellement utilisé (peut être reversed)
    this.originalBuffer = null; // Buffer original (non-inversé)
    this.trimStart = 0.0;  // Début du trim (0-1)
    this.trimEnd = 1.0;    // Fin du trim (0-1)
    this.pitch = 1.0;      // Vitesse de lecture (playbackRate)
    this.tone = 0;         // Position du filtre (-1 fermé, +1 ouvert)
    this.reverse = false;  // Lecture inversée
    this.midiNote = 36 + index; // Note MIDI par défaut (C2 + offset)
    this.name = `Pad ${index + 1}`;
    
    // Polyphonie : pool de sources actives
    this.activeSources = [];
    this.maxPolyphony = 3; // Limite stricte pour éviter fuites
  }

  /**
   * Connecter la sortie du pad (panner) à une destination
   */
  connect(destination) {
    this.pannerNode.connect(destination);
  }

  /**
   * Jouer le sample du pad
   * @param {number} velocity - Vélocité de lecture (0-1), affecte le gain
   */
  play(velocity = 1.0) {
    if (!this.buffer) {
      console.warn(`[Pad ${this.index}] Pas de buffer chargé`);
      return;
    }

    // Validation du trim
    if (this.trimStart >= this.trimEnd) {
      console.warn(`[Pad ${this.index}] Trim invalide (start >= end)`);
      return;
    }

    // Nettoyage des sources terminées
    this._cleanupFinishedSources();

    // Gestion de la polyphonie : arrêter les plus vieilles sources
    while (this.activeSources.length >= this.maxPolyphony) {
      const oldest = this.activeSources.shift();
      try {
        oldest.source.stop();
        oldest.source.disconnect();
        oldest.velocityGain.disconnect();
      } catch (e) {
        // Déjà arrêtée/déconnectée
      }
    }

    // Créer une nouvelle source (one-shot)
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;

    // Apply global pitch shift (in semitones) if owner defines it
    let effectivePitch = this.pitch;
    if (this.owner && typeof this.owner.pitchShift === 'number' && this.owner.pitchShift !== 0) {
      const semitones = this.owner.pitchShift;
      const ratio = Math.pow(2, semitones / 12);
      effectivePitch = this.pitch * ratio;
    }
    source.playbackRate.value = effectivePitch;

    // Gain de vélocité (appliqué temporairement pour cette source)
    const velocityGain = this.context.createGain();
    // We'll schedule ADSR on this gain if enabled, otherwise set static value

    // Connexion : source → velocityGain → gainNode (du pad)
    source.connect(velocityGain);
    velocityGain.connect(this.gainNode);

    // Calcul des points de trim en secondes
    const duration = this.buffer.duration;
    const startOffset = this.trimStart * duration;
    const endOffset = this.trimEnd * duration;
    const trimDuration = Math.max(0, endOffset - startOffset);

    if (trimDuration === 0) {
      console.warn(`[Pad ${this.index}] Durée de trim = 0`);
      return;
    }

    const now = this.context.currentTime;

    // Apply ADSR envelope on velocityGain if owner ADSR enabled
    if (this.owner && this.owner.adsrEnabled) {
      const a = Math.max(0, Number(this.owner.adsrAttack) || 0.01);
      const d = Math.max(0, Number(this.owner.adsrDecay) || 0.1);
      const s = Math.max(0, Math.min(1, Number(this.owner.adsrSustain) || 0.8));
      const r = Math.max(0, Number(this.owner.adsrRelease) || 0.15);

      const velocityLevel = velocity;

      // Limit release to a fraction of trimDuration to avoid overruns
      const maxRel = Math.min(r, trimDuration * 0.25);

      velocityGain.gain.cancelScheduledValues(now);
      // start near zero
      velocityGain.gain.setValueAtTime(0.0001, now);
      // attack to full velocity
      velocityGain.gain.linearRampToValueAtTime(velocityLevel, now + a);
      // decay to sustain level
      velocityGain.gain.linearRampToValueAtTime(velocityLevel * s, now + a + d);

      // schedule release within the buffer playback window
      const releaseStart = now + Math.max(0, trimDuration - maxRel);
      if (releaseStart > now + a + d) {
        // hold sustain until releaseStart
        velocityGain.gain.setValueAtTime(velocityLevel * s, releaseStart);
        velocityGain.gain.linearRampToValueAtTime(0.0001, releaseStart + maxRel);
      } else {
        // short sample: ramp to zero at end
        velocityGain.gain.linearRampToValueAtTime(0.0001, now + trimDuration);
      }
    } else {
      velocityGain.gain.setValueAtTime(velocity, now);
    }

    // Ajouter au pool des sources actives
    const sourceEntry = {
      source,
      velocityGain,
      startTime: now,
      duration: trimDuration,
      finished: false
    };
    this.activeSources.push(sourceEntry);

    // Démarrer la lecture avec offset (durée gérée via stop scheduling)
    try {
      source.start(0, startOffset);
      // schedule stop at end of trim (small safety margin)
      source.stop(now + trimDuration + 0.05);
    } catch (e) {
      // If start with offset/duration fails, fallback to previous behavior
      try {
        source.start(0, startOffset, trimDuration);
      } catch (err) {
        console.warn('Failed to start source with offsets', err);
      }
    }

    // Nettoyer après la lecture
    source.onended = () => {
      sourceEntry.finished = true;
      try {
        source.disconnect();
        velocityGain.disconnect();
      } catch (e) {
        // Déjà déconnecté
      }
      this._cleanupFinishedSources();
    };
  }

  /**
   * Nettoyer les sources terminées du pool
   * Appelé avant chaque nouvelle lecture et dans onended
   * @private
   */
  _cleanupFinishedSources() {
    this.activeSources = this.activeSources.filter((entry) => {
      if (entry.finished) {
        // Double-check déconnexion
        try {
          entry.source.disconnect();
          entry.velocityGain.disconnect();
        } catch (e) {
          // Déjà déconnecté
        }
        return false; // Retirer du pool
      }
      
      // Retirer aussi les sources en timeout (marge de 0.5s)
      const elapsed = this.context.currentTime - entry.startTime;
      if (elapsed > entry.duration + 0.5) {
        try {
          entry.source.stop();
          entry.source.disconnect();
          entry.velocityGain.disconnect();
        } catch (e) {
          // Déjà arrêté
        }
        return false;
      }
      
      return true; // Garder dans le pool
    });
  }

  /**
   * Charger un buffer audio dans le pad
   * @param {AudioBuffer} audioBuffer - Buffer à charger
   */
  setBuffer(audioBuffer) {
    // Accept null to clear the buffer
    if (!audioBuffer) {
      this.originalBuffer = null;
      this.buffer = null;
      return;
    }

    this.originalBuffer = audioBuffer;
    // Appliquer reverse si activé
    this.buffer = this.reverse ? reverseBuffer(this.context, audioBuffer) : audioBuffer;
  }

  /**
   * Définir le paramètre tone (filtre lowpass)
   * @param {number} value - Valeur entre -1 (fermé) et +1 (ouvert)
   */
  setTone(value) {
    this.tone = Math.max(-1, Math.min(1, value));
    
    // Mapper -1..+1 vers fréquence logarithmique 200Hz..20000Hz
    const minFreq = 200;
    const maxFreq = 20000;
    
    // Conversion logarithmique pour un contrôle musical
    const normalized = (this.tone + 1) / 2; // 0..1
    const logMin = Math.log(minFreq);
    const logMax = Math.log(maxFreq);
    const frequency = Math.exp(logMin + normalized * (logMax - logMin));
    
    this.filterNode.frequency.setValueAtTime(frequency, this.context.currentTime);
  }

  /**
   * Activer/désactiver le reverse playback
   * @param {boolean} enabled - True pour activer
   */
  setReverse(enabled) {
    if (this.reverse === enabled) return;
    
    this.reverse = enabled;
    
    // Recréer le buffer si nécessaire
    if (this.originalBuffer) {
      this.buffer = this.reverse 
        ? reverseBuffer(this.context, this.originalBuffer) 
        : this.originalBuffer;
    }
  }

  /**
   * Obtenir l'état du pad pour sérialisation
   * Note : les buffers ne sont pas sérialisés (trop gros)
   * @returns {Object} État du pad
   */
  getState() {
    return {
      id: this.index,
      trimStart: this.trimStart,
      trimEnd: this.trimEnd,
      volume: this.gainNode.gain.value,
      pan: this.pannerNode.pan.value,
      pitch: this.pitch,
      tone: this.tone,
      reverse: this.reverse,
      midiNote: this.midiNote,
      name: this.name
    };
  }

  /**
   * Restaurer l'état du pad
   * @param {Object} state - État à restaurer
   */
  setState(state) {
    if (!state) return;
    
    // Restaurer les paramètres
    if (state.trimStart !== undefined) this.trimStart = state.trimStart;
    if (state.trimEnd !== undefined) this.trimEnd = state.trimEnd;
    
    if (state.volume !== undefined) {
      this.gainNode.gain.value = state.volume;
    }
    
    if (state.pan !== undefined) {
      this.pannerNode.pan.value = state.pan;
    }
    
    if (state.pitch !== undefined) this.pitch = state.pitch;
    
    // Appliquer le tone via setTone pour mettre à jour le filtre
    if (state.tone !== undefined) {
      this.setTone(state.tone);
    }
    
    if (state.reverse !== undefined) this.reverse = state.reverse;
    if (state.midiNote !== undefined) this.midiNote = state.midiNote;
    if (state.name !== undefined) this.name = state.name;
  }
}

/**
 * Nœud audio principal du sampler WAM
 * 
 * Architecture WAM stricte (CompositeAudioNode) :
 * - _input : entrée composite (inutilisée ici, sampler = instrument)
 * - _output : sortie composite (masterGain)
 * - 16 pads connectés au master gain
 * 
 * Fonctionnalités :
 * - Lecture de samples avec vélocité
 * - Gestion des paramètres via ParamMgr
 * - Sérialisation d'état (presets)
 * - Pas de dépendance GUI
 * 
 * @class SamplerNode
 * @extends {CompositeAudioNode}
 */
export default class SamplerNode extends CompositeAudioNode {
  /**
   * Référence au gestionnaire de paramètres (ParamMgrNode)
   * @type {ParamMgrNode}
   */
  _wamNode = undefined;

  constructor(context, options) {
    super(context, options);
    this.createNodes();
  }

  /**
   * Setup avec le ParamMgrNode (obligatoire pour l'automation WAM)
   * @param {ParamMgrNode} wamNode - Gestionnaire de paramètres
   */
  setup(wamNode) {
    this._wamNode = wamNode;
    this.connectNodes();
  }

  /**
   * Création du graphe audio
   * - Master gain (sortie composite)
   * - 16 pads audio
   * @private
   */
  createNodes() {
    // Output master
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 1.0;

    // 16 pads
    this.pads = [];
    for (let i = 0; i < 16; i += 1) {
      const pad = new SamplePad(this.context, i, this);
      this.pads.push(pad);
    }
    // Global tone/pan nodes (master chain): masterGain -> lowShelf -> highShelf -> pan -> output
    this.lowShelfNode = this.context.createBiquadFilter();
    this.lowShelfNode.type = 'lowshelf';
    this.lowShelfNode.gain.value = 0;

    this.highShelfNode = this.context.createBiquadFilter();
    this.highShelfNode.type = 'highshelf';
    this.highShelfNode.gain.value = 0;

    this.panNode = this.context.createStereoPanner();

    // default pitch shift (semitones) and ADSR
    this.pitchShift = 0; // semitones
    this.adsrEnabled = false;
    this.adsrAttack = 0.01;
    this.adsrDecay = 0.1;
    this.adsrSustain = 0.8;
    this.adsrRelease = 0.15;
  }

  /**
   * Connexion du graphe audio
   * Tous les pads → master gain → _output
   * @private
   */
  connectNodes() {
    // Connecter tous les pads au master gain
    this.pads.forEach((pad) => {
      pad.connect(this.masterGain);
    });

    // Connecter la chaîne master -> lowShelf -> highShelf -> pan -> output
    this.masterGain.connect(this.lowShelfNode);
    this.lowShelfNode.connect(this.highShelfNode);
    this.highShelfNode.connect(this.panNode);

    // Définir la sortie composite sur le panNode (no default destination here)
    this._output = this.panNode;
  }

  /**
   * Connexion compatible WAM:
   * - Accepte destination AudioNode ou CompositeAudioNode (_input)
   */
  connect(destination) {
    const dest = destination && (destination._input || destination);
    if (dest) this._output.connect(dest);
    else this._output.connect();
    return destination;
  }

  /**
   * Déconnexion compatible WAM:
   * - Accepte destination AudioNode ou CompositeAudioNode (_input)
   */
  disconnect(destination) {
    const dest = destination && (destination._input || destination);
    if (dest) this._output.disconnect(dest);
    else this._output.disconnect();
  }

  /**
   * Jouer un pad
   * @param {number} padIndex - Index du pad (0-15)
   * @param {number} velocity - Vélocité (0-1)
   */
  playPad(padIndex, velocity = 1.0) {
    if (padIndex < 0 || padIndex >= 16) {
      console.warn(`Index de pad invalide : ${padIndex}`);
      return;
    }
    try {
      console.log(`[Pad ${padIndex}] playPad invoked, velocity=${velocity}`);
    } catch (e) {}
    this.pads[padIndex].play(velocity);
  }

  /**
   * Charger un buffer dans un pad
   * @param {number} padIndex - Index du pad
   * @param {AudioBuffer} audioBuffer - Buffer à charger
   */
  loadSample(padIndex, audioBuffer) {
    if (padIndex >= 0 && padIndex < 16) {
      this.pads[padIndex].setBuffer(audioBuffer);
    }
  }

  // ========== Setters pour les paramètres (appelés par ParamMgr) ==========

  set masterVolume(value) {
    this.masterGain.gain.setValueAtTime(value, this.context.currentTime);
  }

  // Backwards-compatible setter used by GUI
  setMasterVolume(value) {
    this.masterGain.gain.setValueAtTime(value, this.context.currentTime);
  }

  setPadVolume(index, value) {
    if (this.pads[index]) {
      this.pads[index].gainNode.gain.setValueAtTime(value, this.context.currentTime);
    }
  }

  setPadPan(index, value) {
    if (this.pads[index]) {
      this.pads[index].pannerNode.pan.setValueAtTime(value, this.context.currentTime);
    }
  }

  setPadPitch(index, value) {
    if (this.pads[index]) {
      this.pads[index].pitch = value;
    }
  }

  setPadTrimStart(index, value) {
    if (this.pads[index]) {
      this.pads[index].trimStart = Math.max(0, Math.min(1, value));
    }
  }

  setPadTrimEnd(index, value) {
    if (this.pads[index]) {
      this.pads[index].trimEnd = Math.max(0, Math.min(1, value));
    }
  }

  setPadTone(index, value) {
    if (this.pads[index]) {
      this.pads[index].setTone(value);
    }
  }

  setPadReverse(index, value) {
    if (this.pads[index]) {
      this.pads[index].setReverse(!!value);
    }
  }

  setPadMidiNote(index, value) {
    if (this.pads[index]) {
      this.pads[index].midiNote = Math.floor(value);
    }
  }

  // ========== Sérialisation de l'état ==========

  /**
   * Obtenir l'état complet du sampler
   * @returns {Object} État sérialisé
   */
  getState() {
    return {
      version: '1.0.0',
      masterVolume: this.masterGain.gain.value,
      pads: this.pads.map((pad) => pad.getState())
    };
  }

  /**
   * Restaurer l'état complet
   * @param {Object} state - État à restaurer
   */
  setState(state) {
    if (!state) return;

    // Restaurer le master volume
    if (state.masterVolume !== undefined) {
      this.masterGain.gain.value = state.masterVolume;
    }

    // Restaurer les pads
    // Apply pad states exactly: for each of the 16 pads, if the state provides
    // an entry, restore it; otherwise clear the pad so loading a sparse preset
    // replaces any previously loaded samples.
    for (let i = 0; i < 16; i += 1) {
      const padState = (state.pads && Array.isArray(state.pads)) ? state.pads[i] : undefined;
      if (padState) {
        if (this.pads[i]) this.pads[i].setState(padState);
      } else {
        // clear pad: remove buffer and reset basic params to defaults
        if (this.pads[i]) {
          try {
            this.pads[i].setBuffer(null);
          } catch (e) {}
          this.pads[i].trimStart = 0.0;
          this.pads[i].trimEnd = 1.0;
          this.pads[i].pitch = 1.0;
          this.pads[i].tone = 0;
          this.pads[i].reverse = false;
          // reset gain/pan to defaults
          try { this.pads[i].gainNode.gain.setValueAtTime(1.0, this.context.currentTime); } catch (_) {}
          try { this.pads[i].pannerNode.pan.setValueAtTime(0, this.context.currentTime); } catch (_) {}
        }
      }
    }
  }

  // ========== Méthodes obligatoires ParamMgr (délégation) ==========

  getParamValue(name) {
    return this._wamNode.getParamValue(name);
  }

  setParamValue(name, value) {
    return this._wamNode.setParamValue(name, value);
  }

  getParamsValues() {
    return this._wamNode.getParamsValues();
  }

  setParamsValues(values) {
    return this._wamNode.setParamsValues(values);
  }
}
