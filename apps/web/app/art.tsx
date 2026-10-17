export function Flower({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="36"
      height="36"
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <g fill="currentColor">
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse
            key={i}
            cx="50"
            cy="26"
            rx="9"
            ry="21"
            transform={`rotate(${45 * i} 50 50)`}
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="11" fill="var(--paper)" />
    </svg>
  );
}
export function Landscape({
  variant = "sky",
}: {
  variant?: "sky" | "earth" | "words";
}) {
  return (
    <svg
      className="landscape"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 500 290"
      fill="none"
      aria-hidden="true"
    >
      <rect
        width="500"
        height="290"
        fill={
          variant === "sky"
            ? "#cbd8d9"
            : variant === "earth"
              ? "#eadcc4"
              : "#dcd9e7"
        }
      />
      {variant === "sky" ? (
        <>
          <circle cx="382" cy="75" r="36" fill="#fff0c6" />
          <path
            d="M0 220 138 75 284 246 345 181 500 266V290H0Z"
            fill="#6f9390"
          />
          <path d="m138 75-35 99 36-21 35 35Z" fill="#e5ede8" />
          <path d="M0 263q143-80 263-31t237-35v93H0" fill="#365e55" />
          <path d="M211 229h74v-50h-74z" fill="#ecd3a9" />
          <path d="M201 180a47 47 0 0 1 94 0z" fill="#bc6950" />
          <path d="m250 154 43-20" stroke="#324d48" strokeWidth="12" />
          <path d="m238 227 22-38 20 39" stroke="#835f45" strokeWidth="4" />
          <circle cx="54" cy="50" r="3" fill="#fff" />
          <path d="m292 46 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#fff" />
        </>
      ) : variant === "earth" ? (
        <>
          <circle cx="253" cy="140" r="101" fill="#668c87" />
          <path
            d="m192 58 68 20 6 32-42 19-27 39-45-18 4-47zM303 130l45 22-21 54-41 31-13-59z"
            fill="#c7d6a0"
          />
          <ellipse
            cx="253"
            cy="140"
            rx="130"
            ry="28"
            stroke="#fff8e6"
            strokeWidth="2"
            transform="rotate(-28 253 140)"
          />
          <path
            d="M390 209v-65m-23 18 23 22 22-36"
            stroke="#65704c"
            strokeWidth="5"
          />
          <circle cx="88" cy="66" r="17" fill="#bd7655" />
        </>
      ) : (
        <>
          <path d="m108 95 119-20 22 120-120 22z" fill="#668b76" />
          <path d="m250 81 122 18-19 120-119-20z" fill="#faf3df" />
          <path d="m249 195 17 8 115 21 10-124-18-1-20 118z" fill="#b18c77" />
          <path
            d="m141 119 56-9m-52 27 56-9m81-7 57 8m-60 12 57 8m-60 12 40 6"
            stroke="#e9e8cf"
            strokeWidth="5"
          />
          <circle cx="90" cy="214" r="23" fill="#bb7255" />
          <path d="m408 69 5 14 14 5-14 5-5 14-5-14-14-5 14-5" fill="#89719b" />
        </>
      )}
    </svg>
  );
}
