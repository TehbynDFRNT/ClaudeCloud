# Factory-vs-trader verification toolkit for an Australian small importer (hands-on tests, 2026-10-10)

Status: final. All probes were run on 2026-10-10 between 03:21 and 03:47 UTC from a cloud container, through the configured egress proxy.

Method and rules followed:
- No accounts, logins, API keys, supplier contact, or CAPTCHA/slider/WAF solving.
- robots.txt was fetched before every content request. Rules were applied RFC 9309-style (longest match, `*` and `$`), using the `*` group plus any ClaudeBot / Claude-User / anthropic-ai / Claude-SearchBot group; the most restrictive verdict won.
- If robots.txt returned anything other than 200 or 404/410 (403, 451, 5xx, a challenge, a TLS reset), no content was fetched from that host. The robots response itself is recorded as the reachability outcome.
- POST requests went only to two public lookup endpoints that the sites' own pages call, both without robots files: the TÜV verification portal (2 form posts and 4 AjaxSearch calls, one of them reset) and CNINFO (4 calls: one zero-result query with a guessed orgId, one topSearch, and two that were reset). PATENTSCOPE received 3 GETs.
- One host-specific fallback: Google Patents' robots.txt was read through the WebFetch tool after curl got Google's "automated queries" 503.
- WebSearch was used for 22 queries until the shared quota ran out mid-session (the 23rd was refused). Items marked "(search summary)" come from the search tool's summary of result pages and were not fetched directly.
- Scripts: /tmp/claude-0/-home-user-ClaudeCloud/fd8ac9c1-a7a0-5273-919b-865b602ed3de/scratchpad/factory_tools/scripts/ (probe.py, digest.py, ig_extract.py, mic_parse.py, b1–b23.tsv).
- Raw responses: .../factory_tools/downloads/<host>/ (plus results_b*.jsonl and robots_b*.json).

## Q1. Reachability matrix: which verification sources work from here, and on what terms

### Takeaway
Only three source families returned usable factory evidence to an automated, no-login client:
- **US customs bill-of-lading summaries on ImportGenius and Panjiva public pages.** Both are robots-allowed, return HTTP 200 and need no login. They show the shipper name and address, consignees, container counts and product text.
- **Made-in-China supplier profiles.** These separate "verified by TÜV Rheinland/BV" fields from "provided by supplier" fields.
- **TÜV Rheinland's report-verification portal.**

What did not work:
- **Chinese registries:** GSXT returned an explicit IP block asking for real-name login. 信用中国, the customs credit platform, 名录集 and the MIIT/high-tech portals reset TLS. 启信宝 returned HTTP 451, and Qichacha/Tianyancha/Aiqicha were already blocked on 2026-10-09.
- **Patents:** Google Patents disallows search URLs in robots.txt and served this IP a 503 bot-check. Lens disallows AI agents. PATENTSCOPE needs its interactive form, and CNIPA needs login or timed out.
- **Most certification databases:** SGS 403, Intertek egress 502, UL 403, IECEE challenge, CNCA 521/reset. IAF and FSC disallow their data paths in robots.txt.
- **ImportYeti, Volza and Trademo:** WAF/Cloudflare 403.

Everything in the "did not work" list is still usable manually in a browser, and the playbook (Q4) relies on that.

### Cited Findings

**A. Customs bill-of-lading sources**

