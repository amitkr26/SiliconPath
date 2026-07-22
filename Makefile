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

# ── Session Setup ─────────────────────────────────────────────────────────
session-setup:
	@echo "=== BerojgarDegreeWala Session Setup ==="
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
# ponytail: deploy is done via CI/CD; remove these if not needed
