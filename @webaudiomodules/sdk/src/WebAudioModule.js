/* Minimal WebAudioModule shim to allow plugin classes that extend a
   WebAudioModule base to be created in this archive-based environment.
   This is intentionally small and only implements what the host and
   our Pieraudio plugin need: static createInstance(), initialize(),
   simple createGui/destroyGui hooks and wiring of audioContext.
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

  // Plugins should override createAudioNode(initialState)
  async createAudioNode(initialState) {
    return null;
  }

  async createGui() {
    // default GUI is an empty div
    const d = document.createElement('div');
    d.textContent = this.descriptor && this.descriptor.name ? this.descriptor.name : 'WAM Plugin';
    return d;
  }

  async destroyGui(dom) {
    try { if (dom && dom.remove) dom.remove(); } catch (e) { /* ignore */ }
  }

  // Static helper to instantiate a plugin class that extends WebAudioModule
  static async createInstance(hostGroupId, audioContext, initialState) {
    // `this` is the plugin class (subclass of WebAudioModule)
    const plugin = new this();
    plugin.audioContext = audioContext;
    await plugin.initialize(initialState);
    // create audio node if available
    if (typeof plugin.createAudioNode === 'function') {
      try {
        plugin.audioNode = await plugin.createAudioNode(initialState);
      } catch (err) {
        console.warn('WebAudioModule.createInstance: createAudioNode failed', err);
        throw err;
      }
    }
    plugin.module = plugin;
    return plugin;
  }
}

export default WebAudioModule;
