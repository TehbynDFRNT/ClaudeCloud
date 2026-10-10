# Factory-vs-trader verification toolkit for an Australian small importer (hands-on tests, 2026-10-10)

Status: IN PROGRESS (written incrementally). All probes run 2026-10-10 UTC from a cloud container through the configured egress proxy. No accounts, logins, API keys, CAPTCHA/slider solving or challenge bypass. Robots.txt checked first for every host (RFC 9309 longest-match; '*' group plus any ClaudeBot/Claude-User/anthropic-ai group, most restrictive wins). Policy: robots 200 -> obey; 404/410 -> allowed; 4xx other -> one landing-page request at most (RFC 9309 "unavailable"); 5xx, TLS reset or challenge -> treated as disallowed, not fetched. Scripts: /tmp/claude-0/-home-user-ClaudeCloud/fd8ac9c1-a7a0-5273-919b-865b602ed3de/scratchpad/factory_tools/scripts/ (probe.py, digest.py, b*.tsv). Raw responses: .../factory_tools/downloads/<host>/.

## Q1. Reachability matrix: which verification sources actually work from here

(draft — being filled; customs rows done)

### Customs bill-of-lading (B/L) sources — tested 2026-10-10 03:22–03:32 UTC

| Source | URL tested | Exact outcome | Login/captcha | Fields visible without login | robots.txt stance | Cost (published) |
|---|---|---|---|---|---|---|
| ImportGenius supplier pages | [/suppliers/nantong-tengtai-sporting](https://www.importgenius.com/suppliers/nantong-tengtai-sporting) and 4 others | HTTP 200, 99–115 KB server-rendered HTML, no challenge (5 of 5 pages) | None for the summary page | Shipper name as written on B/L, shipper address, total shipments, date range, number of trading partners, top 5 importers (city, last arrival, container count, gross kg), 10 most-recent B/L rows (B/L no., free-text product description, importer, arrival date, origin, kg, packages), one full sample B/L (carrier/NVOCC, place of receipt, foreign port, master B/L, container, seal, notify party). HS code shown as "DATA UNAVAILABLE" on all 5 samples | [robots](https://www.importgenius.com/robots.txt) 200: '*' group "Allow: /"; only named crawlers barred from /search | "Get United States data for $229" (shown on the supplier page) |
| ImportGenius unknown slug | [/suppliers/ningbo-xusheng-leisure-products-co-ltd](https://www.importgenius.com/suppliers/ningbo-xusheng-leisure-products-co-ltd) | 301 → /tradebase (no page for that name) | — | — | allowed | — |
| Panjiva public profiles | [Heze-Zhongran-Woodware-Co-Ltd/62631236](https://panjiva.com/Heze-Zhongran-Woodware-Co-Ltd/62631236) and 4 others | HTTP 200, 41–48 KB, no challenge (5 of 5) | Sign-in for detail | Shipper name + address, US shipment count, 3 latest B/L rows (date, supplier, customer; product text masked "XXXX"), customer count, top HS chapters, "top products" words, one sample B/L with consignee + notify party addresses, weight, cartons, place of receipt, port of lading/unlading. South American (Colombia) import rows for some | [robots](https://panjiva.com/robots.txt) 200: '*' disallows ~120 /profile/... actions, not /<Company>/<id> pages | Enterprise (S&P Global); price not public |
| ImportYeti supplier pages | [/supplier/nantong-ironman-sporting-industrial](https://www.importyeti.com/supplier/nantong-ironman-sporting-industrial) | HTTP 403, 5,861 B, title "Just a moment..." (Cloudflare challenge). Not bypassed | Cloudflare challenge | None directly; page titles/snippets visible in WebSearch results only | [robots](https://www.importyeti.com/robots.txt) 200: Allow /, Disallow /search?q, /api/... | Free tier (per earlier notes) |
| Trademo company pages | [/companies/nantong-ironman-sporting-industrial/3249500](https://www.trademo.com/companies/nantong-ironman-sporting-industrial/3249500) | HTTP 403 "Azure WAF" block page | WAF block | None directly; WebSearch summary only | [robots](https://www.trademo.com/robots.txt) 200: '*' Allow:/ ; "User-agent: ClaudeBot Allow: /" | Not checked |
| Volza | [volza.com](https://www.volza.com/) | HTTP 403 "Attention Required! \| Cloudflare" | Cloudflare block | None | [robots](https://www.volza.com/robots.txt) 200: Disallow /search/, /*bill-of-lading* | Not checked |
| 52wmb (外贸邦) | [52wmb.com](https://www.52wmb.com/) | Homepage HTTP 200, 36,993 B | Login for data (not tested) | Not tested: company/bill pages are robots-disallowed | [robots](https://www.52wmb.com/robots.txt) 200: '*' disallows /*?*, /supplier-*, /buyer-*, /supplierbill*, /buyerbill*, /trade*, /m* | Not checked |
| Tradesparq | [tradesparq.com/en](https://www.tradesparq.com/en) | 302 → /en, HTTP 200, 477 KB | Login for data | Homepage only; no company page for the test firms found in search | robots.txt 404 (no file) | Not checked |
| Datamyne (Descartes) | [robots](https://www.datamyne.com/robots.txt) | robots 200 (370 B): Crawl-delay 3, only /wp-admin/ disallowed | Subscription | No public company pages found | allowed | Not checked |


## Q2. Worked examples on the test companies

(draft — being filled)

## Q3. Evidence-grading scale, decision rule and playbook

(draft — being filled)
