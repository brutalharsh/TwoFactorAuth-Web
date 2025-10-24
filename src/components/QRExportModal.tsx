import React from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { generateOTPAuthUri } from '@/lib/totp';
import { toast } from 'sonner';

interface QRExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: {
    issuer: string;
    account_name: string;
    secret: string;
    algorithm: string;
    digits: number;
    period: number;
  };
}

export function QRExportModal({ isOpen, onClose, account }: QRExportModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('');

  React.useEffect(() => {
    if (isOpen && account) {
      // Generate the otpauth:// URI
      const uri = generateOTPAuthUri({
        issuer: account.issuer,
        account: account.account_name,
        secret: account.secret,
        algorithm: account.algorithm,
        digits: account.digits,
        period: account.period,
      });

      // Generate QR code
      QRCode.toDataURL(uri, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 256,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then(setQrCodeUrl)
        .catch((error) => {
          console.error('Failed to generate QR code:', error);
          toast.error('Failed to generate QR code');
        });
    }
  }, [isOpen, account]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${account.issuer}_${account.account_name}_2FA.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Export Account</DialogTitle>
          <DialogDescription>
            Scan this QR code with another authenticator app to add this account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Display */}
          {qrCodeUrl && (
            <div className="bg-white p-4 rounded-lg flex justify-center">
              <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
            </div>
          )}

          {/* Account Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium">{account.issuer}</span>

              <span className="text-muted-foreground">Account:</span>
              <span className="font-medium">{account.account_name}</span>

              <span className="text-muted-foreground">Algorithm:</span>
              <span className="font-medium">{account.algorithm}</span>

              <span className="text-muted-foreground">Digits:</span>
              <span className="font-medium">{account.digits}</span>
            </div>
          </div>

          {/* Security Warning */}
          <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg p-3">
            <p className="text-xs">
              ⚠️ Keep this QR code secure. Anyone who scans it will be able to generate codes for this account.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}