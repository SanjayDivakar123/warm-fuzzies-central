import LegacyCandidates from '@/LegacyCandiadates/CandidatesTab';

interface LegacyCandidatesTabProps {
  company: {
    id: string;
    name: string;
    subdomain?: string;
  };
}

export default function LegacyCandidatesTab({ company }: LegacyCandidatesTabProps) {
  return (
    <LegacyCandidates
      company={{
        id: company.id,
        name: company.name,
        subdomain: company.subdomain || 'company',
      }}
    />
  );
}
