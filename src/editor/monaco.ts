import { version } from 'monaco-editor/package.json'
export type * from 'monaco-editor'
type monaco = typeof import('monaco-editor')

const CDN = 'https://cdn.jsdelivr.net/npm'
const PATH = `${CDN}/monaco-editor@${version}/min/vs`

let resolver: Promise<monaco>
export function fetchMonaco(args: { monaco?: monaco; language?: string } = {}) {
  resolver ??= new Promise((resolve, reject) => {
    const monaco = args.monaco ?? (window as { monaco?: monaco }).monaco
    if (monaco?.editor) return resolve(monaco)

    const script = document.createElement('script')
    script.src = PATH + '/loader.js'
    script.crossOrigin = 'anonymous'
    script.referrerPolicy = 'same-origin'
    script.onload = () => {
      type RequireFn = (module: string[], ok: (monaco: monaco) => void, err: (error: unknown) => void) => void
      const require = (window as { require?: { config: (a: unknown) => void } & RequireFn }).require
      if (!require) return reject(new Error('Monaco not loaded'))

      const config: Record<string, unknown> = { paths: { vs: PATH } }
      if (args.language) config['vs/nls'] = { availableLanguages: { '*': args.language } }
      require.config(config)
      require(['vs/editor/editor.main'], resolve, reject)
    }
    script.onerror = reject
    document.body.appendChild(script)
  })
  return resolver
}
