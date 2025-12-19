# Bonnes Pratiques WAM - Sampler Clean

Guide des principes et patterns appliqués dans ce projet pour maintenir un code propre, performant et conforme WAM 2.0.

---

## 🏛️ Architecture WAM

### Principe fondamental : Séparation DSP/GUI

**RÈGLE D'OR** : Le Node audio (DSP) ne doit **jamais** connaître l'existence de la GUI.

#### ✅ CORRECT

```javascript
// GUI → DSP : via API publique
class SamplerElement extends HTMLElement {
  _playPad(index) {
    this.audioNode.playPad(index, 0.85);
  }
}

// DSP → GUI : via événements WAM (si nécessaire)
class SamplerNode extends CompositeAudioNode {
  playPad(index) {
    // ... logique audio pure
    this.dispatchEvent(new CustomEvent('pad-played', { detail: { index } }));
  }
}
```

#### ❌ INTERDIT

```javascript
// DSP qui dépend de la GUI
class SamplerNode {
  constructor(gui) {
    this.gui = gui; // NON !
  }
  
  playPad(index) {
    this.gui.updatePadDisplay(index); // NON !
  }
}
```

---

## 🎛️ Gestion des Paramètres

### ParamMgr : Hub central pour automation

Tous les paramètres modifiables doivent passer par le **ParamMgr** pour être automatisables via WAM.

#### Configuration correcte

```javascript
_createParamsConfig(samplerNode) {
  return {
    pad0_volume: {
      defaultValue: 1.0,
      minValue: 0,
      maxValue: 2,
      onChange: (value) => { samplerNode.setPadVolume(0, value); }
    }
  };
}
```

#### Points clés
- **onChange** : callback appelé automatiquement par ParamMgr
- **Setter dans le Node** : la logique audio reste dans le DSP
- **Pas de logique métier dans onChange** : juste délégation

---

## 🎵 Audio Graph

### Pattern CompositeAudioNode

```javascript
class SamplerNode extends CompositeAudioNode {
  createNodes() {
    this.masterGain = this.context.createGain();
    // ... autres nodes
  }
  
  connectNodes() {
    // Connecter le graphe interne
    this.pads.forEach(pad => pad.connect(this.masterGain));
    
    // Définir la sortie composite
    this._output = this.masterGain;
  }
}
```

#### Règles
- `_input` : entrée du composite (inutilisée pour un instrument)
- `_output` : sortie du composite (obligatoire)
- Connexions internes dans `connectNodes()`
- Pas de connexion directe à `audioContext.destination` dans le Node

---

## 🔄 Polyphonie et Gestion Mémoire

### Problème : Fuites mémoire avec polyphonie illimitée

```javascript
// ❌ MAUVAIS : polyphonie illimitée
play() {
  const source = this.context.createBufferSource();
  source.buffer = this.buffer;
  source.connect(this.output);
  source.start();
  // Oubli de cleanup → fuite !
}
```

### Solution : Pool avec limite stricte

```javascript
// ✅ BON : pool avec limite
class SamplePad {
  constructor() {
    this.activeSources = [];
    this.maxPolyphony = 3;
  }
  
  play() {
    // Cleanup des sources terminées
    this._cleanupFinishedSources();
    
    // Arrêter les plus vieilles si limite atteinte
    while (this.activeSources.length >= this.maxPolyphony) {
      const oldest = this.activeSources.shift();
      oldest.source.stop();
      oldest.source.disconnect();
      oldest.gain.disconnect();
    }
    
    // Créer nouvelle source
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.connect(gain).connect(this.output);
    
    this.activeSources.push({ source, gain });
    
    source.start();
    source.onended = () => {
      // Marquer comme terminée pour cleanup
      entry.finished = true;
      source.disconnect();
      gain.disconnect();
    };
  }
  
  _cleanupFinishedSources() {
    this.activeSources = this.activeSources.filter(e => !e.finished);
  }
}
```

#### Points clés
- **Limite stricte** : `maxPolyphony = 3` (ajustable)
- **Cleanup automatique** : `onended` + `_cleanupFinishedSources()`
- **Déconnexion immédiate** : `disconnect()` dès que terminé
- **FIFO** : les plus vieilles sources sont arrêtées en premier

---

## ⌨️ Mapping Clavier Universel

### Problème : KeyboardEvent.key dépend du layout

```javascript
// ❌ MAUVAIS : dépend du layout
window.addEventListener('keydown', (e) => {
  if (e.key === 'a') playPad(0); // 'a' en QWERTY, 'q' en AZERTY !
});
```

### Solution : KeyboardEvent.code (touches physiques)

```javascript
// ✅ BON : indépendant du layout
const KEY_MAPPING = {
  'KeyA': 0,  // Touche physique "A" (première colonne gauche)
  'KeyZ': 1,  // Touche physique "Z" (deuxième colonne gauche)
  'Digit1': 0 // Touche numérique "1"
};

window.addEventListener('keydown', (e) => {
  const padIndex = KEY_MAPPING[e.code];
  if (padIndex !== undefined) {
    e.preventDefault();
    playPad(padIndex);
  }
});
```

