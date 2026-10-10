# Who actually makes dual-motor sit-stand desks in China (columns, control boxes, frames, desktops), how Prorials / Lumi Legend / Jiecang's MIC storefront classify, and whether a real factory will take a 100–274-desk first order

*Research date: 10 Oct 2026. Prices are list prices seen on 10 Oct 2026 unless dated otherwise. FX where used: US$1 = A$1.4376 (shared assumption from the earlier round).*

**Evidence grades (from the brief).**
- **A:** any one of: official registry production scope plus industrial address plus credible insured headcount; customs records as the direct shipper to Western brands; a certificate naming the company as manufacturing site; patent holder; stock-exchange filings.
- **B:** own site with ICP number, licence image and production footage; association membership; trade-show booth as manufacturer; named on a Western brand's label.
- **C:** platform badges or self-description only.
- **Rule:** a company is called a "factory" only when it has two independent A/B items.
- **Additional grade (my own):** a mention of a company in *another* listed company's prospectus is graded B ("regulated-filing mention").

**How the data was collected, and what was blocked**
- **Worked:**
  - **ImportGenius public importer/supplier pages** (robots.txt "Allow: /"; no login). They show US bill-of-lading samples, top trading partners and container counts. Fetched 10 Oct 2026; pages "Updated: 2026-10-08". This was added at the coordinator's suggestion after ImportYeti returned Cloudflare 403.
  - Listed-company filings, downloaded as PDFs from the eastmoney mirror (pdf.dfcfw.com) and found via its public announcement-list API.
  - Google Patents, through its xhr JSON endpoint, fetched with WebFetch.
  - Company websites (curl).
  - Made-in-China (MIC) storefront and product pages.
  - Shopify product JSON for Australian brands.
  - The NeoCon exhibitor page.
- **Blocked (none bypassed):**
  - ImportYeti: Cloudflare "Just a moment" challenge. Customs facts marked "ImportYeti" come from **search-result summaries of ImportYeti pages** and are labelled that way. Customs facts marked "ImportGenius" were read directly from the page.
  - Justia: Cloudflare challenge.
  - Google Patents via plain curl: "automated queries" page.
  - Global Sources: HTTP 429 (twice).
  - Chinese registry aggregators: Shuidi and Qixin geo-block non-mainland IPs. GSXT was not attempted because it uses captchas.
  - EESS: the legacy public search (equipment.erac.gov.au) was refused by the egress proxy. The new EESS Platform (eessplatform.eess.gov.au) returned only a JavaScript login shell.
  - WebSearch: the shared quota ran out partway through. All later work used direct URLs only.

---

## Q1. Map of real production: column/actuator/control-box makers vs frame assemblers vs desktop makers

### Takeaway
The motors, lifting columns and control boxes in Chinese dual-motor desks come from a small group of A-grade actuator makers:
- **Jiecang (捷昌, Xinchang/Shaoxing):** about 4.77M linear-drive sets in 2025.
- **Kaidi (凯迪, Changzhou):** about 7.98M sets in 2025, mostly recliner drives.
- **Loctek (乐歌, Ningbo):** at least 2.5M sets/yr of lifting-system capacity, used mainly for its own FlexiSpot brand.
- **Others:** TiMOTION (Dongguan), LINAK (Shenzhen), DewertOkin (Jiaxing) and a second tier such as Xinyi Control (Shangyu).

These makers sell "drive systems" (columns + controller + handset) on an ODM basis to brands and to desk/frame assemblers. The brands then buy desktops separately.

Customs records and IPO prospectuses link specific Western brands to specific makers:
- UPLIFT (The Human Solution), Fully/Jarvis, HAT Contract and AMQ buy from Jiecang.
- ESI/Fellowes and Teknion buy from Kaidi.
- FlexiSpot is Loctek's own brand, and Loctek's 2026 report names IKEA and Walmart among its overseas ODM customers.
- Vari buys from Taiwanese makers, plus a Vietnamese assembler.
- Autonomous uses Aoke frames with TiMOTION electronics.

Prorials and Lumi are metal-fabrication and assembly factories, not column/motor makers. Desktops are a separate board-maker supply chain, mainly in Shandong and Jiangsu, with bamboo in Zhejiang and Fujian; Loctek is the exception, with in-house board processing.

**ImportGenius bills of lading (fetched 10 Oct 2026) confirm the brand-to-maker links directly:**
- UPLIFT's "adjustable table parts" come from **Jiecang's Malaysian plant**, JSTAR MOTION SDN BHD (616 containers to "The Human Solution - Uplift Desk", last 2025-01-12).
- FlexiSpot US: all of its top-5 suppliers (out of 10 trading partners) are **Loctek entities** in Vietnam, Ningbo and Guangxi, and the sample bills also show "GUANGXI BEIBU GULF LOCTEK".
- Teknion receives "STEEL FRAME / CONTROL BOX / HANDSET" from **Kaidi** (last 2026-09-28).
- VIVO's largest supplier group is **LUMI** (Lumi Legend Corporation / HK / Group; more than 2,700 containers in total).
- Autonomous's frames came from **Ningbo Aoke Office Equipment**; recent frame lots came through a Ningbo trading office and an Anji chair maker.
- Vari's frames and legs come from **Taiwanese makers** (Der Yih; formerly Invention Global). Recent complete-desk lots come from Vietnamese assembler Tan Phong An.
- Jiecang's export arm ships kits to J-Star Motion (its own US subsidiary), HAT/Human Active Technology, AMQ, Fully (to 2018), Bush, Secretlab and 247 Workspace.

