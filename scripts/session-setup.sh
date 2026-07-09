#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# SiliconPath — Session Environment Setup
# Run this at the start of every new coding session:
#   source scripts/session-setup.sh
# ─────────────────────────────────────────────────────────────────────────────
# NOTE: This file contains PLACEHOLDER values only.
# Real credentials should be loaded from a secure local .env.local or SECRETS.md
# (both are gitignored) or from your shell's exported environment variables.
# ─────────────────────────────────────────────────────────────────────────────
set -a

# ── AI Providers ──────────────────────────────────────────────────────────
export GROQ_API_KEY="${GROQ_API_KEY:-your-groq-key}"
export GEMINI_API_KEY="${GEMINI_API_KEY:-your-gemini-key}"
export HUGGINGFACE_API_KEY="${HUGGINGFACE_API_KEY:-your-hf-key}"
export OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-your-openrouter-key}"
export AWS_BEARER_TOKEN_BEDROCK="${AWS_BEARER_TOKEN_BEDROCK:-your-bedrock-token}"
export NVIDIA_NIM_API_KEY="${NVIDIA_NIM_API_KEY:-your-nvidia-key}"
export CLOUDFLARE_AI_TOKEN="${CLOUDFLARE_AI_TOKEN:-your-cloudflare-token}"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-your-cloudflare-account}"

# ── Databases ──────────────────────────────────────────────────────────────
# Supabase Primary
export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://your-project.supabase.co}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-your-service-role-key}"

# Supabase Secondary
export SUPABASE_2_URL="${SUPABASE_2_URL:-https://your-project2.supabase.co}"
export SUPABASE_2_SERVICE_ROLE_KEY="${SUPABASE_2_SERVICE_ROLE_KEY:-your-service-role-key}"

# Neon Primary
export NEON_1_DATABASE_URL="${NEON_1_DATABASE_URL:-postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require}"

# Neon Secondary
export NEON_2_DATABASE_URL="${NEON_2_DATABASE_URL:-postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require}"

# ── Deployment ────────────────────────────────────────────────────────────
export SCRAPER_SECRET="${SCRAPER_SECRET:-your-scraper-secret}"

set +a

echo "✓ SiliconPath environment loaded (using placeholders if not set in shell)"
echo "  AI providers: GROQ, Gemini, HuggingFace, OpenRouter, Bedrock, NVIDIA, Cloudflare"
echo "  Databases: Supabase (primary + secondary), Neon (primary + secondary)"
