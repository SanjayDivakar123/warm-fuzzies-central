import React from "react";
import { useNavigate } from "react-router-dom";

const PremiumAssessment = () => {
  const navigate = useNavigate();
  
  // Redirect to audience selector  
  React.useEffect(() => {
    navigate('/audience?type=premium');
  }, [navigate]);
  
  return null;
};

export default PremiumAssessment;