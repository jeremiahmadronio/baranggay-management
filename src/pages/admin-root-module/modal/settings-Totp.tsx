import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Shield, CheckCircle2, Copy } from "lucide-react";
import {
  authService,
  type MfaSetupResponse,
} from "../../../service/login-api/login";

interface TotpSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (recoveryCodes?: string[]) => void;
}
export function TotpSetupModal({
  isOpen,
  onClose,
  onSuccess,
}: TotpSetupModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
  const [isLoadingSetup, setIsLoadingSetup] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  useEffect(() => {
    if (!isOpen) return;

    const loadSetup = async () => {
      try {
        setIsLoadingSetup(true);
        setErrorMessage("");
        setStep(1);
        setCode(["", "", "", "", "", ""]);
        const data = await authService.initiateTotpSetup();
        setSetupData(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to generate TOTP setup details.",
        );
      } finally {
        setIsLoadingSetup(false);
      }
    };

    loadSetup();
  }, [isOpen]);

  const handleCopy = () => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
const handleVerify = async () => {
  try {
    setIsVerifying(true);
    setErrorMessage("");
    const fullCode = code.join("");
    const result = await authService.confirmTotpSetup({
      code: fullCode,
      secret: setupData!.secret, // ✅ idagdag
    });
    setIsVerifying(false);
    onSuccess(result.recoveryCodes);
  } catch (error) {
    setIsVerifying(false);
    setErrorMessage(
      error instanceof Error ? error.message : "Failed to verify TOTP code.",
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
            <Shield className="w-5 h-5 text-blue-600" />
            Setup Two-Factor Authentication
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isLoadingSetup ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 text-center">
                Generating QR code...
              </p>
              <div className="flex justify-center">
                <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              </div>
            </div>
          ) : step === 1 ? (
            <div className="space-y-6">
              <p className="text-sm text-slate-600 text-center">
                Scan this QR code with your authenticator app (like Google
                Authenticator or Authy).
              </p>

              <div className="flex justify-center">
                <div className="p-4 bg-white border-2 border-slate-100 rounded-xl">
                  <img
                    src={setupData?.qrCode || ""}
                    alt="TOTP QR Code"
                    className="w-40 h-40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Or enter this code manually
                </p>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <code className="flex-1 text-sm font-mono text-slate-800 tracking-widest text-center">
                    {setupData?.secret || "No secret generated"}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Copy secret"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!setupData?.secret}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Next Step
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-slate-600 text-center">
                Enter the 6-digit code generated by your authenticator app to
                verify setup.
              </p>

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
                      disabled={isVerifying}
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
                  disabled={code.some((c) => !c) || isVerifying}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Verify & Enable"
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
