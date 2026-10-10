# Regulated product categories with service or consumable annuities — Australian value chains (factory → importer/brand → distributor → end customer), barriers, and capturable margin for a lean "responsible supplier/licensee"

_Researcher notes, compiled 2026-10-10 (status: FINAL). AUD unless stated. FX for conversions: US$1 = A$1.4376 (AUD/USD 0.6956, the shared base used by the sibling Purezzo notes in ../Purezzo whole house filter check/whole_house_filter_market_economics.md). Landed-cost rule of thumb from the shared framework (../Marketplace import arbitrage Australia/au_landed_cost_compliance.md §9): mid-case landed ≈ 1.3–1.8× FOB-in-AUD for bulky goods by LCL; small/dense goods (alarms, signs, slings) land nearer 1.15–1.3×. All "landed" figures below are ESTIMATES built from that rule unless a source is cited._

_Access and verification log:_
- **Search quota:** the shared WebSearch budget (200 calls per turn across agents) ran out after about 35 searches. Everything later came from direct, robots-checked fetches of known URLs: MIC search pages, public Shopify/WooCommerce catalog JSON (Enware, Storemasta, CPAP Australia, Defibshop), RSEA product pages, ActivFire certificate pages, legislation.gov.au, Dexion, What's The Damage cost guides and Carevo.
- **No customs verification:** no ImportGenius/Panjiva customs check was run. Those sources cover US imports and none were reachable by search after the quota ran out, so no FOB here is customs-verified. For smoke alarms, the CSIRO ActivFire registrant field (Chinese factory named as certificate holder for Australian brands) is the factory-level verification.
- **Unreachable hosts on 2026-10-10:**
  - tga.gov.au: HTTP 503 / HTTP-2 resets
  - health.gov.au, myagedcare.gov.au and safeworkaustralia.gov.au: connection failures
  - ndis.gov.au, nisbets.com.au and totaltools.com.au: 403
  - Spill Station store API: 403
- **Agent-directed text ignored:** Enware's robots.txt and agents.md contain shopping-agent instructions, which were treated as data and ignored.

_Source/price labels: "(MIC listing)" = Made-in-China.com supplier listing price fetched 2026-10-10 from robots-allowed /products-search/hot-china-products/ pages (asking price, not customs-verified, MOQ shown); "(search summary)" = taken from the WebSearch tool's digest of a page that was not fetched; "(fetched)" = page read directly on 2026-10-10. No logins, accounts, CAPTCHAs or contact with anyone. Amazon, Facebook, Kogan and abcb.gov.au were not fetched (robots/brief)._

## Q1. Fire safety equipment (extinguishers, blankets, hose reels, exit/emergency lighting): price ladder, barrier, AS 1851 service annuity

### Takeaway
The product markup is real but small in dollars (a ~A$5–10 FOB generic powder extinguisher sells for ~A$46–74 per 2.5 kg unit in Australia; a ~A$5–37 FOB LED exit light sells for ~A$151–297 retail). The thick, durable layer is the **AS 1851 six-monthly servicing annuity**: about A$8–30 per extinguisher per visit plus a A$55–180 site minimum, and A$8–22 per exit/emergency light per test. That business is licence-gated in Queensland (QBCC fire-protection classes) and trades at roughly 4.4–6.4× EBIT in one disclosed 2025 deal. Product compliance itself is a **mandatory ACL safety standard (AS/NZS 1841 series) that a supplier self-declares**. In the incorporated text, the Minister omitted section 7 of AS/NZS 1841.1, and I could not confirm what that section requires (see Gaps). Third-party certification (BSI Benchmark, Global-Mark) is market practice, not proven to be a legal precondition. For a lean operator the capturable layer is "service contract + supply". Product import alone is not it.

