# 🧪 Tests WAM Sampler - Guide complet

Ce dossier contient l'ensemble des tests pour le projet WAM Sampler : tests unitaires, tests d'intégration, et tests manuels UI.

## 📁 Structure

```
tests/
├── README.md                  # Ce fichier
├── test-units.mjs            # Tests unitaires (32 tests)
├── test-preset-manager.mjs   # Tests d'intégration PresetManager (11 tests)
└── test-integration.html     # Interface pour tests automatiques + checklist manuelle
```

## 🚀 Lancer les tests

### 1. Tests unitaires

Les tests unitaires testent les fonctions individuelles et la logique métier isolée.

```bash
cd /Users/piero/Documents/WAM-Sampler-DS4H-main
node tests/test-units.mjs
```

**Couverture :**
- ✅ PresetManager (5 tests) : validation noms, factory presets, IDs uniques
- ✅ State Management (5 tests) : création, validation, clonage, fusion d'état
- ✅ Audio Processing (8 tests) : trim, MIDI→freq, pitch, gain/dB, pan
- ✅ Waveform Drawing (5 tests) : downsampling, min/max buffer, canvas↔sample
- ✅ MIDI Processing (5 tests) : parsing messages, mapping note↔pad
- ✅ Storage & URLs (4 tests) : localStorage, validation URLs, construction API

**Résultats :** 32/32 tests passent (100%)

---

### 2. Tests d'intégration (PresetManager)

Les tests d'intégration testent le cycle complet : GUI → Serveur → Rechargement

**⚠️ Prérequis : Serveur démarré**

```bash
# Terminal 1 : Démarrer le serveur
cd server
npm start

# Terminal 2 : Lancer les tests d'intégration
cd /Users/piero/Documents/WAM-Sampler-DS4H-main
node tests/test-preset-manager.mjs
```

**Couverture :**
1. ✅ Initialisation PresetManager (détection online/offline)
2. ✅ Sauvegarde preset en mode online (REST API)
3. ✅ Liste des presets
4. ✅ Chargement d'un preset
5. ✅ Mise à jour d'un preset
6. ✅ Liste par catégorie (Factory/User)
7. ✅ Sauvegarde factory preset
8. ✅ Suppression d'un preset
9. ✅ Mode offline (localStorage fallback)
10. ✅ Workflow complet (créer → modifier → supprimer)
11. ✅ Intégrité de l'état (vérification de toutes les propriétés)

**Résultats attendus :** 11/11 tests passent

---

### 3. Tests automatiques + UI (navigateur)

Interface web complète avec tests automatiques et checklist manuelle.

**⚠️ Prérequis : Serveur démarré**

```bash
# Terminal 1 : Serveur
cd server
npm start

# Terminal 2 : Ouvrir dans le navigateur
open tests/test-integration.html
# Ou sur Linux : xdg-open tests/test-integration.html
```

**Fonctionnalités :**
- 🤖 **Tests automatiques** : Lance test-preset-manager.mjs dans le navigateur
- 📋 **Checklist manuelle** : Guide pas à pas pour tester l'UI
- 🔍 **Vérification serveur** : Bouton pour checker l'état du serveur
- 📊 **Console intégrée** : Affichage des résultats en temps réel

**Checklist manuelle (7 sections) :**
1. **Workflow de base** : Chargement plugin, interface, menu presets
2. **Gestion des presets** : Créer, modifier, supprimer, recharger
3. **Enregistrement audio** : Recording, trim bars, preview, assignation
4. **Chargement de samples** : Load file, trim, assign, persistence
5. **Sélecteur MIDI** : Device detection, application, note playback
6. **Mode offline** : localStorage fallback, persistance sans serveur
7. **Export/Import** : Export JSON, import, log console

---

## 📊 Résultats de test

### Tests unitaires (node)
```
Total: 32 tests
✅ Réussis: 32
❌ Échoués: 0
Taux de réussite: 100.0%
```

### Tests d'intégration PresetManager (node + serveur)
```
Total: 11 tests
✅ Réussis: 11
❌ Échoués: 0
Mode: Online (REST API)
```

### Tests API (serveur)
```
Total: 12 tests
✅ Réussis: 12
❌ Échoués: 0
```

