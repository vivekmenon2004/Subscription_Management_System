import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Blocks,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Code2,
  CreditCard,
  FileCheck2,
  FileText,
  Gauge,
  Gem,
  Layers3,
  LockKeyhole,
  Menu,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
  Zap
} from 'lucide-react';
import './LandingPage.css';

const gsapRuntime = Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
let scrollTriggerRegistered = false;
const heroScrollProgress = { current: { value: 0 } };

const lifecycle = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];

const roleDetails = {
  Admin: {
    icon: ShieldCheck,
    title: 'The whole system, under control.',
    body: 'Set the rules behind your revenue operation. Manage your team, configure tax and discount policies, and keep every plan aligned with your business.',
    points: ['Invite and manage staff', 'Configure taxes and discounts', 'Own plan and billing rules']
  },
  Staff: {
    icon: Blocks,
    title: 'Day-to-day work, without the busywork.',
    body: 'Give operators a focused workspace for customer relationships, quotations, invoice dispatch, and payment recording.',
    points: ['Create quotes from templates', 'Dispatch and track invoices', 'Record offline payments']
  },
  Customer: {
    icon: Gem,
    title: 'A better experience after checkout.',
    body: 'Customers can see only their own subscriptions, invoices, and payment history, with the control to manage their plan themselves.',
    points: ['Download signed invoice PDFs', 'Review payment history', 'Pause, renew, or close plans']
  }
};

const capabilities = [
  {
    id: 'catalog',
    number: '01',
    icon: Layers3,
    title: 'A catalog that understands variants.',
    description: 'Build products with attribute-driven options. Pricing stays predictable when every variant has its own cost and margin.',
    detail: 'Enterprise Cloud Suite',
    detailValue: '₹1,560',
    tag: 'Odoo brand · +₹560',
    className: 'capability-card--catalog'
  },
  {
    id: 'billing-engine',
    number: '02',
    icon: RefreshCw,
    title: 'Billing day, on autopilot.',
    description: 'Run idempotent batches in atomic transactions. Lock due subscriptions with skip-locked rows and enforce uniqueness for each billing period.',
    detail: 'Invoice sequence',
    detailValue: 'INV-2026-000412',
    tag: 'Atomic · skip-locked · PDF',
    className: 'capability-card--billing'
  },
  {
    id: 'tax-guardrails',
    number: '03',
    icon: CircleDollarSign,
    title: 'The right amount. Every time.',
    description: 'Apply fixed or percentage discounts with expiry and usage limits. Calculate multi-tax totals with precise decimal rounding.',
    detail: 'Subtotal + 18% GST',
    detailValue: '₹1,840.80',
    tag: 'Half-up decimal precision',
    className: 'capability-card--tax'
  },
  {
    id: 'customer-portal',
    number: '04',
    icon: LockKeyhole,
    title: 'Self-service that feels like service.',
    description: 'Give every customer a secure portal to manage their own plans, find payment history, and get invoices without chasing support.',
    detail: 'Your subscription',
    detailValue: 'Active',
    tag: 'Pause · renew · close',
    className: 'capability-card--portal'
  }
];

const plans = [
  {
    name: 'Starter',
    description: 'The essentials for getting recurring revenue in rhythm.',
    monthly: 2499,
    annual: 1999,
    features: [
      'Up to 250 active subscriptions',
      'Daily, weekly, and monthly billing',
      'Customer self-service portal',
      'Automated email reminders'
    ]
  },
  {
    name: 'Growth',
    description: 'More control and less manual work as you scale.',
    monthly: 6999,
    annual: 5599,
    popular: true,
    features: [
      'Up to 2,500 active subscriptions',
      'Unlimited variants and quote templates',
      'Discount guardrails and tax engine',
      'Automated PDF invoices and sequencing',
      'Full audit trail'
    ]
  },
  {
    name: 'Enterprise',
    description: 'A billing foundation designed around your operation.',
    custom: true,
    features: [
      '10,000+ subscriptions and 100,000+ invoices',
      'Sub-2-second P95 performance SLA',
      'Multi-seat staff permissions',
      'Custom quotation validity workflows',
      'Dedicated onboarding and migration'
    ]
  }
];

function Logo({ light = false }) {
  return (
    <a className={`landing-logo${light ? ' landing-logo--light' : ''}`} href="#top" aria-label="Brightloop Software home">
      <span className="landing-logo__icon"><Layers3 size={19} strokeWidth={2.2} aria-hidden="true" /></span>
      <span>brightloop<span className="landing-logo__software">software</span></span>
    </a>
  );
}

