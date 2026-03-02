import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './PasswordStrength.css';

const scorePassword = (pw) => {
  if (!pw || pw.length === 0) return 0;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (pw.length >= 12) score += 1; // bonus for length
  return score; // 0..5
};

const PasswordStrength = ({ value = '' }) => {
  const { t } = useTranslation();
  const score = useMemo(() => scorePassword(value), [value]);
  const percent = Math.min(100, Math.round((score / 5) * 100));

  const getLabel = () => {
    if (!value) return t('passwordStrength.empty');
    if (score <= 1) return t('passwordStrength.veryWeak');
    if (score === 2) return t('passwordStrength.weak');
    if (score === 3) return t('passwordStrength.fair');
    if (score === 4) return t('passwordStrength.good');
    return t('passwordStrength.strong');
  };

  return (
    <div className="password-strength">
      <div className="meter" aria-hidden>
        <div className="meter-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="strength-label">{getLabel()}</div>
    </div>
  );
};

export default PasswordStrength;
