import React from 'react'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Animated 404 Heading */}
        <div className="relative">
          <h1 className="text-9xl font-black text-slate-200 select-none animate-pulse">
            404
          </h1>
          <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-slate-800">
            Oops! Page not found
          </p>
        </div>

        {/* Content */}
        <div className="mt-8">
          <p className="text-slate-600 mb-8">
            The page you're looking for doesn't exist or has been moved. 
            Don't worry, it happens to the best of us.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Back to Home
            </a>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-lg font-medium hover:bg-slate-900 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>

        {/* Decorative element */}
        <div className="mt-16 flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}

export default NotFound