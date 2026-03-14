import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  BookOpen,
  Users,
  Lock,
  Eye,
  FileCheck,
  Activity,
  AlertTriangle,
  Server,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

const sections = [
  { id: "scope", number: 1, title: "Scope and Purpose", icon: BookOpen },
  { id: "users", number: 2, title: "Authorized Users & Roles", icon: Users },
  { id: "security", number: 3, title: "Account Security", icon: Lock },
  {
    id: "privacy",
    number: 4,
    title: "Data Privacy & Confidentiality",
    icon: Eye,
  },
  {
    id: "acceptable",
    number: 5,
    title: "Acceptable Use Policy",
    icon: FileCheck,
  },
  {
    id: "audit",
    number: 6,
    title: "Audit Trails & Monitoring",
    icon: Activity,
  },
  {
    id: "sanctions",
    number: 7,
    title: "Sanctions & Consequences",
    icon: AlertTriangle,
  },
  { id: "availability", number: 8, title: "System Availability", icon: Server },
  {
    id: "amendments",
    number: 9,
    title: "Amendments to These Terms",
    icon: RefreshCw,
  },
];

const roles = [
  {
    title: "Root Administrator",
    desc: "Manages system-wide configurations, user accounts, roles, permissions, and system integrity. Has full access to all modules and audit logs.",
  },
  {
    title: "Admin",
    desc: "Oversees daily system operations, manages resident records, processes documents, and supervises staff activity within assigned modules.",
  },
  {
    title: "Kapitana",
    desc: "The Punong Barangay has supervisory and approval authority over all barangay transactions, reports, and official documents processed through the system.",
  },
  {
    title: "Lupong Tagapamayapa",
    desc: "Manages barangay justice and mediation proceedings, including case filing, scheduling, documentation of hearings, and issuance of settlement certificates.",
  },
  {
    title: "VAWC Staff",
    desc: "Handles confidential case records involving violence against women and children, including incident reports, referrals, and follow-up monitoring, in accordance with RA 9262.",
  },
  {
    title: "BCPC Staff",
    desc: "Manages child welfare cases, child-friendly programs, monitoring of at-risk children, and coordination with relevant government agencies.",
  },
  {
    title: "Clearance Staff",
    desc: "Processes and issues barangay clearance documents for residents, including verification of residency and clearance status records.",
  },
  {
    title: "First-Time Job Seeker",
    desc: "Facilitates and processes Certificate of First-Time Job Seeker applications in compliance with RA 11261.",
  },
  {
    title: "Operations Staff",
    desc: "Handles general operational transactions including document requests, announcements, scheduling, and coordination of barangay services.",
  },
  {
    title: "Content Editor",
    desc: "Manages and publishes content on the barangay's public-facing landing page, including announcements, news, events, and informational materials.",
  },
];

const SectionCard = React.forwardRef<
  HTMLDivElement,
  {
    id: string;
    number: number;
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
  }
>(({ id, number, icon: Icon, title, children }, ref) => (
  <div
    id={id}
    ref={ref}
    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-4"
  >
    <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-slate-50">
      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-blue-600 uppercase tracking-wide">
          Section {number}
        </span>
        <span className="text-slate-300">·</span>
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
      </div>
    </div>
    <div className="px-6 py-6 text-base text-slate-700 leading-relaxed">
      {children}
    </div>
  </div>
));
SectionCard.displayName = "SectionCard";

