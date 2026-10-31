import React, { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import {
  ArrowRight,
  Building2,
  Check,
  CircleHelp,
  CreditCard,
  Eye,
  EyeOff,
  FileCheck2,
  Layers,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { getPasswordRuleResults, loginSchema, registerSchema } from './authValidation';
import './AuthPage.css';

const SAMPLE_MRR = 84260;
const BILLING_STATUSES = [
  { label: 'Draft', className: 'is-draft' },
  { label: 'Confirmed', className: 'is-confirmed' },
  { label: 'Paid', className: 'is-paid' }
];

function Brand({ inverse = false }) {
  return (
    <div className={`auth-brand ${inverse ? 'auth-brand--inverse' : ''}`}>
      <span className="auth-brand__mark">
        <Layers className="w-[19px] h-[19px]" strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span className="auth-brand__name">Brightloop</span>
    </div>
  );
}

function FieldError({ id, message }) {
  return (
    <span className="auth-field__error" id={id} aria-live="polite">
      {message || ''}
    </span>
  );
}

function ProductPreview({ pointerHandlers }) {
  const [statusIndex, setStatusIndex] = useState(0);
  const [mrr, setMrr] = useState(() => (
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? SAMPLE_MRR : 0
  ));
  const currentStatus = BILLING_STATUSES[statusIndex];

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    const requestFrame = window.requestAnimationFrame?.bind(window)
      || (callback => window.setTimeout(() => callback(performance.now()), 16));
    const cancelFrame = window.cancelAnimationFrame?.bind(window) || window.clearTimeout.bind(window);
    const duration = 1400;
    const startedAt = performance.now();
    let frameId;
    const countUp = now => {
      const progress = Math.min((now - startedAt) / duration, 1);
      setMrr(Math.round(SAMPLE_MRR * (1 - (1 - progress) ** 3)));
      if (progress < 1) frameId = requestFrame(countUp);
    };

    frameId = requestFrame(countUp);
    return () => cancelFrame(frameId);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    const intervalId = window.setInterval(() => {
      setStatusIndex(index => (index + 1) % BILLING_STATUSES.length);
    }, 4000);
    return () => window.clearInterval(intervalId);
  }, []);

  const formattedMrr = useMemo(() => new Intl.NumberFormat('en-IN').format(mrr), [mrr]);

  return (
    <div className="auth-product-preview" {...pointerHandlers} aria-label="Brightloop product preview">
      <div className="auth-product-preview__caption">
        <span><Sparkles size={13} aria-hidden="true" /> A clearer view of recurring business</span>
        <span className="auth-product-preview__sample">SAMPLE</span>
      </div>

      <div className="auth-preview-composition">
        <div className="auth-preview-layer auth-preview-layer--subscription">
          <article className="auth-glass-card auth-subscription-card">
            <div className="auth-glass-card__eyebrow"><Layers size={13} aria-hidden="true" /> SUBSCRIPTION</div>
            <div className="auth-subscription-card__title">
              <strong>SUB-000123</strong><span>·</span><span>Acme Corp</span>
              <span className="auth-status-badge is-paid"><i /> Active</span>
            </div>
            <div className="auth-subscription-card__meta">
              <span>Pro <i /> Monthly</span>
              <span>Next billing <strong>Nov 30, 2026</strong></span>
            </div>
          </article>
        </div>

        <div className="auth-preview-layer auth-preview-layer--invoice">
          <article className="auth-glass-card auth-invoice-card">
            <div className="auth-invoice-card__top">
              <div>
                <span className="auth-glass-card__eyebrow"><FileCheck2 size={13} aria-hidden="true" /> INVOICE</span>
                <strong>INV-2026-000412</strong>
              </div>
              <span className={`auth-status-badge ${currentStatus.className}`} aria-live="polite">
                <i /> {currentStatus.label}
              </span>
            </div>
            <div className="auth-invoice-stepper" aria-label={`Invoice status: ${currentStatus.label}`}>
              {BILLING_STATUSES.map((status, index) => (
                <React.Fragment key={status.label}>
                  <span className={`auth-invoice-step ${index <= statusIndex ? 'is-complete' : ''} ${index === statusIndex ? 'is-current' : ''}`}>
                    <i>{index < statusIndex ? <Check size={10} aria-hidden="true" /> : null}</i>
                    {status.label}
                  </span>
                  {index < BILLING_STATUSES.length - 1 && <span className={`auth-invoice-step__line ${index < statusIndex ? 'is-complete' : ''}`} />}
                </React.Fragment>
              ))}
            </div>
          </article>
        </div>

        <div className="auth-preview-layer auth-preview-layer--mrr">
          <article className="auth-glass-card auth-mrr-card">
            <div className="auth-mrr-card__content">
              <span className="auth-glass-card__eyebrow"><CreditCard size={13} aria-hidden="true" /> MONTHLY RECURRING REVENUE</span>
              <strong><span aria-hidden="true">₹</span>{formattedMrr}</strong>
              <span className="auth-mrr-card__note">Illustrative demo metric</span>
            </div>
            <svg className="auth-mrr-sparkline" viewBox="0 0 112 56" role="img" aria-label="Illustrative upward revenue trend">
              <defs>
                <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#E7C3DD" stopOpacity=".4" />
                  <stop offset="100%" stopColor="#E7C3DD" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M2 48 L18 37 L32 41 L47 25 L61 31 L76 16 L91 22 L110 5 L110 56 L2 56 Z" fill="url(#spark-fill)" />
              <path d="M2 48 L18 37 L32 41 L47 25 L61 31 L76 16 L91 22 L110 5" fill="none" stroke="#E8C6DC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="110" cy="5" r="3" fill="#FFF8FE" />
            </svg>
          </article>
        </div>
      </div>

      <p className="auth-preview-footnote"><CircleHelp size={13} aria-hidden="true" /> Sample values are illustrative, not live account data.</p>
    </div>
  );
}

function AuthField({ id, label, icon: Icon, type = 'text', registration, error, ...props }) {
  const errorId = `${id}-error`;
  return (
    <div className="auth-field">
      <label className="auth-field__label" htmlFor={id}>{label}</label>
      <span className={`auth-field__control ${error ? 'has-error' : ''}`}>
        {Icon && <Icon className="auth-field__icon" aria-hidden="true" />}
        <input
          id={id}
          type={type}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          {...registration}
          {...props}
        />
      </span>
      <FieldError id={errorId} message={error?.message} />
    </div>
  );
}

function PasswordChecklist({ password, confirmPassword }) {
  const rules = getPasswordRuleResults(password, confirmPassword);
  const passedCount = rules.filter(rule => rule.passed).length;

  return (
    <div className="auth-password-checklist" aria-label="Password requirements">
      <div className="auth-password-checklist__top">
        <span>Password requirements</span>
        <span>{passedCount} of {rules.length}</span>
      </div>
      <div
        className="auth-password-progress"
        role="progressbar"
        aria-label="Password requirements met"
        aria-valuemin={0}
        aria-valuemax={rules.length}
        aria-valuenow={passedCount}
      >
        <span style={{ width: `${(passedCount / rules.length) * 100}%` }} />
      </div>
      <ul className="auth-password-rules">
        {rules.map(rule => (
          <li key={rule.id} className={rule.passed ? 'is-passed' : ''} aria-label={`${rule.label}: ${rule.passed ? 'met' : 'not met'}`}>
            <span className="auth-password-rules__icon" aria-hidden="true">
              {rule.passed ? <Check size={11} /> : <X size={10} />}
            </span>
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabLink({ to, selected, children, onKeyDown, linkRef }) {
  return (
    <Link
      to={to}
      role="tab"
      aria-selected={selected}
      aria-controls="auth-form-panel"
      tabIndex={selected ? 0 : -1}
      ref={linkRef}
      className={`auth-mode-switch__tab ${selected ? 'is-selected' : ''}`}
      onKeyDown={onKeyDown}
    >
      {children}
    </Link>
  );
}

export function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const { login, registerAccount, isAuthenticated } = useData();
  const tabRefs = useRef([]);
  const pendingTabFocus = useRef(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const schema = isRegister ? registerSchema : loginSchema;
  const {
    register,
    control,
    setError,
    clearErrors,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    criteriaMode: 'all',
    defaultValues: { acceptedTerms: false, companyName: '', role: 'customer' }
  });
  const password = useWatch({ control, name: 'password' }) || '';
  const confirmPassword = useWatch({ control, name: 'confirmPassword' }) || '';
  const accountRole = useWatch({ control, name: 'role' }) || 'customer';

  useEffect(() => {
    if (!pendingTabFocus.current) return;
    tabRefs.current[isRegister ? 1 : 0]?.focus();
    pendingTabFocus.current = false;
  }, [isRegister]);

  useEffect(() => {
    if (isAuthenticated) navigate('/app', { replace: true });
  }, [isAuthenticated, navigate]);

  const handlePointerMove = event => {
    if (event.pointerType !== 'mouse' || window.matchMedia?.('(max-width: 900px)').matches) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setParallax({
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 14,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 10
    });
  };

  const onSubmit = async values => {
    setNotice('');
    clearErrors();
    if (isRegister && values.role === 'staff') {
      setNotice('Staff accounts must be created by an administrator. Contact your administrator to request access.');
      return;
    }
    try {
      if (isRegister) {
        await registerAccount({
          email: values.email,
          password: values.password,
          name: values.fullName,
          companyName: values.companyName,
          role: values.role
        });
      } else {
        await login({
          email: values.email,
          password: values.password,
          rememberMe: values.rememberMe
        });
      }
      navigate('/app', { replace: true });
    } catch (error) {
      const fieldNames = {
        email: 'email',
        password: 'password',
        name: 'fullName',
        company_name: 'companyName'
      };
      let mappedFieldError = false;
      Object.entries(fieldNames).forEach(([apiField, formField]) => {
        const messages = error.data?.[apiField];
        if (messages) {
          setError(formField, {
            type: 'server',
            message: Array.isArray(messages) ? messages[0] : String(messages)
          });
          mappedFieldError = true;
        }
      });
      if (!mappedFieldError) setNotice(error.message || 'Unable to authenticate. Please try again.');
    }
  };

  const handleTabKeyDown = (event, selectedIndex) => {
    const tabs = ['/login', '/register'];
    let nextIndex = selectedIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      nextIndex = (selectedIndex + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    } else if (event.key === 'Home') {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      nextIndex = tabs.length - 1;
    }
    if (nextIndex !== selectedIndex) {
      pendingTabFocus.current = true;
      navigate(tabs[nextIndex]);
    }
  };

  return (
    <main className="auth-page-v2">
      <section className="auth-showcase" aria-label="Brightloop subscription billing">
        <div className="auth-showcase__texture" aria-hidden="true" />
        <div className="auth-cycle-ring auth-cycle-ring--outer" aria-hidden="true" />
        <div className="auth-cycle-ring auth-cycle-ring--inner" aria-hidden="true" />
        <div className="auth-showcase__inner">
          <Brand inverse />
          <div className="auth-showcase__copy">
            <span className="auth-eyebrow"><Sparkles size={14} aria-hidden="true" /> SUBSCRIPTIONS, IN SYNC</span>
            <h1>Recurring revenue,<br />with room to <span>grow.</span></h1>
            <ul className="auth-proof-list">
              <li><span><Check size={12} aria-hidden="true" /></span>Every invoice generated automatically</li>
              <li><span><Check size={12} aria-hidden="true" /></span>Never billed twice, never skipped</li>
              <li><span><Check size={12} aria-hidden="true" /></span>Revenue, payments and overdue in one view</li>
            </ul>
          </div>

          <ProductPreview
            pointerHandlers={{
              onPointerMove: handlePointerMove,
              onPointerLeave: () => setParallax({ x: 0, y: 0 }),
              style: { '--parallax-x': `${parallax.x}px`, '--parallax-y': `${parallax.y}px` }
            }}
          />

          <div className="auth-showcase__foot">
            <span><ShieldCheck size={15} aria-hidden="true" /> Built for clarity. Designed for your team.</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__mobile-brand">
          <Brand />
          <div className="auth-panel__mobile-heading">
            <span className="auth-eyebrow"><Sparkles size={12} aria-hidden="true" /> SUBSCRIPTIONS, IN SYNC</span>
            <h1>Recurring revenue,<br />with room to <span>grow.</span></h1>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card__topline">
            <span className="auth-step"><span /> YOUR WORKSPACE</span>
          </div>

          <div className="auth-heading">
            <h2>{isRegister ? 'A better rhythm starts here.' : 'Good to have you back.'}</h2>
            <p>{isRegister ? 'Create your Brightloop account and bring every recurring detail together.' : 'Sign in to pick up where your business left off.'}</p>
          </div>

          <div className="auth-mode-switch" role="tablist" aria-label="Account options" aria-orientation="horizontal">
            <span className={`auth-mode-switch__indicator ${isRegister ? 'is-register' : ''}`} aria-hidden="true" />
            <TabLink to="/login" selected={!isRegister} linkRef={node => { tabRefs.current[0] = node; }} onKeyDown={event => handleTabKeyDown(event, 0)}>Sign in</TabLink>
            <TabLink to="/register" selected={isRegister} linkRef={node => { tabRefs.current[1] = node; }} onKeyDown={event => handleTabKeyDown(event, 1)}>Create account</TabLink>
          </div>

          <form id="auth-form-panel" className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            {isRegister && (
              <>
                <fieldset className="auth-role-select">
                  <legend className="auth-field__label">Create account as</legend>
                  <div className="auth-role-select__options">
                    <label className={`auth-role-option ${accountRole === 'customer' ? 'is-selected' : ''}`}>
                      <input type="radio" value="customer" {...register('role')} />
                      <span className="auth-role-option__title"><UserRound size={15} aria-hidden="true" /> Customer</span>
                      <span className="auth-role-option__description">Manage your subscriptions and invoices.</span>
                    </label>
                    <label className={`auth-role-option ${accountRole === 'staff' ? 'is-selected' : ''}`}>
                      <input type="radio" value="staff" {...register('role')} />
                      <span className="auth-role-option__title"><UsersRound size={15} aria-hidden="true" /> Staff</span>
                      <span className="auth-role-option__description">For members of a Brightloop workspace.</span>
                    </label>
                  </div>
                </fieldset>
                {accountRole === 'staff' && (
                  <p className="auth-role-notice" role="status">
                    Staff accounts must be created by an administrator. Contact your administrator to request access.
                  </p>
                )}
                <AuthField
                  id="full-name"
                  label="Full name"
                  icon={UserRound}
                  placeholder="Your full name"
                  autoComplete="name"
                  registration={register('fullName')}
                  error={errors.fullName}
                />
                <AuthField
                  id="company-name"
                  label="Company (optional)"
                  icon={Building2}
                  placeholder="Your company"
                  autoComplete="organization"
                  registration={register('companyName')}
                  error={errors.companyName}
                />
              </>
            )}

            <AuthField
              id="email"
              label="Work email"
              icon={Mail}
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              registration={register('email')}
              error={errors.email}
            />

            <div className="auth-field">
              <label className="auth-field__label" htmlFor="password">Password</label>
              <span className={`auth-field__control ${errors.password ? 'has-error' : ''}`}>
                <LockKeyhole className="auth-field__icon" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isRegister ? 'Create a strong password' : 'Enter your password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby="password-error"
                  {...register('password')}
                />
                <button
                  className="auth-password-toggle"
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </span>
              <FieldError id="password-error" message={errors.password?.message} />
              {isRegister && (
                <PasswordChecklist password={password} confirmPassword={confirmPassword} />
              )}
            </div>

            {isRegister ? (
              <>
                <div className="auth-field">
                  <label className="auth-field__label" htmlFor="confirm-password">Confirm password</label>
                  <span className={`auth-field__control ${errors.confirmPassword ? 'has-error' : ''}`}>
                    <LockKeyhole className="auth-field__icon" aria-hidden="true" />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Enter your password again"
                      autoComplete="new-password"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby="confirm-password-error"
                      {...register('confirmPassword')}
                    />
                    <button
                      className="auth-password-toggle"
                      type="button"
                      onClick={() => setShowConfirmPassword(value => !value)}
                      aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                    >
                      {showConfirmPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                    </button>
                  </span>
                  <FieldError id="confirm-password-error" message={errors.confirmPassword?.message} />
                </div>
                <label className="auth-terms">
                  <input type="checkbox" aria-describedby="terms-error" {...register('acceptedTerms')} />
                  <span className="auth-terms__box"><Check size={12} aria-hidden="true" /></span>
                  <span>I agree to the <a href="#terms" onClick={event => event.preventDefault()}>Terms of Service</a> and <a href="#privacy" onClick={event => event.preventDefault()}>Privacy Policy</a>.</span>
                </label>
                <FieldError id="terms-error" message={errors.acceptedTerms?.message} />
              </>
            ) : (
              <div className="auth-form__options">
                <label className="auth-remember"><input type="checkbox" {...register('rememberMe')} /> <span>Remember me</span></label>
                <button type="button" className="auth-text-button" onClick={() => setNotice('Password reset is not configured yet. Contact your administrator.')}>Forgot password?</button>
              </div>
            )}

            {notice && <p className="auth-notice" role="status" aria-live="polite">{notice}</p>}

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting && <span className="auth-spinner" aria-hidden="true" />}
              {isSubmitting ? 'Please wait…' : isRegister ? 'Create your account' : 'Sign in to Brightloop'}
              {!isSubmitting && <ArrowRight className="auth-submit__arrow" size={17} aria-hidden="true" />}
            </button>
          </form>

          {!import.meta.env.PROD && (
            <p className="auth-preview-note">
              <ShieldCheck size={13} aria-hidden="true" />
              Account access is connected. Sample workspace data is illustrative.
            </p>
          )}
          <p className="auth-legal">© 2026 Brightloop <span>•</span> Subscription management, made considered.</p>
        </div>
      </section>
    </main>
  );
}
