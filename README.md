# WAM Sampler DS4H

**Sampler 16 pads conforme Web Audio Module v2.0 avec serveur REST intégré**

Sampler professionnel développé dans le cadre du cours Web Audio de l'Université Côte d'Azur. Architecture WAM stricte, serveur REST pour la gestion des presets et samples, interface moderne avec enregistrement audio intégré.

**Auteurs :** Pierre Constantin, Baptiste Giacchero  
**Encadrement :** Michel Buffa

---

## Caractéristiques principales

### Plugin Sampler WAM
- **16 pads audio** avec lecture polyphonique (3 voix par pad)
- **Paramètres par pad** : volume, pan, pitch, tone (filtre), trim start/end, reverse
- **Master volume** avec mute
- **Contrôle MIDI** : Sélection du device MIDI avec refresh automatique
- **Mapping clavier universel** : Détection physique compatible AZERTY/QWERTY/QWERTZ
- **Drag & drop** : Chargement direct de samples sur la grille
- **Enregistrement audio** : Capture microphone avec trim visuel et assignation rapide
- **Architecture WAM stricte** : DSP totalement séparé de la GUI
- **113 paramètres automatisables** via ParamMgr
- **Mode headless** : Fonctionne sans interface graphique

### Serveur REST
- **API REST complète** : CRUD presets + upload samples
- **Stockage persistant** : Fichiers JSON (presets) + fichiers audio (samples)
- **Fallback localStorage** : Mode offline automatique si serveur indisponible
- **Gestion des presets Factory et User** : Catégorisation automatique
- **Tests complets** : 55 tests automatiques (unitaires, intégration, API)  

---

## Installation et démarrage

### Prérequis
- Node.js (version 16 ou supérieure)
- Un navigateur moderne (Chrome, Firefox, Safari, Edge)

### Option 1 : Script automatique (recommandé)

```bash
cd WAM-Sampler-DS4H-main
./start.sh --open
```

Ce script démarre automatiquement le serveur REST API et ouvre le sampler dans le navigateur.

### Option 2 : Démarrage manuel

**1. Installer les dépendances du serveur**
```bash
cd server
npm install
```

**2. Démarrer le serveur REST** (port 3000)
```bash
npm start
# Ou en mode développement avec auto-reload :
npm run dev
```

**3. Démarrer un serveur HTTP** pour le sampler (port 5500)
```bash
# Retour à la racine du projet
cd ..
python3 -m http.server 5500
```

**4. Ouvrir dans le navigateur**
- **Sampler WAM** : http://localhost:5500/host/wam-host.html
- **Sampler Standalone** : http://localhost:5500/host/standalone.html

---

## Utilisation

### Gestion des presets

Le sampler propose deux modes de fonctionnement pour la gestion des presets :

**Mode serveur** (par défaut, serveur sur port 3000)
- Presets sauvegardés dans `server/data/presets/*.json`
- Accessibles depuis n'importe quel navigateur
- Samples stockés sur le serveur

**Mode offline** (fallback automatique)
- Bascule automatique sur localStorage si le serveur n'est pas accessible
- Presets locaux au navigateur uniquement

