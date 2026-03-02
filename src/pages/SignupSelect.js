import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useValidation } from '../hooks/useValidation';
import PasswordStrength from '../components/PasswordStrength';
import Logo from '../components/Logo';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import './SignupSelectt.css';

const SignupSelect = () => {
  const { t } = useTranslation();
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  const [currentForm, setCurrentForm] = useState('signin');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  
  const labelFor = (fieldKey) => {
    const map = {
      firstName: 'signupSelect.firstName',
      lastName: 'signupSelect.lastName',
      email: 'signupSelect.emailAddress',
      phone: 'signupSelect.phoneNumber',
      password: 'signupSelect.password',
      confirmPassword: 'signupSelect.confirmPassword',
      fullName: 'signupSelect.fullName',
      ville: 'signupSelect.selectCity',
      specialites: 'signupSelect.selectSpeciality',
      diplome: 'signupSelect.diploma',
      documentsVerif: 'signupSelect.uploadVerificationDocument'
    };
    const key = map[fieldKey] || fieldKey;
    const translated = t(key, { defaultValue: fieldKey });
    return translated;
  };

  const validationMessages = {
    required: (field) => t('validation.required', { field: labelFor(field) }),
    email: t('validation.email'),
    password: t('validation.password'),
    passwordMatch: t('validation.passwordMatch'),
    phone: t('validation.phone'),
    fileType: t('validation.fileType'),
    fileSize: (max) => t('validation.fileSize', { max }),
    fileRequired: t('validation.fileRequired'),
    minLength: (field, min) => t('validation.minLength', { field: labelFor(field), min }),
    maxLength: (field, max) => t('validation.maxLength', { field: labelFor(field), max })
  };

  const { errors, setError, validateField, validatePasswordMatch, validateFile, clearError: clearValidationError } = useValidation(validationMessages);
  const { signupAvocat, signupClient, login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  useEffect(() => {
    clearError();
    Object.keys(errors || {}).forEach(f => {
      clearValidationError(f);
    });
    if (currentForm !== 'lawyer') setAvocatStep(1);
  }, [currentForm]);

  const [visibleError, setVisibleError] = useState('');
  const clearingRef = useRef(false);

  useEffect(() => {
    let next = error || '';
    if (next) {
      clearingRef.current = false;
      setVisibleError(next);
    } else {
      if (visibleError) {
        clearingRef.current = true;
        setVisibleError('');
        const t = setTimeout(() => {
          clearingRef.current = false;
        }, 320);
        return () => clearTimeout(t);
      }
    }
  }, [error, currentForm]);

  const totalAvocatSteps = 3;
  const [avocatStep, setAvocatStep] = useState(1);
  const [avocatDirection, setAvocatDirection] = useState('');
  const prevAvocatStep = useRef(avocatStep);
  
  useEffect(() => {
    if (prevAvocatStep.current !== avocatStep) {
      setAvocatDirection(avocatStep > prevAvocatStep.current ? 'forward' : 'backward');
      prevAvocatStep.current = avocatStep;
      const t = setTimeout(() => setAvocatDirection(''), 360);
      return () => clearTimeout(t);
    }
  }, [avocatStep]);
  
  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);

  useEffect(() => {
    if (avocatStep === 1) step1Ref.current?.focus();
    else if (avocatStep === 2) step2Ref.current?.focus();
    else if (avocatStep === 3) step3Ref.current?.focus();
  }, [avocatStep]);
  
  const [avocatData, setAvocatData] = useState({
    fullName: '',
    email: '',
    phone: '',
    ville: '',
    specialites: '',
    diplome: '',
    documentsVerif: null,
    password: '',
    confirmPassword: '',
  });

  const avocatNext = () => { if (validateAvocatStep()) setAvocatStep(s => Math.min(s+1, totalAvocatSteps)); };
  const avocatPrev = () => setAvocatStep(s => Math.max(s-1,1));

  const validateAvocatStep = () => {
    let ok = true;
    if (avocatStep === 1) {
      if (!validateField('fullName', avocatData.fullName, { required: true })) ok = false;
      if (!validateField('email', avocatData.email, { required: true, type: 'email' })) ok = false;
      if (!validateField('ville', avocatData.ville, { required: true })) ok = false;
    } else if (avocatStep === 2) {
      if (!validateField('specialites', avocatData.specialites, { required: true })) ok = false;
      if (!validateField('diplome', avocatData.diplome, { required: true })) ok = false;
      if (!avocatData.documentsVerif) {
        validateField('documentsVerif', '', { required: true }); ok = false;
      } else {
        const f = validateFile(avocatData.documentsVerif);
        if (!f.isValid) { validateField('documentsVerif', '', { custom: () => f.error }); ok = false; } else { clearValidationError('documentsVerif'); }
      }
    } else if (avocatStep === 3) {
      if (!validateField('password', avocatData.password, { required: true, type: 'password' })) ok = false;
      if (!validatePasswordMatch(avocatData.password, avocatData.confirmPassword)) ok = false;
    }
    return ok;
  };

  const isStepValidAvocat = (() => {
    if (avocatStep === 1) return !!avocatData.fullName && !!avocatData.email && !!avocatData.ville;
    if (avocatStep === 2) return !!avocatData.specialites && !!avocatData.diplome && !!avocatData.documentsVerif;
    if (avocatStep === 3) return !!avocatData.password && avocatData.password.length >= 8 && avocatData.password === avocatData.confirmPassword;
    return true;
  })();

  const handleAvocatChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setAvocatData(prev => {
        if (prev[name] === file) return prev;
        return { ...prev, [name]: file };
      });
      if (file) {
        const f = validateFile(file);
        if (!f.isValid) setError(name, f.error);
        else clearValidationError(name);
      }
    } else {
      setAvocatData(prev => {
        if (prev[name] === value) return prev;
        return { ...prev, [name]: value };
      });
      if (errors[name]) clearValidationError(name);
    }
    if (error) clearError();
  };

  const handleAvocatPhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) {
      val = val.slice(0, 8);
    }
    setAvocatData(prev => {
      if (prev.phone === val) return prev;
      return { ...prev, phone: val };
    });
    if (errors.phone) clearValidationError('phone');
  };

  const handleAvocatSubmit = async (e) => {
    e.preventDefault();
    if (avocatStep < totalAvocatSteps) { avocatNext(); return; }
    if (!validateAvocatStep()) return;
    try {
      const form = new FormData();
      Object.keys(avocatData).forEach(k => {
        if (avocatData[k] !== null && avocatData[k] !== undefined) {
          if (k === 'langues') form.append(k, JSON.stringify(avocatData[k]));
          else form.append(k, avocatData[k]);
        }
      });
      await signupAvocat(form);
      navigate('/avocat/dashboard');
    } catch (err) { console.error('signup avocat error', err); }
  };

  const AvocatFormInner = () => {
    const renderStep = () => {
      switch (avocatStep) {
        case 1:
          return (
            <div style={styles.stepContent}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>{t('signupSelect.fullName')} *</label>
                <input
                  ref={step1Ref}
                  type="text"
                  name="fullName"
                  placeholder={`${t('signupSelect.fullName')} *`}
                  value={avocatData.fullName}
                  onChange={handleAvocatChange}
                  style={{...styles.input, ...(errors.fullName ? styles.inputError : {})}}
                  required
                />
                {errors.fullName && <div style={styles.fieldError}>{errors.fullName}</div>}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>{t('signupSelect.emailAddress')} *</label>
                <input
                  type="email"
                  name="email"
                  placeholder={`${t('signupSelect.emailAddress')} *`}
                  value={avocatData.email}
                  onChange={handleAvocatChange}
                  style={{...styles.input, ...(errors.email ? styles.inputError : {})}}
                  required
                />
                {errors.email && <div style={styles.fieldError}>{errors.email}</div>}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>{t('signupSelect.phoneNumber')}</label>
                <div style={styles.phoneInputContainer}>
                  <span style={styles.phonePrefix}>+216</span>
                  <input 
                    type="tel" 
                    name="phone" 
                    placeholder={t('signupSelect.phoneNumberPlaceholder') || '12345678'} 
                    value={avocatData.phone} 
                    onChange={handleAvocatPhoneChange} 
                    style={styles.phoneInput}
                    maxLength="8" 
                  />
                </div>
                {errors.phone && <div style={styles.fieldError}>{errors.phone}</div>}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>{t('signupSelect.selectCity')} *</label>
                <select 
                  name="ville" 
                  value={avocatData.ville} 
                  onChange={handleAvocatChange} 
                  style={{...styles.select, ...(errors.ville ? styles.selectError : {})}}
                >
                  <option value="">{t('signupSelect.selectCity')}</option>
                  <option value="ariana">{t('signupSelect.cities.ariana')}</option>
                  <option value="beja">{t('signupSelect.cities.beja')}</option>
                  <option value="benArous">{t('signupSelect.cities.benArous')}</option>
                  <option value="bizerte">{t('signupSelect.cities.bizerte')}</option>
                  <option value="gabes">{t('signupSelect.cities.gabes')}</option>
                  <option value="gafsa">{t('signupSelect.cities.gafsa')}</option>
                  <option value="jendouba">{t('signupSelect.cities.jendouba')}</option>
                  <option value="kairouan">{t('signupSelect.cities.kairouan')}</option>
                  <option value="kasserine">{t('signupSelect.cities.kasserine')}</option>
                  <option value="kebili">{t('signupSelect.cities.kebili')}</option>
                  <option value="kef">{t('signupSelect.cities.kef')}</option>
                  <option value="mahdia">{t('signupSelect.cities.mahdia')}</option>
                  <option value="manouba">{t('signupSelect.cities.manouba')}</option>
                  <option value="medenine">{t('signupSelect.cities.medenine')}</option>
                  <option value="monastir">{t('signupSelect.cities.monastir')}</option>
                  <option value="nabeul">{t('signupSelect.cities.nabeul')}</option>
                  <option value="sfax">{t('signupSelect.cities.sfax')}</option>
                  <option value="sidiBouzid">{t('signupSelect.cities.sidiBouzid')}</option>
                  <option value="siliana">{t('signupSelect.cities.siliana')}</option>
                  <option value="sousse">{t('signupSelect.cities.sousse')}</option>
                  <option value="tataouine">{t('signupSelect.cities.tataouine')}</option>
                  <option value="tozeur">{t('signupSelect.cities.tozeur')}</option>
                  <option value="tunis">{t('signupSelect.cities.tunis')}</option>
                  <option value="zaghouan">{t('signupSelect.cities.zaghouan')}</option>
                </select>
                {errors.ville && <div style={styles.fieldError}>{errors.ville}</div>}
              </div>
            </div>
          );
        case 2:
          return (
            <div style={styles.stepContent}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>{t('signupSelect.selectSpeciality')} *</label>
                <select 
                  ref={step2Ref} 
                  name="specialites" 
                  value={avocatData.specialites} 
                  onChange={handleAvocatChange} 
                  style={{...styles.select, ...(errors.specialites ? styles.selectError : {})}}
                >
                  <option value="">{t('signupSelect.selectSpeciality')}</option>
                  <option value="civilLaw">{t('signupSelect.civilLaw')}</option>
                  <option value="criminalLaw">{t('signupSelect.criminalLaw')}</option>
                  <option value="corporateLaw">{t('signupSelect.corporateLaw')}</option>
                  <option value="familyLaw">{t('signupSelect.familyLaw')}</option>
                  <option value="intellectualProperty">{t('signupSelect.intellectualProperty')}</option>
                  <option value="laborLaw">{t('signupSelect.laborLaw')}</option>
                  <option value="taxLaw">{t('signupSelect.taxLaw')}</option>
                  <option value="realEstateLaw">{t('signupSelect.realEstateLaw')}</option>
                </select>
                {errors.specialites && <div style={styles.fieldError}>{errors.specialites}</div>}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>{t('signupSelect.diploma')} *</label>
                <input
                  type="text"
                  name="diplome"
                  placeholder={`${t('signupSelect.diploma')} *`}
                  value={avocatData.diplome}
                  onChange={handleAvocatChange}
                  style={{...styles.input, ...(errors.diplome ? styles.inputError : {})}}
                />
                {errors.diplome && <div style={styles.fieldError}>{errors.diplome}</div>}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>{t('signupSelect.uploadVerificationDocument')} *</label>
                <div style={{...styles.fileUploadContainer, ...(errors.documentsVerif ? styles.fileUploadError : {})}}>
                  <input 
                    type="file" 
                    id="documentsVerif" 
                    name="documentsVerif" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    onChange={handleAvocatChange} 
                    style={styles.fileInputHidden} 
                  />
                  <label htmlFor="documentsVerif" style={styles.fileUploadLabel}>
                    {avocatData.documentsVerif ? `✓ ${avocatData.documentsVerif.name}` : t('signupSelect.uploadVerificationDocument')}
                  </label>
                </div>
                {errors.documentsVerif && <div style={styles.fieldError}>{errors.documentsVerif}</div>}
              </div>
            </div>
          );
        case 3:
          return (
            <div style={styles.stepContent}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>{t('signupSelect.password')} *</label>
                <input
                  ref={step3Ref}
                  type="password"
                  name="password"
                  placeholder={`${t('signupSelect.password')} *`}
                  value={avocatData.password}
                  onChange={handleAvocatChange}
                  style={{...styles.input, ...(errors.password ? styles.inputError : {})}}
                  minLength={8}
                  required
                />
                {errors.password && <div style={styles.fieldError}>{errors.password}</div>}
              </div>
              <PasswordStrength value={avocatData.password} />

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>{t('signupSelect.confirmPassword')} *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder={t('signupSelect.confirmPassword')}
                  value={avocatData.confirmPassword}
                  onChange={handleAvocatChange}
                  style={{...styles.input, ...(errors.confirmPassword ? styles.inputError : {})}}
                  minLength={8}
                  required
                />
                {errors.confirmPassword && <div style={styles.fieldError}>{errors.confirmPassword}</div>}
              </div>
            </div>
          );
        default:
          return <div style={styles.notice}><p>{t('signupSelect.accountReview')}</p></div>;
      }
    };

    return (
      <>
        
        <div style={styles.formHeader}>
          <h1 style={styles.authTitle}>{t('signupSelect.createAccountavocat')}</h1>
          <p style={styles.authSubtitle}>
            {avocatStep === 1 ? t('signupSelect.personalInformation') : avocatStep === 2 ? t('signupSelect.professionalDetails') : t('signupSelect.securitySettings')}
          </p>
        </div>

        <div style={styles.progressBar}>
          <div style={styles.progressTrack}>
            <div style={{...styles.progressFill, width: `${((avocatStep-1)/(totalAvocatSteps-1))*100}%`}} />
          </div>
          <div style={styles.progressLabels}>
            <span style={{...styles.progressLabel, ...(avocatStep === 1 ? styles.progressLabelActive : {})}}>
              {t('signupSelect.personal')}
            </span>
            <span style={{...styles.progressLabel, ...(avocatStep === 2 ? styles.progressLabelActive : {})}}>
              {t('signupSelect.professional')}
            </span>
            <span style={{...styles.progressLabel, ...(avocatStep === 3 ? styles.progressLabelActive : {})}}>
              {t('signupSelect.security')}
            </span>
          </div>
        </div>

        {error && <div style={{...styles.errorMessage, ...styles.errorMessageVisible}}>{t('auth.invalidCredentials', { defaultValue: error })}</div>}
        
        {renderStep()}

        <div style={styles.formButtons}>
          {avocatStep > 1 && (
            <button type="button" onClick={avocatPrev} style={styles.authButtonSecondary}>
              {t('signupSelect.back')}
            </button>
          )}
          <button 
            type="submit" 
            style={{...styles.authButtonPrimary, ...(loading || !isStepValidAvocat ? styles.authButtonDisabled : {})}}
            disabled={loading || !isStepValidAvocat}
          >
            {loading ? t('signupSelect.processing') : avocatStep === totalAvocatSteps ? t('signupSelect.createAccount') : t('signupSelect.next')}
          </button>
        </div>

        <div style={styles.terms}>
          <span>{t('signupSelect.termsAndPrivacy')}</span>
        </div>
      </>
    );
  };

  const signupFirstRef = useRef(null);
  const loginEmailRef = useRef(null);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) clearValidationError(name);
    if (error) clearError();
  };

  useEffect(() => {
    if (currentForm === 'signup') {
      signupFirstRef.current?.focus();
    } else if (currentForm === 'signin') {
      loginEmailRef.current?.focus();
    }
  }, [currentForm]);

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      let formattedPhone = value.replace(/\D/g, '');
      if (formattedPhone.length > 8) {
        formattedPhone = formattedPhone.substring(0, 8);
      }
      setSignupData(prev => {
        if (prev[name] === formattedPhone) return prev;
        return { ...prev, [name]: formattedPhone };
      });
    } else {
      setSignupData(prev => {
        if (prev[name] === value) return prev;
        return { ...prev, [name]: value };
      });
    }
    if (errors[name]) clearValidationError(name);
    if (error) clearError();
  };

  const validateLogin = () => {
    let isValid = true;
    if (!validateField('email', loginData.email, { required: true, type: 'email' })) isValid = false;
    if (!validateField('password', loginData.password, { required: true, type: 'password' })) isValid = false;
    return isValid;
  };

  const validateSignup = () => {
    let isValid = true;
    if (!validateField('firstName', signupData.firstName, { required: true, type: 'text' })) isValid = false;
    if (!validateField('lastName', signupData.lastName, { required: true, type: 'text' })) isValid = false;
    if (!validateField('email', signupData.email, { required: true, type: 'email' })) isValid = false;
    if (!validateField('password', signupData.password, { required: true, type: 'password' })) isValid = false;
    if (!validatePasswordMatch(signupData.password, signupData.confirmPassword)) isValid = false;
    const fullPhoneNumber = `+216${signupData.phone}`;
    if (!validateField('phone', fullPhoneNumber, { required: true, type: 'phone' })) isValid = false;
    return isValid;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    clearError();
    try {
      const response = await login(loginData);
      if (response.user.userType === 'Client') {
        if (response.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/client/dashboard');
        }
      } else if (response.user.userType === 'Avocat') {
        navigate('/avocat/dashboard');
      }
    } catch (err) {
      console.error('Login error caught in SignupSelect:', err);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignup()) return;
    try {
      await signupClient({
        fullName: `${signupData.firstName} ${signupData.lastName}`,
        email: signupData.email,
        password: signupData.password,
        phone: `+216${signupData.phone}`,
      });
      navigate('/client/dashboard');
    } catch (err) {
      // error handled by context
    }
  };

  return (
    <div style={styles.authPage}>
      <style>{keyframesCSS}</style>
      <div style={styles.authBackground}>
        <div style={styles.containerAuthSplit}>
          <aside style={styles.navColumn}>
            <Logo style={styles.navLogo} variant="green" />
            <div style={styles.navButtons}>
              <button
                type="button"
                style={{...styles.navButton, ...(currentForm === 'signin' ? styles.navButtonActive : {})}}
                onClick={() => setCurrentForm('signin')}
              >
                {t('signupSelect.signIn')}
              </button>
              <button
                type="button"
                style={{...styles.navButton, ...(currentForm === 'signup' ? styles.navButtonActive : {})}}
                onClick={() => setCurrentForm('signup')}
              >
                {t('signupSelect.joinAsClient')}
              </button>
              <button
                type="button"
                style={{...styles.navButton, ...(currentForm === 'lawyer' ? styles.navButtonActive : {})}}
                onClick={() => setCurrentForm('lawyer')}
              >
                {t('signupSelect.joinAsLawyer')}
              </button>
              <button
                type="button"
                style={styles.navButton}
                onClick={() => navigate('/')}
              >
                {t('signupSelect.back')}
              </button>
            </div>
            <p style={styles.navFooter}>{t('signupSelect.needHelp')}</p>
          </aside>

          <main style={styles.formColumn}>
            {currentForm === 'signin' && (
              <form style={styles.authForm} onSubmit={handleLoginSubmit} noValidate>
                <div style={styles.formHeader}>
                  <h1 style={styles.authTitle}>{t('signupSelect.signInToAccount')}</h1>
                  <p style={styles.authSubtitle}>{t('signupSelect.welcomeBack') || 'Bienvenue, connectez-vous à votre compte'}</p>
                </div>

                {visibleError && (
                  <div style={{...styles.errorMessage, ...styles.errorMessageVisible}}>
                    {t(visibleError, { defaultValue: visibleError })}
                  </div>
                )}

                <div style={styles.formContent}>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>{t('signupSelect.emailAddress')} *</label>
                    <input
                      ref={loginEmailRef}
                      type="email"
                      name="email"
                      placeholder={`${t('signupSelect.emailAddress')} *`}
                      value={loginData.email}
                      onChange={handleLoginChange}
                      style={{...styles.input, ...(errors.email ? styles.inputError : {})}}
                      autoComplete="email"
                      required
                    />
                    {errors.email && <div style={styles.fieldError}>{errors.email}</div>}
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>{t('signupSelect.password')} *</label>
                    <input
                      type="password"
                      name="password"
                      placeholder={`${t('signupSelect.password')} *`}
                      value={loginData.password}
                      onChange={handleLoginChange}
                      style={{...styles.input, ...(errors.password ? styles.inputError : {})}}
                      autoComplete="current-password"
                      required
                    />
                    {errors.password && <div style={styles.fieldError}>{errors.password}</div>}
                  </div>
                </div>

                <div style={styles.formFooter}>
                  <button 
                    type="submit" 
                    style={{...styles.authButtonPrimary, ...(loading ? styles.authButtonDisabled : {})}}
                    disabled={loading}
                  >
                    {loading ? t('signupSelect.signingIn') : t('signupSelect.signIn')}
                  </button>
                  <div style={styles.terms}>
                    <span>{t('signupSelect.termsAndPrivacy')}</span>
                  </div>
                </div>
              </form>
            )}

            {currentForm === 'signup' && (
              <form style={styles.authForm} onSubmit={handleSignupSubmit} noValidate>
                <div style={styles.formHeader}>
                  <h1 style={styles.authTitle}>{t('signupSelect.createAccount')}</h1>
                  <p style={styles.authSubtitle}>{t('signupSelect.joinUs') || 'Créez votre compte et trouvez votre avocat'}</p>
                </div>

                {visibleError && currentForm === 'signup' && (
                  <div style={{...styles.errorMessage, ...styles.errorMessageVisible}}>
                    {t(visibleError, { defaultValue: visibleError })}
                  </div>
                )}

                <div style={styles.formContent}>
                  <div style={styles.nameFields}>
                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel}>{t('signupSelect.firstName')} *</label>
                      <input
                        ref={signupFirstRef}
                        type="text"
                        name="firstName"
                        placeholder={`${t('signupSelect.firstName')} *`}
                        value={signupData.firstName}
                        onChange={handleSignupChange}
                        style={{...styles.input, ...(errors.firstName ? styles.inputError : {})}}
                        autoComplete="given-name"
                        required
                      />
                      {errors.firstName && <div style={styles.fieldError}>{errors.firstName}</div>}
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel}>{t('signupSelect.lastName')} *</label>
                      <input
                        type="text"
                        name="lastName"
                        placeholder={`${t('signupSelect.lastName')} *`}
                        value={signupData.lastName}
                        onChange={handleSignupChange}
                        style={{...styles.input, ...(errors.lastName ? styles.inputError : {})}}
                        autoComplete="family-name"
                        required
                      />
                      {errors.lastName && <div style={styles.fieldError}>{errors.lastName}</div>}
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>{t('signupSelect.emailAddress')} *</label>
                    <input
                      type="email"
                      name="email"
                      placeholder={`${t('signupSelect.emailAddress')} *`}
                      value={signupData.email}
                      onChange={handleSignupChange}
                      style={{...styles.input, ...(errors.email ? styles.inputError : {})}}
                      autoComplete="email"
                      required
                    />
                    {errors.email && <div style={styles.fieldError}>{errors.email}</div>}
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>{t('signupSelect.phoneNumber')} *</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+216 12345678"
                      value={signupData.phone}
                      onChange={handleSignupChange}
                      style={{...styles.input, ...(errors.phone ? styles.inputError : {})}}
                      autoComplete="tel"
                      maxLength={12}
                      title={t('signupSelect.phoneTitle')}
                      required
                    />
                    {errors.phone && <div style={styles.fieldError}>{errors.phone}</div>}
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>{t('signupSelect.password')} *</label>
                    <input
                      type="password"
                      name="password"
                      placeholder={`${t('signupSelect.password')} *`}
                      value={signupData.password}
                      onChange={handleSignupChange}
                      style={{...styles.input, ...(errors.password ? styles.inputError : {})}}
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                    {errors.password && <div style={styles.fieldError}>{errors.password}</div>}
                  </div>
                  <PasswordStrength value={signupData.password} />

                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>{t('signupSelect.confirmPassword')} *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder={`${t('signupSelect.confirmPassword')} *`}
                      value={signupData.confirmPassword}
                      onChange={handleSignupChange}
                      style={{...styles.input, ...(errors.confirmPassword ? styles.inputError : {})}}
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                    {errors.confirmPassword && <div style={styles.fieldError}>{errors.confirmPassword}</div>}
                  </div>
                </div>

                <div style={styles.formFooter}>
                  <button 
                    type="submit" 
                    style={{...styles.authButtonPrimary, ...(loading ? styles.authButtonDisabled : {})}}
                    disabled={loading}
                  >
                    {loading ? t('signupSelect.creating') : t('signupSelect.createAccount')}
                  </button>
                  <div style={styles.terms}>
                    <span>{t('signupSelect.termsAndPrivacy')}</span>
                  </div>
                </div>
              </form>
            )}

            {currentForm === 'lawyer' && (
              <div style={styles.lawyerEmbedded}>
                {visibleError && currentForm === 'lawyer' && (
                  <div style={{...styles.errorMessage, ...styles.errorMessageVisible}}>
                    {t(visibleError, { defaultValue: visibleError })}
                  </div>
                )}
                <form style={styles.authForm} onSubmit={handleAvocatSubmit} noValidate>
                  {AvocatFormInner()}
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// Styles object with VERY clear structure
const styles = {
  // Page Layout
  authPage: {
    minHeight: '100vh',
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  authBackground: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    position: 'relative',
    zIndex: 1,
  },
  containerAuthSplit: {
    width: '100%',
    maxWidth: '1200px',
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '2rem',
    animation: 'slideIn 0.6s ease-out',
  },
  
  // Navigation Column
  navColumn: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '1.5rem',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    animation: 'slideInLeft 0.6s ease-out',
  },
  navLogo: {
    marginBottom: '1rem',
  },
  navButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  navButton: {
    padding: '1rem 1.5rem',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '0.75rem',
    color: '#94a3b8',
    fontSize: '0.9375rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  navButtonActive: {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    borderColor: '#3b82f6',
    color: 'white',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
  },
  navFooter: {
    marginTop: 'auto',
    color: '#94a3b8',
    fontSize: '0.875rem',
    textAlign: 'center',
    paddingTop: '2rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  
  // Form Column
  formColumn: {
    background: 'white',
    borderRadius: '1.5rem',
    padding: '3rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    animation: 'slideInRight 0.6s ease-out',
    overflow: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Form Structure
  authForm: {
    width: '100%',
    maxWidth: '500px',
  },
  formHeader: {
    textAlign: 'center',
    marginBottom: '2.5rem',
  },
  authTitle: {
    fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '2rem',
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: '0.75rem',
  },
  authSubtitle: {
    color: '#64748b',
    fontSize: '0.9375rem',
    lineHeight: 1.6,
  },
  formContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    marginBottom: '2rem',
  },
  formFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  
  // Input Styling
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  inputLabel: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: '0.25rem',
  },
  input: {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.75rem',
    fontSize: '0.9375rem',
    fontFamily: 'inherit',
    color: '#0f172a',
    background: 'white',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.75rem',
    fontSize: '0.9375rem',
    fontFamily: 'inherit',
    color: '#0f172a',
    background: 'white',
    transition: 'all 0.3s ease',
    outline: 'none',
    cursor: 'pointer',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  selectError: {
    borderColor: '#ef4444',
  },
  fieldError: {
    color: '#ef4444',
    fontSize: '0.8125rem',
    fontWeight: 500,
    marginTop: '0.25rem',
  },
  nameFields: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  
  // Phone Input
  phoneInputContainer: {
    display: 'flex',
    alignItems: 'center',
    border: '2px solid #e2e8f0',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    background: 'white',
    transition: 'all 0.3s ease',
  },
  phonePrefix: {
    padding: '0.875rem 0 0.875rem 1rem',
    background: '#f8fafc',
    color: '#64748b',
    fontWeight: 600,
    fontSize: '0.9375rem',
    borderRight: '1px solid #e2e8f0',
  },
  phoneInput: {
    flex: 1,
    padding: '0.875rem 1rem',
    border: 'none',
    fontSize: '0.9375rem',
    fontFamily: 'inherit',
    color: '#0f172a',
    outline: 'none',
  },
  
  // File Upload
  fileUploadContainer: {
    position: 'relative',
    border: '2px dashed #e2e8f0',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    background: '#f8fafc',
    cursor: 'pointer',
  },
  fileUploadError: {
    borderColor: '#ef4444',
    background: 'rgba(239, 68, 68, 0.05)',
  },
  fileInputHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    opacity: 0,
    pointerEvents: 'none',
  },
  fileUploadLabel: {
    display: 'block',
    color: '#64748b',
    fontSize: '0.9375rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  
  // Buttons
  authButtonPrimary: {
    width: '100%',
    padding: '1rem 1.5rem',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
  authButtonSecondary: {
    width: '100%',
    padding: '1rem 1.5rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: 'white',
    color: '#0f172a',
  },
  authButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  
  // Error Message
  errorMessage: {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderLeft: '4px solid #ef4444',
    color: '#ef4444',
    padding: '1rem 1.25rem',
    borderRadius: '0.75rem',
    fontSize: '0.9375rem',
    fontWeight: 500,
    opacity: 0,
    maxHeight: 0,
    overflow: 'hidden',
    transform: 'translateY(-10px)',
    transition: 'all 0.3s ease',
    marginBottom: 0,
  },
  errorMessageVisible: {
    opacity: 1,
    maxHeight: '200px',
    transform: 'translateY(0)',
    marginBottom: '1.5rem',
  },
  
  // Terms
  terms: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.8125rem',
    lineHeight: 1.5,
  },
  
  // Progress Bar (Lawyer form)
  progressBar: {
    marginBottom: '2rem',
  },
  progressTrack: {
    height: '4px',
    background: '#e2e8f0',
    borderRadius: '100px',
    overflow: 'hidden',
    marginBottom: '1rem',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    borderRadius: '100px',
    transition: 'width 0.4s ease',
  },
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: '0.8125rem',
    color: '#64748b',
    fontWeight: 600,
    transition: 'all 0.3s ease',
  },
  progressLabelActive: {
    color: '#3b82f6',
    fontWeight: 700,
  },
  
  // Step Content
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    marginBottom: '2rem',
  },
  formButtons: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
  },
  
  // Lawyer Embedded
  lawyerEmbedded: {
    width: '100%',
    maxWidth: '600px',
  },
  notice: {
    padding: '2rem',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '0.75rem',
    textAlign: 'center',
  },
};

// Keyframes CSS
const keyframesCSS = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideForward {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideBackward {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;

export default SignupSelect;