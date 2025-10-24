import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { generateTOTP, getTimeRemaining, getProgressPercentage, getProgressColor } from '@/lib/totp';
import { toast } from 'sonner';

interface AccountCardProps {
  account: {
    id: string;
    issuer: string;
    account_name: string;
    secret: string;
    algorithm: 'SHA1' | 'SHA256' | 'SHA512';
    digits: 6 | 8;
    period: number;
  };
  onClick: () => void;
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  const [code, setCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updateCode = () => {
      const newCode = generateTOTP({
        secret: account.secret,
        algorithm: account.algorithm,
        digits: account.digits,
        period: account.period,
      });
      setCode(newCode);
    };

    updateCode();
    const interval = setInterval(() => {
      updateCode();
      const remaining = getTimeRemaining(account.period);
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [account]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const progressPercentage = getProgressPercentage(account.period);
  const progressColor = getProgressColor(progressPercentage);

  // Get initials for avatar
  const getInitials = (issuer: string) => {
    return issuer
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-sm">
            {getInitials(account.issuer)}
          </div>
        </div>

        {/* Account Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {account.issuer}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {account.account_name}
          </p>
        </div>

        {/* Code and Timer */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-mono text-2xl font-bold tracking-wider text-primary">
              {code || '------'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-1000 ease-linear"
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor: progressColor,
                  }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground w-6">
                {timeRemaining}s
              </span>
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleCopy}
            className="flex-shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
