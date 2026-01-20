import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Wallet } from "lucide-react";

interface AddCreditsModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  currentBalance: number;
  onCreditsAdded: () => void;
}

export default function AddCreditsModal({
  open,
  onClose,
  companyId,
  currentBalance,
  onCreditsAdded,
}: AddCreditsModalProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddCredits = async () => {
    const creditAmount = parseFloat(amount);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("add-credits", {
        body: {
          company_id: companyId,
          amount: creditAmount,
          description: description.trim() || `Manual credit addition of $${creditAmount}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Credits added!",
        description: `$${creditAmount} has been added to the wallet`,
      });

      setAmount("");
      setDescription("");
      onCreditsAdded();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error adding credits",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Add Credits
          </DialogTitle>
          <DialogDescription>
            Add credits to the company wallet. Credits are used when inviting new users ($20 per invite).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Balance</span>
              <span className="font-semibold text-primary">${currentBalance.toLocaleString()}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Add ($) *</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="1"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter the dollar amount to add (e.g., 100 = $100)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Reason for adding credits..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm">New Balance</span>
                <span className="font-semibold text-primary">
                  ${(currentBalance + parseFloat(amount)).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAddCredits} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Add Credits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
