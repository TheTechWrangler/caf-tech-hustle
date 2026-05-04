import React from "react";

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function Stat({ icon, label, value }: StatProps) {
  return (
    <article className="stat">
      <div>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
