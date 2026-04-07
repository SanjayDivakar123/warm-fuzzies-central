import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PersonalChatGPTIntegrationCard from '@/components/settings/PersonalChatGPTIntegrationCard';
import { useAuth } from '@/contexts/AuthContext';

export default function PersonalIntegrationsPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <Button asChild variant="ghost" className="px-0 text-muted-foreground hover:text-foreground">
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Integrations</h1>
                <p className="text-sm text-muted-foreground">
                  Connect ChatGPT so RoleColorFinder can personalize your work conversations.
                </p>
              </div>
            </div>
          </div>

          <Badge variant="outline" className="px-3 py-1 text-sm">
            Personal Portal
          </Badge>
        </div>

        <div className="grid gap-6">
          <PersonalChatGPTIntegrationCard userEmail={user?.email} />

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-medium">How this works</CardTitle>
              <CardDescription>
                RoleColorFinder only shares the profile context you allow from the manage modal.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                <p className="font-medium text-foreground">1. Connect</p>
                <p className="mt-1">Turn on your personal ChatGPT connection from the card above.</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                <p className="font-medium text-foreground">2. Control sharing</p>
                <p className="mt-1">Decide whether ChatGPT sees only your profile or teammate context too.</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                <p className="font-medium text-foreground">3. Get better answers</p>
                <p className="mt-1">ChatGPT can adapt communication, conflict, and collaboration advice to your RoleColor.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
