"use client";

import { useState } from "react";
import { Form } from "react-aria-components";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Description, FieldError, Fieldset, Label, Legend } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { Text, TextLink } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/",
      });

      if (error) {
        setError(error.message || "Registration failed");
      } else {
        navigate({ to: "/" });
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
        <h1 className="sr-only">Create account</h1>
        <Link href="/" aria-label="Goto homepage" className="mb-3 inline-block">
          <Avatar isSquare src="/logo.svg" size="md" />
        </Link>
        <Form onSubmit={handleSubmit}>
          <Fieldset>
            <Legend className="text-xl/6">Create account</Legend>
            <Text>
              Sign up to start uploading and searching your images with AI-powered semantic search.
            </Text>
            
            {error && (
              <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
                {error}
              </div>
            )}
            
            <TextField isRequired value={name} onChange={setName}>
              <Label>Full name</Label>
              <Input type="text" placeholder="John Doe" />
              <FieldError />
            </TextField>
            
            <TextField isRequired value={email} onChange={setEmail}>
              <Label>Email address</Label>
              <Input type="email" placeholder="you@example.com" />
              <FieldError />
            </TextField>
            
            <TextField isRequired value={password} onChange={setPassword}>
              <div className="mb-2 flex items-center justify-between">
                <Label>Password</Label>
              </div>
              <Input placeholder="Min 8 characters" type="password" />
              <Description>
                Must be at least 8 characters long.
              </Description>
              <FieldError />
            </TextField>
          </Fieldset>
          
          <Button type="submit" className="mt-6 w-full" isDisabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </Form>
        
        <div className="mt-6 text-center">
          <Text>
            Already have an account?{" "}
            <TextLink href="/auth/login" className="text-base/6 sm:text-sm/6">
              Sign in
            </TextLink>
          </Text>
        </div>
      </div>
    </main>
  );
}
