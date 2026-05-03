// @ts-nocheck
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Users } from 'lucide-react';

interface BillingModalProps {
  open: boolean;
  onClose: () => void;
  company: {
    seats_purchased?: number | null;
  };
  onSeatsUpdated: () => void;
}

const MIN_BILLABLE_USERS = 2;

export default function BillingModal({ open, onClose, company }: BillingModalProps) {
  const currentBaseline = Math.max(MIN_BILLABLE_USERS, Number(company?.seats_purchased || 0));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Details
          </DialogTitle>
          <DialogDescription>
            Pre-paid seat purchases are no longer supported.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-medium">Portal billing model</p>
            <p className="text-sm text-muted-foreground">
              Your portal has a {MIN_BILLABLE_USERS}-user minimum baseline. Additional invited users are charged immediately with a prorated amount until your renewal date.
            </p>
          </div>

          <div className="rounded-lg border p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              Current baseline users
            </div>
            <p className="font-semibold">{currentBaseline}</p>
          </div>

          <div className="rounded-lg border bg-amber-50 border-amber-200 p-4">
            <p className="text-sm text-amber-800">
              Removing users does not refund current-month charges. It only prevents future recurring charges.
            </p>
          </div>

          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
