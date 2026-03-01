import React from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Users, FileText, ClipboardList, LogOut, LayoutDashboard, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export function SidebarLayout({ children, role }: { children: React.ReactNode; role: string }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems: Record<string, NavItem[]> = {
    admin: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
    teacher: [
      { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
      { label: "Tests", href: "/teacher/tests", icon: FileText },
      { label: "Reports", href: "/teacher/reports", icon: ClipboardList },
    ],
    student: [
      { label: "Dashboard", href: "/student", icon: LayoutDashboard },
      { label: "Available Tests", href: "/student/tests", icon: FileText },
      { label: "My Results", href: "/student/results", icon: ClipboardList },
    ],
    parent: [
      { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
    ]
  };

  const items = navItems[role] || [];

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/50 bg-card/50 backdrop-blur flex flex-col fixed inset-y-0 left-0 z-10">
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <BookOpen size={20} />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">EduPortal</span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {items.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon size={20} className={isActive ? "opacity-100" : "opacity-70"} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border/50">
          <div className="px-4 py-3 mb-2 rounded-xl bg-secondary/50 flex flex-col">
            <span className="text-sm font-semibold text-foreground truncate">{user?.username}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive active-press" 
            onClick={handleLogout}
            loading={logout.isPending}
          >
            <LogOut size={20} className="mr-3 opacity-70" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen relative">
        <div className="max-w-6xl mx-auto p-8 md:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
