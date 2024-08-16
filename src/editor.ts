import loader from '@monaco-editor/loader'

export default async function mountEditor(on: HTMLElement) {
  loader.config({ paths: { vs: 'vs' } })
  const monaco = await loader.init()

  monaco.editor.create(on, {
    theme: 'vs-dark',
    minimap: {
      renderCharacters: false,
      autohide: true
    },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    lineNumbersMinChars: 3,

    value: 'int main() {\n\tprintf("Hello, World!");\n\treturn 0;\n}',
    language: 'cpp'
  })
}
