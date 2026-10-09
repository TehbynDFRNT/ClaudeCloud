# Vertical deep-dive: Home gym & fitness equipment — China factory → Facebook Marketplace (AU) arbitrage, per-SKU unit economics

*Research date: 9 October 2026. FX used throughout (same as the parallel landed-cost notes, for comparability): AUD 1 = USD 0.6928 on 1 Oct 2026, so USD 1 = AUD 1.4434 — [exchange-rates.org](https://www.exchange-rates.org/exchange-rate-history/aud-usd-2026-10-01). Method notes: amazon.com.au returned HTTP 503 and kmart.com.au / gumtree.com.au / bunnings.com.au / buywisely.com.au / abf.gov.au returned HTTP 403 to direct fetching, so Australian retail prices below are **search-engine snapshots observed on 9 Oct 2026** (marked "search snapshot"); the page's own capture date, the seller and the delivery fee were usually not visible. Made-in-China.com (MIC) search and product pages, the two Super Retail Group ASX PDFs, the EESS risk-level PDF, the ICE Cargo weight table, Sino-Shipping and KLN pages were read directly. No supplier was contacted, no RFQ was sent, no account was created. Every FOB below is a public listing range, not a quote.*

## What are the per-SKU unit economics for each home-gym product, and how do they rank? (core objective)

### Takeaway
Only weight-dense strength goods clear a usable margin at "Amazon-AU-floor minus 10–20%" prices: **100 kg bumper-plate sets (≈A$75/set, 24% gross margin in a full 20GP; ≈A$53, 17% via 50-set LCL)** and **2 × 40 kg dial dumbbells (≈A$71/pair, 21% in a 20GP; ≈A$45, 13% via LCL)**. Kettlebell sets and 2 × 24 kg dial dumbbells only reach 13–21% at full-container volume (6–9% via LCL), and the magnetic rower / magnetic spin bike only make 10–13% if you take a whole 20GP of one SKU. Walking pads, power racks (with or without cable pulley), FID benches, multi-station gyms, freestanding boxing bags, power towers and water rowers are **loss-making at the target price**, because the Amazon AU / Kogan / Kmart floors are already at or below a small importer's landed cost — the floor sellers (Everfit, Advwin, Fitness Master, Centra, CANPA, Kogan's Fortis, Kmart's Anko) are themselves container-scale China importers. The best-supported play is one **weight-limited mixed 20GP** (≈100 × 2×40 kg dial pairs + 100 × 100 kg bumper sets + 70 kettlebell sets ≈ 21.7 t): ≈A$57k cash, ≈A$15k gross profit if everything sells at target. Scores: bumper plates 6/10, 2×40 kg dial dumbbells 6/10, kettlebell set 4, 2×24 kg dial dumbbells 4, magnetic rower 3, spin bike 2, walking pad 2, power rack (no pulley) 2, everything else 1.

### Cited Findings

#### Common cost inputs (apply to every row)
- AUD/USD 0.6928 on 1 Oct 2026; 2026 high 0.7260 (13 May), low 0.6676 (1 Jan) — [exchange-rates.org](https://www.exchange-rates.org/exchange-rate-history/aud-usd-2026-10-01).
- Sino-Shipping China→Australia page (states "October 2026"): FCL 20GP $2,205–2,695 and 40GP $4,320–5,280 to Sydney/Melbourne/Brisbane (currency shown only as "$"), LCL $35/cbm, sea FCL 20–27 days, LCL 21–31 days; the page says rates are indicative and to confirm with a quote — [Sino-Shipping](https://www.sino-shipping.com/country-guides/freight-from-China-to-australia/).
- KLN (Kerry Logistics Oceania), 29 June 2026: indicative 40HQ USD 4,100–4,600 to Sydney/Melbourne/Brisbane; June +15–25% m/m "is now the market floor"; repeated blank sailings on A3C, CA2, NEAX, Wallaby; LCL rates "more stable than FCL"; peak-season surcharges separate from base freight — [KLN July 2026 outlook](https://info.oceania.kln.com/customer-advisory/fcl-shipping-rates-from-china-to-australia-july-2026-outlook).
- Other 2026 LCL quotes: Welltrans (June 2026) USD 50–150/cbm (e.g. Shanghai→Sydney), plus documentation USD 30–50 and port charges USD 50–100 — [Welltrans](https://welltrans-logistics.com/?p=3741) (search snapshot); ExFreight 2026 guide USD 60–280/cbm and LCL "less economical above about 14–15 cbm" — [ExFreight](https://www.exfreight.com/shipping-from-china-to-australia/) (search snapshot).
- Australian destination charges for a 20ft (as compiled in the parallel landed-cost notes, not re-fetched by me): Maersk DHC A$600 Sydney / A$625 Melbourne per 20' from 1 Oct 2026 — [Maersk](https://www.maersk.com/news/articles/2026/09/01/maersk-terminal-handling-service-australia); ABF Import Processing Charge A$152 (electronic, consignment ≥A$10k) — [ABF IPC](https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/cost-of-importing-goods/charges/import-processing-charge); that note's total 20ft Sydney landside budget is ≈A$2,150–3,000 per box incl. assumed cartage and broker (see `au_landed_cost_compliance.md`).
- Pre-shipment inspection: V-Trust lists "268 USD/man-day" all-inclusive in major Asian manufacturing clusters; market range quoted USD 200–350/man-day — [V-Trust](https://www.v-trust.com/en/our-services/quality-control/pre-shipment-inspection-service-in-china-india-vietnam-malaysia-thailand-bangladesh-pakistan-indonesia-cambodia) (search snapshot).
- Tariff: Australian line 9506.91.00 "Articles and equipment for general physical exercise, gymnastics or athletics" shown by a tariff aggregator at **5% general, Free under ChAFTA** (certificate of origin required) — [Treayo (AU 9506 lines)](https://treayo.com/en/hs/australia/95069990), [Treayo compare 9506.91](https://treayo.com/en/compare/950691) (search snapshot; abf.gov.au Schedule 3 page returned 403, so not verified on the official schedule). Duty-Decoder lists dumbbells CN→AU at 0% duty (it also wrongly shows 0% VAT) — [Duty Decoder](https://dutydecoder.com/calculate/dumbbells-from-cn-to-au/).
- Container weight limits by state (ICE Cargo, "general guide only"): 20ft GP cargo max 24.3 t NSW, 23.8 t VIC, 21.8 t QLD/SA/WA/TAS; 40ft GP 22.8/22.3/20.3 t; 40ft HC 22.5/22.0/20.0 t; 6-axle semi total 42.5 t — [ICE Cargo](https://icecargo.com.au/transport-options/).

#### 1. Adjustable dumbbells — 2 × 24 kg dial-select pair (2.5–24 kg each, 15 settings, trays)
- **Amazon AU (search snapshots, 9 Oct 2026; seller/delivery not shown):** LSG V1 2.5–24 kg pair **A$249.00** (3.2★, 4 reviews) — [Amazon AU](https://www.amazon.com.au/Adjustable-Dumbbells-2-5kg-24kg-Training-Exercise/dp/B07BLK8927); Everfit 2×24 kg with holder A$262.95 and ADVWIN 24 kg×2 with tray A$299.99 — [Amazon AU search](https://www.amazon.com.au/adjustable-dumbbell-set-24kg/s?k=adjustable+dumbbell+set+24kg), [ADVWIN](https://www.amazon.com.au/ADVWIN-Adjustable-Dumbbell-Anti-Slip-Suitable/dp/B09HMSKXTK); FitnessLAB **single** 24 kg A$159 — [Amazon AU](https://www.amazon.com.au/FitnessLAB-Adjustable-Dumbbell-Dumbell-Exercise/dp/B09HPTHPPD); CORTEX Revolock V2 48 kg (pair, with bar/kettlebell handle) A$499; Fitness Master 48 kg (2×24) listed, price not in snapshot — [Amazon AU](https://www.amazon.com.au/Fitness-Master-Adjustable-Dumbbell-Equipment/dp/B0F4KYVVZH).
- **Kogan:** Fortis 24 kg Smart Adjustable 2-pack A$259 (Kogan First price) vs A$338 "don't pay" total; 2-pack + stand A$379; single A$159 (search snapshot; undated; the exact page carrying the A$259 2-pack price was not identified — one result for the 2-pack was a kogan.com/nz URL) — [Kogan Fortis dumbbells](https://www.kogan.com/au/fortis/shop/category/sports-outdoors-travel/dumbbells/), [Kogan stand combo](https://www.kogan.com/au/buy/fortis-24kg-smart-adjustable-dumbbell-set-and-stand-combo/). An older OzBargain deal (~4 years old) had the Fortis 2-pack at A$199 delivered — [OzBargain](https://www.ozbargain.com.au/node/626326).
- **Kmart Marketplace (third-party sellers, not Anko):** Everfit 24 kg pair (seller Aisle Six) A$259.95; Centra 24 kg **single** (Sello Products) A$136 (was A$144); Powertrain 24 kg (Klika Group) A$595; Fitness Master dumbbell stand (Salesbay) A$169.99 — [Everfit](https://www.kmart.com.au/product/everfit-24kg-dumbbells-adjustable-dumbbell-weight-plates-home-gym-multi-110070734/), [Centra](https://www.kmart.com.au/product/centra-24kg-adjustable-dumbbell-single-weight-plates-home-gym-fitness-exercise-110082303/), [Powertrain](https://www.kmart.com.au/product/powertrain-24kg-adjustable-dumbbell-home-gym-exercise-bench-weights-110082952/) (search snapshots). No Anko-branded 24 kg dial dumbbell found.
- **Gumtree "brand new" asking prices (search snapshot of listing page):** 2×24 kg + rack A$399 firm, Leppington NSW, 01/10/2026; "24kg x 2 Smart Adjustable Dumbbell Weight Set Total 48kg With Stand" A$190, Sunshine West VIC, 31/03/2026, and A$539 negotiable, Tarneit VIC, 08/04/2026; A$350 "BRAND NEW & IN STOCK", 6-month warranty, Cannon Hill QLD; showroom retailer A$449 (A$569 with stand), Meadowbrook QLD, 04/12/2025; a Springvale VIC importer selling **"wholesale" A$190 per pair** + A$40 metro delivery (2025) — [Gumtree](https://www.gumtree.com.au/s-gym-fitness/adjustable+dumbbells+24kg/k0c18565).
- **Factories (MIC, read directly):**
  - Nantong Vigor Sport Goods Co., Ltd. (Nantong, Jiangsu) — model AD-001, 2.5–24 kg/15 levels: US$48.50 (20–49 pcs), 45.50 (50–99), **43.00 (100+)**; carton 56×35×30 (cm assumed); "1set/Foam Support/Carton" (whether a "piece" is one dumbbell or a pair is not stated); nearest port Shanghai; lead time ≈1 month; manufacturer & trading; est. 5 May 2017; 3,362 m²; 23 staff listed; **SGS audit QIP-ASI264149**; ISO 9001:2015 — [MIC listing](https://vigfit.en.made-in-china.com/product/IYpUytirHScv/China-Adjustable-24kg-52lb-Dumbbell-Set-for-Home-Gym-Workouts.html).
  - Nantong Tengtai Sporting Fitness Co., Ltd. (Xianfeng Industrial Park, Nantong) — TDB2310 24 kg cast iron: US$42–43, MOQ 50 pcs, sample US$50; ≤30 days; Diamond since 2022; third-party audited; ISO; 1,000 pcs/month; business type not stated — [MIC listing](https://tt-sports.en.made-in-china.com/product/onKYSlcOMehX/China-Cast-Iron-52-5-Lb-Adjustable-Strength-Dumbell-Set-24kg-Dumbbell.html).
  - All Universe Fitness Technology (Qingdao) Co., Ltd. (Shandong) — Aoyufit AFDB-01 15-gear cast iron 24 kg US$50–55, MOQ 100 pcs; Diamond, Audited, "Industry-leading Audited Factory" — [MIC listing](https://alluniversefitness.en.made-in-china.com/product/ltzrmpfCuAYO/China-Aoyufit-Afdb-01-Adjustable-Dumbbell-15-Gear-Cast-Iron-24kg-Gym-Weight.html).
  - Dezhou Ranao Fitness Equipment Co., Ltd. (Shandong) — 24 kg set US$50–55, MOQ 30 sets; manufacturer & trading; ISO 9001:2015 — [MIC listing](https://ranao-fitness.en.made-in-china.com/product/FOIaNWeKyrYB/China-Hot-Sale-Home-Gym-Enhance-Strength-Fitness-Equipment-24kg-52-5lb-Adjustable-Dumbbell-Set-Dumbbell-for-Body-Building.html).
  - Hefei Bodyup Sports Co., Ltd. (Anhui) — 24 kg/40 kg US$32–38.80, MOQ 10 sets; Diamond, Audited — [MIC listing](https://bodyupsports.en.made-in-china.com/product/PfMYiKvhMFcw/China-Adjustable-Dumbbell-24kg-52-5lb-40kg-90lb-Gym-Dumbbell-Fitness-Equipment.html).
  - Global Sources: a 24 kg steel/rubber adjustable dumbbell US$54.5 (5–49), 53.3 (50–99), 51.2 (≥100) FOB Qingdao, 10–15 days lead time (dial mechanism not confirmed) — [Global Sources](https://m.globalsources.com/Dumbbell/Adjustable-Weights-Dumbbells-Set-1177101772p.htm) (search snapshot).

#### 2. Adjustable dumbbells — 2 × 40 kg dial-select pair (5–40 kg each, 17 settings) [the "32–40 kg" SKU]
- **Amazon AU (search snapshots):** Fitness Master 2×40 kg dial set ≈**A$449.99** — [Amazon AU](https://www.amazon.com.au/Fitness-Master-Adjustable-Dumbbell-Equipment/dp/B0F4L17HT6); FitnessLAB 2×40 kg A$499 ("not suitable for overhead exercises") — [Amazon AU](https://www.amazon.com.au/FitnessLAB-Adjustable-Dumbbell-Exercise-Easy-Grip/dp/B08P13358F); Powertrain 2×40 kg + stand "new offers from A$1,403" — [Amazon AU](https://www.amazon.com.au/Powertrain-Sports-Adjustable-Dumbbells-Stand/dp/B0CFLSCDHH).
- Not comparable but often confused: Everfit "40 kg" spin-lock sets (2×20 kg, cement/plastic 7-in-1 or cast-iron 4-in-1) at A$87 and A$110 (Harvey Norman), A$107 (Bunnings marketplace), A$114.90 (Kmart marketplace) — [Harvey Norman](https://www.harveynorman.com.au/everfit-adjustable-dumbbell-barbell-set-40kg.html), [Kmart](https://www.kmart.com.au/product/everfit-40kg-adjustable-dumbbells-set-kettle-bell-weight-plates-barbells-black-110070811/) (search snapshots).
- **Factories (MIC):** Dezhou Ranao "24kg/52.5lb 40kg/90lb" US$50–85, MOQ 10 sets — [MIC](https://ranao-fitness.en.made-in-china.com/product/iOGADnTdqupr/China-Home-Gym-24kg-52-5lb-40kg-90lb-Multi-Function-Training-Strength-Equipment-Weights-New-Adjustable-Dumbbell-for-Sports-Health.html); Hefei Merrybody Sports "40kg/24kg" US$35–65, MOQ 200 pcs, Diamond, CE — [MIC](https://merrybody.en.made-in-china.com/product/XAxUJBvbnZYw/China-Adjustable-Dumbbell-Set-40kg-24kg-Home-Gym-Equipment-Adjustable-Weight-Set.html); All Universe (Qingdao) "24kg and 40kg" US$68–188, MOQ 1 — [MIC](https://alluniversefitness.en.made-in-china.com/product/DTjYqRoGIprm/China-Adjustable-Dumbbell-Set-24kg-and-40kg-Sports-Training-Equipment-Weights-Dumbbell.html); Nantong Get-Fit Sports "24kg 40kg" US$52, MOQ 10 pcs — [MIC](https://get-fit.en.made-in-china.com/product/JRUYzwdjnoWi/China-Gym-Equipment-24kg-40kg-Adjustable-Weights-Dumbbell-Sets-for-Body-Building.html). 32–36 kg variants: Dezhou Ranao smart 20/24/32/36 kg US$65–95, MOQ 1 set — [MIC](https://ranao-fitness.en.made-in-china.com/product/qORAdzlynorx/China-Gym-Fitness-Equipment-New-Automatic-Adjustable-Dumbbells-20kg-24kg-32kg-36kg-Increase-by-4kg-Smart-Dumbbell-Set.html); Hefei Dayu "24kg/32kg" round-head US$41–50, MOQ 50 sets — [MIC](https://dayu2208.en.made-in-china.com/product/OmkYUNlVAjRe/China-Adjustable-Round-Head-Dumbbell-Free-Weights-24kg-32kg-for-Gym-Exercise.html). None of these listings itemises a separate 40 kg price line.

#### 3. Weight plates — 100 kg Olympic rubber bumper set (2×5, 2×10, 2×15, 2×20 kg, 50 mm hub)
- **Amazon AU (search snapshots):** BRIXX PRO Black and BRIXX Classic 100 kg bumper sets **A$400.00** each — [Amazon AU search](https://www.amazon.com.au/bumper-plate-set/s?k=bumper+plate+set); BRIXX Classic 100 kg + 20 kg bar A$675 — [Amazon AU](https://www.amazon.com.au/BRIXX-Classic-Olympic-Bumper-Barbell/dp/B0FLKL1F76); Kingkong 100 kg + 20 kg bar A$749; "Total 100 kg" rubber-coated **cast iron** (not bumper) A$360 — [Amazon AU](https://www.amazon.com.au/Olympic-Rubber-Coated-Weight-Commercial/dp/B0BD33BRBR); CORTEX SR-10 squat rack + 100 kg tri-grip plates package listed — [Amazon AU](https://www.amazon.com.au/CORTEX-SR-10-Squat-Rack-Package/dp/B0GR57LPYV).
- **Factories (MIC; prices are per kg — inferred from the kg-denominated MOQs):** Nantong Tengtai **US$1.00**, MOQ 1,000 kg, Diamond, Audited — [MIC](https://tt-sports.en.made-in-china.com/product/mQlUwAIbaHVq/China-Gym-Fitness-Bumper-Plate-Rubber-Competition-Weight-Bumper-Plate.html); Nantong Ironman Sporting Industrial US$1.29–1.49, MOQ 1,000 kg — [MIC](https://ironmaster-group.en.made-in-china.com/product/FZyxsYlOlpWn/China-Colorful-Bumper-Plates-for-Strength-Training.html); Hebei Dili Sports Commerce (trading co.) US$1.25–1.35, MOQ 500 kg — [MIC](https://dili-fitness.en.made-in-china.com/product/oaWRhVTGvbYP/China-Factory-Wholesale-Colorful-Fitness-Rubber-Bumper-Plate-with-Stainless-Ring-for-Weight-Lifting-Gym.html); Shandong Dx Grandway (trading co.) US$1.20–1.40, MOQ 1,000 kg — [MIC](https://dexuhongtu.en.made-in-china.com/product/SauUjfewHPrR/China-Colorful-Rubber-Bumper-Plates-Customized-Logo-Weight-Plate.html); Qingdao Modun US$1.10–1.90, MOQ 1,000 kg — [MIC](https://qdmodun.en.made-in-china.com/product/yxERIXdralpP/China-Wholesales-Dedicated-Gym-Barbell-Weight-Plates-Discs-Tri-Grip-Weight-Bumper.html); Hebei Jinheng US$0.65–1.89, MOQ 1,000 kg — [MIC](https://jinheng2026.en.made-in-china.com/product/GtvYoCHJasRU/China-Factory-Price-Gym-Plate-Weight-Plate-Home-Fitness-Body-Building-Gym-Equipment-Barbell-Plates-Standard-Barbell-Rubber-Bumper-Plate-Set.html). No plate listing on the visible page carried a Manufacturer/Factory badge.

#### 4. Power rack / cage WITHOUT cable pulley (home grade, pull-up bar, J-hooks, safeties)
- **Amazon AU (search snapshots):** CANPA Multifunction Power Rack with pull-up bar **A$215.99** (typical A$269.99) and A$229.48 (list A$359.99) in another snapshot — [Amazon AU](https://www.amazon.com.au/CANPA-Multifunction-Capacity-Adjustable-Equipment/dp/B0BDLFCHB3); VEVOR power cage A$240.99; Centra squat rack 250 kg A$159.99 (stand, not a cage); power cage + bench A$329.95 — [Amazon AU](https://www.amazon.com.au/Power-Squat-Adjustable-Weight-Bench/dp/B0BZR57FL7). The snapshot summary notes some heavy-steel listings add shipping of roughly A$50–130 — [Amazon AU power cage search](https://www.amazon.com.au/power-cage/s?k=power+cage).
- **Factories (MIC):** Nantong Jingyang Machinery Equipment Manufacturing Co. (Nantong) — power rack US$155 (10–49), 152 (50–99), 150 (100+); **manufacturer; SGS audit QIP-ASI264243**; est. 22 Jul 2019; 1,200 m²; 22 staff; ~1 year exporting, main market "Domestic"; carton data not stated — [MIC](https://jy-fitness.en.made-in-china.com/product/PTIrmdFKXWYV/China-Fitness-Equipment-Squat-Rack-Power-Rack-and-Cage-Comprehensive-Fitness-Training-System.html); same firm's squat/bench rack US$65–69, MOQ 10 — [MIC](https://jy-fitness.en.made-in-china.com/product/vAWpCFNHfVUr/China-Wholesale-Adjustable-Squat-Dumbbell-and-Bench-Rack-with-Bench-Press-Ideal-for-Home-Gym-Weightlifting-Fitness-Training.html); Nantong Tengtai half rack/cage US$95–105, MOQ 30 — [MIC](https://tt-sports.en.made-in-china.com/product/iJXrVNvHZUWc/China-Gym-Home-Multi-Functional-Fitness-Equipment-Power-Rack-Half-Rack-Squat-Cage.html) and full cage US$200, MOQ 30 — [MIC](https://tt-sports.en.made-in-china.com/product/EJlRGNQoIbhr/China-Commercial-Fitness-Gym-Equipment-Multi-Function-Power-Cage-Power-Rack-Squat-Rack.html); Ironwod Industrial (Shandong) US$160–180, MOQ 20 — [MIC](https://ironwod.en.made-in-china.com/product/fxkpPoeYJjUW/China-Customized-Non-Slip-Safety-Durable-Commercial-Fitness-Multi-Power-Rack-with-Custom-Logo.html); Rizhao Shangshuo (trading) home rack US$69–89, MOQ 1 set — [MIC](https://rizhaoshangshuo.en.made-in-china.com/product/yFwaqoMzwJks/China-Multifunction-Multi-Purpose-Pull-up-Gym-Equipment-Fitness-Adjustable-Heavy-Duty-Gym-Weight-Equipment-Power-Bench-Press-Squat-Home-Gym-Rack.html); Linefar Fitness (Nantong) US$298–305, MOQ 20 — [MIC](https://linefarfitness.en.made-in-china.com/product/uzEYpMPLjxcA/China-Linefar-Fitness-Power-Rack-Power-Cage-Squat-Rack.html).

#### 5. Power rack WITH cable pulley (lat pulldown / low row)
- **Amazon AU (search snapshots):** HCE Power Fitness rack with lat pulldown + cable crossover **A$599 + A$44.99 delivery** — [Amazon AU](https://www.amazon.com.au/HCE-Fitness-Multifunctional-Pulldown-System/dp/B0BB8RCFGZ); RTM A$649.95 — [Amazon AU](https://www.amazon.com.au/Power-Rack-Squat-Stands-Pulldown/dp/B0D3KXCHF3); Ultrasport A$699 — [Amazon AU](https://www.amazon.com.au/Ultrasport-Fitness-Multifunctional-Pulldown-System/dp/B085YTVKGP); BLOODYRIPPA A$699.99 — [Amazon AU](https://www.amazon.com.au/BLOODYRIPPA-Pull-Down-Landmine-Multifunctional-Equipment/dp/B08KPYTXZQ); Sportsroyals A$1,275.12 — [Amazon AU](https://www.amazon.com.au/Sportsroyals-Multi-Function-Adjustable-Crossover-Attachment/dp/B0CMPGK1TP).
- **Factories (MIC):** Nantong Wekeeping Co. (manufacturer & trading) "power cages cable machine" US$635–735, MOQ 10 — [MIC](https://nt-kebu.en.made-in-china.com/product/uGcUhlpCXZVL/China-Factory-Quick-Customization-Power-Weight-Lifting-Rack-Power-Cages-Cable-Machine-Gym.html); Qingdao Modun rack with lat pulldown + crossover US$2,160–2,350, MOQ 2 sets — [MIC](https://qdmodun.en.made-in-china.com/product/JOpAbkqGJHtc/China-Wholesale-Commercial-Fitness-Squat-Rack-Lat-Pulldown-Cable-Crossover-Power-Rack-Multifunctional-Smith-Machine.html). No home-grade (sub-US$300) cable cage listing was found.

#### 6. Adjustable FID (flat/incline/decline) weight bench
- **Amazon AU (search snapshots):** Centra adjustable FID bench, 300 kg, fast-folding **A$96.04** (RRP A$129.99) — [Amazon AU](https://www.amazon.com.au/Centra-Adjustable-Folding-Levelling-Equipment/dp/B0F2RS66WJ); generic FID bench A$99.95 — [Amazon AU](https://www.amazon.com.au/Adjustable-Decline-Incline-Strenth-Training/dp/B0BFDNMVNR); XINSPORTS A$99.95 — [Amazon AU](https://www.amazon.com.au/Energetics-Multi-Function-Incline-Decline-Preacher/dp/B08KXTF636); heavy-duty 12-position bench A$139.98 — [Amazon AU](https://www.amazon.com.au/Adjustable-Heavy-Duty-Backrest-Positions-Commercial-Feel/dp/B0HB55QZ3G); Powertrain JMK A$194 — [Amazon AU](https://www.amazon.com.au/Powertrain-Adjustable-Weight-Incline-Decline/dp/B079HWWDD6). Kmart Marketplace: Fitness Master 14-backrest bench (Salesbay) A$198.69 — [Kmart](https://www.kmart.com.au/product/fitness-master-adjustable-weight-bench-14-backrests-incline-home-workout-1100lbs-110203208/).
- **Factories (MIC):** Deqing Sister Sports (JDM, Huzhou, Zhejiang; manufacturer & trading) US$43–45, MOQ 100 — [MIC](https://jdmsports.en.made-in-china.com/product/vtpUXYKuYlWr/China-Home-Gym-Equipment-Workout-Weight-Lifting-Bench-Press-Banco-De-Gimnasio-Adjustable-Strength-Training-Dumbbell-Bench.html); Nantong Tengtai US$73, MOQ 30 — [MIC](https://tt-sports.en.made-in-china.com/product/JrTpivdUsWct/China-Adjustable-Weight-Bench-for-Home-Gym-Fitness-Training.html); Nantong Splendid US$78.20–80, MOQ 30 — [MIC](https://splendidsports.en.made-in-china.com/product/jOTGrJUuvdtf/China-Weight-Bench-Adjustable-Home-Gym-Multi-Purpose-Workout-Bench-for-Strength-Training.html); Nova Fitness Equipment (Jiangsu; manufacturer & trading) US$80, MOQ 20 — [MIC](https://novefitness.en.made-in-china.com/product/aRhpdTiGYckX/China-Home-Gym-Adjustable-Incline-Bench-Press-Weight-Training-Bench-Home-Gym.html); Nantong Vigor BT010 heavy-duty FID US$117 (20–49), 114 (50–199), 109 (200+), 130×59×25 cm, **46 kg gross**, Shanghai, SGS-audited — [MIC](https://vigfit.en.made-in-china.com/product/BpORPYjrXXVn/China-Adjustable-Weight-Bench-Heavy-Duty-Commercial-Fid-Gym-Bench-for-Strength-Training.html).

#### 7. Rowing machines (magnetic foldable; water; air)
- **Amazon AU (search snapshots):** FINEX foldable 16-level magnetic **A$252.80**; Ouroad 16-level, 150 kg, LCD A$299.90 — [Amazon AU](https://www.amazon.com.au/Ouroad-Magnetic-Foldable-Machines-Resistance/dp/B0G2X9BKH3); Everfit 16-level A$319.95 (RRP A$359.95), another Everfit listing A$285.95 — [Amazon AU](https://www.amazon.com.au/Adjustable-Magnetic-Resistance-Flywheel-Exericise/dp/B08Z3CZW67); MINYII "magnetic/water" rower A$339.99 — [Amazon AU](https://www.amazon.com.au/Magnetic-Rowing-Machine-Weight-Capacity/dp/B0DP9X8BHB); Merach Q1S A$359.99; Circuit Fitness Bluetooth A$1,255.77 — [Amazon AU](https://www.amazon.com.au/Circuit-Fitness-Foldable-Magnetic-Machine/dp/B07WVW36DY); a "basic magnetic rower" at A$127.97 with a generic description (spec unverified) — [Amazon AU search](https://www.amazon.com.au/foldable-rowing-machine/s?k=foldable+rowing+machine).
- Kmart Marketplace: Advwin magnetic rower (price not in snapshot) — [Kmart](https://www.kmart.com.au/product/advwin-magnetic-rowing-machine-110072177); Powertrain air rower (Klika Group) A$699 — [Kmart](https://www.kmart.com.au/product/powertrain-air-rowing-machine-resistance-rower-for-home-gym-cardio-110082919/). Aldi sold an Air Rower for A$349 in June 2020 (historic) — [Yahoo News AU](https://au.news.yahoo.com/aldi-exercise-machine-004158813.html).
- **Factories (MIC):** Deqing Sister Sports ES-1710 foldable magnetic US$87.20 (50–199), 85.50 (200–479), 83.20 (480+); carton 98×23×64 cm, 25 kg gross (20.5 kg net); 200 pcs/20GP, 402/40GP, 480/40HQ; max user 110 kg; founded 2010; Diamond since 2015; 50,000 pcs/yr; ISO/RoHS/CE; "audited by an independent third-party inspection agency" — [MIC](https://jdmsports.en.made-in-china.com/product/hFzAgGcXhbtH/China-2025-Fitness-Equipment-Space-Saving-Foldable-Rower-Magnetic-Rowing-Machine.html); Nantong Vigor foldable magnetic + LCD US$82–88, MOQ 100 — [MIC](https://vigfit.en.made-in-china.com/product/aRkYXemKACcy/China-Foldable-Magnetic-Control-Rowing-Machine-with-LCD-Display-for-Home-Gym-Fitness.html); Jinhua Zhongteng Fitness (3 kg magnetic wheel) US$84–86, MOQ 10 — [MIC](https://emmasports.en.made-in-china.com/product/qFdtzKncrkhD/China-Foldable-Rowing-Machine-with-3kg-Magnetic-Wheel.html); Xiamen F-Orchid US$56, MOQ 500 sets — [MIC](https://forchidgroup.en.made-in-china.com/product/ypVrOBXgQqkN/China-High-Quality-Best-Wholesale-Price-Home-Fitness-Magnetic-Resistance-Control-Rowing-Machine.html). Water rowers: Rizhao Ape Fitness US$155–205, MOQ 10–20 — [MIC](https://apefitness.en.made-in-china.com/product/BwkGyCfPLztd/China-Ape-Fitness-Exercise-Water-Rowing-Machine-Training-Fitness-Equipment-for-Home-Gym.html); Dezhou Ranao wood-frame A6 US$185–210 — [MIC](https://ranao-fitness.en.made-in-china.com/product/BZFalwhAAUYr/China-Home-Gym-Cardio-Fitness-Equipment-Wood-Frame-Water-Rowing-Machine-A6-.html); Shandong Minolta wooden water rower US$149–169 — [MIC](https://2379be2cf4fbaaaf.en.made-in-china.com/product/udNAZosOpiUh/China-Commercial-Gym-Equipment-Cardio-Machine-Foldable-Rowing-Machine-Wooden-Water-Rower.html). Air rowers: Shandong Minolta US$179–246; All Universe US$230–250; Rizhao F-Leader US$420–440 — [MIC magnetic rower search](https://www.made-in-china.com/products-search/hot-china-products/Magnetic_Rowing_Machine.html).

#### 8. Walking pad / under-desk treadmill (flat, 1–6/8 km/h, LED, remote, 100–120 kg)
- **Amazon AU (search snapshots):** listings roughly A$135–300; Advwin walking pad **A$189.90** (1–8 km/h, 120 kg, 100×38 cm belt) — [Amazon AU](https://www.amazon.com.au/ADVWIN-Electric-Treadmill-Exercise-Foldable/dp/B09MTFSJ9D); Yagud 2.5HP with remote A$189.99 — [Amazon AU](https://www.amazon.com.au/Yagud-Treadmill-Treadmills-Non-Slip-Portable/dp/B0G4TNDKWR); FOUSAE 9% incline, 150 kg — [Amazon AU](https://www.amazon.com.au/Treadmill-Brushless-Treadmills-Programs-Full-Screen/dp/B0HL4VXDKR).
- **Kogan (search snapshot):** Fortis Foldable Walking Pad **A$204 members / A$214 non-members** (SRP A$389.99; 0–6 km/h, 100 kg), other Kogan snapshots A$169, A$189, A$209 — [Kogan](https://www.kogan.com/au/buy/fortis-foldable-walking-pad-treadmill-fortis-b/); Fortis Walking Pad with Incline A$189/A$199 (SRP A$329.99) — [Kogan](https://www.kogan.com/au/buy/fortis-walking-pad-with-incline-black-fortis/).
- **Kmart:** own-brand **Anko Electric Treadmill** (full folding treadmill, 450W DC) A$279 (was A$399), online only — [Kmart](https://www.kmart.com.au/product/electric-treadmill-43547005/); marketplace Advwin walking pad A$189.99 — [Kmart](https://www.kmart.com.au/product/advwin-pink-walking-pad-treadmill-pink-110072267/); Costway 2.25HP walking machine A$189.90 — [Kmart](https://www.kmart.com.au/product/costway-2.25hp-walking-machine-electric-treadmill-running-machine-wled-displayandremote-control-110128915/) (search snapshots). No Anko walking pad found.
- **Others:** Bunnings LSG Steps walking pad A$189 — [BuyWisely](https://buywisely.com.au/au/product/lsg-steps-walking-pad-under-desk-treadmill); Everfit foldable walking pad A$189.95 (Velocity store, sold by Modern Living) — [Velocity](https://www.velocityfrequentflyer.com/store/product/everfit-foldable-electric-walking-pad-mac7b5455); Merach T26 A$229.99 free shipping — [Merach AU](https://au.merachfit.com/products/under-desk-walking-pad-treadmill-portable-t26); PriceMe Advwin black best A$224.90, low A$199 on 27 Nov 2025 — [PriceMe](https://www.priceme.com.au/Advwin-Walking-Pad-Treadmill-Fitness-Black/p-919489247.aspx) (all search snapshots). Temu AU price not found.
- **Gumtree "brand new":** delivery-only dealer listings of Everfit pads A$200–254 (e.g. Molendinar QLD A$228, 1-year warranty); private "new" 3-in-1 pads A$389 (Sydney), A$143 (Midway Point TAS), A$615 (Ringwood VIC) — [Gumtree](https://www.gumtree.com.au/s-gym-fitness/walking+pad/k0c18565) (search snapshot).
- **Factories (MIC):** Zhejiang Ypoo Health Technology Co. (model M4538) **US$74.99, MOQ 100**; carton 122×62×13 cm, 25.5 kg gross/22 kg net; **690 pcs/40HQ**; 0.75 HP continuous, 0.8–8 km/h, 120 kg; lists CE/RoHS/GS/EN957/CCC — **no SAA/RCM**; voltage/plug not stated; manufacturer & trading; est. 31 Oct 2012; 48,000 m² (profile also says ~120,000 m²); **TÜV Rheinland audit MIC-ASR2431394**; Diamond since 2019; ports Ningbo/Shanghai — [MIC](https://ypoosports.en.made-in-china.com/product/mOwTjiXHZhAG/China-Factory-Wholesale-Smart-Customized-Home-Gym-LED-Screen-Foldable-Walking-Pad.html); Yongkang Chochi Fitness (Zhejiang) US$54.5–60, MOQ 10, 1–8 km/h, 120 kg, ISO 9001 — [MIC](https://meshinesports.en.made-in-china.com/product/wfZrimzGayUY/China-China-Supplier-Home-Personal-Fitness-Use-Speed-1-8-Km-Hr-120kg-Walking-Pad-Foldable.html); Zhejiang Rongshun Technology 2.0HP brushless + app US$85.9–95.7, MOQ 200 — [MIC](https://yijianfitness.en.made-in-china.com/product/AtEpPgrMRNYl/China-Smart-Indoor-Walking-Pad-with-2-0HP-Brushless-Motor-APP.html); Deqing Sister US$97.2–105.2, MOQ 100 — [MIC](https://jdmsports.en.made-in-china.com/product/YftUOgrZgVkI/China-Smart-Indoor-Walking-Pad-with-Motorized-Functionality-and-Display.html); Xiamen Kstar Sports under-desk 2-in-1 auto-incline with remote US$124–130, MOQ 50, ISO 9001 — [MIC](https://kstarsport.en.made-in-china.com/product/lRcrxEKJVBWL/China-Kstar-Under-Desk-2-in-1-Free-Assembly-Auto-Incline-Walking-Pad-for-Home-Use-with-Remote-Control.html); Yongkang Aoxu Import & Export (a trading company by name) US$99–105, MOQ 50, BSCI — [MIC](https://aoxugym.en.made-in-china.com/product/KaBpCxXoCgRc/China-Nice-Price-Incline-Adjustment-Walking-Pad-for-Apartment-Fitness.html).

#### 9. Magnetic spin / exercise bike (≈10–13 kg flywheel, belt drive, LCD)
- **Amazon AU (search snapshots):** Everfit magnetic 8-level spin bike **A$174.27** — [Amazon AU](https://www.amazon.com.au/Everfit-Exercise-Stationary-Adjustable-Resistance/dp/B0CQ6Q8MHD); Everfit 13 kg flywheel A$198.95 — [Amazon AU](https://www.amazon.com.au/Everfit-Exercise-Stationary-Adjustable-LCD-Display/dp/B0DZXF8VVK); Advwin 6 kg A$299 — [Amazon AU](https://www.amazon.com.au/Exercise-Magnetic-Resistance-Stationary-Flywheel/dp/B0G48JKVML); Proflex 13 kg A$319 — [Amazon AU](https://www.amazon.com.au/Proflex-Stationary-Exercise-Flywheel-Sensors/dp/B0D59K4VJ6); WENOKER A$334.99 — [Amazon AU](https://www.amazon.com.au/Exercise-Magnetic-Resistance-Stationary-Flywheel/dp/B0DWXZNDSM); Lifespan SM-120 A$429 (RRP A$549).
- **Kmart:** "Spin Bike" 13 kg flywheel, 120 kg, **A$159 clearance (was A$249)**, promotion text "ends 14/5" (year not shown), delivery fee applies — [Kmart](https://www.kmart.com.au/product/spin-bike-43527007) (search snapshot).
- **Factories (MIC):** Zhejiang Todo Hardware Manufacture Co. — **US$52.50 (224–463 pcs)**, 52.00 (464–543), 51.00 (544+); carton 95×22×78 cm, 26 kg gross; **224 pcs/20GP**, 464/40GP, 544/40HQ; "11 kg" flywheel in description vs "<10 kg" in attributes; 4-function monitor (battery type not stated); nearest port Ningbo; **BV audit MIC-ASR243426**, BSCI, ISO 9001, Walmart audit, SAA/CE/RoHS listed; ≈20 staff; Gold Member since 2017 — [MIC](https://todofit.en.made-in-china.com/product/DFAagouchvWf/China-New-Body-Building-Fitness-Magnetic-Exercise-Spinning-Gym-Home-Spin-Bike.html); Jinhua Zhongteng Fitness (Feiyang Industrial Park, Bailongqiao, Wucheng District, Jinhua) 10 kg flywheel **US$98 (50–199), 96 (200+)**, sample US$120, 35 days, Ningbo, **TÜV Rheinland MIC-ASI263121**, carton data not stated — [MIC](https://emmasports.en.made-in-china.com/product/bZKTvgaBAkVJ/China-2025new-Hot-Sell-Magnetic-Spin-Bike-10kg-Flywheel-Big-Size-Magnet.html); Ningbo Mingni Import & Export US$55–74, MOQ 10 — [MIC](https://nbmingni.en.made-in-china.com/product/jZUmewFdwlhE/China-2020-Gym-Spin-Bike-Fitness-Indoor-Commercial-Magnetic-Spin-Bikes-for-Gym.html); Xiamen Kstar US$141.50–147.50, MOQ 154 — [MIC](https://kstarsport.en.made-in-china.com/product/NroUDPqMCeWQ/China-Kstar-Spinning-Indoor-Adjustable-Exercise-Bike-Fitness-Bike-with-Panel-Magnetic-Resistance-Spin-Bike.html); Nantong Vigor 20 kg flywheel US$204.60–224.70 — [MIC](https://vigfit.en.made-in-china.com/product/mrQUPALKuvcu/China-Commercial-Spin-Bike-with-20kg-Flywheel-Magnetic-Resistance-Gym-Use.html).

#### 10. Kettlebell set (cast iron, powder coated; modelled as 8 + 12 + 16 kg = 36 kg)
- **Amazon AU (search snapshots):** Amazon Basics 20 kg **A$79.90** (A$4.00/kg) — [Amazon AU](https://www.amazon.com.au/Amazon-Basics-Cast-Iron-Kettlebell/dp/B0CC8DD7N6); Orbit 16 kg A$80 — [Amazon AU](https://www.amazon.com.au/Orbit-Cast-Iron-Kettlebell-16/dp/B0C73FRKZX); Amazon Basics 9 kg A$44.89 — [Amazon AU](https://www.amazon.com.au/AmazonBasics-Cast-Iron-Kettlebell-20/dp/B0731DWW5D) and 11.3 kg A$57.90 — [Amazon AU](https://www.amazon.com.au/AmazonBasics-Enamel-Kettlebell-25-lb/dp/B0731CP5S4); 24 kg set (4+4+6+10) A$147.33; Yes4All 22 kg set A$133.29 — [Amazon AU](https://www.amazon.com.au/Yes4All-Powder-Coated-Kettlebell-Weight/dp/B09FTCVJFR); PROIRON neoprene-coated 4–20 kg from A$45.99.
- **Kmart:** 12 kg cast-iron kettlebell **A$29 clearance (was A$39)** — [Kmart](https://www.kmart.com.au/product/kettle-bell---12kg/2666324); Anko Adjustable Weight Kettlebell Set A$29 — [Kmart](https://www.kmart.com.au/product/adjustable-weight-kettlebell-set-43767724/); Everfit 16 kg (marketplace) A$52.95 — [Kmart](https://www.kmart.com.au/product/everfit-16kg-kettlebell-set-weight-lifting-bench-dumbbells-kettle-bell-gym-home-black-110070718/) (search snapshots).
- **Factories (MIC; per kg):** Hebei Dili Sports Commerce (trading) US$0.90–1.10, MOQ 500 kg — [MIC](https://dili-fitness.en.made-in-china.com/product/fGMpeLwCfvrs/China-Anti-Slip-Handle-Cast-Iron-Kettlebell-4-32kg-Crossfit-Strength-Training-Gym-Fitness-Equipment.html); Hefei Bodyup US$0.95–1.05, MOQ 1,000 kg — [MIC](https://bodyupsports.en.made-in-china.com/product/FLxRtyclYmWV/China-Wholesale-Black-Solid-Cast-Iron-Kettlebell-for-Strength-Training-and-Home-Gym-Eco-Friendly-Fitness-Workout.html); Qingdao Goldroad US$1.05–1.25, MOQ 1,000 kg — [MIC](https://kettlebell-china.en.made-in-china.com/product/raiYbenHTupt/China-Cast-Iron-Kettlebell-with-Color-Ring-for-Strength-Training-Gym.html); Rizhao F-Leader International Trade US$1.12–1.43, MOQ 3,000 kg — [MIC](https://rzfleader.en.made-in-china.com/product/DESUzIpHalRd/China-SGS-Factory-Gym-Equipment-Accessories-Steel-Kettle-Bell-Free-Weight-Black-Solid-Cast-Iron-Powder-Coated-Gravity-Kettlebell-with-Color-Ring.html); Dingzhou Yunlingyu Sports Goods (Hebei; manufacturer & trading) US$1.00–1.40, MOQ 100 kg — [MIC](https://dingzhouyunlingyu.en.made-in-china.com/product/vFNfVkWwrgrJ/China-Manufacturer-Gym-Equipment-Sport-Competition-Kettle-Bell-Set-Lb-and-Kg-Body-Building-Fitness-Cast-Iron-Kettlebells.html); Nantong Wekeeping US$1.45–1.60, MOQ 500 kg — [MIC](https://nt-kebu.en.made-in-china.com/product/lnpYgzdvHOrL/China-Unique-Cast-Iron-Kettlebell-Set-for-Home-Gym-Workouts.html).

#### 11. Multi-station home gym (weight stack)
- **Amazon AU (search snapshots):** Costway multifunction station, 45 kg stack, **A$429.95–459.95**; Proflex M8000 A$455 — [Amazon AU](https://www.amazon.com.au/PROFLEX-Multi-Station-Equipment-Weight-Plates/dp/B087TMTGXM); Advwin 100 lb stack A$549; Powertrain 68 kg A$556.95 — [Amazon AU](https://www.amazon.com.au/Powertrain-Multi-Station-Weights-Preacher/dp/B0CQL4F2TS); vidaXL A$589.99 — [Amazon AU](https://www.amazon.com.au/vidaXL-Station-Fitness-Equipment-Weightlift/dp/B00V3ODK4K); fitnessLAB A$679 (2.7★/5 reviews) — [Amazon AU](https://www.amazon.com.au/FitnessLab-Exercise-Multi-Station-Fitness-Equipment/dp/B0CY4DNP6P); Centra 60 kg stack A$729.99 — [Amazon AU](https://www.amazon.com.au/Centra-Exercise-Equipment-Strength-Training/dp/B0DTTF2WXN); CORTEX GS7 (98 kg stack) A$2,016.54.
- **Factories (MIC):** Nantong Gympro Sports (trading) single station US$113.63–125.26, MOQ 50 sets (stack not stated) — [MIC](https://gymprosport.en.made-in-china.com/product/hUlpSiFWAfkB/China-Hot-Selling-Multi-Home-Gym-Equipment-Single-Station-Multi-Function-Gym.html); Dezhou Canxu Import & Export US$229–269, MOQ 1 — [MIC](https://dzcanxu.en.made-in-china.com/product/CZzTFvSVEUan/China-Home-Gym-Workout-Station-Multi-Functional-Set-Combination-Multi-Stations.html); Shandong Tianzhan Fitness Equipment (Ningjin; manufacturer; ISO 9001/45001/14001) "Ningjin" 3-station US$329–369, MOQ 2 — [MIC](https://dezhoutianzhan.en.made-in-china.com/product/QmMpbezKZqky/China-Ningjin-Popular-Home-Use-Gym-Equipment-Multi-Gym-3-Station.html) and 8-station GC-5099 US$348–425 — [MIC](https://dezhoutianzhan.en.made-in-china.com/product/amgrBdOVrXkM/China-Gc-5099-New-Design-Product-Gym-Machine-Fitness-Equipment-Hot-Sale-Home-Muscle-Use-Equipment-8-Multi-Station.html); Deqing Sister ES-4206 wall pulley station (no stack mentioned) US$140 (50–299)/128/121.60 (500+), carton 78×58×16 cm, 77 kg gross per carton of 3 pcs (as listed), 212 pcs/20GP, TÜV Rheinland MIC-ASR253715 — [MIC](https://jdmsports.en.made-in-china.com/product/dThpHFRxnsWk/China-Multi-Hotselling-Home-Gym-Exercise-Pulley-Station-Wall-Gym-Comprehensive-Fitness-Machine.html).

#### 12. Freestanding boxing bag (≈160–185 cm, fillable base)
- **Amazon AU (search snapshots):** Genki 185 cm hydraulic freestanding bag **A$79.99**; 70" adult bag with gloves + pump ≈A$63.63–74.04 — [Amazon AU](https://www.amazon.com.au/Freestanding-Punching-Electric-Kickboxing-Beginners/dp/B0DMVMQYF3); Centra 170–175 cm suction-cup A$155.99 (RRP A$163.99); Costway 170 cm A$199.95; VEVOR bag stand A$236.90 — [Amazon AU search](https://www.amazon.com.au/free-standing-boxing-bag/s?k=free+standing+boxing+bag).
- **Factories (MIC):** Rizhao Fine Fitness Equipment (Rizhao, Shandong) US$35, MOQ 50, 1.7 m, water/sand base; listed package 100×80×80 cm and 100 kg (implausible as per-unit data); est. 5 Nov 2020; 2,000 m²; **6 employees**; TÜV Rheinland MIC-ASI2651249; profile claims "over 10 years" experience despite 2020 founding — [MIC](https://fine-fitness.en.made-in-china.com/product/ZtURpFTAJdrY/China-Free-Standing-Punching-Bag-Punching-Training-Equipment.html); Nantong Enerize Sporting Goods US$48.20–54.10, MOQ 50 sets — [MIC](https://ntenerize.en.made-in-china.com/product/LOjAiPXHZYWg/China-Custom-Logo-Free-Standing-Punching-Bags-Boxing-Bags-Black-Boxing-Reflex-Bag.html); Nantong Ok Sporting (trading) US$53–55, MOQ 10 — [MIC](https://ok-sporting.en.made-in-china.com/product/dnXUhRikZcWV/China-Free-Standing-Gym-Training-Multifunctional-Professional-Boxing-Equipment-Target-Boxing-Punching-Bag.html); Nantong Gympro water-base US$42.35–46.45, MOQ 200 — [MIC](https://gymprosport.en.made-in-china.com/product/CYDRWJLHHuhj/China-Wholesale-Heavy-Boxing-Water-Free-Standing-Kick-Punching-Bag-Boxing-Sand-Post.html); Nantong ELF Sports heavy-duty US$112, MOQ 10 — [MIC](https://elf-sports.en.made-in-china.com/product/hgVrcHMvbpWU/China-Heavy-Duty-Free-Standing-Punching-Bag-for-Gym-Accessories.html).

#### 13. Added item: power tower (freestanding pull-up / dip station)
- **Amazon AU (search snapshots):** COMINGFIT **A$89.99** — [Amazon AU](https://www.amazon.com.au/COMINGFIT-Adjustable-Multi-Function-Exercise-Equipment/dp/B0CZJJJSDZ); PASYOU A$104.99 (4.2★, 45) — [Amazon AU](https://www.amazon.com.au/PASYOU-Adjustable-Multifunctional-Standing-Equipment/dp/B0DGXF8JZY); XIN 5-in-1 A$149.95 — [Amazon AU](https://www.amazon.com.au/Power-Tower-Chin-Station-Raise/dp/B0CMZBDXYC); BangTong&Li A$199.99 (4.3★, 6,815 ratings) — [Amazon AU](https://amazon.com.au/BangTong-Li-Adjustable-Multi-Function-Equipment/dp/B07HF36TC1); JOROTO foldable A$279.99 — [Amazon AU](https://www.amazon.com.au/JOROTO-Foldable-Adjustable-Strength-Equipment/dp/B0F7QXK79S).
- **Factory (MIC):** Deqing Sister Sports — 12 power-tower models US$46.20–74 (MOQ not shown on search page) — e.g. [MIC](https://jdmsports.en.made-in-china.com/product/laHpbDxjhihv/China-Premium-Adjustable-Power-Tower-for-Home-Gym-Workouts.html) (US$50–55).

### Inferences

#### Assumptions used in every row (all labelled; change them and re-run — the arithmetic is linear)
- **FX** USD 1 = A$1.4434 (cited above). Sensitivity: AUD 5% weaker (A$1.519).
- **20GP all-in (port-to-door, Sydney/Melbourne metro), base A$5,964** = ocean USD 2,400 (A$3,464; mid of the cited USD 1,500–2,695 range plus Q3/Q4 GRIs) + destination A$2,500 (carrier DHC ≈A$600–625, terminal levy ≈A$225–235, booking/side-loader ≈A$150, DO/docs, broker, IPC A$152, DAFF A$71, metro side-loader cartage). Low A$4,315 (USD 1,500 + A$2,150); high A$6,890 (USD 2,695 + A$3,000). FOB terms, so origin THC is the seller's. *Assumption built from cited ranges.*
- **LCL, base**: ocean USD 100 per revenue tonne (RT = greater of CBM or gross tonnes) = A$144, + destination depot/CFS A$100/RT, + A$900 fixed per shipment (DO/docs, broker, IPC, DAFF, tailgate pallet delivery). Low: USD 60 + A$80/RT + A$700. High: USD 200 + A$120/RT + A$1,200. *Assumption.*
- **Duty** 0% with a ChAFTA certificate of origin (A$60 per shipment assumed for the CoO); 5% general rate as sensitivity. **No anti-dumping duty** on any SKU (see compliance section).
- **Pre-shipment inspection** 1 man-day per factory per order at V-Trust's USD 268 = A$387.
- **Defect/damage allowance** 3% of (FOB + freight + duty); 6% as sensitivity.
- **Local handling/storage** A$3 per unit + A$60 per CBM (≈3 months in a self-storage unit plus handling). *Assumption.*
- **Selling**: Facebook Marketplace local pickup, no platform or payment fee (assumption — fees are covered by the Marketplace-demand researcher). GST-registered: net revenue = price ÷ 1.1; import GST (10% of customs value + duty + international freight) is reclaimed, shown only as a cash float.
- **Compliance amortised over the first order**: walking pad A$5,732 (A$4,000 RCM/EESS evidence testing or verification + A$1,500 button/coin-battery compliance for the remote + A$231.91 EESS Responsible Supplier fee) — the testing and remote figures are assumptions; spin bike A$300 (labels/manual; assumes an AA-battery console); everything else A$0.
- **Unit shipping basis (CBM / gross kg per sellable unit)**: 2×24 kg dial pair 0.060/52 (Vigor 56×35×30 cm carton assumed to hold a pair); 2×40 kg dial pair 0.10/88 (assumption); 100 kg bumper set 0.10/103 (assumption, pallet share incl.); home power cage 0.25/75 (assumption); cable cage 0.45/140 (assumption); light FID bench 0.08/20 (assumption); heavy FID bench 0.19/46 (Vigor listing); magnetic rower 0.144/25 (Deqing listing); water rower 0.30/45 (assumption); walking pad 0.0983/25.5 (Ypoo listing); spin bike 0.163/26 (Todo listing; Zhongteng assumed 0.163/30); kettlebell set 0.035/37.5 (assumption); multi-station 0.45/140 (assumption); boxing bag 0.15/20 (assumption — the Rizhao listing's 100×80×80 cm/100 kg is not credible per unit); power tower 0.12/28 (assumption).
- **Target sell price rule**: 10–20% below the cheapest Amazon AU comparable, and not above the Kogan/Kmart floor.

#### Ranked results (A$ per unit; GP = net revenue ex-GST minus landed cost)

| Rank | Product (SKU) | Price to beat (Amazon AU) | Target Marketplace price | Landed: 20GP / LCL | GP per unit: 20GP (LCL) | GP %: 20GP (LCL) | First-order cash: 20GP / LCL | Score /10 |
|---|---|---|---|---|---|---|---|---|
| 1 | Bumper plates, 100 kg set | 400.00 (BRIXX) | 339 | 233.65 (210 sets) / 255.67 (50) | 74.53 (52.51) | 24.2% (17.0%) | 49.1k / 12.8k | 6 |
| 2 | Dial dumbbells 2×40 kg | 449.99 (Fitness Master) | 379 | 273.77 (245 pairs) / 299.52 (50) | 70.78 (45.03) | 20.5% (13.1%) | 67.1k / 15.0k | 6 |
| 3 | Kettlebell set 8+12+16 kg | ≈144 (A$4.00/kg Amazon Basics); Kmart 12 kg A$39 (A$29 clearance) | 109 | 78.11 (575 sets) / 89.83 (100) | 20.98 (9.27) | 21.2% (9.4%) | 44.9k / 9.0k | 4 |
| 4 | Dial dumbbells 2×24 kg | 249.00 (LSG V1) | 199 | 156.88 (400 pairs) / 169.24 (100) | 24.03 (11.67) | 13.3% (6.4%) | 62.8k / 16.9k | 4 |
| 5 | Magnetic rower (foldable) | 252.80 (FINEX) | 219 | 174.23 (200) / 205.00 (50) | 24.86 (−5.91) | 12.5% (−3.0%) | 34.8k / 10.3k | 3 |
| 6 | Magnetic spin bike | 174.27 (Everfit) | 149 | 121.59 (224, Todo) / 232.98 (50, Zhongteng) | 13.86 (−97.52) | 10.2% (−72%) | 27.2k / 11.6k | 2 |
| 7 | Walking pad | 189.90 (Advwin) | 159 | 168.87 (280) / 220.66 (100) | −24.32 (−76.11) | −16.8% (−52.7%) | 47.3k / 22.1k | 2 |
| 8 | Power rack, no pulley | 215.99 (CANPA) | 189 | 226.58 (110) / 275.38 (30) | −54.76 (−103.56) | −31.9% | 24.9k / 8.3k | 2 |
| 9 | FID bench (light) | 96.04 (Centra) | 85 | 93.18 (330) / 107.09 (100) | −15.91 (−29.81) | −20.6% | 30.8k / 10.7k | 1 |
| 10 | Multi-station gym | 429.95 (Costway) | 379 | 407.44 (60) / 479.55 (20) | −62.89 (−135.00) | −18.3% | 24.4k / 9.6k | 1 |
| 11 | Power rack + cable pulley | 599 + 44.99 delivery (HCE) | 499 (outside band) | 511.51 (60) / 583.62 (20) | −57.87 (−129.98) | −12.8% | 30.7k / 11.7k | 1 |
| 12 | Water rower | 339.99 (MINYII, "magnetic/water") | 299 | 346.96 (90) / 395.03 (30) | −75.14 (−123.22) | −27.6% | 31.2k / 11.9k | 1 |
| 13 | Power tower (pull-up/dip) | 89.99 (COMINGFIT) | 79 | 113.19 (230) / 142.21 (50) | −41.37 (−70.39) | −57.6% | 26.0k / 7.1k | 1 |
| 14 | Freestanding boxing bag | 79.99 (Genki 185 cm) | 69 | 100.65 (180) / 129.26 (50) | −37.92 (−66.53) | −60.4% | 18.1k / 6.5k | 1 |

#### Per-SKU worked rows (base case; breakdown = FOB + freight + duty + PSI/CoO/compliance + defects + handling)

**1. Bumper plates, 100 kg Olympic set — score 6/10**
- SKU: 2×5, 2×10, 2×15, 2×20 kg rubber bumpers, 50 mm steel/brass hub. Price to beat A$400.00 (BRIXX 100 kg set, Amazon AU, seller/delivery not visible, search snapshot 9 Oct 2026); next floor A$360 for rubber-coated cast iron (not bumper). Target **A$339** (15% below; under the A$360 iron set).
- Factory basis: US$1.30/kg → **US$130/set** (Nantong Tengtai US$1.00/kg is the low end; Nantong Ironman US$1.29–1.49/kg; Hebei Dili and Shandong Dx Grandway are trading companies).
- 20GP, 210 sets (≈21.6 t, ≈21 CBM — weight-limited): 187.64 + 28.40 + 0 + 2.13 + 6.48 + 9.00 = **A$233.65**; net revenue A$308.18 → **GP A$74.53 (24.2%)**. Cash ≈A$49.1k plus import-GST float ≈A$4.3k; the whole outlay comes back after **160 of 210** sets.
- LCL, 50 sets (5.15 RT, charged on weight): landed A$255.67 → GP A$52.51 (17.0%); cash ≈A$12.8k (+≈A$1.0k GST float); payback 42 of 50.
- Sensitivity (20GP GP/unit): FOB +15% A$45.5; price −10% (A$305) A$43.7; high freight A$70.0; no CoO (5% duty) A$64.9; AUD −5% A$63.5.
- Compliance: no mandatory standard identified; ISPM-15 pallets. Rationale: best margin, near-zero defect risk, very heavy (online sellers must pay courier freight, Marketplace buyers collect). Used plates hold value, so expect used competition, and capital sits in a slow-turning heavy SKU.

**2. Dial dumbbells, 2 × 40 kg pair (the "32–40 kg" SKU) — score 6/10**
- SKU: two 5–40 kg dial-select dumbbells (17 settings) with trays. Price to beat ≈A$449.99 (Fitness Master 2×40 kg, Amazon AU snapshot), then A$499 (FitnessLAB). Target **A$379** (16% below; inside the A$100–400 band).
- Factory basis: **US$160/pair (estimate)** — no listing itemises a 40 kg price; the listed ranges that include 40 kg are US$50–85 (Dezhou Ranao), US$35–65 (Hefei Merrybody, MOQ 200) and US$68–188 (All Universe).
- 20GP, 245 pairs (≈21.6 t, 24.5 CBM): 230.94 + 24.34 + 0 + 1.82 + 7.66 + 9.00 = **A$273.77** → **GP A$70.78 (20.5%)**; cash ≈A$67.1k (+≈A$6.0k GST float); payback 195 of 245.
- LCL, 50 pairs (5.0 RT): landed A$299.52 → GP A$45.03 (13.1%); cash ≈A$15.0k; payback 44 of 50.
- FOB range: at US$130/pair GP is A$115 (20GP) / A$90 (LCL); at US$190/pair A$26 / A$0. **The FOB quote decides this SKU.**
- Rationale: wide gap to the Amazon floor, few A$379 new competitors seen, heavy (pickup advantage). Risks: dial/locking-mechanism failures and returns, "not for overhead use" warnings (FitnessLAB listing), FOB unknown until quoted.

**3. Kettlebell set, 8 + 12 + 16 kg (36 kg) — score 4/10**
- Price to beat: no identical set in the snapshots; the Amazon Basics 20 kg at A$79.90 = A$4.00/kg → ≈A$144 for 36 kg; Kmart's 12 kg is A$39 (A$29 clearance) ≈ A$3.25/kg. Target **A$109** (≈A$3.03/kg, kept at or under Kmart's per-kg level).
- Factory basis: US$1.15/kg → **US$41.40/set** (Hebei Dili US$0.90–1.10, Hefei Bodyup US$0.95–1.05, Qingdao Goldroad US$1.05–1.25, Dingzhou Yunlingyu US$1.00–1.40).
- 20GP, 575 sets (≈21.6 t, ≈20 CBM): **A$78.11** → **GP A$20.98 (21.2%)**; cash ≈A$44.9k; payback 454 of 575. LCL, 100 sets (3.75 RT): A$89.83 → GP A$9.27 (9.4%); cash ≈A$9.0k.
- Rationale: fine as weight filler in a mixed container, but the ticket is below the A$100–400 band unless bundled, 575 sets is a lot of local sell-through, and Kmart's own clearance pricing caps the price.

**4. Dial dumbbells, 2 × 24 kg pair — score 4/10**
- Price to beat **A$249.00** (LSG V1 pair, Amazon AU snapshot); Kmart marketplace Everfit pair A$259.95; Kogan Fortis 2-pack A$259 (Kogan First). Gumtree "brand new" pairs from **A$190** (incl. a Springvale importer selling "wholesale" at A$190/pair). Target **A$199** (20% below Amazon), which is still above the Gumtree importer price.
- Factory basis: US$45/dumbbell → **US$90/pair** (Nantong Vigor US$43–48.50; Nantong Tengtai US$42–43; Dezhou Ranao and All Universe US$50–55; Hefei Bodyup US$32–38.80).
- 20GP, 400 pairs (20.8 t, 24 CBM): 129.91 + 14.91 + 0 + 1.12 + 4.34 + 6.60 = **A$156.88** → **GP A$24.03 (13.3%)**; cash ≈A$62.8k; payback 347 of 400. LCL, 100 pairs (6.0 RT): A$169.24 → GP **A$11.67 (6.4%)**; cash ≈A$16.9k; payback 94 of 100.
- FOB sensitivity: at US$70/pair (Hefei Bodyup-level pricing) GP is A$53.77 (20GP) / A$41.40 (LCL); at US$110/pair (All Universe) it is −A$5.70 / −A$18.07.
- Rationale: proven demand but already crowded with small importers on Gumtree at A$190–399; margin only exists with the cheapest (least-proven) factories.

**5. Magnetic rower, foldable — score 3/10**
- Price to beat **A$252.80** (FINEX 16-level, Amazon AU snapshot); caveat: an unverified "basic magnetic rower" at A$127.97 also appeared. Target **A$219**.
- Factory basis: Deqing Sister ES-1710 at US$87.20 (the 200–479 tier is US$85.50, so the 20GP row is slightly conservative).
- 20GP, 200 units (listing says 200/20GP): **A$174.23** → **GP A$24.86 (12.5%)**; cash ≈A$34.8k; payback 176 of 200. LCL, 50 units: A$205.00 → **GP −A$5.91**.
- Rationale: profit only at a full container of one SKU; 200 rowers is a long Marketplace sell-through; cardio machines face heavy used supply (see the glut section).

**6. Magnetic spin bike — score 2/10**
- Price to beat **A$174.27** (Everfit 8-level, Amazon AU); Kmart's own 13 kg-flywheel bike A$159 clearance (A$249 regular). Target **A$149**.
- Zhejiang Todo at US$52.50 with the MOQ of 224 = one 20GP: **A$121.59** → **GP A$13.86 (10.2%)**; cash ≈A$27.2k; payback 202 of 224. Jinhua Zhongteng 10 kg flywheel at US$98 via 50-unit LCL: A$232.98 → **GP −A$97.52**.
- Rationale: thin even at the cheapest container-MOQ factory; used commercial spin bikes sell for about A$100 on Gumtree; Kmart undercuts.

**7. Walking pad — score 2/10**
- Price to beat **A$189.90** (Advwin, Amazon AU); Kogan Fortis A$204/A$214 (snapshots as low as A$169); Kmart marketplace and Bunnings ≈A$189–190. Target **A$159**.
- Factory basis: Zhejiang Ypoo M4538 US$74.99 + US$3 assumed for AU plug and remote changes = **US$78**.
- 20GP, 280 units (27.5 CBM): 112.59 + 21.30 + 0 + 22.07 (PSI/CoO + A$5,732 compliance ÷ 280) + 4.02 + 8.90 = **A$168.87** → **GP −A$24.32 (−16.8%)**; a repeat order without compliance cost is still −A$3.85. LCL, 100 units: A$220.66 → GP −A$76.11. Cash ≈A$47.3k for 280 units; the outlay is not recovered on the first container at A$159.
- Best case: Yongkang Chochi-level FOB (US$57 + US$3 = US$60) gives A$2.44 (1.7%) on the first order and A$22.91 (15.8%) on repeats at A$159. Pricing at A$179 gives A$20.62 / A$41.09, but A$179 is only 6% under Amazon and above Kogan's A$169 snapshot, so it breaks the pricing rule.
- Rationale: trend product, but the AU floor sits at import parity, it needs RCM/EESS and button-battery compliance, Gumtree is saturated with dealer listings, and motor/belt returns are a risk.

**8. Power rack without pulley — score 2/10**
- Price to beat **A$215.99** (CANPA, Amazon AU); target **A$189**. Factory basis US$100 (Nantong Tengtai half rack US$95–105; Nantong Jingyang full rack US$150).
- 20GP, 110 units: A$226.58 → **GP −A$54.76**; LCL 30: −A$103.56.
- Caveat: if CANPA's delivered price carries the A$50–130 heavy-steel shipping seen on some listings, a fair "delivered" comparator is ≈A$270–350; at A$299 the 20GP row would make ≈A$45 (17%). This is unverified, so the base verdict stands.

**9–14. Loss-making at the target price (score 1/10 each)**
- **FID bench**: the A$96.04 Centra floor implies A$85, below the band. The cheapest factory (Deqing Sister, US$44) lands at A$93.18 (20GP) → −A$15.91. The heavy-duty Vigor BT010 (US$114, 46 kg) against the heavy-duty A$139.98 floor lands at A$230.95 → −A$117.
- **Multi-station gym**: assumed FOB US$180, landed A$407.44 (20GP of 60) vs a A$379 target → −A$62.89.
- **Cable-pulley rack**: needs ≈A$479–539 (outside the band); assumed FOB US$250 lands at A$511.51 → −A$57.87.
- **Water rower**: US$170 FOB lands at A$346.96 vs A$299 → −A$75.14. Wooden frames also add biosecurity exposure.
- **Power tower**: US$50 FOB lands at A$113.19 vs A$79 → −A$41.37.
- **Boxing bag**: US$35 FOB lands at A$100.65 vs A$69 → −A$37.92.
- Common pattern: low A$/kg value and bulky cartons, so freight and handling eat 30–60% of the price, and the Amazon floor sellers buy by the 40HQ.

#### Recommended configuration: one weight-limited mixed 20GP of strength iron
- 100 × 2×40 kg dial pairs + 100 × 100 kg bumper sets + 70 kettlebell sets = **21,725 kg, 22.4 CBM**. That fits the 21.8 t QLD/SA/WA limit and leaves headroom in NSW (24.3 t) and VIC (23.8 t).
- Freight allocated by weight: A$0.275/kg.
- Landed and GP per unit:

  | Item | Landed | GP | GP % |
  |---|---|---|---|
  | 2×40 kg dial pair | A$276.70 | A$67.85 | 19.7% |
  | 100 kg bumper set | A$237.18 | A$71.00 | 23.0% |
  | Kettlebell set | A$79.36 | A$19.73 | 19.9% |

- Total cash ≈ **A$56.9k**, plus ≈A$5.0k import-GST float. Total GP ≈ **A$15.3k** if everything sells at target.
- Three factory inspections are included. Buyer's-consolidation fees at the origin CFS are not (est. USD 100–300).
- This is the only configuration in the category that combines double-digit margins with a full container.

### Gaps
- **Amazon AU data**: amazon.com.au blocked direct reads (503), so seller names, delivery fees and capture dates of the "price to beat" listings are unknown. Delivery fees matter most for the steel items.
- **Other channel floors not established**: Temu AU, Big W, current Aldi Special Buys and eBay AU importer listings. rebel prices were not captured.
- **FOB prices are listing ranges, not quotes** (no RFQs by instruction):
  - No 40 kg-specific dial-dumbbell price.
  - Several dumbbell listings don't say whether a "piece" is one dumbbell or a pair.
  - The AU-plug/RCM premium for walking pads is assumed.
- **Carton CBM and gross weight are assumed** for bumper plates, 40 kg dial dumbbells, racks, benches, kettlebells, multi-gyms, boxing bags and power towers. The freight lines for those rows carry ±30% uncertainty.
- **Defect and return rates are assumed**: no data for dial dumbbells or walking pads; flat 3% (6% tested).
- **No data on Marketplace sell-through speed** for 200–575 units of one SKU in a metro area.

## Is the post-COVID home-gym glut over in Australia in 2025–2026, and which items still sell fast new vs. are swamped by used units on Marketplace?

### Takeaway
The category-level hangover is over: Super Retail Group (rebel) told the ASX in August 2025 that "sporting equipment categories returned to growth after a period of consolidation post the COVID-19 period". But 2026 is soft. In May 2026, rebel reported a sports category with declining sales in March–April and "subdued" demand for higher-value sporting equipment, as fuel prices and rising rates bit. On the second-hand side, cardio machines are still cheap and plentiful: commercial and Peloton spin bikes were listed for about A$100 on Gumtree Sydney in Dec 2025–Feb 2026. Brand-new strength iron (dial dumbbells) is now being sold on classifieds by other small importers at A$190–399 a pair. So the competition for a new-goods Marketplace seller is increasingly other importers, not just used units. Free weights (plates, dial dumbbells, kettlebells) are the items where "new" still differentiates; spin bikes, treadmills/walking pads and rowers face the most used and dealer supply.

### Cited Findings
- **FY20, the COVID peak:** Super Retail Group said fitness and hardgoods were the strongest categories, as "COVID-19 restrictions led to strong demand for home fitness products" — [SRG FY20 ASX release, 24 Aug 2020](https://www.asx.com.au/asxpdf/20200824/pdf/44lt20sccm6c9x.pdf) (search snapshot). Gumtree reported a 411.2% rise in people browsing gym equipment at the peak of lockdowns — [Yahoo News AU](https://au.news.yahoo.com/gumtree-items-sell-210000616.html) (search snapshot).
- **FY25 (year to 28 June 2025):** rebel total sales grew 4.8% to $1.4b and like-for-like sales 3.5%. "Growth was broad based, with strong contributions from footwear and licensed apparel, women's apparel and fitness tech. Sporting equipment categories returned to growth after a period of consolidation post the COVID-19 period." — [SRG FY25 results, 21 Aug 2025](https://announcements.asx.com.au/asxpdf/20250821/pdf/06n3rmq0c325lz.pdf) (read directly).
- **FY26 trading update, 6 May 2026 (first 44 weeks):**
  - rebel H2 like-for-like sales +1.4%; total sales +2.8% for weeks 27–44 and +4.0% for weeks 1–44.
  - "rebel has gained market share and delivered a resilient performance despite operating in a sports category that recorded declining sales through March and April … Fitness tech contributed positively, supported by recent promotional activity. In contrast, demand for higher-value sporting equipment was subdued."
  - Group-wide: sales were "adversely affected by the onset of the Middle East conflict. Inflationary pressures, including higher fuel prices and rising interest rates … weighed on consumer sentiment."
  - Source: [SRG trading update](https://announcements.asx.com.au/asxpdf/20260506/pdf/06z9wq5spjzc4k.pdf) (read directly).
- **Market size (sources conflict):**
  - GlobalData: the commercial segment was 60.4% of the Australian fitness equipment market in 2025 (revenue 424.9m) — [GlobalData](https://www.globaldata.com/store/report/australia-fitness-equipment-market-analysis/) (search snapshot).
  - IMARC: US$369.3m in 2024, rising to US$735.4m by 2033 (7.13% CAGR) — [IMARC](https://www.imarcgroup.com/australia-fitness-equipment-market) (search snapshot).
  - SourceReady (appears AI-generated, low reliability): home fitness equipment ≈A$253.73m, growing about 2.5% a year to 2035 — [SourceReady](https://www.sourceready.com/report/detail/australia-home-fitness-equipment-market-2026).
- **Used cardio supply (Gumtree Sydney, used spin bikes):**
  - Star Trac V-Bike commercial spin bike A$100 (Leumeah, Feb 2026).
  - Peloton A$100 negotiable (Glebe, Dec 2025; "cost me $2899", screen not turning on).
  - Proform 405 SPX A$250 (Meadowbank, Jul 2025; bought for A$600).
  - Celsius BK1 A$50.
  - Source: [Gumtree](https://www.gumtree.com.au/s-gym-fitness/sydney/used+spin+bike/k0c18565l3003435) (search snapshot).
- **New strength gear sold by small importers on Gumtree (2025–26):** 2×24 kg dial pairs at A$190, A$350, A$399 and A$539, a showroom at A$449, and "wholesale A$190 per pair" — [Gumtree](https://www.gumtree.com.au/s-gym-fitness/adjustable+dumbbells+24kg/k0c18565) (search snapshot).
- **Walking pads on Gumtree:** brand-new Everfit pads from delivery-only dealers at A$200–254 with 1-year warranty; private "new" 3-in-1 pads at A$143–615 — [Gumtree](https://www.gumtree.com.au/s-gym-fitness/walking+pad/k0c18565) (search snapshot).
- **Walking-pad trend (Europe, one retailer):** Galaxus says walking pads are now 90% of its treadmill sales and demand tripled year on year; half of buyers are under 35, two-thirds are women, and it describes a "TikTok effect" — [Galaxus](https://www.galaxus.de/en/page/walking-pads-booming-on-galaxus-39031) (search snapshot). An Australian buying guide says "the TikTok girlies are obsessed with them — especially the ones who work from home" — [Refinery29 AU](https://www.refinery29.com/en-au/best-walking-pads-australia) (search snapshot).
- **Adjacent analogue (bikes, not gym gear):** used bicycle resale prices in Australia fell more than 25% over a year, and Facebook Marketplace is the dominant second-hand channel — [research.bike, Dec 2024](https://www.research.bike/2024/12/australian-used-second-hand-bicycle-sales/) (search snapshot).
- **US opinion, unsourced (low reliability):** "iron, steel, and simple mechanics keep their worth remarkably well, while anything with a motor, a console, or a subscription screen depreciates faster" — [blog post](https://search.longren.com/en/posts/a2cc9db1).

### Inferences
- **The "glut" in the sense of collapsed new-equipment demand ended by FY25.** The 2026 headwind is macro: fuel prices, rate rises and the Middle East shock, with "higher-value" equipment weakest. That favours sub-A$400 new items and value-seeking Marketplace buyers. It penalises A$500+ items such as cable racks and multi-gyms.
- **Swamped by used / cheap supply:**
  - Spin bikes, including commercial and Peloton units at about A$100.
  - Treadmills and rowers (inferred from the same depreciation pattern; not counted).
  - Walking pads, where the supply is new dealer stock at A$200–254 rather than used units.
- **Still sells new:** matched free-weight sets (dial dumbbells, bumper plates, kettlebells), where buyers value completeness, warranty and condition.
- **The real competitor for a new-goods seller is other importers.** Gumtree already carries "brand new" 24 kg dial pairs from several small importers at A$190–399.

### Gaps
- Facebook Marketplace could not be read (login wall), so there are no listing counts, sold prices or time-to-sell figures by item. Gumtree search snapshots were used as a proxy.
- No Australian Google Trends, ABS category or retailer data was found specifically for walking pads, dumbbells or plates.
- rebel/Super Retail Group does not break out fitness-equipment numbers.

## Which Chinese clusters and named factories make these, and what do they charge FOB at 50–500 unit MOQs?

### Takeaway
On Made-in-China, the listings cluster as follows:
- **Nantong (Jiangsu):** strength gear — dial dumbbells, benches, racks, bumper plates, boxing bags (Vigor, Tengtai, Jingyang, Splendid, Ironman, Get-Fit, Wekeeping, Enerize, Gympro, Ok Sporting).
- **Shandong:** Dezhou/Ningjin for multi-gyms, racks, water rowers and dumbbells (Ranao, Tianzhan, Eagle, Hengqing, Canxu); Rizhao for plates, kettlebells, boxing and rowers (Ape Fitness, F-Leader, Fine Fitness, Shangshuo); Qingdao for dumbbells, kettlebells and rowers (All Universe, Goldroad, Modun).
- **Zhejiang:** walking pads, spin bikes and rowers — Jinhua/Yongkang (Ypoo, Chochi, Aoxu, Zhongteng), Ningbo-port suppliers (Todo, Mingni), and Deqing/Huzhou (Deqing Sister/JDM, who also make benches and power towers).
- **Hebei (Dingzhou):** cast-iron kettlebells and plates.

Typical listed FOB:

| Product | FOB range (USD) | MOQ |
|---|---|---|
| 24 kg dial dumbbell (each) | 42–55 | 20–100 pcs |
| Bumper plates | 1.00–1.50 per kg | 500–1,000 kg |
| Cast-iron kettlebells | 0.90–1.43 per kg | 100–3,000 kg |
| Walking pads | 55–130 | 10–200 |
| Magnetic spin bikes | 51–98 | 50–224 |
| Magnetic rowers | 56–88 | 10–500 |
| FID benches | 43–117 | 20–100 |
| Home power cages | 95–155 | 10–30 |
| Multi-stations | 114–425 | 1–50 |
| Freestanding bags | 35–112 | 10–200 |

Third-party audit IDs are posted for several suppliers: Nantong Vigor and Nantong Jingyang (SGS); Zhejiang Ypoo, Jinhua Zhongteng, Deqing Sister and Rizhao Fine Fitness (TÜV Rheinland); Zhejiang Todo (BV). Many other "Diamond/Audited" sellers self-identify as trading companies.

### Cited Findings
- Full supplier-by-supplier evidence (URL, province, badges, audit IDs, price tiers, MOQ, cartons) is listed under each product in the core-objective section above. Highlights:
  - **Nantong Vigor Sport Goods** (Nantong): SGS audit QIP-ASI264149; est. 2017; 3,362 m²; ISO 9001:2015. Prices: 24 kg dial dumbbell US$43–48.50; FID bench US$109–117; rower US$82–88; 20 kg spin bike US$204.60–224.70 — [MIC](https://vigfit.en.made-in-china.com/product/IYpUytirHScv/China-Adjustable-24kg-52lb-Dumbbell-Set-for-Home-Gym-Workouts.html).
  - **Nantong Jingyang Machinery** (manufacturer): SGS QIP-ASI264243; 22 staff; power rack US$150–155; "about 1 year" exporting — [MIC](https://jy-fitness.en.made-in-china.com/product/PTIrmdFKXWYV/China-Fitness-Equipment-Squat-Rack-Power-Rack-and-Cage-Comprehensive-Fitness-Training-System.html).
  - **Zhejiang Ypoo Health Technology**: TÜV Rheinland MIC-ASR2431394; est. 2012; walking pad US$74.99 at MOQ 100; 690 per 40HQ — [MIC](https://ypoosports.en.made-in-china.com/product/mOwTjiXHZhAG/China-Factory-Wholesale-Smart-Customized-Home-Gym-LED-Screen-Foldable-Walking-Pad.html).
  - **Jinhua Zhongteng Fitness** (Bailongqiao, Wucheng District, Jinhua): TÜV Rheinland MIC-ASI263121; 10 kg-flywheel spin bike US$96–98 — [MIC](https://emmasports.en.made-in-china.com/product/bZKTvgaBAkVJ/China-2025new-Hot-Sell-Magnetic-Spin-Bike-10kg-Flywheel-Big-Size-Magnet.html).
  - **Zhejiang Todo Hardware**: BV MIC-ASR243426; BSCI; Walmart audit; spin bike US$51–52.50 with an MOQ of one 20GP (224 pcs) — [MIC](https://todofit.en.made-in-china.com/product/DFAagouchvWf/China-New-Body-Building-Fitness-Magnetic-Exercise-Spinning-Gym-Home-Spin-Bike.html).
  - **Deqing Sister Sports (JDM)**: founded 2010; TÜV Rheinland MIC-ASR253715. Prices: rower US$83.20–87.20; FID bench US$43–45; pulley station US$121.60–140; power towers US$46–74 — [MIC](https://jdmsports.en.made-in-china.com/product/hFzAgGcXhbtH/China-2025-Fitness-Equipment-Space-Saving-Foldable-Rower-Magnetic-Rowing-Machine.html).
  - **Shandong Tianzhan Fitness Equipment** (Ningjin, Dezhou): manufacturer; ISO 9001/45001/14001; 3-station multi-gym US$329–369 — [MIC](https://dezhoutianzhan.en.made-in-china.com/product/QmMpbezKZqky/China-Ningjin-Popular-Home-Use-Gym-Equipment-Multi-Gym-3-Station.html).
  - **Rizhao Fine Fitness**: TÜV Rheinland audited but only 6 employees; freestanding bag US$35 — [MIC](https://fine-fitness.en.made-in-china.com/product/ZtURpFTAJdrY/China-Free-Standing-Punching-Bag-Punching-Training-Equipment.html).
- MIC category pages used (read directly):
  - [24 kg adjustable dumbbell](https://www.made-in-china.com/products-search/hot-china-products/24kg_Adjustable_Dumbbell.html)
  - [walking pad](https://www.made-in-china.com/products-search/hot-china-products/Walking_Pad.html)
  - [magnetic spin bike](https://www.made-in-china.com/products-search/hot-china-products/Magnetic_Spin_Bike.html)
  - [power rack](https://www.made-in-china.com/products-search/hot-china-products/Power_Rack.html)
  - [adjustable bench](https://www.made-in-china.com/products-search/hot-china-products/Adjustable_Weight_Bench.html)
  - [bumper plate](https://www.made-in-china.com/products-search/hot-china-products/Bumper_Plate.html)
  - [kettlebell](https://www.made-in-china.com/products-search/hot-china-products/Cast_Iron_Kettlebell.html)
  - [freestanding bag](https://www.made-in-china.com/products-search/hot-china-products/Free_Standing_Punching_Bag.html)
  - [multi-station](https://www.made-in-china.com/products-search/hot-china-products/Home_Gym_Multi_Station.html)
  - [water rower](https://www.made-in-china.com/products-search/hot-china-products/Water_Rowing_Machine.html)
  - [home squat rack](https://www.made-in-china.com/products-search/hot-china-products/Home_Squat_Rack.html)
  - [power tower](https://www.made-in-china.com/products-search/hot-china-products/Power_Tower.html)
- An Alibaba seller blog on adjustable dumbbells gives no FOB or factory data; it only cites retail bands (US$150–250 for 5–50 lb sets) and says steel adds 30–50% to manufacturing cost versus cast iron — [Alibaba seller blog 2026](https://seller.alibaba.com/blogs/2026/southeast-asia/fitness-equipment/adjustable-dumbbell-configuration-guide-alibaba-b2b). Alibaba search pages returned no content to the fetcher.

### Inferences
- **Order-size fit:**
  - For 50–500-unit orders, Nantong strength suppliers (MOQ 10–50) and the Zhejiang cardio makers (MOQ 50–100) fit.
  - The cheapest cardio prices (Todo US$52.50 spin bike; F-Orchid US$56 rower) require 224–500 units, i.e. a full container of one SKU.
  - Plate and kettlebell makers quote per kg with 500–3,000 kg MOQs. That is 5–30 100-kg sets, small enough for a first LCL order.
- **Manufacturer vs. trader screening:**
  - Treat as likely manufacturers: suppliers with a named third-party audit ID plus factory area and headcount (Vigor, Jingyang, Ypoo, Todo, Deqing Sister, Tianzhan).
  - Treat as likely traders: firms named "Import & Export", "Trading" or "Commerce" (Hebei Dili, Shandong Dx Grandway, Ningbo Mingni, Dezhou Canxu, Yongkang Aoxu, Rizhao F-Leader, Rizhao Shangshuo).
  - Some audited "factories" are tiny: Rizhao Fine Fitness has 6 staff, and Jingyang exported for only about a year with a mainly domestic market.

### Gaps
- No RFQs were sent, so there are no confirmed prices at exactly 50/100/200/500 units, no AU-plug/RCM-ready walking-pad quotes, and no 40 kg dial-dumbbell price line.
- 1688 domestic prices, Global Sources (one snippet only) and ImportYeti were not checked in this vertical. US bill-of-lading data would be needed to see which factories ship to Bowflex/PowerBlock-type brands.
- Alibaba Verified Manufacturer badges could not be read (Alibaba search returned an empty page).

## Who dominates Amazon AU / eBay AU / Kmart / Rebel / Amart in this category, and at what prices?

### Takeaway
**Who holds the online floor:** the cheap end belongs to Australian importer brands sold across several marketplaces at once. These are:
- Everfit — wholesaled through Dropshipzone and seen on Amazon AU, Kmart Marketplace, Bunnings Marketplace, Harvey Norman online, JB Hi-Fi and Woolworths.
- Fitness Master, Powertrain (Klika Group), Centra (Sello Products), Advwin, FitnessLAB and LSG.
- On Amazon only: CANPA, VEVOR, HCE, BRIXX, Proflex and Yes4All/Amazon Basics.
- Kogan's own Fortis line, and Kmart's own Anko basics.

Lifespan Fitness and its CORTEX strength sub-brand sit higher.

**Typical prices:**

| Product | Typical price (A$) |
|---|---|
| 2×24 kg dial dumbbells | 249–299 (Kogan Fortis 259) |
| 2×40 kg dial dumbbells | 449–499 |
| Walking pads | 169–214 |
| Spin bikes | 159–199 |
| Magnetic rowers | 253–320 |
| FID benches | 96–100 |
| Power cages | 216–241 |
| Cable racks | 599–700 |
| Multi-gyms | 430–840 |
| 100 kg bumper sets | 400 |

### Cited Findings
- **Lifespan Fitness**: its brand family includes "CORTEX, delivering high-quality, affordable strength gear, and Regen8, introducing advanced recovery equipment" — [Lifespan Fitness](https://www.lifespanfitness.com.au/pages/about-us) (search snapshot). Amazon AU price points: Lifespan SM-120 spin bike A$429 (RRP A$549); CORTEX Revolock V2 48 kg A$499; CORTEX GS7 multi-station A$2,016.54 (search snapshots; see the product sections).
- **Everfit**:
  - Wholesaled on Dropshipzone's sports & fitness catalogue (e.g. an Everfit walking pad) — [Dropshipzone](https://resources.dropshipzone.com.au/sports-fitness.html?cat=1416) (search snapshot). Brand ownership was not confirmed.
  - Seen at Harvey Norman (A$87/A$110), Bunnings marketplace (A$107), Kmart marketplace (A$114.90 for 40 kg sets; A$259.95 for the 2×24 kg dial pair; A$52.95 for a 16 kg kettlebell), JB Hi-Fi and Woolworths — [Harvey Norman](https://www.harveynorman.com.au/everfit-weight-adjustable-dumbbell-set-40kg.html), [JB Hi-Fi](https://www.jbhifi.com.au/products/everfit-40kg-adjustable-dumbbells-set-kettle-bell-weight-plates-barbells-gym), [Woolworths](https://www.woolworths.com.au/shop/productdetails/1123824995/everfit-40kg-adjustable-dumbbell-barbell-set-weight-plates-home-workout) (search snapshots).
  - Amazon AU prices: spin bikes A$174.27–198.95, rowers A$285.95–319.95, 2×24 kg dial pair A$262.95.
- **Kmart**:
  - Own-brand Anko Electric Treadmill A$279 (was A$399).
  - Kmart "Spin Bike" A$159 clearance (A$249 regular).
  - 12 kg kettlebell A$29 clearance (A$39); Anko Adjustable Weight Kettlebell Set A$29.
  - Third-party Marketplace sellers fill the rest: Everfit (Aisle Six), Centra (Sello Products), Powertrain (Klika Group; 24 kg dumbbell A$595, air rower A$699), Fitness Master (Salesbay), Advwin and Costway.
  - Kmart's free delivery over A$65 excludes Marketplace-seller items.
  - Links: [Kmart treadmill](https://www.kmart.com.au/product/electric-treadmill-43547005/), [Kmart spin bike](https://www.kmart.com.au/product/spin-bike-43527007), [Kmart kettlebell](https://www.kmart.com.au/product/kettle-bell---12kg/2666324) (search snapshots).
- **Kogan Fortis**: walking pad A$204/A$214 (SRP A$389.99; other snapshots A$169–209); walking pad with incline A$189/A$199; 2×24 kg dial dumbbells A$259 (Kogan First) — [Kogan](https://www.kogan.com/au/buy/fortis-foldable-walking-pad-treadmill-fortis-b/) (search snapshot).
- **Amazon AU, other recurring sellers** (prices as snapshotted in the product sections):
  - Fitness Master, LSG, ADVWIN, FitnessLAB, CANPA, VEVOR.
  - HCE (cable rack A$599 + A$44.99 delivery), BRIXX (100 kg bumpers A$400).
  - Centra, Proflex, Yes4All, Amazon Basics, PROIRON (neoprene kettlebells from A$45.99), JOROTO, Merach, FINEX and Ouroad.
- **Other channels:** Bunnings LSG Steps walking pad A$189 — [BuyWisely](https://buywisely.com.au/au/product/lsg-steps-walking-pad-under-desk-treadmill); eBay AU, a Brisbane seller's new Advwin 3-in-1 walking pad A$409.95 + A$10 postage (older snapshot) — [PriceMe/eBay summary](https://www.priceme.com.au/Advwin-Walking-Pad-Treadmill-Home-Treadmill/p-919599439.aspx) (search snapshot).

### Inferences
- **The floor is set by container-scale importers**, so there is no "brand premium" for a Marketplace importer to undercut except where the floor product is heavy and delivery-priced (plates, 40 kg dial pairs, racks), or where the AU floor is thin (2×40 kg dial pairs at A$449.99+).
- **Kmart's own label sets a hard ceiling** on kettlebells (≈A$3.25/kg regular) and cheap cardio (A$159–279).
- **Kogan's Fortis pricing (A$169–214) makes walking pads a parity market.**

### Gaps
- rebel's in-store/online fitness-equipment prices were not captured, and no 2025–26 Bowflex AU pricing or distribution data was found.
- **Amart Sports**: not researched. I believe the stores were converted to rebel years ago (unverified), so it is likely not a current channel.
- Temu AU prices could not be retrieved, and no Big W or current Aldi Special Buys fitness prices were found.
- Market shares by brand are unavailable; the above is inferred from listing presence only.

## How does the freight weight/measure rule (LCL revenue tonne = 1 CBM or 1,000 kg, whichever is greater) and 20ft payload limits change landed cost for dumbbells/plates? Quantify.

### Takeaway
The weight rule only bites hard on genuinely dense iron.

**LCL:**
- Cast-iron plates (≈2,550 kg/CBM shipped) are billed per tonne at ≈2.5× what their volume would cost.
- Bumper plates (≈1,030 kg/CBM) and kettlebells (≈1,070 kg/CBM) are ≈1.03–1.07×.
- Dial dumbbells (≈870 kg/CBM) are billed on volume.

**FCL:** the binding constraint is the road/container cargo limit (21.8–24.3 t for a 20GP depending on state). A 20GP of plates or dumbbells "fills" at ≈21–25 t, using only ≈8 CBM (cast iron) to ≈21–25 CBM (bumpers, dial dumbbells) of ≈28 usable CBM.
- Base cost is ≈A$0.25–0.27 per kg all-in (≈A$25–28 per 100 kg set; ≈A$24 per 2×40 kg pair; ≈A$15 per 2×24 kg pair), i.e. 9–12% of landed cost.
- A 40ft is the wrong box for iron: Australian cargo limits for 40GP/40HC (20.0–22.8 t) are no higher than a 20GP, so the cost per kg nearly doubles (≈A$0.43–0.49/kg).

### Cited Findings
- **ICE Cargo state limits** ("general guide only"):

  | Container | NSW | VIC | QLD/SA/WA/TAS |
  |---|---|---|---|
  | 20ft GP cargo max | 24.3 t | 23.8 t | 21.8 t |
  | 40ft GP cargo max | 22.8 t | 22.3 t | 20.3 t |
  | 40ft HC cargo max | 22.5 t | 22.0 t | 20.0 t |
  | Max gross incl. container | 26.5 t | 26 t | 24 t |

  A 6-axle semi-trailer is limited to 42.5 t total, and loads must be evenly distributed. The Tasmanian 40ft figures on the page look erroneous. Source: [ICE Cargo](https://icecargo.com.au/transport-options/) (read directly).
- **LCL billing:** LCL minimum and billing are "1 cbm or 1,000 kg, whichever is greater" (undated price list cited in the parallel landed-cost notes) — [australiatrade.com.au](https://australiatrade.com.au/shipping/price/imports/index.html).
- **2026 ocean rates:**
  - 20GP USD 2,205–2,695 and 40GP USD 4,320–5,280 (Oct 2026) — [Sino-Shipping](https://www.sino-shipping.com/country-guides/freight-from-China-to-australia/).
  - 40HQ USD 4,100–4,600 (29 Jun 2026) — [KLN](https://info.oceania.kln.com/customer-advisory/fcl-shipping-rates-from-china-to-australia-july-2026-outlook).
  - LCL USD 50–150/cbm — [Welltrans](https://welltrans-logistics.com/?p=3741) (search snapshot) — and USD 60–280/cbm — [ExFreight](https://www.exfreight.com/shipping-from-china-to-australia/) (search snapshot).
- **Listed container loads:**
  - Walking pad: 690 per 40HQ (Ypoo).
  - Magnetic rower: 200 per 20GP and 480 per 40HQ (Deqing Sister).
  - Spin bike: 224 per 20GP and 544 per 40HQ (Todo).
  - Sources: [Ypoo](https://ypoosports.en.made-in-china.com/product/mOwTjiXHZhAG/China-Factory-Wholesale-Smart-Customized-Home-Gym-LED-Screen-Foldable-Walking-Pad.html), [Deqing Sister](https://jdmsports.en.made-in-china.com/product/hFzAgGcXhbtH/China-2025-Fitness-Equipment-Space-Saving-Foldable-Rower-Magnetic-Rowing-Machine.html), [Todo](https://todofit.en.made-in-china.com/product/DFAagouchvWf/China-New-Body-Building-Fitness-Magnetic-Exercise-Spinning-Gym-Home-Spin-Bike.html).

### Inferences
These use the base freight assumptions from the core section: 20GP all-in A$5,964; 40HQ all-in ≈A$9,695 (USD 4,500 + A$3,200 destination, an assumption); LCL A$244/RT + A$900 per shipment.

**Per-kg freight by box:**

| Box | All-in cost per kg | Load basis |
|---|---|---|
| 20GP | A$0.274 | 21.8 t (QLD/SA/WA) |
| 20GP | A$0.251 | 23.8 t (VIC) |
| 20GP | A$0.245 | 24.3 t (NSW) |
| 40HQ | A$0.43–0.49 | 20.0–22.5 t, about 1.75× the 20GP per kg |

**LCL variable charge per unit:**

| Item | Shipped density | Billed basis | Charge | Volume-only charge | Uplift |
|---|---|---|---|---|---|
| 100 kg cast-iron plate set (0.04 CBM, 102 kg) | ≈2,550 kg/CBM | 0.102 RT (weight) | A$24.92 | A$9.77 | ×2.55 |
| 100 kg bumper set (0.10 CBM, 103 kg) | ≈1,030 kg/CBM | 0.103 RT | A$25.17 | — | ×1.03 |
| 2×24 kg dial pair (0.06 CBM, 52 kg) | ≈870 kg/CBM | 0.06 RT (volume) | A$14.66 | — | ×1.00 |
| Walking pad | ≈260 kg/CBM | volume | — | — | none |

**20GP capacity at 21.8 t (vs ≈28 usable CBM):**

| Item | Units by weight | Units by volume | CBM used | Binding limit |
|---|---|---|---|---|
| 100 kg cast-iron sets | 213 | 700 | ≈8.5 (≈70% of the box empty) | weight |
| 100 kg bumper sets | 211 | 280 | ≈21 | weight |
| 2×24 kg dial pairs | 419 | 466 | — | weight (both limits close) |
| Walking pads | 854 | 284 | — | volume |

**Freight as a share of landed cost (base case):**

| Item | 20GP | LCL |
|---|---|---|
| 100 kg bumper set | A$28.40 (12%) | A$43.17 (17%, 50 sets) |
| 2×40 kg dial pair | A$24.34 (9%) | A$42.43 (14%, 50 pairs) |
| 2×24 kg dial pair | A$14.91 (10%) | A$23.66 (14%, 100 pairs) |

**Practical rules:**
- Ship iron in 20GPs, not 40s.
- Mix dense iron with a bulky light SKU only if the light SKU is itself profitable (none in this category is).
- Fill to the destination state's limit: NSW/VIC allow ≈2–2.5 t more cargo than QLD/WA, i.e. ≈8–10% lower freight per kg.
- Overweight boxes trigger road permits or transloading.
- For Marketplace resale, the same weight is an advantage: buyers collect, while online rivals pay courier freight on 50–100 kg parcels. HCE charges A$44.99 delivery on a cable rack, and some Amazon steel listings add ≈A$50–130 (search snapshot, see product 4).

### Gaps
- Carton CBM and weight per 100 kg bumper set, cast-iron set and 40 kg dial pair are assumptions.
- No 2026 per-W/M Australian CFS tariff was found.
- Whether specific carriers impose overweight surcharges on 20GPs above ≈18–20 t on the China–Australia lane was not checked.

## Are walking pads/treadmills in scope for EESS/RCM? Do any Anti-Dumping Commission measures on Chinese steel products apply?

### Takeaway
**Walking pads.**
- They are mains-powered household equipment, so they are **in-scope electrical equipment** under the EESS.
- The EESS risk-level schedule (v4.2, aligned to AS/NZS 4417.2:2020) lists no treadmill or exercise-equipment class, so they default to **Level 1**. That still requires:
  - an Australian Responsible Supplier registered on the EESS database (A$231.91/yr from 1 Jul 2025);
  - RCM marking;
  - English-language evidence that the product meets the relevant standard (kept 5 years);
  - EMC compliance under the same RCM scheme.
- Walking-pad remotes that use coin cells also trigger the **ACCC mandatory button/coin battery standards** (in force since 22 Jun 2022).
- Spin bikes and rowers with battery consoles are outside EESS (under 50 V) but the same battery rule applies if they use coin cells.

**Anti-dumping.**
- The 2026 Dumping Commodity Register lists Chinese **steel inputs** — rebar, hot-rolled coil, certain flat-rolled steel, corner beads/angles, welded mesh, precision pipe and tube.
- No measure covers finished fitness equipment (tariff 9506.91), so no anti-dumping duty is expected on dumbbells, plates, racks or benches. Importers must still self-assess.

### Cited Findings
- **EESS scope and levels:**
  - In-scope equipment is rated above 50 V AC RMS (or 120 V ripple-free DC) and below 1,000 V AC RMS, and is "designed or marketed as suitable for household, personal or similar use".
  - Level 1 equipment must "be electrically safe and meet the relevant standard", "be marked with the Regulatory Compliance Mark (RCM)", "have documentary evidence in English, to show that the item meets the relevant standard", and "be linked to the registered responsible supplier"; evidence is kept for 5 years.
  - Level 2 adds equipment registration and a compliance folder; Level 3 adds a certificate of conformity.
  - The equipment-class list (air conditioners … massage appliance … power supply or charger … water heater) contains no treadmill or exercise class.
  - Where wording differs, "the current latest published AS/NZS 4417.2 wording overrides".
  - Source: [EESS In-scope equipment definitions and risk levels v4.2 (PDF)](https://www.eess.gov.au/wp-content/uploads/2023/02/EESS-Inscope-Equipment-Definitions-and-Risk-Levels-v4.2-.pdf) (read directly; text-searched for "treadmill", "exercise", "fitness" — none found).
- **Level 1 page:** Level 1 equipment "can only be offered for sale by a Responsible Supplier registered in the EESS Registration Database"; product listing is voluntary — [EESS Level 1](https://www.eess.gov.au/registration/registration-in-scope-electrical-equipment/level-1/) (search snapshot).
- **Who can register:** the Responsible Supplier must be an AU/NZ entity with an ABN (or NZ IRD number); overseas companies and "agents" cannot register — [EESS Responsible Supplier](https://www.eess.gov.au/registration/registration-responsible-supplier/) (search snapshot).
- **Fees from 1 July 2025:** Responsible Supplier A$231.91/yr; Level 2/3 equipment registration A$86.91 (1 yr), A$173.83 (2 yr), A$434.56 (5 yr) — [EESS fees](https://www.eess.gov.au/registration/registration-fees/) (search snapshot).
- **2026 amendment:** AS/NZS 4417.2:2020 Amendment 1:2026, published 12 Feb 2026, adds five categories to the Level 2/3 list with a 12-month transition. The excerpt seen named EV charging equipment, battery storage and portable power supplies, not treadmills; the full list was not seen — [JJR Lab](https://www.jjrlab.com/news/as-nzs-4417-2-2020-amd-1-2026-australia-and-new-zealand.html) (search snapshot).
- **Certification cost reference (dated):** a 2017 certifier offer to certify safety and EMC for an inclusive A$865 — [SAA Approvals newsletter 2017](https://www.saaapprovals.com.au/newsletter-1-2017/) (search snapshot).
- **Supplier certifications:** the Ypoo walking pad lists CE/RoHS/GS/EN957/CCC but not SAA/RCM — [MIC](https://ypoosports.en.made-in-china.com/product/mOwTjiXHZhAG/China-Factory-Wholesale-Smart-Customized-Home-Gym-LED-Screen-Foldable-Walking-Pad.html). Zhejiang Todo lists SAA among company certifications — [MIC](https://todofit.en.made-in-china.com/product/DFAagouchvWf/China-New-Body-Building-Fitness-Magnetic-Exercise-Spinning-Gym-Home-Spin-Bike.html).
- **Button/coin batteries:**
  - The ACCC mandatory standards apply to products and accessories containing button/coin batteries "such as remote controls", for new and second-hand items supplied from 22 June 2022 (one-off private consumer sales excepted).
  - They require secure battery compartments, warnings and compliance testing — [ACCC Product Safety](https://www.productsafety.gov.au/business/search-mandatory-standards/button-and-coin-batteries-mandatory-standards/products-containing-button-and-coin-batteries-mandatory-safety-standard) (search snapshot).
  - Penalties were cited in 2021 as up to A$10m for businesses — [Clayton Utz](https://www.claytonutz.com/insights/2021/july/countdown-continues-until-strict-button-battery-standards-become-mandatory) (search snapshot; current maxima not re-checked).
- **ACCC walking-pad recalls:** none found on productsafety.gov.au in search results (only mobility and baby-walker recalls appeared) — [productsafety.gov.au search](https://www.productsafety.gov.au/node/18027) (search snapshot).
- **ADC Dumping Commodity Register, China entries (2026):**
  - Steel reinforcing bar: IDD 13 Apr 2026 → 13 Apr 2031 — [DCR rebar](https://www.industry.gov.au/sites/default/files/adc/measures/2026-09/dcr-steel-reinforcing-bar.pdf).
  - Hot-rolled coil (incl. alloy/patterns in relief): IDD/ICD from 4–5 May 2026 → 2031 — [DCR HRC](https://www.industry.gov.au/sites/default/files/adc/measures/2026-06/hot-rolled-coil-steel-alloy-and-patterns-in-relief.pdf).
  - Certain flat rolled steel products: DSA/CSA 24 Jun 2026 — [DCR flat rolled](https://www.industry.gov.au/sites/default/files/adc/measures/2026-07/dcr-certain-flat-rolled-steel-products.pdf).
  - Steel corner beads and angles: IDD/ICD 4 May 2026 → 2031 — [DCR corner beads](https://www.industry.gov.au/sites/default/files/adc/measures/2026-09/dcr-steel-corner-beads-angles.pdf).
  - Certain welded steel mesh sheets: DSA 8 Aug 2026 — [DCR mesh](https://www.industry.gov.au/sites/default/files/adc/measures/2026-09/dcr-certain-welded-steel-mesh-sheets.pdf).
  - Precision pipe and tube — [DCR PPT](https://www.industry.gov.au/sites/default/files/adc/measures/2025-04/dcr_-_precision_pipe_and_tube_steel.docx).
  - All via search snapshots. The register says the Commission does not advise whether particular goods are covered, so importers self-assess. Some 2026 files reportedly use the name "Australian Trade Remedies Commission" (not verified).
- **Tariff:** 9506.91.00 is shown at 5% general / Free under ChAFTA with origin evidence — [Treayo](https://treayo.com/en/hs/australia/95069990) (search snapshot; official Schedule 3 page returned 403).

### Inferences
- **Walking-pad compliance cost:**
  - Budget is A$1,500–8,000 per model (base A$4,000; an assumption — the only price found is the dated A$865 bundle) to obtain or verify a test report to AS/NZS 60335.1 plus the applicable Part 2 and EMC, and to RCM-label it.
  - Add A$231.91/yr Responsible Supplier registration and 3–8 weeks lead time (assumption).
  - Coin-cell remote: either fund compliance testing and secure, screw-fastened compartments with warnings (≈A$1,000–2,500, assumption), or specify an AAA-powered remote. AAA cells are not button/coin cells — an inference to confirm against the standard's definition.
  - No lithium battery, so no dangerous-goods shipping for mains walking pads. App/Bluetooth models also need ACMA radiocommunications compliance under the same RCM regime.
- **Other SKUs:** spin bikes and rowers need only a check that consoles use AA/AAA, not CR2032. Free weights, racks, benches and bags have no mandatory Australian standard identified. Wooden water rowers may draw DAFF timber scrutiny (covered by the landed-cost researcher).
- **Anti-dumping:** no anti-dumping or countervailing duty is expected on finished 9506.91 fitness goods. The risk would only arise if someone imported loose steel tube or plate as raw stock, or if the ADC extended a measure to downstream goods (no evidence of that).

### Gaps
- Could not read the full AS/NZS 4417.2 Amendment 1:2026 category list (paid standard), so whether treadmills moved to Level 2/3 in 2026 is unconfirmed.
- The exact AS/NZS 60335 Part 2 applicable to motorised walking pads was not established.
- No 2026 Australian lab quote for walking-pad RCM testing was found.
- The ABF Schedule 3 rate for 9506.91.00 was not read on the official page. It is also unknown whether 9506 lines were among the 457 "nuisance" tariffs abolished on 1 July 2024; if so the general rate would be Free, which matters only for the no-CoO sensitivity.
