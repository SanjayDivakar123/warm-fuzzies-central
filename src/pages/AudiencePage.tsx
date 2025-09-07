import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AudienceSelector, { type AudienceType } from "@/components/AudienceSelector";
import AdaptiveQuiz from "@/components/AdaptiveQuiz";

export default function AudiencePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedAudience, setSelectedAudience] = useState<AudienceType | null>(null);
  
  // Get assessment type from URL params
  const assessmentType = searchParams.get('type') as 'free' | 'premium' | 'pro' || 'free';

  const handleAudienceSelect = (audience: AudienceType) => {
    setSelectedAudience(audience);
  };

  // If audience is selected, show the adaptive quiz
  if (selectedAudience) {
    return (
      <AdaptiveQuiz 
        audienceType={selectedAudience} 
        assessmentType={assessmentType}
      />
    );
  }

  // Otherwise show the audience selector
  return <AudienceSelector onAudienceSelect={handleAudienceSelect} />;
}
