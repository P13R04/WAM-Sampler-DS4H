# Guide Utilisation Serveur REST + Sampler

## 🚀 Démarrage Rapide

### 1. Lancer le serveur
```bash
cd wam-sampler-clean/server
npm install  # Première fois seulement
npm run dev  # Mode développement avec auto-reload
# ou
npm start    # Mode production
```

Le serveur démarre sur **http://localhost:3000**

### 2. Ouvrir le sampler
```bash
# Depuis la racine du projet
cd wam-sampler-clean
python3 -m http.server 5500
```

Ouvrir dans le navigateur :
- **http://localhost:5500/host/wam-host.html** (host WAM avec plugins)
- **http://localhost:5500/host/standalone.html** (version standalone)

## 💾 Fonctionnement des Presets

### Mode Serveur (recommandé)
Quand le serveur REST est actif :
- ✅ Les presets sont sauvegardés dans `server/data/presets/*.json`
- ✅ Accessibles depuis n'importe quel navigateur
- ✅ Préparé pour partage multi-utilisateurs
- ✅ Recherche et filtres avancés

### Mode Offline (fallback)
Si le serveur n'est pas accessible :
- 🔄 Bascule automatiquement sur localStorage
- ⚠️ Presets locaux au navigateur uniquement
- 💾 Pas de synchronisation possible

### Dans l'interface GUI

1. **Sauvegarder un preset** :
   - Configurez vos pads (chargez samples, ajustez paramètres)
   - Entrez un nom dans le champ "Nom du preset"
   - Cliquez "💾 Sauver"
   - ✓ Le preset est envoyé au serveur (ou localStorage si offline)

2. **Charger un preset** :
   - Sélectionnez un preset dans la liste déroulante
   - Cliquez "📥 Charger"
   - ✓ Les paramètres sont restaurés
   - ⚠️ Les samples ne sont pas encore rechargés automatiquement (feature en développement)

3. **Supprimer un preset** :
   - Sélectionnez le preset dans la liste
   - Cliquez "🗑️ Supprimer"
   - ✓ Supprimé du serveur/localStorage

## 🎵 Gestion des Samples

### Actuellement
- Chargement local via drag & drop ou bouton "📁 Charger"
- Les samples restent en mémoire (AudioBuffer)
- Les presets référencent les noms de fichiers mais pas les buffers

### Prochainement (roadmap)
1. **Upload automatique au serveur** :
   - Drag & drop → upload vers `/api/samples`
   - Le serveur retourne une URL : `/samples/kick-123456.wav`
   - L'URL est sauvegardée dans le preset

2. **Rechargement automatique** :
   - Au chargement d'un preset, les samples sont fetch depuis leurs URLs
   - Buffers recréés et chargés dans les pads
   - Indication visuelle du téléchargement

3. **Bibliothèque de samples** :
   - Liste des samples uploadés disponibles
   - Recherche et filtres
   - Drag & drop depuis la bibliothèque vers les pads

## 🔧 Tests et Développement

### Tester l'API manuellement
```bash
# Script de test complet
cd server
./test-api.sh

# Ou commandes individuelles
curl http://localhost:3000/api/health
curl http://localhost:3000/api/presets
curl -X POST http://localhost:3000/api/presets \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","parameters":{},"samples":[]}'
```

### Vérifier les fichiers sauvegardés
```bash
# Presets
ls -la server/data/presets/
cat server/data/presets/<preset-id>.json

# Samples (après upload)
ls -la server/data/samples/
```

### Console navigateur
Ouvrir DevTools (F12) :
```javascript
// Vérifier mode online/offline
console.log('Mode serveur:', sampler._presetMgr.isOnline);

// Lister presets
await sampler._presetMgr.listPresets();

// Vérifier localStorage (mode fallback)
localStorage.getItem('wam-sampler-clean:preset:list');
```

## 📋 Workflows Typiques

### Workflow 1 : Créer et sauvegarder un kit
1. Lancer serveur REST
2. Ouvrir sampler dans navigateur
3. Charger des samples sur les pads (drag & drop)
4. Ajuster volumes, pans, pitch
5. Nommer le preset : "Kit Trap Lourd"
6. Sauvegarder → stocké sur serveur
7. Vérifier : `cat server/data/presets/*.json`

