import './style.css'
import appLogo from '/favicon.svg'
import { initPWA } from './pwa.ts'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <div>
    <h1>Hexacolonist</h1>
    <img src="${appLogo}" class="logo" alt="App logo" />
  </div>
`

initPWA()
