'use client'
import dynamic from 'next/dynamic'

// Dynamically import the map to avoid SSR issues
const JapanMap = dynamic(() => import('./components/JapanMap'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading map...</div>
})

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🗾 Japan Prefecture Map
          </h1>
          <p className="text-lg text-gray-600">
            Interactive cartoon-style map of Japan&apos;s 47 prefectures
          </p>
        </div>
        
        <div className="w-full h-[600px] mb-8">
          <JapanMap className="w-full h-full" />
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            About This Map
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Features</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Interactive prefecture boundaries</li>
                <li>• Cartoon-style colorful overlay</li>
                <li>• Hover effects and popups</li>
                <li>• Click animations</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Tech Stack</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Next.js (Static Export)</li>
                <li>• React Leaflet</li>
                <li>• Tailwind CSS</li>
                <li>• TypeScript</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
