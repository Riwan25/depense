import { LoginForm } from "@repo/ui";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { signIn } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const handleSubmit = async (email: string, password: string) => {
    const result = await signIn.email({ email, password });
    if (result.error) {
      throw new Error(result.error.message);
    }
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <LoginForm
        title="Welcome back"
        description="Sign in to track your expenses"
        onSubmit={handleSubmit}
        onSignUp={() => navigate({ to: "/signup" })}
        showForgotPassword={false}
        showSignUp={true}
      />
    </div>
  );
}
