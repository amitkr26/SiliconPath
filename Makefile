.PHONY: install dev build lint typecheck test clean session-setup env-check

# ── Monorepo Workspace Commands ──────────────────────────────────────────
install:
	npm install

dev:
	npm run dev --workspaces --if-present

build:
	npm run build --workspaces --if-present

lint:
	npm run lint --workspaces --if-present

typecheck:
	npm run typecheck --workspaces --if-present

test:
	npm test --workspaces --if-present

test:watch:
	npm run test:watch --workspaces --if-present

test:coverage:
	npm run test:coverage --workspaces --if-present

clean:
	npm run clean --workspaces --if-present

# ── Legacy App Commands ──────────────────────────────────────────────────
install-frontend:
	cd electrobridge && npm install

install-backend:
	cd backend && npm install

dev-frontend:
	cd electrobridge && npm run dev

dev-backend:
	cd backend && source .env.local 2>/dev/null && npm run dev

# ── Session Setup ─────────────────────────────────────────────────────────
session-setup:
	@echo "=== SiliconPath Session Setup ==="
	@bash scripts/session-setup.sh 2>/dev/null || echo "scripts/session-setup.sh not found"
	@echo ""
	@echo "To verify keys are loaded:"
	@echo "  env | grep -E '^(GROQ|GEMINI|NVIDIA|CLOUDFLARE|SUPABASE|NEON)' | sort"

env-check:
	@echo "Checking required environment variables..."
	@node -e "\
	  const required = ['GROQ_API_KEY','SUPABASE_SERVICE_ROLE_KEY','NEXT_PUBLIC_SUPABASE_URL'];\
	  const missing = required.filter(k => !process.env[k]);\
	  if (missing.length) {\
	    console.error('Missing:', missing.join(', '));\
	    process.exit(1);\
	  } else {\
	    console.log('All', required.length, 'required keys present');\
	  }\
	"

# ── Deploy ────────────────────────────────────────────────────────────────
deploy-vercel:
	cd electrobridge && npx vercel --prod --token $(VERCEL_TOKEN)

deploy-render:
	@echo "Triggering Render deploy..."
	@curl -X POST "https://api.render.com/v1/services/$(RENDER_SERVICE_ID)/deploys" \
	  -H "Authorization: Bearer $(RENDER_API_KEY)" \
	  -H "Content-Type: application/json"
