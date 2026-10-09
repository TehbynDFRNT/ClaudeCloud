# Sourcing API access test: adjustable dumbbell (Chinese suppliers and data APIs)

Status: draft v1. Key questions 2 and 3 are still being filled in.

Test date: every probe below was run on 2026-10-09 (UTC). Batch 1 ran 04:23–04:25 UTC; the later batches ran the same day.

Method: curl with its default User-Agent (no browser spoofing), through the configured HTTPS proxy (127.0.0.1:34415, CA bundle /root/.ccr/ca-bundle.crt). No accounts, logins, API keys, CAPTCHA solving or anti-bot bypass were used. Where a site returned a challenge, block or login redirect, that outcome is recorded and the site was not retried. Robots.txt was read with the '*' group using longest-match rules.

Scripts: /tmp/claude-0/-home-user-ClaudeCloud/fd8ac9c1-a7a0-5273-919b-865b602ed3de/scratchpad/api_tests/scripts/ (probe_b1.sh, digest_b1.py, batch2.py). Raw responses are in .../scratchpad/api_tests/downloads/.

## Key question 1: Which sources can be fetched from here, and under what robots.txt and ToS terms?

### Takeaway
Only Made-in-China search, AliExpress search, and several commercial API vendors' public pages returned content without a login or challenge. Alibaba.com's search path and its open-platform host are both disallowed by robots.txt, and I made requests to those paths anyway before checking, which is disclosed below. Everything else was blocked by a challenge or region or login restriction, or returned no usable content.

### Cited Findings

