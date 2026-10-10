# Australian-market brands and their Chinese source factories

Working notes. Research date: 2026-10-10. Status: partial. The research budget was reached (15 tool calls before this write: 9 web searches, 2 Bash fetch runs, 3 file reads, 1 tool search). Brands marked "not searched" were not checked in this pass.

Confidence labels:
- **Named explicitly**: the factory or its legal name appears on a page I read. Where the page is the brand's own claim, the row says so.
- **Inferred**: a link drawn from indirect evidence (name similarity, shared address, or a secondary source).
- **Not found**: no factory name in anything I could read. An origin-only statement such as "made in China" is recorded as not found.

## Key findings

1. Springfree is the only brand in this pass with a factory named on a page I read. Its blog says Springfree trampolines are manufactured by DGSH Sourcing in Dongguan, Guangdong. It calls DGSH a sister brand within goba Sports Group and the "factory partner". No Chinese legal name or street address is given. Source: [Springfree blog](https://www.springfreetrampoline.com/blogs/beyond-the-bounce/where-are-springfree-trampolines-made) (undated; fetched 2026-10-10).
2. The "China" origin statements for Vuly and Springfree (CHOICE) and Everfit (a retailer listing) cover small models: 2.5 m and 2.7 m springless trampolines, and a 42-inch foldable (per search summary). None covers the 12-14 ft enclosure trampolines in the brief, and none names a factory.
3. EESS does not name factories. Its [registration page](https://www.eess.gov.au/registration/registration-responsible-supplier/) says a Responsible Supplier "must be a legally identifiable Australian or New Zealand entity holding an Australian Business Number (ABN), or a New Zealand Inland Revenue Department (IRD) number". An EESS record therefore names the local importer. The EESS search pages are query-string URLs, which robots.txt disallows (Disallow: /*?), so I did not run brand searches.
4. Recall, customs and modern-slavery sources were blocked (see the access log). The customs records in the earlier draft notes in this folder are US import data. I found no Australian consignee in the records I read.
5. Made-in-China listings use brand names as keywords. A Lingsha (FUNJUMP) product listing includes "Mini Springfree" in its title, and a Wenzhou supplier uses "Springfree" in a product title. A name match on those sites is not a supply link.

## Product 1: 12-14 ft trampolines with enclosure

**Takeaway.** No factory is named for any Australian trampoline brand in the pages I read, except Springfree's own statement. Vuly's only China evidence is an origin statement for a different (2.5 m, discontinued) model.

| AU brand / retailer | Document found (URL; date) | Factory named (Chinese / English; address) | Confidence |
|---|---|---|---|
| Springfree (NZ/AU) | [Springfree blog](https://www.springfreetrampoline.com/blogs/beyond-the-bounce/where-are-springfree-trampolines-made); undated, fetched 2026-10-10. Says trampolines are made in Dongguan, Guangdong; materials from US, Canada, NZ, Korea, Switzerland, Japan | DGSH Sourcing (no Chinese name given). Dongguan, Guangdong; no street address. Described as sister brand in goba Sports Group and "factory partner" | Named explicitly (brand's own statement; not checked against a company registry) |
| Springfree (AU retail) | [CHOICE, Springfree Medium Square S72](https://www.choice.com.au/products/babies-and-kids/children-and-safety/toys-and-safety-at-play/springfree-medium-square-s72); fetched 2026-10-10. "Country of origin: China" for a 2.7 m square model | None | Not found (origin only) |
| Springfree (candidate name) | [Panjiva, Springfree Trampoline](https://cn.panjiva.com/Springfree-Trampoline/4337947); search snippet only, not opened. Summary names shipper "Dongguan Sheng Hui Fitness Equipment", Qingxi Town | Dongguan Sheng Hui Fitness Equipment, Qingxi Town (per search summary only) | Inferred at most. The only link to DGSH is the initials. Needs a registry check |
| Vuly | [CHOICE, Vuly Thunder Medium](https://www.choice.com.au/products/babies-and-kids/children-and-safety/toys-and-safety-at-play/vuly-thunder-medium); fetched 2026-10-10. Marked "Discontinued model"; 2.5 m round springless; "Country of origin: China" | None | Not found (origin only, small discontinued model) |
| Vuly (candidate, not linked) | [Made-in-China, Zhejiang Lingsha Technology (FUNJUMP)](https://fr.made-in-china.com/co_lsfunjump/); fetched 2026-10-10. No Vuly reference on the page | Zhejiang Lingsha Technology Co., Ltd (FUNJUMP Trampoline); Lishui, Zhejiang. Address differs by source: Huzhen, Lishui (MIC Spanish profile) vs Cangshan District, Jinyun County, Lishui (ImportGenius record in earlier notes). Founded 2020 (MIC); OEM trampolines for the EU since 2014, by its own account | Not found (no link to Vuly on any page read) |
| Everfit (New Aim / Dropshipzone) | [Baby Bunting, Everfit 42-inch foldable trampoline](https://www.babybunting.com.au/product/everfit-fitness-foldable-trampoline-black-7021815); search snippet, undated. Origin China | None | Not found (origin only, small model) |
| Everfit (name-similar trademark) | [Justia, BEIJING EZFIT MORTISE AND TENON CULTURETECHNOLOGY CO., LTD](https://trademark.justia.com/owners/beijing-ezfit-mortise-and-tenon-culturetechnology-co-ltd-5086631); search snippet only | Not linked to Everfit | Not found |
| Kmart (Anko / own 10-12 ft) | [Kmart AU factory list](https://www.kmart.com.au/factory-list/); fetched 2026-10-10 (HTTP 200, 1.6 MB). Text extraction returned navigation only | Not extracted | Not found |
| Kahuna (New Aim) | Not searched | | Not found (not searched) |
| Lifespan Kids (trampolines) | Not searched | | Not found (not searched) |
| Big W | Not searched | | Not found (not searched) |
| Plum / TP Toys AU | Not searched | | Not found (not searched) |
| Jumpflex AU | Not searched | | Not found (not searched) |
| Advwin | Not searched | | Not found (not searched) |

**Candidate leads from earlier draft notes** (factories_trampoline.md; US import records; not re-verified; none linked to an Australian brand): Sportsoul Co., Ltd (No. 3 Road, Chengyang District, Qingdao) and Qingdao Ocean Master Steel and Plastic (same road address) are trampoline suppliers to US importers. Hangzhou Transasia Sporting Goods (Xiaoshan, Hangzhou) supplies JumpSport and Super Jumper in the US. Lingsha is listed above.

**Gaps.** 12-14 ft origin for every brand. Vuly, Everfit, Kahuna, Lifespan Kids, Big W, Plum, Jumpflex and Advwin were not searched for factories. ACCC recall notices were not reachable.

## Product 2: 100 kg bumper-plate sets and dial dumbbells

**Takeaway.** No manufacturer is named for CORTEX or any other bumper-plate brand in the pages I read. The Lifespan product page I fetched returned HTTP 404, so the CORTEX evidence is search snippets only.

| AU brand / retailer | Document found (URL; date) | Factory named | Confidence |
|---|---|---|---|
| CORTEX (Lifespan Fitness) | [Lifespan product page](https://www.lifespanfitness.com.au/products/cortex-5kg-black-series-v2-bumper-plate-pair) returned HTTP 404 (fetched 2026-10-10). Search returned a [non-www URL](https://lifespanfitness.com.au/products/cortex-5kg-black-series-v2-bumper-plate-pair), not opened. Site navigation links to a Product Manuals Library and Warranty & Repairs Information; not fetched. One search summary mentions a barbell marketed as "Cortex Strength"; unchecked | None | Not found |
| CORTEX (retailer listing) | [Harvey Norman, CORTEX Black Series V3 5 kg pair](https://www.harveynorman.com.au/cortex-pack-of-2-black-series-v3-rubber-olympic-bumper-plate-5kg.html); search snippet, undated | None | Not found |
| BRIXX | Not searched | | Not found (not searched) |
| Everfit (bumper plates) | Not searched | | Not found (not searched) |
| Fitness Master | Not searched | | Not found (not searched) |
| Powertrain | Not searched | | Not found (not searched) |
| HCE | Not searched | | Not found (not searched) |
| Force USA | Not searched; "Australian-founded" status is from the brief and was not checked | | Not found (not searched) |
| Rebel / Celsius | Not searched | | Not found (not searched) |
| Kmart Anko | Not searched; Kmart factory list not extracted (see Product 1) | | Not found (not searched) |

**Candidate leads from earlier draft notes** (factories_bumper_plates_iron.md; from US import records and MIC profiles; not re-verified; not linked to an Australian brand): Nantong Tengtai Sporting Fitness Co., Ltd (Xianfeng Industrial Park, Nantong; trading arm Nantong T&T International) and Nantong Ironmaster Sporting Industrial Co., Ltd (No. 21 Chongchuan Road, Nantong).

**Gaps.** The CORTEX maker, importer and warranty entity. Lifespan's manuals library and warranty pages were not fetched; they may name an importer. No bumper-plate brand other than CORTEX was searched.

## Product 3: Double hammocks with steel stand

**Takeaway.** Gardeon's retailer listings name the brand and no maker. No hammock factory is named for any brand in this pass.

| AU brand / retailer | Document found (URL; date) | Factory named | Confidence |
|---|---|---|---|
| Gardeon (New Aim) | Harvey Norman, [double hammock chair stand steel frame](https://www.harveynorman.com.au/gardeon-double-hammock-chair-stand-steel-frame.html); Myer, [double tassel hammock with Woden stand](https://catalogues.myer.com.au/p/gardeon-double-tassel-hammock-with-woden-hammock-stand); MyGenerator, [camping hammock with stand](https://mygenerator.com.au/product/gardeon-camping-hammock-with-stand). Search snippets, undated | None. Harvey Norman lists a 12-month manufacturer warranty field with no maker name | Not found |
| Marquee (Bunnings house brand) | Not searched | | Not found (not searched) |
| Costway AU | Not searched | | Not found (not searched) |
| Kmart Anko | Not searched | | Not found (not searched) |
| Big W | Not searched | | Not found (not searched) |
| Aldi (Special Buys hammock) | Not searched | | Not found (not searched) |

Earlier draft notes (factories_hammock.md) have no findings yet; every section is "(pending)".

**Gaps.** The Gardeon importer or maker, which the packaging or manual would show. The Myer "imported larch" wording describes the timber model, not a factory.

## Product 4: Dual-motor electric standing desks

**Takeaway.** FlexiSpot's owner (Loctek, Ningbo) appears only in secondary pages, and no plant is named. EESS would name an Australian importer, not a factory.

| AU brand / retailer | Document found (URL; date) | Factory named | Confidence |
|---|---|---|---|
| FlexiSpot AU (Loctek) | [flexispot.com.au](https://www.flexispot.com.au/) returned HTTP 200 with 114 bytes and no content (fetched 2026-10-10). Owner named by secondary pages: [accio.com](https://www.accio.com/business/flexispot) and [workwhilewalking.com](https://www.workwhilewalking.com/flexispot-reviews); search snippets | Owner: Loctek Ergonomic Technology, Ningbo; Shenzhen-listed under code 300729 (per search summary). Secondary sources say production is in China and Vietnam. No plant name or address found | Not found at plant level. Owner named by secondary sources only |
| Desky | Not searched | | Not found (not searched) |
| Advwin | Not searched | | Not found (not searched) |
| Artiss (New Aim) | Not searched | | Not found (not searched) |
| Omnidesk | Not searched | | Not found (not searched) |
| Zen Space Desks | Not searched | | Not found (not searched) |
| Officeworks house brand | Not searched | | Not found (not searched) |
| Aldi SOHL | Not searched | | Not found (not searched) |
| Kogan | Not searched | | Not found (not searched) |

**EESS check.** The [EESS registration page](https://www.eess.gov.au/registration/registration-responsible-supplier/) (HTTP 200, fetched 2026-10-10) says the Responsible Supplier "must be a legally identifiable Australian or New Zealand entity holding an Australian Business Number (ABN), or a New Zealand Inland Revenue Department (IRD) number", and that "Registration is renewed annually". The home page links to a [registered responsible suppliers page](https://www.eess.gov.au/responsible-supplier/registed-responsible-suppliers/), which I did not fetch. Brand-level EESS searches are query-string URLs, which robots.txt disallows.

Earlier draft notes (factories_standing_desk.md): every section is "(pending)".

**Gaps.** The Responsible Supplier for FlexiSpot AU and for every other desk brand. Loctek's plant locations, which its exchange filings would give; not fetched.

## Product 5: Timber cubby houses

**Takeaway.** Retailer pages for Lifespan Kids name no maker. A directory lists two Australian cubby makers, but nothing links either of them to Lifespan.

| AU brand / retailer | Document found (URL; date) | Factory named | Confidence |
|---|---|---|---|
| Lifespan Kids | Mitre 10, [Lifespan Kids Teddy Cubby House V2](https://www.mitre10.com.au/lifespan-kids-teddy-cubby-house-v2-white-7134513); Harvey Norman, [Lifespan Kids V3 Natural Teddy](https://www.harveynorman.com.au/lifespan-kids-v3-natural-teddy-cubby-house.html). Search snippets, undated | None. A directory result ([melbourneplaygrounds.com.au](https://www.melbourneplaygrounds.com.au/c-23673/favicon.ico)) names Country Cubbies and Cubbykraft, with no link to Lifespan | Not found |
| Bunnings | Not searched directly. Earlier draft notes cite a self-declared customer claim on [Welfull Group's MIC profile](https://welfull-outdoors.en.made-in-china.com/company-Welfull-Group-Co-Ltd-.html), which lists Bunnings and Sodimac among its customers | None named. Welfull describes itself as a group with 2,000 "supply chain partners" | Not found |
| Plum | Not searched | | Not found (not searched) |
| Kmart Activo | Not searched | | Not found (not searched) |
| Ausway (Kmart Marketplace) | Not searched | | Not found (not searched) |
| Rovo (Kmart Marketplace) | Not searched | | Not found (not searched) |
| Keezi (New Aim) | Not searched | | Not found (not searched) |
| Big W | Not searched | | Not found (not searched) |

**Candidate leads from earlier draft notes** (factories_timber_cubby.md; US import records; not re-verified; none linked to an Australian brand): Heze Jinran Woodware (Zhuangzhai Town, Cao County, Shandong), Heze Zhongran Woodware (Jinxin Road, Zhuangzhai Town, Cao County), Xiamen Warmwood (Houxi Town, Jimei District, Xiamen), Fuzhou Economic and Technical Development (No. 19 Changxing Road, Mawei, Fuzhou), and Fujian Three Dimensional Wood Industry (No. 140 Dongxing Road, Dongping Town). Their US consignees are KidKraft, Backyard Kids and Leisure Time Products.

**Gaps.** The Lifespan Kids maker. Plum, Kmart Activo, Ausway, Rovo, Keezi, Big W and Bunnings were not searched for factories. The earlier notes' biosecurity section (Q3) is pending.

## Product 6: Aluminium folding camp kitchens

**Takeaway.** Wanderer's BCF listings name no maker. No camp-kitchen factory is linked to an Australian brand in this pass.

| AU brand / retailer | Document found (URL; date) | Factory named | Confidence |
|---|---|---|---|
| Wanderer (Super Retail Group / BCF) | BCF, [Wanderer lightweight kitchen station](https://www.bcf.com.au/p/wanderer-lightweight-kitchen-station/695963.html); [Wanderer premium series dual cupboard kitchen](https://www.bcf.com.au/p/wanderer-premium-series-dual-cupboard-kitchen/520333.html). Search snippets, undated | None | Not found |
| Kings (4WD Supacentre) | Not searched | | Not found (not searched) |
| Oztrail | Not searched | | Not found (not searched) |
| Companion | Not searched | | Not found (not searched) |
| Dune (Anaconda) | Not searched | | Not found (not searched) |
| Kmart | Factory list not extracted (see Product 1) | | Not found |
| Coleman AU | Not searched | | Not found (not searched) |

**Candidate leads from earlier draft notes** (factories_camp_kitchen.md; not re-verified; none linked to an Australian brand): Welfull Group (Hangzhou; its MIC profile describes a group with 2,000 supply-chain partners; Panjiva shows US shipments), Ningbo General Union (MIC business type "Trading Company"; "3000 partner factories"), and Ningbo Eto Outdoor Supplies (MIC; "over 60 suppliers"). Each profile describes a trader or sourcing group rather than a plant.

**Gaps.** Wanderer's maker or importer; the Super Retail Group disclosures were not reached. Kings, Oztrail, Companion, Dune and Coleman AU were not searched. The earlier notes' Q1, Q3 and Q5 sections are pending.

## Source access log (checked 2026-10-10)

| Source | Method | Outcome |
|---|---|---|
| ACCC recalls, [productsafety.gov.au/recalls](https://www.productsafety.gov.au/recalls) | curl GET; robots.txt | HTTP 403, Akamai "Access Denied"; robots.txt also HTTP 403. Not retried, not bypassed |
| EESS home, [eess.gov.au](https://www.eess.gov.au/) | curl GET; robots.txt | HTTP 200, 74,942 bytes. robots.txt HTTP 200: `Disallow: /*?`, `Crawl-delay: 3` |
| EESS registration page | curl GET | HTTP 200, 74,100 bytes; read |
| EESS authorised-officer page | curl GET | HTTP 200, 70,834 bytes; no supplier names |
| ImportYeti home, [importyeti.com](https://www.importyeti.com/) | curl GET; robots.txt | HTTP 403, bot-challenge page ("Just a moment..."). robots.txt HTTP 200 (allows "/", disallows /search?q). Not bypassed |
| Modern Slavery Register, [modernslaveryregister.gov.au](https://www.modernslaveryregister.gov.au/) | curl GET; robots.txt | Egress proxy refused CONNECT with HTTP 502 for both. Not retried |
| Springfree blog | curl GET; robots.txt HTTP 200 | HTTP 200, 302,754 bytes; read |
| CHOICE, Springfree Medium Square S72 | curl GET | HTTP 200, 507,716 bytes; origin read |
| CHOICE, Vuly Thunder Medium | curl GET | HTTP 200, 507,611 bytes; origin read |
| Made-in-China, Lingsha profile (fr) | curl GET; robots.txt HTTP 200 | HTTP 200, 188,730 bytes; read |
| Made-in-China, Springfree keyword page (es) | curl GET; robots.txt HTTP 200 | HTTP 200, 216,145 bytes; the profile shown is Lingsha, not Springfree |
| Lifespan CORTEX product (www) | curl GET; robots.txt HTTP 200 | HTTP 404 (site template). Non-www URL not fetched |
| Kmart AU factory list | curl GET; robots.txt HTTP 200 | HTTP 200, 1,638,916 bytes. Text extraction gave navigation only; factory rows not extracted (they may sit in page script data, which extraction dropped). Saved in the session scratchpad at au_factory/kmart_factory_list.html |
| FlexiSpot AU | curl GET; robots.txt HTTP 200 | HTTP 200, 114 bytes; no content |
| WebSearch | 9 queries | Results returned for all nine |

WebSearch queries: "Springfree trampoline factory China"; "Vuly trampoline manufacturer China"; "Everfit trampoline manufacturer China"; "CORTEX bumper plates manufacturer"; "FlexiSpot Loctek factory manufacturer"; "Kmart supplier factory list"; "Gardeon double hammock manufacturer"; "Wanderer camp kitchen manufacturer"; "Lifespan Kids cubby house manufacturer".

Robots checks: for each host, robots.txt was fetched and the target path tested with Python's robotparser. Wildcard rules were checked by hand, since that parser does not handle them. None of the fetched paths matched a disallow rule. The user agent was research-notes-bot/1.0 (public documents only, low volume). No logins, forms or CAPTCHA responses were involved.

## Gaps and next steps

- Blocked: ACCC recall notices (403), ImportYeti (bot challenge), Modern Slavery Register (proxy 502).
- Not possible within robots.txt: brand-level EESS searches.
- Not searched: about 40 of the 49 brand-product pairs in the brief.
- Suggested next checks:
  1. Springfree: confirm DGSH Sourcing's legal name and plant address in a Chinese company registry, and check whether Dongguan Sheng Hui Fitness Equipment is the same company.
  2. Lifespan: the Product Manuals Library and Warranty & Repairs pages, for the CORTEX importer.
  3. Kmart: parse the saved factory-list HTML, including any embedded script data, for hard-goods rows.
  4. EESS: the registered responsible suppliers page, for FlexiSpot and the desk brands.
  5. Brand manuals, labels and packaging: look for "Manufactured by", "Made in" and importer lines.

---

## Update 2 (second pass, 2026-10-10): retailer lists, statements, and updated product tables

This section supersedes the product tables above where they differ. Confidence labels are unchanged: "Named explicitly" = factory name on a page read (including self-declared claims, marked as such); "Inferred" = name, cluster or shared-vendor match only; "Not found" = no factory name in anything read.

### 1. Retailer factory and supplier lists (URL, date)

| Retailer | Source (URL) | Date on list | Rows read | China rows | Product field |
|---|---|---|---|---|---|
| Kmart Group (Kmart AU) | Factory list page https://www.kmart.com.au/factory-list/ links XLSX https://www.kmart.com.au/wcsstore/Kmart/pdfs/Kmart+Published+Factory+List+Nov+2025.xlsx (page: updated every six months, last updated Nov 2025) | Nov 2025 | General Merchandise (GM) 833; Apparel 947 | GM 682 | None (every GM row is coded "GM") |
| Target Australia | Factory list page https://www.target.com.au/company/better-together/people/human-rights/factory-list links XLSX https://www.target.com.au/medias/marketing/pdf/Target_Published_Factory_List_Nov_2025.xlsx (the page also links 2022 and 2024 lists) | Nov 2025 | GM 92; Apparel 901 | GM 70 | None |
| Big W (Woolworths Group) | PDF https://www.woolworthsgroup.com.au/content/dam/wwg/documents/group-responsibility/july-2026/Jul%202026_BIGW-Factory-List-excluded-Bangladesh.pdf ("Active apparel and textile factories", Bangladesh excluded) | Jul 2026 | 28 HARDGOODS rows (SOFTGOODS not counted) | 17 HARDGOODS rows with China nearby | Commodity code only |
| Bunnings (Wesfarmers) | No factory list found. Wesfarmers 2026 Modern Slavery Statement https://www.wesfarmers.com.au/docs/default-source/sustainability/sustainability-2026/2026-wesfarmers-modern-slavery-statement.pdf?sfvrsn=f2acafbb_1 (7.1 MB, read as text) | 2026 (FY26) | Says Bunnings Group, Kmart Group and Officeworks "do not own the factories where goods are made"; Bunnings engages Tier 1 suppliers directly and Tier 2 is indirect; "Greater China" is the group's 4th largest sourcing location by value (all divisions; goods include furniture, barbecues and accessories, general merchandise, garden decor, lighting and tools) | n/a | n/a |
| Super Retail Group (BCF, Rebel, Supercheap Auto, Macpac) | No factory list found. 2026 Responsible Business Report https://superretailgroup.com.au/wp-content/uploads/2026/08/3105242.pdf (covers 1 Jul 2025 to 30 Jun 2026) | FY26 | 555 registered active first-tier factories in 15 countries (country split not in the extracted text); 515 risk-audited, 491 (95%) audited in the past two years; 45 onboarded in FY26; "We do not directly own any product manufacturing facilities" | n/a | n/a |
| Lifespan Fitness | No factory list; no modern slavery statement found in search. Warranty page names no maker or importer | n/a | n/a | n/a | n/a |
| New Aim | No factory list. Corporate site https://www.newaim.com.au/ has no statement or supplier link. FY25 statement (1 Jul 2024 to 30 Jun 2025) is on the Register: https://modernslaveryregister.gov.au/statements/yczA8cUKpTPqZDt/pdf (search result; not readable, see access log) | FY25 | n/a | n/a | n/a |

### 2. What the three factory lists show, and how to read them

- Each list gives factory name, address, country, and a vendor (Kmart, Target) or supplier (Big W) field, plus audit scheme. None gives a product type, so every product link below is a name or cluster match. Those links are inferred, not confirmed.
- Australian-named vendors and suppliers linked to Chinese factories (examples):
  - Dongyang Lvbo Leisure Products Co., Ltd (Lizhai Industry Functional Area, Chengdong Street, Dongyang, Zhejiang; Target GM): vendor "Alvin International Pty Ltd".
  - Ningbo Liding Craft Industrial & Trading Co., Ltd (88-116 Jiheng Road, Haishu, Ningbo) and Ningbo Yixing Arts and Crafts Co., Ltd (Hangzhou Bay New District, Ningbo) (Kmart GM): vendor "Shamrock Australia Pty Ltd as trustee for the Shamrock Unit Trust".
  - Ningbo Zhixing Craft Co., Ltd (Songlin West Road, Ningbo; Kmart GM): vendor "Mjm Australia Imports".
  - Zhejiang Boyoo Leisure Products Co., Ltd (Linhai, Taizhou; Kmart GM): vendor string includes "Hunter & Leisure Pty Ltd".
  - Zhejiang Vista Sports Goods Co., Ltd (Wenling, Taizhou; Kmart GM): vendor string includes "Hunter Leisure P/L".
  - Ningbo Custom Crafts Ltd (Haishu, Ningbo; Target GM): vendor string includes "Hunter Leisure P/L".
  - Rugao Hongtai Textile Co., Ltd (Jiang'an Town, Rugao, Nantong; Big W, Kmart GM, Target GM): vendor strings include "Caprice Australia Pty Ltd".
  - Wuxi JHT Homewares Co., Ltd (Huishan Industrial Park, Wuxi; Big W, Target GM): Target vendor strings include "Caprice Australia" and "Sleepcraft Distributors Pty Ltd".
  - Yangzhou Arron Toys Co., Ltd (Target GM): vendor "Just Play Aus Pty Ltd".
  - Big W HARDGOODS supplier to factory pairs (textile and homewares, not our six products): C Stuart Pty Ltd to Zhejiang Jino Textiles Co., Ltd (Yuhang, Hangzhou); G.L Bowron Australia Pty Ltd to Henan Prosper & Colomer Moda Co., Ltd (Mengzhou, Henan); Interfab Australia to Hebei Tenya Textile Co., Ltd (Hengshui, Hebei); Farallon Brands Australia Pty Ltd to Yangzhou Yingsite Arts & Crafts Co., Ltd (Yangzhou, Jiangsu); Austyle Home Fashion Pty to Pujiang County Chaoyue (Austyle) Quilting Handicraft Factory (Pujiang County, Jinhua). Shanghai Aili Industrial lists Nantong Yuxiao Housewares Co., Ltd (Chongchuan District, Nantong) and Pujiang Kingshow Carpet Co., Ltd.
- Factories on two or more of the three AU lists (approved-vendor signal; products unverified): Dongyang Lvbo Leisure (Kmart and Target); Hape International (Ningbo) Ltd (Kmart and Target); Ningbo Custom Crafts Ltd (Kmart and Target); Jinhua Tianhai Travelware Factory (Kmart and Target); Yuyao Zhongkong Plastic & Packing Co., Ltd (Kmart and Target); Rugao Hongtai Textile (Big W, Kmart and Target); Wuxi JHT Homewares (Big W and Target); Hangzhou Qiyao Textile Co., Ltd (Big W and Target).

### 3. Candidate factories by product (from the Kmart and Target GM lists; product NOT confirmed)

Vendor names are as printed in the lists (truncated where the list truncates them). "Alvin Cultural & Sporting Goods Co" is the vendor string for five sporting or leisure factories in Jinhua, Taizhou and Jiangsu; its country is not shown.

**Trampolines** (Jinhua / Wuyi / Dongyang; Taizhou; Tianjin)
- Jinhua Jingyi Gymnastic Equipment Co., Ltd, No.1289 Jinyuan Road, Dongxiao Street, Jindong District, Jinhua, Zhejiang (Kmart GM; vendor "Alvin Cultural & Sporting Goods Co"). Search surfaced Jingyi-named trampoline cards on supplier directories (accio.com and SourceReady; self-reported, not opened individually). Linking those cards to this factory is an inference. Confidence: Inferred.
- Dongyang Lvbo Leisure Products Co., Ltd, Lizhai Industry Functional Area, Chengdong Street, Dongyang, Zhejiang (Kmart GM vendor "Alvin Cultural & Sporting Goods Co"; Target GM vendor "Alvin International Pty Ltd"). Product not stated. Confidence: Inferred.
- Wuyi Yijia Leisure Products Co., Ltd, No.6 Yulan Road, Baihuashan Industrial Zone, Wuyi County, Jinhua (Kmart GM; vendor "Alvin Cultural & Sporting Goods Co"). Confidence: Inferred.
- Jinhua Xingkang Sports Goods Co., Ltd, No.1001 Bada Road, Wucheng, Jinhua (Kmart GM; vendor "Hyper Extension (Non Kmart Asia)..."). Confidence: Inferred.
- Zhejiang Jaray Leisure Products Co., Ltd, Huanglong Industrial Zone, Hushan Street, Wuyi, Jinhua (vendor "Homelife Enterprises Limited"). Zhejiang Dayang Leisure Products Manufacture Co., Baihuashan Industrial Zone, Wuyi County (vendor "Golden Lion Ltd"). Confidence: Inferred.
- Zhejiang Boyoo Leisure Products Co., Ltd, Linhai, Taizhou (vendor string includes "Hunter & Leisure Pty Ltd"); Zhejiang Vista Sports Goods Co., Ltd, Wenling, Taizhou (vendor string includes "Hunter Leisure P/L"). Confidence: Inferred.
- Shengzhou Qirui Sports Co., Ltd, Changle Town, Shengzhou (vendor "Roebel Sports & Overseas (Asia) Ltd."). Confidence: Inferred (sports; product not stated).
- Tianjin Fuji-Ta Sporting and Recreational Products Co., Ltd, No.20 Taian Road, Jinghai Economic Development Zone, Tianjin (Kmart GM; the vendor is the factory itself). The earlier draft notes list "Tianjin Fuji-Ta Technology Co" as a partner of Acon USA in US trampoline import records. No link to this entity was found. Confidence: Inferred (low).
- Zhejiang Tianzhixin Sports Equipment Co., Ltd: a trade-show article says it exhibited fitness trampolines at FIBO 2026 (https://fragfitty.de/en/articles/fibo-2026-zhejiang-tianzhixin-sports-equipment-co-ltd). Not on any AU list. Trade-show lead only.

**Bumper plates and dumbbells** (Nantong / Ningjin / Dezhou; Dingzhou)
- Hebei Hengda Sports Culture Supplies Group Co., Ltd, Hengda Road, Dingzhou Economic Development Zone, Hebei (Kmart GM; vendor "Roebel Sports & Overseas (Asia) Ltd."). Self-reported profile (Global Sources, https://hebeihengda.manufacturer.globalsources.com/company-profile_6008837461063.htm): dumbbells, barbells, kettlebells, weight plates. The same profile gives annual sales of US$1-2 million and 550-599 staff, which conflicts with directory listings. Confidence: Inferred (category only).
- Dingzhou Shuangjia Fitness, Hengda Road, Dingzhou (Kmart GM; vendor "Hangzhou Standard Mayo Industrial Limited"). Name only. Confidence: Inferred.
- Nantong / Ningjin / Dezhou cluster: 13 Kmart GM rows and 6 Target GM rows, all textile, display, recreation or housewares names (for example Bestway (Nantong) Recreation Corp.; Rugao Hongtai). No bumper-plate or dumbbell maker by name. Not found.

**Hammocks** (Ningbo)
- Ningbo Topright Leisure Products Co., Ltd, Donglinsi Village, Jiangshan, Yinzhou, Ningbo (Kmart GM; vendor "Ningbo Starlight Imp. & Exp. Co., Ltd; Kidsgro Limited"). Name only. Confidence: Inferred.
- Cixi Kingtra Leisure Products Co., Ltd, No.22 Taisheng Road, Kuangyan Town, Cixi, Ningbo (vendor "St Asia Limited"). Name only. Confidence: Inferred.
- Ningbo Fumao Outdoor Products Co., Ltd, Ningdong Economic Development Zone, Ningbo (vendor "Hyper Extension Ltd"). Self-described maker of blow-moulded camping and water containers, garden tools and bottles (https://freshdi.com/supplier/Ningbo-Fumao-Outdoor-Products-Co-Ltd-). No hammocks in the description. Ruled out as a hammock candidate on current evidence.
- Ningbo cluster: 129 Kmart GM rows, mostly electrical appliances, stationery, plastics and crafts. No hammock maker named. Not found.

**Cubby houses** (Cao County, Heze)
- Cao Xian Luyi Wooden Product Co., Ltd, north side of the Kunlunshan Road and Hanjiang Road crossing, Qinghe Street, Cao County, Heze, Shandong (Kmart GM; SMETA audit; vendor "Caoxian Luyi Guangfa Art and Craft Co., Ltd"). Name ("wooden product") and cluster match. No independent profile found; one search result on a suspicious host was not used. Confidence: Inferred.
- Cao County Lianyun Arts & Crafts Co., Ltd (Weiwan Town; vendor "Homelife Enterprises Limited"); Cao County Shengya Arts & Crafts Co., Ltd (Pulian Market Town; vendor "Lbc Trading (HK) Company Limited"); Cao County Zhengheshun Crafts Co., Ltd (Niji Village; vendor "China National Arts & Crafts..." truncated); Shandong Fumao Arts & Crafts Co., Ltd (Caoxian Development Zone; vendor "Homelife Enterprises Limited"). Name and cluster only. Confidence: Inferred.
- The Cao County playhouse makers in the earlier draft notes (Heze Jinran Woodware; Heze Zhongran Woodware) do not appear in the Kmart or Target GM lists.
- Hape International (Ningbo) Ltd, Dagang Industrial City, Beilun, Ningbo (Kmart GM vendor "Happy Arts & Crafts (Ningbo) Co., Ltd"; Target GM vendors "Toymonster International Limited; Hape International (Ningbo) Ltd"). Wooden-toy maker by name; playhouse product not confirmed. Confidence: Inferred.

**Dual-motor desks**: no desk or lift-frame maker appears in the Kmart or Target GM lists. Not found.

**Camp kitchens** (Yongkang; Hangzhou)
- Zhejiang RL Kitchenware Manufacture Company Limited, Dongcheng Subdistrict, Yongkang (vendor "Rl Industry Company Ltd"). Kitchenware; camp product not confirmed. Confidence: Inferred.
- Yongkang Yuankai Leisure Products Co., Ltd, Chengxi District, Yongkang (vendor "Wanze Industry Co., Limited; Littan International Corp"). Name only. Confidence: Inferred.
- Hangzhou (Yuhang, Xiaoshan, Fuyang) cluster: 31 Kmart GM rows, mostly textiles and fibres. Toolrich Corporation (Fuyang) is a tools name. Not found as a camp-kitchen maker.

**Product-word scan**: 182 of the 682 Kmart GM China factory names contain a product word (leisure, outdoor, sport, fitness, toy, wood, furniture, camp, craft, gym, weight, desk, kitchen and similar). 17 of 70 Target GM China names do.

### 4. Updated product tables (brand or retailer | document (URL, date) | factory (Chinese / English; address) | confidence)

**Product 1: trampolines**

| Brand or retailer | Document (URL, date) | Factory | Confidence |
|---|---|---|---|
| Springfree | Brand blog https://www.springfreetrampoline.com/blogs/beyond-the-bounce/where-are-springfree-trampolines-made (undated, fetched 2026-10-10). US customs record, Panjiva https://cn.panjiva.com/Springfree-Trampoline/4337947 (fetched 2026-10-10; shipments dated 2021-03-17, 2021-09-27, 2021-10-03) | Brand statement: DGSH Sourcing, Dongguan, Guangdong (no Chinese name, no street address). Customs shipper: Sheng Hui Fitness Equipment Co., Ltd (also shown as Dongguan Sheng Hui Fitness Equipment), 3 Liangtouwei, Liheng Village, Qingxi Town, Dongguan; trampolines (HTS 9506.91) to Springfree Trampoline, 1875 NW Poplar Way, Issaquah WA | Named explicitly (both sources). DGSH = Sheng Hui is probable (same city, initials) but no document links the two names |
| Vuly | CHOICE review of Vuly Thunder Medium https://www.choice.com.au/products/babies-and-kids/children-and-safety/toys-and-safety-at-play/vuly-thunder-medium (fetched 2026-10-10; discontinued, 2.5 m) | None; "Country of origin: China" | Not found (origin only, different model) |
| Everfit | Baby Bunting 42-inch foldable listing https://www.babybunting.com.au/product/everfit-fitness-foldable-trampoline-black-7021815 (snippet, undated) | None; origin China | Not found (origin only, different model) |
| Kahuna (New Aim) | Kmart 12 ft listing https://www.kmart.com.au/product/kahuna-12-ft-trampoline-110004621/ returned HTTP 403 (not bypassed). Search shows Klika Group as a Kmart marketplace seller | None | Not found |
| Lifespan Kids | Harvey Norman and Mitre 10 listings (snippets) | None | Not found |
| Kmart (own 10-12 ft) | Kmart GM list, Nov 2025 (no product field) | Name candidates: Jinhua Jingyi Gymnastic Equipment; Dongyang Lvbo Leisure | Inferred (candidates only) |
| Big W | Big W list, Jul 2026: hardgoods rows are textiles and homewares | None | Not found |
| Plum / TP Toys | https://www.plumplay.com.au/ (fetched 2026-10-10): "Since 1988", Springsafe trampolines, "timber sustainably sourced" | None | Not found |
| Jumpflex | https://www.jumpflex.com.au/ (fetched 2026-10-10): "world leading manufacturing methods", 10-year frame warranty | None | Not found |
| Advwin | Harvey Norman, Bunnings, Kmart and PriceMe listings (snippets, AU$79-107): 40-50 inch rebounders, not 12-14 ft | None | Not found |

**Product 2: bumper plates and dumbbells**

| Brand or retailer | Document (URL, date) | Factory | Confidence |
|---|---|---|---|
| CORTEX (Lifespan Fitness) | https://www.lifespanfitness.com.au/products/cortex-5kg-black-series-v2-bumper-plate-pair returned HTTP 404 (fetched 2026-10-10). Warranty and repairs page https://www.lifespanfitness.com.au/pages/warranty-repairs (fetched 2026-10-10) names only Lifespan Fitness. Product manuals page https://www.lifespanfitness.com.au/pages/product-manuals (manual list loaded by script; not readable) | None | Not found |
| BRIXX | Harvey Norman listing https://www.harveynorman.com.au/brixx-elite-olympic-bumper-plates-package-150kg.html (snippet): 24-month warranty from an unnamed manufacturer; footer names eComm Store Pty Ltd (site operator) | None | Not found |
| Everfit (plates) | JB Hi-Fi listing https://www.jbhifi.com.au/products/everfit-weight-plates-olympic-5kg-dumbbells-barbells-plate-weight-lifting-home (snippet): cast-iron plates with rubber coating; Kmart marketplace seller "Aisle Six" | None | Not found |
| Fitness Master | None found (a Swedish "Master Fitness" competition plate is a different name) | None | Not found |
| Powertrain | None found ("Power Systems" plates on a US marketplace are a different name) | None | Not found |
| HCE | None found (Rogue HC is a different brand) | None | Not found |
| Force USA | Listings on forceusa.co.uk (manufacturer field reads "ForceUSA"). The brief says Australian-founded; these pages do not show that | None | Not found |
| Rebel / Celsius | Rebel Sport AU Celsius Olympic plates, https://www.rebelsport.com.au/p/celsius-10kg-olympic-weight-plate-389662.html?cgid=REB10 (snippet; $49.99-$159.99) | None | Not found |
| Kmart (bumper plates) | Kmart sells Bodyworx plates, not Anko: https://www.kmart.com.au/product/bodyworx-bumper-plate-2-pack-5kg-olympic-rubber-encased-plates-50mm-diameter-black-110073896/ (snippet; one listing sold by KG SuperStore) | None | Not found |
| Hebei Hengda (candidate) | Kmart GM list; self-reported Global Sources profile (see section 3) | Hebei Hengda Sports Culture Supplies Group Co., Ltd, Dingzhou, Hebei | Inferred (category only) |

**Product 3: double hammocks with steel stand**

| Brand or retailer | Document (URL, date) | Factory | Confidence |
|---|---|---|---|
| Gardeon (New Aim) | Harvey Norman https://www.harveynorman.com.au/gardeon-double-hammock-chair-stand-steel-frame.html; Myer https://catalogues.myer.com.au/p/gardeon-double-tassel-hammock-with-woden-hammock-stand; MyGenerator https://mygenerator.com.au/product/gardeon-camping-hammock-with-stand (snippets, undated) | None; 12-month warranty field with no maker | Not found |
| Marquee (Bunnings house brand) | Bunnings AU hammock category https://www.bunnings.com.au/products/outdoor-living/outdoor-furniture/outdoor-lounge-furniture/hammocks (snippet): Marquee double polycotton hammock $39.90; double hammock kit $69; no Marquee stand found | None | Not found |
| Costway AU | Bunnings marketplace, hanging-chair stand $91.95, sold by Costway: https://www.bunnings.com.au/costway-hanging-chair-stand-rustproof-hammock-frame_p0647642 | None | Not found |
| Kmart (Anko) | No Anko stand found. Mountview hammock with stand https://www.kmart.com.au/product/mountview-hammock-and-hanging-chair-with-stand-110141614/ (no maker) | None | Not found |
| Big W | Big W list (Jul 2026): no hammock or stand supplier | None | Not found |
| Aldi (Special Buys) | US Adventuridge and UK Aldi hammocks only; no Australian Aldi listing found | None | Not found |

**Product 4: dual-motor electric standing desks**

| Brand or retailer | Document (URL, date) | Factory | Confidence |
|---|---|---|---|
| FlexiSpot AU (Loctek) | flexispot.com.au returned HTTP 200 with 114 bytes and no content (fetched 2026-10-10). Owner named by secondary pages https://www.accio.com/business/flexispot and https://www.workwhilewalking.com/flexispot-reviews (snippets) | Owner: Loctek Ergonomic Technology, Ningbo (listed in Shenzhen, code 300729, per search summary). Secondary sources say production is in China and Vietnam. Plant not found | Owner only; plant not found |
| Desky | desky.ca (Canada; self-reported; parts from domestic and international suppliers) | None | Not found (not an Australian-linked factory) |
| Advwin | Kmart marketplace https://www.kmart.com.au/product/advwin-electric-standing-desk-height-adjustable-brown-110012882/ (Advwin is the seller and shipper); Harvey Norman listings (snippets) | None | Not found |
| Artiss (New Aim) | JB Hi-Fi https://www.jbhifi.com.au/products/artiss-standing-desk-motorised-white-140cm (12-month warranty; no maker) | None | Not found |
| Omnidesk | CB Insights, Singapore base: https://www.cbinsights.com/compare/afc-industries-1-vs-omnidesk. A search result names Ultimate Desk Sdn Bhd (Malaysia) as the legal entity (not opened) | None; no China link found | Not found |
| Zen Space Desks | Directory https://www.arounddeal.com/c/zen-space-desks/v7yzpavclr; review https://arielle.com.au/zen-space-desks-review/ (Brisbane furniture maker per directory; supply and status concerns in review) | None | Not found |
| Officeworks (Stilford, Otto, J.Burrows; Fellowes third-party) | https://officeworks.com.au/shop/officeworks/c/furniture/desks-tables/standing-desks (exclusive labels; Stilford warranty 15 years frame, 5 years electrical) | None | Not found |
| Aldi SOHL | https://www.ozbargain.com.au/node/960910 (SOHL electric desk $189; one motor; date not shown) | None | Not found |
| Kogan (Ergolux) | https://www.ozbargain.com.au/brand/ergolux (Ergolux electric desks sold via Kogan; deals expired) | None | Not found |

EESS check. The registered-responsible-supplier page https://www.eess.gov.au/responsible-supplier/registed-responsible-suppliers/ (HTTP 200, 71,307 bytes, fetched 2026-10-10) has no supplier names in its static text. It says only a Registered Responsible Supplier may let an overseas manufacturer use the RCM mark for product it imports and sells in Australia. The manufacturers and importers page (HTTP 200, 81,581 bytes) has no names either. EESS therefore identifies the Australian importer, not the factory. FlexiSpot, Desky, Advwin and Artiss do not appear in the static pages.

**Product 5: timber cubby houses**

| Brand or retailer | Document (URL, date) | Factory | Confidence |
|---|---|---|---|
| Lifespan Kids | Harvey Norman https://www.harveynorman.com.au/lifespan-kids-v3-natural-teddy-cubby-house.html; Mitre 10 https://www.mitre10.com.au/lifespan-kids-teddy-cubby-house-v2-white-7134513 (snippets, undated) | None. A directory names Country Cubbies and Cubbykraft with no link to Lifespan | Not found |
| Plum | Harvey Norman Plum Skye cubby (snippet; $699, one-year warranty); plumplay.com.au (fetched): timber "sustainably sourced" | None | Not found |
| Kmart Activo | https://www.kmart.com.au/product/activo-lets-go-play-wooden-cubby-house-with-kitchen-43271481/ (snippet; $99 clearance; 137.9 x 136.5 x 95.5 cm) | None named. Name and cluster candidate: Cao Xian Luyi Wooden Product (section 3) | Not found (maker); inferred candidate only |
| Ausway | Kmart marketplace https://www.kmart.com.au/product/ausway-outdoor-kids-cubby-house-wooden-playhouse-110154373/ (Ausway handles sale and dispatch; $349.97; fir wood) | None | Not found |
| Rovo | Kmart marketplace https://www.kmart.com.au/product/rovo-kids-cottage-style-cubby-house-multi-110079233/ ($399); Bunnings marketplace tower listing https://www.bunnings.com.au/rovo-kids-wooden-tower-cubby-house-with-slide-sandpit-climbing-wall-noughts-crosses-natural-colour_p0542416 ($1,299) | None | Not found |
| Keezi (New Aim) | https://lt3.com.ar/products/review/731576369 (page mixes unrelated text; not reliable) | None | Not found |
| Big W | Big W list (Jul 2026): no cubby supplier | None | Not found |
| Bunnings | Bunnings DIY and workshop pages (snippets). Wesfarmers 2026 statement: Bunnings does not own factories | None | Not found |

**Product 6: aluminium folding camp kitchens**

| Brand or retailer | Document (URL, date) | Factory | Confidence |
|---|---|---|---|
| Wanderer (Super Retail Group / BCF) | BCF https://www.bcf.com.au/p/wanderer-lightweight-kitchen-station/695963.html and https://www.bcf.com.au/p/wanderer-premium-series-dual-cupboard-kitchen/520333.html (snippets, undated) | None | Not found |
| Kings (4WD Supacentre) | No camp-kitchen brand "Kings" found in search | None | Not found |
| Oztrail | Snowys https://www.snowys.com.au/camp-kitchen-with-double-pantry (OZtrail brand; no maker named) | None | Not found |
| Companion | Snowys https://snowys.com.au/camp-kitchen-with-sink (Companion burners mentioned in Q&A; no maker) | None | Not found |
| Dune (Anaconda) | https://www.ozbargain.com.au/node/973623 (Dune 12V fridges and camp tools at Anaconda; no Dune camp kitchen) | None | Not found |
| Coleman AU | Snowys https://snowys.com.au/camp-kitchen-standard; Bunnings Coleman BBQ kitchens ($3,696-$4,849; home BBQ) | None | Not found |
| Kmart (camp kitchen) | Kmart GM list (Nov 2025): Zhejiang RL Kitchenware (Yongkang); Yongkang Yuankai Leisure Products (Yongkang) | Name and cluster only | Inferred (candidates only) |

### 5. Other facts from this pass
- Wesfarmers 2026 Modern Slavery Statement (URL in section 1): Bunnings, Kmart Group, Officeworks and Industrial and Safety do not own factories. Its top-25 sourcing-location table puts Greater China 4th by value across all divisions. The statement gives no factory list.
- Super Retail Group 2026 Responsible Business Report (URL in section 1): 555 registered active first-tier factories in 15 countries; the country split is not in the extracted text (likely a graphic). The FY25 Modern Slavery Statement is hosted on media.supercheapauto.com.au, whose robots.txt returns HTTP 403, so it was not fetched. The FY26 statement is due end December 2026.
- Lifespan Fitness: no modern slavery statement or factory list found. The footer shows ABN 96 137 370 953 (https://www.lifespanfitness.com.au/pages/assembly-servicing).
- New Aim: the corporate site (https://www.newaim.com.au/, HTTP 200) has no modern slavery or supplier link. Its FY25 statement is on the Register (blocked, see below).

### 6. Access log additions (2026-10-10)

| Source | Outcome |
|---|---|
| Kmart XLSX (Nov 2025) | HTTP 200, 236,997 bytes |
| Kmart Kahuna 12 ft product page | HTTP 403 (Akamai "Access Denied"); not bypassed |
| Kmart NZ factory list (wishingtree.kmart.co.nz) | No connection (HTTP 000) on robots.txt; not retried |
| Target factory-list page; Nov 2025 XLSX | HTTP 200, 222,111 bytes; XLSX HTTP 200, 140,937 bytes |
| Big W Jul 2026 PDF | HTTP 200, 83,330 bytes |
| EESS registered suppliers; manufacturers and importers | HTTP 200 (71,307 and 81,581 bytes); no supplier names |
| Lifespan warranty; manuals; assembly | HTTP 200 (674,329; 678,223; and assembly pages); manuals list is script-loaded |
| Panjiva Springfree page | HTTP 200, 38,754 bytes; robots.txt allows the path |
| Jumpflex (jumpflex.com.au robots 301; www fetched) | HTTP 200, 307,361 bytes |
| Plum (plumplay.com.au) | HTTP 200, 878,937 bytes |
| Modern Slavery Register (www.modernslaveryregister.gov.au) | Egress proxy refused CONNECT with HTTP 502 on the first attempt and on the single retry. The environment network policy denies this host. It was not routed around. Statements found by search only (not read): SRG 2025 and New Aim FY25 |
| Wesfarmers 2026 MSS PDF; Wesfarmers site; previous-statements page | HTTP 200 (PDF 7,135,858 bytes; previous-statements page 52,211 bytes) |
| Super Retail Group (redirects to superretailgroup.com.au) | HTTP 200; responsible-business page HTTP 200 (75,610 bytes); 2026 report PDF HTTP 200 (13,778,450 bytes) |
| SRG 2025 MSS (media.supercheapauto.com.au) | robots.txt HTTP 403; not fetched |
| New Aim (newaim.com.au redirects to www.newaim.com.au) | HTTP 200, 66,474 bytes; no statement link |
| WebSearch, this pass | 46 queries; all returned results. Snippets are leads only |

### 7. Gaps and next steps
- Not found for any of the six products by name: no product-level factory list is published by Kmart, Target, Big W, Wesfarmers, Super Retail Group, Lifespan or New Aim. The candidates above are name and cluster matches only.
- Most useful single check next: confirm DGSH Sourcing's legal name and plant address, and whether Dongguan Sheng Hui Fitness Equipment is the same company, in the Chinese enterprise registry (not accessed in this pass).
- For product-level evidence on the candidates (Jinhua Jingyi, Dongyang Lvbo, Wuyi Yijia, Hebei Hengda, Cao Xian Luyi, Ningbo Topright, Cixi Kingtra, Zhejiang RL), the next source would be each factory's own catalogue or registry record. None was reachable in this pass.
- Network: the Modern Slavery Register host needs to be allowed in the environment's Network access settings before the New Aim FY25 and SRG 2025 statements can be read.
