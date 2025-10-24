import { useRouteError, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";

export function ErrorBoundary() {
  const error = useRouteError() as Error;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Oops! Something went wrong</h1>
          <p className="text-muted-foreground">
            {error?.message || "An unexpected error occurred"}
          </p>
        </div>
        <Button asChild className="w-full">
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </Card>
    </div>
  );
}
