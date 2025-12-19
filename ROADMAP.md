# Plan d'Amélioration & Roadmap

Feuille de route pour les futures évolutions du sampler WAM.

---

## 🎯 Objectifs Généraux

1. **Maintenir la compacité** : UI toujours sans scroll, claire
2. **Performance** : Pas de fuites mémoire, CPU < 5% idle
3. **Maintenabilité** : Code propre, commenté, modulaire
4. **Extensibilité** : Nouvelles features sans casser l'existant

---

## 📅 Court Terme (1-2 semaines)

### Presets Utilisateur

**Objectif** : Sauvegarder/charger des configurations de sampler

```javascript
// API cible
const preset = {
  name: "My Drumkit",
  state: sampler.getState(),
  samples: [
    { padIndex: 0, url: "https://cdn.com/kick.wav" },
    { padIndex: 1, url: "https://cdn.com/snare.wav" }
  ]
};

presetManager.savePreset("My Drumkit", preset);
const loaded = presetManager.loadPreset("My Drumkit");
```

**Tâches** :
- [ ] Créer `src/PresetManager.js`
- [ ] Sérialiser URLs de samples (pas les buffers)
- [ ] LocalStorage pour persistance
- [ ] UI : dropdown presets + boutons save/load/delete
- [ ] Rechargement automatique des samples via URLs

---

### Indicateurs Visuels

**Objectif** : Feedback visuel enrichi

**Tâches** :
- [ ] Nom du fichier sur chaque pad chargé (tooltip ou label)
- [ ] Indicateur de voix actives : badge `2/3` sur les pads en lecture
- [ ] Durée du sample affichée (en secondes)
- [ ] Waveform miniature (canvas simple) sur les pads

---

### Bouton "Clear All"

**Objectif** : Vider tous les pads en un clic

**Tâches** :
- [ ] Bouton "Clear All" dans les contrôles
- [ ] Confirmation modale (éviter accidents)
- [ ] Réinitialiser tous les buffers + paramètres

---

## 📅 Moyen Terme (1-2 mois)

### Enregistrement Micro

**Objectif** : Capturer audio en direct dans un pad

```javascript
// API cible
sampler.startRecording(padIndex); // Démarre capture
sampler.stopRecording(); // Arrête et charge le buffer dans le pad
```

**Tâches** :
- [ ] Créer `src/audio/Recorder.js` (getUserMedia + MediaRecorder)
- [ ] UI : bouton "🎤 Record" + indicateur REC
- [ ] Limiter durée max (ex: 10s) pour éviter surcharge
- [ ] Conversion WAV → AudioBuffer

---

### Browser de Sons (Freesound API)

**Objectif** : Rechercher et charger des sons depuis Freesound

```javascript
// API cible
const results = await soundBrowser.search("kick drum");
// results = [{ name, preview_url, download_url }, ...]

soundBrowser.loadSample(results[0].download_url, padIndex);
```

**Tâches** :
- [ ] Créer `src/audio/FreesoundBrowser.js`
- [ ] Intégration API Freesound (OAuth ou API key)
- [ ] UI : modal avec recherche + liste résultats
- [ ] Pré-écoute des samples avant chargement
- [ ] Téléchargement + cache local (IndexedDB)

---

### Slice Automatique

**Objectif** : Découper un sample en plusieurs pads automatiquement

```javascript
// API cible
const slices = sliceBuffer(audioBuffer, {
  method: 'transients', // ou 'equal', 'beats'
  sliceCount: 8
});

slices.forEach((slice, i) => {
  sampler.loadSample(i, slice);
});
```

**Tâches** :
- [ ] Créer `src/audio/Slicer.js`
- [ ] Détection de transitoires (algorithme simple : envelope + threshold)
- [ ] Modes : découpe égale, détection beats, transitoires
- [ ] UI : bouton "Slice" → modale avec preview + réglages
- [ ] Application automatique sur la grille

---

### Export WAV

**Objectif** : Enregistrer la sortie du sampler en fichier audio

```javascript
// API cible
sampler.startBounce(); // Commence enregistrement
sampler.stopBounce(); // Arrête et télécharge WAV
```

**Tâches** :
- [ ] Utiliser MediaRecorder + destination node
- [ ] Ou OfflineAudioContext pour render hors temps réel
- [ ] UI : bouton "💾 Export" + indicateur REC
- [ ] Format WAV stéréo 48kHz
- [ ] Téléchargement automatique du fichier

---

## 📅 Long Terme (3-6 mois)

### Effets Intégrés

**Objectif** : Ajouter des effets audio par pad ou globalement

**Effets cibles** :
- Compresseur (dynamics)
- Delay simple (feedback + time)
- Reverb légère (convolution ou algorithmic)
- Distortion/Saturation

**Architecture** :
```javascript
class EffectChain {
  constructor(context) {
    this.effects = [];
  }
  
  addEffect(effect) {
    this.effects.push(effect);
    this._reconnect();
  }
  
  _reconnect() {
    // Reconstruire la chaîne : input → effect1 → effect2 → ... → output
  }
}
```

