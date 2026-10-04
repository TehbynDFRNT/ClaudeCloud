# watch-log.sh

Waits on a log file (a render, an encode, an assembly) until a success or failure line appears. It passes progress
lines through at most once a minute, so it works as a Monitor watcher.

```bash
nohup sh -c 'node tools/chunk.mjs render --plan film-plan.json --from 0 --to 960; echo "RENDER exit=$?"' > out/r1.log 2>&1 &
scripts/watch-log.sh out/r1.log --done 'RENDER exit=0' --pid $!
scripts/watch-log.sh out/deliver.log --pid <PID>     # a chain of steps that ends with: echo "ALL DONE"
```

- `--done` / `--fail` / `--ignore` / `--show` are extended regexes.
- The default done pattern is `ALL DONE`. End a chain of steps with that line, or pass the last step's own line
  (`--done 'VERIFY exit=0'`). Don't use `exit=0` or `wrote ` for a chain: they match the first step that finishes.
  Tested: a log of `wrote dist/x.mp4`, `ASSEMBLE exit=0`, `VERIFY start` used to return DONE; it now waits.
- The default fail pattern is `FAIL|Error|error:|Traceback|exit=[1-9]|Killed|ENOSPC`. Lines matching `--ignore`
  (default `^\[page\] `, the page console warnings `render.mjs` copies into its log) are never done or fail.
- `--pid` fails as soon as the process is gone without a done line (a job that died without printing anything).
- Exit codes: 0 done, 1 fail, 3 `REARM` at `--max-minutes` (default 28, under the Monitor's 30).
- Write an explicit status line at the end of every background job (`echo "STEP exit=$?"`). Without one, a watcher
  can't tell finished from crashed.

Provenance: new for the skill. It comes from the "Nova" lessons: watchers that matched success only, Monitors that
died at 30 minutes, and `pkill -f` killing its own shell. Tested on done, fail and re-arm logs, and on chain logs
(an unfinished chain with a `[page] ... Error` line re-arms; `ALL DONE` is done; `B exit=2` fails).
