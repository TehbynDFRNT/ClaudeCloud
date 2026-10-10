# High-ratio product screen for a teen-run Facebook Marketplace import side business (Australia, 2026-10-10)

*Researched 2026-10-10. All A$ figures use the shared cost base in Q0 (importer not GST-registered). Prices are listing prices or search snippets, not quotes; estimates are labelled.*

## Q0. Method, cost base and access limits (read first)

### Takeaway
On the shared cost base, the A$1,300 of fixed cost per order (A$900 LCL fixed + A$400 inspection) plus A$5 handling makes "landed at A$10–30" arithmetically impossible at 50 units and confines it to tiny, cheap goods at 100–200 units (FOB about US$2–10 in a carton of 0.03 CBM or less). Amazon AU's robots.txt now disallows Claude-User, so no new Amazon pages were fetched this session; Amazon floors come from pages cached by sibling sessions on 2026-10-09/10 and from search snippets.

### Cited Findings
- Shared cost base used for every number below (from the brief): FX US$1 = A$1.4376; LCL A$244 per W/M (greater of CBM or tonnes) door-delivered + A$900 fixed per shipment; duty 0% with a ChAFTA Certificate of Origin; importer NOT GST-registered, so 10% import GST is a cost and revenue is the full sale price; inspection A$400 per order; 3% defect allowance; A$5 handling per unit. Marketplace local-pickup fee 0% — [Marketplace import arbitrage calculator / earlier report](/home/user/ClaudeCloud/reports/Marketplace import arbitrage Australia.md).
- Import GST base convention: 10% × (FOB in A$ + 60% of door-delivered freight), the share the earlier calculator treats as international transport and insurance; the defect allowance is applied to FOB + freight + inspection + GST. The earlier calculator's "Assumptions" sheet documents the 60% share — [calculator](/home/user/ClaudeCloud/reports/Marketplace import arbitrage calculator.xlsx).
- Re-check of the benchmark: the double hammock with stand (US$20–21 FOB, 0.061 CBM, 200 units LCL) gives A$28.58 per unit GST-registered at A$95 in the earlier workbook; converting to the non-registered base (+A$8.64 revenue, −about A$4.1 import GST, i.e. 10% × (A$29.47 FOB + 60% × A$19.44 freight)) reproduces the brief's "~A$33–37 net" at A$95–99 (this note's model: A$33.32 and A$37.32) — [calculator Read-me reconciliation row 14](/home/user/ClaudeCloud/reports/Marketplace import arbitrage calculator.xlsx).
- Amazon.com.au robots.txt (fetched 2026-10-10) contains "User-agent: Claude-User / Disallow: /" (also ClaudeBot, Claude-SearchBot, Claude-Web) while the `*` group allows /dp/, /s?k= and /gp/bestsellers — [amazon.com.au/robots.txt](https://www.amazon.com.au/robots.txt).
- ImportGenius now returns HTTP 403 (origin, empty body, "retry-after: 0") for robots.txt and supplier pages, so the free US customs pages used in the real-factories round were not available this session; Panjiva's robots.txt returned 200 — [importgenius.com/robots.txt](https://www.importgenius.com/robots.txt); [panjiva.com/robots.txt](https://panjiva.com/robots.txt).
- Made-in-China.com allows Claude-User on /products-search/ and on supplier subdomains' /product/ and /company-*.html pages — [made-in-china.com/robots.txt](https://www.made-in-china.com/robots.txt); [supplier subdomain robots.txt](https://lounger2.en.made-in-china.com/robots.txt).
- Kmart.com.au's robots.txt allows product pages, but earlier sessions got 403 "Access Denied"; Bunnings and Gumtree return 403 to scripts; Facebook Marketplace needs a login — [Air purifier note, access line](/home/user/ClaudeCloud/research_notes/Air purifier import check/air_purifier_unit_economics.md).

### Inferences
- Max FOB that still lands at ≤A$30 on the shared base (my calculation, `lc.py`): at **50 units nothing can** (fixed A$26/unit + A$5 handling = A$31 before any goods); at **100 units** FOB ≤ US$5.97 at 0.005 CBM, US$3.52 at 0.02 CBM, US$1.88 at 0.03 CBM; at **200 units** FOB ≤ US$10.25 at 0.005 CBM, US$7.80 at 0.02 CBM, US$6.16 at 0.03 CBM, US$2.89 at 0.05 CBM; nothing at 0.08 CBM or more.
- So the screen "lands ≤ A$30 and sells new at A$60–120" requires a retail-to-FOB ratio of roughly 6–15×. That ratio exists mainly where (a) a product is large at retail but packs small, or (b) Amazon AU's comparable is branded and Kmart/Temu have no equivalent. Both conditions are tested product by product below.
- Because no new Amazon pages could be fetched, every Amazon floor below is either a cached page (dated 2026-10-09 or 2026-10-10, "offers from" price, delivery fee not shown on Best Sellers pages) or a search-engine snippet (undated). The user should re-check each floor in a browser before ordering.

### Gaps
- Live Amazon delivery fees for the floors were not observable (Best Sellers pages omit them); where a cached /dp/ page exists it is used.
- No freight quote was obtained; all freight is the shared base.

## Q1. Does anything pass the strict screen (landed ≤ ~A$30 on a 50–200-unit first order, sold new at A$60–120, ≥10% under the cheapest comparable new item on Amazon AU, and not above Kmart/Aldi/Bunnings/Big W/Temu/importer brands)?

### Takeaway
No. None of the roughly 40 ideas tested passes every gate. The closest is the **orthopaedic bolster dog bed**, which shows the trap exactly. Trader-listed L/XL beds land at about A$32–40 (stated or estimated vacuum cartons), but Amazon's A$56.99 XL bed caps them at A$51 or less. The XXL size that can sell at A$69, under Kmart's A$79 equivalent, lands at about A$47–63, depending on a size price no supplier publishes. Everything else fails one of three ways. The walk-in or importer floor sits below A$60 (Kmart/Anko A$12–59 on most small goods). The landed cost is A$45–85 because of carton size or FOB. Or the item carries a safety or regulatory load. The user's own example has already failed: the air-purifier check found no US$10 unit matching the A$150 Amazon unit, and a cheap-unit Amazon floor of A$63–90 ([air purifier note](/home/user/ClaudeCloud/research_notes/Air purifier import check/air_purifier_unit_economics.md)).

### Cited Findings
**Elimination table.** Floors are from Kmart/Bunnings search snippets (searched 2026-10-10, pages undated) unless a cached Amazon Best Sellers page (fetched by sibling sessions 2026-10-09, "offers from" price, delivery not shown) is named. Landed costs use the Q0 base.

| Candidate | Cheapest comparable new item found (walk-in / importer) | Amazon AU reference | Gate failed |
|---|---|---|---|
| Folding camp / beach chair | Costway director's chair with side table A$56.95–66.95 on Kmart Marketplace ([Kmart](https://www.kmart.com.au/product/costway-folding-camping-chair-portable-directors-chair-hiking-chair-wside-table-multi-110190330/)) | Coleman Quad Deluxe A$29.90; OZtrail Classic arm chair A$25.99; Overmont 2-pack oversized director's chairs A$137.99 ([BS Camping Furniture, 2026-10-09](https://www.amazon.com.au/gp/bestsellers/sporting-goods/5044127051)) | Price: walk-in floor ≤A$57; folded director's chairs are bulky |
| Pop-up beach tent / shelter | Kmart pop-up beach tents not priced this session | 2–3-person pop-up A$42.90; Mountview 4-person A$30.00 ([BS Camping Tents](https://www.amazon.com.au/gp/bestsellers/sporting-goods/5044142051)) | Price below A$60 |
| Beach cabana 2×2 m | Kmart own-brand cabanas: a 2×2 m, 195 cm "Blue Stripe" model reported at A$49 (search summary; listing URL not confirmed; BHG also reports a A$49 Kmart cabana), and Natural Stripe and Vivid Botanicals at A$69 ([BHG](https://www.bhg.com.au/kmart-beach-cabana-is-this-summers-beach-essential); [Kmart](https://www.kmart.com.au/product/beach-cabana-natural-stripe-43564286); [Kmart](https://www.kmart.com.au/product/beach-cabana-vivid-botanicals-43564316)) | Komodo A$85.00; Costway A$98.95; SUNSPOT A$89.99 ([BS Camping Shelters](https://www.amazon.com.au/gp/bestsellers/sporting-goods/5044128051)) | Price: Kmart A$49 vs about A$46 landed (MOQ 500, Shaoxing Unique Umbrella US$20.18–35.68, [MIC](https://www.made-in-china.com/products-search/hot-china-products/Beach_Cabana.html)) |
| Double hammock + steel stand | Crazy Sales A$84.95–89.95 for weeks in mid-2026; Harvey Norman online A$90; Costway direct A$105.95 ([earlier report](/home/user/ClaudeCloud/reports/Marketplace import arbitrage Australia.md); [Harvey Norman](https://www.harveynorman.com.au/portable-double-hammock-with-steel-stand-carry-bag-maximum-load-200kg.html)) | A$129.99, #13 Camping Furniture ([BS](https://www.amazon.com.au/gp/bestsellers/sporting-goods/5044127051)) | Landed A$61.68 (benchmark; see Q4) |
| Large dog bed, elevated cot | Kmart Pet Bed Elevated Large A$29; PaWz XL A$70.99 and Paws & Claws A$45.90 on Kmart Marketplace ([Kmart](https://www.kmart.com.au/product/pawz-elevated-pet-bed-extra-large-black-110005135/)) | — | Price: Kmart A$29 |
| Orthopaedic dog bed, flat XL mat | Kmart Pet Mattress Orthopaedic XL A$29 (10 cm foam) ([Kmart](https://www.kmart.com.au/product/pet-mattress-orthopaedic-extra-large-grey-43512089/)) | PaWz XL egg-foam A$41.00 (search summary) ([Amazon AU search](https://www.amazon.com.au/xxl-orthopedic-dog-bed/s?k=xxl+orthopedic+dog+bed)); BFPETHOME XL A$56.99 ([Amazon AU](https://www.amazon.com.au/BFPETHOME-Orthopedic-Waterproof-Removable-Multi-Needle/dp/B0F1CYL7X9)) | Price below A$60 |
| **Orthopaedic bolster bed, XXL** | Kmart Orthopaedic High Side XL (120×80 cm) **A$79**, excluded from free delivery ([Kmart](https://www.kmart.com.au/product/pet-bed-orthopaedic-high-side-extra-large-43552436/)) | TUXOIUBA bolster bed: XL A$59.99 and XXL A$89.99 (the size-to-price mapping comes from a search summary); Petzly XX-Large A$99.95 ([Amazon AU](https://www.amazon.com.au/TUXOIUBA-Orthopedic-Dog-Egg-Crate-Removable/dp/B0D2GSNMNX); [Amazon AU](https://www.amazon.com.au/Petzly-Orthopedic-Removable-Washable-Egg-Crate/dp/B0D7HQXY4Z)) | **Closest near-miss:** L/XL lands at about A$32–40 but must sell at ≤A$51. XXL (112×86 cm) lands at about A$47–63 (Q4) against a A$69 price |
| 42–48" wire dog crate | i.Pet 48" A$94.46 on Bunnings Marketplace ([earlier verify note](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/verify_gym_pets.md)) | i.Pet 48" A$104.95 ([BS Basic Dog Crates](https://www.amazon.com.au/gp/bestsellers/pet-supplies/5848310051)) | Landed A$56–84 (benchmark; see Q4) |
| 8-panel 80 cm playpen | Topet 8-panel A$79 on Bunnings Marketplace ([Bunnings](https://www.bunnings.com.au/topet-pet-dog-playpen-enclosure-8-panel-puppy-exercise-cage-cat-rabbit-play-pen_p0448512)); Pawz 8-panel A$82.99 on Kmart Marketplace ([Kmart](https://www.kmart.com.au/product/pawz-dog-playpen-8-panel-metal-dog-pen-tool-free-foldable-puppy-crate-black-110229915/)) | 80 cm 8-panel A$114.99; i.Pet 40" A$129.95 ([BS Dog Crates, Houses & Pens](https://www.amazon.com.au/gp/bestsellers/pet-supplies/5581907051)) | Landed about A$63 against a A$75–79 ceiling |
| Cat tree 120–150 cm | Kmart wooden cat tower 151 cm A$71 ([earlier pets note](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/vertical_pets_garden.md)) | Heybly 110 cm A$54.99, 125 cm A$59.99; PAWZ Road 136 cm A$89.99 ([BS Cat Trees](https://www.amazon.com.au/gp/bestsellers/pet-supplies/5848100051)) | Price and cube: about A$85 landed at an estimated 0.12 CBM |
| Clothes airer / drying rack | Artiss 173 cm airer A$33.95 on Kmart Marketplace ([Kmart](https://www.kmart.com.au/product/artiss-clothes-drying-rack-173cm-coat-airer-hanger-foldable-grey-110002162)) | — | Price below A$60 |
| Shoe rack / cabinet | Kmart racks A$15–39 (10-tier A$29) ([Kmart](https://www.kmart.com.au/product/10-tier-metal-shoe-rack-43632541)); IKEA BISSA A$70 ([earlier furniture note](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/vertical_furniture_office.md)) | Artiss flip-drawer cabinet A$96.95 (earlier note) | Price below A$60 |
| Bathroom / laundry trolley | Kmart 3-tier trolley A$35; large A$52; plastic A$12 ([Kmart](https://www.kmart.com.au/product/3-tier-trolley-42979692)) | Simple Houseware 3-tier A$59.97 ([BS Home Office Furniture](https://www.amazon.com.au/gp/bestsellers/home/4975233051)) | Price below A$60 |
| Garage shelving | Bunnings NZ Pinnacle 5-tier NZ$109–119 (AU price not found) ([Bunnings NZ](https://www.bunnings.co.nz/pinnacle-1830-x-1200-x-410mm-5-tier-shelving-unit_p0853496)) | — | Weight and cube: a 15–25 kg flat-pack would land well above A$30 (inference; not costed) |
| Foldable wagon / garden cart | Kmart Foldable Utility Trolley A$59; beach trolley A$45 on clearance ([Kmart](https://www.kmart.com.au/product/foldable-utility-trolley-43622832/)) | — | Price at or below A$59 |
| Raised garden bed (small) | Bunnings small steel beds A$28–59 ([earlier pets note](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/vertical_pets_garden.md)); Organic Garden Co 100×50×41 cm A$79 ([Bunnings](https://www.bunnings.com.au/the-organic-garden-co-100-x-50-x-41cm-monument-raised-garden-bed_p0817965)) | not found | Small sizes fail on price; the large size is tested in Q4 |
| Outdoor storage / deck box | Gardeon 290 L A$79.95 (earlier) | — | Modelled at −A$51 per unit ([earlier outdoor note](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/vertical_outdoor_living.md)) |
| Foam rollers, yoga mats, resistance bands, pull-up bars | — | Bands A$15.99; yoga mat A$34.99 ([BS Exercise & Fitness](https://www.amazon.com.au/gp/bestsellers/sporting-goods/5043942051)) | Price below A$60 |
| Weighted vest 20 kg | Kmart Anko 9–18 kg adjustable vest A$59; Kmart 9 kg A$35 ([Kmart](https://www.kmart.com.au/product/9-18kg-adjustable-weighted-vest-43723041/)) | PROIRON 20 kg A$52.49–79.99; JILIMI 20 kg A$37.58 (search summary) ([Amazon AU search](https://www.amazon.com.au/weighted-vest-20kg/s?k=weighted+vest+20kg)) | Price: about A$49 landed (21 kg item) vs a ≤A$47–59 ceiling |
| Kids balance bike | Kmart Baby Balance Bike A$30; 5-in-1 A$59 on clearance ([Kmart](https://www.kmart.com.au/product/5-in-1-balance-bike-43419357/)) | 14" balance bike A$82.99 ([BS Kids' Bikes](https://www.amazon.com.au/gp/bestsellers/sporting-goods/5044187051)) | Price; the toy standard applies if marketed under 36 months ([earlier kids note](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/vertical_kids_toys.md)) |
| Kids ride-on / kick scooter | Anko scooters A$20–39 (earlier kids note) | — | Price below A$60 |
| Picnic / beach rug | — | Waterproof 200×200 cm picnic blankets A$29.99–31.99 ([BS Camping Sleeping Gear](https://www.amazon.com.au/gp/bestsellers/sporting-goods/5044140051)) | Price below A$60 |
| Large outdoor straw rug (2.7×3.6 m) | — | A$59.99 for 270×360 cm ([BS Outdoor Rugs](https://www.amazon.com.au/gp/bestsellers/garden/14652554051)) | Price below A$60 |
| Inflatable SUP | Brand-new boxed boards asking A$79–100 on Gumtree (earlier demand note) | — | FOB US$50–90 alone breaks the A$30 landed limit ([earlier demand note](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/marketplace_demand_au.md)) |
| Pool / beach toys | Kmart dominant; portable pools carry a mandatory warning standard ([earlier compliance note](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/au_landed_cost_compliance.md)) | — | Price; seasonality |
| Car boot organiser | — | FORTEM boot organiser A$34.99 ([BS Automotive Accessories](https://www.amazon.com.au/gp/bestsellers/automotive/4957984051)) | Price below A$60 |
| Roof cargo bag | Kmart Car Top Cargo Bag 252 L A$17 on clearance (was A$29) ([Kmart](https://www.kmart.com.au/product/car-top-cargo-bag-43475254)) | Elora 425 L A$38.99 (search summary) ([Amazon AU search](https://www.amazon.com.au/roof-cargo-bag/s?k=roof+cargo+bag)) | Price below A$60 |
| Moving blankets, laundry baskets | Kmart-dominated low-price goods (not priced this session) | — | Price (inferred) |
| Mattress topper (queen) | — | BEDLORE queen A$69.99 (#1 Bedroom Furniture); bamboo queen A$59.99 ([BS Bedroom Furniture](https://www.amazon.com.au/gp/bestsellers/home/4975226051); [BS Bedding](https://www.amazon.com.au/gp/bestsellers/home/4975267051)) | Price: 10% under A$59.99 is below A$60 |
| Queen bed frame (metal) | — | Zinus Quick Lock queen A$109.99; 35 cm double A$89.00 ([BS Bedroom Furniture](https://www.amazon.com.au/gp/bestsellers/home/4975226051)) | Cube and weight: earlier gas-lift and bed-frame models land at A$70 or more |
| Bedside table | — | Artiss A$38.95; Oikiture A$46.71 ([BS Bedroom Furniture](https://www.amazon.com.au/gp/bestsellers/home/4975226051)) | Price below A$60 |
| TV wall mount / monitor arm | Kmart dual-arm monitor mount A$65 ([Kmart](https://www.kmart.com.au/product/dual-arm-monitor-mount-43305421/)) | — | Price; wall mounts also carry install-safety risk |
| Laptop stand, chair mat, footrest | — | Laptop stands A$9.99–39.99; MARLOW chair mat A$31.98; footrests A$14.99–19.99 ([BS Home Office Furniture](https://www.amazon.com.au/gp/bestsellers/home/4975233051)) | Price below A$60 |
| Camping cot with mattress | — | 6-position folding cot with mattress A$59.99 and A$60.29 ([BS Camping Loungers](https://www.amazon.com.au/gp/bestsellers/sporting-goods/5044749051)) | Price: 10% under is A$54 |
| Golf practice net (own addition) | Kmart net set A$29 on clearance (was A$49); Everfit 3 m A$59.95, 3.5 m A$99.95 on Kmart Marketplace ([Kmart](https://www.kmart.com.au/product/everfit-3.5m-golf-practice-net-portable-training-aid-driving-target-tent-multi-110075098/)) | — | Price |
| Pickleball set (own addition) | Kmart sets A$15–29; full net set A$59 (clearance from A$79) ([Kmart](https://www.kmart.com.au/product/3-piece-pickleball-set-43686377/)) | — | Price |
| Portable cat enclosure (own addition) | Kmart Cat Enclosure A$89 ([Kmart](https://www.kmart.com.au/product/cat-enclosure-43552887/)) | Portable cat tents about A$36–80 (search summary) ([Amazon AU](https://www.amazon.com.au/Outdoor-Cat-Enclosure-Portable-Enclosed/dp/B0CY3RY1VG)) | Price: the Amazon floor is about A$36 |
| Kids modular foam play couch (own addition) | Costway 6-piece A$122.95 on Kmart Marketplace ([Kmart](https://www.kmart.com.au/product/costway-6pcs-modular-play-sofa-kids-foam-couch-grey-110067580/)) | not observed | Landed far above A$30; "Nugget"-style lookalike risk |
| Tri-fold foam mattress (own addition) | BedStory small single 15 cm A$95.95 on Kmart Marketplace ([Kmart](https://www.kmart.com.au/product/110078145/)) | not observed | Untested lead; FOB likely above US$20 |
| Kids ninja obstacle course (own addition) | No Kmart/Big W listing found; The OT Store A$229 for a 15 m course ([The OT Store](https://theotstore.com.au/products/ninja-warrior-slack-line-course)) | Listings exist; prices not visible ([Amazon AU](https://www.amazon.com.au/Ninja-Warrior-Obstacle-Course-Girls/dp/B08GV5R3QF)) | Landed about A$59 (see Q4); floor unverified |

### Inferences
- **Two walls explain the result:**
  - The **fixed-cost wall** (Q0): any first order of 50–200 units carries A$6.50–26 a unit of LCL-fixed and inspection cost, plus A$5 handling.
  - The **floor wall**: almost every small, cheap item that could land at ≤A$30 is already sold new by Kmart, Anko or Amazon generics at A$12–59. Kmart's range now spans pet beds (A$29–79), trolleys (A$12–52), shoe racks (A$15–69), balance bikes (A$30–89), weighted vests (A$35–59), cabanas (A$49–69), golf nets (A$29) and pickleball (A$15–59).
- **The A$60–120 band exists without a brand premium mainly for bulky goods.** Examples are playpens, crates, hammock sets, cabanas, raised beds and dog sofas. These ship at 0.035–0.10 CBM, which by itself costs A$13–29 a unit in freight (Q0 base).
- **The only lever that beats both walls is compression.** A foam product that is large at retail but vacuum-rolls to about 0.01–0.04 CBM comes closest. Even then, the size that clears the A$60 floor (XXL) is the size that costs more at the factory (Q3).
- **Kmart's own price sets the ceiling.** Kmart's A$79 XXL-equivalent cuts the price window to about A$65–75. That leaves roughly A$5–22 a sale on the XXL (Q4), not the A$50–90 the framing implies.

### Gaps
- Temu (client-side rendering), Kogan, Big W and Aldi's current Special Buys were not readable or not checked for most rows.
- Kmart and Bunnings figures are search snippets, undated, and may include clearance prices.
- Amazon floors for the ninja course, large raised beds and tri-fold mattresses were not observable.

## Q2. Price floors for the shortlisted near-misses (URL, price, delivery, date)

### Takeaway
Six products come close enough to model: the XXL orthopaedic bolster dog bed, the double hammock with stand, a large galvanised raised bed, a kids' ninja slackline course, the 42–48" wire crate and the 8-panel 80 cm playpen. For each, the binding ceiling is a walk-in or importer listing, not Amazon:
- Kmart's A$79 bed
- Crazy Sales' A$84.95 (mid-2026) and Harvey Norman's A$90 hammock sets
- Bunnings Marketplace's A$94.46 i.Pet crate
- Topet's A$79 and Pawz's A$82.99 playpens

For the raised bed and the ninja course, no Australian mass-market floor could be observed. Their prices are provisional.

### Cited Findings
Delivery terms that apply throughout:
- **Kmart:** free delivery over A$65 excludes bulky items, online exclusives and Marketplace sellers; standard metro delivery is A$10, 3–5 business days ([Kmart via search summary](https://www.kmart.com.au/product/costway-6pcs-modular-play-sofa-kids-foam-couch-grey-110067580/)).
- **Amazon Best Sellers:** pages show "offers from" prices without delivery ([air purifier note](/home/user/ClaudeCloud/research_notes/Air purifier import check/air_purifier_unit_economics.md)).
- **Dates:** "BS 2026-10-09" means a page cached by a sibling session on 2026-10-09. "Snippet" means a search result read on 2026-10-10 from a page with no date.

**1. XXL orthopaedic bolster dog bed (about 110–120 × 80–90 cm)**

| Floor | Price | Delivery | Date / type | Source |
|---|---|---|---|---|
| Kmart Pet Bed Orthopaedic High Side XL, 120×80 cm, 4.7★ (13) | A$79 | excluded from free delivery (fee not shown) | snippet | [Kmart](https://www.kmart.com.au/product/pet-bed-orthopaedic-high-side-extra-large-43552436/) |
| Kmart Pet Bed Lounge Classic XL (not orthopaedic) | A$39 | as above | snippet | [Kmart](https://www.kmart.com.au/product/pet-bed-lounge-classic-extra-large-43275205/) |
| Amazon TUXOIUBA bolster, XL / XXL | A$59.99 / A$89.99 | not shown | search summary | [Amazon AU](https://www.amazon.com.au/TUXOIUBA-Orthopedic-Dog-Egg-Crate-Removable/dp/B0D2GSNMNX) |
| Amazon Petzly XX-Large egg-crate | A$99.95 | not shown | search summary | [Amazon AU](https://www.amazon.com.au/Petzly-Orthopedic-Removable-Washable-Egg-Crate/dp/B0D7HQXY4Z) |
| Amazon BFPETHOME XL / PaWz XL | A$56.99 / A$41.00 | not shown | search summary | [Amazon AU](https://www.amazon.com.au/BFPETHOME-Orthopedic-Waterproof-Removable-Multi-Needle/dp/B0F1CYL7X9) |

Chosen price **A$69**: 13% under Kmart and 23% under the cheapest XXL on Amazon. An XL-size bed would have to sell at A$51 or less (10% under A$56.99), which is outside the band.

**2. Double hammock + 9–10 ft steel stand (light 11–12 kg class)**

| Floor | Price | Delivery | Date / type | Source |
|---|---|---|---|---|
| Crazy Sales comparable set | A$84.95–89.95 | not recorded | "for weeks in mid-2026" (PriceHipster) | [earlier report](/home/user/ClaudeCloud/reports/Marketplace import arbitrage Australia.md); [PriceHipster](https://pricehipster.com/product/AZ4bQp-9cASueipXtq0y6w) |
| Costway direct | A$105.95 | not recorded | date not stated in the earlier report | [PriceHipster](https://pricehipster.com/product/AZ5tnapOcACzYldIydzs9A) |
| Harvey Norman "Portable Double Hammock with Steel Stand & Carry Bag – Max Load 200kg" (CS_382691), online only | A$90 | not shown | snippet | [Harvey Norman](https://www.harveynorman.com.au/portable-double-hammock-with-steel-stand-carry-bag-maximum-load-200kg.html) |
| Harvey Norman "Double Hammock with Steel Stand and Carry Bag" (CS_382690), Customer Direct | A$98 | not shown | snippet | [Harvey Norman](https://www.harveynorman.com.au/double-hammock-with-steel-stand-and-carry-bag.html) |
| Bunnings "Marquee Double Hammock Kit", 4.02★ (55 reviews); **whether a stand is included was not confirmed** | A$69 | not shown | snippet | [Bunnings hammocks](https://www.bunnings.com.au/products/outdoor-living/outdoor-furniture/outdoor-lounge-furniture/hammocks) |
| Gardeon stand only (300 cm) | A$89.95 | not shown | BS 2026-10-09 | [BS Hammock Stands](https://www.amazon.com.au/gp/bestsellers/garden/220198898051) |
| Amazon "Double Hammock with Stand" #13 Camping Furniture | A$129.99 | not shown | BS 2026-10-09 | [BS Camping Furniture](https://www.amazon.com.au/gp/bestsellers/sporting-goods/5044127051) |

Chosen price **A$85**. That is level with Crazy Sales' mid-2026 low (A$84 if applied strictly) and 6% under Harvey Norman's A$90 online listing. A$95 is out of rule while Harvey Norman sits at A$90. **Check first:** if Bunnings' A$69 Marquee kit includes a stand, the ceiling drops to about A$69 and the net to about A$7.

**3. Large galvanised raised bed (about 240×90 cm oval or 8×4 ft)**

| Floor | Price | Date / type | Source |
|---|---|---|---|
| Bunnings small steel beds | A$28–59 | earlier session snippets | [earlier pets note](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/vertical_pets_garden.md) |
| Bunnings Organic Garden Co 100×50×41 cm | A$79 | snippet | [Bunnings](https://www.bunnings.com.au/the-organic-garden-co-100-x-50-x-41cm-monument-raised-garden-bed_p0817965) |
| OzBargain 4-pack of 240 cm oval galvanised beds (expired deal) | A$499 (was A$749), i.e. about A$125 each | snippet | [OzBargain](https://www.ozbargain.com.au/node/958871) |
| eBay Greenfingers 2-piece galvanised set, size unclear | A$66.95 | snippet | [eBay](https://ebay.com.au/p/28032602289) |

The Amazon AU and Aldi floors for the large size were **not observed**. Provisional price A$99.

**4. Kids' ninja slackline course (15 m / 50 ft, 8–10 obstacles)**

| Floor | Price | Date / type | Source |
|---|---|---|---|
| The OT Store, 15 m course | A$229 | snippet | [The OT Store](https://theotstore.com.au/products/ninja-warrior-slack-line-course) |
| Amazon AU listings exist; price not visible | — | search result | [Amazon AU](https://www.amazon.com.au/Ninja-Warrior-Obstacle-Course-Girls/dp/B08GV5R3QF); [Amazon AU](https://www.amazon.com.au/Obstacle-Slackline-Obstacles-Backyard-Equipment/dp/B09HJRKL9J) |
| US Walmart comparables | US$68.99–125.99 | snippet | [Walmart](https://www.walmart.com/ip/357545409) |

No Kmart, Big W or Toys R Us listing was found. Provisional price **A$89**, valid only if Amazon AU's cheapest comparable is A$99 or more.

**5. 42–48" folding wire crate.** Floors as verified on 2026-10-09:
- i.Pet 48" A$94.46 on Bunnings Marketplace, and A$104.95 on both Amazon (#10 Basic Dog Crates) and Kmart Marketplace
- BEASTIE 48" A$119.95
- Advwin 120×60×70 cm A$99.90 plus postcode delivery
- Amazon Basics 76 cm crate A$64.90 (#1)

([verify_gym_pets.md](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/verify_gym_pets.md); [BS Basic Dog Crates](https://www.amazon.com.au/gp/bestsellers/pet-supplies/5848310051)). Chosen prices: **A$85** for 48" and **A$79** for 42".

**6. 8-panel 80 cm (32") metal playpen**

| Floor | Price | Source |
|---|---|---|
| Topet 8-panel (70 cm), Bunnings Marketplace | A$79 | [Bunnings](https://www.bunnings.com.au/topet-pet-dog-playpen-enclosure-8-panel-puppy-exercise-cage-cat-rabbit-play-pen_p0448512) |
| Pawz 8-panel, Kmart Marketplace (online only) | A$82.99 | [Kmart](https://www.kmart.com.au/product/pawz-dog-playpen-8-panel-metal-dog-pen-tool-free-foldable-puppy-crate-black-110229915/) |
| BEASTIE 40", Bunnings Marketplace | A$129.95 | [Bunnings](https://www.bunnings.com.au/beastie-40-pet-dog-playpen-enclosure-8-panel-heavy-duty-fence-play-pen_p0445112) |
| YES4PETS 100 cm | A$149.99 | [Bunnings](https://www.bunnings.com.au/yes4pets-100-cm-heavy-duty-pet-dog-cat-puppy-rabbit-exercise-playpen-fence_p0647803) |
| Amazon generic 80 cm 8-panel (#8) / i.Pet 40" (#5) / 60 cm (#15) | A$114.99 / A$129.95 / A$72.24 | [BS Dog Crates, Houses & Pens, 2026-10-09](https://www.amazon.com.au/gp/bestsellers/pet-supplies/5581907051) |
| Advwin 24" 8-panel | A$39.90 | [Bunnings](https://www.bunnings.com.au/advwin-24-8-panel-dog-playpen-foldable-pet-fence-exercise-dog-cat-rabbit-cage_p0547749) |

Chosen price **A$75**. All of these sellers' listings are online only, with no in-store pickup at Bunnings.

### Inferences
- **Amazon is never the ceiling on this list.** Kmart's own range, and importer brands on Kmart and Bunnings Marketplaces (Costway, i.Pet, Everfit, Advwin, Pawz, Topet), sit 10–40% below Amazon's cheapest comparable. That confirms the earlier report's finding that "Amazon AU is rarely the cheapest comparable new item".
- **Marketplace-seller listings on Kmart and Bunnings are online-only and carry delivery fees.** A local seller's advantage on these items is same-day pickup and inspection, not price.

### Gaps
- The current Crazy Sales hammock price, Amazon AU prices for ninja courses and large raised beds, and Aldi Special Buys for any of the six were not observable this session.
- The TUXOIUBA XXL A$89.99 figure rests on a search summary's size mapping.

## Q3. Suppliers for the shortlisted near-misses (FOB, MOQ, carton, manufacturer-vs-trader evidence)

### Takeaway
Listed prices exist at 50–200-unit MOQs for every shortlisted product. But the cheap listings tend to come from traders, or are for smaller sizes than the product that clears the price floor. The **XXL dog bed** is the clearest case:
- The US$10–13 listings are explicitly small (General Union's "Extra Large" is 70×58 cm), S/M/L only (Baiyi), flat mats (Jiusheng), or XS–XXL ranges with no price per size (Joypaws). Most of their sellers show trader signals.
- The one manufacturer with size data, Hangzhou Tianyuan (listed on SZSE as 301335; 2L = 112×86×25 cm), quotes only a US$14.89–35.46 range.

Under the toolkit's evidence rule no new supplier reaches "confirmed factory" this session:
- ImportGenius returned 403.
- Panjiva search returned HTTP 500.
- The TÜV portal returned empty results for both report numbers tried.

Platform badges are recorded below but count for nothing.

### Cited Findings
All figures are Made-in-China.com listing prices, not quotes, read on 2026-10-10. "Self-reported" marks C-grade text under [verification_toolkit.md](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage real factories/verification_toolkit.md).

**XXL orthopaedic bolster bed**
- **Hangzhou Tianyuan Pet Products Co., Ltd.**
  - Listing: "Large Memory Foam Orthopedic Pet Bed… Dog Sofa Bolster Bed", **US$14.89–35.46, MOQ 100**, with no price per size.
  - Sizes: M 63×51×23, L 91×71×23 and 2L 112×86×25 cm.
  - Package: 80×70×60 cm, 5 kg, "each with polybag and colorpaper".
  - Self-reported: established 2003-06-11, 674 employees, 65,324 m², 123 production lines, an "automatic roll-packing machine" and 30 QA/QC staff.
  - TÜV report no. MIC-ASR2431442 returned no record on the TÜV portal.
  - Source: [MIC](https://tianyuanpet.en.made-in-china.com/product/vJKRBahYOTrV/China-Large-Memory-Foam-Orthopedic-Pet-Bed-Luxury-Fluffy-Faux-Fur-Plush-Dog-Sofa-Bolster-Bed-for-Large-Dogs.html); [TÜV portal](https://www.verified.chn.tuv.com/en/).
  - Third-party financial databases list the company on the Shenzhen exchange (301335, listed Nov 2022), with 2024 "pet bed pads" revenue of about RMB 328 m and cat-climbing frames of about RMB 420 m. The annual report itself was not read — [Simply Wall St](https://simplywall.st/stocks/cn/household/szse-301335/hangzhou-tianyuan-pet-products-shares/information); [Moomoo](https://moomooapp.com/stock/301335-SZ/financial/main-composition).
- **Ningbo General Union Co., Ltd.**
  - Listing: "Extra Large Orthopedic Dog Bed with Waterproof Foam and Bolsters", **US$12.54 (100–499) / 12.37 / 12.20, MOQ 100**. The stated size is only **70×58×18 cm**; package line reads 100×100×100 cm.
  - Main products listed: table lamps, heat-press machines, fans, alarm clocks, solar lights and pet products.
  - Address: "4F, Building II, No. 113 Qiushi Road, Beiyuan, Yiwu".
  - Calls itself a "top 50 trading company".
  - **Verdict: treat as trader** (office address plus unrelated product sprawl) — [MIC](https://skylarkch.en.made-in-china.com/product/vdGTVfhzXwtc/China-Extra-Large-Orthopedic-Dog-Bed-with-Waterproof-Foam-and-Bolsters.html).
  - A sister listing offers an "XL sofa bed with egg-crate foam" at US$9.38 (500–1,999) / 6.28 (10,000+), MOQ 500, "8 pcs/carton" — [MIC](https://skylarktoys.en.made-in-china.com/product/pOKfnMLBXsAg/China-Orthopedic-Dog-Sofa-Bed-XL-Size-with-Egg-Crate-Foam-Waterproof-Lining-Non-Skid-Bottom-Washable-Pet-Bed-Dog-Bed.html).
- **Dongying Jiusheng Trading Co., Ltd.**
  - Listing: "Portable Orthopedic Comfort Dog Bed Egg Crate Foam Mattress" (a flat mat, not a bolster bed), **US$13.65 (100–499) / 10.65 (500+), MOQ 100**.
  - Packing: vacuum compression, roll packing or mattress-in-box; HS 9404210090 as stated by the supplier.
  - Self-reported: "Manufacturer/Factory & Trading", Longju Economic Development Zone, Dongying; established 2003-07-24; 57 staff; 33,350 m²; main products PU foam, tri-fold mattresses and foam sofa beds; lists a foam production line, cutting and pressing machines.
  - The name contains "Trading", a red flag until explained. TÜV report MIC-ASI235223 returned no record.
  - Sources: [MIC](https://jiusheng-pufoam.en.made-in-china.com/product/wRUpYvFlZuWD/China-Portable-Orthopedic-Comfort-Dog-Bed-Egg-Crate-Foam-Mattress-Pet-Mat.html); [TÜV portal](https://www.verified.chn.tuv.com/en/).
- **Weifang Baiyi Garments Co., Ltd.**
  - Listing: "Orthopedic Dog Bed Memory Foam for Large Dogs", **US$11.90 (50–99) / 11.20 (100–499) / 10.30 (500+)**, sizes S/M/L.
  - Package stated as 20×20×20 cm, 4 kg, with no size given. Lead time 35–60 days.
  - "Since 2001" and "Manufacturer" are self-reported only — [MIC](https://weifangbaiyigarment.en.made-in-china.com/product/KrSpNdHDfuWR/China-Wholesale-Designer-Orthopedic-Dog-Bed-Memory-Foam-for-Large-Dogs.html).
- **Anhui Joypaws Co., Ltd.**
  - Listing: **US$10.86 (200–499) / 10.40 / 10.25**, sizes XS–XXL with no price per size.
  - Single package 52×45×38 cm (0.089 CBM), 5.5 kg, i.e. not compressed.
  - Main products: beds, clothes, carriers and strollers. Export year 2024-12-01.
  - Trader-type signals — [MIC](https://anhui-joypaws.en.made-in-china.com/product/FRMrueCVZLcE/China-Orthopedic-Memory-Foam-Dog-Bed-for-Large-Dogs-Removable-Cover.html).

**Double hammock + steel stand** (from the real-factories round, unchanged)
- **Ningbo Lounger Import & Export** (**trader**): **US$20–21, MOQ 200**; carton 0.061248 CBM, 11 kg — [MIC](https://lounger2.en.made-in-china.com/product/zatrBMfGjmRi/China-Easy-Assemble-Folding-Double-Portable-Hammock-with-Stand.html).
- **Ningbo Xusheng Leisure Products** (probable factory export arm): US$20–30 (MOQ 100) or US$27–35 (MOQ 560).
- **Ningbo Danlong Furniture** and **Jarder Home Ningbo** are the only hammock-stand makers that cleared the two-A/B bar (US design patent plus US customs).
- Source for all three: [factories_hammock.md](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage real factories/factories_hammock.md).

**Large galvanised raised bed**
- **Laizhou Haotai Metal Products** (Laizhou, Shandong)
  - Self-described "manufacturer"; ISO 9001 claimed.
  - **US$22.45–25.23 per set, MOQ 200**; sizes 4×2×1 ft to 8×4×3 ft, not mapped to price; carton not stated.
  - An earlier session flagged that this page contains text addressed to AI readers. It was ignored — [earlier pets note](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/vertical_pets_garden.md); [MIC](https://haotai-metal.en.made-in-china.com/product/WESrOHpMCvht/China-Galvanized-Steel-Square-Raised-Garden-Bed.html).
- **Foshan Dongyisheng Metal Products** ("Manufacturer/Factory & Trading"; badges only)
  - "Tall 18'' Galvanized Raised Garden Bed Kit… Oval Large", **US$33–35, MOQ 10** — [MIC](https://dysgreenhouse.en.made-in-china.com/product/gfQRKbulvYci/China-Tall-18-Galvanized-Raised-Garden-Bed-Kit-Galvanized-Planter-Garden-Boxes-Outdoor-Oval-Large-Metal-for-Vegetables.html).
  - An earlier note lists its Corten line at US$8–50, MOQ 800.
- **Hebei Nana Trading** (a trader by name): US$12.50–35.50, MOQ 100.
- **Shenzhen Thomas Homeware**: US$15.27–25.30, MOQ 500.
- Source for the last two: [MIC search](https://www.made-in-china.com/products-search/hot-china-products/Galvanized_Steel_Garden_Raised_Bed.html).

**Kids' ninja slackline course**
- **Taizhou Boyuan Rope Net Factory** (Jiangsu; brand "ksabo")
  - Listing: "Slackline Hanging Obstacle Course Ninja Warrior Line… Kit", **US$25, MOQ 50**.
  - Package 46×36×31 cm, 20 kg, "Bagged". This is probably several sets, since the units per carton are not stated. HS 560750 as stated.
  - Product line is rope and net only, consistent with one technology. Evidence is C-grade only — [MIC](https://boyuanrope.en.made-in-china.com/product/fGqRaKYATIhT/China-American-Fitness-Slackline-Hanging-Obstacle-Course-Ninja-Warrior-Line-Obstacle-Course-Kit-for-Outdoor-Backyard.html).
- **Ningbo Kingslings Import and Export Co., Ltd.**
  - **US$25–49, MOQ 100**; lengths 36–56 ft.
  - Address: "502, 5th Floor, Nanyang Building, No. 218 Dieyuan Road, Yinzhou District". An office-tower address and an import-export name mean **treat as trader**, despite its "Our factory" claim — [MIC](https://kingslings.en.made-in-china.com/product/GdFaQqhMAHWk/China-Amazon-Top-Seller-Children-Outdoor-Ninja-Obstacle-Course-Ninja-Slackline-Course-Backyard.html).
- **Qingdao Yixinquan Industry and Trade**: "Slackline – Ninja Warrior Obstacle Course – 11 Accessories", US$43.99–45.99, MOQ 200 — [MIC search](https://www.made-in-china.com/products-search/hot-china-products/Ninja_Slackline.html).

**42–48" wire crate** (from verify_gym_pets.md)
- **Shenzhen Fuyuanxin** (**trader**): 48" 122×75.5×84 cm, US$28.50 (10–499) / 24.80 (500–999).
- **Xingtai/Hebei Senxin**: "Metal Folding Dog Cage XXL", US$9.00–20.00, MOQ 50, sizes up to 119×78×83 cm, no price per size.
- **Anping Ying Hang Yuan Metal Wire Mesh**: manufacturer and trading, established 2008, 38 staff (self-reported); US$10–12, size not stated.
- Source: [verify_gym_pets.md](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/verify_gym_pets.md).

**8-panel playpen**
- **Alusen (Dalian) Gardening Co., Ltd.**
  - **US$17.50, MOQ 200** (TP-01, 24"×24" panels, 23.76 lb).
  - Panel sizes 60×60 / 68×80 / 68×100 cm in cartons of 63×66×11 / 83×74×11 / 103×73×11 cm, one set per carton. The listing does not show whether US$17.50 applies to the 80 cm size. HS 7326209000 — [MIC](https://alusen2024.en.made-in-china.com/product/rARpTCYLWnUU/China-Portable-8PCS-Heavy-Duty-Metal-Dog-Playpen-Outdoor-Fence-Panel-for-Pets.html).
- **Shengzhou Tuoke Industry and Trade**: "8 Panels 32" Dog Playpen", **US$9.90–39.80, MOQ 300**; 64×64×32 in, 29.1 lb; "each in a carton" — [MIC](https://copperwu.en.made-in-china.com/product/OwftSpoKEzaq/China-8-Panels-32-Dog-Playpen-Outdoor-Portable-Foldable-for-Dogs-Puppies-Cats.html).
- **Zunhua Boqi Pet Products** ("Manufacturer/Factory & Trading", Hebei): **US$21.90 (500–999)**; flat-packed — [MIC](https://343d321c5f02f323.en.made-in-china.com/product/pGRrbwYUYFrh/China-Portable-Dog-Playpen-for-Indoor-and-Outdoor-Use-Easy-Setup.html).
- **Peilingtech** (Hebei): US$15.99–29.99, MOQ 50 sets; package 60×50×5 cm, 5 kg — [MIC](https://peilingtech.en.made-in-china.com/product/eTJUgjhCsRrt/China-1688-Factory-Heavy-Duty-Metal-Dog-Playpen-with-Rust-Resistant-Coating-for-Outdoor-Use.html).

**Rejected-on-price items, for the record**
- 20 kg weighted vest:
  - Hefei Dayu Fitness US$18, MOQ 50 — [MIC](https://dayu2208.en.made-in-china.com/product/yJCYeVaxOTro/China-Weighted-Vest-Men-16kg-20kg-30kg-Weighted-Workout-Vest-with-Removable-Iron-Weights-Heavy-Duty-Weighted-Exercise-Vest-for-Strength-Training.html).
  - Nantong Get-Fit Sports US$15–18.50, MOQ 50; Nantong Vigor US$13–15, MOQ 100 — [MIC search](https://www.made-in-china.com/products-search/hot-china-products/Weighted_Vest.html).
- 2×2 m beach cabana: Shaoxing Unique Umbrella US$20.18–35.68, MOQ 500 — [MIC](https://unique-umbrella.en.made-in-china.com/product/ValrbPnObops/China-Foldable-Square-Beach-Cabana-with-Classic-Stripes-Wholesale-Market.html); 6.5 ft with sunwall US$36.18–42.68 — [MIC search](https://www.made-in-china.com/products-search/hot-china-products/Beach_Cabana.html).

### Inferences
- **The product that clears the A$60 floor is XXL, and nobody prices XXL at a low MOQ.** Tianyuan's range implies a 2L bed between US$15 and US$35. A brand-grade XXL bed is more likely in the upper half, given that Kmart retails its 120×80 cm bed at A$79. This is an inference, not a quote.
- **Traders dominate the sub-US$15 bed listings.** That fits the toolkit's finding that the cheapest listing is often a trading company.
- **For playpens and raised beds, "size not mapped to price" is the norm.** A request for quotation naming the exact size (80 cm panels; 240×90×80 cm oval) is the first step before any of these numbers can be relied on.

### Gaps
- No RFQs were sent, so every figure is a listing price.
- Customs (ImportGenius 403; Panjiva search HTTP 500), registry and patent evidence could not be gathered for the new suppliers. No new supplier exceeds C grade except Tianyuan's listed-company status, which comes from secondary sources.
- Carton sizes for the XXL bed (compressed), the ninja kit and the raised bed are not stated per unit. They are estimated in Q4.

## Q4. Landed-cost arithmetic, net per sale and first-order cash (shared base, non-GST-registered)

### Takeaway
On the shared base, every product that can legally sell at A$60–120 lands at **A$47–84**, not A$10–30. Net per sale is **A$6–38** across the workable cases:
- hammock: A$23–28 at A$85–90 (A$95 breaks the rule while Harvey Norman lists at A$90)
- large raised bed: A$35, if A$99 holds
- ninja course: A$30, if A$89 holds
- 42" crate: A$23 at a US$15 quote (A$15 at US$20)
- XXL bed: A$6–22, depending on the unpublished 2L price
- playpen: A$12

The weighted vest, cabana and 48" crate at the trader's price make A$3 or less. A 200-unit first order ties up **A$8–15k up front**, and recovering that cash needs 116–165 of the 200 units sold.

### Cited Findings
- **Formula:** landed = FOB × 1.4376 + A$244 × max(CBM, t) + A$900/units + A$400/units + 10% × (FOB A$ + 60% × freight) + 3% × (all of the above) + A$5.
- **Sale price** is kept in full, because the seller is not GST-registered.
- **Up-front cash** is FOB + freight + inspection + import GST, times units. It excludes handling and the defect allowance.
- Bases are in Q0, prices in Q2 and suppliers in Q3. Calculation scripts: `lc.py` and `final.py` (scratchpad).

| Case | Units | FOB A$ | Freight | Inspection | Import GST | Defect 3% | Handling | **Landed** | Sell | **Net/sale** | Up-front cash | Units to recover cash | Carton basis |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| XXL bolster bed 2L, Tianyuan range low US$14.89 | 200 | 21.41 | 14.26 | 2.00 | 3.00 | 1.22 | 5.00 | **46.88** | 69 | **22.12** | 8,132 | 118 | 0.04 CBM / 6 kg (est.) |
| XXL bolster bed 2L, mid-range US$20 (est.) | 200 | 28.75 | 14.26 | 2.00 | 3.73 | 1.46 | 5.00 | **55.21** | 69 | **13.79** | 9,749 | 142 | 0.04 CBM / 6 kg (est.) |
| XXL bolster bed 2L, US$25 (est.) | 200 | 35.94 | 14.26 | 2.00 | 4.45 | 1.70 | 5.00 | **63.35** | 69 | **5.65** | 11,330 | 165 | 0.04 CBM / 6 kg (est.) |
| L/XL trader bed (Baiyi US$11.20, stated 0.008 cbm) at XL-tier price | 200 | 16.10 | 6.45 | 2.00 | 2.00 | 0.80 | 5.00 | **32.35** | 51 | **18.65** | 5,310 | 105 | 0.008 CBM / 4 kg (stated) |
| Hammock+stand, Lounger US$20.50 | 200 | 29.47 | 19.44 | 2.00 | 4.11 | 1.65 | 5.00 | **61.68** | 85 | **23.32** | 11,006 | 130 | 0.061248 CBM / 11 kg (stated) |
| Hammock+stand, Lounger US$20.50 (A$95 shown for reference only; out of rule while Harvey Norman lists at A$90) | 200 | 29.47 | 19.44 | 2.00 | 4.11 | 1.65 | 5.00 | **61.68** | 95 | **33.32** | 11,006 | 116 | 0.061248 CBM / 11 kg (stated) |
| Raised bed, Haotai mid US$23.84 | 200 | 34.27 | 16.70 | 2.00 | 4.43 | 1.72 | 5.00 | **64.12** | 99 | **34.88** | 11,480 | 116 | 0.05 CBM / 15 kg (est.) |
| Raised bed, Dongyisheng US$34 'tall oval' | 200 | 48.88 | 16.70 | 2.00 | 5.89 | 2.20 | 5.00 | **80.67** | 119 | **38.33** | 14,694 | 124 | 0.05 CBM / 15 kg (est.) |
| Ninja course, Boyuan US$25 | 200 | 35.94 | 10.60 | 2.00 | 4.23 | 1.58 | 5.00 | **59.35** | 89 | **29.65** | 10,554 | 119 | 0.025 CBM / 6 kg (est.) |
| Ninja course, Boyuan US$25 (100 units) | 100 | 35.94 | 15.10 | 4.00 | 4.50 | 1.79 | 5.00 | **66.33** | 89 | **22.67** | 5,954 | 67 | 0.025 CBM / 6 kg (est.) |
| 48in crate, trader US$28.50 | 200 | 40.97 | 28.17 | 2.00 | 5.79 | 2.31 | 5.00 | **84.23** | 85 | **0.77** | 15,385 | 182 | 0.097 CBM / 17 kg (est.) |
| 48in crate, if US$20 quote | 200 | 28.75 | 28.17 | 2.00 | 4.57 | 1.90 | 5.00 | **70.39** | 85 | **14.61** | 12,697 | 150 | 0.097 CBM / 17 kg (est.) |
| 42in crate, if US$15 quote | 200 | 21.56 | 22.80 | 2.00 | 3.52 | 1.50 | 5.00 | **56.39** | 79 | **22.61** | 9,978 | 127 | 0.075 CBM / 13 kg (est.) |
| 80 cm playpen, US$20 (est., 32in price not listed) | 200 | 28.75 | 20.99 | 2.00 | 4.13 | 1.68 | 5.00 | **62.56** | 75 | **12.44** | 11,176 | 150 | 0.0676 CBM / 15 kg (stated carton) |
| 20 kg weighted vest, Dayu US$18 | 200 | 25.88 | 11.82 | 2.00 | 3.30 | 1.29 | 5.00 | **49.28** | 47 | **-2.28** | 8,599 | 183 | 0.03 CBM / 21 kg (est.) |
| 2x2 m beach cabana, Unique Umbrella US$20.18 (MOQ 500) | 500 | 29.01 | 6.68 | 0.80 | 3.30 | 1.19 | 5.00 | **45.99** | 49 | **3.01** | 19,896 | 407 | 0.02 CBM / 4 kg (est.) |

- **Carton sources:**
  - Stated by the supplier: hammock 0.061248 CBM/11 kg ([factories_hammock.md](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage real factories/factories_hammock.md)); playpen 83×74×11 cm for 68×80 cm panels ([Alusen](https://alusen2024.en.made-in-china.com/product/rARpTCYLWnUU/China-Portable-8PCS-Heavy-Duty-Metal-Dog-Playpen-Outdoor-Fence-Panel-for-Pets.html)); Baiyi bed 20×20×20 cm/4 kg ([Baiyi](https://weifangbaiyigarment.en.made-in-china.com/product/KrSpNdHDfuWR/China-Wholesale-Designer-Orthopedic-Dog-Bed-Memory-Foam-for-Large-Dogs.html)).
  - Estimated in an earlier note: 48" crate 0.097 CBM/17 kg, from the 121×76×9 cm folded size ([verify_gym_pets.md](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/verify_gym_pets.md)).
  - Estimated by me (labelled "est."): XXL roll-packed bed 0.04 CBM, ninja kit 0.025 CBM/6 kg, raised-bed flat pack 0.05 CBM/15 kg, vest 0.03 CBM/21 kg, cabana 0.02 CBM/4 kg, 42" crate 0.075 CBM/13 kg.
- **Order-size effect** (XXL bed at US$14, 0.035 CBM): landed **A$65.02 at 50 units, A$51.07 at 100, A$46.42 at 150, A$44.10 at 200 and A$41.78 at 300** (my calculation). A 50-unit first order adds about A$21 a unit over 200 units.
- **Cost-base sensitivity:** a consolidator that dropped the A$900 fixed charge would save A$4.50 a unit at 200 units (A$900/200, arithmetic). That does not change any verdict.

### Inferences
- **The economics are "sell at 1.2–1.55× landed", not "buy at A$10–30 and sell at A$60–120".** The ratios: playpen 1.20, 48" crate at US$20 1.21, XXL bed at US$20 1.25, hammock 1.38, ninja 1.50, raised bed 1.54. The nearest the framing gets is the L/XL trader bed: about A$32 landed, but only saleable at A$51 or less.
- **Freight plus inspection is 21–43% of landed cost:** ninja kit 21%, XXL bed 29%, hammock 35%, playpen 37%, 48" crate 36–43%. That is why the crate and playpen fail while the more compact ninja kit and hammock survive.
- **Not costed in the shared base:**
  - paid samples (about US$30–60 each, per the hammock note)
  - product-liability insurance (a few hundred dollars a year at entry level, more for riskier products, per the compliance note)
  - storage space and the seller's time and fuel
  - Marketplace no-shows
  - returns under the Australian Consumer Law beyond the 3% allowance

  Each lowers the true net.

### Gaps
- Size-specific FOB prices (XXL bed, 80 cm playpen, large raised bed) and per-set carton data (ninja kit, raised bed, XXL bed) need RFQs.
- The 60% freight share in the GST base is a convention, not a ruling. At 100%, import GST rises by A$0.3–1.1 a unit.

## Q5. Demand evidence, plausible weekly volume per account, hand-over practicality, compliance and verdicts

### Takeaway
Per-account Marketplace sell-through is **unmeasured**: Meta publishes nothing, Marketplace sits behind a login, and Gumtree returned 403. The weekly volumes below are therefore labelled estimates, built from two rules:
- **Need-driven pet items** (crate, playpen, bed): **1–3 a week, mid 2**.
- **Seasonal leisure items** (hammock, raised bed, ninja course, cabana): **0.5–2.5 a week averaged over the year, mid 1.5**, with near-zero winters and 2–5 a week in season.

All shortlisted items pass the hand-over test: cartons of 20 kg or less that fit in a car boot. The ninja course is the only one with a meaningful safety load. Verdicts run from **5/10** (hammock) down to **1/10**.

### Cited Findings
**Demand anchors**
- Australia has an estimated **7.4 million pet dogs**; 49% of households have a dog; **24% of dogs weigh over 25 kg**; dog-owning households have 1.4 dogs on average — [AMA Pets in Australia 2025](https://animalmedicinesaustralia.org.au/wp-content/uploads/2025/09/SNR-2403006-Pet-Ownership-Study-2025-Designed_F3.pdf).
- Dog households spend on average **A$117 a year on "products or accessories"** (total dog spend A$2,520 a household; A$13.21bn nationally) — [AMA 2025, p.42](https://animalmedicinesaustralia.org.au/wp-content/uploads/2025/09/SNR-2403006-Pet-Ownership-Study-2025-Designed_F3.pdf).
- Where the majority of pet products and accessories are obtained:
  - pet shop in person 24%
  - supermarket 22%
  - "retail store (e.g. Kmart, Bunnings etc.)" 16%
  - pet shop online 14%
  - Marketplace is not a named channel ("somewhere else" about 2%) — [AMA 2025, p.43](https://animalmedicinesaustralia.org.au/wp-content/uploads/2025/09/SNR-2403006-Pet-Ownership-Study-2025-Designed_F3.pdf).
- **Seasonality:** September to December is outdoor season; kids' gift lines peak from late October to Christmas; January is the gym window; November is the largest household-goods month ([earlier report](/home/user/ClaudeCloud/reports/Marketplace import arbitrage Australia.md)).
- **Amazon AU presence** (Best Sellers ranks, 2026-10-09; ranks are not volumes):
  - i.Pet 40" 8-panel playpen #5 and a generic 80 cm 8-panel #8 in Dog Crates, Houses & Pens ([BS](https://www.amazon.com.au/gp/bestsellers/pet-supplies/5581907051))
  - i.Pet 48" crate #10 in Basic Dog Crates ([BS](https://www.amazon.com.au/gp/bestsellers/pet-supplies/5848310051))
  - hammock-with-stand set #13 in Camping Furniture ([BS](https://www.amazon.com.au/gp/bestsellers/sporting-goods/5044127051)); its cached product page showed no offer that day and BSR 1,499 in Sports
  - Komodo cabana #6 in Camping Shelters ([BS](https://www.amazon.com.au/gp/bestsellers/sporting-goods/5044128051))
- **Used-goods competition:** used dog crates are a common second-hand item ([verify_gym_pets.md](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/verify_gym_pets.md)).
- **Speed of sale:** the only Australian time-to-sale figure found anywhere is an unsourced guide's claim that correctly priced furniture sells in 24–48 hours ([marketplace_demand_au.md](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/marketplace_demand_au.md)).

**Marketplace mechanics and the adult's account**
- **Repeat listings:** no official cap on listing or relisting was found. A seller-tools blog advises against parallel identical listings and suggests waiting about 30 days before refreshing stale listings, noting "there is no published universal number" — [Vendoo blog](https://blog.vendoo.co/facebook-marketplace-delete-and-relist).
- **Platform stance:** Meta's Commerce Policies say Marketplace "is intended for consumer-to-consumer sales", and Meta has suspended business sellers in the EEA, the Philippines and India ([earlier report](/home/user/ClaudeCloud/reports/Marketplace import arbitrage Australia.md)).
- **Age:** third-party sources say Marketplace sellers must be 18 or over ([au_landed_cost_compliance.md](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/au_landed_cost_compliance.md)).
- Facebook's robots.txt disallows all user agents not explicitly named (`User-agent: *` / `Disallow: /`) and has no Claude-User group, so Meta's current Terms on account sharing were not read — [facebook.com/robots.txt](https://www.facebook.com/robots.txt).
- **Legal liability:** the importer of goods made by a foreign manufacturer is the ACL "deemed manufacturer". It must remedy failures itself and carries injury liability ([au_landed_cost_compliance.md](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/au_landed_cost_compliance.md)).

**Hand-over, compliance and IP per product**

| Product | Carton / weight | Car-boot fit | Defect / return risk | Safety load | Mandatory standard or IP flag |
|---|---|---|---|---|---|
| Double hammock + stand | 0.061 CBM, 11 kg (stated) | Yes (long box) | Low–medium: welds, bolts, fabric | Low; load rating must be true | None identified. Patents behind the basic stand have lapsed ([factories_hammock.md](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage real factories/factories_hammock.md)) |
| Large raised bed (flat pack) | about 0.05 CBM, 15 kg (est.) | Probably (panels about 120 cm, est.) | Low; sharp panel edges | Low | None identified (steel; no timber biosecurity) |
| Ninja slackline course | about 0.025 CBM, 6 kg (est.) | Yes | Medium: ratchets, webbing, load-bearing parts | **Medium–high:** children hanging and falling; tree mounting | No product-specific mandatory standard identified in earlier notes. "Ninja Warrior" is a TV format name, so avoid it in titles (trademark not checked) |
| 42–48" wire crate | 0.075–0.097 CBM, 13–17 kg (est.) | Yes (flat, 124 cm) | Low: bent wires, tray | Low | None identified; check the anti-dumping classification ([verify_gym_pets.md](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/verify_gym_pets.md)) |
| XXL orthopaedic bolster bed | about 0.04 CBM roll, 6 kg (est.) | Yes | Low: zips, foam odour; cannot be re-rolled once opened | Low | None identified. "Orthopaedic" claims must not mislead (ACL) |
| 80 cm 8-panel playpen | 0.068 CBM (stated), about 15 kg (est.) | Yes (83×74×11 cm) | Low | Low | None identified |
| Beach cabana / weighted vest | small | Yes | Low | Low | "UPF 50+" claims need substantiation (inference) |

**Volume estimates per product** (single account, one big metro; estimates, not measurements)
- **Double hammock + stand: 0.5–2.5 a week, mid 1.5.** Outdoor season September–March; near zero May–August. Competes online with Costway, Gardeon, Crazy Sales and Harvey Norman. Bunnings lists a A$69 Marquee "Double Hammock Kit" (stand inclusion unconfirmed); no Kmart equivalent was found.
- **Large raised bed: 0.5–2.5, mid 1.5.** Peaks August–November with spring planting; Bunnings is the default store for garden goods.
- **Ninja course: 0.5–2.5, mid 1.5.** Birthdays plus an October–December gift peak; no walk-in competitor found.
- **42–48" crate: 1–3, mid 2.** Driven by puppy acquisitions all year; heavy used supply.
- **XXL bed: 1–3, mid 2.** Year-round with a winter lift; Kmart's A$79 bed is in every metro.
- **80 cm playpen: 1–3, mid 2.** Puppy-driven.

### Inferences
- **Top-down scale check (estimates):**
  - A metro of about one-fifth of Australia's population (Sydney or Melbourne; assumption) would hold about 1.5 m dogs (7.4 m × 20%), of which about 355k are large (24%).
  - At about 12-year average lifespans, roughly 125k new dogs arrive a year, about 2,400 a week.
  - If 20–30% get a wire crate or pen (assumption), that is about 480–720 crate or pen purchases a week across all channels.
  - If large-dog beds are replaced every 2–3 years, that is about 2,300–3,400 large beds a week.
  - So 10 a week from one seller would be roughly 1.4–2.1% of crate and pen purchases, or 0.3–0.4% of large-bed purchases. That is small against total demand, but Marketplace's share of new-goods pet sales is unmeasured. AMA does not list it as a channel.
- **Seller-safety inference:** pickups at the adult's address with the adult present, cashless payment and no evening meet-ups are prudent for a minor. This is not sourced; Marketplace scam prevalence is documented in the earlier report.
- **Verdicts (1–10):**
  - **Double hammock + stand — 5/10.** It has the best evidence: FOB, carton and most floors are verified (Lounger US$20–21 at MOQ 200; Costway A$105.95; Harvey Norman A$90; Crazy Sales A$84.95–89.95 mid-2026). It earns A$23–28 a sale at a rule-compliant A$85–90; Harvey Norman's A$90 online listing rules out A$95. It is easy to hand over and low-risk. One open risk: Bunnings' A$69 "Marquee Double Hammock Kit" would cut the net to about A$7 if it includes a stand. Against it: the cheapest supplier is a trader, demand is seasonal, A$11k is tied up in 200 units, and at a mid 1.5 a week those units take about 2.5 years to clear. It is a reasonable first SKU, not a business.
  - **Large galvanised raised bed — 4/10.** The best modelled net (A$35 at A$99 on Haotai's mid price) but the weakest evidence. The large-size retail floor was not observed, Haotai does not map price to size, the carton is estimated, and demand is concentrated in spring. Steel panels are durable and low-risk. It is worth an RFQ and a Bunnings and Aldi price check before anything else.
  - **Kids' ninja slackline course — 3/10.** About A$30 a sale at A$89 from a US$25, MOQ-50 rope-and-net maker (Taizhou Boyuan). But the Amazon AU floor is unverified, supplier evidence is C-grade, it is a gift-season product, and a load-bearing children's play product sold by a teenager carries real injury liability under the ACL.
  - **42–48" wire crate — 3/10.** Profitable only with a manufacturer quote of US$15–20 (A$15–23 a sale). At the only verified 48" price (trader, US$28.50) it makes about A$1. Bunnings Marketplace's i.Pet at A$94.46 and plentiful used crates cap price and pace.
  - **XXL orthopaedic bolster bed — 3/10.** The best fit to "big at retail, small in transit". But Kmart's A$79 caps it, and the only manufacturer with size data quotes US$14.89–35.46 without a 2L price. The modelled net is A$6–22, and A$22 needs the bottom of that range. An RFQ to Tianyuan for 2L in a roll pack decides it.
  - **80 cm playpen — 2/10.** A A$63 landed cost against a A$75–79 ceiling set by Bunnings and Kmart Marketplace sellers leaves about A$12. The flat but large 0.068 CBM carton is the problem.
  - **Beach cabana — 1/10.** Kmart sells its own at A$49–69. A 500-unit MOQ needs about A$20k of cash for A$3 a sale.
  - **20 kg weighted vest — 1/10.** Kmart's Anko 9–18 kg at A$59 and Amazon's A$52.49 PROIRON leave a loss on 21 kg of iron.
  - **Cat tree, 120–150 cm — 1/10.** Kmart A$71 against an estimated A$85 landed cost.

### Gaps
- No Marketplace, Gumtree or Google Trends volume data could be read. Google Trends' robots.txt disallows `/trends/explore?` ([trends.google.com/robots.txt](https://trends.google.com/robots.txt)), so it was not used, and its internal API was not scraped as a substitute.
- Amazon "bought in past month" counts were not observable for the shortlisted listings, which were not cached.
- The 20–30% crate/pen uptake, the 2–3-year bed replacement cycle, the 12-year lifespan and the one-fifth metro share are my assumptions, not sourced figures.

## Q6. Ranking by net per sale × mid-range weekly volume, with realistic weekly profit ranges

### Takeaway
Ranked by net per sale × mid weekly volume:
1. Large galvanised raised bed: about A$52 a week
2. Kids' ninja course: about A$44
3. Double hammock + stand: about A$35
4. 42–48" crate: about A$29
5. XXL orthopaedic bed: about A$28
6. 80 cm playpen: about A$25
7. Beach cabana: about A$5
8. 20 kg weighted vest: about −A$5
9. Cat tree: a loss

**One SKU at mid volume makes about A$25–52 a week**; the realistic range runs from a few dollars to about A$95. The top two rest on unverified Australian floors and estimated cartons. Only the hammock rests on mostly verified inputs. The ranking is therefore fragile at the top and robust at the bottom.

### Cited Findings
Inputs come from Q2 (prices), Q3 (FOB, MOQ) and Q4 (landed cost). Volumes are the labelled rules from Q5. Calculation: `rank.py` (scratchpad). Low profit = low net × low volume; high = high net × high volume.

| Rank | Product (price) | Net/sale low / base / high (A$) | Weekly units low / mid / high | **Net × mid volume (A$/wk)** | Realistic weekly profit range (A$) | Evidence quality |
|---|---|---|---|---|---|---|
| 1 | Large galvanised raised bed (A$99) | 18.33 / 34.88 / 37.14 | 0.5 / 1.5 / 2.5 | **52** | 9 to 93 | floor for large size unverified; size-price unmapped; carton est. |
| 2 | Kids ninja slackline course (A$89) | 19.65 / 29.65 / 29.65 | 0.5 / 1.5 / 2.5 | **44** | 10 to 74 | Amazon floor unverified; carton est.; injury liability |
| 3 | Double hammock + stand (A$85) | 7.32 / 23.32 / 28.32 | 0.5 / 1.5 / 2.5 | **35** | 4 to 71 | FOB, carton and most floors verified; low case = Bunnings A$69 kit if it includes a stand |
| 4 | 48in/42in wire crate (A$85/A$79) | 0.77 / 14.61 / 22.61 | 1 / 2 / 3 | **29** | 1 to 68 | needs a US$15-20 factory quote; carton est. |
| 5 | XXL orthopaedic bolster bed (A$69) | 5.65 / 13.79 / 22.12 | 1 / 2 / 3 | **28** | 6 to 66 | 2L price unpublished; roll-pack carton est. |
| 6 | 80 cm 8-panel playpen (A$75) | 8.37 / 12.44 / 20.51 | 1 / 2 / 3 | **25** | 8 to 62 | 32in price not listed; carton stated |
| 7 | 2x2 m beach cabana (A$49, MOQ 500) | -0.99 / 3.01 / 3.01 | 0.5 / 1.5 / 2.5 | **5** | about 0 to 8 | Kmart own-brand A$49-69 |
| 8 | 20 kg weighted vest (A$47) | -2.28 / -2.28 / 2.60 | 1 / 2 / 3 | **-5** | -2 to 8 | Kmart Anko 9-18 kg A$59; Amazon A$52.49 |
| 9 | Cat tree 150 cm (A$65) | -19.66 / -19.66 / -11.52 | 1 / 2 / 3 | **-39** | loss (−12 to −20 a sale) | Kmart A$71; cube |

How each low / base / high net is defined:
- **Raised bed:** Dongyisheng US$34 / Haotai midpoint US$23.84 / Haotai US$22.45, all at A$99.
- **Ninja course:** A$79 / A$89 / A$89 at US$25.
- **Hammock:** A$69 (if the Bunnings kit includes a stand) / A$85 / A$90.
- **Crate:** 48" at the trader's US$28.50 / 48" at US$20 / 42" at US$15.
- **XXL bed:** 2L at US$25 / US$20 / US$14.89.
- **Playpen:** US$22.50 / US$20 / US$17.50 at A$79.
- **Cabana:** A$45 / A$49.
- **Vest:** US$18 / US$18 / US$15 at A$47.
- **Cat tree:** US$25 / US$25 / US$20 at A$65.

### Inferences
- **A portfolio reaches about 10 sales a week only at a scale far from "low-capital".** Six SKUs, 200 units each — hammock, raised bed, ninja course, crate, XXL bed and playpen — add up at mid volumes to about 10.5 sales and **A$213 of profit a week**. That needs **A$66.7k up front** (FOB + freight + inspection + import GST) and about **68 m³ of stock**, roughly two to three single garages. At 10.5 a week, the 1,200 units take about 114 weeks to clear. My arithmetic, using Q4's costs.
- **The cash cycle is the hidden cost even for one SKU.** At mid volume, a 200-unit order takes 100–133 weeks to sell. The up-front cash comes back only after 116–165 units are sold (Q4), so a A$10–13k order is recovered in about 70–90 weeks.
- **On evidence quality, the hammock is the most defensible first SKU.** The raised bed and ninja course are the highest-ranked but need three checks before they can be ranked honestly:
  - an Amazon AU, Bunnings and Aldi price check on the exact size
  - a size-specific RFQ
  - a stated per-set carton

### Gaps
- Volume rules are assumptions. A 2× change in volume moves every weekly figure 2× and can reorder ranks 1–6, which sit within about A$27 of each other.
- Storage, insurance, samples and time are excluded (Q4).

## Q7. What the research can and cannot prove about "10 a week"

### Takeaway
**It cannot prove that any product sells 10 a week from one account in one city.** No source measures Marketplace sell-through for new goods, and nothing found lands at A$10–30 and sells new at A$60–120 within the floor rules. **What it can show:**
- The realistic version of the idea earns about **A$6–38 a sale**.
- One SKU plausibly moves **0.5–3 a week**, which is an estimate.
- Reaching about 10 a week needs about six SKUs and **about A$67k of stock**, earning about A$200 a week.

### Cited Findings
- Meta publishes no Australian Marketplace category or sales data. Marketplace search needs a login, and no sold prices or days-to-sell were obtainable in the earlier rounds ([marketplace_demand_au.md](/home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/marketplace_demand_au.md)).
- This session: Gumtree returned 403 (robots.txt request); Facebook robots.txt disallows non-listed agents; no Australian Reddit or OzBargain account of weekly volumes for imported new stock was found. One Reddit-mirror anecdote (103 items sold, 3.6-day average) names no platform or country ([search result](https://reddit.sentinel-team.org/posts/1q1hp3w/snapshots/2026-01-02T23%3A21%3A09.49167Z)).
- No official listing or relisting cap exists, but duplicate parallel listings are discouraged ([Vendoo](https://blog.vendoo.co/facebook-marketplace-delete-and-relist)). Meta frames Marketplace as consumer-to-consumer and has suspended business sellers in some regions ([earlier report](/home/user/ClaudeCloud/reports/Marketplace import arbitrage Australia.md)).
- The only detailed Australian first-hand account found in earlier rounds (OzBargain, April 2026) reported more than A$6,000 of losses and concluded that competing on price against cheap imports was not viable ([earlier report](/home/user/ClaudeCloud/reports/Marketplace import arbitrage Australia.md)).

### Inferences
- **What "10 a week" means in money:** at the modelled A$6–38 net (about A$20 a sale averaged across the six-SKU mix), 10 sales a week is about A$200 a week, within a range of roughly A$60–380. That is before time (about 10 hand-overs plus messaging), fuel, no-shows, storage and liability insurance. It is not A$500–900 a week, which is what A$50–90 a sale would imply.
- **What would prove or disprove it cheaply** (inference):
  - Buy one or two paid samples of the top candidate (US$30–60 each, per the hammock note).
  - List one unit on Marketplace at the target price in the target city for 2–4 weeks.
  - Count genuine enquiries and completed sales.
  - Commit A$10k+ only if that test shows 2 or more sales a week. Without such a test, any "10 a week" claim is an assumption.
- **Structural reasons the original framing fails:**
  1. The fixed charges of a small LCL order (A$1,300) plus A$5 handling push every 50–200-unit order above A$30 a unit unless FOB is US$2–10 in a tiny carton (Q0).
  2. Kmart, Anko, Bunnings Marketplace and Amazon generics already sell those tiny, cheap goods at A$12–59 (Q1).
  3. The goods that do sell new at A$60–120 without a brand are bulky. They land at A$47–84 and are capped by Kmart, Harvey Norman, Bunnings Marketplace or Crazy Sales listings (Q2–Q4).

### Gaps
- Real sell-through for any of the six shortlisted products in any Australian city is unknown. Only a live listing test or first-hand seller data could answer it.
- Meta's current Terms on account sharing and the minimum seller age could not be read this session (Facebook robots.txt), so the adult-account arrangement remains a compliance question for the user.
