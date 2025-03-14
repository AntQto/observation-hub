
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md animate-fade-in">
        <h1 className="text-5xl font-semibold mb-6 text-foreground">404</h1>
        <p className="text-xl mb-8 text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Button asChild className="inline-flex items-center gap-2">
          <a href="/">
            <ArrowLeft className="h-4 w-4" />
            Return to home
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
