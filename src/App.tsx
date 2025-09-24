import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import CreateGroupPage from "./pages/CreateGroupPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import ExploreGroupsPage from "./pages/ExploreGroupsPage";
import NotFound from "./pages/NotFound";
import TestApiPage from "./pages/TestApiPage";
import TestInputPage from "./pages/TestInputPage";
import TestApiPageNew from "./pages/TestApiPageNew";
import DebugPage from "./pages/DebugPage";
import RegisterPage from "./pages/RegisterPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/grupos/crear" 
              element={
                <ProtectedRoute>
                  <CreateGroupPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/grupos/:slug" 
              element={
                <ProtectedRoute>
                  <GroupDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/grupos" 
              element={
                <ProtectedRoute>
                  <ExploreGroupsPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/test-api" element={<TestApiPage />} />
            <Route path="/test-api-new" element={<TestApiPageNew />} />
            <Route path="/test-input" element={<TestInputPage />} />
            <Route path="/debug" element={<DebugPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
