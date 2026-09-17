export interface LiveStatusDotProps {
  online: boolean;
  className?: string;
}

/** Trivial placeholder: a colored dot reflecting an "online" boolean. */
export function LiveStatusDot({ online, className }: LiveStatusDotProps) {
  return (
    <span
      aria-label={online ? "online" : "offline"}
      className={className}
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "9999px",
        backgroundColor: online ? "#22c55e" : "#9ca3af",
      }}
    />
  );
}
