import React, { useEffect, useState } from 'react';
import {
  Check, ChevronRight, Database, Loader2, Lock, RefreshCw, Server,
  ShieldCheck, Sparkles, AlertTriangle, CircleCheck, KeyRound,
} from 'lucide-react';
import { RecuraLogoIcon, RecuraWordmark } from '../../src/components/common/RecuraLogo';
import { api, DbConnectionInput, TestConnectionResult, VerifyResult } from './api';

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const STEP_LABELS = ['Welcome', 'Database', 'Install', 'Admin', 'Verify', 'Complete'];

const STATE_LABELS: Record<string, { title: string; body: string; tone: 'ok' | 'warn' | 'err' }> = {
  INSTALLED: {
    title: 'Recura is already installed',
    body: 'This server already has a configured database. The installer is locked to protect it.',
    tone: 'ok',
  },
  INSTALLING: {
    title: 'Installation was left in progress',
    body: 'A previous installation did not finish. You can safely restart it — partial changes are rolled back or resumed automatically.',
    tone: 'warn',
  },
  INSTALLATION_FAILED: {
    title: 'The previous installation failed',
    body: 'The installer can safely retry. Already-completed steps are skipped automatically.',
    tone: 'err',
  },
  RECOVERY_REQUIRED: {
    title: 'Recura needs recovery',
    body: 'The server detects an inconsistent installation state. Restart the Recura server process and reload this page.',
    tone: 'warn',
  },
};

interface AdminForm {
  name: string;
  username: string;
  email: string;
  password: string;
  confirm: string;
}

const EMPTY_ADMIN: AdminForm = { name: '', username: '', email: '', password: '', confirm: '' };

