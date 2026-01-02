#!/bin/bash

# Script pour lancer tous les tests du projet WAM Sampler
# Usage: ./run-all-tests.sh

set -e  # Exit on error

echo "======================================================"
echo "🧪 WAM Sampler - Lancement de tous les tests"
echo "======================================================"
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Fonction pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ Tests réussis${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ Tests échoués${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# ==================================================
# 1. Tests unitaires
# ==================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 Tests unitaires${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if node tests/test-units.mjs; then
    print_result 0
else
    print_result 1
fi

echo ""
echo ""

# ==================================================
# 2. Tests API (si serveur tourne)
# ==================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🌐 Tests API (serveur requis)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Vérifier si le serveur tourne
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Serveur détecté sur http://localhost:3000${NC}"
    echo ""
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    cd server
    if node test-api.mjs; then
        print_result 0
    else
        print_result 1
    fi
    cd ..
else
    echo -e "${YELLOW}⚠️  Serveur non détecté - Tests API ignorés${NC}"
    echo -e "${YELLOW}   Pour lancer ces tests, démarrez le serveur:${NC}"
    echo -e "${YELLOW}   cd server && npm start${NC}"
fi

echo ""
echo ""

# ==================================================
# 3. Tests d'intégration
# ==================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔗 Tests d'intégration (serveur requis)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Vérifier si le serveur tourne
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Serveur détecté${NC}"
    echo ""
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if node tests/test-preset-manager.mjs; then
        print_result 0
    else
        print_result 1
    fi
else
    echo -e "${YELLOW}⚠️  Serveur non détecté - Tests d'intégration ignorés${NC}"
    echo -e "${YELLOW}   Pour lancer ces tests, démarrez le serveur:${NC}"
    echo -e "${YELLOW}   cd server && npm start${NC}"
fi

echo ""
echo ""

# ==================================================
# 4. Résumé final
# ==================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 RÉSUMÉ GLOBAL${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Total des suites de tests: $TOTAL_TESTS"
echo -e "${GREEN}✅ Réussis: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Échoués: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 TOUS LES TESTS SONT PASSÉS!${NC}"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Certains tests ont échoué.${NC}"
    echo ""
    exit 1
fi
