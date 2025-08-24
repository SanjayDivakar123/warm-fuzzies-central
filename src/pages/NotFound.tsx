import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="text-center space-y-8 p-8 max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="/lovable-uploads/b0720aa1-19dc-4cac-aefe-2dfb86343600.png" 
            alt="RoleColor ™️ Finder Logo" 
            className="h-20 w-auto opacity-80"
          />
        </div>

        {/* 404 Number */}
        <div className="relative">
          <h1 className="text-9xl font-black text-primary/20 select-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Oops!
            </span>
          </div>
        </div>

        {/* Funny Message */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-foreground">
            Looks like this page took a different color path! 🎨
          </h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Even our best leadership assessment couldn't find this page. 
            Maybe it's still in the "Forming" stage of development, or perhaps it wandered off to find its true color role!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button asChild size="lg" className="min-w-[200px]">
            <a href="/" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Discover Your Colors
            </a>
          </Button>
          
          <Button variant="outline" size="lg" onClick={() => window.history.back()} className="min-w-[160px]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Fun Footer */}
        <div className="pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground italic">
            "In the journey of team development, sometimes we take a wrong turn. 
            That's just part of the Storming phase!" 😄
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
