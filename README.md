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
The kind of instruction you state once and then have to repeat — because it lived in one message that fell out of
the context window.

This plugin gives those rules a permanent home: a text box in **Settings → General → Instructions**. Whatever is in
it is read at the **top of the system prompt**, before any work starts, on every request.

## Features

- **Always first** — the text is placed at the top of the system prompt, not appended after a long conversation.
- **Editable without code changes** — the GUI writes it; no patch file, no restart to change the wording.
- **Persisted, not ephemeral** — kept in the plugin's `state.json`, so upgrades and `git pull` leave it alone.
- **Bounded** — `maxLength` (20 000 characters by default) rejects a runaway paste before it costs tokens on
  every turn.
- **Localized UI** — English, Thai, and Chinese in `locale/`.
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

Restart once, open **Settings → General → Instructions**, and write the rules you are tired of repeating.

## Configuration

| field | default | meaning |
|---|---|---|
| `endpoint` | `/plugins/session-instructions` | Path the Web GUI reads and writes the text at |
| `maxLength` | `20000` | Largest instruction text accepted, in characters |

## How it works

```
Settings → General → Instructions
            │  PUT
            ▼
   state.json  ──read at the top of every turn──▶  system prompt
```

Because it rides the system prompt rather than a user message, it does not compete with the conversation for
recency — and it is not the first thing dropped when context gets tight.

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

## ภาษาไทย

ที่สำหรับเขียน **คำสั่งถาวร** ที่ต้องติดไปกับทุกคำขอ — เช่น "ทำเอกสารต้องแนบไฟล์ทุกครั้ง", "ตอบเป็นภาษาไทย",
"ห้าม push ขึ้น main" — เขียนครั้งเดียวที่ **Settings → General → Instructions**

- ข้อความถูกอ่านไว้ที่ **หัว system prompt** ก่อนเริ่มงานทุกครั้ง (ไม่ใช่ต่อท้ายบทสนทนายาว ๆ)
- เก็บใน `state.json` → อัปเกรด DSH หรือ `git pull` แล้วไม่หาย
- จำกัดความยาวด้วย `maxLength` (20,000 ตัวอักษร) กันการวางยาว ๆ ที่จะถูกคิดเงินทุกเทิร์น
- ไม่มี tool ไม่มีเน็ตเวิร์ก ไม่มี timer

> เขียนให้สั้นและเป็นคำสั่งชัด ๆ — ข้อความนี้ถูกคิด token ทุกครั้งที่ส่ง ถ้าต้องการเนื้อหายาว ๆ ให้ไปไว้ใน `SKILL.md`

## License

[MIT](LICENSE) © 2026 BornCode
