/** Boutons de la charte (marine, blanc, contour, accent terracotta). */

export function BtnNavy({ children, onClick, type = "button", className = "" }: { children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; className?: string }) {
  return (
    <button type={type} onClick={onClick} className={`inline-flex items-center gap-2 bg-[#0d2265] text-white font-medium text-sm px-6 py-3 hover:bg-[#091a52] transition-colors cursor-pointer ${className}`}>
      {children}
    </button>
  );
}

export function BtnWhite({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 bg-white text-[#0d2265] font-medium text-sm px-6 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${className}`}>
      {children}
    </button>
  );
}

export function BtnOutlineNavy({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 border border-[#0d2265] text-[#0d2265] font-medium text-sm px-6 py-3 hover:bg-[#0d2265] hover:text-white transition-colors cursor-pointer ${className}`}>
      {children}
    </button>
  );
}

export function BtnOutlineWhite({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 border border-white text-white font-medium text-sm px-6 py-3 hover:bg-white hover:text-[#0d2265] transition-colors cursor-pointer ${className}`}>
      {children}
    </button>
  );
}

export function BtnAccent({ children, onClick, type = "button", className = "" }: { children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; className?: string }) {
  return (
    <button type={type} onClick={onClick} className={`inline-flex items-center gap-2 bg-[#C4613A] text-white font-semibold text-sm px-7 py-3.5 hover:bg-[#A84E2D] transition-colors cursor-pointer tracking-wide ${className}`}>
      {children}
    </button>
  );
}
