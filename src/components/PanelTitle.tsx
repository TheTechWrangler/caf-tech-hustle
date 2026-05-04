import React from "react";

interface PanelTitleProps {
  heading: React.ReactNode;
  sub: React.ReactNode;
  subClassName?: string;
}

export function PanelTitle({ heading, sub, subClassName }: PanelTitleProps) {
  return (
    <div className="panelTitle">
      <h2>{heading}</h2>
      <span className={subClassName}>{sub}</span>
    </div>
  );
}
