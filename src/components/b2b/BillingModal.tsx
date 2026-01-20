import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Minus, CreditCard, Users, Tag } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface BillingModalProps {
  open: boolean;
  onClose: () => void;
  company: any;
  onSeatsUpdated: () => void;
}

const PRICE_PER_SEAT = 20;
const PROMO_CODE = 'LEADERSWELCOME';
const MAX_SEATS_ALLOWED = 20000;

export default function BillingModal({ open, onClose, company, onSeatsUpdated }: BillingModalProps) {
  const [additionalSeats, setAdditionalSeats] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const currentSeats = company.seats_purchased || 0;
  const isUnlimitedCompany = company.name === "RoleColorFinder LLC";
  const maxAddable = isUnlimitedCompany ? Infinity : Math.max(0, MAX_SEATS_ALLOWED - currentSeats);
  const newTotal = currentSeats + additionalSeats;
  const currentSeatsDisplay = isUnlimitedCompany ? '∞' : currentSeats;
  
  const isPromoValid = promoCode.toUpperCase().trim() === PROMO_CODE;
  const additionalCost = isPromoValid ? 0 : additionalSeats * PRICE_PER_SEAT;

  const handleIncrement = () => {
    if (isUnlimitedCompany || additionalSeats < maxAddable) {
      setAdditionalSeats(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    setAdditionalSeats(prev => Math.max(0, prev - 1));
  };

  const handleSeatsInputChange = (value: number) => {
    if (isUnlimitedCompany) {
      setAdditionalSeats(Math.max(0, value));
    } else {
      setAdditionalSeats(Math.max(0, Math.min(value, maxAddable)));
    }
  };

  const handleAddSeats = async () => {
    if (additionalSeats <= 0) return;

    setSaving(true);
    try {
      // If promo code is valid, add seats directly (free)
      if (isPromoValid) {
        const { error } = await supabase
          .from('companies')
          .update({ seats_purchased: newTotal })
          .eq('id', company.id);

        if (error) throw error;

        toast({
          title: 'Seats added for free!',
          description: `Promo code applied! You now have ${newTotal} seats.`,
        });

        onSeatsUpdated();
        setAdditionalSeats(0);
        setPromoCode('');
        onClose();
        return;
      }

      // Otherwise, redirect to Stripe checkout
      const { data, error } = await supabase.functions.invoke('add-seats-payment', {
        body: {
          companyId: company.id,
          companyName: company.name,
          additionalSeats,
          currentSeats,
          successUrl: `${window.location.origin}/b2b/company-portal?seats_added=true`,
          cancelUrl: `${window.location.origin}/b2b/company-portal`,
        },
      });

      if (error) {
        if (error instanceof FunctionsHttpError) {
          const payload = await error.context.json().catch(() => null);
          if (payload?.error) throw new Error(payload.error);
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Add seats error:', error);
      toast({
        title: 'Error adding seats',
        description: error.message || 'Failed to process. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Manage Billing
          </DialogTitle>
          <DialogDescription>
            Add more seats for your team members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Plan Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Seats</span>
              <span className="font-semibold text-lg">{currentSeatsDisplay}</span>
            </div>
            {!isUnlimitedCompany && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Price per Seat</span>
                <span className="font-medium">${PRICE_PER_SEAT} (one-time)</span>
              </div>
            )}
          </div>

          {isUnlimitedCompany ? (
            /* Unlimited company message */
            <div className="text-center py-6 space-y-3">
              <div className="text-4xl">∞</div>
              <p className="text-muted-foreground">
                Your company has unlimited seats. No additional purchases needed.
              </p>
              <Button variant="outline" onClick={onClose} className="mt-4">
                Close
              </Button>
            </div>
          ) : (
            <>
              <Separator />

              {/* Add Seats Section */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Add More Seats</Label>
                
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDecrement}
                    disabled={additionalSeats <= 0}
                    className="h-12 w-12"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  
                  <div className="text-center min-w-[80px]">
                    <Input
                      type="number"
                      min="0"
                      max={maxAddable}
                      value={additionalSeats}
                      onChange={(e) => handleSeatsInputChange(parseInt(e.target.value) || 0)}
                      className="text-center text-2xl font-bold h-12"
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleIncrement}
                    disabled={additionalSeats >= maxAddable}
                    className="h-12 w-12"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                
                {maxAddable <= 0 ? (
                  <p className="text-sm text-amber-600 text-center">
                    You've reached the maximum of {MAX_SEATS_ALLOWED.toLocaleString()} seats
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    New total: <span className="font-semibold">{newTotal} seats</span>
                    <span className="text-xs ml-2">(max {MAX_SEATS_ALLOWED.toLocaleString()})</span>
                  </p>
                )}
              </div>

              <Separator />

              {/* Promo Code Section */}
              <div className="space-y-2">
                <Label htmlFor="promoCode" className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Promo Code (Optional)
                </Label>
                <Input
                  id="promoCode"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="uppercase"
                />
                {isPromoValid && (
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    ✓ Promo code applied! Additional seats are free
                  </p>
                )}
              </div>

              {/* Cost Summary */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Additional Cost</p>
                    <p className="text-sm text-muted-foreground">
                      {additionalSeats} seat{additionalSeats !== 1 ? 's' : ''} × ${PRICE_PER_SEAT}
                    </p>
                  </div>
                  <div className="text-right">
                    {isPromoValid && additionalSeats > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm line-through text-muted-foreground">
                          ${additionalSeats * PRICE_PER_SEAT}
                        </span>
                        <span className="text-2xl font-bold text-green-600">$0</span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold">${additionalCost}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddSeats} 
                  disabled={additionalSeats <= 0 || saving}
                  className="flex-1 gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  {isPromoValid 
                    ? `Add ${additionalSeats} Seat${additionalSeats !== 1 ? 's' : ''} (Free!)`
                    : `Pay $${additionalCost} for ${additionalSeats} Seat${additionalSeats !== 1 ? 's' : ''}`
                  }
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Payment will be processed securely via Stripe. Seats are available immediately after purchase.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
