# 30-DO-NOT-CHANGE — Inviolable Architectural Mandates

1. **Do NOT Destructively Move Frontend Logic**: All backend replication is additive. Frontend is the production baseline.
2. **Do NOT Drop or Rename Co-Aligned Fields**: Maintain both `created_by` and `employer_id` on `opportunities`.
3. **Do NOT Alter Canonical Table Names**: Use `workspace_members` and `employer_settings`.
4. **Do NOT Expose Secrets**: Never commit raw API keys, tokens, or database passwords to git.
5. **Do NOT Claim Verification Without Execution**: Every "PASS" must be backed by real command output or live database evidence.
