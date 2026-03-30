export const onboardingService = {
    async submitOnboarding(data) {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/onboarding/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
  
        const result = await response.json();
  
        if (!response.ok) {
          throw new Error(result.error || "Failed to save onboarding");
        }
  
        return result;
  
      } catch (error) {
        console.error("Onboarding error:", error);
        throw error;
      }
    }
  };