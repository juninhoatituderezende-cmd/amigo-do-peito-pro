# Audit Summary

- Build: SUCCESS (vite)
- Tests: none detected
- Lint: 311 problems (235 errors, 76 warnings). See reports/eslint.log and reports/eslint.json.
- Type-check: SUCCESS (no errors). See reports/tsc.log.
- Security audit: 7 vulnerabilities (3 low, 3 moderate, 1 high). See reports/npm-audit.log and reports/npm-audit.json.

Top lint categories:
- @typescript-eslint/no-explicit-any: many occurrences across components/hooks/lib
- react-hooks/exhaustive-deps: missing dependencies in several components
- react-hooks/rules-of-hooks: false positive due to function named useUserCredits
- no-case-declarations: in switch cases with const declarations
- @typescript-eslint/no-require-imports: tailwind.config.ts

Recommended PRs:
1) Code bugs: fix Supabase function parse error; rename misleading function alias causing hooks rule.
2) Config: switch tailwind plugin to ESM import; add type-check script.
3) Security: apply npm audit fix and bump vulnerable packages as needed.