function ThreeScene({ scrollProgressRef }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer;
    let scene;
    let root;
    let visibilityObserver;
    let resizeObserver;
    let frameId;
    let disposed = false;
    let isInView = false;
    let updateMotionPreference;
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery?.matches ?? false;

    const stopAnimation = () => {
      if (!frameId) return;
      window.cancelAnimationFrame(frameId);
      frameId = undefined;
    };

    import('three').then(({
      ACESFilmicToneMapping,
      AmbientLight,
      Group,
      IcosahedronGeometry,
      Mesh,
      MeshStandardMaterial,
      PerspectiveCamera,
      PointLight,
      Scene,
      SphereGeometry,
      SRGBColorSpace,
      TorusGeometry,
      WebGLRenderer
    }) => {
      if (disposed) return;

      try {
        renderer = new WebGLRenderer({ alpha: true, antialias: true });
      } catch {
        mount.dataset.webgl = 'unavailable';
        return;
      }

      scene = new Scene();
      const camera = new PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, 7.4);
      root = new Group();
      scene.add(root);

      const plum = new MeshStandardMaterial({
        color: '#714B67',
        metalness: 0.3,
        roughness: 0.32,
        emissive: '#251824',
        emissiveIntensity: 0.22
      });
      const rose = new MeshStandardMaterial({
        color: '#C77AA8',
        metalness: 0.38,
        roughness: 0.28,
        emissive: '#53213F',
        emissiveIntensity: 0.24
      });
      const pearl = new MeshStandardMaterial({
        color: '#F6EAF2',
        metalness: 0.22,
        roughness: 0.23
      });

      root.add(new Mesh(new IcosahedronGeometry(0.7, 2), plum));
      const ringA = new Mesh(new TorusGeometry(1.48, 0.026, 12, 144), rose);
      ringA.rotation.set(0.72, 0.1, -0.3);
      root.add(ringA);
      const ringB = new Mesh(new TorusGeometry(1.9, 0.012, 8, 144), pearl);
      ringB.rotation.set(1.18, 0.48, 0.58);
      root.add(ringB);
      const ringC = new Mesh(new TorusGeometry(1.14, 0.012, 8, 144), plum);
      ringC.rotation.set(0.12, 0.88, 0.16);
      root.add(ringC);

      const beadGeometry = new SphereGeometry(0.09, 24, 24);
      [
        { position: [1.27, 0.63, 0.16], material: pearl, size: 1.15 },
        { position: [-1.4, -0.22, 0.12], material: rose, size: 1 },
        { position: [0.18, 1.55, -0.12], material: pearl, size: 0.78 },
        { position: [-0.5, -1.32, 0.2], material: rose, size: 0.72 }
      ].forEach(({ position, material, size }) => {
        const bead = new Mesh(beadGeometry, material);
        bead.position.set(...position);
        bead.scale.setScalar(size);
        root.add(bead);
      });

      scene.add(new AmbientLight('#FFFFFF', 1.5));
      const keyLight = new PointLight('#EAB6D7', 22, 12);
      keyLight.position.set(3.2, 2.5, 4);
      scene.add(keyLight);
      const fillLight = new PointLight('#A64D87', 15, 10);
      fillLight.position.set(-3, -2, 2);
      scene.add(fillLight);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      mount.appendChild(renderer.domElement);

      const resize = () => {
        const { width, height } = mount.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position.z = width < 440 ? 8.3 : 7.4;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      };
      const renderFrame = () => {
        const progress = scrollProgressRef.current.value;
        root.rotation.y += 0.0022 * (1 + progress * 2.5);
        root.rotation.x = Math.sin(performance.now() * 0.00028) * 0.06;
        const targetScale = 1 + progress * 0.06;
        root.scale.setScalar(root.scale.x + (targetScale - root.scale.x) * 0.08);
        ringA.rotation.z += 0.0015;
        renderer.render(scene, camera);
        frameId = isInView && !reducedMotion ? window.requestAnimationFrame(renderFrame) : undefined;
      };
      const startAnimation = () => {
        if (isInView && !reducedMotion && !frameId) {
          frameId = window.requestAnimationFrame(renderFrame);
        }
      };
      updateMotionPreference = () => {
        reducedMotion = motionQuery?.matches ?? false;
        if (reducedMotion) stopAnimation();
        else startAnimation();
      };
      motionQuery?.addEventListener('change', updateMotionPreference);
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      visibilityObserver = typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(([entry]) => {
          isInView = entry.isIntersecting;
          if (isInView) startAnimation();
          else stopAnimation();
        }, { rootMargin: '120px' })
        : undefined;
      visibilityObserver?.observe(mount);
      isInView = !visibilityObserver;
      resize();
      startAnimation();
    }).catch(() => {
      if (!disposed) mount.dataset.webgl = 'unavailable';
    });

    return () => {
      disposed = true;
      visibilityObserver?.disconnect();
      resizeObserver?.disconnect();
      if (updateMotionPreference) motionQuery?.removeEventListener('change', updateMotionPreference);
      stopAnimation();
      root?.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => material.dispose());
        }
      });
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [scrollProgressRef]);

  return <div className="hero-orbit" ref={mountRef} aria-hidden="true" />;
}

