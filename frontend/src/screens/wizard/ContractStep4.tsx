import { useState, useRef, useEffect } from 'react'
import type { ContractWizardData } from './ContractStep1'

interface Props {
  data: ContractWizardData
  onChange: (u: Partial<ContractWizardData>) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function ContractStep4({ data, onChange, onBack, onSubmit, isSubmitting }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoObjs, setPhotoObjs] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const urls = photoObjs.map((f) => URL.createObjectURL(f))
    setPhotoUrls(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [photoObjs])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const newObjs = [...photoObjs, ...files]
    setPhotoObjs(newObjs)
    onChange({ photo_files: [...data.photo_files, ...files.map((f) => f.name)] })
    e.target.value = ''
  }

  function removePhoto(idx: number) {
    setPhotoObjs((prev) => prev.filter((_, i) => i !== idx))
    onChange({ photo_files: data.photo_files.filter((_, i) => i !== idx) })
  }

  function handleSubmit() {
    const errs: Record<string, string> = {}
    if (data.photo_files.length === 0) errs.photos = 'حداقل یک تصویر برای قرارداد الزامی است'
    setErrors(errs)
    if (Object.keys(errs).length === 0) onSubmit()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* Photos — required ≥1 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={labelStyle}>
          تصویر قرارداد <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {photoObjs.map((file, idx) => (
            <div
              key={idx}
              style={{
                position: 'relative', width: 80, height: 80,
                borderRadius: 10, overflow: 'hidden',
                backgroundColor: 'var(--surface-sunken)', flexShrink: 0,
              }}
            >
              {photoUrls[idx] ? (
                <img src={photoUrls[idx]} alt={file.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
                }}>تصویر</div>
              )}
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                aria-label="حذف تصویر"
                style={{
                  position: 'absolute', top: 2, left: 2,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.55)', color: '#ffffff',
                  border: 'none', cursor: 'pointer', fontSize: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            style={{
              width: 80, height: 80,
              border: `2px dashed ${errors.photos ? 'var(--color-danger)' : 'var(--border-strong)'}`,
              borderRadius: 10, background: 'var(--surface-card)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2,
              color: errors.photos ? 'var(--color-danger)' : 'var(--text-muted)',
              fontSize: 'var(--text-xs)', fontFamily: 'var(--font-sans)',
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
            <span>عکس</span>
          </button>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoChange}
          style={{ display: 'none' }}
        />
        {errors.photos && <span style={errorStyle}>{errors.photos}</span>}
      </div>

      {/* Notes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={labelStyle}>یادداشت</label>
        <textarea
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="توضیحات تکمیلی قرارداد"
          style={{
            width: '100%',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            padding: '12px 14px',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-md)',
            color: 'var(--text-primary)',
            background: 'var(--surface-card)',
            resize: 'vertical',
            textAlign: 'right',
            lineHeight: 1.7,
            outline: 'none',
          }}
        />
      </div>

      {/* Warning banner */}
      <div style={{
        display: 'flex', gap: 10, padding: '13px 14px',
        borderRadius: 12,
        background: 'var(--color-warning-soft)',
        border: '1px solid var(--amber-500)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-warning)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ flex: 'none', marginTop: 1 }}>
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
        <span style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--gold-700)' }}>
          با ثبت این قرارداد، اطلاعات مالک/مستأجر ملک به‌روزرسانی می‌شود.
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 'var(--space-3)' }}>
        <button type="button" onClick={onBack} disabled={isSubmitting} style={backBtnStyle}>قبلی</button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            flex: 1, height: 48,
            borderRadius: 'var(--radius-md)', border: 'none',
            background: 'var(--color-primary)', color: '#ffffff',
            fontFamily: 'var(--font-sans)', fontSize: 'var(--text-md)',
            fontWeight: 'var(--weight-semibold)' as React.CSSProperties['fontWeight'],
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.6 : 1,
            transition: 'opacity 140ms ease',
          }}
        >
          {isSubmitting ? 'در حال ثبت...' : 'ثبت قرارداد'}
        </button>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)' as React.CSSProperties['fontWeight'],
  color: 'var(--text-secondary)',
}

const errorStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-danger)',
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
