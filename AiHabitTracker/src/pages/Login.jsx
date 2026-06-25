import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import api from "../api/axios.js";

export default function Login() {
  const { user, login } = useAuth();
  const { theme, toggle } = useTheme();
  const loc = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [is403, setIs403] = useState(false);
  const [resendStatus, setResendStatus] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setIs403(false);
    setResendStatus("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(loc.state?.from || "/dashboard", { replace: true });
    } catch (e) {
      if (e.response?.status === 403) {
        setIs403(true);
        setErr("Please verify your email before logging in.");
      } else {
        setErr(e.response?.data?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const res = await api.post("/auth/resend-verification", { email });
      if (res.status === 200) {
        setResendStatus("Verification email sent. Please check your inbox.");
      } else {
        setResendStatus("Failed to send. Please try again.");
      }
    } catch (e) {
      if (e.response?.status === 429) {
        setResendStatus("Please wait before requesting another verification email.");
      } else {
        setResendStatus("Failed to send. Please try again.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <button
        onClick={toggle}
        className="fixed top-4 right-4 p-2.5 rounded-xl glass"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-md">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 mb-6"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Sparkles size={18} />
          </div>
          <span className="font-semibold text-lg">AI Habit Tracker</span>
        </Link>

        <div className="card p-7">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted mt-1">
            Log in to continue your streaks.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {err && (
              <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {err}
              </div>
            )}
            {is403 && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="btn-primary w-full py-2 text-sm"
                >
                  {resendLoading ? "Sending..." : "Resend verification email"}
                </button>
                {resendStatus && (
                  <div className="text-sm text-muted bg-surface border border-border rounded-lg px-3 py-2">
                    {resendStatus}
                  </div>
                )}
              </div>
            )}
            <button
              type="submit"
              className="btn-primary w-full py-3"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="text-center mt-5 text-sm text-soft">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand-600 dark:text-brand-300 font-medium">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
