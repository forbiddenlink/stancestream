import { Suspense, lazy } from 'react'
import Home from './pages/Home.jsx'

// `/` is the public record page. The live app is its own route, `/arena`.
const App = lazy(() => import('./App.jsx'))
const isArena = window.location.pathname.replace(/\/+$/, '') === '/arena'

if (!isArena) document.documentElement.classList.add('home-route')

export default function Root() {
  return isArena ? (
    <Suspense fallback={null}>
      <App />
    </Suspense>
  ) : (
    <Home />
  )
}
