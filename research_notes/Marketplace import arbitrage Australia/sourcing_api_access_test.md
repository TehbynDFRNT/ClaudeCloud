# Sourcing API access test: adjustable dumbbell (Chinese suppliers and data APIs)

Status: final (v2). Every probe was run on 2026-10-09 (UTC).

Method. Batch 1 ran 04:23–04:25 UTC on 2026-10-09; later batches ran the same day. Client: curl with its default User-Agent, through the configured HTTPS proxy (127.0.0.1:34415, CA bundle /root/.ccr/ca-bundle.crt). No accounts, logins, API keys, or CAPTCHA or anti-bot bypass were used. Where a site returned a challenge, a block, or a login redirect, that outcome is recorded and the site was not retried. Robots.txt was applied using the '*' group and longest-match rules. Scripts: /tmp/claude-0/-home-user-ClaudeCloud/fd8ac9c1-a7a0-5273-919b-865b602ed3de/scratchpad/api_tests/scripts/ (probe_b1.sh, digest_b1.py, batch2.py to batch6.py). Raw responses: .../scratchpad/api_tests/downloads/. Items marked "secondary" come from WebSearch snippets and were not fetched directly. Nine WebSearch queries were run early in batch 2; none were run after the quota note.

## Key question 1: Which sources can be fetched from here, and under what robots.txt and ToS terms?

### Takeaway
Only Made-in-China search and AliExpress search returned sourcing listings without a challenge or login, and both search paths are allowed by robots.txt. Alibaba's trade search and its open-platform host are disallowed by robots.txt, and I made requests to those paths before checking, which is disclosed below. 1688 search returns an anti-bot interstitial and its developer site redirects to login. DHgate, Global Sources, ImportYeti, ImportGenius and Volza returned challenge or block pages. Qichacha, Tianyancha and Aiqicha returned errors, region restriction, or an access-restriction page. Pricing pages for Apify, ScraperAPI, Oxylabs and Bright Data are reachable.

### Cited Findings

Reachability matrix (all tests dated 2026-10-09; "allowed" means no '*' rule matched the tested path):

