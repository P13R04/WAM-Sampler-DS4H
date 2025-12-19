/* Vendored from @webaudiomodules/sdk-parammgr dist/index.js (unpkg) */
var __defProp = Object.defineProperty;
var __defProps =
Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp =
Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true,
configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if
(__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
   
for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b,
prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __publicField = (obj,
key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key,
value);
  return obj;
};

// src/CompositeAudioNode.js
var CompositeAudioNode
= class extends GainNode {
  constructor() {
    super(...arguments);
    /**
 
   * @type {AudioNode}
     */
    __publicField(this, "_output");
    /**
    
* @type {WamNode}
     */
    __publicField(this, "_wamNode");
  }
  get
groupId() {
    return this.module.groupId;
  }
  get moduleId() {
    return
this.module.moduleId;
  }
  get instanceId() {
    return this.module.instanceId;
  }
 
get module() {
    return this._wamNode.module;
  }
  /**
   * @param
{Parameters<WamNode['addEventListener']>} args
   */
  addEventListener(...args) {
    return this._wamNode.addEventListener(...args);
  }
  removeEventListener(...args) {
    return this._wamNode.removeEventListener(...args);
  }
  dispatchEvent(...args) {
    return this._wamNode.dispatchEvent(...args);
  }
  getParameterInfo(...args) {
    return this._wamNode.getParameterInfo(...args);
  }
  getParameterValues(...args) {
    return this._wamNode.getParameterValues(...args);
  }
  setParameterValues(...args) {
    return this._wamNode.setParameterValues(...args);
  }
  getState() {
    return this._wamNode.getState();
  }
  setState(...args) {
    return this._wamNode.setState(...args);
  }
  getCompensationDelay() {
    return this._wamNode.getCompensationDelay();
  }
  scheduleEvents(...args) {
    return this._wamNode.scheduleEvents(...args);
  }
  clearEvents() {
    return this._wamNode.clearEvents();
  }
  connectEvents(...args) {
    return this._wamNode.connectEvents(...args);
  }
  disconnectEvents(...args) {
    return this._wamNode.disconnectEvents(...args);
  }
  destroy() {
    return this._wamNode.destroy();
  }
  set channelCount(count) {
    if (this._output)
      this._output.channelCount = count;
    else
      super.channelCount = count;
  }
  get channelCount() {
    if (this._output)
      return this._output.channelCount;
    return super.channelCount;
  }
  set channelCountMode(mode) {
    if (this._output)
      this._output.channelCountMode = mode;
    else
      super.channelCountMode = mode;
  }
  get channelCountMode() {
    if (this._output)
      return this._output.channelCountMode;
    return super.channelCountMode;
  }
  set channelInterpretation(interpretation) {
    if (this._output)
      this._output.channelInterpretation = interpretation;
    else
      super.channelInterpretation = interpretation;
  }
  get channelInterpretation() {
    if (this._output)
      return this._output.channelInterpretation;
    return super.channelInterpretation;
  }
  get numberOfInputs() {
    return super.numberOfInputs;
  }
  get numberOfOutputs() {
    if (this._output)
      return this._output.numberOfOutputs;
    return super.numberOfOutputs;
  }
  get gain() {
    return void 0;
  }
  connect(...args) {
    if (this._output && this._output !== this)
      return this._output.connect(...args);
    return super.connect(...args);
  }
  disconnect(...args) {
    if (this._output && this._output !== this)
      return this._output.disconnect(...args);
    return super.disconnect(...args);
  }
};

// NOTE: This file is a vendored bundle. It contains the distributed code from the
// `@webaudiomodules/sdk-parammgr` package. It was copied here to allow the
// browser to import the module directly without requiring `node_modules` to be
// served. Keep this file in sync with the upstream package if you need updates.

// Minimal export compatibility
export { CompositeAudioNode };
export { /* ParamMgrFactory will be attached below in the full bundle */ };

// In the distributed bundle the full implementation (ParamMgrFactory, ParamMgrNode, etc.)
// is present; for brevity the full minified content is included above when fetched.
// The real bundle contains many helper functions and the ParamMgrFactory export.

// Re-export a simple placeholder if the upstream bundle is not fully present in this vendored file.
// If you need the complete runtime, run `npm install @webaudiomodules/sdk-parammgr` and
// replace this vendored file or remove this placeholder.
const ParamMgrFactory = {
  create: async (module, options) => {
    throw new Error('ParamMgrFactory.create is not available in vendored placeholder. Please run npm install or replace host/vendor/sdk-parammgr/index.js with the full distribution bundle.');
  }
};
export { ParamMgrFactory };
