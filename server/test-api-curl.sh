#!/bin/bash
# Tests manuels API REST avec curl
# Usage: chmod +x test-api-curl.sh && ./test-api-curl.sh

API="http://localhost:3000/api"

echo "🧪 Tests API REST - WAM Sampler"
echo "================================"

# Test 1: Health Check
echo -e "\n📋 Test 1: Health Check"
curl -s "$API/health" | jq '.'

# Test 2: Créer un preset
echo -e "\n📋 Test 2: Créer un preset"
PRESET_ID=$(curl -s -X POST "$API/presets" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Curl Preset",
    "parameters": {"master": {"volume": 0.8}},
    "samples": [],
    "user": "curl-tester"
  }' | jq -r '.id')
echo "Preset créé avec ID: $PRESET_ID"

# Test 3: Lister tous les presets
echo -e "\n📋 Test 3: Lister tous les presets"
curl -s "$API/presets" | jq 'length'

# Test 4: Récupérer le preset créé
echo -e "\n📋 Test 4: Récupérer le preset par ID"
curl -s "$API/presets/$PRESET_ID" | jq '.name'

# Test 5: Mettre à jour le preset
echo -e "\n📋 Test 5: Mettre à jour le preset"
curl -s -X PUT "$API/presets/$PRESET_ID" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Curl Updated"}' | jq '.name'

# Test 6: Rechercher des presets
echo -e "\n📋 Test 6: Rechercher 'Updated'"
curl -s "$API/presets?q=Updated" | jq 'length'

# Test 7: Supprimer le preset
echo -e "\n📋 Test 7: Supprimer le preset"
curl -s -X DELETE "$API/presets/$PRESET_ID" | jq '.ok'

echo -e "\n✅ Tests terminés!"
