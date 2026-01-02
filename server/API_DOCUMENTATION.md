# API REST - WAM Sampler

Documentation complète de l'API REST du serveur WAM Sampler.

## 🚀 Démarrage

```bash
cd server
npm install
npm start
```

Le serveur démarre sur `http://localhost:3000`

## 📡 Endpoints

### Health Check

**GET /api/health**

Vérifie que le serveur fonctionne.

**Réponse (200):**
```json
{
  "ok": true,
  "server": "wam-sampler",
  "now": "2026-01-02T10:30:00.000Z"
}
```

---

### Presets

#### Lister tous les presets

**GET /api/presets**

**Paramètres query (optionnels):**
- `q` (string): Recherche textuelle dans le nom
- `user` (string): Filtre par utilisateur
- `isPublic` (boolean): Filtre presets publics/privés

**Exemples:**
```bash
GET /api/presets
GET /api/presets?q=drums
GET /api/presets?user=john
GET /api/presets?isPublic=true
```

**Réponse (200):**
```json
[
  {
    "id": "uuid-v4",
    "name": "Mon Preset",
    "user": "username",
    "isPublic": false,
    "isFactory": false,
    "created": "2026-01-01T12:00:00.000Z",
    "updated": "2026-01-01T12:00:00.000Z",
    "parameters": { "master": { "volume": 0.8 } },
    "samples": [
      { "padIndex": 0, "url": "/samples/kick.wav", "name": "kick.wav" }
    ]
  }
]
```

#### Récupérer un preset

**GET /api/presets/:id**

**Réponse (200):**
```json
{
  "id": "uuid",
  "name": "Mon Preset",
  "parameters": { ... },
  "samples": [ ... ]
}
```

**Réponse (404):**
```json
{
  "error": "Preset non trouvé"
}
```

#### Créer un preset

**POST /api/presets**

**Body (JSON):**
```json
{
  "name": "Nouveau Preset",
  "parameters": {
    "master": { "volume": 0.8, "muted": false },
    "pads": [
      { "volume": 0.5, "pan": 0, "trimStart": 0, "trimEnd": 1 }
    ]
  },
  "samples": [
    { "padIndex": 0, "url": "/samples/kick.wav", "name": "kick.wav" }
  ],
  "user": "username",
  "isPublic": false
}
```

**Champs requis:**
- `name` (string, non vide)

**Champs optionnels:**
- `parameters` (object, défaut: `{}`)
- `samples` (array, défaut: `[]`)
- `user` (string, défaut: `"anonymous"`)
- `isPublic` (boolean, défaut: `false`)
- `isFactory` (boolean, défaut: `false`)

**Réponse (201):**
```json
{
  "id": "generated-uuid",
  "name": "Nouveau Preset",
  "user": "username",
  "isPublic": false,
  "created": "2026-01-02T10:00:00.000Z",
  "updated": "2026-01-02T10:00:00.000Z",
  "parameters": { ... },
  "samples": [ ... ]
}
```

**Réponse (400):**
```json
{
  "error": "Le champ 'name' est requis"
}
```

#### Mettre à jour un preset

**PUT /api/presets/:id**

