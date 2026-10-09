# Verification of the shortlisted kids' products for China → Facebook Marketplace AU import arbitrage (checked 9 Oct 2026)

**Scope.** This file independently re-checks the four kids' SKUs shortlisted in `vertical_kids_toys.md`: the 14ft trampoline, the 24V 2-seat UTV, the timber cubby and the 3-in-1 high chair. For each SKU it re-checks three inputs:
- the price to beat (cheapest comparable new item, Amazon.com.au first);
- the factory FOB price and carton CBM/weight;
- compliance.

It then recomputes gross profit (GP) on the coordinator's shared base assumptions and gives a verdict. All dates are 9 Oct 2026 unless stated.

**Verdict summary**

| SKU | Original claim | Verified result (first order → full container) | Verdict | Score |
|---|---|---|---|---|
| 14ft trampoline with enclosure | A$349, GP ~A$88 (28%), FOB US$110 *estimate* | FOB **US$96** listed (Lingsha 14FT, 100–499 pcs), 0.2176 CBM, 62 kg. At A$349: **GP A$97.07 (30.6%)** on a 128-unit 20GP; **A$124.87 (39.4%)** on a 310-unit 40HQ | **CONFIRMED** (inputs revised, conclusion holds) | 7 → **7** |
| 24V 2-seat UTV with remote | A$349, GP ~A$67 (21%), Zhehua US$117 | Cheapest Amazon AU 24V 2-seater with remote is **A$339.95**, so A$349 breaks the "10–20% below" rule. At a rule-compliant A$299 with the same trader: **GP −A$19.57 (−7.2%)** first order; **+A$33.41 (12.3%)** on a full 40HQ. Genuine Hebei/Jiaxing makers (US$150–178, 0.40–0.50 CBM) lose money at any price ≤A$349 | **BROKEN** | 6 → **3** |
| Timber cubby | A$299, GP ~A$65 (24%), Zhongran US$106 MOQ 300; floor unverified | Amazon AU floor still not observable. Kmart Marketplace timber cubbies A$349.97–A$399 support A$299, but Kmart's own similar-size Activo cubby has an RRP of A$169 (seen at A$99 clearance). At A$299: GP **A$67.89 (25.0%)** for Zhongran's MOQ 300 in a 40HQ (cash ~A$61k), or **A$73.36 (27.0%)** for Dreamgo, 200 units in a 20GP. Needs a timber treatment certificate | **REVISED** | 6 → **5** |
| 3-in-1 convertible high chair | A$119, GP ~A$28 (26%) | Amazon AU convertible chairs from **A$55.95–A$89.95** (BABY JOY); Anko from A$45 (Target). A rule-compliant price (~A$79) gives **GP −A$28.67 (−39.9%)** first order and **≈ +A$1 (1–2%)** even on a full 40HQ | **BROKEN** | 5 → **2** |

**Revised order of the four:** trampoline (7) > cubby (5) > UTV (3) > high chair (2).

**Shared base assumptions used (coordinator), with my reading of them:**
- **FX:** US$1 = A$1.4376.
- **Freight:**
  - 40HQ = A$148 × 68 CBM = **A$10,064 per box**.
  - 20GP = A$211 × 28 CBM = **A$5,908 per box** (≤21.8 t). A part-filled box still costs the whole box.
  - LCL = A$244 × W/M + A$900 per shipment.
- **Duty:** 0% with a ChAFTA certificate of origin; 5% shown as sensitivity.
- **Revenue:** net revenue = price ÷ 1.1.
- **Inspection:** A$400 per factory per order.
- **Defects:** 3% × (FOB + freight + duty + inspection + compliance + per-shipment extras).
- **Handling/storage:**
  - Bulky items: A$11/CBM/month × 3 = **A$33 × CBM per unit**, used instead of A$5.
  - High chair (0.09 CBM): A$5 per unit.
- **GP %** is GP ÷ net revenue.
- **Testing:** testing and other one-off compliance costs are *estimates* (no lab price lists were found), amortised over the order shown.

**Access notes:**
- **Amazon.com.au:**
  - /dp/ pages render "Deliver to United States", so they show no buy-box price and no delivery fee.
  - Prices quoted below come from Best Sellers pages and from on-page carousels ("1 offer from $X").
  - An anonymous postcode change returned an HTTP 202 interstitial and was not pursued.
- **Blocked or unusable:**
  - kmart.com.au, bunnings.com.au, productsafety.gov.au and buywisely.com.au returned 403; Kmart and Bunnings figures below come from search-engine snippets and are labelled as such.
  - bigw.com.au timed out.
  - agriculture.gov.au returned 503 or connection errors, and BICON returned 403.
  - shopbot.com.au is a parked domain.
  - pricehipster.com and getprice.com.au search URLs returned 404.
  - Made-in-China.com began returning 429 (rate limit) late in the session.
- **WebSearch** worked in this session.

---

## Q1. 14ft round trampoline with safety enclosure: does the score-7 ranking hold?

### Takeaway
**CONFIRMED.**
- **Better inputs than the original estimate.** Real 14ft-specific listings show FOB **US$96** (Lingsha, 100–499 pcs) and US$79–129 (Nanjian), against the US$110 estimate. Three suppliers agree on a single carton of about **0.22–0.24 CBM** and **59–62 kg**, against the assumed 0.25 CBM.
- **Recomputed GP at A$349:** **A$97.07 (30.6%)** on a 128-unit 20GP, A$74.12 (23.4%) by LCL, and **A$124.87 (39.4%)** on a 310-unit 40HQ.
- **Pricing position:**
  - A$349 is 9.6% below the cheapest Amazon AU 14ft offer (Everfit 14FT "from $385.95", delivery extra and not visible) and 21% below Bestway 14ft at Toys"R"Us (A$443.99).
  - It is A$50 above Kmart's 12ft springless trampoline (A$299, snippet).
  - It is the cheapest option per square metre of mat. **A$339–349 is the right band.**

