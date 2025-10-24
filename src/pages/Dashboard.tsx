import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountCard } from "@/components/AccountCard";
import { AddAccountModal } from "@/components/AddAccountModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Plus, Search, LogOut, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Account {
  id: string;
  user_id: string;
  provider: string; // Previously 'issuer'
  name: string; // Previously 'account_name'
  key: string; // Previously 'secret'
  algorithm: string; // "SHA1" | "SHA256" | "SHA512"
  digits: number; // 6 or 8
  period: number;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = accounts.filter(
        (account) =>
          account.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
          account.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAccounts(filtered);
    } else {
      setFilteredAccounts(accounts);
    }
  }, [searchQuery, accounts]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("auths")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const typedAccounts = (data || []) as Account[];
      setAccounts(typedAccounts);
      setFilteredAccounts(typedAccounts);
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountClick = async (accountId: string) => {
    try {
      await supabase
        .from("auths")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", accountId);
    } catch (error) {
      console.error("Error updating updated_at:", error);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Two Factor Auth</h1>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Search and Add Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button onClick={() => setAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
        </div>

        {/* Accounts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center">
              <div className="p-6 bg-primary/10 rounded-full">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {searchQuery ? "No accounts found" : "No accounts yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try a different search term"
                  : "Get started by adding your first 2FA account"}
              </p>
            </div>
            {!searchQuery && (
              <Button onClick={() => setAddModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Account
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onClick={() => handleAccountClick(account.id)}
              />
            ))}
          </div>
        )}

        {/* Results count */}
        {!loading && filteredAccounts.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </p>
        )}
      </main>

      <AddAccountModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAccountAdded={fetchAccounts}
      />
    </div>
  );
};

export default Dashboard;
