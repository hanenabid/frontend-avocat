import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Reusable form input with label, error and ref forwarding
const FormInput = React.forwardRef((props, ref) => {
  const { t } = useTranslation();
  const {
    id,
    name,
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    autoComplete,
    maxLength,
    title,
    required,
    className = '',
    ...rest
  } = props;
  const [show, setShow] = useState(false);
  const errorId = error ? `${id}Error` : undefined;
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className={`input-group ${className} ${isPassword ? 'has-toggle' : ''}`}>
      {label && <label className="input-label" htmlFor={id}>{label}</label>}
      <div className="field-error" id={errorId}>{error || ''}</div>
      <input
        ref={ref}
        id={id}
        name={name}
        type={inputType}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-describedby={errorId}
        autoComplete={autoComplete}
        maxLength={maxLength}
        title={title}
        required={required}
        className={error ? 'error' : ''}
        {...rest}
      />

      {isPassword && (
        <button
          type="button"
          className="password-toggle"
          aria-pressed={show}
          aria-label={show ? t('form.hidePassword') : t('form.showPassword')}
          onClick={() => setShow(s => !s)}
        >
          {/* simple eye / eye-off icons */}
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M17.94 17.94A10 10 0 0 1 6.06 6.06" stroke="#374151" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 1l22 22" stroke="#374151" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#374151" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="#374151" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      )}
    </div>
  );
});

export default FormInput;
