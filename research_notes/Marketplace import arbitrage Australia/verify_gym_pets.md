# Verification of the shortlisted home-gym and pet SKUs: China factory direct to Facebook Marketplace (Australia)

*Research date: 9 Oct 2026. Scope: four SKUs that were ranked in vertical_home_gym.md and vertical_pets_garden.md: the 100 kg bumper-plate set, the 2×40 kg dial dumbbell pair, the 8/12/16 kg kettlebell set and the 48-inch steel dog crate. A fifth section re-tests the mixed 20GP container.*

*Shared base assumptions (from the brief, used for every number below):*
- *FX: US$1 = A$1.4376.*
- *20GP: A$5,964 per box, 28 CBM usable, 21.8 t weight cap. The cap is the QLD/SA/WA figure; NSW allows 24.3 t and VIC 23.8 t.*
- *40HQ: A$148/CBM × 68 CBM = A$10,064 per box, 20.0–22.8 t cap.*
- *LCL: A$244 per W/M, where W/M is the greater of CBM or tonnes, plus A$900 fixed per shipment.*
- *Duty: 0% with a ChAFTA certificate of origin; 5% is shown as a sensitivity.*
- *Pre-shipment inspection (PSI): A$400 per factory per order.*
- *Handling: A$5 per sellable unit.*
- *Defect/damage allowance: 3% of landed cost, applied to the subtotal.*
- *Net revenue = price ÷ 1.1. No Marketplace fee.*

*Cost formula: landed = 1.03 × (FOB × 1.4376 + freight per unit + duty + PSI per unit + A$5). GP = net revenue − landed.*

*Cash outlay = units × the pre-allowance subtotal, excluding the import-GST float. The GST float is estimated at 10% × (FOB + duty + 60% of freight); that estimate is mine.*

*Payback = cash ÷ net revenue per unit.*

*Access notes:*
- *Amazon.com.au product and Best Sellers pages were fetched directly with curl.*
- *This connection is geolocated to the US, so every Amazon product page showed "Deliver to United States" and "Currently unavailable". The offers panel said "Currently, there are no other sellers matching your location". Changing the postcode requires "Sign in to update your location", so it was not attempted.*
- *Amazon prices below are therefore item prices from Best Sellers lists and "similar items" carousels ("1 offer from A$X"). Amazon delivery fees could not be seen for any item.*
- *Later Amazon requests returned bot-check pages, which were not bypassed.*
- *Kmart, Bunnings and the Australian Anti-Dumping Commission (ADC) PDF returned HTTP 403 or 503, so their figures are search-engine snippets, tagged "(snippet)".*
- *Lifespan Fitness, Everfit and Advwin prices were read live from their public Shopify search endpoints. Rebel prices came from its live search pages.*
- *Made-in-China (MIC) search and product pages were read directly. No supplier was contacted and no account was used.*

## Q1. 100 kg Olympic bumper-plate set: do the price to beat, the FOB and the GP hold? (original: score 6, A$339 target vs A$400 Amazon, ~A$75 GP / 24% in a 20GP, A$53 / 17% by LCL)

### Takeaway
**CONFIRMED (score stays 6/10).**
- **Price to beat:** the cheapest new 100 kg rubber bumper set seen is BRIXX Classic at A$400 on Amazon AU. That figure comes from search snippets only and could not be opened. The next floors were verified: CORTEX V3 100 kg at A$464.09 (Lifespan, live), BRIXX PRO 100 kg at A$575 (Bunnings Marketplace) and A$670–691 at Harvey Norman. A$339 sits 15% below the A$400 snippet price and 27% below the verified A$464 CORTEX price.
- **FOB:** the US$1.00–1.50/kg band holds across eight-plus MIC listings, with manufacturer Nantong Tengtai at US$1.00/kg.
- **Recomputed GP:** about **A$79 per set (25.8%)** in a weight-capped 20GP of 211 sets, and **A$58 (18.8%)** by 50-set LCL. That is slightly better than the original A$75 / 24%.
- **Risk** is on the demand side: selling 100–200 heavy sets, plus used-plate competition. The economics themselves hold.

