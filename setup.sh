#!/bin/bash

# ─────────────────────────────────────────────────────────────────────────────
# Quantile — Setup Script
#
# What this does:
#   1. Checks Node.js and npm are installed
#   2. Clones the GitHub repo
#   3. Creates the React project structure
#   4. Installs all dependencies
#   5. Copies your app files into the right places
#   6. Installs the Vercel CLI
#   7. Sets up the Python backend dependencies
#   8. Configures the 9:30 AM cron job
#   9. Creates a .env file template for your Alpaca keys
#
# Usage:
#   chmod +x setup.sh
#   ./setup.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Exit immediately if any command fails

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║         Quantile Setup Script          ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# ── STEP 1: Check dependencies ────────────────────────────────────────────────
echo "→ Checking dependencies..."

if ! command -v node &> /dev/null; then
  echo "✗ Node.js not found. Install from https://nodejs.org then re-run."
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo "✗ npm not found. Install from https://nodejs.org then re-run."
  exit 1
fi

if ! command -v git &> /dev/null; then
  echo "✗ Git not found. Install from https://git-scm.com then re-run."
  exit 1
fi

if ! command -v python3 &> /dev/null; then
  echo "✗ Python3 not found. Install from https://python.org then re-run."
  exit 1
fi

echo "✓ Node $(node --version)"
echo "✓ npm $(npm --version)"
echo "✓ Git $(git --version | cut -d' ' -f3)"
echo "✓ Python $(python3 --version)"
echo ""

# ── STEP 2: Clone the repo ────────────────────────────────────────────────────
echo "→ Cloning Quantile repo..."

if [ -d "Quantile" ]; then
  echo "  Quantile folder already exists — skipping clone."
else
  git clone https://github.com/patdonohue07/Quantile.git
  echo "✓ Repo cloned"
fi

cd Quantile
echo ""

# ── STEP 3: Create React project ─────────────────────────────────────────────
echo "→ Creating React project..."

if [ -d "quantile-app" ]; then
  echo "  quantile-app already exists — skipping."
else
  npx create-react-app quantile-app --template cra-template
  echo "✓ React project created"
fi

echo ""

# ── STEP 4: Copy app files into React project ─────────────────────────────────
echo "→ Setting up project structure..."

# Copy the main app file
cp "app/QuantX V2" quantile-app/src/App.js
echo "✓ App.js copied"

# Create api folder and copy serverless function
mkdir -p quantile-app/api
cp api/prices.js quantile-app/api/prices.js
echo "✓ api/prices.js copied"

# Copy Vercel config
cp vercel.json quantile-app/vercel.json
echo "✓ vercel.json copied"

echo ""

# ── STEP 5: Install React dependencies ───────────────────────────────────────
echo "→ Installing React dependencies..."
cd quantile-app
npm install
echo "✓ Dependencies installed"
echo ""

# ── STEP 6: Install Vercel CLI ────────────────────────────────────────────────
echo "→ Installing Vercel CLI..."
npm install -g vercel
echo "✓ Vercel CLI installed"
echo ""

# ── STEP 7: Python backend dependencies ──────────────────────────────────────
echo "→ Installing Python dependencies..."
cd ../backend
pip3 install alpaca-py yfinance pandas numpy --quiet
echo "✓ Python packages installed"
cd ..
echo ""

# ── STEP 8: Create .env file ──────────────────────────────────────────────────
echo "→ Creating .env template..."

if [ -f "backend/.env" ]; then
  echo "  .env already exists — skipping."
else
  cat > backend/.env << 'EOF'
# Alpaca Paper Trading Keys
# Get these from alpaca.markets → Paper Trading → API Keys
ALPACA_API_KEY=your_api_key_here
ALPACA_SECRET_KEY=your_secret_key_here

# Path where signals.json gets written
# Set this to the quantile-app/public folder
SIGNALS_OUTPUT_PATH=/path/to/Quantile/quantile-app/public/signals.json
EOF
  echo "✓ .env template created at backend/.env"
  echo "  → Fill in your Alpaca keys before running the deploy script"
fi

echo ""

# ── STEP 9: Set up cron job ───────────────────────────────────────────────────
echo "→ Setting up 9:30 AM cron job..."

SCRIPT_PATH="$(pwd)/backend/Scorecard Deploy Code"
PYTHON_PATH="$(which python3)"
CRON_JOB="30 9 * * 1-5 $PYTHON_PATH '$SCRIPT_PATH' >> $(pwd)/backend/cron.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "Scorecard Deploy Code"; then
  echo "  Cron job already exists — skipping."
else
  # Add to crontab
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo "✓ Cron job set for 9:30 AM ET Monday-Friday"
fi

echo ""

# ── DONE ──────────────────────────────────────────────────────────────────────
echo "╔═══════════════════════════════════════╗"
echo "║            Setup Complete!             ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "  1. Fill in your Alpaca keys:"
echo "     nano backend/.env"
echo ""
echo "  2. Test the app locally:"
echo "     cd quantile-app && npm start"
echo ""
echo "  3. Deploy to Vercel:"
echo "     cd quantile-app && vercel"
echo ""
echo "  4. Add Alpaca keys to Vercel dashboard:"
echo "     vercel.com → your project → Settings → Environment Variables"
echo "     ALPACA_API_KEY"
echo "     ALPACA_SECRET_KEY"
echo ""
echo "  5. Deploy to production:"
echo "     vercel --prod"
echo ""
echo "  6. Add app.quantile.online in Vercel → Settings → Domains"
echo ""
echo "  Cron log: $(pwd)/backend/cron.log"
echo ""
