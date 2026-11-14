> **This repository has moved into one monorepo.**
>
> The BornCode plugins — agent customization, desktop control, auto-continue,
> auto-shutdown, browser use, session instructions, session sync, and the side
> chat — now live in
> **[`borncode-app/dsh-borncode`](https://github.com/borncode-app/dsh-borncode)**,
> one repository with one Plugins entry.
>
> | this repo | new home |
> |---|---|
> | `dsh-agent-customizer` | `packages/dsh-agent-customizer` |
> | `dsh-agent-desktop` | `packages/dsh-agent-desktop` |
> | `dsh-auto-continue` | `packages/dsh-auto-continue` |
> | `dsh-auto-shutdown` | `packages/dsh-auto-shutdown` |
> | `dsh-browser-use` | `packages/dsh-browser-use` |
> | `dsh-session-instructions` | `packages/dsh-session-instructions` |
> | `dsh-session-sync` | `packages/dsh-session-sync` |
> | `dsh-side-chat` | `packages/dsh-side-chat` |
>
> The code and its history are unchanged; only the repository is shared. Install
> `dsh-borncode` instead of the individual bundles. This repository stays open
> so the old links keep working.
<div align="center">
  <img src="icon.svg" alt="" width="72" height="72">
  <h1>dsh-session-instructions</h1>
  <p><b>Standing instructions that travel with every request, so nothing you said once gets forgotten.</b></p>
  <p>
    <a href="https://github.com/borncode-app/dsh-session-instructions/releases"><img alt="release" src="https://img.shields.io/github/v/release/borncode-app/dsh-session-instructions?style=flat-square&color=6C4BF6"></a>
    <a href="LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-3DA639?style=flat-square"></a>
    <img alt="plugin" src="https://img.shields.io/badge/DeepSeek%20Harness-plugin-6C4BF6?style=flat-square">
    <img alt="scope" src="https://img.shields.io/badge/scope-every%20turn-8957e5?style=flat-square"></a>
  </p>
</div>

---

## What it does

"If you produce a document, always add the file card." "Always answer in Thai." "Never push to main."
The kind of instruction you state once and then have to repeat â€” because it lived in one message that fell out of
the context window.

This plugin gives those rules a permanent home: a text box in **Settings â†’ General â†’ Instructions**. Whatever is in
it is read at the **top of the system prompt**, before any work starts, on every request.

## Features

- **Always first** â€” the text is placed at the top of the system prompt, not appended after a long conversation.
- **Editable without code changes** â€” the GUI writes it; no patch file, no restart to change the wording.
- **Persisted, not ephemeral** â€” kept in the plugin's `state.json`, so upgrades and `git pull` leave it alone.
- **Bounded** â€” `maxLength` (20 000 characters by default) rejects a runaway paste before it costs tokens on
  every turn.
- **Localized UI** â€” English, Thai, and Chinese in `locale/`.
- No tools, no network, no timers: one endpoint and one prompt contribution.

## Requirements

| | |
|---|---|
| DeepSeek Harness | 0.2.x (Web GUI) |
| Runtime | Node 24, supplied by the Harness runtime |
| Platform | Windows, macOS, Linux |

## Install

```bash
git clone https://github.com/borncode-app/dsh-session-instructions.git dsh-session-instructions
```

Then:

```
plugin_manager install_bundle target=C:\path\to\dsh-session-instructions
```

Restart once, open **Settings â†’ General â†’ Instructions**, and write the rules you are tired of repeating.

## Configuration

| field | default | meaning |
|---|---|---|
| `endpoint` | `/plugins/session-instructions` | Path the Web GUI reads and writes the text at |
| `maxLength` | `20000` | Largest instruction text accepted, in characters |

## How it works

```
Settings â†’ General â†’ Instructions
            â”‚  PUT
            â–¼
   state.json  â”€â”€read at the top of every turnâ”€â”€â–¶  system prompt
```

Because it rides the system prompt rather than a user message, it does not compete with the conversation for
recency â€” and it is not the first thing dropped when context gets tight.

> Keep it short and absolute. A standing instruction is billed on every single request; ten paragraphs of
> background belong in a `SKILL.md`, not here.

## Files

| file | role |
|---|---|
| `index.js` | host row: endpoint, persistence, prompt contribution |
| `client.js` | the Settings page |
| `cordis.patch.yml` | the bundle patch that inserts the row |
| `locale/{en,th,zh}.json` | UI strings |
| `icon.svg` | plugin icon |
| `test/smoke.mjs` | the check used while building it |

## à¸ à¸²à¸©à¸²à¹„à¸—à¸¢

à¸—à¸µà¹ˆà¸ªà¸³à¸«à¸£à¸±à¸šà¹€à¸‚à¸µà¸¢à¸™ **à¸„à¸³à¸ªà¸±à¹ˆà¸‡à¸–à¸²à¸§à¸£** à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸•à¸´à¸”à¹„à¸›à¸à¸±à¸šà¸—à¸¸à¸à¸„à¸³à¸‚à¸­ â€” à¹€à¸Šà¹ˆà¸™ "à¸—à¸³à¹€à¸­à¸à¸ªà¸²à¸£à¸•à¹‰à¸­à¸‡à¹à¸™à¸šà¹„à¸Ÿà¸¥à¹Œà¸—à¸¸à¸à¸„à¸£à¸±à¹‰à¸‡", "à¸•à¸­à¸šà¹€à¸›à¹‡à¸™à¸ à¸²à¸©à¸²à¹„à¸—à¸¢",
"à¸«à¹‰à¸²à¸¡ push à¸‚à¸¶à¹‰à¸™ main" â€” à¹€à¸‚à¸µà¸¢à¸™à¸„à¸£à¸±à¹‰à¸‡à¹€à¸”à¸µà¸¢à¸§à¸—à¸µà¹ˆ **Settings â†’ General â†’ Instructions**

- à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸–à¸¹à¸à¸­à¹ˆà¸²à¸™à¹„à¸§à¹‰à¸—à¸µà¹ˆ **à¸«à¸±à¸§ system prompt** à¸à¹ˆà¸­à¸™à¹€à¸£à¸´à¹ˆà¸¡à¸‡à¸²à¸™à¸—à¸¸à¸à¸„à¸£à¸±à¹‰à¸‡ (à¹„à¸¡à¹ˆà¹ƒà¸Šà¹ˆà¸•à¹ˆà¸­à¸—à¹‰à¸²à¸¢à¸šà¸—à¸ªà¸™à¸—à¸™à¸²à¸¢à¸²à¸§ à¹†)
- à¹€à¸à¹‡à¸šà¹ƒà¸™ `state.json` â†’ à¸­à¸±à¸›à¹€à¸à¸£à¸” DSH à¸«à¸£à¸·à¸­ `git pull` à¹à¸¥à¹‰à¸§à¹„à¸¡à¹ˆà¸«à¸²à¸¢
- à¸ˆà¸³à¸à¸±à¸”à¸„à¸§à¸²à¸¡à¸¢à¸²à¸§à¸”à¹‰à¸§à¸¢ `maxLength` (20,000 à¸•à¸±à¸§à¸­à¸±à¸à¸©à¸£) à¸à¸±à¸™à¸à¸²à¸£à¸§à¸²à¸‡à¸¢à¸²à¸§ à¹† à¸—à¸µà¹ˆà¸ˆà¸°à¸–à¸¹à¸à¸„à¸´à¸”à¹€à¸‡à¸´à¸™à¸—à¸¸à¸à¹€à¸—à¸´à¸£à¹Œà¸™
- à¹„à¸¡à¹ˆà¸¡à¸µ tool à¹„à¸¡à¹ˆà¸¡à¸µà¹€à¸™à¹‡à¸•à¹€à¸§à¸´à¸£à¹Œà¸ à¹„à¸¡à¹ˆà¸¡à¸µ timer

> à¹€à¸‚à¸µà¸¢à¸™à¹ƒà¸«à¹‰à¸ªà¸±à¹‰à¸™à¹à¸¥à¸°à¹€à¸›à¹‡à¸™à¸„à¸³à¸ªà¸±à¹ˆà¸‡à¸Šà¸±à¸” à¹† â€” à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸™à¸µà¹‰à¸–à¸¹à¸à¸„à¸´à¸” token à¸—à¸¸à¸à¸„à¸£à¸±à¹‰à¸‡à¸—à¸µà¹ˆà¸ªà¹ˆà¸‡ à¸–à¹‰à¸²à¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¹€à¸™à¸·à¹‰à¸­à¸«à¸²à¸¢à¸²à¸§ à¹† à¹ƒà¸«à¹‰à¹„à¸›à¹„à¸§à¹‰à¹ƒà¸™ `SKILL.md`

## License

[MIT](LICENSE) Â© 2026 BornCode
