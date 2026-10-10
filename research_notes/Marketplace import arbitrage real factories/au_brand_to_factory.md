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
