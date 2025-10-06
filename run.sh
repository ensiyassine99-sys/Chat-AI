#!/bin/bash

# ============================================
# AI Chatbot - Script de Démarrage Automatisé
# Version Windows-Compatible
# ============================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║           AI CHATBOT - STARTUP SCRIPT            ║"
echo "║                  Version 1.0.1                   ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction pour vérifier les prérequis
check_requirements() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé. Veuillez installer Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18+ requise. Version actuelle: $(node -v)"
        exit 1
    fi
    log_success "Node.js $(node -v) détecté"
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé"
        exit 1
    fi
    log_success "npm $(npm -v) détecté"
    
    # Vérifier Git (optionnel)
    if command -v git &> /dev/null; then
        log_success "Git $(git --version | cut -d' ' -f3) détecté"
    else
        log_warning "Git n'est pas installé (optionnel)"
    fi
}

# Fonction pour créer les fichiers .env s'ils n'existent pas
setup_env_files() {
    log_info "Configuration des fichiers d'environnement..."
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            log_warning "backend/.env créé depuis .env.example - VEUILLEZ CONFIGURER VOS CLÉS API"
        else
            # Générer des secrets aléatoires
            JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "your-super-secret-jwt-key-change-this")
            JWT_REFRESH_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "your-refresh-secret-key-change-this")
            SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "session-secret-change-this")
            
            cat > backend/.env << EOL
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Database
DATABASE_URL=sqlite:./database/chatbot.db

# JWT Secrets (CHANGEZ CES VALEURS!)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# AI Models API Keys (AJOUTEZ VOS CLÉS)
# Google AI 
GOOGLE_AI_API_KEY=

# Hugging Face
HUGGINGFACE_API_KEY=

# DeepSeek 
DEEPSEEK_API_KEY=
DEEPSEEK_API_URL=https://openrouter.ai/api/v1

# Security
BCRYPT_ROUNDS=10
SESSION_SECRET=${SESSION_SECRET}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
EOL
            log_warning "backend/.env créé avec des valeurs par défaut - CONFIGUREZ VOS CLÉS API"
        fi
    else
        log_success "backend/.env existe déjà"
    fi
    
    # Frontend .env
    if [ ! -f "frontend/.env" ]; then
        if [ -f "frontend/.env.example" ]; then
            cp frontend/.env.example frontend/.env
            log_success "frontend/.env créé depuis .env.example"
        else
            cat > frontend/.env << EOL
VITE_API_URL=http://localhost:5000/api/v1
VITE_WS_URL=ws://localhost:5000
VITE_APP_NAME=AI Chatbot
VITE_DEFAULT_LANGUAGE=en
VITE_ENABLE_PWA=true
EOL
            log_success "frontend/.env créé avec les valeurs par défaut"
        fi
    else
        log_success "frontend/.env existe déjà"
    fi
}

# Fonction pour installer les dépendances
install_dependencies() {
    log_info "Installation des dépendances..."
    
    # Backend
    log_info "Installation des dépendances Backend..."
    cd backend
    
    if [ ! -d "node_modules" ]; then
        npm install --loglevel=error
    else
        log_info "node_modules Backend déjà présent, passage..."
    fi
    
    log_success "Dépendances Backend installées"
    cd ..
    
    # Frontend
    log_info "Installation des dépendances Frontend..."
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        npm install --loglevel=error
    else
        log_info "node_modules Frontend déjà présent, passage..."
    fi
    
    log_success "Dépendances Frontend installées"
    cd ..
}

# Fonction pour créer la base de données
setup_database() {
    log_info "Configuration de la base de données..."
    
    # Créer le dossier database s'il n'existe pas
    if [ ! -d "backend/database" ]; then
        mkdir -p backend/database
        log_success "Dossier database créé"
    fi
    
    # Le fichier sera créé automatiquement par SQLite
    if [ -f "backend/database/chatbot.db" ]; then
        log_success "Base de données existante détectée"
    else
        log_info "Base de données sera créée au premier démarrage"
    fi
}

