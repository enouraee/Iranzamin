import { useState, useRef, useEffect } from 'react'
import { PersonPicker } from './PersonPicker'
import type { WizardData } from '../AddFileScreen'

interface Props {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function WizardStep4({ data, onChange, onBack, onSubmit, isSubmitting }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoObjs, setPhotoObjs] = useState<File[]>([])
  const [videoObj, setVideoObj] = useState<File | null>(null)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState<string>('')
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Create object URLs when files change
  useEffect(() => {
    const urls = photoObjs.map((f) => URL.createObjectURL(f))
    setPhotoUrls(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [photoObjs])

  useEffect(() => {
    if (!videoObj) { setVideoUrl(''); return }
    const url = URL.createObjectURL(videoObj)
    setVideoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [videoObj])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setPhotoObjs((prev) => [...prev, ...files])
    onChange({ photoFiles: [...data.photoFiles, ...files.map((f) => f.name)] })
    e.target.value = ''
  }

  function removePhoto(idx: number) {
    setPhotoObjs((prev) => prev.filter((_, i) => i !== idx))
    onChange({ photoFiles: data.photoFiles.filter((_, i) => i !== idx) })
  }

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoObj(file)
    onChange({ videoFiles: [file.name] })
    e.target.value = ''
  }

  function removeVideo() {
    setVideoObj(null)
    onChange({ videoFiles: [] })
  }

  function handleSubmit() {
    const errs: Record<string, string> = {}
    if (!data.owner) errs.owner = 'مالک الزامی است'
    setErrors(errs)
    if (Object.keys(errs).length === 0) onSubmit()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* Owner Picker */}
      <PersonPicker
        value={data.owner}
        onChange={(p) => onChange({ owner: p })}
        createRole="owner"
        searchRole="owner"
        label="مالک"
        addLabel="افزودن مالک جدید"
        error={errors.owner}
      />

      {/* Photos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={labelStyle}>تصاویر ملک (اختیاری)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {photoObjs.map((file, idx) => (
            <div
              key={idx}
              style={{
                position: 'relative',
                width: 72,
                height: 72,
                borderRadius: 10,
                overflow: 'hidden',
                backgroundColor: 'var(--surface-sunken)',
                flexShrink: 0,
              }}
            >
              {photoUrls[idx] ? (
                <img
                  src={photoUrls[idx]}
                  alt={file.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                }}>
                  تصویر
                </div>
              )}
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                aria-label="حذف تصویر"
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 2,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.55)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            style={{
              width: 72,
              height: 72,
              border: '2px dashed var(--border-strong)',
              borderRadius: 10,
              background: 'var(--surface-card)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              color: 'var(--text-muted)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-sans)',
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
      </div>

      {/* Video */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={labelStyle}>ویدیو ملک (اختیاری)</label>
        {videoObj ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {videoUrl && (
              <video
                src={videoUrl}
                style={{ width: 120, height: 72, borderRadius: 8, objectFit: 'cover', backgroundColor: 'var(--surface-sunken)' }}
                muted
                preload="metadata"
              />
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', margin: 0 }}>{videoObj.name}</p>
              <button
                type="button"
                onClick={removeVideo}
                style={{
                  marginTop: 4,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-danger)',
                  fontFamily: 'var(--font-sans)',
                  padding: 0,
                }}
              >
                حذف ویدیو
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            style={{
              width: '100%',
              height: 64,
              border: '2px dashed var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-card)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              color: 'var(--text-muted)',
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <span style={{ fontSize: 20 }}>+</span>
            افزودن ویدیو
          </button>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10, marginTop: 'var(--space-3)' }}>
        <button type="button" onClick={onBack} style={backBtnStyle} disabled={isSubmitting}>
          قبلی
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            flex: 1,
            height: 48,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--color-primary)',
            color: '#ffffff',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--weight-semibold)' as React.CSSProperties['fontWeight'],
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.6 : 1,
            transition: 'opacity 140ms ease',
          }}
        >
          {isSubmitting ? 'در حال ثبت...' : 'ثبت فایل جدید'}
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
