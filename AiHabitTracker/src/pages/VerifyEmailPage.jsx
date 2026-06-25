import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Sun, Moon, CheckCircle, AlertTriangle } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import api from "../api/axios.js";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  // 'idle'      — token present, waiting for user to click confirm
  // 'loading'   — POST in progress
  // 'success'   — verified
  // 'error'     — token invalid/expired (400)
  // 'unexpected'— server/network error
  // 'noToken'   — no token in URL
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirming, setConfirming] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("noToken");
      const timer = setTimeout(() => navigate("/login", { replace: true }), 3000);
      return () => clearTimeout(timer);
    }
    // Token present — stay in idle, wait for user click
    setStatus("idle");
  }, [token, navigate]);

  const handleConfirm = async () => {
    setConfirming(true);
    setStatus("loading");
    try {
      await api.post(`/auth/verify-email`, { token });
      setStatus("success");
    } catch (err) {
      if (err.response?.status === 400) {
        setStatus("error");
        setErrorMessage(err.response.data?.message || "Verification failed.");
      } else {
        setStatus("unexpected");
      }
    } finally {
      setConfirming(false);
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
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Sparkles size={18} />
          </div>
          <span className="font-semibold text-lg">AI Habit Tracker</span>
        </Link>

        <div className="card p-7">
          {status === "idle" && (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-500/10 flex items-center justify-center">
                <CheckCircle size={32} className="text-brand-500" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Confirm your email</h1>
                <p className="text-sm text-muted mt-2">
                  Click the button below to verify your email address and activate your account.
                </p>
              </div>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="btn-primary w-full py-3 mt-2"
              >
                {confirming ? "Verifying…" : "Verify my email"}
              </button>
            </div>
          )}

          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <LoadingSpinner size={40} />
              <p className="text-sm text-muted">Verifying your email…</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Email Verified!</h1>
                <p className="text-sm text-muted mt-2">
                  Your email has been verified successfully. You can now log in.
                </p>
              </div>
              <Link to="/login" className="btn-primary w-full py-3 text-center mt-2">
                Go to Login
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle size={32} className="text-rose-500" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Verification Failed</h1>
                <p className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 mt-3">
                  {errorMessage}
                </p>
              </div>
              <Link
                to="/login"
                className="text-sm text-brand-600 dark:text-brand-300 font-medium mt-1"
              >
                Resend verification email
              </Link>
            </div>
          )}

          {status === "unexpected" && (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle size={32} className="text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Something Went Wrong</h1>
                <p className="text-sm text-muted mt-2">
                  Verification could not be completed. Please try again later.
                </p>
              </div>
              <Link to="/login" className="btn-primary w-full py-3 text-center mt-2">
                Go to Login
              </Link>
            </div>
          )}

          {status === "noToken" && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle size={32} className="text-amber-500" />
              </div>
              <p className="text-sm text-muted">
                No verification token provided. Redirecting to login…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