const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function InstallApp() {
  const [status, setStatus] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [db, setDb] = useState<DbConnectionInput>({ host: '', port: '5432', database: '', user: '', password: '', ssl: false });
  const [test, setTest] = useState<TestConnectionResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [consent, setConsent] = useState(false);

  const [installToken, setInstallToken] = useState<string | null>(null);
  const [migrations, setMigrations] = useState<{ applied: string[]; total: number } | null>(null);

  const [admin, setAdmin] = useState<AdminForm>(EMPTY_ADMIN);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    api.getStatus()
      .then((s) => setStatus(s.status))
      .catch((err) => setStatusError(err.message));
  }, []);

  if (statusError) {
    return (
      <Shell>
        <ScreenCard>
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <h1 className="text-lg font-extrabold text-[#111827] text-center">Cannot reach the installer service</h1>
          <p className="text-xs text-slate-500 text-center">{statusError}</p>
        </ScreenCard>
      </Shell>
    );
  }

  if (status === null) {
    return (
      <Shell>
        <ScreenCard>
          <Loader2 className="w-8 h-8 text-[#4A90FF] animate-spin mx-auto" />
          <p className="text-xs text-slate-500 text-center mt-2">Checking installation state…</p>
        </ScreenCard>
      </Shell>
    );
  }

  if (status === 'INSTALLED') {
    return (
      <Shell>
        <StateCard state={STATE_LABELS.INSTALLED}>
          <a href="/" className="btn-primary w-full">Open Recura</a>
        </StateCard>
      </Shell>
    );
  }

  if (status === 'INSTALLING' || status === 'INSTALLATION_FAILED' || status === 'RECOVERY_REQUIRED') {
    const label = STATE_LABELS[status];
    return (
      <Shell>
        <StateCard state={label}>
          <button
            className="btn-primary w-full"
            onClick={() => { setStatus('NOT_INSTALLED'); setStep(1); }}
          >
            {status === 'INSTALLATION_FAILED' ? 'Retry Installation' : status === 'RECOVERY_REQUIRED' ? 'I have restarted the server' : 'Restart Installation'}
          </button>
        </StateCard>
      </Shell>
    );
  }

  // status === 'NOT_INSTALLED' → wizard
  return (
    <Shell>
      <div className="w-full max-w-2xl mx-auto space-y-5">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                    i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-[#4A90FF] text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <span className={`text-[11px] font-bold hidden sm:block ${i === step ? 'text-[#111827]' : 'text-slate-400'}`}>{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && <div className="w-6 h-px bg-slate-200" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs flex items-start gap-2.5 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="font-bold text-rose-950">{error}</p>
          </div>
        )}

        {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
        {step === 1 && (
          <DatabaseStep
            db={db}
            setDb={setDb}
            test={test}
            testing={testing}
            consent={consent}
            setConsent={setConsent}
            onTest={handleTest}
            onNext={handleStart}
            busy={busy}
          />
        )}
        {step === 2 && <InstallStep migrations={migrations} onNext={() => setStep(3)} />}
        {step === 3 && <AdminStep admin={admin} setAdmin={setAdmin} busy={busy} onSubmit={handleAdmin} />}
        {step === 4 && <VerifyStep result={verifyResult} onNext={handleComplete} busy={busy} />}
        {step === 5 && <CompleteStep />}
      </div>
    </Shell>
  );

  async function handleTest() {
    setError(null);
    if (!db.host || !db.database || !db.user) {
      setError('Host, database name and username are required to test the connection.');
      return;
    }
    setTesting(true);
    setTest(null);
    try {
      const result = await api.testConnection(db);
      setTest(result);
      if (!result.ok) setError(result.message || 'Connection test failed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed.');
    } finally {
      setTesting(false);
    }
  }

  async function handleStart() {
    if (!test?.ok || !test.state) return;
    const needsConsent = test.state === 'partial' || test.state === 'unrelated' || (test.state === 'complete' && test.migrated !== true);
    if (needsConsent && !consent) {
      setError('Please confirm that you authorize installing Recura into the selected database.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const started = await api.startInstall(db, test.state, consent, false);
      if (!started.installToken) {
        setError(started.message || 'Could not start the installation.');
        return;
      }
      setInstallToken(started.installToken);
      setBusy(false);
      setStep(2);
      await runMigrations(started.installToken);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : 'Could not start the installation.');
    }
  }

  async function runMigrations(token: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await api.migrate(token);
      if (!result.ok || !result.result) {
        setError(result.message || 'Installing the database schema failed.');
        return;
      }
      setMigrations({
        applied: result.result.applied.map((m) => m.name),
        total: result.result.applied.length + result.result.alreadyApplied.length,
      });
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Installing the database schema failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleAdmin() {
    const name = admin.name.trim();
    const username = admin.username.trim();
    const email = admin.email.trim();
    if (!name) return setError('Full name is required.');
    if (username.length < 3 || username.length > 40 || /\s/.test(username) || !USERNAME_REGEX.test(username)) {
      return setError('Username must be 3–40 characters using letters, numbers, _ , - or . only.');
    }
    if (!EMAIL_REGEX.test(email)) return setError('Please enter a valid email address.');
    if (admin.password.length < 6) return setError('Password must be at least 6 characters.');
    if (admin.password !== admin.confirm) return setError('Passwords do not match.');
    setBusy(true);
    setError(null);
    try {
      const result = await api.createAdmin(installToken!, { name, username, email, password: admin.password });
      if (!result.ok) {
        setError(result.message || 'Could not create the administrator account.');
        return;
      }
      await runVerify();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the administrator account.');
    } finally {
      setBusy(false);
    }
  }

  async function runVerify() {
    setError(null);
    try {
      const result = await api.verify(installToken!);
      setVerifyResult(result);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    }
  }

  async function handleComplete() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.complete(installToken!);
      if (!result.ok) {
        setError(result.message || 'Could not complete the installation.');
        return;
      }
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete the installation.');
    } finally {
      setBusy(false);
    }
  }
}

