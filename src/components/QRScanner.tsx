import React, { useEffect, useRef, useState } from 'react';
import { apiService } from '@/lib/api';
import { useAppState } from '@/contexts/AppStateContext';
import { verifyNFTOnChain } from '@/lib/wallet/solana';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAppState } from '@/contexts/AppStateContext';

interface QRScannerProps {
  onScan?: (serial: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanInterval = useRef<number | null>(null);
  const [lastSerial, setLastSerial] = useState<string | null>(null);
  const { state, actions } = useAppState();
  const { nftVerification } = state;
  const { setNftVerification } = actions;
  const [processing, setProcessing] = useState(false);

  // Lightweight types for Web NFC event handling
  type NdefRecordLike = { data?: ArrayBuffer | DataView | string; recordType?: string };
  type NdefReadingEventLike = { message: { records: Array<NdefRecordLike> } };

  // Central handler for any serial (QR, NFC, or manual input)
  const handleFoundSerial = React.useCallback(async (serial: string) => {
    if (!serial) return;
    if (processing) return;
    if (serial === lastSerial) {
      if (onScan) onScan(serial);
      return;
    }
    setProcessing(true);
    try {
      const response = await apiService.verifyProduct(serial);
      if (response?.nft_data?.nft_contract_address) {
        const onChain = await verifyNFTOnChain(response.nft_data.nft_contract_address);
        setNftVerification(serial, { verified: !!response.exists && !!onChain.exists, metadata: { ...response.nft_data, onChain } });
      } else {
        setNftVerification(serial, { verified: !!response.exists, metadata: response.nft_data });
      }
      setLastSerial(serial);
      if (onScan) onScan(serial);
      toast.success('Product scanned. Showing verification panel...');
    } catch (err) {
      console.error('Scan verify error', err);
      toast.error('Verify failed. Please enter serial manually');
    }
    setProcessing(false);
  }, [processing, lastSerial, onScan, setNftVerification]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const scanFrame = async () => {
      try {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Lazy import a lightweight QR decode library if available
        const ZXing = await import('@zxing/library').catch(() => null);
        const BrowserQRCodeReader = (ZXing as any)?.BrowserQRCodeReader;
        if (BrowserQRCodeReader) {
          // Use the library for best performance
          try {
            const codeReader = new BrowserQRCodeReader();
            const result = await codeReader.decodeFromCanvas(canvas);
            if (result?.text) {
              handleFoundSerial(result.text.trim());
            }
          } catch (err) {
            // Decoding often fails when no QR is present; ignore
          }
        } else {
          // Fallback to manual detection: no-op here, user can paste serial manually
        }
      } catch (error) {
        // ignore decode failures - common when no QR code is present
      }
    };

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        scanInterval.current = window.setInterval(scanFrame, 500);
      } catch (err) {
        console.warn('Camera not available:', err);
      }
    };

    startCamera();

    // handler lives at component scope

    return () => {
      if (scanInterval.current) {
        clearInterval(scanInterval.current);
        scanInterval.current = null;
      }
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [onScan, handleFoundSerial]);

  return (
    <div className="space-y-4">
      <div className="w-full bg-black rounded overflow-hidden">
        <video ref={videoRef} className="w-full h-72 object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => {
          const input = window.prompt('Paste serial or NFT ID to verify');
          if (!input) return;
          handleFoundSerial(input.trim());
        }}>Enter Serial Manually</Button>
        <Button variant="outline" onClick={() => { if (videoRef.current) { videoRef.current.pause(); } }}>Pause</Button>
        <Button variant="outline" onClick={async () => {
          // Attempt Web NFC read
          if ('NDEFReader' in window) {
              try {
                  type NDEFReaderConstructor = new () => { scan: () => Promise<void>; onreading?: (ev: NdefReadingEventLike) => void };
                  const NDEFReaderCtor = (window as unknown as { NDEFReader?: NDEFReaderConstructor }).NDEFReader;
                  if (!NDEFReaderCtor) {
                    toast.error('Web NFC not available');
                    return;
                  }
                  const ndef = new NDEFReaderCtor();
                  await ndef.scan();
                  ndef.onreading = (event: NdefReadingEventLike) => {
                      try {
                        const record = event.message.records && event.message.records[0];
                        let serial = '';
                        if (record) {
                          if (record.data) {
                            // record.data might be ArrayBuffer or DataView
                            try {
                              if (record.data instanceof ArrayBuffer) serial = new TextDecoder().decode(record.data);
                              else if (record.data instanceof DataView) serial = new TextDecoder().decode(record.data.buffer);
                              else if (typeof record.data === 'string') serial = record.data;
                            } catch (e) {
                              console.warn('NFC data decode failed', e);
                            }
                          }
                          if (!serial) serial = record.recordType || '';
                        }
                        // If serial is present, process it
                        if (serial) {
                          handleFoundSerial(serial.trim());
                        }
                      } catch (err) {
                        console.error('NFC reading error', err);
                      }
              };
            } catch (error) {
              console.error('NFC read error', error);
              toast.error('NFC scanning failed or not supported');
            }
          } else {
            toast.error('Web NFC not supported on this device/browser');
          }
        }}>Scan NFC</Button>
      </div>
      {/* Small verification panel for last scanned serial */}
      {lastSerial && (
        <div className="mt-4 p-3 border rounded bg-white shadow-sm flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded overflow-hidden">
            {nftVerification[lastSerial]?.metadata?.image ? (
              <img src={nftVerification[lastSerial]!.metadata.image} alt="thumb" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{nftVerification[lastSerial]?.metadata?.name || lastSerial}</div>
            <div className="text-xs text-gray-500">{nftVerification[lastSerial]?.metadata?.seller_name || nftVerification[lastSerial]?.metadata?.seller || ''}</div>
            <div className="mt-1 text-xs">
              {nftVerification[lastSerial]?.verified ? (
                <span className="text-green-600">Verified</span>
              ) : (
                <span className="text-red-600">Not Verified</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.open(`/verify/${encodeURIComponent(lastSerial)}`, '_self')}>View</Button>
            <Button variant="outline" size="sm" onClick={() => setLastSerial(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
