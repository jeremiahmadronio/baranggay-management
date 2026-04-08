import { User, ShieldCheck, Mail, AtSign, Phone } from "lucide-react";
import {
  ReusableSettings,
  type SettingsSectionConfig,
} from "../../reusable/Settings";
import {
  getSettingsPreview,
  updateSettings,
} from "../../admin-root-api/admin-management";

const ACCOUNT_SECTIONS: SettingsSectionConfig[] = [
  {
    title: "Personal Information",
    subtitle: "Your name and contact details",
    icon: User,
    fields: [
      {
        key: "firstName",
        label: "First Name",
        type: "text",
        placeholder: "Juan",
        required: true,
      },
      {
        key: "lastName",
        label: "Last Name",
        type: "text",
        placeholder: "Dela Cruz",
        required: true,
      },
      {
        key: "username",
        label: "Username",
        type: "text",
        placeholder: "jdelacruz",
        icon: <AtSign className="w-3.5 h-3.5" />,
        required: true,
      },
      {
        key: "email",
        label: "Email Address",
        type: "email",
        placeholder: "juan@example.gov.ph",
        icon: <Mail className="w-3.5 h-3.5" />,
        required: true,
      },
      {
        key: "contactNumber",
        label: "Contact Number",
        type: "tel",
        placeholder: "+63 900 000 0000",
        icon: <Phone className="w-3.5 h-3.5" />,
        hint: " e.g. +63 912 345 6789",
        required: true,
      },
    ],
  },
  {
    title: "Security",
    subtitle: "Change your password",
    icon: ShieldCheck,
    fields: [
      {
        key: "password",
        label: "New Password",
        type: "password",
        placeholder: "Min. 8 characters",
        hint: "Leave blank to keep your current password unchanged",
      },
      {
        key: "confirmPassword",
        label: "Confirm New Password",
        type: "confirmPassword",
        placeholder: "Repeat new password",
        confirmOf: "password",
      },
    ],
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminSettings() {
  // Load the current user's settings
  const loadData = async () => {
    const data = await getSettingsPreview();
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      contactNumber: data.contactNumber,
      password: "",
      confirmPassword: "",
    };
  };

  // Save updated settings
  const saveData = async (values: Record<string, string>) => {
    await updateSettings({
      id: values.id,
      username: values.username,
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      contactNumber: values.contactNumber,
      password: values.password,
    });
  };

  return (
    <ReusableSettings
      loadData={loadData}
      saveData={saveData}
      sections={ACCOUNT_SECTIONS}
      omitOnSave={["confirmPassword"]}
      avatarKeys={["firstName", "lastName"]}
      nameKeys={["firstName", "lastName"]}
      columns={2}
    />
  );
}
