/* Minimal WebAudioModule shim for standalone usage
   This provides a lightweight base class so plugin factories can
   `extends WebAudioModule` when running without the full @webaudiomodules/sdk.
   It implements a compatible `createInstance` helper and a no-op
   `initialize` method used by many plugins.
*/

export default class WebAudioModule {
  constructor() {
    this.state = {};
    this.audioContext = undefined;
    this.groupId = undefined;
    this.audioNode = undefined;
  }

  async initialize(state) {
    this.state = state || {};
    return this;
  }

  static async createInstance(groupId, audioContext, initialState) {
    const plugin = new this();
    plugin.groupId = groupId;
    plugin.audioContext = audioContext;
    await plugin.initialize(initialState);
    if (typeof plugin.createAudioNode === 'function') {
      try {
        plugin.audioNode = await plugin.createAudioNode(initialState);
      } catch (err) {
        // propagate error
        throw err;
      }
    }
    plugin.module = plugin;
    return plugin;
  }
}
