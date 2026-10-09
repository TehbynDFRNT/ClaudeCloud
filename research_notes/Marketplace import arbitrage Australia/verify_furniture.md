# Verification of the shortlisted Home & Office Furniture import-arbitrage SKUs (China factory → new on Facebook Marketplace AU)

*Verification date: 9 Oct 2026. Every price below was observed on 9 Oct 2026 unless another date is given.*

**How the data was collected**
- **Amazon.com.au pages.** A browser-style fetch geolocated to "Deliver to United States", which hides the buy box. A plain fetch instead got Amazon's AU template ("To change, sign in or enter a postcode"). That template shows the "New (n) from $X & FREE Delivery / + $Y Delivery" all-offers line or the buy-box delivery line, and these give the delivered prices below. No postcode was set: one attempt to set a postcode hit a bot interstitial, which was not bypassed. Best Sellers ("BS") pages give the featured price only; delivery is not shown.
- **Other sources.** Brand-direct prices come from Shopify catalogue endpoints (Advwin, Artiss, Desky). Also used: IKEA JSON-LD, Fantastic Furniture (FF) and Amart category pages, Made-in-China (MIC) product and search pages, legislation.gov.au PDFs, and the EESS definitions PDF.
- **Blocked or partial:** Kmart (search snippets only), Kogan, Officeworks, Temu, FF recliner and TV pages (bot page), and Amart recliners.

**Shared base assumptions**
- **FX:** US$1 = A$1.4376.
- **Freight, door-delivered:**
  - full 40HQ = A$148 × 68 = A$10,064;
  - full 20GP = A$211 × 28 = A$5,908;
  - LCL = A$244 per W/M + A$900 per shipment.
  These are assumed to cover the broker, IPC/DAFF and destination charges.
- **Duty:** 0% with a ChAFTA Certificate of Origin (CoO); 5% general rate shown as a sensitivity; mattresses Free.
- **GST** reclaimed; net revenue = price ÷ 1.1.
- **Other costs:**
  - pre-shipment inspection (PSI) A$400 per factory per order;
  - defects 3% of landed cost;
  - storage A$11/CBM/month × 3 = A$33 per CBM;
  - compliance as found (estimates labelled);
  - no Marketplace fee; no insurance line (the shared base has none; the original added 0.5%).

**Landed cost** = FOB×1.4376 + freight + duty + PSI + storage + compliance + biosecurity contingency, then +3% defect allowance. Model script: `scratchpad/calc_v/model.py`.

---

## Q1. Dual-motor electric sit-stand desk (frame + ~140×70 top): does "A$299, ~A$77 GP (28%), score 7" hold?

### Takeaway
**Verdict: REVISED, score 7 → 6.**
- **Price floor.** The A$348 Amazon floor cannot be verified: the Oikiture 140×70 dual-motor listing is "Currently unavailable" with no price.
  - The cheapest complete dual-motor desk on Amazon AU is A$439.99 delivered (FLEXISPOT E3, 200×80).
  - Brand-direct Advwin sells a complete dual-motor 140×60 desk at A$319.90 plus postcode-based delivery.
  - Bare dual-motor frames sell on Amazon AU from A$199.99 delivered.
  - So A$299 is still a valid target: 32% under Amazon, but only 6.5% under Advwin's item price.
- **Margin.** On the shared assumptions with a more realistic FOB (US$100 for frame + top), gross profit is about **A$47 (17%) on a 100-unit LCL first order**, A$84 (31%) on a full 20GP (274 desks) and A$95 (35%) on a weight-limited 40HQ (571 desks).

### Cited Findings
**Price to beat: complete dual-motor desks**

