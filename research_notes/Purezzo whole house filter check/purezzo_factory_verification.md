# Purezzo (purezzo.com.cn) and its PWF-203BC whole-house filter: supplier verification and the Chinese production base (research date 2026-10-10)

**Status:** final.

**Method**
- All probes ran on 2026-10-10, from a cloud container through the configured proxy, using the robots-gated probe from the earlier toolkit round.
- robots.txt was read before every content fetch.
- Nothing was bypassed: no logins, accounts or contact with anyone, and no CAPTCHA or slider solving.

**Evidence grades** use the toolkit scale in ../Marketplace import arbitrage real factories/verification_toolkit.md (Q3):
- **A:** registry scope, direct-shipper customs to established brands, certificate naming the factory site, patent, listed-company filing.
- **B:** auditor-verified block, own website with ICP, customs to small buyers, trade-show or association listing.
- **C:** platform badges and self-description.

**Labels used in the notes**
- "(search summary)" means a fact came only from the WebSearch tool's summary of a page that was not fetched.
- Every ABCB/WaterMark host (ncc., watermark., cpd., dev.abcb.gov.au) carries "User-agent: ClaudeBot / Disallow: /" and "User-agent: anthropic-ai / Disallow: /", and nccb.gov.au failed TLS hostname verification. So **all WaterMark facts below are search summaries**.

## Q1. Who is Purezzo? Legal name, address, what it sells, group links, same products under other names

### Takeaway
"Purezzo" is the trading name of a small Shanghai water-treatment seller, not a large group.
- **Name and address:** it appears as "Shanghai Purezzo Environmental Technology Co., Ltd." on Alibaba and on a 2022 US bill of lading, at No. 758 Songsheng Road, Songjiang, Shanghai 201600.
- **Domain:** purezzo.com.cn was registered in 2020 by **上海壹杯水环保科技有限公司**. It hosts **no website at all**, only Alibaba enterprise e-mail.
- **What is missing:** no "about us" page, no 营业执照 page, no ICP filing, no factory photos and no capacity or certification claims could be found anywhere public.
- **Group or brand links:** no larger group was found behind it.
- **The product line:** the "PWF" model family that PWF-203BC belongs to is already WaterMark-listed in Australia under several other brand names (see Q3 and Q5).

### Cited Findings

