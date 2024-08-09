function makeAlert() {
  const div = document.querySelector<HTMLDivElement>('#alert')!
  const message = div.querySelector<HTMLDivElement>('.message #alert-message')!
  const closeBtn = div.querySelector<HTMLButtonElement>('#alert-close')!
  const refreshBtn = div.querySelector<HTMLButtonElement>('#alert-refresh')!

  function hide(afterFrame: boolean, callback?: () => void) {
    if (afterFrame) {
      requestAnimationFrame(() => hide(false, callback))
      return
    }

    if (callback && div.classList.contains('refresh')) refreshBtn.removeEventListener('click', callback)

    div.classList.remove('show', 'refresh')
  }
  closeBtn.addEventListener('click', () => hide(true))

  return {
    show: (msg: string, refresh?: () => unknown) => {
      if (refresh) refreshBtn.addEventListener('click', refresh)
      message.innerHTML = msg
      requestAnimationFrame(() => {
        hide(false)
        if (refresh) div.classList.add('refresh')
        div.classList.add('show')
      })
    },
    hide
  }
}

let cache: ReturnType<typeof makeAlert> | null = null
export function getAlert() {
  return (cache ??= makeAlert())
}
