(function(){
  // Minimal WamEnv module for AudioWorkletGlobalScope
  /** @type {any} */
  const audioWorkletGlobalScope = globalThis;
  if (audioWorkletGlobalScope.webAudioModules && audioWorkletGlobalScope.webAudioModules._inited) return;

  const moduleScopes = new Map();
  const groups = new Map();

  function createFallbackGroup(id) {
    const wams = new Set();
    return {
      groupId: id,
      validate: () => true,
      addWam: (wam) => { wams.add(wam); },
      removeWam: (wam) => { wams.delete(wam); },
      connectEvents: () => {},
      disconnectEvents: () => {},
      emitEvents: (from, ...events) => { wams.forEach(w => { try { if (typeof w.handleEvent === 'function') w.handleEvent(...events); } catch(_){} }); }
    };
  }

  class WamEnv {
    constructor() {}
    get apiVersion(){ return '1.0.0'; }
    getModuleScope(moduleId){ if (!moduleScopes.has(moduleId)) moduleScopes.set(moduleId, {}); return moduleScopes.get(moduleId); }
    getGroup(groupId){ return groups.get(groupId); }
    addGroup(group){ if (!groups.has(group.groupId)) groups.set(group.groupId, group); }
    removeGroup(group){ groups.delete(group.groupId); }
    addWam(wam){ let group = groups.get(wam.groupId); if (!group) { group = createFallbackGroup(wam.groupId || 'default'); groups.set(wam.groupId || 'default', group); } group.addWam(wam); }
    removeWam(wam){ const group = groups.get(wam.groupId); if (group) group.removeWam(wam); }
    connectEvents(g, a, b, out){ const group = groups.get(g); if (group) group.connectEvents(a,b,out); }
    disconnectEvents(g, a, b, out){ const group = groups.get(g); if (group) group.disconnectEvents(a,b,out); }
    emitEvents(from, ...events){ const group = groups.get(from.groupId); if (group) group.emitEvents(from, ...events); }
    // Helper to initialize a group from the host side
    initializeWamGroup(groupId) {
      if (!groups.has(groupId)) groups.set(groupId, createFallbackGroup(groupId));
      return groups.get(groupId);
    }
  }

  audioWorkletGlobalScope.webAudioModules = new WamEnv();
  audioWorkletGlobalScope.webAudioModules._inited = true;

  // Pre-create common standalone groups so ParamMgr processors can register immediately
  try {
    audioWorkletGlobalScope.webAudioModules.initializeWamGroup('standalone');
    audioWorkletGlobalScope.webAudioModules.initializeWamGroup('headless-host');
  } catch (e) {
    // ignore
  }
})();