### Cited Findings
**Price to beat (AU, 9 Oct 2026)**
- **Amazon AU** Best Sellers "Trampolines & Accessories":
  - #7 is ASIN B08FWVCRG1, "Everfit Trampoline for Kids 8ft 10ft 12ft 14ft 16ft…", listed at "3 offers from $385.95"; the /dp/ page's variation map identifies B08FWVCRG1 as "Orange 14FT".
  - The other ASINs in that listing are 8FT B08FWYTDQC, 10FT B08FX4CZWY, 12FT B08FWZ8FF7 and 16FT B08FWRHVVF.
  - No other 14ft unit appears in the top 30; the rest are mini or rebounder trampolines from $59.99 to $199.99.
  - Delivery fee not visible.

  — [Amazon BS Trampolines](https://www.amazon.com.au/gp/bestsellers/sporting-goods/5044230051); [Amazon B08FWVCRG1](https://www.amazon.com.au/dp/B08FWVCRG1)
- **Indicative Amazon delivery charge on big trampolines.** New Aim's 16ft Everfit on Amazon AU was posted as "$43 (RRP $722) + Delivery (e.g. $120 to Metro Brisbane)" on 25 Jun 2026. The $43 was a pricing-error deal; the $120 delivery is the relevant figure. — [OzBargain](https://www.ozbargain.com.au/node/965103)
- **Toys"R"Us AU** (Dropshipzone listings), from the store's search JSON; site banner "Free Delivery On Orders over $99! (Exclusions Apply)":

  | Product | Price | Compare-at |
  |---|---|---|
  | Bestway 14ft | A$443.99 | A$749.99 |
  | Everfit 14FT | A$486.99 | A$666.99 |
  | Everfit 16FT | A$590.99 | — |
  | Everfit 12FT rectangle | A$534.99 | — |

  — [TRU Bestway 14ft](https://www.toysrus.com.au/products/bestway-14ft-trampoline-kids-rebounder-safety-net-enclosure-outdoor-fitness-4-27m-for-ages); [TRU Everfit 14FT](https://www.toysrus.com.au/products/everfit-14ft-kids-trampoline-rebounder-with-enclosure-net-storage-bag); [TRU Everfit 12FT](https://www.toysrus.com.au/products/everfit-12ft-kids-trampoline-rectangle-rebounder-with-basketball-set-blue)
- **Brand-site list prices:**
  - Everfit: 10ft $582.99; 12ft $666.99; 14FT $666.99–$719.99; 16ft $842.99–$852.99. — [Everfit 14FT](https://www.everfit.com.au/products/everfit-14ft-trampoline-round-trampolines-with-basketball-hoop-kids-present-gift-enclosure); [Everfit 12FT](https://www.everfit.com.au/products/everfit-12ft-trampoline-round-trampolines-with-basketball-hoop-kids-present-gift-enclosure)
  - Lifespan Kids BounceZone: 10ft $649; 12ft $769; 14ft $869. — [Lifespan Kids 14ft](https://www.lifespankids.com.au/products/bouncezone-round-spring-trampoline-xl)
  - Advwin 10ft with sprinkler: $329.90 (was $639.90). — [Advwin](https://www.advwin.com.au/products/advwin-10ft-outdoor-trampoline-w-sprinkler-330502111-330502121)
- **Kmart** (site 403; search-engine snippets, undated, not live-verified):
  - 12ft Springless Trampoline $299, rated 4.7 from 199 reviews, max 100 kg. — [Kmart snippet](https://www.kmart.com.au/product/12-foot-springless-trampoline-42836155/)
  - 12ft rectangular with enclosure $399, "excluded from the free delivery offer". — [Kmart snippet](https://www.kmart.com.au/product/12ft.-trampoline-rectangular-with-enclosure-43062706/)
  - 10ft with enclosure $199 + delivery (from the benchmarks file, snippet). — [Kmart snippet](https://www.kmart.com.au/product/10-foot-trampoline-with-enclosure-42912026)
- **PriceMe:** "12FT Trampoline And Enclosure Set" $299.99 from AlwaysDirect (snippet). — [PriceMe](https://www.priceme.com.au/12FT-Trampoline-And-Enclosure-Set-with-Safety-Net-and-Ladder/p-887539941.aspx)
- **OzBargain:** a VIC Trujump 14ft trampoline and enclosure combo at $150 (was $484), 14 Oct 2025; clearance only. — [OzBargain](https://www.ozbargain.com.au/node/928521)

**Factories (Made-in-China listings, 9 Oct 2026)**
- **Zhejiang Lingsha Technology (Funjump), Lishui.** This is the best evidence.
  - **14FT listing:**
    - US$96 (100–499 pcs), US$93 (500–999), US$89 (1,000+).
    - Carton 172×55×23 cm, giving **0.2176 CBM**.
    - Certificates listed as "En71/GS/ASTM"; 180 cm net.
  - **Per-size packing table on the same page:**

    | Size | Carton | Gross weight |
    |---|---|---|
    | 10FT | 160×45×23 cm | 45 kg |
    | **12FT** | **148×55×23 cm (0.1872 CBM)** | **56 kg** |
    | 13FT | 160×55×23 cm | 57 kg |
    | **14FT** | **172×55×23 cm** | **62 kg** |
    | 16FT | two cartons | 89.5 kg |

    Max user weight is 150 kg for 10ft and larger; tube thickness "can be customerized with 1.0mm, 1.2mm, 1.35mm, 1.5mm"; "Factory passed ISO 9001, BSCI audit".
  - **Other 14FT listings:** "Economy" 14FT US$92.50–106.50 (MOQ 100). The 6–16ft listing ladder is US$126.99 (50–199), US$89.99 (200–1,999) and US$39.99 (2,000+), not size-specific.
  - **Profile:** Manufacturer/Factory & Trading; 68,932.79 m²; 142 staff; RMB 26M; established 2020-10-26; TÜV Rheinland audit MIC-ASR2531608; Diamond member since 2023. FAQ: "MOQ 50PCS for 1 size, one 20GP container can mix 3-4 different sizes".

  — [Lingsha 14FT](https://lsfunjump.en.made-in-china.com/product/uphRrGWYIgci/China-Funjump-14FT-Outdoor-Indoor-Fitness-Kid-Child-Mini-Bungee-Jumping-Trampoline-with-Safety-Enclosure.html); [Lingsha Economy 14FT](https://lsfunjump.en.made-in-china.com/product/dRwUhzZAluVy/China-Triple-Reinforced-T-Part-Connector-14FT-Economy-Kids-Trampoline-with-Safety-Net-Enclosure.html); [Lingsha 6–16ft](https://lsfunjump.en.made-in-china.com/product/iUFYXAsPhLkf/China-Funjump-6FT-16FT-Outdoor-Kids-Safe-Big-Indoor-Jumping-Trampoline-for-Adults.html)
- **Yongkang Nanjian Leisure Products.**
  - **14FT:** US$79–129 (MOQ 100); package 173×50×26 cm (0.2249 CBM); **59 kg**; HS 9506919000; mass production 20–25 days.
  - **13FT:** US$89 (100–199), US$85 (200+); spec 160×50×25 cm.
  - **15FT:** US$79 / US$75; 150×55×33 cm; 70 kg.
  - **6–16ft listing:** US$95 / US$90; 149×50×26 cm; 56 kg; "Packing Trampoline with Net Together in a Carton".
  - **Profile:** 108# Yugui Road, Huachuan Industry Zone, Jinhua; 6,750 m²; **18 staff**; RMB 0.5M; established 2007. A small factory.

  — [Nanjian 14FT](https://yknanjian.en.made-in-china.com/product/rfpUvkQoTYRR/China-14FT-Outdoor-Trampoline-with-Ladder-with-Safety-Enclosure-Net.html); [Nanjian 13FT](https://yknanjian.en.made-in-china.com/product/ERcrVKioJzhT/China-Nanjian-13FT-396cm-Premium-Garden-Trampoline-with-Outside-Net.html); [Nanjian 15FT](https://yknanjian.en.made-in-china.com/product/cYUpjNKuLHkF/China-Nanjian-15FT-457cm-Premium-Garden-Trampoline-with-Outside-Net.html); [Nanjian 6–16ft](https://yknanjian.en.made-in-china.com/product/sXZQnLuyLDWC/China-6ft-16ft-Big-Trampoline-with-Enclosure-on-Sale.html)
- **Beijing Set Sail Sports.** 14FT US$119, MOQ 300; package 173×54×26 cm (0.2429 CBM); 62 kg. Address is "Jinpeng Mansion, Dingzhou, Hebei", an office building, so this is probably a trader. — [Set Sail 14FT](https://setsailsports.en.made-in-china.com/product/vOtTxfGMgZYq/China-Outdoor-14FT-Trampoline-with-Safety-Enclosure-Net.html)
- **Zhejiang Todo Hardware.** "8FT–14FT" listing at US$43.50–44.80, MOQ 500. Its package (45×41×71 cm, 4 kg) and HS code 9019101000 are inconsistent with a 14ft set, and its address is an office (31st floor, Jinmao Building, Yongkang). Not used. — [Todo](https://todofit.en.made-in-china.com/product/uORAtSsvfyaM/China-Trampoline-8FT-10FT-12FT-14FT-Enclosure-Net-Outdoor-Jump-for-Kids-and-Adults.html)

**Compliance**
- The Federal Register API lists **no in-force title containing "Trampolin"**. — [Legislation API query](https://api.prod.legislation.gov.au/v1/titles?$filter=contains(name,'Trampolin')%20and%20isInForce%20eq%20true)
- The lead-in-toys standard excludes "sporting goods… home and public playground equipment, trampolines". — [F2009L00223](https://www.legislation.gov.au/F2009L00223/latest/text)
- AS 4989:2015 is listed as "Current" (via the original notes). — [Standards Australia](https://store.standards.org.au/product/as-4989-2015)
- Duty: HS 9506.91 is 5% general and Free under ChAFTA (per the original notes citing ABF). — [ABF Ch 95](https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff/schedule-3/section-xx/chapter-95)

### Inferences
**Recomputed economics.** Lingsha 14FT at US$96; 0.2176 CBM; 62 kg; AS 4989 or EN 71-14 test **A$2,500 (estimate)**; no per-shipment extras.

| Scenario | FOB A$ | Freight | Inspection | Test | Subtotal | Defects 3% | Storage | **Landed/unit** | Price | Net | **GP (%)** | Cash ex-GST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **1st order, 20GP, 128 units** (27.9 CBM, 7.9 t) | 96×1.4376 = 138.01 | 5,908/128 = 46.16 | 3.13 | 19.53 | 206.82 | 6.20 | 33×0.2176 = 7.18 | **220.21** | 349 | 317.27 | **97.07 (30.6%)** | ~A$28.2k |
| 1st order, LCL, 100 units (21.76 W/M) | 138.01 | (244×21.76+900)/100 = 62.09 | 4.00 | 25.00 | 229.10 | 6.87 | 7.18 | 243.15 | 349 | 317.27 | 74.12 (23.4%) | ~A$24.3k |
| **Full 40HQ, 310 units** (67.5 CBM, 19.2 t) | 138.01 | 10,064/310 = 32.46 | 1.29 | 8.06 | 179.83 | 5.39 | 7.18 | **192.40** | 349 | 317.27 | **124.87 (39.4%)** | ~A$59.6k |

- **20GP beats LCL** above about 20.5 CBM (≈94 units).
- **Breakeven retail price:** A$242.23 (20GP first order) and A$211.64 (40HQ).

**Sensitivities (first order, 20GP)**

| Change | GP |
|---|---|
| 5% duty (no CoO) | A$89.96 (28.4%) |
| A$339 price | A$87.97 (28.5%) |
| A$329 price | A$77.18 (25.8%) |
| Nanjian FOB at US$129 (top of range) | A$45.67 (14.4%) |
| Nanjian at US$79 | A$119.71 (37.7%) |
| Original US$110 FOB under these freight rules | A$74.63 (23.5%) |

On a 40HQ, 5% duty gives A$117.76 (37.1%) and an A$339 price gives A$115.78 (37.6%).

**Why GP rose although freight is dearer.** Per-unit freight is A$46 on a 20GP, against A$21.50 in the original (0.25 CBM × A$86). The lower listed FOB (US$96 vs US$110 = −A$20.13) and the smaller carton more than offset it.

**Price-rule check.**
- A$349 is 9.6% below Amazon's $385.95 item price. That is marginally outside the 10–20% band.
- If Amazon delivery is about A$80–120 (*estimate* from the $120 16ft quote), the delivered price is about A$466–506 and A$349 sits 25–31% below it.
- **A$339–349 is defensible; A$339 keeps it inside the band on item price alone.**

**Coordinator cross-check against cheaper 10–12ft units.**
- **Mat area:** 14ft (Ø4.27 m) is ~14.3 m²; 12ft (Ø3.66 m) ~10.5 m²; 10ft (Ø3.05 m) ~7.3 m² (geometry).
- **Price per m²:** A$349 for a 14ft is ~A$24.4/m², against Kmart 12ft springless A$299 (~A$28.5/m²) and Kmart 10ft A$199 (~A$27.3/m²), both before Kmart's bulky-delivery fee.
- **Load:** the 14ft carries a 150 kg max user weight against 100 kg on Kmart's springless model.
- **Conclusion:** the 14ft still clears the comparison for families with room for a 14ft. It does **not** clear it for small-yard buyers, who will take a A$199–299 10–12ft unit.
- **Mitigation:** Lingsha lets one 20GP mix 3–4 sizes.
  - Indicative mix of 64×14ft + 75×12ft, with the 12ft FOB at **US$85 (*estimate*, no 12ft-specific price found; Nanjian 13FT is US$85–89)** and a separate A$2,500 test per size: 14ft at A$349 earns **A$77.40 (24.4%)**; 12ft at A$279 earns **A$43.56 (17.2%)**.
  - Caveat: Lingsha's US$96 tier starts at 100 pcs, so split orders may price higher.

**Verdict: CONFIRMED, score 7.**
- **For:** the margin is real at 20GP scale. The goods are bulky (62 kg) and ship as one carton, so local pickup beats A$80–120 courier delivery. The standard is voluntary. The supplier is a large audited factory with a size-by-size packing table.
- **Against:** Kmart's A$299 12ft and A$199 10ft anchor the lower end. Demand is seasonal (Nov–Dec), and Black Friday cuts from Everfit/Bestway are likely. Injury liability calls for an AS 4989 or EN 71-14 test of the exact build (Lingsha's tube gauge is customisable, so specify it in the PO) plus product liability insurance, neither costed here beyond the test estimate.

### Gaps
- **Amazon delivery fee and seller:** the delivery fee and seller identity for B08FWVCRG1 are unseen (US geo). "3 offers from $385.95" may include non-New Aim sellers or used offers.
- **Kmart and Big W:** Kmart prices are undated snippets, and Big W was unreachable.
- **12ft fallback:** no 12ft-specific FOB; the 12ft figure is an estimate.
- **Testing cost:** no lab quote for AS 4989 (A$2,500 is an estimate).
- **Facebook Marketplace:** asking prices for new 14ft units could not be observed (login wall). The earlier Gumtree "Rainbow 14ft $359" figure is unverified.

---

## Q2. 24V 2-seat kids' UTV with parental remote: does the score-6 ranking hold?

### Takeaway
**BROKEN.**
- **The price ceiling.** Amazon AU already sells a 24V 2-seat ride-on truck with remote (HONEY JOY, B0HJ1KPG9Q) at **A$339.95**, and a 24V 2-seat quad at A$309.95. The A$349 target sits *above* the cheapest comparable, and the 10–20% rule caps price at about A$272–306.
- **At A$299, with the original trader** (Shenzhen Zhehua 110-E1, US$117, 0.2557 CBM):
  - first order (98 units, 20GP): **GP −A$19.57 (−7.2%)**;
  - full 40HQ (265 units): **+A$33.41 (12.3%)**;
  - steady state with no compliance amortisation: +A$49.46 (18.2%).
- **Genuine manufacturers are worse.** Hebei Boyi (Pingxiang, US$150, 0.398 CBM) and Pinghu United (Jiaxing, US$178, 0.50 CBM) have bigger, heavier 24V UTVs and **lose A$6–155 per unit even at A$349**.

### Cited Findings
**Price to beat (Amazon AU, 9 Oct 2026; delivery not visible)**
- **Best Sellers "Kids' Electric Vehicles"** (page 1 and page 2):

  | Rank | Product (ASIN) | Price | Specs |
  |---|---|---|---|
  | #6 | HONEY JOY 24V 1-seater with parent remote (B0H9MBBVFV) | $209.95 | 97×61.5×58 cm, 13.5 kg |
  | #23 | HONEY JOY 24V 2-Seater 4-Wheeler Quad (B0HJ7LHXJF) | $309.95 | "Battery: 24V, 7Ah", 113×66×72 cm, 19.5 kg, 59 kg capacity |
  | #24 | ANPABO 24V 4WD with remote (B0CMTJ16VQ) | $469.99 | 114×79×79 cm, 26.99 kg |
  | #53 | HONEY JOY 24V 2-Seater Dump Truck (B0HG8TV2PF) | $399.95 | 147×71×72 cm, 29.5 kg |
  | #55 | HONEY JOY Licensed Caterpillar 24V 2-seater (B0FK4R6GVG) | $409.95 | — |

  — [Amazon BS Kids' EV](https://www.amazon.com.au/gp/bestsellers/toys/5031240051); [page 2](https://www.amazon.com.au/gp/bestsellers/toys/5031240051?pg=2); [B0HJ7LHXJF](https://www.amazon.com.au/dp/B0HJ7LHXJF); [B0CMTJ16VQ](https://www.amazon.com.au/dp/B0CMTJ16VQ); [B0HG8TV2PF](https://www.amazon.com.au/dp/B0HG8TV2PF)
- **Carousel on the B0HG8TV2PF page:**
  - "HONEY JOY 24V 2-Seater Kids Ride On Truck with Lockable Doors", **"1 offer from $339.95"**. Its own page (B0HJ1KPG9Q) states "Battery: 24 V 7.4AH", 107×76×74 cm, 23 kg, and remote included.
  - HONEY JOY 24V tractor with trailer (B0HDRZ3BJF), $329.95.

  — [B0HJ1KPG9Q](https://www.amazon.com.au/dp/B0HJ1KPG9Q); [B0HDRZ3BJF](https://www.amazon.com.au/dp/B0HDRZ3BJF)
- **OLAKIDS 12V 2-seater UTV with remote** (B0F4DNKYP1): "1 offer from $319.95" in a carousel; 46.5×29×28 in, 19.96 kg. — [B0F4DNKYP1](https://www.amazon.com.au/dp/B0F4DNKYP1)
- **Button-battery warning.** The HONEY JOY 24V 1-seater page carries the button-battery warning text, "Batteries can cause severe or fatal injuries in 2 hours or less if swallowed". — [B0H9MBBVFV](https://www.amazon.com.au/dp/B0H9MBBVFV)
- **Toys"R"Us AU:** no 24V UTV. Two-seat ride-ons there are licensed Kahuna models: G63 $770.99, Porsche Taycan $484.99, Toyota FJ-40 $599.99. — [TRU search JSON](https://www.toysrus.com.au/search/suggest.json?q=2%20seater%20ride%20on&resources%5Btype%5D=product)
- **Benchmarks file (coordinator):** 12V ride-ons sit at about A$140–200 on Amazon, and a "Can-Am 24V ATV $249 at GoEasy" appeared on OzBargain (not re-checked). — [OzBargain](https://www.ozbargain.com.au/node/955078)

**Factories (Made-in-China listings, 9 Oct 2026)**
- **Shenzhen Zhehua Technology (the original pick).**
  - **110-E1 2-seat UTV:** US$117 (20–269), US$109 (270+); "Battery 24V7ah*1"; motors 555#×4; 6–8 km/h; seat width 50 cm; lead-acid. Carton 111×64×36 cm (0.2557 CBM); 31 kg gross / 29 kg net. Product 125×85×82 cm; 98 per 20ft, 270 per 40HQ. Certificates listed: "CE, En71, En62115, Ukca, RoHS, ASTM F963".
  - **Probable trader:** the address is an office (Room 407 & 409, Shizheng Building, Futian District, Shenzhen). Gold Member since 2009; BV audit MIC-ASR2221558.
  - **Deluxe 2-seat UTV:** US$104 (20–230), US$85 (231+); 99×73×40.5 cm (0.2927 CBM); 31 kg.
  - **Large 24V 2-seat UTV with remote:** US$190–210; 148.5×83×44 cm (0.542 CBM); 117 per 40HQ.

  — [Zhehua 110-E1](https://zhehuatoys.en.made-in-china.com/product/ZYnrUyqDrdWv/China-24V-Electric-Kids-Car-UTV-2-Seats-Children-Battery-Ride-on-Car.html); [Zhehua deluxe](https://zhehuatoys.en.made-in-china.com/product/DGHRkzNKfvWX/China-2-Seater-off-Road-Children-24V-Deluxe-Kids-Electric-Car-Ride-on-UTV.html); [Zhehua large](https://zhehuatoys.en.made-in-china.com/product/PQVrpFudLOcN/China-24V-2-Seater-Children-Battery-Powered-Kids-Electric-Ride-on-Car-UTV-with-Remote-Control.html)
- **Hebei Boyi Toy (Pingxiang, Xingtai), BY-MG2039 "24V Powerful Battery UTV".**
  - US$150, MOQ 50; lead-acid; remote; car 138×87×82 cm.
  - Carton is stated two ways: package field 128×74×42 cm (0.398 CBM), 37.3 kg; description "117*75*38 cm, N.W/G.W 36/42 kgs" (0.333 CBM).
  - Diamond Member since 2020; Audited. The original notes list a Pingxiang industrial-zone address and 43,160 m².

  — [Boyi BY-MG2039](https://boyi2020.en.made-in-china.com/product/ifPYtQvCasUk/China-24V-Powerful-Battery-UTV-for-Kids-3-12-Year-with-Colorful-Light.html)
- **Pinghu United Vehicles (Jiaxing), A032 24V 4WD UTV.**
  - US$178, MOQ 30; 131×83×46 cm (0.500 CBM); 45 kg; 140 per 40HQ; lead-acid.
  - Profile: Manufacturer/Factory & Trading; No 99 Tongche Road, Jiaxing; 10,312 m²; 69 staff; established 2017; main markets include Australia.
  - The page body also calls it "A032 12V 2WD", which is inconsistent.

  — [Pinghu A032](https://yueshicheye.en.made-in-china.com/product/FpZRtlrPCdWU/China-A032-24V-4WD-UTV-131-83-46cm-Carton-Size-for-Convenient-Delivery.html); [Pinghu A032 alt](https://yueshicheye.en.made-in-china.com/product/VrwRXUtdSOWj/China-A032-24V-4WD-UTV-with-135X95X80-Size-and-45kg-Gross-Weight.html)
- **Hebei Xingjiu Vehicle Industry Sci-Tech (Pingxiang).**
  - Kids' electric UTV 2-seater at US$67.90 (50–99) and US$60.80 (100+).
  - Profile: Gao Fu Zhen Cun Dong, Pingxiang County; 25,000 m²; 65 staff.
  - **Appears to be 12V** ("Motor/Battery 12V…"), with two conflicting cartons (107×62.5×41 cm, 22.3 kg vs 133×77×56 cm, 33 kg; 136 per 40HQ). Not like-for-like.

  — [Xingjiu](https://hbxingjiu.en.made-in-china.com/product/kLlYuDIPqUhf/China-Kids-Electric-UTV-2-Seater-off-Road-Buggy-Ride-on-Car-for-Children-100kg-Super-Load-Capacity-CPC-ASTM.html)
- **Hebei Wanhao (Xingtai).** 4WD 2-seat UTV with remote at US$153.42 (50–99) and US$142.71 (100–999); package data inconsistent. — [Wanhao](https://wanhao.en.made-in-china.com/product/EYIpjsJdfBhN/China-4WD-All-Terrain-2-Seater-Kids-Electric-UTV-Ride-on-Car-with-Remote-Control.html)
- **Shine Ring Toys (Jiashan).** 24V UTV for two kids at US$109–120 (MOQ 20); 131×60×31 cm (0.244 CBM); 30 kg; 272 per 40HQ. Address is an office (Rm 1905 Xingchuang Plaza), so a trader. — [Shine Ring](https://shineringtoys.en.made-in-china.com/product/wYsUSCQELdkh/China-24V-Electric-off-Road-UTV-for-Two-Kids-with-Remote-Functionality.html)

**Compliance**
- **Button/coin batteries:** the button/coin battery safety and information standards are in force. — [F2020L01656](https://www.legislation.gov.au/F2020L01656/latest/text); [F2020L01657](https://www.legislation.gov.au/F2020L01657/latest/text)
- **Under-3 toys:** the toys standard for children up to and including 36 months is in force. — [F2023L01185](https://www.legislation.gov.au/F2023L01185/latest/text)
- **Sealed lead-acid batteries by sea:** non-spillable SLA batteries are excepted from the IMDG Code under Special Provision 238 if they pass the 238.1 vibration and pressure tests and the 238.2 criteria, with "terminals protected against short circuits" (battery-maker statements via search summary). — [Power-Sonic IMDG statement](https://power-sonic.com/wp-content/uploads/2025/03/IMDG_IATA_Statement.pdf)
- **EESS fees from 1 Jul 2026 (original notes):** Responsible Supplier A$239.74/yr; Level 2/3 equipment A$89.85 for 1 year. — [EESS fees](https://www.eess.gov.au/registration/registration-fees/)
- **Duty:** 9503.00.10 (wheeled toys ridden by children) is Free at the general rate, so the 5% duty case does not apply (original notes citing ABF). — [ABF Ch 95](https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff/schedule-3/section-xx/chapter-95)

### Inferences
**Recomputed economics.** One-off compliance = A$4,129.59:
- toy, electric-toy and EN62115-type testing, A$3,000 (*estimate*);
- EESS Responsible Supplier registration, A$239.74;
- Level 3 charger registration, A$89.85;
- charger Certificate of Conformity, A$800 (*estimate*).

| Scenario | FOB A$ | Freight | Inspection | Compliance | Subtotal | Defects | Storage | **Landed** | GP at A$299 | GP at A$349 |
|---|---|---|---|---|---|---|---|---|---|---|
| **Zhehua 110-E1, 20GP, 98 units** | 168.20 | 5,908/98 = 60.29 | 4.08 | 42.14 | 274.71 | 8.24 | 33×0.2557 = 8.44 | **291.39** | **−19.57 (−7.2%)** | 25.89 (8.2%) |
| Zhehua, LCL, 50 units | 168.20 | (244×12.785+900)/50 = 80.39 | 8.00 | 82.59 | 339.19 | 10.18 | 8.44 | 357.81 | −85.99 | — |
| **Zhehua, 40HQ, 265 units** (67.8 CBM) | 168.20 | 37.98 | 1.51 | 15.58 | 223.27 | 6.70 | 8.44 | **238.41** | **33.41 (12.3%)** | 78.87 (24.9%) |
| Zhehua, 40HQ, steady state (no compliance) | 168.20 | 37.98 | 1.51 | 0 | 207.69 | 6.23 | 8.44 | 222.36 | 49.46 (18.2%) | 94.92 (29.9%) |
| Boyi (mfr), 20GP, 70 units | 215.64 | 84.40 | 5.71 | 58.99 | 364.75 | 10.94 | 13.13 | 388.82 | −117.00 | −71.55 |
| Boyi, 40HQ, 170 units | 215.64 | 59.20 | 2.35 | 24.29 | 301.48 | 9.04 | 13.13 | 323.66 | −51.84 | −6.38 |
| Pinghu A032 (mfr), 40HQ, 135 units | 255.89 | 74.55 | 2.96 | 30.59 | 363.99 | 10.92 | 16.51 | 391.42 | — | −74.15 |

- **Breakeven retail price:** A$320.52 (Zhehua first order) and A$262.25 (Zhehua 40HQ).
- **Boyi at the smaller carton:** using the 0.333 CBM / 42 kg description still gives −A$45.37 at A$349 (83 units, 20GP).

**Why the original's A$67 GP does not survive:**
1. The comparable is now a 24V 2-seater at A$339.95, not a 12V unit at A$319.
2. Freight on a 98-unit 20GP is A$60/unit, against A$22 in the original.
3. Compliance on a ~100-unit order is ~A$42/unit.
4. The only FOB that works comes from a Shenzhen office-address trader. Bigger, genuine Hebei/Jiaxing makers sell larger units at US$150–178.

**Compliance specifics:**
- **Remote batteries:** specify an AAA-battery remote, or a secure screw compartment that meets the button/coin standard. The HONEY JOY listing shows coin-cell remotes are common.
- **Battery shipping:** get the battery maker's SP 238 non-spillable statement.
- **Charger:** register the charger with EESS.
- **Age marketing:** market as "3 years+" (over 36 months) to keep out of the ≤36-month toy standard.
- **Badges:** avoid licensed badges (Can-Am, Jeep and similar) without an AU licence. The trade mark risk is noted in the original file.

**Verdict: BROKEN, score 3.** It might work only as a full-40HQ, trader-sourced line priced at or above A$349 against the larger A$399.95 dump-truck comparable. That breaks the pricing rule against the A$339.95 lockable-door truck, carries ~A$60k of cash for ~13–25% GP, and is heavily Christmas-seasonal.

### Gaps
- **Amazon delivery:** delivery fees are unseen. If HONEY JOY charges delivery, the delivered comparable is higher and the ceiling rises; it was not checked.
- **Kmart and Big W:** 24V ride-on floors are unobserved (403/timeout).
- **Lab costs:** no quotes for EN62115 or AS/NZS 62115 testing or charger certification. The A$3,000 and A$800 figures are estimates.
- **Supplier quality:** the Zhehua factory behind the trader is unknown; Boyi's carton data conflict.

---

## Q3. Timber cubby house: is the A$299 floor real, and what does biosecurity cost?

### Takeaway
**REVISED (score 6 → 5).**
- **Amazon AU:** no wooden cubby was observable (none in the relevant Best Sellers lists; search is geo-filtered).
- **Third-party floor:** Kmart Marketplace dropship timber cubbies of similar size list at **A$349.97 (Ausway, 123×106×125 cm) and A$399 (Rovo)** + delivery. A$299 is ~15% below them, so it is consistent with the rule.
- **Kmart's own risk:** Kmart's own-brand **Activo wooden cubby with kitchen (137.9×136.5×95.5 cm) has an RRP of A$169** and was seen at A$99 clearance (snippets). If Kmart restocks it, A$299 is not competitive.
- **GP at A$299 recomputes close to the original:**
  - **Heze Zhongran:** **A$67.89 (25.0%)**, but its MOQ 300 forces a ~40HQ first order (cash ~A$61k).
  - **Ningbo Dreamgo** (MOQ 1): **A$73.36 (27.0%)** with 200 units in a 20GP (~A$40k), possibly a more open design.
  - **Full 40HQ at Dreamgo's 500+ tier:** A$114.80 (42.2%).
- **Biosecurity:** solid Chinese-fir cubbies need an offshore treatment certificate plus a storage declaration.

### Cited Findings
**Price to beat (9 Oct 2026)**
- **Amazon AU:** no timber cubby appeared in Best Sellers "Play Sets & Playground Equipment" (top 30 and #51–80) or "Kids' Play Tents". Amazon search results are served for a US delivery address and returned only a playhouse cover and a display box. — [BS Play Sets](https://www.amazon.com.au/gp/bestsellers/toys/5030963051); [BS Play Tents](https://www.amazon.com.au/gp/bestsellers/toys/5030964051); [Amazon search](https://www.amazon.com.au/s?k=wooden+cubby+house)
- **Kmart own brand** (snippet; Kmart 403; undated): "Activo Let's Go Play Wooden Cubby House with Kitchen":
  - $99 clearance, was $169; click & collect only; excluded from free delivery.
  - 137.9 cm H × 136.5 cm W × 95.5 cm D; pack 104×104×14.5 cm; 19 kg; max 2 users × 30 kg.

  — [Kmart Activo (snippet)](https://www.kmart.com.au/product/activo-lets-go-play-wooden-cubby-house-with-kitchen-43271481/)
- **Kmart Marketplace** (snippets):
  - AUSWAY Outdoor Kids Cubby House, $349.97, fir with "eco-friendly paint", EN71. Product 123×106×125 cm; carton 127×100×15.5 cm; 33.5 kg. Snippet cites metro delivery $10.
  - Rovo Kids Cottage Style Cubby House, $399. BuyWisely shows ROVO at $359.
  - A BuyWisely tracker shows a "wooden cubby house … with flooring" at $529.95 at Kmart (updated 14 Jul 2026; low $504.95 on 31 Dec 2025).

  — [Kmart Ausway (snippet)](https://www.kmart.com.au/product/ausway-outdoor-kids-cubby-house-wooden-playhouse-110154373/); [Kmart Rovo (snippet)](https://www.kmart.com.au/product/rovo-kids-cottage-style-cubby-house-multi-110079233/); [BuyWisely ROVO](https://buywisely.com.au/product/rovo-kids-cubby-house-wooden-outdoor-diy-timber-cottage-style-playhouse-for-children); [BuyWisely $529.95](https://buywisely.com.au/product/wooden-cubby-house-for-kids-children-outdoor-playhouse-with-flooring)
- **Toys"R"Us AU:** cubbies are Lifespan only (Mason indoor $629.99; Aberdeen $999.99; Camira V2 $1,369). Little Tikes Cape Cottage (plastic) is $249. — [TRU Mason](https://www.toysrus.com.au/products/lifespan-kids-mason-indoor-cubby-house); [TRU Cape Cottage](https://www.toysrus.com.au/products/little-tikes-cape-cottage-playhouse-multicolour)
- **Bunnings** (snippets):
  - Backyard Discovery Sweetwater cedar cubby with play kitchen, $549.
  - Slide cubbies $1,699–$2,089.
  - A Lifespan Numbat 191×106×140.5 cm listing at $289 is on **bunnings.co.nz** (likely NZD).

  — [Bunnings Sweetwater](https://www.bunnings.com.au/backyard-discovery-sweetwater-white-cedar-wood-kids-outdoor-cubby-house-with-working-door-and-play-kitchen_p0829461); [Bunnings NZ Numbat](https://www.bunnings.co.nz/playhouse-191-x-106-x-140-5cm-numbat-cubby-house_p0279763)
- **Historical anchors (OzBargain cubby tag):** Costco Disney cubby $199.99 (2023); KidKraft Cooper $249.96 (2022); Keter plastic $100–199 (2022–23). — [OzBargain cubby feed](https://www.ozbargain.com.au/tag/cubby-house/feed)
- **Aldi Special Buys:** no cubbies on the 7–21 Oct 2026 pages. — [Aldi Special Buys](https://www.aldi.com.au/special-buys)

**Factories (Made-in-China, 9 Oct 2026)**
- **Heze Zhongran Woodware (Shandong).**
  - Cabin model 91024 "with pretend kitchen sink": US$106.12, MOQ 300 sets; "Material Chinese Fir", "Certification FSC".
  - Product 107.5L×113.5W×145.5H cm; carton 103×51×33 cm (0.1733 CBM); 31.3 kg gross / 27.7 kg net.
  - Self-description: "established in 2018, is a production-oriented foreign trade enterprise integrating production factory and international trade"; Diamond since 2025; Audited.
  - Its other playhouses run US$87–325, all at MOQ 300.

  — [Zhongran 91024](https://chinakidstoy.en.made-in-china.com/product/EGLUuvndOCYI/China-Backyard-Garden-Wooden-Kids-Play-Cabin-Children-Outdoor-Playhouse-with-Pretend-Kitchen-Sink-for-Home-Yard-Game.html); [MIC search](https://www.made-in-china.com/multi-search/wooden+playhouse+kids+outdoor/F1/1.html)
- **Ningbo Dreamgo Toys.**
  - Outdoor playhouse with cooktop, sink, BBQ and sandbox under canopy: US$121.19 (1–4), US$112.54 (5–49), **US$103.88 (50–499)**, **US$86.57 (500+)**.
  - Solid wood; carton 103.3×53×24.5 cm (0.134 CBM); 24 kg; colour box "116*95*163".
  - EN71/CE/ASTM/CPC claimed; lead time 10 days for 101–300 sets; Gold since 2020; Audited.

  — [Dreamgo](https://dreamgotoys.en.made-in-china.com/product/mZhAywdJlOGV/China-Wooden-Outdoor-Playhouse-with-Pretend-Cooktop-Sink-BBQ-Grill-Sandbox-Under-Canopy.html)
- **Xiamen Warmwood.** Playhouses at US$78–799 (range listing), MOQ 20 sets; Chinese fir; FSC; HS 4421999090; package 180×50×21 cm, 85 kg. Not model-specific. — [Warmwood](https://warmwood.en.made-in-china.com/product/fahYRpOTvcrB/China-Customizable-Wooden-Kids-Playhouse-Indoor-Outdoor-Play-Equipment.html)

**Compliance and biosecurity**
- **No mandatory standard:** the Federal Register API has no in-force title containing "Playground" or "Cubby". The lead standard excludes "home and public playground equipment". — [Legislation API](https://api.prod.legislation.gov.au/v1/titles?$filter=contains(name,'Playground')%20and%20isInForce%20eq%20true); [F2009L00223](https://www.legislation.gov.au/F2009L00223/latest/text)
- **DAFF timber import conditions** (search summaries only; the agriculture.gov.au pages returned 503):
  - Manufactured wooden articles treated offshore by heat, fumigation or irradiation must be exported within six calendar months of treatment.
  - They must carry a manufacturer's or supplier's declaration on storage to prevent re-infestation.
  - A "Highly Processed Wooden Article" list (plywood, veneer, reconstituted wood) needs only commercial documents.
  - These come from 2017 notices.

  — [DAFF IAN 34-2017](https://www.agriculture.gov.au/biosecurity-trade/import/industry-advice/2017/34-2017); [DAFF IAN 71-2017](https://www.agriculture.gov.au/biosecurity-trade/import/industry-advice/2017/71-2017); [DAFF IAN 07-2017](https://www.agriculture.gov.au/biosecurity-trade/import/industry-advice/2017/07-2017)
- **ICS wooden-furniture question:** from 2023 the Integrated Cargo System asks, for 9401.61/9403.60 wooden furniture, whether goods contain wood without documents proving treatment. — [DAFF IAN 131-2023](https://www.agriculture.gov.au/biosecurity-trade/import/industry-advice/2023/131-2023)

### Inferences
**Recomputed economics.**
- **Allowances:**
  - optional EN71-3 coating and sharp-edge check, A$1,000 one-off (*estimate*);
  - biosecurity, A$500 per shipment (*estimate*): offshore heat-treatment or fumigation certificate, storage declaration and an inspection contingency.
- **Duty:** 5% general; Free under ChAFTA.

| Scenario | FOB A$ | Freight | Inspection | Test | Bio | Subtotal | Defects | Storage | **Landed** | **GP at A$299** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Zhongran, MOQ 300, 40HQ** (52 CBM, 9.4 t) | 106.12×1.4376 = 152.56 | 10,064/300 = 33.55 | 1.33 | 3.33 | 1.67 | 192.44 | 5.77 | 33×0.1733 = 5.72 | **203.93** | **67.89 (25.0%)**; cash ~A$61.2k |
| **Dreamgo, 200 units, 20GP** (26.8 CBM) | 103.88×1.4376 = 149.34 | 5,908/200 = 29.54 | 2.00 | 5.00 | 2.50 | 188.38 | 5.65 | 4.43 | **198.46** | **73.36 (27.0%)**; cash ~A$39.7k |
| Dreamgo, 100 units, LCL | 149.34 | (244×13.41+900)/100 = 41.73 | 4.00 | 10.00 | 5.00 | 210.07 | 6.30 | 4.43 | 220.80 | 51.02 (18.8%) |
| **Full 40HQ: Dreamgo 505 units** at US$86.57 | 124.45 | 19.93 | 0.79 | 1.98 | 0.99 | 148.14 | 4.44 | 4.43 | **157.01** | **114.80 (42.2%)** |
| Full 40HQ: Zhongran 390 units | 152.56 | 25.81 | 1.03 | 2.56 | 1.28 | 183.24 | 5.50 | 5.72 | 194.45 | 77.37 (28.5%) |

**Sensitivities (Dreamgo first order)**

| Change | GP |
|---|---|
| A$279 price | A$55.18 (21.8%) |
| **A$249 price** (to answer a Kmart A$169 restock) | **A$27.91 (12.3%)** |
| 5% duty | A$65.67 (24.2%) |
| Onshore-fumigation hit of +A$1,500 | A$65.64 (24.1%) |

**Breakeven retail price:** A$218.30 (Dreamgo 20GP) and A$224.32 (Zhongran 40HQ).

**Interpretation:**
- **The A$299 target is now partly evidenced.** It is ~15% below the Kmart Marketplace third-party floor (A$349.97 + delivery). It is far above Kmart's own A$169-RRP Activo cubby, which is close in footprint to the Zhongran cabin but is on clearance and may be discontinued.
- **Like-for-like caveat:** the Dreamgo unit is listed as a "playhouse … under canopy" and may be more open than an enclosed cubby. Zhongran's cabin is the closer like-for-like; confirm drawings before ordering.
- **Biosecurity.** Solid fir is not on the highly processed list. Make the PO require:
  - an offshore treatment certificate (heat or fumigation by an acceptable provider);
  - a storage declaration;
  - shipment within 6 months of treatment;
  - ISPM-15 or no-timber packaging.

  Otherwise expect inspection and onshore treatment.

**Verdict: REVISED, score 5.**
- **For:** low regulatory burden, bulky (31 kg flat-pack, so pickup is valued), year-round demand, and the GP still about 25%.
- **Against:**
  - the Amazon floor is unobserved;
  - Kmart's own-brand anchor sits at A$169 or less;
  - the cheapest like-for-like maker needs MOQ 300 (~A$61k);
  - biosecurity paperwork and inspection risk;
  - assembly and quality complaints typical of fir cubbies (paint, warping), not quantified.

### Gaps
- **Amazon AU** cubby prices are not observable from this environment.
- **Kmart:** whether the Activo cubby is still sold or restocked, and its current price, are unknown; Kmart was 403 and the snippets are undated.
- **Big W and Bunnings AU** cubby floors were not directly observed.
- **BICON:** current wording and costs could not be read directly (DAFF 503, BICON 403). The A$500 per shipment is an estimate, and onshore fumigation cost was not found.
- **Delivery:** the Ausway A$10 metro delivery snippet looks implausibly low for a 33.5 kg carton and was not verified.

---

## Q4. 3-in-1 convertible high chair: does the score-5 ranking hold?

### Takeaway
**BROKEN.**
- **The floor has moved.** Amazon AU now has a dense floor of convertible high chairs: BABY JOY 4-in-1 **A$55.95**, a generic "3 in 1" **A$79.99**, BABY JOY 3-in-1 wooden **A$82.95**, and **BABY JOY 5-in-1 that converts to a kids' table and chair at A$89.95**. Kmart Group's Anko range sits at A$45–149 (Target AU: Flat Fold A$45, Geo High Low A$89, High Low A$109, 2-in-1 A$149).
- **The original A$119 target is above the Amazon floor.**
- **At a rule-compliant ~A$79:**
  - first order (Hebei Biwei, a trader, 150 units by LCL): **GP −A$28.67 (−39.9%)**;
  - full 40HQ (750 units): about **break-even (+A$1.13 at Biwei's US$32.80; −A$8.03 at Ringlong's US$38.99)**.

### Cited Findings
**Price to beat (9 Oct 2026; Amazon delivery not visible)**
- **Amazon AU** Best Sellers "Baby Highchairs" (5081926051), page 1 and page 2:

  | Product (ASIN) | Price |
  |---|---|
  | BABY JOY 4-in-1 Convertible (B0H458Z6KM; B0GYSRPNPT) | $55.95 |
  | BABY JOY 4 in 1 Convertible (B0C6XM2KKF) | $65.95 |
  | "3 in 1 Baby High Chair, Adjustable Convertible" (B0FGQWW6KB) | $79.99 |
  | BABY JOY Convertible 3-in-1 Wooden High Chair/Booster/Chair (B0B2W1LTR3) | $82.95 |
  | Portable 6-in-1 Convertible (B0F6LB3QKN) | $86.99 |
  | **BABY JOY 5-in-1 Convertible Highchair, "Converts to Kids Activity Table and Chair" (B0H8CNJ56Q)** | **$89.95** |
  | BABY JOY 9-in-1 (B0HF76N6R7; 6 kg) | $95.95 |
  | BABY JOY 6-in-1 wooden (B0D8T7ZBSQ, #1) | $99.95 |
  | BABY JOY 9-in-1 "Kids Table and Chair Set" (B0HKM2M3MW) | $115.95 |
  | INFANS 8-in-1 (B0BTPDSF7Y) | $119.99 |
  | INFANS 5-in-1 "Convertible Toddler Table Set" (B07TYZSNSC) | $125.95 |

  — [BS Highchairs](https://www.amazon.com.au/gp/bestsellers/baby-products/5081926051); [page 2](https://www.amazon.com.au/gp/bestsellers/baby-products/5081926051?pg=2); [B0H8CNJ56Q](https://www.amazon.com.au/dp/B0H8CNJ56Q); [B0HF76N6R7](https://www.amazon.com.au/dp/B0HF76N6R7)
- **Target AU (Anko):**
  - Anko Flat Fold Highchair $45, free delivery.
  - Anko Geo High Low Highchair $89.
  - Anko High Low High Chair $109, free delivery.
  - Anko 2-in-1 Highchair $149, free delivery; "convert it into a toddler chair".

  — [Target high chair search](https://www.target.com.au/search?text=high+chair)

**Factories (Made-in-China, 9 Oct 2026)**
- **Ningbo Jiangbei Ringlong Import & Export.** "3 in 1 Separate Baby High Chairs with Table Set" (rlyy7-1): US$38.99–40.00, MOQ 500; 64×29.5×48 cm (0.0906 CBM); 8 kg; plastic. Address: Hongtang Industrial Park C, Jiangbei, Ningbo; "Import & Export" in the name. — [Ringlong](https://ringlong2.en.made-in-china.com/product/RurpNnATTPcI/China-3-in-1-Separate-Baby-High-Chairs-with-Table-Set.html)
- **Hebei Biwei Import & Export Trade.**
  - 3-in-1 high chair: US$33.80 (50–499), US$32.80 (500–1,199), US$31.30 (1,200–4,999), US$30.00 (5,000+); 347 reviews.
  - Profile: **Trading Company**; office at Shangfenghui Plaza, Shijiazhuang; 130 m²; 7 staff; established 2019. No carton data captured.

  — [Biwei](https://hebeibiwei.en.made-in-china.com/product/zUdYeEiPEZcF/China-3-in-1-Baby-Dining-Chair-Multi-Functional-Portable-Baby-High-Chair-Adjustable-Baby-Infant-Dining-Seat-Eating-Feeding-Chair.html)
- **Qingdao Lidu Furniture.** "Eat & Grow" convertible wooden high chair: US$29 (50–199), US$27, US$25, US$19 (1,000+); 45×51×79 cm; office address. — [Lidu](https://lidufurniture.en.made-in-china.com/product/imGYoTsHgORM/China-Eat-Grow-Convertible-High-Chair-Kids-Wooden-High-Chair.html)
- **Lower-spec plastic (PP) chairs:**
  - Cixi Saiturn Leisure Products, PP "3in1" chair: US$10.90 (300–599). — [Saiturn](https://saiturn1720.en.made-in-china.com/product/VwbtAGQKJWhm/China-Hot-Selling-Convertible-and-Foldable-Baby-High-Chair-with-Multiple-Use.html)
  - Ningbo Coooko (office): US$10–11, MOQ 500. — [Coooko](https://coooko.en.made-in-china.com/product/fOknrtxYIUVv/China-Hot-Selling-Convertible-and-Foldable-Baby-High-Chair-with-Multiple-Use.html)
- **Trade-mark risk:** Zhejiang Hanhao lists "Boori"-branded 3-in-1 wooden high chairs at US$91–93. Boori is an Australian nursery brand. — [Hanhao Boori](https://boorifurniture.en.made-in-china.com/product/KxdRwOlUSCWD/China-Boori-babies-Feeding-Highchair-3-in-1-Convertible-Baby-High-Chair-Wooden.html)

**Compliance**
- **No mandatory safety standard:** the Federal Register API lists no in-force title containing "High Chair" or "Highchair". — [Legislation API](https://api.prod.legislation.gov.au/v1/titles?$filter=contains(name,'Highchair')%20and%20isInForce%20eq%20true)
- **AS 4684-2009 is voluntary.** The high chair standard is listed as current but is "recommended", and CHOICE also tests to EN 14988 (search summaries). — [SAI Global AS 4684-2009](https://infostore.saiglobal.com/en-au/Standards/AS-4684-2009-1132816/); [CHOICE](https://choice.com.au/babies-and-kids/baby-furniture/change-tables-high-chairs-and-playpens/articles/how-we-test-high-chairs); [Aussie Childcare Network](https://aussiechildcarenetwork.com.au/articles/child-health-and-safety/high-chairs-boosters-and-hook-on-seats)
- **Consumer Goods (Infant Products) Information Standard 2024** (F2024L00892), commenced **19 January 2026**:
  - It applies to infant sleep products and to an "inclined non-sleep product": a product designed or marketed for use by an infant (under 12 months, or older if reasonably used), with "a surface on which an infant may lay", that "may position the infant's head above the horizontal".
  - It requires warnings on the product and its packaging.
  - Section 10 requires the warning to be "included in the infant product's description provided on the platform" for any business offering on an electronic platform.

  — [F2024L00892 text](https://www.legislation.gov.au/F2024L00892/asmade/2024-07-18/text/original/epub/OEBPS/document_1/document_1.html)

### Inferences
**Recomputed economics.**
- **Allowances:** voluntary AS 4684 or EN 14988 test, A$2,000 one-off (*estimate*); handling A$5/unit.
- **Biwei carton:** assumed at Ringlong's 0.0906 CBM.
- **Duty:** HS 9401.71/.79 is 5% general and Free under ChAFTA.

| Scenario | FOB A$ | Freight | Inspection | Test | Subtotal | Defects | Handling | **Landed** | GP at A$79 | GP at A$89 | GP at A$119 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Biwei (trader), LCL, 150 units** | 33.80×1.4376 = 48.59 | (244×13.59+900)/150 = 28.11 | 2.67 | 13.33 | 92.70 | 2.78 | 5.00 | **100.48** | **−28.67 (−39.9%)** | −19.58 | 7.70 (7.1%) |
| Biwei, 20GP, 300 units | 48.59 | 19.69 | 1.33 | 6.67 | 76.28 | 2.29 | 5.00 | 83.57 | −11.75 | — | — |
| Ringlong, MOQ 500, 40HQ | 57.50 | 20.13 | 0.80 | 4.00 | 82.43 | 2.47 | 5.00 | 89.90 | −18.09 | — | — |
| **Full 40HQ, Ringlong, 750 units** | 56.05 | 13.42 | 0.53 | 2.67 | 72.67 | 2.18 | 5.00 | **79.85** | −8.03 | 1.06 | 28.33 (26.2%) |
| Full 40HQ, Biwei, 750 units at US$32.80 | 47.15 | 13.42 | 0.53 | 2.67 | 63.77 | 1.91 | 5.00 | 70.69 | 1.13 (1.6%) | — | — |

- **Breakeven retail price:** A$110.53 (first order) and A$87.84 (full 40HQ, Ringlong).
- **5% duty** (first order at A$79): −A$31.17.

**Interpretation:**
- **The price rule caps the target.** It implies about A$72–81, using the A$89.95 table-and-chair convertible as the comparable.
- **Imports cannot reach that.** Imported landed cost is A$70–100/unit, against a ~A$72 net-of-GST revenue.
- **A$119 does not rescue it.** At A$119 the full-container GP is 26%, but A$119 is above eight or more Amazon convertibles and Anko's A$89–109 chairs, so it fails the brief.

**Compliance nuance.** A model whose seat reclines and is marketed from birth or for under-12-month infants could be an "inclined non-sleep product". It would then need the warnings, including in the Facebook Marketplace listing text (s10). An upright 6-months-plus chair is probably outside; get advice. Avoid "Boori"-branded or lookalike listings.

**Verdict: BROKEN, score 2.** The product is compact, so Marketplace's pickup advantage is small. BABY JOY/Costway on Amazon and Kmart/Anko already sit at or below import landed cost.

### Gaps
- **Delivery fees:** Amazon delivery fees for the BABY JOY chairs are unseen; they may ship free.
- **Kmart Anko prices:** taken from Target AU (Kmart Group); Kmart itself was 403.
- **Biwei carton:** its CBM was not captured (assumed 0.0906).
- **Testing cost:** the AS 4684 test cost is an estimate.
- **ACCC interpretation:** ACCC guidance on whether reclining high chairs are "inclined non-sleep products" could not be read (productsafety.gov.au 403).

---

## Q5. Cross-check against the retail-benchmark file (coordinator request) and revised ranking

### Takeaway
**The benchmark file's floors are consistent with this verification and strengthen two verdicts:**
- **Trampolines:** its Kmart 10ft at A$199 + delivery and Advwin 10ft at A$269.90, plus the Kmart 12ft springless at A$299 found here, mean the 14ft at A$349 holds only as a larger-yard, value-per-m² offer. Price at **A$339–349**, and consider a 12ft companion at about A$259–279.
- **Ride-ons:** its 12V floor of about A$140–200 and the "Can-Am 24V ATV $249" fit the broken UTV verdict. 24V ride-ons on Amazon start at A$209.95 (1-seat) and A$309.95–339.95 (2-seat).

**Revised ranking of the four:** 14ft trampoline (7, CONFIRMED) > timber cubby (5, REVISED) > 24V UTV (3, BROKEN) > 3-in-1 high chair (2, BROKEN).

### Cited Findings
- **Benchmarks file:**
  - "Trampoline, 8–12ft with enclosure": Everfit "from $385.95", size unspecified; Kmart's own 10ft $199, "excluded from free delivery" (snippet); Advwin 10ft on Kmart Marketplace $269.80 (snippet); Advwin 8ft $249.90 and 10ft $269.90 direct.
  - Kids' ride-ons: Rigo 6V $139.95, 12V Jeep $189.95; ANPABO 12V $199.99; "Can-Am 24V ATV $249 at GoEasy".
  - Bulky delivery: Amazon AU New Aim 16ft trampoline about $120 to metro Brisbane.

  — local file `au_retail_price_benchmarks.md`; [Kmart 10ft (snippet)](https://www.kmart.com.au/product/10-foot-trampoline-with-enclosure-42912026); [Advwin](https://www.advwin.com.au/products/advwin-trampoline-10ft-outdoor-trampoline-330502110-330502120); [OzBargain Can-Am](https://www.ozbargain.com.au/node/955078)
- **This file's own findings:**
  - Amazon B08FWVCRG1 is the **14FT** variant, which resolves the benchmark file's "size unspecified". — [Amazon B08FWVCRG1](https://www.amazon.com.au/dp/B08FWVCRG1)
  - Kmart 12ft springless $299 and 12ft rectangular $399 (snippets). — [Kmart 12ft springless](https://www.kmart.com.au/product/12-foot-springless-trampoline-42836155/)
  - Amazon 24V 2-seaters at $309.95–$409.95. — [Amazon BS Kids' EV](https://www.amazon.com.au/gp/bestsellers/toys/5031240051)

### Inferences
- **10ft vs 14ft.** A Kmart 10ft at A$199 + delivery does not compete like-for-like with a 14ft (~half the mat area). It does set a buyer's mental anchor, so listings should lead with "14ft / 4.27 m, 150 kg rated, in stock for pickup today".
- **12ft is the real pressure point.** The Kmart 12ft springless at A$299 (100 kg max) sits only A$50 below the 14ft. If Kmart discounts it at Black Friday, a 14ft at A$349 may need to drop to A$329, where GP is still A$77.18 (25.8%) on a 20GP.
- **The ranking holds** only for the trampoline. The UTV and high chair fall below the 5/10 middle tier. The cubby slips to 5 because the floor is split between Kmart Marketplace (A$349.97–399) and Kmart's own A$169-RRP model.
- **Cash for a buyer committing now.** Trampoline 20GP ~A$28k; cubby ~A$40k (Dreamgo, 200 units) or ~A$61k (Zhongran MOQ 300). The UTV (~A$63k full 40HQ for 12–25% GP) and the high chair are not worth committing capital to under these assumptions.

### Gaps
- **Retail floors:** Kmart, Big W and Bunnings floors rest on undated search snippets because the sites are blocked. Facebook Marketplace asking and sold prices were not observable.
- **Cost inputs:** freight rates are the coordinator's shared assumptions, not quotes. Testing, certification and biosecurity costs are estimates. Product liability insurance and returns/warranty costs are excluded throughout.
