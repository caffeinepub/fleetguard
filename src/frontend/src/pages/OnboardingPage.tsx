import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveProfile } from "../hooks/useQueries";

export function OnboardingPage() {
  const [name, setName] = useState("");
  const saveProfile = useSaveProfile();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      toast.success("Welcome to FleetGuard!");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl p-8 shadow-elevated text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to FleetGuard</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Before we get started, tell us your name so we can personalize your
            experience.
          </p>
          <div className="space-y-4 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="onboard-name">Your Name</Label>
              <Input
                id="onboard-name"
                data-ocid="onboarding.input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. James Carter"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="h-11"
              />
            </div>
            <Button
              data-ocid="onboarding.submit_button"
              className="w-full h-11"
              onClick={handleSubmit}
              disabled={saveProfile.isPending}
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Get Started"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
