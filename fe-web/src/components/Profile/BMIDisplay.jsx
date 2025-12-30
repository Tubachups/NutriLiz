import React from 'react';

const BMIDisplay = ({ bmi, category }) => {
  if (!bmi) return null;

  return (
    <div className="bg-[#CBF3BB] p-4 rounded-lg mb-4">
      <h3 className="text-lg font-bold text-[#2d5016] mb-1">
        BMI: {bmi} kg/m² {category}
      </h3>
      <p className="text-xs text-[#555] italic">
        Formula: BMI = Weight (kg) ÷ Height² (m)
      </p>
    </div>
  );
};

export default BMIDisplay;