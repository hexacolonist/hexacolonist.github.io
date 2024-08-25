import { fetchMonaco, editor } from './monaco'
import { getAssemblyScript } from '../compiler/assemblyscript'

export default async function mountEditor(on: HTMLElement) {
  const monaco = await fetchMonaco()

  //MAYBE: monaco-textmate for syntax highlighting

  const container = document.createElement('div')
  container.className = 'container'
  on.appendChild(container)
  const editor = monaco.editor.create(container, {
    theme: 'vs-dark',
    minimap: {
      renderCharacters: false,
      autohide: true
    },
    wordWrap: 'on',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    lineNumbersMinChars: 3,
    padding: {
      top: 4
    },

    model: null
  })

  const models: Partial<Record<string, editor.ITextModel>> = {
    wasm: monaco.editor.createModel('Pick a language or drag and drop your WebAssembly file', 'wasm')
  }
  const states: Partial<Record<string, editor.ICodeEditorViewState>> = {}
  let ascLoaded = false
  let watLoaded = false

  const languageSelector = document.getElementById('editor-language') as HTMLSelectElement
  languageSelector.value = localStorage.getItem('editor-language') ?? 'wasm'

  function changeLanguage() {
    const prev = editor.getModel()
    if (prev) states[prev.getLanguageId()] = editor.saveViewState()!

    const value = languageSelector.value
    localStorage.setItem('editor-language', value)

    let model = models[value]
    if (!model) {
      model = models[value] = monaco.editor.createModel('Loading...', value)
      const m = model
      const noEdit = m.getAlternativeVersionId()
      import('./data')
        .then((data) => data.templates[value])
        .catch(console.error)
        .then((template) => {
          if (m.getAlternativeVersionId() === noEdit) m.setValue(template ?? 'Happy coding')
        })
        .catch(() => {})
    }
    editor.setModel(model)

    editor.restoreViewState(states[value] ?? null)
    editor.updateOptions({ readOnly: false })
    switch (value) {
      case 'typescript':
        if (!ascLoaded) {
          getAssemblyScript()
            .then((asc) =>
              monaco.languages.typescript.typescriptDefaults.addExtraLib(
                asc.definitionFiles.assembly,
                'assemblyscript/std/assembly/index.d.ts'
              )
            )
            .catch(console.error)
          import('./data')
            .then(({ ascLib }) => {
              monaco.editor.createModel(ascLib, 'typescript', monaco.Uri.file('/@hexacolonist/bot/index.ts'))
              monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                paths: {
                  '@hexacolonist/bot': ['file:///@hexacolonist/bot/index.ts']
                },
                allowNonTsExtensions: true
              })
            })
            .catch(console.log)
        }
        ascLoaded = true
        break
      case 'wat':
        if (!watLoaded)
          import('./data')
            .then(({ wat }) => {
              monaco.languages.register({ id: 'wat' })
              monaco.languages.setLanguageConfiguration('wat', wat.config as never)
              monaco.languages.setMonarchTokensProvider('wat', wat.tokens as never)
            })
            .catch(console.error)
        watLoaded = true
        break
      case 'wasm':
        editor.updateOptions({ readOnly: true })
        break
    }
  }
  languageSelector.addEventListener('change', changeLanguage)
  changeLanguage()

  editor.addAction({
    id: 'toggle-word-wrap',
    label: 'Toggle Word Wrap',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW],
    run: () => {
      const wordWrap = editor.getOption(monaco.editor.EditorOption.wordWrap)
      editor.updateOptions({ wordWrap: wordWrap === 'off' ? 'on' : 'off' })
    }
  })
}
