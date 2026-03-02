import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Wallet, Tag, Check, X, AlertTriangle, CreditCard } from "lucide-react";
import { FunctionsHttpError } from "@supabase/supabase-js";

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

function formatPaymentFailureDetails(rawMessage: string | null) {
  const fallback = "Your card could not be charged.";
  const message = (rawMessage || fallback).trim();
  const codeMatch = message.match(/\(([^)]+)\)\s*$/);
  const declineCode = codeMatch?.[1] || null;
  const baseMessage = codeMatch ? message.replace(/\s*\([^)]+\)\s*$/, "").trim() : message;

  return {
    heading: "Payment Unsuccessful",
    primaryReason: baseMessage || fallback,
    declineCode,
    recommendation:
      "No credits were added. Please update your payment method and try the purchase again.",
  };
}

export default function AddCreditsModal({
  open,
  onClose,
  companyId,
  currentBalance,
  onCreditsAdded,
}: AddCreditsModalProps) {
  const [amount, setAmount] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [paymentFailureMessage, setPaymentFailureMessage] = useState<string | null>(null);
  const [updatingPaymentMethod, setUpdatingPaymentMethod] = useState(false);
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

  const handleRequestAddCredits = () => {
    if (isNaN(creditAmount) || creditAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      return;
    }

    // Validate max amount (database has precision limit of 10^8)
    const MAX_CREDIT_AMOUNT = 99999999;
    if (creditAmount > MAX_CREDIT_AMOUNT) {
      toast({
        title: "Amount too large",
        description: `Maximum credit amount is $${MAX_CREDIT_AMOUNT.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleAddCredits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("add-credits", {
        body: {
          company_id: companyId,
          amount: creditAmount,
          charge_amount: finalCost,
          promo_code: promoApplied,
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
      setPromoCode("");
      setPromoApplied(null);
      setShowConfirmDialog(false);
      onCreditsAdded();
      onClose();
    } catch (error: any) {
      let errorMessage = "Failed to process credit purchase. Please try again.";

      if (error instanceof FunctionsHttpError) {
        const payload = await error.context.json().catch(() => null);
        if (payload?.error) {
          errorMessage = payload.error;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      const normalizedMessage = errorMessage.toLowerCase();
      const isPaymentFailure =
        normalizedMessage.includes("payment") ||
        normalizedMessage.includes("card") ||
        normalizedMessage.includes("stripe") ||
        normalizedMessage.includes("declin") ||
        normalizedMessage.includes("insufficient") ||
        normalizedMessage.includes("requires_action");

      if (isPaymentFailure) {
        setPaymentFailureMessage(errorMessage);
      }

      toast({
        title: "Error adding credits",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setPromoCode("");
    setPromoApplied(null);
    setPromoError(null);
    setShowConfirmDialog(false);
    setPaymentFailureMessage(null);
    setUpdatingPaymentMethod(false);
    onClose();
  };

  const handleUpdatePaymentMethod = async () => {
    setUpdatingPaymentMethod(true);
    try {
      const successUrl = new URL(window.location.href);
      successUrl.searchParams.set("payment_setup", "success");

      const cancelUrl = new URL(window.location.href);
      cancelUrl.searchParams.set("payment_setup", "cancelled");

      const { data, error } = await supabase.functions.invoke("manage-payment-method", {
        body: {
          company_id: companyId,
          action: "setup_payment_method",
          success_url: successUrl.toString(),
          cancel_url: cancelUrl.toString(),
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("Could not open payment method setup.");

      window.location.href = data.url;
    } catch (error: any) {
      toast({
        title: "Unable to update payment method",
        description: error?.message || "Please try again from the Billing section.",
        variant: "destructive",
      });
      setUpdatingPaymentMethod(false);
    }
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
            Purchase wallet credits. Your card on file will be charged the purchase amount.{" "}
            <span className="text-destructive font-medium">Credits are non-refundable.</span>
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
          <Button onClick={handleRequestAddCredits} disabled={loading || creditAmount <= 0}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            {finalCost === 0 ? "Add Free Credits" : `Purchase Credits ($${finalCost.toFixed(2)})`}
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Credit Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              This will purchase ${creditAmount.toFixed(2)} in wallet credits and charge your card on file{" "}
              {finalCost === 0 ? "for $0.00." : `for $${finalCost.toFixed(2)}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddCredits} disabled={loading}>
              {loading ? "Processing..." : "Confirm Purchase"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(paymentFailureMessage)}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentFailureMessage(null);
          }
        }}
      >
        <AlertDialogContent>
          {(() => {
            const details = formatPaymentFailureDetails(paymentFailureMessage);
            return (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    {details.heading}
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3 text-sm">
                      <p className="text-foreground/90">{details.primaryReason}</p>
                      {details.declineCode && (
                        <div className="inline-flex items-center rounded-md border bg-muted/40 px-2.5 py-1 text-xs font-medium">
                          Decline code: {details.declineCode}
                        </div>
                      )}
                      <p className="text-muted-foreground">{details.recommendation}</p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={updatingPaymentMethod}>Close</AlertDialogCancel>
                  <Button onClick={handleUpdatePaymentMethod} disabled={updatingPaymentMethod}>
                    {updatingPaymentMethod ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Update Payment Method
                  </Button>
                </AlertDialogFooter>
              </>
            );
          })()}
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
