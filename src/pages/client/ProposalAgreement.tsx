import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/** Redirect legacy /agreement URL to the first signing step */
export default function ProposalAgreement() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/client/${slug}/loi`, { replace: true });
  }, [slug, navigate]);

  return null;
}
