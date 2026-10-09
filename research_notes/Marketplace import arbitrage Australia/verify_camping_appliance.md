# Independent verification: camping/4WD and appliance shortlist (recovery kit, camp kitchen, pressure washer)

*Verifier notes, 2026-10-09.*

**Scope:** re-check price floors, factory FOB/CBM and compliance for the three shortlisted SKUs from vertical_camping_4wd.md and vertical_appliances_emobility.md; recompute GP on the shared base assumptions; give CONFIRMED / REVISED / BROKEN verdicts. All prices are as observed on the date stated (AUD incl. GST at retail). "ASSUMPTION" or "ESTIMATE" marks uncited inputs.

**Access on 2026-10-09:**
- *Fetched directly:* BCF, Supercheap Auto, Aldi, Made-in-China, legislation.gov.au, the EESS PDF, and OzBargain RSS.
- *Fetched in part:* Amazon AU Best Sellers. Product pages carried no buy-box offers to this fetcher (location), and later requests got "Server Busy"/503 bot pages, which were not bypassed. 4WD Supacentre came via WebFetch.
- *Blocked:* Bunnings, Kmart, Kogan, Repco, productsafety.gov.au and ACMA (403 or empty reply); Anaconda (redirect loop). Data for these comes from search summaries, labelled.

## Q1. Shared base cost model used for every SKU

### Takeaway
All three SKUs were recomputed with one script (econ_verify.py) on the coordinator's shared base, so results are comparable across verification files. The SKU-specific inputs and costs are listed below, and every uncited input is labelled. The main change from the original notes is not the freight model. It is (a) lower live price floors and (b) compliance and testing lines the originals left out or under-costed.

