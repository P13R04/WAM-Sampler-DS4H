#!/bin/bash
# Script de démarrage complet pour le WAM Sampler avec serveur REST

echo "🎛️  WAM Sampler - Démarrage Complet"
echo "===================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour vérifier si un port est utilisé
port_in_use() {
  lsof -ti:$1 > /dev/null 2>&1
}

# 1. Vérifier et démarrer le serveur REST (port 3000)
echo -e "${BLUE}1. Serveur REST API${NC}"
if port_in_use 3000; then
  echo "   ✅ Serveur REST déjà actif sur http://localhost:3000"
else
  echo "   🚀 Démarrage du serveur REST..."
  cd "$(dirname "$0")/server"
  node index.mjs > /dev/null 2>&1 &
  SERVER_PID=$!
  sleep 2
  
  if port_in_use 3000; then
    echo "   ✅ Serveur REST démarré sur http://localhost:3000 (PID: $SERVER_PID)"
  else
    echo "   ❌ Erreur démarrage serveur REST"
    exit 1
  fi
fi
echo ""

# 2. Vérifier et démarrer le serveur HTTP (port 5500)
echo -e "${BLUE}2. Serveur HTTP Static${NC}"
if port_in_use 5500; then
  echo "   ✅ Serveur HTTP déjà actif sur http://localhost:5500"
else
  echo "   🚀 Démarrage du serveur HTTP..."
  cd "$(dirname "$0")"
  python3 -m http.server 5500 > /dev/null 2>&1 &
  HTTP_PID=$!
  sleep 2
  
  if port_in_use 5500; then
    echo "   ✅ Serveur HTTP démarré sur http://localhost:5500 (PID: $HTTP_PID)"
  else
    echo "   ❌ Erreur démarrage serveur HTTP"
    exit 1
  fi
fi
echo ""

# 3. URLs disponibles
echo -e "${GREEN}✅ Tous les serveurs sont actifs !${NC}"
echo ""
echo "📱 URLs Disponibles :"
echo "   • Sampler WAM Host    : http://localhost:5500/host/wam-host.html"
echo "   • Sampler Standalone  : http://localhost:5500/host/standalone.html"
echo "   • Interface Test API  : http://localhost:5500/server/test-ui.html"
echo ""
echo "🔗 Endpoints API REST :"
echo "   • Health Check        : http://localhost:3000/api/health"
echo "   • Liste Presets       : http://localhost:3000/api/presets"
echo "   • Upload Sample       : http://localhost:3000/api/samples"
echo ""
echo "📝 Documentation :"
echo "   • Guide Serveur       : GUIDE_SERVEUR.md"
echo "   • Synthèse            : SYNTHESE_SERVEUR.md"
echo "   • API Docs            : server/README.md"
echo ""
echo "🛠️  Commandes Utiles :"
echo "   • Tester API          : cd server && ./test-api.sh"
echo "   • Voir presets        : ls -la server/data/presets/"
echo "   • Voir samples        : ls -la server/data/samples/"
echo "   • Arrêter serveurs    : pkill -f 'node index.mjs' && pkill -f 'python3 -m http.server'"
echo ""
echo "🎯 Prêt à utiliser !"
echo ""

# Option pour ouvrir automatiquement le navigateur
if [ "$1" == "--open" ] || [ "$1" == "-o" ]; then
  echo "🌐 Ouverture du navigateur..."
  sleep 1
  open http://localhost:5500/host/wam-host.html
fi
