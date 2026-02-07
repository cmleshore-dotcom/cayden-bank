#!/bin/bash

# ============================================
#  CAYDEN BANK - One-Click Setup Script
# ============================================
# This script installs everything needed and
# starts the app automatically.
# ============================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

print_step() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}${BOLD}  [$1/7] $2${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_info() {
  echo -e "  ${CYAN}→${NC} $1"
}

print_success() {
  echo -e "  ${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "  ${YELLOW}!${NC} $1"
}

print_error() {
  echo -e "  ${RED}✗${NC} $1"
}

# Banner
echo ""
echo -e "${GREEN}${BOLD}"
echo "   ╔═══════════════════════════════════════╗"
echo "   ║                                       ║"
echo "   ║         CAYDEN BANK                   ║"
echo "   ║         Auto-Setup Script             ║"
echo "   ║                                       ║"
echo "   ║   Banking • Lending • Budgeting       ║"
echo "   ║                                       ║"
echo "   ╚═══════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  ${CYAN}This will install everything needed to run"
echo -e "  your Cayden Bank app. Sit back and relax!${NC}"
echo ""

# ============================================
# STEP 1: Install Homebrew
# ============================================
print_step "1" "Checking Homebrew (macOS package manager)"

if command -v brew &>/dev/null; then
  print_success "Homebrew is already installed"
else
  print_info "Installing Homebrew... (you may need to enter your password)"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  # Add Homebrew to PATH for this session
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    # Also add to shell profile for future sessions
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile 2>/dev/null || true
  elif [[ -f /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi

  if command -v brew &>/dev/null; then
    print_success "Homebrew installed successfully"
  else
    print_error "Homebrew installation failed. Please install manually from https://brew.sh"
    exit 1
  fi
fi

# ============================================
# STEP 2: Install Node.js
# ============================================
print_step "2" "Checking Node.js"

if command -v node &>/dev/null; then
  NODE_VERSION=$(node --version)
  print_success "Node.js is already installed (${NODE_VERSION})"
else
  print_info "Installing Node.js v20 LTS..."
  brew install node@20
  brew link node@20 --force 2>/dev/null || brew link node --force 2>/dev/null || true

  # Try to find node after install
  if [[ -f /opt/homebrew/bin/node ]]; then
    export PATH="/opt/homebrew/bin:$PATH"
  elif [[ -f /opt/homebrew/opt/node@20/bin/node ]]; then
    export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
  fi

  if command -v node &>/dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed (${NODE_VERSION})"
  else
    print_error "Node.js installation failed"
    exit 1
  fi
fi

# Verify npm
if command -v npm &>/dev/null; then
  NPM_VERSION=$(npm --version)
  print_success "npm is available (v${NPM_VERSION})"
else
  print_error "npm not found. Please reinstall Node.js"
  exit 1
fi

# ============================================
# STEP 3: Install & Start PostgreSQL
# ============================================
print_step "3" "Checking PostgreSQL database"

if command -v psql &>/dev/null; then
  print_success "PostgreSQL is already installed"
else
  print_info "Installing PostgreSQL 16..."
  brew install postgresql@16
  brew link postgresql@16 --force 2>/dev/null || true

  if [[ -f /opt/homebrew/opt/postgresql@16/bin/psql ]]; then
    export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
  fi

  print_success "PostgreSQL installed"
fi

# Start PostgreSQL
print_info "Starting PostgreSQL service..."
brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null || true
sleep 2

# Create database
print_info "Creating cayden_bank database..."
createdb cayden_bank 2>/dev/null && print_success "Database 'cayden_bank' created" || print_warning "Database 'cayden_bank' already exists (that's fine!)"

# ============================================
# STEP 4: Install Server Dependencies
# ============================================
print_step "4" "Installing server dependencies"

cd "$PROJECT_DIR/server"

# Create .env from example if it doesn't exist
if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env
    print_info "Created .env from .env.example"
  fi
fi

print_info "Running npm install for server... (this may take a minute)"
npm install --legacy-peer-deps 2>&1 | tail -1
print_success "Server dependencies installed"

# ============================================
# STEP 5: Set Up Database Tables & Demo Data
# ============================================
print_step "5" "Setting up database tables and demo data"

print_info "Running database migrations..."
npx knex migrate:latest --knexfile knexfile.ts 2>&1 | tail -3
print_success "Database tables created"

print_info "Seeding demo data..."
npx knex seed:run --knexfile knexfile.ts 2>&1 | tail -3
print_success "Demo data loaded"

# ============================================
# STEP 6: Install Mobile App Dependencies
# ============================================
print_step "6" "Installing mobile app dependencies"

cd "$PROJECT_DIR/mobile"
print_info "Running npm install for mobile... (this may take a minute)"
npm install --legacy-peer-deps 2>&1 | tail -1
print_success "Mobile dependencies installed"

# ============================================
# STEP 7: Start the App!
# ============================================
print_step "7" "Starting Cayden Bank!"

# Start server in background
cd "$PROJECT_DIR/server"
print_info "Starting backend API server on port 3000..."
npx ts-node src/index.ts &
SERVER_PID=$!
sleep 3

# Check if server started
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  print_success "Backend API is running at http://localhost:3000"
else
  print_warning "Server may still be starting up..."
fi

echo ""
echo -e "${GREEN}${BOLD}"
echo "   ╔═══════════════════════════════════════╗"
echo "   ║                                       ║"
echo "   ║   CAYDEN BANK IS READY!               ║"
echo "   ║                                       ║"
echo "   ║   Demo Login:                         ║"
echo "   ║   Email: cayden@example.com            ║"
echo "   ║   Pass:  password123                  ║"
echo "   ║                                       ║"
echo "   ║   Starting Expo now...                ║"
echo "   ║   • Press 'w' for web browser         ║"
echo "   ║   • Press 'i' for iOS simulator       ║"
echo "   ║   • Scan QR with Expo Go app          ║"
echo "   ║                                       ║"
echo "   ╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Start Expo (this stays in foreground)
cd "$PROJECT_DIR/mobile"
npx expo start

# Cleanup on exit
kill $SERVER_PID 2>/dev/null || true
