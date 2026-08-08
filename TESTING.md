# 🧪 Quality Assurance & Test Data Lifecycle Guidelines

## 1. Mandatory Rule for QA & Testing Sessions
To ensure that test job postings and simulated employer entries never remain visible to public users on production (`https://berojgardegreewala.vercel.app`), the following rules are strictly enforced:

1. **Automated API Safeguard:**
   - The `/api/opportunities` route automatically filters out entries containing test markers (`QA Audit Test`, `UI Verified`, unrealistic salaries, or self-referential apply URLs).
2. **Post-Testing Deletion:**
   - At the conclusion of every QA or browser testing session, the test data cleanup command MUST be run before considering the session complete:
     ```bash
     npm run clean:test-data
     ```
3. **Never Use Unrealistic Test Values:**
   - Always use realistic stipend values (e.g. ₹37,000–42,000/month for JRF positions) when testing forms to prevent confusing visitors if database sync occurs.

---

## 2. Test Accounts Reference (Testing Only)
- **Candidate Account:** `xasefe9251@bejum.com`
- **Employer Account:** `weqolyji@forexzig.com`
