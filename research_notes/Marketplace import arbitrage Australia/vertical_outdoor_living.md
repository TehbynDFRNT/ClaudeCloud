# Vertical: Outdoor living (patio furniture, outdoor cooking, shade): per-SKU import arbitrage from Chinese factories to new-item sales on Facebook Marketplace (AU)

*Researched 9 Oct 2026. All retail prices were observed on 9 Oct 2026 unless another date is given.*

**Sources and how they were used**
- **Amazon AU:** search pages reached from this environment only show listings that ship internationally. Australian-warehoused floors (Gardeon, Costway, ALFORDSON, Livsip) therefore come from Amazon AU Best Sellers pages. These show the lowest current offer, not the delivery fee.
- **Bunnings, Costway and Crazy Sales:** taken from PriceHipster, an Australian price-comparison site that indexes retailer feeds. Crazy Sales sells the Dropshipzone house brand Gardeon.
- **Blocked sites:** Kmart, Bunnings, Big W, Kogan, eBay AU, Gumtree, Catch, MyDeal and BuyWisely blocked direct fetches (403 or Cloudflare). Temu renders by JavaScript only.
- **Search-only evidence:** the shared WebSearch budget ran out mid-task. Kmart figures therefore come only from earlier search summaries, labelled "via search summary".
- **Factory listings:** from Made-in-China.com (MIC) search and detail pages. Alibaba search pages are JavaScript-rendered and could not be parsed.
- **Shared assumptions:** freight, destination and fee assumptions are aligned with the parallel landed-cost notes, and the original sources are linked. Figures produced by the model in this file are labelled as model output or assumption.

## Q1. Per-SKU unit economics, verdict scores and ranking (the objective)

### Takeaway
At today's peak-season freight, very few outdoor-living SKUs clear a profit when sold new on Marketplace below the cheapest Australian online or big-box price. Bunnings' house brands (Marquee, Jumbuck, Mimosa), Gardeon/Dropshipzone and Costway already sell at or below what a small importer can land.

Only five SKUs show positive gross profit, and only with consolidated FCL freight, the cheapest audited factories and strict pricing:
- wood/pellet pizza ovens
- hammocks with stands
- collapsible egg chairs
- steel fire-pit tables
- 3×3 m gazebos

Even then, margins are about AUD 20–45 a unit (18–40%) at full-container freight, and about AUD 0–25 on a first LCL order.

Big flat-pack furniture fails without an unusually cheap, verified knock-down (KD) spec. This includes 4-piece rattan sets, dining sets, swings, loungers and deck boxes. All gas appliances fail on certification cost and lead time.

### Cited Findings

