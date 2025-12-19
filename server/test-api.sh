#!/bin/bash
# Script de test pour l'API REST du WAM Sampler

BASE_URL="http://localhost:3000"

echo "🧪 Tests API WAM Sampler Server"
echo "================================"
echo ""

# Test 1: Health check
echo "1️⃣  Health Check"
curl -s ${BASE_URL}/api/health | python3 -m json.tool
echo -e "\n"

# Test 2: Créer un preset
echo "2️⃣  Création d'un preset"
PRESET_ID=$(curl -s -X POST ${BASE_URL}/api/presets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kit Trap Test",
    "parameters": {
      "param_pad_0_volume": 0.9,
      "param_pad_0_pan": 0.0,
      "param_pad_1_volume": 0.8,
      "param_pad_1_pitch": 1.2
    },
    "samples": [
      {"padIndex": 0, "url": "", "name": "kick.wav"},
      {"padIndex": 1, "url": "", "name": "snare.wav"}
    ]
  }' | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo "✓ Preset créé avec ID: ${PRESET_ID}"
echo ""

# Test 3: Lister les presets
echo "3️⃣  Liste des presets"
curl -s ${BASE_URL}/api/presets | python3 -m json.tool
echo ""

# Test 4: Récupérer un preset
echo "4️⃣  Récupération du preset ${PRESET_ID}"
curl -s ${BASE_URL}/api/presets/${PRESET_ID} | python3 -m json.tool
echo ""

# Test 5: Mettre à jour le preset
echo "5️⃣  Mise à jour du preset"
curl -s -X PUT ${BASE_URL}/api/presets/${PRESET_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kit Trap Test MODIFIÉ",
    "parameters": {
      "param_pad_0_volume": 1.0
    }
  }' | python3 -m json.tool
echo ""

# Test 6: Recherche par nom
echo "6️⃣  Recherche par nom (q=trap)"
curl -s "${BASE_URL}/api/presets?q=trap" | python3 -m json.tool
echo ""

# Test 7: Upload sample (si fichier fourni)
if [ -n "$1" ]; then
  echo "7️⃣  Upload du sample: $1"
  curl -s -X POST ${BASE_URL}/api/samples \
    -F "audio=@$1" | python3 -m json.tool
  echo ""
fi

# Test 8: Suppression du preset
echo "8️⃣  Suppression du preset"
curl -s -X DELETE ${BASE_URL}/api/presets/${PRESET_ID} | python3 -m json.tool
echo ""

echo "✅ Tests terminés!"
