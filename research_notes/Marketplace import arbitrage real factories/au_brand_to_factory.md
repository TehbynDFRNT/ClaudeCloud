# Australian-market brands and their Chinese source factories (working notes)

Status: checkpoint 1 of the research pass, 2026-10-10. Items marked "snippet only" come from search summaries and have not been checked against the page itself yet.

## Method and limits
- Public pages only. No accounts, logins, form submissions, or contact with anyone.
- robots.txt is checked per host before each page fetch. Pages blocked by robots.txt or by a bot challenge are logged and not retried or bypassed.
- WebSearch is used for discovery only. Each finding needs the source page itself.
- Tool budget is limited, so coverage is partial. A brand with no row checked is marked "not searched in this pass".

## Source access log (2026-10-10)
| Source | Attempt | Result |
|---|---|---|
| ACCC recalls, https://www.productsafety.gov.au/recalls | curl GET; robots.txt | HTTP 403, Akamai "Access Denied" page. robots.txt also HTTP 403. Not retried, not bypassed. |
| EESS, https://www.eess.gov.au/ | curl GET; robots.txt | Home HTTP 200 (74,942 bytes, "EESS - Electrical Equipment Safety Scheme Search Website"). robots.txt HTTP 200 with `Disallow: /*?` under `User-agent: *` and `Crawl-delay: 3`. Brand and supplier searches are query-string URLs, so robots.txt excludes them. Not used. |
| ImportYeti, https://www.importyeti.com/ | curl GET; robots.txt | Home HTTP 403, bot-challenge interstitial ("Just a moment..."). robots.txt HTTP 200 (allows "/", disallows /search?q). Challenge not bypassed. |
| Modern Slavery Register, https://www.modernslaveryregister.gov.au/ | curl GET; robots.txt | Egress proxy refused CONNECT with HTTP 502 for both robots.txt and the page. Not retried. |

## Snippet-level leads (not yet verified)

### Trampolines
- Springfree: brand blog page https://www.springfreetrampoline.com/blogs/beyond-the-bounce/where-are-springfree-trampolines-made (snippet only) reportedly places production in Dongguan, Guangdong, through a sister business "DGSH Sourcing". Panjiva pages (https://cn.panjiva.com/Springfree-Trampoline/4337947 and /2130190; https://cn.panjiva.com/Springfree-Ltd-Partnership/42510366; snippet only) show shipments from "Dongguan Sheng Hui Fitness Equipment" (Qingxi Town) to Springfree-named consignees in Issaquah WA, Allen TX and Markham ON. Those consignees are not Australian. Any link between DGSH and Sheng Hui is unconfirmed. CHOICE review of the Springfree Medium Square S72 gives China as country of origin: https://www.choice.com.au/products/babies-and-kids/children-and-safety/toys-and-safety-at-play/springfree-medium-square-s72 (snippet only).
- Vuly: CHOICE review of the discontinued Vuly Thunder Medium gives China as country of origin: https://www.choice.com.au/products/babies-and-kids/children-and-safety/toys-and-safety-at-play/vuly-thunder-medium (snippet only). Made-in-China company page for Zhejiang Lingsha Technology (FUNJUMP), https://fr.made-in-china.com/co_lsfunjump/ (snippet only), shows no Vuly link in the snippet. Unisco lists Vuly USA Operations Corp as a US importer (not Australian). A desertcart listing names "Spinmaster" as manufacturer. This looks like a data-field error and is not accepted.
- Everfit: Baby Bunting listing for the 42-inch foldable Everfit trampoline gives China as origin, with no factory named (https://www.babybunting.com.au/product/everfit-fitness-foldable-trampoline-black-7021815; snippet only). The trademark "EZFIT" is owned by Beijing EZFIT Mortise and Tenon Culturetechnology Co., Ltd. (https://trademark.justia.com/owners/beijing-ezfit-mortise-and-tenon-culturetechnology-co-ltd-5086631). This is a name similarity only and is not linked to Everfit.

### Bumper plates and dumbbells
- CORTEX (Lifespan Fitness): Lifespan Fitness AU product pages (for example https://www.lifespanfitness.com.au/products/cortex-5kg-black-series-v2-bumper-plate-pair) were found. Snippets name no manufacturer.

### Standing desks
- FlexiSpot / Loctek: secondary pages (https://www.accio.com/business/flexispot; https://www.workwhilewalking.com/flexispot-reviews; snippet only) say FlexiSpot belongs to Loctek Ergonomic Technology of Ningbo, which trades in Shenzhen under code 300729. They also say production is in China and Vietnam. This has not been checked against primary filings.

### Retailer factory disclosures
- Kmart AU factory list: https://www.kmart.com.au/factory-list/ (snippet only). The snippet says it covers final-stage apparel and general-merchandise makers and their processing sites. Not yet checked for hard-goods makers.
- Kmart NZ factory list: https://wishingtree.kmart.co.nz/factorylist (snippet only).
- Target AU factory list exists at https://www.target.com.au/company/ethical-sourcing/factory-list. Target is not on the brief's brand list.

### Not yet searched in this pass
Hammocks, cubby houses, camp kitchens (see Round 2), and the remaining brands on the brief.
