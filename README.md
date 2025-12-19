# 🎛️ WAM Sampler Clean

**Sampler professionnel 16 pads conforme Web Audio Module v2.0 avec serveur REST intégré**

Version nettoyée, compacte et maintenable du sampler DS4H. Code commenté en français, architecture WAM stricte, serveur REST pour presets et samples, prêt pour déploiement multi-utilisateurs.

---

## 📋 Caractéristiques

### Sampler
✅ **16 pads audio** avec lecture polyphonique (3 voix/pad)  
✅ **Paramètres par pad** : volume, pan, pitch, tone (filtre), trim start/end, reverse  
✅ **Master volume** avec mute  
✅ **Mapping clavier universel** : détection physique (AZERTY/QWERTY/QWERTZ compatible)  
✅ **Drag & drop** : charger des samples directement sur la grille  
✅ **Interface compacte** : 340px, pas de scroll nécessaire  
✅ **Architecture WAM stricte** : DSP totalement séparé de la GUI  
✅ **113 paramètres automatisables** via ParamMgr  
✅ **Mode headless** : fonctionne sans GUI  

### Serveur REST (Nouveau !)
✅ **API REST complète** : CRUD presets + upload samples  
✅ **Stockage persistant** : JSON (presets) + fichiers audio (samples)  
✅ **Fallback localStorage** : mode offline automatique  
✅ **Architecture évolutive** : prêt pour authentification et partage  
✅ **Documentation complète** : API docs, guides, exemples  
✅ **Tests intégrés** : scripts curl + interface web interactive  

---

## 🚀 Démarrage Rapide

### Option 1 : Script automatique (recommandé)
```bash
cd wam-sampler-clean
./start.sh --open
```

Ce script démarre automatiquement :
- Serveur REST API (port 3000)
- Serveur HTTP static (port 5500)
- Ouvre le sampler dans le navigateur

### Option 2 : Démarrage manuel

**1. Serveur REST** (presets + samples)
```bash
cd wam-sampler-clean/server
npm install  # Première fois seulement
npm run dev  # Mode développement avec auto-reload
```

**2. Serveur HTTP** (sampler)
```bash
cd wam-sampler-clean
python3 -m http.server 5500
```

**3. Ouvrir dans le navigateur**
- **Sampler WAM** : http://localhost:5500/host/wam-host.html
- **Sampler Standalone** : http://localhost:5500/host/standalone.html
- **Test API** : http://localhost:5500/server/test-ui.html

---

## 💾 Gestion des Presets

### Mode Serveur (recommandé)
Quand le serveur REST est actif :
- ✅ Presets sauvegardés dans `server/data/presets/*.json`
- ✅ Accessibles depuis n'importe quel navigateur
- ✅ Préparé pour partage multi-utilisateurs
- ✅ Upload et stockage samples sur serveur

### Mode Offline (fallback automatique)
Si le serveur n'est pas accessible :
- 🔄 Bascule automatique sur localStorage
- ⚠️ Presets locaux au navigateur uniquement
- 💾 Pas de synchronisation possible

### Dans l'interface
1. **Sauvegarder** : Configurez vos pads → Nommez → "💾 Sauver"
2. **Charger** : Sélectionnez dans la liste → "📥 Charger"
3. **Supprimer** : Sélectionnez → "🗑️ Supprimer"

---

## 🎹 Contrôles

### Mapping clavier universel (détection physique)

Le sampler détecte les touches physiques via `KeyboardEvent.code`, garantissant un fonctionnement identique sur **tous les layouts clavier** (AZERTY, QWERTY, QWERTZ, DVORAK, etc.).

**Pads 1-8** :
- `1 2 3 4 5 6 7 8` (rangée numérique)
- `A Z E R T Y U I` (rangée supérieure AZERTY) / `Q W E R T Y U I` (QWERTY)

**Pads 9-16** :
- `Q S D F G H J K` (rangée centrale AZERTY) / `A S D F G H J K` (QWERTY)

**Pads 1-4 (alternatif)** :
- `W X C V` (rangée inférieure)

### Interface graphique

- **Sélection de pad** : Clic sur un pad (bordure bleue)
- **Lecture** : Clic sur un pad chargé
- **Charger un sample** : Bouton `📁 Charger` ou drag & drop sur la grille
- **Vider un pad** : Sélectionner puis bouton `🗑️ Vider`
- **Volume master** : Slider + affichage pourcentage
- **Mute** : Bouton Mute/Unmute

### Drag & Drop
Glissez un fichier audio (`.wav`, `.mp3`, `.ogg`, `.flac`, etc.) sur la grille de pads. Le sample sera chargé sur le pad actuellement sélectionné.

---

## 🏗️ Architecture

```
wam-sampler-clean/
├── src/
│   ├── index.js              # Plugin WAM (factory)
│   ├── Node.js               # Moteur DSP (SamplerNode + SamplePad)
│   ├── descriptor.json       # Métadonnées WAM
│   └── gui/
│       ├── index.js          # Factory GUI
│       └── SamplerElement.js # Web Component compact
│
├── sdk/                      # SDK WAM (copié depuis wam-sampler)
│   ├── WebAudioModule.js     # Classe de base WAM
│   ├── CompositeAudioNode.js # Pattern composite pour audio nodes
│   └── ParamMgrFactory.js    # Gestionnaire de paramètres
│
├── host/
│   ├── standalone.html       # Test direct (sans initializeWamHost)
│   └── wam-host.html         # Host WAM officiel
│
├── tests/                    # Tests et notes
└── README.md                 # Ce fichier
```

### Séparation DSP/GUI

**Principe fondamental WAM** : Le Node DSP (`Node.js`) ne connaît **pas** la GUI et fonctionne de manière totalement autonome.

