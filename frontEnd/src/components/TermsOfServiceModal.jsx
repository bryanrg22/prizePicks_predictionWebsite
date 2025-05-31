"use client"
import { useState, useEffect, useRef } from "react"
import { FileText, AlertTriangle, ChevronDown } from "lucide-react"

export default function TermsOfServiceModal({ isOpen, onAccept, onDecline, loading = false }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)
  const scrollContainerRef = useRef(null)

  // Improved scroll handling with better detection
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100
    const isNearBottom = scrollPercentage >= 95 // Consider 95% as "bottom"
    const hasStartedScrolling = scrollTop > 20

    // Update scroll indicator visibility
    if (hasStartedScrolling && showScrollIndicator) {
      setShowScrollIndicator(false)
    }

    // Update bottom reached state
    if (isNearBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true)
    }

    // Re-show scroll indicator if user scrolls back up significantly
    if (scrollPercentage < 50 && !showScrollIndicator && hasStartedScrolling) {
      setShowScrollIndicator(true)
    }
  }

  // Reset scroll state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false)
      setShowScrollIndicator(true)

      // Reset scroll position when modal opens
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
    }
  }, [isOpen])

  // Check if content is scrollable on mount
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current
      const isScrollable = scrollHeight > clientHeight

      // If content doesn't need scrolling, automatically enable accept button
      if (!isScrollable) {
        setHasScrolledToBottom(true)
        setShowScrollIndicator(false)
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background with blur effect */}
      <div
        className="absolute inset-0 backdrop-blur-md bg-gray-900/70"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(120, 219, 226, 0.3) 0%, transparent 50%)
          `,
        }}
      ></div>

      <div className="relative w-full max-w-4xl bg-gradient-to-b from-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-600/50 flex flex-col h-[85vh] md:h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600/50 bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-900/40 rounded-lg backdrop-blur-sm">
              <FileText className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Terms of Service</h2>
              <p className="text-gray-300 text-xs">Please read and accept to continue</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-medium">Required</span>
          </div>
        </div>

        {/* Scrollable Content - FIXED */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="h-full overflow-y-auto p-6 space-y-4 text-gray-300 leading-relaxed"
            onScroll={handleScroll}
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#4B5563 #1F2937",
            }}
          >
            <div className="max-w-none">
              <div className="bg-yellow-900/30 border border-yellow-600/40 rounded-lg p-4 mb-6 backdrop-blur-sm">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-200 font-medium mb-2 text-sm">Important Notice</p>
                    <p className="text-yellow-300 text-sm">
                      By using this service, you acknowledge that sports betting involves significant financial risk.
                      You must be of legal gambling age in your jurisdiction.
                    </p>
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-white mb-4">PRIZEPICKS PREDICTION WEBSITE - TERMS OF SERVICE</h1>

              <p className="text-gray-400 mb-6 text-sm">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
              </p>

              <section className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                <p className="text-sm">
                  By accessing or using this service ("Service"), you agree to be bound by these Terms. If you do not
                  agree, immediately discontinue use.
                </p>
              </section>

              <section className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">2. Nature of Service</h2>
                <div className="space-y-3 text-sm">
                  <p>
                    <strong>a)</strong> The Service provides statistical predictions and AI-generated analysis for
                    informational purposes ONLY
                  </p>
                  <p>
                    <strong>b)</strong> All outputs are computer-generated probabilities, NOT gambling advice or
                    financial recommendations
                  </p>
                  <p>
                    <strong>c)</strong> We do NOT guarantee accuracy, completeness, or profitability of predictions
                  </p>
                </div>
              </section>

              <section className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">3. User Acknowledgements</h2>
                <p className="mb-3 text-sm">You expressly agree that:</p>
                <div className="space-y-3 ml-4 text-sm">
                  <p>
                    <strong>a)</strong> You are of legal gambling age in your jurisdiction (18+ or 21+ where applicable)
                  </p>
                  <p>
                    <strong>b)</strong> You understand sports betting involves significant risk of financial loss
                  </p>
                  <p>
                    <strong>c)</strong> You will NOT treat our predictions as guaranteed outcomes
                  </p>
                  <p>
                    <strong>d)</strong> You solely assume all liability for betting decisions made using this Service
                  </p>
                </div>
              </section>

              <section className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">4. Legal Compliance</h2>
                <div className="space-y-3 text-sm">
                  <p>
                    <strong>a)</strong> Users are solely responsible for complying with local gambling laws
                  </p>
                  <p>
                    <strong>b)</strong> The Service does not constitute an offer to gamble
                  </p>
                  <p>
                    <strong>c)</strong> We prohibit use in jurisdictions where sports betting is illegal
                  </p>
                </div>
              </section>

              <section className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">5. Disclaimers</h2>
                <div className="bg-red-900/30 border border-red-600/40 rounded-lg p-4 backdrop-blur-sm">
                  <p className="font-bold text-red-300 mb-3 text-sm">
                    THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE EXPRESSLY DISCLAIM:
                  </p>
                  <div className="space-y-2 ml-4 text-sm">
                    <p>
                      <strong>a)</strong> Warranties of accuracy, reliability, or fitness for any purpose
                    </p>
                    <p>
                      <strong>b)</strong> Responsibility for gambling losses or damages
                    </p>
                    <p>
                      <strong>c)</strong> Endorsement of any third-party gambling platforms
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">6. Limitation of Liability</h2>
                <p className="mb-3 text-sm">Under no circumstances shall [Your Company/Name] be liable for:</p>
                <div className="space-y-3 ml-4 text-sm">
                  <p>
                    <strong>a)</strong> Direct/indirect gambling losses
                  </p>
                  <p>
                    <strong>b)</strong> Decisions made based on Service outputs
                  </p>
                  <p>
                    <strong>c)</strong> Technical errors or data inaccuracies
                  </p>
                </div>
              </section>

              <section className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">7. Data Usage</h2>
                <p className="mb-3 text-sm">By using the Service, you consent to:</p>
                <div className="space-y-3 ml-4 text-sm">
                  <p>
                    <strong>a)</strong> Collection of betting patterns and usage data for model improvement
                  </p>
                  <p>
                    <strong>b)</strong> Secure storage of personal data per our Privacy Policy
                  </p>
                  <p>
                    <strong>c)</strong> Anonymized aggregation of prediction outcomes
                  </p>
                </div>
              </section>

              <section className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">8. Account Termination</h2>
                <p className="mb-3 text-sm">We reserve the right to suspend accounts:</p>
                <div className="space-y-3 ml-4 text-sm">
                  <p>
                    <strong>a)</strong> Suspected of fraudulent activity
                  </p>
                  <p>
                    <strong>b)</strong> Violating these Terms
                  </p>
                  <p>
                    <strong>c)</strong> From prohibited jurisdictions
                  </p>
                </div>
              </section>

              <section className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">9. Amendments</h2>
                <p className="text-sm">We may update these Terms at any time. Continued use constitutes acceptance.</p>
              </section>

              <div className="bg-blue-900/30 border border-blue-600/40 rounded-lg p-4 mt-8 backdrop-blur-sm">
                <h3 className="text-base font-bold text-blue-300 mb-3">BY USING THIS SERVICE, YOU CERTIFY THAT:</h3>
                <div className="space-y-3 text-sm">
                  <p>
                    <strong>1.</strong> You have read and understood these Terms
                  </p>
                  <p>
                    <strong>2.</strong> You acknowledge sports betting involves risk of financial loss
                  </p>
                  <p>
                    <strong>3.</strong> You assume full responsibility for your gambling decisions
                  </p>
                </div>
              </div>

              {/* Extra padding at bottom to ensure full scroll */}
              <div className="h-16"></div>
            </div>
          </div>

          {/* Improved scroll indicator */}
          {showScrollIndicator && !hasScrolledToBottom && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-900/95 via-gray-900/60 to-transparent pointer-events-none">
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                <div className="text-gray-300 text-sm mb-2 font-medium">Scroll to continue</div>
                <ChevronDown className="w-5 h-5 text-gray-300 animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-600/50 bg-gray-800/50 backdrop-blur-sm rounded-b-2xl flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              onClick={onDecline}
              disabled={loading}
              className="px-6 py-3 bg-gray-600/80 hover:bg-gray-500/80 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-sm"
            >
              Decline & Exit
            </button>
            <button
              onClick={onAccept}
              disabled={loading || !hasScrolledToBottom}
              className={`px-8 py-3 font-medium rounded-lg transition-all duration-200 flex items-center justify-center text-sm ${
                hasScrolledToBottom && !loading
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg backdrop-blur-sm transform hover:scale-105"
                  : "bg-gray-600/50 text-gray-400 cursor-not-allowed backdrop-blur-sm"
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                "I Accept Terms of Service"
              )}
            </button>
          </div>
          {!hasScrolledToBottom && (
            <p className="text-gray-400 text-xs mt-3 text-center">
              Please scroll through the entire document to enable acceptance
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
