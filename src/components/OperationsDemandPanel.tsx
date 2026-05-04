import React from "react";

interface OperationsDemandPanelProps {
  title: string;
  panelKey: string;
  collapsed?: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}

export function OperationsDemandPanel({ title, panelKey, collapsed, onToggle, children }: OperationsDemandPanelProps) {
  return (
    <section className={`opsDemandPanel ${panelKey} ${collapsed ? "collapsed" : ""}`}>
      <button className="opsPanelToggle" onClick={() => onToggle(panelKey)}>{title}</button>
      {!collapsed ? <div className="opsDemandBody">{children}</div> : null}
    </section>
  );
}
