import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/auth-context';
import ProfileHeader from '../components/Profile/ProfileHeader';
import BodyMeasure from '../components/Profile/BodyMeasure';
import BloodTests from '../components/Profile/BloodTests';

export const Route = createLazyFileRoute('/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [sugarLevel, setSugarLevel] = useState('');
  const [cholesterolLevel, setCholesterolLevel] = useState('');
  const [triglycerides, setTriglycerides] = useState('');
  const [creatinine, setCreatinine] = useState('');
  const [uricAcid, setUricAcid] = useState('');

  const { userProfile, updateUserProfile } = useAuth();

  // Load existing profile data on mount
  useEffect(() => {
    if (userProfile) {
      setWeight(userProfile.weight || '');
      setHeight(userProfile.height || '');
      setSugarLevel(userProfile.sugarLevel || '');
      setCholesterolLevel(userProfile.cholesterolLevel || '');
      setTriglycerides(userProfile.triglycerides || '');
      setCreatinine(userProfile.creatinine || '');
      setUricAcid(userProfile.uricAcid || '');
    }
  }, [userProfile]);

  // Calculate BMI whenever weight or height changes
  useEffect(() => {
    if (weight && height) {
      const weightNum = parseFloat(weight);
      const heightNum = parseFloat(height);

      if (weightNum > 0 && heightNum > 0) {
        const heightInMeters = heightNum / 100;
        const calculatedBmi = weightNum / (heightInMeters * heightInMeters);
        setBmi(calculatedBmi.toFixed(1));
      } else {
        setBmi('');
      }
    } else {
      setBmi('');
    }
  }, [weight, height]);

  const getBmiCategory = () => {
    const bmiNum = parseFloat(bmi);
    if (!bmiNum) return '';
    if (bmiNum < 18.5) return '(Underweight)';
    if (bmiNum < 25) return '(Normal)';
    if (bmiNum < 30) return '(Overweight)';
    return '(Obese)';
  };

  const handleSave = async () => {
    if (!weight || !height) {
      // Replaced RN Alert with browser alert
      window.alert('Please enter both weight and height to calculate BMI.');
      return;
    }

    const profileData = {
      weight,
      height,
      bmi,
      bmiCategory: getBmiCategory(),
      sugarLevel: sugarLevel || 'N/A',
      cholesterolLevel: cholesterolLevel || 'N/A',
      triglycerides: triglycerides || 'N/A',
      creatinine: creatinine || 'N/A',
      uricAcid: uricAcid || 'N/A',
    };

    try {
      await updateUserProfile(profileData);
      window.alert('Your health profile has been saved successfully.');
    } catch (error) {
      console.error(error);
      window.alert('Failed to save profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#ECF4E8] py-8 px-4 font-sans">
      <div className="max-w-md mx-auto space-y-4">

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <ProfileHeader />

          <BodyMeasure
            weight={weight}
            setWeight={setWeight}
            height={height}
            setHeight={setHeight}
            bmi={bmi}
            bmiCategory={getBmiCategory()}
          />

          {/* Divider */}
          <hr className="my-6 border-[#ABE7B2]" />

          <BloodTests
            sugarLevel={sugarLevel}
            setSugarLevel={setSugarLevel}
            cholesterolLevel={cholesterolLevel}
            setCholesterolLevel={setCholesterolLevel}
            triglycerides={triglycerides}
            setTriglycerides={setTriglycerides}
            creatinine={creatinine}
            setCreatinine={setCreatinine}
            uricAcid={uricAcid}
            setUricAcid={setUricAcid}
          />

          <button
            onClick={handleSave}
            className="w-full mt-6 bg-[#93BFC7] hover:bg-[#7daab2] text-white font-medium py-2.5 px-4 rounded-lg shadow-sm transition-colors uppercase tracking-wide text-sm"
          >
            Save Profile
          </button>
        </div>

        {/* Info/Tip Section */}
        <div className="bg-[#CBF3BB] rounded-lg p-4 text-center shadow-sm">
          <p className="text-sm text-gray-700">
            💡 Tip: Keep your health metrics updated for personalized nutrition recommendations
          </p>
        </div>

      </div>
    </div>
  );
}
