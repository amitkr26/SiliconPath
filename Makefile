.PHONY: session-setup env-check install-backend install-frontend dev-backend dev-frontend deploy-vercel deploy-render

# ── Session Setup ─────────────────────────────────────────────────────────
session-setup:
	@echo "=== SiliconPath Session Setup ==="
	@bash scripts/session-setup.sh
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

# ── Install ────────────────────────────────────────────────────────────────
install-backend:
	cd backend && npm install

install-frontend:
	cd electrobridge && npm install

install-all: install-backend install-frontend

# ── Development ────────────────────────────────────────────────────────────
dev-backend:
	cd backend && source .env.local && npm run dev

dev-frontend:
	cd electrobridge && npm run dev

# ── Build / Typecheck ─────────────────────────────────────────────────────
typecheck-backend:
	cd backend && npx tsc --noEmit

typecheck-frontend:
	cd electrobridge && npx tsc --noEmit

typecheck: typecheck-backend typecheck-frontend

# ── Test ───────────────────────────────────────────────────────────────────
test-backend:
	cd backend && npm test

test-frontend:
	cd electrobridge && npm test

# ── Deploy ─────────────────────────────────────────────────────────────────
deploy-vercel:
	cd electrobridge && npx vercel --prod --token $(VERCEL_TOKEN)

deploy-render:
	@echo "Triggering Render deploy..."
	@curl -X POST "https://api.render.com/v1/services/$(RENDER_SERVICE_ID)/deploys" \
	  -H "Authorization: Bearer $(RENDER_API_KEY)" \
	  -H "Content-Type: application/json"
