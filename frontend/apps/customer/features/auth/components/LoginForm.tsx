"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, Input } from "@coifyn/ui";
import { login } from "../../../lib/api/auth/login";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: () => login({ email, password }),
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        loginMutation.mutate();
      }}
    >
      <Input
        type="email"
        placeholder="Email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {loginMutation.isError ? (
        <p className="text-sm text-[var(--color-destructive)]">
          Could not sign in. Check your email and password.
        </p>
      ) : null}
      <Button type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
