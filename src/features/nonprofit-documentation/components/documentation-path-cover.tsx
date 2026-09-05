export function DocumentationPathCover({
  variant,
}: {
  variant: "campaign" | "fundraising" | "marketplace"
}) {
  const palette = {
    campaign: { background: "#dce8ff", ink: "#485fb0", soft: "#9db1e6" },
    fundraising: { background: "#dfebe3", ink: "#477763", soft: "#a3c2b0" },
    marketplace: { background: "#e9e0f1", ink: "#765290", soft: "#bba3ce" },
  }[variant]
  return (
    <svg
      viewBox="0 0 360 144"
      className="h-36 w-full"
      style={{ background: palette.background }}
      aria-hidden
    >
      {variant === "campaign" ? (
        <>
          <path
            d="M88 92C134 92 133 46 179 46S225 92 273 92"
            fill="none"
            stroke={palette.soft}
            strokeWidth="2"
          />
          <rect
            x="54"
            y="59"
            width="68"
            height="68"
            rx="19"
            fill={palette.ink}
          />
          <path
            d="m76 92 11 10 14-26"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect
            x="145"
            y="12"
            width="68"
            height="68"
            rx="19"
            fill="white"
            fillOpacity=".85"
          />
          <path
            d="M163 37h32m-32 10h24m-24 10h16"
            stroke={palette.ink}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="273" cy="92" r="34" fill={palette.soft} />
          <path
            d="m264 79 13 13-13 13m-7-13h24"
            fill="none"
            stroke={palette.ink}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : variant === "fundraising" ? (
        <>
          <rect
            x="69"
            y="27"
            width="144"
            height="92"
            rx="18"
            fill={palette.soft}
            transform="rotate(-7 141 73)"
          />
          <rect
            x="113"
            y="25"
            width="172"
            height="96"
            rx="18"
            fill="white"
            fillOpacity=".9"
            transform="rotate(5 199 73)"
          />
          <path
            d="M137 52h66m-66 14h49m-49 28h110"
            stroke={palette.soft}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="248" cy="57" r="16" fill={palette.ink} />
          <path
            d="m242 57 5 5 8-10"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="m95 73 83-35 83 35-83 36Z"
            fill="none"
            stroke={palette.soft}
            strokeWidth="2"
          />
          <circle cx="95" cy="73" r="28" fill={palette.soft} />
          <rect
            x="150"
            y="10"
            width="56"
            height="56"
            rx="18"
            fill="white"
            fillOpacity=".9"
          />
          <circle cx="261" cy="73" r="28" fill={palette.ink} />
          <rect
            x="150"
            y="82"
            width="56"
            height="56"
            rx="18"
            fill="white"
            fillOpacity=".7"
          />
          <path
            d="M166 38h24m-12-12v24"
            stroke={palette.ink}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="m252 73 6 6 12-14"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}
