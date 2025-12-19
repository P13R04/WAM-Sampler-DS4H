# Sampler 16 Pads (Web Component / Plugin)

Feuille de route et recapitulatif fonctionnel pour un sampler HTML/JS avec 16 pads disposes en grille 4x4.

## Vue d'ensemble
- 16 pads assignables, disposition 4x4.
- Mapping des sons: remplissage en partant du pad bas-gauche, puis gauche vers droite et bas vers haut.
- Chargement de presets (<= 16 sons) via API, avec possibilite d'edition par pad.
- Edition par pad: trimming, valeurs d'effets, taux de gain, autres parametres audio.
- Sauvegarde de presets modifies: conserve trims, gains, effets et positions.
- Enregistrement audio via micro PC; injection dans un pad libre ou remplacement d'un son existant.
- Authentification utilisateur: presets prives et recuperation separee des presets publics.
- Integration FreeSound (cle API): recherche via barre de recherche, pre-ecoute, drag & drop direct sur un pad.

## UX d'assignation des pads
- Ordre d'affectation: bas-gauche -> droite, rang superieur -> droite, etc. (balayage colonne bas->haut par ligne)
- Affichage 4x4 clair: differencier etat vide vs pad avec son.
- Feedback visuel: pad actif, en lecture, mute, rec.

## API Presets (conceptuel)
- `GET /presets/{id}`: renvoie jusqu'a 16 sons (URI ou blob) + metadonnees par slot.
- `POST /presets`: sauvegarde un preset modifie (ordre des slots respecte le mapping 4x4).
- `PATCH /presets/{id}/slots/{index}`: mise a jour partielle d'un pad (trims, effets, gain).
- Format pad propose:
  - `slot`: index 0-15 (0 = bas-gauche, 15 = haut-droit)
  - `source`: url/Blob
  - `trim`: `{ startMs, endMs }`
  - `gain`: float (dB ou 0..1)
  - `effects`: liste/objet (reverb, delay, filter, etc.)

## Authentification et bibliotheque externe
- Auth utilisateur (session ou token): acces aux presets prives, separation des espaces public/prive.
- Cle API FreeSound geree cote utilisateur (stockee de maniere securisee):
  - Barre de recherche pour requeter FreeSound.
  - Pre-ecoute des resultats.
  - Drag & drop d'un son retourne sur un pad pour l'affecter immediatement (respect du mapping 4x4 et des slots libres/selectionnes).
- Persistance: les presets prives sauvegardes restent lies au compte; les sons importes via FreeSound sont references (URL) ou mis en cache local (blob/IndexedDB) selon besoins offline.

## Edition par pad
- Trimming: selectionner debut/fin directement sur le waveform du son selectionne (vue d'onde + curseurs). Lorsque l'on clique sur un pad, la waveform du son s'affiche et les controles d'effets se positionnent selon les valeurs courantes de chaque effet.
- Effets: valeurs parametres par effet (reverb, delay, filtre, pitch, etc.).
- Gain: reglage par pad; norme interne dB ou lineaire.
- Actions: reset pad, dupliquer vers autre pad, mute/solo.

## Sauvegarde de preset
- Sauvegarde conserve: ordre des pads, trims, effets, gains, sources.
- Export JSON preset (schema ci-dessus); option d'export audio par pad si besoin.
- Gestion des versions: versionner preset et compatibilite schema.

## Enregistrement micro
- Capture depuis micro PC (MediaDevices.getUserMedia / Web Audio).
- Workflow:
  1) Armer REC, enregistrer, stop.
  2) Afficher waveform + duree.
  3) Choisir destination: remplacer un pad existant ou remplir un pad vide.
  4) Appliquer trimming/effets/gain comme un son du preset.
- Post-traitements apres enregistrement (au choix avant affectation pad):
  - Enregistrer simple et remplacer un son existant ou remplir un pad vide.
  - Enregistrer et slicer automatiquement sur les silences (decoupage en segments utilisables).
  - Enregistrer et appliquer un pitch-shift pour generer une gamme chromatique (mapping des notes vers pads ou export multiple).
- Stockage: convertir en buffer/Blob; associer au pad cible; mettre a jour preset courant.

## Roadmap suggeree
1) Skeleton composant web: grille 4x4, etats visuels (vide/charge/lecture/rec).
2) Mapping des slots: utilitaire d'indexation bas-gauche -> haut-droit.
3) API client: chargement preset, injection dans la grille, validation du schema.
4) Player par pad: playback, stop, loop (optionnel), indicateurs d'etat.
5) Edition locale: trimming basique, gain, quelques effets prioritaires.
6) Persistance: POST/PATCH preset modifie (JSON); gestion d'erreurs reseau.
7) Enregistrement micro: capture, preview, affectation pad, mise a jour preset.
8) Polish: shortcuts clavier/MIDI, undo/redo, autosave, tests e2e/audio snapshot.

## Tests et qualite
- Tests unitaires: mapping d'index, normalisation des presets, validations schema.
- Tests integration: chargement preset API, sauvegarde, remplacement pad.
- Tests audio: verification trimming/gain/effets (snapshots audio si possible).
- UX: accessibilite clavier et lecteur d'ecran, latence de playback.

## Notes d'implementation
- Web Audio API pour lecture/traitement (AudioBufferSource, GainNode, effects chain).
- Gestion des blobs audio (WAV/MP3/OGG); decodeAudioData ou AudioContext.decode.
- Stockage local temporaire: IndexedDB pour caches de blobs.
- Eviter la saturation: normaliser gains; limiter cumulative gain.
- Respecter permissions micro; afficher etat d'enregistrement clair.
