/**
 * Shim minimal de ParamMgrFactory pour le développement Phase 1
 * Ce fichier permet de tester le plugin sans installer le vrai SDK
 * À remplacer par le vrai package @webaudiomodules/sdk-parammgr en production
 */

/**
 * Normaliser un nom de paramètre
 * Accepte '/plugin/param' ou 'param' -> retourne 'param'
 */
function normalizeName(name) {
  if (!name) return name;
  const parts = name.split('/');
  return parts[parts.length - 1];
}

/**
 * ParamMgrNode gère les paramètres d'un plugin
 */
class ParamMgrNode {
  constructor(plugin, optionsIn = {}) {
    this.plugin = plugin;
    this.paramsConfig = optionsIn.paramsConfig || {};
    this.internalParamsConfig = optionsIn.internalParamsConfig || {};
    this.paramsMapping = optionsIn.paramsMapping || {};
    this.values = {};
    this._listeners = {};

    // Initialiser les valeurs par défaut
    Object.entries(this.internalParamsConfig).forEach(([k, v]) => {
      this.values[k] = (v && typeof v.defaultValue !== 'undefined') ? v.defaultValue : 0;
    });
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
    // Retourner la config des paramètres
    return this.internalParamsConfig;
  }

  getParamValue(name) {
    const n = normalizeName(name);
    return this.values[n];
  }

  setParamValue(name, value) {
    const n = normalizeName(name);
    this.values[n] = value;

    // Propager au internalParamsConfig
    const internal = this.internalParamsConfig[n];
    if (internal) {
      // Si onChange présent
      if (typeof internal.onChange === 'function') {
        internal.onChange(value);
      }

      // Si mapping vers AudioParam
      Object.entries(internal).forEach(([subKey, target]) => {
        if (!target || subKey === 'onChange' || subKey === 'defaultValue' || subKey === 'minValue' || subKey === 'maxValue') return;

        try {
          // Si target ressemble à un AudioParam
          if (typeof target.value !== 'undefined') {
            const mapping = (this.paramsMapping && this.paramsMapping[n] && this.paramsMapping[n][subKey]) || null;
            let mapped = value;

            if (mapping && mapping.sourceRange && mapping.targetRange) {
              const [s0, s1] = mapping.sourceRange;
              const [t0, t1] = mapping.targetRange;
              const norm = (value - s0) / (s1 - s0 || 1);
              mapped = t0 + norm * (t1 - t0);
            }

            target.value = mapped;
          } else if (typeof target.setValueAtTime === 'function') {
            target.setValueAtTime(value, this.plugin.audioContext ? this.plugin.audioContext.currentTime : 0);
          }
        } catch (e) {
          if (typeof target === 'function') {
            try { target(value); } catch (er) { /* ignore */ }
          }
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

/**
 * Factory pour créer un ParamMgrNode
 */
export const ParamMgrFactory = {
  create: async (plugin, optionsIn) => {
    return new ParamMgrNode(plugin, optionsIn);
  }
};

export default ParamMgrFactory;
