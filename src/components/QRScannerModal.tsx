import React, { useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Upload, Camera, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { parseOTPAuthUri } from '@/lib/totp';
import { toast } from 'sonner';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: {
    issuer: string;
    account_name: string;
    secret: string;
    algorithm: string;
    digits: number;
    period: number;
  }) => void;
}

export function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsProcessing(true);
    setPreviewImage(URL.createObjectURL(file));

    try {
      // Use QrScanner to decode the QR code from the image
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      });

      if (result?.data) {
        // Parse the otpauth:// URI
        const parsed = parseOTPAuthUri(result.data);

        if (parsed) {
          onScan({
            issuer: parsed.issuer,
            account_name: parsed.account,
            secret: parsed.secret,
            algorithm: parsed.algorithm,
            digits: parsed.digits,
            period: parsed.period,
          });
          toast.success('QR code scanned successfully!');
          handleClose();
        } else {
          toast.error('Invalid QR code format. Please use a valid authenticator QR code.');
        }
      } else {
        toast.error('No QR code found in the image');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      toast.error('Failed to scan QR code. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setPreviewImage(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>
            Upload an image containing a QR code from your authenticator app
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isProcessing}
            />

            {previewImage ? (
              <div className="space-y-4">
                <img
                  src={previewImage}
                  alt="QR Code preview"
                  className="max-w-full max-h-[200px] mx-auto rounded-lg"
                />
                {isProcessing && (
                  <p className="text-sm text-muted-foreground">Processing QR code...</p>
                )}
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload QR code image</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports PNG, JPG, and other image formats
                </p>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">How to scan:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Take a screenshot of the QR code from the service you want to add</li>
              <li>Click the upload area above and select the image</li>
              <li>The QR code will be automatically detected and parsed</li>
            </ol>
          </div>

          {/* Future Camera Support Note */}
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
            <Camera className="w-4 h-4" />
            <p className="text-xs">
              Camera scanning coming soon for mobile devices
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}