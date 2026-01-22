import { memo } from "react";
import { BUTTON_VARIANTS } from "../../constants/ui";

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export const Button = memo<ButtonProps>(({ variant = "primary", children, className, ...props }) => {
  const variantClass = BUTTON_VARIANTS[variant];
  const combinedClassName = className ? `${variantClass} ${className}` : variantClass;

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
});

Button.displayName = "Button";
