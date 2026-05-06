export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        width="36"
        height="36"
        className="flex-shrink-0"
      >
        <circle cx="100" cy="100" r="90" fill="#111111" />
        <text
          x="72"
          y="123"
          fontFamily="Inter, sans-serif"
          fontSize="72"
          fontWeight="500"
          fill="white"
          textAnchor="middle"
        >
          T
        </text>
        <text
          x="132"
          y="123"
          fontFamily="Inter, sans-serif"
          fontSize="72"
          fontWeight="500"
          fill="white"
          textAnchor="middle"
        >
          S
        </text>
      </svg>
      <span className="text-[#111111] font-medium text-sm tracking-widest uppercase">
        tarik-shop
      </span>
    </div>
  )
}
