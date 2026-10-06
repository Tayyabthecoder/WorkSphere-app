import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Users,
  Briefcase,
  Code2,
  Megaphone,
  Check,
  CheckCircle2,
  AlertCircle,
  Kanban,
  CalendarDays,
  GitBranch,
  Rocket,
  FolderPlus,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import {
  SUPPORTED_CURRENCIES,
  COUNTRIES,
  getCurrencyForCountry,
  CURRENCY_SYMBOLS,
} from '../utils/currency';
import { useAuthStore } from '../store/auth';
import apiClient from '../api/client';

type WizardStep = 1 | 2 | 3;

const USE_CASES = [
  {
    id: 'engineering',
    label: 'Engineering & Tech',
    description: 'Sprint planning, issue tracking, and roadmap backlogs',
    icon: Code2,
  },
  {
    id: 'agency',
    label: 'Agency & Client Services',
    description: 'Client deliverables, portal access, and billable time',
    icon: Briefcase,
  },
  {
    id: 'marketing',
    label: 'Marketing & Growth',
    description: 'Campaign schedules, creative production, and milestones',
    icon: Megaphone,
  },
  {
    id: 'operations',
    label: 'Operations & Project Management',
    description: 'Cross-functional delivery, governance, and capacity',
    icon: Users,
  },
];

const TEAM_SIZES = [
  { id: '1-5', label: '1 - 5', desc: 'Startup / Small Team' },
  { id: '6-20', label: '6 - 20', desc: 'Growing Business' },
  { id: '21-50', label: '21 - 50', desc: 'Mid-size Dept' },
  { id: '50+', label: '50+', desc: 'Large Enterprise' },
];

const METHODOLOGIES = [
  {
    id: 'agile_scrum',
    label: 'Agile & Scrum',
    desc: 'Sprint cycles, point estimates & burn-down velocity',
    icon: GitBranch,
  },
  {
    id: 'kanban',
    label: 'Continuous Kanban',
    desc: 'WIP limits, status swimlanes & continuous flow',
    icon: Kanban,
  },
  {
    id: 'waterfall',
    label: 'Milestones & Gantt',
    desc: 'Phased deliverables, work breakdown & critical paths',
    icon: CalendarDays,
  },
];

