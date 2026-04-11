import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { AuthLayout } from "./AuthLayout";
import { resetPasswordService } from "../../service/login-api/reset-password";

export function ResetCodeVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const navEmail = (location.state as { email?: string })?.email;
  const [email] = useState(
    navEmail || localStorage.getItem("resetEmail") || "",
  );

  useEffect(() => {
    if (navEmail) {
      localStorage.setItem("resetEmail", navEmail);
    }
  }, [navEmail]);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const maskedEmail = email
    ? email.replace(/(.{1,3})(.*)(@.*)/, "$1***$3")
    : "";

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (countdown > 0 && !canResend) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown, canResend]);

  const handleResend = async () => {
    if (!canResend) return;
    setCountdown(60);
    setCanResend(false);
    setError("");

    try {
      await resetPasswordService.forgotPassword(email);
    } catch (err: any) {
      setError(err.message || "Failed to resend code. Please try again.");
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);

    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && index > 0 && code[index] === "") {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6)
      .split("");
    const newCode = [...code];

    pastedData.forEach((char, i) => {
      if (i < 6) newCode[i] = char;
    });

    setCode(newCode);
    const nextFocusIndex = pastedData.length < 6 ? pastedData.length : 5;
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const isComplete = code.every((digit) => digit !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;
    setIsLoading(true);
    setError("");

    try {
      const fullCode = code.join("");
      await resetPasswordService.verifyResetCode({ email, code: fullCode });
      localStorage.setItem("resetCode", fullCode);
      navigate("/reset-password", { state: { email, code: fullCode } });
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 p-4 rounded-full">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-slate-500 text-sm">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-slate-900">{maskedEmail}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-start gap-2">
            <div className="mt-0.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-center gap-2 sm:gap-4">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-slate-900 bg-slate-50 focus:bg-white"
                disabled={isLoading}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || !isComplete}
            className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold shadow-lg shadow-blue-200"
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
            ) : (
              "Verify & Continue"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-blue-600 font-medium hover:underline text-sm"
            >
              Resend verification code
            </button>
          ) : (
            <span className="text-slate-400 text-sm italic">
              Resend available in {countdown}s
            </span>
          )}
          <div className="mt-4">
            <Link
              to="/forgot-password"
              className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </div>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