function SubscriptionPreview() {
  const [activeStage, setActiveStage] = useState(3);

  return (
    <div className="hero-product" aria-label="Interactive subscription management preview">
      <div className="hero-product__top">
        <div className="hero-product__brand"><span className="hero-product__brand-mark"><Layers3 size={14} /></span> Brightloop <span className="hero-product__crumb">/ Subscriptions</span></div>
        <span className="hero-window-dots" aria-hidden="true"><i /><i /><i /></span>
      </div>
      <div className="hero-product__body">
        <div className="hero-product__heading">
          <div><span className="eyebrow-label">SUBSCRIPTION · SUB-000412</span><h3>Enterprise Cloud Suite</h3></div>
          <span className={`status-chip${activeStage === 3 ? ' status-chip--green' : ''}`}><i /> {lifecycle[activeStage]}</span>
        </div>
        <div className="lifecycle" aria-label="Subscription lifecycle">
          {lifecycle.map((stage, index) => (
            <React.Fragment key={stage}>
              <button
                type="button"
                className={`lifecycle__step${index <= activeStage ? ' is-complete' : ''}${index === activeStage ? ' is-current' : ''}`}
                onClick={() => setActiveStage(index)}
                aria-label={`Set subscription status to ${stage}`}
                aria-pressed={index === activeStage}
              >
                <span>{index < activeStage ? <Check size={11} /> : index + 1}</span>
                <small>{stage}</small>
              </button>
              {index < lifecycle.length - 1 && <span className={`lifecycle__line${index < activeStage ? ' is-complete' : ''}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="hero-product__item">
          <div className="hero-product__item-icon"><Layers3 size={16} /></div>
          <div className="hero-product__item-copy"><strong>Enterprise Cloud Suite</strong><span>Base plan · Monthly</span></div>
          <strong className="money">₹1,000.00</strong>
        </div>
        <div className="hero-product__item hero-product__item--addon">
          <div className="hero-product__item-icon"><Sparkles size={16} /></div>
          <div className="hero-product__item-copy"><strong>Brand: Odoo</strong><span>Variant add-on</span></div>
          <strong className="money">₹560.00</strong>
        </div>
        <div className="hero-product__meta">
          <span><CalendarDays size={13} /> Next billing <strong>Nov 01, 2026</strong></span>
          <span><RefreshCw size={13} /> Auto-close <strong>Disabled</strong></span>
          <span><Pause size={13} /> Pausable <strong>Yes</strong></span>
        </div>
        <div className="hero-product__bottom">
          <span>Monthly total <strong>₹1,560.00</strong></span>
          <span className="secure-note"><ShieldCheck size={13} /> Audit logged</span>
        </div>
      </div>
    </div>
  );
}

function InvoiceFloat() {
  const [paid, setPaid] = useState(false);
  return (
    <div className="float-card invoice-float">
      <div className="float-card__top"><span className="float-card__icon"><FileCheck2 size={16} /></span><span className={`status-chip ${paid ? 'status-chip--green' : 'status-chip--lavender'}`}><i />{paid ? 'Paid' : 'Confirmed'}</span></div>
      <span className="eyebrow-label">AUTO-GENERATED INVOICE</span>
      <strong className="invoice-number">INV-2026-000412</strong>
      <div className="invoice-math"><span>Base amount</span><strong>₹1,560.00</strong><span>18% GST</span><strong>₹280.80</strong></div>
      <div className="invoice-total"><span>Total</span><strong>₹1,840.80</strong></div>
      <button className="invoice-pay-button" type="button" onClick={() => setPaid(value => !value)}>
        {paid ? <CheckCircle2 size={13} /> : <CreditCard size={13} />}
        {paid ? 'Payment recorded' : 'Record payment'}
      </button>
    </div>
  );
}

function FinanceFloat() {
  return (
    <div className="float-card finance-float">
      <div className="finance-float__header"><span className="finance-float__pulse" /> FINANCE PULSE</div>
      <span className="finance-float__label">BILLING OPERATIONS</span>
      <strong className="finance-float__mrr">In sync</strong>
      <div className="finance-float__stats">
        <div><span>Invoice creation</span><strong>Idempotent</strong></div>
        <div><span>Activity history</span><strong>Auditable</strong></div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="landing-hero" id="top">
      <div className="landing-container landing-hero__grid">
        <div className="landing-hero__copy">
          <div className="hero-kicker"><span><Zap size={14} fill="currentColor" /></span> Subscription operations, in sync</div>
          <h1><span><span>Recurring revenue,</span></span><span><span>without the <span>busywork.</span></span></span></h1>
          <p className="landing-hero__lead">Run plans, automated billing, and renewals without spreadsheets. One calm, connected platform for your entire subscription lifecycle.</p>
          <div className="hero-actions">
            <a className="button button--primary" href="#capabilities">Explore the platform <ArrowRight size={16} /></a>
            <a className="button button--quiet" href="#billing-engine"><span className="button__play"><Play size={11} fill="currentColor" /></span> Explore billing automation</a>
          </div>
          <div className="hero-proof">
            <CheckCircle2 size={15} aria-hidden="true" />
            <span>Designed for finance and operations teams</span>
          </div>
          <div className="hero-trust"><span><CheckCircle2 size={14} /> Built on Django 5</span><i /> <span>India-first billing</span><i /> <span>Auditable activity</span></div>
        </div>
        <div className="landing-hero__visual">
          <div className="hero-orbit-glow" />
          <ThreeScene scrollProgressRef={heroScrollProgress} />
          <div className="hero-visual-label"><span className="hero-visual-label__dot" /> ILLUSTRATIVE PRODUCT PREVIEW</div>
          <SubscriptionPreview />
          <InvoiceFloat />
          <FinanceFloat />
          <div className="hero-floating-tag"><span><Check size={12} /></span> Billing status at a glance</div>
        </div>
      </div>
      <a className="hero-scroll" href="#shift" aria-label="Scroll to learn more"><span>SCROLL TO EXPLORE</span><ArrowDown size={14} /></a>
    </section>
  );
}

function SectionHeading({ eyebrow, title, description, centered = false }) {
  return (
    <div className={`section-heading${centered ? ' section-heading--center' : ''}`}>
      <span className="section-eyebrow"><i /> {eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function ProblemSolution() {
  const problems = [
    'Renewals depend on someone remembering to check a spreadsheet.',
    'Invoices are typed by hand, month after month.',
    'Payments disappear into bank statements and inboxes.',
    'Month-end reporting means days of manual cleanup.'
  ];
  const solutions = [
    'Daily billing runs find every due subscription automatically.',
    'Idempotent invoice creation prevents duplicate billing.',
    'Payment tracking updates invoice status in real time.',
    'A live finance view puts the numbers at your fingertips.'
  ];
  return (
    <section className="section section--shift" id="shift">
      <div className="landing-container">
        <SectionHeading eyebrow="A better operating rhythm" title={<>From “did anyone remember?”<br /><span>to confidently on schedule.</span></>} description="Your recurring revenue deserves more than spreadsheets and crossed fingers." centered />
        <div className="shift-grid">
          <article className="shift-card shift-card--old">
            <div className="shift-card__heading"><span className="shift-card__icon"><Clock3 size={17} /></span><div><span className="eyebrow-label">THE OLD WAY</span><h3>Manual by default</h3></div></div>
            <ul>{problems.map(item => <li key={item}><span className="cross-mark"><X size={12} /></span>{item}</li>)}</ul>
            <div className="shift-card__foot"><span className="shift-stress" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span><span>Too many moving parts</span></div>
          </article>
          <article className="shift-card shift-card--new">
            <div className="shift-card__heading"><span className="shift-card__icon"><Sparkles size={17} /></span><div><span className="eyebrow-label">THE BRIGHTLOOP WAY</span><h3>Autonomous by design</h3></div></div>
            <ul>{solutions.map(item => <li key={item}><span className="check-mark"><Check size={12} /></span>{item}</li>)}</ul>
            <div className="shift-card__foot"><div className="shift-uptime"><span /> BILLING ENGINE READY</div><span>Peace of mind, built in</span></div>
          </article>
        </div>
      </div>
    </section>
  );
}

function Capabilities() {
  return (
    <section className="section section--capabilities" id="capabilities">
      <div className="landing-container">
        <div className="capabilities-intro">
          <SectionHeading eyebrow="One connected platform" title={<>The details that make<br />recurring revenue <span>work.</span></>} description="A single source of truth from product setup to payment collected." />
          <a className="text-link" href="#pricing">Explore plans <ArrowRight size={15} /></a>
        </div>
        <div className="capability-grid">
          {capabilities.map(({ id, number, icon: Icon, title, description, detail, detailValue, tag, className }) => (
            <article className={`capability-card ${className}`} id={id} key={id}>
              <div className="capability-card__top"><span className="capability-card__icon"><Icon size={17} /></span><span className="capability-card__number">{number} / 04</span></div>
              <h3>{title}</h3>
              <p>{description}</p>
              <div className="capability-visual">
                <span className="capability-visual__detail">{detail}</span>
                <strong>{detailValue}</strong>
                <span className="capability-visual__tag"><CheckCircle2 size={12} /> {tag}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoleAccess() {
  const [activeRole, setActiveRole] = useState('Admin');
  const details = roleDetails[activeRole];
  const RoleIcon = details.icon;

  return (
    <section className="section section--roles" id="architecture">
      <div className="landing-container roles-layout">
        <div className="roles-copy">
          <SectionHeading eyebrow="Access that makes sense" title={<>The right view<br />for every <span>role.</span></>} description="Clear responsibilities. Secure boundaries. A workspace shaped around the work each person actually does." />
          <div className="role-tabs" role="tablist" aria-label="Workspace role">
            {Object.keys(roleDetails).map(role => (
              <button key={role} type="button" role="tab" id={`role-tab-${role.toLowerCase()}`} aria-selected={activeRole === role} aria-controls="role-panel" onClick={() => setActiveRole(role)}>
                {role}
              </button>
            ))}
          </div>
          <article className="role-panel" id="role-panel" role="tabpanel" aria-labelledby={`role-tab-${activeRole.toLowerCase()}`}>
            <span className="role-panel__icon"><RoleIcon size={19} /></span>
            <h3>{details.title}</h3>
            <p>{details.body}</p>
            <ul>{details.points.map(point => <li key={point}><CheckCircle2 size={14} /> {point}</li>)}</ul>
          </article>
        </div>
        <div className="role-visual">
          <div className="role-visual__glow" />
          <div className="workspace-window">
            <div className="workspace-window__bar"><Logo /><span><i /> ILLUSTRATIVE WORKSPACE</span></div>
            <div className="workspace-window__body">
              <div className="workspace-greeting"><span className="eyebrow-label">{activeRole.toUpperCase()} WORKSPACE</span><strong>Subscription overview <Sparkles size={14} /></strong></div>
              <div className="workspace-kpis">
                <div><span>Active plans</span><strong>Tracked</strong><small>Subscription status</small></div>
                <div><span>Monthly revenue</span><strong>Organized</strong><small>Recurring billing</small></div>
              </div>
              <div className="workspace-chart">
                <div className="workspace-chart__top"><span>Recurring revenue</span><span>Illustrative trend</span></div>
                <div className="chart-bars" aria-hidden="true">{[36, 48, 42, 64, 59, 82, 72, 96, 78, 100, 88, 114, 94, 126, 112, 145, 128, 158, 141, 172, 151, 185].map(height => <i key={height} style={{ height: `${height}px` }} />)}</div>
                <div className="chart-months"><span>PERIOD START</span><span>PERIOD END</span></div>
              </div>
              <div className="workspace-activity"><span><span className="activity-icon"><FileText size={13} /></span> Invoice <strong>Status tracking</strong><i className="activity-paid">PAID</i></span><span>Invoice history</span></div>
              <div className="workspace-activity"><span><span className="activity-icon activity-icon--rose"><RefreshCw size={13} /></span> Renewal <strong>Subscription cycle</strong><i className="activity-renewed">TRACKED</i></span><span>Billing history</span></div>
            </div>
          </div>
          <div className="role-visual__note"><span><LockKeyhole size={13} /></span> Scoped access, down to every record</div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const [annual, setAnnual] = useState(false);
  const formatter = new Intl.NumberFormat('en-IN');
  return (
    <section className="section section--pricing" id="pricing">
      <div className="landing-container">
        <SectionHeading eyebrow="Simple, considered pricing" title={<>Room to grow.<br /><span>No billing surprises.</span></>} description="Start with the capabilities you need. Move up when your operation is ready." centered />
        <div className="pricing-switch-wrap">
          <div className="pricing-switch" role="group" aria-label="Billing frequency">
            <button type="button" aria-pressed={!annual} className={!annual ? 'is-selected' : ''} onClick={() => setAnnual(false)}>Monthly</button>
            <button type="button" aria-pressed={annual} className={annual ? 'is-selected' : ''} onClick={() => setAnnual(true)}>Annual</button>
          </div>
          <span className="save-badge"><Sparkles size={12} /> SAVE 20%</span>
        </div>
        <div className="pricing-grid">
          {plans.map(plan => (
            <article key={plan.name} className={`pricing-card${plan.popular ? ' pricing-card--popular' : ''}`}>
              {plan.popular && <div className="pricing-card__ribbon"><Sparkles size={12} /> MOST POPULAR</div>}
              <div className="pricing-card__head"><span className={`pricing-icon pricing-icon--${plan.name.toLowerCase()}`}>{plan.name === 'Starter' ? <Zap size={17} /> : plan.name === 'Growth' ? <BarChart3 size={17} /> : <Gem size={17} />}</span><h3>{plan.name}</h3></div>
              <p className="pricing-card__description">{plan.description}</p>
              <div className="pricing-amount">
                {plan.custom ? <strong>Let’s talk</strong> : <><strong aria-live="polite" data-monthly={plan.monthly} data-annual={plan.annual}>₹{formatter.format(annual ? plan.annual : plan.monthly)}</strong><span>/ month{annual ? ', billed annually' : ''}</span></>}
              </div>
              <Link className={`button ${plan.popular ? 'button--primary' : 'button--outline'}`} to={plan.custom ? '/login' : '/register'}>
                {plan.custom ? 'Contact sales' : 'Start 14-day trial'} <ArrowRight size={15} />
              </Link>
              <div className="pricing-divider" />
              <span className="pricing-includes">{plan.custom ? 'EVERYTHING IN GROWTH, PLUS' : 'INCLUDED IN YOUR PLAN'}</span>
              <ul>{plan.features.map(feature => <li key={feature}><CheckCircle2 size={15} />{feature}</li>)}</ul>
            </article>
          ))}
        </div>
        <p className="pricing-footnote"><ShieldCheck size={14} /> Need a plan tailored to your operation? Talk to our team.</p>
      </div>
    </section>
  );
}

function FinanceDashboard() {
  return (
    <section className="section section--finance" id="finance">
      <div className="landing-container finance-layout">
        <div className="finance-copy">
          <SectionHeading eyebrow="The finance command center" title={<>Know where your<br />revenue <span>stands.</span></>} description="A real-time view of what’s active, what’s collected, and what needs attention. No month-end scramble." />
          <ul className="finance-points">
            <li><span><BarChart3 size={15} /></span><div><strong>Five essential KPIs, at a glance.</strong><small>Active plans, MRR, collections, outstanding, overdue.</small></div></li>
            <li><span><Gauge size={15} /></span><div><strong>Find overdue accounts early.</strong><small>Know who needs a nudge and how long they’ve been waiting.</small></div></li>
            <li><span><FileText size={15} /></span><div><strong>Keep billing activity in view.</strong><small>Review collections, balances, and overdue follow-ups.</small></div></li>
          </ul>
          <Link className="text-link" to="/register">See your finance dashboard <ArrowRight size={15} /></Link>
        </div>
        <div className="finance-dashboard">
          <div className="finance-dashboard__header"><div><span className="eyebrow-label">ILLUSTRATIVE FINANCE PREVIEW</span><strong>Revenue at a glance</strong></div></div>
          <div className="dashboard-kpi-grid">
            <div className="dashboard-kpi"><span>Active subscriptions</span><strong>By status</strong><small>Subscription overview</small></div>
            <div className="dashboard-kpi"><span>Monthly recurring revenue</span><strong>Recurring</strong><small>Revenue tracking</small></div>
            <div className="dashboard-kpi"><span>Period collections</span><strong>Payments</strong><small>Collection tracking</small></div>
            <div className="dashboard-kpi"><span>Outstanding balance</span><strong>Follow-up</strong><small>Balance tracking</small></div>
          </div>
          <div className="dashboard-revenue">
            <div className="dashboard-revenue__head"><span>Collections over time</span><span>Illustrative trend</span></div>
            <div className="revenue-chart">
              <div className="revenue-chart__plot">
                <div className="revenue-chart__grid"><i /><i /><i /><i /></div>
                <svg viewBox="0 0 540 150" preserveAspectRatio="none" aria-hidden="true">
                  <defs><linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#A64D87" stopOpacity=".24" /><stop offset="100%" stopColor="#A64D87" stopOpacity="0" /></linearGradient></defs>
                  <path d="M0,120 C35,112 45,98 85,103 S140,77 175,87 S230,66 260,73 S315,45 350,62 S410,24 438,43 S490,16 540,22 L540,150 L0,150 Z" fill="url(#revenueFill)" />
                  <path d="M0,120 C35,112 45,98 85,103 S140,77 175,87 S230,66 260,73 S315,45 350,62 S410,24 438,43 S490,16 540,22" fill="none" stroke="#8C4F79" strokeWidth="3" pathLength={1} vectorEffect="non-scaling-stroke" />
                  <circle cx="540" cy="22" r="5" fill="#714B67" stroke="#fff" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                </svg>
                <div className="revenue-chart__months"><span>EARLIER</span><span>LATER</span></div>
              </div>
            </div>
          </div>
          <div className="overdue-table">
            <div className="overdue-table__head"><strong>Overdue invoice follow-up</strong></div>
            <p className="overdue-empty-state">Overdue invoices surface here for timely follow-up.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="footer-cta">
          <div className="footer-cta__orb footer-cta__orb--one" /><div className="footer-cta__orb footer-cta__orb--two" />
          <div className="footer-cta__copy"><span className="footer-cta__eyebrow"><Sparkles size={13} /> YOUR NEXT BILLING DAY, HANDLED</span><h2><span><span>Stop chasing renewals.</span></span><span><span>Put revenue on <em>autopilot.</em></span></span></h2><p>Make room for the work that moves your business forward.</p></div>
          <div className="footer-cta__actions"><Link className="button button--white" to="/register">Start your free trial <ArrowRight size={15} /></Link><a className="footer-doc-link" href="#technical-stack">Technical documentation <ArrowUpRight size={14} /></a></div>
        </div>
        <div className="footer-main">
          <div className="footer-brand"><Logo /><p>A steadier rhythm for every recurring rupee.</p></div>
          <div className="footer-column"><strong>PRODUCT</strong><a href="#catalog">Product catalog</a><a href="#capabilities">Subscriptions</a><a href="#billing-engine">Billing engine</a><a href="#finance">Finance dashboard</a><a href="#tax-guardrails">Tax & discounts</a></div>
          <div className="footer-column" id="technical-stack"><strong>BUILT WITH</strong><span>Python 3.12 · Django 5</span><span>PostgreSQL · Redis</span><span>React 18 · Three.js</span><span>Celery task processing</span></div>
          <div className="footer-column"><strong>TRUST & SECURITY</strong><span>Argon2 password hashing</span><span>Role-scoped access</span><span>Auditable activity</span><span>Idempotent billing</span></div>
        </div>
        <div className="footer-bottom"><span>© 2026 Brightloop Software. Built for better business.</span><div><Link to="/login">Sign in</Link><Link to="/register">Create account</Link><a href="#top">Back to top ↑</a></div></div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pageRef = useRef(null);
  const navItems = [
    ['Capabilities', '#capabilities'],
    ['Billing engine', '#billing-engine'],
    ['Architecture', '#architecture'],
    ['Customer portal', '#customer-portal'],
    ['Finance', '#finance']
  ];

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page || typeof window.matchMedia !== 'function') return undefined;

    let disposed = false;
    let animationContext;

    gsapRuntime.then(([gsapModule, scrollTriggerModule]) => {
      if (disposed) return;

      const gsap = gsapModule.gsap || gsapModule.default;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;
      if (!scrollTriggerRegistered) {
        gsap.registerPlugin(ScrollTrigger);
        scrollTriggerRegistered = true;
      }

      const numberFormatter = new Intl.NumberFormat('en-IN');
      const getNumber = value => {
        const match = value.trim().match(/^(?:₹)?([\d,]+)(?:\.(\d+))?$/);
        return match ? Number(`${match[1].replaceAll(',', '')}${match[2] ? `.${match[2]}` : ''}`) : null;
      };
      const formatCurrency = value => `₹${numberFormatter.format(Math.round(value))}`;

      animationContext = gsap.context(() => {
        let mediaContext;
        const setupSharedScroll = () => {
          const header = page.querySelector('.landing-header');
          const progress = page.querySelector('.landing-header__progress');
          const nav = page.querySelector('.landing-nav');
          const indicator = nav.querySelector('.landing-nav__indicator');
          const navLinks = Array.from(nav.querySelectorAll('a'));
          const navTargets = navLinks.map(link => ({
            link,
            target: page.querySelector(link.getAttribute('href'))
          })).filter(item => item.target);
          let previousActive;
          let previousX = -1;
          let previousWidth = -1;

          gsap.set(progress, { scaleX: 0, transformOrigin: 'left center' });
          gsap.fromTo(progress, { scaleX: 0 }, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { trigger: page, start: 'top top', end: 'bottom bottom', scrub: true }
          });
          gsap.set(indicator, { x: 0, scaleX: 0, opacity: 0, transformOrigin: 'left center' });

          const updateScrollspy = () => {
            const marker = window.scrollY + header.offsetHeight + 20;
            const active = navTargets.reduce((current, item) => {
              const targetTop = item.target.getBoundingClientRect().top + window.scrollY;
              return targetTop <= marker && (!current || targetTop > current.top)
                ? { link: item.link, top: targetTop }
                : current;
            }, null);

            if (active?.link !== previousActive) {
              navLinks.forEach(link => {
                if (active?.link === link) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
              });
              previousActive = active?.link;
            }
            const activeX = active?.link.offsetLeft ?? -1;
            const activeWidth = active?.link.offsetWidth ?? 0;
            if (active && nav.offsetWidth && activeWidth && (activeX !== previousX || activeWidth !== previousWidth)) {
              previousX = activeX;
              previousWidth = activeWidth;
              gsap.to(indicator, {
                x: activeX,
                scaleX: activeWidth,
                opacity: 1,
                duration: 0.24,
                ease: 'power2.out',
                overwrite: true
              });
            } else if (!active && previousWidth !== 0) {
              previousX = -1;
              previousWidth = 0;
              gsap.to(indicator, { scaleX: 0, opacity: 0, duration: 0.18, overwrite: true });
            }
          };

          ScrollTrigger.create({
            trigger: page,
            start: 40,
            end: 'bottom bottom',
            onUpdate: () => header.classList.toggle('is-scrolled', window.scrollY >= 40),
            onRefresh: () => header.classList.toggle('is-scrolled', window.scrollY >= 40)
          });
          ScrollTrigger.create({
            trigger: page,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: updateScrollspy,
            onRefresh: updateScrollspy
          });
          updateScrollspy();

          const handleInteraction = event => {
            const target = event.target;
            const pricingButton = target.closest?.('.pricing-switch button');
            if (pricingButton && pricingButton.getAttribute('aria-pressed') !== 'true') {
              const annual = pricingButton.textContent.trim() === 'Annual';
              const amountNodes = Array.from(page.querySelectorAll('.pricing-amount strong[data-monthly]'));
              const startingValues = amountNodes.map(node => getNumber(node.textContent));
              window.requestAnimationFrame(() => {
                if (disposed) return;
                amountNodes.forEach((node, index) => {
                  const destination = Number(node.dataset[annual ? 'annual' : 'monthly']);
                  const counter = { value: startingValues[index] ?? destination };
                  gsap.killTweensOf(node);
                  gsap.to(counter, {
                    value: destination,
                    duration: 0.5,
                    ease: 'power1.out',
                    onUpdate: () => { node.textContent = formatCurrency(counter.value); },
                    onComplete: () => { node.textContent = formatCurrency(destination); }
                  });
                });
              });
            }

            if (target.closest?.('.role-tabs [role="tab"]')) {
              window.requestAnimationFrame(() => {
                if (disposed) return;
                const panel = page.querySelector('.role-panel');
                gsap.fromTo(Array.from(panel.children), { opacity: 0, y: 8 }, {
                  opacity: 1,
                  y: 0,
                  duration: 0.25,
                  stagger: 0.025,
                  ease: 'power2.out',
                  overwrite: true
                });
              });
            }
          };
          page.addEventListener('click', handleInteraction);
          return () => page.removeEventListener('click', handleInteraction);
        };

        const reveal = (elements, trigger, { y = 24, stagger = 0.1, duration = 0.65 } = {}) => {
          if (!elements.length || !trigger) return;
          gsap.set(elements, { opacity: 0, y });
          gsap.to(elements, {
            opacity: 1,
            y: 0,
            duration,
            stagger,
            ease: 'power3.out',
            scrollTrigger: { trigger, start: 'top 86%', once: true }
          });
        };

        const setupSimpleReveals = () => {
          const cleanupSharedScroll = setupSharedScroll();
          page.querySelectorAll('.section-heading').forEach(heading => {
            reveal([heading], heading.closest('.section'), { y: 16, stagger: 0, duration: 0.48 });
          });
          reveal(Array.from(page.querySelectorAll('.shift-card')), page.querySelector('.shift-grid'), { y: 18, stagger: 0.08, duration: 0.5 });
          reveal(Array.from(page.querySelectorAll('.capability-card')), page.querySelector('.capability-grid'), { y: 18, stagger: 0.07, duration: 0.5 });
          reveal([page.querySelector('.roles-copy'), page.querySelector('.role-visual')], page.querySelector('.roles-layout'), { y: 18, stagger: 0.08, duration: 0.5 });
          reveal(Array.from(page.querySelectorAll('.pricing-card')), page.querySelector('.pricing-grid'), { y: 18, stagger: 0.08, duration: 0.5 });
          reveal([page.querySelector('.finance-copy'), page.querySelector('.finance-dashboard')], page.querySelector('.finance-layout'), { y: 18, stagger: 0.08, duration: 0.5 });
          reveal([page.querySelector('.footer-cta')], page.querySelector('.footer-cta'), { y: 16, stagger: 0, duration: 0.5 });
          reveal(Array.from(page.querySelectorAll('.footer-column')), page.querySelector('.footer-main'), { y: 14, stagger: 0.06, duration: 0.5 });

          const bars = Array.from(page.querySelectorAll('.chart-bars i'));
          if (bars.length) {
            gsap.set(bars, { scaleY: 0, transformOrigin: 'center bottom' });
            gsap.to(bars, {
              scaleY: 1,
              duration: 0.42,
              stagger: 0.018,
              ease: 'power2.out',
              scrollTrigger: { trigger: bars[0].closest('.workspace-chart'), start: 'top 86%', once: true }
            });
          }
          return cleanupSharedScroll;
        };

        const setupFullMotion = () => {
          const cleanupSharedScroll = setupSharedScroll();
          page.querySelectorAll('.section-heading').forEach(heading => {
            reveal([heading], heading.closest('.section'), { y: 24, stagger: 0 });
          });

          const hero = page.querySelector('.landing-hero');
          const heroLines = Array.from(page.querySelectorAll('.landing-hero__copy h1 > span > span'));
          const heroCopy = Array.from(page.querySelectorAll('.landing-hero__lead, .hero-actions, .hero-proof, .hero-trust'));
          gsap.set(heroLines, { y: 48, opacity: 0 });
          gsap.set(heroCopy, { y: 14, opacity: 0 });
          const heroIntro = gsap.timeline({ defaults: { ease: 'power3.out' } });
          heroIntro.to(heroLines, { y: 0, opacity: 1, duration: 0.72, stagger: 0.13 })
            .to(heroCopy, { y: 0, opacity: 1, duration: 0.48, stagger: 0.09 }, '-=0.25');

          const heroParallax = [
            [page.querySelector('.hero-orbit'), -40],
            [page.querySelector('.hero-product'), -70],
            [page.querySelector('.invoice-float'), -110],
            [page.querySelector('.finance-float'), -90]
          ].filter(([element]) => element);
          heroParallax.forEach(([element, y]) => {
            gsap.to(element, { y, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
          });
          gsap.to(page.querySelector('.hero-scroll'), {
            opacity: 0,
            y: 12,
            scrollTrigger: { trigger: hero, start: 'top top', end: '35% top', scrub: true }
          });
          gsap.set(heroScrollProgress.current, { value: 0 });
          gsap.to(heroScrollProgress.current, {
            value: 1,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
          });

          const shiftGrid = page.querySelector('.shift-grid');
          const oldCard = page.querySelector('.shift-card--old');
          const newCard = page.querySelector('.shift-card--new');
          if (shiftGrid && oldCard && newCard) {
            const oldItems = Array.from(oldCard.querySelectorAll('li'));
            const newItems = Array.from(newCard.querySelectorAll('li'));
            const oldMarks = Array.from(oldCard.querySelectorAll('.cross-mark'));
            const newMarks = Array.from(newCard.querySelectorAll('.check-mark'));
            const stressBars = Array.from(oldCard.querySelectorAll('.shift-stress i'));
            gsap.set(oldCard, { x: -26, opacity: 0 });
            gsap.set(newCard, { x: 26, opacity: 0 });
            gsap.set([...oldItems, ...newItems], { y: 12, opacity: 0 });
            gsap.set([...oldMarks, ...newMarks], { scale: 0.55, opacity: 0, transformOrigin: 'center' });
            gsap.set(stressBars, { scaleY: 1, transformOrigin: 'center bottom' });
            const shiftTimeline = gsap.timeline({ scrollTrigger: { trigger: shiftGrid, start: 'top 78%', once: true } });
            shiftTimeline.to(oldCard, { x: 0, opacity: 1, duration: 0.58, ease: 'power3.out' })
              .to(newCard, { x: 0, opacity: 1, duration: 0.58, ease: 'power3.out' }, '<0.12')
              .to(oldItems, { y: 0, opacity: 1, duration: 0.38, stagger: 0.08, ease: 'power2.out' }, '-=0.18')
              .to(oldMarks, { scale: 1, opacity: 1, duration: 0.24, stagger: 0.08, ease: 'back.out(2)' }, '<0.08')
              .to(stressBars, { scaleY: () => gsap.utils.random(0.45, 1.8), duration: 0.16, stagger: 0.018, repeat: 1, yoyo: true, ease: 'power1.inOut' }, '<')
              .to(newItems, { y: 0, opacity: 1, duration: 0.38, stagger: 0.08, ease: 'power2.out' }, '<0.12')
              .to(newMarks, { scale: 1, opacity: 1, duration: 0.28, stagger: 0.08, ease: 'back.out(2)' }, '<0.08')
              .to(stressBars, { scaleY: 1, duration: 0.24, stagger: 0.012, ease: 'power2.out' });
          }

          const capabilityCards = Array.from(page.querySelectorAll('.capability-card'));
          if (capabilityCards.length) {
            gsap.set(capabilityCards, { y: 28, rotation: 2, opacity: 0, transformOrigin: 'center bottom' });
            const capabilityTimeline = gsap.timeline({ scrollTrigger: { trigger: page.querySelector('.capability-grid'), start: 'top 82%', once: true } });
            capabilityTimeline.to(capabilityCards, { y: 0, rotation: 0, opacity: 1, duration: 0.62, stagger: 0.12, ease: 'power3.out' });
            capabilityTimeline.call(() => {
              capabilityCards.forEach(card => {
                const value = card.querySelector('.capability-visual strong');
                const target = value && getNumber(value.textContent);
                if (!value) return;
                if (target === null) {
                  gsap.fromTo(value, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
                  return;
                }
                const decimals = (value.textContent.match(/\.(\d+)/) || [])[1]?.length || 0;
                const prefix = value.textContent.trim().startsWith('₹') ? '₹' : '';
                const formatter = new Intl.NumberFormat('en-IN', {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals
                });
                const counter = { value: 0 };
                gsap.set(value, { opacity: 1 });
                gsap.to(counter, {
                  value: target,
                  duration: 0.75,
                  ease: 'power2.out',
                  onUpdate: () => {
                    value.textContent = `${prefix}${formatter.format(Number(counter.value.toFixed(decimals)))}`;
                  },
                  onComplete: () => {
                    value.textContent = `${prefix}${formatter.format(target)}`;
                  }
                });
              });
            });
          }

          const rolesLayout = page.querySelector('.roles-layout');
          const rolesCopy = page.querySelector('.roles-copy');
          const roleVisual = page.querySelector('.role-visual');
          reveal([rolesCopy, roleVisual].filter(Boolean), rolesLayout, { y: 24, stagger: 0.1 });
          const workspace = page.querySelector('.workspace-window');
          if (workspace) {
            gsap.fromTo(workspace, { transformPerspective: 1100, rotateY: -9, rotateX: 1 }, {
              rotateY: -3,
              rotateX: 1,
              ease: 'none',
              scrollTrigger: { trigger: rolesLayout, start: 'top bottom', end: 'bottom top', scrub: true }
            });
          }
          const bars = Array.from(page.querySelectorAll('.chart-bars i'));
          if (bars.length) {
            gsap.set(bars, { scaleY: 0, transformOrigin: 'center bottom' });
            gsap.to(bars, {
              scaleY: 1,
              duration: 0.5,
              stagger: 0.022,
              ease: 'power2.out',
              scrollTrigger: { trigger: bars[0].closest('.workspace-chart'), start: 'top 82%', once: true }
            });
          }

          const pricingCards = Array.from(page.querySelectorAll('.pricing-card'));
          if (pricingCards.length) {
            const popular = page.querySelector('.pricing-card--popular');
            gsap.set(pricingCards, { y: 28, opacity: 0 });
            if (popular) gsap.set(popular, { scale: 0.96, transformOrigin: 'center' });
            const pricingTimeline = gsap.timeline({ scrollTrigger: { trigger: page.querySelector('.pricing-grid'), start: 'top 82%', once: true } });
            pricingTimeline.to(pricingCards, { y: 0, opacity: 1, duration: 0.58, stagger: 0.12, ease: 'power3.out' });
            if (popular) {
              pricingTimeline.to(popular, { scale: 1.025, duration: 0.16, ease: 'power1.out' })
                .to(popular, { scale: 1, duration: 0.22, ease: 'power2.out' });
            }
          }

          const financeLayout = page.querySelector('.finance-layout');
          reveal([page.querySelector('.finance-copy'), page.querySelector('.finance-dashboard')].filter(Boolean), financeLayout, { y: 24, stagger: 0.12 });
          const kpis = Array.from(page.querySelectorAll('.dashboard-kpi'));
          if (kpis.length) reveal(kpis, page.querySelector('.dashboard-kpi-grid'), { y: 12, stagger: 0.06, duration: 0.45 });
          const revenueSvg = page.querySelector('.revenue-chart__plot svg');
          if (revenueSvg) {
            const area = revenueSvg.querySelector('path:first-of-type');
            const line = revenueSvg.querySelector('path:nth-of-type(2)');
            const endCircle = revenueSvg.querySelector('circle');
            gsap.set(area, { opacity: 0 });
            gsap.set(line, { strokeDasharray: 1, strokeDashoffset: 1 });
            gsap.set(endCircle, { scale: 0, opacity: 0, transformOrigin: 'center' });
            const chartTimeline = gsap.timeline({ scrollTrigger: { trigger: revenueSvg, start: 'top 84%', once: true } });
            chartTimeline.to(line, { strokeDashoffset: 0, duration: 1.05, ease: 'power2.out' })
              .to(area, { opacity: 1, duration: 0.45, ease: 'power1.out' }, '-=0.28')
              .to(endCircle, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, '-=0.12');
          }
          const overdueRows = Array.from(page.querySelectorAll('.overdue-row:not(.overdue-row--labels)'));
          if (overdueRows.length) reveal(overdueRows, page.querySelector('.overdue-table'), { y: 0, stagger: 0.1, duration: 0.42 });

          const footerCta = page.querySelector('.footer-cta');
          const footerHeadline = Array.from(page.querySelectorAll('.footer-cta__copy h2 > span > span'));
          gsap.set(footerHeadline, { y: 34, opacity: 0 });
          gsap.to(footerHeadline, {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.13,
            ease: 'power3.out',
            scrollTrigger: { trigger: footerCta, start: 'top 82%', once: true }
          });
          page.querySelectorAll('.footer-cta__orb').forEach((orb, index) => {
            gsap.to(orb, {
              y: index === 0 ? -70 : 55,
              ease: 'none',
              scrollTrigger: { trigger: footerCta, start: 'top bottom', end: 'bottom top', scrub: true }
            });
          });
          reveal(Array.from(page.querySelectorAll('.footer-column')), page.querySelector('.footer-main'), { y: 18, stagger: 0.08 });
          return cleanupSharedScroll;
        };

        mediaContext = gsap.matchMedia();
        mediaContext.add('(prefers-reduced-motion: reduce)', () => {
          heroScrollProgress.current.value = 0;
        });
        mediaContext.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', setupSimpleReveals);
        mediaContext.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', setupFullMotion);
        return () => mediaContext.revert();
      }, page);

      Promise.resolve(document.fonts?.ready)
        .then(() => {
          if (!disposed) ScrollTrigger.refresh();
        })
        .catch(error => {
          if (!disposed) console.error('Unable to refresh landing page animations after fonts loaded.', error);
        });
    }).catch(error => {
      if (!disposed) console.error('Unable to initialize landing page scroll animations.', error);
    });

    return () => {
      disposed = true;
      animationContext?.revert();
    };
  }, []);

  return (
    <main className="landing-page" ref={pageRef}>
      <header className="landing-header">
        <div className="landing-container landing-header__inner">
          <Logo />
          <button type="button" className="mobile-menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <nav className={`landing-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
            {navItems.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
            <span className="landing-nav__indicator" aria-hidden="true" />
          </nav>
          <div className="landing-header__actions"><Link className="landing-signin" to="/login">Sign in</Link><Link className="button button--primary button--nav" to="/register">Start free trial <ArrowRight size={14} /></Link></div>
        </div>
        <div className="landing-header__progress" aria-hidden="true" />
      </header>
      <Hero />
      <div className="trusted-strip"><div className="landing-container trusted-strip__inner"><span>MADE FOR THE DETAILS THAT MATTER</span><div><span><ShieldCheck size={15} /> Scoped access</span><i /><span><BadgeCheck size={15} /> Audit-ready</span><i /><span><Clock3 size={15} /> Sub-2s reporting</span><i /><span><Code2 size={15} /> API-connected</span></div></div></div>
      <ProblemSolution />
      <Capabilities />
      <RoleAccess />
      <Pricing />
      <FinanceDashboard />
      <Footer />
    </main>
  );
}
