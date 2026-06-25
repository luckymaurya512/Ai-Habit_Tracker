import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Sparkles, Sun, Moon, Mail, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import api from "../api/axios.js";

export default function Register() {
  const { user, register } = useAuth();
  const { theme, toggle } = useTheme();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Post-registration confirmation state
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendStatus, setResendStatus] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (form.password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      setRegisteredEmail(form.email);
      setRegistered(true);
    } catch (e) {
      setErr(e.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendStatus("");
    try {
      await api.post("/auth/resend-verification", { email: registeredEmail });
      setResendStatus("Verification email resent! Please check your inbox.");
    } catch (e) {
      if (e.response?.status === 429) {
        setResendStatus("Please wait before requesting another verification email.");
      } else {
        setResendStatus(
          e.response?.data?.message || "Failed to resend. Please try again."
        );
      }
    } finally {
      setResendLoading(false);
    }
  };

  const themeButton = (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 p-2.5 rounded-xl glass"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );

  const logo = (
    <Link to="/" className="flex items-center justify-center gap-2 mb-6">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
        <Sparkles size={18} />
      </div>
      <span className="font-semibold text-lg">AI Habit Tracker</span>
    </Link>
  );

  // Confirmation screen shown after successful registration
  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {themeButton}
        <div className="w-full max-w-md">
          {logo}
          <div className="card p-7 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center">
                <Mail size={32} className="text-brand-500" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle size={20} className="text-emerald-500" />
              <h1 className="text-2xl font-semibold">Verification email sent!</h1>
            </div>

            <p className="text-sm text-muted mt-2">
              A verification email has been sent to{" "}
              <span className="font-medium text-foreground">{registeredEmail}</span>.
              Please check your inbox and click the link to activate your account.
            </p>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="btn-primary w-full py-3"
              >
                {resendLoading ? "Sending..." : "Resend verification email"}
              </button>

              {resendStatus && (
                <div
                  className={`text-sm rounded-lg px-3 py-2 ${
                    resendStatus.toLowerCase().includes("resent") ||
                    resendStatus.toLowerCase().includes("sent")
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                      : "text-rose-500 bg-rose-500/10 border border-rose-500/20"
                  }`}
                >
                  {resendStatus}
                </div>
              )}
            </div>

            <div className="text-center mt-5 text-sm text-soft">
              Already verified?{" "}
              <Link
                to="/login"
                className="text-brand-600 dark:text-brand-300 font-medium"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default registration form
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {themeButton}

      <div className="w-full max-w-md">
        {logo}

        <div className="card p-7">
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted mt-1">
            Free forever. Takes 30 seconds.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                value={form.name}
                onChange={set("name")}
                placeholder="Your name"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={set("password")}
                placeholder="At least 6 characters"
                required
              />
            </div>
            {err && (
              <div className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {err}
              </div>
            )}
            <button
              type="submit"
              className="btn-primary w-full py-3"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="text-center mt-5 text-sm text-soft">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-600 dark:text-brand-300 font-medium">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
