import React from 'react';

const BloodTests = ({
  sugarLevel,
  setSugarLevel,
  cholesterolLevel,
  setCholesterolLevel,
  triglycerides,
  setTriglycerides,
  creatinine,
  setCreatinine,
  uricAcid,
  setUricAcid,
}) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-[#93BFC7] mb-3 mt-2">
        Blood Tests
      </h3>

      <TestInput
        label="Blood Sugar"
        value={sugarLevel}
        onChange={setSugarLevel}
        placeholder="e.g., 95"
      />

      <TestInput
        label="Cholesterol"
        value={cholesterolLevel}
        onChange={setCholesterolLevel}
        placeholder="e.g., 180"
      />

      <TestInput
        label="Triglycerides"
        value={triglycerides}
        onChange={setTriglycerides}
        placeholder="e.g., 150"
      />

      <TestInput
        label="Creatinine"
        value={creatinine}
        onChange={setCreatinine}
        placeholder="e.g., 1.0"
      />

      <TestInput
        label="Uric Acid"
        value={uricAcid}
        onChange={setUricAcid}
        placeholder="e.g., 5.5"
      />
    </div>
  );
};

// Reusable Helper Component for consistent styling
function TestInput({ label, value, onChange, placeholder }) {
  return (
    <div className="mb-4 group">
      <label className="block text-xs font-medium text-gray-500 mb-1 ml-1 uppercase tracking-wider">
        {label}
      </label>
      
      <div className="relative">
        <input
          type="number"
          value={value}
          // Web inputs pass an event, so we extract the value here
          onChange={(e) => onChange(e.target.value)} 
          placeholder={placeholder}
          className="w-full pl-3 pr-16 py-3 bg-white border border-[#ABE7B2] rounded-md text-gray-800 outline-none focus:border-[#93BFC7] focus:ring-1 focus:ring-[#93BFC7] transition-all placeholder:text-gray-400"
        />
        
        {/* The 'Affix' (Suffix) */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
          mg/dL
        </span>
      </div>
    </div>
  );
}

export default BloodTests;