export function TermsAndConditionsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("scope");
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const progress = Math.min(
        100,
        Math.round((scrollTop / (scrollHeight - clientHeight)) * 100),
      );
      setReadProgress(isNaN(progress) ? 0 : progress);
      for (const sec of [...sections].reverse()) {
        const ref = sectionRefs.current[sec.id];
        if (!ref) continue;
        const top =
          ref.getBoundingClientRect().top - el.getBoundingClientRect().top;
        if (top <= 60) {
          setActiveSection(sec.id);
          break;
        }
      }
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="max-w-6xl mx-auto"
      >
        {/* ── Hero Header ── */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl overflow-hidden mb-6 px-8 py-12 text-white shadow-lg">
          {/* Decorative rings */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[200, 300, 400, 500].map((size, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-white/15"
                style={{
                  width: size,
                  height: size,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-18 h-18 bg-white/15 border border-white/25 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0 p-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="text-center sm:text-left">
             
              <h1 className="text-4xl font-bold mb-2">Terms and Conditions</h1>
              <p className="text-blue-100 text-base">
                Barangay Ugong Management System (BUMS) &nbsp;·&nbsp; Effective
                January 1, 2025
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
            <div
              className="h-full bg-white transition-all duration-150"
              style={{ width: `${readProgress}%` }}
            />
          </div>
          <div className="absolute bottom-3 right-5 text-sm text-white font-medium tabular-nums">
            {readProgress}% read
          </div>
        </div>

        {/* ── Layout: Sidebar + Content ── */}
        <div className="flex gap-6 items-start">
          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col gap-1.5 w-64 flex-shrink-0 sticky top-8">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide px-3 mb-2">
              Contents
            </p>
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all group ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-600 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive
                        ? "bg-white/20"
                        : "bg-slate-100 group-hover:bg-blue-50"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 group-hover:text-blue-600"}`}
                    />
                  </div>
                  <span className="text-sm font-medium leading-tight flex-1">
                    {sec.title}
                  </span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 opacity-60 flex-shrink-0" />
                  )}
                </button>
              );
            })}

            <div className="mt-4 mx-3 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Reading progress</span>
                <span className="text-sm font-bold text-blue-600 tabular-nums">
                  {readProgress}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${readProgress}%` }}
                />
              </div>
              {readProgress === 100 && (
                <p className="text-sm text-green-600 font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Fully read!
                </p>
              )}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Intro notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-5 mb-4 text-base text-slate-700 leading-relaxed">
              <strong className="text-blue-600">Important Notice: </strong>
              These Terms and Conditions govern the access and use of the{" "}
              <strong>Barangay Ugong Management System (BUMS)</strong>. By
              accessing this system, you acknowledge that you have read,
              understood, and agree to comply with all provisions stated herein.
            </div>

            {/* Scrollable sections */}
            <div
              ref={contentRef}
              className="overflow-y-auto space-y-4 pr-0.5"
              style={{
                maxHeight: "62vh",
                scrollbarWidth: "thin",
                scrollbarColor: "#cbd5e1 transparent",
              }}
            >
              {/* Section 1 */}
              <SectionCard
                id="scope"
                number={1}
                icon={BookOpen}
                title="Scope and Purpose"
                ref={(el) => {
                  sectionRefs.current["scope"] = el;
                }}
              >
                <p>
                  The Barangay Ugong Management System is an official digital
                  platform developed to streamline and digitize barangay
                  operations, including but not limited to resident records
                  management, document request processing, clearance issuance,
                  case management, and community service coordination. The
                  system is exclusively for official use by authorized barangay
                  personnel and officials of Barangay Ugong, Valenzuela City.
                </p>
              </SectionCard>

              {/* Section 2 */}
              <SectionCard
                id="users"
                number={2}
                icon={Users}
                title="Authorized Users and Role Responsibilities"
                ref={(el) => {
                  sectionRefs.current["users"] = el;
                }}
              >
                <p className="mb-4">
                  Access to this system is limited to the following officially
                  designated user roles. Each user is solely responsible for all
                  actions performed under their account:
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {roles.map((role) => (
                    <div
                      key={role.title}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                    >
                      <p className="font-semibold text-blue-600 text-sm mb-1.5">
                        {role.title}
                      </p>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {role.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Section 3 */}
              <SectionCard
                id="security"
                number={3}
                icon={Lock}
                title="Account Security and Credential Management"
                ref={(el) => {
                  sectionRefs.current["security"] = el;
                }}
              >
                <p>
                  Each authorized user is issued a unique account and is
                  strictly prohibited from sharing login credentials with any
                  other person, regardless of role or relationship. You are
                  responsible for all activities that occur under your account.
                  You must use a strong password, enable Multi-Factor
                  Authentication (MFA) when required, and log out of the system
                  whenever leaving your workstation unattended. Any unauthorized
                  access, suspicious activity, or suspected credential
                  compromise must be reported immediately to the Root
                  Administrator or system administrator. Failure to report a
                  breach may result in disciplinary action.
                </p>
              </SectionCard>

              {/* Section 4 */}
              <SectionCard
                id="privacy"
                number={4}
                icon={Eye}
                title="Data Privacy and Confidentiality"
                ref={(el) => {
                  sectionRefs.current["privacy"] = el;
                }}
              >
                <p className="mb-4">
                  All users are bound by the{" "}
                  <strong>
                    Data Privacy Act of 2012 (Republic Act No. 10173)
                  </strong>
                  . As a user, you agree to:
                </p>
                <ul className="space-y-3 mb-4">
                  {[
                    "Handle all resident data, case records, and personal information with strict confidentiality.",
                    "Access only the data necessary for the performance of your assigned duties.",
                    "Refrain from unauthorized copying, downloading, printing, or sharing of any personal or sensitive information.",
                    "Ensure that printed documents containing personal data are stored or disposed of securely.",
                    "Immediately report any suspected data breach or unauthorized disclosure to the system administrator.",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Special Note:</strong> VAWC and BCPC case records
                    are subject to heightened confidentiality obligations and
                    may only be accessed by users with explicit authorization
                    for those modules.
                  </p>
                </div>
              </SectionCard>

              {/* Section 5 */}
              <SectionCard
                id="acceptable"
                number={5}
                icon={FileCheck}
                title="Acceptable Use Policy"
                ref={(el) => {
                  sectionRefs.current["acceptable"] = el;
                }}
              >
                <p className="mb-4">
                  The system must be used solely for official barangay purposes.
                  The following actions are{" "}
                  <strong>strictly prohibited:</strong>
                </p>
                <ul className="space-y-3">
                  {[
                    "Using the system for personal, commercial, or political purposes.",
                    "Attempting to gain unauthorized access to restricted modules or other user accounts.",
                    "Tampering, altering, or deleting official records without proper authorization and documentation.",
                    "Uploading or introducing malicious files, software, or code into the system.",
                    "Performing automated scraping, unauthorized API calls, or any action intended to overload or compromise the system.",
                    "Misrepresenting your identity or role when accessing or performing transactions in the system.",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-400 mt-2" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>

              {/* Section 6 */}
              <SectionCard
                id="audit"
                number={6}
                icon={Activity}
                title="Audit Trails and Monitoring"
                ref={(el) => {
                  sectionRefs.current["audit"] = el;
                }}
              >
                <p>
                  All actions performed within the system are automatically
                  logged and recorded in an audit trail. This includes document
                  processing, data modifications, login events, and system
                  access. These logs are maintained for accountability,
                  transparency, and security purposes. System administrators and
                  authorized officials may review these logs at any time. Users
                  are advised that they have no reasonable expectation of
                  privacy regarding their actions within this official
                  government system.
                </p>
              </SectionCard>

              {/* Section 7 */}
              <SectionCard
                id="sanctions"
                number={7}
                icon={AlertTriangle}
                title="Sanctions and Consequences for Violations"
                ref={(el) => {
                  sectionRefs.current["sanctions"] = el;
                }}
              >
                <p className="mb-4">
                  Any violation of these Terms and Conditions may result in:
                </p>
                <div className="space-y-3">
                  {[
                    {
                      label: "System Access Revocation",
                      desc: "Immediate suspension or permanent revocation of system access.",
                    },
                    {
                      label: "Administrative Sanctions",
                      desc: "Disciplinary action in accordance with Civil Service Commission rules and regulations.",
                    },
                    {
                      label: "Legal Action",
                      desc: "Prosecution under applicable Philippine laws including RA 10173 (Data Privacy Act), RA 10175 (Cybercrime Prevention Act), and RA 3019 (Anti-Graft and Corrupt Practices Act).",
                    },
                    {
                      label: "Special Cases (VAWC/BCPC)",
                      desc: "Additional penalties under RA 9262 and related child protection laws for violations involving sensitive case records.",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-4"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-700">
                          {item.label}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Section 8 */}
              <SectionCard
                id="availability"
                number={8}
                icon={Server}
                title="System Availability and Disclaimer"
                ref={(el) => {
                  sectionRefs.current["availability"] = el;
                }}
              >
                <p>
                  The Barangay Ugong Management System is provided on an "as is"
                  basis. While reasonable efforts are made to maintain system
                  availability and data integrity, Barangay Ugong does not
                  guarantee uninterrupted or error-free access to the system.
                  Scheduled maintenance, technical issues, or circumstances
                  beyond the barangay's control may result in temporary service
                  interruptions. Users are encouraged to report any technical
                  issues to the system administrator promptly.
                </p>
              </SectionCard>

              {/* Section 9 */}
              <SectionCard
                id="amendments"
                number={9}
                icon={RefreshCw}
                title="Amendments to These Terms"
                ref={(el) => {
                  sectionRefs.current["amendments"] = el;
                }}
              >
                <p>
                  Barangay Ugong reserves the right to update or amend these
                  Terms and Conditions at any time as deemed necessary. Users
                  will be notified of significant changes upon their next login.
                  Continued use of the system following notification of
                  amendments constitutes acceptance of the revised terms. It is
                  the responsibility of each user to remain informed of the
                  current Terms and Conditions.
                </p>
              </SectionCard>

              <div className="h-2" />
            </div>

            {/* Footer */}
            <div className="mt-5 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500 text-center sm:text-left">
                Issued by: Office of the Punong Barangay · Barangay Ugong,
                Valenzuela City
              </p>
              <div className="flex gap-3 flex-shrink-0">
                <button
                  onClick={() => navigate("/login")}
                  className="px-6 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
                >
                  Back to Login
                </button>
               
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