Met à jour un preset existant (fusion avec l'existant).

**Body (JSON):**
```json
{
  "name": "Preset Modifié",
  "parameters": { ... },
  "samples": [ ... ]
}
```

Tous les champs sont optionnels. Seuls les champs fournis seront mis à jour.

**Réponse (200):**
```json
{
  "id": "uuid",
  "name": "Preset Modifié",
  "updated": "2026-01-02T11:00:00.000Z",
  ...
}
```

**Réponse (404):**
```json
{
  "error": "Preset non trouvé"
}
```

#### Supprimer un preset

**DELETE /api/presets/:id**

**Réponse (200):**
```json
{
  "ok": true,
  "deleted": "uuid"
}
```

**Réponse (404):**
```json
{
  "error": "Preset non trouvé"
}
```

---

### Samples

#### Upload un sample

**POST /api/samples**

Upload un fichier audio.

**Content-Type:** `multipart/form-data`

**Champ form:** `audio` (file)

**Formats supportés:** `.wav`, `.mp3`, `.ogg`, `.m4a`, `.flac`, `.aiff`

**Taille max:** 20 MB

**Exemple curl:**
```bash
curl -X POST http://localhost:3000/api/samples \
  -F "audio=@my-sample.wav"
```

**Réponse (201):**
```json
{
  "url": "/samples/my-sample-1704192000000-a1b2c3d4.wav",
  "filename": "my-sample-1704192000000-a1b2c3d4.wav",
  "originalName": "my-sample.wav",
  "size": 102400
}
```

**Réponse (400):**
```json
{
  "error": "Aucun fichier reçu"
}
```

ou

```json
{
  "error": "Format audio non supporté"
}
```

#### Télécharger un sample

**GET /samples/:filename**

Fichiers statiques servis directement.

**Exemple:**
```
GET /samples/kick-1704192000000-a1b2c3d4.wav
```

Retourne le fichier audio avec les headers appropriés.

---

## 🧪 Tests

### Tests automatisés (Node.js)

```bash
cd server
npm start  # Dans un terminal séparé
node test-api.mjs
```

### Tests manuels (curl)

```bash
cd server
chmod +x test-api-curl.sh
./test-api-curl.sh
```

### Tests avec client REST

Utilisez [Postman](https://www.postman.com/) ou [Thunder Client](https://www.thunderclient.com/) (extension VS Code).

Collection d'exemples disponible dans `server/postman-collection.json` (à créer si besoin).

---

## 💾 Stockage

### Structure des fichiers

```
server/data/
├── presets/           # Presets JSON
│   ├── uuid1.json
│   ├── uuid2.json
│   └── ...
└── samples/           # Fichiers audio
    ├── kick-xxx.wav
    ├── snare-xxx.wav
    └── ...
```

### Format preset (fichier JSON)

```json
{
  "id": "uuid-v4",
  "name": "Mon Preset",
  "user": "username",
  "isPublic": false,
  "isFactory": false,
  "created": "2026-01-01T12:00:00.000Z",
  "updated": "2026-01-01T12:00:00.000Z",
  "parameters": {
    "master": {
      "volume": 0.8,
      "muted": false
    },
    "pads": [
      {
        "volume": 0.5,
        "pan": 0,
        "pitch": 0,
        "trimStart": 0,
        "trimEnd": 1,
        "reverse": false
      }
    ]
  },
  "samples": [
    {
      "padIndex": 0,
      "url": "/samples/kick-1704192000-abc.wav",
      "name": "kick.wav"
    }
  ]
}
```

---

## 🔒 Sécurité

### CORS

Le serveur accepte uniquement les requêtes depuis `localhost` et `127.0.0.1` en développement.

Pour la production, modifiez la configuration CORS dans `server/src/app.mjs`.

### Authentification

Actuellement, aucune authentification n'est requise (mode développement).

Pour la production, implémenter:
- JWT tokens
- OAuth2
- Sessions

Le champ `user` dans les presets est préparé pour une auth future.

---

## 🚨 Gestion des erreurs

### Codes HTTP

- `200`: Succès
- `201`: Ressource créée
- `400`: Requête invalide (données manquantes/incorrectes)
- `404`: Ressource non trouvée
- `500`: Erreur serveur interne

### Format erreur

```json
{
  "error": "Message d'erreur descriptif"
}
```

### Logs serveur

Les erreurs sont loggées dans la console avec `console.error()`.

Pour la production, implémenter un système de logs structuré (Winston, Pino, etc.).

---

## 🔄 Workflow client

### Sauvegarder un preset complet

1. **Upload samples** (si nouveaux):
   ```javascript
   const formData = new FormData();
   formData.append('audio', audioFile);
   const { url } = await fetch('/api/samples', { 
     method: 'POST', 
     body: formData 
   }).then(r => r.json());
   ```

2. **Créer/Mettre à jour preset**:
   ```javascript
   const preset = {
     name: 'Mon Preset',
     parameters: audioNode.getState(),
     samples: [
       { padIndex: 0, url: '/samples/...', name: 'kick.wav' }
     ]
   };
   
   await fetch('/api/presets', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(preset)
   });
   ```

### Charger un preset complet

1. **Récupérer preset**:
   ```javascript
   const preset = await fetch(`/api/presets/${id}`).then(r => r.json());
   ```

2. **Charger état**:
   ```javascript
   audioNode.setState(preset.parameters);
   ```

3. **Charger samples**:
   ```javascript
   for (const sample of preset.samples) {
     const response = await fetch(sample.url);
     const arrayBuffer = await response.arrayBuffer();
     const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
     audioNode.loadSample(sample.padIndex, audioBuffer);
   }
   ```

---

## 📚 Références

- [WAM 2.0 Standard](https://github.com/webaudiomodules/api)
- [Express.js](https://expressjs.com/)
- [Multer (file uploads)](https://github.com/expressjs/multer)