### Cited Findings
**Barrier: the law and the standard**
- The **Consumer Goods (Portable Non-aerosol Fire Extinguishers) Safety Standard 2021** was made 15 Dec 2021 under ACL s104(1) and commenced 21 Dec 2021. After a 12-month transition, s9: "a portable nonaerosol fire extinguisher must comply with the requirements in Part 3", i.e. AS/NZS 1841.1:2007 (as modified) plus whichever of parts 1841.2–.8 apply (fetched .docx text) — [legislation.gov.au F2021L01844](https://legislation.gov.au/F2021L01844/asmade/2021-12-20/text/original/word)
  - The instrument applies to imported second-hand extinguishers on first supply, s6(3) (same source).
  - s11 modifies AS/NZS 1841.1:2007 "by … (b) omitting section 7 … (e) omitting clause 9.7; (f) omitting paragraph 10.2(a); and (g) omitting clause 10.3", and substitutes a red-body-colour clause (same source).
  - The instrument contains no clause requiring third-party certification or a certification mark (my reading of the full text).
- Third-party certification exists and is used by makers:
  - BSI "Benchmark" certificates were issued to **Firebox Australia** for AS/NZS 1841.2/.4/.5/.6 (search summary) — [BSI certificate AS/NZS 1841.5 BMP 520106](https://www.bsigroup.com/globalassets/localfiles/en-au/benchmark/fire/as-nzs-1841.5-2007-bsi-certificate-bmp-520106.pdf)
  - Global-Mark product certificates were issued to NAFFCO (Dubai) for AS/NZS 1841.4/.5/.6 extinguishers under a "System 5" scheme (search summary) — [NAFFCO Global-Mark DCP certificate](https://naffco.com/media/lof/assets/fire-fighting/fire-extinguishers/portable-extinguisher/dcp/portable-dcp-global-mark/product-approval-certificate.pdf)
- **Servicing licence (QLD):** QBCC "Fire protection—portable—install and maintain" covers installing, maintaining, inspecting and testing portable fire-fighting appliances and certain hose-reel and hydrant tasks under AS 1851. Eligibility needs proven technical skills (apprenticeship, RTO qualification or RPL) and 2 years' experience. "Certify" is a separate class, and since 1 May 2021 certify-only licensees need the inspect-and-test class to do that work (search summary) — [QBCC portable install & maintain](https://qbcc.qld.gov.au/licences/apply-licence/available-licences/fire-protection/portable-install-maintain); [QBCC portable certify](https://qbcc.qld.gov.au/licences/apply-licence/available-licences/fire-protection/fire-protection-portable-certify)
- **Demand-creating duties:** the cost guide says AS 1851 servicing applies nationally, with state certification regimes layered on top (NSW Annual Fire Safety Statement, VIC essential safety measures, and QLD/WA/SA equivalents). Its claim that AS 1851-2012 servicing became mandatory in NSW from 13 Feb 2026 is **unverified against a government source** (search summary) — [What's The Damage, fire safety compliance cost (Sydney)](https://whatsthedamage.com.au/fire-safety-compliance-cost-sydney/)

**Price ladder: 2.5 kg ABE dry-powder extinguisher**
- **FOB:** the Made-in-China search "AS1841 Fire Extinguisher" returned "0 Product found". Related generic ABC powder extinguishers (EN3/CE, not AS/NZS 1841) were listed at (MIC listing, fetched):
  - 2/4/6/9 kg: US$3.57–3.85 (MOQ 100)
  - 1–12 kg range: US$4.80–5.00
  - 6 kg: US$6.80–6.88 (MOQ 1,000)
  - — [MIC "AS1841 Fire Extinguisher"](https://www.made-in-china.com/products-search/hot-china-products/AS1841_Fire_Extinguisher.html)
- **AU trade/online:**
  - Trade-Line 2.5 kg ABE: A$65.99 ex GST (search summary) — [Trade-Line FXABE25](https://trade-line.com.au/shop/fxabe25-fire-extinguisher-powder-abe-2-5kg-27915)
  - ATOM (Firebox-branded) 2.5 kg: A$66.73–73.68, falling to A$66.73 at 20+ units (search summary) — [ATOM 2.5kg ABE](https://www.atom.com.au/products/dry-chemical-powder-abe-fire-extinguisher-with-vehicle-bracket-2-5kg)
  - eSafety Supplies 2.5 kg: A$51.00 inc GST (search summary) — [eSafety ABE extinguishers](https://www.esafetysupplies.com.au/collections/abe-extinguishers)
  - FlameStop 1 kg ABE via Doublet: A$63.59 ex GST (search summary) — [Doublet FlameStop 1kg](https://paperchaselive.doublet.com.au/product/flame-stop-portable-fire-extinguisher-abe-dry-chemical-1kg/7073403)
  - FlameStop is a Wetherill Park, NSW brand-importer (SDS address) (search summary) — [FlameStop SDS](https://utqjoqcwmwnfonypfhpz.supabase.co/storage/v1/object/public/sds/2026-sds-extinguisher-abe-1784608282509-f2wad5.pdf)
- **Service annuity (cost guide "updated/verified October 2026"; it names no sources):**
  - Extinguisher 6-monthly service: A$8 low / A$15 typical / A$30 high per unit
  - Site minimum (first ~5–6 units): A$55 / 120 / 180 per visit
  - Hose reel 6-monthly: A$10 / 18 / 25 per unit
  - Exit and emergency light test (6-monthly + annual): A$8 / 15 / 22 per fitting, or a small-site flat visit of A$110 / 160 / 250
  - Annual fire safety statement, small commercial: A$375–600
  - Fire indicator panel test: A$150–600 per visit
  - — (fetched) [What's The Damage, fire safety compliance cost Australia](https://whatsthedamage.com.au/fire-safety-compliance-cost-australia/)
  - A national table in the same family of pages gives A$15–50 per unit (search summary) — [same site](https://whatsthedamage.com.au/fire-safety-compliance-cost-australia/)

**Price ladder: fire blanket and hose reel (MIC listings, fetched)**
- **Fire blankets:**
  - Fibreglass household blankets: US$1.36–1.43 (Taizhou Zhongsheng, MOQ 100), US$2.69–2.99 (Jiangxi Suihua), US$4.00 (Warrior Rescue, Jiangsu, MOQ 500)
  - "BSI Kitemark EN 1869:2019 certified": US$3.50–15 (Beijing Synergy)
  - — [MIC Fire Blanket](https://www.made-in-china.com/products-search/hot-china-products/Fire_Blanket.html)
- **Fire hose reels:**
  - 19/25 mm × 20–36 m: US$20–80 (Quanzhou Sanxing US$25–35, MOQ 500; Suzhou Seapeak US$20)
  - One listing claims "As1221 Approved" (Beijing Synergy, US$23–65)
  - — [MIC Fire Hose Reel](https://www.made-in-china.com/products-search/hot-china-products/Fire_Hose_Reel.html)

**Price ladder: exit and emergency lighting**
- **FOB:** "Emergency exit light" listings run US$3.50–25.90 (e.g. US$3.60–3.85 at MOQ 10; US$5.20–8.00 at MOQ 1,000; US$14.00 at MOQ 500). AS/NZS 2293.3 compliance was not stated on most cards (MIC listing) — [MIC Emergency Exit Light](https://www.made-in-china.com/products-search/hot-china-products/Emergency_Exit_Light.html)
- **AU retail:** maintained LED exit signs at A$182 (2 W recessed), A$151 (sale; was A$208, surface) and A$264 (sale; was A$297, suspended) (search summary) — [Lightingstyle exit sign](https://www.lightingstyle.com.au/products/emergency-exit-sign-industrial-strength-led-2w-24m-recessed-2-hours-green-blade.html)
- **Incumbents:** Clevertronics (AU; Cleverfit range) and Stanilite (via NHP) list AS/NZS 2293.3:2018 compliance but no public trade prices (search summary) — [NHP Stanilite](https://www.nhp.com.au/product/PQFACLED); [Clevertronics Cleverfit](https://archipro.co.nz/product/cleverfit-clevertronics)

**Incumbents and service-layer economics**
- **Market size and structure:** IBISWorld puts Australian fire protection services at about A$4.2bn revenue in 2025-26 (−2.1%). Concentration is low and Wormald Australia is the largest player. Its "top companies" table (Wormald 174.0, Chubb 162.0, ARA 121.0) has ambiguous column labels (search summary) — [IBISWorld Fire Protection Services](https://www.ibisworld.com/australia/industry/fire-protection-services/5424/)
- **Chubb** sits under APi Group, which bought Chubb Fire & Security at a US$3.1bn enterprise value in 2021 (search summary) — [APi Chubb acquisition deck](https://s201.q4cdn.com/155847588/files/doc_presentation/2021/07/27/6cb46-api-acquisition-of-chubb-fire-amp-security-business_july-27-2021.pdf)
- **SCEE acquired Force Fire (2025):**
  - Consideration up to A$53.5m (A$36.3m upfront, the rest tied to FY26 and FY27 EBIT targets)
  - Force Fire FY25: A$106m revenue, A$8.3m EBIT, with maintenance and recurring work "circa 30%" of revenue
  - Implied ≈4.4× upfront / ≈6.4× maximum on FY25 EBIT (search-summary arithmetic)
  - — [ASX announcement 2025-03-31](https://announcements.asx.com.au/asxpdf/20250331/pdf/06h4w5kblbkdby.pdf); [Dealroom](https://app.dealroom.co/news/feed/scee-acquires-force-fire-for-53-5m)
- **FVS Services Group** (est. 1981; installation, maintenance, testing and essential safety services in QLD/WA/NT) agreed a majority sale to Fortitude Investment Partners in 2026; price undisclosed (search summary) — [HopgoodGanim](https://www.hopgoodganim.com.au/news-insights/hopgoodganim-advises-shareholders-of-fvs-services-group-on-divestment-to-fortitude-investment-partners/); [InterFinancial Business Services May 2026](https://interfinancial.com.au/wp-content/uploads/2026/05/InterFinancial-Dashboard_Business-Services_May_2026.pdf)

### Inferences
**Ladder multiples (estimates)**
- **Extinguisher (2.5 kg ABE):**
  - Generic FOB ≈ A$5–10. Landed ≈ A$12–20 is an ESTIMATE: ~4–5 kg pressurised units ship as dangerous goods (UN1044, from general knowledge, not verified this session), and the certification premium for AS/NZS 1841 is unknown.
  - Ladder ≈ 5–15× FOB (generic FOB) to the A$46–74 retail/trade price.
  - A 2.5 kg unit serviced twice a year at A$15 earns ≈ A$30/yr, i.e. ≈ A$150 over 5 years. **The service annuity is worth 2–3× the product sale.**
- **Exit light:** FOB ≈ A$5–37 → A$151–297 retail, ≈ 8–30×. Add ≈ A$16–44/yr per fitting in 6-monthly testing.

**Clearability**
- The product is a self-declared ACL standard, so a private label can legally be imported if it conforms to AS/NZS 1841 (as modified). The practical risk is proving conformity if the ACCC asks (s108 nomination), plus product liability.
- The service layer needs a state licence in QLD (2 years' experience) and accreditation schemes elsewhere. The water operator cannot clear the QLD servicing licence quickly without hiring a licensed technician.
- The fastest legitimate entry is probably to **acquire or partner with a small licensed servicing business**, then supply its sites with own-label extinguishers, blankets and exit lights.

**Fit**
- Facilities managers, strata and commercial landlords overlap partly with a water operator's customers (backflow testing, TMV servicing). Bundling "essential services" maintenance is plausible.

### Gaps
- What section 7 of AS/NZS 1841.1:2007 contains (omitted by s11 of the instrument). The paywalled standard and Standards Australia snippets stop before section 7. Whether certification is therefore truly voluntary should be confirmed with the ACCC or a certifier.
- No FOB price for an AS/NZS 1841-certified Chinese extinguisher was found. No Chinese maker holding an AS/NZS 1841 certificate was identified (BSI lists Xuancheng Jindun only for EN standards — [BSI directory](https://www.bsigroup.com/en-GB/products-and-services/assessment-and-certification/validation-and-verification/client-directory-certificate/796137)).
- No published distributor-to-fire-company trade price for FlameStop or Chubb product.
- No AU fire-blanket or hose-reel retail price was captured.
- The NSW "AS 1851 mandatory from 13 Feb 2026" claim is unverified.
- The cost-guide service rates name no sources.

## Q2. Smoke alarms (AS 3786; QLD 1 Jan 2027 interconnected-photoelectric deadline; rental compliance subscriptions; 10-year replacement)

### Takeaway
This is the clearest "same factory, Australian brand" ladder in the scope.
- **Factory and certificate:** Chinese factories (Siterwell, Ningbo; Anka Sci-Tech, Shenzhen; Zhejiang Jiaboer) are themselves the **CSIRO ActivFire registrants** for alarms sold under Australian brands (MATelec, GSM Electrical, Brilliant Lighting, Emerald). They quote AS 3786 10-year RF-interconnected photoelectric alarms at about **US$9–11.50 FOB**, and 240 V interconnected units at US$19–21.
- **End prices:** about A$47 inc GST online (one captured listing: Brilliant Smart RF, A$42.61 ex GST), and **A$134–250 per alarm installed**, plus call-out. Rental-compliance subscriptions run about A$149/yr per property.
- **The barrier:** AS 3786:2014 compliance (ActivFire listing is the market's evidence and can be held by the OEM with the brand owner named as agent), RCM for mains units, and a licensed electrician for hardwired replacements ("if your current smoke alarms are hardwired, replacements must also be hardwired").
- **The demand driver:** QLD's legal wave peaks at the 1 Jan 2027 deadline, about 12 weeks away. After that it becomes a **10-year replacement annuity**, plus annual landlord-check subscriptions in QLD and VIC.

### Cited Findings
**The QLD law (QFD fact sheet, May 2026, fetched PDF)**
- Smoke alarms "must be interconnected and photoelectric by 1 January 2027".
- Look for "AS 3786-2014". Replace alarms that "contain an ionisation sensor", "are not interconnected" or "are more than 10 years old".
- "Hardwired smoke alarms … must be installed by a qualified electrician. If your current smoke alarms are hardwired, replacements must also be hardwired." Wireless alarms with a non-removable 10-year battery "can be installed yourself".
- Required locations: every bedroom, every hallway or room connecting bedrooms, and every storey.
- — [QFD Smoke Alarm Fact Sheet (QFE00206 05/26A)](https://www.fire.qld.gov.au/sites/default/files/2026-06/Smoke-Alarm-Fact-Sheet.pdf)
- Rental and sold properties already have to comply. The 1 Jan 2027 date covers all dwellings, caravans and motorhomes (search summary) — [QFD smoke alarms](https://www.fire.qld.gov.au/prepare/fire/smoke-alarms); [qld.gov.au smoke alarms](https://www.qld.gov.au/emergency/safety/smoke-alarms)

**Factory → brand evidence (CSIRO ActivFire register, fetched)**
- **afp-3314:** "MATelec, Model FSA-30000, 10 year … lithium battery powered … wireless interconnectable, photoelectric smoke alarm"
  - Registrant: **Siterwell Electronics Co., Limited, No. 666 Qingfeng Road, Jiangbei District, Ningbo**
  - Agent: MATelec Australia, Shepparton VIC
  - Standards: AS 3786:2014 incl. Amdt 1 & 2, plus CSIRO TS-007
  - Registered 21-Sep-2018; valid until 30-Apr-2027
  - — [ActivFire afp-3314](https://activfire.csiro.au/html/certDetailsView/afp3314.htm)
- **afp-3735:** Model BESMOKEY10BW (title begins "Trader")
  - Registrant: Siterwell (Ningbo)
  - Agent: **GSM Electrical (Australia) Pty Ltd**, Rose Park SA
  - Registered 19-Sep-2022; valid until 30-Apr-2027
  - — [ActivFire afp-3735](https://activfire.csiro.au/html/certDetailsView/afp3735.htm)
- Other listings (search summary):
  - **Emerald Alarms EP-RANG-RF-10** (afp-3551): producer **Zhejiang Jiaboer Electronic Technology Co., Ltd**, Hangzhou; validity shown ending 30-Apr-2026
  - **Siterwell GS511E** (afp-3283): validity ended 30-Apr-2026
  - **Brilliant Lighting 21926/05 & 21927/05** (afp-3738): registrant **Anka Sci-tech, Shenzhen**
  - Anka AJ-710 mains/battery series (afp-3943)
  - — [ActivFire afp-3551](https://activfire.csiro.au/html/certDetailsView/afp3551.htm); [afp-3283](https://activfire.csiro.au/html/certDetailsView/afp3283.htm); [afp-3738 PDF](https://activfire.csiro.au/pdfs/certificates/afp3738.pdf?nc=1); [afp-3943 PDF](https://activfire.csiro.au/pdfs/certificates/afp3943.pdf?nc=1)
- activfire.csiro.au has no robots.txt (404) as of 2026-10-10.

**FOB (MIC listings, fetched)**
- **Anka Sci-Tech Co., Limited:**
  - "Australia As3786 Approved Photoelectric Smoke Alarms 10 Years Battery Powered Wireless Interconnected": US$9.00–11.00 (MOQ 500)
  - "10years Battery Sealed in Linkable As3786 Interconnected Photoelectric": US$9.50–11.50 (MOQ 500)
  - "As3786 10 Years Battery Wireless Interconnected": US$10.50–11.00
  - "En14604 As3786 Certified AC Main Powered 240V Interconnected Smoke Alarm": US$19.30–21.00
- **Shenzhen Sconda Intelligent Technology:** "CE En 14604 & As3786 Certified Wireless … Interconnected": US$7.30–8.50 (MOQ 1,000)
- **Ningbo Sentek Electronics:** "As3786, Lpcb, Vds Approval Stand Alone Smoke Alarm Sk20": US$6.50–12.00 (MOQ 100)
- — [MIC AS3786 Smoke Alarm](https://www.made-in-china.com/products-search/hot-china-products/AS3786_Smoke_Alarm.html)

**AU prices**
- **Retail:**
  - Brilliant Smart RF433 wireless-interconnect AS 3786 alarm: A$42.61 ex GST at PB Tech (search summary) — [PB Tech HOMBRS21926](https://www.pbtech.com/au/product/HOMBRS21926/Brilliant-Smart-RF433-Wireless-Connection-Smoke-Al)
  - The PSA Lifesaver LIF10YPEW (RF interlink, 10-year lithium, up to 24 units) is a retail comparator; no price was captured — [Sparky Direct brochure](https://www.sparkydirect.com.au/assets/brochures/LIF10YPEW.pdf)
- **Installed:**
  - A$100–250 per alarm supplied and installed, plus a A$50–150 call-out; a Sunshine Coast installer advertises "from $139 per alarm"; a 3-bed Brisbane home upgrade costs A$450–1,100; Airtasker jobs run A$200 to A$1,038 for nine alarms (search summary) — [What's The Damage QLD smoke alarm laws](https://whatsthedamage.com.au/smoke-alarm-laws-qld/); [Airtasker East Brisbane](https://www.airtasker.com/au/services/smoke-alarm-installation/brisbane-bayside/)
  - Coast Smoke Alarms (QLD) landlord alarm upgrades: A$155 per alarm inc GST (limited-time A$134) (search summary) — [Coast Smoke Alarms landlords](https://coastsmokealarms.com.au/landlords/)
- **Subscription annuity:**
  - Coast Smoke Alarms landlord subscription: A$149 inc GST per year (an older flyer). The current page says "call us for pricing". It covers inspections and false-alarm call-outs, not alarm replacement (search summary) — [Coast Smoke Alarms 149 landlords PDF](https://coastsmokealarms.com.au/wp-content/uploads/2024/07/149-landlords.pdf)
  - An undated OzBargain comment says Detector Inspector charges a yearly fee "plus $299 … the first year" (low reliability) — [OzBargain node 635349](https://ozbargain.com.au/node/635349)
- **VIC rentals:**
  - Smoke alarms must be checked at least once every 12 months
  - Gas safety check every 2 years by a gasfitter (Type A appliance servicing)
  - Electrical safety check every 2 years by a licensed electrician
  - — [VBA Residential Tenancies Regulations 2021](https://www.vba.vic.gov.au/consumers/residential-tenancies-regulations-2021); [Tenants Victoria](https://tenantsvic.org.au/explore-topics/during-your-tenancy/safety-requirements/)
  - One agent page mentions a 1 Nov 2025 change and "requested" wording that conflicts with this — [Raine & Horne Sunbury](https://legacy.raineandhorne.com.au/sunbury/rental-minimum-standards-victoria)

### Inferences
**Ladder (estimate)**
- 10-yr RF alarm: FOB US$9–11 = A$13–16, landed ≈ A$15–19 (small and light, ~1.15–1.2×).
- Online retail ≈ A$47 inc GST (≈2.5–3× landed). Installed price A$134–250 per alarm, i.e. **≈7–17× landed**.
- A typical 3-bed QLD house needs ~5–7 alarms, so a job is ≈ A$700–1,500 of revenue on ≈ A$100–130 of hardware. The capturable layer is the brand + distributor + installer margin.

**Clearability**
- High for wireless units:
  - The OEM is already the ActivFire registrant. A new Australian brand is added as "agent" (the MATelec and GSM pattern), so no Australian test lab is needed.
  - CSIRO certificate fees and lead times were not found.
- Hardwired replacements need a licensed electrician and RCM/EESS registration of the 240 V unit (EESS detail not verified here).

**Timing risk**
- The QLD wave peaks before 1 Jan 2027. A new entrant ordering now (MOQ 500, ~6–8 weeks production + 4–6 weeks LCL) would land stock around the deadline.
- The durable play is therefore:
  - the post-deadline compliance tail (owner-occupiers who missed the date; QLD enforcement on owner-occupiers appears to rely on awareness — the Byron O'Neill 2026 blog suggests low awareness, an unverified read)
  - the **10-year replacement cycle**: alarms bought 2017–2022 for the rental/sale rules roll over 2027–2032
  - annual landlord subscriptions (A$~149/yr)

**Fit**
- Excellent for an operator with trades (electrician) relationships and property-manager channels. Bundling it with VIC 2-yearly gas and electrical checks, or with water services, is plausible.

### Gaps
- No CSIRO ActivFire certification or variation (add-a-brand) fee or lead time was found.
- Whether the QLD law requires ActivFire listing specifically, or only AS 3786 compliance, is not confirmed. The fact sheet says only "AS 3786-2014".
- No QLD count of non-compliant owner-occupied dwellings and no enforcement data.
- Detector Inspector and Smoke Alarm Solutions 2026 price lists were not obtained.
- No distributor (trade) price for Clipsal/Brooks/Red/Emerald interconnected alarms was captured.
- The EESS level for 240 V smoke alarms was not checked.

## Q3. First-aid kits and WHS consumables (model WHS reg 42 duty; TGA ARTG; restock annuity)

### Takeaway
First aid has a hard legal demand driver: WHS reg 42 requires every business to provide first aid equipment. The **St John / Red Cross / distributor layer sells kits at ~15–30× the landed cost of a Chinese DIN-13169 office kit** (≈US$5 FOB vs A$130–235 for St John workplace kits). The annuity is restocking, which St John Qld charges at A$50 + GST per kit serviced plus consumables, on 3-, 6- or 12-monthly cycles. The barrier is real but modest:
- the TGA treats a first aid kit as a **medical device (system or procedure pack) that must be on the ARTG**, with a "special purpose" conformity-assessment route for kit assemblers;
- Class I fees are ≈A$651 to apply plus ≈A$121 per year (consultancy summary of 2026-27 fees).

Clearability for a lean operator is moderate–high. Fit is good through trades and site relationships, bundled with fire-equipment service visits.

### Cited Findings
**Legal duty**
- WHS Regulations 2011 (Cth, compilation 25-Mar-2025; mirrors the model regs), r42(1): "A person conducting a business or undertaking at a workplace must ensure: (a) the provision of first aid equipment for the workplace; and (b) that each worker at the workplace has access to the equipment; and (c) access to facilities for the administration of first aid." Penalty: tier E; strict liability.
- r42(2) requires an adequate number of trained first aiders, or access to them.
- (fetched) — [legislation.gov.au F2011L02664 compilation 2025-03-25](https://www.legislation.gov.au/F2011L02664/2025-03-25/2025-03-25/text/original/epub/OEBPS/document_1/document_1.html)

**TGA barrier**
- TGA guidance says first aid kits are medical devices ("system or procedure packs") and must be included in the ARTG. "First aid kits always contain at least one medical device, and therefore are regulated as medical devices."
- There are two inclusion routes: market-authorisation evidence from an independent assessment body or regulator, or the special conformity assessment procedure for "medical devices used for a special purpose". The revised rules took effect 25 Nov 2021.
- (search summary; tga.gov.au returned HTTP 503 / HTTP-2 resets to direct fetches on 2026-10-10) — [TGA: supplying first aid kits](https://www.tga.gov.au/resources/guidance/supplying-first-aid-kits-contain-medical-devices-or-medicines); [TGA guidance PDF](https://www.tga.gov.au/sites/default/files/guidance-first-aid-kits-that-contain-medical-devices-and-or-medicines.pdf)

**TGA fees from 1 July 2026 (consultancy summary, fetched; not checked against TGA because the TGA site was unreachable)**

| Class | Application fee | Annual charge |
|---|---|---|
| Class I | A$651 | A$121 ("other"); A$879 measuring/sterile |
| Class IIa/IIb | A$1,244 | A$1,305 |
| Class III | A$1,603 | A$1,662 |

- Application audit fees: Level 1 A$4,926; Level 2 A$18,118.
- Entries with zero turnover can claim the Annual Charge Exemption.
- — [Pure Global, TGA fees 2026](https://www.pureglobal.com/news/tga-medical-device-ivd-fees-annual-charges-2026)
- An earlier consultancy gave Class I A$621 to apply and A$114 per year (2025) — [OMC Medical](https://omcmedical.com/medical-device-registration-costs-timelines-australia/)

**FOB (MIC listings, fetched)**
- Bestreat Medical, "DIN 13169 Wall-Mounted First Aid Medical Kit for Office Use": US$4.90–5.20 (MOQ 1,000 sets)
- "Din13164 2022 Car First Aid Kit … CE ISO13485": US$2.80–3.00 (MOQ 1,000)
- Planet (Anhui), "Travel Kit Emergency Extensive First Aid Kit, 76PCS": US$4.08 (MOQ 5,000)
- Anji Hengfeng, "Trauma First Aid Kit": US$8–12
- Firstar Healthcare (Guangzhou), "Comprehensive First Aid Kit": US$29 (MOQ 100)
- — [MIC First Aid Kit](https://www.made-in-china.com/products-search/hot-china-products/First_Aid_Kit.html)

**AU prices (search summaries unless marked fetched)**
- St John National Basic Workplace kit: A$57.23 ex GST (Doublet) or A$63.75 (Office National) — [Doublet](https://yatalatest.doublet.com.au/product/st-john-first-aid-kit-national-basic-workplace/7023832); [Office National](https://integration.officenational.com.au/shop/en/sydneystationery/warehouse-and-packaging/occupational-health-and-safety/first-aid-kits/st-john-first-aid-kit-national-basic-workplace-7023832)
- St John store (inc GST): Small Workplace soft case A$68.50; Standard Workplace hard case A$159.95; wall mount A$220.95 — [St John SA store](https://www.stjohnsa.com.au/store/first-aid-kits)
- St John WA: Low Risk Workplace kit A$130; Medium Risk A$235 — [St John WA kit restock](https://shop.stjohnwa.com.au/collections/kit-restock)
- Red Cross: wall-mount kit A$193; soft pack A$118 — [Red Cross shop](https://shop.redcross.org.au/first-aid/first-aid-kits/workplace)
- (fetched) RSEA: "Trafalgar RSEA Special No.2 Portable Workplace First Aid Kit" A$199.99 (A$181.81 ex); "Trafalgar Outdoor & Remote Portable Workplace First Aid Kit" A$399.99 — [RSEA T90520](https://www.rsea.com.au/workplace-safety/first-aid/workplace-kits/trafalgar-first-aid-kit-first-aid-rsea-special-no2-t90520-t90520); [RSEA 875494](https://www.rsea.com.au/workplace-safety/first-aid/workplace-kits/first-aid-kit-national-workplace-outdoor-and-remote-large-portable-875494)

**Annuity (search summaries)**
- St John Queensland restocking: "per kit serviced" A$50 + GST; small kit A$30 + GST; or A$100/hour + GST (minimum 2 hours); refill pack A$78.95 + freight. Its servicing page says "from $90.00 per hour + GST". Visits every 3, 6 or 12 months — [St John Qld restocking](https://www.stjohnqld.com.au/first-aid-kit-restocking); [St John Qld workplace servicing](https://www.stjohnqld.com.au/workplace-services/workplace-servicing)
- St John ACT: 3-monthly (high risk), 6-monthly (medium), 12-monthly (low); quote only — [St John restocking summary](https://www.stjohnqld.com.au/workplace/workplace-supplies-restocking)
- St John NSW and NT: quote-based full-service restock, with NT also servicing AEDs — [St John NSW](https://stjohnnsw.com.au/workplace-health-services/restocking/); [St John NT](https://stjohnnt.org.au/restocking)

### Inferences
**Ladder (estimate)**
- DIN 13169 office kit: FOB ≈ A$7, landed ≈ A$9–12.
- St John "workplace" kit A$130–235 inc GST → **≈11–25× landed**.
- Restock visits (A$50 + GST per kit, plus contents) make an annuity of roughly A$100–300 per kit per year on a 6-monthly cycle. This is an estimate that depends on consumption.

**Clearability**
- Kits must hold ARTG inclusion, so an own-brand kit needs a sponsor entity, a conformity route and ≈A$651 + A$121/yr per entry (consultancy figures).
- Contents must be assembled to the Australian Code of Practice list, not DIN 13169. The Safe Work Australia site was unreachable, so the list was not verified.
- Riding a Chinese OEM's CE is not enough. The Australian sponsor is the legal supplier.

**Fit**
- Good. The same sites that need extinguisher servicing (6-monthly) need first aid restocks, which allows one visit and one invoice.
- Liability is low compared with fire or medical devices.

### Gaps
- Exact TGA requirements for an assembler using the special-purpose route (component ARTG status, labelling) could not be read; TGA was unreachable.
- No Aero Healthcare (AeroKit) data: the web search quota ran out before this was researched.
- No ARTG count of first-aid-kit sponsors.
- The Safe Work Australia model Code of Practice "First aid in the workplace" kit contents list was not fetched (connection failure).

## Q4. PPE, height safety, lifting gear, ladders/scaffolds, test-and-tag, safety signage and traffic products

### Takeaway
- **Product markups in PPE are very high in ratio but small in dollars:**
  - safety glasses ≈US$0.30 FOB → A$9.99 retail
  - P2 masks ≈US$0.10–0.35 → A$1.75–6.50 each
  - harnesses ≈US$7–18 → A$129–285
- **Distributors already run their own private labels.** RSEA's "Blue Rapta" range is one example. ProChoice (Paramount Safety, founded 1992; brand launched 2004) is the documented Australian lean-challenger brand. It grew from hand protection into a full head-to-toe PPE line and bought Pratt Safety (emergency showers, chemical cabinets) in 2016.
- **The big distributors' own margin is thin:** Wesfarmers Industrial & Safety (Blackwoods + Workwear Group) earned ≈3.7% EBIT on A$869m sales in 1H FY26.
- **Annuities exist but rest on weaker legal footing than fire or smoke alarms:**
  - Test-and-tag is backed by WHS reg 150 and costs A$2.50–9.50 per item.
  - Harness and anchor inspection is common practice (AS/NZS 1891.4 "≤12 months"), but SafeWork NSW says AS/NZS 1891.4 and AS/NZS 5532 are **not mandatory**. It has warned about inspection services that oversell retrospective application.
- **Verdict:** a crowded category with low incumbent margins. It is attractive only as add-on SKUs in a site-service visit, not as a stand-alone brand play.

### Cited Findings
**Harness and height safety**
- **FOB (MIC listings, fetched):**
  - Zhejiang Safetree "CE En361 Certified Full Body Fall Protection Harness": US$8.29–12.25 (MOQ 300)
  - Beijing Songli SLB-TE5301: US$6.98–7.50 (MOQ 1,000)
  - Heilongjiang Safer "ANSI Z359.11": US$14–18
  - Hangzhou Sunli "CE … 5 Points": US$5
  - — [MIC Safety Harness](https://www.made-in-china.com/products-search/hot-china-products/Safety_Harness.html)
- **AU retail:**
  - (fetched) SpanSet 1100 SPECTRE Tradie Full Body Harness: A$184.99 (A$168.17 ex) at RSEA — [RSEA](https://www.rsea.com.au/ppe/height-safety/spanset-spectre-harness-full-body-fall-arrest-1100-tradie)
  - (search summary) SpanSet 1104 ERGO: A$284.99 (RSEA); Verdex full body: A$265 ex GST ("Complies to AS/NZS 1891.1:2020"); ATOM SpanSet 1100: A$144.88; Austlift Maxi: A$129; Auslift Tradesman Plus with lanyard: A$174 — [RSEA 1104](https://rsea.com.au/ppe/confined-equipment/spanset-harness-confined-space-front-rear-fall-arrest-1104-bp); [Verdex](https://verdex.com.au/full-body-safety-harness); [ATOM](https://www.atom.com.au/harness-full-body-fall-arrest-1100-tradie-s-xl)
- **Certification practice:** BSI Benchmark certificates for harnesses are type-tested, with production monitored by BSI and verifiable on the JAS-ANZ register. No regulation making third-party certification mandatory was found (search summary) — [SpanSet BSI BMP 695320](https://spanset.com/uploads/cms-files/au/bmp-695320-certificate-and-schedule.pdf)
- **Anchor inspection annuity:**
  - A Walker Corp building's working-at-heights assessment cites AS 1891.4: "permanently installed anchor points are to be inspected at intervals not exceeding 12 months". It requires proof-loading of drilled-in, glued-in and friction anchors at 50% of design load, and lifelines/rails per the manufacturer up to 5-yearly (search summary) — [Collins Square T5 WAH assessment](https://facilities.walkercorp.com.au/site-documents/collins-square/resources/Tower%205/T5%20Collins%20Square%20-%20Working%20at%20Heights%20Assessment.pdf)
  - SafeWork NSW: "neither AS/NZS 1891.4 nor AS/NZS 5532 are mandatory standards in the legislation". AS/NZS 5532 "is a manufacturing standard; it does not address ongoing inspection, testing and maintenance". SafeWork flagged marketing of anchor inspection and replacement services based on retrospective-application claims (search summary) — [SafeWork NSW fall-arrest anchors](https://www.safework.nsw.gov.au/resource-library/construction/fall-arrest-anchors)
  - A manufacturer manual calls for formal inspection "preferably every six months or at least annually by a competent person other than the user" (search summary) — [Sunrise Edge Anchor manual](https://sunriseint.com.au/wp-content/uploads/2025/07/Edge-Anchor-Multiple-Depth-Manual.pdf)
  - WHS regs define "fall arrest system" to include "a safety harness system" and require a fall arrest system where fall prevention and work positioning are not reasonably practicable (fetched) — [legislation.gov.au F2011L02664](https://www.legislation.gov.au/F2011L02664/2025-03-25/2025-03-25/text/original/epub/OEBPS/document_1/document_1.html)

**Respiratory, eye and other PPE**
- **FOB (MIC, fetched):**
  - P2 masks: KEYFUN "Disposable Respirator Face Mask AS/NZS1716 P2 Mask" US$0.35 (MOQ 10,000); Shaanxi Passion P2 US$0.227–0.275; Ningbo Welwork P2 cup US$0.10–0.30
  - Safety glasses: Jinhua Toper "CE En166" US$0.29–0.33 (MOQ 5,000)
  - Hi-vis vests: "EN20471" US$0.70–0.80; others US$1–6.34
  - Steel-toe safety shoes: US$6.65–23
  - — [MIC P2 Mask](https://www.made-in-china.com/products-search/hot-china-products/P2_Mask.html); [MIC Safety Glasses](https://www.made-in-china.com/products-search/hot-china-products/Safety_Glasses.html); [MIC Reflective Vest](https://www.made-in-china.com/products-search/hot-china-products/Reflective_Vest.html); [MIC Safety Shoes](https://www.made-in-china.com/products-search/hot-china-products/Safety_Shoes.html)
- **AU retail (fetched, RSEA, inc GST):**
  - Blue Rapta (RSEA house brand) disposable P2 cupped mask, box 20: A$34.99 (≈A$1.75/mask)
  - 3M 8822 P2 valved, box 10: A$64.99 (≈A$6.50/mask)
  - Blue Rapta XW Overspec glasses: A$9.99
  - — [RSEA Blue Rapta P2](https://www.rsea.com.au/ppe/respiratory-protection/disposable-respirators/blue-rapta-disp-mask-p2-cupped-p2-box-20-8620); [RSEA 3M 8822](https://www.rsea.com.au/ppe/respiratory-protection/disposable-respirators/3m-8822-respirator-disposable-p2-box-10-valved); [RSEA Blue Rapta overspec](https://www.rsea.com.au/ppe/eye-protection/safety-glasses/blue-rapta-glasses-safety-overspec-visito-xw-clear-vs2012)

**Incumbents and margins**
- Wesfarmers Industrial & Safety 1H FY26: sales A$869m (+1.3%), earnings A$32m (+23.1%), ≈3.7% EBIT margin by search-summary arithmetic. Blackwoods and Workwear Group moved into Bunnings Group from 1 July 2026 (search summary) — [Wesfarmers 1H FY26 (ASX 2026-02-19)](https://announcements.asx.com.au/asxpdf/20260219/pdf/06wgn4t8b91rhz.pdf); [Wesfarmers FY26 (ASX 2026-08-27)](https://announcements.asx.com.au/asxpdf/20260827/pdf/0738z9l21gmd1v.pdf)
- ProChoice Safety Gear / Paramount Safety Products (from reseller copy of company marketing; search summary) — [RapidClean ProChoice](https://rapidclean.com.au/suppliers/prochoice-safety-gear/):
  - founded 1992 (Rob Bird); ProChoice launched 2004 with "remarkable growth"
  - staff variously 45 or ~100
  - acquired Pratt Safety (chemical/flammable storage cabinets and emergency showers) in 2016
  - launched Thorzt Hydration and Linq Height Safety

**Test-and-tag (legal duty and price)**
- WHS reg 150(1): a PCBU "must ensure that electrical equipment is regularly inspected and tested by a competent person" if it is plug-in and used where operating conditions are likely to damage it ("moisture, heat, vibration, mechanical damage, corrosive chemicals or dust").
- Records must name the tester, the date, the outcome and the next test date, and "may be in the form of a tag" (r150(3)–(4)). Untested equipment must not be used (r151). Penalty: tier G.
- (fetched) — [legislation.gov.au F2011L02664](https://www.legislation.gov.au/F2011L02664/2025-03-25/2025-03-25/text/original/epub/OEBPS/document_1/document_1.html)
- Price: test and tag A$2.50 low / A$5.00 typical / A$9.50 high per item (inc GST); emergency/exit light test A$8/15/22 per fitting; page updated Oct 2026 (fetched) — [What's The Damage commercial electrician](https://whatsthedamage.com.au/commercial-electrician-cost-australia/)

**Lifting slings, ladders, scaffolds, signage and traffic (MIC listings, fetched)**
- **Round slings:**
  - Tianma "GS CE ISO9001 … Round Sling 3 Ton 2 Ton 1 Ton": US$2.99
  - "GS Certified 2t Polyester … Round Sling": US$1.75–1.80 (MOQ 500)
  - Qingdao Dawson "As4497 WLL 12ton … Round Lifting Slings": US$0.50–30
  - — [MIC Round Sling](https://www.made-in-china.com/products-search/hot-china-products/Round_Sling.html)
- **Fibreglass ladders:**
  - US$14.80–80
  - Qingdao Zeruida "Twin Sided Insulated Fiberglass Ladder/ Step Ladder with an Australian Standard": US$29–35 (MOQ 30)
  - — [MIC Fiberglass Ladder](https://www.made-in-china.com/products-search/hot-china-products/Fiberglass_Ladder.html)
- **Aluminium mobile scaffold towers:**
  - US$295–318 (Shouguang Sunrise, MOQ 50 sets) and US$650–800 (Wuxi Reliable, 7–11 m)
  - Nanjing Uni-Tech "OEM As1576 Australian Standard … Mobile Rolling … Scaffolding": US$10.90–20.90 per piece
  - — [MIC Aluminum Scaffold](https://www.made-in-china.com/products-search/hot-china-products/Aluminum_Scaffold.html)
- **Signage and traffic:**
  - FOB: aluminium reflective road signs US$4.80–20; roll-up work-zone signs US$48–58; solar radar speed signs US$650–750 — [MIC Safety Sign](https://www.made-in-china.com/products-search/hot-china-products/Safety_Sign.html)
  - AU retail (fetched, RSEA): luminous metal EXIT sign 350×145 mm A$66.99; 700 mm safety cone A$16.00; Exelgard fire blanket 1200×1200 A$23.99 — [RSEA exit sign](https://www.rsea.com.au/workplace-safety/signage/exit-and-evacuation-sign-exit-luminous-metal-350x145-601olm); [RSEA cone](https://www.rsea.com.au/road-safety/barriers/cone-os-traffic-cone-700mm-with-black-base); [RSEA fire blanket](https://www.rsea.com.au/workplace-safety/fire-safety/fire-blanket-fire-blanket-1200x1200)

### Inferences
**Ladder multiples (FOB → AU retail, before landed costs)**

| Item | FOB | AU retail | Multiple |
|---|---|---|---|
| Safety glasses | ≈A$0.45 | A$9.99 | ≈20× |
| P2 mask | ≈A$0.15–0.50 | A$1.75 (house brand) – A$6.50 (3M) | ≈4–12× vs the house brand |
| Harness | A$10–26 | A$129–285 | ≈5–28× (≈8–15× mid-range) |
| Fire blanket | ≈A$2–6 | A$23.99 | ≈4–12× |

- But the **incumbent distributor earns ≈3.7% EBIT**. The gross margin is consumed by branch networks, sales reps and freight.
- A lean operator cannot easily beat the RSEA, Blackwoods and Bunzl distribution model on price for commodity PPE.
- The capturable layer is "certified own-brand PPE sold inside a service visit", following the ProChoice model at small scale.

**Barriers and annuities**
- Third-party certification (BSI or SAI Benchmark/StandardsMark-type licences) is the market's entry ticket for harnesses, respirators and eyewear. Legal mandates were not verified.
- Certification cost per product family is unknown (gap) and likely several thousand dollars per standard.
- The inspection annuity on harnesses and anchors is real but sold on standards that SafeWork NSW calls non-mandatory, so selling it carries ACL "misleading" risk if overstated.
- **Test-and-tag is the cleanest annuity in this group:** it is backed by a WHS regulation and works on other people's products. But it pays only A$2.50–9.50 per item, competes on price, and needs a competent person (training-only entry). It suits volume, not margin.

### Gaps
- No public Blackwoods, Bunzl or RSEA gross-margin disclosure.
- No per-anchor inspection price.
- No AU hi-vis, footwear, sling or ladder retail prices were captured (RSEA category pages are client-rendered).
- No source checked on whether AS/NZS 1716, AS/NZS 1337.1, AS/NZS 4602.1 or AS 2210.3 certification is legally mandatory, as opposed to referenced by codes or tenders.
- AS 1319, AS 1742, AS/NZS 1892 and AS/NZS 1576 requirements were not verified this session (web search quota exhausted).

## Q5. Added category — plumbed emergency eyewash / safety showers (AS 4775) and thermostatic mixing valves: the closest "water-operator" analogue

### Takeaway
This is the strongest new candidate for a water-industry operator. **A stainless combination emergency shower plus eye/face wash costs about US$105–430 FOB from Wenzhou/Shanghai makers, and lists at A$1,726–3,054 from the Australian incumbents (Enware, Speakman via RSEA, Storemasta/Pratt)** before plumbing installation. That is ≈4–12× landed, the same shape as the whole-house filter. Buyers are workplaces handling hazardous chemicals: labs, workshops, mines, pool plant rooms, water-treatment plants and chemical stores. The specific WHS-regulation or AS 4775 duty was not verified, and a text search of the WHS Regulations compilation found no "eye wash" or "safety shower" wording. Installation is plumbing work (backflow and tepid water), and the units need periodic flushing, inspection and servicing. Exact AS 4775 duty cycles and the WaterMark status of the unit were not verified this session (see Gaps).

### Cited Findings
**FOB (MIC listings, fetched)**
- Wenzhou Lailisi Safety Protection:
  - "SS304 Emergency Safety Eye Wash and Shower Combination Set Wall Mounted": US$105–120 (MOQ 2)
  - "Emergency Eye Washer and Shower Stainless Steel … Ansiz358.1-2014": US$300–368
  - "53L Self Contained Eyewash Station": US$45–65; "8L Emergency Portable Eye Wash": US$15–18
- Shanghai Sysbel "304 Stainless Steel Shower and Water Bowl Emergency Safety Showers Eye Wash": US$284–310 (MOQ 10)
- Biobase "SEW-WM1 Portable Vertical Emergency Eyewash and Shower": US$291–299
- Zhongshan Mayen "Laboratory Emergency Shower and Eye Wash with Cover": US$420
- Dongying Yuexiang "SS304 … Wall-Mounted Eye Wash Station": US$24–28
- — [MIC Emergency Shower](https://www.made-in-china.com/products-search/hot-china-products/Emergency_Shower.html); [MIC Eye Wash Station](https://www.made-in-china.com/products-search/hot-china-products/Eye_Wash_Station.html)

**Enware (Australian incumbent; public Shopify catalog read via /products.json on 2026-10-10; GST basis not stated)**
- "Emergency Stainless Steel Combination Shower with Hand/Foot Operated Eye/Face Wash": A$2,493.13–3,054.10
- Pedestal eye/face wash, hand/foot: A$1,662.09–2,181.51
- Pedestal eye wash, hand: A$1,246.58–1,745.19
- Wall-mounted hand-operated eyewash: A$1,052.67–1,541.60
- Wall-mounted deluge shower: A$682.90–741.03
- Portable gravity eye wash: A$623.47
- "Aquablend Tepid Water System for Emergency Safety Showers and Eye Washes": A$3,759.48
- Free-standing deluge shower + platform eye wash: A$8,363.20
- Shower alarm systems: A$3,916.62–6,993.95
- — [Enware combination shower](https://www.enware.com.au/products/emergency-stainless-steel-combination-shower-with-hand-foot-operated-eye-face-wash); [Enware tepid water system](https://www.enware.com.au/products/tepid-water-system-for-emergency-shower-and-eye-wash-in-ss-cabinet-with-lid); [Enware catalog JSON](https://www.enware.com.au/products.json)

**Other AU sellers (fetched)**
- RSEA (Speakman), inc GST:
  - SE-607 "Combination Shower Eye/Face Wash Bowl Hand/Foot System": A$2,630.99 (A$2,391.81 ex)
  - SE-612: A$1,725.99
  - SE-546 pedestal eye/face wash: A$978.95
  - — [RSEA SE-607](https://www.rsea.com.au/workplace-safety/emergency-eyewash-and-showers/pba-safety-shower-aerated-eye-face-wash-hand-foot-operated-se607); [RSEA SE-612](https://www.rsea.com.au/workplace-safety/emergency-eyewash-and-showers/pba-shower-free-standing-hand-foot-operated-eye-wash-se-612); [RSEA SE-546](https://www.rsea.com.au/workplace-safety/emergency-eyewash-and-showers/pba-eye-wash-unit-free-standing-hand-foot-operated-se-546)
- Storemasta: "Combination Emergency Shower Eye Face Hand/Foot Operated - Stainless Steel" A$2,501.42 — [Storemasta PSRSH027](https://shop.storemasta.com.au/products/psrsh027)

**Consumables and TMVs**
- Enware anti-bacteria eye-wash water preservative concentrate: A$27.24–97.82
- Tobin 2 × 1000 mL replacement bottles: A$120.12
- Aquablend Health TMV thermostatic cartridge (replacement part): A$147.25
- Aquablend 1500 TMV in 430×500 cabinet: A$2,183.95
- (fetched) — [Enware catalog JSON](https://www.enware.com.au/products.json)
- **Incumbent consolidation:** Paramount Safety (ProChoice) acquired Pratt Safety, a maker of emergency showers, in 2016 (search summary) — [RapidClean ProChoice](https://rapidclean.com.au/suppliers/prochoice-safety-gear/)

### Inferences
**Ladder (estimate)**
- SS combination station: FOB A$150–620. Landed ≈A$300–900 (≈60–80 kg crated; LCL W/M plus inspection), i.e. ≈1.5× FOB.
- Incumbent list A$1,726–3,054, plus tepid water system A$3,759 where specified, plus plumber install.
- ≈3–10× landed on the unit. It is a high-ticket, low-volume item sold by consultation, which matches the brief's "thick layer" test.

**Barrier**
- Buyers expect conformance to AS 4775 (not verified this session).
- Installation is licensed plumbing: backflow protection and tepid-water supply, which ties into the operator's existing skills.
- Product liability (chemical injury) is real but manageable with a compliant design and documentation.

**Annuity**
- Periodic activation, inspection and servicing, tepid-water/TMV servicing (TMV cartridges A$147), and preservative or bottle consumables for portable units. Frequency and price need verification.

**Channel fit**
- Excellent: labs, schools, pool plant rooms, councils, water and wastewater plants, mines and chemical stores. These are the same specifiers a water operator already meets.

### Gaps
- AS 4775-2007 requirements (weekly activation, annual inspection, flow and tepid-water specs) were not fetched. Neither was whether emergency showers and eyewash connected to potable supply need WaterMark certification or particular backflow devices. The ABCB disallows Claude agents, so the sibling water researcher should confirm via other sources.
- No service-contract price for eyewash/shower inspection was found.
- No AU distributor or trade discount structure for Enware or Speakman was found.

## Q6. Aged-care and home-medical equipment (TGA Class I; Support at Home AT-HM; NDIS; rental annuity)

### Takeaway
- **Retail purchase prices are thin at the low end, because marketplace sellers keep them low:**
  - Basic aluminium shower chairs cost US$8–16 FOB and retail at only A$67–100 (Costway via Harvey Norman's marketplace; Rapid Medical).
- **The thick layer is in rental and funded channels:**
  - Indicative hire is A$50–100/week for a shower chair or commode, A$100–200/week for an adjustable bed and A$80–150/week for a manual wheelchair.
  - Against that, an electric 3-function home-care bed is US$300–750 FOB and an alternating-pressure mattress US$9–53 FOB.
  - A hired electric bed can pay back its landed cost in ≈5–15 weeks.
- **Government funding makes this a growing consultation-sold channel:**
  - Support at Home's AT-HM scheme funds A$500 / A$2,000 / A$15,000 tiers per 12 months.
  - NDIS treats items under A$1,500 as low-cost AT.
- **The barrier is clearable:**
  - TGA Class I is self-declared, with ARTG inclusion at ≈A$651 plus ≈A$121/yr per entry (consultancy figures).
  - Liability (falls, bed entrapment) and clinical prescriber relationships (occupational therapists) are the real hurdles.

### Cited Findings
**FOB (MIC listings, fetched)**
- **Shower chairs:**
  - Shanghai Brother Medical: US$7.80–11.50
  - Hebei Songhui: US$10
  - Dinglian (Zhongshan) aluminium shower bench: US$10.17–10.85
  - Nanjing Archmed with armrest: US$15.50–18.80
  - — [MIC Shower Chair](https://www.made-in-china.com/products-search/hot-china-products/Shower_Chair.html)
- **Commodes:**
  - Foshan L&C: US$14–15
  - Hebei Songhui 3-in-1: US$25
  - Wuyi Kinda 3-in-1 rolling: US$39–40.50
  - Hydraulic patient-lift commode chairs: US$130–203
  - — [MIC Commode Chair](https://www.made-in-china.com/products-search/hot-china-products/Commode_Chair.html)
- **Rollators:**
  - Science Medical: US$11–20
  - Dinglian: US$15.50–18
  - Foshan L&C: US$35–37
  - Jiangsu Jumao X-Care: US$55–65
  - Carbon-fibre: US$185–195
  - — [MIC Rollator Walker](https://www.made-in-china.com/products-search/hot-china-products/Rollator_Walker.html)
- **Electric home-care and hospital beds:**
  - Hebei Huaren C05-1: US$330–350
  - Foshan Medco 3-function: US$300–500
  - Topmost 3-function: US$350–400
  - Hebei Webian: US$610–750
  - Tiankang "Tecforcare": US$899–1,049
  - Manual 2-crank: US$64.50–140
  - — [MIC Home Care Bed](https://www.made-in-china.com/products-search/hot-china-products/Home_Care_Bed.html); [MIC Electric Hospital Bed](https://www.made-in-china.com/products-search/hot-china-products/Electric_Hospital_Bed.html)
- **Alternating-pressure mattresses:**
  - Topmost: US$9–10
  - Shanghai Brother with pump: US$9.80–10.90
  - Ningbo Pinmed "with Medical Air Pump CE": US$45–46 (MOQ 500)
  - Foshan Hongfeng tubular: US$47–53
  - — [MIC Alternating Pressure Mattress](https://www.made-in-china.com/products-search/hot-china-products/Alternating_Pressure_Mattress.html)

**AU purchase prices (search summaries)**
- Costway height-adjustable aluminium shower chair: A$74 with armrests, A$67 without (Harvey Norman) — [Harvey Norman Costway](https://www.harveynorman.com.au/costway-height-adjustable-shower-chair-with-armrest-and-buckle.html)
- Rapid Medical Supplies aluminium adjustable chair: A$79.99 (was A$100) — [Rapid Medical](https://www.rapidmedicalsupplies.com.au/products/shower-chair-aluminium-rust-free-adjustable-height)
- Independent Living Specialists (Lane Cove NSW) publishes a manual for its S11188 "Royale" 250 kg aluminium shower chair; no price found — [ILS manual](https://ilsau.com.au/wp-content/uploads/2019/11/S11188_ROYALE_Premium-Aluminium-Shower-Chair.pdf)

**Rental annuity (fetched; indicative directory figures)**
- Basic aids: "From $15/day or $50/week"
- Shower chair / commode hire: "$50 - $100/week"
- Adjustable bed hire: "$100 - $200/week"
- Manual wheelchair: "$80 - $150/week"
- Mid-range purchase: "$500 - $3,000"; complex equipment: "$5,000 - $30,000+"
- Funding listed: Support at Home, NDIS AT, CHSP, private. Wording checked 15 Sep 2026. The page cites the NDIS and Support at Home 2026-27 pricing.
- — [Carevo equipment hire (Brisbane)](https://carevo.com.au/services/equipment-hire-sales/brisbane-market)

**Funding schemes (search summaries; health.gov.au, myagedcare.gov.au and ndis.gov.au returned 503/HTTP-2 resets/403 to direct fetches)**
- AT-HM tiers: low A$500, medium A$2,000, high A$15,000, each for a 12-month period.
  - Extensions: 24 months for complex home modifications or progressive conditions; up to 48 months in some cases.
  - AT above A$15,000 is available with a prescribed need.
  - Unspent funds expire.
  - — [health.gov.au AT-HM scheme (docx, Nov 2025)](https://www.health.gov.au/sites/default/files/2025-11/support-at-home-program-assistive-technology-and-home-modifications-at-hm-scheme.docx); [My Aged Care AT-HM](https://www.myagedcare.gov.au/assistive-technology-and-home-modifications-scheme)
- NDIS: items under A$1,500 are low-cost AT; over A$15,000 is high-cost AT needing prior approval (Carevo summary, fetched) — [Carevo](https://carevo.com.au/services/equipment-hire-sales/brisbane-market)
- TGA fees: as in Q3 (Class I A$651 application, A$121 annual; consultancy) — [Pure Global](https://www.pureglobal.com/news/tga-medical-device-ivd-fees-annual-charges-2026)

### Inferences
**Purchase ladder**
- Shower chair: FOB A$11–23, landed ≈A$20–35 (bulky), retail A$67–100 → only ≈2–4× landed. Not a thick layer, because unregulated or self-declared marketplace sellers keep it low.

**Rental ladder (estimate)**
- Electric bed: FOB US$330–750 (A$475–1,080), landed ≈A$800–1,500 incl. bulky LCL. Hire at A$100–200/week pays back in ≈5–15 weeks.
- Over a 2-year asset life at ~60% utilisation, gross hire revenue is ≈A$6–12k per bed versus ≈A$1–1.5k capital, plus delivery, cleaning, maintenance and pickup labour.
- Pressure mattresses and commodes are similar (A$50–100/week against A$15–75 FOB).
- **This rental annuity is the best "ladder" in the aged-care group.**

**Clearability**
- TGA Class I sponsor duties: an Australian entity, manufacturer evidence of conformity to the Essential Principles, ARTG entry, adverse-event and recall obligations. Cost is ≈A$651 + A$121/yr per entry.
- Electric beds add electrical safety (RCM) and a bed-specific standard (IEC 60601-2-52 from general knowledge, not verified).

**Fit**
- Moderate–high for consultation sales: OT/physio prescribers, home-care providers and Support at Home care partners.
- It requires logistics: delivery, set-up, cleaning and retrieval.

### Gaps
- NDIS Assistive Technology, Home Modifications and Consumables Code Guide prices were not accessible (ndis.gov.au 403).
- Support at Home AT-HM list item rules (loan vs purchase, prescriber requirements) were not readable.
- No Aidacare or ILS published prices or margins were found.
- TGA classification of specific items (e.g. whether pressure mattresses are Class I or IIa) was not verified.
- Carevo is an aggregator; its hire ranges are indicative.

## Q7. CPAP masks and consumables, hearing aids, and (added) AEDs — honest clearability

### Takeaway
- **CPAP — fails clearability for this operator.**
  - The markups are as notorious as claimed: Chinese auto-CPAP US$180–450 FOB vs ResMed AirSense 10 AutoSet A$1,299; Chinese silicone masks US$7.61–20 FOB vs ResMed/F&P masks A$195–299 and cushions A$69–95.
  - The barrier is TGA Class IIa for devices (≈A$1,244 to apply, A$1,305/yr), a clinical prescribing channel, and brand-locked consumables.
- **Hearing aids — fail too** (audiology fitting, Hearing Services Program accreditation).
- **AEDs — the more interesting added case.**
  - Class III devices: the operator should resell an existing ARTG sponsor's units (e.g. Mindray BeneHeart C2 A$2,249; Defibtech Lifeline A$2,049) rather than sponsor its own.
  - It can private-label the **unregulated accessory layer** (cabinets A$99.95–1,350, signage, kits).
  - It can capture the **pads/battery replacement annuity**: A$140–650 per replacement, typically every 2–7 years per unit.

### Cited Findings
**CPAP**
- **FOB (MIC, fetched):**
  - Hunan Ventmed auto CPAP: US$180–350
  - Contec R100: US$200–300
  - Hangzhou Blackstone BiPAP/CPAP auto: US$345–360 (MOQ 100)
  - Somatech: US$420–450
  - Masks: Ningbo Hanyue "CE ISO Mdr Silicone CPAP Mask" US$7.61–12 (MOQ 200); Hangzhou Trifanz US$8.50–10.50; ThinkEhoo "ISO13485" full face/nasal US$19.50
  - — [MIC Cpap](https://www.made-in-china.com/products-search/hot-china-products/Cpap.html); [MIC Auto Cpap](https://www.made-in-china.com/products-search/hot-china-products/Auto_Cpap.html); [MIC Cpap Mask](https://www.made-in-china.com/products-search/hot-china-products/Cpap_Mask.html)
- **AU retail (fetched, CPAP Australia public Shopify catalog):**
  - ResMed AirSense 10 AutoSet: A$1,299; AirSense 10 Elite: A$1,315–1,399
  - ResMed AirFit F20 / F30i / F40 / N20 / N30i / P10 / P30i masks: A$195–199; AirTouch N30i: A$200–209
  - Fisher & Paykel Evora nasal: A$299
  - Cushions: A$69–95 (e.g. AirFit N20 cushion A$69; F30/F40 cushion A$95)
  - Headgear: A$65–89.50
  - Filters: A$4.25–40
  - Philips DreamStation Go battery: A$599
  - — [CPAP Australia catalog JSON](https://www.cpapaustralia.com.au/products.json)
- **TGA fees:** Class IIa/IIb A$1,244 application and A$1,305 annual; Class III A$1,603 and A$1,662; audits A$4,926 (L1) to A$18,118 (L2) (consultancy, fetched) — [Pure Global](https://www.pureglobal.com/news/tga-medical-device-ivd-fees-annual-charges-2026)

**Hearing aids**
- FOB (MIC, fetched):
  - Brother Medical "Digital Programmable Hearing Aid": US$12.50–15.50
  - Xiamen Vienatone rechargeable ITC: US$25–40
  - Hong Yu Kang Bluetooth BTE: US$34–38
  - Earsmate Bluetooth 16-channel APP: US$39.99–55.99
  - A Chinese trader lists Phonak Audéo Marvel M30 at US$889
  - — [MIC Hearing Aid](https://www.made-in-china.com/products-search/hot-china-products/Hearing_Aid.html)
- AU price not captured: Blamey Saunders' site is client-rendered and returned no content.

**AEDs (AU retail, fetched from Defibshop WooCommerce public store API, 2026-10-10)**
- **Devices:**
  - Mindray BeneHeart C2 fully-automatic package: A$2,249 (reg A$2,395); C2 4G-connected: A$3,095
  - Defibtech Lifeline fully-auto with 5-yr battery: A$2,049
  - ZOLL AED Plus package: A$2,344.95 (reg A$3,271.95)
  - ZOLL AED 3 travel package: A$2,999
  - Primedic HeartSave myPAD: A$2,295
- **Consumables:**
  - Mindray MR62 adult/paediatric pads: A$139.95; Mindray C2 battery: A$439
  - HeartSine PAD-PAK-03 (pads + battery cartridge): A$279.95
  - Philips HS1 adult SMART pads: A$154.95; HS1/FRx battery: A$299.95
  - ZOLL AED Plus pads & batteries pack: A$294.95
  - Defibtech 5-yr battery: A$509.95; 7-yr battery: A$649.95
  - CU Medical iPAD battery: A$499.95
- **Own-brand accessories:**
  - "Defibshop Green Indoor Wall-mounted AED Cabinet [Alarm & Strobe]": A$99.95 (reg A$299.95)
  - Heated outdoor cabinet: A$1,028.50; heated cabinet + stand: A$1,350
  - AED signs: A$2.50–39.95
- — [Defibshop Mindray C2](https://www.defibshop.com.au/product/mindray-beneheart-c2-fully-automatic-aed-with-screen-live-visual-and-voice-prompts/); [Mindray MR62 pads](https://www.defibshop.com.au/product/mindray-beneheart-mr62-multifunction-adult-paediatric-electrode-pads/); [Mindray C2 battery](https://www.defibshop.com.au/product/mindray-beneheart-c2-replacement-battery/); [Defibshop heated cabinet](https://www.defibshop.com.au/product/defibshop-heated-outdoor-galvanized-steel-aed-cabinet/)
- **FOB of generic Chinese AEDs (MIC, fetched):**
  - Senwell: US$230–550
  - Huichao Medical: US$400–550 (MOQ 5)
  - CMICS "with Preinstalled Pads": US$490 (MOQ 10)
  - Nanjing Foinoe: US$299–699
  - Comen S5: US$1,800–2,500
  - — [MIC Automated External Defibrillator](https://www.made-in-china.com/products-search/hot-china-products/Automated_External_Defibrillator.html); [MIC Defibrillator](https://www.made-in-china.com/products-search/hot-china-products/Defibrillator.html)

### Inferences
**CPAP**
- Mask ladder ≈US$8–20 FOB (A$11.50–29) → A$195–299 (≈7–26×); device ≈US$180–450 (A$259–647) → A$1,299 (≈2–5×).
- Owning an own-brand CPAP ARTG entry (Class IIa, needing EU-MDR/MDSAP-grade conformity evidence plus clinical-channel trust) is not a small-operator project.
- Generic masks would need ARTG entries and compatibility claims against ResMed devices.
- **Clearability: low.**

**Hearing aids**
- Similar ladder. Clearability is low without audiology staff.

**AED**
- The device ladder for a Chinese AED is ≈3–5× FOB (US$300–500 = A$431–719 → A$2,049–2,249 retail for ARTG-listed brands), but Class III conformity assessment (≈A$1,603 + A$1,662/yr + audit fees, plus evidence) blocks own-brand entry.
- **Viable play: become a reseller/servicer of an existing ARTG brand and private-label the accessories.** Cabinets are unregulated metalwork — a ~US$20–60 FOB item is an estimate (not observed) — selling at A$100–1,350.
- Then sell a "readiness" subscription: pad/battery replacement A$140–650 per event, monthly self-check reminders, and post-use replacement.

**Demand drivers**
- Not verified this session: whether any state mandates AEDs (gap).

### Gaps
- Reseller/distributor margins for Mindray, ZOLL or HeartSine AU are not public.
- AED mandates and grants by state were not researched (web search exhausted).
- CPAP mask TGA classification was not verified.
- Hearing Services Program voucher device schedule and prices were not fetched.

## Q8. Commercial kitchen equipment (gas certification, RCM; hospitality buyers)

### Takeaway
Chinese commercial gas ranges list at US$450–1,630 FOB and combi ovens at US$900–13,550 FOB (MIC). Australian prices could not be captured this session: Nisbets returned 403 and Comcater and FED publish no web prices. Gas appliances need Australian gas-appliance certification (scheme not verified this session) and RCM for the electrics. The annuity is service, gas-compliance and water-treatment consumables for combi ovens and coffee machines. **Evidence is insufficient to rank this highly.** Heavy freight, per-model gas certification and commissioning liability make it a poor first move. The water-filtration and descaling annuity on hospitality equipment overlaps with the water sibling.

### Cited Findings
- **FOB (MIC, fetched):**
  - Guangdong Jieguan: 4-burner countertop gas range US$450–480; 4-burner with griddle US$620–660; 4-burner with oven US$1,080–1,085; 8-burner with oven US$1,630–1,635
  - Heavybao 4-burner: US$1,031–2,000
  - Combi ovens: Guangzhou Benniu gas/electric US$902–1,083; Jieguan 6-tray US$5,000–8,000; Truelen 20-layer US$9,800–13,550
  - — [MIC Commercial Gas Range](https://www.made-in-china.com/products-search/hot-china-products/Commercial_Gas_Range.html); [MIC Combi Oven](https://www.made-in-china.com/products-search/hot-china-products/Combi_Oven.html)
- **Access notes:**
  - Nisbets returned HTTP 403 even for robots.txt (2026-10-10).
  - FED (fed.net.au) robots allows all, but the site is a client-rendered "lander".
  - Comcater robots disallows /wp-json/ and publishes no prices on product pages (fetched robots).

### Inferences
- Ladder not established. Clearability looks low–moderate: per-model gas certification cost is unknown and likely five figures. Freight is heavy, and installation needs licensed gasfitters, which the operator may have.
- **Better fit:** the consumable/service annuity (water filters, descaler, preventive maintenance) on existing installed kitchens. That belongs with the water sibling.

### Gaps
- No AU price, gas-certification scheme name, fee or lead time, and no Nisbets/Comcater/FED margin data.

## Q9. Playground and park equipment (AS 4685; council procurement)

### Takeaway
Chinese outdoor play structures list at US$1,100–6,500 per set (or US$55–300/m² for indoor play) on MIC. Australian suppliers quote project by project: Playground Centre's quote cart says "price estimate does not include delivery and installation". **No Australian tender or price data was captured, so the "5× markup" question cannot be answered from evidence here.** The likely thick layers are design, AS 4685 compliance certification, softfall, installation and council panel access. The annuity is periodic inspection and maintenance, not verified.

### Cited Findings
- **FOB (MIC, fetched):**
  - "Outdoor Kids Plastic Playground Slide Equipment": US$5,060–5,560/set
  - "Kids Outdoor Plastic Slide": US$1,100–1,500/set
  - "ASTM Amusement Park Outdoor Children Playground Equipment (KSII-20401)": US$1,500–3,000/set
  - "Outdoor Playground Equipment for Kids": US$1,800–1,900/set
  - Custom outdoor slides: US$80–180/m²
  - Indoor play: US$55–280/m²
  - — [MIC Playground Equipment](https://www.made-in-china.com/products-search/hot-china-products/Playground_Equipment.html)
- **AU:** Playground Centre product pages carry a "Quote Summary" with "price estimate does not include delivery and installation". Price-level filter values seen: 0 and 25000 (fetched) — [Playground Centre product](https://www.playgroundcentre.com/product/12-large-pyramid)

### Inferences
- Not rankable. AS 4685 compliance, council procurement panels and certified installers (from general knowledge, not verified this session) suggest a classic spec'd/tender market better covered by the B2B-spec'd sibling.

### Gaps
- AS 4685 inspection regime, certification cost, council panel requirements (Local Buy, LGP, MAV) and AU installed prices were not researched (web search quota exhausted).

## Q10. Warehouse pallet racking and shelving (AS 4084; inspection annuity)

### Takeaway
- **Factory price:** Chinese selective pallet racking is quoted at about **US$0.50–2.00 per kg** FOB (MIC).
- **The annuity:** Dexion (the Australian incumbent) states that self-inspections "shall not be substituted for 12 monthly inspection from a competent service provider". It sells inspections by "Dexion approved rack inspectors" with a "written audit report", so a 12-monthly inspection and repair annuity clearly exists.
- **Missing data:** Australian installed prices per bay or pallet position, and inspection rates, were not captured.
- **The barrier:** engineering design to AS 4084, load signage and competent inspectors. The operator's trades relationships fit installation, but racking design and inspection are an engineering competence the operator does not have.

### Cited Findings
- **FOB (MIC listings, fetched):**
  - Weida Rack "Heavy Duty Warehouse Pallet Storage Racks": US$0.80–0.90/kg (MOQ 1,000 kg)
  - Nova "Drive in Rack": US$0.60–1.35/kg
  - Victory Rack selective: US$0.80–1.20/kg
  - Dalian "Pallet Racking Warehouse Storage Heavy Duty": US$1.50–2.00/kg
  - Shandong Nelson 1–12 m adjustable: US$34–38 per set
  - — [MIC Pallet Racking](https://www.made-in-china.com/products-search/hot-china-products/Pallet_Racking.html)
- **Dexion (fetched):**
  - "This inspection shall not be substituted for 12 monthly inspection from a competent service provider. Remember if any damage has occurred, have it assessed by your service provider." — [Dexion Pallet Racking Inspection Checklist](https://www.dexion.com.au/brochures/dexion-pallet-racking-inspection-checklist/)
  - "Our Dexion approved rack inspectors can examine your installation and provide you with a written audit report, including any adjustments that may be required." — [Dexion Services & Support](https://www.dexion.com.au/services-support/)

### Inferences
- Racking is steel by weight, so freight and landed cost are dominated by tonnage: roughly 1.3–1.6× FOB as an estimate.
- Without AU installed prices the ladder multiple is unknown.
- The inspection annuity is real but competence-gated (engineering). Score it as moderate clearability through a partnership with a rack engineer, and low for the operator alone.

### Gaps
- AS 4084-2023 inspection requirements (text and frequency), AU installed price per pallet position, rack inspection day rates, and Schaefer/Colby/Dexion margins (web search exhausted).

## Q11. Pool safety (AS 1926; QLD pool safety certificates; latches and hinges)

### Takeaway
- **Queensland creates a licensed-inspection annuity:**
  - Certificates are required on sale or lease, valid 1 year for shared pools and 2 years for non-shared.
  - Only QBCC-licensed pool safety inspectors can issue them.
  - Penalties exceed A$2,000 (QBCC on-the-spot) and A$20,000 or A$100,000 in court.
  - Queensland applies AS 1926.1-2007 via QDC MP 3.4.
- **Hardware ladder:** Chinese glass-pool-gate latches cost US$15–32 FOB and glass spigots US$5–30 FOB. In Australia a single gate costs A$250–650 installed and glass pool fencing A$300–800 per metre.
- **Fit:** good for a trades-connected operator (inspection + rectification + latch/hinge supply). The inspector licence is the gate, and inspection fees were not captured.

### Cited Findings
- **QLD pool safety (fetched; page updated Oct 2026, "checked against official sources")** — [What's The Damage QLD pool fence laws](https://whatsthedamage.com.au/pool-fence-laws-qld/):
  - Certificates are needed when selling or leasing; valid 1 year (shared) and 2 years (non-shared)
  - Non-shared pools cannot be leased without a certificate
  - Sellers without a certificate lodge Form 36, and the buyer has 90 days after settlement
  - Re-inspection within 3 months after a non-conformity notice
  - Only QBCC-licensed pool safety inspectors may issue certificates
  - Fines: council >A$900 (individuals) / >A$2,600 (corporations); QBCC >A$2,000 on-the-spot; court >A$20,000 / >A$100,000
  - QDC MP 3.4 prescribes AS 1926.1-2007 and AS 1926.2-2007
  - Gates must self-close and self-latch; outside latch ≥1,500 mm; inside latch ≥150 mm below the top of the gate and covered by a shield with a 450 mm radius
  - Related costs: single gate A$250–650; glass pool fencing A$300–800/m; aluminium A$100–350/m
- **FOB (MIC, fetched):**
  - Huize Inox "Australia Tested Qualified Glass Gate Latch … Swimming Pool Gate Latch": US$17–18 (MOQ 10)
  - Huize magnetic latch: US$16–20
  - Dongying Zhengda glass-to-glass spring latch: US$20–25
  - Ningbo ZNZ magnetic latch for mesh fence: US$26–32
  - Glass spigots: US$4.99–29.99 (e.g. Ningbo Willest US$6.87–7.38; Ningbo Unikim 2205/316 US$25.99–29.99)
  - — [MIC Pool Gate Latch](https://www.made-in-china.com/products-search/hot-china-products/Pool_Gate_Latch.html); [MIC Glass Spigot](https://www.made-in-china.com/products-search/hot-china-products/Glass_Spigot.html)

### Inferences
- **Hardware ladder:** a latch at ≈A$25–45 FOB probably retails at A$100+. The incumbent MagnaLatch-type product price was not captured, so this is an estimate.
- **Annuity:** recurring certificates on each sale or lease (1–2-year validity) plus rectification work (latches, hinges, gaps).
- **Clearability:** inspector licensing (QBCC pool safety inspector) needs training and registration, and the cost and time were not verified. Liability is drowning-related, so professional indemnity is high.

### Gaps
- QLD inspector licence requirements and cost; typical certificate fee.
- VIC (4-yearly barrier certification), NSW and WA regimes (pages exist on the same site but were not fetched).
- D&D Technologies (MagnaLatch) AU prices.

## Q12. Brief assessments — gas detection, RCDs/switchboards, backflow devices, dental/vet consumables, hair/beauty IPL

### Takeaway
- **Backflow** (the water operator's home turf) has the best-documented annuity:
  - Every testable device is tested every 12 months by an endorsed plumber, at A$150–320 for the first device and A$90–145 for each additional one.
  - Device installs cost A$650–3,200, and failed-device replacements A$550–1,400.
  - The sibling water researcher should own this.
- **Portable 4-gas detectors:** US$62–298 FOB in China; one Chinese reseller lists the Honeywell BW MicroClip XL at US$328. They carry a calibration and sensor annuity, but hazardous-area certification and Australian prices were not established.
- **RCBOs:** US$2–24 FOB, but electrician-installed and electrical-certification-gated. Low fit.
- **Dental composites:** several MIC listings use third-party brand names (Tokuyama, GC) at US$8–30, which suggests grey-market or counterfeit risk. Low fit.
- **IPL/laser:** not researched (MIC keyword redirect; web search exhausted). The likely licensing burden (ARPANSA guidance, state licences in some jurisdictions) was not verified.

### Cited Findings
- **Backflow (fetched; updated/verified Oct 2026; GST inc)** — [What's The Damage backflow testing cost](https://whatsthedamage.com.au/backflow-testing-cost-australia/):
  - Annual test, first device: A$150 / 199 / 320; additional device same visit: A$90 / 120 / 145
  - Installs: DCV 20 mm A$650–950; RPZ 20 mm A$1,250–1,850; RPZ 25–32 mm A$1,250–3,200
  - Repair: A$180–480; like-for-like replacement: A$550–1,400
  - Sydney Water: A$11.05 quarterly backflow administration fee, A$553.12 if the annual test lapses
  - Testable devices must be tested every 12 months by "a licensed plumber with a backflow testing endorsement"
- **Gas detectors (MIC, fetched)** — [MIC Multi Gas Detector](https://www.made-in-china.com/products-search/hot-china-products/Multi_Gas_Detector.html):
  - TZONE 4-in-1: US$62–65
  - Henan Fosen 4-in-1 pumped "Co O2 H2s Ex": US$116–125
  - Henan Zhong An "Portable 4 Gas Detector … Confined Space": US$220–285
  - Hanwei 6-in-1: US$1,000–1,100
  - Ningxia Maiya "Bw Microclip XL Multi-Gas Detectors Mcxl-Xw00-Y-Cn": US$328.40
- **RCBO/RCCB (MIC, fetched):** US$2.12–23.99 (e.g. Zhejiang Vekon 4P 20A US$12.80–13.10; Korlen 1P+N 30 mA US$4.15–4.20) — [MIC RCBO](https://www.made-in-china.com/products-search/hot-china-products/RCBO.html)
- **Dental composites (MIC, fetched):** US$8–30. Listings name "Tokuyama" and "GC" brands from third-party sellers — [MIC Dental Composite](https://www.made-in-china.com/products-search/hot-china-products/Dental_Composite.html)

### Inferences
- Gas detection could be a strong annuity (bump tests, annual calibration, sensor replacement every 2–3 years, from general knowledge), but without AU prices and hazardous-area certification facts it cannot be scored with confidence. It is mining- and confined-space-centric.
- RCDs and switchboards are a licensed-electrician channel with brand-loyal specifiers (Clipsal, Hager, NHP). Low capturable layer for a non-electrician.

### Gaps
- Gas detector AU prices, IECEx/ANZEx certification needs and calibration-service prices.
- EESS level for RCDs.
- TGA/APVMA rules for dental and vet consumables.
- ARPANSA and state IPL licensing.

## Q13. Scoring on the shared framework, ranking, and the top 3 with first steps

### Takeaway
Three categories rank highest for a lean, trades-connected, consultation-selling operator willing to be the responsible supplier:
1. **AS 3786 interconnected smoke alarms plus installed-compliance service.** The Chinese factory already holds the ActivFire certificate, and the AU brand is added as "agent". The ladder runs ≈US$9–11 FOB to A$134–250 installed. A legal deadline (QLD, 1 Jan 2027) is followed by a 10-year replacement cycle and annual landlord checks.
2. **Plumbed emergency eyewash/safety showers with tepid-water/TMV service.** Units cost ≈US$105–430 FOB and list at A$1,726–3,054 from the incumbents. This is the closest analogue to the whole-house filter: plumbing install, niche incumbents, and a service tail.
3. **Aged-care/home-medical equipment rental fleet** (electric beds, commodes, shower chairs, pressure mattresses) as a TGA Class I sponsor. Hire runs A$50–200/week on US$10–750 FOB assets, with growing Support at Home and NDIS funding.

Runners-up:
- First-aid kits with restocking (the best bundle add-on to any site visit)
- Fire-equipment servicing, reachable only by acquiring or partnering with a licensed firm
- AED resale with own-brand cabinets and a pads/battery annuity

Low clearability for this operator: CPAP, hearing aids, own-brand PPE, commercial kitchen, playground, pallet racking and gas detection.

### Cited Findings
These are the key cross-category facts behind the scores. Full citations are in Q1–Q12.

**Smoke alarms**
- Siterwell (Ningbo) is the ActivFire registrant for MATelec's and GSM Electrical's alarms. Anka (Shenzhen) is the registrant for Brilliant Lighting's — [ActivFire afp-3314](https://activfire.csiro.au/html/certDetailsView/afp3314.htm); [afp-3735](https://activfire.csiro.au/html/certDetailsView/afp3735.htm); [afp-3738](https://activfire.csiro.au/pdfs/certificates/afp3738.pdf?nc=1)
- Anka lists AS 3786 10-year RF interconnected alarms at US$9–11.50 (MOQ 500) — [MIC AS3786](https://www.made-in-china.com/products-search/hot-china-products/AS3786_Smoke_Alarm.html)
- Installed price is A$100–250 per alarm plus call-out — [What's The Damage QLD](https://whatsthedamage.com.au/smoke-alarm-laws-qld/)
- QLD rule: all dwellings by 1 Jan 2027, and hardwired alarms must be replaced with hardwired — [QFD fact sheet](https://www.fire.qld.gov.au/sites/default/files/2026-06/Smoke-Alarm-Fact-Sheet.pdf)

**Eyewash/showers**
- Combination shower list prices: Enware A$2,493–3,054, RSEA SE-607 A$2,630.99, Storemasta A$2,501.42 — [Enware](https://www.enware.com.au/products/emergency-stainless-steel-combination-shower-with-hand-foot-operated-eye-face-wash); [RSEA](https://www.rsea.com.au/workplace-safety/emergency-eyewash-and-showers/pba-safety-shower-aerated-eye-face-wash-hand-foot-operated-se607); [Storemasta](https://shop.storemasta.com.au/products/psrsh027)
- MIC equivalents: US$105–430 — [MIC Emergency Shower](https://www.made-in-china.com/products-search/hot-china-products/Emergency_Shower.html)

**Aged care**
- Hire rates: beds A$100–200/week, commodes and shower chairs A$50–100/week — [Carevo](https://carevo.com.au/services/equipment-hire-sales/brisbane-market)
- Electric home-care beds: US$300–750 FOB — [MIC Home Care Bed](https://www.made-in-china.com/products-search/hot-china-products/Home_Care_Bed.html)
- TGA Class I: A$651 to apply plus A$121/yr (consultancy) — [Pure Global](https://www.pureglobal.com/news/tga-medical-device-ivd-fees-annual-charges-2026)
- AT-HM tiers: A$500 / A$2,000 / A$15,000 — [health.gov.au AT-HM](https://www.health.gov.au/sites/default/files/2025-11/support-at-home-program-assistive-technology-and-home-modifications-at-hm-scheme.docx)

**Fire services and PPE margins**
- Force Fire: A$106m revenue, A$8.3m EBIT, ~30% recurring; bought for up to A$53.5m — [SCEE ASX 2025-03-31](https://announcements.asx.com.au/asxpdf/20250331/pdf/06h4w5kblbkdby.pdf)
- QBCC licence classes gate portable fire servicing — [QBCC](https://qbcc.qld.gov.au/licences/apply-licence/available-licences/fire-protection/portable-install-maintain)
- Wesfarmers Industrial & Safety: ≈3.7% EBIT in 1H FY26 — [Wesfarmers 1H FY26](https://announcements.asx.com.au/asxpdf/20260219/pdf/06wgn4t8b91rhz.pdf)

### Inferences
**Scores** run 1–5, where 5 is best for the operator. Liability: 5 = low exposure. Incumbent risk: 5 = weak incumbents. These are researcher judgements built on the cited ladders. Confidence is lower where the ladder lacks AU prices.

| Category | Ladder multiple (FOB→end) | Capturable layer | Clearability | Annuity | Liability | Incumbent risk | Channel fit | Total /35 | Evidence quality |
|---|---|---|---|---|---|---|---|---|---|
| **Smoke alarms (AS 3786 RF/240 V interconnected) + install + landlord subscription** | 5 (≈7–17× landed, installed) | 4 | 4 | 4 (10-yr replacement; annual rental checks) | 3 | 3 | 5 | **28** | High |
| **Emergency eyewash/safety showers + tepid/TMV service** | 4 (≈3–10× landed) | 4 | 3 (AS 4775 / plumbing compliance unverified) | 3 | 3 | 4 | 5 | **26** | Medium-high (prices strong, standard unverified) |
| **Aged-care equipment rental (Class I sponsor)** | 5 (hire payback ≈1–15 weeks) | 4 | 4 | 5 | 2 | 3 | 3 | **26** | Medium (aggregator hire rates) |
| First-aid kits + restock | 5 (≈11–25× landed) | 3 | 3 (ARTG kit sponsor) | 4 | 4 | 3 | 4 | 26 | Medium-high |
| Fire-equipment servicing (extinguishers/blankets/exit lights) | 4 (product 5–10×; service 2–3× product value) | 4 | 2 (QBCC licence + experience, or acquire) | 5 | 3 | 3 | 4 | 25 | Medium-high |
| AED resale + own-brand cabinets + pads/battery annuity | 3 | 3 | 3 (resell an ARTG brand; Class III own-brand blocked) | 4 | 3 | 3 | 4 | 23 | High (prices), low (mandates) |
| Test-and-tag service | 2 | 2 | 4 | 5 | 4 | 2 | 4 | 23 | Medium |
| Pool safety (QLD certs + hardware) | 3 | 3 | 2 (licence) | 4 | 2 | 4 | 4 | 22 | Medium |
| Height-safety inspection | 3 | 3 | 3 | 3 (non-mandatory per SafeWork NSW) | 2 | 3 | 4 | 21 | Medium |
| Own-brand PPE (harness, P2, eyewear) | 5 | 2 (distributor EBIT ≈3.7%) | 3 | 3 | 3 | 1 | 3 | 20 | Medium |
| Pallet racking + AS 4084 inspection | 3 (AU price unknown) | 3 | 2 (engineering) | 4 | 2 | 3 | 2 | 19 | Low |
| CPAP masks/devices | 5 | 3 | 1 | 5 | 3 | 1 | 1 | 19 | High (prices) |
| Gas detection (portable 4-gas + calibration) | 4? | 3 | 2 | 4 | 2 | 2 | 2 | 19 | Low |
| Hearing aids | 5 | 3 | 1 | 3 | 3 | 1 | 1 | 17 | Low |
| Commercial kitchen | ? (3) | 3 | 2 | 3 | 2 | 2 | 2 | 17 | Low |
| Playground | ? (3) | 3 | 2 | 2 | 2 | 3 | 2 | 17 | Low |
| Backflow devices/testing | — (water sibling) | — | high for a plumber | 5 (12-monthly A$150–320) | — | — | 5 | n/a | High |

**#1 Smoke alarms — first steps**
1. Confirm that the AU brand-owner route works. A new Australian brand can appear on the Chinese OEM's CSIRO ActivFire certificate as "agent", as MATelec, GSM Electrical and Brilliant Lighting do. Get the CSIRO certificate-variation fee and lead time. Separately, check whether QLD law needs only AS 3786 compliance (the fact sheet says only "AS 3786-2014") or an ActivFire listing.
2. Sample both types. Wireless 10-year RF units (Anka US$9–11.50, Sconda US$7.30–8.50) need no electrician. 240 V interconnected units (Anka US$19.30–21) are required wherever hardwired alarms exist. Check RCM/EESS registration for the 240 V unit and check RF interoperability.
3. Do not stock for the 1 Jan 2027 wave alone; it lands too late for a new MOQ order. Build the post-deadline book instead:
   - QLD owner-occupier stragglers
   - property-manager portfolios on annual checks (≈A$149/yr benchmark)
   - VIC rentals (12-monthly smoke check plus 2-yearly gas and electrical checks the operator's trades can bundle)
   - the 2027–2032 ten-year replacement cohort
4. Price installed around A$139–155 per alarm, matching the advertised QLD floor. That keeps ≈A$100+ gross per alarm over landed hardware, before labour.

**#2 Emergency eyewash/safety showers — first steps**
1. Buy and read AS 4775. Confirm with a plumbing regulator, or through the sibling water researcher, whether the unit needs WaterMark and what backflow device and tepid-water provisions apply. ABCB sites disallow Claude agents, so a human must check.
2. Get 2–5 samples from MIC sellers with low MOQs. Wenzhou Lailisi has MOQ 2 at US$105–368 and Shanghai Sysbel MOQ 10 at US$284–310. Commission independent testing of flow, pattern and materials to AS 4775 (cost unknown).
3. Sell installed-plus-service packages to labs, schools, council pool plant rooms, and water and wastewater plants. Price ≈20–30% under the Enware/Speakman list (A$1,726–3,054), plus a tepid-water option (Enware's system is A$3,759) and an annual inspection contract.

**#3 Aged-care equipment rental — first steps**
1. Set up as a TGA sponsor. Get ARTG Class I entries for a 3-function electric bed, a commode or shower chair, and an alternating-pressure mattress. Budget ≈A$651 + A$121/yr per entry (consultancy figures; confirm on tga.gov.au, which was unreachable). Collect the manufacturer's technical file and EU declaration of conformity (e.g. Hebei Huaren C05-1 bed US$330–350; Foshan Medco US$300–500).
2. Check electrical safety (RCM) for electric beds and the bed-entrapment standard. Get product-liability and professional-indemnity cover.
3. Start a small fleet (e.g. 10 beds, 20 commodes/chairs) hired at A$100–150/week for beds and A$50–75/week for small aids (below the Carevo indicative ranges).
4. Register with Support at Home care partners and NDIS providers. Use consultative OT and physio prescriber relationships as the sales channel.

**Lean challengers documented this session**
- **Smoke alarms:** AU brands riding Chinese OEM certificates — MATelec (Shepparton), GSM Electrical, Brilliant Lighting, Emerald Alarms.
- **PPE:** ProChoice/Paramount, an AU private-label PPE brand founded 1992 that later bought Pratt Safety (showers). RSEA's Blue Rapta is a distributor house brand.
- **AED accessories:** Defibshop's own-brand cabinets.
- **Fire services:** acquisitions by SCEE (Force Fire) and Fortitude (FVS) show recurring-service businesses being bought rather than built.

### Gaps
- Scores rest partly on unverified elements:
  - AS 4775 duty cycle and WaterMark status
  - CSIRO ActivFire agent-variation cost
  - QLD pool inspector licensing cost
  - NDIS and AT-HM item rules
  - AU prices for kitchen, playground, racking, gas detectors and hearing aids
- The WebSearch budget (200 calls per turn, shared across agents) ran out midway. Afterwards only direct, robots-checked fetches were used.
- Several government hosts could not be reached on 2026-10-10:
  - tga.gov.au: 503 / HTTP-2 reset
  - health.gov.au and myagedcare.gov.au: connection failures
  - ndis.gov.au: 403
  - safeworkaustralia.gov.au: connection failure
- Nisbets and Total Tools returned 403. Spill Station's store API returned 403.
