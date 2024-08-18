export async function getAssemblyScript() {
  return (await import(/* @vite-ignore */ `${'assemblyscript/asc'}`)) as typeof import('assemblyscript/asc')
}

export async function compileAssemblyScript(code: string) {
  // import from map
  const asc = await getAssemblyScript()
  return asc.compileString(code, {
    optimizeLevel: 3
  })
}
