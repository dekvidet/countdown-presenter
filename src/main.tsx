import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadRuntimeConfig } from './timer/runtimeConfig.ts'

const bootstrap = async () => {
  const runtimeConfig = await loadRuntimeConfig()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App runtimeConfig={runtimeConfig} />
    </StrictMode>,
  )
}

void bootstrap()
