import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Wallet, Tag, CheckCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  InnerDialog,
  InnerDialogTrigger,
  InnerDialogContent,
  InnerDialogHeader,
  InnerDialogFooter,
  InnerDialogTitle,
  InnerDialogDescription,
} from "@/components/ui/nested-dialog";

interface PaymentDialogProps {
  children: React.ReactNode;
  productName: string;
  price: string;
  onPaymentComplete?: () => void;
}

function PaymentDialog({ children, productName, price, onPaymentComplete }: PaymentDialogProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState("creditcard");
  const [promoCode, setPromoCode] = React.useState("");
  const [promoApplied, setPromoApplied] = React.useState(false);
  const [promoLoading, setPromoLoading] = React.useState(false);
  const [promoError, setPromoError] = React.useState("");
  const [discountedPrice, setDiscountedPrice] = React.useState(price);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    setPromoLoading(true);
    setPromoError("");
    
    // Simulate promo code validation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Example promo codes
    const validCodes: Record<string, number> = {
      "SAVE10": 10,
      "SAVE20": 20,
      "WELCOME": 15,
      "VIP50": 50,
    };

    const upperCode = promoCode.toUpperCase();
    if (validCodes[upperCode]) {
      const numericPrice = parseFloat(price.replace("$", ""));
      const discount = validCodes[upperCode];
      const newPrice = numericPrice * (1 - discount / 100);
      setDiscountedPrice(`$${newPrice.toFixed(0)}`);
      setPromoApplied(true);
      setPromoError("");
    } else {
      setPromoError("Invalid promo code");
      setPromoApplied(false);
    }
    
    setPromoLoading(false);
  };

  const handleRemovePromo = () => {
    setPromoCode("");
    setPromoApplied(false);
    setDiscountedPrice(price);
    setPromoError("");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>
            You're purchasing: <strong>{productName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Price Display */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-muted-foreground">Total</span>
            <div className="flex items-center gap-2">
              {promoApplied && (
                <span className="text-sm text-muted-foreground line-through">{price}</span>
              )}
              <span className="text-2xl font-bold text-foreground">{discountedPrice}</span>
            </div>
          </div>

          {/* Card Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardHolder">Card Holder*</Label>
              <div className="relative">
                <Input id="cardHolder" placeholder="John Doe" className="pr-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number*</Label>
              <div className="relative">
                <Input id="cardNumber" placeholder="1234 5678 9012 3456" className="pr-10" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiration*</Label>
                <Input id="expiry" placeholder="MM/YY" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC*</Label>
                <Input id="cvc" placeholder="123" />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <InnerDialog>
            <InnerDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>Payment Method</span>
                <Wallet className="h-4 w-4" />
              </Button>
            </InnerDialogTrigger>
            <InnerDialogContent position="bottom" draggable>
              <InnerDialogHeader>
                <InnerDialogTitle>Choose a payment method</InnerDialogTitle>
                <InnerDialogDescription>
                  Select your preferred payment option
                </InnerDialogDescription>
              </InnerDialogHeader>

              <div className="py-4">
                <RadioGroup
                  value={selectedPaymentMethod}
                  onValueChange={setSelectedPaymentMethod}
                  className="space-y-3"
                >
                  <div
                    className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedPaymentMethod === "creditcard"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedPaymentMethod("creditcard")}
                  >
                    <RadioGroupItem value="creditcard" id="creditcard" />
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">Credit Card</p>
                      <p className="text-sm text-muted-foreground">
                        Pay with Visa, Mastercard, or American Express
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedPaymentMethod === "paypal"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedPaymentMethod("paypal")}
                  >
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Wallet className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium">PayPal</p>
                      <p className="text-sm text-muted-foreground">
                        Pay with your PayPal account
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <InnerDialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button>Continue</Button>
              </InnerDialogFooter>
            </InnerDialogContent>
          </InnerDialog>

          {/* Promo Code Section */}
          <div className="border-t pt-4">
            <Label className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-primary" />
              Have a promo code?
            </Label>
            {promoApplied ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Code "{promoCode.toUpperCase()}" applied!
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePromo}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className={promoError ? "border-destructive" : ""}
                />
                <Button
                  variant="outline"
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoCode.trim()}
                >
                  {promoLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>
            )}
            {promoError && (
              <p className="text-sm text-destructive mt-2">{promoError}</p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={onPaymentComplete}>
            Pay {discountedPrice}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { PaymentDialog };