**Menu déroulant des presets** (en haut de l'interface)
- **Presets Factory** : Presets d'exemple pré-configurés
- **Presets User** : Vos créations personnelles

Pour sauvegarder un preset :
1. Configurez vos pads (chargez des samples, ajustez les paramètres)
2. Entrez un nom dans le champ "Preset Name"
3. Cliquez sur "Save Preset"

### Contrôle MIDI

**Sélection du device MIDI** (dans wam-host.html)
1. Connectez votre contrôleur MIDI
2. Cliquez sur "Refresh MIDI Devices"
3. Sélectionnez votre device dans le menu déroulant
4. Cliquez sur "Apply MIDI Selection"
5. Les notes C4 à Eb5 (60-75) déclenchent les pads 0-15

### Enregistrement audio

**Onglet "Create"** (capture microphone avec trim visuel)
1. Cliquez sur "Start Recording" (autorisez l'accès au microphone)
2. Enregistrez votre son (un timer s'affiche)
3. Cliquez sur "Stop Recording"
4. Le waveform s'affiche avec des barres de trim bleues
5. Déplacez les barres pour ajuster la région à conserver
6. Cliquez sur "Play Trimmed" pour prévisualiser
7. Sélectionnez un pad (0-15)
8. Cliquez sur "Assign to Selected Pad"
9. Le son trimé est automatiquement coupé et chargé sur le pad

### Chargement de samples

**Depuis un fichier local**
1. Onglet "Create" → "Load Sample from File"
2. Sélectionnez un fichier audio (.wav, .mp3, .ogg, .flac)
3. Utilisez les barres de trim pour ajuster
4. Assignez à un pad

**Drag & drop**
- Glissez un fichier audio directement sur un pad de la grille

### Mapping clavier

Le sampler détecte les touches physiques pour garantir un fonctionnement sur tous les layouts clavier.

**Pads 1-8** :
- Rangée numérique : `1 2 3 4 5 6 7 8`
- Rangée supérieure : `A Z E R T Y U I` (AZERTY) / `Q W E R T Y U I` (QWERTY)

**Pads 9-16** :
- Rangée centrale : `Q S D F G H J K` (AZERTY) / `A S D F G H J K` (QWERTY)

**Pads 1-4** (alternatif) :
- Rangée inférieure : `W X C V`

### Export/Import d'état

**Onglet "State"**
- **Export State** : Télécharge un fichier JSON avec la configuration complète
- **Import State** : Restaure une configuration depuis un fichier JSON
- **Log Current State** : Affiche l'état actuel dans la console du navigateur (pour débogage)

---

## Architecture du projet

```
WAM-Sampler-DS4H-main/
├── src/                      # Code source du plugin WAM
│   ├── index.js              # Factory du plugin
│   ├── Node.js               # Moteur DSP (SamplerNode + SamplePad)
│   ├── PresetManager.js      # Gestion presets (REST API + localStorage)
│   ├── descriptor.json       # Métadonnées WAM
│   └── gui/
│       ├── index.js          # Factory GUI
│       └── SamplerElement.js # Web Component (interface utilisateur)
│
├── sdk/                      # SDK Web Audio Modules
│   ├── WebAudioModule.js     # Classe de base WAM
│   ├── CompositeAudioNode.js # Pattern composite pour audio nodes
│   └── ParamMgrFactory.js    # Gestionnaire de paramètres automatisables
│
├── server/                   # Serveur REST
│   ├── src/
│   │   └── app.mjs           # Routes API (GET/POST/PUT/DELETE presets, POST samples)
│   ├── data/                 # Données persistantes (créé automatiquement)
│   │   ├── presets/          # Fichiers JSON des presets
│   │   └── samples/          # Fichiers audio uploadés
│   ├── test-api.mjs          # Tests automatiques de l'API (12 tests)
│   ├── README.md             # Documentation détaillée de l'API
│   └── package.json
│
├── tests/                    # Tests du projet
│   ├── test-units.mjs        # Tests unitaires (32 tests)
│   ├── test-preset-manager.mjs # Tests d'intégration (11 tests)
│   ├── test-integration.html # Interface de test web + checklist manuelle
│   └── README.md             # Documentation des tests
│
├── host/
│   ├── wam-host.html         # Host WAM avec sélecteur MIDI
│   └── standalone.html       # Test standalone (sans initializeWamHost)
│
├── start.sh                  # Script de démarrage automatique
├── run-all-tests.sh          # Script pour lancer tous les tests
└── README.md                 # Ce fichier
```

### Principe fondamental : Séparation DSP/GUI

Le Node DSP (`Node.js`) ne connaît **pas** la GUI et fonctionne de manière totalement autonome, conformément à la spécification WAM.

```javascript
// Communication via API publique (correct)
gui.addEventListener('click', (e) => {
    plugin.audioNode.playPad(e.padIndex, 0.85);
});

// Accès direct ou référence GUI dans DSP (interdit)
plugin.audioNode.gui = gui; // NON
plugin.audioNode.updateDisplay(); // NON
```

---

## API du plugin

### Paramètres automatisables (113 au total)

**Globaux**
- `masterVolume` : 0-2 (défaut : 1.0)

**Par pad (×16)**
- `pad{N}_volume` : 0-2 (défaut : 1.0)
- `pad{N}_pan` : -1 à 1 (défaut : 0, centre)
- `pad{N}_pitch` : 0.5-2.0 (défaut : 1.0, vitesse normale)
- `pad{N}_trimStart` : 0-1 (défaut : 0, début du sample)
- `pad{N}_trimEnd` : 0-1 (défaut : 1, fin du sample)
- `pad{N}_tone` : -1 à 1 (défaut : 1.0, filtre ouvert)
- `pad{N}_reverse` : 0-1 (défaut : 0, lecture normale)

### Utilisation programmatique

```javascript
// Charger le plugin
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

// Sauvegarder/restaurer l'état
const state = plugin.audioNode.getState();
plugin.audioNode.setState(state);
```

---

## Tests

Le projet dispose d'une suite complète de tests automatiques et manuels.

### Lancer tous les tests

```bash
./run-all-tests.sh
```

### Tests unitaires (32 tests)

```bash
node tests/test-units.mjs
```

Couvre : PresetManager, State Management, Audio Processing, Waveform Drawing, MIDI Processing, Storage & URLs.

### Tests d'intégration (11 tests)

```bash
# Nécessite que le serveur soit démarré
cd server && npm start

# Dans un autre terminal
node tests/test-preset-manager.mjs
```

Valide le cycle complet : GUI → Serveur → Rechargement, mode online/offline.

### Tests API (12 tests)

```bash
cd server
node test-api.mjs
```

Teste tous les endpoints REST : health check, CRUD presets, upload samples, gestion d'erreurs.

### Tests manuels (interface web)

```bash
# Serveur démarré requis
open tests/test-integration.html
```

Interface interactive avec 38 checks pour valider l'expérience utilisateur complète.

---

## Serveur REST API

Le serveur REST permet la gestion centralisée des presets et samples.

### Endpoints principaux

**Health check**
```
GET /api/health
```

**Presets**
```
GET    /api/presets          # Liste tous les presets
GET    /api/presets/:id      # Récupère un preset par ID
POST   /api/presets          # Crée un nouveau preset
PUT    /api/presets/:id      # Met à jour un preset
DELETE /api/presets/:id      # Supprime un preset
```

**Samples**
```
POST   /api/samples          # Upload un fichier audio (multipart/form-data)
```

Voir [server/README.md](server/README.md) pour la documentation complète de l'API.

---

## Technologies utilisées

- **Web Audio API** : Traitement audio en temps réel
- **Web Components** : Interface utilisateur modulaire
- **Web Audio Modules v2.0** : Standard de plugins audio pour le web
- **MediaRecorder API** : Enregistrement audio depuis le microphone
- **Web MIDI API** : Contrôle MIDI externe
- **Express.js** : Serveur REST
- **Node.js** : Environnement serveur

---

## Licence

MIT

---

## Auteurs et remerciements

**Développement** : Pierre Constantin, Baptiste Giacchero  
**Encadrement** : Michel Buffa  
**Cours** : Web Audio - Université Côte d'Azur

Merci à la communauté Web Audio Modules pour la spécification et les exemples.

---

## Ressources

- [Web Audio Modules Specification](https://www.webaudiomodules.org/)
- [WAM Community Plugins](https://www.webaudiomodules.com/community/)
- [Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Web MIDI API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
