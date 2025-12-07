import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Minus, CreditCard, Users } from 'lucide-react';

interface BillingModalProps {
  open: boolean;
  onClose: () => void;
  company: any;
  onSeatsUpdated: () => void;
}

const PRICE_PER_SEAT = 20;

export default function BillingModal({ open, onClose, company, onSeatsUpdated }: BillingModalProps) {
  const [additionalSeats, setAdditionalSeats] = useState(0);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const currentSeats = company.seats_purchased || 0;
  const newTotal = currentSeats + additionalSeats;
  const additionalCost = additionalSeats * PRICE_PER_SEAT;

  const handleIncrement = () => {
    setAdditionalSeats(prev => prev + 1);
  };

  const handleDecrement = () => {
    setAdditionalSeats(prev => Math.max(0, prev - 1));
  };

  const handleAddSeats = async () => {
    if (additionalSeats <= 0) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ seats_purchased: newTotal })
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: 'Seats added successfully!',
        description: `You now have ${newTotal} seats available.`,
      });

      onSeatsUpdated();
      setAdditionalSeats(0);
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error adding seats',
        description: error.message,
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
              <span className="font-semibold text-lg">{currentSeats}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Price per Seat</span>
              <span className="font-medium">${PRICE_PER_SEAT} (one-time)</span>
            </div>
          </div>

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
                  value={additionalSeats}
                  onChange={(e) => setAdditionalSeats(Math.max(0, parseInt(e.target.value) || 0))}
                  className="text-center text-2xl font-bold h-12"
                />
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                className="h-12 w-12"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              New total: <span className="font-semibold">{newTotal} seats</span>
            </p>
          </div>

          <Separator />

          {/* Cost Summary */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Additional Cost</p>
                <p className="text-sm text-muted-foreground">
                  {additionalSeats} seat{additionalSeats !== 1 ? 's' : ''} × ${PRICE_PER_SEAT}
                </p>
              </div>
              <span className="text-2xl font-bold">${additionalCost}</span>
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
              Add {additionalSeats} Seat{additionalSeats !== 1 ? 's' : ''}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Payment will be processed securely. Seats are available immediately after purchase.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