**Tâches** :
- [ ] Créer `src/audio/effects/` (Compressor.js, Delay.js, etc.)
- [ ] Intégrer EffectChain dans SamplePad ou global
- [ ] UI : boutons FX + knobs pour paramètres
- [ ] Bypass par effet

---

### Time-Stretch & Pitch-Shift Indépendant

**Objectif** : Changer pitch sans changer tempo, et vice-versa

**Solution** : AudioWorklet avec algorithme WSOLA ou Phase Vocoder

**Tâches** :
- [ ] Créer AudioWorklet `TimeStretchProcessor`
- [ ] Intégrer algorithme WSOLA (simple) ou Phase Vocoder (avancé)
- [ ] Paramètres : `timeStretch` (0.5-2.0), `pitchShift` (-12 à +12 demi-tons)
- [ ] UI : knobs séparés Tempo et Pitch

---

### Waveform Preview Complet

**Objectif** : Afficher waveform interactive sur les pads

**Features** :
- Zoom/scroll sur le waveform
- Trim bars interactives (drag handles)
- Loop region visuelle
- Marqueurs (start, end, loop points)

**Tâches** :
- [ ] Créer `src/gui/WaveformCanvas.js`
- [ ] Rendering optimisé (downsampling pour gros buffers)
- [ ] Interaction mouse/touch pour trim bars
- [ ] Intégration dans SamplerElement (modale ou inline)

---

### Mode Multi-Samples (Layers)

**Objectif** : Plusieurs samples par pad, joués simultanément ou par vélocité

**Modes** :
- **Layer** : tous les samples jouent ensemble
- **Velocity zones** : sample différent selon vélocité (ex: 0-0.3 → soft, 0.3-0.7 → med, 0.7-1.0 → hard)

**Architecture** :
```javascript
class SamplePad {
  constructor() {
    this.samples = []; // Array de buffers
    this.mode = 'layer'; // ou 'velocity-zones'
  }
  
  play(velocity) {
    if (this.mode === 'layer') {
      this.samples.forEach(sample => this._playBuffer(sample, velocity));
    } else {
      const sample = this._selectByVelocity(velocity);
      this._playBuffer(sample, velocity);
    }
  }
}
```

**Tâches** :
- [ ] Refactorer SamplePad pour multi-buffers
- [ ] UI : modal "Samples" par pad, avec liste + mode selector
- [ ] Drag & drop multiple sur un pad
- [ ] Vélocité zones éditables (sliders)

---

### MIDI Learn

**Objectif** : Mapper des contrôleurs MIDI aux paramètres automatiquement

```javascript
// API cible
sampler.enableMidiLearn('pad0_volume');
// Attente d'un CC MIDI → mapping automatique
```

**Tâches** :
- [ ] Créer `src/midi/MidiLearnManager.js`
- [ ] UI : bouton "Learn" à côté de chaque paramètre
- [ ] Mapping CC MIDI → paramètre WAM
- [ ] Sauvegarde des mappings dans les presets

---

### MPE Support (Aftertouch, Slide)

**Objectif** : Exploiter les contrôleurs MPE (ex: ROLI Seaboard)

**Mappings possibles** :
- Aftertouch → volume ou tone
- Slide → pan ou pitch bend
- Lift → release velocity

**Tâches** :
- [ ] Détecter messages MPE (Channel Voice Messages per note)
- [ ] Mapper MPE parameters → AudioParams
- [ ] UI : configuration MPE (routing)

---

## 🧪 Qualité & Outillage

### Tests Unitaires

**Objectif** : Automatiser les tests critiques

**Outils** : Vitest ou Jest + Web Audio API mocking

**Tests cibles** :
- Trim start/end → vérifier offsets corrects
- Reverse → vérifier buffer inversé
- Polyphonie → vérifier limite stricte (pas plus de 3 voix)
- Paramètres → vérifier onChange appelé correctement
- État → sérialisation/désérialisation round-trip

**Tâches** :
- [ ] Setup Vitest ou Jest
- [ ] Créer `tests/Node.test.js`
- [ ] Créer `tests/ParamMgr.test.js`
- [ ] CI/CD avec tests automatiques (GitHub Actions)

---

### Lint & Format

**Objectif** : Code cohérent et propre

**Outils** : ESLint + Prettier

**Tâches** :
- [ ] Configurer ESLint (règles WAM + ES6)
- [ ] Configurer Prettier (2 espaces, single quotes)
- [ ] Pre-commit hooks (Husky + lint-staged)

---

### Mesures Performance

**Objectif** : Pas de régressions perf

**Métriques** :
- CPU idle < 5%
- Mémoire stable (pas de fuites)
- Latence audio < 10ms

**Outils** : Chrome DevTools (Performance, Memory)

**Tâches** :
- [ ] Benchmarks automatisés (lecture 100 pads)
- [ ] Profiling régulier
- [ ] Documentation des limites (ex: max 16 pads)

