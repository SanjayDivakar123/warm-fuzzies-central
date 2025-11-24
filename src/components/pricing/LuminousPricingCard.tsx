import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { PaymentButton } from "@/components/payment/PaymentButton"

interface LuminousPricingCardProps {
  name: string
  price: string
  priceNote?: string
  target: string
  description: string
  features: string[]
  cta: string
  popular: boolean
  icon: LucideIcon
  ctaAction?: "free" | "premium" | "pro"
}

export function LuminousPricingCard({
  name,
  price,
  priceNote,
  target,
  description,
  features,
  cta,
  popular,
  icon: Icon,
  ctaAction
}: LuminousPricingCardProps) {
  const [isActive, setIsActive] = useState(false)

  return (
    <div className={`luminous-card ${isActive ? 'active' : ''} ${popular ? 'popular' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium z-10">
          Most Popular
        </div>
      )}
      
      <div className="light-layer">
        <div className="slit"></div>
        <div className="lumen">
          <div className="min"></div>
          <div className="mid"></div>
          <div className="hi"></div>
        </div>
        <div className="darken">
          <div className="sl"></div>
          <div className="ll"></div>
          <div className="slt"></div>
          <div className="srt"></div>
        </div>
      </div>

      <div className="card-content">
        <div className="icon-container">
          <Icon className="w-12 h-12 icon-svg" />
        </div>

        <div className="card-bottom">
          <div className="price-section">
            <div className="text-3xl font-bold text-foreground">{price}</div>
            {priceNote && <div className="text-sm text-muted-foreground">{priceNote}</div>}
          </div>

          <h4 className="card-title">{name}</h4>
          <p className="card-target">{target}</p>
          <p className="card-description">{description}</p>

          <ul className="features-list">
            {features.map((feature, idx) => (
              <li key={idx} className="feature-item">
                <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-xs">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="cta-section">
            {ctaAction === "free" ? (
              <Button className="w-full cta-button" variant={popular ? "default" : "outline"} asChild>
                <Link to="/free-assessment">{cta}</Link>
              </Button>
            ) : ctaAction === "premium" ? (
              <PaymentButton 
                productType="premium" 
                className="w-full cta-button" 
                variant={popular ? "default" : "outline"}
              >
                {cta}
              </PaymentButton>
            ) : ctaAction === "pro" ? (
              <PaymentButton 
                productType="pro" 
                className="w-full cta-button" 
                variant={popular ? "default" : "outline"}
              >
                {cta}
              </PaymentButton>
            ) : null}

            <div 
              className="light-toggle" 
              onClick={() => setIsActive(!isActive)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsActive(!isActive)}
            >
              <div className="toggle-track"></div>
              <div className="toggle-handle"></div>
              <span className="toggle-label">Activate Lumen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
