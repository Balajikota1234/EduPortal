import { useState } from "react";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button, Input, Label, Card } from "@/components/ui";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center bg-zinc-50 pt-12 sm:pt-0 px-4 pb-8">
      {/* Background blur blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md p-6 sm:p-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <BookOpen size={24} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-center">Welcome Back</h1>
          <p className="text-muted-foreground text-center mt-1.5 text-sm sm:text-base">
            Sign in to Sri Balaji Educational Institution's Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={login.isPending}>
            {login.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
