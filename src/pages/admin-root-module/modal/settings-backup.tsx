import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Mail, ArrowRight } from "lucide-react";
import { authService } from "../../../service/login-api/login";
import { checkBackupEmailAvailability } from "../../../service/admin-root-api/admin-management";

interface BackupEmailModalProps {
  isOpen: boolean;
  primaryEmail: string;
  onClose: () => void;
  onSuccess: (email: string) => void;
}
export function BackupEmailModal({
  isOpen,
  primaryEmail,
  onClose,
  onSuccess,
}: BackupEmailModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingBackup, setIsCheckingBackup] = useState(false);
  const [backupEmailTaken, setBackupEmailTaken] = useState(false);
  const [backupCheckMessage, setBackupCheckMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen || step !== 1) {
      setIsCheckingBackup(false);
      setBackupEmailTaken(false);
      setBackupCheckMessage("");
      return;
    }

    const trimmedEmail = email.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!trimmedEmail || !isValidEmail) {
      setIsCheckingBackup(false);
      setBackupEmailTaken(false);
      setBackupCheckMessage("");
      return;
    }

    if (trimmedEmail.toLowerCase() === primaryEmail.trim().toLowerCase()) {
      setIsCheckingBackup(false);
      setBackupEmailTaken(true);
      setBackupCheckMessage(
        "Backup email must be different from primary email.",
      );
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setIsCheckingBackup(true);
        setBackupCheckMessage("");
        const taken = await checkBackupEmailAvailability(trimmedEmail);
        setBackupEmailTaken(taken);
        setBackupCheckMessage(taken ? "Backup email is already taken." : "");
      } catch {
        setBackupEmailTaken(false);
        setBackupCheckMessage("");
      } finally {
        setIsCheckingBackup(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [email, isOpen, primaryEmail, step]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);

    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && index > 0 && code[index] === "") {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
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

  const handleInitiate = async () => {
    if (backupEmailTaken) {
      setErrorMessage(backupCheckMessage || "Backup email is already taken.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      await authService.initiateBackupEmail(primaryEmail, email);
      setIsLoading(false);
      setStep(2);
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to send verification code.",
      );
    }
  };

  const handleVerify = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const fullCode = code.join("");
      await authService.verifyBackupEmail(primaryEmail, email, fullCode);
      setIsLoading(false);
      onSuccess(email);
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to verify backup email.",
      );
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          scale: 0.95,
        }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Mail className="w-5 h-5 text-blue-600" />
            Setup Backup Email
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-5">
              <p className="text-sm text-slate-600">
                Add a backup email address to recover your account if you lose
                access to your primary email or two-factor authentication.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Backup Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="backup@example.com"
                  className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 outline-none transition-all ${backupEmailTaken ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"}`}
                />
                {isCheckingBackup && (
                  <p className="text-xs text-slate-500">
                    Checking backup email availability...
                  </p>
                )}
                {!isCheckingBackup && backupCheckMessage && (
                  <p className="text-xs text-red-600">{backupCheckMessage}</p>
                )}
              </div>

              <button
                onClick={handleInitiate}
                disabled={
                  !email.includes("@") ||
                  isLoading ||
                  !primaryEmail ||
                  isCheckingBackup ||
                  backupEmailTaken
                }
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Verification Code <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
                We've sent a 6-digit verification code to{" "}
                <strong>{email}</strong>.
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Verification Code
                </label>
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
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      onPaste={handleCodePaste}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-slate-900 bg-slate-50 focus:bg-white"
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleVerify}
                  disabled={code.some((c) => !c) || isLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Verify Email"
                  )}
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errorMessage}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
