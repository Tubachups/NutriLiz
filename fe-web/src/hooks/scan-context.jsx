import { createContext, useContext, useState, useCallback } from "react";

const ScanContext = createContext(undefined);

export function ScanProvider({ children }) {
  const [productData, setProductData] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  // Update current product data
  const updateProductData = useCallback((data) => {
    setProductData(data);
    if (data && data.barcode) {
      // Add to history if not already present
      setScanHistory((prev) => {
        const exists = prev.some((item) => item.barcode === data.barcode);
        if (!exists) {
          return [{ ...data, scannedAt: new Date().toISOString() }, ...prev];
        }
        return prev;
      });
    }
  }, []);

  // Update assessment for current product
  const updateAssessment = useCallback((data) => {
    setAssessment(data);
  }, []);

  // Clear current scan (but keep history)
  const clearCurrentScan = useCallback(() => {
    setProductData(null);
    setAssessment(null);
  }, []);

  // Clear all data (call this on logout)
  const clearAllScans = useCallback(() => {
    setProductData(null);
    setAssessment(null);
    setScanHistory([]);
  }, []);

  // Load a product from history
  const loadFromHistory = useCallback((barcode) => {
    const historyItem = scanHistory.find((item) => item.barcode === barcode);
    if (historyItem) {
      setProductData(historyItem);
    }
  }, [scanHistory]);

  return (
    <ScanContext.Provider
      value={{
        productData,
        assessment,
        scanHistory,
        updateProductData,
        updateAssessment,
        clearCurrentScan,
        clearAllScans,
        loadFromHistory,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScanContext() {
  const context = useContext(ScanContext);
  if (context === undefined) {
    throw new Error("useScanContext must be used within a ScanProvider");
  }
  return context;
}