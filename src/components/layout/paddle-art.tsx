// Decorative illustration, not a representation of an available product.
export function PaddleArt() {
  return <svg className="paddle-art" viewBox="0 0 640 640" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="blade" x1="190" y1="60" x2="420" y2="530" gradientUnits="userSpaceOnUse"><stop stopColor="#585b57"/><stop offset=".32" stopColor="#252724"/><stop offset=".65" stopColor="#111310"/><stop offset="1" stopColor="#42453f"/></linearGradient>
      <linearGradient id="shaft"><stop stopColor="#10120f"/><stop offset=".5" stopColor="#62655e"/><stop offset="1" stopColor="#171914"/></linearGradient>
      <pattern id="weave" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><path d="M0 0h6v6H0zM6 6h6v6H6z" fill="#fff" fillOpacity=".055"/></pattern>
      <filter id="paddle-shadow" x="-100%" y="-30%" width="300%" height="200%"><feDropShadow dx="16" dy="20" stdDeviation="15" floodColor="#13160e" floodOpacity=".23"/></filter>
    </defs>
    <circle cx="336" cy="310" r="225" stroke="#9c9e8e" strokeOpacity=".3"/><circle cx="336" cy="310" r="155" stroke="#9c9e8e" strokeOpacity=".2"/>
    <path d="M28 310h584M336 25v575" stroke="#9c9e8e" strokeOpacity=".22" strokeDasharray="3 7"/>
    <g transform="rotate(29 320 320)" filter="url(#paddle-shadow)">
      <rect x="300" y="215" width="17" height="368" rx="8.5" fill="url(#shaft)"/>
      <path d="M307 35c-37 0-65 48-65 112 0 63 25 110 56 127l19 2c32-23 49-72 49-132 0-58-24-109-59-109Z" fill="url(#blade)" stroke="#71766b" strokeWidth=".7"/>
      <path d="M307 35c-37 0-65 48-65 112 0 63 25 110 56 127l19 2c32-23 49-72 49-132 0-58-24-109-59-109Z" fill="url(#weave)"/>
      <path d="M307 53v207" stroke="#8e9486" strokeOpacity=".32"/><path d="m271 169 64-15v17l-64 15z" fill="#087f75"/>
      <text x="278" y="151" fill="#e8e9df" fontSize="12" fontFamily="Arial" fontWeight="700" letterSpacing="2">KAYART</text><rect x="300" y="402" width="17" height="5" fill="#087f75"/>
    </g>
    <g stroke="#757b6c"><path d="M433 176h96v-20M201 442H90v21M523 156h12M84 463h12"/></g><circle cx="433" cy="176" r="3" fill="#087f75"/><circle cx="201" cy="442" r="3" fill="#087f75"/>
    <text x="464" y="145" fill="#666c60" fontSize="10" fontFamily="monospace" letterSpacing="2">MATIÈRE</text><text x="83" y="484" fill="#666c60" fontSize="10" fontFamily="monospace" letterSpacing="2">MOUVEMENT</text>
  </svg>;
}