**Couverture globale : 55 tests automatiques + checklist manuelle complète**

---

## 🛠️ Commandes rapides

### Tout tester d'un coup

```bash
# 1. Démarrer le serveur (terminal 1)
cd server && npm start

# 2. Tests unitaires (terminal 2)
cd /Users/piero/Documents/WAM-Sampler-DS4H-main
node tests/test-units.mjs

# 3. Tests API (terminal 2)
cd server
node test-api.mjs

# 4. Tests d'intégration PresetManager (terminal 2)
cd /Users/piero/Documents/WAM-Sampler-DS4H-main
node tests/test-preset-manager.mjs

# 5. Tests UI (navigateur)
open tests/test-integration.html
```

### Tests sans serveur (offline mode)

```bash
# Seulement les tests unitaires (pas besoin du serveur)
node tests/test-units.mjs
```

---

## 🔍 Détails des tests

### Tests unitaires (test-units.mjs)

**PresetManager**
- Génération d'ID unique
- Validation du nom de preset
- Détection de preset factory ([Factory] prefix)
- Formatage du nom factory
- Extraction du nom de base

**State Management**
- Création d'un état vide (16 pads + master)
- Validation d'un état complet
- Rejet d'un état invalide
- Clonage profond d'état (deep copy)
- Fusion d'états (merge)

**Audio Processing**
- Calcul de trim valide (startSample, endSample, duration)
- Trim avec valeurs inversées (auto-correction)
- Trim hors limites (clamping 0-1)
- Conversion note MIDI vers fréquence (A4=440Hz)
- Calcul de pitch ratio (semitones → ratio)
- Conversion dB vers gain (logarithmic)
- Conversion gain vers dB (logarithmic)
- Normalisation de pan (-1 à 1)

**Waveform Drawing**
- Calcul de downsampling (buffer → canvas width)
- Extraction de min/max d'un buffer
- Calcul de position canvas vers sample
- Calcul de position sample vers canvas
- Détection de clic sur trim bar (tolerance 5px)

**MIDI Processing**
- Parsing de message MIDI Note On (0x90)
- Parsing de message MIDI Note Off (0x80)
- Mapping note MIDI vers pad (C4=60 → pad 0)
- Mapping pad vers note MIDI (pad 0 → 60)
- Détection de velocity nulle = Note Off

**Storage & URLs**
- Construction d'URL API (avec query params)
- Validation d'URL serveur (http/https)
- Clé localStorage pour preset
- Liste des presets depuis localStorage

---

### Tests d'intégration (test-preset-manager.mjs)

Ces tests vérifient le workflow complet avec mock d'AudioNode :

**MockAudioNode** : Simule le DSP node avec :
- 16 pads (buffer, volume, pan, pitch, trim)
- Master (volume, muted)
- getState() / setState()
- loadSample()

**Tests :**
1. **Initialisation** : Création PresetManager, détection mode online/offline
2. **Save online** : POST /api/presets avec état + samples
3. **List** : GET /api/presets, vérification présence preset
4. **Load** : GET /api/presets/:name, vérification intégrité
5. **Update** : PUT /api/presets/:id, vérification modification
6. **Category listing** : Séparation Factory/User
7. **Factory preset** : Sauvegarde avec prefix [Factory]
8. **Delete** : DELETE /api/presets/:id, vérification suppression
9. **Offline mode** : localStorage fallback si serveur down
10. **Complete workflow** : Créer → modifier → supprimer en séquence
11. **State integrity** : Vérification de toutes les propriétés (volume, pan, pitch, trim, samples)

---

### Tests UI manuels (test-integration.html)

**Workflow de base (4 checks)**
- Chargement du plugin WAM
- Affichage interface
- Menu presets visible (header)
- Séparation Factory/User

**Gestion des presets (5 checks)**
- Créer nouveau preset
- Recharger page (persistence)
- Charger preset (état restauré)
- Modifier et sauvegarder
- Supprimer preset

**Enregistrement audio (10 checks)**
- Ouvrir onglet Create
- Start Recording (permission microphone)
- Enregistrer 2-3 secondes
- Stop Recording
- Waveform affiché
- Barres de trim bleues visibles
- Déplacer trim bars avec souris
- Play Trimmed (preview)
- Sélectionner pad
- Assign to Selected Pad (seule partie trimée joue)

