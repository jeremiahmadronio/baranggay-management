import {
  SectionCard,
  FormRow,
  FormInput,
  FormSelect,
  FormDatePicker,
  SectionDivider,
} from '../reusable/FormComponents'
import { PersonSearchInput } from '../reusable/PersonSearchInput'
import {type PersonSearchResponseDTO } from '../../blotter-api/resident'
import { GENDER_OPTIONS, CIVIL_STATUS_OPTIONS } from './ComplaintSection'
export const RELATIONSHIP_OPTIONS = [
  {
    value: 'Spouse / Partner',
    label: 'Spouse / Partner',
  },
  {
    value: 'Parent',
    label: 'Parent',
  },
  {
    value: 'Child',
    label: 'Child',
  },
  {
    value: 'Sibling',
    label: 'Sibling',
  },
  {
    value: 'Neighbor',
    label: 'Neighbor',
  },
  {
    value: 'Acquaintance',
    label: 'Acquaintance',
  },
  {
    value: 'Stranger / Unknown',
    label: 'Stranger / Unknown',
  },
]
export interface RespondentState {
  id?: number
  lastName: string
  firstName: string
  middleName: string
  contact: string
  relationship: string
  address: string
  alias: string
  age: string
  dob: string
  gender: string
  civilStatus: string
  occupation: string
  livingWith: 'true' | 'false' | ''
}
interface RespondentSectionProps {
  mode: 'record' | 'formal'
  data: RespondentState
  onChange: (field: keyof RespondentState, value: any) => void
  errors: Record<string, string>
  clearErr: (key: string) => void
}
export const RespondentSection = ({
  mode,
  data,
  onChange,
  errors,
  clearErr,
}: RespondentSectionProps) => {
  const handleSelectPerson = (person: PersonSearchResponseDTO) => {
    onChange('id', person.id)
    onChange('firstName', person.firstName)
    onChange('lastName', person.lastName)
    onChange('middleName', person.middleName || '')
    onChange('contact', person.contactNumber || '')
    onChange('age', person.age ? String(person.age) : '')
    onChange('dob', person.birthDate || '')
    onChange('gender', person.gender || '')
    onChange('civilStatus', person.civilStatus || '')
    onChange('address', person.completeAddress || '')
    ;['rLastName', 'rFirstName'].forEach(clearErr)
  }
  if (mode === 'record') {
    return (
      <SectionCard
        letter="C"
        title="Respondent Information"
        notice='Punan ang available na impormasyon. Kung hindi kilala ang respondent, ilagay ang "Unknown".'
      >
        <PersonSearchInput
          label="Search Respondent (Auto-fill)"
          placeholder="Search by name..."
          onSelect={handleSelectPerson}
        />
        <FormRow cols={3}>
          <FormInput
            id="field-rLastName"
            label="Last Name"
            required
            placeholder='e.g. Santos (or "Unknown")'
            value={data.lastName}
            onChange={(e) => {
              onChange('lastName', e.target.value)
              clearErr('rLastName')
            }}
            error={errors.rLastName}
          />
          <FormInput
            id="field-rFirstName"
            label="First Name"
            required
            placeholder='e.g. Pedro (or "Unknown")'
            value={data.firstName}
            onChange={(e) => {
              onChange('firstName', e.target.value)
              clearErr('rFirstName')
            }}
            error={errors.rFirstName}
          />
          <FormInput
            label="Middle Name"
            placeholder="e.g. Reyes (if known)"
            value={data.middleName}
            onChange={(e) => onChange('middleName', e.target.value)}
          />
        </FormRow>
        <FormRow cols={3}>
          <FormInput
            label="Contact Number"
            placeholder="09XX XXX XXXX (if known)"
            inputMode="numeric"
            maxLength={11}
            value={data.contact}
            onChange={(e) =>
              onChange('contact', e.target.value.replace(/\D/g, ''))
            }
          />
          <FormSelect
            label="Relationship to Complainant"
            options={RELATIONSHIP_OPTIONS}
            placeholder="Select Relationship"
            value={data.relationship}
            onChange={(e) => onChange('relationship', e.target.value)}
          />
          <FormInput
            label="Address"
            placeholder="Address (if known)"
            value={data.address}
            onChange={(e) => onChange('address', e.target.value)}
          />
        </FormRow>
      </SectionCard>
    )
  }
  return (
    <SectionCard
      letter="C"
      title="Respondent Information"
      notice='Please provide all available details. If the respondent is unidentified, enter "Unknown".'
    >
      <PersonSearchInput
        label="Search Respondent (Auto-fill)"
        placeholder="Search by name..."
        onSelect={handleSelectPerson}
      />
      <FormRow cols={3}>
        <FormInput
          id="field-rLastName"
          label="Last Name"
          required
          placeholder="e.g. Santos"
          value={data.lastName}
          onChange={(e) => {
            onChange('lastName', e.target.value)
            clearErr('rLastName')
          }}
          error={errors.rLastName}
        />
        <FormInput
          id="field-rFirstName"
          label="First Name"
          required
          placeholder="e.g. Pedro"
          value={data.firstName}
          onChange={(e) => {
            onChange('firstName', e.target.value)
            clearErr('rFirstName')
          }}
          error={errors.rFirstName}
        />
        <FormInput
          label="Middle Name"
          placeholder="e.g. Reyes"
          value={data.middleName}
          onChange={(e) => onChange('middleName', e.target.value)}
        />
      </FormRow>
      <FormRow cols={4}>
        <FormInput
          label="Alias / Nickname"
          placeholder="If any"
          value={data.alias}
          onChange={(e) => onChange('alias', e.target.value)}
        />
        <FormInput
          label="Age"
          type="number"
          placeholder="e.g. 40"
          value={data.age}
          onChange={(e) => {
            onChange('age', e.target.value)
            onChange('dob', '')
          }}
        />
        <FormDatePicker
          label="Date of Birth"
          value={data.dob}
          onChange={(e) => {
            const dob = e.target.value
            onChange('dob', dob)
            if (dob) {
              const now = new Date()
              const birth = new Date(dob)
              let age = now.getFullYear() - birth.getFullYear()
              const monthDiff = now.getMonth() - birth.getMonth()
              if (
                monthDiff < 0 ||
                (monthDiff === 0 && now.getDate() < birth.getDate())
              )
                age--
              onChange('age', age > 0 ? String(age) : '')
            } else {
              onChange('age', '')
            }
          }}
        />
        <FormSelect
          label="Gender"
          options={GENDER_OPTIONS}
          placeholder="Select Gender"
          value={data.gender}
          onChange={(e) => onChange('gender', e.target.value)}
        />
      </FormRow>
      <FormRow cols={3}>
        <FormSelect
          label="Civil Status"
          options={CIVIL_STATUS_OPTIONS}
          placeholder="Select Civil Status"
          value={data.civilStatus}
          onChange={(e) => onChange('civilStatus', e.target.value)}
        />
        <FormInput
          label="Occupation"
          placeholder="e.g. Farmer, Teacher"
          value={data.occupation}
          onChange={(e) => onChange('occupation', e.target.value)}
        />
        <FormInput
          label="Contact Number"
          placeholder="09XX XXX XXXX (if known)"
          inputMode="numeric"
          maxLength={11}
          value={data.contact}
          onChange={(e) =>
            onChange('contact', e.target.value.replace(/\D/g, ''))
          }
        />
      </FormRow>
      <FormInput
        label="Complete Address"
        placeholder="House No., Street, Barangay, Municipality/City, Province"
        value={data.address}
        onChange={(e) => onChange('address', e.target.value)}
      />
      <SectionDivider label="Relationship" />
      <FormRow cols={2}>
        <FormSelect
          id="field-rFormalRelationship"
          label="Relationship to Complainant"
          required
          options={RELATIONSHIP_OPTIONS}
          placeholder="Select Relationship"
          value={data.relationship}
          onChange={(e) => {
            onChange('relationship', e.target.value)
            clearErr('rFormalRelationship')
          }}
          error={errors.rFormalRelationship}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Currently Living with Complainant?
          </label>
          <div className="flex items-center gap-5 mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="livingWith"
                value="true"
                checked={data.livingWith === 'true'}
                onChange={() => onChange('livingWith', 'true')}
                className="accent-blue-600"
              />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="livingWith"
                value="false"
                checked={data.livingWith === 'false'}
                onChange={() => onChange('livingWith', 'false')}
                className="accent-blue-600"
              />
              No
            </label>
          </div>
        </div>
      </FormRow>
    </SectionCard>
  )
}