| Item | Price | Delivery | Source |
|---|---|---|---|
| FLEXISPOT E3 dual-motor 200×80 | New (2) from A$439.99 | FREE | [B0F2B1NJTL](https://www.amazon.com.au/dp/B0F2B1NJTL) |
| FLEXISPOT E3 dual-motor 200×80 (second listing) | A$439.99 | FREE, 12–16 Nov | [B0GQYYB2B2](https://www.amazon.com.au/dp/B0GQYYB2B2) |
| FLEXISPOT E6E dual-motor 120×60 | A$459.99 | FREE | [B0GS7TS7HS](https://www.amazon.com.au/dp/B0GS7TS7HS) |
| Oikiture "Electric Standing Desk with Dual Motors 140 x 70cm" | No price shown | — | [B0CQ2M1RPT](https://www.amazon.com.au/dp/B0CQ2M1RPT) |
| Advwin Dual Motor 140 cm (brand-direct) | A$319.90 ("compare at" A$559.99) | postcode-based | [Advwin](https://www.advwin.com.au/products/advwin-dual-motor-electric-standing-desk-height-adjustable) |
| Advwin dual-motor 120 cm (brand-direct) | A$299.90 | postcode-based | [Advwin](https://www.advwin.com.au/products/advwin-electric-height-adjustable-standing-desk-dual-motor-160209200-160501300) |
| Artiss dual-motor 140 cm (brand-direct) | A$430.99–499.99 | — | [Artiss white](https://www.artiss.com.au/products/artiss-standing-desk-electric-adjustable-sit-stand-desks-black-white-140cm), [Artiss walnut](https://www.artiss.com.au/products/artiss-standing-desk-motorised-dual-motor-electric-walnut-140cm) |
| Fantastic Furniture Wendie 160 cm Dual Motor | A$579 | — | [FF standing desks](https://www.fantasticfurniture.com.au/c/standing-desks) |
| IKEA MITTZON sit/stand electric 160×80 | A$659 | — | [IKEA](https://www.ikea.com/au/en/p/mittzon-desk-sit-stand-electric-white-s69529961/) |
| Desky Dual Mini | A$765 | — | [Desky](https://www.desky.com.au/products/dual-small-standing-desk) |
| Desky Dual frame only | A$749 | — | [Desky](https://www.desky.com.au/products/dual-sit-stand-desk-frame) |

Notes on these listings:
- **Oikiture B0CQ2M1RPT:** "Currently unavailable. We don't know when or if this item will be back in stock." The original A$348.42 (an undated snippet) therefore cannot be re-verified.
- **Advwin 140 cm spec:** "Table Top Size: 140*60CM" (a black-and-walnut two-piece "mosaic" E1 particleboard top, 18 mm), dual motors, 100 kg, 29 V / 1.8 A / 52 W. It was not observed on Amazon AU.
- **Fantastic Furniture:** FF's explicitly "Single Motor" desks are A$349–449. Other FF electric desks run A$159–779 with no motor count stated.
- **IKEA:** MITTZON is the only electric sit/stand desk on the IKEA desks page.

**Price to beat: frame-only substitutes (Amazon AU, all free delivery)**
- Xyndyx "150KG Capacity Dual Motor … Desk Frame": A$199.99 — [B0D3ZN4G4M](https://www.amazon.com.au/dp/B0D3ZN4G4M).
- Oikiture dual-motor frame: A$263.92 (white) and A$329.90 (black) — [B0CQ41M64R](https://www.amazon.com.au/dp/B0CQ41M64R), [B0CQ3YLTLS](https://www.amazon.com.au/dp/B0CQ3YLTLS).
- ERGOMAKER dual-motor frame: A$269.00, ships from Amazon — [B0CX89K7LK](https://www.amazon.com.au/dp/B0CX89K7LK).
- FLEXISPOT Pro dual frame: A$349.99 — [B09SB4V7XR](https://www.amazon.com.au/dp/B09SB4V7XR).
- Artiss dual frame (brand-direct): A$329.99 — [Artiss](https://www.artiss.com.au/products/artiss-standing-desk-sit-stand-motorised-adjustable-frame-only-black-dual-motor).

**Price to beat: single-motor substitutes (see Q5)**
- Giantex 140×70 ("a robust motor"): New (2) from A$199.95, FREE delivery, "50+ bought in past month" — [B0CXHYLVZM](https://www.amazon.com.au/dp/B0CXHYLVZM).
- ErGear 140×70: A$259.99, FREE delivery, 12,927 ratings — [B0B4228HW9](https://www.amazon.com.au/dp/B0B4228HW9).
- PORIYA 120×60, 60 kg: A$139.99, FREE delivery — [B0D5GVTN9G](https://www.amazon.com.au/dp/B0D5GVTN9G).
- Desks Best Sellers page — [BS Desks](https://www.amazon.com.au/gp/bestsellers/home/4975383051).
- **Kmart, Kogan, Officeworks, Temu:**
  - No dual-motor price was found.
  - Kmart lists Costway 140×60 and 160×60 electric desks; neither price nor motor count is visible in search snippets — [Kmart Costway 140×60](https://www.kmart.com.au/product/costway-140-x-60cm-electric-standing-desk-adjustable-sit-stand-computer-desk-white-110223504/).
  - Kogan lists the Desky Dual Scalloped at A$1,058.95 (undated price-comparison snippet) — [BuyWisely](https://buywisely.com.au/product/desky-dual-scalloped-melamine-sit-stand-desk-44).

**Factory: named suppliers (Made-in-China, 9 Oct 2026)**
- **Zhejiang Prorials Advanced Materials (origin Ningbo)** — [Prorials dual frame](https://chinapurui.en.made-in-china.com/product/JRbUSIKobqVf/China-Fast-Lift-Dual-Motor-Electric-Height-Adjustable-Standing-Office-Desk-Frame.html):
  - Dual-motor frame: **US$76 (100–499) / US$75 (500–999) / US$74 (1,000+)**; 3-stage, 620–1280 mm, 120 kg, "2 powerful 60W motors".
  - Master carton 0.97×0.395×0.15 m = 0.057 CBM; GW 25 kg / NW 22.5 kg; 456 per 20GP, 982 per 40GP, 1,157 per 40HQ; 35 days; HS 9403100000.
  - Evidence it is a manufacturer: badge "Manufacturer/Factory & Trading Company"; 1,195 employees; plant 127,125 m²; 50,000 pcs/month; FAQ: "We are a factory established in 2006".
  - Caution: the same page shows a different "also viewed" frame at US$45–47. That is not this product.
- **Zhejiang Weise Technology (Weisetech)** — [Weisetech](https://weisetech.en.made-in-china.com/product/AdXaNiyhClGE/China-Ws-Sg2bj-01-Dual-Motor-Electric-Ergonomic-Height-Adjustable-Standing-Desk.html):
  - Ws-Sg2bj-01 dual-motor: US$86.80–92.60/set; MOQ "30 sets".
  - Packing 101.5×29.5×19 cm, GW 19.5 kg; spec "0.065 CBM/carton"; load 100 kg.
  - Badges: Audited, Gold.
- **Lumi Legend Corporation (Zhejiang):**
  - Dual frame: US$75–95 — [Lumi frame](https://lumi2007.en.made-in-china.com/product/ntgYvuxWmlUz/China-Four-Leg-Height-Adjustable-Smart-Ergonomic-Electric-Desk-Frame-100kg-2-Dual-Motor-Modern-Home-Office-Table-Legs.html).
  - Complete 3-stage dual-motor desk M08-23DE: US$99–129, MOQ 100 — [Lumi desk](https://lumi2007.en.made-in-china.com/product/MolxpvyJXUDj/China-Modern-Home-Office-Furniture-Wholesale-3-Stage-Dual-Motors-Electric-Standing-Table-Gaming-Desk.html).
  - Badges: Diamond (Audited on search listing).
- **Zhejiang Jiecang Linear Motion:** dual-motor desk US$129–179 (Audited, Diamond, Manufacturer/Factory & Trading) — [Jiecang](https://jiecang.en.made-in-china.com/product/ewtfMmyoEWhc/China-Jiecang-Dual-Motor-Luxury-Height-Adjustable-Executive-Standing-Desk.html).
- **Zhejiang Xinyi Intelligent Drive:** 3-stage dual frame US$125–135 — [Xinyi](https://xinyiintelligent.en.made-in-china.com/product/CUuryOKLLXht/China-3-Stage-Dual-Motor-Electric-Standing-Desk-Frame-for-Home-Office-Adjustable-Table-Computer-Desk.html).
- **Egrospace:** complete dual-motor desk US$125.94–143.93 — [Egrospace](https://egrospace.en.made-in-china.com/product/iAjUPLGbhycH/China-Egrospace-Sit-Electric-Stand-Height-Adjustable-Table-Electrically-Dual-Motor-Standing-Desk.html).
- **Desktops:** no particleboard or melamine top FOB was found. The only top prices found were bamboo, at US$24.30–25.00 and US$36.32 (Xiamen Forever Rise, a trading company) — [bamboo top](https://pxbamboo.en.made-in-china.com/product/pYnUfyHPRAVi/China-Caramel-Vertical-Bamboo-Desk-Top-Standing-Desktop.html).

**Compliance**
- **EESS "power supply or charger" (Level 3).** Defined as a device that "provides an output not exceeding 50V AC. or 120V ripple free DC", either "to provide supply to separate luminaires" or as a household device "for either charging batteries or to provide supply to separate equipment". "Supply flexible cord" is also a listed Level 3 item — [EESS v4.3 definitions](https://www.eess.gov.au/wp-content/uploads/2024/07/EESS-Inscope-Equipment-Definitions-and-Risk-Levels-v4.3-Approved.pdf).
- **EESS fees (from 1 July 2026):** Responsible Supplier A$239.74/yr; Level 2/3 equipment A$89.85 for 1 year. Level 1 registration is voluntary, but the Responsible Supplier must be registered — [EESS fees](https://www.eess.gov.au/registration/registration-fees/), [EESS FAQ](https://www.eess.gov.au/about/faq/) (as cited in vertical_furniture_office.md).
- **ACMA:** suppliers must test, register as a responsible supplier, keep records and label before supply — [ACMA](https://www.acma.gov.au/know-what-you-must-do).
- **Duty:** HS 9403.10 metal office furniture is 5% general — [ABF ch.94](https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff/schedule-3/section-xx/chapter-94).

### Inferences
**Inputs**
- FOB **US$100 per complete desk** (estimate). This is the Prorials frame at US$76 plus an estimated US$24 for a 140×70 particleboard top. Lumi Legend's complete dual-motor desk (US$99–129) cross-checks it. The original US$93 (top at US$17) sits below every complete-desk listing found.
- CBM 0.102: frame 0.057 (cited) + top carton 0.045 (estimate). Gross weight 38.5 kg: 25 kg cited + 13.5 kg estimate.
- One-off compliance A$3,329.59: A$3,000 test/certification **estimate** + Responsible Supplier A$239.74 + equipment registration A$89.85.

**Worked examples (A$ per unit, target price A$299, net revenue 271.82)**
- **First order, LCL, 100 desks** (cheaper than a 20GP at 100 units, which would be 5,908/100 = 59.08):
  - FOB 143.76
  - freight (244×10.2 W/M + 900)/100 = 33.89
  - duty 0
  - PSI 4.00
  - storage 33×0.102 = 3.37
  - compliance 3,329.59/100 = 33.30
  - subtotal 218.31, defects 6.55 → **landed 224.86 → GP A$46.96 (17.3%)**; cash ≈ A$22.5k ex-GST.
- **Full 20GP, 274 desks** (10.5 t): freight 21.56 → landed 187.77 → **GP A$84.05 (30.9%)**; cash A$51.4k.
- **40HQ, 571 desks** (weight-limited at about 22 t, an estimate): freight 10,064/571 = 17.63 → landed 176.42 → **GP A$95.40 (35.1%)**; cash A$100.7k.
  - A cube-full 40HQ would hold 666 desks at about 25.6 t (GP A$98.95). That is likely over practical payload.

**Sensitivities (GP per desk; first order LCL-100 / full 40HQ-571)**

| Change | LCL-100 | 40HQ-571 |
|---|---|---|
| No CoO (5% duty) | A$39.56 | A$87.99 |
| FOB US$93 | A$57.32 | A$105.76 |
| FOB US$115 | A$24.75 | A$73.19 |
| Compliance A$1,740 | A$63.33 | — |
| Compliance A$6,330 | A$16.06 | — |
| Sell at A$279 | A$28.78 | A$77.21 |
| Sell at A$319 | A$65.14 | A$113.58 |

Break-even FOB at A$299: US$131.7 on LCL-100; US$164.4 on 40HQ.

**Reasoning (score 6)**
- The dual-motor premium is real: Amazon AU has no complete dual-motor desk under A$439.99, and FF, IKEA and Desky sit at A$579–765.
- But the true floor buyers can find is lower than the original A$348 suggested:
  - Advwin's brand-direct A$319.90 dual-motor 140×60 desk;
  - A$199.99–269 dual-motor frames plus a top;
  - single-motor 140×70 desks at A$199.95–259.99 delivered.
- So A$299 is about the ceiling, not a comfortable 10–20% under-cut.
- **Margins:**
  - The original A$77 is unattainable on a 100-unit LCL first order (about A$47).
  - It is exceeded only at 20GP or 40HQ scale, which needs A$51–101k and sells 274–571 desks through Marketplace.
  - The EESS test cost is unverified and swings first-order GP by ±A$15–30.
- It is still the best of the four, but less robust than ranked.

**Compliance inferences**
- **Desk with integral control box/PSU.** The desk itself is not listed in Level 2 or 3, so it is in-scope Level 1:
  - registered Responsible Supplier;
  - RCM;
  - English compliance evidence (e.g. to AS/NZS 60335.1) kept 5 years.
- **External plug-pack adapter.** The adapter is a Level 3 power supply needing an AU/NZ Certificate of Conformity plus registration. The mains cord set must be a certified Level 3 item.
- **Controller electronics** also need ACMA EMC evidence.
- **Preference:** a factory with an integrated control box and existing IEC/CB reports. The low compliance case (A$1,740) assumes this.

### Gaps
- **Original A$348.42 Oikiture price:** unverifiable (listing unavailable).
- **Advwin delivery fee** to Sydney/Melbourne was not quoted (postcode-based).
- **Retailers:** Kogan, Officeworks, Temu and Kmart dual-motor prices were not observable.
- **Particleboard top FOB** was not found; US$24 is an estimate.
- **Loctek** has no Made-in-China listing; Changzhou suppliers were not found.
- **EESS classification** of a specific desk control box was not confirmed with a certifier, and test or certification cost is not published (estimate A$1.5–6k).
- **40HQ payload/road weight limit** is an estimate.

---

## Q2. Full-size manual fabric recliner: does "A$279, ~A$49 GP (19%), score 6" hold?

### Takeaway
**Verdict: BROKEN, score 6 → 2.**
- The original comparator (Artiss B0CTZJK3R8, A$314.95) is a **360° swivel-rocker**. Its lowest new offer is now A$389.95 delivered.
- A like-for-like full-size manual fabric recliner with footrest (Artiss A4, 89 cm wide) sells on Amazon AU **from A$160.95 delivered**.
- At a rule-compliant A$139, landed cost (A$193–222) gives **GP −A$67 to −A$96 per unit**. Break-even needs a price of A$213–244 or an FOB below US$40.
- A swivel-rocker variant priced against Artiss's A$389.95 also fails: −A$21 on a 20GP, +A$25 (8.5%) on a full 40HQ.

### Cited Findings
**Price to beat**

| Item | Lowest new price | Delivery | Delivered | Source |
|---|---|---|---|---|
| Artiss A4 fabric recliner, adjustable backrest + footrest ("RECLINER-A4-LIN-GY", 26.4 kg) | New (3) from A$160.95 | FREE | **A$160.95** | [B07WRTRGB9](https://www.amazon.com.au/dp/B07WRTRGB9) |
| Same A4 model, new listing (65D × 89W × 98H cm) | A$199.95 | — | — | [B0HK7JDPYG](https://www.amazon.com.au/dp/B0HK7JDPYG) |
| Artiss A1 push-back (69 × 65 × 102 cm, 26.7 kg) | New (4) from A$159.95 | + A$44.72 | A$204.67 | [B0776QPB9F](https://www.amazon.com.au/dp/B0776QPB9F) |
| Artiss push-back variant | A$159.95 | — | — | [B0G5XC4NNC](https://www.amazon.com.au/dp/B0G5XC4NNC) |
| La Bella Shiloh linen, size "Full-Size Recliner" | New (3) from A$229.00 | FREE | A$229.00 | [B0FNQGNN8B](https://www.amazon.com.au/dp/B0FNQGNN8B) |
| Oikiture recliner with footrest (76 × 68 × 105, 29.6 kg) | A$239.99 | — | — | [B0FKH48FQB](https://www.amazon.com.au/dp/B0FKH48FQB) |
| Original comparator: Artiss A15 "360°SWIVEL BASE… gliding and rocking" (74D × 93W × 98H, 45 kg) | New (2) from **A$389.95** | FREE | A$389.95 | [B0CTZJK3R8](https://www.amazon.com.au/dp/B0CTZJK3R8) |

Notes:
- The second A4 listing's price is a carousel price, so its delivery is not shown.
- The original comparator also showed "1 offer from $314.95" in another page's carousel the same day.

Other Amazon recliner listings:
- Artiss 360° swivel recliner with ottoman (PU): A$189.95 — [B0H35DZ1JK](https://www.amazon.com.au/dp/B0H35DZ1JK).
- Recliners Best Sellers page — [BS Recliners](https://www.amazon.com.au/gp/bestsellers/home/4975817051).

**Other floors**
- IKEA EKOLSUND A$599 — [IKEA](https://www.ikea.com/au/en/p/ekolsund-recliner-gunnared-light-brown-pink-s69297188/).
- Advwin (brand-direct) swivel/flannel recliners A$399.90–429.90 — [Advwin flannel recliner](https://www.advwin.com.au/products/advwin-flannel-recliner-chair-light-brown-1141306612-1141306622).
- Artiss (brand-direct) fabric recliners A$332.99–366.99 — [Artiss Bolivia](https://www.artiss.com.au/products/artiss-luxury-recliner-chair-chairs-lounge-armchair-sofa-fabric-cover-grey).
- Kmart Marketplace (undated search snippets):
  - Luxdream PU recliner A$269.96 — [Kmart](https://www.kmart.com.au/product/luxdream-home-office-recliner-chair-pu-leather-armchair-lounge-sofa-couch-ottoman-footrest-110088029/).
  - Advwin velvet recliner A$360.91 — [Kmart](https://www.kmart.com.au/product/advwin-recliner-chair-lounge-armchair-rotatable-velvet-beige-110115086/).
- Fantastic Furniture recliners: bot page. Amart fabric recliners: not parsed.
- Bulky delivery matters on importer recliners. Example: a Livemor massage recliner + about A$128.62 delivery — [OzB](https://www.ozbargain.com.au/node/956963) (via au_retail_price_benchmarks.md).

**Factory**
- **Anji Baoyi Information Technology** — [Baoyi](https://anjibaoyi.en.made-in-china.com/product/fLupXEDTmmkH/China-Home-Furniture-Dark-Grey-Fabric-Manual-Relax-Recliner.html):
  - "Dark Grey Fabric Manual Relax Recliner": US$63–93, MOQ 30; "Loading Capacity 204 pieces/40HQ" (≈0.333 CBM each).
  - HS 9401619090; Origin **Anhui**; Shanghai port; about 30 days; 50,000 pcs/year.
  - Badges: Audited, Diamond. No "Manufacturer/Factory" badge, and the Anhui origin suggests sourcing or trading.
  - Sister models: US$65–110.
- **Anji Jikeyuan (Geeksofa)** — [Jikeyuan 9151-1](https://jikeyuan2022.en.made-in-china.com/product/sThRVaCOCbYG/China-Geeksofa-9151-1-Modern-Fabric-Manual-Recliner-Chair-with-Rocking-and-Swivel-Function-for-Living-Room-Furniture.html):
  - 9151-1 manual rock-and-swivel recliner: US$85–125, MOQ 30.
  - Carton 84×76×80 cm (0.511 CBM), 50 kg; 40HQ lead time 35–45 days.
  - "Manufacturer/Factory & Trading Company", established 2016-01-27, plant 10,673 m².
- **Fancy Home Furniture (Guangdong)** — [Fancy Home](https://dfancyhome.en.made-in-china.com/product/tpSUkXLlZVcs/China-Living-Room-Sofa-Factory-Velvet-Farbic-Rocker-Single-Manual-Recliner-Sofa-Chair.html):
  - Velvet rocker manual recliner: US$79.80 (180–359 sets) / US$75.80 (360+).
  - Carton 96×96×75 cm (0.691 CBM), 55 kg. Badge: Diamond.

**Compliance**
- **Care labelling.** The Care Labelling Information Standard 2023 s6(1) makes "upholstered furniture" regulated goods; labels must be in English and "clearly legible" — [F2023L01187](https://legislation.gov.au/F2023L01187/asmade/2023-09-04/text/original/pdf).
- **Biosecurity.** For wooden-frame seats (9401.61), the customs system asks whether goods contain untreated wood — [DAFF IAN 131-2023](https://agriculture.gov.au/biosecurity-trade/import/industry-advice/2023/131-2023) (via au_landed_cost_compliance.md).
- **Duty.** 9401.61 and 9401.71 are 5% general — [ABF ch.94](https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff/schedule-3/section-xx/chapter-94).

### Inferences
**Inputs**
- FOB US$85 (Baoyi ladder US$63–93); 0.333 CBM; GW 33 kg (estimate).
- Compliance A$300 one-off + A$0.30/unit care label (estimates).
- Biosecurity contingency A$300 per shipment (estimate).

**First order** (a full 20GP of 84 units is cheaper per unit than LCL at any quantity ≤84: LCL-84 = A$92.05/unit vs 20GP A$70.33):
- FOB 122.20
- freight 5,908/84 = 70.33
- PSI 4.76
- storage 33×0.333 = 10.99
- compliance 3.87
- biosecurity 3.57
- subtotal 215.72, defects 6.47 → **landed A$222.19**

**Full 40HQ, 204 units:** freight 49.33 → **landed A$193.35**.

**GP by price**

| Price | 20GP-84 | 40HQ-204 |
|---|---|---|
| A$139 (13.6% under A$160.95) | −A$95.83 | −A$66.99 |
| A$169 (matching Artiss) | −A$68.56 | −A$39.72 |
| Original A$279 (73% above the like-for-like floor) | +A$31.44 | +A$60.28 |

- Break-even price: A$244.41 (20GP) / A$212.69 (40HQ).
- Break-even FOB at A$139 (40HQ): US$39.8.

**Rocker-swivel variant** (Jikeyuan US$115, 0.511 CBM, 50 kg) at A$329 vs Artiss A15 at A$389.95:
- 20GP-54: landed A$319.73 → GP −A$20.63.
- 40HQ-133: landed A$273.65 → GP +A$25.45 (8.5%).

**Reasoning (score 2)**
- The original ranking compared a basic manual recliner's costs against a swivel-rocker's price.
- Like-for-like, Artiss (Dropshipzone) sells a full-size fabric recliner with footrest delivered for less than a small importer's landed cost. Cube (0.33–0.69 CBM) is the killer: 20GP freight alone is A$70/unit.
- Marketplace's pickup advantage is small here because the A4 offer ships free.
- The only open paths are not "10–20% below Amazon" plays:
  - buying at Artiss-level FOB;
  - a differentiated power or rocker recliner at 40HQ volume.

### Gaps
- The A4 New (3) A$160.95 offer's seller is not shown.
- Fantastic Furniture and Amart recliner floors were not readable.
- Kmart own-brand recliner (if any) was not found.
- Baoyi carton dimensions and gross weight were not listed (CBM inferred from 204/40HQ).
- No supplier quote was requested.

---

## Q3. Premium fluted/LED TV entertainment unit 160–190 cm: does "A$169, ~A$42 GP (28%), score 6" hold?

### Takeaway
**Verdict: BROKEN as specified, score 6 → 3.**
- The original comparator (Artiss 190 cm extendable, A$186.87) is still listed, but it is no longer the cheapest comparable:
  - Artiss's **160 cm fluted unit is A$149.95 with FREE delivery**;
  - LED units start at **A$117.80 delivered**.
- So A$169 is 12.7% *above* the floor.
- At a rule-compliant A$129 (14% under A$149.95), GP is −A$15 on a 100-unit LCL first order, +A$5 on a 20GP and +A$18 (16%) on a full 40HQ.
- A 180 cm fluted+LED variant at A$149 (12% under ALFORDSON's A$169.95) makes −A$7 (LCL), +A$12 (20GP) and +A$28 (40HQ).

### Cited Findings
**Price to beat (Amazon AU)**
- **Artiss 160 cm TV unit "Fluted Style Design" (lowest):** A$149.95 ("−53%", RRP A$318.95), FREE delivery Fri 16 Oct; "anti-tip kit included" — [B0GJRDBT14](https://www.amazon.com.au/dp/B0GJRDBT14).
- **Other fluted units (Best Sellers prices; delivery not shown):**
  - Artiss 180 cm fluted: A$179.95 — [B0HJQN54WQ](https://www.amazon.com.au/dp/B0HJQN54WQ).
  - ALFORDSON 180 cm fluted 4-door, E1 particleboard, 37 kg: A$169.95 — [B0FBLVZJG7](https://www.amazon.com.au/dp/B0FBLVZJG7); also [B0DJ2FCMLL](https://www.amazon.com.au/dp/B0DJ2FCMLL).
  - Artiss 150 cm fluted: A$156.95 — [B0FKMDBZRN](https://www.amazon.com.au/dp/B0FKMDBZRN).
- **LED units:**
  - Ufurniture 160 cm LED (160×30×38 cm, 22 kg): New (2) from A$82.90 + A$34.90 delivery = **A$117.80** — [B0CX8WNVS4](https://www.amazon.com.au/dp/B0CX8WNVS4).
  - Advwin 160 cm LED with "2 AC outlets": A$151.90 — [B0H8DX7W12](https://www.amazon.com.au/dp/B0H8DX7W12).
  - Artiss 160 cm RGB LED app-controlled (45.95 kg, two packages): A$167.95 — [B0H83C3RV1](https://www.amazon.com.au/dp/B0H83C3RV1).
  - Oikiture 180 cm RGB LED: A$186.92 — [B0BLH9K76C](https://www.amazon.com.au/dp/B0BLH9K76C).
- **Original comparator:** Artiss 190 cm extendable, still A$186.87 — [B0DZM5XJDN](https://www.amazon.com.au/dp/B0DZM5XJDN).
- TV Stands Best Sellers — [BS TV Stands](https://www.amazon.com.au/gp/bestsellers/home/14899549051), [page 2](https://www.amazon.com.au/gp/bestsellers/home/14899549051?pg=2).

**Other floors**
- Advwin (brand-direct):
  - 152 cm LED unit with "water corrugated side panels": A$119.90 — [Advwin](https://www.advwin.com.au/products/advwin-led-tv-unit-152cm-with-water-corrugated-side-panels-110101005).
  - 160 cm RGB LED with 2 AC outlets: A$129.90 — [Advwin](https://www.advwin.com.au/products/advwin-160cm-tv-unit-cabinet-with-rgb-led-light-110101400).
- IKEA: LACK 160 A$99; KALLAX A$129; BRIMNES 180 A$169; SKRUVBY 156 A$169; BESTÅ 180 A$195 — [IKEA TV benches](https://www.ikea.com/au/en/cat/tv-benches-10810/).
- Amart: ALAN A$149; ALBEMARLE A$179 — [Amart](https://www.amartfurniture.com.au/living/entertainment-units).
- Kmart (undated search snippets):
  - Own-brand Thorne A$99 / Isla A$109 / Ryan A$119; none is fluted — [Kmart Ryan](https://www.kmart.com.au/product/ryan-entertainment-unit-43553914/).
  - Marketplace Alpine Bay Zara fluted 200 cm: A$249 — [Kmart](https://www.kmart.com.au/product/alpine-bay-zara-fluted-entertainment-unit-200cm-white-110162933/).

**Factory**
- **Shandong Sail Furniture** — [Sail](https://sail-furniture.en.made-in-china.com/product/vaWUPEyJqLrk/China-Living-Room-Bedroom-Hotel-Modern-Contemporary-LED-Light-TV-Stands.html):
  - LED TV stand: US$42 (100–499) / US$40 / US$38 (1,000+), as in the original notes; the page shows US$38–42; MOQ 100 pcs.
  - Packing: "1pc/ctn; Polyfoam + Carton". The package field reads 160×50×75 cm, 30 kg, which is implausible for flat-pack.
  - "Manufacturer/Factory & Trading Company"; established 2017-05-10; **20 employees**; 2,948 m².
- **Shandong Feilu Home Furniture** — [Feilu](https://feilufurniture.en.made-in-china.com/product/JaAYqeKGuprk/China-LED-Lights-and-Power-Outlet-Entertainment-Center-TV-Stand-Cabinet-for-55-60-65-Inch-TV.html):
  - LED + power-outlet unit: US$38.50–42.20, MOQ 100; 5-layer carton with polyfoam.
  - HS 9403609990; 5,000 pcs/month; Diamond; sample US$80.
- **Zhangzhou Yijiaxing** — [Yijiaxing](https://zzyijiaxing.en.made-in-china.com/product/ZzbpFdfTLacO/China-Modern-TV-Stand-Wooden-Console-Table-with-Fluted-Sliding-Door-Hidden-Storage.html):
  - Fluted sliding-door TV stand: US$27.50 (200–499) / US$26.50 / US$25.50 (1,000+).
  - Carton 125×48×14 cm (0.084 CBM), 26 kg. Sized about 120 cm, below the target 160–190 cm.
  - Manufacturer & Trading; 430 staff; 12,522 m².
- **Jianmu Shijia Furniture Factory** — [Jianmu](https://jianmu-furniture.en.made-in-china.com/product/htWYHAeDsjpJ/China-MID-Century-Modern-Fluted-TV-Stand-with-Storage-in-Walnut-Finish.html):
  - Fluted walnut stand: US$43.80–49.80; 98×47×17 cm (0.078 CBM), 18 kg. Audited, Gold.
- **Shouguang E-Home** (Trading Company, 4 employees, 72 m², so a trader) — [E-Home](https://ehomewood.en.made-in-china.com/product/iGHpmDRYTWUV/China-Fluted-TV-Stand-for-Living-Room.html):
  - Fluted stand: US$36.80, MOQ 100; 145×40×20 cm (0.116 CBM), 22 kg.

**Compliance: toppling furniture**
Source: Consumer Goods (Toppling Furniture) Information Standard 2024 — [F2024L00512](https://www.legislation.gov.au/F2024L00512/asmade/2024-05-03/text/original/pdf).
- **Scope (s4).** "category 2 furniture means an entertainment unit", with no height threshold. An entertainment unit is one "designed to be used primarily to house, support or carry a television".
- **Exclusions.**
  - s5(2): wall-affixed units that "cannot be used properly unless … affixed".
  - s6: second-hand items.
- **Online warnings (s7).** The rule applies where a person "carries on a business that supplies toppling furniture" and "uses an electronic platform". An "electronic platform" includes "an online marketplace … whether operated by the business or another business". The warning must be in the description and be "clearly visible, prominent and legible". It must include:
  - an upper-case alert word;
  - "an internationally recognised safety alert symbol";
  - a pictogram of a child climbing, crossed out;
  - "children have died from furniture toppling over";
  - for category 2: "always secure your television with an anchor device" and "never allow children to stand, climb or hang on drawers, doors, or shelves".
- **Permanent label (s9).** It must be "permanent and durable", "last the lifetime of the product" and be "visible when the toppling furniture is empty", and must state "this is a permanent label. Do not remove!".
- **Instructions (s10).** The warning must also appear in the assembly instructions.
- **Commencement.** 12 months after registration (registered 3 May 2024).
- **Competitor practice.** Advwin's listings already carry this wording ("Applies to all entertainment units") — [Advwin](https://www.advwin.com.au/products/advwin-157cm-tv-unit-cabinet-w-power-outlet-led-light-110103300).

**Compliance: electrical** — [EESS v4.3](https://www.eess.gov.au/wp-content/uploads/2024/07/EESS-Inscope-Equipment-Definitions-and-Risk-Levels-v4.3-Approved.pdf)
- "Power supply or charger" (Level 3) includes ELV supplies "to provide supply to separate luminaires".
- "Decorative lighting outfit" (Level 3) covers portable light sources "within a flexible enclosure", including "any integral power supply or control device".
- Cord-extension sockets and outlet devices are Level 3 (per the EESS list in au_landed_cost_compliance.md).

### Inferences
**Inputs**
- FOB US$45 (Sail/Feilu US$38–42; Jianmu US$43.80–49.80).
- 0.15 CBM and 38 kg: **estimates** scaled from the 0.084–0.116 CBM cartons and ALFORDSON's 37 kg weight.
- Compliance A$800 one-off: A$300 label artwork + A$500 EMC report review (estimates).
- A$1.50/unit for label, anchor kit and insert (estimate).

**First order, LCL, 100 units** (cheaper than 20GP-100 at A$59.08):
- FOB 64.69
- freight (244×15 + 900)/100 = 45.60
- PSI 4.00
- storage 4.95
- compliance 9.50
- subtotal 128.74, defects 3.86 → **landed A$132.60**

**Larger orders:** 20GP-186: landed A$112.64. 40HQ-453: landed A$98.89.

**GP by scenario**

| Price | LCL-100 | 20GP-186 | 40HQ-453 |
|---|---|---|---|
| A$129 | −A$15.33 | +A$4.63 | +A$18.39 (15.7%) |
| A$129, FOB US$40 | — | — | +A$25.79 |
| Original A$169 (not rule-compliant) | +A$21.03 | — | +A$54.75 |

Variants and sensitivities:
- **180 cm fluted+LED variant** at A$149 (FOB US$48, 0.17 CBM): −A$7.30 / +A$12.41 / +A$28.05.
- **Break-even price:** A$145.86 (LCL-100) / A$108.78 (40HQ).
- **Carton at 0.18 CBM:** LCL-100 GP −A$23.89.
- **Mains-adapter LED** (Level 3 power supply, +A$3,330 estimated certification and fees): LCL-100 GP −A$49.63.

**Reasoning (score 3)**
- The fluted and LED looks are now commodity on Amazon AU (Artiss, ALFORDSON, Advwin, Ufurniture), with free or cheap delivery.
- The cheapest fluted unit undercuts the old target by A$19. A first LCL order loses money; only container scale earns A$12–28 per unit.
- There are further risks:
  - Artiss's A$149.95 is a "−53%" promotional price. If it ends, the floor reverts to about A$169.95–179.95, which gives the 180 cm-variant economics.
  - Particleboard damage rates likely exceed 3% (original notes: Artiss case goods rate 3.4–3.6★).
  - The toppling standard applies to the Marketplace listing itself.

**Compliance inferences**
- Design the LED as **USB-powered 5 V with an IR remote**. Do not include a mains plug-pack driver or built-in AC outlets: those are Level 3 items needing an AU/NZ certificate.
- App, Bluetooth or RF remotes add ACMA radio and RCM obligations.
- Use particleboard/MDF with metal legs to avoid timber treatment paperwork.

### Gaps
- No verified carton CBM or weight for a 160–190 cm fluted+LED unit; 0.15–0.18 CBM is an estimate.
- Kmart prices are undated snippets.
- Fantastic Furniture TV units were blocked; Temu not readable.
- The duration of Artiss's A$149.95 promotion is unknown.
- Delivery fees for Best Sellers-only listings (ALFORDSON, Artiss 180) were not visible.

---

## Q4. Queen pocket-spring mattress-in-a-box: does "A$165, ~A$24 GP (16%) at US$59 FOB, break-even US$75, score 5" hold?

### Takeaway
**Verdict: REVISED, score 5 (unchanged); moves up to rank 2.**
- **Price floor confirmed:** Giselle Queen 22 cm pocket-spring is **New (5) from A$186.95 with FREE delivery** and "100+ bought in past month". A$165 is 11.7% below it.
- **On the shared freight basis, the economics are scale-dependent.**
  - At US$59 FOB, GP is **A$2.70 (1.8%) on a 100-unit LCL first order**, A$21.10 (14%) on a full 20GP (193 units) and A$33.51 (22%) on a 40HQ (472 units).
  - Break-even FOB is US$61 (LCL-100), US$73 (20GP) and US$82 (40HQ), versus the original's single US$75.
- Aussie Hcl now lists its queen pocket-spring at a flat US$48 (MOQ 5). At US$48, GP is A$19 / A$37 / A$50.

### Cited Findings
**Price to beat**
- **Amazon AU, Giselle Queen 22 cm pocket spring (cheapest):** New (5) from **A$186.95 & FREE Delivery**, "100+ bought in past month", 356 ratings — [B087TPK886](https://www.amazon.com.au/dp/B087TPK886). The Best Sellers tile shows A$189.95 (#4 in Mattresses) — [BS Mattresses](https://www.amazon.com.au/gp/bestsellers/home/4975329051).
- **Other Amazon AU pocket-spring queens (all free delivery):**
  - VitaMorn 30 cm hybrid (28 kg): A$203.99 — [B0GYYSS7DL](https://www.amazon.com.au/dp/B0GYYSS7DL).
  - Giselle 30 cm euro top: A$219.95 — [B076P2PW2Y](https://www.amazon.com.au/dp/B076P2PW2Y).
  - Zinus 15 cm iCoil pocket spring: A$229.00 — [B0D78HY9V7](https://www.amazon.com.au/dp/B0D78HY9V7).
  - Giselle 34 cm: A$271.92, "50+ bought" — [B07MXFK3J8](https://www.amazon.com.au/dp/B07MXFK3J8).
- **Fantastic Furniture:** foam queen A$159; Sleeptight A$229; Sleepscape A$257 (was A$429); Persain 26 cm 7-zone spring A$249; MellowCool Bonnell spring 22 cm A$279 — [FF queen](https://www.fantasticfurniture.com.au/c/queen-mattresses).
- **Amart:** BLISS queen A$249 — [Amart](https://www.amartfurniture.com.au/bedroom/mattresses/queen).
- **IKEA:** VALEVÅG pocket-sprung queen A$399 — [IKEA](https://www.ikea.com/au/en/cat/spring-mattresses-24828/).
- **Kmart:** euro-top pocket-spring queen, A$229 on one cached page and A$309 on others; Bedbuyer lists A$309 (review updated 30 Jan 2026) — [Kmart](https://www.kmart.com.au/product/queen-bed-euro-top-pocket-spring-mattress-42932192), [Bedbuyer](https://bedbuyer.com.au/kmart-pocket-spring-mattress/) (search snippets).
- **Dated deals:**
  - ALDI pocket-spring queen A$239 (12 Jul 2026) — [OzB 967551](https://www.ozbargain.com.au/node/967551).
  - Zinus queen A$157.05 (6 Aug 2026) — [OzB 970393](https://www.ozbargain.com.au/node/970393).

**Factory**
- **Foshan Aussie Hcl** — [Aussie Hcl](https://fsaussiehcl.en.made-in-china.com/product/qRFrxVCkrDhs/China-Queen-Size-Compressed-Vacuum-Pocket-Spring-Mattress-OEM-ODM-Home-Bedroom-Use.html):
  - Queen pocket spring: **US$48.00, MOQ 5**; other listings US$47–89.
  - Loading table: "Queen | 60*80 | … | 30*30*160 | 472 | 193", i.e. 0.144 CBM, 472 per 40HQ, 193 per 20GP. The generic gross-weight field says 45 kg.
  - Audited by TÜV Rheinland; established 2014-04-23; 61 staff; 8,000 m²; Manufacturer & Trading; lists OEKO-TEX and CertiPUR-US.
- **Guangdong Sweetnight** — [Sweetnight](https://sweetnight.en.made-in-china.com/product/ofJRdOIwXgrY/China-King-Size-Pocket-Spring-Mattress-Colchones-Comprimidos-Al-Vacio-for-Hotel-Use.html):
  - King pocket spring: US$39–59, MOQ 30 pcs; 192×32×32 cm, 45 kg.
  - ISO9001/45001/14001; 409 staff; 32,666 m²; lists CFR1633/BS7177.
- **Foshan Qisheng Sponge** (Audited, Manufacturer/Factory; established 2013; 130 staff) — [Qisheng](https://fsqisheng.en.made-in-china.com/product/bYlRVXdAHtWU/China-Betsy-Vacuum-Roll-Packed-Pocket-Spring-Mattress-in-Box-for-Easy-Home.html):
  - "Betsy" roll-packed pocket spring: US$35–73 in search results, but the product page shows US$98 (conflict).
  - MOQ 50; 0.01–0.18 m³; 10–76 kg.
- **Qingfeng Mianxin:** hybrid pocket spring US$49–129 — [Mianxin](https://qfmianxin.en.made-in-china.com/product/EdIGAocVnZtw/China-Hybrid-Pocket-Spring-Mattress-Manufacturer-Luxury-Hotel-Memory-Foam-Mattress-Roll-Packed-OEM-Mattress.html).
- **Foshan Comfort Home:** US$63.20 — [Comfort Home](https://comfort-home.en.made-in-china.com/product/PRmUqifdVxkg/China-Compressible-Mattress-Quality-Price-High-Density-Foam-Roll-Pocket-Spring-Comfort.html).

**Compliance**
- **Care labelling.** Care Labelling Information Standard 2023 s6(1): "Regulated goods are any … bedding (including sleeping bags), mattresses, bed bases…". Labels must be in English and "clearly legible", to AS/NZS 1957 (s11) or ISO 3758 (s12) — [F2023L01187](https://legislation.gov.au/F2023L01187/asmade/2023-09-04/text/original/pdf).
- **Duty.** 9404.21/9404.29 mattresses are Free — [ABF ch.94](https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff/schedule-3/section-xx/chapter-94).
- **Flammability.** No Australian mandatory flammability standard for adult mattresses was found. The 2024 infant sleep standards cover infant products only — [Compliance Gate furniture guide](https://www.compliancegate.com/furniture-regulations-australia/) (search summary only).

### Inferences
**Inputs:** FOB US$59 base; 0.144 CBM (cited); GW 30 kg (estimate); duty Free; compliance A$500 one-off + A$0.30/unit (estimate).

**First order, LCL, 100 units** (cheaper than 20GP-100 at A$59.08):
- FOB 84.82
- freight (244×14.4 + 900)/100 = 44.14
- PSI 4.00
- storage 4.75
- compliance 5.30
- subtotal 143.01, defects 4.29 → **landed A$147.30 → GP A$2.70**

**Larger orders:**
- 20GP-193: freight 30.61 → landed A$128.90 → **GP A$21.10**.
- 40HQ-472: freight 21.32 → landed A$116.49 → **GP A$33.51**.

**FOB sensitivities (GP per unit)**

| FOB | LCL-100 | 20GP-193 | 40HQ-472 |
|---|---|---|---|
| US$48 | +A$18.99 | +A$37.39 | +A$49.80 |
| US$75 | −A$20.99 | −A$2.59 | +A$9.82 |

**Reasoning (score 5)**
- Strengths:
  - the price floor is confirmed;
  - demand is the strongest of the four;
  - duty is Free;
  - roll-packs are dense and car-portable;
  - compliance is light (a care label).
  - These make it the second-best SKU and the cheapest to test, at A$13–15k for a first order.
- Weaknesses:
  - a first LCL order is roughly break-even unless FOB is ≤US$55 for a spec that truly matches Giselle 22 cm;
  - unboxed mattresses cannot be returned or resold;
  - FF foam at A$159 and Zinus deals near A$157 sit below the target;
  - Kmart and ALDI periodically hit A$229–239.
- Viable at 20GP+ with a negotiated FOB of about US$50.

### Gaps
- The Aussie Hcl US$48 listing's spec (height, coil count, comfort layers) is unknown. No RFQ was sent.
- Queen gross weight was not listed (30 kg is an estimate).
- The adult-mattress flammability position rests on a search summary; productsafety.gov.au was blocked.
- Kmart's current price is unresolved (A$229 vs A$309).

---

## Q5. Reconciliation with au_retail_price_benchmarks.md (coordinator request) and revised ranking

### Takeaway
**The benchmark's "electric standing desk ≈ A$140–190 delivered" is the single-motor class.** It does not conflict with the dual-motor floor, but it does cap it.
- Every cheap desk checked is single-motor or unspecified, 100–140 cm wide, with 60–80 kg capacity and often a spliced top.
- The verified dual-motor floors are:
  - A$199.99 for a frame only (Amazon);
  - A$319.90 complete (Advwin direct, plus delivery);
  - A$439.99 complete (Amazon, FLEXISPOT E3).
- Marketplace buyers will treat single-motor desks as partial substitutes, so a dual-motor desk cannot be priced far above about A$300.

Mesh and gaming chair floors agree across both files (about A$74–78 and about A$100–110).

**Revised ranking:**
1. Desk 6/10 (REVISED)
2. Mattress 5/10 (REVISED)
3. TV unit 3/10 (BROKEN as specified)
4. Recliner 2/10 (BROKEN)

### Cited Findings
**Benchmark sources, and what they actually are**
- Benchmark file (au_retail_price_benchmarks.md): "Electric standing desk: about $140–$190 delivered". Its inputs, with the sources it cites:
  - PORIYA A$139.99 — [BS Home Office](https://www.amazon.com.au/gp/bestsellers/home/4975233051).
  - Ergomaker 140×60 A$149.20 (2 Jun 2026) — [OzB 961614](https://www.ozbargain.com.au/node/961614).
  - Ergomaker 170×60 A$183.20 (15 Jun 2026) — [OzB 963552](https://www.ozbargain.com.au/node/963552).
  - FlexiSpot E1 A$169.99–199.99 — [OzB 969291](https://www.ozbargain.com.au/node/969291).
  - ALDI SOHL A$189 — [OzB 960910](https://www.ozbargain.com.au/node/960910).
  - Kmart Marketplace Costway A$149.95–269.95 — [Kmart snippet](https://www.kmart.com.au/product/costway-compact-electric-standing-desk-height-adjustable-computer-desk-80-x-60cm-black-110191687/).
  - Advwin 100 cm A$149.99 and 120×60 A$159.90 — [Advwin 100 cm](https://www.advwin.com.au/products/advwin-electric-standing-desk-height-adjustable-100cm-160211400), [Advwin 120×60](https://www.advwin.com.au/products/advwin-electric-height-adjustable-standing-desk-120x60cm-160219700-160219600-160219500).
- **Motor count checked:**
  - PORIYA: 120×60, "motorized lift mechanism", 60 kg max — [B0D5GVTN9G](https://www.amazon.com.au/dp/B0D5GVTN9G).
  - Giantex 140×70: "a robust motor", four-piece desktop — [B0CXHYLVZM](https://www.amazon.com.au/dp/B0CXHYLVZM).
  - ERGOMAKER 170×60: "a robust motor", 70 kg — [B0D9BBZ8VW](https://www.amazon.com.au/dp/B0D9BBZ8VW).
  - ALDI SOHL A$189: an OzBargain comment says "This one only has a single motor"; another says "120cm" (28 May 2026) — [OzB 960910](https://www.ozbargain.com.au/node/960910).
  - Fantastic Furniture names "Single Motor" on its Gracia, Sancho, Lonsdale, Trudie and Trinny desks (A$349–449) and "Dual Motor" only on the Wendie 160 cm (A$579). Its other electric desks (A$159–779) don't state a motor count — [FF](https://www.fantasticfurniture.com.au/c/standing-desks).
- **Buyer attitudes, same OzBargain thread:**
  - "Single motor is quite slow but does the job if you're not changing too often".
  - "Dual motor eliminates this issue and they are not that expensive… if you already have a desk, it's cheaper to buy a motorised frame" — [OzB 960910](https://www.ozbargain.com.au/node/960910).
- **Chairs (Amazon Home Office Best Sellers, 9 Oct):** ALFORDSON Arco mesh A$77.95; Oikiture mesh headrest chair A$75.57; Marsail A$99.98; PORIYA gaming chair A$109.99; ALFORDSON massage gaming chair A$135.95 — [BS Home Office](https://www.amazon.com.au/gp/bestsellers/home/4975233051).
  - The furniture file had Artiss headrest mesh at A$74.95 (verified new, free delivery) and PORIYA gaming at A$99.99 — [B0FBF43SVL](https://www.amazon.com.au/dp/B0FBF43SVL), [B0CXNW6BQZ](https://www.amazon.com.au/dp/B0CXNW6BQZ).
  - The benchmark file has mesh at about A$80–170 and gaming at about A$110–130.

### Inferences
**Desk reconciliation**
- The A$140–190 floor applies to single-motor desks. It is not a dual-motor floor, and the furniture file's "dual-motor floor A$348" was also wrong in the other direction (unverifiable).
- The correct dual-motor anchors are A$319.90 (Advwin, complete, plus delivery) and A$439.99 (Amazon, complete). Frame-only is A$199.99.
- Substitution is partial:
  - Buyers wanting 160 cm+ tops, 100 kg+ loads or speed pay for dual motors (FF and IKEA charge A$579–659).
  - Mainstream Marketplace buyers will compare A$299 against a free-delivered A$199.95 140×70 single-motor desk.
- So the A$299 target is a ceiling. The sales pitch must be "dual motor, 100 kg+, faster, sturdier", shown in the listing.

**Chair reconciliation**
- Mesh chairs agree at about A$74–78 in both files.
- Gaming chairs: today's PORIYA price is A$109.99, so the furniture file's A$99.99 was an earlier offer. Use A$100 (IKEA HUVUDSPELARE, per the furniture file) to A$110 as the floor.
- Neither changes the furniture file's low scores for chairs.

**Revised ranking**

| Rank | SKU | Verdict | Old score | New score | Key numbers |
|---|---|---|---|---|---|
| 1 | Dual-motor desk | REVISED | 7 | 6 | A$299 target; GP A$47 (LCL-100) / A$84 (20GP) / A$95 (40HQ) |
| 2 | Queen pocket-spring mattress | REVISED | 5 | 5 | GP A$3 (LCL-100) / A$21 (20GP) / A$34 (40HQ) at US$59 FOB |
| 3 | Fluted/LED TV unit | BROKEN as specified | 6 | 3 | Floor A$149.95; at A$129, GP −A$15 / +A$5 / +A$18 |
| 4 | Manual fabric recliner | BROKEN | 6 | 2 | Like-for-like floor A$160.95 delivered; GP −A$67 to −A$96 |

**Next step.** Before committing capital, test the desk and mattress with a 20GP-scale RFQ and a logged-in Marketplace sell-through check. Capital needed: A$51k for 274 desks or A$25k for 193 mattresses.

### Gaps
- No Facebook Marketplace asking prices or sell-through data (login wall). This remains the largest unknown for 20GP/40HQ volumes.
- Kogan, Officeworks and Temu floors are unobserved; Kmart prices are snippets only.
- No supplier quotes; all FOB figures are listing prices.
- No Sydney/Melbourne postcode-specific delivery quotes for Advwin, Artiss or ALFORDSON items.
