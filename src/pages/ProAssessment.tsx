import React from "react";
import { useNavigate } from "react-router-dom";

const ProAssessment = () => {
  const navigate = useNavigate();
  
  // Redirect to audience selector  
  React.useEffect(() => {
    navigate('/audience?type=pro');
  }, [navigate]);
  
  return null;
};

export default ProAssessment;