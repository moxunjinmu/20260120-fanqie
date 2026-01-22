import { memo } from "react";
import { PANEL_CLASS } from "../../constants/ui";

export interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export const Panel = memo<PanelProps>(({ children, className }) => {
  const combinedClassName = className ? `${PANEL_CLASS} ${className}` : PANEL_CLASS;

  return <div className={combinedClassName}>{children}</div>;
});

Panel.displayName = "Panel";