### Cited Findings
- **FX:** RBA F11.1, AUD/USD 0.6956 on 8 Oct 2026, so US$1 = A$1.4376. — [RBA F11.1 CSV](https://www.rba.gov.au/statistics/tables/csv/f11.1-data.csv) (as recorded in vertical_appliances_emobility.md)
- **EESS fees** from 1 Jul 2026: Responsible Supplier A$239.74/yr; Level 2/3 equipment registration A$89.85/yr. — [EESS registration fees](https://www.eess.gov.au/registration/registration-fees/) (via vertical_appliances_emobility.md)
- **ChAFTA:** 100% tariff elimination since 1 Jan 2019, but only with a valid Certificate of Origin held at import. — [DFAT ChAFTA guide](https://www.dfat.gov.au/trade/agreements/in-force/chafta/doing-business-with-china/guide-to-using-chafta-to-export-or-import) (via vertical_camping_4wd.md)
- **Shared base** (from the coordinator's brief, not re-derived here):
  - 40HQ A$148/CBM × 68 CBM usable = A$10,064 per box
  - 20GP A$211/CBM × 28 CBM usable = A$5,908 per box
  - LCL A$244 per W/M (greater of CBM or tonnes) + A$900 per shipment
  - Duty 0% (5% sensitivity); net revenue = price ÷ 1.1; no Marketplace fee
  - Inspection A$400 per factory per order; handling A$5/unit
  - Defect allowance 3% of landed cost (5% used for the pressure washer)

### Inferences
**Formula used**
- Landed/unit = FOB × 1.4376 + duty + freight ÷ units + inspection ÷ units + fixed compliance ÷ units + per-unit compliance (labels/plugs)
- Total cost/unit = landed × (1 + defect %) + A$5 handling
- GP = price ÷ 1.1 − total cost; GP% is of net revenue
- Cash = FOB + per-unit compliance + duty + freight + inspection + fixed compliance, all ex-GST. Recoverable import GST is not included.

**SKU-specific inputs**

| SKU | CBM / kg per unit (source) | Per-unit compliance | Fixed compliance per order |
|---|---|---|---|
| Recovery kit | 0.025 / 10 (ESTIMATE from X-BULL 11-pc Amazon package 0.0237 CBM, 11.9 kg) | US$1 labels/print (ASSUMPTION) | A$2,500 break tests (ASSUMPTION) + A$1,500 liability cover (ASSUMPTION); grid also shows A$1,000 |
| Camp kitchen | 0.0547 / 12 (Eto/Dashing listings) | none | none |
| Pressure washer | supplier listing per model | US$1 AU plug/RCM label (ASSUMPTION) | Scenario A A$739.74 (RS A$239.74 + A$500 review); Scenario B + A$5,000 testing (ASSUMPTION) |

**Mode choice**
- **Recovery kit:** LCL is cheaper than a 20GP up to about 800 kits.
- **Camp kitchen:** a 20GP wins at 500 units (27 CBM).
- **Pressure washer:** LCL at 300–500 units; a 20GP holds about 1,300 TOLHIT units.

### Gaps
- Freight rates are the brief's shared assumptions, not new quotes.
- Liability insurance is shown only for the recovery kit, where safety exposure is highest. For the others, add about A$1,500 ÷ units if insured.

## Q2. SKU 1: 4WD recovery kit (8–11 piece): price floors, factories, landed GP

### Takeaway
**REVISED (downgraded). Score 6 → 4.**
- **Price floor:** the cheapest comparable new kit is now the Super Retail Group house-brand **XTM 7-piece at A$119.99** (Club price, free sign-up; BCF and Supercheap, 191 reviews). On Amazon AU the cheapest is a **Kings Hercules kit + LED light at A$148.95**. The original's A$169–179.90 Amazon anchor could not be found live. The A$139 target therefore breaks the brief's own pricing rule; the realistic Marketplace price is A$99–119.
- **Compliance:** adding the mandatory strap-labelling regime (Q3), independent break tests and liability cover takes **100 kits to −10% GP at A$119**. Positive margins need **200+ kits** (about 15% at A$119, about 7% at A$109) or a full 20GP (about 41% at A$119, about 30% at A$99; A$63k cash).
- **Supplier risk:** Thinkwell's US$35 kit is unitemised. A fully itemised kit with a snatch block (Tianshun, US$80–90) is loss-making at any realistic price.

### Cited Findings
**Price floors (all observed 2026-10-09; prices include GST)**

*BCF / Supercheap Auto (Super Retail Group): the binding floor*
- **XTM 7 Piece Recovery Kit** (PLU 600254) at BCF: **$149.99, or $119.99 Club Price**. "To access Club exclusive prices, login or sign up for free now!"
  - Contents: 8T 9m snatch strap; 10T 3m tree trunk protector; 4.5T 10m winch extension; 8T snatch block; 2 × 4.7T bow shackles; a dampener that doubles as the carry bag. "Gloves not included."
  - Shackles: "C45 Carbon steel … Compliant to AS/NZS 2741.2002 Standard".
  - 191 reviews.
  - Delivery: flagged "bulky item", so excluded from free shipping over $120. 1-hour Click & Collect is available. — [BCF XTM 7 Piece](https://www.bcf.com.au/p/xtm-7-piece-recovery-kit/600254.html)
- Same kit at Supercheap Auto: **$169.99, or $119.99 Club Price**. The page says the kit "complies with AS/NZS 2741:2002". — [Supercheap XTM 7 Piece](https://www.supercheapauto.com.au/p/xtm-4x4-accessories-xtm-7-piece-recovery-kit/600254.html)
- **XTM 4 Piece Snatch Kit:** $99.99, or $69.99 Club, at both BCF and Supercheap. — [BCF search "recovery kit"](https://www.bcf.com.au/search?q=recovery%20kit); [Supercheap search "recovery kit"](https://www.supercheapauto.com.au/search?q=recovery%20kit)
- Other kits on the same BCF search:
  - XTM Kinetic Rope and Soft Shackle 4 Piece Kit $199.99 ($99.99 Club)
  - XTM Soft Shackle 16,000kg $39.99 ($29.99 Club)
  - Maxtrax Compact Recovery Kit 7 Piece $349
  - HardKorr Large Recovery Kit $478.99 — [BCF search](https://www.bcf.com.au/search?q=recovery%20kit)

*4WD Supacentre (Kings / Hercules), via WebFetch; curl received only a JS shell*
- Hercules Complete Recovery Kit, 11-piece: **$199.00**
- Kings Hercules Complete Recovery Kit + Rechargeable LED Work Light: **$179.16** ("was $223.95 sold separately")
- Kings Soft Shackle & Kinetic Rope Kit: $149.00
- Hercules 8,000kg snatch strap "NATA-tested": $59.95; 11,000kg: $74.95
- Kings Recovery Tracks 1100mm: $199.00; tracks + canvas bag $191.16
- The page also shows "Pay Wholesale" trade prices, which were not captured. — [4WD Supacentre winches & recovery](https://www.4wdsupacentre.com.au/4wd/winches-recovery.html)
- Hercules 11-piece contents (Amazon listing copy): winch dampener, 10m extension strap, tree trunk protector, snatch strap, snatch block, bow shackles, folding shovel, Kwiky tyre deflator, heavy-duty gloves, recovery bag; "All Components Independently Tested". — [Amazon AU B0B453RDLK](https://www.amazon.com.au/dp/B0B453RDLK)

*Amazon.com.au, Best Sellers "Recovery Straps" (node 14632514051): price = lowest listed offer*

| Listing | Price | Rank | ASIN |
|---|---|---|---|
| Kings "Hercules Complete Recovery Kit + Adventure Kings Rechargeable LED Work Light" | **$148.95** | #20 | B0B453RDLK |
| **X-BULL Winch Accessories Kit 11Pcs** (85 ratings, 4.6★) | **$159.00** | #26 | B0725CKB83 |
| Hercules 4WD Complete Recovery Kit + 48L Dirty Gear Bag | $199.16 | #25 | — |
| X-Bull tracks + kit 13Pcs | $219.00 | — | — |
| X-Bull tracks + kit 15Pcs | $239.00 | — | — |
| Generic "Recovery Tracks Kit … Tow Strap Winch Damper Folding Shovel" | $209.00–225.00 | — | — |

— [Amazon AU Best Sellers: Recovery Straps](https://www.amazon.com.au/gp/bestsellers/automotive/14632514051)

*Amazon.com.au, loose components (same list plus "Towing Ropes" node 4958248051)*
- OZtrail Offroad 8T snatch strap 9m×60mm: $51.68. Its listing copy repeats the mandatory 2–3× GVM wording.
- OZtrail tree trunk protector 3m×75mm 12T: $36.19
- Tree saver 2.4m 13,610kg: $20.82
- VEVOR 2 × D-ring shackles: $23.99; VEVOR 2 × soft shackles: $23.90
- Winch extension 20m×50mm 5,000kg: $30.00
- HORUSDY 18T/"40,000LB" snatch strap: $58.99 (US-style lb rating)
- X-BULL recovery tracks pair: $75.00 — [Amazon AU Best Sellers: Towing Ropes](https://www.amazon.com.au/gp/bestsellers/automotive/4958248051); [Recovery Straps](https://www.amazon.com.au/gp/bestsellers/automotive/14632514051); [OZtrail strap B0H4W4ZPLS](https://www.amazon.com.au/dp/B0H4W4ZPLS)

*Amazon search and the original's A$169 floor*
- Amazon search pages (served as "Deliver to United States") showed US cross-border kits, e.g. Nilight kit $207.58 and NIXFACE kit $189.04. — [Amazon AU search](https://www.amazon.com.au/s?k=4wd+recovery+kit)
- The original's Amazon floor, Hercules nylon kit B07PB8CL79 at $169/$179.90, could **not be re-verified**. Its page and the all-offers panel show "No featured offers … no other sellers matching your location". That message appeared for every ASIN tested, including ones priced on Best Sellers, so it reflects the fetcher's US location, not true unavailability. — [Amazon AU B07PB8CL79](https://www.amazon.com.au/dp/B07PB8CL79)

*Retailers not reachable*
- Bunnings, Kogan and Repco returned HTTP 403.
- Setting an Amazon AU delivery postcode triggered an HTTP 202 bot-check interstitial, which was not bypassed. **Amazon delivery fees and sellers are therefore unknown.**
- The coordinator's benchmark file (au_retail_price_benchmarks.md, cross-checked 2026-10-09) has no recovery-kit, camp-kitchen or pressure-washer rows. Its method notes match these: BCF/SCA Club prices are shown on tiles, and the Amazon postcode change hits a bot check.

**Factories (Made-in-China.com, fetched 2026-10-09; listed prices, not negotiated; Incoterms mostly unstated)**
- **Qingdao Thinkwell Hardware & Machinery Co., Ltd.**
  - "4X4 off Road Recovery Tow Strap Recovery Kit": **US$35.00 for 100–499 sets; US$32.00 for 500+**.
  - "Loading Weight 8T"; contents **not itemised**; MOQ "100PCS per Size".
  - "Testing Report Avabliable"; "Main Market North American, EU and Austrilia".
  - "Carton with Pallet", no carton dimensions; HS 7326909000; 500 sets/day; delivery 10–20 days.
  - Self-described "Manufacturer, trading" with ISO9001/CE/BV/SGS; "factory covers an area of 10,000 square meters".
  - Its core line is rigging hardware (shackles, pulleys, hitches), which suggests it makes the steel parts and buys in the webbing (inference). — [Thinkwell kit](https://thinkwell.en.made-in-china.com/product/LoUEjqrvhwtf/China-4X4-off-Road-Recovery-Tow-Strap-Recovery-Kit.html)
  - Other Thinkwell kit listings: "4X4 off Road Recovery Towing Kit" US$20 at MOQ 200 sets; several "winch kits" US$15–34 at MOQ 500 sets, contents unspecified. — [MIC search "4X4 Recovery Kit"](https://www.made-in-china.com/products-search/hot-china-products/4X4_Recovery_Kit.html); [Thinkwell Heavy Duty kit](https://thinkwell.en.made-in-china.com/product/tSgnBZmTqJfK/China-Thinkwell-Heavy-Duty-4X4-Offroad-Recovery-Kit.html)
- **TIANSHUN MACHINERY CO., LTD** (#670 Liyu Road, Jinhua, Zhejiang; "Suppliers with verified business licenses"; member since 2022)
  - Main products: gas cylinders, winches, 4X4 accessories.
  - Itemised winch recovery kit: **US$90 for 100–999 sets; US$80 for 1,000+**. Contents:
    - 50mm×20m polyester strap (extension)
    - 60mm×9m polyester strap
    - 75mm×3m tree trunk protector
    - 75mm×7m nylon strap
    - 10t snatch block, gloves, hitch receiver + bow shackle, tyre deflator
  - "Specification 11ton"; HS 56074900; off-season lead time 15 working days; FOB/CFR/CIF/EXW offered.
  - "off-Road 10PCS Winch Recovery Kit" US$75 (MOQ 50 sets).
  - Separate nylon 7–12 t snatch straps are "Negotiable", MOQ 100. — [Tianshun kit](https://zjtswinch.en.made-in-china.com/product/wFDtbZBTMfoh/China-off-Road-Vehicle-Recovery-Kit.html); [Tianshun 10PCS](https://zjtswinch.en.made-in-china.com/product/GXbQAlYuVnrF/China-off-Road-10PCS-Winch-Recovery-Kit-for-Jeep-4X4.html); [MIC search "Snatch Strap"](https://www.made-in-china.com/products-search/hot-china-products/Snatch_Strap.html)
- **Component makers on the same search:**
  - Taizhou Boyuan Rope Net Factory: nylon kinetic recovery rope US$22–26 (MOQ 50)
  - New Coast (Yangzhou) Rope: "8 Ton … 75mm 3m 6m 9m Snatch" strap US$2.80–10.50; kinetic strap + soft shackles US$30–55 per bag
  - Ningbo YoungHunter: nylon recovery strap US$18 (MOQ 2)
  - — [MIC search "Snatch Strap"](https://www.made-in-china.com/products-search/hot-china-products/Snatch_Strap.html)
- **Qingdao Workercare Tools Manufacture Co., Ltd.** (tracks for the bundle)
  - Re-confirmed: **US$19.70/pair for 100–499; US$18.50 for 500–1,399; US$17.50 for 1,400+**.
  - 5.6 kg/pair; carton 110×33×13 cm (0.047 CBM); 670 pairs/20GP.
  - Manufacturer/Factory & Trading; Diamond since 2014; Audited Supplier. — [Workercare tracks](https://workercare.en.made-in-china.com/product/FAWpjcSHnJYX/China-Recovery-Traction-Tracks-Tire-Ladder-for-Sand-Snow-Mud-4WD.html)
- **CBM anchor:** no kit supplier gives carton data.
  - The X-BULL 11-piece kit's Amazon listing gives package 37.29 × 34.5 × 18.4 cm (**0.0237 CBM**) and **11.92 kg**. That kit includes a hitch receiver, snatch block, shovel and deflator. — [Amazon AU B0725CKB83](https://www.amazon.com.au/dp/B0725CKB83)
  - Amazon ranks: X-BULL kit 92,463 in Automotive; Kings Hercules + light 71,292. — same pages; [B0B453RDLK](https://www.amazon.com.au/dp/B0B453RDLK)

### Inferences
**1. Price to beat has moved down**

| Channel | Cheapest comparable kit | Price |
|---|---|---|
| Amazon AU | Kings Hercules kit + LED light (10+ pieces incl. snatch block) | **A$148.95** |
| Amazon AU | X-BULL 11-piece | A$159 |
| Specialist retail (binding floor) | XTM 7-piece at BCF/Supercheap, Club price (free sign-up), 1-hour Click & Collect, 191 reviews | **A$119.99** |
| Specialist retail | XTM 7-piece, non-member price | A$149.99 / A$169.99 |
| Kings direct | Hercules kit + light | A$179.16 |
| Kings direct | Hercules 11-piece | A$199 |

- The original's A$169 / A$179.90 Amazon anchor could not be found live.
- The brief's rule (10–20% under the cheapest comparable new item on Amazon AU) gives **A$119–134**.
- Against the XTM Club price, a no-name Marketplace kit realistically needs **A$99–109**.
- **The original A$139 target is above both** and no longer meets the brief's pricing rule.

**2. Shared-base recomputation** (FX 1.4376; LCL A$244/W/M + A$900; 0% duty; A$400 inspection; 3% defect; A$5 handling)
- **Inputs:**
  - FOB Thinkwell US$35 + US$1 labels/print (ASSUMPTION)
  - 0.025 CBM and 10 kg per kit (ESTIMATE from the X-BULL package)
  - Fixed compliance per order A$4,000 = A$2,500 break tests + A$1,500 liability cover (ASSUMPTIONS)
- **Arithmetic, 100 kits by LCL:**
  - FOB A$50.32
  - Freight (2.5 W/M × 244 + 900) ÷ 100 = A$15.10
  - Inspection A$4.00
  - Fixed compliance A$40.00
  - Labels A$1.44
  - **Landed A$110.85**; + 3% = A$114.18; + A$5 handling = **A$119.18 total**
  - At A$139: net A$126.36 → **GP A$7.18 (5.7%)**
  - At A$119: **−A$11.00 (−10.2%)**
  - Break-even sale price A$131.10
  - Cash ex-GST A$11,085
- **First-order sensitivity** (GP A$/unit and % of net revenue):

  | Fixed compliance | Units (LCL) | A$139 | A$119 | A$109 | A$99 | Cash ex-GST |
  |---|---|---|---|---|---|---|
  | A$1,000 (original's test-only figure) | 100 | 38.1 (30.1%) | 19.9 (18.4%) | 10.8 (10.9%) | 1.7 (1.9%) | 8,085 |
  | A$1,000 | 200 | 49.9 (39.5%) | 31.8 (29.3%) | 22.7 (22.9%) | 13.6 (15.1%) | 13,871 |
  | A$2,500 | 100 | 22.6 (17.9%) | 4.5 (4.1%) | −4.6 (−4.7%) | −13.7 (−15.3%) | 9,585 |
  | A$2,500 | 200 | 42.2 (33.4%) | 24.0 (22.2%) | 14.9 (15.1%) | 5.8 (6.5%) | 15,371 |
  | **A$4,000 (verified stack)** | **100** | 7.2 (5.7%) | −11.0 (−10.2%) | −20.1 (−20.3%) | −29.2 (−32.4%) | 11,085 |
  | **A$4,000** | **200** | 34.5 (27.3%) | **16.3 (15.1%)** | 7.2 (7.3%) | −1.9 (−2.1%) | 16,871 |
  | A$4,000 | 300 | 43.6 (34.5%) | 25.4 (23.5%) | 16.3 (16.5%) | 7.2 (8.0%) | 22,656 |

- **Full container** (one 20GP; 28 CBM ÷ 0.025 = 1,120 kits, about 11.2 t):
  - FOB US$32 (500+ tier) + US$1 labels; freight A$5,908 ÷ 1,120 = A$5.28/kit; total cost **A$63.34**
  - GP: **A$63.02 (49.9%) at A$139; A$44.84 (41.4%) at A$119; A$26.66 (29.6%) at A$99**
  - Cash about A$63k ex-GST. 1,120 kits is a large Marketplace sell-through task.
- **Mode choice:** LCL is cheaper than a 20GP per unit up to about 800 kits (freight/unit at 800: LCL A$7.22 vs 20GP A$7.38).
- **5% duty sensitivity** (100 kits at A$119): GP −A$13.59 (−12.6%), i.e. 5% duty costs A$2.52/kit.
- **Fully itemised kit (Tianshun, US$90 incl. snatch block):** landed A$201.88/unit at 100 units. It loses at any price under A$222, so the cheap Thinkwell route only works if its unitemised US$35 kit really matches the XTM/Hercules contents. That is unconfirmed: no snatch block is listed.
- **Kit + tracks bundle** (US$54.70 + labels, two factories, 0.072 CBM, 15.6 kg):

  | Bundles | A$199 | A$179 | A$169 |
  |---|---|---|---|
  | 100 (LCL) | 9.2% | −1.0% | −7.0% |
  | 200 (LCL) | 25.4% | 17.1% | 12.1% |
  | 387 (one 20GP) | 35.9% | 28.7% | 24.5% |

  - Amazon floor for a kit + tracks bundle: generic 15-piece A$209; X-Bull 13-piece A$219. 10–20% under gives A$167–188, which makes A$199 off-rule.
  - BCF Club equivalent: XTM 7-piece A$119.99 + XTM Black Recovery Boards A$97.99 = A$217.98.

**3. Verdict: REVISED (downgraded). Score 6 → 4.**
- The original's ~29–42% GP at A$139 depended on three things:
  1. an Amazon floor (A$169–179.90) that is no longer the cheapest comparable, since BCF/SCA XTM is A$119.99 and Amazon Kings is A$148.95;
  2. a A$1,000 testing line;
  3. treating recovery gear as unregulated.
- With the mandatory strap-standard labelling, real break-testing and liability cover, the realistic case is **A$109–119 at 200 kits: about 7–15% GP, cash about A$17k**. Healthy margins (≥25%) need either 300+ kits or a full 20GP (~30–41% at A$99–119, A$63k cash).
- Still in its favour: small cube, no EESS, no DG, Thinkwell's 10–20-day lead time, and a clear, well-known buyer need.
- Against it: the Super Retail Group house brand sets a A$119.99 branded floor with returns and Click & Collect; Kings runs daily deals; and the importer carries fatality-risk liability.

### Gaps
- Thinkwell kit contents, strap material (nylon vs polyester) and real MBS are unconfirmed; the next step is an itemised quote plus a sample. The US$32 tier needs 500+ sets.
- Kit carton CBM and weight are estimates (X-BULL package used as the anchor).
- Amazon AU delivery fees and sellers could not be captured (location bot check). 4WD Supacentre "Pay Wholesale" prices were not captured.
- Temu, Kogan, Bunnings marketplace and Repco floors were blocked or not readable.
- Marketplace sell-through rates for no-name recovery kits are unknown.

## Q3. SKU 1 safety and liability: recovery straps/shackles, mandatory standard, testing, product liability

### Takeaway
The original analysis said recovery gear had "no specific mandatory standard … (ACL general safety only)". **That is wrong for the snatch strap.**
- **The mandatory standard:** a federal mandatory safety standard has been in force since 2010 (remade 2017). It requires:
  - a permanently fixed strap label naming the **Australian** supplier, with a batch code, the metric MBS and a prescribed pictogram warning;
  - prescribed instructions;
  - packaging that gives the importer's contact details.
- **Enforcement:** non-compliant straps have been recalled (Feb 2024).
- **It is labelling-only, not a performance test.** But because MBS is defined as the load at which the strap fails, a false rating is both a standard breach and a misleading claim.
- **Shackles:** covered only by the voluntary AS 2741.
- **AS/NZS 4380** is a cargo tie-down standard, not a sling or recovery standard. The brief's framing should be corrected.
- **Liability:** the importer is the ACL "deemed manufacturer" of a product whose own mandatory warning says people have been killed. So independent break-testing, lot traceability and product-liability cover are real fixed costs, not optional extras.

### Cited Findings
**A mandatory safety standard applies to the snatch strap. The original notes said none was found; that is wrong.**
- The *Consumer Goods (Motor Vehicle Recovery Straps) Safety Standard 2017* (F2017L01560) is shown as "In force" on the Federal Register (fetched 2026-10-09). It is administered by Treasury and was made 30 Nov 2017 under s104(1) of the Australian Consumer Law. It replaced the 2010 Trade Practices regulations after a 24-month transition. — [Federal Register of Legislation](https://www.legislation.gov.au/F2017L01560/latest/text)
- **Scope:** a "motor vehicle recovery strap" means "a strap, commonly called a snatch strap, for attaching to a bogged vehicle to tow it clear of the bogged situation". "Minimum breaking strength" means "the minimum load necessary to cause the strap to fail". — [Standard text, s5](https://www.legislation.gov.au/F2017L01560/asmade/2017-12-01/text/original/epub/OEBPS/document_1/document_1.html)
- **s8, permanently fixed to the strap** and "clearly visible and legible when the strap is being used":
  - the prescribed warning;
  - the name or logo of the strap's **Australian** manufacturer, importer, distributor or other supplier;
  - a **batch code or serial number**;
  - the **minimum breaking strength in metric units**;
  - the recommendation that MBS be "between 2 and 3 times the gross vehicle mass (GVM)";
  - advice to match the strap to the GVM of the lighter vehicle. — [Standard text](https://www.legislation.gov.au/F2017L01560/asmade/2017-12-01/text/original/epub/OEBPS/document_1/document_1.html)
- **s9, instructions** must say, among other things:
  - consider a nationally recognised 4WD training course or a 4WD club;
  - the strap is not for lifting or conventional towing;
  - strength and stretch drop when the strap is wet;
  - a "recovery damper, heavy bag or blanket must be draped over the strap";
  - passengers must exit and stand clear;
  - the 2–3× GVM recommendation and the warning. — same source
- **s10, packaging** must show the brand or logo, the **name and contact details of the Australian manufacturer/importer/distributor**, the metric MBS and the 2–3× GVM recommendation. — same source
- **s11, the warning:** "WARNING INCORRECT USE MAY RESULT IN INJURY OR DEATH! Vehicle OCCUPANTS and BYSTANDERS have been KILLED by flying projectiles (such as tow balls)…". The wording is fixed and the format is specified: 5 mm bold capitals, a warning triangle with sides of at least 20 mm, and a red no-tow-ball pictogram with a diameter of at least 20 mm. — same source
- The standard has **no performance or break-test clause**. It regulates information only, but the MBS figure on the strap must be true. — same source (inference from the full text read 2026-10-09)
- **History:** Queensland introduced a strap standard in 2008. The national standard started July 2010. The ACCC consulted on options (retain, remake with better warnings, or revoke) from 26 Oct to 25 Nov 2016, and the 2017 remake followed. — [ACCC consultation hub](https://consultation.accc.gov.au/product-safety/review-of-the-mandatory-safety-standard-for-vehicl-1/)
- **Enforcement precedent (via search summary; productsafety.gov.au returns HTTP 403 to this fetcher):** a February 2024 recall of a snatch strap sold through auto-accessory outlets. The stated reason was that the product did "not comply with the mandatory standard … does not include the required warning information on the straps, packaging and instructions". — [Product Safety Australia recall advertisement 23 Feb 2024](https://Productsafety.gov.au/system/files/recall/Recall%20advertisement%20-%2023%20February%202024.pdf); [PSA recovery straps guide](https://www.productsafety.gov.au/consumers/drive-and-ride-safely/motor-vehicle-recovery-straps-guide)

**Other standards named in the brief**
- **AS/NZS 4380:2001** is titled "Motor vehicles – Cargo restraint systems – Transport webbing and components". It covers webbing restraint (tie-down) systems for transport. One catalogue listing shows it **withdrawn 13 Dec 2024**, with a pending revision (via search summary). It is **not** a sling or snatch-strap standard. Retailers cite it for ratchet tie-downs "for load restraint use only". — [Standards Australia store](https://store.standards.org.au/product/as-nzs-4380-2001); [standards.ie listing](https://shop.standards.ie/en-ie/standards/as-nzs-4380-2001-116345_saig_as_as_243210); [TRID record (1996 edition title)](https://trid.trb.org/View/470274)
- **AS 2741-2002 Shackles** is a voluntary standard for forged shackles. It covers material, design, mechanical properties, **marking**, **proof testing** and quality control. The store shows it as "Current" with an "update available" flag (via search summary; the store page is JS-rendered). — [Standards Australia store](https://store.standards.org.au/product/as-2741-2002)
- **Supplier norms for AS 2741 bow shackles:** Grade S drop-forged; WLL and grade marked on the shackle; "proof tested to 2 × WLL, minimum break force 6 × WLL"; 19 mm body / 22 mm pin = 4.7 t WLL. — [Machinery House brochure](https://www.machineryhouse.com.au/print?code=h358); [Bluebottle Marine](https://www.bluebottlemarine.com/products/shackles-bow-screw-pin-galvanised-grade-s.html)
- **Market benchmark for claims:**
  - XTM shackles: "Compliant to AS/NZS 2741.2002" — [BCF](https://www.bcf.com.au/p/xtm-7-piece-recovery-kit/600254.html)
  - Kings Hercules straps: "NATA-tested" — [4WD Supacentre](https://www.4wdsupacentre.com.au/4wd/winches-recovery.html)
  - Dobinsons and CAOS strap listings: tested by "NATA approved" Australian laboratories (via search summary) — [Dobinsons](https://design.dobinsons.com/suspension/categories/accessories/snatch-straps-and-blocks/recovery-snatch-rope-8600kgs-detail); [CAOS 8T strap](https://mygenerator.com.au/product/caos-8t-orange-snatch-strap-75mm-9m)
- **Soft shackles (UHMWPE):** no Australian standard was found.

**Testing cost**
- No published price for a NATA break test of a strap or shackle was found.
- One NATA-accredited Brisbane laboratory's scope covers breaking-load and proof-load tests on rigging such as chain slings, shackles and hooks. Textile straps are not shown in the excerpt (via search summary). — [NATA directory](https://nata.com.au/accredited-organisation/brisbane-laboratory-369-1747/)

**Liability framework (from the parallel landed-cost notes)**
- An importer of goods whose maker has no Australian place of business is the ACL "deemed manufacturer". Quotes can rise for that reason. — [Finder](https://www.finder.com.au/business-insurance-for-importers)
- ACL penalties for businesses run up to the greatest of A$50m, 3× the benefit, or 30% of adjusted turnover. — [MK Lawyers via au_landed_cost_compliance.md](https://mk.com.au/accc-set-to-enforce-mandatory-toppling-furniture-safety-standards-what-furniture-suppliers-need-to-know/)
- Public liability averages about A$39/month for low-risk small businesses. No importer- or recovery-gear-specific premium data was found. — [Upcover](https://www.upcover.com/blog/public-liability-insurance-for-small-business)

### Inferences
**Compliance work a buyer must budget for (all ASSUMPTIONS unless cited)**
1. **Custom strap labels and print.** The factory sews permanent labels carrying the importer's name/logo, a batch code, the MBS in kg/t, the 2–3× GVM text and the s11 warning at the specified sizes. It also prints compliant instructions and a packaging label. Budget US$1.00/kit (ASSUMPTION). This rules out "blank" generic stock with US-style lb ratings unless it is relabelled.
2. **Independent break tests on the first lot,** ideally at an Australian NATA-accredited lab:
   - 1–2 samples each of snatch strap, winch extension, tree protector and soft shackle;
   - a proof test on the bow shackles.
   - Budget **A$2,500 per order** (ASSUMPTION; A$1,000–4,000 range). The original used A$1,000 in its sensitivity row.
   - Repeat per production lot, since each strap carries a batch code and the MBS must stay true.
3. **Product/public liability cover:** A$1,500/yr (ASSUMPTION). That is about 3× the low-risk benchmark, reflecting a fatality-risk product. Some insurers may decline or exclude recovery gear; get a broker quote before ordering.
4. **Shackles:** buy AS 2741-marked Grade S shackles with WLL stamped and proof-test certificates. A kit sold as "8–11 piece" with unmarked Chinese shackles would sit below the XTM and Hercules quality bar that Marketplace buyers can compare against.

**Liability exposure**
- The worst case is not a refund. It is a strap or shackle failure that injures someone, with the importer as deemed manufacturer.
- **Mitigation:** honest MBS from tests, lot traceability, correct warnings, and avoiding "rated"/"NATA" claims that cannot be documented.
- **Bottom line:** compliance is not a blocker, but it adds roughly A$4,000–5,000 of fixed cost to a first order (testing, insurance, labels, samples). Spread over 100 kits that is A$40–50 per kit. This is the main reason the GP below falls versus the original.

### Gaps
- The Feb 2024 recall notice and the PSA recovery-strap guide could not be read directly (HTTP 403). Details come from a search summary.
- No NATA or SGS price list for webbing or shackle break tests was found. Testing cost is an assumption; get 2–3 lab quotes.
- No insurer quote or underwriting guidance specific to vehicle-recovery products was found.
- Whether ACCC/state regulators have run recent compliance sweeps on online-only or Marketplace snatch-strap sellers was not established.

## Q4. SKU 2: Aluminium folding camp kitchen with cupboards: price floors, FOB ladder, 100–200 unit route

### Takeaway
**The core economics hold at MOQ 500:**
- At **A$99**: **about 31% GP** (Welfull US$29.50 in one full 20GP, about A$27.5k cash).
- At A$109: 38%.
- The live floor is lower than the original's A$109 target implies. Super Retail Group's house-brand Wanderer Premium Series Dual Cupboard Kitchen is **A$99 clearance at Supercheap** and **A$129.99 Club at BCF** (229 reviews). Kmart's simpler camp kitchen is A$70 RRP. So **A$99 is the realistic Marketplace price**.

**The original's 100-unit fallback is worse than stated.**
- Ningbo General Union is a trading company. Its real ladder is US$41 at 100–1,999 (US$36 only at 2,000+), and its carton is 0.121 CBM.
- Result: **−7% to −22% GP**, not +8%.

**Viable smaller routes exist:**
- About 300 units by LCL from Ningbo Eto (identical 146×46 cm spec, US$12–30 range, MOQ 300): about **25% GP at A$99** if quoted at ≤US$30.
- About 200 units from Yongkang Dashing, only if it quotes its US$34.71 low end: about **15% at A$99**.

### Cited Findings
**Price floors (observed 2026-10-09 unless stated)**
- **Wanderer Premium Series Dual Cupboard Kitchen** (PLU 520333)
  - BCF: **A$199.99, or A$129.99 Club Price** (free Club sign-up). Flagged "bulky item", so excluded from free shipping over A$120; 1-hour Click & Collect. — [BCF Wanderer Dual Cupboard](https://www.bcf.com.au/p/wanderer-premium-series-dual-cupboard-kitchen/520333.html)
  - Supercheap: **A$99.00, marked Clearance** (229 reviews). — [Supercheap search "camp kitchen"](https://www.supercheapauto.com.au/search?q=camp%20kitchen); [Supercheap product](https://www.supercheapauto.com.au/p/wanderer-wanderer-premium-series-dual-cupboard-kitchen/520333.html)
  - Spec:
    - "twin hanging storage cupboards with mesh doors"
    - 30 kg capacity
    - "Aluminium slat top and shelf"
    - "powder coated steel frame"
    - "removable windshield"
    - open 172×49×110 cm; packed 50×82×16 cm; about 15 kg — same pages
- **Other BCF camp kitchens:**
  - Wanderer Lightweight Kitchen Station A$179.99 (**A$99.99 Club**): aluminium, windshield, 4 side tables, no cupboards; packed 96×22×50 cm; 11.8 kg; 12-month warranty
  - Wanderer Lightweight Premium Camp Kitchen A$249.99 (A$159.99 Club)
  - XTM X-Lite Camp Kitchen A$120 (a 32 kg fridge-slide unit; not comparable)
  - — [BCF Lightweight Kitchen Station](https://www.bcf.com.au/p/wanderer-lightweight-kitchen-station/695963.html); [BCF search "camp kitchen"](https://www.bcf.com.au/search?q=camp%20kitchen&srule=price-low-to-high)
- **Kmart** "Camp Kitchen" (SKU 43566358): **A$30, was A$70**, clearance, online only. Zip side cupboard, MDF shelves, 3 bench tops (via search summary; undated). — [Kmart camp kitchen](https://www.kmart.com.au/product/camp-kitchen-43566358)
- **Amazon AU:** could not be re-verified.
  - Every camp-kitchen request (sporting-goods Best Sellers, the vidaXL B01F1UBEOY page, a search) returned Amazon's "Server Busy" bot page or HTTP 503 on 2026-10-09. These were not bypassed.
  - The original's figures (Costway A$101.90–149.95; vidaXL A$105.99; VEVOR with cupboard A$130.99) came from undated search summaries. — [vertical_camping_4wd.md citing Amazon AU search](https://www.amazon.com.au/camping-kitchen/s?k=camping+kitchen)
- **Others:** no Aldi camp kitchen is current (Aldi search 2026-10-09). Anaconda redirect-looped (bot protection). 4WD Supacentre previously showed no camp kitchen with cupboards. OzBargain's camp-kitchen tag has no deals since 2019. — [Aldi search](https://www.aldi.com.au/results?q=camp%20kitchen); [OzBargain tag feed](https://www.ozbargain.com.au/tag/camp-kitchen/feed)

**FOB ladder (Made-in-China.com, fetched 2026-10-09)**
- **Welfull Group Co., Ltd.** (Hangzhou; Gold member since 2010; "audited by BV")
  - CT016 146×46×80 cm, 19 mm aluminium tube, windscreen + 3 storage cupboards, 30 kg load: **US$25.00–29.50, MOQ 500**.
  - "One PC in One Carry Bag, 10PCS in One Carton" (carton size not given); 30,000 pcs/month; lead time one month peak / 15 working days off-peak; Ningbo/Shanghai. — [Welfull CT016](https://welfull-outdoors.en.made-in-china.com/product/kfFpBKvoLRhH/China-Camping-Kitchen-Table-Aluminum-Portable-Outdoor-Cooking-Table-with-Windscreen-and-3-Storage-Cupboards-for-Outdoor-Activities.html)
  - Other Welfull kitchens: US$23 single removable-cabinet 60×51×98 cm (MOQ 1,000); US$35 3-tier organiser (MOQ 1,000). — [Welfull US$23](https://welfull-outdoors.en.made-in-china.com/product/RtHYrKjyZfVZ/China-Aluminum-Camping-Kitchen-Table-Portable-Cooking-Table-Folding-Kitchen-Cabin-with-Removable-Cabinet-for-Picnic-BBQ-Cooking.html)
- **Ningbo Eto Outdoor Supplies Co., Ltd.** (Audited; member since 2019; address is an office suite in Yinzhou District, so likely a trader)
  - "Kitchen Table with Windshield and Storage Organizer … Camp Cupboard", 146×46×70/80/110 cm: **US$12.00–30.00, MOQ 300**.
  - Package 80×57×12 cm (0.055 CBM), 11 kg; HS 9403200000; 50,000 pcs/month. — [Ningbo Eto](https://eto-outdoors.en.made-in-china.com/product/KmupNtEHOCcT/China-Kitchen-Table-with-Windshield-and-Storage-Organizer-Portable-Folding-Adjustable-Cooking-Table-for-BBQ-Picnic-Camp-Cupboard.html)
- **Ningbo General Union Co., Ltd.** (**Trading Company**; Diamond since 2022; Audited)
  - Aluminium kitchen station with cupboard cabinet: **US$41.00 for 100–1,999; US$36.00 for 2,000+**.
  - Package 40×55×55 cm (0.121 CBM), 18 kg. — [Ningbo General Union](https://mugeneralunion.en.made-in-china.com/product/qmoretMWaSRn/China-Outdoor-Portable-Aluminum-Kitchen-Station-Folding-Camping-Table-with-Cupboard-Cabinet.html)
- **Yongkang Dashing Leisure Products Factory** (Audited; member since 2025)
  - 175×46×70 cm aluminium kitchen table: **US$34.71–45.56, MOQ 100** (the original reported US$28.64–45.56).
  - Carton 80×12×57 cm, 13.45 kg; "20GP:470pcs; 40GP:1120pcs; 40HQ:1320pcs". — [Dashing 175 cm](https://dashingleisure.en.made-in-china.com/product/DriYToZJYaks/China-Outdoor-Aluminum-Lightweight-Collapsible-Portable-Kitchen-Table-for-Camping-Picnic.html)
  - 120×47 cm table with storage bag/cabinet: US$21.32–25.63, MOQ 50; package 49×11×63 cm, 7.5 kg; claims BSCI/WCA audits. — [Dashing 120 cm](https://dashingleisure.en.made-in-china.com/product/srCpXdFukEWl/China-Wholesale-Outdoor-Camping-Hiking-Picnic-Folding-Portable-Kitchen-Cooking-Table-with-Storage-Bag.html)
- **Other listings (search page):**
  - GOOD SELLER Co. (Trading; Diamond since 2010): compact single-cabinet camping kitchen table 20×24×32.3 in, US$20 at 50 units / US$18.90 at 52+ — [GOOD SELLER](https://goodseller-camping.en.made-in-china.com/product/GQHYPwgvqmUV/China-Picnics-BBQ-RV-Traveling-Blue-Cooking-Storage-Cabinet-Kitchen-Camping-Table.html)
  - Market Union Co. aluminium cooking table US$31.86–38.23 (MOQ 200)
  - Ningbo High-Sunway US$22–32 (MOQ 500)
  - Jinjiang Baojia US$28.99–29.99 (MOQ 500)
  - Suzhou Tuoshenghe US$32.80–45.90 (MOQ 50)
  - — [MIC search "Camping Kitchen Table"](https://www.made-in-china.com/products-search/hot-china-products/Camping_Kitchen_Table.html)

### Inferences
**Price to beat**
- A comparable unit (≥146 cm, windscreen, 2–3 fabric cupboards) faces the Wanderer at A$129.99 Club (BCF) and A$99 clearance (Supercheap), with Click & Collect and returns.
- Under the brief's 10–20% rule against Wanderer's A$129.99 Club price, the target is A$104–117. The SCA clearance price, Kmart's A$70 simpler unit and the uncertain Amazon floor (about A$102–131) argue for **A$99** as the realistic Marketplace price, with A$109 as an upside test.

**Shared-base recomputation**
- Inputs: 0.0547 CBM and 12 kg per unit, an ESTIMATE from the identical-spec Eto/Dashing packages. No specific compliance cost (no mandatory standard identified).
- **Worked example, Welfull US$29.50, 500 units in one 20GP:**
  - 27.4 CBM fills the box (A$5,908)
  - FOB A$42.41 + freight A$11.82 + inspection A$0.80 = landed A$55.03; × 1.03 + A$5 = **A$61.68**
  - At A$99: net A$90.00 → **GP A$28.32 (31.5%)**
  - At A$109: A$37.41 (37.8%). At A$89: A$19.23 (23.8%).
  - Cash A$27.5k ex-GST; break-even price A$67.84.
  - 20GP beats LCL here (freight/unit A$11.82 vs A$15.15).

| Supplier / order | A$109 | A$99 | A$89 | Cash ex-GST |
|---|---|---|---|---|
| Welfull US$29.50, 500 units, 20GP | 37.41 (37.8%) | **28.32 (31.5%)** | 19.23 (23.8%) | 27,513 |
| Welfull US$25 (low end), 500 units, 20GP | 44.08 (44.5%) | 34.99 (38.9%) | 25.90 (32.0%) | 24,278 |
| Welfull US$25, full 40HQ (1,243 units) | 48.40 (48.8%) | 39.31 (43.7%) | 30.22 (37.4%) | 55,137 |
| **Ningbo Eto US$30 (top of range), 300 units LCL** | 31.46 (31.7%) | **22.37 (24.9%)** | 13.28 (16.4%) | 18,242 |
| Dashing US$34.71 (if quoted at 200), 200 units LCL | 22.25 (22.5%) | 13.16 (14.6%) | 4.07 (5.0%) | 13,949 |
| Dashing US$45.56, 100 units LCL | −0.51 (−0.5%) | −9.60 (−10.7%) | −18.69 | 9,184 |
| General Union US$41, 100 units LCL (0.121 CBM) | −10.42 (−10.5%) | −19.51 (−21.7%) | −28.60 | 10,147 |
| General Union US$41, 200 units LCL | −3.72 (−3.8%) | −12.81 (−14.2%) | −21.91 | 18,993 |

- **5% duty sensitivity** (Welfull, 500 units, A$99): GP A$26.14 (29.0%).
- **Verdict: REVISED (new numbers). Score held at 5.**
  - **Holds:** the MOQ-500 thesis (≈31% at A$99; ≈38% at A$109).
  - **Fails:** the 100-unit fallback; it is loss-making.
  - **Best smaller route:** about 300 units LCL (A$18k), conditional on a firm quote ≤US$30 from Ningbo Eto or a Welfull concession.
  - **Factors:**
    - Bulky (0.055 CBM), so local pickup is a real advantage; Wanderer is flagged bulky and excluded from BCF free shipping.
    - No compliance burden.
    - Competitor is a well-reviewed SRG house brand whose clearance price already hits A$99.
    - 500 units is a full 20GP (27 CBM) to store and sell through in a seasonal category; storage beyond the A$5/unit allowance is not modelled.

### Gaps
- Amazon AU camp-kitchen floor and delivery fees are unverified (bot page).
- Welfull's carton size and Ningbo Eto's real price within US$12–30 need quotes. CBM is estimated from the Eto/Dashing listings.
- Whether Dashing's 175 cm unit includes cupboards was not confirmed from its listing text.
- Whether SCA's A$99 clearance is a one-off was not established; BCF Club is A$129.99 the same day.
- Kmart and Anaconda live prices could not be fetched.

## Q5. SKU 3: Electric pressure washer (~1800–2000W): price floors, factories, landed GP

### Takeaway
The original's main risk has happened: Bunnings, Aldi, Supercheap and Kmart all sell comparable corded units at or under A$99, well below the Bosch A$169 anchor.
- Ozito 1800W/2030 PSI: A$99 at Bunnings
- Ferrex 1600W: A$89.99 at Aldi, 17 Oct 2026
- ToolPRO 1595 PSI: A$89.99 everyday at Supercheap
- Kmart 1600W: A$55–89
- Ferrex 2000W: A$149 at Aldi, while stocks last

A A$119–139 no-name Marketplace washer is not competitive; the realistic price is **A$89–99**. The original's suppliers also need correcting: the EBIC "1500W" unit has a 1200W brush motor and a European VDE plug.
- **Option that still works:** a 2000W induction unit at about US$34 (Yuyao Goldsen "TOLHIT", MOQ 500) gives roughly **17–25% GP at A$89–99** if an authorised CB/EMC report can be reused. That falls to **4–13%** if new Australian testing is needed. Cash is about A$30–35k.
- **Smaller orders lose money:** 100–200 units of the EBIC 2000W at A$99 is negative.

### Cited Findings
**Price floors (prices include GST)**

*Amazon AU*
- Best Sellers "Outdoor Power Tools" (2026-10-09):
  - **Bosch 1500W 1740 PSI A$169.00** (#5; B07J3PBL31)
  - Kärcher K3 Power Control A$298.50 (#3)
  - BESTSOON 2400W "3800PSI" A$249.99 (#4)
  - Bosch 1500W 1813 PSI A$210.00 (#27)
  - Laneso cordless 48V "1800PSI" A$85.99 (#1)
  - — [Amazon AU BS Outdoor Power Tools](https://www.amazon.com.au/gp/bestsellers/garden/5737302051)
- Pressure Washers node, page 2 (ranks 51–80): cordless or low-pressure units only, e.g. Kärcher OC Handy A$150.07, Bosch Fontus A$359.
  - Page 1 (ranks 1–50) returned Amazon's "Server Busy" bot page twice and WebFetch got HTTP 503. It was not bypassed, so the cheapest corded unit on Amazon outside the Outdoor Power Tools top 30 is unknown. — [Amazon AU BS Pressure Washers p2](https://www.amazon.com.au/gp/bestsellers/garden/5265009051?pg=2)
- Deal history: Bosch 1500W 1813 PSI A$169 (RRP A$199) delivered, posted 19 Aug 2026. — [OzBargain node/971858](https://www.ozbargain.com.au/node/971858)

*Aldi (own site, fetched 2026-10-09)*
- **FERREX High Pressure Washer 1600W A$89.99, "On Sale Sat 17 Oct"**: 135 bar max, 5 m hose, quick connect. — [Aldi Ferrex 1600W](https://www.aldi.com.au/product/ferrex-high-pressure-washer-1600w-000000000000739767)
- **FERREX High Pressure Washer A$149.00, "While Stocks Last"**: "2000W/2175psi", 8 m hose, max 7.5 L/min, automatic stop/start, turbo nozzle and patio cleaner. — [Aldi Ferrex 2000W](https://www.aldi.com.au/product/ferrex-high-pressure-washer-000000000000734502)
- OzBargain posts: Ferrex 2000W A$149 Special Buy (5 Sep 2026) and Ferrex 1600W A$89.99 (posted 3 Oct 2026). — [OzBargain node/973975](https://www.ozbargain.com.au/node/973975); [OzBargain node/977566](https://www.ozbargain.com.au/node/977566)

*Supercheap Auto (fetched 2026-10-09)*
- **ToolPRO Pressure Washer 1595 PSI A$89.99** (house brand, 20 reviews)
- Kincrome K16261 1740 PSI A$179.99; K16262 1958 PSI A$279.99; K16252 2600 PSI A$299 (was A$399)
- Kärcher K2 Premium 1750 PSI A$194.99; K3 Power Control 1950 PSI with deck kit A$399
- — [Supercheap search "pressure washer"](https://www.supercheapauto.com.au/search?q=pressure%20washer&srule=price-low-to-high)
- Kärcher K2 Premium was A$146.24 at Supercheap on 4 Sep 2026; Kärcher K2 VPS A$149 at Repco on 23 May 2026. — [OzBargain node/973933](https://www.ozbargain.com.au/node/973933); [OzBargain node/960354](https://www.ozbargain.com.au/node/960354)

*Bunnings (site returns HTTP 403; via search summary, snapshot undated)*
- The Australian pressure-washer range page lists the **Ozito 1800W 2030PSI High Pressure Washer at A$99**. The same model is NZ$149 on Bunnings NZ (I/N 0254158).
- OzBargain threads from Dec 2021 show the Ozito 1800W and Ryobi 1800W 2000PSI at A$99. — [Bunnings AU pressure washers](https://www.bunnings.com.au/our-range/tools/power-tools/pressure-washers); [Bunnings NZ p0254158](https://www.bunnings.co.nz/ozito-1800w-2030psi-high-pressure-washer_p0254158); [OzBargain node/677434](https://ozbargain.com.au/node/677434)
- Ryobi and Gerni current prices were not found.

*Kmart (site 403; via search summary, undated)*
- "Pressure Washer" 1600W at **A$55 (was A$89)**; "Pressure Washer with Patio Cleaner" A$99. — [Kmart 43502622](https://www.kmart.com.au/product/pressure-washer-43502622); [Kmart 43692910](https://www.kmart.com.au/product/pressure-washer-with-patio-cleaner-43692910/)

**Factories (Made-in-China.com, fetched 2026-10-09; listed prices)**
- **EBIC Tools Co., Ltd. ("Fixtec", Nanjing; established 2003-12-30; member since 2011; Audited Supplier)**
  - The original's SKU, "Fixtec 80-120bar … 1500W", is US$39.48 at MOQ 3, but its spec reads **"Motor 1200W carbon brush motor"**, 80 bar rated / 120 bar max, 6–6.5 L/min, and **"5M Cable with VDE plug"**.
  - Certifications: CE, CB, ETL, RoHS, UR. Package 32×32×40 cm (0.041 CBM), 7 kg. The company profile says "Minimum Order Quantity 500 Sets". — [EBIC 1500W listing](https://ebictools.en.made-in-china.com/product/gwcESaVUHnkv/China-Fixtec-80-120bar-Max-Pressure-Electric-1500W-High-Pressure-Cleaner-Portable-Car-Washer.html)
  - 2000W brush motor, 110 bar rated / 160 bar max, 6–7 L/min: **US$54.90** (MOQ 3). Package 38×33×51 cm (0.064 CBM), 11 kg; CE/CB/ETL/RoHS/UR. — [EBIC 2000W 160bar](https://ebictools.en.made-in-china.com/product/ZfWRhNOVMtld/China-Fixtec-160bar-Power-High-Pressure-Washer-Light-Weight-Overheating-Protection-2000W-Portable-High-Pressure-Car-Washer.html)
  - 2000W **induction** motor, 120/170 bar: **US$92.93** (MOQ 3). Package 48×33×51 cm, 16 kg; CE/RoHS/GS; lead time 15 working days. — [Fixtec 2000W induction](https://fixtectools.en.made-in-china.com/product/HtXrcielhADS/China-Fixtec-2000W-Electric-Pressure-Cleaner-170bar-Automatic-High-Pressure-Washer.html)
- **Yuyao Goldsen International Trade Co., Ltd. ("TOLHIT"; member since 2014; Audited; a trading company by name)**
  - 2000W induction motor, 125 bar, 5.5 L/min, 7 m hose, auto-stop, thermal protector: **US$34.00 for 500–999; US$33.50 for 1,000–2,999; US$32.90 for 3,000+**.
  - Carton 38.5×18.5×30 cm (0.021 CBM); "20GP/40GP/40HQ: 1350/2700/3000pcs"; CE/CB/ETL/RoHS; lead time 30–60 days. — [Goldsen TOLHIT 2000W](https://goldsen.en.made-in-china.com/product/OnRpWvrdEUcw/China-Tolhit-220V-125bar-2000W-Portable-Electric-Power-Adjustable-High-Pressure-Car-Washer.html)
- **Taizhou Ruiying Electromechanical Co., Ltd. (member since 2025; Audited)**
  - Ry25s 2000W induction, 90 bar, 8 L/min, steel frame, three-plunger pump: **US$37.30 for 300–499; US$37.00 for 500–999; US$36.50 for 1,000+**. Package 39×26.5×34 cm (0.035 CBM), 12.5 kg; CE/CB/ETL/RoHS/UR. — [Ruiying Ry25s](https://tzruiying.en.made-in-china.com/product/FAlUCzoGZNVY/China-Ry25s-Portable-Steel-Frame-High-Pressure-Washer-2000W-220V-50Hz-90bar-8L-Min.html)
  - A second listing titled "2000W" specifies model P18PRO **1500W**/80 bar at US$34.50–35.20 (MOQ 300). Title and spec conflict. — [Ruiying "2000W"](https://tzruiying.en.made-in-china.com/product/aGmpInUjOdWS/China-2000W-High-Quality-Power-Electric-Car-Wash-Machine-High-Pressure-Washer-Cleaner.html)
- **Zhejiang Shuimoli Machinery & Electric Equipment (member since 2013; Audited; ISO 9001)**
  - 1600W, 100 bar: **US$26.00 for 200–999; US$23.00 for 1,000+**. Package 44×27×33 cm (0.039 CBM), 11 kg; CE only; 220 V; lead time 30 days. — [Shuimoli](https://shuimoli.en.made-in-china.com/product/dprYWwioSshX/China-Portable-Electric-High-Pressure-Car-Washer-Sml-1000g-S7-5.html)
- **Taizhou Jiawo Electromechanical (Manufacturer/Factory & Trading; Diamond since 2021)**
  - JW100J 1300/1500W, 105/135 bar max, 6 L/min: US$20–35 (MOQ 200). Carton 38.5×21×31 cm; CE. — [Jiawo](https://china-jiawo.en.made-in-china.com/product/WRyUEIAdnVcZ/China-Electric-High-Pressure-Car-Washer.html)
- **Zhonggu Electromechanical (Taizhou)**: a "Trading Company" with 10 employees, established 2019. 2000W/120 bar at US$25.40–32.40 (MOQ 10); its claimed "10 L/min" flow is implausible for the class. — [Zhonggu](https://zg-washer.en.made-in-china.com/product/MEypbxJvaVWR/China-2000W-120bar-Household-Electric-Portable-High-Pressure-Car-Washer.html)

### Inferences
**Comparable spec and price to beat**
- **Comparable spec:** 1800–2000W, about 125–150 bar, 6–7.5 L/min. Matching retail units: Ozito 1800W/2030 psi (about 140 bar) at A$99; Ferrex 2000W/2175 psi (150 bar) at A$149.
- **Brief's Amazon rule:** Bosch A$169 → A$135–152.
- **Market reality:** buyers can walk into Bunnings, Aldi or Supercheap and pay A$89.99–99 for a branded unit with warranty and returns. A no-name Marketplace unit must sit at about **A$89–99**, or A$79 against the 1600W tier.
- **Verdict on the original thesis:** the "loses if Bunnings/Ozito/Aldi are near A$99" condition is met.

**Shared-base recomputation** (FX 1.4376; 5% defect allowance for electricals; A$400 inspection; A$5 handling; US$1/unit AU plug, RCM label and manual as an ASSUMPTION)
- Compliance fixed costs per first order:
  - **Scenario A:** EESS Responsible Supplier A$239.74 + A$500 review of the factory's authorised CB/EMC reports (ASSUMPTION)
  - **Scenario B:** Scenario A + A$5,000 new AS/NZS 60335.2.79 and CISPR 14-1 testing (ASSUMPTION)
  - Product-liability insurance is not included; adding A$1,500 costs about A$3/unit at 500 units.
- Worked arithmetic, Goldsen 2000W, 500 units LCL, Scenario A:
  - FOB A$48.88
  - Freight (10.7 W/M × 244 + 900) ÷ 500 = A$7.02
  - Inspection A$0.80
  - Fixed compliance A$1.48
  - Plug/label A$1.44
  - **Landed A$59.62**; + 5% defect = A$62.60; + A$5 handling = **A$67.60**
  - At A$99: net A$90.00 → **GP A$22.40 (24.9%)**. Break-even price A$74.36. Cash A$29.8k ex-GST.

| Supplier / order | Scenario | A$139 | A$119 | A$99 | A$89 | Cash ex-GST |
|---|---|---|---|---|---|---|
| Goldsen 2000W induction US$34, 500 units LCL | A | 58.77 (46.5%) | 40.58 (37.5%) | **22.40 (24.9%)** | **13.31 (16.5%)** | 29,809 |
| same | B (+A$5k testing) | 48.27 (38.2%) | 30.08 (27.8%) | **11.90 (13.2%)** | **2.81 (3.5%)** | 34,809 |
| Goldsen US$33.50, full 20GP (1,300 units) | A | — | 45.41 (42.0%) | 27.23 (30.3%) | 18.14 (22.4%) | 71,524 |
| Ruiying Ry25s US$37.30, 300 units LCL (90 bar only) | A | — | 29.24 (27.0%) | 11.06 (12.3%) | — | 21,127 |
| EBIC 2000W brush US$54.90, 200 units LCL | A | — | −8.30 (−7.7%) | −26.49 (−29.4%) | — | 21,235 |
| Original SKU: EBIC "1500W" (1200W) US$39.48, 200 units LCL | A | 39.05 (30.9%) | — | about 2.7 (3%) | — | 15,679 |
| Shuimoli 1600W US$26, 200 units LCL (vs A$89.99 1600W tier) | A | — | — | — | at A$79: 5.31 (7.4%); at A$69: −3.78 | 11,716 |

- **5% duty sensitivity** (Goldsen, 500 units, A$99, Scenario A): GP A$19.84 (22.0%).
- **Verdict: REVISED (downgraded). Score 5 → 3.** The economics only work with a cheap induction 2000W unit, an MOQ of 500 (A$30–35k), and a factory that can authorise reusable CB + EMC reports with AU national differences.
- **Risks:**
  - The price advantage over Bunnings, Aldi and Supercheap is thin or nil, and those retailers offer instant returns.
  - Pump/seal warranty claims are common.
  - Demand is seasonal: spring/summer, and Aldi drops sporadic Special Buys.
  - The Goldsen listing comes from a trading company, so the real factory and its CB-report holder must be identified.
- The 1600W tier does not work: Kmart A$55–89, Ferrex A$89.99 and ToolPRO A$89.99 leave no room.

### Gaps
- Amazon AU Pressure Washers best sellers page 1 was not captured (bot page). A cheaper corded generic on Amazon may exist below Bosch A$169.
- Bunnings and Kmart prices are search-engine snippets of unknown date. Bunnings Ryobi/Gerni and current Ozito promotions were not captured.
- Whether Goldsen, EBIC or Ruiying hold CB reports with AU/NZ national differences for IEC 60335-2-79, and will authorise their use, needs supplier confirmation.
- Motor and pump life and real defect rates for these factories are unknown.

## Q6. SKU 3 compliance: EESS level for pressure washers, certification route and cost

### Takeaway
**Level 1 is confirmed by reading the primary EESS risk-level document,** not just inferred.
- **The document:** EESS's in-scope definitions and risk levels, v4.2 (current July 2021, aligned to AS/NZS 4417.2:2020).
- **What it says about pressure washers:** they are not listed at Level 3 or Level 2. Neither Level 3 definition that could plausibly capture one applies:
  - "Tool—portable type" covers hand-held tools doing mechanical work and excludes transportable tools.
  - "Submersible pump" requires electrical parts immersed in the liquid.
- **Consequence:** a mains 230 V pressure washer is a Level 1 in-scope item. No Australian certificate of conformity or per-model registration fee is needed. The importer must:
  - be a registered Responsible Supplier (A$239.74/yr);
  - apply the RCM;
  - hold English-language evidence of compliance with the relevant standard (AS/NZS 60335.1 + 60335.2.79) for 5 years;
  - meet ACMA EMC requirements (AS/NZS CISPR 14.1 for motor-operated appliances).
- **Cost:** about A$740 if a factory CB report plus EMC report can be authorised and reviewed; about A$5–6k if new testing is needed (labelled estimate).

### Cited Findings
- **In-scope definition:** equipment "rated at a voltage greater than 50 V AC RMS … and designed or marketed as suitable for household, personal or similar use".
- **Level 1 obligations:** "be electrically safe and meet the relevant standard; be marked with the Regulatory Compliance Mark (RCM); have documentary evidence in English, to show that the item meets the relevant standard at the time the item was either manufactured or imported; and be linked to the registered responsible supplier". Evidence must be kept "for a period of five years".
- **Level 3 obligations:** a "valid Australian or New Zealand issued certificate of conformity" plus database registration.
- **Precedence:** "Where there is inconsistency … the current latest published AS/NZS 4417.2 wording overrides wording in this document." — [EESS In-scope equipment definitions and risk levels v4.2](https://www.eess.gov.au/wp-content/uploads/2023/02/EESS-Inscope-Equipment-Definitions-and-Risk-Levels-v4.2-.pdf) (downloaded 2026-10-09; title page "Current: July 2021, version 4.2 – aligns to AS/NZS 4417.2:2020 edition")
- **Pressure washers are absent.** A full-text search of v4.2 for "pressure", "cleaner", "60335.2.79" and "washer" finds only:
  - "Pressure storage—AS/NZS 60335.2.21" (water heaters)
  - "Vacuum cleaner" (Level 3)
  - Nothing for high-pressure cleaners. — same document
- **"Tool—portable type" (Level 3)** is "An electrical motor-operated appliance that— (a) is intended to do mechanical work … (c) is intended or designed to be held or supported by hand during operation but does not include— (d) lawn and garden machinery … (f) a transportable tool". Class specification AS/NZS 60745 / 62841. — same document
- **"Submersible pump"** (Level 3 from 18 Dec 2021) requires "any electrical part, or enclosure around any electrical part, completely or partially immersed in the liquid being pumped". — same document
- **Fees "from 1 July 2026":** Responsible Supplier registration **A$239.74/yr**; Level 2/3 equipment registration A$89.85 (1 yr), which does not apply at Level 1. — [EESS registration fees, via vertical_appliances_emobility.md](https://www.eess.gov.au/registration/registration-fees/)
- **WA's Level 3 extract** of AS/NZS 4417.2 Table B.4 (62 items) does not name pressure washers. — [WA Building and Energy, via vertical_appliances_emobility.md](https://www.wa.gov.au/sites/default/files/announcements/electrical-appliances-and-equipment-importing-selling-or-hiring)
- **ACMA EMC:** the ACMA's mandated EMC standards list includes AS/NZS CISPR 14.1 (CISPR 14-1/EN 55014-1) for household appliances, power tools and motor-operated appliances (via search summary; ACMA returned empty replies to direct fetch). — [ACMA mandated EMC standards (PDF, 2026-07)](https://www.acma.gov.au/sites/default/files/2026-07/ACMA-mandated%20EMC%20standards.pdf)
  - ACMA duties: arrange testing, register as responsible supplier on the national database, keep compliance records, label before supply. ACMA-only registration has no fee. — [ACMA "Know what you must do", via au_landed_cost_compliance.md](https://www.acma.gov.au/know-what-you-must-do)
- **Supplier certificates as listed:**
  - EBIC/Fixtec: CE, CB, ETL, RoHS, UR (brush units); CE, RoHS, GS (induction unit)
  - Goldsen TOLHIT: CE, CB, ETL, RoHS
  - Ruiying Ry25s: CE, CB, ETL, RoHS, UR
  - Shuimoli and Jiawo: CE only
  - EBIC's 1200W unit ships with a **VDE (European) plug**.
  - — listings cited in Q5

### Inferences
**Certification route** (labelled estimates)
1. Register the business as an EESS Responsible Supplier (A$239.74/yr). This one registration covers all Level 1 items.
2. Obtain the factory's IEC 60335-1 / IEC 60335-2-79 CB test report with Australian/NZ national differences, plus a CISPR 14-1 EMC test report. Get the factory's written permission to rely on them, and check model identity: motor, pump, cord and AS/NZS 3112 plug. Budget A$500 for an independent desk review and label artwork (ASSUMPTION).
3. If no CB report with AU differences exists, or the product is changed, commission testing at an accredited lab: about **A$5,000** for safety and EMC (ASSUMPTION; no published price found).
4. Fit an AS/NZS 3112 plug, RCM-marked rating plate and English manual. Budget about US$1/unit (ASSUMPTION).
5. ACMA: record the EMC declaration and evidence against the responsible-supplier registration on the national database (no fee).
- **Lead time:** none for Scenario A. Scenario B testing is assumed to take 3–6 weeks and should finish before goods land.
- **Comparison with the original:** it used A$0 (Scenario A) / +A$1,500 (Scenario B). Scenario A was close (A$740 here). Scenario B was probably too low.

### Gaps
- AS/NZS 4417.2:2020 Table B itself (the overriding text) was not read. v4.2 says it aligns, but a later EESS document version may exist; the EESS in-scope page URL returned 404.
- ACMA compliance-level wording for motor appliances (level 1 vs 2 record-keeping) was not read directly (ACMA blocked).
- No accredited-lab price for AS/NZS 60335.2.79 or CISPR 14-1 testing was found; A$5,000 is an assumption.
- State regulators' (e.g. Energy Safe Victoria) Level 1 audit activity on pressure washers was not checked.

## Q7. Verdicts and revised scores

### Takeaway
None of the three is BROKEN outright, but two are materially weaker than ranked.
- **Recovery kit: REVISED, 6 → 4.**
- **Camp kitchen: REVISED numbers, score held at 5.** It is now the strongest of the three.
- **Pressure washer: REVISED, 5 → 3.**
- **Common cause:** Super Retail Group house brands (XTM, Wanderer, ToolPRO at BCF/Supercheap, with free Club pricing) and Aldi/Bunnings/Kmart set price floors at or below the original targets. The original analyses anchored on Amazon AU only.
- **Kit + tracks bundle at A$199:** BROKEN at 100 bundles (9% GP at A$199, but A$199 is above the A$167–188 rule price; −1% at A$179). It only works at 200+ bundles.

### Cited Findings
**Recovery kit**
- XTM 7-piece A$119.99 Club / A$149.99 (BCF) / A$169.99 (Supercheap) — [BCF](https://www.bcf.com.au/p/xtm-7-piece-recovery-kit/600254.html); [Supercheap](https://www.supercheapauto.com.au/p/xtm-4x4-accessories-xtm-7-piece-recovery-kit/600254.html)
- Kings Hercules kit + light A$148.95 on Amazon AU; A$179.16 direct; 11-piece A$199 — [Amazon AU BS Recovery Straps](https://www.amazon.com.au/gp/bestsellers/automotive/14632514051); [4WD Supacentre](https://www.4wdsupacentre.com.au/4wd/winches-recovery.html)
- Mandatory strap standard in force — [F2017L01560](https://www.legislation.gov.au/F2017L01560/latest/text)
- Thinkwell US$35 (100–499) / US$32 (500+) — [Thinkwell](https://thinkwell.en.made-in-china.com/product/LoUEjqrvhwtf/China-4X4-off-Road-Recovery-Tow-Strap-Recovery-Kit.html)

**Camp kitchen**
- Wanderer Dual Cupboard A$99 clearance (Supercheap) / A$129.99 Club (BCF) — [Supercheap](https://www.supercheapauto.com.au/search?q=camp%20kitchen); [BCF](https://www.bcf.com.au/p/wanderer-premium-series-dual-cupboard-kitchen/520333.html)
- Welfull US$25–29.50 at MOQ 500 — [Welfull](https://welfull-outdoors.en.made-in-china.com/product/kfFpBKvoLRhH/China-Camping-Kitchen-Table-Aluminum-Portable-Outdoor-Cooking-Table-with-Windscreen-and-3-Storage-Cupboards-for-Outdoor-Activities.html)
- Ningbo Eto US$12–30 at MOQ 300 — [Ningbo Eto](https://eto-outdoors.en.made-in-china.com/product/KmupNtEHOCcT/China-Kitchen-Table-with-Windshield-and-Storage-Organizer-Portable-Folding-Adjustable-Cooking-Table-for-BBQ-Picnic-Camp-Cupboard.html)

**Pressure washer**
- Aldi Ferrex 1600W A$89.99 (on sale 17 Oct 2026) and 2000W A$149 — [Aldi 1600W](https://www.aldi.com.au/product/ferrex-high-pressure-washer-1600w-000000000000739767); [Aldi 2000W](https://www.aldi.com.au/product/ferrex-high-pressure-washer-000000000000734502)
- ToolPRO 1595 PSI A$89.99 — [Supercheap](https://www.supercheapauto.com.au/search?q=pressure%20washer&srule=price-low-to-high)
- Ozito 1800W A$99 (Bunnings, via search summary) — [Bunnings](https://www.bunnings.com.au/our-range/tools/power-tools/pressure-washers)
- EESS v4.2 has no pressure-washer entry, so Level 1 — [EESS v4.2](https://www.eess.gov.au/wp-content/uploads/2023/02/EESS-Inscope-Equipment-Definitions-and-Risk-Levels-v4.2-.pdf)
- Goldsen TOLHIT 2000W US$34 at MOQ 500 — [Goldsen](https://goldsen.en.made-in-china.com/product/OnRpWvrdEUcw/China-Tolhit-220V-125bar-2000W-Portable-Electric-Power-Adjustable-High-Pressure-Car-Washer.html)

### Inferences
**Summary table** (GP at the realistic price, shared base, first order unless stated)

| SKU | Original claim | Verified price to beat (2026-10-09) | Realistic MP price | First order | Full container | Verdict | Score |
|---|---|---|---|---|---|---|---|
| 4WD recovery kit (8–11 pc) | Score 6; A$139; 29–42% GP; A$8–14k | XTM 7-pc A$119.99 Club (BCF/SCA); Amazon Kings Hercules + light A$148.95 | A$109–119 | 200 kits LCL with A$4k compliance: **15.1% at A$119 / 7.3% at A$109**; A$16.9k. (100 kits: −10% at A$119.) | 1,120 kits / 20GP: **41.4% at A$119; 29.6% at A$99**; A$63k | **REVISED** | **4** |
| Kit + tracks bundle | A$199; about 31% | Amazon generic 15-pc A$209; X-Bull 13-pc A$219; BCF XTM kit + boards A$217.98 Club | A$169–179 | 100: −1% to −7%; 200: 12–17% | 387 bundles / 20GP: 24.5–28.7% | **BROKEN at 100; marginal at 200** | 3 |
| Aluminium camp kitchen + cupboards | Score 5; A$109; 36% at MOQ 500; 8% at 100 | Wanderer Dual Cupboard A$99 clearance (SCA) / A$129.99 Club (BCF); Kmart simpler unit A$70 RRP | A$99 (A$109 upside) | 300 units LCL via Ningbo Eto at ≤US$30: **24.9%**, A$18k (quote-dependent). 100 units: negative. | Welfull 500 / 20GP: **31.5% at A$99** (37.8% at A$109), A$27.5k; 40HQ 1,243 units at US$25: 43.7% | **REVISED (numbers)** | **5** |
| Electric pressure washer 1800–2000W | Score 5; A$119–139; 17–30%; Level 1 inferred | ToolPRO 1595 PSI A$89.99 (SCA, everyday); Ferrex 1600W A$89.99 (Aldi, 17 Oct); Ozito 1800W A$99 (Bunnings); Ferrex 2000W A$149; Kmart 1600W A$55–89; Bosch 1500W A$169 (Amazon) | A$89–99 | Goldsen 2000W ×500 LCL: **24.9% (A) / 13.2% (B) at A$99; 16.5% / 3.5% at A$89**; A$30–35k. EBIC 2000W ×200: negative. | Goldsen ×1,300 / 20GP: 30.3% at A$99 (Scenario A); A$71.5k | **REVISED**; Level 1 **CONFIRMED** | **3** |

**Recovery kit: 4/10**
- **What changed:** the cheapest comparable new kit is now a branded, AS/NZS 2741-shackle, 191-review XTM 7-piece. It costs A$119.99 at BCF/Supercheap for anyone who signs up for the free Club, with 1-hour Click & Collect. On Amazon, Kings sells its Hercules kit + work light at A$148.95.
- **What the original missed:** a federal mandatory standard governs the strap's labels, instructions and packaging. Credible MBS claims need break tests, and the importer carries deemed-manufacturer liability for a product whose own legal warning cites deaths.
- **Economics:** once about A$4k of fixed compliance and liability cost is spread, 100 kits lose money at A$119. 200 kits earn about 7–15% at A$109–119. Only container volumes (A$63k) give 30–40%.
- **Still in favour:** small cube, no EESS, no DG, a 10–20-day supplier, and a clear need.
- **Next step:** get an itemised Thinkwell quote (contents, nylon strap, MBS test report) and a lab quote before any order.

**Camp kitchen: 5/10, now the best of the three**
- **What holds:** the MOQ-500 economics, about 31% at A$99 in a full 20GP. The product has no compliance burden and real pickup advantage (bulky; BCF excludes it from free shipping).
- **What is weaker:** the ceiling. SRG's Wanderer is A$99 on clearance and A$129.99 Club, so A$109 is an upside test, not the base.
- **Small orders:** the original's 100-unit fallback is loss-making, because General Union's carton is 0.121 CBM and its price is US$41.
- **Middle route:** about 300 units by LCL (A$18k, about 25%), if Ningbo Eto quotes ≤US$30 for the identical 146 cm spec.
- **Risks:** sell-through and storage of 300–500 bulky units in a seasonal category, and Wanderer price moves.

**Pressure washer: 3/10**
- **Level 1 is confirmed** from the EESS risk-level document: no certificate of conformity, only RS registration, RCM and test-report evidence. That is the one positive.
- **Price failed:** the Bosch A$169 anchor is irrelevant. Supercheap (A$89.99), Aldi (A$89.99/A$149) and Bunnings (Ozito A$99) sell comparable branded units with returns.
- **Original supplier was mis-specified:** the EBIC "1500W" is a 1200W brush unit with a European plug.
- **Economics:** only a 2000W induction unit at about US$34 with MOQ 500 (A$30k+) clears 15–25% at A$89–99, and only if a CB/EMC report can be reused. With new testing it is 4–13%.
- **Other negatives:** thin price advantage over walk-in retail, pump and seal warranty exposure, and seasonal, sporadic Aldi competition.

### Gaps
**Quotes needed before committing capital:**
- Thinkwell kit contents, MBS and test reports
- NATA lab break-test pricing
- Liability insurance for recovery gear
- Welfull/Eto carton size and firm prices at 300/500
- Goldsen (or its factory) CB report with AU differences and an EMC report

**Data not captured:**
- Amazon AU floors for camp kitchens and the Pressure Washers best-seller page 1 (bot pages)
- Bunnings and Kmart prices beyond search snippets (undated)
- Facebook Marketplace realised prices and sell-through for any of the three SKUs (login wall)
