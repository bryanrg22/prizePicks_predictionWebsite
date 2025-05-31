"use client"

const TermsOfServiceModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-blue-950 border border-blue-800 rounded-lg shadow-lg w-11/12 max-w-3xl mx-auto overflow-hidden">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white">Terms of Service</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-300 focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto max-h-[60vh] pr-4">
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p className="text-blue-300 font-medium text-sm">
                By accessing or using our services, you agree to be bound by these Terms of Service and all applicable
                laws and regulations.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
              <p className="text-blue-300 font-medium text-sm">
                We provide a platform for [describe your service here]. We reserve the right to modify or discontinue
                the service at any time.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">3. User Accounts</h2>
              <p className="text-blue-300 font-medium text-sm">
                You are responsible for maintaining the confidentiality of your account and password. You agree to
                accept responsibility for all activities that occur under your account.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">4. User Conduct</h2>
              <p className="text-blue-300 font-medium text-sm">
                You agree not to use the service for any unlawful purpose or in any way that could damage, disable,
                overburden, or impair the service.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">5. Intellectual Property</h2>
              <p className="text-blue-300 font-medium text-sm">
                All content and materials available on the service are protected by intellectual property laws. You may
                not use, reproduce, or distribute any content without our express written permission.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">6. Limitation of Liability</h2>
              <p className="text-blue-300 font-medium text-sm">
                Under no circumstances shall Lambda Rim be liable for:
              </p>
              <ul className="list-disc pl-5 text-blue-300 font-medium text-sm">
                <li>Any indirect, incidental, special, consequential or punitive damages.</li>
                <li>Any loss of profits or revenues.</li>
                <li>Any loss of data, use, goodwill, or other intangible losses.</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">7. Disclaimer of Warranties</h2>
              <p className="text-blue-300 font-medium text-sm">
                The service is provided on an "as is" and "as available" basis. We make no warranties, express or
                implied, regarding the service.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">8. Governing Law</h2>
              <p className="text-blue-300 font-medium text-sm">
                These Terms of Service shall be governed by and construed in accordance with the laws of [Your
                Jurisdiction].
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">9. Amendments</h2>
              <p className="text-blue-300 font-medium text-sm">
                We reserve the right to modify or update these Terms of Service at any time. Your continued use of the
                service after any such changes constitutes your acceptance of the new Terms of Service.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">10. Responsible Gambling Resources</h2>
              <div className="bg-blue-900/30 border border-blue-600/40 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-blue-300 font-medium mb-3 text-sm">
                  If you or someone you know has a gambling problem, help is available:
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-400 font-medium">National Problem Gambling Helpline:</span>
                    <a
                      href="tel:1-800-522-4700"
                      className="text-blue-300 hover:text-blue-200 underline transition-colors"
                    >
                      1-800-GAMBLER (1-800-522-4700)
                    </a>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-400 font-medium">Online Resources:</span>
                    <a
                      href="https://www.ncpgambling.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:text-blue-200 underline transition-colors"
                    >
                      ncpgambling.org
                    </a>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-400 font-medium">Crisis Text Line:</span>
                    <span className="text-blue-300">Text "GAMBLER" to 233-000</span>
                  </div>
                </div>
                <p className="text-blue-300 text-xs mt-3 italic">
                  Remember: Gambling should be fun and entertaining, not a way to make money or solve financial
                  problems.
                </p>
              </div>
            </section>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-600 rounded border-blue-600/50 focus:ring-blue-500"
              />
              <span className="ml-2 text-blue-300 font-medium text-sm">
                I have read and agree to the Terms of Service
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsOfServiceModal
