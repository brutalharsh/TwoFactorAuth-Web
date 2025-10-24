import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { validateSecret } from '@/lib/totp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ChevronDown } from 'lucide-react';

interface EditAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountUpdated: () => void;
  account: {
    id: string;
    issuer: string;
    account_name: string;
    secret: string;
    algorithm: 'SHA1' | 'SHA256' | 'SHA512';
    digits: 6 | 8;
    period: number;
  } | null;
}

export function EditAccountModal({ open, onOpenChange, onAccountUpdated, account }: EditAccountModalProps) {
  const [loading, setLoading] = useState(false);

  // Form state
  const [issuer, setIssuer] = useState('');
  const [accountName, setAccountName] = useState('');
  const [secret, setSecret] = useState('');
  const [algorithm, setAlgorithm] = useState<'SHA1' | 'SHA256' | 'SHA512'>('SHA1');
  const [digits, setDigits] = useState<'6' | '8'>('6');
  const [period, setPeriod] = useState('30');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Load account data when modal opens or account changes
  useEffect(() => {
    if (account) {
      setIssuer(account.issuer || '');
      setAccountName(account.account_name || '');
      setSecret(account.secret || '');
      setAlgorithm(account.algorithm || 'SHA1');
      setDigits((account.digits?.toString() || '6') as '6' | '8');
      setPeriod(account.period?.toString() || '30');
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) return;

    if (!issuer || !accountName || !secret) {
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
      const { error } = await supabase
        .from('accounts')
        .update({
          issuer,
          account_name: accountName,
          secret: cleanSecret,
          algorithm,
          digits: parseInt(digits),
          period: parseInt(period),
        })
        .eq('id', account.id);

      if (error) throw error;

      toast.success('Account updated successfully!');
      onAccountUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!account) return;

    if (!confirm(`Are you sure you want to delete the account "${issuer}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', account.id);

      if (error) throw error;

      toast.success('Account deleted successfully!');
      onAccountUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>
            Update the details for your 2FA account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-issuer">Service Provider *</Label>
            <Input
              id="edit-issuer"
              placeholder="e.g., Google, GitHub"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-account-name">Account Name *</Label>
            <Input
              id="edit-account-name"
              placeholder="e.g., user@example.com"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-secret">Secret Key *</Label>
            <Input
              id="edit-secret"
              placeholder="Enter Base32 secret key"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              disabled={loading}
              required
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Warning: Changing the secret key will generate different codes
            </p>
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
                <Label htmlFor="edit-algorithm">Algorithm</Label>
                <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as 'SHA1' | 'SHA256' | 'SHA512')}>
                  <SelectTrigger id="edit-algorithm">
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
                <Label htmlFor="edit-digits">Digits</Label>
                <Select value={digits} onValueChange={(v) => setDigits(v as '6' | '8')}>
                  <SelectTrigger id="edit-digits">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 digits</SelectItem>
                    <SelectItem value="8">8 digits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-period">Period (seconds)</Label>
                <Input
                  id="edit-period"
                  type="number"
                  min="1"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  disabled={loading}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter className="flex justify-between gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}