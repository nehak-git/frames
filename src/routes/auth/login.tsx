"use client";

import { useState } from "react";
import { Form } from "react-aria-components";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox, CheckboxLabel } from "@/components/ui/checkbox";
import { Description, FieldError, Fieldset, Label, Legend } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { Text, TextLink } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { authClient } from "@/lib/auth-client";
import { useNavigate, useSearch, createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/login")({
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth/login" });
  const redirect = search.redirect || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
        callbackURL: redirect,
      });

      if (error) {
        setError(error.message || "Login failed");
      } else {
        navigate({ to: redirect });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="sr-only">Sign in</h1>
        <Link href="/" aria-label="Goto homepage" className="mb-3 inline-block">
          <Avatar isSquare src="/logo.svg" size="md" />
        </Link>
        <Form onSubmit={handleSubmit}>
          <Fieldset>
            <Legend className="text-xl/6">Sign in</Legend>
            <Text>
              Access your account to manage and search your images with AI-powered semantic search.
            </Text>
            
            {error && (
              <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
                {error}
              </div>
            )}
            
            <TextField isRequired value={email} onChange={setEmail}>
              <Label>Email address</Label>
              <Input type="email" placeholder="Your email address" />
              <FieldError />
            </TextField>
            
            <TextField isRequired value={password} onChange={setPassword}>
              <div className="mb-2 flex items-center justify-between">
                <Label>Password</Label>
                <TextLink href="/auth/forgot-password" className="text-base/6 sm:text-sm/6">
                  Forgot password?
                </TextLink>
              </div>
              <Input placeholder="Ssshtt, it's a secret" type="password" />
              <FieldError />
            </TextField>
            
            <Checkbox isSelected={rememberMe} onChange={setRememberMe}>
              <CheckboxLabel>Remember me</CheckboxLabel>
              <Description>
                Keep me signed in on this device for faster access next time.
              </Description>
            </Checkbox>
          </Fieldset>
          
          <Button type="submit" className="mt-6 w-full" isDisabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </Form>
        
        <div className="mt-6 text-center">
          <Text>
            Don't have an account?{" "}
            <TextLink href="/auth/register" className="text-base/6 sm:text-sm/6">
              Sign up
            </TextLink>
          </Text>
        </div>
      </div>
    </main>
  );
}
