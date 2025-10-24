import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { validateSecret, parseOTPAuthUri } from '@/lib/totp';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, ChevronDown, QrCode } from 'lucide-react';
import { QRScannerModal } from './QRScannerModal';

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountAdded: () => void;
}

export function AddAccountModal({ open, onOpenChange, onAccountAdded }: AddAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'uri' | 'qr'>('manual');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const { user } = useAuth();

  // Manual form state
  const [provider, setProvider] = useState('');
  const [accountName, setAccountName] = useState('');
  const [secret, setSecret] = useState('');
  const [algorithm, setAlgorithm] = useState<'SHA1' | 'SHA256' | 'SHA512'>('SHA1');
  const [digits, setDigits] = useState<'6' | '8'>('6');
  const [period, setPeriod] = useState('30');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // URI form state
  const [uri, setUri] = useState('');

  const resetForm = () => {
    setProvider('');
    setAccountName('');
    setSecret('');
    setAlgorithm('SHA1');
    setDigits('6');
    setPeriod('30');
    setUri('');
    setAdvancedOpen(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!provider || !accountName || !secret) {
      toast.error('Please fill in all required fields');
      return;
    }

    const cleanSecret = secret.replace(/\s/g, '').toUpperCase();

    if (!validateSecret(cleanSecret)) {
      toast.error('Invalid secret key format. Must be Base32 encoded.');
      return;
    }

    setLoading(true);

    try {
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const { error } = await supabase.from('auths').insert({
        user_id: user.id,
        provider,
        name: accountName,
        key: cleanSecret,
        algorithm,
        digits: parseInt(digits),
        period: parseInt(period),
      });

      if (error) throw error;

      toast.success('Account added successfully!');
      resetForm();
      onAccountAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  const handleUriSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uri) {
      toast.error('Please enter an OTP Auth URI');
      return;
    }

    const parsed = parseOTPAuthUri(uri);

    if (!parsed) {
      toast.error('Invalid OTP Auth URI format');
      return;
    }

    setLoading(true);

    try {
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const { error } = await supabase.from('auths').insert({
        user_id: user.id,
        provider: parsed.issuer,
        name: parsed.account_name,
        key: parsed.secret,
        algorithm: parsed.algorithm,
        digits: parsed.digits,
        period: parsed.period,
      });

      if (error) throw error;

      toast.success('Account added successfully!');
      resetForm();
      onAccountAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (data: {
    issuer: string;
    account_name: string;
    secret: string;
    algorithm: string;
    digits: number;
    period: number;
  }) => {
    setLoading(true);

    try {
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const { error } = await supabase.from('auths').insert({
        user_id: user.id,
        provider: data.issuer,
        name: data.account_name,
        key: data.secret,
        algorithm: data.algorithm,
        digits: data.digits,
        period: data.period,
      });

      if (error) throw error;

      toast.success('Account added successfully!');
      resetForm();
      onAccountAdded();
      onOpenChange(false);
      setShowQRScanner(false);
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchQRScan = async (accounts: Array<{
    issuer: string;
    account_name: string;
    secret: string;
    algorithm: string;
    digits: number;
    period: number;
  }>) => {
    setLoading(true);

    try {
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const accountsToInsert = accounts.map(account => ({
        user_id: user.id,
        provider: account.issuer,
        name: account.account_name,
        key: account.secret,
        algorithm: account.algorithm,
        digits: account.digits,
        period: account.period,
      }));

      const { error } = await supabase.from('auths').insert(accountsToInsert);

      if (error) throw error;

      toast.success(`Successfully added ${accounts.length} account${accounts.length > 1 ? 's' : ''}!`);
      resetForm();
      onAccountAdded();
      onOpenChange(false);
      setShowQRScanner(false);
    } catch (error) {
      console.error('Error adding accounts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add accounts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
          <DialogDescription>
            Add a new 2FA account to your authenticator
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'manual' | 'uri' | 'qr')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="uri">Import URI</TabsTrigger>
            <TabsTrigger value="qr">Scan QR</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4 mt-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Service Provider *</Label>
                <Input
                  id="provider"
                  placeholder="e.g., Google, GitHub"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="account-name">Account Name *</Label>
                <Input
                  id="account-name"
                  placeholder="e.g., user@example.com"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secret">Secret Key *</Label>
                <Input
                  id="secret"
                  placeholder="Enter Base32 secret key"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  disabled={loading}
                  required
                  className="font-mono"
                />
              </div>
              
              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between" type="button">
                    Advanced Options
                    <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="algorithm">Algorithm</Label>
                    <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as 'SHA1' | 'SHA256' | 'SHA512')}>
                      <SelectTrigger id="algorithm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SHA1">SHA1</SelectItem>
                        <SelectItem value="SHA256">SHA256</SelectItem>
                        <SelectItem value="SHA512">SHA512</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="digits">Digits</Label>
                    <Select value={digits} onValueChange={(v) => setDigits(v as '6' | '8')}>
                      <SelectTrigger id="digits">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 digits</SelectItem>
                        <SelectItem value="8">8 digits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="period">Period (seconds)</Label>
                    <Input
                      id="period"
                      type="number"
                      min="1"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              <DialogFooter>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Account'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="uri" className="space-y-4 mt-4">
            <form onSubmit={handleUriSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uri">OTP Auth URI</Label>
                <Input
                  id="uri"
                  placeholder="otpauth://totp/..."
                  value={uri}
                  onChange={(e) => setUri(e.target.value)}
                  disabled={loading}
                  required
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Paste the complete otpauth:// URI here
                </p>
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import Account'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4 mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload an image containing a QR code to add an account
              </p>

              <Button
                onClick={() => setShowQRScanner(true)}
                className="w-full"
                type="button"
                disabled={loading}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Open QR Scanner
              </Button>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">How to use:</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Take a screenshot of the QR code from the service</li>
                  <li>Click the button above to open the scanner</li>
                  <li>Select the image file to scan</li>
                </ol>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* QR Scanner Modal */}
        <QRScannerModal
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onScan={handleQRScan}
          onBatchScan={handleBatchQRScan}
        />
      </DialogContent>
    </Dialog>
  );
}
