window.__ModuleLoader__.load({
  id: '@local/dsh-session-instructions',
  factory: (require) => {
    const React = require('react')
    /** Must match the Host row's `endpoint`. */
    const ENDPOINT = '/plugins/session-instructions'

    /** Visible text. Kept beside the exported locale resources for the same keys. */
    const dictionaries = {
      en: {
        'instructions.title': 'Instructions',
        'instructions.description': 'Read first, before any work starts. Write here the deliverables that must not be forgotten — every request begins with them.',
        'instructions.placeholder': 'For example:\n- Deliver the final report as a PDF in the workspace.\n- Do not finish until the tests pass.\n- Always update the README.',
        'instructions.save': 'Save',
        'instructions.saving': 'Saving…',
        'instructions.saved': 'Saved. Every request now starts with these instructions.',
        'instructions.error': 'Could not save the instructions.',
        'instructions.empty': 'Nothing is set, so no instructions are added.',
        'instructions.hint': 'Ctrl+Enter saves.',
        'unit.gap': ' ',
      },
      th: {
        'instructions.title': 'คำสั่งงาน',
        'instructions.description': 'อ่านก่อนเริ่มงานทุกครั้ง เขียนสิ่งที่ต้องส่งมอบและห้ามลืมไว้ที่นี่ — ทุกคำขอจะเริ่มต้นด้วยข้อความนี้',
        'instructions.placeholder': 'ตัวอย่าง:\n- ส่งรายงานฉบับสุดท้ายเป็น PDF ใน workspace\n- อย่าจบงานจนกว่าเทสต์จะผ่าน\n- อัปเดต README ทุกครั้ง',
        'instructions.save': 'บันทึก',
        'instructions.saving': 'กำลังบันทึก…',
        'instructions.saved': 'บันทึกแล้ว ทุกคำขอจะเริ่มต้นด้วยคำสั่งเหล่านี้',
        'instructions.error': 'บันทึกคำสั่งไม่สำเร็จ',
        'instructions.empty': 'ยังไม่ได้ตั้งคำสั่ง ระบบจะไม่เพิ่มข้อความใด ๆ',
        'instructions.hint': 'กด Ctrl+Enter เพื่อบันทึก',
        'unit.gap': ' ',
      },
      zh: {
        'instructions.title': '指令',
        'instructions.description': '开始任何工作前先阅读这些指令。在这里写下不能忘记的交付要求——每个请求都会以它们开头。',
        'instructions.placeholder': '例如：\n- 将最终报告以 PDF 形式交付到工作区。\n- 测试通过前不要结束。\n- 始终更新 README。',
        'instructions.save': '保存',
        'instructions.saving': '保存中…',
        'instructions.saved': '已保存。每个请求现在都会以这些指令开头。',
        'instructions.error': '无法保存指令。',
        'instructions.empty': '尚未设置，系统不会添加任何内容。',
        'instructions.hint': 'Ctrl+Enter 保存。',
        'unit.gap': ' ',
      },
    }

    /** Fill `{name}` placeholders from one values object. */
    function format(text, values) {
      if (values === undefined) return text
      return text.replace(/\{(\w+)\}/gu, (match, name) => (values[name] === undefined ? match : String(values[name])))
    }

    /** The row's own styles; the class names are unique to this plugin. */
    const css = [
      '.dshsi_row{border-bottom:.5px solid var(--dsw-alias-border-l2);display:flex;flex-direction:column;align-items:stretch;gap:12px;padding:16px 0}',
      '.dshsi_title{font-size:14px;line-height:20px;color:var(--dsw-alias-label-primary)}',
      '.dshsi_description{margin-top:4px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}',
      '.dshsi_textarea{box-sizing:border-box;width:100%;min-height:132px;max-height:320px;resize:vertical;padding:8px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px}',
      '.dshsi_textarea:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}',
      '.dshsi_textarea::placeholder{color:var(--dsw-alias-label-secondary)}',
      '.dshsi_actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}',
      '.dshsi_button{height:32px;padding:0 14px;border:none;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;cursor:pointer}',
      '@media (hover:hover){.dshsi_button:hover{background:var(--dsw-alias-interactive-bg-hover)}}',
      '.dshsi_button:disabled{opacity:.5;cursor:default}',
      '.dshsi_status{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}',
      '.dshsi_statusError{color:var(--dsw-alias-state-error-primary)}',
      '.dshsi_statusOk{color:var(--dsw-alias-state-success-primary)}',
    ].join('')

    const apply = (ctx) => {
      /** Translate through this plugin's own dictionaries, following the locale service. */
      const t = (key, values) => {
        let id = 'en'
        try {
          const snapshot = ctx.locale.getSnapshot()
          id = String(snapshot?.active ?? snapshot?.id ?? 'en')
        } catch {
          id = 'en'
        }
        const dict = dictionaries[id] ?? dictionaries[id.split('-')[0]] ?? dictionaries.en
        return format(dict[key] ?? dictionaries.en[key] ?? key, values)
      }

      /** The General row: the instructions the agent reads before it starts work. */
      function InstructionsRow() {
        const [value, setValue] = React.useState('')
        const [status, setStatus] = React.useState('idle')
        const [busy, setBusy] = React.useState(false)

        React.useEffect(() => {
          let cancelled = false
          const load = async () => {
            try {
              const response = await fetch(ENDPOINT, { headers: { accept: 'application/json' } })
              const body = await response.json()
              if (cancelled) return
              if (typeof body?.instructions === 'string') setValue(body.instructions)
            } catch {
              /* a transient failure keeps the row empty and lets the user type */
            }
          }
          void load()
          return () => {
            cancelled = true
          }
        }, [])

        /** Send the current text to the Host and adopt its answer. */
        const save = async () => {
          if (busy) return
          setBusy(true)
          setStatus('saving')
          try {
            const response = await fetch(ENDPOINT, {
              method: 'POST',
              headers: { accept: 'application/json', 'content-type': 'application/json' },
              body: JSON.stringify({ action: 'save', instructions: value }),
            })
            const body = await response.json()
            if (!response.ok) {
              setStatus('error')
              return
            }
            if (typeof body?.instructions === 'string') setValue(body.instructions)
            setStatus('saved')
          } catch {
            setStatus('error')
          } finally {
            setBusy(false)
          }
        }

        /** Ctrl+Enter (Cmd+Enter on macOS) saves without leaving the keyboard. */
        const onKeyDown = (event) => {
          if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey)) return
          event.preventDefault()
          void save()
        }

        let statusText
        let statusClass = 'dshsi_status'
        if (status === 'saving') {
          statusText = t('instructions.saving')
        } else if (status === 'saved') {
          statusText = t('instructions.saved')
          statusClass = 'dshsi_status dshsi_statusOk'
        } else if (status === 'error') {
          statusText = t('instructions.error')
          statusClass = 'dshsi_status dshsi_statusError'
        } else if (value.trim().length === 0) {
          statusText = t('instructions.empty')
        } else {
          statusText = t('instructions.hint')
        }

        return React.createElement(
          'div',
          { className: 'dshsi_row' },
          React.createElement('style', null, css),
          React.createElement(
            'div',
            null,
            React.createElement('div', { className: 'dshsi_title' }, t('instructions.title')),
            React.createElement('div', { className: 'dshsi_description' }, t('instructions.description')),
          ),
          React.createElement('textarea', {
            className: 'dshsi_textarea',
            value,
            spellCheck: false,
            placeholder: t('instructions.placeholder'),
            'aria-label': t('instructions.title'),
            onChange: (event) => {
              setValue(event.target.value)
              if (status === 'saved' || status === 'error') setStatus('idle')
            },
            onKeyDown,
          }),
          React.createElement(
            'div',
            { className: 'dshsi_actions' },
            React.createElement(
              'button',
              {
                type: 'button',
                className: 'dshsi_button',
                disabled: busy,
                onClick: () => void save(),
              },
              t('instructions.save'),
            ),
            React.createElement('span', { className: statusClass, role: 'status' }, statusText),
          ),
        )
      }

      ctx.slots.inject('settings.general.item', () =>
        ctx.slots.register({ name: 'settings.general.item', id: 'session-instructions', order: 25 }, InstructionsRow),
      )
    }

    return { inject: ['slots', 'locale'], apply }
  },
})
