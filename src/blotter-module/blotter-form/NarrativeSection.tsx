import { SectionCard, FormTextarea } from '../reusable/FormComponents'
interface NarrativeSectionProps {
  mode: 'record' | 'formal'
  narrative: string
  onChange: (val: string) => void
  error?: string
  clearErr: () => void
}
export const NarrativeSection = ({
  mode,
  narrative,
  onChange,
  error,
  clearErr,
}: NarrativeSectionProps) => {
  return (
    <SectionCard
      letter="E"
      title={
        mode === 'record'
          ? 'Narrative / Statement of Facts'
          : 'Narrative / Sworn Statement'
      }
    >
      <FormTextarea
        id="field-narrative"
        label="Detailed Statement of Facts"
        required
        rows={6}
        placeholder="Provide a complete and detailed account of the incident. Include the sequence of events, actions taken by each party, words exchanged, any threats made, injuries sustained, and all other relevant circumstances..."
        hint="Include all relevant details: who, what, when, where, how, and why."
        value={narrative}
        onChange={(e) => {
          onChange(e.target.value)
          clearErr()
        }}
        error={error}
      />
    </SectionCard>
  )
}
