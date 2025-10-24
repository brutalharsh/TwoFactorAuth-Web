import React, { useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Upload, Camera, X, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { parseOTPAuthUri } from '@/lib/totp';
import { parseMigrationUri, convertMigrationToAccounts } from '@/lib/migration-parser';
import { toast } from 'sonner';
import { Alert, AlertDescription } from './ui/alert';

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
  onBatchScan?: (accounts: Array<{
    issuer: string;
    account_name: string;
    secret: string;
    algorithm: string;
    digits: number;
    period: number;
  }>) => void;
}

export function QRScannerModal({ isOpen, onClose, onScan, onBatchScan }: QRScannerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [detectedAccounts, setDetectedAccounts] = useState<Array<{
    issuer: string;
    account_name: string;
    secret: string;
    algorithm: string;
    digits: number;
    period: number;
  }> | null>(null);

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
        // First, try to parse as migration URI
        const migrationPayload = parseMigrationUri(result.data);

        if (migrationPayload) {
          const accounts = convertMigrationToAccounts(migrationPayload);

          if (accounts.length > 0) {
            setDetectedAccounts(accounts);
            toast.success(`Found ${accounts.length} account${accounts.length > 1 ? 's' : ''} to import`);
          } else {
            toast.error('No valid accounts found in the migration QR code');
          }
        } else {
          // Try to parse as single otpauth:// URI
          const parsed = parseOTPAuthUri(result.data);

          if (parsed) {
            onScan({
              issuer: parsed.issuer,
              account_name: parsed.account_name,
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

  const handleBatchImport = () => {
    if (detectedAccounts && onBatchScan) {
      onBatchScan(detectedAccounts);
      toast.success(`Importing ${detectedAccounts.length} accounts...`);
      handleClose();
    }
  };

  const handleSingleImport = (account: typeof detectedAccounts[0]) => {
    onScan(account);
    handleClose();
  };

  const handleClose = () => {
    setPreviewImage(null);
    setIsProcessing(false);
    setDetectedAccounts(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {detectedAccounts ? `Import ${detectedAccounts.length} Accounts` : 'Scan QR Code'}
          </DialogTitle>
          <DialogDescription>
            {detectedAccounts
              ? 'Review the accounts found in the migration QR code'
              : 'Upload an image containing a QR code from your authenticator app'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {detectedAccounts ? (
            // Show detected accounts from migration
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Found {detectedAccounts.length} account{detectedAccounts.length > 1 ? 's' : ''} to import.
                  {onBatchScan
                    ? ' You can import all at once or select individual accounts.'
                    : ' Click on an account to import it.'}
                </AlertDescription>
              </Alert>

              <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-3">
                {detectedAccounts.map((account, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => !onBatchScan && handleSingleImport(account)}
                  >
                    <div className="font-medium">{account.issuer}</div>
                    <div className="text-sm text-muted-foreground">{account.account_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {account.algorithm} • {account.digits} digits • {account.period}s
                    </div>
                  </div>
                ))}
              </div>

              {onBatchScan && (
                <div className="flex gap-2">
                  <Button onClick={handleBatchImport} className="flex-1">
                    Import All Accounts
                  </Button>
                  <Button variant="outline" onClick={() => setDetectedAccounts(null)}>
                    Scan Different QR
                  </Button>
                </div>
              )}
            </>
          ) : (
            // Original upload interface
            <>
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
                <p className="text-sm font-medium">Supported formats:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Single account QR codes (otpauth://totp/...)</li>
                  <li>Google Authenticator migration QR codes (batch export)</li>
                  <li>Take a screenshot of the QR code and upload it here</li>
                </ul>
              </div>

              {/* Future Camera Support Note */}
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                <Camera className="w-4 h-4" />
                <p className="text-xs">
                  Camera scanning coming soon for mobile devices
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            {detectedAccounts ? 'Cancel' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}