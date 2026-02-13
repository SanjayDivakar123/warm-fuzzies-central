import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building2,
  ArrowLeft,
  Share2,
  CheckCircle,
  Upload,
  Loader2,
  Users,
  Calendar,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';

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
  requirements: string[] | null;
  responsibilities: string[] | null;
  benefits: string[] | null;
  posted_at: string;
  application_deadline: string | null;
  company_id: string;
}

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
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

export default function PublicJobDetailPage() {
  const { companySlug, jobId } = useParams<{ companySlug: string; jobId: string }>();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'direct';
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobPosting | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [notFound, setNotFound] = useState(false);
  
  // Application form state
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    portfolio: '',
    coverLetter: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    setLoading(true);
    try {
      // Fetch job posting
      const { data: jobData, error: jobError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', jobId)
        .eq('status', 'open')
        .single();

      if (jobError || !jobData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setJob(jobData as unknown as JobPosting);

      // Fetch company details
      const { data: companyData } = await supabase
        .from('companies')
        .select('id, name, logo_url, website')
        .eq('id', jobData.company_id)
        .single();

      if (companyData) {
        setCompany(companyData);
      }
    } catch (err) {
      console.error('Error fetching job:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = () => {
    if (!job?.salary_min && !job?.salary_max) return null;
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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: `${job?.title} at ${company?.name}`,
        text: `Check out this job opportunity: ${job?.title}`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard' });
    }
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in your name and email.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create or find candidate
      let candidateId: string;
      
      const { data: existingCandidate } = await supabase
        .from('candidates')
        .select('id')
        .eq('email', formData.email)
        .single();

      if (existingCandidate) {
        candidateId = existingCandidate.id;
      } else {
        const { data: newCandidate, error: candidateError } = await supabase
          .from('candidates')
          .insert({
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone || null,
            linkedin_url: formData.linkedin || null,
            portfolio_url: formData.portfolio || null,
          })
          .select('id')
          .single();

        if (candidateError) throw candidateError;
        candidateId = newCandidate.id;
      }

      // 2. Get first pipeline stage for this job
      const { data: firstStage } = await supabase
        .from('hiring_pipeline_stages')
        .select('id')
        .eq('job_posting_id', job!.id)
        .order('stage_order')
        .limit(1)
        .single();

      // 3. Create application
      const { error: applicationError } = await supabase
        .from('candidate_applications')
        .insert({
          candidate_id: candidateId,
          job_posting_id: job!.id,
          current_stage_id: firstStage?.id || null,
          source: source,
          cover_letter: formData.coverLetter || null,
        });

      if (applicationError) throw applicationError;

      // 4. Upload resume if provided
      if (resumeFile && company) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${company.id}/${candidateId}/${Date.now()}_resume.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, resumeFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('resumes')
            .getPublicUrl(fileName);

          // Store document reference
          await supabase.from('candidate_documents').insert({
            company_id: company.id,
            candidate_id: candidateId,
            document_type: 'resume',
            file_name: resumeFile.name,
            file_url: urlData.publicUrl,
            file_size: resumeFile.size,
            mime_type: resumeFile.type,
          });
        }
      }

      setSubmitted(true);
    } catch (error: any) {
      console.error('Application error:', error);
      toast({
        title: 'Error submitting application',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
          <p className="text-muted-foreground mb-4">
            This position may have been filled or is no longer available.
          </p>
          <Button asChild>
            <Link to={`/careers/${companySlug}`}>View All Jobs</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{job.title} at {company?.name} | Careers</title>
        <meta name="description" content={job.description?.slice(0, 160)} />
        
        {/* Google Jobs Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": job.title,
            "description": job.description,
            "datePosted": job.posted_at,
            "validThrough": job.application_deadline,
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
              "logo": company?.logo_url,
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
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-muted/30 border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Link 
              to={`/careers/${companySlug}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              All Jobs at {company?.name}
            </Link>
            
            <div className="flex items-start justify-between gap-4">
              <div>
                {company?.logo_url && (
                  <img 
                    src={company.logo_url} 
                    alt={company.name}
                    className="h-12 mb-4 object-contain"
                  />
                )}
                <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
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
                    {EMPLOYMENT_TYPE_LABELS[job.employment_type]}
                  </span>
                  <Badge variant="outline">
                    {REMOTE_LABELS[job.remote_policy]}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                  {formatSalary() && (
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <DollarSign className="h-4 w-4" />
                      {formatSalary()}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Posted {format(new Date(job.posted_at), 'MMMM d, yyyy')}
                  </span>
                  {job.application_deadline && (
                    <span className="flex items-center gap-1 text-orange-600">
                      <Calendar className="h-4 w-4" />
                      Apply by {format(new Date(job.application_deadline), 'MMMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button onClick={() => setShowApplyDialog(true)}>
                  Apply Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {job.description && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">About This Role</h2>
                  <div className="prose prose-neutral max-w-none">
                    <p className="whitespace-pre-wrap">{job.description}</p>
                  </div>
                </section>
              )}

              {/* Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">Responsibilities</h2>
                  <ul className="space-y-2">
                    {job.responsibilities.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">Requirements</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">Benefits</h2>
                  <ul className="space-y-2">
                    {job.benefits.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">Apply for this position</CardTitle>
                  <CardDescription>
                    Join {company?.name} and make an impact
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" onClick={() => setShowApplyDialog(true)}>
                    Apply Now
                  </Button>
                  
                  {company?.website && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={company.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Company Website
                      </a>
                    </Button>
                  )}

                  <div className="pt-4 border-t text-sm text-muted-foreground">
                    <p className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" />
                      Share this job with friends
                    </p>
                    <Button variant="ghost" size="sm" onClick={handleShare} className="w-full">
                      <Share2 className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Apply Dialog */}
        <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            {submitted ? (
              <div className="py-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <DialogTitle className="text-2xl mb-2">Application Submitted!</DialogTitle>
                <DialogDescription className="mb-6">
                  Thank you for applying to {job.title} at {company?.name}. 
                  We'll review your application and get back to you soon.
                </DialogDescription>
                <Button onClick={() => setShowApplyDialog(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Apply for {job.title}</DialogTitle>
                  <DialogDescription>
                    Fill out the form below to submit your application.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        placeholder="linkedin.com/in/johndoe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio/Website</Label>
                    <Input
                      id="portfolio"
                      value={formData.portfolio}
                      onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                      placeholder="https://johndoe.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resume">Resume</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      {resumeFile && (
                        <Badge variant="secondary">{resumeFile.name}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, or DOCX (max 5MB)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coverLetter">Cover Letter</Label>
                    <Textarea
                      id="coverLetter"
                      value={formData.coverLetter}
                      onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                      placeholder="Tell us why you're interested in this role..."
                      rows={5}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Submit Application
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
