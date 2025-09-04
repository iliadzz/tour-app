// driver-client/src/App.tsx
import { AdminPanel } from './AdminPanel';

function App() {
  return (
    <div className="bg-gray-800 text-white min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">Tour Driver Control</h1>
      <AdminPanel />
    </div>
  )
}

export default App
