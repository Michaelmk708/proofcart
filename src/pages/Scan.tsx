import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QRScanner from '@/components/QRScanner';
import { useNavigate } from 'react-router-dom';

const Scan = () => {
  const navigate = useNavigate();

  const onScan = (serial: string) => {
    // Navigate to verify page with serial number
    navigate(`/verify/${encodeURIComponent(serial)}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-4">Scan Product QR</h1>
        <p className="text-sm text-gray-600 mb-6">Use your device camera to scan product QR code or enter serial number manually.</p>
        <QRScanner onScan={onScan} />
      </main>
      <Footer />
    </div>
  );
};

export default Scan;