| Source | URL tested | Exact outcome (2026-10-10) | Login/captcha | Fields visible without login | robots.txt stance | Cost (published) |
|---|---|---|---|---|---|---|
| ImportGenius supplier pages | [nantong-tengtai-sporting](https://www.importgenius.com/suppliers/nantong-tengtai-sporting), [nantong-ironman-sporting-industrial](https://www.importgenius.com/suppliers/nantong-ironman-sporting-industrial), [zhejiang-jiecang-linear-motion-tech](https://www.importgenius.com/suppliers/zhejiang-jiecang-linear-motion-tech), [zhejiang-lingsha-technology-co-ltd](https://www.importgenius.com/suppliers/zhejiang-lingsha-technology-co-ltd), [heze-zhongran-woodware-co-ltd](https://www.importgenius.com/suppliers/heze-zhongran-woodware-co-ltd), [welfull-group-co-ltd](https://www.importgenius.com/suppliers/welfull-group-co-ltd), [ningbo-eto-outdoor-supplies-co-ltd](https://www.importgenius.com/suppliers/ningbo-eto-outdoor-supplies-co-ltd) | HTTP 200 on all 7; 79–122 KB of server-rendered HTML; no challenge | None for the summary page | **Header:** shipper name as typed on the B/L, shipper address, total shipments, date range, trading-partner count, ports. **Top 5 importers:** city, last arrival, container count, gross kg. **10 most recent B/L rows:** B/L no., free-text cargo description, importer, arrival date, origin, kg, packages. **One full sample B/L:** carrier/NVOCC, place of receipt, foreign port, vessel, master B/L, container and seal, notify party. HS code read "DATA UNAVAILABLE" in 6 of 7 samples (Welfull's sample showed "HS CODE 6110 2000") | [robots.txt](https://www.importgenius.com/robots.txt) 200: the `*` group is "Allow: /"; only named crawlers are barred from /search; no ClaudeBot group | Each page shows "Get United States data for $229" |
| ImportGenius, name not present | e.g. [ningbo-xusheng-leisure-products-co-ltd](https://www.importgenius.com/suppliers/ningbo-xusheng-leisure-products-co-ltd) | 301 → /tradebase, i.e. no page. Same for 5 other slug guesses (Taizhou Xusheng, Tengtai full name, Yongkang Dashing, welfull-group, Xusheng Leisure without "co-ltd") | — | — | Allowed | — |
| ImportGenius importer pages | [i-master-sports-c-o-rcs-dompanies](https://www.importgenius.com/importers/i-master-sports-c-o-rcs-dompanies), [importers/welfull-group-co-ltd](https://www.importgenius.com/importers/welfull-group-co-ltd) | HTTP 200 (95 KB, 114 KB) | None | The consignee's suppliers, so related shipper entities show up | Allowed | As above |
| Panjiva public profiles | [Zhejiang-Jiecang-Linear-Motion/26156026](https://panjiva.com/Zhejiang-Jiecang-Linear-Motion/26156026), [Zhejiang-Jiecang-Linear-Motion-Technology-Co-Ltd/33726776](https://panjiva.com/Zhejiang-Jiecang-Linear-Motion-Technology-Co-Ltd/33726776), [Welfull-Group-Co-Ltd/4255217](https://panjiva.com/Welfull-Group-Co-Ltd/4255217), [Ningbo-Xusheng-Group-Co-Ltd/137142503](https://panjiva.com/Ningbo-Xusheng-Group-Co-Ltd/137142503), [Heze-Zhongran-Woodware-Co-Ltd/62631236](https://panjiva.com/Heze-Zhongran-Woodware-Co-Ltd/62631236) | HTTP 200 on all 5; 41–48 KB; no challenge | Sign-in for detail | US shipment count; the 3 latest B/L rows (date, supplier, customer; product text masked as "XXXX"); customer count; top HS chapters; "top products" keywords; one sample B/L (shipper/consignee/notify addresses, kg, cartons, place of receipt, ports); Colombian import rows for some firms | [robots.txt](https://panjiva.com/robots.txt) 200 (7,228 B): the `*` group disallows about 120 /profile/... actions but not the /<Company>/<id> pages | Enterprise (S&P Global); no public price |
| ImportYeti | [supplier/nantong-ironman-sporting-industrial](https://www.importyeti.com/supplier/nantong-ironman-sporting-industrial) | HTTP 403, 5,861 B, title "Just a moment..." (Cloudflare challenge); not bypassed | Challenge | None directly; page titles appear in search results | [robots.txt](https://www.importyeti.com/robots.txt) 200: Allow /, Disallow /search?q and /api/... | Free tier (per earlier notes) |
| Trademo | [companies/nantong-ironman-sporting-industrial/3249500](https://www.trademo.com/companies/nantong-ironman-sporting-industrial/3249500) | HTTP 403 "Azure WAF" page | WAF | None directly | [robots.txt](https://www.trademo.com/robots.txt) 200: `*` Allow:/ and an explicit "User-agent: ClaudeBot / Allow: /" | Not seen |
| Volza | [volza.com](https://www.volza.com/) | HTTP 403, 5,844 B, "Attention Required! - Cloudflare" | Block | None | [robots.txt](https://www.volza.com/robots.txt) 200: Disallow /search/ and /*bill-of-lading* | Not seen |
| 52wmb (外贸邦) | [52wmb.com](https://www.52wmb.com/) | Homepage HTTP 200 (36,993 B); company and bill pages not requested because robots disallows them | Login for data | — | [robots.txt](https://www.52wmb.com/robots.txt) 200: `*` disallows /*?*, /supplier-*, /buyer-*, /supplierbill*, /buyerbill*, /trade*, /m* | Not seen |
| Tradesparq | [tradesparq.com/en](https://www.tradesparq.com/en) | 302 → /en, then 200 (477 KB) | Login for data | No pages for the test firms in search | robots.txt 404 (no file) | Not seen |
| Datamyne (Descartes) | [robots.txt](https://www.datamyne.com/robots.txt) | 200 (370 B): Crawl-delay 3; only /wp-admin/ disallowed | Subscription | No public company pages found | Allowed | Not seen |

**B. Supplier-platform profiles and auditor verification**

| Source | Outcome | robots.txt | What it shows |
|---|---|---|---|
| Made-in-China supplier sub-sites, e.g. [Lingsha company page](https://lsfunjump.en.made-in-china.com/company-Zhejiang-Lingsha-Technology-Co-Ltd.html), [Tengtai](https://tt-sports.en.made-in-china.com/company-Nantong-Tengtai-Sporting-Fitness-Co-Ltd-.html), [Xusheng](https://xushengcompany.en.made-in-china.com/company-NINGBO-XUSHENG-LEISURE-PRODUCTS-CO-LTD-.html) | HTTP 200 (113–252 KB) | The supplier-host robots.txt has a group naming ClaudeBot, Claude-User and Claude-SearchBot with "Allow: /$, /product/, /company-*.html, /Solutions/" | Auditor name and report no.; each block is labelled either "verified by TÜV Rheinland" or "Information provided by supplier"; plant area, registered capital, production lines, QC headcount, machine list (when verified) |
| Made-in-China search ([Camping_Kitchen_Table](https://www.made-in-china.com/products-search/hot-china-products/Camping_Kitchen_Table.html)) | HTTP 200, 783,108 B; 30 product cards from 22 suppliers parsed | [robots.txt](https://www.made-in-china.com/robots.txt): the AI-agent group allows /products-search/ (except /products-search/ai-mode/), /manufacturers/, /factory/, /audited-suppliers/ | Seller, province, price, MOQ, member level, "Audited" flag, business type (shown on only 11 of 30 cards) |
| TÜV Rheinland Corporate Identity Verification ([verified.chn.tuv.com](https://www.verified.chn.tuv.com/en/)), the "Verify Now" target on MIC TÜV-audited profiles | Homepage 200 (32,001 B). The search form POSTs to /Home/Search, and the page fills its results by POSTing {title: <name or report no.>} to /Home/AjaxSearch. Calls for MIC-ASR2531608, MIC-ASR2531986 and MIC-ASR223077 returned JSON (474–540 B). One call was reset by the host and succeeded on a single later retry | robots.txt 404 (no file) | Report no., supplier name (English), audit type, audit date, validity, address (always "-" in our 3 results), file (null) |
| Bureau Veritas China ([bvcerchina.cn](https://www.bvcerchina.cn/)), the "Verify Now" target on BV-audited profiles | TLS reset; no response | — | Not tested |

**C. Patents**

| Source | Exact outcome | robots.txt |
|---|---|---|
| [Google Patents](https://patents.google.com/robots.txt) | curl: HTTP 503, Google "Sorry... your computer or network may be sending automated queries" | Read via WebFetch: "User-agent: * / Disallow: /* / Allow: /$ / Allow: /advanced$ / Allow: /patent/ / Allow: /sitemap/". Automated search (/?q=, /?assignee=) is therefore disallowed; individual /patent/ pages are allowed |
| WIPO [PATENTSCOPE](https://patentscope.wipo.int/robots.txt) | robots.txt 200 (68 B, only a Sitemap line). Direct result URLs (result.jsf?query=PA:(jiecang), PA:(lingsha)) redirected to the blank search.jsf form (~50.8 KB) even with the session cookie set, so results need the interactive form | Allowed |
| CNIPA [pss-system](https://pss-system.cponline.cnipa.gov.cn/) | The robots.txt path returns the SPA's HTML (8,086 B); search needs a registered login (not attempted) | No robots file |
| CNIPA [epub](https://epub.cnipa.gov.cn/) | TLS handshake timeout | — |
| [Espacenet](https://worldwide.espacenet.com/robots.txt) | HTTP 403 with a 1-byte body | Unavailable |
| [Lens.org](https://www.lens.org/robots.txt) | 200: groups naming anthropic-ai, Claude-Web, GPTBot and others get "Disallow: /"; `*` disallows /lens/search and /lens/patent | Disallowed for AI agents |
| [Justia patents](https://patents.justia.com/assignee/zhejiang-jiecang-linear-motion-technology-co-ltd) (US patents by assignee) | HTTP 403 Cloudflare "Just a moment..." | Allow / |

**D. Chinese registry, credit, customs and tax sites**

| Source | Exact outcome |
|---|---|
| GSXT 国家企业信用信息公示系统 ([gsxt.gov.cn](https://www.gsxt.gov.cn/)) | HTTP 403 on robots.txt with the body: "请求异常 当前IP请求异常，请更换IP地址进行访问，或访问地址（https://shiming.gsxt.gov.cn）实名注册/登录后再进行访问" (abnormal IP: change IP, or register with real name at shiming.gsxt.gov.cn and log in) |
| 信用中国 creditchina.gov.cn; 海关企业进出口信用信息公示平台 credit.customs.gov.cn; customs.gov.cn; innocom.gov.cn (high-tech-enterprise portal); bvcerchina.cn | TLS reset right after the tunnel opened. The proxy log reads "tunnel closed … 517 B sent, 39 B received", i.e. the ClientHello was sent and no ServerHello came back |
| miit.gov.cn (publishes 专精特新 lists) | robots.txt 404 (nginx), then a TLS reset on the homepage |
| kjt.zj.gov.cn, jxt.zj.gov.cn (Zhejiang science and industry departments) | TLS handshake timeout |
| 名录集 [gongshang.mingluji.com](https://gongshang.mingluji.com/robots.txt) | robots.txt 200 at 03:27 (60,747 B; 53 mostly company-specific Disallow lines). Company pages requested at 03:38 → TLS reset |
| 启信宝 [qixin.com](https://www.qixin.com/robots.txt) | HTTP 451: "根据相关法律规定，当前所在地区暂不支持访问 / access is temporarily not supported in your current location" |
| [11467.com](https://www.11467.com/robots.txt), [shuidi.cn](https://www.shuidi.cn/robots.txt) | robots.txt 200 (11467 disallows /*?* and /k-*, so there is no keyword search). No company URLs known without search, so no pages were tested |
| Qichacha / Tianyancha / Aiqicha | Not re-tested. On 2026-10-09 they returned a 405 challenge, a region block (419) and an access-restriction redirect (sourcing_api_access_test.md) |
| 全国增值税发票查验平台 ([inv-veri.chinatax.gov.cn](https://inv-veri.chinatax.gov.cn/)) | robots.txt 404 → 302 → /fpcygzfw/ → 200 (5,314 B JS shell titled "国家税务总局全国增值税发票查验平台"); the query form was not exercised |
| CNINFO (listed-company filings) | robots.txt 404. An announcement query with a guessed orgId returned HTTP 200 with 0 results. The [topSearch](https://www.cninfo.com.cn/new/information/topSearch/query?keyWord=603583&maxNum=5) POST returned {"code":"603583","orgId":"gfbj0830948","zwjc":"捷昌驱动"}. The next two announcement-list POSTs (with the correct orgId) were reset |

**E. Certification and audit databases**

| Source | Exact outcome | robots.txt |
|---|---|---|
| TÜV Rheinland [Certipedia](https://www.certipedia.com/) | Homepage 200 (59,289 B) | Disallow /search?, /search$, /search/matching_*; Crawl-delay 10. Pages for an individual certificate or mark ID are allowed; name search is manual-only |
| [SGS Certified Client Directory](https://www.sgs.com/en/certified-clients-and-products/certified-client-directory) | HTTP 403 "Access Denied" (453 B) | Allows everything except /en-cn, /zh-cn, /*/search-results |
| [Intertek Directories](https://directories.intertek.com/) | Proxy CONNECT 502 twice (egress policy or upstream failure); not retried further | — |
| [UL Product iQ](https://productiq.ulprospector.com/) | HTTP 403 "You have been blocked… security service" (293,998 B), even on robots.txt; Product iQ also needs a free login | — |
| [IECEE](https://www.iecee.org/) (CB certificates) | robots.txt HTTP 202 with an empty JS-challenge body | Treated as a challenge |
| [CNCA/CQC search cx.cnca.cn](https://cx.cnca.cn/) | robots.txt HTTP 521 (862 B), then TLS resets | — |
| [IAF CertSearch](https://www.iafcertsearch.org/) | Homepage 200 (15,033 B, with captcha markers) | [robots.txt](https://www.iafcertsearch.org/robots.txt): `*` and ClaudeSearchBot disallow /certified-entity/ and /certification/ (the detail pages), so lookups are manual-only |
| FSC [search.fsc.org](https://search.fsc.org/en/) | 307 → 308 → 200 (303,886 B app shell) | [robots.txt](https://search.fsc.org/robots.txt): Disallow /api (the data calls). The old [info.fsc.org](https://info.fsc.org/robots.txt) has "Disallow: /" |
| amfori (BSCI) | robots.txt 404 | Allowed, but no BSCI lookup was tested. That BSCI audit results are visible only to amfori members is background knowledge, not verified here |
| Australia EESS ([eess.gov.au](https://www.eess.gov.au/)) | Homepage 200 (74,942 B). The [registration-database page](https://www.eess.gov.au/registration/eess-registration-database/) says: "The Registration database will no longer be available from 18:00 (AEDST) Friday, 11 October. It will be replaced by the EESS Platform from 8:00 (AEDST) Monday, 14 October 2024". The old host equipment.erac.gov.au gave proxy CONNECT 502 and, via WebFetch, "getaddrinfo ENOTFOUND". The new [public link](https://eessplatform.eess.gov.au/prweb/PRAuth/Public) goes 307 → 303 → 303 → 200 to a Pega "Login Page" (21,415 B: user name, password, Register) | [robots.txt](https://www.eess.gov.au/robots.txt): Disallow /*? (all query URLs), Crawl-delay 3; the platform host has no robots file (404) |

The [EESS platform page](https://www.eess.gov.au/about/about-the-new-eess-platform/) lists the platform's functions, all framed as managing one's own compliance: "make applications for certificates… search and view the Responsible Suppliers equipment registrations… search and view certifications issued to the Certificate Applicant or Responsible Supplier".

**F. Factory web presence, ICP, 1688, trade shows**

| Source | Exact outcome |
|---|---|
| Jiecang Chinese site ([jiecang.cn](https://www.jiecang.cn/)) and English site | robots.txt 200 (both allow /). Homepage 200. Footer: "浙ICP备11031253号-8". The investor-relations page title gives the legal name "浙江捷昌线性驱动科技股份有限公司"; its document list is script-loaded |
| ICP verification at beian.miit.gov.cn | TLS reset |
| Third-party ICP lookups | icp.chinaz.com returns HTML on its robots.txt path, so it was not fetched. icp.aizhan.com: TLS reset. beianx.cn: HTTP 410, page "精彩即将呈现" (site not operating) |
| welfull.com | robots.txt read cut off (IncompleteRead after 544 B); not fetched |
| [wiki.1688.com](https://wiki.1688.com/zh/WKfizlowuxxnuo) | 200 (74,362 B); robots "Allow: /?". 1688 search itself was an anti-bot interstitial on 2026-10-09 |
| Canton Fair | robots.txt path returns HTML (1,829 B); exhibitor data is not in static HTML (2026-10-09 test) |
| China Sport Show (sportshow.com.cn) | TLS reset |
| Association, 专精特新 and high-tech lists | Not reachable (government hosts reset or timed out, as above), or not locatable once the search quota ran out |

### Inferences
- **Two network patterns explain most Chinese failures.**
  - Hosts that reset TLS right after the ClientHello (GSXT's sibling credit sites, customs, MIIT, CNINFO after one call, 名录集 after one call, the TÜV portal once) are hostile to foreign or cloud egress. GSXT says so explicitly.
  - A buyer in Australia on a residential connection may fare better, but GSXT's message suggests real-name registration is the reliable route.
- **ImportGenius and Panjiva public pages are the only free, robots-compliant, automatable factory-evidence sources found.** A modest script (one request per supplier, a delay of 2.5 s or more) is defensible under their robots.txt files. Their ToS were not reviewed (see Gaps).
- **TÜV's portal is useful only to confirm that a report exists and when the audit happened.** It returned no address and no file, and every record had validEnd 9999-12-31, so "valid" means nothing; the audit date is the field to check.

### Gaps
- ToS for ImportGenius, Panjiva and the TÜV portal were not read; robots.txt permission is not a ToS licence.
- I found no public, anonymous EESS search on the new platform. The about-page wording suggests search is limited to an account's own registrations, so whether EESS shows the overseas manufacturer behind a Responsible Supplier remains unconfirmed.
- Trade-show directories (ISPO Shanghai, CIFF, China Toy Expo, FIBO, spoga+gafa), industry associations (宁津/永康/安吉/平乡) and 专精特新 or high-tech lists could not be tested: Chinese government hosts were unreachable, and the WebSearch quota ran out before exhibitor URLs could be found.
- Panjiva's and ImportGenius's coverage beyond US imports (Colombia only appeared on Panjiva) was not explored. Nothing covers Australian imports.
- CE / EN 71 / EN 15194 certificates have no central public database to test. Verification runs through the issuing lab's or notified body's own report-check (and the EU NANDO list for notified bodies), none of which was tested here.

## Q2. Worked examples on the test companies: what each working source showed

### Takeaway
Customs pages separated the seven test companies more clearly than any badge did:
- **Factory signature, brand-grade buyers (Heze Zhongran, Nantong Ironman, Jiecang).** Each ships a narrow, coherent product mix from an industrial address directly to large Western buyers:
  - Zhongran → KidKraft, 180 containers; Costco Wholesale Canada, 17.
  - Ironman → Hoist Fitness Systems, 213 containers.
  - Jiecang → hospital-bed, medical-furniture, standing-desk and window-hardware companies (Joerns Healthcare, Hausmann, Ergo Depot, Rowley), with J-Star Motion the largest consignee (329 containers).
- **Factory signature, small buyers (Nantong Tengtai, Lingsha).** Both ship directly from industrial-park addresses, to smaller fitness importers (Tengtai) and Amazon FBA sellers (Lingsha).
- **Trading-house signature (Welfull).** It ships 4,328 loads of unrelated goods (Christmas sweaters, wall art, bamboo wine racks, hangers) from Hangzhou office towers, and as a consignee it receives goods from other factories.
- **No public customs footprint (Ningbo Xusheng Leisure).** The search hit "Ningbo Xusheng Group" is a different, auto-parts company, a name-collision trap. Xusheng's own profile names a second entity in Taizhou.

### Cited Findings

**ImportGenius worked examples (fetched 2026-10-10)**
- **Nantong Tengtai Sporting**
  - Header: 33 shipments; 10 trading partners; top partner Deltech Manufacturing Inc.; top port Seattle; shipper address "Xianfeng Industrial Park Nantong Jiangsu China"; date range 2006-11-01 to 2026-02-06; "Updated: 2025-09-02".
  - Top importers (containers, gross kg):
    - Deltech Manufacturing (Seattle): 11, 172,247 kg; last 2025-07-27
    - DDG Sporting LLC (Newark area): 6, 85,733 kg; last 2025-09-02
    - Yevgeny Co.: 6; last 2014
    - E & Y Fitness Supplies: 3; last 2023-01-20
    - Suntelite: 2; last 2017
  - Recent rows mix kettlebells, dumbbells, mats, plates, weight vests and "DIY TOYS/SUNSHADE" (DDG, 17,484 kg, 449 PKG) with "BENCH FUNCTIONAL TRAINER WEIGHT PLATE SPARE PART" (Deltech, 21,852 kg).
  - Sample B/L UULNSH25073065: NVOCC "US UNITED LOGISTICS (NINGBO) INC", place of receipt Shanghai, vessel COSCO SHIPPING SAKURA, HS "DATA UNAVAILABLE".
  - The shipper name also appears as "NANTONG TENGTAI SPORTING CO LTD" (2021).
  - — [ImportGenius](https://www.importgenius.com/suppliers/nantong-tengtai-sporting)
- **Nantong Ironman Sporting Industrial**
  - Header: 412 shipments; 11 partners; top partner Hoist Fitness Systems; range to 2026-09-14.
  - Top importers (containers, gross kg):
    - Hoist Fitness Systems: 213, 3,116,372 kg; last 2026-07-06
    - Customized Fitness Solution: 30
    - Combat Brands LLC: 40
    - Exemplar Design LLC: 29
    - Recreation Supply Inc. dba Bodycraft: 35
  - Recent rows: Legion Fitness Equipment ("POWER TOWER, FUNCTIONAL TRAINER, DUMBBELL RACK…", 20,076 kg, 2026-09-01); Hoist "FITNESS EQUIPMENT-FITNESS BENCH" (15,172 kg, 2026-07-06); Combat Brands/Ringside (2026-06-22).
  - Sample-B/L shipper address: "NO.21 CHONGCHUAN ROAD, NANTONG CITY". The sample's origin reads "South Korea" with foreign port Busan, a transshipment artefact.
  - — [ImportGenius](https://www.importgenius.com/suppliers/nantong-ironman-sporting-industrial)
  - Earlier ImportYeti data counted 723 shipments for the same name — [ImportYeti (prior round)](https://www.importyeti.com/supplier/nantong-ironman-sporting-industrial)
  - A buyer's importer page lists a second shipper, "NANTONG IRONMAN FITNESS&REHABILITAT[ION]", next to Nantong Ironman Sporting Industrial at "NO.21 CHONGCHUAN ROAD" — [ImportGenius I-Master Sports](https://www.importgenius.com/importers/i-master-sports-c-o-rcs-dompanies)
  - Trademo (search summary only; the page itself returned WAF 403): 731 export shipments, 35 partners, about USD 24.27 M, with HS 950691 about 49% of value — [Trademo (search summary)](https://www.trademo.com/companies/nantong-ironman-sporting-industrial/3249500)
- **Zhejiang Jiecang Linear Motion Tech**
  - Header: 638 shipments; range to 2026-10-08.
  - Top importers (containers, gross kg):
    - J-Star Motion Corporation (B/L address 13617 Woodlawn Hills Dr, Cedar Springs, Michigan): 329, 4,860,196 kg; last 2026-10-08
    - Ergo Depot: 69; last 2016
    - Hausmann Industries: 44
    - Joerns Healthcare: 42; last 2026-10-07
    - Rotec International: 15
  - Rows: "HANDSPIKE MOTOR, HANDSET, ADJUSTABLE TABLE PARTS(LIFTING DEVICE)" (19,504 kg, 1,411 CTN); "HANDSPIKE MOTOR CONTROL BOX…"; tubular motors to Rowley Company.
  - Shipper address: "PROVINCIAL HIGH TECH PARK, XINCHANG".
  - — [ImportGenius](https://www.importgenius.com/suppliers/zhejiang-jiecang-linear-motion-tech)
- **Zhejiang Lingsha Technology**
  - Header: 15 shipments; 4 partners; range to 2026-05-14.
  - Importers (containers, gross kg):
    - Fina Crooning USA: 5, 76,359 kg
    - Pharo Deals NY: 5, 67,202 kg
    - Alliance Route USA: 3
    - "ETS MEDIA LLC C/O FBA": 2; B/L numbers prefixed "AMZDCN"
  - Cargo: "SPORTS TRAMPOLINE" (17,395 kg, 355 CTN), "TRAMPOLINE PARTS" (974 CTN), "OUTDOOR TOYS", "SLIDE", "OUTDOOR CHAIR".
  - Shipper address: "…ZHEJIANG LIJIN HARDWARE TECHNOLOGY INDUSTRIAL PARK, JINYUN COUNTY, LISHUI CITY".
  - — [ImportGenius](https://www.importgenius.com/suppliers/zhejiang-lingsha-technology-co-ltd)
- **Heze Zhongran Woodware**
  - Header: 117 shipments; 10 partners; top partner KIDKRAFT.INC; range to 2026-08-09.
  - Importers (containers, gross kg):
    - KidKraft: 180, 2,263,900 kg; last 2025-03-04
    - Costco Wholesale Canada: 17, 195,521 kg; last 2023-04-08
    - Backyard Kids LLC: 21, 309,014 kg; last 2026-07-23
    - Sun Won Corp: 7
    - PriceSmart: 2
  - Rows name SKUs: "LANTANA LANE PLAYHOUSE", "RIVERSCAPE PLAYHOUSE - WHITE", "WOODEN SWING SLIDE SET".
  - Shipper address: "EASTERN SIDE, SOUTHERN SECTION, JINXIN ROAD, ZHUANGZHAI TOWN, CAO COUNTY, HEZE CITY SHANDONG"; place of receipt Qingdao.
  - No FSC chain-of-custody code appeared in the 10 public rows.
  - — [ImportGenius](https://www.importgenius.com/suppliers/heze-zhongran-woodware-co-ltd)
- **Welfull Group**
  - Header: 4,328 shipments; 19 partners; 10 ports; range to 2026-10-07.
  - Top importers (containers):
    - Digital Electronic Supply: 439
    - Advance Apparel: 378
    - Empire Art Direct: 288
    - Time Tex International: 191
    - Wavenet: 176
  - The 10 latest rows are Christmas sweaters (Oppo Merchandise Group), bamboo wine racks, printed wall art (Old Time Pottery), a safety hasp, fabric trim cord, a velvet hanger set (Creative Pet Group) and Christmas knits. No camping goods appear.
  - Shipper address: "D TOWER, OCEAN INTERNATIONAL CENTER, YUANJIAN ROAD, GONGSHU DISTRICT, HANGZHOU".
  - — [ImportGenius supplier page](https://www.importgenius.com/suppliers/welfull-group-co-ltd)
  - On US-bound B/Ls naming "Welfull Group Co.,Ltd." (11F, Jinjiang Mansion, No.111 Hushu South Road) as consignee, there are 130 shipments to 2020. The listed shippers include ZHEJIANG HENGLIN CHAIR INDUSTRY, XINFENG HOUSEWARE PRODUCT and HUEI TYNG ENTERPRISE, i.e. goods from other factories consigned to Welfull — [ImportGenius importer page](https://www.importgenius.com/importers/welfull-group-co-ltd)
- **Ningbo Eto Outdoor Supplies** (a camp-kitchen seller used in the SKU example below)
  - 1 shipment (2018-09-18, "CAMPING LANTERN WITH FAN", Inland Products Inc, 606 kg).
  - Address: "NO.16 169 NONG, LIANFENG ROAD HAISHU DISTRICT, NINGBO".
  - — [ImportGenius](https://www.importgenius.com/suppliers/ningbo-eto-outdoor-supplies-co-ltd)

**Panjiva worked examples (fetched 2026-10-10)**
- **Jiecang** has two records:
  - 977 US shipments under "Zhejiang Jiecang Linear Motion". Sample B/L: shipper address "PROVINCIAL HIGH TECH PARK XINCHANG CN", consignee Joerns Healthcare LLC (Brownsville TX), 4,603 kg, Shanghai → Long Beach — [Panjiva 26156026](https://panjiva.com/Zhejiang-Jiecang-Linear-Motion/26156026)
  - 2 US shipments (2012) plus 31 Colombian import rows under the full legal name, with "75 customers" and top HS chapter 85 — [Panjiva 33726776](https://panjiva.com/Zhejiang-Jiecang-Linear-Motion-Technology-Co-Ltd/33726776)
- **Welfull**: 4,094 US shipments and 372 South American. Latest consignees (2025-10-07): Creative Pet Group, Haggar Tribal, Dynasty Shipping. Sample B/L from the "11th Foor, Jinjiang Mansion" address: 110,278 kg, 8,088 CTN, Yantian → Long Beach — [Panjiva](https://panjiva.com/Welfull-Group-Co-Ltd/4255217)
- **"Ningbo Xusheng Group Co., Ltd."** (No.68 South Yanshan River Rd, Beilun): 3,611 US shipments. Latest rows are "Ningbo Xusheng Industries Co., Ltd." → Polaris Industries Inc. and → ThyssenKrupp Bilstein of America. Top products "mach, engine, shp, vehicles, motor"; HS 84/87/85/94/73. This is an auto-parts exporter, not the hammock seller — [Panjiva](https://panjiva.com/Ningbo-Xusheng-Group-Co-Ltd/137142503)
- **Heze Zhongran**: 104 US shipments and 14 customers; latest Backyard Kids LLC (2025-05-22) and KidKraft, L.P. (2025-03-04, 2025-02-17); top HS 95 and 94. The sample B/L's consignee Backyard Kids LLC is at 2525 Esters Blvd, Dallas, with a contact e-mail on the kidkraft.com domain; place of receipt Qingdao, port of lading Busan — [Panjiva](https://panjiva.com/Heze-Zhongran-Woodware-Co-Ltd/62631236)

**Made-in-China profile plus auditor-portal worked examples**
- **Lingsha**
  - The profile shows "10 items verified by TÜV Rheinland": Manufacturer/Factory & Trading Company; established 2020-10-26; 142 employees; plant area 68,932.79 m²; registered capital RMB 26,000,000.
  - Under "Production Capacity — All information verified by TÜV Rheinland": production lines 6; QA/QC inspectors 6; R&D engineers 5; production machines "Steel pipe production line, Cutting machine, Pipe bender, Welding machine"; foreign trading staff 7; supply-chain partners 20; export year 5 years.
  - Report "MIC-ASR2531608" with "Verify Now → verified.chn.tuv.com".
  - The self-written text says "66,000 square meters" and "more than 152 outstanding workers", and claims GS, ASTM, AS 4989 and EN 71-14 certificates.
  - — [MIC Lingsha company page](https://lsfunjump.en.made-in-china.com/company-Zhejiang-Lingsha-Technology-Co-Ltd.html)
  - The TÜV portal returned {"supplierName": "Zhejiang Lingsha Technology Co., Ltd", "auditType": "Audited Supplier Verification", "auditDate": "2025-10-10", "validEnd": "9999-12-31", "supplierAddress": "-", "filePath": null} — [TÜV verification portal](https://www.verified.chn.tuv.com/en/)
- **Jiecang**: the TÜV portal returned "Zhejiang Jiecang Linear Motion Technology Co., Ltd.", "Audited Supplier Verification", audit date 2025-12-12, for MIC-ASR2531986 — [TÜV verification portal](https://www.verified.chn.tuv.com/en/)
- **Ningbo Xusheng Leisure**
  - The profile lists TÜV report MIC-ASR223077 and "Trade Capacity 7 items verified by TÜV Rheinland". No production-capacity block is shown.
  - Address: "Beilun Industry Area, Ningbo".
  - The self-written text reads: "Ningbo Xusheng Leisure products Co., Ltd. And Taizhou xusheng outdoor products Co., Ltd. Eastablished in 2007 with 30000 square metre workplace… more than 450 workers in our factory when hot seasons… 3 auto production line and 1 new auto powder coating line… anual tureover 2015 was US$20 Million, 2016 was US$30 Million".
  - — [MIC Xusheng company page](https://xushengcompany.en.made-in-china.com/company-NINGBO-XUSHENG-LEISURE-PRODUCTS-CO-LTD-.html)
  - The TÜV portal shows that report's audit date as 2022-01-26 — [TÜV verification portal](https://www.verified.chn.tuv.com/en/)
  - The same supplier's hammock listing said 10,000 m² (2026-10-09 notes) — [MIC Xusheng hammock](https://xushengcompany.en.made-in-china.com/product/tZsAeqGordRV/China-Outdoor-Patio-Double-Hammock-with-Space-Saving-Steel-Stand.html)
- **Nantong Tengtai**: BV report "MIC-ASI234583". The general information is "Information provided by supplier", not auditor-verified. Address "Xianfeng Industrial Park, Nantong"; "Export Year: 2010-10-21"; certificates listed as PAHs, CE, ISO9001. "Verify Now" points to bvcerchina.cn, which reset — [MIC Tengtai company page](https://tt-sports.en.made-in-china.com/company-Nantong-Tengtai-Sporting-Fitness-Co-Ltd-.html)
- **Welfull CT016 camp kitchen**: Model NO. CT016, 146×46×80 cm, 19 mm aluminium, MDF top, MOQ 500, lead time 45 days. The page also says "audited by BV" (ID MIC-ASI2331871) and "factories have BSCI an SMETA". Address: "1701 Room, No. 1 Yuanjian Buliding, Gongshu District, Hangzhou" — [MIC Welfull CT016](https://welfull-outdoors.en.made-in-china.com/product/kfFpBKvoLRhH/China-Camping-Kitchen-Table-Aluminum-Portable-Outdoor-Cooking-Table-with-Windscreen-and-3-Storage-Cupboards-for-Outdoor-Activities.html)

**Factory web presence (Jiecang)**
- The Chinese site claims:
  - founded 2000 and listed on the Shanghai Stock Exchange in Sept 2018 (603583.SH)
  - "全球8大生产基地", "约5000名员工", "总占地面积达60万平方米", "2025年营收40.36亿元"
  - "国家高新技术企业"
  - a CNAS-accredited lab that is a witness lab for TÜV Rheinland, TÜV SÜD, SGS and UL
  - "900+ 专利认证"
- Footer ICP "浙ICP备11031253号-8"; the IR page title gives the legal name 浙江捷昌线性驱动科技股份有限公司.
- — [jiecang.cn](https://www.jiecang.cn/); [Jiecang IR](https://www.jiecang.cn/investor-relations.html)

**Cluster and context items (search summaries, not fetched)**
- 庄寨镇 (Zhongran's town) is described as "全国重要的人造板生产基地、山东省木制品产业基地", and hosted the 21st China Forest Products Fair in Sept 2026 — [news.qq.com (search summary)](https://news.qq.com/rain/a/20260826A067WF00)
- An older (c. 2005) directory profile says Welfull "acts as an exporter for various items produced by over 20 member factories". That host's robots.txt returned 403, so the page was not fetched — [machinetools.com (search summary)](https://www.machinetools.com/en/companies/296429-welfull-group-co-dot-ltd)

**Registry and patent attempts on the test companies**
- GSXT, Qichacha, Aiqicha, Qixin and 名录集 were blocked (Q1), so no 经营范围 or 参保人数 was obtained for any test company. Chinese-name searches for Lingsha, Zhongran, Tengtai and Xusheng Leisure returned no registry snippets (search summaries, 2026-10-10).
- No patent was retrieved for any test company: Google Patents search is robots-disallowed and was 503-blocked here, and Justia was behind Cloudflare. A WebSearch restricted to patents.google.com for "Lingsha" trampoline patents returned only unrelated CN trampoline patents (e.g. [CN216978658U](https://patents.google.com/patent/CN216978658U/en), a trampoline tester), none naming Lingsha (search summary).

**Same-SKU triangulation worked example (aluminium camp kitchen, 146×46 cm, windscreen plus cupboards)**
- **The search page:** 30 cards from 22 suppliers. Every card carried the "Audited Supplier" icon; business type was shown on only 11 cards (7 "Trading Company" cards from 5 suppliers; 4 "Manufacturer/Factory & Trading" cards from 3 suppliers) — [MIC search](https://www.made-in-china.com/products-search/hot-china-products/Camping_Kitchen_Table.html)
- **Ningbo Eto's version:**
  - "Item no: YTKT01-2", 146×46×70/80/110 cm, aluminium tube Ø25/23/19×0.8 mm.
  - MOQ 300; lead time 30–35 days; US$12–30; package 80×57×12 cm, 11 kg; HS 9403200000.
  - Address "Room 2001-19, No 1299 YinXian Avenue… YinZhou District, Ningbo" (an office unit).
  - — [MIC Eto](https://eto-outdoors.en.made-in-china.com/product/KmupNtEHOCcT/China-Kitchen-Table-with-Windshield-and-Storage-Organizer-Portable-Folding-Adjustable-Cooking-Table-for-BBQ-Picnic-Camp-Cupboard.html)
- **Welfull's version:** CT016, 146×46×80 cm, sold from a Hangzhou office address (above).
- **A third seller:** Ningbo General Union ("Trading Company") lists a different 81×60×15 cm unit (Model DC-022, trademark "SN") — [MIC General Union](https://mugeneralunion.en.made-in-china.com/product/qmoretMWaSRn/China-Outdoor-Portable-Aluminum-Kitchen-Station-Folding-Camping-Table-with-Cupboard-Cabinet.html)

### Inferences
- **Grading of the test companies** (using the Q3 scale; the registry step is still outstanding for all):
  - **Heze Zhongran — "Probable factory → confirm".**
    - A-grade customs: direct shipper to KidKraft, Costco Canada and PriceSmart, with a narrow wooden-playset mix.
    - Its town is a wood-processing cluster (B-).
    - Needed: registry scope plus 参保人数, and the FSC certificate checked on search.fsc.org.
  - **Nantong Ironman — "Probable factory".**
    - A-grade customs: Hoist Fitness and other gym brands over many years, narrow strength-equipment mix.
    - Caveats: a related "Fitness & Rehabilitation" entity also ships, and addresses vary across aggregators (No.21 Chongchuan Road; "43 Tongfu South Road" in an ImportYeti title).
    - Confirm which entity owns the plant and which one you would contract with.
  - **Jiecang — "Confirmed factory".**
    - Customs A: industrial park address; hospital-bed, medical-furniture and standing-desk consignees; motors, handsets and control boxes.
    - Stock-exchange listing: CNINFO's topSearch maps 603583 to 捷昌驱动 (the annual report itself was not fetched here).
    - TÜV report confirmed (B), plus its own site and ICP (B).
    - Caveat: J-Star Motion, its largest consignee, may be an affiliate; this was not verified.
  - **Nantong Tengtai — "Probable factory with consolidation".**
    - Direct shipper from an industrial park to fitness importers.
    - Its loads mix kettlebells, yoga blocks and "DIY toys/sunshade", which suggests it also consolidates other suppliers' goods.
    - It has a disclosed trading arm (Nantong T&T International, per the 2026-10-09 notes), and its BV report could not be verified.
  - **Lingsha — "Probable factory (2×B)".**
    - TÜV-verified production block naming tube-forming and welding machines.
    - Direct shipper from a hardware industrial park.
    - Its buyers are Amazon sellers, not vetted brands.
    - Its AS 4989 and EN 71-14 claims stay C-grade until a test report naming the factory is seen.
  - **Welfull — "Trader / export group" for camp kitchens.**
    - Office-tower addresses, a sprawling product mix, and goods received from other factories.
    - "Factories have BSCI and SMETA" also implies multiple partner plants.
    - Ask Welfull to name the producing factory and its 生产销售单位.
  - **Ningbo Xusheng Leisure — "Unconfirmed".**
    - Only trade capacity was verified, in a 2022 audit.
    - Its site area is inconsistent (10,000 vs 30,000 m²), it names a second entity in Taizhou, and no customs footprint was found under either name.
    - Possible relationship to Beilun's Xusheng Group is unknown and must not be assumed.
- **Customs data proves export relationships, not plant ownership.** Welfull is a "direct shipper" with 4,000+ loads and is still a trader. Customs evidence counts as factory evidence only together with an industrial shipper address and a product mix that fits one kind of production equipment.
- **Name collisions and name variants are the commonest customs-data error.** Examples: "Xusheng Group" vs "Xusheng Leisure"; Jiecang under 2 Panjiva records; Tengtai with and without "Co Ltd"; ImportGenius slugs truncated by the 35-character B/L name field ("nantong-tengtai-sporting"). Always match the address as well as the name.
- **Camp-kitchen triangulation.** Both sellers of the 146×46 cm design sit at office addresses, and neither shows camp-kitchen exports in its public customs rows. The producing factory is probably a third party (the Yongkang/Wuyi cluster is a candidate given Dashing's and Suyuan's aluminium tables), but that is unverified. Eto's model code "YTKT01-2" does not match Eto's initials, which fits a factory-assigned code.

### Gaps
- No 经营范围, 参保人数 or shareholder data was obtained for any test company, because every registry route was blocked.
- No design or utility-model patent was retrieved for any test company.
- J-Star Motion's relationship to Jiecang, Backyard Kids LLC's relationship to KidKraft (only an e-mail domain was observed), and the Ironman sister entity's role are unverified.
- Tengtai's BV report MIC-ASI234583 and Welfull's BV report MIC-ASI2331871 could not be verified (bvcerchina.cn reset).
- Lingsha's own website and the websites and ICP numbers of the other six firms were not found once search ran out.

## Q3. Evidence-grading scale and decision rule

### Takeaway
Grade each item by source family, and require independence across families. "Confirmed factory" needs two A-grade items from different families, or one A plus two B from different families, with no unexplained red flags. Platform badges and self-descriptions (C) never count toward the threshold. Testing showed that each A-grade item type has a known failure mode, so each comes with a mandatory qualifier.

### Cited Findings
- **Platform badges are paid or point-in-time.**
  - "Gold Supplier… Not a factory or quality audit"; "Both badges are programs the supplier pays for" — [Tianwen Wangluo (cited 2026-10-09)](https://tianwenwangluo.com/en/is-alibaba-legit/)
  - Membership costs: 1688 "Powerful Merchant" ¥36,800/yr and "Super Factory" ¥106,800/yr — [Yakkyofy (cited 2026-10-09)](https://yakkyofy.com/1688-vs-alibaba/)
  - In the camp-kitchen search, all 30 cards carried "Audited Supplier", including the "Trading Company" cards — [MIC search](https://www.made-in-china.com/products-search/hot-china-products/Camping_Kitchen_Table.html)
- **Auditor portals confirm that a report exists and its date, not its content.** The three TÜV results all showed supplierAddress "-", filePath null and validEnd 9999-12-31 — [TÜV verification portal](https://www.verified.chn.tuv.com/en/)
- **MIC separates verified fields from supplier-provided ones.** Lingsha: "Production Capacity — All information verified by TÜV Rheinland" — [MIC Lingsha](https://lsfunjump.en.made-in-china.com/company-Zhejiang-Lingsha-Technology-Co-Ltd.html). Tengtai: "Information provided by supplier" — [MIC Tengtai](https://tt-sports.en.made-in-china.com/company-Nantong-Tengtai-Sporting-Fitness-Co-Ltd-.html)
- **Registry scope rule.** "A 'factory' whose business scope only lists wholesale and trading is a trading company" — [Tianwen Wangluo (cited 2026-10-09)](https://tianwenwangluo.com/en/is-alibaba-legit/)
- **1688's own factory check:**
  - The licence must be production-type, or its scope must include "制造"/"加工", checked in real time against 国家企业信用信息公示系统 — [wiki.1688 (cited 2026-10-09)](https://wiki.1688.com/zh/WKfl9os8222xhc)
  - Its on-site certification reviews 3 months of utility bills, 社保缴纳记录 and purchase invoices — [wiki.1688 (cited 2026-10-09)](https://wiki.1688.com/zh/WKfl9os8222xhc)
- **1688 (2026-04-14) on licence address, equipment lists and patents:**
  - "营业执照上的地址和实际生产地对得上吗？…去国家企业信用信息公示系统查一查，能筛掉一半挂羊头卖狗肉的"
  - Vague equipment lists ("先进设备""全自动产线") should be discarded; real factories list machine models and counts.
  - From September 2024, "平台已经下线了'系统自动抓取专利'的功能" — patents are self-uploaded.
  - 实地认证 checks that the registered and actual production address are the same, whether the workshop is owned or on a long lease, and industry permits (e.g. SC, CCC).
  - — [wiki.1688 (fetched 2026-10-10)](https://wiki.1688.com/zh/WKfizlowuxxnuo)
- **Customs data can be stale or mislabelled.**
  - Busan transshipment makes Chinese cargo show "South Korea" origin — [ImportGenius Zhongran](https://www.importgenius.com/suppliers/heze-zhongran-woodware-co-ltd); [ImportGenius Ironman](https://www.importgenius.com/suppliers/nantong-ironman-sporting-industrial)
  - Aggregators disagree on counts (Ironman 412 on ImportGenius vs 723 on ImportYeti; Jiecang 638 vs 977 on Panjiva) — [ImportGenius](https://www.importgenius.com/suppliers/zhejiang-jiecang-linear-motion-tech); [Panjiva](https://panjiva.com/Zhejiang-Jiecang-Linear-Motion/26156026)

### Inferences

**Evidence-grading scale** (my synthesis; the qualifiers come from the failure modes observed in Q2)

| Grade | Item | Source family | Mandatory qualifier (otherwise downgrade one grade) |
|---|---|---|---|
| **A** | Official registry: 经营范围 contains production verbs for your product category (e.g. "…制造", "生产", "加工"), the registered address is in an industrial zone or cluster town, and annual-report 参保人数 is credible for the claimed size (e.g. not under 10 for a "150-staff" plant) | Registry | Read on GSXT or a mirror for the exact licence name and USCC; production scope alone is only B, since anyone can register it |
| **A** | US customs records showing the entity as **direct shipper** to established Western brands or retailers, repeatedly, over 2+ years | Customs | The shipper address is an industrial site (not "Room/Tower/Mansion/Building"); the product mix fits one production technology; the consignee is not only a freight forwarder or FBA seller; the name **and** address match your contracting entity |
| **A** | A certificate or test report from an accredited body naming the entity as the **manufacturer/factory site** (CB/IECEE, CCC factory, ISO 9001/14001 with the site address, FSC CoC, product test report "Manufacturer: … Factory address: …") | Certification | Verified on the issuer's portal (IAF CertSearch, FSC search, Certipedia, the lab's report-check) and matching the factory address |
| **A** | A design patent (CN…S) or utility model (CN…U) covering your SKU's design, held by the entity | IP | The holder equals the contracting entity, and the filing predates the earliest listing of the SKU |
| **A** | A listed company's audited annual report naming the production bases | Registry/filings | — |
| **B** | Auditor-verified capacity block (production lines, machines, QC headcount) plus the report confirmed on the auditor portal | Third-party audit | Audit date within about 18 months; check which blocks are "verified" vs "provided by supplier" |
| **B** | Own Chinese website with an ICP number whose 主办单位 equals the licence name, plus a licence image, line photos or videos | Web presence | ICP verified at beian.miit.gov.cn (manual) |
| **B** | Customs records as direct shipper to small importers or FBA sellers, or to brands but with an office address | Customs | — |
| **B** | Industry-association membership; 专精特新/高新技术企业 list entry; trade-show booth under the licence name | Cluster/institutional | Traders also exhibit; the booth name must equal the licence name |
| **B** | Named as manufacturer on a Western brand's compliance label or test report (bought sample) | Physical | — |
| **C** | Platform badges (Gold, Diamond, Verified, Audited Supplier, 实力商家, 超级工厂), "Manufacturer/Factory" business-type labels, 源头工厂/厂家直销 titles, staff, area, turnover and certificate claims in self-written text | Platform/self | Never counts toward the threshold |

**Red flags** (any one blocks "confirmed" until explained):
- an office-tower shipper or registered address
- a product mix spanning unrelated production technologies
- self-reported area or staff differing by 2× or more between pages (Xusheng 10,000 vs 30,000 m²; Lingsha 66,000 vs 68,932.79 m² is acceptable)
- a second entity named in the profile (Xusheng/Taizhou; Tengtai/T&T; Ironman/Fitness & Rehabilitation) without saying which one owns the plant
- an audit older than 18 months
- the licence, contract, invoice or bank-account names not matching character for character

**Decision rule:**
- **Confirmed factory:** 2 A from different families, **or** 1 A + 2 B from three different families, with no unexplained red flag.
- **Probable factory:** 1 A, or 2–3 B from different families.
- **Unverified:** B items all from one family, or only C items.
- **Treat as trader:** two or more trader red flags (office address plus product sprawl, or goods received from other factories) whatever the badges say.

"Independent" means different source families. Two views of the same claim do not count twice: an MIC profile plus the same MIC audit is one family; ImportGenius plus Panjiva is one family.

### Gaps
- No authoritative (government) text was retrievable here that defines production vs trading scope keywords. SAMR's standardized business-scope catalogue (经营范围规范表述目录) is cited from memory as context, not verified in this session.
- The thresholds (18 months, 2×, under 10 insured staff) are my judgement calls, not sourced industry standards.

## Q4. Step-by-step playbook (manual or semi-automatic), with cost and time per supplier

### Takeaway
About 2–3 hours of desk work per supplier at $0 (customs pages, MIC verified blocks, auditor portal, manual patent and registry lookups in a browser), plus 1–3 days waiting for documents. That sorts most suppliers into confirmed, probable or trader. The offline steps the buyer must do (licence scan, a redacted export declaration naming the 生产销售单位, a VAT invoice in the factory's name, a live video walk of the SKU's line) are free. A US$200–300 one-man-day audit before the first container closes the remaining gap.

### Cited Findings
- **Inspection and audit costs:**
  - Factory audits about $210–290 per man-day; professional inspection about $200–350 per man-day (2025) — [Supplyia (cited 2026-10-09)](https://www.supplyia.com/inspection-company-in-china/)
  - $199–299 per working day — [Cogoport (cited 2026-10-09)](https://www.cogoport.com/blogs/quality-control-and-inspections-in-china-a-complete-guide)
  - A flat $268 per man-day offer — [HKTDC listing (cited 2026-10-09)](https://www.hktdc.com/event/hkgiftspremiumfair/en/product/1X21RR0R)
  - Travel and lab testing are sometimes billed separately — [Supplyia (cited 2026-10-09)](https://www.supplyia.com/inspection-company-in-china/)
- ImportGenius shows "Get United States data for $229" on each public supplier page — [ImportGenius](https://www.importgenius.com/suppliers/nantong-tengtai-sporting)
- **GSXT licence checks:** use the 18-digit Unified Social Credit Code; status should be 存续/在营; check the abnormal-operations list; the licence name, bank-account name and contract counterparty must match character for character; the licence QR code should resolve to the GSXT record — [NewBuyingAgent (cited 2026-10-09)](https://www.newbuyingagent.com/resources/how-to-read-a-chinese-business-license-and-verify-a-supplier); [China Justice Observer (cited 2026-10-09)](https://chinajusticeobserver.com/a/how-to-check-chinese-company-registration-certificate)
- From this environment GSXT demanded real-name registration for the IP ("…实名注册/登录后再进行访问") — [GSXT](https://www.gsxt.gov.cn/)
- The national VAT-invoice check platform is reachable and loads a JS form — [inv-veri.chinatax.gov.cn](https://inv-veri.chinatax.gov.cn/)
- **1688's own buyer advice:**
  - check the licence address against the production site on GSXT
  - distrust vague equipment lists and patent certificates without upload records
  - use 实地认证 (on-site checked) shops
  - — [wiki.1688 (2026-04-14)](https://wiki.1688.com/zh/WKfizlowuxxnuo)

### Inferences

**Playbook per supplier** (recommendations; times are my estimates)

**Step 0 — Identity capture (10 min, $0).** Record:
- exact English name(s) and all variants seen
- claimed factory address
- auditor and report no. (from the MIC/Alibaba profile)
- any second entity named (trading arm or sister plant)

Ask for the licence scan early (Step 5) to get the Chinese name and USCC.

**Step 1 — Customs footprint (20–30 min, $0; semi-automatable).**
1. Open the ImportGenius supplier page. Try slug variants: drop "Co., Ltd", try the 35-character truncation, try "co-ltd". A 301 to /tradebase means no page.
2. Open the Panjiva public profile (found via a browser search).
3. Check ImportYeti in a browser (it blocks bots).
4. Record: total shipments; date range; top consignees (brands or forwarders/FBA); product descriptions (one technology, or sprawl?); the shipper address (industrial vs office); related shipper names on consignees' importer pages; transshipment artefacts.
5. Grade the result: A or B with qualifiers, or a red flag.
6. Automating this is robots-allowed. Use one GET per supplier with a delay of 2.5 s or more and the ig_extract.py parser. The $229 ImportGenius US-data subscription adds full histories, but the free page already gives the top 5 consignees and 10 latest rows.

**Step 2 — Platform verified blocks plus auditor portal (15 min, $0; semi-automatable).**
1. On the MIC company page, separate "verified by <auditor>" blocks from "provided by supplier" blocks.
2. Look for a verified production block: lines, machines, QC staff.
3. Enter the report no. at verified.chn.tuv.com (TÜV). For BV, use bvcerchina.cn from a normal connection. Note the **audit date**; ignore "valid to 9999".
4. Cross-check area and staff across the profile and product pages.

**Step 3 — Patents (20–30 min, $0; manual only).**
1. Google Patents in a browser: `assignee:(<English name>)` and the Chinese name. Restrict to country CN; look for kind codes S (design) and U (utility) on your SKU. Automating Google Patents search is disallowed by its robots.txt.
2. Alternatively, use CNIPA pss-system (free registration).
3. Check that the holder equals the contracting entity and that the filing predates the earliest listing. Remember that since Sept 2024, 1688 patent badges are self-uploaded.

**Step 4 — Registry (20–30 min, $0 to low cost; manual).**
1. Use GSXT with real-name registration, or Qichacha/Tianyancha/Aiqicha in a browser (free tiers show basics).
2. Read: status; establishment date; registered and paid-in capital; registered address and authority (county-level 市场监督管理局 in a cluster town vs a city-centre district); 经营范围; 年报 → 社保信息 参保人数; shareholders and outbound investments (sister 进出口/贸易 companies); 经营异常; 行政处罚.
3. Reading 经营范围 (my guide; not verified against SAMR's catalogue here):
   - **Production verbs:** "生产", "制造", "加工", "…制品制造", "体育用品及器材制造", "家具制造", "木制品制造", "金属制品…制造". Licensed production (许可项目, e.g. "…生产许可") is stronger still.
   - **Trade-only wording:** "销售", "批发", "零售", "货物进出口", "技术进出口", "进出口代理", "国内贸易代理", "供应链管理服务", "互联网销售".
   - A factory usually lists both production and sales/import-export items. A scope with **only** the trade items means a trading company.
   - Production wording alone is not proof: it can be registered without a plant. Pair it with the address and 参保人数.

**Step 5 — Documents from the supplier (1–3 days elapsed; about 30 min of review; $0).**
- **Business licence (营业执照) colour scan.** The QR code should resolve to GSXT. Name, USCC and legal representative must match the contract, pro-forma and bank account.
- **Customs registration** (海关进出口货物收发货人备案回执 showing its 10-digit 海关编码), plus a **redacted export declaration (出口报关单) for the same model**.
  - Check that "境内发货人" and "生产销售单位" name the factory itself.
  - If a trading arm exports, the 生产销售单位 field should still name the factory.
  - These field names are from my knowledge of the post-2018 declaration format; not verified in this session.
- **A redacted 增值税专用发票 or 数电发票 the factory issued in its own name for this product** (to a domestic buyer).
  - Verify it on 全国增值税发票查验平台 (inv-veri.chinatax.gov.cn; captcha per query).
  - The seller name and tax ID must match the licence.
  - Context, not verified here: production enterprises claim export VAT refunds under the 免抵退 method and trading companies under 免退. Asking which method the supplier uses is a cheap tell.
- **Certificate and test-report numbers.** Verify ISO on IAF CertSearch, FSC CoC on search.fsc.org, BSCI via the full audit report (the amfori platform is members-only), and lab reports on the lab's portal. Check the "manufacturer/factory address" field.

**Step 5b — Export-licence wording and social accounts (10 min, $0; manual; background knowledge, not verified in this session).**
- "Export licence" (进出口权) in supplier claims usually now means the customs registration. My understanding is that the separate 对外贸易经营者备案登记 filing was dropped when the Foreign Trade Law was amended in Dec 2022, so ask for the 海关备案 receipt rather than an "export licence".
- For WeChat 公众号 and Douyin enterprise accounts, check that the displayed verified subject (认证主体/企业认证) is the same legal name as the licence. A personal or differently named subject is a trader signal.

**Step 6 — Live video walk (45–60 min, $0).** Ask for:
- the factory gate and signboard, with GPS or map pin shared
- the licence on the wall
- **your SKU's specific line** in operation: tube cutting, bending and welding for trampolines; rubber moulding for bumper plates; motor and column assembly for desk frames; aluminium extrusion cutting, riveting and sewing for camp kitchens; panel cutting and assembly for cubbies
- the mould or jig for your design, raw-material stock and the QC bench
- cartons printed for a current customer
- a request made on the spot (e.g. "show me the welding of part X now") to rule out recorded footage

**Step 7 — Third-party audit before the first container (1 man-day, about US$210–300 plus any travel; report 2–3 days).**
- Book a "factory audit / manufacturer verification" at the **factory address**, not the office.
- Ask the auditor to sight the licence, the social-insurance payment list, the equipment register and utility bills.
- Then a pre-shipment inspection (US$200–350 per man-day) on the order.

**Step 8 — Contract controls ($0).**
- The PO and invoice should be in the licence entity's name, with payment only to its corporate account.
- If a trading arm (e.g. Tengtai's T&T) or a sister entity (Ironman Fitness & Rehabilitation, Taizhou Xusheng) is used, get a written statement naming the producing factory and its address, and inspect there.

**Per-supplier budget:**
- Desk Steps 0–4: about 1.5–2.5 h, $0.
- Steps 5–6: about 1.5 h of buyer time plus 1–3 days elapsed, $0.
- Step 7: about US$250–300 (one man-day).
- Optional ImportGenius subscription: $229.
- A five-supplier shortlist costs about 10–15 h of desk time and US$250–300 for the final candidate's audit.

**"Same SKU, many sellers" triangulation (30–60 min per SKU):**
1. Collect 10–20 listings (MIC search is robots-allowed; Alibaba, 1688 and Amazon manually). Record seller, address, business type, model no., exact dimensions, tube diameter × wall, carton size and weight, MOQ, lead time and price ladder.
2. Fingerprint: identical cartons and weights plus identical part specs across sellers mean one source factory. A model code that does not match the seller's name (Eto's "YTKT01-2") is probably the factory's code; search that code.
3. Eliminate office addresses (Room/Tower/Building) and sellers whose customs rows show unrelated goods.
4. Look for the earliest listing or review date, and for a CN design patent (S) on the design with an early filing date. The holder is the likely mould owner.
5. Prefer the seller offering mould-level OEM/ODM changes (tube gauge, frame geometry) and quoting production, not stock, lead times. Lingsha, for example, offers 1.0–1.5 mm tube options.
6. Run that seller through Steps 1–7, and ask every reseller for the 生产销售单位 on its export declaration. A trader that will not name the factory is still useful as a price benchmark.

### Gaps
- Not tested or not verifiable here:
  - China Customs' credit platform fields (海关注册编码, credit grade): TLS reset
  - the beian.miit.gov.cn ICP lookup: TLS reset
  - the VAT-invoice check query form (JS shell only)
  - CCC/CNCA certificate fields (521/reset)
- The 报关单 field names (境内发货人, 生产销售单位) and the 免抵退 vs 免退 rebate distinction are stated from background knowledge and should be confirmed against GACC and State Taxation Administration sources.
- Prices for Qichacha/Tianyancha VIP tiers and Panjiva subscriptions were not found.
- No public anonymous EESS search was found; for desk control boxes, ask the AU Responsible Supplier or the factory for the RCM/EESS certificate and the CB/IEC test report, which name the manufacturer.
