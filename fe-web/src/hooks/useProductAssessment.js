import { useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { useScanContext } from "./scan-context";

const inFlightAssessments = new Map();

const buildAssessmentRequestKey = (barcode, userProfile) =>
  `${barcode || ""}:${JSON.stringify(userProfile || null)}`;

export const useProductAssessment = (barcode) => {
  const { assessment, updateAssessment } = useScanContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { userProfile } = useAuth();
  const requestKey = buildAssessmentRequestKey(barcode, userProfile);

  useEffect(() => {
    if (!barcode) {
      return;
    }

    // If we already have an assessment for this exact barcode/profile combo, don't refetch.
    if (assessment && assessment.barcode === barcode && assessment.requestKey === requestKey) {
      return;
    }

    let isActive = true;
    setError(null);
    setLoading(true);

    const fetchAssessment = async () => {
      try {
        let request = inFlightAssessments.get(requestKey);

        if (!request) {
          const options = userProfile
            ? {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(userProfile),
              }
            : { method: "GET" };

          request = fetch(`http://192.168.100.69:5000/api/assess/${barcode}`, options)
            .then(async (response) => {
              if (!response.ok) {
                throw new Error("Failed to generate assessment");
              }

              return response.json();
            })
            .finally(() => {
              inFlightAssessments.delete(requestKey);
            });

          inFlightAssessments.set(requestKey, request);
        }

        const data = await request;

        if (isActive) {
          updateAssessment({ ...data, barcode, requestKey });
        }
      } catch (err) {
        if (isActive) {
          setError("Failed to generate assessment");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchAssessment();

    return () => {
      isActive = false;
    };
  }, [barcode, userProfile, assessment, requestKey, updateAssessment]);

  return { assessment, loading, error };
};
