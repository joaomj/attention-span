# Attention Span for Pi

This fork adds [Pi coding agent](https://pi.dev) support to
[attention-span](https://github.com/alexgreensh/attention-span) (v0.8, AGPL-3.0):
the same three output styles plus `/tldr`, installable as a Pi package.
Upstream files are untouched; Pi support lives in `package.json`,
`extensions/`, `scripts/gen-pi.py`, and this file, so upstream merges stay clean.

## Install

```bash
pi install git:github.com/joaomj/attention-span
```

Then `/reload` in a running session. The package provides:

- `/style` — persistent output style switcher (`attention-kind`, `spartan`,
  `rundown`, or back to `Default`). Off by default: zero passive context
  until you opt in. The choice persists in `attention-span.json` and takes
  effect on the next request.
- `/skill:attention-kind`, `/skill:spartan`, `/skill:rundown`, `/skill:tldr` —
  on-demand versions of the same wording, loaded only when invoked.

## Update

```bash
pi update --extensions
```

To pull in new upstream styles after a merge from upstream, regenerate the
embedded style bodies and commit the result:

```bash
python3 scripts/gen-pi.py
```

This keeps the `/style` extension byte-identical to the on-demand skills.

## Layout

| Path | Purpose |
|---|---|
| `extensions/attention-span.ts` | Hand-written `/style` command + per-run injection |
| `extensions/styles.generated.ts` | Style bodies generated from `skills/*/SKILL.md` (do not edit) |
| `skills/` | Upstream on-demand skills, advertised to Pi as-is |
| `scripts/gen-pi.py` | Regenerates the above from skills + syncs the package version |
