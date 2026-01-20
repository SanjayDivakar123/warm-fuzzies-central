import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Wallet, Tag, Check, X } from "lucide-react";

interface AddCreditsModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  currentBalance: number;
  onCreditsAdded: () => void;
}

const VALID_PROMO_CODES: Record<string, { discount: number; description: string }> = {
  "LEADERSWELCOME": { discount: 100, description: "100% off - Free credits!" },
};

export default function AddCreditsModal({
  open,
  onClose,
  companyId,
  currentBalance,
  onCreditsAdded,
}: AddCreditsModalProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const appliedPromo = promoApplied ? VALID_PROMO_CODES[promoApplied] : null;
  const discountPercent = appliedPromo?.discount || 0;
  const creditAmount = parseFloat(amount) || 0;
  const discountAmount = (creditAmount * discountPercent) / 100;
  const finalCost = creditAmount - discountAmount;

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (VALID_PROMO_CODES[code]) {
      setPromoApplied(code);
      setPromoError(null);
      toast({
        title: "Promo code applied!",
        description: VALID_PROMO_CODES[code].description,
      });
    } else {
      setPromoError("Invalid promo code");
      setPromoApplied(null);
    }
  };

  const handleRemovePromo = () => {
    setPromoApplied(null);
    setPromoCode("");
    setPromoError(null);
  };

  const handleAddCredits = async () => {
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
      const promoDescription = promoApplied 
        ? ` (Promo: ${promoApplied} - ${discountPercent}% off, saved $${discountAmount.toFixed(2)})`
        : "";
      
      const { data, error } = await supabase.functions.invoke("add-credits", {
        body: {
          company_id: companyId,
          amount: creditAmount,
          description: (description.trim() || `Manual credit addition of $${creditAmount}`) + promoDescription,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const costMessage = finalCost === 0 
        ? "Free credits added!" 
        : `Cost: $${finalCost.toFixed(2)}`;

      toast({
        title: "Credits added!",
        description: `$${creditAmount} has been added to the wallet. ${costMessage}`,
      });

      setAmount("");
      setDescription("");
      setPromoCode("");
      setPromoApplied(null);
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

  const handleClose = () => {
    setAmount("");
    setDescription("");
    setPromoCode("");
    setPromoApplied(null);
    setPromoError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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

          {/* Promo Code Section */}
          <div className="space-y-2">
            <Label htmlFor="promoCode" className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              Promo Code (Optional)
            </Label>
            {promoApplied ? (
              <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary flex-1">
                  {promoApplied} - {appliedPromo?.description}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePromo}
                  className="h-6 w-6 p-0 hover:bg-destructive/10"
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="promoCode"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoError(null);
                  }}
                  className={promoError ? "border-destructive" : ""}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim()}
                >
                  Apply
                </Button>
              </div>
            )}
            {promoError && (
              <p className="text-xs text-destructive">{promoError}</p>
            )}
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

          {creditAmount > 0 && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span>Credits to add</span>
                <span>${creditAmount.toLocaleString()}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between items-center text-sm text-primary">
                  <span>Discount ({discountPercent}% off)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-medium">Your Cost</span>
                <span className="font-semibold text-primary">
                  {finalCost === 0 ? "FREE" : `$${finalCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm">New Balance</span>
                <span className="font-semibold text-primary">
                  ${(currentBalance + creditAmount).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAddCredits} disabled={loading || creditAmount <= 0}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            {finalCost === 0 ? "Add Free Credits" : `Add Credits ($${finalCost.toFixed(2)})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
