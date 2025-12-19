# WAM Sampler - Guide de Test

## Structure Conform WAM 2.0

Le plugin suit EXACTEMENT le pattern des wam-examples officiels:

### 1. Imports Standards
```javascript
import { WebAudioModule } from '@webaudiomodules/sdk';
import { ParamMgrFactory } from '@webaudiomodules/sdk-parammgr';
```

### 2. Pattern CompositeAudioNode
- Constructor → createNodes()
- setup(paramMgrNode) → connectNodes()
- PAS de redéfinition de connect/disconnect (fourni par SDK)

### 3. SDK Linkés
Les SDK sont liés depuis wam-examples via liens symboliques:
```
@webaudiomodules/
  ├── sdk/           -> ../../past projects/wam-examples-master/packages/sdk
  └── sdk-parammgr/  -> ../../past projects/wam-examples-master/packages/sdk-parammgr
```

## Test Local

### Option 1: Serveur Simple
```bash
cd /Users/piero/Documents/DS4H_web_audio_project/wam-sampler-clean
python3 -m http.server 8080
```

Ouvrir: http://localhost:8080/host/standalone.html

### Option 2: npm start
```bash
npm start
```

Ouvrir: http://localhost:3000/host/standalone.html

## Test dans un Host WAM

Le plugin peut maintenant être importé par URL dans n'importe quel host WAM:

```javascript
const WAM = window.WAM || await import('https://your-server.com/sdk/...');
const { default: SamplerPlugin } = await import('http://localhost:8080/src/index.js');

const instance = await SamplerPlugin.createInstance('hostGroupId', audioContext);
instance.audioNode.connect(audioContext.destination);
const gui = await instance.createGui();
document.body.appendChild(gui);
```

## Structure du Plugin (Conforme WAM)

```
src/
  ├── index.js          # WebAudioModule factory
  ├── Node.js           # CompositeAudioNode DSP
  ├── descriptor.json   # Métadonnées WAM
  └── gui/
      ├── index.js
      └── SamplerElement.js

@webaudiomodules/       # SDK (liens symboliques)
  ├── sdk/
  └── sdk-parammgr/
```

## Changements Critiques Effectués

### ✅ Imports Standards WAM
- Remplacé imports vendored par `@webaudiomodules/*`
- Ajouté importmap dans standalone.html

### ✅ Pattern CompositeAudioNode Correct
- Constructor appelle `createNodes()` seulement
- `setup()` appelle `connectNodes()` après ParamMgr ready
- Retiré redéfinitions inutiles de `connect()` / `disconnect()`

### ✅ createAudioNode Simplifié
- Configuration params directe (pas de helper methods)
- Pattern: new Node → config → ParamMgrFactory.create → setup → setState
- Comme quadrafuzz et pingpongdelay

### ✅ Descriptor.json Validé
- Champs WAM 2.0 corrects
- isInstrument: true
- apiVersion: "2.0.0"

## Vérifications

Si erreur persistante:

1. **Vérifier import map résout**:
   ```javascript
   console.log(import.meta.resolve('@webaudiomodules/sdk'));
   ```

2. **Vérifier liens symboliques**:
   ```bash
   ls -la @webaudiomodules/
   ```

3. **Console devtools**: Chercher erreurs d'import ou de parsing

4. **Network tab**: Vérifier que tous JS retournent 200 et MIME `text/javascript`

## Compatibilité

- ✅ Import par URL depuis n'importe quel host WAM
- ✅ Fonctionne en standalone (avec initializeWamEnv.js)
- ✅ Conforme spec WAM 2.0
- ✅ Pattern identique aux wam-examples officiels
