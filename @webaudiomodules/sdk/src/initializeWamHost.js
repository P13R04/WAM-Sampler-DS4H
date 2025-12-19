/* Minimal shim of initializeWamHost for local archive usage.
   This provides a tiny runtime so the host can start when the full SDK
   submodule is not present. It intentionally implements only a small
   subset of the real SDK behaviour needed by the example host/plugins.
*/

export default async function initializeWamHost(audioContext, hostGroupId) {
  // expose a minimal global object so plugins and host can find the audioContext
  if (!window.__WAM) window.__WAM = {};
  window.__WAM.audioContext = audioContext;
  window.__WAM.hostGroupId = hostGroupId;

  // Return an array similar to the real implementation ([hostGroup, key])
  const hostKey = `${hostGroupId}-local-host-key`;
  console.info('[initializeWamHost shim] WAM env initialized', { hostGroupId, hostKey });
  return [hostGroupId, hostKey];
}