| Source | Test URL | Exact HTTP outcome | Login or key? | Structured data? | robots.txt / ToS | Verdict |
|---|---|---|---|---|---|---|
| Made-in-China search | [Adjustable_Dumbbell.html](https://www.made-in-china.com/products-search/hot-china-products/Adjustable_Dumbbell.html) | 200, 757,612 bytes; server-rendered; no challenge | No | HTML product cards (30 parsed, see KQ2) | [robots](https://www.made-in-china.com/robots.txt) 200: search path allowed for '*' and for the AI-crawler group. [ToS](https://www.made-in-china.com/help/terms/) 200, 61,042 bytes | Usable; robots-allowed |
| Made-in-China homepage | [made-in-china.com](https://www.made-in-china.com/) | 200, 401,540 bytes | No | n/a | Allowed | Reachable |
| AliExpress search | [wholesale-adjustable-dumbbell.html](https://www.aliexpress.com/w/wholesale-adjustable-dumbbell.html) | 200, 710,716 bytes; no login wall | No | Product JSON in one script block (60 items, see KQ2) | [robots](https://www.aliexpress.com/robots.txt) 200: /w/ not disallowed; /search/*, /product/*, /api/* disallowed. ToS link led to a 698-byte redirect page; the ToS itself was not fetched (see gaps) | Usable (retail listings); robots-allowed |
| AliExpress Open Platform | [openservice.aliexpress.com](https://openservice.aliexpress.com/) | 200, 5,117 bytes; SPA shell ("AliExpress Open Platform") | Approval (secondary) | No | [robots](https://openservice.aliexpress.com/robots.txt) 404 (no robots file) | Shell only |
| AliExpress developers site | [developers.aliexpress.com](https://developers.aliexpress.com/) | 500, 643 bytes ("500 Internal Server Error") | n/a | No | Not retrieved (probe made without a robots check) | Error |
| Alibaba.com trade search | [trade/search](https://www.alibaba.com/trade/search?SearchText=adjustable+dumbbell) | 200, 90,731 bytes; no visible text (client-rendered) | n/a | No (static) | [robots](https://www.alibaba.com/robots.txt) 200, 5,406 bytes: Disallow: /trade/ for all agents. Probe made in error | Do not automate; not sampled |
| Alibaba.com homepage | [alibaba.com](https://www.alibaba.com/) | 200, 225,305 bytes | No | n/a | Root allowed; no ToS link found in static HTML | Reachable; no sourcing data |
| Alibaba Open Platform | [open.alibaba.com](https://open.alibaba.com/) | 200, 4,608 bytes; SPA shell ("Alibaba.com") | Approval (secondary) | No | [robots](https://open.alibaba.com/robots.txt) 200, 25 bytes = "Disallow: /" for all agents. Probe made in error | Do not automate |
| Alibaba developers site | [developers.alibaba.com](https://developers.alibaba.com/) | Proxy returned CONNECT 502 (curl exit 56); no response body | n/a | n/a | Not retrieved (probe made without a robots check) | Unreachable through the proxy |
| 1688 search | [offer_search.htm](https://s.1688.com/selloffer/offer_search.htm?keywords=%E5%8F%AF%E8%B0%83%E8%8A%82%E5%93%91%E9%93%83) | 200, 2,519 bytes; anti-bot interstitial (sessionStorage x5referer, then a redirect to "/_____tmd_____/punish?x5secdata=…") | Verification challenge | No | [robots](https://s.1688.com/robots.txt): 302 → 301 → 200 with the same interstitial HTML; no robots file is served | Blocked by challenge; not bypassed |
| 1688 homepage | [www.1688.com](https://www.1688.com/) | 200, 124,078 bytes; visible text only "阿里1688首页" | Unknown (JS-rendered) | No | [robots](https://www.1688.com/robots.txt) 200, 8,388 bytes (see below) | JS shell |
| 1688 Open Platform | [open.1688.com](https://open.1688.com/) | Homepage 200, 66,109 bytes; SPA with 8 visible characters ("阿里巴巴开放平台"). Robots: 302 → login.1688.com/member/signin.htm (curl exit 47 after redirects) | Login wall | No | Robots request ends at a login redirect | Developer docs not reachable without login |
| Global Sources search | [searchList/product-search](https://www.globalsources.com/searchList/product-search?keyword=adjustable%20dumbbell) | 403, CloudFront "Request blocked" page (919 bytes) | Blocked | n/a | [robots](https://www.globalsources.com/robots.txt) also 403. Probe made without a robots check | Blocked at CDN |
| DHgate search | [wholesale/search.do](https://www.dhgate.com/wholesale/search.do?searchkey=adjustable+dumbbell) | 403, Cloudflare "Just a moment…" (cf-mitigated: challenge), 5,546 bytes | Challenge | No | [robots](https://www.dhgate.com/robots.txt) 200, 11,054 bytes: "/search.do" and query-string URLs disallowed. Probe made in error | Blocked; not bypassed |
| DHgate homepage | [dhgate.com](https://www.dhgate.com/) | 200 → 403, 5,320 bytes (cf-mitigated: challenge) | Challenge | n/a | Root allowed by robots | Blocked |
| ImportYeti search | [search?q=adjustable+dumbbell](https://www.importyeti.com/search?q=adjustable+dumbbell) | 403, Cloudflare challenge (cf-mitigated: challenge), 5,486 bytes | Challenge | No | [robots](https://www.importyeti.com/robots.txt) 200, 167 bytes: "/search?q" disallowed. Probe made in error | Blocked |
| ImportYeti pricing | [pricing](https://www.importyeti.com/pricing) | 403, Cloudflare challenge, 5,387 bytes | Challenge | n/a | Robots allows /pricing | Blocked; prices from secondary sources only |
| ImportGenius pricing | [pricing](https://www.importgenius.com/pricing) | 403, empty body | Blocked | n/a | [robots](https://www.importgenius.com/robots.txt) 403. Probe made without a robots check | Blocked |
| Volza | [volza.com](https://www.volza.com/) | 403, Cloudflare "Sorry, you have been blocked" | Blocked | n/a | [robots](https://www.volza.com/robots.txt) 200, 339 bytes: /search/ and /*bill-of-lading* disallowed | Blocked |
| Panjiva | [panjiva.com](https://panjiva.com/) | 200, 33,072 bytes; "Sign in" and "Request a Demo" | Account needed for data | No public listings | [robots](https://panjiva.com/robots.txt) 200, 7,228 bytes, 121 '*' rules. The ToS link goes to spglobal.com, whose robots returns 403, so the ToS was not fetched | Marketing page only |
| Canton Fair | [en/](https://www.cantonfair.org.cn/en/) → [en-US](https://www.cantonfair.org.cn/en-US) | 302 → 200, 1,784 bytes; title only; the static HTML contains a script that tests the browser time zone for Shanghai or Chongqing | No | No exhibitor links in static HTML | [robots](https://www.cantonfair.org.cn/robots.txt) returns the homepage HTML, so no robots file is served | Exhibitor search not located |
| Qichacha search | [web/search?key=…](https://www.qcc.com/web/search?key=%E5%93%91%E9%93%83) | 302 → /405.html (body "405 {traceid…}") | n/a | No | [robots](https://www.qcc.com/robots.txt) 200, 1,555 bytes: "/*?*" and "/web/search*" disallowed. Probe made in error | Blocked |
| Qichacha OpenAPI | [openapi.qcc.com](https://openapi.qcc.com/) | Proxy CONNECT 200, then connection reset (curl exit 35) after 7.9 s; no body | n/a | n/a | Not retrieved (probe made without a robots check) | Unreachable |
| Tianyancha search | [search?key=…](https://www.tianyancha.com/search?key=%E5%93%91%E9%93%83) | 419, region-restriction page (Chinese and English text) | Region block | No | [robots](https://www.tianyancha.com/robots.txt) 200, 906 bytes: "/search?" disallowed. Probe made in error | Region-blocked; not bypassed |
| Tianyancha Open | [open.tianyancha.com](https://open.tianyancha.com/) | 302 → /data → 419 (same region block) | Region block | n/a | Robots not retrieved | Region-blocked |
| Aiqicha search | [s?q=…](https://aiqicha.baidu.com/s?q=%E5%93%91%E9%93%83) | 302 → /acount/accessrestriction, 0-byte body | Access restriction | No | [robots](https://aiqicha.baidu.com/robots.txt): connection reset (curl exit 35). Probe made without a robots check | Restricted |
| Apify store | [store?search=alibaba](https://apify.com/store?search=alibaba) | 200, 593,979 bytes; no "alibaba" text in static HTML | Browsing needs no login | Not in static HTML | [robots](https://apify.com/robots.txt) 200, 174 bytes: Allow: / | Listing is client-rendered |
| Apify pricing | [pricing](https://apify.com/pricing) | 200, about 447 KB | No | Plan text | Allowed | Usable |
| Apify actor: Alibaba Scraper (memo23) | [actor page](https://apify.com/memo23/alibaba-scraper) | 200, 438,068 bytes | No | Actor description and price text | Allowed | Usable (text only) |
| Apify actor: Alibaba Product Search Scraper (easyapi) | [actor page](https://apify.com/easyapi/alibaba-product-search-scraper) | 200, 431,210 bytes | No | Actor description and price text | Allowed | Usable (text only) |
| RapidAPI hub | [search/alibaba](https://rapidapi.com/search/alibaba), [search/1688](https://rapidapi.com/search/1688) | 200, about 248 KB each; "API Hub" only (client-rendered) | Account needed to use APIs | No (listings not in static HTML) | [robots](https://rapidapi.com/robots.txt) 200, 1,056 bytes: /search/alibaba not disallowed | JS shell |
| ScraperAPI pricing | [pricing](https://www.scraperapi.com/pricing/) | 200, 1,611,146 bytes | No | Plan text | [robots](https://www.scraperapi.com/robots.txt) 200: /terms/ disallowed, so its ToS was not fetched | Usable |
| Oxylabs pricing | [pricing](https://oxylabs.io/pricing) | 200, 370,116 bytes | No | Plan text | [robots](https://oxylabs.io/robots.txt) 200, 121 bytes, no '*' restrictions | Usable |
| Bright Data pricing | [pricing](https://brightdata.com/pricing) | 200, 234,001 bytes | No | Plan text | [robots](https://brightdata.com/robots.txt) 200, 609 bytes: Crawl-delay 5 | Usable |
| Bright Data datasets | [products/datasets](https://brightdata.com/products/datasets) | 200, 2,180,233 bytes | No | Catalogue text | As above | Usable |
| TMAPI | [tmapi.top](https://tmapi.top/); [/pricing](https://tmapi.top/pricing) | Homepage 200, 16,144 bytes. /pricing returned 200 with identical bytes (same hash), so no separate pricing page exists at that path | API key (not tested) | Landing text names Taobao, 1688, Amazon, Shopee | [robots](https://tmapi.top/robots.txt) 200, 65 bytes, empty Disallow | Usable landing page; no price found |
| Onebound | [onebound.cn](https://www.onebound.cn/) | 200, 62,695 bytes (Chinese) | API key (not tested) | Landing text: "电商API平台", "1688代采系统" | [robots](https://www.onebound.cn/robots.txt) 200, 24 bytes, empty Disallow | Usable landing page; no price or API links found in static HTML |

Robots.txt and ToS findings already checked:
- Alibaba: '*' group disallows /trade/, /product/, /supplier/guide/, /searchweb/*.html. GPTBot and Google-Extended are fully disallowed ([robots](https://www.alibaba.com/robots.txt)).
- open.alibaba.com: "Disallow: /" for all agents ([robots](https://open.alibaba.com/robots.txt)).
- 1688: '*' group disallows /offer/, /company/*?, /store/*?*, /chanpin/*?* ([robots](https://www.1688.com/robots.txt)). The s.1688.com host has no robots file ([robots](https://s.1688.com/robots.txt)).
- Made-in-China: '*' group disallows *.do, *.action, /sendInquiry/, /member/, /products-search/find-china-products/*-1.html, /company-search/, /img-search/, /ai-search/, /products-search/ai-mode/. The AI-crawler group (GPTBot, ClaudeBot, CCBot, PerplexityBot and others) explicitly allows /products-search/ and /manufacturers/ ([robots](https://www.made-in-china.com/robots.txt)).
- Made-in-China ToS: [ToS](https://www.made-in-china.com/help/terms/) (61,042 bytes; 23,893 visible characters). A keyword search for robot, spider, crawl, scrap, automated, harvest, data mining and extract found no crawler or scraping clause. The only data-collection prohibition is item (5): collecting information about other users, including email addresses and user IDs, without consent (section II.3). The ToS also says information published on MIC is the property of Focus Tech. or the information provider. The keyword search does not replace a full legal read.
- AliExpress: '*' group disallows /search/*, /product/*, /productdetail/*, /api/*, /items/*. Allows /wholesale.html$ and /wholesale-page-*.html ([robots](https://www.aliexpress.com/robots.txt)).
- DHgate: '*' group disallows /search.do, /sellerPromise.do and query-string URLs ([robots](https://www.dhgate.com/robots.txt)).
- ImportYeti: Allow: /. Disallow: /search?q, /api/addresses, /api/ep, /cdn-cgi/, /mx/, /us-export/, /partnerships/ ([robots](https://www.importyeti.com/robots.txt)).
- Qichacha: '*' group disallows /*?* (all query URLs), /search?key=*, /web/search*, /api* ([robots](https://www.qcc.com/robots.txt)).
- Tianyancha: '*' group disallows /search/*, /search?, /search* ([robots](https://www.tianyancha.com/robots.txt)).
- Volza: Allow: /. Disallow: /search/, /thank-you/, /*bill-of-lading* ([robots](https://www.volza.com/robots.txt)).
- Apify: Allow: /, with content-signal "search=yes, ai-input=yes, ai-train=yes" ([robots](https://apify.com/robots.txt)). Apify ToS: "Accounts registered by 'bots' or other automated methods are not permitted". The license bars reverse-engineering and interfering with the Services. The customer is "solely responsible for the legality, accuracy, quality, appropriateness, and use of all Customer Data" ([ToS](https://docs.apify.com/legal/general-terms-and-conditions), fetched 2026-10-09, 88,458 bytes).
- Bright Data: Crawl-delay 5; disallows /lum/, /www/*, /svc/*, /products/datasets2/ ([robots](https://brightdata.com/robots.txt)).
- ScraperAPI: disallows /wp-admin/, /wp-login.php and /terms/ ([robots](https://www.scraperapi.com/robots.txt)).
- Panjiva's ToS points to spglobal.com, whose robots.txt returned 403 ([robots](https://www.spglobal.com/robots.txt)).
- Global Sources: robots.txt returned 403 from CloudFront ([robots](https://www.globalsources.com/robots.txt)).

Process deviations (disclosed):
- Six batch-1 requests went to paths that robots.txt disallows: the [Alibaba trade search](https://www.alibaba.com/trade/search?SearchText=adjustable+dumbbell) (/trade/), the [open.alibaba.com root](https://open.alibaba.com/) (Disallow: /, read later), the [DHgate search](https://www.dhgate.com/wholesale/search.do?searchkey=adjustable+dumbbell) (query-string URL), the [ImportYeti search](https://www.importyeti.com/search?q=adjustable+dumbbell) (/search?q), the [Qichacha search](https://www.qcc.com/web/search?key=%E5%93%91%E9%93%83) (/web/search*), and the [Tianyancha search](https://www.tianyancha.com/search?key=%E5%93%91%E9%93%83) (/search?). Each was one request with no retries. None of those response bodies was used for extraction.
- Eight more requests were made before robots.txt could be read, or where it was unavailable: the [Global Sources search](https://www.globalsources.com/searchList/product-search?keyword=adjustable%20dumbbell) (robots 403), the [ImportGenius pricing page](https://www.importgenius.com/pricing) (robots 403), the [Aiqicha search](https://aiqicha.baidu.com/s?q=%E5%93%91%E9%93%83) (robots reset), the [Qichacha OpenAPI](https://openapi.qcc.com/), the [Tianyancha Open](https://open.tianyancha.com/), the [developers.alibaba.com](https://developers.alibaba.com/) and [developers.aliexpress.com](https://developers.aliexpress.com/) hosts, and the [open.1688.com](https://open.1688.com/) root (its robots.txt then redirected to login).
- From batch 2 onward, every fetch was gated on robots.txt. Robots responses other than 200 or 404 (for example 400, 403, or a reset) were treated as unknown, and no content was fetched from those hosts. A 404 was treated as no restriction, following the RFC 9309 convention (openservice.aliexpress.com).

### Inferences
- The only sourcing search paths that are both reachable without a challenge and not disallowed by robots.txt are Made-in-China (/products-search/) and AliExpress (/w/). Both are candidates for automated reading, subject to a ToS review.
- Alibaba's robots.txt disallows its trade-search path for all agents, and its open-platform host is disallowed entirely. Automated access to Alibaba search therefore runs against the site's stated crawl policy.
- Keyword search URLs are disallowed on DHgate (its "/*?" rule, apart from a few allow-listed parameters), Tianyancha ("/search?") and Qichacha ("/*?*"), so automated keyword search on those sites is off-limits under their robots.txt.

### Gaps
- Not retrieved or not located: Alibaba.com ToS (no ToS links in static HTML), 1688 ToS, DHgate ToS, Global Sources ToS, ImportYeti ToS, ImportGenius ToS, Volza ToS, Canton Fair ToS, and the AliExpress ToS. The AliExpress ToS link is on terms.alicdn.com, whose robots.txt returned HTTP 400 ([robots](https://terms.alicdn.com/robots.txt)), so it was treated as unknown and not fetched. Panjiva's ToS sits behind spglobal.com's robots 403. ScraperAPI's ToS sits under /terms/, which its robots.txt disallows.
- Supplier subdomain pages (for example [xinlianhai.en.made-in-china.com](https://xinlianhai.en.made-in-china.com)) were not fetched, so supplier-level robots and ToS were not checked.

## Key question 2: Sample extraction, "adjustable dumbbell"

### Takeaway
Made-in-China is the only tested source that gives supplier-level records (name, badge, price range, MOQ and location) without a login. Its search page shows 30 product cards from 24 distinct suppliers. AliExpress returns consumer retail listings, with sale price and sold count but no supplier name, badge, MOQ or location. Alibaba, 1688, Global Sources, DHgate, ImportYeti, Qichacha, Tianyancha and Aiqicha yielded no records in this test.

### Cited Findings

Made-in-China, search page allowed by robots.txt (fetched 2026-10-09, HTTP 200, 757,612 bytes; [search page](https://www.made-in-china.com/products-search/hot-china-products/Adjustable_Dumbbell.html)). Card counts: 30 product cards; labels across the 30 cards were "Audited Supplier" on 28, "Trading Company" on 13, and "Manufacturer/Factory" on 3. Three cards carried both "Manufacturer/Factory" and "Trading Company". Two cards carried no label (both from Asialink International (Hk) Limited, shown as "Member Guangdong, China"). Prices and MOQ are in separate spans on each card, and the price is shown without a unit.

Five records, chosen to show each label type:

| # | Supplier (as on card) | Badge on card | Price range (US$, unit not shown) | MOQ (as on card) | Location (as on card) | Supplier URL | Product URL |
|---|---|---|---|---|---|---|---|
| 1 | Nantong Vigor Sport Goods Co., Ltd. | Manufacturer/Factory; Trading Company; Audited Supplier | 43.00 – 48.50 | 20 Pieces | Jiangsu, China | [vigfit](https://vigfit.en.made-in-china.com) | [product](https://vigfit.en.made-in-china.com/product/LpyRKaJvhNkU/China-Adjustable-Dumbbell-Fitness-Equipment-Free-Weights-Hand-Weights.html) |
| 2 | Shandong Minolta Fitness Equipment Co., Ltd | Manufacturer/Factory; Trading Company; Audited Supplier | 40.00 – 60.00 | 1 Pair | Shandong, China | [supplier](https://2379be2cf4fbaaaf.en.made-in-china.com) | [product](https://2379be2cf4fbaaaf.en.made-in-china.com/product/mdRtGSBUHWry/China-Gym-Fitness-Equipment-Free-Weight-Home-Gym-Machine-Adjustable-Dumbbell.html) |
| 3 | Hebei Dili Sports Commerce Co., Ltd. | Trading Company; Audited Supplier | 18.00 – 55.00 | 100 kg | Hebei, China | [dili-fitness](https://dili-fitness.en.made-in-china.com) | [product](https://dili-fitness.en.made-in-china.com/product/etCUkWdjlbrH/China-OEM-ODM-Chrome-Dumbbell-Set-15kg-20kg-Adjustable-Electroplated-Iron-for-Home-Gym-Wholesale.html) |
| 4 | TIANJIN SWOCH TECHNOLOGY CO., LTD. | Audited Supplier only | 44.00 – 49.00 | 1 Piece | Tianjin, China | [xuwochen](https://xuwochen.en.made-in-china.com) | [product](https://xuwochen.en.made-in-china.com/product/gfSRXLYERhpm/China-Durable-Anti-Slip-Adjustable-Dumbbell-Set-for-Full-Body-Exercise.html) |
| 5 | Hefei Bodyup Sports Co., Ltd. | Audited Supplier only | 37.00 – 40.00 | 100 Sets | Anhui, China | [bodyupsports](https://bodyupsports.en.made-in-china.com) | [product](https://bodyupsports.en.made-in-china.com/product/yGwrveBUlDVk/China-Compact-Adjustable-Dumbbells-for-Home-Fitness-and-Gym-Workouts.html) |

Notes on the Made-in-China labels: "Manufacturer/Factory" and "Trading Company" are as displayed on the search card. I did not check them against each supplier's profile. The meaning of "Audited Supplier" was not verified.

AliExpress, search page allowed by robots.txt (fetched 2026-10-09, HTTP 200, 710,716 bytes; [search page](https://www.aliexpress.com/w/wholesale-adjustable-dumbbell.html)). The page embeds 60 product objects in one script block. The first five:

| # | Title (abridged) | Sale price (original; discount) | Sold text | Product URL |
|---|---|---|---|---|
| 1 | 5-44lbs Adjustable Dumbbell to Barbell Set, Anti-Slip Grip, Versatile Home Gym Fitness Strength Training Barbell Weight Plates | US $33.05 (US $100.74; 67% off) | 600+ sold | [item](https://www.aliexpress.com/item/3256811374038586.html) |
| 2 | 22lb 2-in-1 Adjustable Dumbbell & Barbell Set for Home Exercise & Fitness | US $25.53 (US $70.27; 63% off) | 76 sold | [item](https://www.aliexpress.com/item/3256811788693320.html) |
| 3 | Adjustable Dumbbells, 44lbs Free Weight Set with Connector, 4 In1 Dumbbells Set Used As Barbell, Kettlebells, Push Up Stand for Home Gym | US $39.37 (US $114.46; 65% off) | 51 sold | [item](https://www.aliexpress.com/item/3256812679560660.html) |
| 4 | Adjustable Dumbbell Set Home Gym Weight Set with Baked Enamel Cast Iron Plates Space-Saving Free Weights for Strength Training | US $65.28 (US $176.44; 63% off) | none shown | [item](https://www.aliexpress.com/item/3256813102695337.html) |
| 5 | Dumbbell Sets Adjustable Weights, 44 Lb Free Weights Dumbbells Set for Home Gym | US $36.96 (US $96.53; 61% off) | 8 sold | [item](https://www.aliexpress.com/item/3256813019116222.html) |

The store name, ship-from location, MOQ and any manufacturer or trader badge are absent from the search-result payload for these five items. I checked the keys of the first item and searched all five for store, seller and ship-from fields, and none appeared. These are consumer retail prices.

Not sampled, with the reason from Key Question 1: Alibaba.com (robots disallows /trade/); 1688 (anti-bot interstitial at s.1688.com); Global Sources (CloudFront 403); DHgate (Cloudflare challenge); ImportYeti (Cloudflare challenge, and /search?q is disallowed); Canton Fair (exhibitor search not located); Qichacha, Tianyancha and Aiqicha (error, region and access-restriction responses).

### Inferences
- Among the tested sources, Made-in-China is the only one that gives supplier name, badge, price range, MOQ and location together without a login. Of the 30 cards on this page, 3 show a Manufacturer/Factory label and 13 show a Trading Company label. This is an observation from one page of results, not a market statistic.
- AliExpress prices are retail (US $25–65 sale prices on these listings) and are not comparable to Made-in-China factory ranges without normalising for kit weight, MOQ and shipping.

### Gaps
- One results page per source was sampled. Supplier profile pages, certifications and factory audits were not checked.
- The price unit is not shown on the Made-in-China cards in these samples, so the unit is unverified.
- AliExpress store names and ship-from locations are not in the search payload. Item pages were not fetched.
- The meaning of Made-in-China's "Audited Supplier" label was not verified.
- Canton Fair exhibitor records were not reachable.

## Key question 3: Costed API and data options, and recommended stack

### Takeaway
No registered developer API tested here offers a buyer-side product search for Alibaba, 1688, Made-in-China or Global Sources at a verified price. The verified paid options are general scraping and data platforms (Apify, ScraperAPI, Oxylabs, Bright Data). Alibaba-specific coverage on those platforms is limited to community actors on Apify. The cheapest legitimate starting point is manual sourcing on Made-in-China and AliExpress at $0 cash, plus one trade-data subscription if US brand-supplier mapping is needed. Any automation carries ToS and robots.txt risk and needs review first.

### Cited Findings

Option table. "Verified" means read from the vendor page on 2026-10-09. "Secondary" means taken from a WebSearch snippet and not fetched.

| Option | Access | Price | What it returns | Terms or robots note | Confidence |
|---|---|---|---|---|---|
| Alibaba.com Open Platform (seller and ISV APIs) | Seller or ISV account, app key and secret, approval per API (secondary: [Odoo add-on docs](https://docs.ecosire.com/odoo-modules/alibaba); [ISV rules](https://terms.alicdn.com/legal-agreement/terms/suit_bu1_b2b/suit_bu1_b2b201912311648_93629.html)) | No price found | Buyer-side search endpoint unverified; one third-party guide names alibaba.procurement.supplier.items.get, but its text was truncated | open.alibaba.com robots: "Disallow: /" for all agents (verified) | Low |
| 1688 Open Platform (open.1688.com) | Enterprise account and qualifications. Verified: robots and docs sit behind a login redirect ([robots](https://open.1688.com/robots.txt)). Secondary: a [2025 third-party guide](https://juejin.cn/post/7549888200229077027) says individuals get only basic query permissions and a company entity is the baseline. An [Alibaba Cloud article](https://developer.aliyun.com/article/1751134) (secondary) says the same | No price found | Unverified | Login wall | Low |
| AliExpress Open Platform / Affiliate | Approval required (not verified here). [Homepage](https://openservice.aliexpress.com/) is an SPA shell | No price found | Unverified | robots 404 (no file) | Low |
| Made-in-China (no developer API found) | Manual search and supplier pages | Free | Card fields as in KQ2 | Search path allowed by robots. ToS has no crawler clause found; item (5) prohibits collecting user information | Medium |
| Apify platform | Account needed (not tested) | Verified ([pricing](https://apify.com/pricing)): Free $0 with $5 of usage; Starter $19/month with $19 of usage; Scale $199/month with $199; Business $999/month with $999. Compute unit $0.20 down to $0.13. Monthly and annual billing (annual shows -10%) | Platform for running actors | ToS: customer responsible for legality of Customer Data ([ToS](https://docs.apify.com/legal/general-terms-and-conditions)) | High (prices) |
| Apify actor: Alibaba Scraper (memo23) | Actor on Apify | Verified: "Pricing from $2.00 / 1,000 results" ([actor](https://apify.com/memo23/alibaba-scraper)) | Per the actor's page: title, price range, MOQ, supplier data, product URL | Community-built; targets Alibaba, whose robots.txt disallows /trade/ | Medium (page text only) |
| Apify actor: Alibaba Product Search Scraper (easyapi) | Actor on Apify | Verified: "Pricing from $4.99 / 1,000 results" ([actor](https://apify.com/easyapi/alibaba-product-search-scraper)) | Per the page: titles, prices, brands, images, product URLs | As above | Medium (page text only) |
| ScraperAPI | API key | Verified ([pricing](https://www.scraperapi.com/pricing/)): Hobby $49/month (100,000 credits); Startup $149/month (1,000,000); Business $299/month (3,000,000); Scaling $475/month (5,000,000). Annual rates shown | General scraping; no Alibaba, 1688 or Taobao text on the pricing page (text search) | ToS not fetched (robots disallows /terms/) | High (price) |
| Oxylabs | API key | Verified ([pricing](https://oxylabs.io/pricing)): Starter $30/month; Basic $100/month; Flexible $500/month; Enterprise from $2,500/month; Web API /Search $1 per 1K searches | General; no Alibaba, 1688 or Taobao text on the pricing page | ToS not fetched | High (price) |
| Bright Data | API key | Verified ([pricing](https://brightdata.com/pricing)): Unlocker, Crawl and SERP APIs from $1 per 1K requests; Browser API from $5/GB; Datasets from $250 per 100K records. [Datasets page](https://brightdata.com/products/datasets) has no Alibaba or 1688 text | General; no Alibaba or 1688 products shown | robots: Crawl-delay 5 | High (price) |
| TMAPI (Taobao, 1688, Amazon, Shopee) | API key (not tested) | No price found; [/pricing](https://tmapi.top/pricing) returned the homepage bytes | [Landing page](https://tmapi.top/) lists 1688 among its platforms | robots: no restriction | Low |
| Onebound (万邦) | API key (not tested) | No price found; no pricing or API links in static HTML | [Landing page](https://www.onebound.cn/) lists "电商API平台" and "1688代采系统" | robots: no restriction | Low |
| RapidAPI hub | Account needed (not tested) | Per API; not visible in static HTML | Hub category "alibaba" present in the page payload ([search/alibaba](https://rapidapi.com/search/alibaba)) | robots does not disallow /search/alibaba | Low |
| ImportYeti (US import records) | Account; pricing page behind a Cloudflare challenge | Secondary: Free; Professional $50/month billed annually ($600 per user per year); Enterprise from $1,000 per organisation per month ([Capterra](https://www.capterra.com/p/10006176/ImportYeti/pricing/); [FitGap](https://us.fitgap.com/products/040781/importyeti)). API not mentioned | Search not accessible from here | robots disallows /search?q | Low |
| ImportGenius (US) | Account; pricing page returned 403 | Secondary: entry tier $125/month on annual billing ([Capterra](https://www.capterra.com/p/10032153/ImportGenius/reviews/)) or $199/month ([FitGap](https://us.fitgap.com/products/importgenius)); Business $399/month annual; USA Pro $319/month annual per the [pricing-tester page](https://www.importgenius.com/dev-pages/pricing-tester); Enterprise $899/month annual (FitGap) or from $1,999/month (vendor landing snippet). FitGap says Enterprise includes API and SSO delivery | US data per listings | robots not retrieved (403) | Low |
| Volza | Account; Cloudflare block on the homepage | Secondary and conflicting: Starter about $1,500–3,000 a year and Professional $5,000–8,000 a year ([Dupple](https://dupple.com/reviews/volza)). Enterprise with API quoted at $1,000–1,500+/month in a [Listicler guide](https://listicler.com/blog/volza-pricing-worth-it-export-businesses), and $15,000–40,000+/year in a [Listicler breakdown](https://listicler.com/blog/volza-pricing-breakdown-worth-annual-seat) | Global trade data per listings | robots disallows /search/ and /*bill-of-lading* | Low |
| Panjiva (S&P Global) | Demo or sign-in ([home](https://panjiva.com/)) | No public price. [G2](https://www.g2.com/products/panjiva/pricing) says to ask Panjiva. A 2010 article quotes about $4,000 a year for one user ([Xconomy](https://legacy.xconomy.com/2010/05/24/scanning-the-world-for-reliable-suppliers-panjiva-seeks-to-bring-order-to-a-messy-process/2)), which is outdated | Global trade data | ToS not fetched | Low |
| Qichacha OpenAPI | [openapi.qcc.com](https://openapi.qcc.com/) connection reset | No verified price | Company registry | robots disallows /*?* | None |
| Tianyancha Open | [open.tianyancha.com](https://open.tianyancha.com/) region-restricted | No official price. A third-party Apify actor lists $3 per 1,000 basic-info results ([actor](https://apify.com/spider_studio/tianyancha-basic-info)), which is a scraper and not an official rate | Company registry | robots disallows /search? | Low |
| Canton Fair (official) | No API found; exhibitor search not located | Free (manual). Secondary: a [buyer guide](https://infobusiness.bcci.bg/content/file/Buyers_Guide_for_the_127th_Canton_Fair_Online_(002).pdf) points to www.cantonfair.org.cn | Exhibitor data, manual | Not checked | Low |

### Inferences

Recommended stack for a small Australian importer. These are my recommendations, based on what was verified above:

1. Stack 1, $0 cash (start here). Source by hand on Made-in-China and AliExpress, and use Canton Fair when you attend or the online session runs. Use the labels as a first filter (Manufacturer/Factory, Trading Company, Audited Supplier), then verify each supplier on its own profile page before contact. This is the only route in this test that is reachable without an account and allowed by robots.txt. The Made-in-China ToS text reviewed here has no crawler clause, but automated bulk collection still needs a legal read.
2. Stack 2, about US$19–25 a month, only if repeated pulls are needed. Apify Starter ($19/month, including $19 of usage) with a pay-per-result actor at $2.00–4.99 per 1,000 results. The actors tested here target Alibaba listings, and Alibaba's robots.txt disallows its trade-search path. Treat this as a compliance decision, not a default. A Made-in-China-specific actor would fit the robots rules better, but none was verified here.
3. Stack 3, only if you need US brand-supplier intelligence. ImportYeti Professional (about $50/month billed annually) or ImportGenius USA Essentials (about $125–199/month). Both are secondary prices and both cover US records. Neither was verified to cover Australian import records. Confirm current prices on the vendor pages first.
4. Not recommended as a base. 1688-based scraping APIs (TMAPI, Onebound): no verified prices, API keys required, and no verified legal basis. The official 1688 developer route appears to require Chinese enterprise qualifications (secondary).

Chinese company-registry checks (Qichacha, Tianyancha, Aiqicha) could not be verified from this environment. Supplier identity checks may need to be done by hand from the supplier's registration documents.

### Gaps
- No verified official buyer-side API exists for Alibaba, 1688, Made-in-China or Global Sources in this test.
- Secondary prices for ImportYeti, ImportGenius, Volza and Panjiva come from search snippets. The vendor pricing pages were blocked (403 or Cloudflare) or not fetched.
- TMAPI and Onebound prices and terms were not found. RapidAPI per-API prices are not visible in static HTML.
- No Australian import-record source was tested.
- No legal review was performed. This is not legal advice on ToS or robots.txt compliance.