### Cited Findings
**Tier 1 – actuator / lifting-column / control-box makers (motor-and-column production evidenced)**
- **Jiecang 浙江捷昌线性驱动科技股份有限公司 (603583.SH)** — [Jiecang 2025 annual report](https://pdf.dfcfw.com/pdf/H2_AN202604271821616543_1.pdf)
  - 2025 output was 4,768,844 sets of "线性驱动产品"; sales 4,777,561 sets.
  - Staff 5,043, of whom 2,739 are production staff.
  - Production bases: "宁波生产基地、新昌生产基地、马来西亚生产基地、美国生产基地、欧洲生产基地".
  - Sales are "主要通过直销方式进行"; overseas business is "主要为 ODM 模式".
- **Jiecang patents:** 257 Google Patents results for 升降立柱 (lifting column). Examples: CN101710752B "电动升降立柱的驱动装置" (priority 2009) and CN207115083U "遇阻可回退的电动升降平台" — [Google Patents query](https://patents.google.com/xhr/query?url=q%3D%E5%8D%87%E9%99%8D%E7%AB%8B%E6%9F%B1%26assignee%3D%E6%B5%99%E6%B1%9F%E6%8D%B7%E6%98%8C%E7%BA%BF%E6%80%A7%E9%A9%B1%E5%8A%A8%E7%A7%91%E6%8A%80%E8%82%A1%E4%BB%BD%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8%26num%3D20&exp=)
- **Jiecang standards role:** it says it "牵头起草了中国《直流电动推杆》行业标准、《电动升降桌》行业标准" — [jiecang.cn](https://www.jiecang.cn/)
- **Jiecang bought-in parts:** the 2018 prospectus shows it bought finished circuit boards ("成品线路板") from suppliers such as 苏州联芯威电子 and 深圳市瑞必达科技 — [Jiecang prospectus](https://pdf.dfcfw.com/pdf/H2_AN201808191180596187_1.pdf)
- **Kaidi 常州市凯迪电器股份有限公司 (605288.SH)** — [Kaidi 2025 annual report](https://pdf.dfcfw.com/pdf/H2_AN202604291821754028_1.pdf)
  - Address 江苏省常州市武进区横林镇江村横崔路2号.
  - 2025 output 7,976,193 linear-drive sets; revenue RMB 1.323bn, of which RMB 855.5M exported; 100% direct sales.
  - Staff 2,172 (1,348 production).
  - Vietnam plants exist; a US plant enters mass production in 2026.
- **Kaidi patents:** 168 results for 升降桌 (lifting desk), including CN111184345B "电动桌安全运行的控制方法及其控制单元" and CN208354930U (control-box mounting clip) — [Google Patents query](https://patents.google.com/xhr/query?url=q%3D%E5%8D%87%E9%99%8D%E6%A1%8C%26assignee%3D%E5%B8%B8%E5%B7%9E%E5%B8%82%E5%87%AF%E8%BF%AA%E7%94%B5%E5%99%A8%E8%82%A1%E4%BB%BD%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8%26num%3D20&exp=)
- **Kaidi's own site:** "我们提供包括成品升降台、独立整机框架以及配套周边配件在内的多元化定制服务"; claims 3000+ global employees — [czkaidi.cn](https://www.czkaidi.cn/)
- **Loctek 乐歌人体工学科技股份有限公司 (300729.SZ)** — [Loctek 2026 H1 report](https://pdf.dfcfw.com/pdf/H2_AN202608280006758408_1.pdf)
  - Production steps include "电机制造、SMT 贴片、模具设计与制造、冲压成型、精密制管、激光切割、机器人焊接、木板加工…整机装配".
  - "线性驱动升降系统年产能达 250 万套以上", across 4 bases in Ningbo, Guangxi and Vietnam.
  - It still buys "部分电机及其组件、精密丝杆".
- **Loctek patents:** 309 results for 升降立柱, e.g. WO2020211577A1 (reverse-on-obstruction control) — [Google Patents query](https://patents.google.com/xhr/query?url=q%3D%E5%8D%87%E9%99%8D%E7%AB%8B%E6%9F%B1%26assignee%3D%E4%B9%90%E6%AD%8C%E4%BA%BA%E4%BD%93%E5%B7%A5%E5%AD%A6%E7%A7%91%E6%8A%80%E8%82%A1%E4%BB%BD%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8%26num%3D20&exp=)
- **Competitors named in Jiecang's 2018 prospectus** — [Jiecang prospectus](https://pdf.dfcfw.com/pdf/H2_AN201808191180596187_1.pdf):
  - LINAK, with a China plant 力纳克传动系统（深圳）有限公司.
  - DEWERT.
  - 嘉兴礼海电气科技有限公司 (sofa and bed actuators).
  - TIMOTION, through its subsidiary 东莞堤摩讯传动科技有限公司.
  - 青岛豪江电器有限公司 (actuators and controllers).
  - 浙江新益控制系统有限公司: founded 1990; its linear actuators are "主要应用在办公室、医护、家具等领域".
  - 凯迪 (Kaidi).
  - 力姆泰克 (Lim-Tec).
- **Competitors named in Kaidi's 2020 prospectus:** LINAK; "Dewert Okin… 于 2010 年设立了中国嘉兴生产基地"; TIMOTION ("在广东东莞设有工厂，在江苏昆山设有分公司"); Jiecang — [Kaidi prospectus](https://pdf.dfcfw.com/pdf/H2_AN202005171379856182_1.pdf)
- **Xinyi (MIC):** "Zhejiang Xinyi Intelligent Drive Tech" (Shangyu Economic & Technological Development Zone) says "Zhejiang Xinyi Control System Co., Ltd was founded in 1990". It lists linear actuators up to 8000 N, lifting columns and controllers — [MIC Xinyi](https://xinyiintelligent.en.made-in-china.com/)
- **TiMOTION:** more than 2,000 staff, 7 manufacturing facilities and 13 subsidiaries (own site, via search summary) — [TiMOTION About](https://timotion.com/en/about)

**Who supplies which Western brand (customs and filings)**
- **Jiecang's 2018 prospectus, top-5 customers (all "智慧办公驱动系统")** — [Jiecang prospectus](https://pdf.dfcfw.com/pdf/H2_AN201808191180596187_1.pdf):
  - 2018 H1: AMQ Solutions (RMB 52.60M), Ergo Depot (Fully) (48.59M), The Human (44.31M), HAT Contract (39.50M), HNI (36.91M).
  - 2017: The Human, HAT Contract, Ergo Depot (Fully), Tricom Vision, and Haworth, "主要包括…Haworth Australia Pty Ltd.".
  - The Human is defined as "The Human（Square Grove LLC）".
  - Jiecang supplied **100%** of Ergo Depot's and of Tricom Vision's same-category purchases.
- **How these brands assemble desks (same prospectus):** "以美国的 The Human 公司为例，在通过 ODM 的合作方式从公司采购线性驱动产品的同时又从其他供应商采购桌面板材等组件进行配套…以 The Human 公司的自有品牌通过其在线商店…销售"; the same pattern is described for HAT Contract — [Jiecang prospectus](https://pdf.dfcfw.com/pdf/H2_AN201808191180596187_1.pdf)
- **Kaidi's 2020 prospectus, smart-office drive-system customers (sets per year)** — [Kaidi prospectus](https://pdf.dfcfw.com/pdf/H2_AN202005171379856182_1.pdf):
  - Fellowes Inc.: 55,770 (2019).
  - Teknion Limited: 50,927 (2019).
  - 乐联工业股份有限公司: 21,335 (2019).
  - 东莞市创健达智能科技有限公司: 17,327 (2019) and 43,487 (2018).
  - ESI Ergonomic Solutions: 72,584 (2018).
  - BALDEKA SVENHEIM GROUP, MTM Group, Isku Interior Oy and 再兴电子（深圳） also appear.
- **ImportYeti (search-result summaries only):**
  - Changzhou Kaidi Electrical ("Jiangcun East Road Henglin"): 1,785 sea shipments, last 09/09/2026. Customers include Kaidi (Baldwyn MS) 495, ESI Cases And Accessories (Mesa AZ) 329 and Teknion (Canada) 194 — [ImportYeti Kaidi](https://www.importyeti.com/supplier/changzhou-kaidi-electrical)
  - HAT Contract's top supplier is "Xinchang Jiecang Import & Export", 838 shipments — [ImportYeti HAT Contract](https://www.importyeti.com/company/hat-contract). Jiecang's 2025 annual report lists 新昌县捷昌进出口有限公司 as a wholly owned import-export subsidiary.
  - Firgelli Automations: Jiecang is its top supplier, 116 shipments — [ImportYeti Firgelli](https://www.importyeti.com/company/firgelli-automations)
  - Loctek Guangxi Smart Home's top customer is FlexiSpot (Whitehall US), 48 shipments — [ImportYeti Loctek Guangxi](https://www.importyeti.com/supplier/loctek-guangxi-smart-home). Loctek Ergonomic Technology (588 Qihang South Road, Binhai): 3,300 shipments, last 09/25/2026 — [ImportYeti Loctek](https://www.importyeti.com/supplier/loctek-ergonomic-technology)
  - Varidesk's top suppliers are Invention Global (1,377), Der Yih Enterprise (823), Tan Phong An Industrial (Vietnam, 366) and Chen Source (Taiwan, 328), with bills mentioning "standing desk legs" — [ImportYeti Varidesk](https://www.importyeti.com/company/varidesk)
- **Loctek's ODM customers:** "公司境外 ODM 客户主要包括宜家、沃尔玛等零售、超市、批发及工程渠道等"; own brand is 80.42% of main-business revenue (excluding the overseas-warehouse business) — [Loctek 2026 H1](https://pdf.dfcfw.com/pdf/H2_AN202608280006758408_1.pdf)
- **BTOD (12 Dec 2024)** — [BTOD](https://www.btod.com/blog/autonomous-pro-vs-jarvis-desk):
  - "Autonomous has switched to Aoke Furniture to produce their frames… using TiMotion for all of their electronic components".
  - "The Jarvis Desk is currently manufactured by JieCang Linear Technology".
- **UPLIFT label evidence:** a used "Uplift Desk JCB35N2-110" control box is on sale — [eBay](https://www.ebay.de/itm/405964185266). JCB35 is Jiecang's controller family — [DirectIndustry JCB35M11C](https://www.directindustry.com/prod/jiecang-linear-motion/product-233233-2744784.html)
- **Not found:** no supplier mapping for Fezibo, Desky, Advwin, Omnidesk, Zen Space Desks or Artiss. ImportGenius had no importer page under the slugs tried: fezibo, fezibo-inc, fezibo-llc. (UPLIFT, Autonomous, FlexiSpot, Vari and VIVO are now mapped from ImportGenius, above.)

**ImportGenius US bill-of-lading pages (direct fetch, 10 Oct 2026; "No. of Containers" = ImportGenius's count)**
- **FlexiSpot Inc (Irvine CA)**
  - 1,181 shipments. Top suppliers: LOCTEK ERGONOMICS VIETNAM CO LTD (911 containers, last 2026-10-08), LOCTEK ERGONOMICS VIETNAM COMPANY L (710), LOCTEK NINGBO INTERNATIONAL (117), LOCTEK NINGBO INTERNATIONAL TRADI (78), LOCTEK GUANGXI SMART HOME (48).
  - Cargo descriptions include "LIFTING TABLE (FRAME+TOPBOARD)" and "DESK (FRAME+ BAMBOO TOPBOARD)".
  - Source: [ImportGenius FlexiSpot](https://www.importgenius.com/importers/flexispot-inc)
- **Loctek Ergonomics Vietnam (Long Jiang Industrial Park, Tien Giang)**
  - Customers: Loctek Inc (1,800), FlexiSpot (911), Monoprice (44), "CKNAPP SALES, INC. DBA VIVO" (39, last 2021-11-16), Vovomart (HK) (42); also Amazon Logistics consignments of "LIFTING TABLE (FRAME+TOPBOARD)" — [ImportGenius Loctek Vietnam](https://www.importgenius.com/suppliers/loctek-ergonomics-vietnam-co-ltd)
- **Loctek Ergonomic Technology Corp (No.588 Qihang South Road, Binhai, Yinzhou)**
  - 3,253 shipments. One sample bill is an IKEA consignment, "BOLLSIDAN LAPTOP STND… IKEA SUPPLY AG C/O IKEA DISTRIBUTIO".
  - Top US consignees are import agents (HPWI International Trade 428, Artistic Conception 286, Sunflower USA 254).
  - Source: [ImportGenius Loctek](https://www.importgenius.com/suppliers/loctek-ergonomic-technology-corp)
- **Jiecang's Malaysian plant: JSTAR MOTION SDN BHD (No. 90 & 91 Jalan I-Park 1/10, Kulai, Johor)**
  - 2,147 shipments. Customers: J-STAR MOTION CORPORATION (909), HUMAN ACTIVE TECHNOLOGY LLC (456), **THE HUMAN SOLUTION - UPLIFT DESK (616, last 2025-01-12)**, ELEMENT ERGO (76), BESTQI INNOVATION (HK) (46).
  - Cargo: "ADJUSTABLE TABLE PARTS (DIGITALLY-CONTROLLED INTELLIGENT & ERGONOMIC WORKSTATION WITH IOT)".
  - Sources: [ImportGenius Jstar Motion](https://www.importgenius.com/suppliers/jstar-motion-sdn-bhd), [ImportGenius UPLIFT](https://www.importgenius.com/importers/the-human-solution-uplift-desk)
- **Xinchang Jiecang Import And Export (No.19-1 Xintao Road, Qixing Street, Xinchang)**
  - 4,596 shipments. Customers: J-STAR MOTION CORPORATION (4,101, last 2026-10-08), HAT CONTRACT (413, last 2019-07-06), AMQ SOLUTIONS LLC (454, last 2019-07-12), FULLY ENTERPRISE CORP (80, last 2018-01-28), BUSH INDUSTRIES (88, last 2024-01-25).
  - Recent bills: "ADJUSTABLE TABLE PARTS(LIFTING DEVICE), HANDSET" to J-Star; "TABLETOP TABLE LEGS AND PAD FOR DESK" to SECRETLAB SG PTE LTD; "ADJUSTABLE TABLE PARTS" to 247 WORKSPACE and Human Active Technology; tubular blind motors to Levolor.
  - Source: [ImportGenius Xinchang Jiecang I&E](https://www.importgenius.com/suppliers/xinchang-jiecang-import-and-export)
- **Zhejiang Jiecang Linear Motion (High-tech Park, Xinchang)**
  - Customers: THE HUMAN SOLUTION (61, last 2015-11-16), J-STAR MOTION (46, 2026), HAT CONTRACT (38, last 2016-06-17).
  - Cargo: "ADJUSTABLE TABLE PARTS/CONTROL BOX", "HANDSPIKE MOTOR".
  - Source: [ImportGenius Zhejiang Jiecang](https://www.importgenius.com/suppliers/zhejiang-jiecang-linear-motion)
- **Changzhou Kaidi Electrical Inc (No 4 Jiangcun East Road, Henglin)**
  - 1,954 shipments. Customers: KAIDI LLC (588; Kaidi's US arm), ESI ERGONOMIC SOLUTIONS (328, last 2020-11-22), SOUTHERN MOTION (175), TEKNION LIMITED (ALNESS SHIPMENTS) (133, last 2026-09-28), KAIDI ELECTRICAL (140).
  - Teknion bills: "STEEL FRAME / CONTROL BOX / HANDSET".
  - Source: [ImportGenius Kaidi](https://www.importgenius.com/suppliers/changzhou-kaidi-electrical-inc)
- **TiMOTION Technology (10F, No. 100 Minquan Rd, Xindian, New Taipei)**
  - 2,676 shipments. Customers include TiMOTION USA, La-Z-Boy (actuators shipped from Malaysia) and JWF Technologies.
  - "DESK LIFT FRAMES… 710 CARTONS" to ERGO INDUSTRIAL SEATING SYSTEM INC (2026-10-03).
  - "COLUMN / CONTROL BOX / HANDSET / CABLES" to John Deere.
  - Source: [ImportGenius TiMOTION](https://www.importgenius.com/suppliers/timotion-technology-co-ltd)
- **Varidesk LLC**
  - Suppliers: INVENTION GLOBAL LIMITED (5,944, last 2022-02-15; Shenzhen address, Taiwan-based), DER YIH ENTERPRISE (Taichung; 1,948, last 2026-10-02; "ELECTRIC STANDING DESK LEGS HTS: 940391"), Invention Global HK, Chen Source, Goang Hann.
  - Recent "HEIGHT-ADJUSTABLE COMPUTER DESK" lots come from TAN PHONG AN INDUSTRIAL (Vietnam).
  - Sources: [ImportGenius Varidesk](https://www.importgenius.com/importers/varidesk-llc), [ImportGenius Der Yih](https://www.importgenius.com/suppliers/der-yih-enterprise-co-ltd)
- **Autonomous Inc (Redlands CA)**
  - Suppliers: VINA G 7 JSC (Vietnam, 192), NINGBO AOKE OFFICE EQUIPMENT (117 + 63, last 2022-10-18), Merryfair.
  - 2024–25 "METAL HEIGHT ADJUSTABLE DESK FRAME" lots came from NINGBO YUNQI INNOVATION INTELLIGENT and from ZHEJIANG YUEQIANG FURNITURE (Anji chair maker).
  - Source: [ImportGenius Autonomous](https://www.importgenius.com/importers/autonomous-inc)
- **Ningbo Aoke Office Equipment (Science & Technology Park, Jiangshan Town, Yinzhou)**
  - Customers: Autonomous (117), Meubles Burotic, Bestar, Bush, and **SCHIAVELLO GWS PTY LTD** ("METAL HEIGHT ADJUSTABLE DESK FRAME", 2026-06-12).
  - Also "METAL HEIGHT ADJUSTABLE DESK FRAME HAND CONTROL CONTROL BOX TABLE ADAPTER" to Meyrin Development.
  - Source: [ImportGenius Aoke](https://www.importgenius.com/suppliers/ningbo-aoke-office-equipment-co-lt)
- **Ningbo Yunqi Innovation Intelligent** — address "Room 1204-1, Haoru International No.468 Taikang Middle Road" (an office suite). It ships "LIFTING COLUMN HAND CONTROLLER DESK TOP" and desk frames to Uncaged Ergonomics, Autonomous and others — [ImportGenius Yunqi](https://www.importgenius.com/suppliers/ningbo-yunqi-innovation-intelligent)
- **VIVO (C Knapp Sales, Goodfield IL)** — [ImportGenius VIVO](https://www.importgenius.com/importers/c-knapp-sales-inc-dba-vivo), [ImportGenius VIVO (2)](https://www.importgenius.com/importers/cknapp-sales-inc-dba-vivo):
  - Suppliers: LUMI LEGEND CORPORATION (725), LUMI LEGEND HK LIMITED (769), LUMI LEGEND GROUP LIMITED (994 on one page, 286 on another), GIBBON ERGONOMICS (M) SDN BHD (813), Vision Ergonomics (M) Sdn Bhd (Klang, Malaysia), Qidong Vision Mounts, Display Mount Pro.
  - Lumi Group bills to VIVO include "WORKSTATION TABLE TOP", "BAMBOO TABLE TOP" and "CONTROL BOX".
  - Malaysian bills: "COMPUTER DESK HEIGHT ADJUSTABLE DESK ACCESSORIES HS CODE 9403.10".
- **UPLIFT (The Human Solution)** — [ImportGenius UPLIFT Desk](https://www.importgenius.com/importers/uplift-desk), [ImportGenius The Human Solution](https://www.importgenius.com/importers/the-human-solution):
  - Desktops: JONAVOS EKSPORTAS UAB (Lithuania; 195 + 141 containers; "MELAMINE FACED CHIPBOARD FURNITURE AND FURNITURE PARTS") and HANGZHOU ECOMAX BAMBOO (162).
  - Fittings: FETON LTD; storage: CHYN FUH (Taiwan); a smaller Lumi Legend lot (27).
- **Fully** ("Fully Enterprise Corp"; the page mixes in an unrelated apparel importer) — [ImportGenius Fully Enterprise](https://www.importgenius.com/importers/fully-enterprise-corp):
  - Suppliers: HANGZHOU ECOMAX BAMBOO (109), XINCHANG JIECANG IMPORT AND EXPORT (80, last 2018-01-28), NINGBO ERGOVIDA HEALTH TECHNOLOGY (52; LUMI group member, monitor brackets and "WORKSTATION"), JSTAR MOTION SDN BHD (50, last 2022-02-13).
- **HAT Contract / Human Active Technology LLC (San Jose).** The two importer names share suppliers (Jiecang, Lumi, Steelrix) and the "HAT" initials. That they are the same firm is my inference; the pages do not say so — [ImportGenius HAT Contract](https://www.importgenius.com/importers/hat-contract), [ImportGenius Human Active Technology](https://www.importgenius.com/importers/human-active-technology-llc):
  - Suppliers: XINCHANG JIECANG I&E (413), JSTAR MOTION SDN BHD (456), Lumi Legend HK (151) and Group (142), Zhejiang Steelrix.
- **ESI Ergonomic Solutions** — [ImportGenius ESI](https://www.importgenius.com/importers/esi-ergonomic-solutions-llc):
  - Top supplier CHANGZHOU KAIDI ELECTRICAL INC (328).
  - Also "MONITOR BRACKET / PRIVACY PANEL BRACKET" from LUMI LEGEND CORPORATION (2020-12-07).
- **Element Ergo:** JSTAR MOTION SDN BHD (76) — [ImportGenius Element Ergo](https://www.importgenius.com/importers/element-ergo). **Desktronic US:** UAB Desktronic (Lithuania), Zhejiang Yueqiang, Lumi Legend Corporation — [ImportGenius Desktronic](https://www.importgenius.com/importers/desktronic-us-inc).
- **Lumi Legend Corporation (supplier page; address "24/f., Building 1, Lisi Plaza, Huifeng East Road, Ningbo", an office tower)**
  - 5,682 shipments; customers VIVO (725), Transform Partners (515), Stand Steady (154), Inland Products (100).
  - Recent bills: monitor brackets to Workrite Ergonomics, ACCO Brands and Safco; TV brackets to **ATDEC DISTRIBUTION USA PTY LTD** (Atdec is, to my background knowledge, a Sydney-based mounting brand; the "PTY LTD" suffix is consistent, but this is not sourced here); a mixed desk-accessory lot to DESKTRONIC US.
  - Source: [ImportGenius Lumi Legend Corp](https://www.importgenius.com/suppliers/lumi-legend-corporation)
- **Lumi Legend HK** (Kwun Tong, HK; customers VIVO 769, StarTech, Monoprice, Human Active Technology) and **Lumi Legend Group** (Wan Chai, HK; customers VIVO, Human Active Technology) — [ImportGenius Lumi HK](https://www.importgenius.com/suppliers/lumi-legend-hk-limited), [ImportGenius Lumi Group](https://www.importgenius.com/suppliers/lumi-legend-group-limited)
- **Zhejiang Weise Technology** ("Building 1 No 11 Meigui Road Qixing Street Xinchang"): exactly **1** US shipment ever, "ELECTRIC STANDING DESK, MONITOR ARM" to Micronetbd Inc, 2023-06-23 — [ImportGenius Weise](https://www.importgenius.com/suppliers/zhejiang-weise-technology-co-ltd)
- **Prorials:** no ImportGenius supplier page exists under four slug variants of "Zhejiang Prorials Advanced Materials". They redirect to /tradebase.
- **Data caveats:**
  - Some pages mix different entities with the same name (e.g. "Fully Enterprise Corp").
  - The "Country of Origin" field on Malaysian lots sometimes reads "South Korea" or "China Taiwan", apparently the transhipment port.
  - Full shipment lists are paywalled; only 10 sample bills and the top 5 partners are public.

**Tier 2 – frame fabricators / assemblers (no motor or controller production evidenced)**
- **Prorials 浙江普锐新材料有限公司 (Cixi)** — [Prorials company profile](https://www.prorials.com/company-profile.html):
  - Lists "automatic cutting machines and CNC punching machines… eco-friendly spraying… high-precision assembly lines".
  - Its patents are 6 utility models on TV-bracket production devices.
- **Lumi (Ningbo)** — [Lumi factory tour](https://www.lumi.cn/en/factorytour):
  - Has a "Standing Desks Manufacturing Center", with processes listed as stamping, welding, cutting, die-casting, polishing, coating, manual assembly and packaging.
  - Neither company mentions motor, PCB or SMT lines.
- **Desk assemblers buying Kaidi kits (A-grade):** 东莞市创健达智能科技有限公司, 乐联工业 and 再兴电子（深圳） — [Kaidi prospectus](https://pdf.dfcfw.com/pdf/H2_AN202005171379856182_1.pdf)
- **Zhejiang Weise Technology:** address "4th Floor, Unit 1 Building 9, Automotive Electronics Industry Park, Chengtan Street, Xinchang" — [MIC Weisetech](https://weisetech.en.made-in-china.com/)
- **1688 Changzhou cards (earlier round, 9 Oct 2026):**
  - 1688 desk cards are concentrated in Changzhou: 常州市泽维尔办公设备 (¥169.69), 常州市优品诺家居科技, 常州市美耐斯家具, 常州木语巷家居 — [wiki.1688 A](https://wiki.1688.com/zh/electric-lifting-bar-table/WKff30a9syczcw), [wiki.1688 B](https://wiki.1688.com/zh/smart-desk/WKftlahbb8ixvk)

**Desktops**
- **Brands buy tops separately:** The Human and HAT Contract buy "桌面板材" from other suppliers — [Jiecang prospectus](https://pdf.dfcfw.com/pdf/H2_AN201808191180596187_1.pdf). Loctek processes boards in-house ("木板加工") — [Loctek 2026 H1](https://pdf.dfcfw.com/pdf/H2_AN202608280006758408_1.pdf)
- **Wanhua Ecoboard** (shareholders include Wanhua Industrial Group; maker of straw board, particleboard and MDF; markets "Formaldehyde-free straw-made Ecoboard"): "Modern Office Desk Top" at US$12–28, MOQ 1 piece, Wuhan port, 500,000 pcs/yr — [MIC Ecoboard](https://ecoboard.en.made-in-china.com/product/oXTQvkrSazYA/China-Modern-Office-Desk-Top-Modern-Office-Table-Top.html)
- **Particleboard / HPL top suppliers on MIC (Shandong/Jiangsu-heavy):**
  - Weifang Greenland: from US$30, MOQ 10.
  - Chengbang New Materials (Qingdao): US$8–20, MOQ 480.
  - Caoxian Shengrong Wood (Cao County, Heze).
  - Linyi Red Forest.
  - Changzhou Weideda Laminate: US$10–25.
  - Sources: [MIC Particle Board Table Top](https://www.made-in-china.com/products-search/hot-china-products/Particle_Board_Table_Top.html), [MIC MDF Table Top](https://www.made-in-china.com/products-search/hot-china-products/MDF_Table_Top.html)
- **Bamboo tops:**
  - Hangzhou La July Bamboo & Wood (Zhejiang, FSC): about US$31–45/m², MOQ 300 m².
  - New Developing Home Products (Fujian): US$45–120, MOQ 200.
  - Xiamen Forever Rise (a trading company): US$24.30–25.00, MOQ 10.
  - Source: [MIC Standing Desk Tabletop](https://www.made-in-china.com/products-search/hot-china-products/Standing_Desk_Tabletop.html)

### Inferences
- The production chain has three layers:
  1. Column/controller makers (Jiecang, Kaidi, Loctek, TiMOTION, LINAK, DewertOkin, Xinyi).
  2. Frame fabricators/assemblers that make steel feet, crossbars and outer tubes, then fit bought-in drive kits (Prorials, Lumi, Weise, 东莞创健达, the Changzhou 1688 sellers).
  3. Board makers for tops.
- Western brands buy layer 1 directly. Small storefronts are usually layer 2, or traders on top of layer 2.
- The 2024–26 bills show the pattern still holds:
  - UPLIFT, HAT/Human Active Technology, Element Ergo and Secretlab buy Jiecang kits.
  - Teknion buys Kaidi frame + control box + handset sets.
  - FlexiSpot is fully captive to Loctek.
  - VIVO buys from the LUMI group plus Malaysian assemblers.
  - Autonomous buys from Ningbo assemblers and a trading office.
- Jiecang's US-bound kits moved to its Malaysian plant (JSTAR MOTION SDN BHD) after 2019. Direct China-origin Jiecang shipments to HAT and AMQ end in July 2019, and UPLIFT's Malaysian lots run to 2025-01. My inference is that this is US-tariff routing; the timing fits but no filing states the reason.
- "Owns motor/column production": Jiecang, Kaidi, Loctek (all A), and TiMOTION, LINAK and DewertOkin (B, from regulated-filing mentions).
- "Assembles bought-in columns": 东莞创健达, 乐联 and 再兴 (A, from Kaidi's customer table). Prorials and Lumi are probable, but this is inferred from the absence of any motor/PCB capability; it is not proven.
- Ningbo (Loctek, Lumi, Prorials in Cixi), Xinchang/Shangyu (Jiecang, Weise, Xinyi) and Changzhou (Kaidi plus 1688 assemblers) are the clusters with evidence. No Zhongshan column maker was found.

### Gaps
- **Hengsheng and OMT:** no actuator maker could be identified under either name (both searches empty). No Zhongshan maker was identified.
- **Brands with unknown OEMs:** Fezibo, Desky, Advwin, Omnidesk, Zen Space Desks and Artiss. ImportGenius covers US imports only, and AU import data is not public.
- **UPLIFT after Jan 2025:** its latest JSTAR lot is 2025-01-12. Where UPLIFT has sourced since was not visible; it may be buying through J-Star Motion Corp (Jiecang's US subsidiary) domestically. That is inference.
- **IKEA:** Loctek's report names IKEA as an ODM customer, and ImportGenius shows a Loctek → "IKEA SUPPLY AG" bill for the BOLLSIDAN laptop stand. Which IKEA sit/stand desks (if any) Loctek makes is unknown.
- **Particleboard tops:** no 140×70 particleboard top quote was found from a desk-top specialist. The Wanhua listing (US$12–28) does not state a size.

---

## Q2. Candidate factory profiles (evidence-graded)

### Takeaway
Six companies clear the "two independent A/B items" bar as manufacturers: Jiecang, Kaidi, Loctek, TiMOTION, Prorials and Lumi. Only the first four make motor/column/control-box drive systems; Prorials and Lumi are frame/desk fabricators and assemblers.

Customs pages add more:
- **Lumi:** a direct shipper to VIVO, Workrite, ACCO and Atdec.
- **TiMOTION:** a direct shipper of "DESK LIFT FRAMES" to a North American seating maker.
- **Ningbo Aoke:** a frame assembler that supplied Autonomous, Bush, Bestar and a "SCHIAVELLO GWS PTY LTD" consignee. It qualifies as a manufacturer (customs plus a BTOD description), though it uses TiMOTION electronics.

Under-evidenced:
- **Xinyi:** one regulated-filing mention plus platform claims.
- **Weise:** platform-only; just one US shipment ever.
- **Ningbo Yunqi Innovation:** shown by customs to be an office-suite trading company.

### Cited Findings
- **1. Zhejiang Jiecang Linear Motion Technology 浙江捷昌线性驱动科技股份有限公司 — Xinchang, Shaoxing (registered at 新昌县省级高新技术产业园区).**
  - Evidence A: SSE filings (2025 annual report, 2018 prospectus); patents; customs as direct shipper via its export subsidiary (HAT Contract, Firgelli). Evidence B: ICP 浙ICP备11031253号; CNAS-accredited lab.
  - Channel: "主要通过直销方式进行"; ODM with overseas brand manufacturers; regional distributors "SAPEC (韩国)、Ahti Vesalainen Oy (芬兰)、Mehr Pooyan (伊朗)、BIBUS (印度)".
  - OEM customers: The Human/UPLIFT, Fully, HAT Contract, AMQ/Tricom Vision, HNI and Haworth (including Haworth Australia).
  - MIC terms: MOQ "5 Pcs"; complete JC35TS-R13R dual-motor desk at US$179 (10–99) / **US$159 (100–499)** / US$129 (500+); sample US$350; lead time "one month".
  - Sources: [Jiecang 2025 AR](https://pdf.dfcfw.com/pdf/H2_AN202604271821616543_1.pdf), [Jiecang prospectus](https://pdf.dfcfw.com/pdf/H2_AN201808191180596187_1.pdf), [MIC Jiecang desk](https://jiecang.en.made-in-china.com/product/ewtfMmyoEWhc/China-Jiecang-Dual-Motor-Luxury-Height-Adjustable-Executive-Standing-Desk.html)
  - Earlier round: R12R-TH frame at US$110 (10–99) / US$105 (100–499) / US$100 (500+), MOQ 10 — [MIC Jiecang frame](https://jiecang.en.made-in-china.com/product/KOqfYgsblSWR/China-Jiecang-R12r-Th-Electric-Height-Adjustable-Standing-Desk-Frame.html)
- **2. Changzhou Kaidi Electrical 常州市凯迪电器股份有限公司 — Henglin, Wujin, Changzhou.**
  - Evidence A: SSE filings; patents; customs shipments to ESI and Teknion. Evidence B: CIFF Click2Connect exhibitor profile (via search summary).
  - Channel: 100% direct sales to furniture makers and brands; offers "成品升降台、独立整机框架".
  - OEM customers: Fellowes/ESI, Teknion, 东莞创健达, 乐联, BALDEKA, MTM, Isku.
  - MOQ and list price were not found. Desk enquiries go to desk@czkaidi.cn.
  - Sources: [Kaidi prospectus](https://pdf.dfcfw.com/pdf/H2_AN202005171379856182_1.pdf), [Kaidi site](https://www.czkaidi.cn/), [CIFF profile](https://click2connect.ciff-gz.com/brands/67488bc865622d345eab4b5d)
- **3. Loctek Ergonomic Technology 乐歌人体工学科技股份有限公司 (with LoctekMotion as its B2B/ODM arm) — Jiangshan and Binhai (Ningbo), Beihai (Guangxi), HCMC (Vietnam).**
  - Evidence A: SZSE filings; patents; customs shipments to FlexiSpot. Evidence B: ICP 浙ICP备09096894号.
  - Channel: own brand dominates; ODM for IKEA and Walmart.
  - The 2017 prospectus says it signs "线上渠道限制条款" (online-channel restriction clauses) with ODM/OEM customers.
  - It runs its own Australian subsidiary, FlexiSpot PTY. LTD. (est. 10 Feb 2023).
  - MOQ and price were not found.
  - Sources: [Loctek 2026 H1](https://pdf.dfcfw.com/pdf/H2_AN202608280006758408_1.pdf), [Loctek prospectus](https://pdf.dfcfw.com/pdf/H2_AN201711201053206901_1.pdf), [LoctekMotion](https://www.loctekmotion.com/)
- **4. TiMOTION 第一傳動 (Taiwan HQ; Dongguan factory 东莞堤摩讯传动科技有限公司; Kunshan branch).**
  - Evidence B: named as a producer in both the Jiecang and Kaidi prospectuses; own site (more than 2,000 staff, 7 facilities).
  - Evidence A: customs as direct shipper of "DESK LIFT FRAMES" (710 cartons, 2026-10-03, to Ergo Industrial Seating System) and actuators to La-Z-Boy — [ImportGenius TiMOTION](https://www.importgenius.com/suppliers/timotion-technology-co-ltd)
  - Customer: Autonomous electronics (BTOD).
  - MOQ and price were not found.
  - Sources: [Kaidi prospectus](https://pdf.dfcfw.com/pdf/H2_AN202005171379856182_1.pdf), [BTOD](https://www.btod.com/blog/autonomous-pro-vs-jarvis-desk)
- **5. Zhejiang Prorials Advanced Materials 浙江普锐新材料有限公司 — 浙江省宁波市慈溪滨海经济开发区镇龙六路 399 号.**
  - Evidence A: holds 6 utility-model patents (TV-bracket production devices; 2024–25). Evidence B: NeoCon exhibitor at booth "7-1105, 7th Floor"; own CN/EN sites with factory-display pages (no ICP number found).
  - Platform figures: MIC "1195" employees and "127124.86 square meters". Its own site claims "1600+" employees and "200,000+" m².
  - Terms: MOQ 100; dual frame at US$76 (100–499) / 75 / 74; 30% T/T deposit plus 70% before delivery; bulk about 35 days.
  - Claimed customers ("Walmart, Home Depot, Amazon") are C-grade (Global Sources text via search summary).
  - Sources: [NeoCon](https://neocon.com/exhibitors/zhejiang-prorials-advanced-materials-co-ltd), [cn.prorials.com](https://cn.prorials.com/), [Google Patents](https://patents.google.com/xhr/query?url=assignee%3D%E6%B5%99%E6%B1%9F%E6%99%AE%E9%94%90%E6%96%B0%E6%9D%90%E6%96%99%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8%26num%3D100&exp=), [MIC dual frame](https://chinapurui.en.made-in-china.com/product/JRbUSIKobqVf/China-Fast-Lift-Dual-Motor-Electric-Height-Adjustable-Standing-Office-Desk-Frame.html)
- **6. LUMI Group 宁波渠成集团有限公司 / Lumi Legend Corporation (export entity on patents: 宁波渠成进出口有限公司) — HQ at 鄞州区四明东路366号涵谷大厦 (an office tower).**
  - Evidence A: patent holder. Lumi entities hold 215 Chinese patents, including electric lift-table mechanisms (2015), plus US patents.
  - VIVO link: CA3028426C is assigned to Lumi Legend HK, while the same-priority US20220192364A1 is assigned to "Cknapp Sales, Inc. D/B/A Vivo".
  - Evidence B: own site with factory tour ("Standing Desks Manufacturing Center"); ICP备17059849号-1; LUMI-branded desks sold by NZ retailers (search summary).
  - Terms: M08-23DE complete dual desk at US$99–129, MOQ 100, about 45 days after payment.
  - **Evidence A (customs):** Lumi Legend Corp / HK / Group are direct shippers to VIVO (725 + 769 + 994 containers), Human Active Technology, Monoprice, StarTech, Workrite, ACCO, Desktronic and ATDEC ("…USA PTY LTD"; an Australian mounts brand per background knowledge, unsourced).
    - VIVO bills include "WORKSTATION TABLE TOP", "BAMBOO TABLE TOP" and "CONTROL BOX".
    - Group member Ningbo Ergovida shipped to Fully.
    - Sources: [ImportGenius Lumi Legend Corp](https://www.importgenius.com/suppliers/lumi-legend-corporation), [ImportGenius Lumi Group](https://www.importgenius.com/suppliers/lumi-legend-group-limited)
  - Sources: [Google Patents Lumi](https://patents.google.com/xhr/query?url=assignee%3DLumi%2BLegend%26num%3D50&exp=), [Lumi factory tour](https://www.lumi.cn/en/factorytour), [MIC Lumi desk](https://lumi2007.en.made-in-china.com/product/MolxpvyJXUDj/China-Modern-Home-Office-Furniture-Wholesale-3-Stage-Dual-Motors-Electric-Standing-Table-Gaming-Desk.html), [PB Tech LUMI](https://www.pbtech.com/product/MOABRA1156/product/MOABRA1156/LUMI-Lumi-STB-072-Deluxe-Desktop-MonitorLaptop-Adj)
- **7. Zhejiang Xinyi Intelligent Drive / Xinyi Control System 浙江新益控制系统 — Shangyu EDZ.**
  - Evidence B: named by Jiecang's prospectus as a linear-actuator producer. Evidence C: MIC profile.
  - Earlier round: 3-stage dual frame at US$110–159, MOQ 20 sets — [MIC Xinyi](https://xinyiintelligent.en.made-in-china.com/)
- **8. Zhejiang Weise Technology — Xinchang (MIC lists an upper-floor unit; customs lists "Building 1 No 11 Meigui Road Qixing Street").**
  - Evidence C (MIC). Customs: a single US shipment, "ELECTRIC STANDING DESK, MONITOR ARM" to Micronetbd Inc, 2023-06-23 — [ImportGenius Weise](https://www.importgenius.com/suppliers/zhejiang-weise-technology-co-ltd)
  - Earlier round: Ws-Sg2bj-01 dual-motor at US$87.40 (30–299) / 84.10 / 82.60 — [MIC Weisetech](https://weisetech.en.made-in-china.com/product/AdXaNiyhClGE/China-Ws-Sg2bj-01-Dual-Motor-Electric-Ergonomic-Height-Adjustable-Standing-Desk.html)

- **9. Ningbo Aoke Office Equipment Co., Ltd (Chinese name not found) — Science & Technology Park, Jiangshan Town, Yinzhou, Ningbo.**
  - Evidence A: customs as direct shipper of "METAL HEIGHT ADJUSTABLE DESK FRAME… HAND CONTROL CONTROL BOX" to Autonomous (180 containers to 2022), Meubles Burotic, Bestar, Bush and SCHIAVELLO GWS PTY LTD (Schiavello is, to my background knowledge, an Australian office-furniture group; unsourced here) — [ImportGenius Aoke](https://www.importgenius.com/suppliers/ningbo-aoke-office-equipment-co-lt)
  - Evidence B/C: BTOD says "Aoke currently manufacturers their frame components while using TiMotion for all of their electronic components" — [BTOD](https://www.btod.com/blog/autonomous-pro-vs-jarvis-desk)
  - Classification: frame assembler fitting TiMOTION drive electronics. MOQ and price not found.
- **10. Ningbo Yunqi Innovation Intelligent — "Room 1204-1, Haoru International No.468 Taikang Middle Road" (office suite).**
  - Customs: ships "LIFTING COLUMN HAND CONTROLLER DESK TOP" and desk frames to Uncaged Ergonomics, Autonomous and Clouds Grande — [ImportGenius Yunqi](https://www.importgenius.com/suppliers/ningbo-yunqi-innovation-intelligent)
  - Classification: trading company (office address). This is an example of the reseller layer the user is worried about.

### Inferences
- For a small Australian buyer, the realistic "real factory" options are:
  - Jiecang direct, through its own MIC storefront, at a premium.
  - Kaidi, if it accepts small orders (unknown).
  - A Tier-2 assembler (Prorials, Lumi) that fits bought-in drive kits, at US$75–130 per set.
- Loctek is structurally conflicted: it owns FlexiSpot AU and restricts ODM customers' online channels.
- Prorials and Lumi are real factories under the brief's rule, but "factory" here means metal fabrication plus assembly. Neither is a motor/controller maker.

### Gaps
- Not obtained for any company: registry business scope (经营范围), insured headcount (社保人数) or licence images (geo-blocks and captchas).
- MOQ and price for Kaidi, Loctek/LoctekMotion and TiMOTION.
- Which column maker supplies Prorials' and Lumi's drive kits.

---

## Q3. Classification of Prorials, Lumi Legend and Jiecang's MIC storefront

### Takeaway
- **Jiecang's MIC storefront is the manufacturer itself.** Export shipments may be invoiced by its wholly owned 新昌县捷昌进出口有限公司.
- **Prorials is a real Cixi metal-fabrication and assembly factory**, which began in monitor and TV stands. It is not a materials company, and not a column/motor maker; its dual-motor drive kits are probably bought in.
- **Lumi Legend Corporation is the export/ODM arm of the LUMI Group**, listed at an office-tower address. The group runs its own fabrication factories, including a standing-desk centre, and holds desk-mechanism patents. For desks it behaves as a factory-backed ODM integrator.

### Cited Findings
**Jiecang's MIC storefront**
- The storefront's legal name, "Zhejiang Jiecang Linear Motion Technology Co., Ltd.", matches the listed company.
- Its "Year of Establishment: 2010-04-30" fits Jiemian's report that the listed entity was re-registered in late April 2010. Its address is in Xinchang County; it shows "Number of Employees: 1549" and "Plant Area 69452 square meters"; it is TÜV Rheinland-audited and lists "Number of Foreign Trading Staff 100".
- Sources: [MIC Jiecang](https://jiecang.en.made-in-china.com/), [Jiemian](https://m.jiemian.com/article/2484732.html)
- Its registered capital of RMB 382.2M (earlier round) — [MIC Jiecang frame](https://jiecang.en.made-in-china.com/product/KOqfYgsblSWR/China-Jiecang-R12r-Th-Electric-Height-Adjustable-Standing-Desk-Frame.html)
- The 2025 annual report lists 新昌县捷昌进出口有限公司 ("货物进出口、技术进出口", RMB 5M capital, 2025 revenue RMB 1.134bn) as a wholly owned subsidiary — [Jiecang 2025 AR](https://pdf.dfcfw.com/pdf/H2_AN202604271821616543_1.pdf)
- US customs (search summary) show "Xinchang Jiecang Import & Export" as the shipper to HAT Contract — [ImportYeti HAT](https://www.importyeti.com/company/hat-contract)
- **Confirmed directly on ImportGenius:** XINCHANG JIECANG IMPORT AND EXPORT (No.19-1 Xintao Road, Qixing Street, Xinchang) has 4,596 US shipments. Its consignees are Jiecang's own J-STAR MOTION CORPORATION (4,101 containers), HAT Contract, AMQ, Fully, Bush, Secretlab and 247 Workspace. The listed company itself (ZHEJIANG JIECANG LINEAR MOTION, High-tech Park Xinchang) also appears as a shipper — [ImportGenius Xinchang Jiecang I&E](https://www.importgenius.com/suppliers/xinchang-jiecang-import-and-export), [ImportGenius Zhejiang Jiecang](https://www.importgenius.com/suppliers/zhejiang-jiecang-linear-motion)

**Prorials**
- **Chinese name:** "Copyright ©浙江普锐新材料有限公司" — [cn.prorials.com](https://cn.prorials.com/)
- **Origin in stands:** NeoCon text: "We started as a manufacturer of LCD monitor stands, TV stands, and smart furniture like standing office desks…earning the title of 'Cixi Top 100 Enterprises'" — [NeoCon](https://neocon.com/exhibitors/zhejiang-prorials-advanced-materials-co-ltd)
- **Patents:** all 6 are in the company's legal name, filed 2024–2025, and cover TV-bracket bending, press-riveting and spraying devices, a TV bracket, and a TV-base rubber-pad device. None covers desks — [Google Patents](https://patents.google.com/xhr/query?url=assignee%3D%E6%B5%99%E6%B1%9F%E6%99%AE%E9%94%90%E6%96%B0%E6%9D%90%E6%96%99%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8%26num%3D100&exp=)
- **Patent claim on its own site:** "33 utility model patents, covering key production devices such as automatic feeding, stamping, punching and tapping devices" — [Prorials profile](https://www.prorials.com/company-profile.html)
- **Self-description:** "一家深耕新材料及家具配套产品领域的企业"; 2025 output value "超过1.1亿美元" (self-claim) — [cn.prorials.com](https://cn.prorials.com/)
- **MIC membership:** "Diamond Member Since 2024" ("3 yrs") — [MIC Prorials](https://chinapurui.en.made-in-china.com/)
- **Customs:** no ImportYeti page surfaced for "Prorials" (search summary). No ImportGenius supplier page exists under four "Zhejiang Prorials Advanced Materials" slug variants, so no US customs footprint was found under its name. It may export under another entity or a forwarder, or mainly to non-US markets; that is unverified.
- **Registry business scope:** not retrievable. Shuidi and Qixin returned geo-block pages — [Shuidi block](https://shuidi.cn/pc-search?key=%E6%B5%99%E6%B1%9F%E6%99%AE%E9%94%90%E6%96%B0%E6%9D%90%E6%96%99%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8)

**Lumi**
- **Group:** "LUMI Group… involved in Research & Development, Supply Chain Management and Creative Marketing… 6 Member Companies, each functioning independently". It includes a "LUMIVIDA DIVISION… One-stop sourcing service" — [lumilegend.com](https://www.lumilegend.com/)
- **Chinese parent and address:** lumilegend.cn resolves to 宁波渠成集团有限公司 at 四明东路366号涵谷大厦 — [lumilegend.cn](https://www.lumilegend.cn/). The MIC storefront address is the same building — [MIC Lumi](https://lumi2007.en.made-in-china.com/)
- **Factories:** Lumi's FAQ says "our largest factory is capable of producing over 10 million TV mounts a year and currently has over 600 employees". The factory tour shows a "Standing Desks Manufacturing Center" — [Lumi factory tour](https://www.lumi.cn/en/factorytour)
- **MIC FAQ:** "We are an experienced designer and manufacturer since 2005 - we also assist customers with their sourcing needs and consolidate product shipments" — [MIC Lumi desk](https://lumi2007.en.made-in-china.com/product/MolxpvyJXUDj/China-Modern-Home-Office-Furniture-Wholesale-3-Stage-Dual-Motors-Electric-Standing-Table-Gaming-Desk.html)
- **Loctek's view:** Loctek's 2017 prospectus names "宁波渠成进出口有限公司" as a domestic competitor in large-screen mounts — [Loctek prospectus](https://pdf.dfcfw.com/pdf/H2_AN201711201053206901_1.pdf)
- **Patents:** 宁波渠成进出口有限公司 holds 215 patents, e.g. CN204949963U "Electric lift table's elevating system" and CN204861796U "Electric lift table" (control-box housing) — [Google Patents](https://patents.google.com/xhr/query?url=assignee%3D%E5%AE%81%E6%B3%A2%E6%B8%A0%E6%88%90%E8%BF%9B%E5%87%BA%E5%8F%A3%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8%26num%3D100&exp=)
- **Customs (search summary):** "Lumi Legend Corp" (Lisi Plaza, Ningbo) is a supplier to My Cable Mart and Tecnologia Alterco; the product type is not visible — [ImportYeti Lumi Legend Electrical](https://www.importyeti.com/supplier/lumi-legend-electrical)
- **Customs, direct on ImportGenius:**
  - LUMI LEGEND CORPORATION ("24/f., Building 1, Lisi Plaza, Huifeng East Road, Ningbo") has 5,682 US shipments; top customer C KNAPP SALES DBA VIVO (725 containers). Lumi Legend HK and Lumi Legend Group (both Hong Kong addresses) ship to VIVO (769 and 994 containers) and to Human Active Technology.
  - VIVO-bound bills include "WORKSTATION TABLE TOP", "BAMBOO TABLE TOP", "CONTROL BOX" and "TV BRACKET OF STEEL".
  - Lumi entities also ship brackets to Workrite, ACCO, Fellowes Canada, StarTech, Monoprice and ATDEC Distribution USA Pty Ltd.
  - Sources: [ImportGenius Lumi Legend Corp](https://www.importgenius.com/suppliers/lumi-legend-corporation), [ImportGenius Lumi HK](https://www.importgenius.com/suppliers/lumi-legend-hk-limited), [ImportGenius Lumi Group](https://www.importgenius.com/suppliers/lumi-legend-group-limited)
- **All shipper addresses are office or HK addresses:** Lisi Plaza office tower; Kwun Tong and Wan Chai in Hong Kong. That is consistent with Lumi Legend being the group's export/invoicing entity rather than the production site.

### Inferences
- **Jiecang's MIC storefront = "factory".** It has more than two independent A items: filings, patents, and customs via its own subsidiary. It is not a reseller.
- **Prorials = "factory" (frame fabricator/assembler).**
  - It has an A item (patents in its legal name) and B items (NeoCon booth, own sites).
  - The "Advanced Materials" name does not mean it resells others' frames. Its patents and history are metalwork on TV and monitor stands.
  - But it has no evidence of making motors, controllers or column drives. Treat its dual-motor kit as bought in until a factory audit or bill of materials shows otherwise.
  - Flag: the patents only start in 2024, and MIC membership dates from 2024. This suggests the current legal entity may be newer than the "founded 2006" claim. That is unverified and needs a GSXT check.
- **Lumi Legend = "factory's own trading arm".** The MIC seller is the group's export/ODM company at its HQ office address; the group owns fabrication plants.
  - Customs make it an A-grade direct shipper to Western brands: VIVO, a major US desk and mount brand, is its biggest account.
  - Its pages show "CONTROL BOX" and "TABLE TOP" lines to VIVO but no motor or column lines. That supports the inference that Lumi integrates bought-in drive kits.
  - For desks, Lumi is closer to an ODM integrator (frame fabrication plus bought-in drive kits; the latter is inference), with a documented US-brand link (VIVO).
  - It is not a "fifth middleman", but it is one layer above the column maker.

### Gaps
- GSXT records (business scope, establishment date, insured headcount) for 浙江普锐新材料有限公司 and 宁波渠成进出口有限公司 / 宁波渠成集团.
- Whether Prorials or Lumi make any column inner parts (spindles, motors) in-house.

---

## Q4. Australian electrical compliance: who holds SAA/RCM evidence, and what EESS reveals

### Takeaway
- **Only Jiecang claims SAA approvals**, in its regulated 2025 annual report and on MIC.
- **Kaidi, Loctek and Prorials list other certifications** (CE, UL/cUL, CB, PSE, etc.), with no SAA/RCM.
- **The EESS public register cannot reveal the manufacturer behind AU brands.** It shows brand and model; supplier details are hidden; and it was unreachable from this environment.
- **Desky shows the route a brand takes:** it publicises an EESS Level 1 registration for its Dual frame.

### Cited Findings
- **Jiecang (2025 annual report):** "多款产品获得 CB、CE、GS、CCC、CQC、UL、ETL、PSE、KC、SAA、UKCA、FCC、IC 等各国产品认证" — [Jiecang 2025 AR](https://pdf.dfcfw.com/pdf/H2_AN202604271821616543_1.pdf)
  - Its MIC desk page claims "CE, TUV, UL, PSE, KC, SAA, RoHS" — [MIC Jiecang desk](https://jiecang.en.made-in-china.com/product/ewtfMmyoEWhc/China-Jiecang-Dual-Motor-Luxury-Height-Adjustable-Executive-Standing-Desk.html)
  - Its test centre is "CNAS认可" and a TÜV/SGS/UL witness lab — [jiecang.cn](https://www.jiecang.cn/)
- **Kaidi:** "凯迪产品和方案获得 CE、UL/CUL、RoHS、PSE、FCC、BSMI 和 PSB" — [Kaidi quality page](https://www.czkaidi.cn/quality.html)
- **LoctekMotion:** "Cetificates including CB, CE, ISO, UL" — [LoctekMotion](https://www.loctekmotion.com/)
- **Lumi:** "in-house UL/TÜV test lab… GS /UL / TÜV / CE / BIFMA / RoHS / Reach / KC / Prop 65 / FCC" (self-claim) — [MIC Lumi desk](https://lumi2007.en.made-in-china.com/product/MolxpvyJXUDj/China-Modern-Home-Office-Furniture-Wholesale-3-Stage-Dual-Motors-Electric-Standing-Table-Gaming-Desk.html)
- **Prorials:** "BSCI, UKCA, CE, REACH, ISO9001" — [Prorials profile](https://www.prorials.com/company-profile.html)
- **Desky Dual frame:** "Input Power: 240v Transformer Power: 200W… EESS Equipment Certified: Yes, Level 1 Equipment Certification (No. R22210)" — [Desky product JSON](https://www.desky.com.au/products/dual-sit-stand-desk-frame.json)
- **Advwin:** lists "Voltage:29V Working Current:1.8A Power:52W" with no compliance text — [Advwin JSON](https://www.advwin.com.au/products/advwin-dual-motor-electric-standing-desk-height-adjustable.json)
- **Artiss:** lists "Input voltage: 240V/50Hz Power plug: Australian standard… Adaptor cable length: 3m" — [Artiss JSON](https://www.artiss.com.au/products/artiss-standing-desk-electric-adjustable-sit-stand-desks-black-white-140cm.json)
- **What the EESS database shows:** "Details, including the brand and model number, of in-scope electrical equipment categorised as Risk Level 2 & 3". Responsible-supplier details are "recorded on the database but not viewable publicly". The old database was replaced by the "EESS Platform" from 14 Oct 2024 — [EESS registration database](https://www.eess.gov.au/registration/eess-registration-database/)
- **Access:** both public search endpoints failed from here (legacy erac endpoint: proxy CONNECT rejected; new eessplatform.eess.gov.au Pega app: login/JS shell only) — [EESS home](https://www.eess.gov.au/)
- **FlexiSpot AU:** Loctek's 100%-owned FlexiSpot PTY. LTD. (Australia, est. 2023) — [Loctek 2026 H1](https://pdf.dfcfw.com/pdf/H2_AN202608280006758408_1.pdf)
- **Possible Australian-company links found outside EESS** (entities with "Pty Ltd" names, seen in US customs and in filings; this is not AU import data):
  - SCHIAVELLO GWS PTY LTD is consignee of "METAL HEIGHT ADJUSTABLE DESK FRAME" from Ningbo Aoke Office Equipment (2026-06-12) — [ImportGenius Aoke](https://www.importgenius.com/suppliers/ningbo-aoke-office-equipment-co-lt)
  - ATDEC DISTRIBUTION USA PTY LTD receives TV brackets from Lumi Legend Corporation (2026-09-30) — [ImportGenius Lumi Legend Corp](https://www.importgenius.com/suppliers/lumi-legend-corporation)
  - Jiecang's 2018 prospectus lists "Haworth Australia Pty Ltd." within its Haworth customer group — [Jiecang prospectus](https://pdf.dfcfw.com/pdf/H2_AN201808191180596187_1.pdf)

### Inferences
- **Of the candidates, only Jiecang's kits are likely to come with Australian (SAA) certification paperwork.** A buyer still needs the specific certificate number and model match.
- **The EESS-light route is plausible.** Desky treats a frame with an internal 240 V transformer/control box as Level 1 (voluntarily registered). If the control box takes 100–240 V mains internally, as Prorials and Lumi list "Power Input 100~240V", the importer needs:
  - responsible-supplier registration;
  - an AS/NZS 60335-family test report;
  - EMC evidence;
  - a certified Level 3 mains cord.
- **An external plug-pack would itself be Level 3.** This builds on the earlier-round EESS analysis.
- **Desky's "R22210"** could be verified on the EESS Platform from an Australian browser.

### Gaps
- No certificate-level confirmation of any manufacturer's SAA/RCM approval: the EESS certificate search and certifier registers were not reachable.
- The manufacturers behind Desky, FlexiSpot AU, Advwin and Artiss could not be read from EESS.
- No AS/NZS 60335 / 62368 test reports were found for any candidate.

---

## Q5. Realism check: will a real column or frame factory take 100–300 desk sets, at what price and terms?

### Takeaway
**Jiecang:**
- It does sell small quantities through its own MIC storefront: MOQ 5; complete dual-motor desk at **US$159 each at 100–499 units** (about A$229).
- Its filings say new overseas customers normally **prepay 100% at order signing**. Even its largest US brand customers paid 100% before telex release in 2018.

**Kaidi:** sells only direct to manufacturers and brands, with no public small-order terms.

**Loctek:** a poor fit, because of channel conflict with FlexiSpot AU and the online-channel restrictions it signs with ODM customers.

**Realistic FOB prices, 100–300 units:**
- About US$75–110 for an assembler's dual-motor frame (Prorials US$76, Weise US$84–87, Lumi frame US$75–95).
- About US$90–130 for frame plus a 140×70 particleboard top (Lumi complete desk US$99–129; a top adds an estimated US$12–30).
- About US$159 for Jiecang-direct.
- Brand-scale ODM averages were RMB 950–1,330 per smart-office set (Kaidi 2017–19). The 2018 US customs averages behind Jiemian's report were US$78–95 per set.

### Cited Findings
- **Jiecang overseas payment terms (prospectus):** "在外销市场，公司通常要求新客户在签订订单时预付全部的货款，对于重要的战略性客户，公司通常给予 1-2 个月左右的账期". Pricing is cost-plus; terms are FOB — [Jiecang prospectus](https://pdf.dfcfw.com/pdf/H2_AN201808191180596187_1.pdf)
- **Jiecang top-customer credit terms (2018 H1):** AMQ, Fully, The Human and HAT were all "到港电放前付 100%全款"; HNI had "离港后 60 天内付款" — [Jiecang prospectus](https://pdf.dfcfw.com/pdf/H2_AN201808191180596187_1.pdf)
- **Jiecang average selling price for 智慧办公驱动系统:** RMB 1,391.90 (2015), 1,327.28 (2016), 1,306.70 (2017), 1,228.75 per unit (2018 H1) — [Jiecang prospectus](https://pdf.dfcfw.com/pdf/H2_AN201808191180596187_1.pdf)
- **Jiemian's customs comparison (an allegation, with no company rebuttal reported):** 2018 H1 bills of lading imply an average of US$94.73/set for HAT Contract and US$77.80/set for Fully, against the prospectus's RMB 1,228.75 — [Jiemian](https://m.jiemian.com/article/2484732.html)
- **Kaidi implied average price per smart-office set (my arithmetic from the prospectus table):**
  - Fellowes 2019: RMB 67.6254M / 55,770 ≈ RMB 1,213.
  - Teknion 2019: ≈ RMB 1,123.
  - 东莞创健达 2019: ≈ RMB 951; 2018: ≈ RMB 711.
  - ESI 2018: ≈ RMB 1,328.
  - Source: [Kaidi prospectus](https://pdf.dfcfw.com/pdf/H2_AN202005171379856182_1.pdf)
- **Jiecang MIC storefront terms:**
  - MOQ "5 Pcs"; payment "LC, T/T, D/P, PayPal, Western Union, Small-amount payment"; lead time "one month".
  - Quote routing: "You need to send up information, we will let our regional sales to contact with you".
  - JC35TS-R13R desk: US$179 / 159 / 129.
  - Source: [MIC Jiecang desk](https://jiecang.en.made-in-china.com/product/ewtfMmyoEWhc/China-Jiecang-Dual-Motor-Luxury-Height-Adjustable-Executive-Standing-Desk.html)
- **Prorials:** "30%的T/T预付款，剩余70%… 在交付前一次性支付" — [cn.prorials.com](https://cn.prorials.com/). Dual frame US$76/75/74, MOQ 100; samples about 10 days, bulk about 35 days after payment — [MIC Prorials](https://chinapurui.en.made-in-china.com/product/JRbUSIKobqVf/China-Fast-Lift-Dual-Motor-Electric-Height-Adjustable-Standing-Office-Desk-Frame.html). Standard orders take "10–35 days" — [Prorials profile](https://www.prorials.com/company-profile.html)
- **Lumi:** complete 3-stage dual desk US$99–129, MOQ 100, sample US$129; "bulk orders are approximately 45 days after receipt of payment"; T/T or L/C — [MIC Lumi desk](https://lumi2007.en.made-in-china.com/product/MolxpvyJXUDj/China-Modern-Home-Office-Furniture-Wholesale-3-Stage-Dual-Motors-Electric-Standing-Table-Gaming-Desk.html)
- **Trader / other storefront list prices (earlier round, 9 Oct 2026):**
  - Egrospace complete dual-motor desk: US$125.94–143.93 and US$182.81–208.93.
  - Foshan Hanlong: US$239–258 (MOQ 2).
  - Sources: [MIC Egrospace](https://egrospace.en.made-in-china.com/product/iAjUPLGbhycH/China-Egrospace-Sit-Electric-Stand-Height-Adjustable-Table-Electrically-Dual-Motor-Standing-Desk.html), [MIC Electric Standing Desk](https://www.made-in-china.com/products-search/hot-china-products/Electric_Standing_Desk.html)
- **Desktop input:** Wanhua Ecoboard office desk top US$12–28 (MOQ 1) — [MIC Ecoboard](https://ecoboard.en.made-in-china.com/product/oXTQvkrSazYA/China-Modern-Office-Desk-Top-Modern-Office-Table-Top.html)
- **Jiecang's US channel today runs through its own subsidiaries (ImportGenius)** — [ImportGenius Xinchang Jiecang I&E](https://www.importgenius.com/suppliers/xinchang-jiecang-import-and-export), [ImportGenius Jstar Motion](https://www.importgenius.com/suppliers/jstar-motion-sdn-bhd):
  - XINCHANG JIECANG IMPORT AND EXPORT → J-STAR MOTION CORPORATION: 4,101 containers, latest 2026-10-08.
  - JSTAR MOTION SDN BHD (Malaysia) → J-Star Motion Corp (909), HAT/Human Active Technology (456), UPLIFT (616).
  - Smaller brands (Element Ergo 76, 247 Workspace, Secretlab) also receive direct lots.
- **Kaidi ships direct to brands in container lots:** about 22 t per lot to Teknion, "STEEL FRAME / CONTROL BOX / HANDSET", 2026-09 — [ImportGenius Kaidi](https://www.importgenius.com/suppliers/changzhou-kaidi-electrical-inc)
- **Kaidi channel:** "直销" is 100% of main-business revenue — [Kaidi 2025 AR](https://pdf.dfcfw.com/pdf/H2_AN202604291821754028_1.pdf)
- **Jiecang distributors:** regional distributors SAPEC, Ahti Vesalainen Oy, Mehr Pooyan and BIBUS on "买断式销售" terms — [Jiecang prospectus](https://pdf.dfcfw.com/pdf/H2_AN201808191180596187_1.pdf). No Australian distributor was named.
- **Loctek:** "与 ODM/OEM 客户签订线上渠道限制条款" — [Loctek prospectus](https://pdf.dfcfw.com/pdf/H2_AN201711201053206901_1.pdf). Its FlexiSpot PTY. LTD. sells in Australia — [Loctek 2026 H1](https://pdf.dfcfw.com/pdf/H2_AN202608280006758408_1.pdf)

### Inferences
**Price gap: Jiecang-direct vs an assembler (my arithmetic)**
- At 100–274 units, Jiecang-direct costs about US$159 per complete desk, against roughly US$100 for an assembler's frame plus a separately sourced top.
- That is a gap of about US$50–60, or about A$75–85 per desk at 1.4376.
- On the earlier round's model, where FOB US$115 cut LCL-100 gross profit (GP) to A$24.75, a US$159 FOB would push the A$299 Marketplace price to roughly break-even or a loss on a 100-unit LCL order. Break-even FOB was US$131.7 for LCL-100 and US$164.4 for a full 40HQ.
- So Jiecang-direct only works near container scale, or at a higher selling price.

**Terms to plan for**
- Expect 100% T/T before shipment (or before telex release) from Jiecang, and 30/70 from Prorials.
- Lead times: about 30–45 days, plus samples (US$129–350).
- QC: pre-shipment inspection by a third party (earlier round's A$400 per factory). Ask for test reports matching the exact control-box model.

**What the frame price means**
- The US$75–110 assembler frame prices are similar to the 2018 customs-implied US$78–95/set that Jiecang's largest US brands paid. List prices below about US$70 for dual-motor frames are suspect for spec cuts (motor wattage, tube wall thickness).

**Practical route**
- Ask Jiecang's regional sales for a 100–274-set quote on a standard kit. As a fallback, buy from Prorials or Lumi, but require them to name the column/controller maker and supply its certificates.
- **Scale check:** the brands Jiecang and Kaidi serve directly import tens to thousands of containers each (UPLIFT 616 from JSTAR, Teknion 133 from Kaidi). Small brands like Element Ergo (76 containers) do get direct Jiecang shipments.
  - A 100–274-desk order is roughly 0.4–1 × 20GP. That makes it a "sample/trial" order in this channel: accepted at list price via MIC, unlikely to win ODM terms.
  - Ningbo Yunqi-type trading offices exist precisely to aggregate such small orders. This is inference from the customs pattern.

### Gaps
- No confirmed written quote. Jiecang's 100–499 tier is a list price, and no RFQ was sent (contacting suppliers was out of scope).
- Kaidi, Loctek and TiMOTION small-order MOQ and price.
- Whether Jiecang's SAA certificates cover the JC35TS desk kit specifically.
- Current (2026) customs unit values for Jiecang, Kaidi and Loctek shipments. ImportGenius public pages show weights and carton counts but no values, and full data is paywalled; ImportYeti is blocked.
- Weight per carton does fit dual-motor frame kits, e.g. an UPLIFT lot of 1,248 cartons at 40,098 kg ≈ 32 kg/carton (my arithmetic). Prorials lists 25 kg gross for its frame carton.

---

## Q6. Why so many storefronts show the same dual-motor frame

### Takeaway
Many storefronts show the same frame because a handful of column/controller makers sell standard drive kits (columns, control box, handset) to many assemblers and brands, which then add their own feet, crossbars, tops and logos.

Jiecang, which led the drafting of China's industry standard for electric lifting desks, is the reference design. UPLIFT's frames carry a Jiecang JCB35-series control box.

Spec sheets converge as a result: Prorials and Lumi both list 620–1280 mm three-stage frames. But no individual storefront's frame could be traced to a specific column maker without labels or teardown.

### Cited Findings
- **Jiecang and the standard:** Jiecang "牵头起草了…《电动升降桌》行业标准" — [jiecang.cn](https://www.jiecang.cn/)
- **Jiecang sells kits, not finished desks:** its drive products go to brands that add their own desktops (The Human, HAT Contract) — [Jiecang prospectus](https://pdf.dfcfw.com/pdf/H2_AN201808191180596187_1.pdf)
- **One kit maker, many buyers:** Kaidi sells smart-office drive-system sets to brands (Fellowes, Teknion) and to Chinese desk assemblers (东莞市创健达 17,327–43,487 sets/yr; 乐联; 再兴电子) — [Kaidi prospectus](https://pdf.dfcfw.com/pdf/H2_AN202005171379856182_1.pdf)
- **UPLIFT label:** "Uplift Desk JCB35N2-110" control box — [eBay](https://www.ebay.de/itm/405964185266); Jiecang JCB35 controller family — [DirectIndustry](https://www.directindustry.com/prod/jiecang-linear-motion/product-233233-2744784.html)
- **Jiecang's own desk** model is "JC35TS-R13R" (595–1245 mm, 1250 N) — [MIC Jiecang desk](https://jiecang.en.made-in-china.com/product/ewtfMmyoEWhc/China-Jiecang-Dual-Motor-Luxury-Height-Adjustable-Executive-Standing-Desk.html)
- **Converging spec sheets:**
  - Prorials dual frame: "620-1280mm", 120 kg, 25 mm/s, 50×80 mm legs, 1.5 mm wall, 6-button handset with 2 presets. Its attribute block says "Stages 2" while its spec says "3 Stages" — [MIC Prorials](https://chinapurui.en.made-in-china.com/product/JRbUSIKobqVf/China-Fast-Lift-Dual-Motor-Electric-Height-Adjustable-Standing-Office-Desk-Frame.html)
  - Lumi M08-23DE: "620~1280mm", three-stage, columns "40X70, 45X75, 50X80mm", 100 kg, 38 mm/s — [MIC Lumi desk](https://lumi2007.en.made-in-china.com/product/MolxpvyJXUDj/China-Modern-Home-Office-Furniture-Wholesale-3-Stage-Dual-Motors-Electric-Standing-Table-Gaming-Desk.html)
- **One kit maker shipping to many US desk brands under different names (ImportGenius, 2024–26):**
  - Jiecang Malaysia → UPLIFT, HAT/Human Active Technology, Element Ergo, BestQi.
  - Jiecang China → J-Star (redistribution), Secretlab, 247 Workspace, Bush — [ImportGenius Jstar Motion](https://www.importgenius.com/suppliers/jstar-motion-sdn-bhd), [ImportGenius Xinchang Jiecang I&E](https://www.importgenius.com/suppliers/xinchang-jiecang-import-and-export)
  - Kaidi → Teknion, ESI; TiMOTION → "DESK LIFT FRAMES" to Ergo Industrial Seating — [ImportGenius Kaidi](https://www.importgenius.com/suppliers/changzhou-kaidi-electrical-inc), [ImportGenius TiMOTION](https://www.importgenius.com/suppliers/timotion-technology-co-ltd)
  - Trading office Ningbo Yunqi ships "LIFTING COLUMN HAND CONTROLLER DESK TOP" to several small US brands (Uncaged Ergonomics, Autonomous, Clouds Grande) — [ImportGenius Yunqi](https://www.importgenius.com/suppliers/ningbo-yunqi-innovation-intelligent)
- **Other brands use other kits:** Autonomous uses TiMOTION electronics on Aoke frames — [BTOD](https://www.btod.com/blog/autonomous-pro-vs-jarvis-desk). Vari buys from Taiwanese suppliers — [ImportYeti Varidesk](https://www.importyeti.com/company/varidesk)

### Inferences
- The identical storefront frames are most likely a few kit designs (Jiecang JC35/JCB35-type, Kaidi, TiMOTION, Xinyi and others) wrapped in similar fabricated steel by several assemblers and trading offices.
- Customs show the same Jiecang Malaysia kit reaching at least four US brands. Assembler Aoke uses TiMOTION electronics. A Ningbo trading office ships "lifting column + hand controller + desk top" sets to several small brands.
- The identical 620–1280 mm figure on Prorials' and Lumi's three-stage frames points to a common column stroke from shared column suppliers. This is inference, not proof.
- To find the true source of a given SKU, ask for the control-box and handset model numbers and the column maker's label photo before ordering. For example, a "JCB…" control-box prefix is Jiecang's naming (as in UPLIFT's JCB35N2 and Jiecang's JCB35M11C). Then cross-check against the maker's catalogue and certificates.

### Gaps
- No teardown, label photo or bill of materials was obtained for Prorials, Lumi, Weise or any other storefront frame. The column maker behind the common storefront design is therefore inferred, not traced.
- Not done: a systematic comparison of the control-box model numbers shown in MIC/Alibaba product images. Images were not analysed, and the search quota ran out.
