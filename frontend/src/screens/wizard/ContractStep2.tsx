import { useState } from 'react'
import { PersonPicker } from './PersonPicker'
import type { ContractWizardData } from './ContractStep1'
import type { PersonStub } from '../../api/types'

interface Props {
  data: ContractWizardData
  onChange: (u: Partial<ContractWizardData>) => void
  onNext: () => void
  onBack: () => void
}

function makeStub(id: number | null, name: string): PersonStub | null {
  if (!id) return null
  const parts = name.split(' ')
  return { id, first_name: parts[0] ?? '', last_name: parts.slice(1).join(' '), phone: '' }
}

function fromStub(p: PersonStub | null): { id: number | null; name: string } {
  if (!p) return { id: null, name: '' }
  return { id: p.id, name: `${p.first_name} ${p.last_name}`.trim() }
}

export function ContractStep2({ data, onChange, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isSale = data.contract_type === 'sale'
  const partyALabel = 'مالک / فروشنده'
  const partyBLabel = isSale ? 'خریدار' : 'مستأجر'
  const partyAAdd = 'افزودن مالک جدید'
  const partyBAdd = isSale ? 'افزودن خریدار جدید' : 'افزودن مستأجر جدید'

  function handleNext() {
    const errs: Record<string, string> = {}
    if (!data.party_a_id) errs.party_a = 'مالک / فروشنده الزامی است'
    if (!data.party_b_id) errs.party_b = `${partyBLabel} الزامی است`
    if (data.party_a_id && data.party_b_id && data.party_a_id === data.party_b_id) {
      errs.party_b = 'طرفین قرارداد نمی‌توانند یکی باشند'
    }
    setErrors(errs)
    if (Object.keys(errs).length === 0) onNext()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* Party A */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 999,
          fontSize: 12, fontWeight: 600,
          background: 'var(--color-primary-soft)', color: 'var(--blue-700)',
          width: 'max-content',
        }}>
          {partyALabel}
        </span>
        <PersonPicker
          value={makeStub(data.party_a_id, data.party_a_name)}
          onChange={(p) => { const x = fromStub(p); onChange({ party_a_id: x.id, party_a_name: x.name }) }}
          createRole="owner"
          label=""
          addLabel={partyAAdd}
          error={errors.party_a}
        />
      </div>

      {/* Party B */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 999,
          fontSize: 12, fontWeight: 600,
          background: 'var(--color-accent-soft)', color: 'var(--gold-700)',
          width: 'max-content',
        }}>
          {partyBLabel}
        </span>
        <PersonPicker
          value={makeStub(data.party_b_id, data.party_b_name)}
          onChange={(p) => { const x = fromStub(p); onChange({ party_b_id: x.id, party_b_name: x.name }) }}
          createRole="customer"
          label=""
          addLabel={partyBAdd}
          error={errors.party_b}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 'var(--space-3)' }}>
        <button type="button" onClick={onBack} style={backBtnStyle}>قبلی</button>
        <button type="button" onClick={handleNext} style={nextBtnStyle}>مرحله بعد</button>
      </div>
    </div>
  )
}

const nextBtnStyle: React.CSSProperties = {
  flex: 1,
  height: 48,
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--color-primary)',
  color: '#ffffff',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-md)',
  fontWeight: 'var(--weight-semibold)' as React.CSSProperties['fontWeight'],
  cursor: 'pointer',
}

const backBtnStyle: React.CSSProperties = {
  height: 48,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-strong)',
  background: 'var(--surface-card)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-md)',
  cursor: 'pointer',
  padding: '0 20px',
}
