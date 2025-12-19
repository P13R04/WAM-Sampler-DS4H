/**
 * Factory pour créer la GUI du sampler WAM
 * @param {SamplerPlugin} plugin - Instance du plugin
 * @returns {SamplerElement} Web Component
 */
import SamplerElement from './SamplerElement.js';

export function createElement(plugin) {
  const element = document.createElement('wam-sampler');
  element.setPlugin(plugin);
  return element;
}

export default createElement;
