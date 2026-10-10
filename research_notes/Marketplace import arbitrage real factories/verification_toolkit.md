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


### Patents — tested 2026-10-10

| Source | URL tested | Exact outcome | Login/captcha | robots.txt stance | Cost |
|---|---|---|---|---|---|
| Google Patents | [robots.txt](https://patents.google.com/robots.txt) via curl | HTTP 503, Google "Sorry... your computer or network may be sending automated queries" page (this cloud egress IP is flagged) | Google bot-check | Read via WebFetch: "User-agent: * / Disallow: /* / Allow: /$ / Allow: /advanced$ / Allow: /patent/ / Allow: /sitemap/" — i.e. search-result URLs (/?q=, /?assignee=) are off-limits to automation; individual /patent/ pages are allowed | Free |
| CNIPA 专利检索及分析 (pss-system) | [pss-system.cponline.cnipa.gov.cn](https://pss-system.cponline.cnipa.gov.cn/) | robots.txt path returns the SPA's HTML (8,086 B), so no robots file; search requires a registered login (not attempted) | Login | Unknown (no robots file served) | Free with registration |
| CNIPA 公布公告 (epub) | [epub.cnipa.gov.cn](https://epub.cnipa.gov.cn/) | TLS handshake timed out (no response) | — | Not retrieved | Free |
| Espacenet | [robots.txt](https://worldwide.espacenet.com/robots.txt) | HTTP 403, 1-byte body | — | Unavailable | Free |
| Lens.org | [robots.txt](https://www.lens.org/robots.txt) | HTTP 200: groups naming anthropic-ai, Claude-Web, GPTBot etc. get "Disallow: /"; '*' disallows /lens/search, /lens/patent | — | Disallowed for AI agents | Free |
| WIPO PATENTSCOPE | [robots.txt](https://patentscope.wipo.int/robots.txt) | HTTP 200, 68 B: only a Sitemap line (nothing disallowed) | See worked example | Allowed | Free |

### Chinese company registry and mirrors — tested 2026-10-10

| Source | Exact outcome | robots.txt |
|---|---|---|
| GSXT 国家企业信用信息公示系统 ([gsxt.gov.cn](https://www.gsxt.gov.cn/)) | HTTP 403 on every path tried, body: "请求异常 当前IP请求异常，请更换IP地址进行访问，或访问地址（https://shiming.gsxt.gov.cn）实名注册/登录后再进行访问" (abnormal IP; change IP or register with real name at shiming.gsxt.gov.cn) | robots.txt itself returns that 403 |
| 信用中国 creditchina.gov.cn | TLS reset right after CONNECT (proxy log: tunnel closed after 3 s, 517 B sent, 39 B received) | Not retrievable |
| 中国海关企业进出口信用信息公示平台 credit.customs.gov.cn | Same TLS reset pattern | Not retrievable |
| Qichacha / Tianyancha / Aiqicha | Not re-tested (blocked 2026-10-09: 405 challenge, HTTP 419 region block, access-restriction redirect — see sourcing_api_access_test.md) | Keyword-search paths disallowed |
| 启信宝 Qixin ([robots](https://www.qixin.com/robots.txt)) | HTTP 451: "根据相关法律规定，当前所在地区暂不支持访问 / access is temporarily not supported in your current location" | Unavailable |
| 水滴信用 shuidi.cn | robots 200 (85 B), rules not tied to any user-agent line | Effectively allowed; pages not tested (no company URLs known) |
| 名录集 gongshang.mingluji.com | robots 200 (60,747 B, 53 Disallow lines, mostly specific company pages) | Mostly allowed |
| 11467.com | robots 200: Allow / but Disallow /*?*, /k-*, /web/*, /chanpin/ (no keyword search) | Company pages allowed |
| WebSearch snippets of Qichacha/Aiqicha pages | Chinese-name queries for Lingsha, Zhongran, Tengtai and Xusheng Leisure returned no registry snippets (the search tool is US-based); a 南通铁人 query returned only a brand-directory page (cnpp.cn) with a non-registry company description | — |

### Certification and audit databases — tested 2026-10-10

| Source | Exact outcome | robots.txt | What it can show |
|---|---|---|---|
| TÜV Rheinland Corporate Identity Verification ([verified.chn.tuv.com](https://www.verified.chn.tuv.com/en/)) — the "Verify Now" target on MIC TÜV-audited profiles | Homepage 200 (32,001 B). Search form POSTs to /Home/Search; results are filled by POST /Home/AjaxSearch {title: <name or report no.>}. One call for MIC-ASR2531608 returned JSON (474 B); a second call (MIC-ASR2531986) was reset by the host and not retried | robots.txt 404 (none) | Report no., supplier name, audit type, audit date, validity, address (often "-"), file link (null here) |
| Bureau Veritas China ([bvcerchina.cn](https://www.bvcerchina.cn/)) — the "Verify Now" target on MIC BV-audited profiles | TLS reset (no response) | Not retrievable | Not tested |
| TÜV Rheinland Certipedia ([certipedia.com](https://www.certipedia.com/)) | Homepage 200 (59,289 B) | [robots](https://www.certipedia.com/robots.txt): Disallow /search?, /search$, /search/matching_*; Crawl-delay 10 | Certificate/mark pages by ID are allowed; name search is manual-only |
| SGS Certified Client Directory ([page](https://www.sgs.com/en/certified-clients-and-products/certified-client-directory)) | HTTP 403 "Access Denied" (453 B, Akamai-style) | robots allows except /en-cn, /zh-cn, /*/search-results | Not tested |
| Intertek Directories ([directories.intertek.com](https://directories.intertek.com/)) | Proxy CONNECT 502 twice (egress policy or upstream failure) | Not retrievable | Not tested |
| UL Product iQ ([productiq.ulprospector.com](https://productiq.ulprospector.com/)) | HTTP 403 "You have been blocked… security service" (293,998 B) even for robots.txt; Product iQ also needs a free login | Unavailable | Not tested |
| IECEE CB certificates ([iecee.org](https://www.iecee.org/)) | robots.txt returned HTTP 202 with an empty JS-challenge body | Treated as challenge | Not tested |
| CNCA/CQC certification search ([cx.cnca.cn](https://cx.cnca.cn/)) | robots.txt HTTP 521 (862 B), then TLS resets | Not retrievable | Not tested |
| IAF CertSearch ([iafcertsearch.org](https://www.iafcertsearch.org/)) | Homepage 200 (15,033 B) with captcha markers | [robots](https://www.iafcertsearch.org/robots.txt): '*' and ClaudeSearchBot disallow /certified-entity/ and /certification/ (the detail pages) | Manual lookups only |
| FSC certificate search ([search.fsc.org](https://search.fsc.org/en/)) | 307→308→200 (303,886 B app shell) | [robots](https://search.fsc.org/robots.txt): Disallow /api (the data calls). Old [info.fsc.org](https://info.fsc.org/robots.txt): Disallow / | Manual lookups only |
| amfori BSCI | robots.txt 404 (no file) | Allowed | Audit results sit on the members-only amfori platform (not tested) |
| Australia EESS ([eess.gov.au](https://www.eess.gov.au/)) | Homepage 200 (74,942 B). Its [registration-database page](https://www.eess.gov.au/registration/eess-registration-database/) says: "The Registration database will no longer be available from 18:00 (AEDST) Friday, 11 October. It will be replaced by the EESS Platform from 8:00 (AEDST) Monday, 14 October 2024." The old database host equipment.erac.gov.au failed (proxy CONNECT 502; WebFetch "getaddrinfo ENOTFOUND") | [robots](https://www.eess.gov.au/robots.txt): Disallow /*? (all query URLs), Crawl-delay 3 | New platform URL not found (search quota exhausted) |

## Q2. Worked examples on the test companies

(draft — being filled)

## Q3. Evidence-grading scale, decision rule and playbook

(draft — being filled)
