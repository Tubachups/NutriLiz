import { createLazyFileRoute } from '@tanstack/react-router'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'

export const Route = createLazyFileRoute('/Contact')({
  component: ContactUs,
})

function ContactUs() {
  return (
    <div className="min-h-screen bg-[#ECF4E8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2D5A45] mb-4">
            Contact Us
          </h1>
          <p className="text-[#4A7C59] text-lg">
            Have questions? We'd love to hear from you!
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Email Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-[#ABE7B2] p-3 rounded-full mr-4">
                <Mail className="w-6 h-6 text-[#2D5A45]" />
              </div>
              <h2 className="text-xl font-bold text-[#2D5A45]">Email Us</h2>
            </div>
            <p className="text-gray-600 mb-3">Send us an email anytime</p>
            <a 
              href="mailto:nutrilizowgay@gmail.com" 
              className="text-[#4A7C59] font-bold hover:text-[#2D5A45] transition-colors break-all"
            >
              nutrilizowgay@gmail.com
            </a>
          </div>

          {/* Phone Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-[#CBF3BB] p-3 rounded-full mr-4">
                <Phone className="w-6 h-6 text-[#2D5A45]" />
              </div>
              <h2 className="text-xl font-bold text-[#2D5A45]">Call Us</h2>
            </div>
            <a 
              href="tel:+639761641704" 
              className="text-[#4A7C59] font-bold hover:text-[#2D5A45] transition-colors"
            >
              +63 976 164 1704
            </a>
          </div>
        </div>

        {/* Support Info */}
        <div className="bg-gradient-to-r from-[#93BFC7] to-[#ABE7B2] rounded-2xl shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">We're Here to Help</h2>
          <p className="opacity-90 mb-6">
            Whether you have questions about nutrition tracking, need technical support, or want to provide feedback, our team is ready to assist you.
          </p>
          <div className="flex items-center justify-center">
            <Clock className="w-5 h-5 mr-2 opacity-90" />
            <span className="opacity-90">Typical response time: 24-48 hours</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
        </div>
      </div>
    </div>
  )
}