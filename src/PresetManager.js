/**
 * PresetManager – Sauvegarde/chargement de l'état du sampler
 * 
 * Version REST : utilise l'API serveur local avec fallback localStorage
 * Stockage serveur : presets (JSON) + samples (fichiers audio)
 * 
 * @author Pierre Constantin, Baptiste Giacchero
 */
export default class PresetManager {
  /**
   * @param {string} namespace - clé de base pour localStorage (fallback)
   * @param {string} serverUrl - URL du serveur REST
   */
  constructor(namespace = 'wam-sampler-clean', serverUrl = 'http://localhost:3000') {
    this.ns = namespace;
    this.serverUrl = serverUrl;
    this.isOnline = true;
    this._checkServerHealth();
  }

  /**
   * Vérifie si le serveur est accessible
   * @private
   */
  async _checkServerHealth() {
    try {
      const res = await fetch(`${this.serverUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      this.isOnline = res.ok;
    } catch (e) {
      console.warn('Serveur REST inaccessible, fallback localStorage:', e.message);
      this.isOnline = false;
    }
  }

  _key(name) { return `${this.ns}:preset:${name}`; }
  _listKey() { return `${this.ns}:preset:list`; }

  /**
   * Sauvegarde un preset (paramètres + samples)
   * @param {string} name - Nom du preset
   * @param {object} state - Retour de audioNode.getState()
   * @param {Array} samples - Liste des samples [{padIndex, url, name}]
   * @returns {Promise<object>} Preset sauvegardé
   */
  async savePreset(name, state, samples = []) {
    if (!name) throw new Error('Nom de preset requis');

    // Mode serveur REST
    if (this.isOnline) {
      try {
        // Chercher si un preset existe déjà avec ce nom
        const res = await fetch(`${this.serverUrl}/api/presets`);
        const presets = await res.json();
        const existing = presets.find(p => p.name === name);

        if (existing) {
          // Mise à jour
          const updateRes = await fetch(`${this.serverUrl}/api/presets/${existing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, parameters: state, samples })
          });
          if (!updateRes.ok) throw new Error('Erreur mise à jour preset');
          return await updateRes.json();
        } else {
          // Création
          const createRes = await fetch(`${this.serverUrl}/api/presets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, parameters: state, samples })
          });
          if (!createRes.ok) throw new Error('Erreur création preset');
          return await createRes.json();
        }
      } catch (e) {
        console.warn('Fallback localStorage pour savePreset:', e.message);
        this.isOnline = false;
      }
    }

    // Fallback localStorage
    localStorage.setItem(this._key(name), JSON.stringify({ version: 1, state, samples }));
    const list = await this.listPresets();
    if (!list.includes(name)) {
      list.push(name);
      localStorage.setItem(this._listKey(), JSON.stringify(list));
    }
    return { name, state, samples };
  }

  /**
   * Charge un preset par nom
   * @param {string} name - Nom du preset
   * @returns {Promise<object|null>} {state, samples} ou null
   */
  async loadPreset(name) {
    // Mode serveur REST
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.serverUrl}/api/presets`);
        const presets = await res.json();
        const preset = presets.find(p => p.name === name);
        if (preset) {
          return {
            state: preset.parameters,
            samples: preset.samples || []
          };
        }
      } catch (e) {
        console.warn('Fallback localStorage pour loadPreset:', e.message);
        this.isOnline = false;
      }
    }

    // Fallback localStorage
    const raw = localStorage.getItem(this._key(name));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return {
        state: parsed.state || null,
        samples: parsed.samples || []
      };
    } catch (_) {
      return null;
    }
  }

  /**
   * Supprime un preset
   * @param {string} name - Nom du preset
   * @returns {Promise<boolean>} Succès
   */
  async deletePreset(name) {
    // Mode serveur REST
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.serverUrl}/api/presets`);
        const presets = await res.json();
        const preset = presets.find(p => p.name === name);
        
        if (preset) {
          const delRes = await fetch(`${this.serverUrl}/api/presets/${preset.id}`, {
            method: 'DELETE'
          });
          return delRes.ok;
        }
        return false;
      } catch (e) {
        console.warn('Fallback localStorage pour deletePreset:', e.message);
        this.isOnline = false;
      }
    }

    // Fallback localStorage
    localStorage.removeItem(this._key(name));
    const list = await this.listPresets();
    const filtered = list.filter(n => n !== name);
    localStorage.setItem(this._listKey(), JSON.stringify(filtered));
    return true;
  }

  /**
   * Liste des presets disponibles
   * @returns {Promise<string[]>} Noms des presets
   */
  async listPresets() {
    // Mode serveur REST
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.serverUrl}/api/presets`);
        if (!res.ok) throw new Error('Erreur serveur');
        const presets = await res.json();
        return presets.map(p => p.name);
      } catch (e) {
        console.warn('Fallback localStorage pour listPresets:', e.message);
        this.isOnline = false;
      }
    }

    // Fallback localStorage
    const raw = localStorage.getItem(this._listKey());
    if (!raw) return [];
    try { return JSON.parse(raw) || []; } catch (_) { return []; }
  }

  /**
   * Upload un sample vers le serveur
   * @param {File} file - Fichier audio
   * @returns {Promise<object>} {url, filename, size}
   */
  async uploadSample(file) {
    if (!this.isOnline) {
      throw new Error('Upload samples nécessite le serveur REST');
    }

    const formData = new FormData();
    formData.append('audio', file);

    const res = await fetch(`${this.serverUrl}/api/samples`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Erreur upload: ${res.statusText}`);
    }

    return await res.json();
  }
}
