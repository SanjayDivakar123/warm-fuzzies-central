import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Search,
  Building2,
  Users,
  Globe,
  Linkedin,
  Twitter,
  ExternalLink,
  ChevronRight,
  Heart,
  Zap,
  Coffee,
  Laptop,
} from 'lucide-react';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';

interface CareerPageSettings {
  id: string;
  company_id: string;
  is_enabled: boolean;
  slug: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  about_company: string | null;
  benefits_list: { icon: string; title: string; description: string }[];
  contact_email: string | null;
  meta_title: string | null;
  meta_description: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  glassdoor_url: string | null;
}

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  website: string | null;
}

interface JobPosting {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string;
  remote_policy: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  description: string | null;
  posted_at: string;
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  temporary: 'Temporary',
  internship: 'Internship',
};

const REMOTE_LABELS: Record<string, string> = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
};

const BENEFIT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  zap: Zap,
  coffee: Coffee,
  laptop: Laptop,
  users: Users,
  globe: Globe,
};

export default function PublicCareersPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<CareerPageSettings | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (companySlug) {
      fetchCareerPage();
    }
  }, [companySlug]);

  const fetchCareerPage = async () => {
    setLoading(true);
    try {
      // Fetch career page settings by slug
      const { data: settingsData, error: settingsError } = await supabase
        .from('career_page_settings')
        .select('*')
        .eq('slug', companySlug)
        .eq('is_enabled', true)
        .single();

      if (settingsError || !settingsData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setSettings(settingsData as unknown as CareerPageSettings);

      // Fetch company details
      const { data: companyData } = await supabase
        .from('companies')
        .select('id, name, logo_url, industry, website')
        .eq('id', settingsData.company_id)
        .single();

      if (companyData) {
        setCompany(companyData);
      }

      // Fetch open job postings
      const { data: jobsData } = await supabase
        .from('job_postings')
        .select(`
          id,
          title,
          department,
          location,
          employment_type,
          remote_policy,
          salary_min,
          salary_max,
          salary_currency,
          description,
          posted_at
        `)
        .eq('company_id', settingsData.company_id)
        .eq('status', 'open')
        .order('posted_at', { ascending: false });

      setJobs((jobsData || []) as unknown as JobPosting[]);
    } catch (err) {
      console.error('Error fetching career page:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = !selectedDepartment || job.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments
  const departments = Array.from(new Set(jobs.map(j => j.department).filter(Boolean)));

  // Format salary range
  const formatSalary = (job: JobPosting) => {
    if (!job.salary_min && !job.salary_max) return null;
    const currency = job.salary_currency || 'USD';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    if (job.salary_min && job.salary_max) {
      return `${formatter.format(job.salary_min)} - ${formatter.format(job.salary_max)}`;
    }
    if (job.salary_min) return `From ${formatter.format(job.salary_min)}`;
    if (job.salary_max) return `Up to ${formatter.format(job.salary_max)}`;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-12 w-48 mb-4" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Career Page Not Found</h1>
          <p className="text-muted-foreground mb-4">
            This company's career page doesn't exist or is not public.
          </p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{settings?.meta_title || `Careers at ${company?.name}`}</title>
        <meta 
          name="description" 
          content={settings?.meta_description || `Explore career opportunities at ${company?.name}`} 
        />
        
        {/* Google Jobs Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": company?.name,
            "url": company?.website,
            "logo": company?.logo_url,
            "jobPosting": jobs.map(job => ({
              "@type": "JobPosting",
              "title": job.title,
              "description": job.description,
              "datePosted": job.posted_at,
              "employmentType": job.employment_type?.toUpperCase().replace('_', ''),
              "jobLocation": {
                "@type": "Place",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": job.location,
                }
              },
              "hiringOrganization": {
                "@type": "Organization",
                "name": company?.name,
                "sameAs": company?.website,
              },
              ...(job.salary_min && {
                "baseSalary": {
                  "@type": "MonetaryAmount",
                  "currency": job.salary_currency || "USD",
                  "value": {
                    "@type": "QuantitativeValue",
                    "minValue": job.salary_min,
                    "maxValue": job.salary_max || job.salary_min,
                    "unitText": "YEAR"
                  }
                }
              })
            }))
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div 
          className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20"
          style={settings?.hero_image_url ? {
            backgroundImage: `url(${settings.hero_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : {}}
        >
          <div className="max-w-6xl mx-auto px-4 text-center">
            {company?.logo_url && (
              <img 
                src={company.logo_url} 
                alt={company.name}
                className="h-16 mx-auto mb-6 object-contain"
              />
            )}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {settings?.hero_title || `Join ${company?.name}`}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {settings?.hero_subtitle || 'Explore exciting career opportunities'}
            </p>
            
            {/* Search */}
            <div className="max-w-lg mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="text-center">
                <p className="text-3xl font-bold">{jobs.length}</p>
                <p className="text-sm text-muted-foreground">Open Positions</p>
              </div>
              {departments.length > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold">{departments.length}</p>
                  <p className="text-sm text-muted-foreground">Departments</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* About Section */}
          {settings?.about_company && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">About {company?.name}</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {settings.about_company}
              </p>
            </section>
          )}

          {/* Benefits */}
          {settings?.benefits_list && settings.benefits_list.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Why Join Us</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {settings.benefits_list.map((benefit, index) => {
                  const IconComponent = BENEFIT_ICONS[benefit.icon] || Heart;
                  return (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <IconComponent className="h-8 w-8 text-primary mb-3" />
                        <h3 className="font-semibold mb-1">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Department Filter */}
          {departments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={selectedDepartment === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDepartment(null)}
              >
                All Departments
              </Button>
              {departments.map(dept => (
                <Button
                  key={dept}
                  variant={selectedDepartment === dept ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDepartment(dept!)}
                >
                  {dept}
                </Button>
              ))}
            </div>
          )}

          {/* Job Listings */}
          <section>
            <h2 className="text-2xl font-bold mb-6">
              Open Positions {filteredJobs.length !== jobs.length && `(${filteredJobs.length})`}
            </h2>
            
            {filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {jobs.length === 0 
                      ? 'No open positions at the moment. Check back soon!'
                      : 'No positions match your search criteria.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <Card key={job.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <Link 
                            to={`/careers/${companySlug}/jobs/${job.id}`}
                            className="group"
                          >
                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                              {job.title}
                              <ChevronRight className="inline h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h3>
                          </Link>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                            {job.department && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {job.department}
                              </span>
                            )}
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {EMPLOYMENT_TYPE_LABELS[job.employment_type] || job.employment_type}
                            </span>
                            <Badge variant="outline">
                              {REMOTE_LABELS[job.remote_policy] || job.remote_policy}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                            {formatSalary(job) && (
                              <span className="flex items-center gap-1 text-green-600">
                                <DollarSign className="h-4 w-4" />
                                {formatSalary(job)}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              Posted {format(new Date(job.posted_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>

                        <Button asChild>
                          <Link to={`/careers/${companySlug}/jobs/${job.id}?source=careers_page`}>
                            Apply Now
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-4 mb-4">
              {company?.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                  <Globe className="h-5 w-5" />
                </a>
              )}
              {settings?.linkedin_url && (
                <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {settings?.twitter_url && (
                <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {settings?.glassdoor_url && (
                <a href={settings.glassdoor_url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                  <ExternalLink className="h-5 w-5" />
                </a>
              )}
            </div>
            <p>
              {settings?.contact_email && (
                <>
                  Questions? Email us at{' '}
                  <a href={`mailto:${settings.contact_email}`} className="text-primary hover:underline">
                    {settings.contact_email}
                  </a>
                </>
              )}
            </p>
            <p className="mt-2">
              Powered by{' '}
              <a href="https://rolecolorfinder.com" className="text-primary hover:underline">
                Role Color Finder
              </a>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
