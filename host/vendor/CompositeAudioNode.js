/**
 * CompositeAudioNode minimal implementation
 * Extends GainNode and proxies WAM API methods to _wamNode
 */
export default class CompositeAudioNode extends GainNode {
  /**
   * @type {AudioNode}
   */
  _output = undefined;

  /**
   * @type {any} ParamMgrNode
   */
  _wamNode = undefined;

  get groupId() {
    return this._wamNode?.module?.groupId;
  }

  get moduleId() {
    return this._wamNode?.module?.moduleId;
  }

  get instanceId() {
    return this._wamNode?.module?.instanceId;
  }

  get module() {
    return this._wamNode?.module;
  }

  /**
   * Proxy WAM API methods to _wamNode
   */
  async getParameterInfo(...args) {
    return this._wamNode?.getParameterInfo?.(...args);
  }

  async getParameterValues(...args) {
    return this._wamNode?.getParameterValues?.(...args) || {};
  }

  async setParameterValues(...args) {
    return this._wamNode?.setParameterValues?.(...args);
  }

  async getState() {
    return this._wamNode?.getState?.() || {};
  }

  async setState(...args) {
    return this._wamNode?.setState?.(...args);
  }

  async getCompensationDelay() {
    return this._wamNode?.getCompensationDelay?.() || 0;
  }

  async scheduleEvents(...args) {
    return this._wamNode?.scheduleEvents?.(...args);
  }

  async clearEvents(...args) {
    return this._wamNode?.clearEvents?.(...args);
  }

  // Override connect to use _output if set
  connect(destination, ...args) {
    if (this._output) {
      return this._output.connect(destination, ...args);
    }
    return super.connect(destination, ...args);
  }

  disconnect(...args) {
    if (this._output) {
      return this._output.disconnect(...args);
    }
    return super.disconnect(...args);
  }
}