/* ------------------------------------------------------------------ */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-2xl relative z-10 space-y-6">
        <div className="text-center flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center mb-2">
            <RecuraLogoIcon className="w-16 h-16 drop-shadow-sm" />
          </div>
          <RecuraWordmark className="text-3xl" />
          <p className="text-[11px] font-bold text-slate-400 mt-1 tracking-wide uppercase">Automatic Installer</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function ScreenCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E8EAF0] rounded-3xl p-7 shadow-xl space-y-4">
      {children}
    </div>
  );
}

function StateCard({ state, children }: { state: { title: string; body: string; tone: 'ok' | 'warn' | 'err' }; children: React.ReactNode }) {
  const toneColor = state.tone === 'ok' ? 'text-emerald-500' : state.tone === 'warn' ? 'text-amber-500' : 'text-rose-500';
  return (
    <ScreenCard>
      {state.tone === 'ok' ? <CircleCheck className={`w-8 h-8 ${toneColor} mx-auto`} /> : <AlertTriangle className={`w-8 h-8 ${toneColor} mx-auto`} />}
      <h1 className="text-lg font-extrabold text-[#111827] text-center">{state.title}</h1>
      <p className="text-xs text-slate-500 text-center leading-relaxed">{state.body}</p>
      {children}
    </ScreenCard>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="border-b border-slate-100 pb-3 flex items-center justify-between"><h2 className="text-base font-extrabold text-[#111827]">{children}</h2></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[#111827] font-extrabold mb-1.5 text-xs">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E8EAF0] text-[#111827] rounded-xl font-medium text-xs focus:outline-none focus:bg-white focus:border-[#4A90FF] focus:ring-2 focus:ring-blue-100 transition-all';

/* ------------------------------------------------------------------ */

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const items = [
    { icon: Server, title: 'Your own database', body: 'Point Recura at any PostgreSQL 13+ database you control. Nothing is stored in the browser.' },
    { icon: Database, title: 'Automatic schema', body: 'Recura creates its schema, templates and your administrator account for you — no SQL needed.' },
    { icon: ShieldCheck, title: 'Protected after install', body: 'The installer locks itself once finished. Your data stays on your server.' },
  ];
  return (
    <ScreenCard>
      <SectionLabel>Welcome to Recura</SectionLabel>
      <p className="text-xs text-slate-500 leading-relaxed">
        This wizard connects Recura to a PostgreSQL database, installs everything it needs, and creates the first
        administrator account. You will only need the database host, port, name and credentials.
      </p>
      <div className="space-y-3">
        {items.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex items-start gap-3 p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E8EAF0]">
            <Icon className="w-5 h-5 text-[#4A90FF] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold text-[#111827]">{title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="btn-primary w-full" onClick={onNext}>
        Begin Installation <ChevronRight className="w-4 h-4" />
      </button>
    </ScreenCard>
  );
}

/* ------------------------------------------------------------------ */

interface DatabaseStepProps {
  db: DbConnectionInput;
  setDb: React.Dispatch<React.SetStateAction<DbConnectionInput>>;
  test: TestConnectionResult | null;
  testing: boolean;
  consent: boolean;
  setConsent: React.Dispatch<React.SetStateAction<boolean>>;
  onTest: () => void;
  onNext: () => void;
  busy: boolean;
}

function DatabaseStep({ db, setDb, test, testing, consent, setConsent, onTest, onNext, busy }: DatabaseStepProps) {
  const set = (k: keyof DbConnectionInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = k === 'ssl' ? e.target.checked : e.target.value;
    setDb((prev) => ({ ...prev, [k]: value }));
  };

  const needsConsent = test?.ok && (test.state === 'partial' || test.state === 'unrelated' || (test.state === 'complete' && test.migrated !== true));
  const ready = test?.ok === true && (!needsConsent || consent);

  return (
    <ScreenCard>
      <SectionLabel>Database Connection</SectionLabel>
      <p className="text-xs text-slate-500 leading-relaxed">
        Enter the details of the PostgreSQL database Recura should use. The installer will test the connection before touching anything.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <Field label="Host">
            <input className={inputCls} placeholder="db.example.com" value={db.host} onChange={set('host')} disabled={busy} />
          </Field>
        </div>
        <div className="col-span-1">
          <Field label="Port">
            <input className={inputCls} type="number" placeholder="5432" value={db.port} onChange={set('port')} disabled={busy} />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="Database Name">
            <input className={inputCls} placeholder="recura" value={db.database} onChange={set('database')} disabled={busy} />
          </Field>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Username">
            <input className={inputCls} autoComplete="username" placeholder="postgres" value={db.user} onChange={set('user')} disabled={busy} />
          </Field>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Field label="Password">
            <input className={inputCls} type="password" autoComplete="current-password" value={db.password} onChange={set('password')} disabled={busy} />
          </Field>
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
        <input type="checkbox" checked={db.ssl} onChange={set('ssl')} className="w-4 h-4 accent-[#4A90FF]" disabled={busy} />
        Use SSL connection
      </label>

      <div className="flex items-center gap-3">
        <button className="btn-secondary" onClick={onTest} disabled={testing || busy}>
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          {testing ? 'Testing…' : 'Test Connection'}
        </button>
      </div>

      {test && (
        <div className={`rounded-2xl border p-4 text-xs space-y-2 ${test.ok ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          {test.ok ? (
            <>
              <div className="flex items-center gap-2 font-extrabold text-emerald-800">
                <CircleCheck className="w-4 h-4 text-emerald-500" /> Connected
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600">
                <div className="flex justify-between"><span>Server</span><span className="font-bold text-slate-800">{test.serverVersion?.split(' on ')[0] ?? 'unknown'}</span></div>
                <div className="flex justify-between"><span>Supported (PG 13+)</span><span className={`font-bold ${test.versionSupported ? 'text-emerald-600' : 'text-rose-600'}`}>{test.versionSupported ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span>Can create tables</span><span className={`font-bold ${test.canCreateTables ? 'text-emerald-600' : 'text-rose-600'}`}>{test.canCreateTables ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span>Database state</span><span className="font-bold text-slate-800">{test.state}</span></div>
              </div>
              {test.existingTables && test.existingTables.length > 0 && (
                <p className="text-slate-600">Existing Recura tables: <span className="font-bold">{test.existingTables.join(', ')}</span></p>
              )}
              {test.unrelatedTables && test.unrelatedTables.length > 0 && (
                <p className="text-slate-600">Unrelated tables found (up to 20 shown): <span className="font-bold">{test.unrelatedTables.join(', ')}</span></p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> {test.message || 'Connection failed.'}
            </div>
          )}
        </div>
      )}

      {needsConsent && (
        <label className="flex items-start gap-2.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 cursor-pointer select-none">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="w-4 h-4 accent-amber-500 mt-0.5" disabled={busy} />
          <span>
            This database already contains tables. I confirm that I own or administer it and authorize installing Recura here.
            No existing data will be deleted.
          </span>
        </label>
      )}

      <button className="btn-primary w-full" onClick={onNext} disabled={!ready || busy}>
        Continue <ChevronRight className="w-4 h-4" />
      </button>
    </ScreenCard>
  );
}

/* ------------------------------------------------------------------ */

function InstallStep({ migrations, onNext }: { migrations: { applied: string[]; total: number } | null; onNext: () => void }) {
  return (
    <ScreenCard>
      <SectionLabel>Installing the Database</SectionLabel>
      {migrations === null ? (
        <div className="flex items-center gap-3 text-xs font-bold text-slate-600 py-6 justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#4A90FF]" /> Installing schema… this may take a moment.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">The schema, default templates and data guards were applied successfully:</p>
          <div className="space-y-2">
            {migrations.applied.map((name) => (
              <div key={name} className="flex items-center gap-2.5 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                <Check className="w-4 h-4 text-emerald-500" /> {name}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 font-semibold">{migrations.total} migration file(s) processed.</p>
          <button className="btn-primary w-full" onClick={onNext}>Create Administrator <ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </ScreenCard>
  );
}

/* ------------------------------------------------------------------ */

function AdminStep({ admin, setAdmin, busy, onSubmit }: {
  admin: AdminForm;
  setAdmin: React.Dispatch<React.SetStateAction<AdminForm>>;
  busy: boolean;
  onSubmit: () => void;
}) {
  const set = (k: keyof AdminForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAdmin((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <ScreenCard>
      <SectionLabel>Administrator Account</SectionLabel>
      <p className="text-xs text-slate-500 leading-relaxed">
        Create the first account. It will have Administrator rights and is the account you will use to log in.
      </p>
      <div className="space-y-3">
        <Field label="Full Name"><input className={inputCls} placeholder="System Owner" value={admin.name} onChange={set('name')} disabled={busy} /></Field>
        <Field label="Username"><input className={inputCls} autoComplete="username" placeholder="admin" value={admin.username} onChange={set('username')} disabled={busy} /></Field>
        <Field label="Email"><input className={inputCls} type="email" autoComplete="email" placeholder="admin@example.com" value={admin.email} onChange={set('email')} disabled={busy} /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Password"><input className={inputCls} type="password" autoComplete="new-password" value={admin.password} onChange={set('password')} disabled={busy} /></Field>
          <Field label="Confirm Password"><input className={inputCls} type="password" autoComplete="new-password" value={admin.confirm} onChange={set('confirm')} disabled={busy} /></Field>
        </div>
      </div>
      <button className="btn-primary w-full" onClick={onSubmit} disabled={busy}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
        {busy ? 'Creating…' : 'Create & Verify'}
      </button>
    </ScreenCard>
  );
}

/* ------------------------------------------------------------------ */

function VerifyStep({ result, onNext, busy }: { result: VerifyResult | null; onNext: () => void; busy: boolean }) {
  return (
    <ScreenCard>
      <SectionLabel>Verification</SectionLabel>
      {result === null ? (
        <div className="flex items-center gap-3 text-xs font-bold text-slate-600 py-6 justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#4A90FF]" /> Verifying installation…
        </div>
      ) : result.ok ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs font-extrabold text-emerald-800">
            <CircleCheck className="w-5 h-5 text-emerald-500" /> All checks passed
          </div>
          <div className="space-y-1.5">
            {result.checks?.map((c) => (
              <div key={c.table} className="flex items-center justify-between text-xs p-2.5 bg-[#F8FAFC] rounded-xl">
                <span className="font-bold text-slate-700">{c.table}</span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                  {c.ok ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                  {c.rows} row(s)
                </span>
              </div>
            ))}
          </div>
          {result.adminEmail && (
            <p className="text-xs text-slate-500">Administrator ready: <span className="font-bold text-slate-800">{result.adminEmail}</span></p>
          )}
          <button className="btn-primary w-full" onClick={onNext} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {busy ? 'Finalizing…' : 'Finish Installation'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-500" /> Verification failed. Go back and check the installation.
          </div>
          <button className="btn-secondary w-full" onClick={() => window.location.reload()}>Reload</button>
        </div>
      )}
    </ScreenCard>
  );
}

/* ------------------------------------------------------------------ */

function CompleteStep() {
  return (
    <ScreenCard>
      <CircleCheck className="w-10 h-10 text-emerald-500 mx-auto" />
      <h1 className="text-lg font-extrabold text-[#111827] text-center">Installation Complete</h1>
      <p className="text-xs text-slate-500 text-center leading-relaxed">
        Recura is installed and its installer is now locked. Log in with the administrator account you just created.
      </p>
      <a href="/" className="btn-primary w-full">
        <Lock className="w-4 h-4" /> Go to Log in
      </a>
    </ScreenCard>
  );
}