**Domain and e-mail**
- purezzo.com.cn has no web presence:
  - the apex has no A record (SOA only, HiChina)
  - www.purezzo.com.cn returns NXDOMAIN (DNS Status 3)
  - the domain has MX "5 mx01.mail.alibaba.com", "10 mx02.mail.alibaba.com", SPF "v=spf1 include:spf.qiye.aliyun.com -all", and NS dns31/dns32.hichina.com
  - — [Google DNS MX](https://dns.google/resolve?name=purezzo.com.cn&type=MX); [Google DNS A](https://dns.google/resolve?name=www.purezzo.com.cn&type=A)
  - The proxy answered "Tunnel connection failed: 502 Bad Gateway" for https://www.purezzo.com.cn/ and https://purezzo.com.cn/.
- WHOIS for purezzo.com.cn:
  - "Registrant: 上海壹杯水环保科技有限公司"
  - "Sponsoring Registrar: 阿里巴巴云计算（北京）有限公司"
  - "Registration Time: 2020-04-03 10:46:50"; "Expiration Time: 2030-04-03"
  - status ok; DNSSEC unsigned
  - — [whois.com](https://www.whois.com/whois/purezzo.com.cn)
- purezzo.com is a different TLD on Dutch zxcs name servers (185.104.28.238) with a self-signed certificate. It was not fetched, and nothing links it to the Shanghai firm — [Google DNS](https://dns.google/resolve?name=purezzo.com&type=NS)

**Alibaba store**
- Alibaba data embedded in an Accio (Alibaba's AI sourcing tool) page:
  - companyName "Shanghai Purezzo Environmental Technology Co., Ltd."; ownerLoginId "purezzo"; mainAliId 2206757352695
  - "6 yrs"; reviewScore 5.0; deliveryRate "96.6%"; reorder rate "40%"; "83 Interested customers"
  - comp_biz_type "manufacturer"; cooperated_with_fortune_500 "N"; oempb "N"
  - listing "Mini Tap Water PP Filter for Test Water Quality and for New Customer" (product 1600681048566): $0.30 (2–99), $0.25 (100–999), $0.22 (1,000+)
  - — [Accio](https://www.accio.ai/find-product/pureone-water-filter-factory)
- The store itself (purezzo.en.alibaba.com) and the Alibaba product page both returned Alibaba's "_____tmd_____/punish" captcha interstitial. It was not bypassed, so the store's verified data, photos and certificates were not seen. *.en.alibaba.com is a DNS wildcard, so DNS alone proves nothing about a store.
- A search summary describes Shanghai Purezzo as a Shanghai maker of RO purifiers, citing a china.org.ru mirror listing "75G Box type Reverse Osmosis Under Sink Water Filter System for Home Use" (ID 1600340695116, an Alibaba-format ID). That page returned HTTP 403 and was not read — [china.org.ru (search summary)](https://china.org.ru/product/1600340695116)

**Other platforms and search**
- Made-in-China:
  - purezzo.en.made-in-china.com returned 404 "The information is not available right now".
  - MIC's "Purezzo" keyword page is auto-generated: all 30 cards came from unrelated sellers (geomembranes, fencing, CNC and so on), with no Purezzo listing.
  - — [MIC keyword page](https://www.made-in-china.com/products-search/hot-china-products/Purezzo.html)
- Address on the only US bill of lading: "SHANGHAI PUREZZO ENVIRONMENTAL TECHNOLOGY CO.LTD NO758,SONGSHENG ROAD,SONGJIANG SHANGHAI 201600 CN" — [ImportGenius](https://www.importgenius.com/suppliers/shanghai-purezzo-environmental)
- Web searches found nothing on Purezzo's or 壹杯水's own pages, news, group parent, staff, capacity or certifications:
  - queries: "Purezzo" water filter; "purezzo.com.cn"; 上海壹杯水环保科技有限公司; "壹杯水环保"; "Yibeishui"; "Shanghai Purezzo Environmental Technology"; "Purezzo" Shanghai
  - Results were name collisions only: Purezza (a UK vegan pizzeria and a UK water dispenser firm), Pure Shanghai (a fashion fair), Puretec, Pureeasy and others.
  - Example collision: [Purezza (Wikipedia)](https://en.wikipedia.org/wiki/Purezza). See also the Q2 searches.
- Searches for 松胜路758号 / "Songsheng Road" Songjiang returned nothing describing the site — [search result example](https://english.shanghai.gov.cn/en-BusinessEnvironmentSongjiang/20260724/ccd29860ab7a4804ba5ed00482fcc79f.html)

### Inferences
- **Chinese legal name vs English trade name (likely, not confirmed).**
  - The domain registrant 上海壹杯水环保科技有限公司 is probably the Chinese legal entity behind the English trade name "Shanghai Purezzo Environmental Technology Co., Ltd.".
  - Pointers: the same "上海…环保科技有限公司 = Shanghai … Environmental Technology Co., Ltd." pattern; the e-mail domain; the Alibaba login "purezzo"; and the 2020 registration matching "6 yrs" on Alibaba.
  - The two names are not translations of each other ("壹杯水" means "one cup of water"). Only the business licence can confirm which entity contracts and receives the money.
- **What it sells.** Public titles show water-treatment goods only: an under-sink RO purifier, test-sample PP filters, and, per the buyer's contact, the PWF whole-house cabinet line. That range is coherent, not sprawling. Whether Purezzo makes, assembles or buys these in could not be established.
- **Possible signs of sourcing from third parties (weak).**
  - The one export B/L lists **place of receipt Nanjing**, not Shanghai (Q2).
  - The cheapest Alibaba item is a 2-unit "for new customer" sample filter, a lead-generation pattern common to small sellers.
- **No larger group seen.** No Ningbo, Zhejiang or Guangdong parent was found, and none should be assumed.
- **Same products under other names:** the PWF platform is sold in Australia under at least five brand names (Q3, Q5).

### Gaps
- No 营业执照 scan, Unified Social Credit Code, 经营范围, registered capital, establishment date or 参保人数. GSXT, Qichacha, Tianyancha and Aiqicha were blocked from this environment (toolkit, same day) and were not retested.
- No ICP number exists to check, because there is no website.
- The character of No. 758 Songsheng Road (own plant, rented unit or office) is unknown. The B/L address carries no "Room/Tower/Building" wording, but that alone proves nothing.
- Self-claims normally found on an Alibaba store (factory photos/videos, staff, area, export markets, certificates) could not be read because of the captcha. Ask for them directly (Q6).

## Q2. Hard evidence of factory status, graded A/B/C, and a verdict

### Takeaway
There is **no A-grade evidence** that Purezzo is a factory.
- **Customs:** a single small 2022 US shipment as direct shipper, 408 kg to a Barbados-addressed buyer, received at Nanjing. That is weak B at best.
- **Self-descriptions (C):** a self-declared "manufacturer" label on Alibaba.
- **Searched and not found:** patents, third-party audits, trade-show records, association listings and a website.
- **Verdict: unconfirmed**, with a profile closer to a **small assembler/exporter** than to a housing, cartridge or sheet-metal factory.
- **The one potentially decisive item:** the PWF family's WaterMark licence **080071** (expires 07/08/2029). If its certificate names Purezzo, or its Chinese legal name, as licence holder with a Songjiang production site, that would be A-grade certification evidence. The holder's name was not visible here.

### Cited Findings

**Customs (US bills of lading)**
- ImportGenius supplier page "Shanghai Purezzo Environmental":
  - "Total Shipments: 1"; one trading partner; top partner "NPURE WATER FILTERATION"; port Miami
  - B/L EWBNNJHL22060144 "WATER PURIFIER AND PARTS", arrival 2022-10-03, origin shown "Hong Kong", 408 kg, 2 PKG, "House Bill", marks "NPURE", place of receipt "NANJING", foreign port "HONG KONG"
  - consignee address "UNIT 3A, SALTERS WAREHOUSE COMPLEX, SALTERS, ST. GEORGE SALTERS 19174 BB"
  - — [ImportGenius](https://www.importgenius.com/suppliers/shanghai-purezzo-environmental)
- Other ImportGenius slugs all redirected 301 → /tradebase, i.e. no page: purezzo, shanghai-purezzo-environmental-tech, -te, -technology, -technology-co, -technology-co-ltd, shanghai-yibeishui-environmental, shanghai-yibeishui-environmental-protection-technology-co-ltd.
- A domain-restricted search (panjiva.com, importgenius.com, importyeti.com) found no other Purezzo record. It did surface an ImportGenius browse page listing "Shanghai Purezzo Environmental Technology Co. Ltd., a Songjiang, Shanghai company" with a latest shipment in October 2022 — [ImportGenius browse (search summary)](https://www.importgenius.com/tradebase/browse/supplier/latest/3856)

**Patents**
- A search restricted to patents.google.com for 壹杯水 + 专利 + 净水 returned only unrelated water-purifier patents (e.g. [CN208839126U](https://patents.google.com/patent/CN208839126U/zh)), none naming 壹杯水 or Purezzo (search summary).
- Google Patents assignee search is disallowed by its robots.txt (toolkit), so it was not run.

**Third-party audits**
- Purezzo has no Made-in-China profile, so there is no TÜV/BV "verified" block or report number to check on verified.chn.tuv.com — [MIC 404](https://purezzo.en.made-in-china.com/)
- Alibaba verification data was hidden behind the captcha.

**Trade shows**
- A search for Purezzo or 壹杯水 at Aquatech China found no exhibitor record. It confirmed only that the show's directory exists, e.g. the 2024 edition on 11–13 Dec 2024 at SNIEC — [JETRO J-messe (search summary)](https://www.jetro.go.jp/en/database/j-messe/tradefair/detail/132540)
- Canton Fair, WQA and Aquatech Amsterdam exhibitor data were not reachable: the Canton Fair is script-loaded (toolkit), and no exhibitor URLs were found.

**WaterMark (Australian certification)**
- Licence **080071**: "Active Product Authorised Product, Safe to install Licence: 080071 Exp: 07/08/2029", covering several brands: Water Filter Direct (VORTEX-F3-2045), AquaOzzy (SU-3SF), AquaPrimus and Aquarius Water Filters — [cpd.nccb watermark search p.15206 (search summary)](https://cpd.nccb.gov.au/watermark-search?page=15206)
- PureFlow products (WHF15, PWF-10PP) are also under 080071 — [cpd.nccb watermark search p.15204 (search summary)](https://cpd.nccb.gov.au/watermark-search?page=15204)
- No search summary named the licence holder, the certifying body or the manufacturing site — [search summary](https://www.nccb.gov.au/product-search/product/722126)

**Evidence grading for Purezzo**

| # | Item | Family | Grade | Notes |
|---|---|---|---|---|
| 1 | One US B/L as direct shipper (2022, 408 kg, Barbados-addressed consignee, received at Nanjing) | Customs | B- (weak) | One shipment four years ago to a small buyer; not repeated, not a brand. Place of receipt Nanjing ≠ Songjiang address |
| 2 | Alibaba "manufacturer" business type, 6 yrs, 5.0 rating, 40% reorder | Platform/self | C | Never counts toward the threshold |
| 3 | Domain WHOIS → 上海壹杯水环保科技有限公司 (2020) | Identity | — | Identifies a candidate legal entity; says nothing about production |
| 4 | Own website / ICP / factory photos | Web presence | none (red flag) | The "website purezzo.com.cn" does not exist; e-mail only |
| 5 | Patents | IP | none found | — |
| 6 | TÜV/BV/SGS audit | Audit | none found | No MIC profile; Alibaba blocked |
| 7 | Trade-show booth | Institutional | none found | — |
| 8 | WaterMark licence 080071 for the PWF family | Certification | **pending** | Would be A if the certificate names Purezzo's licence entity as holder/manufacturer with a factory address |

### Inferences
- **Verdict: unconfirmed.**
  - Under the toolkit's decision rule, Purezzo sits in "Unverified": one weak B and C items only.
  - Its profile looks more like a **small assembler/exporter** than a component factory. Signs: no web presence, a minimal customs history, cargo received in Nanjing, and a commodity product built from big-blue housings, cartridges, gauges and a stainless sheet-metal frame (Q3).
  - Whether Purezzo assembles in Songjiang or buys finished units from a third party remains open.
- **What would upgrade it.** "Confirmed factory" would need, from two different evidence families:
  - the WaterMark certificate for 080071 naming Purezzo's licence entity and a Songjiang (or other) factory address, **plus**
  - a business licence whose 经营范围 includes production wording (e.g. "水处理设备制造", "生产"), with a credible 参保人数.
- **"Factory export arm"** fits if the WaterMark certificate names a different manufacturer, for example a Nanjing or Zhejiang plant, with Purezzo as the selling entity.

### Gaps
- The WaterMark licence holder, certifying body and certified manufacturing site for 080071 could not be read, because ABCB disallows AI agents. **The buyer can read them in a normal browser at the WaterMark Product Database (search licence 080071 or model "PWF").**
- Registry data, the Alibaba store's verified block and any SGS/BV report numbers were not obtained.
- No customs coverage exists for Australian imports. US data shows almost nothing because Purezzo's market appears to be Australia.

## Q3. The PWF-203BC product: other sellers, shared design, and whether US$290 for 64 units is high, fair or low

### Takeaway
**What PWF-203BC is**
- The **exact code "PWF-203BC" was not found** in any public listing.
- It belongs to a WaterMark-listed **PWF family**: PWF-203B-1, PWF-153BC, PWF-153BC-1, PWF-103BF-1, PWF-103B, and cartridges PWF-20PP/PWF-20CTO/PWF-10PP/PWF-10CTO/PWF-15PP.
- The family is sold in Australia under AquaPrimus, Aquarius Water Filters, PureFlow, Water Filter Direct (Vortex) and AQUAOZZY, which indicates **one shared OEM design**.

**Price verdict**
- The closest public Chinese analogue is Shanghai Chaomei's "Chormy" CM-20BC: triple 20" big-blue with a stainless-steel cover, **US$210–350 (MOQ 1) or US$240 (MOQ 20)**. On that basis US$290 is **fair-to-somewhat-high (about 20% over US$240)**.
- It is reasonable **only if** the unit ships with a valid (Lead-Free) WaterMark listing covering the exact model and the buyer's brand, which ordinary marketplace units lack.

**What the cabinet adds**
- Bracket-mounted 20" big-blue sets list at **US$32–66 (MOQ 50)**, so the cabinet versions carry roughly US$150–250 more.

**Australian resale benchmarks for the same PWF-style cabinet**
- AQUAOZZY: **A$1,299–1,499 incl. GST supply-only**.
- Aquarius Water Filters (Perth): **A$2,190 + GST installed**.

### Cited Findings

**The PWF family in the WaterMark database (search summaries)**
- PWF-203B-1, brand AQUAPRIMUS:
  - "Water Purifier – Chlorine Reduction – Category V"
  - "304 stainless steel mount" with 3 × 20"×4.5" PP housings, 1 × PWF-20PP, 2 × PWF-20CTO, **2** pressure gauges
  - 30 L/min nominal; 0.2–0.8 MPa inlet; 5–38 °C
  - — [nccb 867551 (search summary)](https://www.nccb.gov.au/product-search/product/867551)
- PWF-153BC (AQUAPRIMUS): 3 × 15" housings and **three** gauges. PWF-153BC-1 has two gauges and a 304 stainless "mount and frame". PWF-103BF-1 and PWF-103B are the 10" versions (PWF-10PP + 2 × PWF-10CTO) — [cpd.nccb 867546 (search summary)](https://cpd.nccb.gov.au/product-search/product/867546); [nccb 722126 (search summary)](https://www.nccb.gov.au/product-search/product/722126)
- PWF-20CTO is listed under brand "Aquarius Water Filters" — [nccb 722201 (search summary)](https://www.nccb.gov.au/product-search/product/722201)
- PureFlow WHF20/WHF10:
  - "304 Stainless Steel Mount, Standing Frame & Cover with 3 x 20" x 4.5 PP Filter Housings"
  - cartridges 1 × PWF-20PP + 2 × PWF-20CTO, or alternatively PP-20, CTO/Antiscale-20 and LRC/CTO-20
  - three gauges in one record, two in another
  - — [ABCB 1117281 (search summary)](https://ncc.abcb.gov.au/product-search/product/1117281); [ABCB 1117261 (search summary)](https://www.abcb.gov.au/product-search/product/1117261); [cpd.nccb 722216 (search summary)](https://cpd.nccb.gov.au/product-search/product/722216)
- Water Filter Direct VORTEX-F3-1045 and F3S-2045:
  - 304 stainless mount; 3 × 10" or 3 × 20" housings; PWF-10PP/2×PWF-10CTO or PWF-20PP/2×PWF-20CTO; **three** gauges
  - a registry page lists them as authorised to 03/10/2030
  - — [cpd.nccb 1016946 (search summary)](https://cpd.nccb.gov.au/product-search/product/1016946); [nccb 999916 (search summary)](https://www.nccb.gov.au/product-search/product/999916)
- A WebSearch for the exact string "PWF-203BC" returned only PWF-203B-1, and a search for "203BC" whole-house returned no seller using that code — [search summary](https://www.nccb.gov.au/product-search/product/867551)

**Australian brands selling the PWF-style cabinet (fetched)**
- AQUAOZZY:
  - "Monument / closed cabinet"; three stages: "5 Micron Pleated Sediment", "1 Micron Scale Carbon", "1 Micron Coconut Carbon"
  - "outdoor cabinet measuring 640 × 280 × 830 mm"; finishes Monument or Surfmist
  - "WaterMark AS 3497:2021"; "3-year warranty"
  - "Every price below includes GST… Installation is arranged separately": Adelaide pickup **$1,299**, Melbourne pickup **$1,399**, metro Australia delivery **$1,499**
  - "© 2026 Lightning Australia Pty Ltd trading as AQUAOZZY. ABN 73 676 591 512"
  - — [aquaozzy.com.au](https://www.aquaozzy.com.au/)
- Aquarius Water Filters (Perth): "Fully Installed From $2190 + GST"; "Professional installation of our advanced 3 phase 20′ whole house filtration system with a complementary set of 3 filters valued at over $240" — [aquariuswaterfilters.com.au](https://aquariuswaterfilters.com.au/)
- Water Filter Direct (waterfilterdirect.com.au) and PureFlow (pureflowfilters.com.au) are Shopify stores. Both failed the TLS handshake on robots.txt, so they were not fetched. pureflowfilter.com.au returned HTTP 429.

**Chinese public list prices for comparable systems (Made-in-China product pages, fetched)**

Incoterm is not stated in the parsed text.

| Seller (location; MIC business type) | Product / model | Price ladder | MOQ | Carton / weight | Notes | URL |
|---|---|---|---|---|---|---|
| Shanghai Chaomei Environmental Technology ("Chormy"; 1st Floor, Building 2, No. 1876 Chenqiao Road, Shanghai) | "Complete Whole House… 20'' X 4.5'' Triple Big Blue 3 Stages with Stainless Steel Cover", **Model CM-20BC** | US$210–350 | 1 piece | "Specification 59*23*73cm"; weight not shown | 5 µm PP + CTO + 1 µm PP; ports 1/2", 3/4", 1"; "NPT or Other"; 60–80 psi; CE, RoHS; "800sets/Year"; SGS audit QIP-ASR2541972; FAQ says "manufacture… over 20 years… plant is 3000m³"; "system cost is follow with the stainless steel materials cost" | [MIC](https://chormy.en.made-in-china.com/product/YALpRSOdCakB/China-Complete-Whole-House-Water-Purification-Filter-System-20-X-4-5-Triple-Big-Blue-3-Stages-with-Stainless-Steel-Cover.html) |
| Shanghai Chaomei (same) | Triple Big Blue 3 Stages "with Stainless Steel" | **US$240** | 20 pieces | — | "Export Year: 2015-09-01" | [MIC](https://chormy.en.made-in-china.com/product/ZAIYKtmDgfhd/China-20-X-4-5-Triple-Big-Blue-3-Stages-Whole-House-Water-Purification-Filter-System-20-X-4-5-Triple-Big-Blue-3-Stages-with-Stainless-Steel.html) |
| Shandong Longzhiyu Import and Export (Linyi, Shandong) | "3-Stage Stainless Steel Water Filter System with Pressure Gauges", model best-0307 | US$109.90 (1–99), 104.90 (100–199), 99.90 (200+) | 1 | 68×28×48 cm | "housing-AS, Support frame- steel"; "1-inch or 1.5-inch ports"; report MIC-ASI245237; its stage text repeats Chormy's word for word | [MIC](https://pylongyu.en.made-in-china.com/product/quBrdDVMEUhg/China-3-Stage-Stainless-Steel-Water-Filter-System-with-Pressure-Gauges-for-Whole-House.html) |
| Shandong Longzhiyu (same) | "Stainless Steel Cabinet 4 Stage Water Filter for Home and Commercial Use" | US$99.90–109.90 | 1 | — | Search card only | [MIC](https://pylongyu.en.made-in-china.com/product/WzYpTLEyIRcP/China-Stainless-Steel-Cabinet-4-Stage-Water-Filter-for-Home-and-Commercial-Use.html) |
| Ningbo Eastpure Environmental Technology ("Eastcooler"; Manufacturer/Factory & Trading) | "Stainless Steel Inlet and Outlet Port Whole House Water Filter 3 Stage", model 3S-10BB (10"/20" options) | US$56 (50–99), 54 (100–499), 52 (500–999) | 50 | 64×24×39 cm; 10 kg | "1"Inch/ 3/4"Inch Bsp/NPT"; 56 L/min; "NSF" (claimed) | [MIC](https://eastpure.en.made-in-china.com/product/BFCAQvsxEyau/China-Stainless-Steel-Inlet-and-Outlet-Port-Whole-House-Water-Filter-3-Stage.html) |
| Ningbo Eastpure (same) | Eastcooler free-standing 2- or 3-stage big-blue + UV (2sh-20BBS+UV, 3sh-10BBS+UV) | US$280–405; US$295–420 | 1 | — | Includes UV | [MIC outdoor search](https://www.made-in-china.com/products-search/hot-china-products/Outdoor_Whole_House_Water_Filter.html) |

**Bracket-type sets and components (MIC search cards)**
- Complete bracket-mounted sets:
  - Ningbo Dowa "4.5X20 Inch Big Blue Whole House Water Filter Housing System", US$32–42, MOQ 50 — [MIC](https://www.made-in-china.com/products-search/hot-china-products/Whole_House_Water_Filter_System.html)
  - Yancheng Olap "3 Stage 20 Inch Big Blue…", US$52–66, MOQ 50; Hebei UMEK "20 Inch 3 Stage Big Blue… with Wrench", US$50–55, MOQ 50; Ewater "3 Stage 20" Big Blue… with Iron Bracket Stand", US$53–56 — [MIC](https://www.made-in-china.com/products-search/hot-china-products/Big_Blue_Water_Filter_Housing.html)
  - Ningbo Eastpure "Whole House Water Filter with Stainless Steel Bracket and Port Lead Free", US$49–55, MOQ 50 — [MIC](https://www.made-in-china.com/products-search/hot-china-products/Stainless_Steel_Whole_House_Water_Filter.html)
- Single 20" big-blue housings: Yuyao Yadong US$15–16 (MOQ 10); Ningbo Yinyue "RY-20B-1" US$12–13 (MOQ 100); Shanghai Melko US$10–20 (MOQ 100) — [MIC](https://www.made-in-china.com/products-search/hot-china-products/Big_Blue_Water_Filter_Housing.html)
- Cartridges: Hangzhou Darlly pleated big-blue 20" US$1.20–5.00 (MOQ 25); SX YJK "4.5 Inch Big Blue Pcp Compressed Carbon Block" US$4.10 (MOQ 1,000) — [MIC](https://www.made-in-china.com/products-search/hot-china-products/Whole_House_Water_Filter.html)

**Australian retail benchmark (non-cabinet)**
- Puretec WH2-30-LF "Whole House Dual Water Filter System Lead Free": 2-stage; "Maximum Flow Rate: 30 Lpm"; "Connection: 1" BSP [25 mm]"; "aluminium wall mount bracket"; "Warranty: 10 years"; **A$826** — [Buildmat](https://www.buildmat.com.au/products/puretec-wh2-30-lt-whole-house-dual-water-filter-system)

### Inferences
- **Shared design.** One WaterMark licence (080071) covering five unrelated Australian brand names, all using PWF-coded housings and cartridges, is the signature of one OEM platform rebadged per customer.
  - Purezzo's offer of "PWF-203BC" with a "custom logo on the cover" fits that model exactly.
  - Purezzo is therefore probably the seller, or the licence holder, behind this platform. This is not proven (Q2).
- **Cartridge configuration.** By the family's naming (203 = 20" × 3 housings?; "BC" variants have three gauges), PWF-203BC is probably a **three-housing** unit, e.g. pleated PP + CTO + CTO, rather than two cartridges. Confirm the cartridge list in writing.
- **Price (inference from C-grade list prices).**
  - US$290 × 64 = US$18,560 sits inside Chormy's US$210–350 band, about 20% above Chormy's US$240 at MOQ 20, and well above Longyu's "cabinet" at about US$100–110. Longyu's is likely a lighter steel or less finished frame, and it is from a trading company.
  - A negotiating target of about US$240–260 looks defensible.
  - The price is justified only if Purezzo delivers what Chormy and Longyu do not claim:
    - a current **Lead-Free WaterMark** listing covering PWF-203BC itself, with your brand name added
    - genuine 304 stainless
    - lead-free brass ports
    - NSF/ANSI 42 evidence for chlorine claims
- **Cabinet premium.** Bracket sets cost about US$32–66 (MOQ 50) and cabinet or cover systems about US$210–350, so the stainless cabinet, frame and cover plus a third gauge adds about **US$150–250 per unit** at list. Chormy itself says price tracks stainless material cost.
- **Margin room.** AQUAOZZY's A$1,299–1,499 supply-only (incl. GST) for the same concept indicates retail headroom over a ~US$290 FOB unit. No exchange-rate, freight or duty model was built here.
- **Freight volume (arithmetic, not sourced).**
  - At AQUAOZZY's 640×280×830 mm cabinet size, 64 units are about 9.5 m³ before packaging.
  - At Chormy's 59×23×73 cm carton, about 6.3 m³.
  - Either way, expect a part-container (LCL) load of roughly 6–12 m³.

### Gaps
- No public listing of PWF-203BC with Purezzo's own price, carton or weight; Alibaba was blocked.
- The WaterMark record for the exact model "PWF-203BC" was not found. Only PWF-203B-1 (two gauges) and PWF-153BC (three gauges) appeared.
- Carton weights for the cabinet comparables were not published, except Eastpure's 10 kg, which is a bracket unit.
- Water Filter Direct and PureFlow retail prices were not fetched (TLS failure).

## Q4. The Chinese production base for whole-house housings, big-blue housings, pleated/CTO cartridges and stainless cabinets, and which factories ship to Western brands

### Takeaway
US customs records (A-grade for the factory→brand link) show the main US water brands buying from a small set of plants in a few clusters:
- **Zhejiang:** Jiaxing (Alpha → iSpring); Ningbo (Lintall → Culligan; Zuanbang → APEC; Hidrotek → Canature/BWS); Taizhou (Xincheng → Pentair); Hangzhou (Standard Mayo → iSpring); Yuyao (Yadong).
- **Fujian:** Xiamen (Filtertech → Culligan/EcoWater/Canature/iSpring; Runner → Culligan).
- **Guangdong:** Zhongshan (Filterpro → Paragon/Aquasana/Culligan/Watts).
- **Jiangsu:** Suzhou (Pentair's own plant); Nanjing (A.O. Smith Nanjing → iSpring; Kemflo Nanjing → Express Water).
- **Taiwan:** Organic Filter, Grand Amos, Jam Hom, Fluxtek and Kemflo supply Express Water, APEC, iSpring and Culligan.
- **Stainless cabinets** appear only as marketplace listings (Shanghai, Shandong), with no customs trail.
- **Purezzo appears in none of these brand supply chains.**

### Cited Findings

**ImportGenius importer pages: top suppliers by containers (fetched 2026-10-10)**
- **iSpring Water Systems LLC** (1,510 shipments, to 2026-10-05):
  - ALPHA (JIAXING) ENVIRONMENTAL TECHNOL[OGY] 655 containers (7,793,548 kg)
  - FLUXTEK INTERNATIONAL (Taiwan) 343
  - AO SMITH NANJING WATER TREATMENT P[RODUCTS] 86 (last 2018)
  - HANGZHOU STANDARD MAYO INDUSTRIAL 57
  - TIANJIN TIANCHUANG BEST PURE ENVIRO 51
  - recent rows also show XIAMEN FILTERTECH ("FILTER PARTS HS 84219910") and NINGBO AQUAWORLD IMPORT & EXPORT ("WATER DISPENSER")
  - — [ImportGenius iSpring](https://www.importgenius.com/importers/ispring-water-systems-llc)
- **APEC Water Systems** (25 shipments, to 2026-02-06): NINGBO ZUANBANG TECHNOLOGY 12 containers (last 2024-11-11); ORGANIC FILTER (TW) 7; CHUEN CHARNG (TW, "PRESSURE GAUGE"); CULLIGAN TRADING (SHANGHAI); ZHONGSHAN FILTERPRO ("PUREBLUEH2O… 3-STAGE RO") — [ImportGenius APEC](https://www.importgenius.com/importers/apec-water-systems)
- **Express Water** (722 shipments, to 2024-03-17): ORGANIC FILTER (TW) 339; GRAND AMOS PRODUCTS (TW) 319; JAM HOM (TW) 93; PEIQUAN (TW) 28; BUDER ELECTRIC (TW) 21; plus KEMFLO (NANJING) ENVIRONMENTAL TECH ("REVERSE OSMOSIS MACHINE EXPRESS 50G") and XIAMEN FILTERTECH — [ImportGenius Express Water](https://www.importgenius.com/importers/express-water)
- **Aquasana Inc** (324 shipments, to 2019): ZHONGSHAN FILTERPRO ENVIRONMENTAL 145; AN AXON (TW) 35; NINGBO NINGSHING INTERNATIONAL 30; UNIQUE TOWN (TW) 16; ZHEJIANG LONGJING WATER INDUSTRY (faucets) — [ImportGenius Aquasana](https://www.importgenius.com/importers/aquasana-inc)
- **Pentair Residential Filtration LLC** (5,472 shipments, to 2026-10-05): PENTAIR WATER SUZHOU 2,755 containers (20,304,088 kg); PENTAIR WATER INDIA 246; NORM PACIFIC AUTOMATION (TW) 240; TRIO ENGINEERING (HK) 213; TAIZHOU XINCHENG FILTRATION EQUIPME[NT] ("STRING WOUND FILTER CARTRIDGE") — [ImportGenius Pentair RF](https://www.importgenius.com/importers/pentair-residential-filtration-llc)
- **Pentair Filtration Solutions LLC** (Everpure; 3,783 shipments, to 2026-10-08): PENTAIR WATER INDIA 924; PENTAIR WATER SUZHOU 396; ORIENTRONIC 165; FILTTECK (TW) 146; ACLARIS WATER INNOVATIONS GmbH ("CLARIS FILTER CARTRIDGE S EVERPURE") — [ImportGenius Pentair FS](https://www.importgenius.com/importers/pentair-filtration-solutions-llc)
- **Culligan International** (2,321 shipments, page to 2019): NINGBO LINTALL PLASTIC PRECISION 563 containers (8,058,967 kg); KEMFLO INTERNATIONAL (TW) 373; XIAMEN RUNNER IND 294; TANKPAC (TW) 259; plus XIAMEN FILTERTECH rows — [ImportGenius Culligan](https://www.importgenius.com/importers/culligan-international-company)
- **3M:** "3m-company" and "3m-purification-inc" had no page. CUNO Inc. (255 shipments, to 2020) imported from L Pickering (UK), Membrana (DE), Kuraray (JP), Shing Yang Shing (TW) and Kemflo (TW) — [ImportGenius CUNO](https://www.importgenius.com/importers/cuno-inc)

**ImportGenius supplier pages for Chinese makers**
- **Alpha (Jiaxing) Environmental Technology:** 650 shipments, effectively all to iSpring (655 containers); place of receipt Ningbo; shipper address "ROOM 220, BUSINESS BUILDING, NO.3288 WEST ZHONGSHAN ROAD, GAOZHAO STREET, XIUZHOU NEW DISTRICT, JIAXING" — [ImportGenius](https://www.importgenius.com/suppliers/alpha-jiaxing-environmental-technol)
- **Xiamen Filtertech Industrial Corp.:** 965 shipments to 2026-10-08. Culligan 876 containers (7,374,647 kg); Canature WaterGroup USA 145; EcoWater Systems 40; iSpring 30; Paragon Water Systems 27 — [ImportGenius](https://www.importgenius.com/suppliers/xiamen-filtertech-industrial-corpor)
- **Ningbo Lintall Plastic Precision:** 189 shipments to 2022-03-24, almost all to Culligan (567 containers): control valves, resin tanks, "KIT, MTG BRACKET FRONT, ELECTRICAL ENCLOSURE" — [ImportGenius](https://www.importgenius.com/suppliers/ningbo-lintall-plastic-precision)
- **Zhongshan Filterpro Environmental:** 1,185 shipments to 2026-09-23. Paragon Water Systems 537 containers; Aquasana 145; Protect Plus 101; Culligan 75; Watts Water Technologies; Valterra; Oasis — [ImportGenius](https://www.importgenius.com/suppliers/zhongshan-filterpro-environmental)
- **Ningbo Hidrotek Co. Ltd:** 1,191 shipments to 2026-10-06. Canature WaterGroup USA 113 + Canada 60; BWS Manufacturing 119; RODA LLP 108; Aquaboon 46; ActivePure; Consorcio Valsi (MX); own Amazon FBA loads — [ImportGenius](https://www.importgenius.com/suppliers/ningbo-hidrotek-co-ltd)
- **Ningbo Zuanbang Technology:** 144 shipments. Emonyx, RODA, AR Ventures, UV Superstore, APEC (12), Canature ("WATER FILTER HOUSING… (BRACKET)"), Hankscraft Runxin — [ImportGenius](https://www.importgenius.com/suppliers/ningbo-zuanbang-technology-co-ltd)
- **Yuyao Yadong Plastic:** 102 shipments, all to small importers (EZWaterPure, Titan American, Clear Choice Technologies, Huanghelou Trading) — [ImportGenius](https://www.importgenius.com/suppliers/yuyao-yadong-plastic-co-ltd)
- **Taizhou Xincheng Filtration Equipment:** 14 shipments, mainly Pentair Residential Filtration ("STRING WOUND FILTER CARTRIDGE", 9,333 kg / 44 PKG each) — [ImportGenius](https://www.importgenius.com/suppliers/taizhou-xincheng-filtration-equipme)
- **No ImportGenius page** for Shanghai Chaomei or Ningbo Eastpure under the full-name slugs (301 → /tradebase).

**Marketplace locations of whole-house, cabinet and cartridge sellers (C-grade)**
- Stainless-cover or cabinet whole-house systems: Shanghai (Chaomei/Chormy) and Linyi, Shandong (Longzhiyu, an "Import and Export" company).
- Bracket sets and housings: Ningbo/Yuyao (Eastpure, Dowa, Keman, Yinyue, Hidrotek, Yadong), Jiangsu (Olap, Ewater, Tsung), Hebei (UMEK, Chengda, Zaoqiang Yaxin), Shandong, Guangdong, Shanghai (Melko, EWP China).
- Cartridges: Hangzhou (Darlly), Shanxi (SX YJK), Xinxiang, Henan (Huahang), Taizhou (Share Filters).
- — [MIC stainless whole-house](https://www.made-in-china.com/products-search/hot-china-products/Stainless_Steel_Whole_House_Water_Filter.html); [MIC big-blue housings](https://www.made-in-china.com/products-search/hot-china-products/Big_Blue_Water_Filter_Housing.html); [MIC whole-house](https://www.made-in-china.com/products-search/hot-china-products/Whole_House_Water_Filter.html)
- **Self-reported Ningbo makers:** Zhejiang Aibote Environmental Technologies (Ningbo, founded 2005, "300万台" annual capacity, OEM/ODM for known brands) and Jingquanda (Ningbo Qianwan/庵东镇, "100多项国家专利", 5 million units/yr) — [IFA Berlin exhibitor (search summary)](https://www.ifa-berlin.com/exhibitors/aibote); [Global Sources Jingquanda (search summary)](https://jingquanda.manufacturer.globalsources.com/company-profile_6003002379277.htm)

### Inferences
- **Clusters.** Customs data supports:
  - **Ningbo–Yuyao–Jiaxing–Hangzhou–Taizhou (Zhejiang)** as the densest base for big-blue housings, valves and filter systems
  - **Xiamen (Fujian)** for filter and cartridge components to Culligan and other brands
  - **Zhongshan/Shenzhen (Guangdong)** for RO and under-sink systems
  - **Suzhou/Nanjing (Jiangsu)** for brand-owned and large OEM plants
  - **Taiwan** for premium RO components, cartridges and gauges (APEC's gauges come from Taiwanese Chuen Charng)
- **Shanghai is not a housing or cartridge cluster** in this data. Shanghai entities act as system integrators or traders (Culligan Trading Shanghai, Chormy, Melko). This fits Purezzo being a Songjiang system seller.
- **Stainless cabinets** are sheet-metal work, bending and welding 304 sheet, probably subcontracted to general fabricators near the integrator. No cabinet-specific factory with a brand-grade customs trail was found.
- **Brand-grade OEMs.** Alpha (Jiaxing) is a single-customer iSpring OEM, but its B/L address "Room 220, Business Building" triggers the toolkit's office-address flag; its plant location is unverified. Filtertech, Hidrotek, Filterpro and Lintall have multi-brand, multi-year direct-shipper records (A-grade customs). Ask these as alternative quote benchmarks.

### Gaps
- **No public customs data covers Australian imports**, so the Chinese suppliers of Puretec, Aquasafe, AQUAOZZY, Aquarius and the other Australian brands could not be identified.
- Puretec's own production location was not found. A directory search summary says only "founded 1989, HQ Adelaide" — [craft.co (search summary)](https://craft.co/puretec)
- Cluster-level statistics (output shares) and government or association lists were not available. Chinese government hosts were unreachable (toolkit), and the search found no citable statistics.
- 3M Aqua-Pure's current Chinese suppliers were not identified: no importer page existed under the tried names.

## Q5. Who is "Water Analytics", what does it sell and for how much, and is Purezzo already supplying Australia under another brand?

### Takeaway
"Water Analytics Australia" is a registered business name (since 28 Mar 2022) of **LIQI TRADING PTY LTD** (ABN 34 622 587 437, ACN 622 587 437, WA 6155).
- **Business:** a Canning Vale, WA-based retailer and installer with NSW, VIC and QLD sites.
- **Products:** sells a "Full Home Water Refining System (FHWRS)", a 3-stage POE system on 20"×4.5" cartridges, under its own WaterMark-listed model FHWR-3S1-20, and runs a B2B reseller programme with "wholesale pricing".
- **Purezzo link:** **no link between Water Analytics and Purezzo or the PWF platform was found**. Its model code and brand do not appear in the 080071 summaries, and its product images could not be fetched for comparison.
- **Purezzo in Australia otherwise:** the PWF platform itself is clearly already in the Australian market under at least five other brands (Q3). Whether Purezzo is their source is likely but unconfirmed.

### Cited Findings

**Registration**
- ABN Lookup:
  - "Entity name: LIQI TRADING PTY LTD"; "ABN status: Active from 31 Oct 2017"; "Australian Private Company"
  - "GST: Registered from 01 Apr 2022"; "Main business location: WA 6155"
  - business name "Water Analytics Australia" from "28 Mar 2022"; ACN 622 587 437
  - — [ABN Lookup](https://abr.business.gov.au/ABN/View?abn=34622587437)

**Website**
- Positioning and pricing: "Full Home Water Refining System (FHWRS)"; "Starting at Just $5.50/Day, Interest-Free. Includes Lifetime Free Sediment Filter."; "WAA Australian Made Filter, coming soon"; "Installation can be carried out by a WAA-approved, independently licensed plumber" — [wateranalytics.com.au/products](https://www.wateranalytics.com.au/products)
- Locations: "WA: 1/132 Bannister Road Canning Vale WA 6155; NSW: 1A Bonz[…], Seven Hills, NSW 2147; VIC: 12/86 Pipe Rd, North Laverton VIC 3026; QLD: 13 Murdoch Circuit, Acacia Ridge QLD 4110; SA & NT & TAS (3rd Party Warehouse)" — [wateranalytics.com.au/tradeandpartner](https://www.wateranalytics.com.au/tradeandpartner)
- Trade programme and claims: "B2B partnership opportunity… Enjoy wholesale pricing, installation support"; "Securing 3rd place in the AFR Fast 100" (self-claim) — [Trade & Partner](https://www.wateranalytics.com.au/tradeandpartner)
- Cartridge prices for "FH Filter [20 x 4.5 inches - POE]": 1st stage "$120/Unit"; the other two pages are titled "3rd Stage… $200/Unit" and "2nd Stage… $240/Unit" (titles and URLs swapped) — [1st stage](https://www.wateranalytics.com.au/product-page/waa-sediment-filter-20-x-4-5-inches-poe); [2nd-stage URL](https://www.wateranalytics.com.au/product-page/waa-2nd-stage-filter-20-x-4-5-inches-poe); [3rd-stage URL](https://www.wateranalytics.com.au/product-page/waa-3rd-stage-filter-20-x-4-5-inches-poe)
- The store sitemap lists POE 3-stage and POE 4-stage+UV subscriptions, bundles, an "opening handle spanner wrench for POE system", benchtop hydrogen/sparkling units and 6-stage RO — [store sitemap](https://www.wateranalytics.com.au/store-products-sitemap.xml)
- The only manual posted is "Benchtop All-in-One System User Manual V0202604-EESS.pdf" — [manuals](https://www.wateranalytics.com.au/manuals)

**Certifications and other listings**
- WaterMark (search summary): brand Water Analytics Australia, models FHWR-3S1-20 and USRO-3S1-2W "Whole house system (with certified DCV and PLV)"; no licence number or expiry shown in the summaries — [cpd.nccb 476446 (search summary)](https://cpd.nccb.gov.au/product-search/product/476446); [nccb 476451 (search summary)](https://www.nccb.gov.au/product-search/product/476451)
- Australian Made licensee page: "trusted provider of comprehensive water refining solutions for municipal and industrial customers"; products "Flowell Sintered Filters", "WAA Multiguard Series Water Filter", "RevoPure Quick-Swap Filter" — [Australian Made](https://australianmade.com.au/licensees/water-analytics-australia)
- Caravan & Camping WA exhibitor (Stand 9 Outdoor): "Australian-owned specialist in water treatment, filtration, and monitoring solutions"; Canning Vale address; the contacts listed are a mobile number and a personal ISP e-mail — [caravanwa.com.au](https://caravanwa.com.au/blog/exhibitors/water-analytics/)

**What could not be compared**
- Water Analytics' product images are on static.wixstatic.com, whose robots.txt returned HTTP 403, so no photo comparison with PWF-203BC was possible.

### Inferences
- **Price comparison.** The buyer's figure of about A$1,100 wholesale for a comparable unit (not verified here) sits below AQUAOZZY's A$1,299–1,499 supply-only retail for a PWF-style cabinet and well below Aquarius' A$2,190 + GST installed price. That is consistent with Water Analytics' stated reseller channel.
- **Whether Water Analytics uses Purezzo or PWF hardware.** There is no evidence either way:
  - its WaterMark model code (FHWR-3S1-20) does not follow PWF naming
  - its brand is not among those the search summaries list under 080071
  - its cartridge pricing (A$120–240 each) is retail, not an OEM tell
- **Is Purezzo already in Australia under other brands?** **Probably yes, via the PWF platform.**
  - AQUAOZZY (Lightning Australia Pty Ltd, Adelaide and Melbourne pickup), Aquarius Water Filters (Perth), PureFlow, Water Filter Direct (Vortex) and AquaPrimus all sell or certify PWF-coded systems on one licence.
  - If Purezzo holds that licence, the buyer would become roughly the sixth Australian label on the same unit. That affects differentiation and exclusivity, and is useful for negotiation: ask Purezzo which brands it supplies, and for regional exclusivity if wanted.

### Gaps
- The holder of WaterMark licence 080071, and Water Analytics' own licence number and certified manufacturer, were not visible (ABCB robots).
- Water Analytics' system price, hardware photos and whether its cabinet resembles PWF-203BC were not obtained.
- The AFR Fast 100 claim is unverified. A search for "AFR Fast 100 2025" with "Water Analytics Australia" returned no page linking the company to the list.
- No ProductReview or Trustpilot reviews of Water Analytics were found by search.

## Q6. Supplier-risk checks before paying US$18,560, and a pre-shipment inspection scope

### Takeaway
Before any deposit, the buyer should establish four things:
1. the **Chinese legal entity**: licence and USCC, and whether 上海壹杯水环保科技有限公司 equals "Shanghai Purezzo…"
2. that the entity, or its named factory, **holds WaterMark licence 080071**, and that **PWF-203BC itself** is listed with the **Lead Free WaterMark**, which has been required for drinking-water copper-alloy products since 1 May 2026
3. who actually **builds** the unit, via a live video walk of the cabinet line and an export declaration naming the 生产销售单位
4. that **payment goes only to the licence entity's corporate account**, or through Alibaba Trade Assurance since Purezzo sells on Alibaba

A one-man-day pre-shipment inspection (about US$200–350) of a 13-unit sample covering a hydrostatic leak test, threads, gauges, cartridge identity, 304 verification, finish, logo and packaging is proportionate for a 64-unit order.

### Cited Findings
- **Standards.**
  - "AS/NZS 3497:1998… has been superseded by… AS 3497:2021, Drinking water treatment systems — Design and performance requirement".
  - The revision "removed reference to AS/NZS 4348… with all performance claims to be certified to NSF/ANSI standards".
  - It references "WaterMark Technical Specification WMTS-103:2016".
  - The WaterMark scheme is "a mandatory requirement in Australia for certain plumbing and drainage products".
  - — [Standards Australia (6 Sep 2021)](https://www.standards.org.au/news/simplifying-performance-standards-for-australian-drinking-water-treatment-systems); [Plumbing Connection (13 Oct 2021)](https://plumbingconnection.com.au/new-standard-for-drinking-water-treatment-systems)
- **Lead-free requirement.**
  - From **1 May 2026**, copper-alloy plumbing products in contact with drinking water must meet a 0.25% (weighted-average) lead limit under PCA clause A5G4 and carry the "Lead Free WaterMark".
  - "Only products listed on the WaterMark Product Database will be compliant".
  - — [ABCB/NCCB news 2023 (search summary)](https://www.nccb.gov.au/news/2023/update-advice-new-lead-requirements); [Outdoor Design (search summary)](https://outdoordesign.com.au/news-info/your-guide-to-the-2026-lead-free-plumbing-requirement/11060)
- **What a WaterMark mark covers.**
  - Zip Water's plumber advice: the WaterMark Scheme "is the mandatory certification scheme for plumbing and drainage products… managed by the Australian Building Codes Board".
  - It advises checking that filter claims are certified (its own filters cite NSF 42 and NSF 53) and confirming "that your filter's WaterMark certification number is legitimate".
  - Its AS/NZS 4348 advice predates AS 3497:2021.
  - — [Zip Water](https://www.zipwater.com/news/water-mark-certification-for-water-filters)
- **Thread standards differ between offers.** Marketplace offers mix NPT and BSP: Chormy "Thread: NPT or Other"; Eastpure "1"Inch/3/4"Inch Bsp/NPT". Puretec specifies "1" BSP [25 mm]" — [MIC Chormy](https://chormy.en.made-in-china.com/product/YALpRSOdCakB/China-Complete-Whole-House-Water-Purification-Filter-System-20-X-4-5-Triple-Big-Blue-3-Stages-with-Stainless-Steel-Cover.html); [MIC Eastpure](https://eastpure.en.made-in-china.com/product/BFCAQvsxEyau/China-Stainless-Steel-Inlet-and-Outlet-Port-Whole-House-Water-Filter-3-Stage.html); [Buildmat Puretec](https://www.buildmat.com.au/products/puretec-wh2-30-lt-whole-house-dual-water-filter-system)
- **Sellers' own test claims.** Chormy and Longyu (identical text): "100% Factory tested"; "Each components have been passed 10,000 times strict cycle testing under 125 PSI water pressure or burst testing"; "Operating pressure: 60 ~ 80 PSI" — [MIC Longyu](https://pylongyu.en.made-in-china.com/product/quBrdDVMEUhg/China-3-Stage-Stainless-Steel-Water-Filter-System-with-Pressure-Gauges-for-Whole-House.html)
- **Lab-test references** from a filter maker's guide, which conflict with each other:
  - NSF-style burst test "minimum acceptable burst pressure is 500 psi"; cyclic test up to 110,000 cycles at 150 psi
  - elsewhere 400 psi (in-home) / 500 psi and 100,000 cycles at 150 psi
  - — [Easywell Water guide (search summary)](https://easywellwater.com/en/knowledge/faq/12/293)
- **Inspection and audit costs.** Factory audits about US$210–290 per man-day and inspections about US$200–350 per man-day (2025) — [Supplyia (cited in toolkit 2026-10-09)](https://www.supplyia.com/inspection-company-in-china/); US$199–299 per working day — [Cogoport (cited in toolkit)](https://www.cogoport.com/blogs/quality-control-and-inspections-in-china-a-complete-guide)
- **Licence checks.** Use the 18-digit USCC; status should be 存续/在营. Licence name, bank-account name and contract counterparty must match character for character — [NewBuyingAgent (cited in toolkit)](https://www.newbuyingagent.com/resources/how-to-read-a-chinese-business-license-and-verify-a-supplier)

### Inferences

These are recommendations. Items marked (bk) are background knowledge not verified in this session.

**A. Ask Purezzo for these before paying anything**
1. **Business licence (营业执照), colour scan**, showing the USCC, Chinese name, registered address, legal representative and 经营范围.
   - Check it on GSXT (real-name login needed) or Qichacha in a normal browser.
   - Confirm the Chinese name, e.g. 上海壹杯水环保科技有限公司, and that "Shanghai Purezzo Environmental Technology Co., Ltd." is its registered English or export name (it appears on customs registration, bk).
   - A scope containing **production** wording ("…制造/生产/加工") plus a Songjiang address and credible 参保人数 supports assembly. Trade-only wording ("销售/批发/货物进出口/技术服务") means a trader.
2. **WaterMark evidence.**
   - the certificate PDF for licence **080071** (or whichever applies): licence holder legal name, certifying body (CAB), manufacturing site address, listed models (is **PWF-203BC** itself listed, or only PWF-203B-1 and PWF-153BC?), brand names, expiry 07/08/2029, and **Lead Free WaterMark** status for brass ports and gauges
   - written confirmation that **your brand** will be added to the licence before shipment, with cost and timeline
   - verify everything on the WaterMark Product Database yourself
3. **Test reports.**
   - the AS 3497:2021 type-test report for the exact model
   - NSF/ANSI 42 certification (or a test report naming the lab) for any chlorine, taste or odour claim, because under AS 3497:2021 performance claims must be NSF/ANSI-certified
   - lead-free evidence for brass parts (bk: NSF/ANSI 372 or the WaterMark lead-free test)
   - material-contact evidence for the housings (bk: AS/NZS 4020 or NSF/ANSI 61)
   - ask for report numbers and check them on the issuing lab's portal
4. **Who makes it.**
   - a redacted export declaration (出口报关单) for this model showing 境内发货人 and **生产销售单位** (bk field names)
   - the customs registration receipt (海关备案; the "export licence" now generally means this, bk)
   - a redacted VAT invoice issued in the entity's own name for this product, checked on inv-veri.chinatax.gov.cn
   - Ask directly why its only US shipment was received in Nanjing.
5. **References.** Names of the Australian brands it already supplies on this platform. AQUAOZZY (Lightning Australia Pty Ltd) and Aquarius Water Filters are public sellers that can be cross-checked. Also ask what exclusivity, if any, it offers.
6. **A live video walk (not recorded).** Ask to see:
   - the gate sign and the licence on the wall
   - the 304 sheet-metal cutting, bending, welding and polishing for the cabinet (or the subcontractor's shop if outsourced)
   - housing assembly, the pressure-test bench and gauge fitting
   - PWF-labelled cartridges in stock
   - cartons printed for current Australian customers
   - an on-the-spot request, e.g. "pressure-test one assembled unit now"
7. **Commercial terms.**
   - Pro-forma invoice and contract from the licence entity, with the **bank account in the same name**.
   - Prefer **Alibaba Trade Assurance**: Purezzo is an Alibaba seller, login "purezzo" (bk on coverage terms). Alternatively use 30/70 against inspection.
   - Specify in writing: cartridge list (micron ratings; 20"×4.5"; pleated PP + CTO [+ CTO]); **1" BSP threads (not NPT)**; 304 grade and sheet thickness; gauge range; logo method and position; carton spec; warranty; spare cartridges.

**B. Pre-shipment inspection scope for 64 units**

Book with a third party at the factory address (about US$200–350 per man-day).
- **Sampling:**
  - ISO 2859-1 / ANSI Z1.4, General Inspection Level II; a lot of 51–90 → code letter E → **13 units** (bk; confirm on the table)
  - critical defects (leaks, wrong threads, wrong cartridge) at zero tolerance
- **Hydrostatic leak test** on every sampled unit, assembled with cartridges and housings tightened:
  - hold above the 0.8 MPa rated maximum inlet, e.g. ~1.2 MPa (1.5×), for several minutes
  - check for no weeps at housing O-rings, ports or gauge threads
  - burst and cycle tests (≥400–500 psi; 100,000+ cycles at 150 psi) are lab type-tests: ask for the report rather than doing them at PSI
- **Ports and threads:** 1" BSP go/no-go gauge on inlet and outlet; check brass is the lead-free grade per the certificate (bk: XRF can screen lead content); bypass valve operation if fitted.
- **Gauges:** all three present and correctly positioned (inlet / inter-stage / outlet); compare against a reference gauge at 0, 0.2, 0.4 and 0.6 MPa; within the gauge's accuracy class (bk); faces readable; no fogging.
- **Cartridges:** count and order; labels (PWF-20PP pleated, PWF-20CTO); 20"×4.5" dimensions; CTO block weight against the golden sample (a proxy for carbon mass); no cracked end caps; sealed in bags.
- **Cabinet:** 304 verified by handheld XRF or a nickel spot test against 201 stainless (bk); weld quality; brushed finish without scratches, rust spots or sharp edges; cover fit, hinges and latch; wall or stand mounting holes; drain and service clearance.
- **Logo and marking:** artwork, position tolerance, durability (tape/rub test); presence of the WaterMark / Lead Free WaterMark marking and licence number as required by the CAB (bk; confirm marking rules with the CAB); model label matches the certificate.
- **Packaging:** carton dimensions and weight recorded; corner protection; drop test of one carton (bk: ISTA-style); spare cartridges and a wrench included; installation manual in English with the WaterMark and AS 3497 references.
- **Documents at PSI:** packing list and commercial invoice in the licence entity's name, with HS code 8421.21 as used by comparable sellers (HS 8421211000 on Chormy, Longyu, Eastpure).

### Gaps
- The exact WaterMark marking rules, and whether a buyer's brand can be added to another firm's licence (and at what cost), were not verified. ABCB pages are robots-disallowed; ask the CAB named on the certificate.
- The NSF/ANSI 42 structural-integrity test values were not read from the standard itself. The burst and cycle figures above come from a manufacturer's guide and conflict.
- Alibaba Trade Assurance terms, ISO 2859-1 table values, export-declaration field names and the VAT-rebate tell (免抵退 vs 免退) are background knowledge, not verified this session.
- No landed-cost model (freight, customs duty and any FTA preference, GST, FX) was built here, and duty rates were not checked. That should come from the existing landed-cost calculator.
