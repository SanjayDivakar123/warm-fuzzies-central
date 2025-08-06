import { Card, CardContent } from "@/components/ui/card";
import { Clock, Wrench } from "lucide-react";

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Wrench className="h-16 w-16 text-primary animate-bounce" />
              <Clock className="h-8 w-8 text-muted-foreground absolute -bottom-2 -right-2" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Scheduled Maintenance
            </h1>
            <p className="text-muted-foreground">
              We're currently performing scheduled repairs and improvements to enhance your experience.
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">
              Expected Return:
            </p>
            <p className="text-lg font-semibold text-primary">
              August 10, 2025 at 9:00 PM EDT
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Thank you for your patience. We'll be back soon with exciting updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Maintenance;