# Camping, 4WD & Outdoor Adventure Gear: per-SKU import-arbitrage economics (China FOB → brand-new on Facebook Marketplace AU at A$100–400)

*Research date 9 Oct 2026. Access limits that shape these notes:*
- *Fetched directly:* 4WD Supacentre category pages, Made-in-China search and product pages, one BCF category page, NSW school-calendar pages, an EESS guidance PDF, and a forwarder DG page.
- *Blocked:* Amazon.com.au (HTTP 503/500), Kogan, Bunnings, eBay AU, OzBargain, Gumtree, Kmart (403), Anaconda and DCCEEW (503), and Alibaba showroom (410).
- *Via search summary:* figures for the blocked sites came from search-engine digests of their pages. Those listing snapshot dates are unknown.
- *Search budget:* the shared WebSearch budget ran out partway through, so Temu, Kmart, Big W, Aldi and Facebook Marketplace or Gumtree "brand new" prices could not be collected (see Gaps).

## 1. Inputs, assumptions and the unit-economics model applied to every SKU

### Takeaway
All rows use one model so they can be compared across categories:
- **Exchange rate:** AUD/USD 0.6928 (1 Oct 2026).
- **Freight:** LCL at USD 80 per W/M (mid case), or a 20ft container at USD 2,450.
- **Australian costs:** cited destination fees, broker, IPC and biosecurity charges.
- **Duty:** 0% with a ChAFTA Certificate of Origin.
- **Allowances:** a 3% defect allowance and per-unit handling.
- **Compliance:** costs spread across the first order.
- **Revenue:** net revenue is the sale price ÷ 1.1 (GST-registered seller).

Low and high sensitivity cases bracket FX and freight uncertainty.

