import type { MoneyNotation } from '../../utils/moneyFormat'

interface MoneyColumnHeaderProps {
  label: string
  notation: MoneyNotation
  onChange: (value: MoneyNotation) => void
}

export default function MoneyColumnHeader({ label, notation, onChange }: MoneyColumnHeaderProps) {
  return (
    <div className="flex flex-col items-end gap-1.5 normal-case">
      <span className="uppercase tracking-wide">{label}</span>
      <label className="flex items-center gap-1.5 font-medium normal-case tracking-normal text-[#1a5c38]">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Format</span>
        <select
          value={notation}
          onChange={(e) => onChange(e.target.value as MoneyNotation)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Number format for ${label}`}
          className="cursor-pointer rounded-md border border-[#c5e0ce] bg-white px-2 py-1 text-[11px] font-semibold normal-case tracking-normal text-[#1a5c38] outline-none focus:border-[#2d8a4e]"
        >
          <option value="indian">Indian (12,34,567)</option>
          <option value="international">International (1,234,567)</option>
        </select>
      </label>
    </div>
  )
}
