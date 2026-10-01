# Attention Span for Pi

This is a fork of [alexgreensh/attention-span](https://github.com/alexgreensh/attention-span).
It adds a [Pi coding agent](https://pi.dev) package with the same three output
styles (Attention-kind, Spartan, Rundown) plus `/tldr`. Upstream files are
unchanged. Pi support lives in `package.json`, `extensions/`,
`scripts/gen-pi.py`, and this file. The package license is AGPL-3.0-only
(see [LICENSE](LICENSE)).

## Install in Pi

Run this command once:

```bash
pi install npm:@joaomj/pi-attention-span
```

Then run `/reload` in an active session.

## Use in Pi

The package provides a persistent style switcher and on-demand skills.
The persistent style is off by default. It costs no context until you
select a style.

- `/style` shows the installed styles plus Default. Select one to use it
  for every request. The choice persists across sessions.
- `/style attention-kind`, `/style spartan`, or `/style rundown` sets
  the style without the selector.
- `/style default` clears the style and returns to Pi built-in behavior.
- `/skill:attention-kind`, `/skill:spartan`, `/skill:rundown`, and
  `/skill:tldr` invoke one style for the current conversation only.

`/style` omits `tldr` on purpose. `tldr` compresses content written by
someone else. It is not a style for Pi own answers. See [README](README.md)
for what each style changes.

## Update in Pi

Run this command to fetch the latest published version:

```bash
pi update --extensions
```

## Maintain this fork

Keep upstream and Pi changes separate. Merge upstream into `main`.
Keep Pi changes in the files listed under Layout. Resolve README banner
conflicts by keeping the block between `fork-notice` markers.

After a merge that changes `skills/` or `VERSION`, regenerate and publish:

```bash
python3 scripts/gen-pi.py
```

This command writes `extensions/styles.generated.ts` from the skill files
and syncs `package.json` from `VERSION`. Commit the result. Then publish:

```bash
pnpm publish --access public
```

Package versions mirror upstream `VERSION` (0.8 becomes 0.8.0).

## Layout

| Path | Purpose |
|---|---|
| `extensions/attention-span.ts` | Hand-written `/style` command and per-run injection |
| `extensions/styles.generated.ts` | Style bodies generated from skills (do not edit) |
| `skills/` | Upstream on-demand skills, advertised to Pi as-is |
| `scripts/gen-pi.py` | Regenerates style bodies and syncs the package version |
| `package.json` | npm and Pi package manifest (`pi-package` keyword) |
