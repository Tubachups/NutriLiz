import { useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { useScanContext } from "./scan-context";

export const useProductAssessment = (barcode) => {
  const { assessment, updateAssessment } = useScanContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    // If we already have an assessment for this barcode, don't refetch
    if (assessment && assessment.barcode === barcode) {
      return;
    }

    setError(null);

    if (!barcode) {
      return;
    }

    const fetchAssessment = async () => {
      setLoading(true);

      try {
        const options = userProfile
          ? {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(userProfile),
            }
          : { method: 'GET' };

        const response = await fetch(
          `http://192.168.100.69:5000/api/assess/${barcode}`,
          options
        );

        if (response.ok) {
          const data = await response.json();
          // Store barcode with assessment for comparison
          updateAssessment({ ...data, barcode });
        } else {
          setError('Failed to generate assessment');
        }
      } catch (err) {
        setError('Failed to generate assessment');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [barcode, userProfile, assessment, updateAssessment]);

  return { assessment, loading, error };
};