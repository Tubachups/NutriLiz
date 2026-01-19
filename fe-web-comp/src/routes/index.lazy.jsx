import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  return (
       <div className="min-h-screen bg-[#ECF4E8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2D5A45] mb-4">
            WELCOME TO NUTRILIZ 
          </h1>
        </div>

        {/* Introduction */}
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-l-4 border-[#ABE7B2]">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Introduction
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Welcome to <span className="font-bold text-[#4A7C59]">NutriLiz</span>. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web services.
          </p>
        </section>

        {/* Data Collection */}
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-l-4 border-[#CBF3BB]">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Information We Collect
          </h2>
          <div className="space-y-4">
            <div className="bg-[#ECF4E8] rounded-xl p-4">
              <h3 className="font-bold text-[#4A7C59] mb-2">Personal Information</h3>
              <p className="text-gray-700">
                When you create an account, we may collect your email address, and profile information to provide personalized nutrition recommendations.
              </p>
            </div>
            <div className="bg-[#ECF4E8] rounded-xl p-4">
              <h3 className="font-bold text-[#4A7C59] mb-2">Health & Dietary Data</h3>
              <p className="text-gray-700">
              To provide accurate nutritional assessments, we collect limited personal information such as your height and weight to calculate your BMI, as well as health conditions and blood test information that you can voluntarily provide.
              </p>
            </div>
            <div className="bg-[#ECF4E8] rounded-xl p-4">
              <h3 className="font-bold text-[#4A7C59] mb-2">Camera Access</h3>
              <p className="text-gray-700">
                Our app uses your device's camera to scan barcodes and recognize food items. Images are processed to identify products and are not stored permanently on our servers.
              </p>
            </div>
          </div>
        </section>

        {/* How We Use Your Data */}
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-l-4 border-[#93BFC7]">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            How We Use Your Information
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-[#ABE7B2] rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Provide personalized <span className="font-bold">nutrition recommendations</span> and health risk assessments</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-[#ABE7B2] rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Identify food products through <span className="font-bold">barcode scanning</span> and image recognition</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-[#ABE7B2] rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Maintain your <span className="font-bold">product scan history</span> for easy reference</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-[#ABE7B2] rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Improve our AI-powered food recognition and recommendation systems</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-[#ABE7B2] rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Send important updates about our services and your account</span>
            </li>
          </ul>
        </section>

        {/* Advertisements */}
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-l-4 border-[#ABE7B2]">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Advertisements
          </h2>
          <div className="bg-[#CBF3BB] bg-opacity-30 rounded-xl p-6">
            <p className="text-gray-700 leading-relaxed">
              <span className="font-bold text-[#2D5A45]">NutriLiz does not display advertisements.</span> We believe in providing a clean, ad-free experience focused entirely on helping you make healthier food choices. Your data is never sold to advertisers or third-party marketing companies.
            </p>
          </div>
        </section>

        {/* Permissions */}
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-l-4 border-[#CBF3BB]">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            App Permissions
          </h2>
          <p className="text-gray-700 mb-4">
            Our app requires certain permissions to function properly. Here's why we need them:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#93BFC7] text-white">
                  <th className="text-left p-4 rounded-tl-xl font-bold">Permission</th>
                  <th className="text-left p-4 rounded-tr-xl font-bold">Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-[#ECF4E8]">
                  <td className="p-4 font-bold text-[#4A7C59]">Camera</td>
                  <td className="p-4 text-gray-700">Scan product barcodes and capture food images for recognition</td>
                </tr>
                <tr className="bg-white">
                  <td className="p-4 font-bold text-[#4A7C59]">Internet</td>
                  <td className="p-4 text-gray-700">Access product databases and AI services for food analysis</td>
                </tr>
                <tr className="bg-[#ECF4E8]">
                  <td className="p-4 font-bold text-[#4A7C59]">Storage</td>
                  <td className="p-4 text-gray-700">Cache product information for offline access</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-600 text-sm mt-4 italic">
            We do not request or use any SMS, Call Log, or other high-risk permissions.
          </p>
        </section>

        {/* Target Audience */}
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-l-4 border-[#93BFC7]">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Target Audience & Content
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#ECF4E8] rounded-xl p-6">
              <h3 className="font-bold text-[#4A7C59] mb-3">Intended Users</h3>
              <p className="text-gray-700">
                NutriLiz is designed for <span className="font-bold">adults (18+)</span> who want to make informed decisions about their nutrition and dietary choices.
              </p>
            </div>
            <div className="bg-[#ECF4E8] rounded-xl p-6">
              <h3 className="font-bold text-[#4A7C59] mb-3">Content Rating</h3>
              <p className="text-gray-700">
                Our app is rated <span className="font-bold">Everyone</span> and contains no violent, sexual, or inappropriate content. All content is health and nutrition-focused.
              </p>
            </div>
          </div>
        </section>

        {/* Data Security */}
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-l-4 border-[#ABE7B2]">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Data Security
          </h2>
          <p className="text-gray-700 mb-4">
            We implement robust security measures to protect your information:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center bg-[#CBF3BB] bg-opacity-30 rounded-xl p-4">
              <span className="text-2xl mr-3">🔐</span>
              <span className="text-gray-700"><span className="font-bold">Encrypted</span> data transmission (HTTPS/TLS)</span>
            </div>
            <div className="flex items-center bg-[#CBF3BB] bg-opacity-30 rounded-xl p-4">
              <span className="text-2xl mr-3">🛡️</span>
              <span className="text-gray-700"><span className="font-bold">Secure</span> cloud storage with Appwrite</span>
            </div>
            <div className="flex items-center bg-[#CBF3BB] bg-opacity-30 rounded-xl p-4">
              <span className="text-2xl mr-3">🔑</span>
              <span className="text-gray-700"><span className="font-bold">Authentication</span> protocols for account access</span>
            </div>
            <div className="flex items-center bg-[#CBF3BB] bg-opacity-30 rounded-xl p-4">
              <span className="text-2xl mr-3">📋</span>
              <span className="text-gray-700"><span className="font-bold">Regular</span> security audits and updates</span>
            </div>
          </div>
        </section>

        {/* Data Sharing */}
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-l-4 border-[#CBF3BB]">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Data Sharing & Third Parties
          </h2>
          <p className="text-gray-700 mb-4">
            We may share your information with the following trusted services:
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-[#93BFC7] rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span><span className="font-bold">Appwrite</span> - For secure authentication and database services</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-[#93BFC7] rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span><span className="font-bold">Google Gemini AI</span> - For food recognition and nutritional analysis</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-[#93BFC7] rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span><span className="font-bold">Open Food Facts</span> - For product nutritional information</span>
            </li>
          </ul>
          <p className="text-gray-600 text-sm mt-4 italic">
            We never sell your personal data to third parties for marketing purposes.
          </p>
        </section>


        {/* Footer Note */}
        <div className="text-center text-gray-500 text-sm">
          <p>
            This privacy policy is effective as of January 19, 2026 and will remain in effect except with respect to any changes in its provisions in the future, which will be in effect immediately after being posted on this page.
          </p>
          <p className="mt-4 font-bold text-[#4A7C59]">
            © 2026 NutriLiz. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

// 
// NutriLiz is an AI-powered nutrition app that scans packaged food barcodes, fresh products, and food images to help users understand nutrition and health risks.

// Full desc:
// NutriLiz is an Android application that helps users understand what they eat through smart and simple nutrition analysis. The app allows users to scan barcodes of packaged food products using data from Open Food Facts, providing reliable nutritional information for commonly available grocery items. For fresh food products, NutriLiz uses its own database powered by Appwrite to deliver nutrition details for unprocessed foods.

// In addition to barcode scanning, NutriLiz features AI-based food image detection. By capturing an image of a meal, the app uses artificial intelligence to generate estimated nutritional information, making it easier for users to log meals even when barcodes are not available. This combination of barcode scanning and AI image analysis creates a flexible and convenient nutrition tracking experience.

// NutriLiz also includes AI-assisted health risk analysis and health monitoring features that help users become more aware of how their food choices may affect their overall health. With an intuitive interface and clear insights, the app turns complex nutrition data into easy-to-understand information. Developed as a thesis project, NutriLiz demonstrates how artificial intelligence and modern databases can be used to support healthier decision-making in everyday life.