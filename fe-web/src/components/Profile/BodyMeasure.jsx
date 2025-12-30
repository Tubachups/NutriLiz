import React from 'react';
import BMIDisplay from './BMIDisplay';

const BodyMeasure = ({ weight, setWeight, height, setHeight, bmi, bmiCategory }) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-[#93BFC7] mb-3 mt-2">
        Body Measurements
      </h3>

      <MeasureInput
        label="Weight"
        value={weight}
        onChange={setWeight}
        placeholder="e.g., 70"
        suffix="kg"
      />

      <MeasureInput
        label="Height"
        value={height}
        onChange={setHeight}
        placeholder="e.g., 170"
        suffix="cm"
      />

      <BMIDisplay bmi={bmi} category={bmiCategory} />
    </div>
  );
};

// Reusable Helper Component for the inputs
function MeasureInput({ label, value, onChange, placeholder, suffix }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-500 mb-1 ml-1 uppercase tracking-wider">
        {label}
      </label>
      
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-3 pr-12 py-3 bg-white border border-[#ABE7B2] rounded-md text-gray-800 outline-none focus:border-[#93BFC7] focus:ring-1 focus:ring-[#93BFC7] transition-all placeholder:text-gray-400"
        />
        
        {/* The Suffix (kg / cm) */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
          {suffix}
        </span>
      </div>
    </div>
  );
}

export default BodyMeasure;