# Fonction pour vérifier si un port est utilisé (Windows compatible)
check_port() {
    local port=$1
    if command -v netstat &> /dev/null; then
        netstat -ano 2>/dev/null | grep ":$port" | grep "LISTENING" > /dev/null 2>&1
        return $?
    elif command -v ss &> /dev/null; then
        ss -tuln 2>/dev/null | grep ":$port" > /dev/null 2>&1
        return $?
    else
        return 1
    fi
}

# Fonction pour attendre qu'un port soit disponible
wait_for_port() {
    local port=$1
    local max_wait=$2
    local count=0
    
    log_info "Attente du démarrage sur le port $port..."
    
    while [ $count -lt $max_wait ]; do
        if check_port $port; then
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    
    return 1
}

# Fonction pour démarrer les serveurs
start_servers() {
    log_info "Démarrage des serveurs..."
    
    # Vérifier si les ports sont déjà utilisés
    if check_port 5000; then
        log_warning "Port 5000 déjà utilisé - le backend pourrait ne pas démarrer"
    fi
    
    if check_port 3000; then
        log_warning "Port 3000 déjà utilisé - le frontend pourrait ne pas démarrer"
    fi
    
    # Démarrer le backend
    log_info "Démarrage du serveur Backend..."
    cd backend
    npm start > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Attendre que le backend démarre (30 secondes max)
    if wait_for_port 5000 30; then
        log_success "Backend démarré sur http://localhost:5000 (PID: $BACKEND_PID)"
    else
        log_error "Le Backend n'a pas démarré dans les temps"
        log_info "Affichage des dernières lignes du log:"
        tail -n 20 backend.log
        
        # Vérifier si le processus est toujours actif
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            log_warning "Le processus Backend est actif mais le port 5000 n'est pas accessible"
            log_info "Le backend démarre peut-être encore, attendez quelques secondes..."
        else
            log_error "Le processus Backend s'est arrêté. Consultez backend.log pour plus de détails"
            exit 1
        fi
    fi
    
    # Démarrer le frontend
    log_info "Démarrage du serveur Frontend..."
    cd frontend
    BROWSER=none npm start > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Attendre que le frontend démarre (60 secondes max)
    if wait_for_port 3000 60; then
        log_success "Frontend démarré sur http://localhost:3000 (PID: $FRONTEND_PID)"
    else
        log_error "Le Frontend n'a pas démarré dans les temps"
        log_info "Affichage des dernières lignes du log:"
        tail -n 20 frontend.log
        
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            log_warning "Le processus Frontend est actif mais le port 3000 n'est pas accessible"
            log_info "Le frontend démarre peut-être encore, attendez quelques secondes..."
        else
            log_error "Le processus Frontend s'est arrêté. Consultez frontend.log pour plus de détails"
            # Ne pas exit ici, le backend tourne peut-être
        fi
    fi
    
    # Afficher les URLs
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         APPLICATION DÉMARRÉE AVEC SUCCÈS        ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}🌐 Frontend:${NC} http://localhost:3000"
    echo -e "${CYAN}🔧 Backend API:${NC} http://localhost:5000"
    echo -e "${CYAN}📊 Health Check:${NC} http://localhost:5000/health"
    echo ""
    echo -e "${YELLOW}📝 Logs:${NC}"
    echo -e "   Backend: tail -f backend.log"
    echo -e "   Frontend: tail -f frontend.log"
    echo ""
    echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter les serveurs${NC}"
    echo ""
    
    # Fonction pour nettoyer à la sortie
    cleanup() {
        echo ""
        log_info "Arrêt des serveurs..."
        
        if [ ! -z "$BACKEND_PID" ]; then
            kill $BACKEND_PID 2>/dev/null || true
            log_success "Backend arrêté"
        fi
        
        if [ ! -z "$FRONTEND_PID" ]; then
            kill $FRONTEND_PID 2>/dev/null || true
            log_success "Frontend arrêté"
        fi
        
        exit 0
    }
    
    # Capturer Ctrl+C
    trap cleanup INT TERM
    
    # Garder le script en cours d'exécution
    wait
}