**Chargement de samples (7 checks)**
- Load Sample from File
- Sélectionner fichier (.wav, .mp3, .ogg)
- Sample affiché sur canvas
- Trim bars sur sample
- Assigner sample trimé à pad
- Sauvegarder comme preset
- Recharger et vérifier persistence

**Sélecteur MIDI (5 checks)**
- Connecter contrôleur MIDI
- Refresh MIDI Devices
- Device apparaît dans dropdown
- Apply MIDI Selection
- Notes MIDI jouent les pads

**Mode offline (6 checks)**
- Arrêter serveur (Ctrl+C)
- Rafraîchir wam-host.html
- Créer preset
- Recharger (localStorage persistence)
- Redémarrer serveur
- Mode online reprend

**Export/Import (6 checks)**
- Export State → JSON téléchargé
- Ouvrir JSON (structure valide)
- Modifier interface
- Import State → charger JSON
- État restauré
- Log Current State → console navigateur

---

## 🐛 Debugging

### Tests échouent avec "Server offline"

**Problème :** Le serveur n'est pas démarré ou n'écoute pas sur le bon port.

**Solution :**
```bash
# Vérifier si le serveur tourne
curl http://localhost:3000/api/health

# Si pas de réponse, démarrer le serveur
cd server
npm start
```

---

### Tests unitaires échouent

**Problème :** Erreur de syntaxe ou dépendance manquante.

**Solution :**
```bash
# Vérifier la version de Node.js
node --version  # Requis: v16+

# Relancer les tests avec verbose
node tests/test-units.mjs
```

---

### Tests d'intégration timeout

**Problème :** Le serveur est lent ou les opérations prennent trop de temps.

**Solution :**
- Vérifier que le serveur est en mode développement (pas de build)
- Vérifier les permissions d'écriture sur `server/data/`
- Nettoyer les presets de test :
  ```bash
  rm server/data/presets/test-*.json
  ```

---

### Tests UI : Preset non trouvé après rechargement

**Problème :** Le preset n'est pas sauvegardé correctement.

**Solution :**
- Ouvrir la console du navigateur (F12)
- Vérifier les erreurs réseau (onglet Network)
- Vérifier localStorage :
  ```javascript
  // Dans la console du navigateur
  Object.keys(localStorage).filter(k => k.startsWith('wam-sampler'))
  ```
- Vérifier les fichiers sur le serveur :
  ```bash
  ls -la server/data/presets/
  ```

---

## 📝 Conventions de test

### Nommage
- **test-*.mjs** : Tests Node.js (ES modules)
- **test-*.html** : Tests navigateur
- **mock* / Mock*** : Classes de simulation

### Assertions
```javascript
assert(condition, message)                    // Vérifie condition vraie
assertEquals(actual, expected, message)        // Vérifie égalité stricte
assertArrayEquals(actual, expected, message)   // Vérifie tableaux égaux
assertThrows(fn, message)                     // Vérifie qu'une erreur est lancée
```

### Structure d'un test
```javascript
suite.test('Description claire', async () => {
  // Arrange : Préparation
  const data = createTestData();
  
  // Act : Action
  const result = await functionToTest(data);
  
  // Assert : Vérification
  assertEquals(result.value, expectedValue, 'Message descriptif');
});
```

---

## 🎯 Prochaines étapes

### Tests à ajouter

1. **Tests de performance**
   - Mesurer le temps de chargement d'un preset
   - Mesurer le temps de trim d'un buffer
   - Stress test : 1000 presets

2. **Tests de régression**
   - Vérifier que les anciennes versions de presets se chargent
   - Tester la migration de localStorage vers serveur

3. **Tests d'accessibilité**
   - Navigation au clavier
   - ARIA labels
   - Screen reader compatibility

4. **Tests cross-browser**
   - Chrome, Firefox, Safari, Edge
   - iOS Safari, Chrome Android

---

## 📚 Ressources

- [WAM 2.0 Specification](https://github.com/webaudiomodules/api)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

---

## ✨ Contributeurs

- Pierre Constantin
- Baptiste Giacchero

---

**Dernière mise à jour :** $(date '+%Y-%m-%d')
**Version :** 1.0.0
