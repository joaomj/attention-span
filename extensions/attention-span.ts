/**
 * Attention Span extension for Pi.
 *
 * Provides a persistent output style, mirroring Claude Code's `outputStyle`:
 * - `/style` shows a selector with the installed styles + Default (off)
 * - `/style <attention-kind|spartan|rundown|default>` sets it directly
 * - `/style default|none|off` clears it back to Pi's built-in behavior
 *
 * The active style is stored in `<agent-dir>/attention-span.json` and injected
 * into every run via `before_agent_start`. Style wording is embedded at
 * generation time (see scripts/gen-pi.py) from the same per-style SKILL.md
 * sources the on-demand skills use, so persistent and on-demand styles never
 * drift. Defaults to off: zero passive context until you opt in.
 *
 * On-demand alternatives (no persistent cost): /skill:attention-kind,
 * /skill:spartan, /skill:rundown, /skill:tldr. `/style` intentionally omits
 * `tldr`: it is a one-shot transform of someone else's content, not a style
 * for Pi's own answers.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { ATTENTION_SPAN_VERSION, STYLE_BODIES } from "./styles.generated.ts";

const STYLES = ["attention-kind", "spartan", "rundown"] as const;
type StyleName = (typeof STYLES)[number];

const STATE_FILE = "attention-span.json";
const SECTION_KEY = "attention_span";

function statePath(): string {
	return join(getAgentDir(), STATE_FILE);
}

function loadActiveStyle(): StyleName | null {
	try {
		if (!existsSync(statePath())) return null;
		const parsed: unknown = JSON.parse(readFileSync(statePath(), "utf-8"));
		const style = (parsed as { style?: unknown })?.style;
		return typeof style === "string" && (STYLES as readonly string[]).includes(style)
			? (style as StyleName)
			: null;
	} catch {
		return null;
	}
}

function saveActiveStyle(style: StyleName | null): void {
	writeFileSync(statePath(), JSON.stringify({ style }, null, 2));
}

function matchStyle(input: string): StyleName | "default" | null {
	const normalized = input.trim().toLowerCase();
	if (normalized === "") return null;
	if (["default", "none", "off"].includes(normalized)) return "default";
	return (STYLES as readonly string[]).includes(normalized) ? (normalized as StyleName) : null;
}

export default function attentionSpan(pi: ExtensionAPI) {
	pi.on("before_agent_start", (event) => {
		const active = loadActiveStyle();
		if (!active) {
			delete event.systemPromptOptions.sections[SECTION_KEY];
			return;
		}
		const body = STYLE_BODIES[active];
		if (!body) return;
		event.systemPromptOptions.sections[SECTION_KEY] =
			`Active output style: ${active} (attention-span v${ATTENTION_SPAN_VERSION}). The following instructions govern how you talk, not how you code or what you can do.\n\n${body}`;
	});

	pi.registerCommand("style", {
		description: "Pick a persistent output style (attention-kind, spartan, rundown) or back to default",
		getArgumentCompletions: (prefix) => {
			const options = [...STYLES, "default"];
			const filtered = options.filter((s) => s.startsWith(prefix.toLowerCase()));
			return filtered.length > 0 ? filtered.map((value) => ({ value, label: value })) : null;
		},
		handler: async (args, ctx) => {
			const active = loadActiveStyle();
			const arg = args.trim();

			if (arg !== "") {
				const matched = matchStyle(arg);
				if (matched === null) {
					ctx.ui.notify(
						`Unknown style "${arg}". Valid: ${STYLES.join(", ")}, default.`,
						"warning",
					);
					return;
				}
				const next = matched === "default" ? null : matched;
				saveActiveStyle(next);
				ctx.ui.notify(
					next ? `Style is now ${next} (takes effect on the next request).` : "Style cleared. Back to Pi's built-in behavior.",
					"info",
				);
				return;
			}

			const items = [
				...STYLES.map((name) => `${name}${name === active ? " (active)" : ""}`),
				"Default",
			];
			let picked: string | undefined;
			if (ctx.hasUI) {
				picked = await ctx.ui.select("Output style", items);
			} else {
				ctx.ui.notify(`Installed styles: ${STYLES.join(", ")}. Run /style <name> or /style default.`, "info");
				return;
			}
			if (!picked) return;

			const clean = picked.replace(/ \(active\)$/, "");
			const matched = matchStyle(clean);
			if (matched === null) return;
			const next = matched === "default" ? null : matched;
			saveActiveStyle(next);
			ctx.ui.notify(
				next ? `Style is now ${next} (takes effect on the next request).` : "Style cleared. Back to Pi's built-in behavior.",
				"info",
			);
		},
	});
}
