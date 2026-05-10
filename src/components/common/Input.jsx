/**
 * Input.jsx — Reusable form input atom
 *
 * PURPOSE:
 *   Provides a consistent text input with optional label, helper text, error
 *   display, and icon support. Centralises all input styling so forms
 *   throughout the app look and behave identically.
 *
 * PROPS:
 *   label       — string; renders an accessible <label> above the input.
 *   error       — string; when present, colours the border red and shows
 *                 the error message below the field.
 *   helperText  — string; shown below the field when there's no error.
 *   leftIcon    — React node displayed inside the input on the left side.
 *   rightIcon   — React node displayed inside the input on the right side.
 *   as          — 'input' | 'textarea'; renders a multi-line area when needed.
 *   rows        — number; only relevant when as='textarea'.
 *   ...props    — All other standard <input> attributes (type, placeholder,
 *                 value, onChange, etc.) are forwarded via the spread operator.
 *
 * REACT CONCEPTS USED:
 *   forwardRef  — Allows parent components to attach a ref directly to the
 *                 underlying <input> or <textarea> DOM node. This is required
 *                 for focusing inputs programmatically (e.g. on modal open).
 *
 *   useId()     — Generates a unique, stable ID for the label/input pairing
 *                 so screen readers correctly associate them.
 */

import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    as: Tag = 'input',
    rows = 4,
    className = '',
    ...props
  },
  ref
) {
  const id = useId();

  const borderClass = error
    ? 'border-red-500 focus:ring-red-500'
    : 'border-surface-600 focus:ring-brand-500';

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
          {props.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            {leftIcon}
          </span>
        )}

        <Tag
          id={id}
          ref={ref}
          rows={Tag === 'textarea' ? rows : undefined}
          className={[
            'input-base',
            leftIcon  ? 'pl-9'  : '',
            rightIcon ? 'pr-9'  : '',
            Tag === 'textarea' ? 'resize-y min-h-[80px]' : '',
            borderClass,
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />

        {rightIcon && (
          <span className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center text-slate-500 pointer-events-none [&>*]:pointer-events-auto">
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1" role="alert">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 8.5a1 1 0 112 0v3a1 1 0 11-2 0V8.5zm1 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {!error && helperText && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
});

export default Input;
