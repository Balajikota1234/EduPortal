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
    <div className="bg-zinc-50 min-h-screen sm:flex sm:items-center sm:justify-center sm:p-4">
      {/* Background blob — desktop only */}
      <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Mobile layout — no card, top-aligned */}
      <div className="sm:hidden px-5 pt-14 pb-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <BookOpen size={22} />
          </div>
          <h1 className="text-2xl font-display font-bold text-center">Welcome Back</h1>
          <p className="text-muted-foreground text-center mt-1.5 text-sm">
            Sign in to Sri Balaji Educational Institution's Portal
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username-m">Username</Label>
            <Input id="username-m" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-m">Password</Label>
            <Input id="password-m" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={login.isPending}>
            {login.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>

      {/* Desktop layout — centered card */}
      <Card className="hidden sm:block w-full max-w-md p-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
            <BookOpen size={28} />
          </div>
          <h1 className="text-3xl font-display font-bold text-center">Welcome Back</h1>
          <p className="text-muted-foreground text-center mt-2">Sign in to the Sri Balaji Educational Institution's Educational Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="admin / teacher / student / parent" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={login.isPending}>
            {login.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
