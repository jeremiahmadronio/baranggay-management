import { useNavigate } from "react-router-dom";

export function TermsAndConditionsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      {/* The "Bond Paper" Container */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-16 shadow-md border border-slate-200 rounded-sm">
        {/* Document Header */}
        <div className="text-center mb-12 border-b border-slate-300 pb-8">
          {/* 🚩 TEXT COLOR UPDATE: text-[#1e3a5f] */}
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-2 text-[#1e3a5f]">
            Terms and Conditions
          </h1>
          {/* 🚩 TEXT COLOR UPDATE: text-blue-600 */}
          <p className="text-blue-600 font-medium">
            Barangay Ugong Management System (BUMS)
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Effective Date: January 1, 2025
          </p>
        </div>

        {/* Notice */}
        {/* 🚩 COLOR UPDATE: bg-blue-50 border-blue-600 */}
        <div className="mb-10 p-5 bg-blue-50  border-blue-600 text-slate-700 italic text-sm">
          <strong className="text-[#1e3a5f]">Important Notice:</strong> These
          Terms and Conditions govern the access and use of the Barangay Ugong
          Management System (BUMS). By accessing this system, you acknowledge
          that you have read, understood, and agree to comply with all
          provisions stated herein.
        </div>

        {/* Rules Content */}
        <div className="space-y-8 text-justify leading-relaxed text-slate-700">
          <section>
            {/* 🚩 TEXT COLOR UPDATE: text-[#1e3a5f] */}
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">
              1. Scope and Purpose
            </h2>
            <p>
              The Barangay Ugong Management System is an official digital
              platform developed to streamline and digitize barangay operations,
              including but not limited to resident records management, document
              request processing, clearance issuance, case management, and
              community service coordination. The system is exclusively for
              official use by authorized barangay personnel and officials of
              Barangay Ugong, Valenzuela City.
            </p>
          </section>

          <section>
            {/* 🚩 TEXT COLOR UPDATE: text-[#1e3a5f] */}
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">
              2. Authorized Users and Role Responsibilities
            </h2>
            <p className="mb-3">
              Access to this system is limited to officially designated user
              roles. Each user is solely responsible for all actions performed
              under their account:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>
                <strong className="text-slate-800">Root Administrator:</strong>{" "}
                Manages system-wide configurations, user accounts, and system
                integrity.
              </li>
              <li>
                <strong className="text-slate-800">Admin:</strong> Oversees
                daily operations, resident records, and supervises staff
                activity.
              </li>
              <li>
                <strong className="text-slate-800">Kapitana:</strong> Has
                supervisory and approval authority over all transactions and
                documents.
              </li>
              <li>
                <strong className="text-slate-800">Lupong Tagapamayapa:</strong>{" "}
                Manages barangay justice and mediation proceedings.
              </li>
              <li>
                <strong className="text-slate-800">VAWC Staff:</strong> Handles
                confidential case records involving violence against women and
                children (RA 9262).
              </li>
              <li>
                <strong className="text-slate-800">BCPC Staff:</strong> Manages
                child welfare cases and monitoring of at-risk children.
              </li>
              <li>
                <strong className="text-slate-800">Clearance Staff:</strong>{" "}
                Processes and issues barangay clearance documents.
              </li>
              <li>
                <strong className="text-slate-800">
                  First-Time Job Seeker:
                </strong>{" "}
                Facilitates applications in compliance with RA 11261.
              </li>
              <li>
                <strong className="text-slate-800">Operations Staff:</strong>{" "}
                Handles general transactions and coordination of services.
              </li>
              <li>
                <strong className="text-slate-800">Content Editor:</strong>{" "}
                Manages the barangay's public-facing landing page.
              </li>
            </ul>
          </section>

          <section>
            {/* 🚩 TEXT COLOR UPDATE: text-[#1e3a5f] */}
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">
              3. Account Security and Credential Management
            </h2>
            <p>
              Each authorized user is issued a unique account and is strictly
              prohibited from sharing login credentials with any other person.
              You are responsible for all activities under your account. You
              must use a strong password, enable Multi-Factor Authentication
              (MFA), and log out when unattended. Any unauthorized access must
              be reported immediately. Failure to report a breach may result in
              disciplinary action.
            </p>
          </section>

          <section>
            {/* 🚩 TEXT COLOR UPDATE: text-[#1e3a5f] */}
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">
              4. Data Privacy and Confidentiality
            </h2>
            <p className="mb-2">
              All users are bound by the{" "}
              <strong className="text-blue-600">
                Data Privacy Act of 2012 (Republic Act No. 10173)
              </strong>
              . As a user, you agree to:
            </p>
            <ul className="list-decimal pl-6 space-y-1 text-sm mb-3">
              <li>
                Handle all resident data and case records with strict
                confidentiality.
              </li>
              <li>
                Access only the data necessary for the performance of your
                duties.
              </li>
              <li>
                Refrain from unauthorized copying, downloading, or sharing of
                personal information.
              </li>
              <li>
                Ensure printed documents are stored or disposed of securely.
              </li>
              <li>Immediately report any suspected data breach.</li>
            </ul>
            <p className="text-sm font-semibold text-slate-800">
              * Special Note: VAWC and BCPC case records are subject to
              heightened confidentiality and restricted access.
            </p>
          </section>

          <section>
            {/* 🚩 TEXT COLOR UPDATE: text-[#1e3a5f] */}
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">
              5. Acceptable Use Policy
            </h2>
            <p className="mb-2">
              The system must be used solely for official barangay purposes. The
              following are <strong>strictly prohibited</strong>:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>
                Using the system for personal, commercial, or political
                purposes.
              </li>
              <li>
                Attempting to gain unauthorized access to restricted modules.
              </li>
              <li>
                Tampering, altering, or deleting official records without
                authorization.
              </li>
              <li>Uploading malicious files, software, or code.</li>
              <li>Misrepresenting your identity or role.</li>
            </ul>
          </section>

          <section>
            {/* 🚩 TEXT COLOR UPDATE: text-[#1e3a5f] */}
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">
              6. Audit Trails and Monitoring
            </h2>
            <p>
              All actions performed within the system are automatically logged
              in an audit trail. This includes document processing, data
              modifications, and login events. These logs are maintained for
              accountability and security. Users have no reasonable expectation
              of privacy regarding their actions within this official government
              system.
            </p>
          </section>

          <section>
            {/* 🚩 TEXT COLOR UPDATE: text-[#1e3a5f] */}
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">
              7. Sanctions and Consequences for Violations
            </h2>
            <p className="mb-2">Any violation of these Terms may result in:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>
                Immediate suspension or permanent revocation of system access.
              </li>
              <li>Disciplinary action under Civil Service Commission rules.</li>
              <li>
                Legal Prosecution (e.g., Data Privacy Act, Cybercrime Prevention
                Act).
              </li>
              <li>
                Additional penalties under RA 9262 for sensitive case
                violations.
              </li>
            </ul>
          </section>

          <section>
            {/* 🚩 TEXT COLOR UPDATE: text-[#1e3a5f] */}
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">
              8. System Availability
            </h2>
            <p>
              The BUMS is provided on an "as is" basis. While reasonable efforts
              are made to maintain availability, Barangay Ugong does not
              guarantee uninterrupted access. Scheduled maintenance or technical
              issues may result in temporary interruptions.
            </p>
          </section>

          <section>
            {/* 🚩 TEXT COLOR UPDATE: text-[#1e3a5f] */}
            <h2 className="text-lg font-bold text-[#1e3a5f] mb-3">
              9. Amendments
            </h2>
            <p>
              Barangay Ugong reserves the right to update these Terms and
              Conditions as deemed necessary. Continued use of the system
              constitutes acceptance of the revised terms.
            </p>
          </section>
        </div>

        {/* Footer & Action */}
        <div className="mt-12 pt-8 border-t border-slate-300 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="text-sm text-slate-500 text-center sm:text-left">
            <p>Issued by: Office of the Punong Barangay</p>
            <p>Barangay Ugong, Valenzuela City</p>
          </div>

          {/* 🚩 BUTTON COLOR UPDATE: bg-[#1e3a5f] and hover:bg-blue-800 */}
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-sm hover:bg-blue-800 transition-colors w-full sm:w-auto"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
