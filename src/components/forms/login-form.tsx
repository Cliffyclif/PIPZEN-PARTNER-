"use client";

import { useState, useEffect } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { TubeMenGroup, type TubeManMood } from "@/components/login/tube-men";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<"" | "email" | "password">("");
  const [mood, setMood] = useState<TubeManMood>("idle");
  const [success, setSuccess] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Derive mood from state
  useEffect(() => {
    if (success) {
      setMood("success");
    } else if (error) {
      setMood("error");
      const timer = setTimeout(() => {
        if (!success) setMood(focusedField === "password" ? "hiding" : focusedField === "email" ? "watching" : "idle");
      }, 2000);
      return () => clearTimeout(timer);
    } else if (focusedField === "password") {
      setMood("hiding");
    } else if (focusedField === "email") {
      setMood("watching");
    } else {
      setMood("idle");
    }
  }, [focusedField, error, success]);

  async function onSubmit(data: LoginInput) {
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    // Verify partner role — reject admins on partner domain
    const session = await fetch("/api/auth/session").then((r) => r.json());
    if (session?.user?.role !== "PARTNER") {
      await signOut({ redirect: false });
      setError("Access denied. This login is for partners only. Admins should use admin.pipzen.io");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1200);
  }

  return (
    <div className="w-full flex items-end justify-center gap-2">
      {/* 3 tube men on the left — desktop; single above on mobile */}
      <TubeMenGroup mood={mood} />

      <div className="w-full max-w-md">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Welcome Back</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to your partner account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          type="email"
                          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                          {...field}
                          onFocus={() => { setFocusedField("email"); setError(""); }}
                          onBlur={() => { field.onBlur(); setFocusedField(""); }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your password"
                          type="password"
                          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                          {...field}
                          onFocus={() => { setFocusedField("password"); setError(""); }}
                          onBlur={() => { field.onBlur(); setFocusedField(""); }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold"
                  disabled={loading || success}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {success ? "Welcome!" : "Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