Matrix (all dated 2026-10-09; "robots" is the site's own robots.txt, "allowed" means no '*' rule matched the tested path):

| Source | Test URL | Exact HTTP outcome | Login or key? | Structured data? | robots.txt / ToS | Verdict |
|---|---|---|---|---|---|---|
| Made-in-China search | [Adjustable_Dumbbell.html](https://www.made-in-china.com/products-search/hot-china-products/Adjustable_Dumbbell.html) | 200, 757,612 bytes, server-rendered, no challenge | No | HTML product cards (parsed, see KQ2) | [robots](https://www.made-in-china.com/robots.txt) 200: search path allowed. [ToS](https://www.made-in-china.com/help/terms/) 200 (text under review) | Usable; robots-allowed |
| AliExpress search | [wholesale-adjustable-dumbbell.html](https://www.aliexpress.com/w/wholesale-adjustable-dumbbell.html) | 200, 710,716 bytes, no login wall | No | Embedded page data (see KQ2) | [robots](https://www.aliexpress.com/robots.txt) 200: /w/ allowed; /search/*, /product/*, /api/* disallowed | Usable (retail listings); robots-allowed |
| Alibaba.com search | [trade/search](https://www.alibaba.com/trade/search?SearchText=adjustable+dumbbell) | 200, 90,731 bytes, no visible text (client-rendered) | n/a | No (static HTML) | [robots](https://www.alibaba.com/robots.txt) 200: Disallow: /trade/ for all agents. Probe made in error | Do not automate; not sampled |
| Alibaba.com homepage | [alibaba.com](https://www.alibaba.com/) | 200, 225,305 bytes | No | n/a | Allowed by robots | Reachable; no sourcing data |
| Alibaba Open Platform | [open.alibaba.com](https://open.alibaba.com/) | 200, 4,608 bytes, SPA shell ("Alibaba.com") | Account approval (secondary sources only) | No | [robots](https://open.alibaba.com/robots.txt) 200, 25 bytes = "Disallow: /" for all agents. Probe made in error | Do not automate |
| Alibaba developers site | [developers.alibaba.com](https://developers.alibaba.com/) | Proxy returned CONNECT 502 (curl exit 56), no response | n/a | n/a | Not retrieved | Unreachable through the proxy |
| 1688 search | [offer_search.htm](https://s.1688.com/selloffer/offer_search.htm?keywords=%E5%8F%AF%E8%B0%83%E8%8A%82%E5%93%91%E9%93%83) | 200, 2,519 bytes, anti-bot interstitial (sessionStorage x5referer, then redirect to "/_____tmd_____/punish?x5secdata=…") | Verification challenge | No | s.1688.com/robots.txt returns the search page HTML (no robots file) | Blocked by challenge; not bypassed |
| 1688 homepage | [www.1688.com](https://www.1688.com/) | 200, 124,078 bytes, visible text only "阿里1688首页" | Unknown (JS-rendered) | No | [robots](https://www.1688.com/robots.txt) 200, 8,388 bytes: /offer/ and query-string paths disallowed | JS shell |
| 1688 Open Platform | [open.1688.com](https://open.1688.com/) | Homepage 200, 66,109 bytes, SPA ("阿里巴巴开放平台", 8 visible characters). robots.txt 302 → login.taobao.com/jump → login.1688.com, curl exit 47 | Login wall | No | Robots request ends at a login redirect | Developer docs not reachable without login |
| Global Sources search | [searchList/product-search](https://www.globalsources.com/searchList/product-search?keyword=adjustable%20dumbbell) | 403, CloudFront "Request blocked" page | Blocked | n/a | [robots](https://www.globalsources.com/robots.txt) also 403, so robots was unreadable. Probe made without a robots check | Blocked at CDN |
| DHgate search | [wholesale/search.do](https://www.dhgate.com/wholesale/search.do?searchkey=adjustable+dumbbell) | 403, Cloudflare "Just a moment…" (cf-mitigated: challenge) | Challenge | No | [robots](https://www.dhgate.com/robots.txt) 200: "/*?" disallowed. Probe made in error | Blocked; not bypassed |
| DHgate homepage | [dhgate.com](https://www.dhgate.com/) | 200 → 403, 5,320 bytes | Blocked | n/a | Allowed by robots | Blocked |
| ImportYeti search | [search?q=adjustable+dumbbell](https://www.importyeti.com/search?q=adjustable+dumbbell) | 403, Cloudflare challenge (cf-mitigated: challenge) | Challenge | No | [robots](https://www.importyeti.com/robots.txt) 200: "/search?q" disallowed. Probe made in error | Blocked |
| ImportYeti pricing | [pricing](https://www.importyeti.com/pricing) | 403, Cloudflare challenge | Challenge | n/a | Robots allows /pricing | Blocked; pricing from secondary sources only |
| ImportGenius pricing | [pricing](https://www.importgenius.com/pricing) | 403, empty body | Blocked | n/a | [robots](https://www.importgenius.com/robots.txt) 403. Probe made without a robots check | Blocked |
| Volza | [volza.com](https://www.volza.com/) | 403, Cloudflare "Sorry, you have been blocked" | Blocked | n/a | [robots](https://www.volza.com/robots.txt) 200: /search/ and /*bill-of-lading* disallowed | Blocked |
| Panjiva | [panjiva.com](https://panjiva.com/) | 200, 33,072 bytes; "Sign in" and "Request a Demo" | Account for data | No public listings | [robots](https://panjiva.com/robots.txt) 200, 121 '*' rules. ToS link goes to spglobal.com, whose robots returns 403, so the ToS was not fetched | Marketing page only |
| Canton Fair | [en/](https://www.cantonfair.org.cn/en/) → [en-US](https://www.cantonfair.org.cn/en-US) | 302 → 200, 1,784 bytes, title only (JS shell) | No | No exhibitor links in static HTML | [robots](https://www.cantonfair.org.cn/robots.txt) returns the homepage HTML, so no robots file is served | Exhibitor search not located |
| Qichacha search | [web/search?key=…](https://www.qcc.com/web/search?key=%E5%93%91%E9%93%83) | 302 → /405.html (body "405 {traceid…}") | n/a | No | [robots](https://www.qcc.com/robots.txt) 200: "/*?*" and "/web/search*" disallowed. Probe made in error | Blocked |
| Qichacha OpenAPI | [openapi.qcc.com](https://openapi.qcc.com/) | Proxy CONNECT 200, then connection reset (curl exit 35) after 7.9 s, no body | n/a | n/a | Not retrieved | Unreachable |
| Tianyancha search | [search?key=…](https://www.tianyancha.com/search?key=%E5%93%91%E9%93%83) | 419, region-restriction page (Chinese and English text) | Region block | No | [robots](https://www.tianyancha.com/robots.txt) 200: "/search?" disallowed. Probe made in error | Region-blocked; not bypassed |
| Tianyancha Open | [open.tianyancha.com](https://open.tianyancha.com/) | 302 → /data → 419 (same region block) | Region block | n/a | Not retrieved | Region-blocked |
| Aiqicha search | [s?q=…](https://aiqicha.baidu.com/s?q=%E5%93%91%E9%93%83) | 302 → /acount/accessrestriction, 0-byte body | Access restriction | No | [robots](https://aiqicha.baidu.com/robots.txt): connection reset (curl exit 35). Probe made without a robots check | Restricted |
| Apify store | [store?search=alibaba](https://apify.com/store?search=alibaba) | 200, 593,979 bytes; no actor results in static HTML | Browsing needs no login | Not in static HTML | [robots](https://apify.com/robots.txt) 200: Allow: / | Listing is client-rendered |
| Apify pricing | [pricing](https://apify.com/pricing) | 200, about 447 KB | No | Plan text | Allowed | Usable |
| RapidAPI | [search/alibaba](https://rapidapi.com/search/alibaba), [search/1688](https://rapidapi.com/search/1688) | 200, about 248 KB each; "API Hub" only (client-rendered) | Account for use | No | [robots](https://rapidapi.com/robots.txt) 200 | JS shell |
| ScraperAPI pricing | [pricing](https://www.scraperapi.com/pricing/) | 200, 1,611,146 bytes | No | Plan text | [robots](https://www.scraperapi.com/robots.txt) 200: /terms/ disallowed, so its ToS was not fetched | Usable |
| Oxylabs pricing | [pricing](https://oxylabs.io/pricing) | 200, 370,116 bytes | No | Plan text | [robots](https://oxylabs.io/robots.txt) 200, no '*' restrictions | Usable |
| Bright Data pricing | [pricing](https://brightdata.com/pricing) | 200, 233,974 bytes | No | Plan text | [robots](https://brightdata.com/robots.txt) 200: Crawl-delay 5 | Usable |
| Bright Data datasets | [products/datasets](https://brightdata.com/products/datasets) | 200, 2,180,233 bytes | No | Catalogue text | As above | Usable |
| TMAPI | [tmapi.top](https://tmapi.top/) | 200, 16,144 bytes | API key (not tested) | Home text lists Taobao, 1688, Amazon, Shopee | [robots](https://tmapi.top/robots.txt) 200, empty Disallow | Usable landing page |
| Onebound | [onebound.cn](https://www.onebound.cn/) | 200, 62,695 bytes (Chinese) | API key (not tested) | Home text: "电商API平台", "1688代采系统" | [robots](https://www.onebound.cn/robots.txt) 200, empty Disallow | Usable landing page |
| Made-in-China homepage | [made-in-china.com](https://www.made-in-china.com/) | 200, 401,540 bytes | No | n/a | Allowed | Reachable |

Robots.txt and ToS findings that are already checked:
- Alibaba: '*' group has "Disallow: /trade/", "/product/", "/supplier/guide/", "/searchweb/*.html". GPTBot and Google-Extended are fully disallowed ([robots](https://www.alibaba.com/robots.txt)).
- 1688: '*' group disallows /offer/ and "/company/*?", "/store/*?*". bingbot is fully disallowed ([robots](https://www.1688.com/robots.txt)).
- DHgate: '*' group disallows /search.do and "/*?" ([robots](https://www.dhgate.com/robots.txt)).
- ImportYeti: "Disallow: /search?q" and /api/ paths ([robots](https://www.importyeti.com/robots.txt)).
- Qichacha: "Disallow: /*?*" for all agents ([robots](https://www.qcc.com/robots.txt)).
- Tianyancha: "Disallow: /search/*", "/search?", "/search*" ([robots](https://www.tianyancha.com/robots.txt)).
- Volza: "Disallow: /search/" and "/*bill-of-lading*" ([robots](https://www.volza.com/robots.txt)).
- Apify ToS: accounts "registered by 'bots' or other automated methods are not permitted" ([ToS](https://docs.apify.com/legal/general-terms-and-conditions), fetched 2026-10-09, 88,458 bytes). Full ToS wording on third-party sites is still to be checked.

Process deviations (disclosed):
- Batch 1 was not gated on robots.txt. Six requests went to paths that robots.txt disallows: the Alibaba trade search, the open.alibaba.com root (robots, fetched later, says "Disallow: /"), the DHgate search, the ImportYeti search, the Qichacha search and the Tianyancha search. I made no retries, and I did not use the bodies of those responses for extraction.
- Eight more requests were made before robots.txt could be read, or where it was unavailable: Global Sources search (robots 403), ImportGenius pricing (robots 403), Aiqicha search (robots reset), Qichacha OpenAPI, Tianyancha Open, developers.alibaba.com (502), developers.aliexpress.com (500), and open.1688.com (robots redirected to login).
- openservice.aliexpress.com returned robots.txt 404, which I read as no restrictions. Its homepage is an SPA shell.

### Inferences
- Robots.txt disallows the sourcing search paths on Alibaba (/trade/), DHgate, ImportYeti, Qichacha and Tianyancha for generic crawlers. A vendor that scrapes these paths for you is working against the site's stated crawl policy, which is a compliance risk to weigh before automating.
- Made-in-China and AliExpress are the only sourcing search paths here that are both reachable and not disallowed by robots.txt. Their ToS still need a check for automated access.

### Gaps
- The Alibaba, DHgate, ImportYeti and Volza ToS pages were not retrieved (blocked or disallowed).
- Canton Fair's exhibitor search page was not located. Its homepage is a JavaScript shell.
- 1688 open-platform developer rules are not verified; the developer site is behind a login redirect.

## Key question 2: Sample extraction for "adjustable dumbbell"

Pending. See the working notes for the extraction status.

## Key question 3: Costed API and data options, and recommended stack

Pending.