### Workflow 2 : Partager un preset (préparation future)
1. Créer le preset avec `isPublic: true` (via API ou GUI future)
2. Le preset devient accessible à tous via `/api/presets?isPublic=true`
3. Uploader les samples associés
4. D'autres utilisateurs peuvent charger le preset et récupérer les samples

### Workflow 3 : Dev offline
1. Ne pas lancer le serveur
2. Ouvrir sampler → bascule auto sur localStorage
3. Créer presets locaux
4. Lancer serveur plus tard
5. Les presets localStorage restent séparés (pas de sync auto)

## 🛠️ Architecture Technique

```
Client (navigateur)
    ↓
SamplerElement.js (GUI)
    ↓
PresetManager.js (logique)
    ↓
  ┌─────────────────────────┐
  │ isOnline?              │
  └─────────────────────────┘
    ↓ YES          ↓ NO
  Serveur REST   localStorage
  (http://localhost:3000)
    ↓
app.mjs (Express)
    ↓
data/
  ├── presets/*.json
  └── samples/*.wav
```

### Détails techniques
- **PresetManager** : détecte auto le serveur via `/api/health`
- **Fallback localStorage** : si serveur down ou requête échoue
- **Format preset serveur** : inclut `id`, `user`, `created`, `updated`
- **Format preset localStorage** : simplifié, clé-valeur par nom

## 🚧 Roadmap Serveur

### Phase actuelle ✅
- [x] API REST CRUD presets
- [x] Upload samples (multer)
- [x] CORS localhost
- [x] Stockage fichiers JSON + audio
- [x] GUI intégré avec fallback

### Phase 2 : Samples complets 🔄
- [ ] Upload automatique au drag & drop
- [ ] Rechargement samples depuis URLs preset
- [ ] Bibliothèque samples avec recherche
- [ ] Preview samples (waveform, play)

### Phase 3 : Authentification 🔜
- [ ] Middleware JWT/session
- [ ] Routes `/api/auth/login`, `/api/auth/register`
- [ ] Association presets → users
- [ ] Permissions privé/public

### Phase 4 : Partage et communauté 🌐
- [ ] Presets publics/privés
- [ ] Tags et catégories
- [ ] Système likes/favoris
- [ ] Commentaires et notes
- [ ] Recherche avancée

### Phase 5 : Production 🚀
- [ ] Base de données (PostgreSQL)
- [ ] Stockage cloud (S3, Cloudinary)
- [ ] CDN pour samples
- [ ] Rate limiting et cache
- [ ] Monitoring et analytics
- [ ] Tests automatisés (Vitest)
- [ ] CI/CD (GitHub Actions)

## 🐛 Debug et Troubleshooting

### Serveur ne démarre pas
```bash
# Vérifier port 3000 disponible
lsof -i :3000
kill -9 <PID>

# Vérifier node version
node --version  # Doit être >= 20

# Logs serveur
node index.mjs  # Voir console directement
```

### GUI ne se connecte pas au serveur
1. Ouvrir DevTools → Console
2. Chercher erreurs CORS ou fetch
3. Vérifier URL serveur : `http://localhost:3000` (pas 127.0.0.1)
4. Tester health manuellement : `curl http://localhost:3000/api/health`

### Presets ne se sauvegardent pas
1. Vérifier console navigateur : erreurs réseau ?
2. Vérifier `isOnline` : `sampler._presetMgr.isOnline`
3. Mode fallback ? Vérifier localStorage
4. Permissions fichiers : `ls -la server/data/presets/`

### Samples ne se chargent pas
- ⚠️ Feature upload auto pas encore implémentée
- Actuellement : samples en mémoire uniquement
- Presets sauvegardent les noms mais pas les buffers
- Prochaine étape : upload serveur + rechargement

## 📚 Ressources

- **API Docs** : `server/README.md`
- **Tests** : `server/test-api.sh`
- **Code serveur** : `server/src/app.mjs`
- **Code client** : `src/PresetManager.js`, `src/gui/SamplerElement.js`
- **Example REST** : `Audio-Sampler/ExampleRESTEndpointCorrige/`

## 💡 Tips

- **Port différent** : `PORT=4000 npm start`
- **Désactiver CORS** : modifier `app.mjs` origin check (dev seulement !)
- **Reset presets** : `rm -rf server/data/presets/*.json`
- **Reset samples** : `rm -rf server/data/samples/*`
- **Logs détaillés** : ajouter `console.log` dans `app.mjs` handlers