---

## 📚 Documentation

### Tutoriel Vidéo

**Objectif** : Onboarding rapide pour nouveaux utilisateurs

**Contenu** :
- Installation et démarrage
- Chargement de samples
- Mapping clavier
- Sauvegarde de presets

**Tâches** :
- [ ] Enregistrer screencast (5-10 min)
- [ ] Publier sur YouTube
- [ ] Lien dans README

---

### API Documentation Complète

**Objectif** : Doc technique pour développeurs

**Outils** : JSDoc + générateur HTML (TypeDoc ou similaire)

**Tâches** :
- [ ] Compléter tous les JSDoc
- [ ] Générer site de doc avec TypeDoc
- [ ] Publier sur GitHub Pages

---

### Exemples d'Intégration

**Objectif** : Montrer comment intégrer le sampler dans un DAW web

**Exemples cibles** :
- Host WAM minimal (déjà fait)
- Host avec séquenceur MIDI
- Host avec automation lanes
- Host avec chaîne d'effets

**Tâches** :
- [ ] Créer `examples/` dans le repo
- [ ] Exemple 1 : Séquenceur + Sampler
- [ ] Exemple 2 : Sampler + Effets WAM tiers
- [ ] Exemple 3 : DAW complet (multitrack)

---

## 🚀 Optimisations

### Lazy Loading des Samples

**Objectif** : Charger les samples uniquement quand nécessaire

**Tâches** :
- [ ] Stocker URLs au lieu de buffers en mémoire
- [ ] Charger le buffer au premier `play()`
- [ ] Cache LRU pour limiter RAM (ex: max 50MB)

---

### AudioWorklet pour DSP Lourd

**Objectif** : Déléguer calculs intensifs au thread audio

**Use cases** :
- Time-stretch
- Pitch-shift
- Granular synthesis

**Tâches** :
- [ ] Créer worklet `SamplerProcessor`
- [ ] Migrer logique de lecture vers worklet
- [ ] Benchmark : comparer MainThread vs AudioWorklet

---

### Web Workers pour Traitements

**Objectif** : Éviter blocage du main thread

**Use cases** :
- Slice automatique (calcul de transitoires)
- Normalisation de buffers
- Génération de waveforms

**Tâches** :
- [ ] Créer `workers/AudioProcessor.worker.js`
- [ ] API async pour traitements lourds
- [ ] UI : indicateur de progression

---

## 🎨 UX/UI

### Thèmes

**Objectif** : Personnalisation visuelle

**Thèmes cibles** :
- Dark (défaut)
- Light
- High contrast (accessibilité)

**Tâches** :
- [ ] Créer `src/gui/themes.js`
- [ ] CSS variables pour couleurs
- [ ] UI : dropdown de sélection de thème

---

### Raccourcis Clavier Avancés

**Objectif** : Workflow rapide pour power users

**Raccourcis cibles** :
- `Ctrl+S` : Sauvegarder preset
- `Ctrl+O` : Ouvrir fichier
- `Ctrl+Z` : Undo (historique d'actions)
- `Space` : Play/Stop global

**Tâches** :
- [ ] Créer `src/gui/KeyboardShortcuts.js`
- [ ] Historique d'actions (Command pattern)
- [ ] UI : modal "Keyboard Shortcuts" (`?`)

---

## 🌐 Communauté

### Open Source

**Objectif** : Partager le projet avec la communauté WAM

**Tâches** :
- [ ] Publier sur GitHub (repo public)
- [ ] Licence MIT
- [ ] CONTRIBUTING.md (guide pour contributeurs)
- [ ] Issue templates (bug, feature request)

---

### Démo en Ligne

**Objectif** : Tester sans installer

**Tâches** :
- [ ] Héberger sur GitHub Pages ou Netlify
- [ ] URL publique : `https://ds4h-sampler.netlify.app`
- [ ] Samples de démo préchargés

---

### Listing sur webaudiomodules.com

**Objectif** : Visibilité dans la communauté WAM

**Tâches** :
- [ ] Soumettre le plugin sur le site officiel
- [ ] Thumbnail attrayant (screenshot ou logo)
- [ ] Description détaillée

---

## ✅ Checklist de Maintenance

### Hebdomadaire
- [ ] Vérifier issues GitHub
- [ ] Tester sur Chrome/Firefox/Safari
- [ ] Profiling mémoire (pas de fuites)

### Mensuelle
- [ ] Mettre à jour dépendances (SDK WAM)
- [ ] Relire TODO dans le code
- [ ] Benchmarks performance

### Trimestrielle
- [ ] Release notes pour nouvelle version
- [ ] Migration guide si breaking changes
- [ ] Tutoriel mis à jour

---

## 📞 Contact & Feedback

Pour toute suggestion ou bug, ouvrir une issue sur le repo GitHub ou contacter les auteurs.

**Auteurs** : Pierre Constantin, Baptiste Giacchero  
**Projet** : DS4H Web Audio Course