export const WorkspaceOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setAuth } = useAuthStore();

  const [step, setStep] = useState<WizardStep>(1);

  // Step 1: Workspace Basics
  const [orgName, setOrgName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(false);
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [detectedCurrencyInfo, setDetectedCurrencyInfo] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Step 2: Team & Methodology
  const [teamSize, setTeamSize] = useState('6-20');
  const [primaryUseCase, setPrimaryUseCase] = useState('engineering');
  const [methodology, setMethodology] = useState('agile_scrum');

  // Step 3: Initial Project & Launch
  const [starterProjectName, setStarterProjectName] = useState('');

  // Submission state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect if not authenticated or already has an active workspace
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/register', { replace: true });
    } else if (user?.tenantId && !user.tenantId.startsWith('pending')) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user?.tenantId, navigate]);

  // Set default starter project name when orgName changes
  useEffect(() => {
    if (orgName && !starterProjectName) {
      setStarterProjectName(`${orgName} Core Initiative`);
    }
  }, [orgName, starterProjectName]);

  // Handle Organization Name change & auto slug generation
  const handleOrgNameChange = (val: string) => {
    setOrgName(val);
    if (!hasManuallyEditedSlug) {
      const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25);
      setSubdomain(generatedSlug);
    }
  };

  const handleSubdomainChange = (val: string) => {
    setHasManuallyEditedSlug(true);
    setSubdomain(val.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30));
  };

  // Real-time slug availability check with debouncing
  useEffect(() => {
    if (!subdomain || subdomain.length < 3) {
      setSlugStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSlugStatus('checking');
        const res = await apiClient.get(`/auth/check-slug/${subdomain}`);
        if (res.data?.data?.available) {
          setSlugStatus('available');
        } else {
          setSlugStatus('taken');
        }
      } catch {
        setSlugStatus('idle');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [subdomain]);

  const handleCountryChange = (val: string) => {
    setCountry(val);
    const detected = getCurrencyForCountry(val);
    if (detected) {
      setCurrency(detected.code);
      setCurrencySymbol(detected.symbol);
      setDetectedCurrencyInfo(`Detected ${detected.symbol} ${detected.code} for ${detected.name}`);
    } else {
      setDetectedCurrencyInfo(null);
    }
  };

  const handleCurrencyChange = (val: string) => {
    setCurrency(val);
    const symbol = CURRENCY_SYMBOLS[val] || '$';
    setCurrencySymbol(symbol);
    setDetectedCurrencyInfo(null);
  };

  // Step 1 Validation
  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (orgName.trim().length < 2) {
      setErrorMessage('Please enter an organization or company name (min 2 characters).');
      return;
    }

    const cleanSlug = subdomain.trim();
    if (cleanSlug.length < 3) {
      setErrorMessage('Workspace URL identifier must be at least 3 characters.');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      setErrorMessage('Workspace identifier can only contain lowercase letters, numbers, and hyphens.');
      return;
    }
    if (slugStatus === 'taken') {
      setErrorMessage(`The workspace URL "${cleanSlug}.worksphere.app" is already in use. Please select a different identifier.`);
      return;
    }

    setStep(2);
  };

  // Step 2 Validation
  const handleNextFromStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStep(3);
  };

  // Step 3 Final Submission
  const handleLaunchWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await apiClient.post('/auth/create-workspace', {
        orgName: orgName.trim(),
        subdomain: subdomain.trim(),
        country: country.trim(),
        currency,
        currencySymbol,
        teamSize,
        primaryUseCase,
        methodology,
        starterProjectName: starterProjectName.trim(),
      });

      if (!res.data?.success) {
        setErrorMessage(res.data?.error?.message || 'Failed to create workspace. Please check your settings.');
        setIsLoading(false);
        return;
      }

      const { user: updatedUser, accessToken } = res.data.data;

      // Update auth session with newly provisioned tenantId
      if (updatedUser && accessToken) {
        setAuth(updatedUser, accessToken);
      }

      setIsSuccess(true);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'An error occurred while creating your workspace. Please try again.';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-brand-emerald flex items-center justify-center text-white shadow-bento-card">
              <Sparkles className="w-5 h-5 text-brand-mint" />
            </div>
            <span className="text-xl font-bold text-text-primary tracking-tight">WorkSphere</span>
          </div>

          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            {isSuccess
              ? 'Workspace Ready!'
              : `Welcome, ${user?.name || 'Partner'}!`}
          </h2>
          <p className="text-xs text-text-secondary mt-1 max-w-md">
            {isSuccess
              ? 'Your workspace is provisioned. Directing you to your dashboard...'
              : 'Complete your workspace setup wizard to organize projects, invite teammates, and track delivery.'}
          </p>
        </div>

        {/* Wizard Container Card */}
        <Card className="shadow-lg border border-border-subtle p-6 sm:p-8">
          {/* Celebratory Completion Screen */}
          {isSuccess ? (
            <div className="py-8 flex flex-col items-center text-center gap-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-brand-mint/20 text-brand-emerald flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-brand-emerald" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">{orgName} is Live!</h3>
                <p className="text-xs text-text-secondary mt-1">
                  Workspace URL:{' '}
                  <span className="font-mono font-semibold text-brand-emerald">
                    https://{subdomain}.worksphere.app
                  </span>
                </p>
                {starterProjectName && (
                  <p className="text-[11px] text-text-muted mt-1">
                    Starter project <span className="font-semibold text-text-primary">"{starterProjectName}"</span> has been initialized.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-brand-emerald mt-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Launching your dashboard...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Wizard Step Progress Bar */}
              <div className="mb-7">
                <div className="flex items-center justify-between mb-3 text-xs">
                  {/* Step 1 Pill */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                        step === 1
                          ? 'bg-brand-emerald text-white shadow-xs'
                          : step > 1
                          ? 'bg-brand-mint/30 text-brand-emerald'
                          : 'bg-surface-low text-text-muted'
                      }`}
                    >
                      {step > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
                    </span>
                    <span className={`font-semibold ${step === 1 ? 'text-text-primary' : 'text-text-muted'}`}>
                      Workspace
                    </span>
                  </div>

                  {/* Divider 1 */}
                  <div className="flex-1 mx-3 h-0.5 bg-border/60 relative">
                    <div
                      className="absolute left-0 top-0 h-full bg-brand-emerald transition-all duration-300"
                      style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                    />
                  </div>

                  {/* Step 2 Pill */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                        step === 2
                          ? 'bg-brand-emerald text-white shadow-xs'
                          : step > 2
                          ? 'bg-brand-mint/30 text-brand-emerald'
                          : 'bg-surface-low text-text-muted'
                      }`}
                    >
                      {step > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
                    </span>
                    <span className={`font-semibold ${step === 2 ? 'text-text-primary' : 'text-text-muted'}`}>
                      Team & Focus
                    </span>
                  </div>

                  {/* Divider 2 */}
                  <div className="flex-1 mx-3 h-0.5 bg-border/60 relative">
                    <div
                      className="absolute left-0 top-0 h-full bg-brand-emerald transition-all duration-300"
                      style={{ width: step === 3 ? '100%' : '0%' }}
                    />
                  </div>

                  {/* Step 3 Pill */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                        step === 3
                          ? 'bg-brand-emerald text-white shadow-xs'
                          : 'bg-surface-low text-text-muted'
                      }`}
                    >
                      3
                    </span>
                    <span className={`font-semibold ${step === 3 ? 'text-text-primary' : 'text-text-muted'}`}>
                      Launch Project
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-text-muted">
                  {step === 1 && 'Step 1 of 3: Define your organization name, custom URL slug, and base currency.'}
                  {step === 2 && 'Step 2 of 3: Customize team capacity, department focus, and delivery methodology.'}
                  {step === 3 && 'Step 3 of 3: Initialize your first project and launch your new workspace.'}
                </div>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-status-error text-xs flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* STEP 1: Workspace Basics */}
              {step === 1 && (
                <form onSubmit={handleNextFromStep1} className="flex flex-col gap-4">
                  <Input
                    label="Workspace / Company Name"
                    placeholder="e.g. Acme Innovations, PixelCraft Agency"
                    value={orgName}
                    onChange={(e) => handleOrgNameChange(e.target.value)}
                    required
                    autoFocus
                    leftIcon={<Building2 className="w-4 h-4" />}
                  />

                  <div>
                    <Input
                      label="Workspace Subdomain Identifier"
                      placeholder="acme"
                      value={subdomain}
                      onChange={(e) => handleSubdomainChange(e.target.value)}
                      required
                      leftIcon={<Globe className="w-4 h-4" />}
                    />

                    {/* Subdomain URL Preview and Status */}
                    <div className="mt-2 p-2.5 rounded-lg bg-surface-low border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-text-muted shrink-0">Permanent URL:</span>
                        <span className="font-mono text-brand-emerald font-semibold truncate">
                          https://{subdomain || 'your-team'}.worksphere.app
                        </span>
                      </div>

                      {slugStatus === 'checking' && (
                        <span className="text-[11px] text-text-muted flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                        </span>
                      )}
                      {slugStatus === 'available' && (
                        <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Available
                        </span>
                      )}
                      {slugStatus === 'taken' && (
                        <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Already taken
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Country & Currency Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <Input
                        label="Country / Region"
                        placeholder="e.g. United States, Germany..."
                        value={country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        list="onboarding-countries-list"
                        leftIcon={<MapPin className="w-4 h-4" />}
                      />
                      <datalist id="onboarding-countries-list">
                        {COUNTRIES.map((c: any) => (
                          <option key={c.code} value={c.name} />
                        ))}
                      </datalist>
                      {detectedCurrencyInfo && (
                        <p className="mt-1 text-[11px] text-brand-emerald font-medium flex items-center gap-1 animate-fade-in">
                          <Sparkles className="w-3 h-3 shrink-0" />
                          {detectedCurrencyInfo}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                        Base Currency
                      </label>
                      <div className="relative">
                        <select
                          value={currency}
                          onChange={(e) => handleCurrencyChange(e.target.value)}
                          className="w-full h-9 px-3 pr-8 rounded-lg bg-surface-card border border-border text-xs text-text-primary focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15 transition-all font-mono"
                        >
                          {SUPPORTED_CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.symbol} {c.code} — {c.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-emerald font-mono font-bold text-xs">
                          {currencySymbol}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full mt-4"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    disabled={slugStatus === 'taken'}
                  >
                    Continue to Team & Focus
                  </Button>
                </form>
              )}

              {/* STEP 2: Team & Methodology */}
              {step === 2 && (
                <form onSubmit={handleNextFromStep2} className="flex flex-col gap-5">
                  {/* Team Size */}
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-2">
                      Team Size
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {TEAM_SIZES.map((t) => {
                        const isSelected = teamSize === t.id;
                        return (
                          <button
                            type="button"
                            key={t.id}
                            onClick={() => setTeamSize(t.id)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-brand-emerald text-white border-brand-emerald shadow-xs'
                                : 'bg-surface-low/50 hover:bg-surface-low border-border/80 text-text-primary'
                            }`}
                          >
                            <div className="text-sm font-bold">{t.label}</div>
                            <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>
                              {t.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Focus */}
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-2">
                      Primary Department Focus
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {USE_CASES.map((uc) => {
                        const Icon = uc.icon;
                        const isSelected = primaryUseCase === uc.id;
                        return (
                          <button
                            type="button"
                            key={uc.id}
                            onClick={() => setPrimaryUseCase(uc.id)}
                            className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                              isSelected
                                ? 'bg-brand-emerald text-white border-brand-emerald shadow-xs'
                                : 'bg-surface-low/50 hover:bg-surface-low border-border/80 text-text-primary'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-surface-card text-brand-emerald border border-border/60'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold leading-tight">{uc.label}</div>
                              <div className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>
                                {uc.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Methodology */}
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-2">
                      Delivery Methodology
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {METHODOLOGIES.map((m) => {
                        const Icon = m.icon;
                        const isSelected = methodology === m.id;
                        return (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() => setMethodology(m.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'bg-brand-emerald text-white border-brand-emerald shadow-xs'
                                : 'bg-surface-low/50 hover:bg-surface-low border-border/80 text-text-primary'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="text-xs font-bold">{m.label}</span>
                            </div>
                            <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>
                              {m.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => setStep(1)}
                      leftIcon={<ArrowLeft className="w-4 h-4" />}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="flex-1"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Continue to Starter Project
                    </Button>
                  </div>
                </form>
              )}

              {/* STEP 3: Starter Project & Final Review */}
              {step === 3 && (
                <form onSubmit={handleLaunchWorkspace} className="flex flex-col gap-5">
                  <div>
                    <Input
                      label="Initial Project Name (Optional)"
                      placeholder="e.g. Q4 Platform Launch, Brand Redesign"
                      value={starterProjectName}
                      onChange={(e) => setStarterProjectName(e.target.value)}
                      autoFocus
                      leftIcon={<FolderPlus className="w-4 h-4" />}
                    />
                    <p className="mt-1 text-[11px] text-text-muted">
                      We'll initialize this project with Kanban boards, sprint phases, and deliverables ready for your team.
                    </p>
                  </div>

                  {/* Summary Review Card */}
                  <div className="p-4 rounded-xl bg-surface-low border border-border/80 text-xs flex flex-col gap-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      Workspace Ready for Launch
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-text-muted block">Workspace Name:</span>
                        <span className="font-bold text-text-primary">{orgName}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block">Workspace URL:</span>
                        <span className="font-mono font-semibold text-brand-emerald">
                          {subdomain}.worksphere.app
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block">Administrator:</span>
                        <span className="font-semibold text-text-primary">
                          {user?.name} ({user?.email})
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block">Base Currency:</span>
                        <span className="font-mono font-semibold text-text-primary">
                          {currencySymbol} {currency}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted block">Team Size:</span>
                        <span className="font-semibold text-text-primary">{teamSize} members</span>
                      </div>
                      <div>
                        <span className="text-text-muted block">Delivery Model:</span>
                        <span className="font-semibold text-text-primary">
                          {METHODOLOGIES.find((m) => m.id === methodology)?.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => setStep(2)}
                      leftIcon={<ArrowLeft className="w-4 h-4" />}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="flex-1"
                      isLoading={isLoading}
                      leftIcon={<Rocket className="w-4 h-4 text-brand-mint" />}
                    >
                      Create Workspace & Launch Dashboard
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default WorkspaceOnboardingPage;
