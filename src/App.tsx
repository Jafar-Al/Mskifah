import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Challenges from "./pages/Challenges";
import WazariIntensive from "./pages/WazariIntensive";
import Leaderboard from "./pages/Leaderboard";
import Videos from "./pages/Videos";
import Files from "./pages/Files";
import Exams from "./pages/Exams";
import MyAccount from "./pages/MyAccount";
import Admin from "./pages/Admin";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/challenges"
              element={<ProtectedRoute><Challenges /></ProtectedRoute>}
            />
            <Route
              path="/wazari"
              element={<ProtectedRoute><WazariIntensive /></ProtectedRoute>}
            />
            <Route
              path="/leaderboard"
              element={<ProtectedRoute><Leaderboard /></ProtectedRoute>}
            />
            <Route
              path="/videos"
              element={<ProtectedRoute><Videos /></ProtectedRoute>}
            />
            <Route
              path="/files"
              element={<ProtectedRoute><Files /></ProtectedRoute>}
            />
            <Route
              path="/exams"
              element={<ProtectedRoute><Exams /></ProtectedRoute>}
            />
            <Route
              path="/my-account"
              element={<ProtectedRoute><MyAccount /></ProtectedRoute>}
            />
            {/* Admin portal at an obscure URL - shows its own login form */}
            <Route
              path="/secure-msk-admin"
              element={<AdminRoute><Admin /></AdminRoute>}
            />
            {/* Redirect old /admin to 404 so it's not guessable */}
            <Route path="/admin" element={<Navigate to="/404" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
