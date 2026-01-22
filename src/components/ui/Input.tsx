import { memo } from "react";
import { INPUT_VARIANTS } from "../../constants/ui";

export type InputVariant = keyof typeof INPUT_VARIANTS;

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
}

export const Input = memo<InputProps>(({ variant = "default", className, ...props }) => {
  const variantClass = INPUT_VARIANTS[variant];
  const combinedClassName = className ? `${variantClass} ${className}` : variantClass;

  return <input className={combinedClassName} {...props} />;
});

Input.displayName = "Input";
