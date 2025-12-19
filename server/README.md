# Serveur REST WAM Sampler

Serveur local Node.js/Express pour gérer les presets et samples du WAM Sampler.

## Architecture

```
server/
├── package.json          # Dépendances (express, cors, multer)
├── index.mjs            # Point d'entrée
├── src/
│   └── app.mjs          # Routes API REST
└── data/                # Données (créé automatiquement)
    ├── presets/         # Fichiers JSON des presets
    └── samples/         # Fichiers audio uploadés
```

## Installation

```bash
cd server
npm install
```

## Démarrage

```bash
# Mode production
npm start

# Mode développement (auto-reload avec --watch)
npm run dev
```

Le serveur démarre sur **http://localhost:3000**

## Endpoints API

### Health Check
```
GET /api/health
```
Retourne : `{ ok: true, server: "wam-sampler", now: "2025-12-15..." }`

### Presets

#### Liste tous les presets
```
GET /api/presets?q=search&user=username&isPublic=true
```
Filtres optionnels :
- `q` : recherche texte dans le nom
- `user` : filtre par utilisateur
- `isPublic` : filtre publics uniquement

#### Récupère un preset
```
GET /api/presets/:id
```

#### Crée un nouveau preset
```
POST /api/presets
Content-Type: application/json

{
  "name": "Mon Preset",
  "parameters": { ... },      // État WAM (getState)
  "samples": [                // Références samples
    { "padIndex": 0, "url": "/samples/kick.wav", "name": "kick.wav" }
  ],
  "user": "username",         // optionnel
  "isPublic": false           // optionnel
}
```

#### Met à jour un preset
```
PUT /api/presets/:id
Content-Type: application/json

{
  "name": "Nouveau nom",
  "parameters": { ... },
  "samples": [ ... ]
}
```

#### Supprime un preset
```
DELETE /api/presets/:id
```

### Samples

#### Upload un fichier audio
```
POST /api/samples
Content-Type: multipart/form-data

Field: "audio" = fichier audio (wav, mp3, ogg, m4a, flac, aiff)
Limite: 20MB
```

Retourne :
```json
{
  "url": "/samples/kick-1734264000000-a1b2c3d4.wav",
  "filename": "kick-1734264000000-a1b2c3d4.wav",
  "originalName": "kick.wav",
  "size": 123456
}
```

#### Télécharge un sample
```
GET /samples/:filename
```

## Format Preset

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Kit Trap",
  "user": "anonymous",
  "isPublic": false,
  "created": "2025-12-15T10:30:00.000Z",
  "updated": "2025-12-15T11:45:00.000Z",
  "parameters": {
    "param_pad_0_volume": 1.0,
    "param_pad_0_pan": 0.0,
    ...
  },
  "samples": [
    {
      "padIndex": 0,
      "url": "/samples/kick-1734264000000-a1b2c3d4.wav",
      "name": "kick.wav"
    }
  ]
}
```

## Sécurité

### Mode Local (actuel)
- CORS : localhost seulement
- Pas d'authentification
- Tous les presets accessibles

### Préparation Déploiement Future
Le code est structuré pour ajouter facilement :
- Authentification JWT/session
- Permissions utilisateur (privé/public)
- Rate limiting
- Validation stricte des inputs
- Stockage cloud (S3, etc.)

## Tests

### Curl Examples

```bash
# Health check
curl http://localhost:3000/api/health

# Liste presets
curl http://localhost:3000/api/presets

# Crée un preset
curl -X POST http://localhost:3000/api/presets \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","parameters":{},"samples":[]}'

# Upload un sample
curl -X POST http://localhost:3000/api/samples \
  -F "audio=@kick.wav"

# Récupère un preset
curl http://localhost:3000/api/presets/<ID>

# Supprime un preset
curl -X DELETE http://localhost:3000/api/presets/<ID>
```

## Intégration GUI

Le `PresetManager.js` utilise automatiquement l'API REST :
- Mode online : requêtes vers `http://localhost:3000`
- Mode offline : fallback localStorage
- Détection automatique de disponibilité serveur

```javascript
// Dans SamplerElement.js
this._presetMgr = new PresetManager('wam-sampler-clean', 'http://localhost:3000');

// Sauvegarde (envoie au serveur si disponible)
await this._presetMgr.savePreset(name, state, samples);

// Chargement (récupère depuis serveur ou localStorage)
const preset = await this._presetMgr.loadPreset(name);
```

## Évolution Future

### Phase 2 : Authentification
- [ ] Middleware auth (JWT)
- [ ] Routes `/api/auth/login`, `/api/auth/register`
- [ ] Associer presets aux users
- [ ] Filtrage permissions

### Phase 3 : Partage
- [ ] Presets publics/privés
- [ ] Recherche globale
- [ ] Tags et catégories
- [ ] Système de likes/favoris

### Phase 4 : Production
- [ ] Base de données (PostgreSQL)
- [ ] Stockage cloud samples (S3)
- [ ] CDN pour samples
- [ ] Rate limiting et cache
- [ ] Monitoring et logs
