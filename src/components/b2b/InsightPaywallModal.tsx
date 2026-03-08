import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, CreditCard, Sparkles, Check, Lock } from 'lucide-react';
import { addInsightCredits } from '@/lib/insightMetering';
import { useToast } from '@/hooks/use-toast';
import { convertUsdToLocalB2B, detectCountryCode, formatCurrency } from '@/lib/countryPricing';

interface InsightPaywallModalProps {
  open: boolean;
  onClose: () => void;
  onPurchaseComplete: () => void;
  companyId: string;
  insightCredits: number;
}

export default function InsightPaywallModal({
  open,
  onClose,
  onPurchaseComplete,
  companyId,
  insightCredits,
}: InsightPaywallModalProps) {
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number>(5);
  const [countryCode, setCountryCode] = useState('US');
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    detectCountryCode()
      .then((code) => {
        if (mounted) setCountryCode(code);
      })
      .catch(() => {
        if (mounted) setCountryCode('US');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const basePackages = [
    { credits: 5, usdPrice: 5, popular: false },
    { credits: 10, usdPrice: 9, popular: true, savings: '10%' },
    { credits: 25, usdPrice: 20, popular: false, savings: '20%' },
  ];

  const packages = useMemo(() => {
    return basePackages.map((pkg) => {
      const local = convertUsdToLocalB2B(pkg.usdPrice, countryCode);
      return {
        ...pkg,
        localPrice: local.amountLocal,
        currency: local.currency,
        country: local.country,
      };
    });
  }, [countryCode]);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      // Purchase flow validates wallet/card payment in the edge function before credits are added.
      const selectedPkg = packages.find((pkg) => pkg.credits === selectedPackage);
      const success = await addInsightCredits(companyId, selectedPackage, {
        amountUsd: selectedPkg?.usdPrice ?? selectedPackage,
        amountLocal: selectedPkg?.localPrice,
        currency: selectedPkg?.currency,
        countryCode,
      });
      
      if (success) {
        toast({
          title: 'Credits added!',
          description: `${selectedPackage} insight credits have been added to your account.`,
        });
        onPurchaseComplete();
      } else {
        throw new Error('Failed to add credits');
      }
    } catch (err: any) {
      toast({
        title: 'Purchase failed',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" />
            Free Insights Limit Reached
          </DialogTitle>
          <DialogDescription>
            You've used all free AI insights this month. Purchase extra credits to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {insightCredits > 0 && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Current credits:</span>
              </div>
              <Badge className="bg-green-600">{insightCredits}</Badge>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-medium">Select a package:</p>
            
            {packages.map((pkg) => (
              <Card 
                key={pkg.credits}
                className={`cursor-pointer transition-all ${
                  selectedPackage === pkg.credits 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedPackage(pkg.credits)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPackage === pkg.credits 
                        ? 'border-primary bg-primary' 
                        : 'border-muted-foreground'
                    }`}>
                      {selectedPackage === pkg.credits && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pkg.credits} Insights</span>
                        {pkg.popular && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                        {pkg.savings && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                            Save {pkg.savings}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(pkg.localPrice / pkg.credits, pkg.currency)} per insight
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{formatCurrency(pkg.localPrice, pkg.currency)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Prices shown for your location.
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Credits never expire. Use them anytime.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePurchase} disabled={purchasing}>
            {purchasing ? (
              <>Processing...</>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Purchase {(() => {
                  const selectedPkg = packages.find(p => p.credits === selectedPackage);
                  if (!selectedPkg) return '';
                  return formatCurrency(selectedPkg.localPrice, selectedPkg.currency);
                })()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
