"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
export type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function PasswordField({ label, required = false, ...inputProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <label>
      <span>
        {label}
        {required && <b className="required"> *</b>}
      </span>
      <span className="password-control">
        <input {...inputProps} type={visible ? "text" : "password"} required={required} />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </span>
    </label>
  );
}
