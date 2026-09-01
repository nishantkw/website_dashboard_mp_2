export default function GovernmentHeader() {
  return (
    <header className="w-full shrink-0 bg-white shadow-md z-10">
      {/* Top accent stripe */}
      <div className="h-1.5 bg-gradient-to-r from-[#1a5c38] via-[#2d8a4e] to-[#1a5c38]" />

      <div className="border-b-2 border-[#2d8a4e]/15">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 py-3 sm:py-3.5">
            {/* Left — logo + title */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <img
                src="/images/ayushman-mp-logo.png"
                alt="Ayushman Madhya Pradesh"
                className="h-14 w-14 sm:h-[72px] sm:w-[72px] object-contain shrink-0"
              />

              <div className="hidden sm:block w-px h-14 bg-gray-200 shrink-0" />

              <div className="hidden sm:block min-w-0">
                <h1 className="text-[13px] sm:text-base lg:text-lg font-bold text-[#1a3a6b] leading-snug tracking-tight">
                  Ayushman Bharat | Pradhan Mantri Jan Arogya Yojana
                  <span className="text-[#2d8a4e]"> (PM-JAY)</span>
                </h1>
                <p className="mt-1 text-sm font-semibold leading-snug text-[#b45309] sm:text-base">
                  &ldquo;Niramayam&rdquo;
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">
                  State Health Agency, Madhya Pradesh
                </p>
              </div>
            </div>

            {/* Right — emblems */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <div className="hidden sm:block w-px h-14 bg-gray-200" />

              <div className="flex items-center gap-2 sm:gap-3">
                <img
                  src="/images/mp-government-emblem.png"
                  alt="Government of Madhya Pradesh"
                  className="h-12 w-12 sm:h-16 sm:w-16 object-contain"
                  title="Government of Madhya Pradesh"
                />
                <div
                  className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-[2.5px] border-[#e8a317] bg-gradient-to-b from-white to-[#fffbeb] flex items-center justify-center shadow-sm"
                  title="PM-JAY"
                >
                  <span className="text-[9px] sm:text-[11px] font-extrabold text-[#1a3a6b] text-center leading-tight tracking-tight">
                    PM<br />JAY
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-only centered title below logo row */}
          <div className="sm:hidden pb-3 -mt-1 text-center border-t border-gray-50 pt-2.5">
            <h1 className="text-xs font-bold text-[#1a3a6b] leading-snug">
              Ayushman Bharat — PM-JAY
            </h1>
            <p className="mt-1 text-xs font-semibold leading-snug text-[#b45309]">&ldquo;Niramayam&rdquo;</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide leading-relaxed text-gray-500">
              State Health Agency, MP
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
