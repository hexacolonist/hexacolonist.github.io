import { fetchMonaco } from './monaco'
import { getAssemblyScript } from '../compiler/assemblyscript'

export default async function mountEditor(on: HTMLElement) {
  const [monaco, { wat, templates }] = await Promise.all([fetchMonaco(), import('./data')])

  monaco.languages.register({ id: 'wat' })
  monaco.languages.setLanguageConfiguration('wat', wat.config as never)
  monaco.languages.setMonarchTokensProvider('wat', wat.tokens as never)

  monaco.editor.defineTheme('vs-dark-plus', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      // WebAssembly
      { token: 'instruction', foreground: 'dcdcaa' },
      { token: 'controlInstruction', foreground: 'c586c0' },
      { token: 'identifier', foreground: '9cdcf0' }
    ],
    colors: {}
  })

  const models = Object.fromEntries(
    Object.entries(templates).map(([language, text]) => [language, monaco.editor.createModel(text, language)])
  )

  const container = document.createElement('div')
  container.className = 'container'
  on.appendChild(container)
  const editor = monaco.editor.create(container, {
    theme: 'vs-dark-plus',
    minimap: {
      renderCharacters: false,
      autohide: true
    },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    lineNumbersMinChars: 3,
    padding: {
      top: 4
    },

    model: null
  })

  let ascLoaded = false
  const languageSelector = document.getElementById('editor-language') as HTMLSelectElement
  function changeLanguage() {
    const value = languageSelector.value
    editor.setModel(models[value])
    editor.updateOptions({ readOnly: false })
    switch (value) {
      case 'typescript':
        if (!ascLoaded)
          getAssemblyScript()
            .then((asc) =>
              monaco.languages.typescript.typescriptDefaults.addExtraLib(
                asc.definitionFiles.assembly,
                'assemblyscript/std/assembly/index.d.ts'
              )
            )
            .catch(console.error)
        ascLoaded = true
        break
      case 'wasm':
        editor.updateOptions({ readOnly: true })
        break
    }
  }
  languageSelector.addEventListener('change', changeLanguage)
  changeLanguage()
}
