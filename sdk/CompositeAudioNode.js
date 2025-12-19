/**
 * Shim minimal de CompositeAudioNode pour le développement Phase 1
 * Ce fichier permet de tester le plugin sans installer le vrai SDK
 * À remplacer par le vrai package @webaudiomodules/sdk-parammgr en production
 */

/**
 * CompositeAudioNode encapsule un graphe audio complexe
 * en un seul nœud qui peut être connecté/déconnecté facilement
 */
export class CompositeAudioNode {
  constructor(context, options = {}) {
    this.context = context;
    this.options = options;
    this._input = null;
    this._output = null;
  }

  /**
   * Connecter la sortie du composite à une destination
   */
  connect(destination, outputIndex, inputIndex) {
    if (!this._output) {
      throw new Error('CompositeAudioNode: No output node defined. Set this._output in your subclass.');
    }
    return this._output.connect(destination, outputIndex, inputIndex);
  }

  /**
   * Déconnecter la sortie
   */
  disconnect(destination, output, input) {
    if (this._output) {
      return this._output.disconnect(destination, output, input);
    }
  }

  /**
   * Obtenir l'entrée du composite (si définie)
   */
  get input() {
    return this._input;
  }

  /**
   * Obtenir la sortie du composite
   */
  get output() {
    return this._output;
  }
}

export default CompositeAudioNode;
