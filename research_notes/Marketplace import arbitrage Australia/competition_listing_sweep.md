# Competition listing sweep: brand-new import products on Australian classifieds (as of 2026-10-09)

**Status: PARTIAL (checkpoint 2, final for this run).** Direct access to Gumtree and eBay listing and search pages is blocked by site-side bot protection, Facebook Marketplace search and item pages require a login, and Google Trends returned HTTP 429 on every attempt. The figures below come from search-engine sampling (WebSearch restricted to gumtree.com.au, ebay.com.au and facebook.com) and from a few search-indexed category-count titles. They are sample counts, not market counts, and none is split by city. Observation date for every figure is 2026-10-09 (access and search run date), unless a listing's own posting date is given. Products sampled: 9 of 33. The other 24 were not searched because the WebSearch budget for this run (200 calls per turn, shared across all agents) was exhausted before their queries ran. They are listed at the end of this file with the queries to run.

## Key Question 1: Can live counts be measured from this environment?

### Takeaway
No. Live result counts and per-city splits for Gumtree, eBay and Facebook Marketplace are not accessible from here. Search-index sampling and a few indexed category titles are the only reproducible evidence, so the density table below is sample-based and cannot be read as market size.

### Cited Findings
- Gumtree search page https://www.gumtree.com.au/s-dumbbells/k0 returned HTTP 403 to WebFetch. A proxy curl on 2026-10-09 (about 04:35 UTC) showed the CONNECT succeeding (200) and the 403 coming from the site, with header `peakhour-error: blocked`. That is a site WAF block, not an egress-policy denial. [Gumtree](https://www.gumtree.com.au/s-dumbbells/k0)
- eBay AU search https://www.ebay.com.au/sch/i.html?_nkw=adjustable+dumbbells&LH_ItemCondition=1000&LH_PrefLoc=1 returned HTTP 403 to WebFetch. The proxy curl on the same run showed an origin 403 from AkamaiGHost with Akamai bot-manager cookies, which is site-side bot protection. [eBay AU](https://www.ebay.com.au/sch/i.html?_nkw=adjustable+dumbbells&LH_ItemCondition=1000&LH_PrefLoc=1)
- Facebook Marketplace public search https://www.facebook.com/marketplace/sydney/search?query=adjustable%20dumbbells shows a login form ("Log into Facebook") and no listings. Not bypassed. Two indexed item pages, [item 753286156940138](https://www.facebook.com/marketplace/item/753286156940138/) and [item 973229841156580](https://www.facebook.com/marketplace/item/973229841156580/), also returned login forms with no listing content on direct fetch (2026-10-09), so their listing details rest only on search-tool summaries. [Facebook Marketplace](https://www.facebook.com/marketplace/sydney/search?query=adjustable%20dumbbells)
- Google Trends explore page (geo=AU, q=air fryer, past 12 months) returned HTTP 429 Too Many Requests, with no interest data. A retry with a different parameter order (hl=en-AU) also returned HTTP 429 on 2026-10-09. [Google Trends](https://trends.google.com/trends/explore?geo=AU&q=air%20fryer&date=today%2012-m)
- The proxy README (/root/.ccr/README.md) treats 403/407 from the proxy as an organisation egress-policy denial that must not be routed around. Here the proxy CONNECT succeeded, so the 403s came from the sites themselves. Per the brief's no-bypass rule, the sites were not retried with other clients or altered headers.

### Inferences
- The Gumtree and eBay blocks are deliberate site-side protections. Switching clients or headers to get past them would breach the brief, so the sweep relies on search-engine sampling only.
- Search engines still index Facebook Marketplace category and item pages, and Gumtree and eBay category pages. That index is the only window into listings from this environment, and it shows sampled listings rather than totals.

### Gaps
- No live counts for any product or city, and no Melbourne, Brisbane or Perth split. Queries were Sydney-anchored.
- No Google Trends direction. The sibling note marketplace_demand_au.md in the same folder also reports Google Trends AU as inaccessible, so the workspace holds no independent trend source.
- The indexed Gumtree category titles show no capture date, so the counts quoted in Key Question 2 are indicative only.

## Key Question 2: Competition density by product (sampled)

### Takeaway
Of the 33 candidates, 9 were sampled in Sydney through search-index results. Across those nine, the sample surfaced 5 to 15 brand-new-labelled listings per product. Asking prices for new-labelled listings run from roughly A$40 to A$3,000 depending on category. Repeat-seller and repost signals appear in every sampled category, but no seller identity was confirmed. Ratings are provisional and cannot show market size or city splits. The other 24 products have no evidence yet.

### Method
- WebSearch (standard mode), one query per product in the form "brand new <product> Sydney", restricted to gumtree.com.au, ebay.com.au and facebook.com. Adjustable dumbbells had three restricted runs. Each run returns about 10 links plus a search-tool summary.
- **Brand-new-labelled** means the summary calls the listing brand new, new in box, unused, unopened or sealed, or places it under a summary heading for brand-new listings. "Like new", "used" and "condition not stated" are excluded.
- The search-tool summaries were not checked against the listing pages, so every price and date below is unverified. Where an item URL could not be identified, the cited URL is the result page that produced the claim.
- Provisional rating (sample-based): Low = 0 to 4 brand-new-labelled listings; Medium = 5 to 9; High = 10 or more. This measures how many new listings the sample surfaced. It is capped by about 10 results per query, is not market size, and cannot separate Medium from High reliably.

### Cited Findings

#### Competition-density table (Sydney-anchored sample, observed 2026-10-09)

Prices are asking prices as listed (AUD unless stated), not sold prices. Counts are listings in the sample, not market totals.

| Product | Brand-new-labelled (Gumtree / eBay / Facebook) | Dated 2026 (explicit) | New asking price seen | Repeat-seller or repost signals | Used or like-new seen | Rating (provisional) |
|---|---|---|---|---|---|---|
| Adjustable dumbbells | 15 (7 / 1 / 7) | 1 | 50 to 550 (classifieds); eBay reference 68 to 115 for 15 to 35 kg sets (condition not stated) | Same SC-YL05 Glide Tech 25 lb model in 3 posts across Gumtree and Facebook at different prices; 2 Seven Hills posts | Like-new 22 kg set at 180 (Elizabeth Bay); Facebook Fortis 24 kg single, sold, condition conflicting | High (15) |
| Squat / power racks | 12 (10 / 0 / 2) | 3 | 323 to 2,700 (racks and cages 323 to 850; bundles 600 to 1,250; functional trainers 950 to 2,700) | At least 5 Leppington posts with J-series model codes (J008 x2, J009, SD-J3108); same bundle title at 600 (Beaumont Hills) and 1,200 (Leppington) | Not measured | High (12) |
| Weight benches | 5 (4 / 0 / 1 platform not stated) | 3 | 40 to 3,000 (Everfit 10-in-1 about 155; Everfit Power Tower 240; Reeplex 3,000 neg.) | Same Power Tower in 2 listings (possible reposts); Everfit cluster at The Rocks | Gumtree category described as "hundreds of new and used"; indexed title "959 Results: New & Used in bench press in Australia" (capture date unknown) | Medium (5) |
| Rowing machines | 6 (4 / 1 / 1) | 3 | 108 to 390 for basic and mid magnetic units; 130 elastic; 790 to 1,250 higher-end (snippet prices not tied to a model) | Everfit in 2 Gumtree posts and 1 eBay listing; online sellers posting with warranty and shipping | Indexed title "679 Results: New & Used in rowing machine in Australia" (capture date unknown) | Medium (6) |
| Walking pads | 8 (4 / 4 / 0) | 4 | 169.90 to 478.99 (eBay); 212 to 270 (Sydney City Everfit); 242 to 254 (The Rocks Everfit) | Summary says many Gumtree Everfit ads look like the same listing reposted; The Rocks cluster Aug to Oct 2026; outlier 1,300 (Castle Hill, same model per summary) | Facebook Lane Cove like-new 250; Axefit unit needs work; Gumtree 3-in-1 at 352 (Randwick) and 232 (Denistone East), condition not stated | Medium (8) |
| Spin bikes | 11 (9 / 2 / 0) | 2 | 120 to 1,600 (Gumtree); eBay Everfit 140 to 195 (seller reference 380 to 470) | Several eBay Everfit listings, with sold counts in the hundreds per summary | Summary says most results are second-hand; Horizon GR7 like-new 480; Keiser M3iLite like-new 1,800 neg. | High (11) |
| 12V compressor fridges | 9 (6 / 3 / 0) | 3 | 276 to 1,500 (Gumtree); eBay 399 to 1,200 | Near-identical 100 L bar-fridge ads at The Rocks dated late Jul to Aug 2026 (several, not counted); Pinnacle Wholesalers "over ten still available" | Not measured | Medium (9) |
| Portable power stations | 5 (5 / 0 / 0), plus 5 eBay listings framed as new but not labelled individually | 2 | 189 to 250 (Gumtree, 200 to 600 W units); eBay 314.10 to 2,999 (5 listings, condition not stated) | Two Sydney City units posted on the same day (19 Apr 2026) | Not measured | Medium (5) |
| Diesel heaters | 7 (2 / 5 / 0) | 1 | 114.95 to 1,949 (eBay 12 V and Webasto kits); Gumtree Sydney 230 to 271 for 5 to 8 kW 12 V units | PORIYA "hundreds sold"; Webasto kit seller 99.2% positive (business seller) | Indexed title "19 Results: New & Used in diesel heaters in Australia" (capture date unknown) | Medium (7) |

### Product evidence (search-summary detail, with sources)

#### 1. Adjustable dumbbells (three runs: Gumtree, eBay, Facebook)
- Gumtree, brand-new-labelled (7): Kinetic 4-in-1 detachable set, new in box, 70 neg., Brighton-Le-Sands, posted 4 Sep 2026, weights 1 to 2.5 kg; SC-YL05 Glide Tech 25 lb / 11.3 kg, 70, Baulkham Hills (May 2025); single unit (not a pair), 50, Gregory Hills (Oct 2025); single 40 kg, 220, Edmondson Park (May 2025, clearance); 30 kg dumbbell-and-barbell set, new in box, 84.95, Cronulla (Sep 2025); 4 to 21.5 kg Olympic-style set with clips, 300, Seven Hills (Apr 2024); 4 to 31.5 kg version, Seven Hills (2024 or earlier, price not stated). Source: [Gumtree adjustable dumbbells, Sydney](https://www.gumtree.com.au/s-gym-fitness/sydney/adjustable+dumbbells/k0c18565l3003435)
- Gumtree, excluded: Powertrain adjustable dumbbell bench (a bench, 551, Sydney City, Oct 2025); fixed 20 kg hex pair, 125 (Beverly Hills, not adjustable); cement-filled adjustable sets posted Sep 2026 (condition not stated); Elizabeth Bay 22 kg set, like new, 180 (posted Jun 2026).
- eBay, brand-new-labelled (1): Randy and Travis Machinery 30 kg set, tagged new, 69 purchases, no price in the result. Source: [eBay item 311052175282](https://www.ebay.com.au/itm/311052175282)
- eBay, condition not stated (not counted): METEOR 15 to 35 kg sets about AU$86 to 115 with free delivery and "hundreds sold" per summary; ProPulse 15 kg AU$67.95 (was 81.95); a 20 kg set for local collection at AU$45 (location not stated); Powertrain 80 kg Gen3 AU$549 plus 35 delivery; Powertrain 72 kg pair with stand AU$859 plus 35. Sources: [eBay adjustable dumbbells category](https://www.ebay.com.au/b/Adjustable-Dumbbells/137865/bn_16376850), [eBay adjustable dumbbells shop](https://www.ebay.com.au/shop/adjustable-dumbbells?_nkw=adjustable+dumbbells)
- Facebook, brand-new-labelled (7): Fitness Master 24 kg pair, brand new, A$250, Freshwater, now marked sold ([item](https://www.facebook.com/marketplace/item/753286156940138/)); 40 kg steel set, brand new, A$550, Sydney; SUNCAO SC-YL05 Glide Tech 25 lb pair, brand new, A$160; two SUNCAO for A$90 with A$100 printed alongside (the summary says the A$100 may be an earlier price); 40 kg package with plates and barbell, brand new and unboxed, A$160; 20 kg set (10 kg per dumbbell), brand new in box, A$75; single 24 kg Everfit dumbbell, brand new and unused, A$85 with A$100 shown, not confirmed adjustable. Source: [Facebook adjustable dumbbells, Sydney](https://www.facebook.com/marketplace/sydney/adjustable-dumbbells/)
- Facebook, excluded: Fortis 24 kg smart adjustable single, sold, condition given as "used, like new" in one field and "brand new" in the description ([item](https://www.facebook.com/marketplace/item/1238925204225120)); PowerBlock set with stand at A$450 in Newcastle (outside Sydney, condition not stated).
- Dating: of the 15 new-labelled listings, 1 is explicitly dated 2026, 7 are dated 2024 or 2025, and 7 are undated in the summary.
- Repeat signals: the SC-YL05 Glide Tech 25 lb appears in 3 posts at different prices across two platforms; the two Seven Hills posts are a possible single seller. Seller identities were not checked, so repeat selling is unconfirmed.
- Inference: dense new-labelled supply in Sydney classifieds, but mostly older or undated posts, so current competition is unclear.

#### 2. Squat and power racks (one run)
- Gumtree, brand-new-labelled (10): VEVOR adjustable power rack, brand new, one-year warranty, delivery only, 323, Sydney City (Mar 2026); J008 power cage, brand new, 550, Leppington; J008 cage with barbell and 60 kg plates, 850, Leppington (collection in Leppington, delivery extra); bench, mats, barbell and 60 kg plates bundle, 1,200 (text says 1,250), Leppington; same-titled bundle, 600, Beaumont Hills (Sep 2026); J009 smith machine and functional trainer, brand new in box, cut from 1,300 to 950, plates not included, Leppington; SD-J3108 functional trainer with spotter arms and 100 kg stack, 2,550, Leppington; later version with 140 kg stack, 2,700; Everfit squat rack set, brand new and unused, 350 neg., Casula (Feb 2026); foldaway rack marked "new", Seven Hills (2024, price not stated). Source: [Gumtree squat rack, Sydney](https://www.gumtree.com.au/s-gym-fitness/sydney/squat+rack/k0c18565l3003435)
- Facebook, brand-new-labelled (2): commercial half power rack, brand new in box, A$350, Sydney; power rack with lat pulley, brand new, A$480 with A$599 also shown. Source: [Facebook power racks, Sydney](https://www.facebook.com/marketplace/sydney/power-racks/)
- eBay: no listings in the sample.
- Dating: 3 of the 12 are explicitly dated 2026 (VEVOR Mar, Casula Feb, Beaumont Hills Sep).
- Repeat signals: at least five Leppington posts share J-series model codes in one suburb, which suggests a repeat seller (unconfirmed). The same bundle title appears at 600 and at 1,200 or 1,250, which suggests a duplicate or repost (unconfirmed).

#### 3. Weight benches (one run)
- Gumtree, brand-new-labelled (4): Everfit 10-in-1 station, brand new, about 155 (listed Jun 2026, The Rocks); Everfit 8-in-1 Power Tower, 240 (Jun 2026, The Rocks), with the same Power Tower in a second listing; Reeplex flat bench press, new in box, 3,000 neg. (Strathfield). Source: [Gumtree weight bench, Sydney](https://www.gumtree.com.au/s-gym-fitness/sydney/weight+bench/k0c18565l3003435)
- Platform not stated (1): bench titled as brand new at 40, with 70 also shown (the summary says the 70 may be an earlier price).
- Gumtree, condition not stated (not counted): 7-in-1 multi-station with about 45 kg plates, 120 (Sydney City; summary calls this unusually low) and 375 (Leppington); some sets leave out the barbell. Source: as above.
- Facebook category: weight benches for sale in Penrith, new and used mixed. Source: [Facebook weight benches, Penrith](https://www.facebook.com/marketplace/103124969728189/weight-benches/)
- Indexed category count: "959 Results: New & Used in bench press in Australia" (Gumtree Gym and Fitness, national). This combines new and used, uses a narrower keyword than "weight bench", and has no capture date. Source: [Gumtree bench press](https://www.gumtree.com.au/s-gym-fitness/bench+press/k0c18565)
- Dating: 3 of the 5 are dated June 2026. Other posts in the summary date from 2021 to Sep 2025.
- Repeat signals: duplicate Power Tower listing; Everfit cluster from one suburb (The Rocks).

#### 4. Rowing machines (one run, plus eBay category page)
- Gumtree, brand-new-labelled (4): Everfit 16-level magnetic, 301, Sydney City (Mar 2026); foldable 16-level magnetic rower, 169, Sydney City (Mar 2026); Everfit 16-level magnetic, 390, Marrickville (Feb 2026, described as unused); Impact Fitness IR8, brand new, Seven Hills and Yagoona (the summary says snippet prices of 790 and 1,250 are not reliably linked to a model). Source: [Gumtree rowing machine, Sydney](https://www.gumtree.com.au/s-gym-fitness/sydney/rowing+machine/k0c18565l3003435)
- Gumtree, condition not stated (not counted): Reeplex Argo units "with warranties", price not stated.
- Facebook, brand-new-labelled (1): elastic rowing machine, brand new, A$130, Sydney (the summary cites the Facebook category page). Source: [Facebook rowing machines, Campbelltown South](https://www.facebook.com/marketplace/112196072137667/rowing-machines/)
- eBay, brand-new-labelled (1): Everfit hydraulic rowers, brand new, roughly AU$108 to 117. eBay, condition not stated (not counted): MERACH magnetic at AU$369.99 or best offer; PORIYA magnetic at AU$303.99 or best offer. Source: [eBay rowing exercise machines](https://www.ebay.com.au/b/Rowing-Exercise-Machines/28060/bn_10599516)
- Indexed category count: "679 Results: New & Used in rowing machine in Australia" (Gumtree Gym and Fitness, national, no capture date). Source: [Gumtree rowing machine](https://www.gumtree.com.au/s-gym-fitness/rowing+machine/k0c18565)
- Dating: 3 of the 6 are dated Feb to Mar 2026. The summary says the newest posts are from June 2026 and some are from Dec 2022.
- Repeat signals: Everfit appears in 3 channels (two Gumtree posts and one eBay listing). Online sellers use classifieds with 1-year warranties and 2 to 8 business-day shipping, which points to business sellers (inference from summary wording).

#### 5. Walking pads (one run)
- Gumtree, brand-new-labelled (4): Sydney City Everfit pads, new, roughly 212 to 270 (listed Mar 2026); The Rocks Everfit pads, late Aug to early Oct 2026, roughly 242 to 254. Shipping extra, no collection, up to 8 business days, 1-year warranty. Source: [Gumtree walking pad, Sydney](https://www.gumtree.com.au/s-gym-fitness/sydney/walking+pad/k0c18565l3003435)
- eBay, brand-new-labelled (4): remote-controlled pad AU$169.90 plus 4.99 postage; Powertrain 1.5 HP 2-in-1, AU$199; 3.0 HP 3-in-1 with 16% incline, AU$343.98; 3-in-1 with 14% incline, AU$478.99. Sources: [eBay walking pad shop](https://www.ebay.com.au/shop/walking-pad?_nkw=walking+pad), [eBay walking pad treadmill shop](https://www.ebay.com.au/shop/walking-pad-treadmill?_nkw=walking+pad+treadmill)
- Not counted: Gumtree 3-in-1 pads at 352 (Randwick) and 232 (Denistone East), condition not stated; Castle Hill ad at 1,300 for what the summary says is the same 400 mm Everfit model (condition not stated); Facebook Norflex walking pad at A$250, "in stock", condition not stated ([item](https://www.facebook.com/marketplace/item/973229841156580/)).
- Used or like-new (Facebook under-desk treadmills): Lane Cove unit like-new at A$250; Axefit unit needs work before use. Source: [Facebook under-desk treadmills, Sydney](https://www.facebook.com/marketplace/sydney/under-desk-treadmills/)
- Dating: all 4 Gumtree new-labelled items are dated 2026 (Mar and Aug to Oct). eBay items are undated.
- Repeat signals: the summary says many Gumtree Everfit ads look like the same listing reposted on different dates (the summary's own inference, not verified). Several eBay sellers show 99% or higher feedback.

#### 6. Spin bikes (one run, plus eBay category page)
- Gumtree, brand-new-labelled (9): Bossley Park studio-style bike, described as flawless and brand new, 140 (posted 24 May 2026, pre-assembled); Sydney City brand-new spin bike, 277, delivery only, 1-year warranty, 2 to 8 business days (13 Apr 2025); Bligh Park Proform Studio Bike Pro 22, brand new, 1,600 (Dec 2024; the title calls it a 2-in-1 cross trainer and exercise bike); Fila-branded bike, never used, 120, pickup only in Kangy Angy (Central Coast, outside Sydney); unused model, 150 neg., Sandy Point NSW (Jan 2026; area not clear); Orbit PS450, brand new, 350 (suburb not stated); plus Reeplex SCX, SPG-230 magnetic and an Everfit model, all labelled brand new with unclear prices and suburbs. Source: [Gumtree spin bike, Sydney](https://www.gumtree.com.au/s-gym-fitness/sydney/spin+bike/k0c18565l3003435)
- eBay, brand-new-labelled (at least 2): several Everfit spin bikes marked brand new at roughly AU$140 to 195, with seller reference prices of about AU$380 to 470; some show sold counts in the hundreds (summary). Source: [eBay spinning bikes](https://www.ebay.com.au/b/Spinning-Bikes/58102/bn_57241902)
- Used and like-new: the summary says most results are second-hand. Horizon GR7 in Sutherland, like new, 480; Keiser M3iLite in Balgowlah, like new, about two years old, 1,800 neg. Source: [Gumtree used spin bike, Sydney](https://www.gumtree.com.au/s-gym-fitness/sydney/used+spin+bike/k0c18565l3003435)
- Label reliability: an LSG listing calls its bike brand new, but the seller says it was used once (summary).
- Dating: 2 of the 9 Gumtree items are explicitly dated 2026 (Bossley Park May; Sandy Point Jan).

#### 7. 12V compressor camping fridges (one run)
- Gumtree, brand-new-labelled (6): St Clair wheeled multi-voltage compressor fridge freezer, 276, tagged New (3 Sep 2026; title names no brand); The Rocks 100 L bar fridges running on 12V, 24V or 240V, 583 (12 Sep 2026) and 571 (29 Aug 2026), tagged New; Sydney City brand-new Kings 60 L fridge/freezer, 699 (Dec 2022); Chatswood Dometic CFX345 46 L, brand new, 1,500 (Nov 2023); one seller's new 12V/24V/240V compressor units, 595, free delivery (location not shown). Sources: [Gumtree 12V compressor fridge](https://www.gumtree.com.au/s-fridges-freezers/12v+compressor+fridge/k0c20061), [Gumtree 12V fridge, Sydney](https://www.gumtree.com.au/s-appliances/sydney/12v+fridge/k0c20088l3003435)
- Not counted: a Newcastle 100 L ad (2026, outside Sydney, price not stated); several near-identical 100 L ads at The Rocks dated late Jul to Aug 2026 (number not stated); a 6 L car cooler at 69 (semiconductor, not a compressor).
- eBay, brand-new-labelled (3, under the summary's "brand new, but location unclear or online" heading): GECKO 95 L upright, AU$399 (shown as down from AU$999); a 142 L unit at AU$679 (brand not stated); Pinnacle Wholesalers 216 L two-compartment compression unit, AU$1,200, "over ten still available". Sources: [eBay 12V camping ice fridges](https://www.ebay.com.au/b/12V-DC-Camping-Ice-Fridges-Freezers/181382/bn_57255784), [eBay 216 L fridge listing (title match, price mapping not verified)](https://www.ebay.com.au/itm/357123316792)
- Dating: 3 of the 9 are dated 2026 (St Clair, both The Rocks).
- Repeat signals: near-identical The Rocks 100 L ads (summary suggests one seller may be reposting stock); Pinnacle "over ten still available" (business stock); GECKO shown in two sizes.

#### 8. Portable power stations (one run)
- Gumtree, brand-new-labelled (5): Sydney City 200 W / 154 Wh unit, presented as new stock with AC charger and manual, 19 Apr 2026 (price 239 in one snippet and 189 in another); Brighton-le-Sands sealed DJI Power 1000 (1,024 Wh, 2,200 W output), 250 shown, posted 6 Dec 2025 (eBay AU$599.99 new reference for the same model, per summary); Maroubra DJI Power 1000 V2, brand new, 27 Nov 2025 (price unclear); unopened Schneider OffGrid 500 with 100 W panel (price and suburb not shown; summary cites a AU$1,529 RRP for the bundle); unopened Anker SOLIX C300, 288 Wh, 300 W (price and suburb not shown). Source: [Gumtree power station, Sydney](https://www.gumtree.com.au/s-sydney/power+station/k0l3003435)
- Gumtree, not counted: Sydney City BLUETTI 600 W / 268 Wh, 19 Apr 2026 (price 189 or 239 in conflicting snippets; not labelled new).
- eBay, 5 listings framed as brand-new options but not labelled individually: EcoFlow River 2 Pro, AU$649 with delivery; ALLPOWERS R600, AU$314.10 or best offer; Anker SOLIX C800 Plus, AU$526.85 or best offer; BLUETTI AC180P, AU$1,180 with free delivery; EcoFlow DELTA 3 Ultra Plus, AU$2,999. Sources: [eBay portable power station shop](https://www.ebay.com.au/shop/portable-power-station?_nkw=portable+power+station), [eBay power stations shop](https://www.ebay.com.au/shop/power-stations?_nkw=power+stations), [eBay ALLPOWERS store](https://www.ebay.com.au/str/lysolar)
- Dating: 2 of the 5 Gumtree items are dated 2026 (both 19 Apr 2026).
- Unverified gap: the Gumtree DJI at 250 against the eBay 599.99 reference is about 58% below. Authenticity, warranty and stock status were not checked.
- Repeat signals: two new-stock units from one Sydney City seller posted on the same day (possibly one seller, unconfirmed); ALLPOWERS has an eBay store page labelled "allpowers au".

#### 9. Diesel heaters (one run, plus eBay shop pages)
- eBay, brand-new-labelled (5): Ryde seller, brand-new portable unit, AU$1,251.29 or best offer, 12 V or 240 V, about 5 L tank, Afterpay option (title match, [item](https://www.ebay.com.au/itm/303120365405)); 12 V 8 kW unit with remote and thermostat, new, AU$119.99 or best offer, dispatched from Sydney; Webasto AT2000STC kits, new, AU$1,649 to 1,949 (seller 99.2% positive, location not shown); PORIYA 8 kW 12 V, new, AU$114.95 (hundreds sold); Born To Roam 2 kW kit with 5 L tank, new, AU$649.99 (or 584.99 with coupon). Sources: [eBay Webasto diesel heater shop](https://www.ebay.com.au/shop/webasto-diesel-heater?_nkw=webasto+diesel+heater), [eBay diesel heater shop](https://www.ebay.com.au/shop/diesel-heater?_nkw=diesel+heater)
- Gumtree, brand-new-labelled (2): Sydney City unused, still-boxed 12 V 8 kW air heater for motorhomes and buses, 230; Vaucluse Giantz 5 kW 12 V with LCD remote, 271 (Apr 2026; text appears to describe it as brand new). Source: [Gumtree caravan diesel heaters, Sydney](https://www.gumtree.com.au/s-sydney/caravan+diesel+heaters/k0l3003435)
- Not counted: Gumtree Coogee 5 kW with LCD remote, 128 (early Sep 2026; new status not stated); Wyong LAVOR FF175 240 V space heaters (one new in box; electric, not diesel); Devonport, Tasmania ads (outside Sydney).
- Indexed category count: "19 Results: New & Used in diesel heaters in Australia" (Gumtree Home and Garden, national, no capture date). The category may not capture every caravan or heater listing. Source: [Gumtree diesel heaters](https://www.gumtree.com.au/s-home-garden/diesel+heaters/k0c18397)
- Dating: 1 of 7 is explicitly dated 2026 (Vaucluse, Apr).
- Repeat signals: PORIYA "hundreds sold"; Webasto kit seller 99.2% positive (business seller pattern).

### Inferences
- Sample counts are highest for adjustable dumbbells (15), squat and power racks (12) and spin bikes (11). That suggests dense new-labelled classifieds supply in those categories. These are sample counts, not comparable market sizes, because each query returns about 10 links and the dumbbell category had three runs.
- Everfit-branded new stock appears in six sampled categories: rowing machines, walking pads, spin bikes, weight benches, squat racks and single dumbbells. That is consistent with one or a few sellers posting across many categories. It is an inference from summary wording and is not verified.
- Seller-stated discounts (for example a GECKO 95 L at 399 against 999, and Everfit spin bikes at 140 to 195 against about 380 to 470) suggest discounting pressure in those categories. The same pattern is also consistent with clearance stock or inflated reference prices, which were not checked.
- Used listings are likely a large competitor in spin bikes, where the summary says most results are second-hand. Used volume was not measured.

### Gaps
- 24 products have no evidence yet (see the section on products not sampled at the end of this file).
- No city split. Melbourne, Brisbane and Perth were not sampled for any product. Gumtree location IDs for those cities were not captured; the results only contained Sydney Region (l3003435), New South Wales (l3008839), Inner Sydney (l3003771) and Darwin (l3004863).
- No live counts. Most listings are undated or older than 2026, so current competition is uncertain.
- eBay's New-condition filter could not be applied. eBay counts include only listings the summary explicitly labelled new.

## Key Question 3: Facebook Marketplace visibility

### Takeaway
Facebook Marketplace cannot be measured from this environment. Public search and item pages require a login. Search engines index Facebook category and item pages, and their summaries are the only Facebook listing detail, which is unverified.

### Cited Findings
- Public Marketplace search, Sydney, adjustable dumbbells: login form, no listings (WebFetch, 2026-10-09). [Facebook](https://www.facebook.com/marketplace/sydney/search?query=adjustable%20dumbbells)
- Two indexed item pages returned login forms on direct fetch (2026-10-09): [753286156940138](https://www.facebook.com/marketplace/item/753286156940138/) and [973229841156580](https://www.facebook.com/marketplace/item/973229841156580/). Not bypassed.
- Indexed category pages seen in sampling (summary level only, no counts shown): [adjustable dumbbells, Sydney](https://www.facebook.com/marketplace/sydney/adjustable-dumbbells/); [power racks, Sydney](https://www.facebook.com/marketplace/sydney/power-racks/); [weight benches, Penrith](https://www.facebook.com/marketplace/103124969728189/weight-benches/); [rowing machines, Campbelltown South](https://www.facebook.com/marketplace/112196072137667/rowing-machines/); [under-desk treadmills, Sydney](https://www.facebook.com/marketplace/sydney/under-desk-treadmills/).
- Facebook brand-new-labelled listings surfaced in search summaries (unverified): 7 dumbbell posts, 2 power-rack posts and 1 rowing-machine post (see Key Question 2). The A$40 weight-bench post has no platform stated and is not counted as Facebook. One Norflex walking pad at A$250 had condition not stated.
- Labelling is unreliable. A Fortis dumbbell shows condition as "used, like new" in one field and "brand new" in its description. Facebook listings also carry sold markers and relative posting times such as "listed 36 weeks ago", which were measured at capture rather than on 2026-10-09.

### Inferences
- Brand-new and used posts appear together on the same category pages (for example weight benches, described as new and used mixed), so a Marketplace competition count would need logged-in or manual observation.
- Sold markers show that new-labelled stock does sell on Facebook (for example a Fitness Master pair at A$250, now sold). The sample cannot show sell-through rates.

### Gaps
- No Facebook counts, no per-city counts and no sell-through data.
- No logged-in search results were visible, by design.

## Key Question 4: Repeat sellers, used volume and gluts

### Takeaway
Every sampled category shows at least one repeat, repost or business-seller signal, but no seller identity was confirmed. Everfit-branded stock appears across six categories. Several listings state steep discounts against seller reference prices. Used and like-new listings make up a large share of spin-bike results, per the summary.

### Cited Findings
- Repeat or repost signals (details in Key Question 2): SC-YL05 Glide Tech 25 lb in three posts across Gumtree and Facebook; at least five Leppington posts with J-series codes; the same Power Tower in two bench listings; Everfit walking-pad ads that the summary says look like reposts; near-identical 100 L bar-fridge ads at The Rocks; two Sydney City power-station posts on the same day.
- Business-seller signals: Randy and Travis Machinery on eBay, 69 purchases, tagged new ([item](https://www.ebay.com.au/itm/311052175282)); PORIYA diesel heaters "hundreds sold" and a Webasto kit seller at 99.2% positive ([eBay diesel heater shop](https://www.ebay.com.au/shop/diesel-heater?_nkw=diesel+heater)); ALLPOWERS eBay store ([store](https://www.ebay.com.au/str/lysolar)); Pinnacle Wholesalers "over ten still available" on eBay for a 216 L fridge (title match, unverified: [eBay](https://www.ebay.com.au/itm/357123316792)).
- Everfit-branded new stock appears in rowing machines ([Gumtree](https://www.gumtree.com.au/s-gym-fitness/sydney/rowing+machine/k0c18565l3003435)), walking pads ([Gumtree](https://www.gumtree.com.au/s-gym-fitness/sydney/walking+pad/k0c18565l3003435)), spin bikes ([eBay](https://www.ebay.com.au/b/Spinning-Bikes/58102/bn_57241902)), weight benches ([Gumtree](https://www.gumtree.com.au/s-gym-fitness/sydney/weight+bench/k0c18565l3003435)), squat racks ([Gumtree](https://www.gumtree.com.au/s-gym-fitness/sydney/squat+rack/k0c18565l3003435)) and single dumbbells ([Facebook](https://www.facebook.com/marketplace/sydney/adjustable-dumbbells/)), per the summaries.
- Used-volume signals: the spin-bike results are described as mostly second-hand (Gumtree and eBay summary); the weight-bench category as "hundreds of new and used" ([Gumtree](https://www.gumtree.com.au/s-gym-fitness/sydney/weight+bench/k0c18565l3003435)). Indexed national category titles, new and used combined, with capture dates unknown: bench press 959 ([Gumtree](https://www.gumtree.com.au/s-gym-fitness/bench+press/k0c18565)), rowing machine 679 ([Gumtree](https://www.gumtree.com.au/s-gym-fitness/rowing+machine/k0c18565)), diesel heaters 19 ([Gumtree](https://www.gumtree.com.au/s-home-garden/diesel+heaters/k0c18397)).
- Seller-stated discounts, reference prices unverified: GECKO 95 L at AU$399 against AU$999 ([eBay](https://www.ebay.com.au/b/12V-DC-Camping-Ice-Fridges-Freezers/181382/bn_57255784)); Everfit spin bikes at AU$140 to 195 against about AU$380 to 470 ([eBay](https://www.ebay.com.au/b/Spinning-Bikes/58102/bn_57241902)); DJI Power 1000 at 250 on Gumtree against a AU$599.99 eBay new reference ([Gumtree](https://www.gumtree.com.au/s-sydney/power+station/k0l3003435)); ProPulse 15 kg at AU$67.95 against AU$81.95 ([eBay](https://www.ebay.com.au/shop/adjustable-dumbbells?_nkw=adjustable+dumbbells)).
- Price clustering: METEOR 15 to 35 kg adjustable sets at about AU$86 to 115 with "hundreds sold" per summary ([eBay](https://www.ebay.com.au/shop/adjustable-dumbbells?_nkw=adjustable+dumbbells)).

### Inferences
- Commodity-style categories (adjustable dumbbells, walking pads, rowing machines, spin bikes, compressor fridges) show repeated price points across sellers and platforms. That is the pattern expected in a crowded market, but the sample cannot separate a price war from ordinary price variation.
- Used-market volume is probably the larger competitor in spin bikes and benches, based on summary wording. It was not measured.

### Gaps
- Seller identities were not checked, so repeat selling is unconfirmed.
- No sold-count data beyond summary mentions (for example 69 purchases, hundreds sold).
- No measured used-listing volume for any product in any city.

## Key Question 5: Google Trends direction (12 months, Australia)

### Takeaway
Not obtained. The Google Trends explore page returned HTTP 429 (rate-limited) for air fryers on two attempts. The sibling note marketplace_demand_au.md reports the same block, and the WebSearch budget ran out before a secondary source could be sought.

### Cited Findings
- Google Trends explore, geo=AU, q=air fryer, 12 months: HTTP 429 Too Many Requests on two attempts (2026-10-09), no data. [Google Trends](https://trends.google.com/trends/explore?geo=AU&q=air%20fryer&date=today%2012-m)
- Local sibling note (not a web source): /home/user/ClaudeCloud/research_notes/Marketplace import arbitrage Australia/marketplace_demand_au.md states that Google Trends AU could not be queried and that there are no search-interest curves for camping fridges, walking pads, evaporative coolers or trampolines.

### Inferences
- None. No direction can be stated without data.

### Gaps
- No trend direction for any of the 33 products, and no secondary source found.

## Products not sampled, and how to continue

### Queries run (2026-10-09; WebSearch standard mode; restricted to gumtree.com.au, ebay.com.au and facebook.com)
| # | Product | Query | Outcome |
|---|---|---|---|
| 1 | Adjustable dumbbells | "brand new adjustable dumbbells Sydney" (Gumtree and eBay runs); "brand new adjustable dumbbells Sydney marketplace" (Facebook run) | Sampled |
| 2 | Squat / power racks | "brand new squat rack Sydney" | Sampled |
| 3 | Weight benches | "brand new weight bench Sydney" | Sampled |
| 4 | Rowing machines | "brand new rowing machine Sydney" | Sampled |
| 5 | Walking pads | "brand new walking pad Sydney" | Sampled |
| 6 | Spin bikes | "brand new spin bike Sydney" | Sampled |
| 7 | 12V compressor fridges | "brand new 12V compressor fridge Sydney" | Sampled |
| 8 | Portable power stations | "brand new portable power station Sydney" | Sampled |
| 9 | Diesel heaters | "brand new diesel heater Sydney" | Sampled |

### Not searched: WebSearch budget exhausted
Twelve further queries were attempted in one batch. Each returned: "this turn's web search budget is used up (limit: 200 WebSearch calls per turn, shared by every agent in it)". Those queries and the other 12 products were not run. The Gumtree and eBay direct pages stay blocked, so they cannot substitute.

Queries to run in a follow-up (one per product, same restrictions):
- brand new swag Sydney
- brand new pop up gazebo Sydney
- brand new rattan outdoor lounge Sydney
- brand new hanging egg chair Sydney
- brand new sun lounger Sydney
- brand new pizza oven Sydney
- brand new fire pit Sydney
- brand new ergonomic office chair Sydney
- brand new gaming chair Sydney
- brand new electric standing desk Sydney
- brand new gas lift bed frame Sydney
- brand new kids electric ride on car Sydney
- brand new trampoline Sydney
- brand new kids bike Sydney
- brand new cubby house Sydney
- brand new dog crate Sydney
- brand new cat tree Sydney
- brand new chicken coop Sydney
- brand new raised garden bed Sydney
- brand new greenhouse Sydney
- brand new robot vacuum Sydney
- brand new air fryer Sydney
- brand new e-bike Sydney
- brand new e-scooter Sydney

Melbourne, Brisbane and Perth were not searched for any of the 33 products.

### Manual completion route (for the account holder, in a normal browser)
- eBay: the search results page with the New condition filter, for example https://www.ebay.com.au/sch/i.html?_nkw=<product>&LH_ItemCondition=1000&LH_PrefLoc=1, shows the result total and condition facet counts.
- Gumtree: Sydney Region search pages follow the pattern https://www.gumtree.com.au/s-gym-fitness/sydney/<product>/k0c18565l3003435, and the result count is shown on the page. Location IDs for the other cities were not captured.
- Facebook Marketplace requires a login, so counts there need manual observation by the account holder. Nothing in this sweep logged in.
