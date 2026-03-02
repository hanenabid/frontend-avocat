import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useValidation } from '../hooks/useValidation';
import Loader from '../components/Loader';
import PasswordStrength from '../components/PasswordStrength';
import { useTranslation } from 'react-i18next';
import mapToKey from '../utils/i18nMapping';
import AnimatedErrorBanner from '../components/AnimatedErrorBanner';
import Navbar from '../components/Navbar';

const SignupAvocat = () => {
    const { t } = useTranslation();
    // Debug: render counter for this component
    const renderCountRef = useRef(0);
    renderCountRef.current += 1;
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        ville: '',
        adresseCabinet: '', // New field for cabinet address
        specialites: '',
        diplome: '',
        bio: '', // New field for bio
        documentsVerif: null, // Changed to null for file
        avatarUrl: null, // New field for avatar
        anneExperience: '', // New field for years of experience
        langues: [], // New field for languages
    // disponibilites removed — backend will apply default working hours (Mon-Sat 08:00-17:00)
    });
    
    // State for cities from API
    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(true);
    
    const validationMessages = {
        required: (field) => t('validation.required', { field }),
        email: t('validation.email'),
        password: t('validation.password'),
        passwordMatch: t('validation.passwordMatch'),
        phone: t('validation.phone'),
        fileType: t('validation.fileType'),
        fileSize: (max) => t('validation.fileSize', { max }),
        fileRequired: t('validation.fileRequired'),
        minLength: (field, min) => t('validation.minLength', { field, min }),
        maxLength: (field, max) => t('validation.maxLength', { field, max })
    };

    const { errors, validateField, validatePasswordMatch, validateFile, clearError: clearValidationError } = useValidation(validationMessages);

    // Debug: Log errors when they change
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.log('Current validation errors:', errors);
        }
    }, [errors]);

    const totalSteps = 3;

    // lightweight client-side step validity (non-invasive, no error flood)
    const [isStepValid, setIsStepValid] = useState(false);

    // Track direction for slide animation between steps
    const prevStepRef = useRef(currentStep);
    const [direction, setDirection] = useState('');

    useEffect(() => {
        if (prevStepRef.current !== currentStep) {
            setDirection(currentStep > prevStepRef.current ? 'forward' : 'backward');
            prevStepRef.current = currentStep;
            const t = setTimeout(() => setDirection(''), 360); // clear after animation
            return () => clearTimeout(t);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep]);

    const isCurrentStepValidSimple = () => {
        if (currentStep === 1) {
            // basic presence checks
            return !!formData.fullName && !!formData.email && !!formData.ville;
        }
        if (currentStep === 2) {
            return !!formData.specialites && !!formData.diplome && !!formData.documentsVerif;
        }
        if (currentStep === 3) {
            return formData.password && formData.password.length >= 8 && (formData.password === formData.confirmPassword);
        }
        return true;
    };

    useEffect(() => {
        setIsStepValid(isCurrentStepValidSimple());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, currentStep]);

    // Fetch cities from API
    useEffect(() => {
        const loadCities = () => {
            setLoadingCities(true);
            
            // Simulate API call with timeout to show loading state
            setTimeout(() => {
                const tunisianCities = [
                    'Tunis', 'Sfax', 'Sousse', 'Gabes', 'Bizerte', 'Ariana', 
                    'Gafsa', 'Monastir', 'Kairouan', 'Kasserine', 'Mahdia', 
                    'Nabeul', 'Tataouine', 'Kebili', 'Siliana', 'Kef',
                    'Jendouba', 'Zaghouan', 'Beja', 'Manouba', 'Medenine',
                    'Tozeur', 'Sidi Bouzid', 'Ben Arous'
                ];
                // store canonical keys as values so backend receives standard values
                setCities(tunisianCities.sort().map(c => ({ key: mapToKey(c, 'city'), label: c })));
                setLoadingCities(false);
            }, 500); // Half second delay to simulate API call
        };

        loadCities();
    }, []);

    const nextStep = () => {
        // Force validation on next step to show errors
        if (validateCurrentStep()) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        } else {
            console.log('Validation failed, errors should be visible:', errors);
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const validateCurrentStep = () => {
        let isValid = true;
        console.log(`[Validation] Validating step ${currentStep}`);
        
        if (currentStep === 1) {
            if (!validateField('fullName', formData.fullName, { required: true, type: 'text' })) {
                console.log('[Validation] Full name validation failed');
                isValid = false;
            }
            if (!validateField('email', formData.email, { required: true, type: 'email' })) {
                console.log('[Validation] Email validation failed');
                isValid = false;
            }
            // Validate phone with +216 prefix if phone is provided
            if (formData.phone && formData.phone.trim()) {
                const fullPhoneNumber = `+216${formData.phone}`;
                if (!validateField('phone', fullPhoneNumber, { required: false, type: 'phone' })) {
                    console.log('[Validation] Phone validation failed');
                    isValid = false;
                }
            }
            if (!validateField('ville', formData.ville, { required: true, type: 'text' })) {
                console.log('[Validation] City validation failed');
                isValid = false;
            }
        } else if (currentStep === 2) {
            if (!validateField('specialites', formData.specialites, { required: true, type: 'text' })) {
                console.log('[Validation] Speciality validation failed');
                isValid = false;
            }
            if (!validateField('diplome', formData.diplome, { required: true, type: 'text' })) {
                console.log('[Validation] Diploma validation failed');
                isValid = false;
            }
            
            if (!formData.documentsVerif) {
                validateField('documentsVerif', '', { required: true });
                console.log('[Validation] Documents verification required');
                isValid = false;
            } else {
                const fileValidation = validateFile(formData.documentsVerif);
                if (!fileValidation.isValid) {
                    validateField('documentsVerif', '', { 
                        custom: () => fileValidation.error 
                    });
                    console.log('[Validation] File validation failed:', fileValidation.error);
                    isValid = false;
                } else {
                    clearValidationError('documentsVerif');
                }
            }
        } else if (currentStep === 3) {
            if (!validateField('password', formData.password, { required: true, type: 'password' })) {
                console.log('[Validation] Password validation failed');
                isValid = false;
            }
            if (!validatePasswordMatch(formData.password, formData.confirmPassword)) {
                console.log('[Validation] Password match validation failed');
                isValid = false;
            }
        } else if (currentStep === 4) {
            // Availability validation is optional
            isValid = true;
        } else if (currentStep === 5) {
            // Profile details validation - all optional except experience
            if (formData.anneExperience && (!Number.isInteger(Number(formData.anneExperience)) || Number(formData.anneExperience) < 0)) {
                validateField('anneExperience', formData.anneExperience, { 
                    custom: () => 'Years of experience must be a valid number' 
                });
                isValid = false;
            }
            
            // Validate avatar file if uploaded
            if (formData.avatarUrl) {
                const fileValidation = validateFile(formData.avatarUrl, { maxSize: 5, allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'] });
                if (!fileValidation.isValid) {
                    validateField('avatarUrl', '', { 
                        custom: () => fileValidation.error 
                    });
                    isValid = false;
                } else {
                    clearValidationError('avatarUrl');
                }
            }
        }
        
        console.log(`[Validation] Step ${currentStep} validation result:`, isValid);
        console.log(`[Validation] Current errors:`, errors);
        return isValid;
    };

    const { signupAvocat, loading, error, clearError } = useAuth();
    const navigate = useNavigate();

    // Signup handlers (existing code)

    const MAX_FILE_SIZE_MB = 8; // Increased file size to 10MB for Cloudinary

    const handleChange = (e) => {
        const { name, value, type, files, checked } = e.target;
        
        if (type === 'file') {
            const file = files[0];
            
            setFormData(prev => ({
                ...prev,
                [name]: file
            }));
            
            // File validation using hook
            if (file) {
                let maxSize = MAX_FILE_SIZE_MB;
                let allowedTypes = undefined;
                
                // Different validation for avatar vs documents
                if (name === 'avatarUrl') {
                    maxSize = 5; // 5MB for images
                    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                }
                
                const fileValidation = validateFile(file, { maxSize, allowedTypes });
                if (!fileValidation.isValid) {
                    validateField(name, '', { 
                        custom: () => fileValidation.error 
                    });
                } else {
                    clearValidationError(name);
                }
            }
        } else if (type === 'checkbox' && name.startsWith('langue_')) {
            // Handle language checkboxes
            const language = name.replace('langue_', '');
            setFormData(prev => ({
                ...prev,
                langues: checked 
                    ? [...prev.langues, language]
                    : prev.langues.filter(lang => lang !== language)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
            
            // Clear errors when user starts typing
            if (errors[name]) {
                clearValidationError(name);
            }
        }
        
        if (error) {
            clearError();
        }
    };

    // Special handler for phone number with +216 prefix and 8 digits
    const handlePhoneChange = (e) => {
        let value = e.target.value;
        
        // Remove all non-digits
        value = value.replace(/\D/g, '');
        
        // Limit to exactly 8 digits
        if (value.length > 8) {
            value = value.slice(0, 8);
        }
        
        // Update form data with just the 8 digits
        setFormData(prev => ({
            ...prev,
            phone: value
        }));
        
        // Clear errors when user starts typing
        if (errors.phone) {
            clearValidationError('phone');
        }
        
        if (error) {
            clearError();
        }
    };

    // Drag and drop handlers for file upload
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            
            // Check file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                validateField('documentsVerif', '', { 
                    custom: () => 'Please upload only PDF, JPG, or PNG files'
                });
                return;
            }
            
            // Update form data
            setFormData(prev => ({
                ...prev,
                documentsVerif: file
            }));
            
            // Validate file
            const fileValidation = validateFile(file);
            if (!fileValidation.isValid) {
                validateField('documentsVerif', '', { 
                    custom: () => fileValidation.error 
                });
            } else {
                clearValidationError('documentsVerif');
            }
        }
    };

    // Small wrapper component to detect mount/unmount of step content
    const StepContent = ({ children, step }) => {
        useEffect(() => {
            console.log(`[SignupAvocat] Step ${step} mounted (render #${renderCountRef.current})`);
            return () => console.log(`[SignupAvocat] Step ${step} unmounted (render #${renderCountRef.current})`);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [step]);

        return <>{children}</>;
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <StepContent step={1}>
                        <div className="input-label">
                            {t('signupSelect.fullName')} *
                        </div>
                        <input
                            type="text"
                            name="fullName"
                            placeholder={t('signupSelect.fullNamePlaceholder')}
                            value={formData.fullName}
                            onChange={handleChange}
                            className={errors.fullName ? 'error' : ''}
                        />
                        <div className="field-error">{errors.fullName || ''}</div>
                        
                        <div className="input-label">
                            {t('signupSelect.emailAddress')} *
                        </div>
                        <input
                            type="email"
                            name="email"
                            placeholder={t('signupSelect.emailPlaceholder') || 'Email Address *'}
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'error' : ''}
                        />
                        <div className="field-error">{errors.email || ''}</div>
                        
                        <div className="input-label">
                            {t('signupSelect.phoneNumber')} (+216)
                        </div>
                        <div className="phone-input-container">
                            <span className="phone-prefix" aria-hidden>+216</span>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="12345678"
                                value={formData.phone}
                                onChange={handlePhoneChange}
                                className={`phone-input ${errors.phone ? 'error' : ''}`}
                                maxLength="8"
                            />
                        </div>
                        <div className="field-error">{errors.phone || ''}</div>
                        
                        <div className="input-label">
                            {t('signupSelect.selectCity')}
                        </div>
                        <select
                            name="ville"
                            value={formData.ville}
                            onChange={handleChange}
                            className={errors.ville ? 'error' : ''}
                            disabled={loadingCities}
                        >
                            <option value="">
                                {loadingCities ? t('signupSelect.loadingCities') : t('signupSelect.selectCity')}
                            </option>
                            {cities.map(city => (
                                <option key={city.key || city} value={city.key || city}>
                                    {t(`signupSelect.cities.${city.key || city}`, { defaultValue: city.label || city })}
                                </option>
                            ))}
                        </select>
                        <div className="field-error">{errors.ville || ''}</div>
                    </StepContent>
                );
            case 2:
                return (
                    <StepContent step={2}>
                        <div className="input-label">
                            {t('signupSelect.selectSpeciality')}
                        </div>
                        <select
                            name="specialites"
                            value={formData.specialites}
                            onChange={handleChange}
                            className={errors.specialites ? 'error' : ''}
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
                        <div className="field-error">{errors.specialites || ''}</div>
                        
                        <div className="input-label">
                            {t('signupSelect.diploma')} *
                        </div>
                        <input
                            type="text"
                            name="diplome"
                            placeholder={t('signupSelect.diplomaPlaceholder')}
                            value={formData.diplome}
                            onChange={handleChange}
                            className={errors.diplome ? 'error' : ''}
                        />
                        <div className="field-error">{errors.diplome || ''}</div>
                        

                        <div className="input-label">
                            {t('signupSelect.uploadVerificationDocument')} *
                        </div>
                        <div 
                            className={`file-upload-container drag-drop-area ${isDragOver ? 'drag-over' : ''} ${errors.documentsVerif ? 'error' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                id="documentsVerif"
                                name="documentsVerif"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleChange}
                                className="file-input-hidden"
                            />
                            <label htmlFor="documentsVerif" className="file-upload-label">
                                <div className="file-upload-icon">{formData.documentsVerif ? '📄' : '📁'}</div>
                                <div className="file-upload-text">
                                    {formData.documentsVerif ? (
                                        <div className="file-upload-name-block">
                                            <div className="file-upload-name">✓ {formData.documentsVerif.name}</div>
                                            <div className="file-upload-subtext">{t('signupSelect.clickToChange')}</div>
                                        </div>
                                    ) : (
                                        <div className="file-upload-empty">
                                            <div className="file-upload-name">
                                                {isDragOver ? 'Drop verification documents here' : 'Verification Documents (PDF/JPG/PNG)'}
                                            </div>
                                            <div className="file-upload-subtext">{t('signupSelect.orClickToBrowse')}</div>
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>
                        <div className="field-error">{errors.documentsVerif || ''}</div>
                    </StepContent>
                );
            case 3:
                return (
                    <StepContent step={3}>
                        <div className="input-label">
                            {t('signupSelect.password')} *
                        </div>
                        <input
                            type="password"
                            name="password"
                            placeholder={t('signupSelect.passwordPlaceholder') || 'Password *'}
                            value={formData.password}
                            onChange={handleChange}
                            className={errors.password ? 'error' : ''}
                            minLength="8"
                        />
                        <div className="field-error">{errors.password || ''}</div>
                        <PasswordStrength value={formData.password} />
                        
                        <div className="input-label">
                            {t('signupSelect.confirmPassword')} *
                        </div>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder={t('signupSelect.confirmPasswordPlaceholder') || 'Confirm Password'}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={errors.confirmPassword ? 'error' : ''}
                            minLength="8"
                        />
                        <div className="field-error">{errors.confirmPassword || ''}</div>
                    </StepContent>
                );
            default:
                return (
                    <div className="notice">
                        <p>Account will be reviewed before activation.</p>
                    </div>
                );
        }
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 1:
                return t('signupSelect.personalInformation');
            case 2:
                return t('signupSelect.professionalDetails');
            case 3:
                return t('signupSelect.securitySettings');
            default:
                return t('signupSelect.createAccount');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (currentStep < totalSteps) {
            nextStep();
            return;
        }

        if (!validateCurrentStep()) {
            return;
        }

        try {
            // Use FormData for file upload
            const form = new FormData();
            form.append('email', formData.email);
            form.append('password', formData.password);
            form.append('fullName', formData.fullName);
            // Construct full phone number with +216 prefix for backend
            form.append('phone', `+216${formData.phone}`);
            form.append('ville', formData.ville);
            form.append('district', formData.district);
            form.append('specialites', formData.specialites);
            form.append('diplome', formData.diplome);
            // disponibilites removed from payload; backend applies defaults (Mon-Sat 08:00-17:00)
            
            // Add new fields
            if (formData.anneExperience) {
                form.append('anneExperience', formData.anneExperience);
            }
            if (formData.langues.length > 0) {
                form.append('langues', JSON.stringify(formData.langues));
            }
            if (formData.adresseCabinet) {
                form.append('adresseCabinet', formData.adresseCabinet);
            }
            if (formData.bio) {
                form.append('bio', formData.bio);
            }
            
            // Add files
            if (formData.documentsVerif) {
                form.append('documentsVerif', formData.documentsVerif);
            }
            if (formData.avatarUrl) {
                form.append('avatarUrl', formData.avatarUrl);
            }

            await signupAvocat(form);
            navigate('/avocat/dashboard');
        } catch (err) {
            console.error('Signup error:', err);
        }
    };

    // Show loader when loading
    if (loading) {
        return <Loader />;
    }

    return (
        <div className="signup-avocat-page">
            <div className="auth-background">
                <div className="auth-container">
                <div className="auth-content">
                    {/* Compact Multi-step Form (only form, image removed) */}
                    <div className="auth-form-wrapper full-width">
                        <form className="auth-form" onSubmit={handleSubmit} noValidate>
                                <h1 id="signup-heading" className="auth-title">{t('signupSelect.createAccountavocat')}</h1>
                            <p className="auth-subtitle">{getStepTitle()}</p>
                            
                            {/* Step Progress Indicator (horizontal) */}
                            <div className="progress-bar" role="progressbar" aria-valuemin={1} aria-valuemax={totalSteps} aria-valuenow={currentStep}>
                                <div className="progress-track">
                                    <div className="progress-fill" style={{ width: `${((currentStep-1)/(totalSteps-1))*100}%` }} />
                                </div>
                                <div className="progress-labels">
                                    <span className={`progress-label ${currentStep === 1 ? 'active' : ''}`}>{t('signupSelect.personal')}</span>
                                    <span className={`progress-label ${currentStep === 2 ? 'active' : ''}`}>{t('signupSelect.professional')}</span>
                                    <span className={`progress-label ${currentStep === 3 ? 'active' : ''}`}>{t('signupSelect.security')}</span>
                                </div>
                            </div>
                            
                            <AnimatedErrorBanner message={error ? t(error, { defaultValue: error }) : ''} visible={Boolean(error)} />

                            <div
                                className="form-fields"
                                onFocusCapture={(e) => console.log('[SignupAvocat] onFocusCapture:', e.target.name || e.target.tagName, 'active:', document.activeElement && (document.activeElement.name || document.activeElement.tagName))}
                                onBlurCapture={(e) => console.log('[SignupAvocat] onBlurCapture:', e.target.name || e.target.tagName, 'active:', document.activeElement && (document.activeElement.name || document.activeElement.tagName))}
                            >
                                <div className={`step-panel step-${currentStep} ${direction === 'forward' ? 'enter-forward' : ''} ${direction === 'backward' ? 'enter-backward' : ''}`} key={`step-${currentStep}`}>
                                    {renderStep()}
                                </div>
                            </div>

                            <div className="form-buttons">
                                {currentStep > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={prevStep}
                                        className="auth-button secondary mt-4"
                                    >
                                        {t('signupSelect.back')}
                                    </button>
                                )}
                                
                              
                                
                                <button type="submit" className="auth-button primary mt-4" disabled={loading || !isStepValid} title={!isStepValid ? t('signupSelect.completeRequiredFields') : undefined}>
                                    {loading 
                                        ? t('signupSelect.processing') 
                                        : currentStep === totalSteps 
                                            ? t('signupSelect.createAccount') 
                                            : t('signupSelect.next')
                                    }
                                </button>
                            </div>

                        
                            
                            <div className="terms">
                                <span>{t('signupSelect.termsAndPrivacy')}</span>
                            </div>
                        </form>

                       
                    </div>
                </div>
            </div>
            </div>

            {/* Styles for the avocat multi-step form are centralized in
                `SignupSelect.css` so all auth forms share a consistent look.
                The inline styles were removed to avoid duplication. */}
        </div>
    );
};

export default SignupAvocat;