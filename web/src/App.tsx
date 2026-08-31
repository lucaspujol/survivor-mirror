import { useEffect, useState } from 'react'
import './App.css'

type ApiStatus = 'loading' | 'ok' | 'unreachable'

function App() {
  const [status, setStatus] = useState<ApiStatus>('loading')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? setStatus('ok') : setStatus('unreachable')))
      .catch(() => setStatus('unreachable'))
  }, [])

  return (
    <main>
      <h1>GéoEmploi</h1>
      <p>
        API: <span className={`status status-${status}`}>{status}</span>
      </p>
    </main>
  )
}

export default App