### Cited Findings
#### Price to beat (new 100 kg rubber bumper sets, AU, observed 9 Oct 2026)
- **Amazon AU, BRIXX Classic 100 kg package: A$400.** Shown on Amazon AU search pages (snippet). The separate BRIXX PRO Black 100 kg set page (ASIN B0FSR3153H) showed "currently unavailable" in the snippet. Delivery fee not visible. — [Amazon AU BRIXX PRO 100 kg](https://www.amazon.com.au/BRIXX-Classic-Olympic-Bumper-Plates/dp/B0FSR3153H); [Amazon AU search](https://www.amazon.com.au/bumper-plate-set/s?k=bumper+plate+set)
- **Amazon AU, BRIXX Classic 100 kg + 20 kg barbell: A$675**, "sold and shipped by BRIXX Fitness AU" (snippet). — [Amazon AU](https://www.amazon.com.au/BRIXX-Classic-Olympic-Bumper-Barbell/dp/B0FLKL1F76)
- **Amazon AU Best Sellers, "Plates" category** (fetched 9 Oct 2026; lowest-offer item prices, delivery not visible):
  - CORTEX 70 kg Black Series V3 bumper set, "5 offers from" A$325.56 (#30).
  - CORTEX V3 bumper pairs: 20 kg A$186.03 (#17), 15 kg A$179.00 (#10), 10 kg A$99.00 (#12).
  - METEOR Essential Bumper Plate (#1), from A$112.48, size not shown.
  - PROIRON 5–25 kg bumper, from A$79.99.
  - No BRIXX item appeared in ranks 1–30 or 51–80.
  - Source: [Amazon AU Best Sellers – Plates](https://www.amazon.com.au/gp/bestsellers/sporting-goods/5046690051)
- **Lifespan Fitness (CORTEX brand owner), live product JSON, 9 Oct 2026:** CORTEX 100 kg Black Series V3 Bumper Plate Set **A$464.09** (compare-at A$465.09; 2×5, 2×10, 2×15, 2×20 kg; SKU CSWP-OBPV3ST-B). Pairs: 5 kg A$49.98, 10 kg A$99.99, 15 kg A$138.53, 20 kg A$185.03. 70 kg set A$324.56. Delivery fee not captured (the shipping-policy URL returned 404). — [Lifespan CORTEX 100 kg V3](https://lifespanfitness.com.au/products/cortex-100kg-black-series-v3-bumper-plate-set)
- **Bunnings Marketplace** (snippet; sold and delivered by BRIXX Fitness, online only): BRIXX PRO Black 100 kg set **A$575**; BRIXX Pro Colour 70 kg package A$455; 130 kg set A$750. — [Bunnings 100 kg](https://www.bunnings.com.au/brixx-pro-black-olympic-bumper-plates-100kg-set_p0821254); [Bunnings 70 kg](https://www.bunnings.com.au/brixx-pro-colour-olympic-bumper-plates-70kg-package_p0821261)
- **Kmart Marketplace** (snippet): BodyWorx 20 kg bumper plate, single, **A$85.60**, sold by KG SuperStore, online only. No Kmart own-brand (Anko) bumper plate found. — [Kmart](https://www.kmart.com.au/product/bodyworx-bumper-plate-20kg-olympic-rubber-encased-2-inch-centre-sleeve-black-110074005/)
- **Harvey Norman** (search summary): Morgan Sports 100 kg pack A$670 (ships from supplier, 5+ business days); Cyberfit Econ 100 kg A$691 (online only). — [Harvey Norman Morgan](https://www.harveynorman.com.au/morgan-sports-100kg-olympic-bumper-plates-pack.html); [Harvey Norman Cyberfit](https://www.harveynorman.com.au/cyberfit-econ-100kg-olympic-bumper-plate-set.html)
- **BuyWisely** (snippet): Kingkong 100 kg bumper set + 20 kg bar A$535, delivery A$119–179 depending on seller. — [BuyWisely](https://buywisely.com.au/au/product/100kg-olympic-bumper-plates-set-black-20kg-olympic-barbell-700lb-)
- **Rebel** (live search, 9 Oct 2026): Celsius "Olympic Weight Plate" 20 kg A$159.99, 10 kg A$99.99, 5 kg A$49.99, 2.5 kg A$24.99. No 15 kg Olympic plate was listed, and the tiles do not say whether these are bumpers. — [Rebel search](https://www.rebelsport.com.au/search?q=bumper+plate)
- **Everfit and Advwin** (live Shopify search): no bumper sets, only standard plates (e.g. Everfit standard 2×20 kg A$259.99). — [Everfit](https://www.everfit.com.au/products/everfit-weight-plates-standard-20kgx2-dumbbell-barbell-plate-weight-lifting-home-gym-yellow)
- **Amart Sports** no longer exists. Super Retail Group converted the stores to Rebel and retired the brand from 1 Nov 2017. — [Business News Australia](https://www.businessnewsaus.com.au/articles/super-retail-group-says-goodbye-to-amart-sports-brand.html)
- **Other channels not reached:**
  - Aldi and Big W: no bumper plates in search results.
  - Kogan: no Fortis bumper set found.
  - eBay AU: search pages return an Akamai 403 to fetchers (see competition_listing_sweep.md).

#### Factory FOB (MIC, opened or parsed 9 Oct 2026; all priced per kg)
- **Nantong Tengtai Sporting Fitness Co., Ltd.** (Xianfeng Industrial Park, Nantong, Jiangsu)
  - TDS1018E rubber bumper (5/10/15/20/25 kg): **US$1.00/kg, MOQ 1,000 kg**; sample US$2/kg.
  - Packed in plywood cases; HS 95069119; 500 t/month capacity.
  - Listed package 100×80×45 cm, 60 kg. This is a case figure, not per set.
  - Business type not shown on this page; earlier notes recorded it as Diamond/audited.
  - [MIC](https://tt-sports.en.made-in-china.com/product/mQlUwAIbaHVq/China-Gym-Fitness-Bumper-Plate-Rubber-Competition-Weight-Bumper-Plate.html)
- **Nantong Ironman (Ironmaster) Sporting Industrial Co., Ltd.** (Chongchuan Economic Development Zone, Nantong; established 1996 per listing)
  - **US$1.29–1.49/kg, MOQ 1,000 kg**; sample US$1.5/kg; weight tolerance ±3%; ">8,000" drop tests; peak-season lead time 1–3 months.
  - Its listing shows HS 9503009000 (a toys code) and a 20×20×5 cm / 5 kg package, which is placeholder data.
  - [MIC](https://ironmaster-group.en.made-in-china.com/product/FZyxsYlOlpWn/China-Colorful-Bumper-Plates-for-Strength-Training.html)
- **Shandong Dx Grandway** (trading company per earlier notes): **US$1.20–1.40/kg, MOQ 1,000 kg.** — [MIC](https://dexuhongtu.en.made-in-china.com/product/SauUjfewHPrR/China-Colorful-Rubber-Bumper-Plates-Customized-Logo-Weight-Plate.html)
- **Hebei Dili Sports Commerce** (trading company): **US$1.25–1.35/kg, MOQ 500 kg**; another listing US$1.30–1.50/kg at 1,000 kg. — [MIC](https://dili-fitness.en.made-in-china.com/product/mGkpLSRcYbUO/China-Custom-Logo-High-Density-Rubber-Coating-Colorful-Standard-Weight-Plates-Bumper-Plates-Wholesale.html)
- **Dingzhou Yunlingyu Sports Goods** (Hebei; manufacturer & trading): **US$1.10–1.20/kg, MOQ 100 kg.** — [MIC](https://dingzhouyunlingyu.en.made-in-china.com/product/pwsfUrNCXnVY/China-Professional-Gym-Fitness-Equipment-Weight-Lifting-Bumper-Plates-Color-Barbell-Plates.html)
- **Others on the same search page:**
  - Julyfit US$1.08–1.47/kg (MOQ 500 kg) — [MIC](https://julyfit.en.made-in-china.com/product/WReYKpUVnycM/China-Durable-Custom-Logo-Discounted-Bumper-Home-Gym-Weight-Plates.html)
  - Rizhao Shangshuo US$1.168/kg (MOQ 1,000 kg) — [MIC](https://rizhaoshangshuo.en.made-in-china.com/product/avMJCtGogPRj/China-Colorful-Gym-Steel-Barbell-Competition-Sports-Equipment-Solid-Virgin-Training-Colour-Black-Crossfit-Weight-Rubber-Bumper-Plates-Plate.html)
  - Qingdao Modun US$1.39–1.69/kg — [MIC](https://qdmodun.en.made-in-china.com/product/ldFTLtsUHkaA/China-Wholesale-Fitness-2-5-25kg-Weightlifting-Discs-Equipment-Barbell-Weight-Kg-for-Home-Gym-Bumper-Plates.html)
  - Rizhao F-Leader US$1.49–1.69/kg; Ok Sporting US$1.60–1.91/kg
  - Search page: [MIC bumper plate search](https://www.made-in-china.com/products-search/hot-china-products/Bumper_Plate.html)
- **Packing data:** no listing gave a per-set carton size or gross weight.

#### Freight and compliance inputs
- **Container cargo limits** (ICE Cargo, "general guide only"):
  - 20ft GP: 24.3 t NSW, 23.8 t VIC, 21.8 t QLD/SA/WA/TAS.
  - 40ft HC: 22.5 / 22.0 / 20.0 t.
  - Source: [ICE Cargo](https://icecargo.com.au/transport-options/), as cited in vertical_home_gym.md.
- **Tariff:** 9506.91.00 is shown at 5% general and Free under ChAFTA by an aggregator. The official Schedule 3 page returned 403 in earlier work. — [Treayo](https://treayo.com/en/hs/australia/95069990)
- **ISPM 15 (DAFF page, snippet):** packaging made entirely of reconstituted wood, plywood or veneer is exempt from the declaration rule if it is free of solid wood, bark and soil. — [DAFF ISPM 15](https://www.agriculture.gov.au/biosecurity-trade/import/goods/timber-packaging/ispm-15)

### Inferences
#### Recomputed landed cost and GP (shared base)
**Assumed per-set shipping basis: 0.10 CBM and 103 kg gross.** This is an estimate: 450 mm-diameter plates stacked about 40–45 cm high (≈0.08–0.09 CBM), plus carton or pallet share.

**20GP, weight-limited:**
- Sets per box: 21,800 kg ÷ 103 = **211 sets** (21.7 t, 21.1 CBM of 28).
- Per set:

  | Line | A$ |
  |---|---|
  | FOB: 100 kg × US$1.30 = US$130 × 1.4376 | 186.89 |
  | Freight: 5,964 ÷ 211 | 28.27 |
  | Duty | 0 |
  | PSI: 400 ÷ 211 | 1.90 |
  | Handling | 5.00 |
  | **Subtotal** | **222.05** |
  | Defect allowance (3%) | 6.66 |
  | **Landed** | **228.71** |

- Net revenue: A$339 ÷ 1.1 = A$308.18, so **GP = A$79.47 (25.8%)**.
- Cash ≈ A$46.9k, plus ≈A$4.3k import-GST float (reclaimed).
- Payback after ≈152 of 211 sets. Total GP if all sell ≈ A$16.8k.

**LCL, 50 sets:**
- W/M per set = max(0.10 CBM, 0.103 t) = 0.103, so the shipment is billed on weight: 5.15 W/M.
- Freight: 5.15 × 244 = A$1,256.60, plus A$900 = A$2,156.60, i.e. A$43.13 per set.
- PSI: A$8.00 per set.
- Landed A$250.31, so **GP = A$57.87 (18.8%)**.
- Cash ≈ A$12.2k.

**Sensitivities (20GP GP per set):**

| Case | GP per set | GP % |
|---|---|---|
| FOB US$1.00/kg (Tengtai) | A$123.89 | 40.2% |
| FOB US$1.50/kg | A$49.86 | 16.2% |
| 5% duty (no CoO) | A$69.85 | 22.7% |
| Price A$320 (20% below A$400) | A$62.20 | 21.4% |
| Price A$359 (10% below A$400) | A$97.65 | 29.9% |
| NSW 24.3 t cap (235 sets) | A$82.64 | 26.8% |
| LCL at US$1.50/kg | A$28.26 | 9.2% |

**Versus the original:**
- The original showed A$233.65 landed and A$74.53 GP (24.2%).
- The small improvement comes from the brief's flat A$5 handling (versus A$3 + A$60/CBM before) and the FX change.

#### Compliance and risk
- **No mandatory Australian standard for free weights** was identified in the earlier notes, and nothing new turned up. General Australian Consumer Law guarantees apply (inference).
- **Classification:** declare 9506.91 and obtain the ChAFTA CoO. Note that one supplier's listing shows a toys HS code, so the commercial invoice classification needs checking.
- **Packaging:** Tengtai ships in plywood cases, which are exempt from ISPM 15 if free of solid wood. Solid-wood pallets or cases need ISPM 15 marks.
- **Demand risks:** 100 kg sets are heavy for Marketplace buyers to collect. Used plates hold value, so expect used competition. Weight-limited stock turns slowly.

#### Verdict: CONFIRMED, score 6/10 (unchanged)
- The margin case is robust. FOB is verified across many named suppliers; the A$339 price sits 15% under the lowest snippet price and 27% under the verified CORTEX price; and the unit economics clear 16% even at US$1.50/kg.
- It does not rise above 6 because demand and sell-through for 100–200 sets are unverified, the A$400 Amazon anchor could not be opened, and the product is commodity-like with established AU brands (CORTEX, BRIXX).
- **Upside:** if the A$400 BRIXX listing is unavailable, the effective floor is A$464. Pricing at A$359–379 would then still be more than 18% below it and lift GP to ≈A$98–116 per set.

### Gaps
- The Amazon AU BRIXX Classic 100 kg A$400 price, its seller and its delivery fee could not be opened (bot check; US geolocation).
- Delivery fees for the Lifespan, Bunnings and Harvey Norman sets were not captured.
- No supplier states per-set carton CBM or gross weight. The 0.10 CBM / 103 kg basis is an estimate, which matters only for LCL billing and for the mixed box.
- Prices are listing ranges, not quotes, and packaging (cartons, pallets) may be extra.
- eBay AU importer listings (Everfit, CORTEX, Fitness Master, Powertrain) were not reachable.

## Q2. 2×40 kg dial / quick-adjust dumbbell pair: is the ~US$160/pair FOB real, and does ~A$71 GP hold? (original: score 6, A$379 vs A$449.99, A$71 / 21%)

### Takeaway
**REVISED down (score 6 → 4).**
- **Price to beat confirmed:** the Fitness Master 2×40 kg (17-setting dial) at A$449.99 is still the cheapest current pair on Amazon AU. Next are fitnessLAB at A$499 and Cortex Revolock V2 at A$699.
- **Demand evidence is thin:** the Fitness Master listing has 1 rating and ranks #249 in Dumbbells.
- **The FOB estimate was optimistic.** Every 40 kg listing found is priced **per single dumbbell**:
  - Yiwu Jiai: US$88.00 (1–99 pcs) / US$81.84 (100+).
  - Xiamen F-Orchid: US$86.00 (MOQ 50).
  - Dezhou Ranao: US$80–85 per "set" (unit ambiguous).
  - Nantong Vigor: US$72–105 across 20–40 kg.
  - Dezhou Eagle (a trader): US$110–119.
  - A credible pair therefore costs **US$164–176**, not US$160.
- **Cartons are bulkier than assumed:** 0.129 CBM/90 kg per pair (Jiai) up to 0.244 CBM/86 kg (F-Orchid), against the 0.10 CBM assumed.
- **Recomputed at US$170/pair with compact cartons:** **GP ≈ A$57 per pair (16.6%)** in a volume-limited 20GP of 215 pairs. With F-Orchid's bulky cartons it is A$27 (7.9%). By 50-pair LCL it is only A$20–28 (6–8%), or negative with bulky cartons.

### Cited Findings
#### Price to beat (observed 9 Oct 2026 unless stated)
- **Amazon AU, Fitness Master 2x40kg adjustable dumbbell set** (ASIN B0F4L17HT6): **"1 offer from" A$449.99.**
  - Page details: 17 weight settings via dial, item weight 80 kg, 45.5 × 24.5 cm.
  - Best Sellers Rank #249 in Exercise & Fitness Dumbbells; 5.0★ from 1 rating.
  - Product page "Currently unavailable" for the US delivery location; delivery fee not visible.
  - [Amazon AU](https://www.amazon.com.au/dp/B0F4L17HT6)
- **Amazon AU, fitnessLAB 2X 40kg 5–40 kg set** (B08P13358F): **"1 offer from" A$499.00**, 4.4★ (37 ratings). The bullets describe "removable weight plates… lift the locker", and the unit count and item weight fields are inconsistent. — [Amazon AU](https://www.amazon.com.au/dp/B08P13358F)
- **Amazon AU, other carousel items:**
  - Fitness Master "40kg Adjustable Dumbbell Set" (B0F4KY2DZ3), a single 40 kg unit per the title, A$239.99, i.e. A$479.98 a pair.
  - An unbranded "FITNESS… Adjustable Dumbbell" (B0GTGTCPX7) at A$449.99; spec not checked.
  - [Amazon AU](https://www.amazon.com.au/dp/B0F4L17HT6)
- **Lifespan (live, 9 Oct 2026):** Cortex Revolock V2 80 kg (40 kg pair) A$699; with stand A$849; 40 kg single A$399. — [Lifespan](https://lifespanfitness.com.au/products/cortex-revolock-v2-80kg-adjustable-dumbbell-barbell-all-in-one-set-40kg-pair)
- **Kogan Fortis, OzBargain (expired; post date not captured):**
  - "80kg 2-pack" (2×40 kg) A$259 (A$249 Kogan First) + delivery.
  - A commenter said the 2×40 kg set had only dropped to about A$330 + shipping in the prior six months, with shipping A$147.99–180.99 by postcode.
  - No current Kogan listing was found.
  - Source: a search summary of two OzBargain posts; which node carries which figure was not confirmed, and the pages were not opened. — [OzBargain node 734215](https://ozbargain.com.au/node/734215); [OzBargain node 634447](https://www.ozbargain.com.au/node/634447)
- **Powertrain 2×40 kg:** A$499 (was A$949), February 2024 deal — old. — [OzBargain](https://www.ozbargain.com.au/node/829305) (via au_retail_price_benchmarks.md)
- **Not comparable:**
  - Everfit "40kg" sets are 2×20 kg spin-lock sets: A$159.99 and A$242.99 (Everfit live store). — [Everfit](https://www.everfit.com.au/products/everfit-40kg-adjustable-dumbbells-set-kettle-bell-weight-plates-barbells-gym)
  - Rebel search shows no dial dumbbells. — [Rebel](https://www.rebelsport.com.au/search?q=adjustable+dumbbell)

#### Factory FOB (MIC, opened 9 Oct 2026; all priced per SINGLE dumbbell)
- **Xiamen F-Orchid** (brands F-ORCHID/WUWIND; Fujian; Gold Member since 2020; Audited Supplier; "we set design, production, sales and service in one")
  - Model W175-WAM550, 40 kg adjustable: **US$86.00 per piece, MOQ 50 pieces.**
  - "Selling Units: Single item"; **carton 66×43×43 cm (0.122 CBM), gross 43.0 kg.**
  - [MIC](https://forchidgroup.en.made-in-china.com/product/ZpXYbHrxnIVw/China-Factory-Price-40kg-Steel-Adjustable-Dumbbell-for-Home-Gym-Use.html)
- **Yiwu Jiai E-Commerce Firm** (Zhejiang; a trading/e-commerce firm by name; Diamond since 2026; Audited)
  - 40 kg (88.18 lb) adjustable cast-iron dumbbell: **US$88.00 (1–99 pcs), US$81.84 (100+ pcs).**
  - "Selling Units: Single Item"; **carton 58×37×30 cm (0.0644 CBM), gross 45.0 kg**; lead time 7 days (1–100 pcs).
  - [MIC](https://ja-pilatesreformer.en.made-in-china.com/product/jphryQLHXBcz/China-40kg-Adjustable-Cast-Iron-Body-Training-Equipment-Dumbbell-for-Body-Training.html)
- **Dezhou Ranao Fitness Equipment Co., Ltd.** (Shandong; "Manufacturer/Factory & Trading Company"; Diamond since 2021; Audited)
  - RA-005a 40 kg / 90 lb steel+rubber adjustable: **US$80.00–85.00, MOQ "10 set"** (the listing does not say whether a set is one dumbbell or a pair).
  - Packing carton 56×35×30 cm (0.0588 CBM; weight not stated); 800 sets/month; HS 95069190.
  - [MIC](https://ranao-fitness.en.made-in-china.com/product/UZATIntPRzRq/China-Professional-Fitness-Weight-Type-Necessary-Sports-Equipment-40kg-90lb-Adjustable-Dumbbell-Training-Enhance-Strength.html)
- **Nantong Vigor Sport Goods Co., Ltd.** (Jiangsu; "Manufacturer/Factory & Trading Company"; Audited)
  - AD-006 adjustable 20/24/32/36/40 kg: **US$72.00–105.00 per piece, MOQ 2.**
  - "Selling Units: Single Item"; one set per export carton; no weight-specific price tier.
  - [MIC](https://vigfit.en.made-in-china.com/product/URZpwcCTnqkG/China-Adjustable-24-40kg-Dumbbell-Set-One-Hand-Weight-Adjustment.html)
- **Dezhou Eagle Fitness** (Ningjin, Dezhou, Shandong; **Trading Company**; plant area 40 m²; 11 staff; established 2018; main markets include Australia)
  - EFa-040b 24–40 kg adjustable: **US$110.00–119.00 per piece, MOQ 2**; sample US$80.
  - [MIC](https://dzeaglefitness.en.made-in-china.com/product/OAaUCvGVgQRX/China-Gym-Home-40kg-Dumbbell-Set-90lbs-Strength-Fitness-Equipment-Adjustable-Dumbell.html)
- **Search page used:** [MIC 40 kg adjustable dumbbell](https://www.made-in-china.com/products-search/hot-china-products/40kg_Adjustable_Dumbbell.html). Other "24/40 kg" listings (All Universe US$68–188, Hefei Bodyup US$32–38.80, Nantong Get-Fit US$52) do not itemise a 40 kg price.

### Inferences
#### Recomputed landed cost and GP (shared base)
**Base inputs:**
- FOB **US$170 per pair**: the midpoint of credible 40 kg listings, i.e. Jiai US$163.68–176, F-Orchid US$172 and Ranao US$160–170 if its price is per piece.
- Compact carton **0.13 CBM / 90 kg per pair** (Jiai/Ranao type).

**20GP, volume-limited:**
- Pairs per box: 28 ÷ 0.13 = **215 pairs** (19.4 t, under the 21.8 t cap).
- Per pair:

  | Line | A$ |
  |---|---|
  | FOB: US$170 × 1.4376 | 244.39 |
  | Freight: 5,964 ÷ 215 | 27.74 |
  | PSI: 400 ÷ 215 | 1.86 |
  | Handling | 5.00 |
  | **Subtotal** | **278.99** |
  | Defect allowance (3%) | 8.37 |
  | **Landed** | **287.36** |

- Net revenue: A$379 ÷ 1.1 = A$344.55, so **GP = A$57.18 (16.6%)**.
- Cash ≈ A$60.0k (+≈A$5.6k GST float). Payback after 174 of 215 pairs. Total GP ≈ A$12.3k.

**Alternative scenarios:**

| Case | Pairs | Landed | GP | GP % |
|---|---|---|---|---|
| Jiai US$163.68 (100+ tier), carton 0.1288/90, 20GP | 217 | A$277.72 | A$66.82 | 19.4% |
| Ranao US$165 per pair (if priced per piece), 0.1176 CBM / 88 kg (weight assumed), 20GP | 238 | — | A$67.53 | 19.6% |
| F-Orchid US$172, bulky 0.2441 CBM / 86 kg, 20GP (freight A$52.32/pair) | 114 | A$317.33 | A$27.21 | 7.9% |
| Same, 40HQ (weight-capped at 20.0–22.5 t) | 232–261 | — | A$38.25–43.42 | 11.1–12.6% |

**FOB and pricing sensitivity (compact carton, 20GP):**

| Case | GP per pair | GP % |
|---|---|---|
| US$190/pair | A$27.57 | 8.0% |
| US$210/pair (top of Vigor range) | −A$2.05 | — |
| 5% duty | A$44.60 | 12.9% |
| Price A$405 (10% below A$449.99) | A$80.82 | 22.0% |

**LCL, 50 pairs:**

| Case | W/M | GP per pair | GP % |
|---|---|---|---|
| Jiai 1–99 tier, US$176/pair | 6.44 | A$19.64 | 5.7% |
| Base US$170, compact carton | — | A$28.22 | 8.2% |
| F-Orchid bulky carton | 12.21 | −A$3.42 | — |

**Reconciliation:**
- On the shared base, the original inputs (US$160, 0.10 CBM / 88 kg) give A$75.94 (22.0%).
- About A$14 of the gap is the extra US$10/pair FOB.
- The rest is carton volume: the box becomes volume-limited at 215 pairs instead of weight-limited at 247.

#### Compliance and risk
- **No mandatory standard identified** for free weights (inference, as Q1). Classify under 9506.91 with a ChAFTA CoO.
- **Product risk:** dial and lock-mechanism failures and the resulting returns or warranty load (inference). The fitnessLAB listing carries a "not suitable for overhead exercises" warning, recorded in earlier notes.
- **Supplier risk:** two of the five suppliers are traders or e-commerce firms (Jiai, Eagle). The cheapest verified price comes from a trader, so PSI and a pre-production sample matter.
- **Demand risk:** the Amazon floor listing has 1 rating and rank #249. 40 kg pairs are a niche next to 24 kg pairs, so 215 pairs per box is a slow Marketplace sell-through (inference).

#### Verdict: REVISED, score 4/10 (was 6)
- The price gap to Amazon holds, but the verified FOB (US$164–176/pair) and real carton volumes cut GP to about A$57 (17%) per pair at container scale.
- GP falls to A$20–28 (6–8%) by LCL, and to A$27 at container scale if the supplier's bulky carton is used.
- The SKU only works inside a full or mixed container, with a compact-carton supplier at ≤US$170/pair.

### Gaps
- No RFQ was sent, so all FOBs are listing prices.
- Unknowns: whether Ranao's "set" means one dumbbell or a pair; Vigor's 40 kg-specific tier; the actual dial mechanism quality and parts availability.
- The seller and delivery fee behind the A$449.99 Fitness Master listing could not be seen.
- The Kogan Fortis current price was not found; OzBargain deal dates were not captured.
- Real sell-through for A$379 40 kg pairs on Marketplace is unmeasured.

## Q3. Kettlebell set 8/12/16 kg: do the Kmart/Rebel/Amazon floors and the cast-iron FOB support A$109 and ~A$21 GP? (original: score 4, A$109, A$21 / 21%)

### Takeaway
**REVISED down (score 4 → 3).**
- **Price to beat:** the binding floor is Kmart's own neoprene kettlebells: 8 kg A$29, 12 kg A$39, 15 kg A$49, no 16 kg (snippets). An 8+12+15 kg set costs A$117 (A$3.34/kg). The 10–20% rule therefore gives a target of **A$94–105**, so A$109 sits only ≈7–10% below Kmart. Cast-iron alternatives are dearer:
  - CORTEX 16 kg A$74.99 (Lifespan).
  - Everfit 16 kg cast iron from A$89.95–92.95 (Amazon AU).
  - Rebel Celsius 8/12/16 kg at A$290.97 for the three.
- **FOB:** confirmed at US$0.90–1.40/kg. The Hebei manufacturer Dingzhou Yunlingyu lists **US$1.40/kg for 100–9,999 kg** and US$1.00/kg only above 10 t; traders quote US$0.90–1.25/kg.
- **Recomputed** (US$1.20/kg, full 20GP of 581 sets): **GP A$9.60 (10.7%) at A$99**, A$18.69 (18.9%) at A$109. By LCL it is near zero or negative.
- It remains useful only as weight filler, and it barely moves the mixed-box total.

### Cited Findings
#### Price to beat (observed 9 Oct 2026 unless stated)
- **Kmart own-brand Neoprene Kettlebells** (search snippets; product pages return 403):
  - 6 kg A$20; 8 kg A$29; 10 kg A$35; 12 kg A$39 (click & collect only per the snippet); 15 kg A$49.
  - No 16 kg own-brand kettlebell was found.
  - Earlier notes recorded a Kmart "Kettle Bell – 12kg" at A$29 clearance (was A$39).
  - Sources: [Kmart 15 kg](https://www.kmart.com.au/product/neoprene-kettlebell-15kg-43564439/), [Kmart 12 kg](https://www.kmart.com.au/product/neoprene-kettlebell-12kg-43564835/), [Kmart 8 kg](https://www.kmart.com.au/product/neoprene-kettlebell-8kg-43564989/), [Kmart 10 kg](https://www.kmart.com.au/product/neoprene-kettlebell-10kg-43564927/)
- **Kmart Marketplace** (snippets):
  - Everfit 16 kg (PE shell, concrete fill) A$52.95. — [Kmart](https://www.kmart.com.au/product/everfit-16kg-kettlebell-set-weight-lifting-bench-dumbbells-kettle-bell-gym-home-black-110070718/)
  - BodyWorx 12 kg cast iron A$82.45 (KG SuperStore). — [Kmart](https://www.kmart.com.au/product/bodyworx-cast-iron-kettlebell-12kg-balanced-durable-gym-weight-with-comfortable-handle-black-110175525/)
  - Kmart's free delivery over A$65 excludes "big and bulky" and Marketplace items; standard metro delivery is A$10 (snippet, via au_retail_price_benchmarks.md). — [Kmart](https://www.kmart.com.au/product/everfit-24kg-dumbbells-adjustable-dumbbell-weight-plates-home-gym-multi-110070734/)
- **Amazon AU Best Sellers – Kettlebells** (fetched 9 Oct 2026; lowest-offer item prices, delivery not visible):
  - Everfit 16–24 kg cast iron from A$92.95 (#14) and A$89.95 (#21).
  - Amazon Basics cast iron 15.8 kg A$84.90 (#20).
  - CORTEX Standard Kettlebell "4 offers from" A$54.99 (#8; size not shown).
  - METEOR cast iron from A$103.15 (#10); Everfit 2–16 kg from A$63.95 (#23).
  - PROIRON neoprene-coated cast iron from A$45.99 (#1).
  - Source: [Amazon AU Best Sellers – Kettlebells](https://www.amazon.com.au/gp/bestsellers/sporting-goods/5045066051)
- **Lifespan (live):**
  - CORTEX 16 kg cast iron A$74.99; 20 kg A$92.99.
  - CORTEX Standard Kettlebell Set 6–16 kg A$162.86.
  - Cortex BodyCurve vinyl 12 kg A$47.99, 16 kg A$64.99.
  - Source: [Lifespan CORTEX 16 kg](https://lifespanfitness.com.au/products/kettlebell-vinyl-16kg)
- **Rebel (live search):** Celsius kettlebells 8 kg A$70.99, 12 kg A$99.99, 16 kg A$119.99, i.e. A$290.97 for the three. — [Rebel](https://www.rebelsport.com.au/search?q=kettlebell)
- **Everfit store (live):** 8/12/16 kg "kettlebell set" items A$61.99 / A$69.99 / A$74.99; Everfit cast-iron 16 kg A$121.99. — [Everfit 16 kg cast iron](https://www.everfit.com.au/products/everfit-16kg-cast-iron-kettlebell-powder-coating-flat-bottom-home-gym)
- **Aldi:** no current Australian kettlebell Special Buy was found. The only Crane price seen was German, €14.99 for 12 kg in January 2026, and commenters said it was sand-filled. — [mydealz](https://www.mydealz.de/deals/crane-sport-equipment-bspw-12-kg-kettlebell-2709640)

#### Factory FOB (MIC, 9 Oct 2026; all priced per kg)
- **Dingzhou Yunlingyu Sports Goods Co., Ltd.** (Dingzhou Economic Development Zone, Baoding, Hebei; Manufacturer/Factory & Trading; 3,767 m²; 26 staff; established 2014)
  - **US$1.40/kg (100–9,999 kg); US$1.00/kg (10,000 kg+).**
  - Packing: plastic bag, paper carton, pallet or wooden carton. The listed "package" of 40×40×40 cm / 12 kg is generic.
  - [MIC](https://dingzhouyunlingyu.en.made-in-china.com/product/vFNfVkWwrgrJ/China-Manufacturer-Gym-Equipment-Sport-Competition-Kettle-Bell-Set-Lb-and-Kg-Body-Building-Fitness-Cast-Iron-Kettlebells.html)
- **Hebei Dili Sports Commerce Co., Ltd.** (Trading Company)
  - **US$0.90–1.10/kg, MOQ 500 kg** in the listing header, while the description says "MOQ 2000KG"; delivery 30–45 days.
  - Packed "Ctn+Wooden Case" (solid wood would need ISPM 15).
  - [MIC](https://dili-fitness.en.made-in-china.com/product/fGMpeLwCfvrs/China-Anti-Slip-Handle-Cast-Iron-Kettlebell-4-32kg-Crossfit-Strength-Training-Gym-Fitness-Equipment.html)
- **Others on the same search page:**
  - Hefei Bodyup US$0.95–1.05/kg (1,000 kg) — [MIC](https://bodyupsports.en.made-in-china.com/product/FLxRtyclYmWV/China-Wholesale-Black-Solid-Cast-Iron-Kettlebell-for-Strength-Training-and-Home-Gym-Eco-Friendly-Fitness-Workout.html)
  - Rizhao Shangshuo US$1.20–1.25 (1,000 kg) — [MIC](https://rizhaoshangshuo.en.made-in-china.com/product/GwRECUFugnhl/China-Crossfit-Gym-Wholesale-Exercise-Equipment-Powder-Coated-Casting-Iron-Kettlebell-Cast-Iron-Kettlebell.html)
  - Marshal Sports US$1.23–1.28 (1,000 kg) — [MIC](https://marshalsports.en.made-in-china.com/product/PSLEGXeDJWrY/China-China-Black-Color-Powder-Coated-Kettlebell-with-Cast-Iron.html)
  - Qingdao Goldroad ("kettlebell-china") US$1.05–1.25 (1,000 kg) — [MIC](https://kettlebell-china.en.made-in-china.com/product/vAqYcwIPbLri/China-China-Gym-Equipment-Adjustable-Kettlebell-Set-Cast-Iron-Competition-Kettlebell.html)
  - Nantong Tengtai US$1.10 (MOQ 5,000 kg) — [MIC](https://tt-sports.en.made-in-china.com/product/GxuRTtpKmrVo/China-Gym-Home-Powder-Coated-Cast-Iron-Kettlebell-with-Customized-Logo.html)
  - Merrybody neoprene-coated US$0.95–1.25 (500 kg) — [MIC](https://merrybody.en.made-in-china.com/product/LSnQIPBGIiYg/China-Factory-Wholesale-Colorful-Gym-Fitness-Neoprene-Coated-Cast-Iron-Custom-Logo-Color-Weights-Rubber-Kettlebells.html)
  - Gympro vinyl-coated US$0.85–1.03 (1,000 kg) — [MIC](https://gymprosport.en.made-in-china.com/product/zRWUfpmMuAkb/China-Colorful-Gym-Fitness-Equipment-Vinyl-Coated-Cast-Iron-Kettlebell.html)
  - Rizhao F-Leader US$1.12–1.43 (3,000 kg)
  - Search page: [MIC cast-iron kettlebell](https://www.made-in-china.com/products-search/hot-china-products/Cast_Iron_Kettlebell.html)
- **Packing data:** no listing gave a per-kettlebell carton size.

### Inferences
#### Recomputed landed cost and GP (shared base)
**Basis:**
- Per set (8+12+16 = 36 kg): **0.035 CBM, 37.5 kg** (estimate, unchanged from the original).
- FOB **US$1.20/kg** (between traders' US$0.90–1.25 and the manufacturer's US$1.40 small-order tier): 36 × 1.20 = US$43.20, i.e. A$62.10.

**20GP, weight-limited:**
- Sets per box: 21,800 ÷ 37.5 = **581 sets** (20.3 CBM).
- Per set:

  | Line | A$ |
  |---|---|
  | FOB | 62.10 |
  | Freight: 5,964 ÷ 581 | 10.27 |
  | PSI | 0.69 |
  | Handling | 5.00 |
  | **Subtotal** | **78.06** |
  | Defect allowance (3%) | 2.34 |
  | **Landed** | **80.40** |

- **At A$99** (net A$90.00): **GP A$9.60 (10.7%)**, total GP ≈ A$5.6k.
- **At A$109** (net A$99.09): **GP A$18.69 (18.9%)**, total GP ≈ A$10.9k.
- Cash ≈ A$45.4k. Payback after 504 sets at A$99, or 458 at A$109.

**FOB sensitivity:**

| FOB | GP at A$99 | GP at A$109 |
|---|---|---|
| US$1.40/kg (manufacturer tier below 10 t) | −A$1.06 | A$8.03 |
| US$1.00/kg | A$20.26 | A$29.35 |

**LCL, 100 sets:**
- 3.75 W/M (billed on weight).
- Freight A$18.15 per set; PSI A$4.00.
- Landed A$91.93: GP −A$1.93 at A$99 and A$7.16 at A$109.
- At US$1.40/kg and A$109: −A$3.50.

#### Compliance and risk
- **No mandatory standard identified** (inference, as Q1).
- **Packaging:** Hebei Dili uses wooden cases, so require ISPM 15 marks or plywood.
- **Sell-through:** sold as sets, 581 sets is a very long local sell-through. If sold as single bells, the A$5 handling would apply three times and Kmart's A$29–49 singles would be the comparison (inference).

#### Verdict: REVISED, score 3/10 (was 4)
- The original A$109 target is only ≈7–10% under Kmart's own-brand equivalent.
- At a rule-compliant A$99 the margin is about 11% at container scale and zero by LCL.
- The manufacturer's own small-order price (US$1.40/kg) wipes the margin out.
- Keep it only as optional weight filler in a mixed box, where it adds under A$1k GP.

### Gaps
- Kmart own-brand prices are snippets (pages return 403); whether Kmart's "Neoprene" bells are cast iron inside is not stated.
- No identical 8/12/16 kg cast-iron set price exists on Amazon AU or at Kmart.
- Per-unit carton CBM is assumed.
- No Aldi AU 2026 kettlebell Special Buy was found.

## Q4. 48-inch steel dog crate: what are the real 48" FOB, carton and AU floors, and does ~A$100 at 35% GM work? (original: score 6, target ~A$100 capped by Kmart i.Pet A$104.95; needs FOB ≤US$26; 48" FOB unverified)

### Takeaway
**BROKEN as specified (score 6 → 3).**
- **Price to beat, like-for-like 48" (≈121×76×82 cm, ~15 kg) wire crates:**
  - i.Pet 48" at **A$104.95 on Amazon AU** (verified in Best Sellers).
  - The same i.Pet at **A$94.46 on Bunnings Marketplace** and A$99.95 (Velocity/Modern Living) (snippets).
  - BEASTIE A$119.95, PETJOINT A$129.95, VaKa A$134.99.
  - Lower-spec 120×60×60–70 cm panel crates at A$91.97–99.90 (Advwin A$99.90 plus postcode delivery).
- **Target:** the 10–20% rule gives about **A$85**, not A$100. A$100 is only 5% under Amazon and above Bunnings.
- **FOB:** the only listing that prices a 48" size explicitly is a Shenzhen **trader** (Fuyuanxin, 122×75.5×84 cm): **US$28.50 (10–499 pcs) / US$24.80 (500–999) / US$23.70 (1,000+)**. Other ranges run up to US$20 (Senxin XXL) or US$40 (Quanhao). The "US$4.86–6.17" Hebei price used before applies only to crates up to 91 cm.
- **Shared-base results:** at A$85 a crate-only 20GP of 288 crates makes **A$7 (9%)** at US$28.50. LCL is negative (−A$8). The original's 50-unit LCL example at US$20 drops to A$5 per crate even at A$100.
- **35% GM at A$85** needs FOB **≤US$15** (20GP) or ≤US$20 (40HQ of 701 crates).

### Cited Findings
#### Price to beat (observed 9 Oct 2026)
- **Amazon AU Best Sellers, "Basic Dog Crates"** (fetched 9 Oct 2026; lowest-offer item prices, delivery not visible):

  | Rank | Product | ASIN | Spec | Price |
  |---|---|---|---|---|
  | #10 | **i.Pet Dog Crate Cage 48"** | B077916QNT | 121×76×82 cm, 15.3 kg, 3 doors, 4.4★ (275) | **A$104.95** |
  | #22 | Solvindo "48-inch L" welded playpen-crate | B0HCJ4RWBP | 120×60×60 cm, 7 kg; not like-for-like | A$91.97 |
  | #58 | PETJOINT 48" XXL 2-door | B07CG863DJ | 120×74×81 cm, 15 kg | A$129.95 |
  | #4 | Feandrea heavy-duty | — | 122×74.5×80.5 cm | A$239.99 |
  | #1 | Amazon Basics | — | 76 cm, 1 door | A$64.90 |

  Carousels: BEASTIE 48in 3-door 121×76×82 cm A$119.95 (B0BYNSF61D); VaKa Pet 48" 3-door A$134.99 (B0DYJ65XZD); a 120×60×70 cm panel "Large Dog Crate" A$91.99 (B0GWMFX1JD).

  Sources: [Amazon AU Best Sellers – Basic Dog Crates](https://www.amazon.com.au/gp/bestsellers/pet-supplies/5848310051); [i.Pet 48"](https://www.amazon.com.au/dp/B077916QNT); [PETJOINT 48"](https://www.amazon.com.au/dp/B07CG863DJ); [Solvindo](https://www.amazon.com.au/dp/B0HCJ4RWBP)
- **Bunnings Marketplace** (snippets):
  - i.Pet 48" 3-door **A$94.46**, online only. — [Bunnings category](https://www.bunnings.com.au/products/pet-supplies/dogs/dog-kennels-crates)
  - Paw Mate 48in crate with tray, cushion and cover combo A$131.10 (seller Princess Trade). — [Bunnings](https://www.bunnings.com.au/paw-mate-wire-dog-cage-crate-48in-with-tray-cushion-mat-blue-cover-combo_p0849314)
- **Velocity Frequent Flyer store** (snippet): i.Pet 48" 3-door A$99.95, sold by Modern Living. — [Velocity](https://www.velocityfrequentflyer.com/store/product/i-pet-48-large-dog-crate-kennel-with-3-doors-mff057043)
- **Kmart Marketplace:** i.Pet 48" A$104.95; folds to 121×76×9 cm (snippet from vertical_pets_garden.md; page 403). — [Kmart](https://www.kmart.com.au/product/i.pet-48%22-dog-cage-crate-large-kennel-3-doors-black-110004334/)
- **Advwin (live Shopify):** Heavy Duty Dog Crate 120×60×70 cm A$99.90; 8-panel heavy-duty crate A$139.90. Shipping is "Charged according to zipcode" (VIC/NSW metro, 1–5 business days). — [Advwin crate](https://www.advwin.com.au/products/advwin-heavy-duty-dog-crate-for-large-dogs-120-x-60-x-70cm-610120500); [Advwin shipping policy](https://www.advwin.com.au/policies/shipping-policy)
- **Specialty:** Pet City XXL 48" 122.5×75.5×82 cm, REG A$236.95 (search summary). — [Pet City](https://www.petcity.com.au/product/collapsible-crate-d42-double-door)
- **Not found:** Petbarn and PETstock 48" wire-crate prices (searches returned only covers and soft crates); an Aldi crate Special Buy.

#### Factory FOB (MIC, opened 9 Oct 2026)
- **Shenzhen Fuyuanxin Technology Development Co., Ltd.** (Guangdong; **Trading Company**; Gold Member since 2022; Audited)
  - "Heavy Duty Pet Cage Foldable Metal Crate 48 Inch 122×75.5×84cm", model FYX-PET-CRATE-48.
  - **US$28.50 (10–499 pcs), US$24.80 (500–999), US$23.70 (1,000–4,999), US$22.80 (5,000+)**, per piece.
  - Sample US$15; MOQ 10; "Immediately Shipment" / 7–15 days; HS 7326909000; packed in a box. **Carton size and weight not stated.**
  - The same seller's 42-inch (107×71×77.5 cm) is US$19.50–22.50.
  - [MIC](https://fyuanx.en.made-in-china.com/product/cOsGxqSlXefQ/China-Heavy-Duty-Pet-Cage-Foldable-Metal-Crate-48-Inch-122-75-5-84cm.html)
- **Xingtai Senxin Pet Products Co., Ltd.** (Nanhe District, Xingtai, Hebei; "Manufacturer/Factory & Trading Company"; 4,135 m²; 43 staff; established 2017; port Tianjin)
  - (a) "Bestpet 24–48 Inch" wire crates: US$6.17 (1–9) / US$5.47 (10–99) / US$4.86 (100+), but the listed sizes stop at 91×56×67 cm. — [MIC](https://hbsenpet.en.made-in-china.com/product/CmrpjwxYORUD/China-Bestpet-24-30-36-42-48-Inch-Dog-Crates-for-Large-Dogs-Folding-Mental-Wire-Crates.html)
  - (b) "Metal Folding Dog Cage XXL": **US$9.00–20.00, MOQ 50**; sizes 95×65×71, 108×75×81 and 119×78×83 cm; "one piece one carton"; no per-size price. — [MIC](https://hbsenpet.en.made-in-china.com/product/sJKpchwuXxYe/China-Metal-Folding-Dog-Cage-XXL-Black-Impact-Dog-Kennel-Crate.html)
  - (c) 48/38" heavy-duty "indestructible" tube crate: US$55–69.6, MOQ 100. — [MIC](https://hbsenpet.en.made-in-china.com/product/PJfUAVXyJpRd/China-Double-Door-Oversized-Crate-Interior-Large-Dog-Removable-Tray-48-38-Heavy-Duty-Indestructible-Dog-Crate.html)
- **Suzhou Quanhao Metal Products Technology Co., Ltd.** (Trading Company; established 2022): 18"–48" collapsible wire crate (48" = 121×74×81 cm), **US$10–40, MOQ 100**, no per-size price. — [MIC](https://quanhao-metal.en.made-in-china.com/product/LJNpWIaYOykA/China-18-24-30-36-42-48-Pet-Kennel-Collapsible-Wire-Dog-Crate.html)
- **Milleen Garden** (Manufacturer/Factory & Trading; port Qingdao): 48" double-door folding crate, US$5.50–25.90, MOQ 200, sizes 18–48", no per-size price. — [MIC](https://milleengarden.en.made-in-china.com/product/TmrRAhOHqcUk/China-Premium-48-Excellence-and-Versatility-Double-Door-Folding-Metal-Dog-Crate.html)
- **Anping Ying Hang Yuan Metal Wire Mesh Co., Ltd.** (Anping, Hengshui, Hebei; manufacturer & trading; 15,000 m²; 38 staff; established 2008): "Foldable Metal Wire Dog Crate" US$12.00 (10–49 sets) / 11.00 / 10.00 (200+). The size is not stated, and the packing spec (OPP bag 21.5×4×30 cm) does not fit a 48" crate. This is the only Anping maker found. — [MIC](https://yhywiremesh.en.made-in-china.com/product/WZrfuCMSnlTI/China-Foldable-Metal-Wire-Dog-Crate.html)
- **Rejected as not credible for 48":**
  - HappyPet/PetsLoyal "48 Inch… CE" at US$2–3, with a 60×60×15 cm / 5 kg package and HS 6307 (a textile code). — [MIC](https://happypet-petproducts.en.made-in-china.com/product/ewBTymsDClGQ/China-Factory-Wholesale-48-Inch-Pet-Dog-Crate-CE-Certificated.html)
  - zh-fence two-door crate at US$3.73–5.26, with a 40×40×5 cm / 2 kg package. — [MIC](https://zh-fence.en.made-in-china.com/product/iYMRjKkHAxcC/China-Factory-Two-Door-Foldable-Pet-Pen-Indoor-Dog-Kennels-Dog-Crate-Dog-Cage.html)
  - Zunhua Boqi "Large" at US$12.80–13.90, with a 58×43.2×50 cm carton. — [MIC](https://343d321c5f02f323.en.made-in-china.com/product/wakrmLsbXIUX/China-Large-Foldable-Metal-Dog-Crate-for-Strong-and-Active-Dogs.html)
- **Search pages:** [48 inch dog crate](https://www.made-in-china.com/products-search/hot-china-products/48_Inch_Dog_Crate.html), [wire dog crate](https://www.made-in-china.com/products-search/hot-china-products/Wire_Dog_Crate.html), [XXL dog crate](https://www.made-in-china.com/products-search/hot-china-products/Xxl_Dog_Crate.html)
- **No supplier page stated a 48" carton size or gross weight.** For reference, retail item weights are 15.3 kg (i.Pet) and 15 kg (PETJOINT), and Kmart's listing gives a folded size of 121×76×9 cm.

#### Compliance and biosecurity inputs
- **Supplier HS codes:** 7326.20 / 7326.90 (articles of iron or steel wire).
- **ADC case 692, "certain welded steel mesh sheets" (China):**
  - Provisional measures (securities) apply from 8 Aug 2026 (register shows imposed 08/08/2026, expiry TBA).
  - Goods are classified under 7314.20.00, 7314.31.00 and 7314.39.00.
  - The register says importers must self-assess coverage.
  - Source: search summary of ADC status reports and the Dumping Commodity Register; the PDF itself returned 503. — [ADC DCR welded mesh](https://www.industry.gov.au/sites/default/files/adc/measures/2026-09/dcr-certain-welded-steel-mesh-sheets.pdf); [ADC March 2026 status report](https://www.industry.gov.au/sites/default/files/adc/public-record/2026-04/march-2026-monthly-status-report.pdf)
- **BMSB:** China is not a BMSB target-risk country, so no mandatory BMSB treatment applies to direct China shipments (au_landed_cost_compliance.md). — [DAFF 2025-26 BMSB presentation](https://www.agriculture.gov.au/sites/default/files/documents/2025-26-bmsb-industry-presentation.pdf)
- **Wood packaging:** must meet ISPM 15. Plywood or reconstituted-wood packaging is exempt. — [DAFF ISPM 15](https://www.agriculture.gov.au/biosecurity-trade/import/goods/timber-packaging/ispm-15) (snippet)

### Inferences
#### Recomputed landed cost and GP (shared base)
**Basis:**
- Carton **0.097 CBM / 17 kg** (estimate: 124×78×10 cm around the 121×76×9 cm folded crate; 15.3 kg item plus tray and carton).
- Target **A$85**, which is 10% under Bunnings' A$94.46 and 19% under Amazon's A$104.95. Net revenue A$77.27.

**Crate-only 20GP, volume-limited:**
- Crates per box: 28 ÷ 0.097 = **288 crates** (4.9 t).
- Freight: 5,964 ÷ 288 = A$20.71 per crate; PSI A$1.39; handling A$5.

| FOB | Landed | GP at A$85 | GP at A$100 |
|---|---|---|---|
| **US$28.50** (Fuyuanxin, <500 pcs): A$40.97 + 20.71 + 1.39 + 5 = 68.07, ×1.03 | A$70.11 | **A$7.16 (9.3%)** | A$20.80 (22.9%) |
| US$24.80 | A$64.63 | A$12.64 (16.4%) | A$26.28 (28.9%) |
| US$20 (estimate: top of Senxin's XXL range) | A$57.52 | A$19.75 (25.6%) | A$33.38 (36.7%) |
| US$15 | A$50.12 | A$27.15 (35.1%) | — |

- Cash at US$28.50 ≈ A$19.6k; payback after 254 of 288 crates.

**40HQ at US$24.80:**
- 701 crates (68 ÷ 0.097, 11.9 t).
- Freight: A$10,064 ÷ 701 = A$14.36 per crate.
- Landed A$57.25, so **GP A$20.03 (25.9%)** at A$85.
- Cash ≈ A$39.0k; total GP ≈ A$14.0k; payback after 504 of 701 crates.

**LCL:**
- 100 crates at US$28.50 (9.7 W/M; A$32.67 per crate): landed A$85.12, so **GP −A$7.85** at A$85 and A$5.79 at A$100.
- The original's own example (50 crates by LCL at US$20): W/M 4.85, freight A$41.67 per crate, landed A$85.92. GP is **A$4.99 at A$100** (the pets note said ≈A$38) and **−A$8.65 at A$85**.

**Maximum FOB for 35% GM at A$85:**

| Mode | Max FOB |
|---|---|
| 20GP | US$15.07 |
| 40HQ | US$20.06 |
| LCL 100 | US$4.94 |

Even at A$100 a 20GP needs ≤US$21, against the ≤US$26 claimed before.

**Duty:** 5% duty at US$28.50 cuts GP to A$5.05.

#### Compliance and biosecurity (inference)
- **No mandatory Australian product standard** for dog crates was identified in this or earlier notes.
- **Anti-dumping:** finished crates declared under 7326.20 sit outside the 7314 lines named in ADC case 692. Crates shipped as flat welded-mesh panels could invite a 7314 classification argument. Get a broker's classification and keep the supplier's HS code.
- **Biosecurity:**
  - A new steel crate with a plastic tray contains no timber, so the BICON timber case does not apply.
  - The packaging issue is only cartons on solid-wood pallets (need ISPM 15 marks plus a packing declaration) and loose dunnage. Specify corrugated cartons with no straw or wood wool, and plastic or ISPM 15-marked pallets.
  - China is not a BMSB target-risk country. Ensure no transhipment via target-risk countries during Sep–Apr.
- **Other risk:** used crates are a common second-hand item, which adds Marketplace competition (not measured).

#### Verdict: BROKEN as specified; residual score 3/10 (was 6)
- The A$100 target breaks the brief's own 10–20%-below rule.
- The 50-unit LCL route is negative or near zero on the shared freight base.
- The only verified 48" FOB (US$24.80–28.50, from a trader) is far above the ≤US$15 needed for 35% GM at A$85.
- What survives is a volume play: a 40HQ of about 700 crates at ≈US$25 makes about A$20 a crate (26%), or a manufacturer quote of ≤US$20 makes ≈26% in a 20GP. Both need hundreds of units to move locally.

### Gaps
- No 48"-specific quote from a Hebei manufacturer (Xingtai, Anping); Senxin's XXL range (US$9–20) does not split by size.
- 48" carton CBM and gross weight are not stated by any supplier, so 0.097 CBM / 17 kg is estimated.
- Bunnings' A$94.46 and Velocity's A$99.95 are snippets; Petbarn and PETstock 48" prices were not found.
- Amazon delivery fees are invisible from this location.
- The ADC welded-mesh goods description was not read directly (PDF 503).

## Q5. Does a mixed 20GP (2×40 kg dumbbells + bumper plates + kettlebells, ± dog crates) still work on the verified numbers? Cash required and total GP

### Takeaway
**Yes, but thinner than claimed, and the kettlebells and crates add almost nothing.**
- **Original mix rebuilt** on verified inputs (100 dial pairs + 100 bumper sets + 66 kettlebell sets; 21,775 kg and 25.3 CBM):
  - Cash ≈ **A$55.7k** (+≈A$5.1k import-GST float).
  - Total GP ≈ **A$13.8k** (19.4% of net revenue), or A$14.4k if kettlebells sell at A$109.
  - The original claimed A$56.9k cash and A$15.3k GP.
- **Where the GP comes from:** bumpers ≈A$7.9k and dial pairs ≈A$5.6k. Kettlebells add A$0.3–0.9k.
- **Swapping in crates:** 40 crates (US$28.50, A$85) replacing 36 kettlebell sets leave total GP essentially unchanged (A$13.85k vs A$13.82k) on A$55.5k cash, because each crate earns only ≈A$0.74 once it carries its volume-based freight share inside an iron box.
- **Better mix:** 150 bumper sets + 70 pairs makes ≈**A$15.8k GP on A$53.0k cash (22.4%)** with only two factories.
- **Range:** high FOBs → A$7.2k; no CoO (5% duty) → A$11.4k; low FOBs → A$19.9k.

### Cited Findings
- Inputs are the verified prices, FOBs, cartons and weights in Q1–Q4 above, plus the shared base freight figures (A$5,964 per 20GP, 28 CBM, 21.8 t).
- Container cargo limits: 20GP 21.8 t (QLD/SA/WA/TAS), 23.8 t (VIC), 24.3 t (NSW) — [ICE Cargo](https://icecargo.com.au/transport-options/) (as cited in vertical_home_gym.md).
- Original mixed-box claim: 100 × 2×40 kg pairs + 100 × 100 kg bumper sets + 70 kettlebell sets = 21,725 kg / 22.4 CBM; ≈A$56.9k cash; ≈A$15.3k GP (vertical_home_gym.md, same folder).

### Inferences
**Method:**
- The A$5,964 box cost is allocated to each line by its chargeable share: the larger of its share of 21.8 t or its share of 28 CBM, then normalised.
- PSI is A$400 per supplier line.
- Prices: pairs A$379, bumpers A$339, kettlebells A$99 unless stated, crates A$85.
- FOBs: US$170 per pair, US$1.30/kg for bumpers, US$1.20/kg for kettlebells, US$28.50 per crate.
- Cash excludes the 3% defect provision and the import-GST float.

| Scenario | Load | Cash (A$) | GST float | Total GP (A$) | GP % of net revenue | Line GP per unit |
|---|---|---|---|---|---|---|
| **M1 base:** 100 pairs + 100 bumper + 66 KB | 21,775 kg (99.9% of cap), 25.31 CBM | **55,721** | ≈5,081 | **13,820** | 19.4% | pair A$56.40; bumper A$78.78; KB A$4.58 |
| M1 with KB at A$109 | same | 55,721 | ≈5,081 | 14,420 | 20.1% | KB A$13.67 |
| M1, no CoO (5% duty) | same | 58,082 | ≈5,317 | 11,388 | 16.0% | pair A$43.81; bumper A$69.16; KB A$1.38 |
| M1, high FOBs (pair US$190; bumper US$1.50/kg; KB US$1.40/kg) | same | 62,154 | ≈5,724 | 7,194 | 10.1% | pair A$26.78; bumper A$49.17; KB −A$6.08 |
| M1, low FOBs (pair US$163.68; bumper US$1.00/kg; KB US$1.00/kg) | same | 49,816 | ≈4,490 | 19,902 | 27.9% | pair A$65.75; bumper A$123.20; KB A$15.24 |
| **M2 with crates:** 100 pairs + 100 bumper + 30 KB + 40 crates (4 factories) | 21,105 kg, 27.93 CBM | 55,544 | ≈5,021 | 13,853 | 19.5% | crate A$0.74; KB −A$2.23 |
| M3, bulky dumbbell cartons (F-Orchid 0.244 CBM/86 kg): 60 pairs + 120 bumper + 38 KB | 18,945 kg, 27.98 CBM (volume-bound) | 47,877 | ≈4,320 | 11,762 | 19.3% | pair A$31.49 |
| **M4 bumper-heavy:** 150 bumper + 70 pairs (2 factories) | 21,750 kg, 24.10 CBM | **53,005** | ≈4,872 | **15,751** | 22.4% | bumper A$79.71; pair A$54.20 |
| M5, original quantities (100/100/70 KB at A$109) | 21,925 kg = **100.6% of 21.8 t**; legal only to NSW/VIC limits | 55,989 | ≈5,105 | 14,540 | 20.1% | — |

**Reading:**
- **Bumpers are the anchor SKU.** They are weight-dense, they fill the 21.8 t cap at ≈21 CBM, and each set earns ≈A$79.
- **Dial pairs are second.** At verified cartons they use volume (0.13 CBM per 90 kg).
- **Kettlebells** at a rule-compliant price earn ≈A$5–14 per set, so they are optional weight filler.
- **Crates** lose money or break even inside an iron box. Their volume-based freight share (≈A$18 per crate) plus a A$10 PSI share on 40 units eats the A$7–20 margin. Ship crates only in their own 40HQ, if at all.
- **Sell-through:** about 78% of stock must sell at target before the cash is recovered in the base mix. The range is 70% (low FOBs) to 87% (high FOBs).

**Uncosted items (estimates, not in the table):**
- Origin consolidation if suppliers sit in different provinces. Examples: bumpers from Nantong (Jiangsu); 40 kg dumbbells from Yiwu (Zhejiang) or Xiamen (Fujian); kettlebells from Dingzhou (Hebei); crates from Shenzhen or Xingtai.
- One mixed box needs inland trucking to one port, plus a CFS consolidation fee (earlier notes estimated USD 100–300).
- A Nantong/Shanghai cluster (Tengtai bumpers and kettlebells; Vigor dumbbells) would minimise this, but Vigor's 40 kg tier is unverified.

**Revised scorecard:**

| SKU | Verdict | Score (was → now) | Recomputed GP per unit (20GP base / LCL) |
|---|---|---|---|
| 100 kg bumper set | CONFIRMED | 6 → 6 | A$79.47 (25.8%) / A$57.87 (18.8%) |
| 2×40 kg dial pair | REVISED | 6 → 4 | A$57.18 (16.6%); A$27.21 if bulky cartons / A$19.64–28.22 (6–8%) |
| Kettlebell set 8/12/16 | REVISED | 4 → 3 | A$9.60 (10.7%) at A$99; A$18.69 at A$109 / −A$1.93 to A$7.16 |
| 48" dog crate | BROKEN as specified | 6 → 3 | A$7.16 (9.3%) at A$85 & US$28.50; A$20.03 in a 40HQ at US$24.80 / −A$7.85 |

### Gaps
- No supplier quotes, so every FOB is a listing price.
- Carton and weight data were verified only for the 40 kg dumbbells (F-Orchid, Jiai); bumpers, kettlebells and crates use estimated CBM and gross weight.
- Inland trucking and CFS consolidation for a multi-province mixed box are not costed.
- Marketplace sell-through for 100–200 heavy units per SKU per metro area is unmeasured (Facebook requires login).
- The mixed-box freight allocation rule (chargeable share) is a modelling choice. Pure weight-based allocation would shift ≈A$1–2 per unit from pairs to bumpers and would charge crates only ≈A$4.65 each.