```javascript
// ✅ CORRECT : Communication via API publique
gui.addEventListener('click', (e) => {
    plugin.audioNode.playPad(e.padIndex, 0.85);
});

// ❌ INTERDIT : Accès direct ou référence GUI dans DSP
plugin.audioNode.gui = gui; // NON !
plugin.audioNode.updateDisplay(); // NON !
```

### Graphe audio

```
[BufferSource] 
    → [VelocityGain] 
    → [PadGain] 
    → [Filter (tone)] 
    → [StereoPanner] 
    → [MasterGain] 
    → [Destination]
```

Chaque pad a son propre graphe indépendant connecté au master gain.

---

## 🔧 API Reference

### Mode Standalone

```javascript
import SamplerPlugin from './src/index.js';

const audioContext = new AudioContext();
const plugin = await SamplerPlugin.createInstance('host', audioContext);

// Connecter à la sortie
plugin.audioNode.connect(audioContext.destination);

// Charger un sample dans le pad 0
const response = await fetch('kick.wav');
const arrayBuffer = await response.arrayBuffer();
const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
plugin.audioNode.loadSample(0, audioBuffer);

// Jouer le pad 0 avec vélocité 0.8
plugin.audioNode.playPad(0, 0.8);

// Modifier des paramètres
plugin.audioNode.setParamValue('pad0_volume', 1.5);
plugin.audioNode.setParamValue('pad0_pan', -0.5); // Gauche
plugin.audioNode.setParamValue('pad0_pitch', 1.2); // +20% vitesse
plugin.audioNode.setParamValue('pad0_tone', 0.5);  // Filtre mi-ouvert

// Sauvegarder l'état
const state = plugin.audioNode.getState();
localStorage.setItem('samplerState', JSON.stringify(state));

// Restaurer l'état
const savedState = JSON.parse(localStorage.getItem('samplerState'));
plugin.audioNode.setState(savedState);
```

### Mode WAM (avec initializeWamHost)

```javascript
// Initialiser le host WAM
const { default: initializeWamHost } = await import(
  'https://www.webaudiomodules.com/sdk/2.0.0-alpha.6/src/initializeWamHost.js'
);
const [hostGroupId] = await initializeWamHost(audioContext);

// Charger le plugin avec hostGroupId
const { default: SamplerPlugin } = await import('./src/index.js');
const sampler = await SamplerPlugin.createInstance(hostGroupId, audioContext);

// Le reste est identique
sampler.audioNode.connect(audioContext.destination);
```

### Paramètres exposés (113 total)

**Globaux** :
- `masterVolume` : 0-2 (default 1.0)

**Par pad (×16)** :
- `pad{N}_volume` : 0-2 (default 1.0)
- `pad{N}_pan` : -1 à 1 (default 0)
- `pad{N}_pitch` : 0.5-2.0 (default 1.0)
- `pad{N}_trimStart` : 0-1 (default 0)
- `pad{N}_trimEnd` : 0-1 (default 1)
- `pad{N}_tone` : -1 à 1 (default 1.0, fully open)
- `pad{N}_reverse` : 0-1 (default 0)

---

## 📝 Bonnes pratiques appliquées

✅ **Séparation stricte DSP/GUI** : Le Node audio ne dépend pas de la GUI  
✅ **ParamMgr pour automation** : Tous les paramètres sont exposés WAM  
✅ **Polyphonie limitée** : 3 voix/pad max pour éviter les fuites mémoire  
✅ **Cleanup agressif** : Sources audio terminées déconnectées immédiatement  
✅ **Mapping clavier universel** : `KeyboardEvent.code` (physique) au lieu de `.key`  
✅ **Pas de dépendances externes** : Uniquement SDK WAM local  
✅ **Code commenté en français** : Maintenance facilitée  
✅ **Architecture modulaire** : Chaque fichier a un rôle clair  
✅ **Styles inline GUI** : Pas de CSS externe à gérer  

---

## 🛣️ Roadmap (améliorations futures)

### Court terme
- [ ] Presets utilisateur avec localStorage
- [ ] Indicateurs de voix actives par pad
- [ ] Bouton "Clear All"
- [ ] Affichage nom de fichier sur les pads

### Moyen terme
- [ ] Enregistrement micro intégré
- [ ] Browser de sons (Freesound API)
- [ ] Slice automatique (découpe transitoires)
- [ ] Export WAV de la sortie sampler
- [ ] MIDI learn par pad

### Long terme
- [ ] Effets intégrés (filtre, compresseur, reverb)
- [ ] Time-stretch via AudioWorklet
- [ ] Waveform preview sur les pads
- [ ] Mode multi-samples par pad (layers)
- [ ] MPE/Aftertouch support

---

## 🧪 Tests

### Tests manuels recommandés

1. **Chargement de samples** : Bouton + drag & drop sur 3 pads différents
2. **Lecture** : Clic + mapping clavier (vérifier tous les layouts)
3. **Polyphonie** : Jouer rapidement un pad 5 fois → vérifier limite 3 voix
4. **Master volume** : Slider + mute/unmute
5. **Host WAM** : Vérifier chargement via initializeWamHost
6. **État** : Sauvegarder → rafraîchir → restaurer

### Tests à automatiser (TODO)
- Unit tests DSP (trim, reverse, polyphonie)
- Tests d'intégration WAM (createInstance, params)
- Tests performance (pas de fuites mémoire)

---

## 📄 Licence

MIT

---

## 👥 Auteurs

**Pierre Constantin** & **Baptiste Giacchero**  
Projet DS4H - Web Audio Course

---

## 🔗 Ressources

- [Web Audio Modules Spec](https://www.webaudiomodules.org/)
- [WAM Community Plugins](https://www.webaudiomodules.com/community/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
