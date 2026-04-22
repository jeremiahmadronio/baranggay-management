import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Loader2,
  Shield,
  Mail,
  Smartphone,
  Copy,
  CheckCircle2,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLayout } from "./AuthLayout";
import { authService } from "../../service/login-api/login";
import { ActionModal } from "../../reusable";
export function SecuritySetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // Always get email from location.state or fallback to localStorage
  const email =
    (
      location.state as {
        email?: string;
      }
    )?.email ||
    localStorage.getItem("userEmail") ||
    "";
  // Step 1: Backup Email States
  const [backupEmail, setBackupEmail] = useState("");
  const [backupEmailStep, setBackupEmailStep] = useState<
    "ENTER_EMAIL" | "ENTER_CODE"
  >("ENTER_EMAIL");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Step 2: TOTP States
  const [totpSecret, setTotpSecret] = useState("");
  const [totpQrCode, setTotpQrCode] = useState("");
  const [totpCode, setTotpCode] = useState(["", "", "", "", "", ""]);
  const [copied, setCopied] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined = undefined;
    if (countdown > 0 && !canResend && backupEmailStep === "ENTER_CODE") {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown, canResend, backupEmailStep]);
  const loadTotpSetup = async () => {
    try {
      const response = await authService.initiateTotpSetup();
      setTotpSecret(response.secret);
      setTotpQrCode(response.qrCode);
    } catch (err: any) {
      setError("Failed to load authenticator setup. Please try again.");
    }
  };
  const handleSendBackupEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupEmail) return;
    setIsLoading(true);
    setError("");
    try {
      await authService.initiateBackupEmail(email, backupEmail);
      setBackupEmailStep("ENTER_CODE");
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || "Failed to send verification code.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleVerifyBackupEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) return;
    setIsLoading(true);
    setError("");
    try {
      await authService.verifyBackupEmail(email, backupEmail, fullCode);
      setStep(2);
      loadTotpSetup();
    } catch (err: any) {
      setError(err.message || "Verification failed.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };
 const handleVerifyTotp = async (e: React.FormEvent) => {
  e.preventDefault();
  const fullCode = totpCode.join("");
  if (fullCode.length !== 6) return;
  setIsLoading(true);
  setError("");
  try {
    const response = await authService.confirmTotpSetup({
      code: fullCode,
    secret: totpSecret, 
    });
      if (response.status === "SUCCESS") {
        setRecoveryCodes(response.recoveryCodes);
        setShowRecoveryModal(true);
      }
    } catch (err: any) {
      setError(err.message || "Verification failed.");
      setTotpCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };
  const handleCopySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleDownloadRecoveryCodes = () => {
    const element = document.createElement("a");
    const file = new Blob([recoveryCodes.join("\n")], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    element.download = "recovery_codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  const handleFinishSetup = () => {
    setShowRecoveryModal(false);
    navigate("/login");
  };
  const handleSkip = () => {
    if (step === 1) {
      setStep(2);
      loadTotpSetup();
    } else {
      navigate("/login");
    }
  };
  const renderOtpInput = (
    values: string[],
    setValues: (v: string[]) => void,
  ) => {
    const handleChange = (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const newCode = [...values];
      newCode[index] = value.substring(value.length - 1);
      setValues(newCode);
      if (value !== "" && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    };
    const handleKeyDown = (
      index: number,
      e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (e.key === "Backspace" && index > 0 && values[index] === "") {
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
      const newCode = [...values];
      pastedData.forEach((char, i) => {
        if (i < 6) newCode[i] = char;
      });
      setValues(newCode);
      const nextFocusIndex = pastedData.length < 6 ? pastedData.length : 5;
      inputRefs.current[nextFocusIndex]?.focus();
    };
    return (
      <div className="flex justify-center gap-2 sm:gap-4">
        {values.map((digit, index) => (
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
    );
  };
  return (
    <AuthLayout>
      <div className="w-full">
        {/* Step Indicator */}
        <div className="flex justify-center items-center gap-2 mb-8">
          <div
            className={`h-2 w-12 rounded-full transition-colors ${step >= 1 ? "bg-blue-600" : "bg-slate-200"}`}
          />
          <div
            className={`h-2 w-12 rounded-full transition-colors ${step >= 2 ? "bg-blue-600" : "bg-slate-200"}`}
          />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{
                opacity: 0,
                x: -20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: 20,
              }}
              className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-blue-50 p-4 rounded-full">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Set Up Backup Email
                </h2>
                <p className="text-slate-500 text-sm">
                  Add a backup email for account recovery
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5" />
                  {error}
                </div>
              )}

              {backupEmailStep === "ENTER_EMAIL" ? (
                <form
                  onSubmit={handleSendBackupEmailCode}
                  className="space-y-6"
                >
                  <div>
                    <label
                      htmlFor="backupEmail"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Backup Email Address
                    </label>
                    <input
                      id="backupEmail"
                      type="email"
                      required
                      value={backupEmail}
                      onChange={(e) => setBackupEmail(e.target.value)}
                      className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                      placeholder="backup@example.com"
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !backupEmail}
                    className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold shadow-lg shadow-blue-200"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    ) : (
                      "Send Verification Code"
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyBackupEmail} className="space-y-8">
                  {renderOtpInput(code, setCode)}
                  <button
                    type="submit"
                    disabled={isLoading || code.some((c) => !c)}
                    className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold shadow-lg shadow-blue-200"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    ) : (
                      "Verify & Continue"
                    )}
                  </button>
                  <div className="text-center">
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleSendBackupEmailCode}
                        className="text-blue-600 font-medium hover:underline text-sm"
                      >
                        Resend verification code
                      </button>
                    ) : (
                      <span className="text-slate-400 text-sm italic">
                        Resend available in {countdown}s
                      </span>
                    )}
                  </div>
                </form>
              )}

              <div className="mt-6 text-center">
                <button
                  onClick={handleSkip}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{
                opacity: 0,
                x: -20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: 20,
              }}
              className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-blue-50 p-4 rounded-full">
                  <Smartphone className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Set Up Authenticator App
                </h2>
                <p className="text-slate-500 text-sm">
                  Scan the QR code or enter the key manually in your
                  authenticator app
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="flex flex-col items-center mb-8">
                {totpQrCode ? (
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm mb-4">
                    <img src={totpQrCode} alt="QR Code" className="w-40 h-40" />
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-slate-100 rounded-xl animate-pulse mb-4" />
                )}

                <div className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <code className="text-sm font-mono text-slate-700 tracking-wider">
                    {totpSecret || "LOADING..."}
                  </code>
                  <button
                    onClick={handleCopySecret}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Copy secret key"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <form onSubmit={handleVerifyTotp} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                    Enter the 6-digit code from your app
                  </label>
                  {renderOtpInput(totpCode, setTotpCode)}
                </div>
                <button
                  type="submit"
                  disabled={isLoading || totpCode.some((c) => !c)}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold shadow-lg shadow-blue-200"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  ) : (
                    "Verify & Complete Setup"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={handleSkip}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ActionModal
        isOpen={showRecoveryModal}
        onClose={handleFinishSetup}
        title="Save Your Recovery Codes"
        type="success"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Authenticator app setup is complete! Please save these emergency
            recovery codes in a secure place. You can use them to access your
            account if you lose your device.
          </p>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 gap-2">
            {recoveryCodes.map((code, idx) => (
              <code
                key={idx}
                className="text-sm font-mono text-center py-1 bg-white border border-slate-100 rounded"
              >
                {code}
              </code>
            ))}
          </div>
          <button
            onClick={handleDownloadRecoveryCodes}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Download Codes
          </button>
        </div>
      </ActionModal>
    </AuthLayout>
  );
}
