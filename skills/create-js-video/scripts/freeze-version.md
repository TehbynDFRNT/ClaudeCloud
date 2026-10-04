# freeze-version.sh

Freezes a delivered version's plans as `plans-vN/`, and proves that every frozen version still rebuilds byte for
byte from the current plan builder.

```bash
scripts/freeze-version.sh 4 --dry-run          # check that v4 is what the builder makes; say what would be frozen
scripts/freeze-version.sh 4                    # freeze plans-v4/, then re-check every plans-v*/
scripts/freeze-version.sh --check              # before and after any builder change
scripts/freeze-version.sh 5 --builder 'node tools/build_plan.mjs' --glob 'film-plan*.json'
```

- The builder must honour `PLAN_VERSION=<k>` and `PLAN_OUT=<dir>`. The script passes `PLAN_OUT` relative to the
  repository root and runs the builder from there.
- The script refuses to freeze live plans that differ from what the builder makes for N. It also refuses to
  overwrite an existing `plans-vN/` that differs.
- After freezing, commit `plans-vN/` and tag the commit the delivered pictures were rendered at. Plans reproduce from
  any later commit. Pictures reproduce only while scene code renders them the same.

Provenance: new for the skill. It automates the rebuild check that Nova ran by hand. Tested on the Nova repository:
the v2 and v3 frozen plans rebuild identically, and v4 matches the live plans (dry run).
