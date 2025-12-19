/* Minimal ParamMgrFactory shim implementing a simple ParamMgrNode
   that stores parameter values and maps them to internal AudioParams
   or onChange handlers when available.
*/

function normalizeName(name) {
  // Accept names like '/Pieraudio/drive' or 'drive' -> return 'drive'
  if (!name) return name;
  const parts = name.split('/');
  return parts[parts.length - 1];
}

class ParamMgrNode {
  constructor(plugin, optionsIn = {}) {
    this.plugin = plugin;
    this.paramsConfig = optionsIn.paramsConfig || {};
    this.internalParamsConfig = optionsIn.internalParamsConfig || {};
    this.paramsMapping = optionsIn.paramsMapping || {};
    this.values = {};
    // initialize defaults
    Object.entries(this.paramsConfig).forEach(([k, v]) => {
      this.values[k] = (v && typeof v.defaultValue !== 'undefined') ? v.defaultValue : 0;
    });
    this._listeners = {};
  }

  addEventListener(name, cb) {
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(cb);
  }

  dispatchEvent(name, detail) {
    const list = this._listeners[name] || [];
    list.forEach((cb) => {
      try { cb({ detail }); } catch (e) { console.warn('ParamMgr listener error', e); }
    });
  }

  async getParameterInfo() {
    // return the paramsConfig as-is (simple shape)
    return this.paramsConfig;
  }

  getParamValue(name) {
    const n = normalizeName(name);
    return this.values[n];
  }

  setParamValue(name, value) {
    const n = normalizeName(name);
    this.values[n] = value;
    // propagate to internalParamsConfig
    const internal = this.internalParamsConfig[n];
    if (internal) {
      // if onChange present at top level
      if (typeof internal.onChange === 'function') internal.onChange(value);
      // if internal is object mapping to AudioParams or gain nodes
      Object.entries(internal).forEach(([subKey, target]) => {
        if (!target) return;
        // if target looks like an AudioParam or AudioParam-like (has 'value')
        try {
          if (typeof target.value !== 'undefined') {
            // simple mapping: if paramsMapping exists, use it
            const mapping = (this.paramsMapping && this.paramsMapping[n] && this.paramsMapping[n][subKey]) || null;
            let mapped = value;
            if (mapping && mapping.sourceRange && mapping.targetRange) {
              const [s0, s1] = mapping.sourceRange;
              const [t0, t1] = mapping.targetRange;
              const norm = (value - s0) / (s1 - s0 || 1);
              mapped = t0 + norm * (t1 - t0);
            }
            // default special-case for delayTime if target name contains 'delay'
            if (subKey.toLowerCase().includes('delay') && (mapped >= 0 && mapped <= 1)) {
              mapped = 0.01 + mapped * 1.0;
            }
            target.value = mapped;
          } else if (typeof target.setValueAtTime === 'function') {
            // some AudioParam objects expose setValueAtTime
            target.setValueAtTime(value, this.plugin.audioContext ? this.plugin.audioContext.currentTime : 0);
          }
        } catch (e) {
          // if target is function-like
          if (typeof target === 'function') try { target(value); } catch (er) { /* ignore */ }
        }
      });
    }
    return Promise.resolve();
  }

  getParamsValues() {
    return this.values;
  }

  setParamsValues(values) {
    Object.entries(values).forEach(([k, v]) => this.setParamValue(k, v));
    return Promise.resolve();
  }
}

const ParamMgrFactory = {
  async create(plugin, optionsIn) {
    return new ParamMgrNode(plugin, optionsIn);
  },
};

export default ParamMgrFactory;
