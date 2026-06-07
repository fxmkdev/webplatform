"use client";

import type { ReactNode } from "react";

import { CheckIcon } from "@payloadcms/ui";
import { useId, useRef } from "react";

type CheckboxInputProps = {
  checked: boolean;
  defaultChecked?: boolean;
  label: ReactNode;
  name?: string;
  readOnly?: boolean;
  setChecked: (checked: boolean) => void;
};

export function CheckboxInput({
  name,
  checked,
  label,
  readOnly = false,
  setChecked,
}: CheckboxInputProps) {
  const inputBaseClass = "checkbox-input";
  const ref = useRef<HTMLInputElement>(null);
  const id = `checkbox-input-${useId()}`;

  return (
    <div
      className={[
        inputBaseClass,
        checked && `${inputBaseClass}--checked`,
        readOnly && `${inputBaseClass}--read-only`,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={`${inputBaseClass}__input`}>
        <input
          checked={checked}
          disabled={readOnly}
          id={id}
          name={name}
          onChange={(e) => setChecked(e.target.checked)}
          ref={ref}
          type="checkbox"
        />
        <span
          className={[`${inputBaseClass}__icon`, !checked ? "partial" : "check"]
            .filter(Boolean)
            .join(" ")}
        >
          {checked && <CheckIcon />}
        </span>
      </div>
      <label className={`${inputBaseClass}__label`} htmlFor={id}>
        {label}
      </label>
    </div>
  );
}
