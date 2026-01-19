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
            Welcome to NutriLiz
          </h1>
          <p className="text-lg text-[#4A7C59]">
            Smart nutrition analysis powered by AI
          </p>
        </header>

        {/* Introduction */}
        <section className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-[#ABE7B2]">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Introduction
          </h2>
          <p className="text-gray-700 leading-relaxed">
            <span className="font-semibold text-[#4A7C59]">NutriLiz</span> is an
            AI-powered nutrition application designed to help users understand
            what they eat through smart and simple nutrition analysis. It
            supports barcode scanning, fresh food lookup, and AI-based food
            image detection to provide accessible and reliable nutritional
            insights.
          </p>
        </section>

        {/* System Overview */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            System Overview
          </h2>
          <p className="text-gray-700 leading-relaxed">
            NutriLiz allows users to scan barcodes of packaged food products
            using data from Open Food Facts, ensuring accurate nutritional
            information for commonly available grocery items. For fresh and
            unprocessed foods, the application relies on its own database
            powered by Appwrite to deliver detailed nutrition data.
          </p>
        </section>

        {/* AI Image Detection */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            AI-Based Food Image Detection
          </h2>
          <p className="text-gray-700 leading-relaxed">
            In addition to barcode scanning, NutriLiz features AI-based food
            image detection. By capturing an image of a meal, the system
            generates estimated nutritional information, making it easier for
            users to log meals even when barcodes are unavailable. This creates
            a flexible and convenient nutrition tracking experience.
          </p>
        </section>

        {/* Health Analysis */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Health Risk Analysis
          </h2>
          <p className="text-gray-700 leading-relaxed">
            NutriLiz includes AI-assisted health risk analysis and monitoring
            features that help users become more aware of how their food
            choices may affect their overall health. The application transforms
            complex nutrition data into clear, easy-to-understand insights.
          </p>
        </section>

        {/* Purpose */}
        <section className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-[#4A7C59]">
          <h2 className="text-2xl font-bold text-[#2D5A45] mb-4">
            Project Purpose
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Developed as a thesis project, NutriLiz demonstrates how artificial
            intelligence and modern databases can be used to support healthier
            decision-making in everyday life through accessible nutrition
            technology.
          </p>
        </section>
      </div>
    </div>
  )
}