# Fonction pour le mode production
production_build() {
    log_info "Construction pour la production..."
    
    # Build Frontend
    log_info "Build du Frontend..."
    cd frontend
    npm run build
    log_success "Frontend build terminé"
    cd ..
    
    # Préparer le backend pour la production
    log_info "Préparation du Backend pour la production..."
    cd backend
    NODE_ENV=production npm start &
    cd ..
    
    log_success "Application prête pour la production"
}

# Menu principal
main_menu() {
    echo ""
    echo "Choisissez une option:"
    echo "1) Démarrage en développement (par défaut)"
    echo "2) Build pour la production"
    echo "3) Installation seule"
    echo "4) Réinitialisation complète"
    echo "5) Vérifier le statut"
    echo ""
    read -p "Option [1]: " choice
    choice=${choice:-1}
    
    case $choice in
        1)
            check_requirements
            setup_env_files
            install_dependencies
            setup_database
            start_servers
            ;;
        2)
            check_requirements
            setup_env_files
            install_dependencies
            setup_database
            production_build
            ;;
        3)
            check_requirements
            setup_env_files
            install_dependencies
            setup_database
            log_success "Installation terminée"
            ;;
        4)
            log_warning "Cette action supprimera tous les node_modules et la base de données!"
            read -p "Êtes-vous sûr? (y/N): " confirm
            if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
                log_info "Réinitialisation..."
                rm -rf backend/node_modules frontend/node_modules
                rm -f backend/database/chatbot.db
                rm -f backend/.env frontend/.env
                log_success "Réinitialisation terminée"
                main_menu
            else
                log_info "Réinitialisation annulée"
            fi
            ;;
        5)
            log_info "Vérification du statut..."
            
            if check_port 5000; then
                echo -e "${GREEN}✓${NC} Backend: En ligne (port 5000)"
            else
                echo -e "${RED}✗${NC} Backend: Hors ligne"
            fi
            
            if check_port 3000; then
                echo -e "${GREEN}✓${NC} Frontend: En ligne (port 3000)"
            else
                echo -e "${RED}✗${NC} Frontend: Hors ligne"
            fi
            ;;
        *)
            log_error "Option invalide"
            exit 1
            ;;
    esac
}

# Vérifier si des arguments sont passés
if [ $# -eq 0 ]; then
    main_menu
else
    case $1 in
        dev|development)
            check_requirements
            setup_env_files
            install_dependencies
            setup_database
            start_servers
            ;;
        prod|production)
            check_requirements
            setup_env_files
            install_dependencies
            setup_database
            production_build
            ;;
        install)
            check_requirements
            setup_env_files
            install_dependencies
            setup_database
            ;;
        reset)
            log_warning "Réinitialisation complète..."
            rm -rf backend/node_modules frontend/node_modules
            rm -f backend/database/chatbot.db
            log_success "Réinitialisation terminée"
            ;;
        status)
            if check_port 5000; then
                echo "Backend: ✓ En ligne"
            else
                echo "Backend: ✗ Hors ligne"
            fi
            
            if check_port 3000; then
                echo "Frontend: ✓ En ligne"
            else
                echo "Frontend: ✗ Hors ligne"
            fi
            ;;
        help)
            echo "Usage: ./run.sh [COMMAND]"
            echo ""
            echo "Commands:"
            echo "  dev, development  Démarrer en mode développement"
            echo "  prod, production  Build pour la production"
            echo "  install          Installer les dépendances uniquement"
            echo "  reset            Réinitialiser le projet"
            echo "  status           Vérifier le statut des serveurs"
            echo "  help             Afficher cette aide"
            echo ""
            echo "Sans argument, le menu interactif sera affiché."
            ;;
        *)
            log_error "Commande inconnue: $1"
            echo "Utilisez './run.sh help' pour voir les commandes disponibles"
            exit 1
            ;;
    esac
fi