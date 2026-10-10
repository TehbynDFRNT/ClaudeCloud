# Factory-vs-trader verification toolkit for an Australian small importer (hands-on tests, 2026-10-10)

Status: IN PROGRESS (written incrementally). All probes run 2026-10-10 UTC from a cloud container through the configured egress proxy. No accounts, logins, API keys, CAPTCHA/slider solving or challenge bypass. Robots.txt checked first for every host (RFC 9309 longest-match; '*' group plus any ClaudeBot/Claude-User/anthropic-ai group, most restrictive wins). Policy: robots 200 -> obey; 404/410 -> allowed; 4xx other -> one landing-page request at most (RFC 9309 "unavailable"); 5xx, TLS reset or challenge -> treated as disallowed, not fetched. Scripts: /tmp/claude-0/-home-user-ClaudeCloud/fd8ac9c1-a7a0-5273-919b-865b602ed3de/scratchpad/factory_tools/scripts/ (probe.py, digest.py, b*.tsv). Raw responses: .../factory_tools/downloads/<host>/.

## Q1. Reachability matrix: which verification sources actually work from here

(draft — being filled)

## Q2. Worked examples on the test companies

(draft — being filled)

## Q3. Evidence-grading scale, decision rule and playbook

(draft — being filled)
