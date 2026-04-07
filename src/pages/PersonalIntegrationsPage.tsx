import { Link } from 'react-router-dom';
import { ArrowLeft, Link2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PersonalIntegrationsPage() {
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
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Integrations</h1>
                <p className="text-sm text-muted-foreground">
                  Personal integrations will appear here as they become available.
                </p>
              </div>
            </div>
          </div>

          <Badge variant="outline" className="px-3 py-1 text-sm">
            Personal Portal
          </Badge>
        </div>

        <div className="grid gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-medium">Nothing to connect yet</CardTitle>
              <CardDescription>
                We&apos;re keeping personal integrations hidden while the next release is being finalized.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                <p className="font-medium text-foreground">Private by default</p>
                <p className="mt-1">Your RoleColor data stays inside RoleColorFinder unless a future integration is explicitly launched.</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  <p className="font-medium">This page will be reused later</p>
                </div>
                <p className="mt-1">When new personal connectors are ready, you&apos;ll manage them from here.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
