import "./chatgpt-thinking.css"

export default function ChatGptThinking({ text = "Analyzing player data" }) {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="flex items-center justify-center mb-4">
        {/* ChatGPT Logo */}
        <div className="chatgpt-logo-container mr-4">
          <img src="/chatgptLogo.png" width="47" height="47" className="invert-to-white" alt="ChatGPT Logo" />
        </div>

        {/* Thinking Animation */}
        <div className="chatgpt-thinking-animation">
          <div className="chatgpt-thinking-dot"></div>
          <div className="chatgpt-thinking-dot"></div>
          <div className="chatgpt-thinking-dot"></div>
        </div>
      </div>

      <p className="text-gray-300 text-center mt-2">{text}</p>
    </div>
  )
}
