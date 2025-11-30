import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProvenanceDashboard from "./ProvenanceDashboard";

const Verify = () => {
  const { serial } = useParams<{ serial?: string }>();

  useEffect(() => {
    console.log('🔗 Verify page loaded with serial:', serial);
  }, [serial]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {serial ? (
        <ProvenanceDashboard />
      ) : (
        <div className="flex-1 bg-gradient-to-br from-yellow-50 via-white to-green-50 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">No Serial Number Provided</h1>
            <p className="text-gray-600">
              Please scan a product QR code or enter a serial number to view product provenance.
            </p>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Verify;
