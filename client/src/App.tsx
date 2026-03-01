import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import { LoadingScreen } from "@/components/ui";
import { useEffect } from "react";

// Pages
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import TeacherDashboard from "./pages/teacher/Dashboard";
import QuestionsPage from "./pages/teacher/Questions";
import StudentDashboard from "./pages/student/Dashboard";
import TakeTest from "./pages/student/TakeTest";
import ParentDashboard from "./pages/parent/Dashboard";

function ProtectedRoute({ component: Component, role }: { component: React.ElementType, role: string }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && user.role !== role) {
      // Redirect to correct dashboard
      setLocation(`/${user.role}`);
    }
  }, [user, isLoading, role, setLocation]);

  if (isLoading) return <LoadingScreen />;
  if (!user || user.role !== role) return null;

  return <Component />;
}

function RootRedirect() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (user) setLocation(`/${user.role}`);
      else setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  return <LoadingScreen />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={Login} />
      
      {/* Admin */}
      <Route path="/admin">
        {() => <ProtectedRoute role="admin" component={AdminDashboard} />}
      </Route>

      {/* Teacher */}
      <Route path="/teacher">
        {() => <ProtectedRoute role="teacher" component={TeacherDashboard} />}
      </Route>
      <Route path="/teacher/tests">
        {() => <ProtectedRoute role="teacher" component={TeacherDashboard} />}
      </Route>
      <Route path="/teacher/reports">
        {() => <ProtectedRoute role="teacher" component={TeacherDashboard} />}
      </Route>
      <Route path="/teacher/tests/:testId/questions">
        {() => <ProtectedRoute role="teacher" component={QuestionsPage} />}
      </Route>

      {/* Student */}
      <Route path="/student">
        {() => <ProtectedRoute role="student" component={StudentDashboard} />}
      </Route>
      <Route path="/student/tests">
        {() => <ProtectedRoute role="student" component={StudentDashboard} />}
      </Route>
      <Route path="/student/results">
        {() => <ProtectedRoute role="student" component={StudentDashboard} />}
      </Route>
      <Route path="/student/tests/:id">
        {() => <ProtectedRoute role="student" component={TakeTest} />}
      </Route>

      {/* Parent */}
      <Route path="/parent">
        {() => <ProtectedRoute role="parent" component={ParentDashboard} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
