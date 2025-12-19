/**
 * Shim minimal de WebAudioModule pour le développement Phase 1
 * Ce fichier permet de tester le plugin sans installer le vrai SDK
 * À remplacer par le vrai package @webaudiomodules/api en production
 */

export class WebAudioModule {
  constructor() {
    this.descriptor = {};
    this.audioContext = null;
    this.audioNode = null;
    this.gui = null;
    this.module = this;
  }

  async initialize(state) {
    this.state = state || {};
    return this;
  }

  // Les plugins doivent override createAudioNode(initialState)
  async createAudioNode(initialState) {
    return null;
  }

  async createGui() {
    // GUI par défaut (vide)
    const d = document.createElement('div');
    d.textContent = this.descriptor && this.descriptor.name ? this.descriptor.name : 'WAM Plugin';
    return d;
  }

  async destroyGui(dom) {
    try { if (dom && dom.remove) dom.remove(); } catch (e) { /* ignore */ }
  }

  /**
   * Factory statique pour créer une instance du plugin
   * @param {string} hostGroupId - ID du groupe hôte
   * @param {AudioContext} audioContext - Contexte audio
   * @param {Object} initialState - État initial
   */
  static async createInstance(hostGroupId, audioContext, initialState) {
    // `this` est la classe du plugin (sous-classe de WebAudioModule)
    const plugin = new this();
    plugin.audioContext = audioContext;
    await plugin.initialize(initialState);
    
    // Créer le nœud audio si disponible
    if (typeof plugin.createAudioNode === 'function') {
      try {
        plugin.audioNode = await plugin.createAudioNode(initialState);
      } catch (err) {
        console.warn('WebAudioModule.createInstance: createAudioNode failed', err);
      }
    }
    
    plugin.module = plugin;
    return plugin;
  }
}

export default WebAudioModule;
