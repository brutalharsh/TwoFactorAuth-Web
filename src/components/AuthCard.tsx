import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateTOTP } from '@/lib/totp';

interface AuthCardProps {
  auth: {
    id: number;
    provider: string;
    name: string;
    key: string;
    algorithm: string;
    digits: number;
    period: number;
  };
  onDelete: (id: number) => void;
}

export function AuthCard({ auth, onDelete }: AuthCardProps) {
  const [code, setCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const updateCode = () => {
      const result = generateTOTP(
        auth.key,
        auth.algorithm as 'SHA1' | 'SHA256' | 'SHA512',
        auth.digits as 6 | 8,
        auth.period
      );
      setCode(result.code);
      setTimeRemaining(result.timeRemaining);
    };

    updateCode();
    const interval = setInterval(updateCode, 1000);

    return () => clearInterval(interval);
  }, [auth]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const handleDelete = () => {
    onDelete(auth.id);
    setDeleteDialogOpen(false);
  };

  const progress = (timeRemaining / auth.period) * 100;

  return (
    <>
      <Card className="transition-all hover:shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-lg">{auth.provider}</p>
                <span className="text-sm text-muted-foreground">•</span>
                <p className="text-sm text-muted-foreground">{auth.name}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xl tracking-wider">
                    {code.slice(0, 3)} {code.slice(3)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyCode}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Progress value={progress} className="w-20 h-2" />
                  <span className="text-xs text-muted-foreground w-8">
                    {timeRemaining}s
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Authenticator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this authenticator? This action cannot be undone.
              <br />
              <br />
              <strong>{auth.provider}</strong> - {auth.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}