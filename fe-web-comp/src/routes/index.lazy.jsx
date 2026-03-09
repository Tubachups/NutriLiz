import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="min-h-screen bg-[#ECF4E8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-bold text-[#2D5A45] mb-3">
            Welcome to NutriTrace
          </h1>
          <p className="text-lg text-[#4A7C59]">
            Smart nutrition analysis powered by AI — available on Web and Mobile
          </p>
        </header>

        {/* Introduction */}
        <section className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-[#ABE7B2]">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Introduction
          </h2>
          <p className="text-gray-700 leading-relaxed">
            <span className="font-semibold text-[#4A7C59]">NutriTrace</span> is an
            AI-powered nutrition application designed to help users understand
            what they eat through smart and simple nutrition analysis. It supports
            barcode scanning of packaged goods, a fresh-food database, AI-based
            food image detection, personalized health risk assessment, and
            ML-powered product recommendations — all in one accessible platform.
          </p>
        </section>

        {/* Platforms */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-6">
            Available Platforms
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#ECF4E8] rounded-xl p-6">
              <h3 className="font-bold text-[#4A7C59] text-lg mb-2">📱 Mobile App</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Built with <span className="font-semibold">Expo React Native</span>, the mobile app
                supports barcode scanning via device camera, AI food image capture, product detail
                browsing, scan history, and a full health profile — all optimized for on-the-go use.
              </p>
            </div>
            <div className="bg-[#ECF4E8] rounded-xl p-6">
              <h3 className="font-bold text-[#4A7C59] text-lg mb-2">🌐 Web App</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Built with <span className="font-semibold">React and TanStack Router</span>, the web
                app streams live barcode scans from a Raspberry Pi camera, supports AI image search,
                manages scan history, and includes an admin dashboard for user management.
              </p>
            </div>
          </div>
        </section>

        {/* Barcode Scanning */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Barcode Scanning
          </h2>
          <p className="text-gray-700 leading-relaxed">
            NutriTrace scans packaged food product barcodes and retrieves detailed nutritional
            information from <span className="font-semibold">Open Food Facts</span>. On the web
            platform, a live MJPEG video stream from a Raspberry Pi acts as the scanner. On mobile,
            the device camera is used directly. Scan results include Nutri-Score, NOVA group,
            Eco-Score, full nutrient breakdown, ingredients, and allergens.
          </p>
        </section>

        {/* Fresh Food Database */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Fresh Food Database
          </h2>
          <p className="text-gray-700 leading-relaxed">
            For fresh and unprocessed foods not available in Open Food Facts, NutriTrace maintains
            its own database powered by <span className="font-semibold">Appwrite</span>. Users can
            look up and scan fresh produce, meat, dairy, and other whole foods to receive accurate
            nutritional data tailored to local items.
          </p>
        </section>

        {/* AI Image Detection */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            AI-Based Food Image Detection
          </h2>
          <p className="text-gray-700 leading-relaxed">
            NutriTrace uses <span className="font-semibold">Google Gemini 3.1 Flash-Lite</span> to identify food from a captured image. The model returns the food name, estimated serving
            size, per-serving and per-100 g nutritional values, health benefits, potential concerns,
            allergens, and dietary flags (vegetarian, vegan, gluten-free). This makes nutrition
            logging possible even when no barcode is present.
          </p>
        </section>

        {/* product recommendations */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            ML-Powered Product Recommendations
          </h2>
          <p className="text-gray-700 leading-relaxed">
            After scanning a packaged product, NutriTrace generates a list of similar but
            nutritionally comparable alternatives using a <span className="font-semibold">cosine
            similarity</span> model built on nutrient vectors (carbohydrates, protein, fat, sugars,
            fiber, saturated fat, salt, sodium, energy, calcium, and NOVA group). Recommendations
            exclude the scanned product itself and surface healthier or equivalent choices from the
            Open Food Facts catalogue.
          </p>
        </section>

        {/* Health Risk Assessment */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Personalized Health Risk Analysis
          </h2>
          <p className="text-gray-700 leading-relaxed">
            NutriTrace uses <span className="font-semibold">Gemini AI</span> to analyze scanned
            products against each user's personal health profile. The assessment considers the
            product's full nutritional composition alongside the user's BMI category and voluntary
            blood-test data — including blood sugar, cholesterol, triglycerides, creatinine, and
            uric acid levels — to surface relevant health risks and personalized guidance for
            both packaged and fresh foods.
          </p>
        </section>

        {/* User Profile */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Health Profile Management
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Users can build and maintain a personal health profile within NutriTrace. The profile
            includes body measurements (weight and height with automatic BMI calculation) and
            optional blood-test results. This information is stored securely in Appwrite and used
            to personalize health risk assessments.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#ECF4E8] rounded-xl p-4">
              <h3 className="font-bold text-[#4A7C59] mb-1">Body Measurements</h3>
              <p className="text-gray-600 text-sm">Weight, height, and auto-calculated BMI with category classification</p>
            </div>
            <div className="bg-[#ECF4E8] rounded-xl p-4">
              <h3 className="font-bold text-[#4A7C59] mb-1">Blood Test Results</h3>
              <p className="text-gray-600 text-sm">Sugar level, cholesterol, triglycerides, creatinine, and uric acid</p>
            </div>
          </div>
        </section>

        {/* Scan History */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Scan History
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Every product scan is automatically logged to the user's personal history stored in
            Appwrite. Users can review past scans, view full product and nutritional details from
            history, and delete individual or multiple entries. History covers both barcode-scanned
            packaged products and AI-detected food items.
          </p>
        </section>

        {/* Admin Dashboard */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Admin Dashboard
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Administrators have access to a dedicated dashboard (available on both the web and mobile
            platforms) for user management. Admins can browse the full list of registered users, and inspect any user's complete product scan history — all secured through
            role-based access control.
          </p>
        </section>

        {/* Technology Stack */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-6">
            Technology Stack
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Frontend (Web)', value: 'React + TanStack Router' },
              { label: 'Frontend (Mobile)', value: 'Expo React Native' },
              { label: 'Backend', value: 'Python Flask (Raspberry Pi)' },
              { label: 'Database & Auth', value: 'Appwrite' },
              { label: 'AI / Vision', value: 'Google Gemini 3.1 Flash-Lite' },
              { label: 'Food Data', value: 'Open Food Facts API' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#ECF4E8] rounded-xl p-4">
                <p className="text-xs text-[#4A7C59] font-semibold uppercase tracking-wide mb-1">{label}</p>
                <p className="text-gray-800 font-bold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Purpose */}
        <section className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-[#4A7C59]">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Project Purpose
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Developed as a thesis project, NutriTrace demonstrates how artificial intelligence,
            machine learning, and modern cloud databases can be combined to support healthier
            decision-making in everyday life through accessible and personalized nutrition technology.
          </p>
        </section>
      </div>
    </div>
  )
}