**Exchange rate and freight inputs (dated)**
- **AUD/USD:** 0.69280 on 1 Oct 2026, so USD 1 = AUD 1.4434. The 2026 range was 0.6676 (1 Jan) to 0.7260 (13 May). — [exchange-rates.org](https://www.exchange-rates.org/exchange-rate-history/aud-usd-2026-10-01)
- **Ocean freight, China to SYD/MEL/BNE (USD, ex destination charges):**
  - 40 ft "as quoted" rates were USD 4,600–4,750 in September 2026 (4 quotes, Shekou).
  - August 2026 ran USD 3,850–4,800, May 2026 USD 2,700–2,850.
  - 20GP ran USD 1,450–2,400 and 40ft/40HQ USD 2,850–4,750 across Jan–Sep 2026 (29 quotes each).
  - — [GoodHope Freight dated log](https://goodhopefreight.com/shipping-to-australia/2026-freight.html)
- **KLN September 2026 outlook (published 24 Aug 2026):**
  - GRIs of about USD 500/TEU from 1 Sep and another USD 500/TEU from 15 Sep, about USD 2,000 per 40 ft combined.
  - "LCL rates have remained stable throughout the Q3 peak".
  - "Rates are indicative." — [KLN](https://info.oceania.kln.com/customer-advisory/fcl-shipping-rates-from-china-to-australia-september-2026-outlook)
- **Other 40 ft ranges:** USD 2,900–3,600 for 2026, and LCL USD 60–280/CBM. — [ExFreight](https://www.exfreight.com/shipping-from-china-to-australia/)
- **Destination charges (taken from the parallel landed-cost notes; primary sources linked):**
  - Maersk destination THC (DHC) at Sydney from 1 Oct 2026: AUD 600 per 20' and AUD 855 per 40'. — [Maersk](https://www.maersk.com/news/articles/2026/09/01/maersk-terminal-handling-service-australia)
  - ABF Import Processing Charge: AUD 50 for consignments under AUD 10k, AUD 152 at AUD 10k and above. — [ABF](https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/cost-of-importing-goods/charges/import-processing-charge)
  - DAFF biosecurity charge on the Full Import Declaration: AUD 71 (sea) from 1 Jul 2026. — [ACN 2026/23](https://www.abf.gov.au/help-and-support-subsite/CustomsNotices/2026-23.pdf)
- **Pre-shipment inspection:** V-Trust charges an all-inclusive USD 268 per man-day. — [V-Trust](https://www.v-trust.com/en/our-services/quality-control/pre-shipment-inspection-service-in-china-india-vietnam-malaysia-thailand-bangladesh-pakistan-indonesia-cambodia)
- **Storage:** a 3×7 m self-storage unit averages AUD 273/month at independents and AUD 389/month at chains. Sydney is more than AUD 800/month for a garage-size space. — [Inside Self Storage (SpaceOut survey)](https://www.insideselfstorage.com/self-storage-industry-news/spaceout-conducts-survey-of-australia-self-storage-prices-reveals-results)
- **Marketplace fees:** local-pickup Marketplace sales carry no fee. Guides disagree on shipped checkout orders, quoting 5% or 10%. — [SaleHoo](https://www.salehoo.com/learn/facebook-marketplace-dropshipping); [Voolist](https://www.voolist.com/blog/facebook-marketplace-fees-2026)
- **Duty:** ChAFTA eliminated Australian tariffs on Chinese goods ("100 per cent tariff elimination on 1 January 2019"). The preference needs a valid Certificate of Origin; without one, the general rate applies, commonly 5% for these headings. — [DFAT ChAFTA guide](https://www.dfat.gov.au/trade/agreements/in-force/chafta/doing-business-with-china/guide-to-using-chafta-to-export-or-import)
- **HS codes printed on supplier listings:**
  - 7321190000 for pizza ovens (Otia, Eto)
  - 7321890000 for fire pits and kettles (Tuoshenghe; Guanrun lists 73218900)
  - 9401719000/9401790000 for outdoor seats (Kingwell, Max Garden, Ido)
  - 9403200000 for metal tables (Zhen Cheng)
  - 6601100000 for umbrellas (Kingwell)
  - 6306120000 for gazebos (Unitent)
  - 6306992000 for hammocks (Ningbo Lounger)
  - Sources: the factory listings cited in Q3.

**Price to beat, per SKU (cheapest comparable new item found; Amazon AU first where retrievable)**

1. **PE-rattan 4-piece lounge set** (loveseat + 2 armchairs + glass-top table, cushions, steel or aluminium frame)
   - Amazon AU floor (cheapest verified "4pc wicker sofa set"): ALFORDSON 4pc Wicker Sofa Set, PE rattan, AUD 329.95, #9 in Garden Furniture Sets. — [Amazon AU](https://www.amazon.com.au/dp/B0F4K8JR58); [Best Sellers list](https://www.amazon.com.au/gp/bestsellers/garden/5737260051)
   - Lower but with unverified spec: Costway 4-piece conversation set with tempered-glass table AUD 189.95 ([Amazon AU](https://www.amazon.com.au/dp/B0GTSK3FSR)). Gardeon 4-piece set in textilene, not wicker, AUD 183.95 ([Amazon AU](https://www.amazon.com.au/dp/B0FD9HTZ1H)).
   - Bunnings: Hartman 4 Piece Manhattan Lounge Set AUD 279 ([PriceHipster](https://pricehipster.com/product/AZnmNvlAcAOYx79jpJhm0A)). Marquee 4 Piece Soho AUD 489 ([PriceHipster](https://pricehipster.com/product/AZHmoWkTcACWXWPp-mLbkg)).
   - Gardeon via Crazy Sales: 4-seater wicker set AUD 254.95 ([PriceHipster](https://pricehipster.com/product/AZu5TQsqcAyayk2S1iKN4w)) and AUD 244.95 ([PriceHipster](https://pricehipster.com/product/AZu5TQmccE2dtEYW-g-Zuw)). Costway PE rattan sofa set AUD 259.95 ([PriceHipster](https://pricehipster.com/product/AZu55mZ8cF68A_5EDvucuA)).
   - Kmart:
     - Rimini 4 Piece Modular Lounger AUD 149 on clearance (was AUD 329). It incurs a delivery fee. ([Kmart](https://www.kmart.com.au/product/rimini-4-piece-modular-lounger-43162147), via search summary)
     - The Gardeon 4-piece set on Kmart Marketplace was AUD 472.56 plus AUD 101.97 delivery (13 Jul 2026). ([BuyWisely](https://buywisely.com.au/product/gardeon-outdoor-furniture-sofa-set-4-seater-wicker-lounge-setting-table), via search summary)
   - Brand-new classifieds: Gardeon 4-piece AUD 329–716 "delivery only… 2–8 business days" ([Gumtree](https://www.gumtree.com.au/s-garden/4+piece+wicker+outdoor+lounge+setting/k0c18398)). FB Melbourne "from $399" ([FB](https://www.facebook.com/marketplace/melbourne/rattan-garden-furniture/)). Both are from the parallel demand notes.
2. **Aluminium dining** (in this price band, effectively a 3-piece bistro set)
   - Amazon AU: vidaXL 3-piece cast-aluminium bistro AUD 176.99 ([Amazon AU](https://www.amazon.com.au/dp/B0DDDXWTP8)). Livsip 3-piece cast-aluminium bistro AUD 188.91, #1 in Garden Furniture Sets ([Amazon AU](https://www.amazon.com.au/dp/B0CD27KD2V)).
   - Larger sets: ALFORDSON 5-piece metal dining AUD 219.95 ([Amazon AU](https://www.amazon.com.au/dp/B0HCZ5MZ1F)); ALFORDSON 7-piece AUD 299.95 ([Amazon AU](https://www.amazon.com.au/dp/B0GT9178RJ)); Gardeon 7-piece aluminium AUD 659.95 ([Amazon AU](https://www.amazon.com.au/dp/B0F93DPSPC)).
   - Bunnings Marquee 7 Piece Dining Setting AUD 349 ([PriceHipster](https://pricehipster.com/product/AZDqSAEEcACp7S9TeLWqXg)).
3. **Hanging egg chair with stand**
   - Amazon AU: not retrieved. Page 1 of Hammocks & Swing Chairs hit a bot challenge three times and was not retried further.
   - Bunnings Marquee Collapsible Hanging Egg Chair AUD 199 ([PriceHipster](https://pricehipster.com/product/AZHwrHHrcACyGnl5ivPhig)). The NZ listing says the seat folds flat and it has a "large cross base frame" ([Bunnings NZ](https://www.bunnings.co.nz/marquee-collapsible-hanging-egg-chair_p0577555), via search summary). Marquee Apollo AUD 349 ([PriceHipster](https://pricehipster.com/product/AZFgvAW4cACjvu7gtO2NSA)).
   - Gardeon egg chair with pod stand via Crazy Sales: AUD 214.95–239.95 ([PriceHipster](https://pricehipster.com/product/AZu5TQz_cBuR4MjAM6D-Tw); [PriceHipster](https://pricehipster.com/product/AZu5TVeYcEKx9ZRjKIRWkg)).
   - Kmart: the Gardeon egg chair on Kmart Marketplace (seller Aisle Six) is AUD 309.95 ([Kmart](https://www.kmart.com.au/product/gardeon-outdoor-egg-swing-chair-wicker-rattan-furniture-pod-stand-cushion-black-110065413), via search summary). An undated article cites a Kmart woven egg chair at AUD 249 ([Yahoo](https://au.news.yahoo.com/kmart-aldi-outdoor-egg-chair-sold-out-001746453.html)).
   - Gumtree brand-new: AUD 199–477, with Gardeon at AUD 477 listed identically in many cities ([Gumtree](https://www.gumtree.com.au/s-garden/hanging+egg+chair/k0c18398), from the demand notes).
4. **Sun lounger** (folding or adjustable, single)
   - Amazon AU: Gardeon Sun Lounge Adjustable Recliner AUD 80.95, #6 in Patio Seating ([Amazon AU](https://www.amazon.com.au/dp/B0F8GN1ZSQ)). Gardeon PP lounger AUD 87.95 ([Amazon AU](https://www.amazon.com.au/dp/B0F8GKT925)).
   - Bunnings Marquee Sling Sun Lounger AUD 99 ([PriceHipster](https://pricehipster.com/product/AZnmNvlAcAWatt68xj70_Q)).
   - **Daybed:** Gardeon wicker day-bed lounger AUD 165.95 on Amazon AU ([Amazon AU](https://www.amazon.com.au/dp/B07JCRQQXV)), and AUD 159.95 via Crazy Sales ([PriceHipster](https://pricehipster.com/product/AZu5TRemcC2QuiNrsMHupg)).
5. **Double hammock with steel stand**
   - Costway portable hammock with stand AUD 105.95 ([PriceHipster](https://pricehipster.com/product/AZ5tnapOcACzYldIydzs9A)). Gardeon hammock bed with stand AUD 124.95 via Crazy Sales ([PriceHipster](https://pricehipster.com/product/AZu5TRY3cACt67zaijCqCg)).
   - Amazon AU hammock + stand sets: Tranquillo with stand AUD 249.99 ([Amazon AU](https://www.amazon.com.au/dp/B0CB3TRDZH)); Gardeon hammock bed with wooden stand AUD 234.95 ([Amazon AU](https://www.amazon.com.au/dp/B0CYNL68Z3)).
   - Stand only: SELFLA AUD 99.99, #1 in Hammock Stands ([Amazon AU](https://www.amazon.com.au/dp/B0CYT15NMD)); Gardeon AUD 70.95–119.95 ([list](https://www.amazon.com.au/gp/bestsellers/garden/220198898051)). Kmart Marketplace Gardeon hammock bed stand AUD 109.95 ([Kmart](https://www.kmart.com.au/product/gardeon-hammock-bed-stand-steel-frame-outdoor-indoor-black-110004187/), via search summary).
6. **Outdoor bean bag**
   - Bunnings Mojo outdoor bean bag cover AUD 69 ([PriceHipster](https://pricehipster.com/product/AZb9l0wtcACBimLyBl_rXw)). Outdoor bean bag cover (no filler) via Crazy Sales AUD 59.95 ([PriceHipster](https://pricehipster.com/product/AZ5T6FWecAy4YciI80frbQ)).
   - Amazon AU AU-local floor: not retrieved.
7. **12-inch portable wood/pellet pizza oven** (folding legs, stone)
   - Costway Outdoor Wood Fired Pizza Maker AUD 149.95 ([PriceHipster](https://pricehipster.com/product/AZu55mU_cBOpd9trvM2scA)). Costway freestanding wood-fired pizza stove AUD 135.95 ([PriceHipster](https://pricehipster.com/product/AaAjWj7bcBSzdr6XWh-ODw)).
   - Bunnings: Jumbuck Portable Pizza Oven AUD 199 ([PriceHipster](https://pricehipster.com/product/AYmXxVO1cACyaWevqLucQg)); Jumbuck Torino Woodfire AUD 199 ([PriceHipster](https://pricehipster.com/product/AWWI8ptVcACo5qJk5Y-GJg)).
   - 12" wood-pellet/charcoal oven via Crazy Sales AUD 259.96 ([PriceHipster](https://pricehipster.com/product/AZu5TUkmcFy6-u62KDLuJQ)).
   - Aldi: past Special Buy woodfire pizza oven AUD 199, likely 2023 ([CHOICE](https://accounts.choice.com.au/?p=766983), via search summary). Aldi's Special Buys for 7–21 Oct 2026 list no pizza ovens ([Aldi](https://www.aldi.com.au/special-buys)).
   - Amazon AU: no pizza-oven Best Sellers node found (gap).
8. **12–13-inch portable gas pizza oven**
   - Bunnings COZZE 13" AUD 259 ([PriceHipster](https://pricehipster.com/product/AZ1pSAU3cACHkkeCMXX19Q)). Jumbuck Ascent AUD 364 ([PriceHipster](https://pricehipster.com/product/AYT3kBqBcACt-_slYJeSeQ)).
   - GiftBox 12" auto-rotate AUD 349.99 ([PriceHipster](https://pricehipster.com/product/AZ3sHwdIcEaZVwVyxmXkKQ)).
9. **57 cm (22-inch) charcoal kettle BBQ**
   - Bunnings: Jumbuck 57cm Medina AUD 74.98 ([PriceHipster](https://pricehipster.com/product/AYqt6YwAcACm4jDJnb1pCA)); Jumbuck 57cm Easygrill AUD 75, was AUD 139 ([PriceHipster](https://pricehipster.com/product/AZ9sZAwWcACzr7_SwsZkhQ)).
   - Amazon AU: 17" kettle with wheels AUD 89.50, #4 in Freestanding BBQs ([Amazon AU](https://www.amazon.com.au/dp/B0GKGDJW5Y)). Weber Original Kettle 22" AUD 299 ([Amazon AU](https://www.amazon.com.au/dp/B00004RALU)).
   - Aldi Coolabah Kamado Ceramic BBQ AUD 149, "While Stocks Last" ([Aldi](https://www.aldi.com.au/product/coolabah-kamado-ceramic-bbq-000000000000739177)).
10. **4-burner hooded gas BBQ**
    - Bunnings Jumbuck 4 Burner Portland Hooded AUD 229 ([PriceHipster](https://pricehipster.com/product/AZD0lYLScACuLfj2AtV3Fw)). Jumbuck 4 Burner Delta Flat AUD 199 ([PriceHipster](https://pricehipster.com/product/AZFblFvNcAC56Usqz11rcQ)).
    - Amazon AU: the top-30 freestanding BBQs include no generic 4-burner. The cheapest gas model is a Weber Baby Q at AUD 389 ([Amazon AU](https://www.amazon.com.au/dp/B0CKQHT29V)).
11. **Steel fire-pit table, 3-in-1** (grill, lid, tabletop)
    - Amazon AU #1 in Fire Pits: "60cm Round Fire Pit with Grill Wooden Tabletop 3 in 1", AUD 199.99, 367 ratings ([Amazon AU](https://www.amazon.com.au/dp/B0H44MPFJ2)). Grillz 26" square AUD 79.95 ([Amazon AU](https://www.amazon.com.au/dp/B0776TBC7B)).
    - Grillz Fire Pit BBQ Grill 2-in-1 Table AUD 144.95 via Crazy Sales ([PriceHipster](https://pricehipster.com/product/AZu5TQ8hcAWKYzLf0Szs9A)).
    - Bunnings: Fraser steel fire pit with outdoor table AUD 119, was AUD 169 ([PriceHipster](https://pricehipster.com/product/AZ0hNXGIcAC7zmpn9LP05A)); Glow Canyon AUD 79 ([PriceHipster](https://pricehipster.com/product/AZzoX0XIcACuL2rcxrfrlg)).
    - Kmart folding Firepit AUD 49 ([Kmart](https://www.kmart.com.au/product/firepit-43627714/), via search summary).
12. **19–20-inch double-wall stainless smokeless fire pit**
    - Amazon AU: Havana Outdoors Noke Smokeless (stainless) AUD 139.95, #8 in Fire Pits ([Amazon AU](https://www.amazon.com.au/dp/B0DCB9S6SP)); unho 20" AUD 159.99 ([Amazon AU](https://www.amazon.com.au/dp/B0FSWXN3NC)); OutVue 19.5" AUD 269 ([Amazon AU](https://www.amazon.com.au/dp/B0CJY16VKS)).
    - Kmart Marketplace AUSWAY smokeless stove AUD 339.95 ([Kmart](https://www.kmart.com.au/product/ausway-large-campfire-stove-fire-pit-smokeless-wood-burning-heater-fireplace-110156417/), via search summary).
    - Bunnings Mimosa Low Smoke 450 mm AUD 99, was AUD 149 ([PriceHipster](https://pricehipster.com/product/AZ3Azu0AcAGIIi-AULDThQ)).
13. **Gas patio heater**
    - Bunnings: Mimosa Lava AUD 160, was AUD 199 ([PriceHipster](https://pricehipster.com/product/AY2yGIhkcACS3zG-0HGI-Q)); Jumbuck AUD 179 ([PriceHipster](https://pricehipster.com/product/AWSIoUVZcAC2K0ajhAcRqw)).
    - Amazon AU: the Outdoor Heaters top 30 contains no gas units, only electric or solar ([list](https://www.amazon.com.au/gp/bestsellers/garden/5707576051)).
14. **3 m cantilever umbrella**
    - Bunnings Marquee 3m Charcoal Cantilever AUD 89 ([PriceHipster](https://pricehipster.com/product/AVnUwgV4cACTeR3xdngLZw)). Costway 3m cantilever AUD 99.95 ([PriceHipster](https://pricehipster.com/product/AaCADR5xcASYNYaQ7gMjvw)).
    - Solar-LED version: Costway 3M Solar LED AUD 165.95 on Amazon AU, #2 in Umbrellas & Shade ([Amazon AU](https://www.amazon.com.au/dp/B0F2DM9NTC)), and AUD 153.95 direct ([PriceHipster](https://pricehipster.com/product/AZu55mZ7cH6OvJFdF5KnxQ)).
15. **Shade sail**
    - Bunnings Marquee 3×3×3 m triangle AUD 39 ([PriceHipster](https://pricehipster.com/product/AZ5WJNebcACd7UcPr0lmJg)).
    - Amazon AU: Instahut 5×6 m AUD 98.95 ([Amazon AU](https://www.amazon.com.au/dp/B07MYBGX96)).
16. **Deck box, 270–290 L**
    - Amazon AU #1 in Patio Seating: Gardeon 270L AUD 104.95, 173 ratings ([Amazon AU](https://www.amazon.com.au/dp/B08KFXYN84)).
    - Gardeon 290L via Crazy Sales AUD 79.95 ([PriceHipster](https://pricehipster.com/product/AZu5TQmbcIyGk7bhwHwq9w)).
    - Bunnings: Keter 270L AUD 97 ([PriceHipster](https://pricehipster.com/product/AaDzf6LTcACQtgxivYyWaA)); Marquee 109L AUD 55 ([PriceHipster](https://pricehipster.com/product/AaCHv08scACgbdd1IAPf4g)).
17. **Outdoor PP rug**
    - Aldi Kirkton House Outdoor Rug XL, 120×180 cm, AUD 17.99 ([Aldi](https://www.aldi.com.au/product/kirkton-house-outdoor-rug-xl-000000000721966001)).
    - Amazon AU: MOKANI 150×240 cm AUD 43.99, 2,695 ratings ([Amazon AU](https://www.amazon.com.au/dp/B0BX6GD2NW)); LinTimes 180×270 cm AUD 59.99 ([Amazon AU](https://www.amazon.com.au/dp/B0FLXDD258)); [list](https://www.amazon.com.au/gp/bestsellers/garden/14652554051).
18. **Added SKU: 3×3 m pop-up gazebo with side walls**
    - Amazon AU: Instahut 3×3 AUD 98.95 ([Amazon AU](https://www.amazon.com.au/dp/B0777CQBDZ)); Costway 3×3 with 4 sidewalls AUD 135.95 ([Amazon AU](https://www.amazon.com.au/dp/B0HG18DTTZ)); CROWN SHADES 3×3 AUD 179.99, 4,847 ratings ([Amazon AU](https://www.amazon.com.au/dp/B09KLVB9X7)).
    - OGL 3×3 via Crazy Sales AUD 69.88 ([PriceHipster](https://pricehipster.com/product/AZu5TQmecCylSUavF95L1g)).
    - Gumtree brand-new 3×3: AUD 139–393 ([Gumtree](https://www.gumtree.com.au/s-3x3+marquee+pop+up+gazebo+white/k0), from the demand notes).
19. **Added SKU: HDPE Adirondack chair**
    - Costway folding HDPE AUD 148.95 on Amazon AU ([Amazon AU](https://www.amazon.com.au/dp/B0B18NCGSX)) and AUD 140.95 direct ([PriceHipster](https://pricehipster.com/product/AZu55mZ6cFWLZlroy0BZvw)).
    - Bunnings Keter Troy AUD 189 ([PriceHipster](https://pricehipster.com/product/AZJX8wt4cACLhb3nq7Gfqw)).
20. **Added SKU: 3-seater swing chair with canopy**
    - 3-seater swing with canopy via Crazy Sales AUD 134.95 ([PriceHipster](https://pricehipster.com/product/AZu5TTdlcBKCvbde6NT-nA)).
    - Costway 3-Seat Patio Swing AUD 179.95 on Amazon AU ([Amazon AU](https://www.amazon.com.au/dp/B0HFBV9YRH)).
    - Bunnings Marquee Lava 3 Seater AUD 269 ([PriceHipster](https://pricehipster.com/product/AXTT0K_kcACtfpur1DaHVQ)).

### Inferences

**Model assumptions (all labelled; same method for every SKU)**
- **FX:** USD 1 = AUD 1.4434 (1 Oct 2026). Sensitivity covers AUD/USD 0.66–0.72.
- **Freight, door-delivered ex GST, AUD per CBM:**
  - **40HQ:** about AUD 145/CBM. Ocean USD 4,600 (Sep 2026 quotes), AUD 2,950 destination costs, ÷ 66 usable CBM.
    - The destination costs are DHC 855, landside 235, VBS 50, side-loader 100, delivery order 175 (assumed), metro cartage 950 (assumed), broker 350 (assumed), IPC 152 and FID charge 71.
    - 66 usable CBM is an industry rule of thumb, not sourced.
  - **20GP:** about AUD 211/CBM (USD 2,300 ocean, AUD 2,600 destination, ÷ 28 CBM).
  - **LCL of about 10–15 CBM:** AUD 300/CBM. This is consistent with the landed-cost notes' worked example of about AUD 290/CBM.
  - **Small LCL of 3–8 CBM:** AUD 450/CBM (assumption: fixed fees and minimums dominate).
  - **Sensitivity:** ±50% on the freight rate. −50% roughly equals the May 2026 ocean level or a post-CNY window.
- **Duty:** 0% with a ChAFTA Certificate of Origin. 5% is shown as a sensitivity.
- **Fixed costs per order:** one inspection (AUD 387, i.e. USD 268) plus AUD 300 for samples and courier (assumption).
- **Allowances:**
  - 1.5% of FOB for marine insurance and bank/FX fees (assumption).
  - 3% defect/damage allowance on goods plus freight.
  - Storage at AUD 11/CBM/month for 3 months. That is AUD 389/month for a 21 m² unit, assumed to hold about 35 CBM usable.
  - Gas certification at AUD 25,000 per model, amortised over the first order (**assumption: no published fee found**).
- **Tax and revenue:**
  - Import GST is reclaimed. Net revenue = price ÷ 1.1.
  - The cash figure includes the import GST paid upfront and reclaimed later.
  - No Marketplace fee (pickup) and no paid boosts.
- **Payback units** = cash for the first order ÷ net revenue per unit, i.e. units you must sell to recover all cash.
- **Target price:** 10–20% under the cheapest comparable Amazon AU listing where retrieved, and at or below the Bunnings, Kmart or Gardeon floor. Where Amazon AU was not retrievable, the target is set about 10% under the lowest Bunnings, Costway or Gardeon price.

**Model output, first realistic order (AUD per unit unless stated)**

| # | SKU / spec | Target price (vs floor) | FOB used (supplier, MOQ) | CBM/unit (source) | 1st order (mode) | Landed/unit | Net rev ex GST | GP/unit (GP %) | GP/unit at consolidated 40HQ rate | Cash, 1st order | Payback units | Break-even sale price | Score /10 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Wood/pellet 12" pizza oven (painted-steel body, SS legs/door, folding) | $139 (Costway $149.95; Bunnings $199) | US$45 (Qingdao Otia, MOQ 100) | 0.078 (stated) | 100 u, small LCL | 114 | 126 | **12 (9%)** | 37 (29%) | $12.3k | 97 | $126 (FCL: $98) | **6** |
| 2 | Double hammock + folding steel stand | $95 (Costway $105.95; Gardeon $124.95) | US$24 (Ningbo Lounger US$20–21 MOQ 200; General Union US$20–26) | 0.061 stated; 0.07 used | 200 u, LCL | 64 | 86 | **23 (26%)** | 34 (39%) | $13.6k | 158 | $70 (FCL: $58) | **6** |
| 3 | Hanging egg chair + stand (collapsible PE-wicker basket) | $179 (Bunnings $199; Gardeon $214.95+) | US$50 (Fanpin US$48–50 MOQ 10; Kingwell US$53.99–55.99) | 0.30 est. (stated range 0.138–0.82) | 90 u, 20GP | 158 | 163 | **4 (3%)**; Fanpin US$37 MOQ 100 at ≤0.30 CBM: **24–53** | 25 (15%) | $15.2k | 93 | $174 (FCL: $152) | **5** |
| 4 | Steel fire-pit table 3-in-1 (grill, lid, tabletop) | $129 (Grillz 2-in-1 $144.95; Amazon #1 $199.99; Bunnings Fraser $119) | US$45 est. (Shandong HY US$36.80–43.80 + top/lid) | 0.12 est. | 100 u, LCL | 116 | 117 | **1 (1%)** | 21 (18%) | $12.4k | 106 | $127 (FCL: $106) | **4** |
| 5 | 3×3 m pop-up gazebo with walls | $115 (Amazon Costway w/4 walls $135.95; Instahut $98.95) | US$46 (ShunXin US$46–80 MOQ 10); Unitent US$33 w/ walls MOQ 100 | 0.07 est. (Unitent 0.055 stated) | 150 u, small LCL | 109 | 105 | **−4** | 18 (17%); Unitent at $99 in FCL: 29 | $17.5k | 168 | $120 (FCL: $95) | **4** |
| 6 | PE-rattan 4-pc lounge set, KD | $269 (Amazon ALFORDSON $329.95; Gardeon $244.95–254.95; Bunnings Hartman $279) | US$115 (GOOD SELLER US$108–115 MOQ 10; Ole US$120–180 MOQ 50) | 0.45 est. | 60 u, 20GP | 298 | 245 | **−53 (−22%)** | −23 | $19.1k | 78 | $328 (FCL: $294) | **3** |
| 7 | Smokeless double-wall fire pit 19–20" | $125 (Amazon Havana Noke $139.95; unho $159.99) | US$62 (Boke US$56–59 MOQ 300; Voda US$67–72) | 0.117 (stated, Boke) | 100 u, LCL | 141 | 114 | **−28** | −9 | $15.2k | 134 | $156 (FCL: $135) | **3** |
| 8 | 3 m cantilever umbrella + cross base | $79 (Bunnings Marquee $89; Costway $99.95) | US$38 (Ido US$27–37 MOQ 50; Xusheng US$30–40 MOQ 800) | 0.10 est. | 100 u, LCL | 98 | 72 | **−27** | −11 | $10.5k | 147 | $108 (FCL: $91) | **2** |
| 9 | HDPE Adirondack chair | $129 (Costway $140.95–148.95) | US$62 (Ido US$55.20–68.50; Boretech US$69–79) | 0.20 est. | 140 u, 20GP | 149 | 117 | **−31** | −18 | $22.4k | 191 | $163 | **2** |
| 10 | 3-seater swing with canopy | $125 (Crazy Sales $134.95) | US$66 (Ningbo Yilong, MOQ 200) | 0.28 est. | 230 u, 40HQ | 154 | 114 | **−40** | −40 | $38.0k | 334 | $169 | **2** |
| 11 | Gas pizza oven 12–13" | $219 (Bunnings COZZE $259) | US$50 (Hengfu US$47.50–49 MOQ 200) | 0.08 est. | 200 u, small LCL + AU$25k cert | 244 | 199 | **−44** | −19; 500 u in FCL: +58 | $50.5k | 254 | $268 | **2** |
| 12 | Outdoor rug PP 180×270 (out of band) | $49 (Amazon LinTimes $59.99; Aldi 120×180 $17.99) | US$8 (Little Dolphin US$2.98–12.98 MOQ 500) | 0.008 est. | 500 u, small LCL | 17 | 45 | 27 (61%) | 30 | $9.4k | 210 | $19 | **2** |
| 13 | Shade sail 3.6 m triangle (out of band) | $35 (Bunnings $39) | US$6 est. | 0.01 est. | 300 u, small LCL | 16 | 32 | 16 (49%) | 19 | $5.2k | 164 | $18 | **2** |
| 14 | Outdoor bean bag cover XL (out of band) | $59 (Crazy Sales $59.95; Bunnings $69) | US$20 (Starry Xiamen US$17.78–22.88 MOQ 100) | 0.02 est. | 200 u, small LCL | 44 | 54 | 10 (19%) | 16 | $9.4k | 175 | $48 | **2** |
| 15 | Deck box 270–290 L (flat-pack) | $72 (Gardeon 290L $79.95) | US$38 (Hangzhou Cheers US$34.20–41.80 MOQ 100) | 0.152 (stated) | 100 u, LCL | 116 | 65 | **−51** | −26 | $12.4k | 189 | $128 | **1** |
| 16 | 22" charcoal kettle BBQ | $69 (Bunnings Jumbuck $74.98) | US$42 (Hengfu US$39.89–42.89 MOQ 500; Tuoshenghe US$39–45 MOQ 50) | 0.108 (stated) | 100 u, LCL | 108 | 63 | **−45** | −28 | $11.6k | 184 | $119 | **1** |
| 17 | Aluminium 3-pc bistro set | $159 (vidaXL $176.99; Livsip $188.91) | US$110 est. (Kingwell US$79.99–299.99; Zhen Cheng from US$137.50 MOQ 30) | 0.35 est. | 40 u, LCL | 303 | 145 | **−158** | −102 | $13.0k | 90 | $333 | **1** |
| 18 | Aluminium flat-pack sun lounger | $79 (Amazon Gardeon $80.95; Bunnings $99) | US$65 (Onetime US$65–85 MOQ 1,000; Yocean US$65–120 MOQ 5) | 0.127 (stated) | 100 u, LCL | 148 | 72 | **−77** | −56 | $16.0k | 222 | $163 | **1** |
| 19 | 4-burner hooded gas BBQ | $199 (Bunnings Jumbuck $229) | US$128 (Hengfu US$126–130 MOQ 300) | 0.228 (stated) | 290 u, 40HQ + AU$25k cert | 323 | 181 | **−142** | −142 | $99.6k | 551 | $356 | **1** |
| 20 | Gas patio heater | $139 (Bunnings Mimosa $160) | US$60 (Sunbird US$60–70 MOQ 400) | 0.165 ("40HQ: 400 PCS") | 400 u, 40HQ + AU$25k cert | 186 | 126 | **−59** | −59 | $78.3k | 619 | $204 | **1** |
| — | Rattan/rope daybed | n/a | FOB US$330–920 (Foshan Sunward, Zhechengju, Yiran, Hongkai) | — | — | FOB alone > Gardeon day bed $159.95–165.95 | — | negative | — | — | — | — | **1** |

**Sensitivity of GP/unit (AUD) for the first order** (columns: base, freight −50%, freight +50%, AUD/USD 0.66, AUD/USD 0.72, CBM ×1.5, CBM ×0.7, 5% duty, 6 months storage, price −10%, price +10%)

| SKU | Base | Frt −50% | Frt +50% | FX 0.66 | FX 0.72 | CBM ×1.5 | CBM ×0.7 | Duty 5% | Storage 6 mo | Price −10% | Price +10% |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Pizza oven (pellet) | 12 | 30 | −7 | 9 | 14 | −8 | 24 | 9 | 9 | −1 | 25 |
| Hammock + stand | 23 | 34 | 12 | 21 | 24 | 11 | 30 | 21 | 20 | 14 | 31 |
| Egg chair (base US$50) | 4 | 37 | −28 | 1 | 7 | −33 | 27 | 1 | −5 | −12 | 21 |
| Fire-pit table | 1 | 20 | −17 | −2 | 4 | −19 | 14 | −2 | −2 | −10 | 13 |
| Gazebo (US$46) | −4 | 12 | −20 | −8 | −2 | −22 | 6 | −7 | −6 | −15 | 6 |
| 4-pc rattan (US$115) | −53 | −4 | −102 | −62 | −47 | −110 | −19 | −62 | −68 | −78 | −29 |
| Smokeless fire pit | −28 | −9 | −46 | −32 | −24 | −48 | −15 | −32 | −32 | −39 | −16 |
| Cantilever umbrella | −27 | −11 | −42 | −29 | −24 | −44 | −16 | −29 | −30 | −34 | −19 |

**Upside variants (model output; each needs factory verification)**
- **4-pc rattan at US$79 and 0.224 CBM** (Fanpin's stated listing; see the red flag in Q3):
  - GP AUD 45 (20%) at $249 on 120 sets in a 20GP.
  - GP AUD 73 (29%) at $279.
  - GP AUD 64 (28%) on 290 sets in a 40HQ (cash about $50.9k).
- **4-pc rattan at US$108 and 0.35 CBM** (GOOD SELLER): still −AUD 33 at $249.
- **Egg chair at Fanpin's US$37** (MOQ 100):
  - GP AUD 53 (32%) on a 100-unit LCL, if the carton really is about 0.138 CBM as on the sister listing.
  - GP AUD 24 (15%) at 0.30 CBM.
  - At Max Garden's stated 0.82 CBM carton, a non-collapsible basket loses AUD 81/unit even in a 40HQ.
- **Pizza oven:**
  - At $159: GP AUD 30 (21%) on a small LCL.
  - In a 40HQ consolidation of 300 units at $139: GP AUD 42 (33%).
  - Ningbo Eto's stainless oven at US$72.50 loses money at $169.
- **Hammock:** 500 units at the 40HQ rate gives GP AUD 36 (42%), cash about $27.2k.
- **Gas pizza oven:** turns positive only at about 500 units in FCL with certification at AUD 10–25k. That gives GP AUD 58–88, but cash of $60–75k, before any liability insurance.

**Ranking (attractiveness for a small importer selling new via Marketplace pickup, 2026–27)**
1. **Wood/pellet pizza oven, 6/10.**
   - For: compact (about 825 per 40HQ) and needs no gas certification if supplied wood/pellet-only. It is a summer and Christmas gift line, with a healthy margin at consolidated freight.
   - Against: Costway at $135.95–149.95 caps the price. It is light enough (11.3 kg, 0.078 CBM) for online sellers to ship cheaply, so pickup gives no edge. Thin margin on a small LCL.
2. **Hammock with steel stand, 6/10.**
   - For: cheapest landed cost of any band item (about $64), 26–42% GP, MOQ 200, low defect risk, small storage.
   - Against: moderate, seasonal demand. Gardeon and Costway sit at $105.95–129.96. The 116 cm carton exceeds Australia Post's 105 cm limit, which helps pickup slightly.
3. **Collapsible egg chair, 5/10.**
   - For: proven demand. Bulky (25–40 kg cartons), so pickup and same-day collection is a real edge over "delivery only, 2–8 days" Gardeon listings.
   - Against: the most saturated category. Bunnings' $199 collapsible model sets a hard ceiling. Margin exists only with the cheapest collapsible spec (Fanpin US$37), which needs a sample check.
4. **Steel fire-pit table 3-in-1, 4/10.** Margin only at FCL rates. Demand peaks in autumn/winter (counter-seasonal to summer furniture, which helps cash-flow smoothing). Bunnings ($79–119) and Grillz ($144.95) are strong anchors.
5. **3×3 gazebo with walls, 4/10.** Positive only at FCL with the cheap Ningbo Unitent spec. Heavily saturated (Instahut, OGL at $69.88, Bunnings Marquee at $68).
6. **PE-rattan 4-piece set, 3/10.** Strong spring/summer demand and the biggest pickup advantage: Kmart charged $101.97 delivery on a Gardeon set. But at realistic FOB (US$108–180) and KD CBM (0.35–0.45), landed cost is $259–298 against $245–279 floors. Viable only if a US$79 KD set at 0.22 CBM proves real. It also carries the heaviest storage burden.
7. **Smokeless stainless fire pit, 3/10.** Amazon AU already has stainless models at $139.95–159.99, and the FOB of US$56–72 is too high for a 10–20% undercut.
8. **Cantilever umbrella, 2/10.** Bunnings Marquee at $89 kills the plain spec. The LED spec is about break-even at $139 (FOB US$50, an estimate).
9. **Adirondack, swing, gas pizza oven, rug, shade sail and bean bag, 2/10.**
   - Adirondack and swing fail on landed cost versus Costway and Crazy Sales.
   - The gas pizza oven fails on certification.
   - Rug, shade sail and bean bag have fine percentage margins but sit below the AUD 100 band, and Aldi, Bunnings and Amazon floors are $18–69.
10. **Deck box, kettle BBQ, aluminium dining/bistro, sun lounger, daybed, gas BBQ and gas patio heater, 1/10.** Big-box and Dropshipzone floors sit below the landed cost. Gas items also need GTRC-scheme certification.

**Cross-cutting conclusions**
- Freight and volume decide the outcome more than FOB price. Moving from a first-order LCL (AUD 300/CBM) to a consolidated 40HQ (AUD 145/CBM) adds AUD 18–30/unit to every positive SKU.
- The practical route is a mixed 40HQ consolidation, for example pizza ovens, hammocks, collapsible egg chairs and fire-pit tables from Qingdao, Ningbo and Foshan suppliers via a consolidator. A single-SKU LCL gives away most of the margin.
- Even the best SKUs need 70–100% of the first order sold just to recover cash (payback units of 72–168 on orders of 90–200). This is weak for a seasonal category with storage costs.

### Gaps
- **Amazon AU floors not retrieved** for egg chairs, pizza ovens (wood and gas), bean bags and 3×3 m shade sails. Amazon AU search here only showed internationally deliverable listings, and Best Sellers pages were intermittently bot-challenged; retries were limited and no challenge was bypassed. The Amazon floors captured are from Best Sellers top 30–60 lists, so a cheaper comparable listing outside those lists may exist.
- **Amazon AU delivery fees** are not shown on Best Sellers pages and were not captured.
- **Kmart own-brand (Anko) floors** for egg chairs, pizza ovens, cantilever umbrellas, rugs, bean bags, loungers and storage boxes were not retrieved. The Kmart site returned 403 and the search budget ran out. Only the AUD 49 firepit, the Rimini set ($149 clearance) and Marketplace Gardeon listings were seen.
- **Big W, Temu AU, Kogan and eBay AU** floors were not retrieved (blocked, or JavaScript-only).
- **No sold-price or time-to-sell data** exists for Facebook Marketplace (needs login). Classifieds evidence is asking prices only, from the demand notes.
- **Gas certification cost and lead time** are an assumption of AUD 25k, with AUD 10–40k a plausible range. No certifier fee schedule was found.
- **Per-set carton CBM** for 4-piece rattan sets, aluminium bistro sets, swings, Adirondacks, cantilever umbrellas and fire-pit tables is estimated, because listings gave implausible or missing package data.
- **40HQ usable volume** (66 CBM) and the cartage, broker and delivery-order fees are rules of thumb, not sourced.
- **Tariff check pending:** general rates and any 2024 "nuisance tariff" abolition were not verified line by line for 9401.71/79, 9403.20, 7321.11/19/81/89, 6601.10, 6306.12/22/99, 3926.90 or 5702/5705.

## Q2. Which outdoor items sell fast new on Australian Marketplace in the spring/summer peak, what are the order lead times for the 2026–27 summer, and which are dominated by Kmart, Bunnings, Aldi, Big W, Temu or Gardeon (Dropshipzone)?

### Takeaway
Outdoor furniture, gazebos and BBQs are named fast movers, and Sep–Dec is the outdoor-furniture peak. But no Australian data measures how fast new items sell on Marketplace.

The categories with the clearest demand signals are also the most crowded:
- wicker lounge sets and egg chairs: Gardeon is listed identically in many cities
- pop-up gazebos: Instahut, OGL and Crowne Shades
- rugs, sails and fire pits: Bunnings, Aldi and Kmart house brands at $18–99

Timing is the other problem. A purchase order placed in mid-October 2026 lands around early-to-mid January 2027 at the earliest. That misses Black Friday and Christmas, catches only the late-summer tail, and runs into the Chinese New Year shutdown.

### Cited Findings
- **Fast movers:** Australian seller guidance repeatedly names furniture, kids' gear, gym equipment, outdoor/garden items and small appliances. The only time-to-sale figure found is an unsourced claim that correctly priced furniture sells in 24–48 hours. This is from the parallel demand notes, which cite seller guides; see that file.
- **Search interest:** Gumtree AU's most-searched items in October 2020 included outdoor furniture (COVID-era data). — [B&T](https://www.bandt.com.au/caravan-searches-spike-in-latest-gumtree-items-trends/)
- **Seasonal calendar:** Sep–Dec for outdoor furniture, gazebos, pools and evaporative coolers; November Black Friday is the biggest spike; June EOFY favours furniture. This is from the parallel demand notes, built from ABS/ARA seasonality and Gumtree data.
- **Saturation:** "Most saturated: mattresses, kids' ride-ons, egg chairs and wicker lounge sets, gas-lift beds, iSUPs". "Moderately saturated: … gazebos". Dropshipzone house brands (Gardeon for outdoor lounges and egg chairs) appear identically across cities on Gumtree and Marketplace. This is from the parallel demand notes, based on [Gumtree](https://www.gumtree.com.au/s-garden/4+piece+wicker+outdoor+lounge+setting/k0c18398) and [Gumtree egg chairs](https://www.gumtree.com.au/s-garden/hanging+egg+chair/k0c18398) listings.
- **Amazon AU Best Sellers rank and ratings (9 Oct 2026), a proxy for sell-through:**
  - Gardeon 270L storage box is #1 in Patio Seating with 173 ratings ([Amazon AU](https://www.amazon.com.au/gp/bestsellers/garden/10467674051)).
  - The 60cm 3-in-1 fire pit with tabletop is #1 in Fire Pits with 367 ratings ([Amazon AU](https://www.amazon.com.au/gp/bestsellers/garden/5707573051)).
  - CROWN SHADES 3×3 gazebo is #2 with 4,847 ratings ([Amazon AU](https://www.amazon.com.au/gp/bestsellers/garden/5737254051)).
  - MOKANI outdoor rug is #3 with 2,695 ratings ([Amazon AU](https://www.amazon.com.au/gp/bestsellers/garden/14652554051)).
  - Weber Original Kettle Premium has 12,498 ratings ([Amazon AU](https://www.amazon.com.au/gp/bestsellers/garden/5707628051)).
  - Costway 3M Solar LED cantilever is #2 in Umbrellas & Shade ([Amazon AU](https://www.amazon.com.au/gp/bestsellers/garden/5737271051)).
  - Gardeon, Costway, ALFORDSON and Livsip dominate Garden Furniture Sets ([Amazon AU](https://www.amazon.com.au/gp/bestsellers/garden/5737260051)).
- **Bunnings house-brand floors** (Marquee, Jumbuck, Mimosa; via PriceHipster, 9 Oct 2026; all URLs in Q1):
  - egg chair $199
  - cantilever umbrella $89
  - 57 cm kettle $74.98
  - 4-burner hooded gas BBQ $229
  - fire pits $79–119
  - gas patio heaters $160–179
  - shade sail $39
  - storage boxes $55–97
  - portable gazebo $68
  - pizza ovens $199
  - sun lounger $99
  - 3-seater swing $269
- **Aldi:**
  - Outdoor Rug XL $17.99 and Kamado BBQ $149 ("While Stocks Last") ([Aldi rug](https://www.aldi.com.au/product/kirkton-house-outdoor-rug-xl-000000000721966001); [Aldi kamado](https://www.aldi.com.au/product/coolabah-kamado-ceramic-bbq-000000000000739177)).
  - The Special Buys calendar for 7–21 Oct 2026 has gardening, appliances and Halloween themes but no outdoor furniture ([Aldi Special Buys](https://www.aldi.com.au/special-buys)).
  - A past woodfire pizza oven Special Buy was $199 ([CHOICE](https://accounts.choice.com.au/?p=766983), via search summary).
- **Kmart:**
  - Own folding firepit $49.
  - Marketplace third-party listings: Gardeon egg chair $309.95, Gardeon hammock stand $109.95, AUSWAY smokeless $339.95.
  - Kmart metro delivery is $10 (3–5 business days). Free delivery over $65 excludes "big and bulky items and Marketplace sellers' products" ([Kmart](https://www.kmart.com.au/product/firepit-43627714/), via search summary).
- **Production lead times stated on listings:**
  - "20GP & 40HQ (20~25 days)" — [Qingdao Zhen Cheng](https://zhencheng-furniture.en.made-in-china.com/product/qrFRfMKDXlhG/China-Modern-Furniture-Outdoor-Backyard-Patio-Garden-Slate-Grey-2-Piece-Square-Metal-Aluminum-Dining-Table-Set-with-2-Arm-Chairs.html)
  - "20GP & 40HQ (20~35 days)" — [Foshan Kingwell](https://kingwellfurniture.en.made-in-china.com/product/mOkTyCfGOgpA/China-Garden-Furniture-Patio-Hanging-Swing-Chair-Hammock-Metal-Rattan-Egg-Outdoor-Swing-with-Stand.html)
- **Transit times and booking pressure (KLN, via the landed-cost notes):**
  - Typical/worst-case days: Shanghai to Melbourne/Sydney 25/37, Ningbo 24/35, Shenzhen 23/34 (Shenzhen to Sydney worst case 30).
  - Typhoon season adds 3–5 days.
  - 40HC equipment is tightening, and the Christmas booking window was closing.
  - — [KLN Sept 2026 outlook](https://info.oceania.kln.com/customer-advisory/fcl-shipping-rates-from-china-to-australia-september-2026-outlook)

### Inferences
- **Timeline for the 2026–27 summer:**
  - Sample approval (1–2 weeks), production (20–35 days), inspection and booking (about 1 week), sea transit (23–31 days, worst case 35–47) and clearance/cartage (about 1 week).
  - From PO to sellable stock is about 10–13 weeks. A PO on about 20 Oct 2026 lands in about early-to-mid January 2027.
  - It misses Black Friday (November) and Christmas, which are the biggest spikes, and sells into the late-summer tail (Jan–Feb).
  - Chinese New Year 2027 falls on 6 Feb 2027 (calendar fact; verify). Factory shutdowns then make an in-season re-order impractical.
- **The realistic target is the spring 2027 peak.** Place POs in May–June 2027 for July–August arrival, and pay off-peak freight where available. The landed-cost notes report that some carriers offered under USD 1,000/FEU after CNY in March 2026.
- **Counter-seasonal option:** fire pits, smokeless pits and fire-pit tables sell into autumn/winter (Mar–Aug 2027). An order placed now for April arrival suits them better than summer furniture. This is an inference: no Australian fire-pit seasonality data was found.
- **Competitive map:**
  - Bunnings is the binding ceiling on most hard goods: BBQs, fire pits, umbrellas, sails, storage, heaters, gazebos and egg chairs.
  - Gardeon (Dropshipzone) and Costway are the ceiling on furniture, hammocks, pizza ovens and swings.
  - Aldi and Amazon AU (MOKANI and similar) are the ceiling on rugs.
  - Kmart's own range is a factor on fire pits and clearance lounge sets.
  - The only uncontested angle found is pickup convenience on bulky, assembled goods.

### Gaps
- No Marketplace sell-through, days-to-sell or sold-price data (login required).
- No Google Trends AU seasonality curves (not accessible).
- Big W and Temu AU outdoor floors were not retrieved.
- Kmart's own-brand outdoor range and prices were not retrieved (403; search budget exhausted).
- The Chinese New Year 2027 date is from general knowledge, not a fetched source.

## Q3. Chinese clusters and named factories: who makes each SKU, at what FOB and MOQ, and how credible are they?

### Takeaway
Supply is plentiful and cheap at low MOQs on Made-in-China.com, clustered as follows:
- furniture, aluminium and egg chairs: Foshan/Shunde (Guangdong)
- rattan sets, hammocks, umbrellas, gazebos and loungers: Ningbo, Hangzhou, Shaoxing and Jinhua (Zhejiang)
- pizza ovens and fire pits: Qingdao, Weifang and Hebei in the north; Guangzhou and Jiangmen (BBQs, pizza ovens); Suzhou (kettles, heaters)

Credibility evidence on MIC is mostly membership tier plus "Audited Supplier" (third-party inspection agency) badges. Several low-price listings are trading companies or contain mismatched specs. The cheapest 4-piece rattan and egg-chair offers both come from a Henan supplier outside the usual clusters, and one of its listings is internally inconsistent.

### Cited Findings
All listings below are Made-in-China.com, observed 9 Oct 2026. Prices are list FOB or "from" prices in USD. "Audited" means MIC's badge "Audited by an independent third-party inspection agency".

**Egg chair with stand**
- **Shangqiu Fanpin Crafts Co., Ltd** (Shangqiu, Henan)
  - Credentials: business type "Manufacturer/Factory"; Diamond Member since 2025, Audited; established 2019-07-16; 4 years exporting; main market "Domestic"; 2 production lines; 3 foreign-trade staff.
  - "Gray Outdoor … Egg Wicker Hanging Chair with Stand": US$37 at MOQ 100, sample US$40. 195 cm H × 110 cm W; metal/cast iron + imitation rattan. — [listing](https://fanpin.en.made-in-china.com/product/baBRpESrqUYc/China-Gray-Outdoor-Furniture-Relaxation-Egg-Wicker-Hanging-Chair-with-Stand.html)
  - Sister listing: US$48–50 at MOQ 10, carton 115×60×20 cm (0.138 CBM), 25 kg. — [listing](https://fanpin.en.made-in-china.com/product/TGNYaefKJjUP/China-Outdoor-Rattan-Hanging-Egg-Swing-Chair-with-Metal-Stand-for-Patio-Garden.html)
- **Foshan Kingwell Industry Co., Ltd.** (Xingtan, Shunde, Foshan)
  - Credentials: Diamond, Audited; 9 years exporting; 2,000 sets/month.
  - US$53.99–55.99 at MOQ 10; HS 9401719000; "20GP & 40HQ (20~35 days)".
  - Its package field (300×200×100 cm, 150 kg) looks like a multi-unit or placeholder value.
  - — [listing](https://kingwellfurniture.en.made-in-china.com/product/mOkTyCfGOgpA/China-Garden-Furniture-Patio-Hanging-Swing-Chair-Hammock-Metal-Rattan-Egg-Outdoor-Swing-with-Stand.html)
- **Hangzhou Max Garden Outdoor Products** (Hangzhou, Zhejiang)
  - Credentials: Gold, Audited; 9 years exporting; "80*40hq/Month".
  - US$55–58 at MOQ 300 sets; carton 115×87×82 cm (0.82 CBM), 40 kg; "40HQ container with no more than 4 items".
  - — [listing](https://green-tide.en.made-in-china.com/product/HdNtBSJPlLcF/China-Outdoor-Garden-Furniture-Wicker-Egg-Hanging-Chair-with-Metal-Stand.html)
- **Ningbo Xusheng Leisure Products** (Beilun, Ningbo)
  - Credentials: Diamond, Audited; 30,000 m² site.
  - Folding egg chair with stand US$70–80 at MOQ 350; US$60–80 at MOQ 200.
  - — [listing](https://xushengcompany.en.made-in-china.com/product/QwhGqJvPaBUA/China-Outdoor-Indoor-Rattan-Folding-Hanging-Swing-Egg-Chair-with-Stand.html)
- **Guangdong Optima Home Group** ("Manufacturer/Factory", Diamond, Audited): PE-rattan egg swing chair with stand US$159 at MOQ 10. — [listing](https://primafurnitures.en.made-in-china.com/product/yrGUndHKCvWu/China-Outdoor-PE-Rattan-Egg-Swing-Chair-with-Stand-for-Patio-Garden.html)

**PE-rattan 4-piece lounge sets**
- **GOOD SELLER CO., LTD** (Zhejiang): "Trading Company"; Diamond, Audited. US$108–115 at MOQ 10; 50,000 sets/year. Its "1088pcs/40HC" container note is implausible for sets. — [listing](https://goodseller-camping.en.made-in-china.com/product/JnjUrvECTARG/China-Cheap-Outdoor-Garden-Rattan-Furniture-Four-Piece-Sofa-Sets.html)
- **Shaoxing Ole Leisure Co., Ltd.** (Zhejiang): Diamond, Audited. US$120–180 at MOQ 50 sets; 2,000 sets/month. — [listing](https://outdoorchina.en.made-in-china.com/product/NZWtusAUXTpB/China-Sale-of-4-Pieces-Modern-Sectional-Outdoor-Handmade-Rattan-Furniture-Sofa-Set-with-Table-Chair-for-Hotel-Living-Room-Home-Office-Dining.html)
- **Hangzhou Max Garden:** US$160–180 at MOQ 54 sets; sofa L124×W74×H81 cm. Its carton field (90×30×40 cm, 50 kg) is implausible. — [listing](https://green-tide.en.made-in-china.com/product/qSeQVwpOlBRP/China-Stylish-4-Piece-Rattan-Sofa-Set-for-Outdoor-Patios.html)
- **Ningbo Xusheng:** 3-piece L-shape rattan sectional US$108–128 at MOQ 100. — [listing](https://xushengcompany.en.made-in-china.com/product/tEhpMOzGHdrb/China-Hot-Selling-L-Shape-Sofa-Set-Rattan-Modern-Patio-Furniture-3-Piece-Sectional-Couch.html)
- **Shangqiu Fanpin:** "Four-Piece Set Patio Rattan Wicker Sofa Set" at US$80 (10–399 pieces) / US$78 (400+); carton 115×75×26 cm (0.224 CBM), 37 kg. **But its product description describes a "Teardrop hollow shape + freestanding frame"**, i.e. a swing chair: a listing mismatch. — [listing](https://fanpin.en.made-in-china.com/product/iTNroMJlaKYt/China-Four-Piece-Set-Patio-Rattan-Wicker-Sofa-Set-Table-and-Chairs-Outdoor.html)
- **Above the band (aluminium-frame premium):** Foshan Shunde Ciao 4-piece oval set US$561–606 at MOQ 5 ([listing](https://ciaofurniture.en.made-in-china.com/product/sJprCmHoYLYv/China-Foshan-Garden-Set-4-Pieces-Oval-Rattan-Wicker-Lounge-Outdoor-Sofa-Furniture.html)); Guangdong Maryard US$690–830 at MOQ 10 ([listing](https://maryard.en.made-in-china.com/product/CyonvdgKieWB/China-4-Piece-Patio-Lounge-Set-Outdoor-Aluminum-Furniture-PE-Rattan-Woven-Sectional-Sofa.html)).

**Aluminium dining / bistro**
- **Foshan Kingwell:** aluminium mesh dining table set US$79.99 / 189.99 / 299.99 tiers at MOQ 10; carton 100×100×80 cm, 50 kg. — [listing](https://kingwellfurniture.en.made-in-china.com/product/dZmtGaWAYHpw/China-All-Weather-Garden-Furniture-Outdoor-Aluminum-Mesh-Dining-Table-Set.html)
- **Qingdao Zhen Cheng (Furniture):** Diamond. 2-piece square aluminium table with 2 arm chairs, US$137.50–382.50 at MOQ 30; HS 9403200000. — [listing](https://zhencheng-furniture.en.made-in-china.com/product/qrFRfMKDXlhG/China-Modern-Furniture-Outdoor-Backyard-Patio-Garden-Slate-Grey-2-Piece-Square-Metal-Aluminum-Dining-Table-Set-with-2-Arm-Chairs.html)
- **Foshan Kingmake:** aluminium dining set US$299–499 at MOQ 10. — [listing](https://kingmakeoutdoor.en.made-in-china.com/product/ofDrnThJRCVx/China-Best-Selling-Outdoor-Table-and-Chairs-Patio-Garden-Aluminum-Outdoor-Dining-Set.html)

**Sun loungers and daybeds**
- **Zhejiang Onetime Leisure Products** (Jinhua): Diamond, Audited; ISO9001:2015 and ISO14001; 13 years exporting; 4 lines. Stackable flat-pack aluminium lounger US$65–85 at MOQ 1,000; carton 188×10.5×64.5 cm (0.127 CBM), 10.3 kg. — [listing](https://onetimecn.en.made-in-china.com/product/TfJYCUbLaSrw/China-Stackable-Flat-Pack-Aluminium-Sun-Lounger-UV-Resistant-Thick-Textilene-Outdoor-Recliner.html)
- **Foshan Yocean Home Furniture** (Xingtan, Shunde): "Manufacturer/Factory & Trading"; established Nov 2024; 92 staff; 20,000 m². US$65–120 at MOQ 5. — [listing](https://yoceangarden.en.made-in-china.com/product/iPproAyZAUcw/China-Factory-Discounts-Outdoor-Sun-Lounger-Garden-Furniture-Aluminum-Lounger-Leisure-Lounger-Swimming-Pool-Lounger-Hotel-Terrace-Lounge-Chairs-Outdoor-Furniture.html)
- **Daybeds** are US$330–920 at MOQ 1–50 (Foshan Sunward, Zhechengju, Yiran, Hongkai). — [MIC search](https://www.made-in-china.com/products-search/hot-china-products/Outdoor_Daybed.html)

**Hammock with stand**
- **Ningbo Lounger Import & Export** (Yinzhou, Ningbo): Gold, Audited; the name indicates a trader. US$20–21 at MOQ 200, sample US$30. Open stand 260×100×107 cm; carton 116×22×24 cm (0.061 CBM), 11 kg; HS 6306992000. — [listing](https://lounger2.en.made-in-china.com/product/zatrBMfGjmRi/China-Easy-Assemble-Folding-Double-Portable-Hammock-with-Stand.html)
- **Ningbo General Union Co., Ltd.** (address in Yiwu): Diamond, Audited; established 2007; 18 years exporting; 465 staff; 3,000 m². Double hammock with steel stand, tiers US$26/23/20 at MOQ 500. — [listing](https://skylarktoys.en.made-in-china.com/product/MpBUYrqVbRhS/China-Outdoor-Best-Selling-Double-Hammock-with-Space-Saving-Steel-Stand-for-2-People.html)
- **Zhong Xing Da (Hangzhou) Import & Export:** Diamond, Audited. Brazilian hammock with 12 ft stand US$29.14–31.24 at MOQ 300. — [listing](https://venturegear.en.made-in-china.com/product/gwItiFXArofd/China-Cotton-Nature-White-Tassel-Patio-Swing-Brazilian-Hammock-with-12-Foot-Hammock-Stand.html)

**Outdoor bean bags**
- **Starry (Xiamen) Outdoor Equipment Technology:** Gold, Audited. Giant waterproof bean bag US$17.78–22.88 at MOQ 100. — [listing](https://tent-starry.en.made-in-china.com/product/RAoYLeSMvmpU/China-Custom-Color-Waterproof-Giant-Bean-Bag-Chair-Outdoor-Sofa-Bean-Bag-Pool-Floating-Oversized.html)
- **Hangzhou Aifu Household:** "Trading Company"; established 2021; 6 staff; 165 m². US$43.90–52.90 at MOQ 30. — [listing](https://cnhzilife.en.made-in-china.com/product/igURxmGCTfkV/China-Waterproof-Oxford-Fabric-Outdoor-Bean-Bag-Chair-Garden-Patio-Lounge-Lazy-Sofa-Durable-Water-Resistant.html)

**Wood/pellet pizza ovens**
- **Qingdao Otia Industry and Trade** (Huangdao, Qingdao)
  - Credentials: Diamond since 2020, Audited, 7 years, 5.0 rating (6 reviews); 300,000 pcs/year; 12-month warranty.
  - Tiers: US$44.50 (100–499), US$44.00 (500–999), US$43.50 (1,000+); sample US$78.61.
  - Steel body with high-temperature coating; stainless legs and door; net 9.45 kg / gross 11.3 kg; carton 54.5×42×34 cm (0.078 CBM); HS 7321190000.
  - — [listing](https://qdotia.en.made-in-china.com/product/imFpKPLCglYa/China-Amazon-Portable-Rotating-Pizza-Oven-with-Pizza-Stone-Wooden-Pellet-Pizza-Oven-Folding-Outdoor-Pizza-Oven.html)
- **Ningbo Eto Outdoor Supplies:** Diamond, Audited. Stainless charcoal/wood-pellet oven US$60–85 at MOQ 200; 83×36×71 cm; 50,000/month. — [listing](https://eto-outdoors.en.made-in-china.com/product/iQYrJGUjRtcX/China-Charcoal-Wood-Pellet-Stainless-Steel-Outdoor-Pizza-Oven.html)
- **Jiangmen SHT Metal Products** (Guangdong): "Manufacturer/Factory"; established 2016. Rotating-stone pellet oven US$89–129 at MOQ 100. — [listing](https://jmsht-hardware.en.made-in-china.com/product/PuoYzInZsmkL/China-Countertop-Pizza-Oven-Rotating-Stone-Wood-Pellet-for-Outdoor-Dining.html)

**Gas pizza ovens**
- **Guangzhou Hengfu Hardware Technology:** "Manufacturer/Factory"; Diamond, Audited. 12" portable gas oven US$47.50–49 at MOQ 200. — [MIC search](https://www.made-in-china.com/products-search/hot-china-products/Portable_Gas_Pizza_Oven.html)
- **Suzhou Rdit:** 12" tabletop US$70–90 at MOQ 738.
- **Sunbird Technology (Shenzhen):** 13" US$122–130 at MOQ 693.
- **Zhejiang Jingyu (Chuangyu):** US$75–115 at MOQ 10.
- All at the same MIC search link as Hengfu.

**Charcoal kettle and gas BBQs**
- **Guangzhou Hengfu:** 22" enamel kettle US$39.89–42.89 at MOQ 500 ("40HQ … 300–600 pcs according to the packing"). — [listing](https://hengfubbq.en.made-in-china.com/product/efwphxRvAjWM/China-22-Inch-Kettle-Charcoal-BBQ-Grill-with-Porcelain-Enameled-Lid-and-Bowl-Ash-Catcher-for-Outdoor-Cooking.html)
- **Guangzhou Hengfu:** 4-burner stainless gas BBQ, tiers US$130/129/126 at MOQ 300; carton 77×57×52 cm (0.228 CBM), 39.5 kg; 3,000/month. — [listing](https://hengfubbq.en.made-in-china.com/product/oGfRExgYvNVw/China-Outdoor-4-Burners-Stainless-Steel-Heavy-Duty-Barbecue-Propane-Gas-Grill-BBQ-Grill.html)
- **Suzhou Tuoshenghe:** kettle US$39–45 at MOQ 50; carton 80×45×30 cm (0.108 CBM), 20 kg. — [listing](https://inbestcamp.en.made-in-china.com/product/aRcUifGVYjkC/China-High-Quality-Kettle-Style-Charcoal-Grill-Similar-Weber-Grill-Outdoor-BBQ-OEM-Wholesale.html)

**Smokeless fire pits**
- **Zhejiang Boke Industry & Trade:** "Manufacturer/Factory & Trading"; Gold, Audited. Tiers US$59/56 at MOQ 300; carton 54.5×54.5×39.5 cm (0.117 CBM), 13.6 kg. — [listing](https://bokemdg.en.made-in-china.com/product/yRvYhrSungcM/China-Smokeless-Steel-Outdoor-Fire-Pit-BBQ-Heating-Stove-for-Courtyard-Camping.html)
- **Shenzhen Voda Tech** (Bao'an): "Manufacturer/Factory & Trading"; established 2014; 36 staff; 1,025 m². 19" smokeless US$68–70 at MOQ 500; 2 pcs/carton. — [listing](https://vodatek.en.made-in-china.com/product/zGPREBeJOVkS/China-19-Inch-Smokeless-Fire-Pit-for-Outdoor-Wood-Burning.html)
- **Suzhou Tuoshenghe:** established 2017; 39 staff; 3,000 m²; ISO9001. Folding secondary-air pit US$45–55 at MOQ 50; carton 51.5×41×15 cm (0.032 CBM), 9.5 kg. — [listing](https://inbestcamp.en.made-in-china.com/product/CRvrBubPLyVI/China-Portable-Wood-Burning-Fire-Pit-with-Secondary-Air-Intake-Smokeless-Efficient.html)

**Steel fire pits**
- **Shandong HY Metal Products** (Linqu, Weifang): Diamond, Audited. Rectangular steel BBQ fire pit, tiers US$43.80/41.80/39.80 at MOQ 50. — [listing](https://haoyangmetal.en.made-in-china.com/product/cKiEqaLxvsrT/China-Outdoor-Welding-Metal-Rectangular-Steel-Warming-Barbecue-Fire-Pit.html)
- **Shijiazhuang Guanrun Trading** (Hebei): "Trading Company", Gold, Audited. Round steel pit US$20.90–24.90 at MOQ 100. — [listing](https://chinaguanrun.en.made-in-china.com/product/RwBtKEzYHjGH/China-Round-Black-Steel-Fire-Pit-Outdoor-Wood-Log-Burner-for-Patio-Heating.html)

**Gas patio heaters**
- **Sunbird Technology Development** (Futian, Shenzhen; office address): Gold, Audited. Gas patio heater "with CE" US$60–70 at MOQ 400; "40HQ: 400PCS". — [listing](https://wonhawk2013.en.made-in-china.com/product/mJopVaZMgtcy/China-Umbrella-Outdoor-Patio-Heater-Coated-Gas-Vertical-Patio-Heater-with-CE.html)
- **Suzhou Rdit:** 13 kW LPG heater US$55–65 at MOQ 375. — [listing](https://rdit-bbq.en.made-in-china.com/product/gAzriTEPmLVc/China-Wholesale-Standing-Stainless-Steel-LPG-Umbrella-Shape-13kw-45000BTU-Patio-Gas-Heater-for-C.html)

**Cantilever umbrellas**
- **Changsha Ido Leisure Industry** (office-tower address in Changsha, Hunan; likely trading): Diamond, Audited. US$27–37 at MOQ 50; 1 pc/carton. — [listing](https://idoleisure.en.made-in-china.com/product/wJiUTyRdXYpC/China-Garden-Offset-Hanging-Umbrella-Cantilever-Umbrella-for-Outdoor-Patio.html)
- **Ningbo Xusheng:** US$30–40 at MOQ 800 sets; "20GP can loading 748 sets". — [listing](https://xushengcompany.en.made-in-china.com/product/TFzAyYZjCHrt/China-3m-Umbrella-for-Garden-Outdoor-Furniture-Courtyard-Cantilever-Patio.html)
- **Foshan Kingwell:** tiers US$110/90.88/80.88 at MOQ 10; HS 6601100000. — [listing](https://kingwellfurniture.en.made-in-china.com/product/hgPUXOfubYkM/China-Cantilever-Umbrella-for-Patio-Silk-Screen-Printing-UV-Resistant-Outdoor-Umbrella.html)

**Shade sails, deck boxes and rugs**
- **Zhejiang Lvyuan:** polyester shade sail US$16 at MOQ 3,000. — [listing](https://zjlvyuan.en.made-in-china.com/product/yewxKoBvpCWa/China-Polyester-Sail-Waterproof-Shade-Sail-Sun-Shade.html)
- **Hangzhou Cheers Technology** ("Trading Company"): HDPE cushion box US$34.20–41.80 at MOQ 100; 122×62×64 cm; flat carton 130×71×16.5 cm (0.152 CBM), 22 kg. — [listing](https://aicathlonoutdoor.en.made-in-china.com/product/KZUGwCidlutL/China-Wooden-Design-Outdoor-Garden-Large-Cushion-HDPE-Storage-Box.html)
- **Little Dolphin (Jiangsu):** recycled-PP outdoor rug US$2.98–12.98 at MOQ 500; "20*40hq Per Month". — [listing](https://aizhiweier.en.made-in-china.com/product/xEsrnBXWYyRu/China-Little-Dolphin-Wanmi-Factory-Waterproof-100-Recycled-Polypropylene-Plastic-Outdoor-Rug.html)

**Gazebos, Adirondacks and swings**
- **Ningbo Unitent Outdoor Products:** "Manufacturer/Factory & Trading"; Diamond, Audited; established 2013; 160 staff. 3×3 pop-up with side walls US$33 at MOQ 100 sets; carton 119×22×21 cm (0.055 CBM), 13.5 kg; HS 6306120000. — [listing](https://unitent.en.made-in-china.com/product/xGRrBDsHXhkw/China-3X3-Portable-Pop-up-Canopy-Folding-Gazebo-with-Side-Walls.html)
- **Shaoxing ShunXin Pipe Making:** 3×3 steel pop-up with sidewall US$46–80 at MOQ 10. — [listing](https://sxshunxin.en.made-in-china.com/product/mKaQjNIGEFWd/China-3X3m-Steel-Pop-up-Gazebo-with-Sidewall.html)
- **Changsha Ido:** HDPE folding Adirondack US$55.20–68.50 at MOQ 100; HS 9401790000. — [listing](https://idoleisure.en.made-in-china.com/product/OJqYXWxTJvUf/China-Relaxing-Stackable-Folding-HDPE-All-Weather-Ergonomic-Adirondack-Chair-with-Arm-Rest.html)
- **Wuhu Boretech** (Anhui): "Manufacturer/Factory & Trading", Gold, Audited. HDPE Adirondack US$69–79 at MOQ 100. This is from the search listing; the detail page returned 404. — [MIC search](https://www.made-in-china.com/products-search/hot-china-products/HDPE_Adirondack_Chair.html)
- **Ningbo Yilong Outdoor Products:** Gold, Audited; exporting since 2004. 3-seater swing with cushion (C1069) US$66 at MOQ 200 sets. — [listing](https://yilong.en.made-in-china.com/product/IXYmiNvbfhVk/China-Deluxe-Outdoor-Garden-Furniture-Hammock-Patio-3-Seater-Swing-Chair-with-Cushion-C1069-.html)

### Inferences
- **Clusters seen in the listings:**
  - Foshan/Shunde (Xingtan zone) for aluminium furniture, egg chairs, umbrellas and loungers.
  - Ningbo (Beilun, Yinzhou), Hangzhou, Shaoxing and Jinhua for leisure goods, rattan sets, hammocks, gazebos, swings, umbrellas and flat-pack loungers.
  - Guangzhou (Hengfu) for BBQs and gas pizza ovens.
  - Qingdao (Otia) for pellet pizza ovens.
  - Weifang (Shandong) and Hebei for steel fire pits.
  - Suzhou (Rdit, Tuoshenghe) for kettles, gas heaters and fire pits.
  - The brief's Yongkang, Anji, Linhai, Yangjiang and Xiamen clusters did not surface for these SKUs, apart from Xiamen for bean bags. That says nothing about whether factories exist there.
- **MIC badge caveats:** "Diamond" and "Gold" are paid tiers, not quality evidence. "Audited Supplier" means some third-party inspection exists. "Import & Export" names, office-tower addresses (Changsha Ido, Sunbird Futian) or a Yiwu address (Ningbo General Union) point to trading companies, even where no business type is shown.
- **The cheapest egg-chair and rattan-set offers (Shangqiu Fanpin, Henan) need extra diligence.** The supplier is outside the established clusters, joined MIC in 2025 with a domestic focus, and its 4-piece set listing reuses swing-chair text. Order samples and request the factory's actual carton specs and a video audit before relying on US$37–80 prices.
- **Price tiers show volume discounts are small** (Otia US$44.50 → 43.50; Hengfu US$130 → 126). For a small importer, freight mode matters far more than chasing MOQ tiers.

### Gaps
- Alibaba (JavaScript-rendered search), 1688, GlobalSources and ImportYeti were not queried. Factory claims are therefore single-platform.
- No independent verification (business-licence scope, audit report content) was opened for any supplier.
- No supplier was contacted, per the brief.
- Canton Fair outdoor-furniture exhibitors were not researched (search budget exhausted).

## Q4. Bulky goods: CBM per unit (assembled vs KD), units per 40HQ, how much CBM drives landed cost, and the Marketplace pickup advantage

### Takeaway
For outdoor living, CBM is the lever that decides profit. At the first-order freight rate, freight equals 40–90% of FOB for furniture:
- egg chair: 88%
- deck box: 83%
- dining set: 66%
- rattan set: 57%

Moving from a non-collapsible to a collapsible or KD spec changes units per 40HQ about 3–6×. For example, egg chairs go from about 80 per 40HQ (0.82 CBM) to about 220 (0.30) or about 480 (0.138).

The online sellers' delivery cost on bulky goods is the one structural advantage a Marketplace pickup seller has:
- Kmart charged AUD 101.97 delivery on a Gardeon 4-piece set.
- Gardeon listings are "delivery only, 2–8 business days".
- Most bulky SKUs exceed Australia Post's 22 kg / 105 cm / 0.25 m³ limits.

### Cited Findings
- **Stated cartons (all MIC; URLs in Q3):**
  - egg chair: 115×60×20 cm, 0.138 CBM, 25 kg (Fanpin) vs 115×87×82 cm, 0.82 CBM, 40 kg (Max Garden)
  - "4-piece" rattan: 115×75×26 cm, 0.224 CBM, 37 kg (Fanpin, unreliable listing)
  - aluminium dining set: 100×100×80 cm, 0.80 CBM, 50 kg (Kingwell)
  - flat-pack aluminium lounger: 188×10.5×64.5 cm, 0.127 CBM, 10.3 kg (Onetime)
  - hammock + stand: 116×22×24 cm, 0.061 CBM, 11 kg (Ningbo Lounger)
  - pellet pizza oven: 54.5×42×34 cm, 0.078 CBM, 11.3 kg (Otia)
  - kettle: 80×45×30 cm, 0.108 CBM, 20 kg (Tuoshenghe)
  - 4-burner gas BBQ: 77×57×52 cm, 0.228 CBM, 39.5 kg (Hengfu)
  - smokeless pit: 54.5×54.5×39.5 cm, 0.117 CBM, 13.6 kg (Boke)
  - deck box (flat): 130×71×16.5 cm, 0.152 CBM, 22 kg (Cheers)
  - 3×3 gazebo: 119×22×21 cm, 0.055 CBM, 13.5 kg (Unitent)
- **Supplier loading statements:**
  - Sunbird patio heater: "40HQ: 400PCS"
  - Xusheng umbrella: "20GP can loading 748 sets"
  - Hengfu kettle: "300–600pcs according to the packing" per 40HQ
  - Max Garden: "40HQ container with no more than 4 items" (SKU-mix limit)
  - Sources: listings in Q3.
- **Australia Post domestic parcel limits:** 22 kg, 105 cm greatest length, 0.25 m³. Cubic factor 250 above 5 kg (Post Charges guide, 1 Sep 2026). — [Australia Post](https://auspost.com.au/content/dam/auspost_corp/media/documents/post-guides/post-charges-guide-ms11.pdf) (via the demand notes)
- **Delivery friction:**
  - Gardeon 4-piece set on Kmart Marketplace AUD 472.56 plus AUD 101.97 delivery (13 Jul 2026) — [BuyWisely](https://buywisely.com.au/product/gardeon-outdoor-furniture-sofa-set-4-seater-wicker-lounge-setting-table) (via search summary)
  - Kmart's free delivery over AUD 65 excludes "big and bulky items and Marketplace sellers' products" — [Kmart](https://www.kmart.com.au/product/firepit-43627714/) (via search summary)
  - The Rimini set "will incur a delivery fee" — [Kmart](https://www.kmart.com.au/product/rimini-4-piece-modular-lounger-43162147) (via search summary)
  - Gardeon/Everfit listings: "delivery only, 2–8 business days" — [Gumtree](https://www.gumtree.com.au/s-garden/4+piece+wicker+outdoor+lounge+setting/k0c18398)
  - Gumtree sellers charge AUD 40–70 for metro delivery of bulky goods — [Gumtree](https://www.gumtree.com.au/s-beds/brand+new+queen+size+mattress/k0c20074) (via the demand notes)

### Inferences
- **Units per 40HQ** (66 usable CBM, assumption):
  - rattan set: about 147 at 0.45 CBM; 290 at 0.224
  - egg chair: about 80 at 0.82; 220 at 0.30; about 480 at 0.138
  - swing: about 236
  - Adirondack: about 330
  - gas BBQ: about 289
  - patio heater: about 388–400
  - deck box: about 434
  - sun lounger: about 520
  - fire pits: about 550
  - cantilever: about 660
  - pizza oven: about 825
  - hammock + stand and gazebo: about 940–1,080
  - rugs and sails: thousands
- **Freight as a share of FOB (AUD) at first-order rates:** egg chair 88%, deck box 83%, aluminium set 66%, hammock 61%, rattan set 57%, and pizza oven, fire pit, kettle and cantilever all about 55%. At a consolidated 40HQ rate: egg chair 60%, rattan 39%, deck box 40%, pizza oven 18%, gazebo 15%.
- **Effect of CBM on egg-chair GP:** each 0.1 CBM adds about AUD 15 (40HQ) to AUD 30 (LCL) of freight, plus storage. That is why a CBM ×1.5 change swings egg-chair GP from +4 to −33 and rattan-set GP from −53 to −110 (Q1 sensitivity table).
- **Assembled vs KD:** no listing gave both assembled and KD CBM for the same SKU. The 0.82 vs 0.138 CBM egg-chair spread (non-collapsible vs collapsible basket) is the best available proxy. Buyers should specify KD or collapsible packing in the PO and confirm carton dimensions from the factory's packing list.
- **Where the pickup advantage is real:** items that exceed Australia Post limits by weight, length or volume.
  - rattan sets (37–50 kg, at least 0.22 CBM)
  - egg chairs (25–40 kg)
  - gas BBQs (39.5 kg)
  - swings and Adirondacks
  - deck boxes (130 cm long)
  - loungers (188 cm)
  - cantilever umbrellas (long cartons)
  - gazebos (119 cm)
  - hammock stands (116 cm)
  - Online sellers pay about AUD 40–100+ in freight per order or impose 2–8-day waits. A Marketplace seller offering same-day assembled pickup can price at or slightly above Gardeon or Costway and still win.
  - Compact items fit parcel networks, so there is no structural edge: pizza ovens at 11.3 kg / 0.078 CBM (about 19.5 kg cubic), rugs, sails and bean-bag covers.
- **Storage burden scales with CBM.** A 21 m² unit (about 35 CBM usable, assumption) holds about 75 KD rattan sets, about 115 collapsible egg chairs, or about 440 pizza ovens. Bulky slow sellers tie up the unit (AUD 273–389/month) and push GP negative at 6 months (Q1 sensitivity).

### Gaps
- No verified assembled-vs-KD carton pairs for rattan sets or swings.
- No 2026 Australian rates for tailgate or residential pallet delivery.
- Online sellers' delivery fees for these SKUs (Amazon AU, Costway, Crazy Sales) were not captured. Only Kmart Marketplace's AUD 101.97 was seen.

## Q5. Compliance: gas-appliance certification (cost, lead time, realism) and biosecurity for natural rattan, bamboo and timber vs synthetic PE rattan; ISPM-15; other product rules

### Takeaway
All gas SKUs (BBQs, gas pizza ovens, patio heaters) are effectively closed to a small importer:
- They must be certified to Australian gas standards (AS/NZS 5263 series) by a JASANZ-accredited body under the GTRC scheme, and carry a compliance plate and Gas Compliance Mark.
- CE or CSA certificates are explicitly "not sufficient".
- No fee schedule was found. A modelled AUD 25k per model makes every gas SKU unprofitable at a first order of 200–400 units.

Biosecurity favours synthetic PE rattan on steel or aluminium frames. Natural cane, rattan, bamboo or timber trigger BICON plant-product conditions: treatment or phytosanitary certificates, or inspection and fumigation.

Every shipment needs compliant packaging (ISPM-15 marked timber or non-timber) and a packing declaration. Outdoor bean bags also fall under a mandatory ACCC safety standard.

### Cited Findings
- **Energy Safe Victoria, gas appliances sold online:**
  - Only sell Type A gas appliances "that have a compliance plate attached".
  - Look for the Gas Compliance Mark (GCM) and the certifier's mark.
  - Overseas certifications, including CSA and CE, are "not sufficient for sale in Australia".
  - Listings should show the gas type, model, brand, certificate number and a photo of the compliance mark, matching the GTRC National Certification Database.
  - Non-compliance "may result in enforcement action… including infringements or prosecution".
  - Modified appliances are no longer "accepted".
  - — [Energy Safe Victoria](https://energysafe.vic.gov.au/industry-guidance/gas-and-pipelines/gas-appliances-equipment-and-manufacturers/gas-appliances-online-sales)
- **GTRC:** "all gas appliances sold in Australia and New Zealand are required to be tested and certified". — [GTRC](https://gtrc.gov.au/)
- **GTRC Technical Guidance Bulletin 29 (19 June 2025):** the transition deadline from AS/NZS 5263.0:2017 to 5263.0:2023 is deferred pending revised Scheme Rules. Scheme Rules require existing certifications to comply with revised standards "within 2 years". The bulletin is addressed to "Conformity Assessment Bodies that are JASANZ accredited". — [GTRC TGB 29 (PDF)](https://gtrc.gov.au/resources/TECHNICAL-GUIDANCE-BULLETIN-29---ASNZS5263.0-Standard-Transition.pdf)
- **Certifiers:** a 2021 NZ gazette lists SAI Global, IAPMO R&T Oceana, The Australian Gas Association, Global-Mark and BSI as gas-appliance certifiers. — [NZ Gazette](https://gazette.govt.nz/notice/id/2021-au1310)
- **AGA and IAPMO:** AGA advertises gas product certification and laboratory testing ([AGA](https://www.aga.asn.au/)). IAPMO Oceania advertises "GasMark Product Certification" and a "Gas Appliance Lab" ([IAPMO Oceania](https://www.iapmooceania.org/)). Neither page publishes fees.
- **Supplier certifications:** Chinese gas listings advertise CE only, e.g. "CE Certificated … 4+1 Burners" (Hengfu) and "Gas Vertical Patio Heater with CE" (Sunbird). — listings in Q3
- **Biosecurity, cane and rattan:**
  - DAFF's timber classification page lists a BICON case for "cane and rattan articles", including furniture, kitchenware, mats and bundles of prepared rattan (Calamus spp.).
  - "If cane or rattan articles contain any bamboo it must be imported as a bamboo product".
  - — [DAFF timber types](https://agriculture.gov.au/import/goods/timber/types) (via search summary; the page returned 503 to direct fetch)
- **Biosecurity, furniture paperwork:**
  - Goods made of or containing bamboo, cane, rattan, plant fibre or other plant material need a treatment and/or phytosanitary certificate.
  - Furniture may need fumigation or pest-control certificates covering timber goods and wooden packing, plus specific descriptions.
  - Non-compliant goods "may be seized, re-exported or even destroyed".
  - — [icecargo fact sheet](https://icecargo.com.au/wp-content/uploads/2022/10/Importing-Furniture-into-Australia-Fact-Sheet.pdf); [icecargo guide](https://icecargo.com.au/import-furniture-australia/)
- **Biosecurity, wooden furniture lines:** for tariff headings 9401.61 and 9403.60, the Integrated Cargo System asks whether goods contain wood without documents proving acceptable treatment. — [DAFF IAN 131-2023](https://agriculture.gov.au/biosecurity-trade/import/industry-advice/2023/131-2023) (via the landed-cost notes)
- **BMSB season 2026-27:** runs 1 Sep–30 Apr. China is an "emerging risk" country (random inspections), not a target-risk country. — [DAFF 2026-27 BMSB presentation](https://www.agriculture.gov.au/sites/default/files/documents/2026-27-bmsb-industry-presentation.pdf) (via the landed-cost notes)
- **DAFF fees:** charges rose by 3.8% from 1 Jul 2026. The FID biosecurity charge is AUD 71 for sea. — [ACN 2026/23](https://www.abf.gov.au/help-and-support-subsite/CustomsNotices/2026-23.pdf)
- **Inspection cost order of magnitude (weak evidence):** a removals quote listed quarantine inspection fees of about AUD 730 / 1,030 / 1,090 for 20' / 40' / 40HC. — [moverspoe](https://data.moverspoe.com/AQS/AQS_OffersFiles/238048/RWQuote.htm) (via the landed-cost notes)
- **Bean bags:** the mandatory standards list includes bean bags (2014). — [Compliance Gate](https://www.compliancegate.com/?p=30478) (via the landed-cost notes)
- **Natural materials on supplier listings:** Aldi's kamado BBQ has "bamboo handles" ([Aldi](https://www.aldi.com.au/product/coolabah-kamado-ceramic-bbq-000000000000739177)). Several MIC dining and bar sets use acacia or solid-wood tops, e.g. vidaXL and Costway acacia sets on Amazon AU ([Amazon AU](https://www.amazon.com.au/gp/bestsellers/garden/5737260051)).

### Inferences
- **Gas certification realism:**
  - Plan for type testing at an accredited Australian lab, certification by a JASANZ-accredited body (SAI, IAPMO, AGA, Global-Mark or BSI), Gas Compliance Mark labelling, GTRC database listing, and probably a factory audit and periodic surveillance.
  - Budget **AUD 10–40k per model and 3–6+ months (assumption; no published fees found)** before first sale. Redo it if the factory changes components.
  - At AUD 25k, the certification adds about AUD 63–125/unit on 200–400 units. That is more than the entire margin available under Bunnings' AUD 229 4-burner and AUD 160 heater floors.
  - Only a buyer who can license an existing Australian certificate from a factory that already supplies a certified Australian brand could test this, and that was not found.
  - Product-liability exposure as the deemed manufacturer adds further cost: see the reseller-risk notes.
- **Wood/pellet pizza ovens and fire pits avoid gas rules,** but only if supplied without gas burners. Many "multi-fuel" Ooni-style ovens ship with an optional gas burner that would itself need certification. The PO should specify wood/pellet-only and no gas accessories.
- **PE rattan on powder-coated steel or aluminium has no plant material** (inference; confirm the BICON outcome with a broker). It should clear as ordinary furniture, needing only:
  - ISPM-15 marked pallets or crates, or plastic/cardboard packaging
  - a packing declaration
  - a specific goods description ("synthetic PE rattan on aluminium frame")
  - Watch for hidden natural components: bamboo or wooden handles, acacia tabletops, natural seagrass or cane trims, or wooden pallets without marks. Any of these can trigger treatment certificates or inspection, with storage while held.
- **Natural rattan, bamboo or timber versions** (rattan egg chairs, bamboo-handle BBQs, acacia-top dining sets) should be avoided by a first-time importer. Each adds treatment certificates (fumigation or heat treatment by an approved provider), risk of onshore fumigation (hundreds of AUD per container plus days of storage) and seizure or re-export risk.
- **Bean bags:** treat the mandatory standard (child-resistant zips and closures, warnings) as a compliance blocker. Model this SKU as covers only.
- **Electrical add-ons:** solar or LED cantilever umbrellas and LED gazebos bring battery and LED electrical-safety questions (EESS/RCM). This was not researched here; see the landed-cost notes.

### Gaps
- Certification fees and lead times were not found for any gas certifier (SAI, IAPMO, AGA, Global-Mark, BSI); the search budget was exhausted and the fee pages are not public.
- The exact AS/NZS 5263 part for gas pizza ovens and patio heaters was not confirmed.
- The exact BICON wording for synthetic-rattan furniture was not read, because DAFF pages returned 503 or connection errors.
- The 2026-27 DAFF inspection fee per 15 minutes was not found.
- State fire-restriction rules affecting fire-pit use and sale (total fire ban days, council bylaws) were not researched.
