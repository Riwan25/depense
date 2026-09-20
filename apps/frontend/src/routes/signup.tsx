import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
} from "@repo/ui";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { signUp } from "@/lib/auth-client";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await signUp.email({ name, email, password });
      if (result.error) {
        throw new Error(result.error.message);
      }
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>Start tracking your expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="signup-form" onSubmit={handleSubmit}>
            <FieldGroup className="gap-6">
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Field>
                <FieldLabel htmlFor="signup-name">Name</FieldLabel>
                <Input
                  id="signup-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  disabled={isLoading}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isLoading}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={isLoading}
                  required
                  minLength={8}
                />
              </Field>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Sign up"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
