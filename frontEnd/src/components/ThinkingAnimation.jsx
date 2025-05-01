import "./thinking-animation.css"

export default function ThinkingAnimation({ text = "Analyzing" }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="flex items-center justify-center mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center thinking-ring">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
      </div>

      <div className="flex items-center">
        <span className="text-lg font-medium mr-2">{text}</span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full thinking-dot"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full thinking-dot"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full thinking-dot"></div>
        </div>
      </div>

      <p className="text-gray-400 text-sm mt-4 max-w-md text-center">
        Gathering player statistics, analyzing matchups, and calculating probabilities...
      </p>
    </div>
  )
}

