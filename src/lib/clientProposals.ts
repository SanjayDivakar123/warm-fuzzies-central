import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Proposal, ProposalPricing } from "@/pages/admin/ProposalManager";

type ClientProposalRow = Database["public"]["Tables"]["client_proposals"]["Row"];

const validProposalStatuses: Proposal["status"][] = ["draft", "sent", "viewed", "accepted", "rejected"];

export function normalizeProposalStatus(status: string | null | undefined): Proposal["status"] {
  if (status === "active") {
    return "sent";
  }

  if (validProposalStatuses.includes(status as Proposal["status"])) {
    return status as Proposal["status"];
  }

  return "draft";
}

export function hydrateClientProposal(row: ClientProposalRow): Proposal {
  return {
    ...row,
    pricing: row.pricing as ProposalPricing,
    status: normalizeProposalStatus(row.status),
  };
}

export async function fetchLatestProposalBySlug(slug: string) {
  const response = await supabase
    .from("client_proposals")
    .select("*")
    .eq("slug", slug)
    .order("version", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    data: response.data ? hydrateClientProposal(response.data) : null,
    error: response.error,
  };
}

export function getErrorMessage(error: unknown, fallback = "Unknown error"): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}
