import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare } from "lucide-react";

const Auth = () => {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = displayName.trim();

    // Validate display name
    if (!trimmedName) {
      toast({
        title: "Invalid Name",
        description: "Please enter a display name",
        variant: "destructive",
      });
      return;
    }

    if (trimmedName.length > 30) {
      toast({
        title: "Invalid Name",
        description: "Display name must be 30 characters or less",
        variant: "destructive",
      });
      return;
    }

    // Generate Discord-style suffix (e.g., #1234)
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const finalDisplayName = `${trimmedName}#${suffix}`;

    setLoading(true);

    try {
      // Sign in anonymously
      const { data: authData, error: signInError } = await supabase.auth.signInAnonymously();

      if (signInError) throw signInError;
      if (!authData.user) throw new Error("No user returned");

      // Update profile with display name
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authData.user.id,
          display_name: finalDisplayName,
          email: null,
        });

      if (profileError) {
        // Check if display name is already taken (rare collision)
        if (profileError.code === '23505') { // Unique constraint violation
          toast({
            title: "Name Taken",
            description: "This specific name tag is taken. Please try again.",
            variant: "destructive",
          });
          // Sign out the anonymous user since we can't set the profile
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
        throw profileError;
      }

      toast({
        title: "Welcome!",
        description: `Signed in as ${finalDisplayName}`,
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <MessageSquare className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome to Chat Rooms
          </CardTitle>
          <CardDescription>
            Enter your display name to start chatting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={20}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                We'll add a random #tag to make your name unique
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Joining..." : "Join Chat"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
