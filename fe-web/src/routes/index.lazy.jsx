import { createLazyFileRoute } from '@tanstack/react-router'
import { useAuth } from '../hooks/auth-context'

export const Route = createLazyFileRoute('/')({
  component: Home,
})

function Home() {
  const { user, userProfile } = useAuth();
  const hasProfileData = userProfile?.weight && userProfile?.height;


  return (
    <div className="min-h-screen bg-[#ECF4E8] py-5 px-4 font-sans">
      {/* Container to mimic mobile width on desktop */}
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col items-center mb-8">
          <h1 className="text-4xl font-bold text-[#93BFC7] mb-2">NutriLiz</h1>
          <p className="text-base text-gray-600">Your Nutrition Companion</p>
          {user && (
            <p className="text-lg font-semibold text-[#2d5016] mt-3">
              Hello, {user.name}!
            </p>
          )}
        </header>

        {/* Profile Card */}
        {hasProfileData && (
          <div className="bg-white rounded-xl shadow-md p-5 mb-6">
            <h2 className="text-xl font-bold text-[#93BFC7] mb-4">
              Your Health Profile
            </h2>

            {/* Body Measurements Section */}
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-600 mb-2 border-b border-[#ABE7B2] pb-1">
                Body Measurements
              </h3>
              
              <DataRow label="Weight" value={`${userProfile.weight} kg`} />
              <DataRow label="Height" value={`${userProfile.height} cm`} />
              
              <div className="flex justify-between py-1.5">
                <span className="text-sm font-medium text-gray-500">BMI:</span>
                <span className="text-sm font-semibold text-[#2d5016]">
                  {userProfile.bmi} kg/m² {userProfile.bmiCategory}
                </span>
              </div>
            </div>

            {/* Blood Tests Section */}
            <div>
              <h3 className="text-base font-semibold text-gray-600 mb-2 border-b border-[#ABE7B2] pb-1">
                Blood Tests
              </h3>
              <DataRow 
                label="Blood Sugar" 
                value={`${userProfile.sugarLevel} ${userProfile.sugarLevel !== 'N/A' ? 'mg/dL' : ''}`} 
              />
              <DataRow 
                label="Cholesterol" 
                value={`${userProfile.cholesterolLevel} ${userProfile.cholesterolLevel !== 'N/A' ? 'mg/dL' : ''}`} 
              />
              <DataRow 
                label="Triglycerides" 
                value={`${userProfile.triglycerides} ${userProfile.triglycerides !== 'N/A' ? 'mg/dL' : ''}`} 
              />
              <DataRow 
                label="Creatinine" 
                value={`${userProfile.creatinine} ${userProfile.creatinine !== 'N/A' ? 'mg/dL' : ''}`} 
              />
              <DataRow 
                label="Uric Acid" 
                value={`${userProfile.uricAcid} ${userProfile.uricAcid !== 'N/A' ? 'mg/dL' : ''}`} 
              />
            </div>
          </div>
        )}

        {/* Welcome Content / Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            Welcome to NutriLiz!
          </h2>
          <p className="text-base text-gray-600 mb-3">
            Track your nutrition and make healthier choices.
          </p>

          {!hasProfileData && (
            <p className="text-sm text-[#93BFC7] italic mb-4">
              👉 Go to Profile tab to set up your health metrics
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for displaying data rows
function DataRow({ label, value }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm font-medium text-gray-500">{label}:</span>
      <span className="text-sm font-semibold text-[#2d5016]">{value}</span>
    </div>
  );
}