#### Avantages
- Fonctionne sur **tous** les layouts (AZERTY, QWERTY, QWERTZ, DVORAK, etc.)
- Mapping **prévisible** : même disposition physique partout
- Codes **standards** : `KeyA`, `Digit1`, `Space`, etc.

---

## 💾 Sérialisation d'État

### Principe : Léger et restaurable

```javascript
// ✅ BON : état léger
getState() {
  return {
    version: '1.0.0',
    masterVolume: this.masterGain.gain.value,
    pads: this.pads.map(pad => ({
      volume: pad.gainNode.gain.value,
      pan: pad.pannerNode.pan.value,
      pitch: pad.pitch,
      trimStart: pad.trimStart,
      trimEnd: pad.trimEnd,
      tone: pad.tone,
      reverse: pad.reverse
      // Pas de buffer : trop gros !
    }))
  };
}
```

#### Règles
- **Version** : pour migrations futures
- **Paramètres numériques uniquement** : pas de buffers
- **Restauration via setState()** : appliquer tous les setters
- **Buffers séparés** : gestion externe (localStorage, IndexedDB, URL, etc.)

---

## 🎨 GUI Compacte

### Objectif : Pas de scroll, tout visible

```css
/* Taille fixe compacte */
:host {
  width: 340px;
}

/* Grille 4×4 serrée */
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

/* Pads de taille fixe */
.pad {
  height: 64px;
}
```

#### Principes
- **Taille fixe** : pas de `min-width`, juste `width`
- **Grid layout** : responsive naturel
- **Contrôles essentiels** : charger, vider, volume, mute
- **Status bar** : feedback utilisateur clair
- **Pas de tabs/accordéons** : tout visible d'un coup

---

## 🧹 Code Propre

### Commentaires en français

```javascript
/**
 * Jouer le sample du pad
 * @param {number} velocity - Vélocité de lecture (0-1)
 */
play(velocity = 1.0) {
  // Validation du trim
  if (this.trimStart >= this.trimEnd) {
    console.warn(`[Pad ${this.index}] Trim invalide`);
    return;
  }
  
  // Cleanup des sources terminées
  this._cleanupFinishedSources();
  
  // ... logique métier
}
```

#### Règles
- **JSDoc en français** : descriptions claires
- **Commentaires inline** : expliquer le "pourquoi", pas le "quoi"
- **Noms explicites** : `_cleanupFinishedSources()` au lieu de `_cleanup()`
- **Pas de code mort** : supprimer le code commenté

### Organisation des fichiers

```
src/
  index.js          # Factory WAM (createInstance, createGui)
  Node.js           # DSP pur (SamplerNode + SamplePad)
  descriptor.json   # Métadonnées
  gui/
    index.js        # Factory GUI
    SamplerElement.js  # Web Component
```

#### Principes
- **Un fichier = un rôle** : pas de fichiers fourre-tout
- **Imports explicites** : pas de `import *`
- **Pas de dépendances cachées** : tout via imports ES6
- **SDK séparé** : réutilisable par d'autres plugins

---

## 🚫 Pièges à Éviter

### 1. Créer des nodes dans le constructor

```javascript
// ❌ MAUVAIS
constructor(context) {
  super(context);
  this.masterGain = context.createGain(); // Trop tôt !
}

// ✅ BON
constructor(context) {
  super(context);
  this.createNodes();
}

createNodes() {
  this.masterGain = this.context.createGain();
}
```

### 2. Oublier disconnect()

```javascript
// ❌ MAUVAIS : fuite mémoire
source.start();
source.onended = () => {
  // Oubli de disconnect !
};

// ✅ BON
source.onended = () => {
  source.disconnect();
  gain.disconnect();
};
```

### 3. Modifier l'AudioParam directement

```javascript
// ❌ MAUVAIS : clics audibles
this.gainNode.gain.value = 0.5;

// ✅ BON : rampe smooth
this.gainNode.gain.setValueAtTime(0.5, this.context.currentTime);
```

### 4. Ignorer l'état suspended de l'AudioContext

```javascript
// ❌ MAUVAIS : pas de son !
const ctx = new AudioContext();
plugin.audioNode.connect(ctx.destination);

// ✅ BON : resume au premier clic
window.addEventListener('click', () => {
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}, { once: true });
```

---

## ✅ Checklist avant commit

- [ ] Pas de logique GUI dans le DSP
- [ ] Tous les paramètres passent par ParamMgr
- [ ] Polyphonie limitée avec cleanup
- [ ] Mapping clavier via `KeyboardEvent.code`
- [ ] État sérialisable (pas de buffers)
- [ ] Commentaires en français
- [ ] Pas de `console.log` en production
- [ ] Tests manuels OK (chargement, lecture, mapping)
- [ ] Pas de fuites mémoire (vérifier DevTools Memory)

---

## 📚 Références

- [WAM Specification](https://webaudiomodules.org/specification/)
- [Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [KeyboardEvent.code Values](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code)