### Cited Findings
**Exchange rate**
- AUD/USD was 0.69280 on 1 Oct 2026. The 2026 high was 0.7260 (13 May) and the low 0.6676 (1 Jan). Via search summary; direct fetch returned 403. — [exchange-rates.org](https://www.exchange-rates.org/exchange-rate-history/aud-usd-2026-10-01)
- RBA F11.1 gives 0.6956 on 8 Oct 2026, as recorded by the parallel kids/toys researcher. — [RBA F11.1 CSV](https://www.rba.gov.au/statistics/tables/csv/f11.1-data.csv)

**Ocean freight (sino-shipping, page dated "October 2026", rates "indicative")**
- LCL: US$35/cbm, "stable", 21–31 days to Sydney.
- 20GP: US$2,205–2,695 to Sydney.
- 40GP: US$4,320–5,280 to Sydney. — [sino-shipping](https://www.sino-shipping.com/country-guides/freight-from-china-to-australia/)
- Other 2026 LCL ranges from search summaries: US$50–150/cbm (June 2026) and US$60–280/cbm; one guide says LCL rose through mid-2026. — [welltrans](https://welltrans-logistics.com/?p=3741); [ExFreight](https://www.exfreight.com/shipping-from-china-to-australia/)

**Government charges**
- ABF Import Processing Charge, sea, electronic: A$50 when the customs value is over A$1k and under A$10k; A$152 at A$10k or more. — [ABF IPC](https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/cost-of-importing-goods/charges/import-processing-charge)
- Biosecurity charge on the Full Import Declaration, sea: A$71 from 1 Jul 2026 (previously A$68). — [ACN 2026/23](https://www.abf.gov.au/help-and-support-subsite/CustomsNotices/2026-23.pdf)

**LCL destination charges (forwarder quotes, not tariffs)**
- DTHC about A$175–180/cbm plus about A$150 documentation.
- Quarantine A$40/cbm, minimum A$330. — [moverspoe quote](https://data.moverspoe.com/AQS/AQS_OffersFiles/224336/RWQuote.htm)

**Parallel landed-cost researcher's mid-case inputs (reused here for comparability)** — [Flying Solo forum](https://www.flyingsolo.com.au/members/searates-australia/forums/replies/); [Maersk DHC](https://www.maersk.com/news/articles/2026/09/01/maersk-terminal-handling-service-australia)
- LCL destination A$90/W/M plus A$310 fixed line items.
- Customs and agency fee A$368 (anecdotal invoice).
- Maersk Sydney DHC A$600 per 20ft from 1 Oct 2026.
- Patrick landside A$224.90 plus booking A$50.45; side-loader A$99.

**Duty**
- Fridges were among the roughly 457 "nuisance" 5% tariffs removed from 1 July 2024. — [Treasury consultation](https://treasury.gov.au/consultation/c2024-506306)
- ChAFTA has given 100% tariff elimination since 1 Jan 2019, but only with a valid Certificate of Origin held at import. — [DFAT ChAFTA guide](https://www.dfat.gov.au/trade/agreements/in-force/chafta/doing-business-with-china/guide-to-using-chafta-to-export-or-import)

### Inferences
**Model** (A$ ex-GST per unit; scripted 9 Oct 2026):

landed/unit = [FOB_USD ÷ 0.6928 × units × (1 + duty) + ocean + destination + delivery + DG surcharge + insurance + IPC + biosecurity + broker + inspection + compliance] ÷ units + handling, all × 1.03 (defect allowance)

| Input | Value used | Status |
|---|---|---|
| Exchange rate | 0.6928 (USD 1 = A$1.4434). RBA's 0.6956 changes results by under 0.5%. | Cited |
| LCL ocean | US$80/W/M, where W/M = max(cbm, tonnes, 1) | Cited range; mid is the parallel researcher's assumption |
| LCL destination | A$90/W/M + A$310 | As above |
| LCL delivery | A$150 + A$17/cbm | ASSUMPTION |
| 20GP | US$2,450 (mid of sino-shipping range) + A$2,024 local (DHC 600 + landside 275 + side-loader 99 + doc 150 ASSUMPTION + cartage 900 ASSUMPTION) | Mixed |
| Lithium DG cargo | Ocean ×1.5 + US$350 surcharge + A$150 DG docs per shipment | ASSUMPTION; no published figure found |
| Insurance | 0.5% of goods + ocean, minimum A$60 | ASSUMPTION |
| Broker | A$350 | ASSUMPTION anchored on cited A$368 |
| IPC / biosecurity | A$50 or 152 / A$71 | Cited |
| Duty | 0% (ChAFTA CoO) | Inference; 5% tested in the unfavourable case |
| Pre-shipment inspection | A$450 per order | ASSUMPTION |
| Handling/storage | A$2 (≤0.02 cbm), A$5 (≤0.08 cbm), A$10 (bulkier) per unit | ASSUMPTION |
| Defect/damage allowance | 3% | From the brief |
| Marketplace fees | None (local pickup, cash or transfer) | Assumption |

**How outputs are defined**
- Net revenue = sale price ÷ 1.1.
- Import GST is shown separately as recoverable cash timing.
- Payback units = first-order outlay (ex-GST) ÷ net revenue per unit.

**Sensitivity cases**
- *Favourable:* FX 0.7260, LCL US$35, destination A$60/W/M, defect 2%, 20GP US$2,205.
- *Unfavourable:* FX 0.6676, LCL US$150, destination A$130/W/M, 5% duty (no CoO), defect 5%, 20GP US$2,695.

### Gaps
- No published China→AU dangerous-goods (Class 9) LCL surcharge was found, so the DG uplift is an assumption. Get itemised forwarder quotes.
- Supplier "US$" prices on Made-in-China mostly do not state Incoterms. They are treated as FOB, but some may be EXW.
- Carton cbm and weight are assumptions where supplier pages omitted them: 45–50L fridges (0.17 cbm, 21 kg), dual-zone fridges, camp kitchens, recovery kits, DC-DC chargers, 270° awnings and RTTs.

## 2. How dominant and how cheap are 4WD Supacentre (Kings / Adventure Kings), Kogan, Amazon AU sellers, Bunnings marketplace, Vevor, BCF and others? The real price floor per item

### Takeaway
4WD Supacentre's Kings brand runs daily "smashed price" deals. These set floors at or below what a small importer can land the same goods for. Examples observed on 9 Oct 2026:
- 50L compressor fridge $179
- 12V 100Ah LiFePO4 battery $169–219
- 40A DC-DC charger $179
- 3×3 gazebo $79
- double swag with bag $168.95
- 240W solar blanket $169

Amazon AU third-party Chinese brands set similar floors:
- 8kW diesel heater $129.99 with free delivery
- 100Ah LiFePO4 about $166
- 2,000–3,000A jump starters $50–60

BCF is a premium-brand channel (Dometic/Engel), not the floor. Kogan sits between the two, with "Don't Pay" prices nominated by sellers.

### Cited Findings
**4WD Supacentre / Kings (all fetched 9 Oct 2026)**
- **Daily deals:** the homepage banner reads "Up to 70% Off Smashed Price Specials". — [4WD Supacentre](https://www.4wdsupacentre.com.au/)
- An OzBargain commenter: "4WD Supacentre have different deals everyday, this deal or a better deal would roll around again" (via search summary). — [OzBargain node/958528](https://www.ozbargain.com.au/node/958528)
- **Fridges:**

  | Model | Price |
  |---|---|
  | Escape 50 | $179.00 |
  | Escape 40 + cover + AC adaptor | $199 |
  | Escape 65 + cover | $269 |
  | Escape 75 + cover | $329 |
  | Escape 90 Dual Zone + cover | $389 |
  | 45L Stayzcool MKII + cover | $548.95 |
  | 60L Stayzcool drawer | $398.90 |

  — [4WD Supacentre fridges](https://www.4wdsupacentre.com.au/fridge-freezers.html)
  - The same day, a "Recommended" widget showed Escape 50 at $349 and Escape 30 at $299, so prices vary even within a day. — [4WD Supacentre camping](https://www.4wdsupacentre.com.au/camping.html)
  - Page note: "Freight/Higher Freight charges may apply to some areas"; Click & Collect is available.
- **Fridge price history (OzBargain, via search summary):**
  - Kings Escape 30 $129 — [OzBargain](https://www.ozbargain.com.au/node/958528)
  - Escape 40 $189; its listing names an "Anuodan DC compressor". A commenter says earlier Kings units used SECOP, "apparently not any longer". — [OzBargain](https://www.ozbargain.com.au/node/942326)
  - Escape 75 + cover + adaptor $319 (April 2026). A commenter: "Same price @ Amazon … + $65 Shipping Fee". — [OzBargain](https://www.ozbargain.com.au/node/955301)
- **Batteries and DC-DC (9 Oct 2026):** 12V 100Ah LiFePO4 + 6m lead $218.95; 2× 100Ah $398; 120Ah + lead $298.95; Kings 40A DC-DC $179; 25A DC-DC + wiring kit $218. — [4WD Supacentre batteries](https://www.4wdsupacentre.com.au/batteries.html)
  - Kings 100Ah earlier sold at $169 + delivery (May 2026; "1 Year warranty", 9.5–10 kg). — [OzBargain](https://www.ozbargain.com.au/node/959431)
  - 2× 100Ah $398 (Jan 2026). — [OzBargain](https://www.ozbargain.com.au/node/944415)
- **Solar:** 240W folding blanket $169; 200W folding panel + 6m lead $182.95; 120W blanket + lead $158.95; 300W folding + lead $228.95. — [4WD Supacentre solar](https://www.4wdsupacentre.com.au/solar-power.html)
- **Swags:** Big Daddy Deluxe Double MKII (400gsm, 70mm) $249; + carry bag bundle $168.95; Pink Double $249. — [4WD Supacentre swags](https://www.4wdsupacentre.com.au/camping/swags.html)
- **Gazebos:** Kings 3×3m (heavy-duty steel) $79; Kings Plus 3×3 Commercial $349 on the gazebo page but $199 on the camping page the same day. — [gazebos](https://www.4wdsupacentre.com.au/camping/gazebos.html); [camping](https://www.4wdsupacentre.com.au/camping.html)
- **Rooftop tents:** Kings Roof Top Tent + LED light/fan $648.95; Adventure Kings RTT + 4-man annex $728; Grand Tourer Sports Lite hard-shell $1,095. — [rooftop tents](https://www.4wdsupacentre.com.au/camping/rooftop-tents.html)
- **Recovery:** Kings recovery tracks 1100mm "Made in Australia" $199; Hercules 11-piece recovery kit $199 (+ work light bundle $179.16); soft shackle/kinetic rope kit $149; Hercules 8,000kg snatch strap "NATA-tested" $59.95; Thumper Max air compressor $299. — [winches & recovery](https://www.4wdsupacentre.com.au/4wd/winches-recovery.html)
- **Gas hot water:** Kings Portable Gas Hot Water System $229. No certification statement appears on the category listing. Pump $74.95; system + pump $243.16. — [gas hot water](https://www.4wdsupacentre.com.au/camping/camp-mod-cons/gas-hot-water-system.html)
- **Jump starters:** Kings 1000A 12,000mAh MKII $79.95 (kit) and $89.95. — [jump starters](https://www.4wdsupacentre.com.au/camping/portable-power/1000a-lithium-jump-starter.html)
- **Portable power:** Kings 12/24/36Ah LiFePO4 "power packs" $179/$279/$429 (no 230V inverter listed). No 230V power stations were seen. — [portable power](https://www.4wdsupacentre.com.au/camping/portable-power.html)
- **Tables:** Kings Portable Alloy Camping Table $99; Large Aluminium Roll-Up Table $149. No storage/windscreen camp kitchen was found. — [camping tables](https://www.4wdsupacentre.com.au/camping/camping-accessories/camping-table.html)
- **Awnings:** Kings Plus 270° Tourer MKII $349 on the camping page; $412.92 with bracket and light bundle; 270° XL $799; 2×2.5m side awning $149. — [awnings](https://www.4wdsupacentre.com.au/camping/awnings.html)

**Amazon.com.au (via search summaries 9 Oct 2026; snapshot dates unknown; direct fetch blocked 503/500)**
- **Diesel heaters:**
  - PORIYA 12V 8kW all-in-one $129.99, "FREE Delivery". — [Amazon AU](https://www.amazon.com.au/PORIYA-Portable-Consumption-Thermostat-Motorhome/dp/B0F4X6XLY5)
  - Alston 12V 8kW $165.99. — [Amazon AU](https://www.amazon.com.au/Portable-Thermostat-Control-Display-Motorhome/dp/B0DXYXT9PG)
  - VEVOR 12V 8kW 5L $213.99. — [Amazon AU](https://www.amazon.com.au/VEVOR-Control-Display-Portable-Parking/dp/B0CB3XRJNF)
  - K-Musculo 12V 8kW "Supports 230V Power with Adapter" $179.99; Advwin 8kW (110V) $169.90. — [Amazon AU search](https://www.amazon.com.au/diesel-air-heater/s?k=diesel+air+heater)
- **100Ah LiFePO4:** Dumfume-type listings $165.99–169.98; generic 1280Wh 100A BMS $180.96; LiTime Group 31 $399.99; Renogy $479.99. — [Amazon AU search](https://www.amazon.com.au/lithium-battery-12v-100ah/s?k=lithium+battery+12v+100ah)
- **Power stations:**
  - BLUETTI AC70 768Wh $699 (other snapshot $899). — [Amazon AU](https://www.amazon.com.au/BLUETTI-Portable-AC70-Generator-Off-grid/dp/B0CLVF81KN)
  - EcoFlow River 2 Pro 768Wh about $799. — [Amazon AU](https://www.amazon.com.au/EF-ECOFLOW-Portable-Charging-Generator/dp/B0C2P5X425)
  - DJI Power 1000 1024Wh $999 (new from $963.18). — [Amazon AU](https://www.amazon.com.au/DJI-Portable-70-Minute-Charging-Generator/dp/B0DH54978T)
  - EcoFlow River 2 Max 512Wh $848–1,059 across snapshots. — [Amazon AU](https://www.amazon.com.au/ECOFLOW-Portable-Station-Charging-Generator/dp/B0BYJTXZJG)
  - BLUETTI Elite 100 V2 1024Wh $899–1,099 across snapshots (via search summary).
- **Gas showers:**
  - Maxkon 520L/hr $155.49 (no pump). — [Amazon AU](https://www.amazon.com.au/Maxkon-Portable-Camping-Outdoor-Instant/dp/B077PN8S8V)
  - Devanti instant $169.95. — [Amazon AU](https://www.amazon.com.au/Devanti-Portable-Heater-Outdoor-Camping/dp/B0FB8GND22)
  - Camplux AY132 5L $209.99–229. — [Amazon AU](https://www.amazon.com.au/Camplux-Tankless-Portable-Camping-Instant/dp/B08PBQ4Z8N)
  - Camplux with pump and stand $279.99. — [Amazon AU](https://www.amazon.com.au/CAMPLUX-Portable-Heater-Outdoor-Camping/dp/B08RB1XSW1)
  - Devanti with 12V pump $328.99. — [Amazon AU](https://www.amazon.com.au/DEVANTi-Outdoor-Portable-Camping-Caravan/dp/B07XT1DBJJ)
- **DC-DC 40A:**
  - Renogy 12V 40A $205.99. — [Amazon AU](https://www.amazon.com.au/Renogy-Multi-Stage-Charging-Commercial-Vehicles/dp/B0CMXF9FBM)
  - Renogy 40A MPPT $210.99 (RRP $232.99). — [Amazon AU](https://www.amazon.com.au/Renogy-40A-MPPT-Alternator-Batteries/dp/B0DJSM7ZDP)
  - Kings 40A DC-DC $226.96 on Amazon, versus $179 direct. — [Amazon AU](https://www.amazon.com.au/Kings-Charger-Lithium-Compatible-Battery/dp/B0DHX93QB6)
  - ATEM POWER 40A MPPT $237.96. — [Amazon AU](https://www.amazon.com.au/ATEM-POWER-Controller-Lead-Acid-Batteries/dp/B0C73F71P5)
- **Swags:**
  - Kings Big Daddy Deluxe Double MKII + canvas bag $168.95 — [Amazon AU swag search](https://www.amazon.com.au/swag-tent/s?k=swag+tent)
  - Mountview canvas double swag $274.99. — [Amazon AU](https://www.amazon.com.au/Mountview-Double-Single-Camping-Standing/dp/B08D9T2WQ6)
  - The $79.88 "Adventure Kings Big Daddy Deluxe Double Swag – Carry Bag (Canvas) + Mesh Flooring + Head Torch" is a carry-bag accessory bundle, not a swag. — [Amazon AU](https://www.amazon.com.au/Adventure-Kings-Daddy-Deluxe-Double/dp/B0CBBXFKN9)
- **Camp kitchens:**
  - VEVOR aluminium camp kitchen with cupboard $130.99; VEVOR with sink $166.90–193.99; Costway aluminium camp kitchen $101.90–149.95. — [Amazon AU search](https://www.amazon.com.au/camping-kitchen/s?k=camping+kitchen)
  - vidaXL aluminium camping cupboard $105.99. — [Amazon AU](https://www.amazon.com.au/Outdoor-Camping-Folding-Aluminium-Cupboard/dp/B01F1UBEOY)
  - Camp Solutions cook station $282.01. — [Amazon AU](https://www.amazon.com.au/SOLUTIONS-Portable-Aluminum-Organizer-Windscreen/dp/B09BVK1M7K)
- **Jump starters:**
  - AstroAI 2000A $58.99. — [Amazon AU](https://amazon.com.au/AstroAI-Starter-18000mAh-Informative-Cigarette/dp/B09DS1BXBF)
  - GREEN KEEPER 3000A $49.99; JIP Jump N Pump 3000A with compressor $59.99 (via search summary).
  - FEIKFEIZ 3000A $89.99. — [Amazon AU](https://www.amazon.com.au/FEIKFEIZ-Starter-24800mAh-Battery-Button/dp/B0BN8D6L1Z)
  - GOOLOO A3 3000A with compressor $99.99. — [Amazon AU](https://www.amazon.com.au/GOOLOO-Compressor-Portable-Auto-Shutoff-Supersafe/dp/B0DP4G26W2)
  - NOCO GB150 $440. — [Amazon AU](https://www.amazon.com.au/NOCO-GB150-Genius-Lithium-Starter/dp/B015TKSSB8)
- **Recovery kits:**
  - Hercules 11-piece (strap, shackles, dampener, bag) $169.00; Hercules nylon kit (strap, snatch block, tree protector, extension, 2 shackles, dampener) $179.90; OZtrail 4-piece $70.34; Autofonder kit $79.90 (via search summary). — [Amazon AU search](https://www.amazon.com.au/4wd-recovery-kit/s?k=4wd+recovery+kit); [Hercules kit](https://www.amazon.com.au/Nylon-Recovery-Essential-Snatch-Strap/dp/B07PB8CL79)
  - ARB RK12A Weekender $556.40. — [Amazon AU](https://amazon.com.au/Accessories-Premium-Recovery-Winch-Accessory/dp/B004P9C5ZA)
- **Fridges:** listings exist but prices were not captured. These include Kings Stayzcool 45L, Adventure Kings 45L (listing claims 20.8 kg, 5-year warranty), GECKO 45L, Glacio 45L, Companion 45L Transit (LG compressor, 19.3 kg), Alpicool K25 and BougeRV 42qt. — [Kings 45L](https://www.amazon.com.au/Kings-Camping-Portable-Compressor-Refrigerator/dp/B08G1DV4GB); [Adventure Kings 45L](https://www.amazon.com.au/Adventure-Kings-Portable-Camping-Freezer/dp/B0FLD9YCK2); [Companion 45L](https://www.amazon.com.au/COMPANION-45L-Transit-Fridge-Freezer/dp/B096VWWGSP); [Alpicool K25](https://www.amazon.com.au/Alpicool-K25-Refrigerator-Campervan-20%C2%B0C-20%C2%B0C/dp/B08BX7Q4YF)

**Kogan (via search summaries; fetch 403)**
- **Fridges:**
  - Glacio 50L 12/24/240V $294.60 (another snapshot $305.09). — [Kogan](https://www.kogan.com/au/buy/the-good-one-glacio-portable-fridge-50l-camping-bar-fridges-freezer-12v24v240v-tds-pfn-a-50-wheel-gr/)
  - Bitoo 50L $399. — [Kogan](https://www.kogan.com/au/buy/bitoo-50l-portable-freezer-fridge-12v24v240v-camping-car-boating-caravan-bar-fridge-su50/)
  - Eisberge 45L $259 (compressor not confirmed); VEVOR 45L dual zone $427.54–872.99. — [Kogan outdoor fridges](https://www.kogan.com/au/shop/category/home-appliances-3579/home-appliances-refrigerators-freezers-39981/outdoor-fridge-freezers/)
- **Power stations:**
  - VoltX 600W 307Wh LiFePO4 $449. — [Kogan](https://www.kogan.com/au/buy/toughland-r600-299wh-600w-portable-power-station-solar-generator-voltx-160w-solar-panel-blanket-k_ps600mat160/)
  - VoltX 1030Wh $699–764. — [Kogan VoltX](https://www.kogan.com/au/voltx/)
- **Diesel heaters:** HCalory 8kW all-in-one $188.99; 5kW $239; 2kW $112.51; VEVOR 8kW $206.99–410.63. — [Kogan diesel heaters](https://www.kogan.com/au/c/diesel-heaters/)

**Bunnings (third-party marketplace; via search summaries)**
- Giantz 5kW all-in-one $99.39. — [Bunnings](https://www.bunnings.com.au/giantz-diesel-air-heater-all-in-one-12v-5kw-lcd-remote-control-for-car-rv-indoors-caravan-machinery_p0834148)
- Giantz 12/24V 5kW $109.95. — [Bunnings](https://www.bunnings.com.au/giantz-diesel-air-heater-all-in-one-12-24v-5kw-lcd-remote-control-for-car-rv-indoors-machinery_p1108214)
- Alston 8kW $158. — [Bunnings](https://www.bunnings.com.au/diesel-air-heater-12v-8kw-portable-heater-thermostat_p1031960)
- 5kW Slimline all-in-one $319.90. — [Bunnings](https://www.bunnings.com.au/5kw-slimline-diesel-heater-all-in-one-_p0472382)
- Premium aluminium-shell 5kW $489.90. — [Bunnings](https://www.bunnings.com.au/premium-5kw-diesel-air-heater-aluminium-shell-12v-_p0912457)

**eBay AU and OzBargain diesel heater deals**
- eBay AU 12/24V 8kW (BSE-D8) AU$142.99 free postage; listing date unclear. — [eBay AU](https://www.ebay.com.au/p/6079143159)
- Silvel 5kW 12V $99.99 at Vinnies Victoria (Nov 2025). — [OzBargain](https://www.ozbargain.com.au/node/924554)

**OzBargain power stations**
- Segway Cube1000A 1024Wh $699 delivered (about Dec 2025). — [OzBargain](https://www.ozbargain.com.au/node/936490)
- Bluetti AC70P 864Wh $659.25 at Supercheap Auto. — [OzBargain](https://www.ozbargain.com.au/node/899746)
- DJI Power 1000 $664.05 at Mobileciti, cited in a Jan 2026 comment. — [OzBargain power-station tag](https://www.ozbargain.com.au/tag/power-station)

**BCF (fetched 9 Oct 2026)**
- The cheapest 35–60L fridge is a Dometic CFF45 43.5L + cover at $599 Club price (was $1,085).
- Other ranges: XTM 30L drawer $499; Dometic and Engel $849–2,099.
- No Wanderer or Companion house-brand fridges appeared in the fetched portion. — [BCF fridge freezers](https://www.bcf.com.au/camping/fridges-and-coolers/fridge-freezers?srule=price-low-to-high)
- A BCF "diesel heater" search returned only kerosene, butane and propane heaters, e.g. Companion propane outdoor heater $159.99 Club. — [BCF search](https://www.bcf.com.au/search?q=diesel%20heater)

**Vevor AU** sells 2–8kW diesel heaters, including Bluetooth all-in-one models (prices not captured). — [Vevor AU](https://www.vevor.com.au/diesel-heater-c_44649)

### Inferences
- **Real price floors used in Section 4, cheapest new and comparable:**

  | Item | Floor | Source |
  |---|---|---|
  | 45–50L single-zone fridge | $179 (sale) / $249–349 | Kings; Kogan Glacio $294.60 |
  | Dual-zone fridge | $389 for 90L | Kings Escape 90 |
  | 1kWh LiFePO4 power station | about $664–699 | Kogan/OzBargain |
  | 768Wh power station | $699 | Amazon BLUETTI AC70 |
  | 100Ah LiFePO4 | about $166–169 | Amazon / Kings |
  | 200–240W folding solar | $169–183 | Kings |
  | Diesel heater, 12V-only | $99–130 | Bunnings Giantz / Amazon PORIYA |
  | Diesel heater, 230V-capable | about $180 | Amazon K-Musculo |
  | Double swag | $168.95 | Kings |
  | Basic 3×3 gazebo | $79 | Kings |
  | Heavy-duty 3×3 gazebo | $199 | Kings Plus |
  | Soft-shell RTT | $648.95 | Kings |
  | Camp kitchen with cupboards | about $102–131 | Amazon Costway/VEVOR |
  | Gas shower with pump | $243–280 | Kings / Camplux |
  | Gas shower without pump | $155 | Maxkon |
  | Jump starter, 2–3kA | $50–60 | Amazon |
  | Recovery kit, 8–11 pieces | $169–199 | Amazon / Kings Hercules |
  | DC-DC 40A | $179 | Kings |

- Kings goods sold on Amazon AU can cost more than direct, e.g. 40A DC-DC $226.96 vs $179, and Escape 75 plus $65 shipping. So Amazon is not always the binding floor. The 4WD Supacentre direct price (with $0 Click & Collect) usually is.
- Fridges, swags, gazebos and camp kitchens are bulky, and online sellers add freight (e.g. Amazon +$65 on a Kings fridge). This gives Marketplace local pickup a real advantage. But Kings' $0 Click & Collect in metro areas neutralises much of it.

### Gaps
- **Amazon AU:**
  - Delivery costs and sellers were not confirmed, except PORIYA showing "FREE Delivery".
  - Snapshot dates are unknown because direct fetch was blocked.
  - Fridge prices (Alpicool, BougeRV, GECKO, Glacio) were not captured on Amazon AU.
- **Retailers not checked:**
  - Temu AU, Kmart/Anko, Big W and Aldi Special Buys floors were not obtained (Kmart 403; search budget exhausted).
  - Anaconda (503) and BCF house brands (Wanderer/Companion fridges) were not seen.
  - Setpower AU's site did not resolve (setpower.com.au ENOTFOUND), and Bushranger's own pricing was not checked.
- **Facebook Marketplace / Gumtree** "brand new" asking prices: Gumtree returned 403 and Facebook could not be searched. No evidence was collected.

## 3. Which Chinese factories/OEMs make these, and at what FOB price at 10–500 unit MOQs?

### Takeaway
Most listings on the platforms are "Manufacturer/Factory & Trading" hybrids with third-party audits (TÜV, SGS, BV, CTI). Clusters:
- **Diesel heaters:** Hebei (Langfang, Renqiu) and Changzhou, Jiangsu.
- **Fridges:** Ningbo/Zhejiang, Qingdao and Shanghai.
- **Gas water heaters:** Zhongshan and Foshan, Guangdong.
- **Batteries and power stations:** Shenzhen and Ningbo.
- **Tents, gazebos and recovery gear:** Shandong (Linyi, Qingdao) and Tianjin.

Indicative FOB prices:

| Item | US$ FOB |
|---|---|
| Diesel heater | 45–55 |
| Folding camp kitchen | 25–41 |
| 3×3 gazebo | 18.50–60 |
| Recovery tracks, per pair | 17.50–19.70 |
| Recovery kit | 32–35 |
| Jump starter | 17–50 |
| Gas water heater | 28–60 |
| 45–55L fridge | 110–150 |
| 100Ah LiFePO4 | 116–190 |
| 200W folding solar | about 110 |
| Double swag | 90–145 |
| 1kWh LiFePO4 power station | 249–259 |
| Soft-shell RTT | 335–560 |
| 270° awning | 160–199 |

### Cited Findings
**12V compressor fridges**
- **Ningbo Fantasticar International Trade Co., Ltd.** (Zhejiang)
  - "Manufacturer/Factory & Trading Company"; Audited Supplier (third-party); Diamond Member since 2024; capacity 100,000 pcs/month; CE.
  - 55L compressor fridge: US$130 for 10–499 pcs, US$110 for 500+. MOQ 10. Refrigerant and carton not stated. — [listing](https://fantasticlean.en.made-in-china.com/product/PmarRVAjzEtJ/China-Fantasticlean-Portable-55L-Cooler-Box-Caravan-Camping-Boat-Marine-Fishing-12-Volt-Compressor-Car-Fridge-Freezer-20-to-10.html)
- **Qingdao Smad Electric Appliances Co., Ltd.** (Qingdao, Shandong)
  - Audited, verified business licence; Diamond since 2012; capacity 100,000 pcs/month.
  - 20–50L range US$75–150, MOQ 250 (255 pcs per 20ft).
  - SECOP/Danfoss PBC-2.0 compressor, **R134a**.
  - 21L/28L cartons 59.5×33.5×52/59 cm, gross 14.4/15.4 kg; HS 8418.21.30.
  - Claims CE/EMC/SAA/CB. — [listing](https://qdsmad.en.made-in-china.com/product/RXLEOVgPJcUt/China-20-50L-12V-24V-Compressor-Mini-Portable-Camping-Car-Fridge.html)
- **Shanghai Nomad Electronics Technology Co., Ltd.**
  - Audited. 45L US$127.40–142.30, MOQ 20. — [listing](https://nomadstech.en.made-in-china.com/product/HRMrjsdXwbWD/China-Low-Noise-Robust-Sustainable-45L-Car-Fridge-with-LED-Lights-for-Fishing.html)
  - Also lists an R600a car fridge. — [R600a listing](https://nomadstech.en.made-in-china.com/product/UTMYsaRybvrX/China-Multi-Functional-Car-Fridge-with-R600A-Refrigerant-for-Outdoor-Adventures.html)
- **Hefei Gonidea International Trade Co., Ltd.** (Anhui; trading by name; audited)
  - ESW40 US$100–120, MOQ 50; Pft-CF35 US$100–150; dual-zone Pft-CF30A US$93–100. — [listing](https://hgi202009.en.made-in-china.com/product/rPzpIeuDHLkd/China-Fast-Cooling-Low-Energy-Portable-Car-Fridge-Esw40.html)
- **Hangzhou Creato Machinery Co., Ltd.** (Trading Company)
  - Waycool WG65 58L US$178.03–192.27, MOQ 100. — [listing](https://toptool.en.made-in-china.com/product/udFAWRDrYcaG/China-Waycool-Wg65-58L-Camping-Car-Fridge-Best-Portable-Car-Fridge-12V-24V-Car-Electric-Cooler-Compressor-with-OEM-and-ODM.html)
- **Qingdao D&E International Trade** — 42L US$135–155; 52L US$140–160; MOQ 1. — [listing](https://deautoparts.en.made-in-china.com/product/xwRGcZYraAfd/China-42L-Refrigerator-Automobile-Compressor-Fridge-DC-12V-24V-for-Truck-Boat-Rvs.html)

**Diesel parking heaters**
- **Hebei Wenju Electronic Technology Co., Ltd.** (Langfang, Hebei)
  - Manufacturer/Factory & Trading; TÜV Rheinland audit MIC-ASI236559; 1,120 m² plant (3,800 m² site); 30–38 staff; ISO9001/CE/RoHS.
  - All-in-one 12/24/220V 2/5kW with Bluetooth app: US$50 for 10–99, US$47 for 100–499, US$45 for 500+.
  - Carton 48×38×26 cm (0.047 cbm); product 9.5 kg; Tianjin port; "within 15 workdays". The listing is titled "...for Home". — [listing](https://hebeiwenju.en.made-in-china.com/product/KxLYvBtOgcRQ/China-Portable-All-in-One-Bag-Bluetooth-APP-Timer-12V-24V-220V-Parking-Air-Diesel-Heater-for-Home.html)
- **Renqiu Zhengmai Electric Appliance Co., Ltd.** (Renqiu, Hebei)
  - Manufacturer/Factory & Trading; audited; CE and UKCA.
  - "8kW" (spec field says 5kW) 12/24V: US$55 for 1–4, US$53 for 5–14, US$50 for 15+; MOQ 20.
  - Carton 45×45×26 cm (0.053 cbm), 6.8 kg. — [listing](https://zhengmai.en.made-in-china.com/product/NAaRgPCUgDpO/China-Zheng-Mai-8kw-12V-24V-Diesel-Parking-Heater-with-Multiple-Patent-Certificates.html)
- **Changzhou Maiyoute Auto Parts Technology Co., Ltd.** (Jiangsu; Manufacturer/Factory & Trading; CE)
  - Portable 5kW US$54–60, MOQ 1 set; OEM 5kW US$83–92. — [listing](https://heater168.en.made-in-china.com/product/VgGUcToKvAkf/China-Portable-5kw-Diesel-Air-Parking-Heater-12V-24V-Fuel-Heater-for-Vehicle-Cabin-Winter-Heating.html)
- **Changzhou Holicen New Energy Technology** (Manufacturer/Factory & Trading) — 2/5kW US$40–65, MOQ 1. — [listing](https://czholicen.en.made-in-china.com/product/bGjYcXqPbRhT/China-Best-Selling-Car-Air-Conditioner-Heating-China-LCD-Remote-Control-Autonomous-12V-24V-2kw-5kw-Diesel-Car-Parking-Air-Heater-for-Truck-Caravan-Camper.html)
- **Eunics Technology Co., Ltd.** (Liaoning) — 12/24/220V 5kW all-in-one US$40.62–48.90, MOQ 10. — [listing](https://sinopedoptronic.en.made-in-china.com/product/sawYnthDaSUr/China-12V-24V-220V-5kw-Diesel-Parking-Heater-Plastic-Case-All-in-One-Truck-Car-Motorhome-Heater-CE-Save-Cost.html)

**Portable power stations**
- **Ningbo GLGW New Energy Co., Ltd.** (audited)
  - 1024Wh LiFePO4, 1000W pure sine: US$259 for 1–49, US$249 for 50+.
  - AC220V with US/EU sockets listed, no AU socket.
  - Carton 40×25×25 cm (0.025 cbm), gross 10.4 kg.
  - Claims CE/FCC/PSE/CCC; UN38.3 and RCM not mentioned. — [listing](https://glgwenergy.en.made-in-china.com/product/RpFrDyBMrsca/China-LiFePO4-Lithium-Battery-UPS-1000W-1024wh-Solar-Outdoor-Emergency-Portable-Power-Station.html)
- **Shaoxing Rich Technology** — 600W/384Wh or 1000W/768Wh LiFePO4 pure sine, US$168.83–185.72. — [listing](https://richkj.en.made-in-china.com/product/kUPpcYgMXCWo/China-Pure-Sine-Wave-Portable-Power-Station-600W-384wh-or-1000W-768wh-LiFePO4-for-Sensitive-Electronics-Laptop-TV.html)
- **Shenzhen Singo Electronics** (Manufacturer/Factory; audited) — 902.4Wh, 1000W pure sine, US$159.72–173.65, MOQ 10. Chemistry not stated. — [listing](https://super-battery.en.made-in-china.com/product/WafpkCLuImYH/China-902-4wh-Portable-Power-Station-Pure-Sine-Wave-with-AC220V-1000W-Output-Solar-Generator-Zambia-Zimbabwe-Nigeria-in-Stock.html)
- **Shenzhen Meco New Energy** (TÜV audit MIC-ASI262372; factory over 10,000 m² in Changzhou)
  - Listed 2000Wh/1200W LiFePO4 US$288–298, MOQ 10 (OEM MOQ 500).
  - Carton 32×30×41 cm, 20 kg; CE/UN38.3/MSDS. — [listing](https://mecopower.en.made-in-china.com/product/bTzprnuBqNYU/China-Wholesale-Portable-LiFePO4-Power-Station-Solar-Generator.html)
- **Mica Power Co., Ltd.** (Manufacturer/Factory & Trading) — 1000W LiFePO4 US$502, MOQ 20. — [search listing](https://www.made-in-china.com/products-search/hot-china-products/Portable_Power_Station.html)

**12.8V 100Ah LiFePO4**
- **Shenzhen Anjaroel Technology Co., Ltd**
  - Listed as "Trading Company" (FAQ claims manufacturer); SGS audit; 7 employees, 150 m².
  - US$126 for 10–499, US$123 for 500–999, US$116 for 1,000+.
  - Carton 26×16.7×21 cm; HS 8507.60.00.90; lead time 30 days for 1–200 pcs. — [listing](https://anjaroel.en.made-in-china.com/product/HGEYgfhTucrF/China-12V-LiFePO4-Battery-12-8V-100ah-1-28kwh-Lithium-Ion-Battery-24V-25-6V-150ah-200ah-300ah-Solar-Storage-LFP-Battery-for-UPS-Camper-Outdoor-Power-Supply.html)
- **Shenzhen Lead New Energy Co., Ltd.** (Longgang; Dongguan sister factory)
  - Manufacturer/Factory & Trading; SGS audit QIP-ASI2521407; 18 staff; 2,600 m².
  - Claims Grade A EVE/REPT/Sunwoda cells; 100A continuous; from US$190; bulk 25–35 days. — [listing](https://lnewenergy.en.made-in-china.com/product/dfspNjvKGRUw/China-China-Factory-12V-100ah-200ah-230ah-280ah-314ah-400ah-460ah-560ah-600ah-628ah-IP67-Smart-RV-Marine-LiFePO4-Leisure-Battery-with-Can-RS485-Work-with-Victron.html)
- **Solid Power Industrial (Shenzhen)** — US$160–180, MOQ 27. — [listing](https://deepcyclebattery.en.made-in-china.com/product/yCTJpYVFZOkE/China-LiFePO4-12V-100ah-BMS-Bank-Lithium-Ion-Solar-Battery.html)
- **Hefei Sunshine Sci-Tech** — US$220–260. — [listing](https://hf-sunshine.en.made-in-china.com/product/gOhaZxQVXBWP/China-Sunshine-Most-Popular-LiFePO4-12V-100ah-Lithium-Battery-Lead-Acid-Replacement-Solar-RV-Marine.html)

**Folding solar**
- **Energy Free (Wuxi) Co., Ltd.** (CTI audit QIP-ASI264569)
  - 200W TOPCon folding panel US$110, MOQ 10.
  - Carton 55×60×10 cm (0.033 cbm), 9 kg; HS 8541.43; Shanghai port. — [listing](https://frxnycompany.en.made-in-china.com/product/bzKpYAUvvEhr/China-200W-Versatile-Portable-Folding-Solar-Panel-for-Camping-and-Emergency-Use.html)
- **Yangtze Solar Power** — folding 120/200/300W US$0.55–0.68/W. — [listing](https://yangtze-solar.en.made-in-china.com/product/zscmykLurehC/China-Yangtze-Folding-Solar-Panel-120W-200W-300W.html)
- **Yanglin Tech** (Fujian) — US$0.55–0.62/W, MOQ 500 W. — [listing](https://yanglinxm.en.made-in-china.com/product/ATYRBQJGWtWc/China-Portable-Solar-Panels-200W-Solar-Charging-Photovoltaic-Panel-Foldable-150W-200W-400W-Solar-Panels-in-Europe.html)

**Double swags**
- **CNtrail Camp & Outdoor Products Co., Ltd.** (Tianjin; claims own factory, 16+ years)
  - 210×120 cm floor, 14oz ripstop canvas, 65mm foam.
  - US$135 for 10–19, US$108 for 20–49, US$90 for 50+; HS 6306.22. — [listing](https://santrip.en.made-in-china.com/product/wbjEMRvhMyYc/China-Outdoor-Camping-Canvas-Portable-Double-Swag-Tent-for-Hiking.html)
- **Shanghai Remaco Industrial Co., Ltd.** (BV audit MIC-ASR2341336)
  - 400g ripstop canvas, 7cm sponge; US$135–145, MOQ 50.
  - Carton 85×35×40 cm (0.119 cbm), 22 kg; capacity 100 pcs/month. — [listing](https://remaco.en.made-in-china.com/product/PJvRYrbGsSVu/China-Factory-Bulk-Purchase-Overlanding-3-Size-Canvas-2-Person-Swag-Tent.html)
- **Ningbo YoungHunter** — "Australian Market" canvas swag US$99–139. — [listing](https://younghunter.en.made-in-china.com/product/CZafYxHjgrtS/China-Australian-Market-Bivvy-Tent-Camping-Waterproof-Canvas-Swag-Tent-2-Person-Dome-Portable-Shelter-Hiking-RV-Caravan.html)

**3×3 gazebos**
- **Shandong Pixingke Outdoor Products** (Linyi; Manufacturer/Factory & Trading; "Industry-leading Audited Factory")
  - Powder-coated steel 30/40mm tubes; 300D–800D Oxford.
  - US$27.90 for 50–299, US$24.10 for 300–499, US$18.50 for 500+.
  - Carton 147×20×20 cm (0.059 cbm), 15 kg; HS 6306.22; 20 days. — [listing](https://pixingke.en.made-in-china.com/product/OEYUfknGvdhz/China-Outdoor-Camping-Party-Pop-up-Gazebo-3X3.html)
- **Ningbo Unitent Outdoor Products** (Manufacturer/Factory & Trading; audited)
  - 3×3 pop-up with side walls US$33 at 100 sets. — [listing](https://unitent.en.made-in-china.com/product/xGRrBDsHXhkw/China-3X3-Portable-Pop-up-Canopy-Folding-Gazebo-with-Side-Walls.html)
  - With 4 sides and window US$45–60.50 at 100 sets. — [listing](https://unitent.en.made-in-china.com/product/cOGfWkXlAqVg/China-3X3m-Pop-up-Gazebo-with-4sides-and-Window-3X3-Folding-Custom-Gazebo.html)

**Soft-shell rooftop tents**
- Chengdu Sibaote (Trading): US$335–350, MOQ 1. — [listing](https://sibaotecamper.en.made-in-china.com/product/dtapsmujbvRh/China-Sbt-Outdoor-Car-Roof-Top-Camping-Waterproof-in-Built-LED-Softshell-Cover-Car-Buy-Soft-Roof-Top-Tent-with-Skylight.html)
- Lechang Xin dongsui (Manufacturer/Factory & Trading): US$400–565. — [listing](https://dongsui.en.made-in-china.com/product/PwltBKyYERhi/China-Customized-2-4-Person-Camping-Bed-Tent-Automatic-Aluminum-Outdoor-Car-Roof-Top-Tent-Soft-Shell-Rooftop-Tent.html)
- Luya Outdoor (Yiwu): US$399–519, MOQ 5. — [listing](https://hi-luya.en.made-in-china.com/product/IGAYhFWjhapX/China-Quality-Affordable-Camping-Gear-Soft-Shell-Roof-Top-Tent.html)

**Camp kitchens**
- **Welfull Group Co., Ltd.** (Hangzhou; BV audit MIC-ASI2331871; factories BSCI/SMETA; ISO 9001/14001/45001)
  - CT016 146×46×80 cm, 19mm aluminium, windscreen + 3 cupboards, 30 kg load.
  - US$25–29.50, MOQ 500; 45 days; Ningbo port. — [listing](https://welfull-outdoors.en.made-in-china.com/product/kfFpBKvoLRhH/China-Camping-Kitchen-Table-Aluminum-Portable-Outdoor-Cooking-Table-with-Windscreen-and-3-Storage-Cupboards-for-Outdoor-Activities.html)
- **Ningbo General Union** (Trading) — aluminium kitchen station with cupboard US$36–41, MOQ 100. — [listing](https://mugeneralunion.en.made-in-china.com/product/qmoretMWaSRn/China-Outdoor-Portable-Aluminum-Kitchen-Station-Folding-Camping-Table-with-Cupboard-Cabinet.html)
- **Yongkang Dashing Leisure Products Factory** — aluminium cook tables US$28.64–45.56, MOQ 100. — [listing](https://dashingleisure.en.made-in-china.com/product/DriYToZJYaks/China-Outdoor-Aluminum-Lightweight-Collapsible-Portable-Kitchen-Table-for-Camping-Picnic.html)
- **Wild Land Outdoor Gear** (Fujian) — premium kitchen boxes US$165–218. — [listing](https://wildland.en.made-in-china.com/product/gpcReRLGurhY/China-Camp-Kitchen-Wid-Land-Foldable-Aluminum-Cooking-Station.html)

**Portable gas water heaters**
- **Zhongshan Vangood Appliances Mfg** (Dongfeng Town, Zhongshan; Manufacturer/Factory & Trading; BV audit MIC-ASR261418; 32 staff; 2,800 m²; est. 2019)
  - 5.5 L/min LPG, pulse ignition (2× D cells); US$35–60, MOQ 10 (profile says 50).
  - Carton 50×34×18 cm, 5.5 kg; HS 8419.11; 35–45 days for a first order.
  - Certs: ISO9001/CB/RoHS. No AGA or AS 2658. — [listing](https://vangood.en.made-in-china.com/product/QSFnYyWKlOpv/China-Portable-Propane-Stainless-Steel-Camping-RV-Outdoor-Digital-Instant-Tankless-Gas-Water-Heater.html)
- **Guangdong Kisense** — US$28–70, MOQ 300. — [listing](https://guangdong-kisense.en.made-in-china.com/product/NdpTjHkVkyaM/China-Outdoor-Hot-Bath-Propane-Tankless-12L-Portable-Gas-Water-Heater.html)
- **Fo Shan City Nokio** — 12V-pump camping heaters US$28–200, MOQ 100. — [listing](https://okay-cn.en.made-in-china.com/product/SpVYOnDlgUkP/China-Mini-Gas-Heat-Geyser-12V-Camping-Caravan-12-Volts-Pump-Outdoor-Marine-Heater-Portable-Hot-Water-Shower-Camping-Gas-Water-Heater.html)
- **Zhejiang Dingxin** — with built-in pump US$210–230, MOQ 100. — [listing](https://dincnappliance.en.made-in-china.com/product/qGXYyJpKgaUB/China-Easy-Setup-Knob-Temperature-Control-Portable-Propane-Gas-Water-Heater-with-Water-Pump.html)

**Jump starters**
- **Hunan Meitu (Meituneng) Energy Electronic Technology** (Changsha; Manufacturer/Factory & Trading; CTI audit; 78 staff; est. 2024)
  - 2500A LiFePO4 32,000mAh: US$50 for 1–9, US$48 for 10–99, US$45 for 100+.
  - Carton 28×18×27 cm, 2.2 kg; CE/FCC/RoHS; UN38.3 not listed. — [listing](https://maxcellent.en.made-in-china.com/product/prAYnkjvHyWl/China-2500A-Peak-Spark-Proof-Digital-Display-Battery-Preheating-Car-Jump-Starter.html)
- **Guangzhou Senfly** — 3000A peak 20,000mAh US$39.90–44.90, MOQ 500. — [listing](https://senfly.en.made-in-china.com/product/xtcRjsYCldkN/China-2025-New-Model-20000mAh-74wh-1500A-3000A-Peak-Current-12V-Car-Jump-Starter-Power-Bank.html)
- **Foshan Sharmeal** — 2000A with air pump US$17–19. — [listing](https://sharmeal.en.made-in-china.com/product/btXrkuGAgScV/China-Sharmeal-Manufacturer-12V-2000A-7200mAh-Jump-Starter-Battery-Portable-Car-Battery-Booster-Jump-Starter-Power-Bank-with-Air-Pump.html)

**Recovery gear**
- **Qingdao Workercare Tools Manufacture** (Manufacturer/Factory & Trading; Diamond since 2014; 50,000 pairs/month)
  - 1060mm nylon 10t tracks: US$19.70 per pair for 100–499, US$18.50 for 500–1,399, US$17.50 for 1,400+.
  - 5.6 kg/pair; carton 110×33×13 cm; 670 pairs per 20GP; HS 3926.90. — [listing](https://workercare.en.made-in-china.com/product/FAWpjcSHnJYX/China-Recovery-Traction-Tracks-Tire-Ladder-for-Sand-Snow-Mud-4WD.html)
- **Qingdao Giant Industry & Trading** — tracks US$18.30–23.20, MOQ 50 pairs. — [listing](https://qd-giant.en.made-in-china.com/product/oQTUVZFPYxRW/China-Recovery-Tracks-Traction-Board-with-Jack-Base-for-off-Road-Sand-Mud-Snow.html)
- **Qingdao Thinkwell Hardware & Machinery** (manufacturer and trader; 160+ staff; 10,000 m²; names ISO9001/CE/BV/SGS)
  - Recovery tow-strap kit US$35 for 100–499 sets, US$32 for 500+; contents not itemised; 10–20 days; HS 7326.90. — [listing](https://thinkwell.en.made-in-china.com/product/LoUEjqrvhwtf/China-4X4-off-Road-Recovery-Tow-Strap-Recovery-Kit.html)
- **Tianshun Machinery** (Zhejiang; no audit badge) — 10-piece winch recovery kit US$75, MOQ 50. — [listing](https://zjtswinch.en.made-in-china.com/product/GXbQAlYuVnrF/China-off-Road-10PCS-Winch-Recovery-Kit-for-Jeep-4X4.html)

**DC-DC chargers**
- **Hangzhou FrankEver Imp. & Exp.** (audited; "Imp. & Exp." name suggests a trader despite a "factory direct" claim)
  - 40A solar-MPPT DC-DC: US$92 for 1–499, US$90 for 500–999, US$83 for 1,000+. — [listing](https://hzfrankever.en.made-in-china.com/product/BatrOezdbuhm/China-Solar-Input-MPPT-Dual-12vrv-Camping-Caravan-DC-DC-Battery-Charger.html)
- **Guangzhou Idealplusing** — 40A US$94.63–95.63. — [listing](https://idealplusing.en.made-in-china.com/product/ywsTWVYPkgcj/China-DC-DC-Charger-12V-40A-Battery-Charger-Used-for-Lead-Acid-Battery-and-Lithium-Battery-Compatible-in-RV-Boat.html)
- **Hangzhou Tonny Electric & Tools** (Manufacturer/Factory & Trading) — 10A IP67 US$49.80–52, MOQ 50. — [listing](https://tonnytool.en.made-in-china.com/product/VGhUZocSyOkM/China-10A-DC-DC-Battery-Charger-12V-36V-Input-IP67-for-Dual-Battery-Systems.html)

**Extras**
- **270° awnings:** Shanghai Remaco freestanding US$179–199, MOQ 10; Beijing Sunday Campers US$160–169; Lechang Xin dongsui 420D Oxford US$192–225, MOQ 20. — [Made-in-China 270° awning search](https://www.made-in-china.com/products-search/hot-china-products/270_Degree_Awning.html)
- **4WD air compressors:** Ningbo Guangyao 150–200 L/min US$50–51, MOQ 20; Remaco 4-cylinder portable US$92.50–118.90. — [Made-in-China compressor search](https://www.made-in-china.com/products-search/hot-china-products/4X4_Air_Compressor.html)

### Inferences
- Verification badges are platform and third-party audits, not proof of who actually manufactures. Several "manufacturers" are small (Anjaroel: 7 staff, 150 m²) or carry "Imp. & Exp." names. For lithium and gas products especially, request the business licence scope and factory-audit report IDs (several listed, e.g. TÜV MIC-ASI236559, SGS QIP-ASI2521407, BV MIC-ASR261418) before paying a deposit.
- Kings fridges appear to use Chinese DC compressors (Anuodan, per the OzBargain listing). So the AU incumbent sources from the same Ningbo/Qingdao-type supply base, at far larger volume.

### Gaps
- No ImportYeti or bill-of-lading data was obtained (search budget exhausted; ImportYeti covers US imports only). The OEMs behind Alpicool, BougeRV, Setpower, Kings and Bushranger are therefore not confirmed.
- No Alibaba prices were collected: the showroom returned 410 and per-listing fetches were not attempted after the budget ran out. 1688.com and GlobalSources were not checked.
- Carton data is missing for 45–50L fridges, CNtrail swags, camp kitchens, DC-DC chargers and recovery kits. Where a fridge listing states a refrigerant, it was R134a (Smad) or R600a (Nomad); the Fantasticar 55L does not say.

## 4. Per-SKU unit-economics rows (worked with the Section 1 model)

### Takeaway
Only four SKUs show a healthy margin inside the A$100–400 band at realistic first-order sizes:
- **4WD recovery kits / kit + tracks bundles:** about 30–40% gross profit.
- **Aluminium camp kitchens with cupboards:** about 32–37%, but only at a 400–500-unit MOQ.
- **Heavy-duty 3×3 gazebos with walls:** about 24–27%.
- **230V-capable all-in-one diesel heaters:** about 18–26% at 200–300 units, for winter 2027.

Results for the rest:
- **Gas showers:** work (about 22%) only above roughly 500 units, after mandatory gas certification.
- **Power stations:** work (about 16–18%) only above the band ($549–599) and with costly EESS certification.
- **Negative at any realistic order:** fridges, 100Ah LiFePO4, folding solar, swags, DC-DC chargers, jump starters, RTTs and 270° awnings, because Kings or Amazon sell at or below a small importer's landed cost.

### Cited Findings
- All price-to-beat figures are cited in Section 2 and all FOB, MOQ and carton data in Section 3. Additional SKU-level facts:
  - The Adventure Kings 45L Stayzcool MKII weighs 20.8 kg and has a 5-year warranty (Amazon listing, via search summary). This was used to anchor the fridge carton assumption. — [Amazon AU](https://www.amazon.com.au/Adventure-Kings-Portable-Camping-Freezer/dp/B0FLD9YCK2)
  - Kings 100Ah LiFePO4: "9.5–10kg", "1 Year warranty" (via search summary). — [OzBargain](https://www.ozbargain.com.au/node/959431)
  - The Hercules snatch strap is marketed as "NATA-tested" by 4WD Supacentre, which sets the quality-claim bar for recovery kits. — [4WD Supacentre recovery](https://www.4wdsupacentre.com.au/4wd/winches-recovery.html)

### Inferences
**Main table** (A$ ex-GST per unit; computed 9 Oct 2026; FX 0.6928; mid freight; 0% duty with CoO; compliance costs are ASSUMPTIONS from Section 5)

| # | Comparable SKU | Price to beat (cheapest new found) | Target MP price | FOB used (supplier, tier) | Order / mode | Landed /unit | Net rev | GP /unit | GP % | First-order cash (ex-GST) + import GST | Payback units |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 45–50L single-zone 12/24V + 240V compressor fridge, R600a | Kings Escape 50 $179 (9 Oct; $349 same-day widget); Kogan Glacio 50L $294.60 | $249 | US$115 (Fantasticar $110–130; Nomad $127–142) | 150 / 20GP | 239.9 | 226.4 | −13.6 | −6% | 34,944 + 2,858 | n/a |
| 1a | same, R134a (adds DCCEEW licence) | same | $249 | US$120 | 100 / LCL | 293.6 | 226.4 | −67.2 | −30% | 28,501 + 1,938 | n/a |
| 1b | same at the Kings $179 floor | $179 | $179 | US$115 | 150 / 20GP | 239.9 | 162.7 | −77.2 | −47% | — | n/a |
| 2 | 55–60L dual-zone fridge | Kings Escape 90 DZ $389 (90L); Kogan VEVOR 45L DZ $427.54+ | $369 | US$165 (ASSUMPTION; Waycool 58L $178–192) | 100 / LCL | 341.4 | 335.5 | −5.9 | −2% | 33,145 + 2,649 | n/a |
| 3 | 1024Wh LiFePO4 230V power station (above band) | Kogan VoltX 1030Wh $699; Segway Cube1000A $699; DJI Power 1000 $664 (Jan 2026) | $599 | US$249 (GLGW, 50+) | 50 / LCL DG | 641.1 | 544.5 | −96.5 | −18% | 31,119 + 1,828 | n/a |
| 3a | same | same | $599 | US$249 | 200 / LCL DG | 448.6 | 544.5 | +96.0 | 17.6% | 87,104 + 7,311 | 160 |
| 3b | 768Wh LiFePO4 (above band) | Amazon BLUETTI AC70 $699 | $549 | US$186 (Shaoxing Rich) | 100 / LCL DG | 417.7 | 499.1 | +81.3 | 16.3% | 40,557 + 2,736 | 81 |
| 3c | 384Wh LiFePO4 (in band) | Kogan VoltX 307Wh $449 | $349 | US$169 (Shaoxing Rich) | 100 / LCL DG | 387.2 | 317.3 | −70.0 | −22% | 37,595 + 2,478 | n/a |
| 4 | 12.8V 100Ah LiFePO4 with BMS | Amazon about $166–170; Kings $169 (May 2026) / $218.95 incl. lead (9 Oct) | $149 | US$126 (Anjaroel 10–499) | 100 / LCL DG | 215.8 | 135.5 | −80.4 | −59% | 20,953 + 1,849 | n/a |
| 5 | 200W folding mono panel / blanket | Kings 200W folding + lead $182.95; 240W blanket $169 | $149 | US$110 (Energy Free Wuxi) | 100 / LCL | 192.4 | 135.5 | −56.9 | −42% | 18,676 + 1,634 | n/a |
| 6 | 5–8kW all-in-one diesel heater, 12/24/230V, Bluetooth | Amazon K-Musculo 8kW 230V-adapter $179.99; Kogan HCalory 8kW $188.99 | $149 | US$47 (Hebei Wenju 100–499) | 200 / LCL | 111.0 | 135.5 | +24.5 | 18.1% | 21,552 + 1,474 | 159 |
| 6a | same | same | $149 | US$45 (500+ tier, ASSUMED negotiable at 300) | 300 / LCL | 99.8 | 135.5 | +35.7 | 26.3% | 29,057 | 215 |
| 6b | 12V-only all-in-one | Bunnings Giantz 5kW $99.39; Amazon PORIYA 8kW $129.99 free delivery | $109 | US$45 | 200 / LCL | 93.5 | 99.1 | +5.6 | 5.7% | 18,153 + 1,416 | 183 |
| 7 | Double canvas swag (14oz / 400g ripstop, 65–70mm foam) | Kings Big Daddy Deluxe Double MKII + bag $168.95 (Amazon AU and 4WD Supacentre) | $149 | US$90 (CNtrail 50+); US$140 (Remaco) | 50 / LCL | 201.1 / 277.5 | 135.5 | −65.6 / −142 | −48% / −105% | 9,760 / 13,471 | n/a |
| 8 | 3×3m pop-up gazebo, basic steel (below band) | Kings 3×3 $79 | $69 | US$27.90 (Pixingke 50–299) | 100 / LCL | 74.9 | 62.7 | −12.2 | −20% | 7,276 | n/a |
| 8a | 3×3 heavy-duty with 4 walls | Kings Plus 3×3 Commercial $199 (camping page) / $349 (gazebo page) | $179 | US$53 (Unitent $45–60.50) | 100 / LCL | 124.6 | 162.7 | +38.2 | 23.5% | 12,093 + 875 | 74 |
| 8b | same | same | $179 | US$50 (ASSUMED 200-unit tier) | 200 / 20GP | 119.0 | 162.7 | +43.7 | 26.9% | 23,108 | 142 |
| 9 | Soft-shell fold-out RTT (cannot fit band) | Kings RTT + light/fan $648.95 | $599 | US$345 (Sibaote) | 20 / LCL | 666.2 | 544.5 | −121.6 | −22% | 12,935 | n/a |
| 10 | Aluminium folding camp kitchen, windscreen + 3 cupboards | Amazon Costway $101.90; vidaXL $105.99; VEVOR with cupboard $130.99 | $109 | US$38.50 (Ningbo General Union, 100) | 100 / LCL | 91.0 | 99.1 | +8.1 | 8.2% | 8,833 + 631 | 89 |
| 10a | same | same | $109 | US$27.25 (Welfull, MOQ 500) | 500 / LCL (30 cbm) | 62.7 | 99.1 | +36.4 | 36.7% | 30,439 | about 307 |
| 10b | same | same | $109 | US$27.25 | 400 / 20GP | 62.9 | 99.1 | +36.2 | 36.6% | 24,413 + 1,937 | 246 |
| 11 | LPG instant shower about 5.5 L/min + 12V pump, certified | Kings HWS + pump $243.16; Amazon Camplux with pump $279.99; Maxkon (no pump) $155.49 | $199 | US$50 (Vangood $35–60 + pump) | 200 / LCL; cert A$25k | 223.3 | 180.9 | −42.4 | −23% | 43,354 + 1,522 | n/a |
| 11a | same | same | $199 | US$50 | 500 / LCL; cert A$25k | 141.4 | 180.9 | +39.5 | 21.8% | 68,662 + 3,804 | 380 |
| 12 | 2500A LiFePO4 jump starter (below band) | Amazon GREEN KEEPER 3000A $49.99; AstroAI 2000A $58.99; GOOLOO A3 with compressor $99.99; Kings 1000A $79.95 | $89 | US$45 (Hunan Meitu 100+) | 100 / LCL DG | 99.6 | 80.9 | −18.7 | −23% | 9,673 | n/a |
| 13 | 8–11 piece recovery kit (8t strap, 2 shackles, tree protector, extension, dampener, bag) | Amazon Hercules 11-pc $169; Hercules nylon kit $179.90; 4WD Supacentre Hercules 11-pc $199 / bundle $179.16 | $139 | US$35 (Thinkwell 100–499) | 100 / LCL | 84.1 | 126.4 | +42.3 | 33.5% | 8,160 + 546 | 65 |
| 13a | same, with A$1,000 independent break-test | same | $139 | US$35 | 100 / LCL | 89.2 | 126.4 | +37.2 | 29.4% | 8,660 | 69 |
| 13b | same | same | $139 | US$33 (ASSUMED) | 200 / LCL | 73.7 | 126.4 | +52.7 | 41.7% | 14,302 | 113 |
| 13c | Kit + 1060mm nylon tracks bundle | Kings Hercules kit $179.16 + Kings tracks $191–199 (bought separately) | $199 | US$54.70 (Thinkwell + Workercare) | 100 / LCL | 124.2 | 180.9 | +56.8 | 31.4% | 12,054 + 885 | 67 |
| 13d | Tracks pair alone (below band) | Kings AU-made tracks $199; Amazon generic pair not captured | $79 | US$19.70 (Workercare) | 100 / LCL | 60.1 | 71.8 | +11.7 | 16.3% | 5,835 | 81 |
| 14 | 40A DC-DC charger with MPPT | Kings 40A $179 (9 Oct); Amazon Renogy 40A $205.99 | $159 | US$92 (FrankEver) | 100 / LCL | 167.3 | 144.5 | −22.8 | −16% | 16,245 + 1,346 | n/a |
| 15 | 270° freestanding awning | Kings Plus 270° Tourer MKII $349 | $349 | US$189 (Remaco) | 20 / LCL | 393.0 | 317.3 | −75.7 | −24% | 7,631 | n/a |

**Sensitivity** (landed A$/unit and GP%; favourable / mid / unfavourable cases from Section 1)

| SKU | Favourable | Mid | Unfavourable |
|---|---|---|---|
| Recovery kit $139 (100) | 77.9 / 38.4% | 84.1 / 33.5% | 95.1 / 24.7% |
| Kit + tracks $199 (100) | 111.6 / 38.3% | 124.2 / 31.4% | 146.1 / 19.2% |
| Camp kitchen Welfull 400 in 20GP | 59.1 / 40.3% | 62.9 / 36.6% | 69.1 / 30.3% |
| Camp kitchen NGU 100 LCL | 81.6 / 17.7% | 91.0 / 8.2% | 107.4 / −8.4% |
| Heavy-duty gazebo $179 (100) | 110.9 / 31.9% | 124.6 / 23.5% | 148.3 / 8.9% |
| Diesel heater all-in-one $149 (200) | 102.0 / 24.7% | 111.0 / 18.1% | 127.0 / 6.2% |
| Diesel heater 12V-only $109 (200) | 84.8 / 14.4% | 93.5 / 5.7% | 108.9 / −9.9% |
| Gas shower $199 (500, cert $25k) | 133.6 / 26.1% | 141.4 / 21.8% | 155.8 / 13.9% |
| Power station 768Wh $549 (100) | 397.9 / 20.3% | 417.7 / 16.3% | 456.1 / 8.6% |
| Fridge 45–50L $249 (150, 20GP) | 226.4 / 0.0% | 239.9 / −6.0% | 263.8 / −16.5% |
| DC-DC 40A $159 (100) | 158.5 / −9.6% | 167.3 / −15.8% | 184.7 / −27.8% |

**Observations by product**
- **Fridges** fail even in the favourable case (0% GP at $249). A sale at the Kings $179 floor loses about $77 per unit. Choosing R134a adds the A$3,000 DCCEEW licence (about $30/unit at 100 units).
- **Diesel heaters:** the 230V-capable all-in-one only clears about 18% gross profit at 200 units because its assumed A$3.3k EESS/EMC compliance cost is spread over few units. The 12V-only version avoids most of that cost but meets a $99–130 floor.
- **Power stations:** the in-band 384Wh unit loses money because about A$10.3k of certification (assumption) spread over 100 units adds about $103 per unit. Without that cost the GP would be roughly +$33 (inference). Larger units only pencil out above the A$400 band.
- **Recovery kits** have the best mix: about 33% GP, small cbm, cash under A$9k, payback about 65 units. They need truthful tested ratings (Section 5).

### Gaps
- **Assumed supplier prices:** several FOB tiers are assumptions, not quoted prices:
  - US$45 at 300 diesel heaters (the listed 500+ tier)
  - US$50 at 200 gazebos
  - US$33 at 200 recovery kits
  - US$165 for a dual-zone 55–60L fridge
  - US$345 RTT and US$189 awning (taken from listing ranges)
- **Assumed packaging:** carton cbm and weight are assumptions for fridges, camp kitchens, recovery kits, heavy-duty gazebos, DC-DC chargers, RTTs and awnings.
- **Assumed costs:** compliance amounts (fridge adaptor A$1.8k; power station A$10.3k; diesel heater 230V A$3.3k; gas certification A$25k; EMC/testing A$0.5–1k) and the DG uplift are assumptions without quotes.
- **Price-to-beat gaps:** no Amazon AU prices were captured for fridges, folding solar, heavy-duty gazebos or recovery tracks, so those rows use the 4WD Supacentre or Kogan floor instead.
- **Selling costs:** Marketplace selling fees, payment fraud, returns handling and warranty claims beyond the 3% defect allowance are not modelled.

## 5. Compliance traps: (a) refrigerants, (b) power stations, (c) lithium shipping, (d) diesel heaters, (e) gas showers, plus other items

### Takeaway
Compliance burden ranks the products:
- **Highest:** gas showers (mandatory gas-appliance certification before sale), then power stations (EESS certification as a portable UPS/inverter plus Class 9 DG shipping).
- **Moderate:** fridges with HFC refrigerant (A$3,000 DCCEEW licence, which R600a appears to avoid), 230V diesel heaters (in-scope electrical equipment, plus carbon-monoxide and installation liability), and lithium batteries and jump starters (DG shipping).
- **Light (general ACL safety, no specific regulation found):** swags, gazebos, camp kitchens and recovery gear. Recovery gear is safety-critical, so its rating claims must be true.

### Cited Findings
**(a) Refrigerants and the pre-charged equipment licence**
- **Who needs it:** a licence is required to import refrigeration or air-conditioning equipment containing an HFC or HCFC. This includes equipment built into other objects (examples given: caravans, vending machines, water coolers). — [ABLIS pre-charged equipment licence](https://ablis.business.gov.au/service/ag/pre-charged-equipment-licence/251)
- **Exemption:** "not required if you are importing no more than 5 pieces of equipment" in a single consignment, with "under 10 kg in total". — same source
- **Fee:** A$3,000 to apply and A$3,000 to renew, "Fees for 2026-27"; non-refundable (via search summary). — same source
- **Conflicting threshold:** the WTO import-licensing summary says importers of up to 25 kg of SGG in equipment per calendar year need no licence (via search summary). — [WTO import licensing](https://importlicensing.wto.org/content/ozone-depleting-substances-and-synthetic-greenhouse-gases-1)
- **Processing time:** DCCEEW reportedly aims to assess in about 2 weeks, with up to 60 days allowed by statute (search summary of DCCEEW guidance; the DCCEEW page returned 503 when fetched).
- **Upcoming HFC limits:**
  - An IChEMS proposal would limit new domestic and commercial cold-chain refrigeration imports to HFCs with GWP under 150 from 1 Jan 2028. Transport refrigeration is exempt until review after 2032. Consultation closes 23 Oct 2026 (via search summary). — [National EPA node/327](https://www.nationalepa.gov.au/node/327)
  - HFCs have been added to the IChEMS 2026-27 workplan, with possible pre-charged-equipment restrictions by 1 July 2027. — [VASA](https://vasa.org.au/australia-flags-new-hfc-restrictions-lists-refrigerants-on-2026-27-ichems-workplan/)
  - The bans currently in force (750 GWP) cover air conditioners only. — [hvacrnews](https://hvacrnews.com.au/regulations/new-restrictions-for-multi-head-splits-and-vrf-systems)
- **Refrigerants in Chinese 12V fridges:** Qingdao Smad lists R134a with a SECOP compressor. Shanghai Nomad and Kogan's Sanjo 50L list R600a. — [Smad](https://qdsmad.en.made-in-china.com/product/RXLEOVgPJcUt/China-20-50L-12V-24V-Compressor-Mini-Portable-Camping-Car-Fridge.html); [Nomad R600a](https://nomadstech.en.made-in-china.com/product/UTMYsaRybvrX/China-Multi-Functional-Car-Fridge-with-R600A-Refrigerant-for-Outdoor-Adventures.html); [Kogan Sanjo, via search summary](https://www.kogan.com/au/buy/yourcart-50l-portable-upright-fridge-freezer-12v24v-dc-compressor-refrigerator-for-rv-boat-truck-off-grid-use-45010758238380/)

**(b) Power stations with 230V outputs and AC chargers: EESS and RCM**
- EESS General Guidance #20/006 (issued 17 July 2020; hosted in the 2026/07 uploads folder):
  - A portable UPS "should be certified to AS 62040.1".
  - With a DC output for charging external batteries, AS/NZS 60335.2.29 also applies.
  - AS/NZS 62368 "is not suitable".
  - A device with a renewable DC input as well as an AC input "is likely an inverter with a UPS function". For such devices "inverters should consider AS 4763 for portable inverters and AS/NZS 4777.2, noting a portable plug-in type device is prohibited by AS/NZS 4777.2". — [EESS 20/006](https://www.eess.gov.au/wp-content/uploads/2026/07/20-006-General-guidance-Standards-for-portable-UPS-devices-v1.0.pdf)
- Power supplies are "Declared Articles … level 3 items under the EESS" (via search summary). — [SAA Approvals](https://www.saaapprovals.com.au/newsletter-1-2017/)
- EESS bulletin 21-030 sets certification standards for power supplies and battery chargers (via search summary). — [EESS 21-030](https://www.eess.gov.au/wp-content/uploads/2026/07/21-030-Information-Bulletin-Power-supply-battery-charger-standards-v2.0.pdf)
- Only a local (AU/NZ) entity can be the Responsible Supplier (via search summary). — [EESS Information Notice 04](https://www.eess.gov.au/wp-content/uploads/2019/06/Information-Notice-04-EESS-Commencement-Responsible-Supplier.pdf)
- The GLGW 1024Wh listing gives AC220V with US/EU sockets and claims CE/FCC/PSE/CCC only. — [GLGW](https://glgwenergy.en.made-in-china.com/product/RpFrDyBMrsca/China-LiFePO4-Lithium-Battery-UPS-1000W-1024wh-Solar-Outdoor-Emergency-Portable-Power-Station.html)

**(c) Lithium batteries: Class 9 dangerous goods**
- UN3480/UN3481 can ship as LCL only where the carrier confirms safe stowage. Cargo is consolidated at a CFS under IMDG segregation rules.
- Required documents: MSDS, a UN packaging performance certificate, a UN38.3 test summary, a transport classification report and an IMDG Dangerous Goods Declaration.
- Packing rules: "≤30% SOC" and UN-certified insulated packaging; the shipment must comply with the ADG Code.
- No surcharge amounts are published. — [Goodhope Freight DG guide](https://goodhopefreight.com/australia/dg.html)
- Dedicated Class 8/9 LCL services exist on China–Europe lanes, which shows such cargo needs specialist consolidation (via search summary). — [Logistics Business](https://logisticsbusiness.com/transport-distribution/lcl-service-for-dangerous-goods-2/)

**(d) Diesel heaters**
- **Gasmate DH203 recall (PRA 2023/19881):**
  - A 12V portable diesel heater whose standard appliance inlet could accept a 240V lead, creating an electric-shock risk.
  - Sold 1 Nov 2022–31 May 2023 through BCF and Snowys.
  - Regulator: Energy Safe Victoria (via search summary). — [Product Safety Australia recall](https://www.productsafety.gov.au/recalls/sitro-group-australia-pty-ltd-—-gasmate-portable-diesel-heater-dh203)
- **UK OPSS** rejected Vevor diesel heaters at the border (Nov 2025 and Jan 2026 reports). Diesel heaters "must only be used in sufficiently ventilated spaces", otherwise users face "potentially fatal concentrations of carbon monoxide".
  - A 2023 UK recall cited missing warnings about exhaust placement. — [OPSS 2511-0300](https://www.gov.uk/product-safety-alerts-reports-recalls/product-safety-report-vevor-diesel-heater-2511-0300); [OPSS 2511-0312](https://www.gov.uk/product-safety-alerts-reports-recalls/product-safety-report-vevor-diesel-heater-2511-0312); [OPSS 2306-0119](https://www.gov.uk/product-safety-alerts-reports-recalls/product-recall-vevor-diesel-car-parking-heater-2306-0119)
- **Australian industry press:** cheap Chinese heaters have "a bad reputation for reliability, parts availability and, most importantly, safety"; repairers report "dodgy products" (via search summary). — [RV Daily](https://magazine.rvdaily.com.au/rv-daily-issue-043/hot-as-or-cheap-ass-don-t-get-burned-by-a-chinese-diesel-heater)
- **Price gap:** a retailer prices budget units at about $200–800 versus about $1,300–1,600 for Autoterm. — [Everything Caravans](https://www.everythingcaravans.com.au/blogs/installations/autoterm-vs-cheap-diesel-heaters-the-honest-comparison)
- **Buyer guidance:** an AU buyer's guide advises preferring units with Australian RCM/EMC compliance and fitting a CO alarm (via search summary). — [What's Up Down Under](https://whatsupdownunder.com.au/plan/buyers-guide/best-diesel-heaters-camper-trailers-vans-2026/)
- **Gas heating in tents and caravans:** WA's gas regulator says portable gas equipment "must never be used inside tents, caravans or other enclosed spaces". This covers gas, not diesel, but signals regulators' CO focus. — [WA Consumer Protection](https://www.wa.gov.au/government/announcements/commissioners-blog-gas-safety-warning-campers)

**(e) Gas showers and camp cookers**
- **Certified AU products:**
  - Bushranger kit: "GasMark certified", tested to AS 2658:2008 (+A3), "Certified By AGA" no. 8498. — [MyGenerator Bushranger](https://mygenerator.com.au/bushranger-portable-gas-hot-water-shower-kit)
  - Gasmate Water-Tech: AGA cert 8639 G. — [MyGenerator Gasmate](https://www.mygenerator.com.au/gasmate-water-tech-5-litre-water-heater-with-pump-shower-attachments)
  - Smarttek: AS 2658 via IAPMO GMK10507. — [4WD Industries](https://www.4wdindustries.com.au/smarttek-black-instant-portable-smart-hot-water-sy)
  - Camplux at Bunnings mentions only an AGA-certified regulator. — [Bunnings Camplux](https://www.bunnings.com.au/camplux-5l-portable-propane-water-systerm-outdoor-gas-shower-pump-stand-kit_p0731631)
- **Certifiers and standards:** listed certifiers include SAI Global, IAPMO R&T Oceania, the Australian Gas Association, Global-Mark and BSI. AS 2658 covers LP gas portable and mobile appliances. — [NZ Gazette 2020-au646](https://gazette.govt.nz/notice/id/2020-au646)
- **GTRC rules:** equipment must comply with amended standards within 2 years. — [BSI FAQ](https://www.bsigroup.com/globalassets/localfiles/en-au/benchmark/gas/faqs---asnzs-5263.0-2023-transition.pdf)
- **State regulators:** e.g. Tasmania's Director of Gas Safety determines safety standards for Type A gas appliances sold there. — [CBOS Tasmania](https://cbos.tas.gov.au/topics/technical-regulation/gas-standards-safety/gas-appliances-and-components)
- **Chinese supplier certification:** the Zhongshan Vangood heater lists ISO9001/CB/RoHS, with no AGA or AS 2658. — [Vangood](https://vangood.en.made-in-china.com/product/QSFnYyWKlOpv/China-Portable-Propane-Stainless-Steel-Camping-RV-Outdoor-Digital-Instant-Tankless-Gas-Water-Heater.html)

### Inferences
**(a) Fridges**
- Choose R600a (isobutane) models. Hydrocarbons are not HFCs or HCFCs, so they appear to fall outside the licence. This is an inference from the licence scope; confirm with ozone@dcceew.gov.au.
- With R134a, budget A$3,000 per licence. The licence only stops being required at about 5 units per consignment, or 25 kg/yr per the WTO summary, which conflicts.
- The 1 Jan 2028 GWP<150 proposal could bar R134a imports later. Where portable 12V fridges fall (domestic vs transport) is not established.
- The 240V AC adaptor supplied with most fridges is a Level 3 declared power supply. It needs a certificate of conformity and EESS registration by the Australian importer. Assumed cost: A$1,500 certificate (reusing a CB report) plus about A$319 registration, the parallel researcher's estimate.

**(b) Power stations**
- Certification to AS 62040.1 + AS/NZS 60335.2.29, plus possibly AS 4763, ACMA EMC and AS/NZS 3112 sockets. Assumed cost A$5k–20k per model (A$10k used) and 6–12 weeks. No cost source was found.
- Most Chinese listings carry no RCM, and some ship with US/EU sockets.

**(c) Lithium batteries**
- Assumed uplift: about US$350 DG surcharge + A$150 docs per shipment + 50% on the LCL rate.
- For 100Ah batteries this is not the deal-breaker; the retail floor is.

**(d) Diesel heaters**
- No Australian mandatory standard or 2025–26 recall specific to diesel heaters was found.
- The 230V supply or inlet triggers electrical-safety obligations: the Gasmate DH203 recall shows the regulator's focus. Assumed certification + EMC cost A$3k.
- Avoid supplier marketing for "home/indoor" use, as in the Hebei Wenju listing title. Include CO warnings, exhaust-outside instructions and a CO-alarm recommendation.
- Installation in caravans or vehicles is a DIY/installer liability.

**(e) Gas showers**
- Selling an uncertified unit is not legal (inference from the state Type A appliance regimes). Certification cost is assumed at A$15k–40k (A$25k used) with 3–6 months lead time.
- This pushes breakeven to about 400–500 units.

**Other items**
- **12V DC-only devices** (DC-DC chargers, 12V diesel heaters, jump starters charged by USB-C, solar panels under 50V) sit outside EESS low-voltage scope. That is an inference from the 50V AC / 120V DC scope in Section 1 search results. They likely still need an ACMA EMC supplier declaration and RCM; A$500–1,000 assumed.
- **Swags, gazebos, camp kitchens, recovery tracks:** no specific mandatory standard was found (ACL general safety only).
- **Snatch straps and shackles** are safety-critical. Marketing claims (MBS/WLL, "NATA-tested") must be substantiated; A$500–1,000 of independent testing assumed.

### Gaps
- DCCEEW pages could not be fetched (503). Not confirmed: whether hydrocarbon-refrigerant equipment is fully exempt, any per-kg equipment levy or reporting conditions, the licence term, and which exemption threshold currently applies.
- No GEMS (energy rating) determination was checked for 12V/240V portable fridges.
- No EESS level classification specifically for "portable power station" or "diesel heater with 230V supply" was found, and no certification price quotes.
- No Australian regulator (ACCC, Fair Trading, ESV) diesel-heater CO warning, coroner finding or mandatory standard was found in searches.
- No gas-appliance certification cost was found.
- No numeric DG surcharges were found.
- No mandatory standard check was done for recovery straps or shackles.

## 6. Seasonality and order timing (today is 9 Oct 2026)

### Takeaway
New orders placed now will probably miss the peak:
- **Christmas / summer holidays (from 18 Dec):** supplier lead times of 15–45 days plus 21–37 days at sea plus clearance put landing in December at best.
- **Easter 2027 (Easter Sunday 28 Mar):** production must finish before Chinese New Year on 6 Feb 2027, so place orders by about early November.
- **NSW April school holidays (12–23 Apr 2027) and winter 2027:** easier targets. Diesel heaters, the strongest winter item, should be ordered February–March 2027 to land by May for the June–July cold and the NSW winter holidays (5–16 Jul 2027).

### Cited Findings
- **NSW school calendar:**

  | Period | Dates |
  |---|---|
  | Spring holidays 2026 | 28 Sep–9 Oct |
  | Term 4 2026 | ends 17 Dec |
  | Summer holidays (Eastern division) | 18 Dec 2026–27 Jan 2027 |
  | Summer holidays (Western division) | to 3 Feb 2027 |

  — [NSW Education 2026](https://education.nsw.gov.au/schooling/calendars/2026)
- **NSW 2027 holidays:** autumn 12–23 Apr; winter 5–16 Jul; spring 27 Sep–8 Oct. — [NSW Education future dates](https://education.nsw.gov.au/schooling/calendars/future-and-past-nsw-term-and-vacation-dates)
- **Chinese New Year:** 6 Feb 2027 (17 Feb 2026; 26 Jan 2028). — [Travel China Guide](https://www.travelchinaguide.com/essential/holidays/new-year/dates.htm)
- **Supplier lead times:**
  - Hebei Wenju diesel heaters: "within 15 workdays" — [listing](https://hebeiwenju.en.made-in-china.com/product/KxLYvBtOgcRQ/China-Portable-All-in-One-Bag-Bluetooth-APP-Timer-12V-24V-220V-Parking-Air-Diesel-Heater-for-Home.html)
  - Vangood gas heaters: 35–45 days for a first order — [listing](https://vangood.en.made-in-china.com/product/QSFnYyWKlOpv/China-Portable-Propane-Stainless-Steel-Camping-RV-Outdoor-Digital-Instant-Tankless-Gas-Water-Heater.html)
  - Welfull camp kitchen: 45 days — [listing](https://welfull-outdoors.en.made-in-china.com/product/kfFpBKvoLRhH/China-Camping-Kitchen-Table-Aluminum-Portable-Outdoor-Cooking-Table-with-Windscreen-and-3-Storage-Cupboards-for-Outdoor-Activities.html)
  - Thinkwell recovery kits: 10–20 days — [listing](https://thinkwell.en.made-in-china.com/product/LoUEjqrvhwtf/China-4X4-off-Road-Recovery-Tow-Strap-Recovery-Kit.html)
  - Shenzhen Lead batteries: 25–35 days — [listing](https://lnewenergy.en.made-in-china.com/product/dfspNjvKGRUw/China-China-Factory-12V-100ah-200ah-230ah-280ah-314ah-400ah-460ah-560ah-600ah-628ah-IP67-Smart-RV-Marine-LiFePO4-Leisure-Battery-with-Can-RS485-Work-with-Victron.html)
- **Transit:** LCL 21–31 days to Sydney. — [sino-shipping](https://www.sino-shipping.com/country-guides/freight-from-china-to-australia/)
- **KLN (Sept 2026), as recorded by the parallel landed-cost researcher:**
  - Shanghai/Ningbo→Sydney 24–25 days typical, 35–37 worst case.
  - Typhoon season adds 3–5 days.
  - "the Christmas booking window was closing". — [KLN Sept 2026](https://info.oceania.kln.com/customer-advisory/fcl-shipping-rates-from-china-to-australia-september-2026-outlook)
- **End-of-winter signal:** Bunnings cleared 1000W oil-column heaters at $3 in-store in September 2026 (via search summary). — [OzBargain node/975800](https://www.ozbargain.com.au/node/975800)

### Inferences
- **Easter 2027:** Easter Sunday is 28 Mar 2027, computed with the Gregorian computus (2026 gives 5 Apr). NSW autumn holidays fall after Easter, on 12–23 Apr.
- **Camping peak:** demand for camping and 4WD gear peaks over the summer holidays and Easter/April. An order placed 9–20 Oct 2026 with a 15–20-day producer (recovery kits, heaters) could land in Sydney around 5–20 Dec. That catches only part of the summer peak, and missed sailings are likely.
- **Recommended timing:**
  1. Recovery kits and camp kitchens: order immediately for late-December arrival, or by mid-November for pre-Chinese-New-Year production and February/March arrival before Easter and the April holidays.
  2. Diesel heaters: order Feb–Mar 2027 after Chinese New Year; land by late April. Selling stops by about August, so plan an end-of-season clearance and avoid carrying stock.
  3. Gas showers and power stations: certification (3–6 months, assumed) means these cannot reach market before winter 2027 at the earliest.
- **Bulky items** (gazebos, kitchens, swags) also suffer storage costs if they miss a season. Budget handling for one off-season if timing slips.

### Gaps
- No Google Trends, Facebook Marketplace or Gumtree search-volume data by month was obtained for "diesel heater", "camping fridge", "swag" or "gazebo". Seasonality is inferred from school holidays and retailer clearance signals, not measured demand.
- Victorian and Queensland 2026–27 school calendars were not fetched.

## 7. Ranking and verdict scores (1–10) for this category

### Takeaway
This is a hard category for small-batch Marketplace arbitrage. 4WD Supacentre's Kings range and Amazon AU's Chinese sellers already sell most hero products (fridges, lithium, solar, swags, DC-DC) at or below a small importer's landed cost. The best bets are low-compliance, mid-ticket, moderately bulky items: 4WD recovery kits and bundles first, then camp kitchens (at MOQ 400–500), heavy-duty gazebos and 230V diesel heaters for winter 2027.

### Cited Findings
- **Kings floors (9 Oct 2026):** Escape 50 fridge $179; 100Ah LiFePO4 $218.95 (with lead) and $169 in May 2026; 40A DC-DC $179; 240W blanket $169; double swag + bag $168.95; 3×3 gazebo $79. — [fridges](https://www.4wdsupacentre.com.au/fridge-freezers.html); [batteries](https://www.4wdsupacentre.com.au/batteries.html); [solar](https://www.4wdsupacentre.com.au/solar-power.html); [swags](https://www.4wdsupacentre.com.au/camping/swags.html); [gazebos](https://www.4wdsupacentre.com.au/camping/gazebos.html); [OzBargain 100Ah](https://www.ozbargain.com.au/node/959431)
- **Amazon AU recovery-kit benchmark:** Hercules 11-piece $169 / nylon kit $179.90 (via search summary). — [Amazon AU](https://www.amazon.com.au/4wd-recovery-kit/s?k=4wd+recovery+kit)
- **Amazon AU camp-kitchen benchmark:** VEVOR $130.99, Costway $101.90–149.95 (via search summary). — [Amazon AU](https://www.amazon.com.au/camping-kitchen/s?k=camping+kitchen)

### Inferences
**Ranking** (score weighs margin, demand, saturation, compliance difficulty, bulk advantage on Marketplace, and defect/warranty risk):

| Rank | Product | Score | Why |
|---|---|---|---|
| 1 | **4WD recovery kit, 8–11 piece (or kit + tracks bundle at $199)** | **6** | About 29–42% GP at $139, payback about 65–113 units, cash about A$8–14k. Low cbm, no DG or EESS. Clear benchmark (Amazon Hercules $169; Kings $179–199). Risks: safety-critical liability if strap/shackle ratings are not genuine (budget testing), and competition from Kings Hercules deals. Tracks alone sit below the band, so bundle them. |
| 2 | **Aluminium folding camp kitchen with windscreen + cupboards** | **5** | About 36% GP at $109 only with Welfull's MOQ 500 (or about 400 in a 20GP), cash about A$24–30k, payback about 250–330 units. At 100 units, only about 8%. Bulky, so local pickup helps; no compliance. Risk: Amazon VEVOR/Costway $102–131 and possible further undercutting. |
| 3 | **Diesel heater, 5–8kW all-in-one 12/24/230V** | **5** | 18–26% GP at $149 (200–300 units; cash about A$22–29k). Strong winter demand but saturated: Amazon, Bunnings marketplace, eBay and Kogan at $99–190. CO and installation liability. 230V electrical compliance (recall precedent). Must order for winter 2027. The 12V-only version scores **3**: about 6% GP at $109. |
| 4 | **Heavy-duty 3×3 gazebo with 4 walls** | **4** | 23–27% GP at $179 versus Kings Plus Commercial $199–349. Benefits from local pickup. But Amazon AU's comparable floor is unknown, wind-damage warranty claims are likely, and Kings' $79 basic gazebo anchors buyers' price expectations. The basic 3×3 scores **1** (below band, loss-making). |
| 5 | **Portable LPG shower + pump (certified)** | **3** | Gross margin per unit is fine (about $86 before certification), but certification (assumed A$25k, 3–6 months) needs about 500 units to give about 22% GP; cash about A$69k. Selling uncertified is unlawful. |
| 6 | **Power station 768–1,024Wh LiFePO4** | **3** | About 16–18% GP only at $549–599, above the A$100–400 band, and only at 100–200 units (A$41–87k cash). Needs AS 62040.1 / 60335.2.29 certification, Class 9 shipping, AU sockets, and carries fire/warranty risk. In-band 384Wh units lose money. Score **1** inside the band. |
| 7 | **12V compressor fridge 45–50L (single and dual zone)** | **2** | Negative at $249 against Kings $179–349 and Kogan $259–295. Heavy and bulky; compressor warranty risk; R134a licence trap. Strong demand, but Kings dominates. |
| 8 | **DC-DC charger 40A MPPT** | **2** | Landed about $167 against Kings $179 / Renogy $206. Installer/warranty risk. |
| 9 | **Jump starter** | **1** | Below band; Amazon $50–60 for 2,000–3,000A; DG shipping. |
| 10 | **100Ah LiFePO4** | **1** | Landed about $216 against Amazon about $166 / Kings $169–219. DG shipping; "Grade A" cell claims hard to verify. |
| 11 | **200W folding solar / blanket** | **1** | Landed about $192 against Kings $169–183. |
| 12 | **Double swag** | **1** | Landed $201–278 against Kings $168.95. Bulky. |
| 13 | **270° freestanding awning** (extra) | **1** | Landed about $393 against Kings $349. |
| 14 | **Soft-shell rooftop tent** | **0** | Cannot fit under A$400: FOB alone A$484–808, landed about $666, Kings $649+. |

**Not modelled for lack of an AU price-to-beat:** 12V 4WD air compressors. FOB is US$50–119 (Ningbo Guangyao; Remaco) against Kings Thumper Max $299. The dual-cylinder spec is not comparable, so this is a possible follow-up.

### Gaps
- Verdicts depend on Amazon AU and Kogan floors read from search snippets of unknown date. Recheck live prices (Kings deals change daily) before ordering.
- Facebook Marketplace realised "brand new" prices and sell-through rates were not measured (blocked or out of budget). Demand weighting relies on the parallel demand researcher's notes and on category knowledge.
- Compliance costs (EESS certification, gas certification, testing) and DG surcharges are labelled assumptions. Itemised quotes from an accredited certifier and a DG-capable forwarder could change rankings 3–6.
