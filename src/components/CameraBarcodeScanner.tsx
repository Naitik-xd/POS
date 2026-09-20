import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Zap, CheckCircle2, Scan } from 'lucide-react';
import { Product } from '../types';

interface CameraBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
  products?: Product[];
}

export const CameraBarcodeScanner: React.FC<CameraBarcodeScannerProps> = ({
  isOpen,
  onClose,
  onDetected,
  products = [],
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    let isMounted = true;
    setCameraError(null);
    setScanning(true);

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera device API is not supported in this browser environment.');
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch((e) => console.warn('Video play caught:', e));
        }

        // Check torch capability
        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as any;
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      } catch (err: any) {
        console.warn('Camera access issue:', err);
        if (isMounted) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setCameraError('Camera permission was denied. Please allow camera access in browser settings.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setCameraError('No camera found on this device. You can use the quick barcode presets below.');
          } else {
            setCameraError(err.message || 'Unable to open camera stream. Please use manual barcode entry or presets.');
          }
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen]);

  // Barcode Detection Loop (Using native BarcodeDetector if available)
  useEffect(() => {
    if (!isOpen || !stream || !videoRef.current) return;

    let active = true;
    let animationFrameId: number;

    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    let detector: any = null;

    if (BarcodeDetectorClass) {
      try {
        detector = new BarcodeDetectorClass({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code'],
        });
      } catch (e) {
        console.warn('BarcodeDetector format setup:', e);
      }
    }

    const scanFrame = async () => {
      if (!active || !videoRef.current) return;

      if (detector && videoRef.current.readyState === 4) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0 && active) {
            const raw = barcodes[0].rawValue;
            if (raw) {
              handleBarcodeSuccess(raw);
              return;
            }
          }
        } catch (err) {
          // ignore transient detection errors
        }
      }

      if (active) {
        animationFrameId = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameId = requestAnimationFrame(scanFrame);

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setScanning(false);
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !isTorchOn }],
      });
      setIsTorchOn(!isTorchOn);
    } catch (e) {
      console.warn('Torch failed:', e);
    }
  };

  const handleBarcodeSuccess = (barcode: string) => {
    setLastScanned(barcode);
    onDetected(barcode);
    stopCamera();
    setTimeout(() => {
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Live Camera Barcode Scanner</h3>
              <p className="text-[11px] text-zinc-500">Hold product barcode steadily in front of lens</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-xl text-xs font-semibold transition ${
                  isTorchOn
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
                title="Toggle Torch"
              >
                <Zap className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder Body */}
        <div className="relative bg-black w-full aspect-4/3 flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-white space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <div className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed">
                {cameraError}
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Laser and Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-40 border-2 border-dashed border-emerald-400/80 rounded-2xl relative">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                  {/* Animated red/emerald laser scanning sweep */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </div>
              </div>
            </>
          )}

          {lastScanned && (
            <div className="absolute bottom-3 inset-x-4 bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg animate-in slide-in-from-bottom-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Scanned #{lastScanned}</span>
            </div>
          )}
        </div>

        {/* Quick Sample Scan Presets (Zero friction fallback for fast testing & dev) */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Quick Scan Test / Barcode Presets:
            </span>
            <span className="text-[10px] text-zinc-400">Click to instantly scan</span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {products.slice(0, 8).map((p) => (
              <button
                key={p.id}
                onClick={() => handleBarcodeSuccess(p.barcode)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5 shadow-2xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
              >
                <Scan className="w-3 h-3 text-emerald-600" />
                <span className="font-mono font-bold text-zinc-900 dark:text-white">{p.barcode}</span>
                <span className="text-zinc-400 truncate max-w-[90px]">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
