/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';
import {
  Check, ChevronRight, Database, Loader2, Lock, RefreshCw, Server,
  ShieldCheck, Sparkles, AlertTriangle, CircleCheck, KeyRound,
  Link2, ClipboardPaste, HelpCircle, ArrowRight, Cloud, Copy, ClipboardCheck,
} from 'lucide-react';
import { createRestClient, probePostgrest, probeGraphql } from '../../src/lib/restClient';
import { RecuraLogoIcon, RecuraWordmark } from '../../src/components/common/RecuraLogo';
import { api, DbConnectionInput, DbPreset, TestConnectionResult, VerifyResult } from './api';
import { hashPasswordArgon2id } from '../../src/utils/security';
import { saveHostedConfig } from '../../src/lib/hostedBackend';

// Raw SQL used to bootstrap the schema of a brand-new hosted database.
// The installer cannot run DDL over the Supabase REST API (anon key), so the
// user pastes this into their provider's SQL editor once, then verifies again.
import hostedSchema001 from '../../server/migrations/001_initial_schema.sql?raw';
import hostedSchema002 from '../../server/migrations/002_default_whatsapp_templates.sql?raw';
import hostedSchema003 from '../../server/migrations/003_order_number_backfill.sql?raw';
import hostedSchema004 from '../../server/migrations/004_mobile_push_tables.sql?raw';

const HOSTED_SCHEMA_SQL = [hostedSchema001, hostedSchema002, hostedSchema003, hostedSchema004].join('\n\n');

type Step = 0 | 1 | 2 | 3 | 4 | 5;
type Backend = 'postgres' | 'hosted';
type HostedState = 'idle' | 'testing' | 'ok' | 'error' | 'schema-missing' | 'graphql';

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

const EMPTY_DB: DbConnectionInput = { host: '', port: '5432', database: '', user: '', password: '', ssl: false };

/** Defaults of the database bundled with `docker compose up` (docker-compose.yml). */
const DOCKER_DB: DbConnectionInput = { host: 'db', port: '5432', database: 'recura', user: 'recura', password: 'recura', ssl: false };

/** Turns a postgres:// connection string (Neon, Supabase, Render, ...) into the form fields. */
function parseConnectionString(raw: string): { db: DbConnectionInput; error?: string } {
  const trimmed = raw.trim();
  if (!/^postgres(ql)?:\/\//i.test(trimmed)) {
    return { db: EMPTY_DB, error: 'That does not look like a connection string. It should start with postgres:// or postgresql://' };
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { db: EMPTY_DB, error: 'Could not read that connection string. Double-check it and try again.' };
  }
  const sslMode = (parsed.searchParams.get('sslmode') || '').toLowerCase();
  const ssl =
    ['require', 'verify-ca', 'verify-full', 'prefer', 'true', '1'].includes(sslMode) ||
    parsed.searchParams.get('ssl') === 'true';
  return {
    db: {
      host: parsed.hostname,
      port: parsed.port || '5432',
      database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      ssl,
    },
  };
}

/** Plain-language follow-up for common connection problems. */
function friendlyErrorHint(message: string): string | null {
  if (/auth|password|28P01|password authentication/i.test(message)) return 'Double-check the username and password.';
  if (/could not reach|ECONNREFUSED|host and port/i.test(message)) return 'Check that the host and port are correct and that the database accepts remote connections.';
  if (/does not exist/i.test(message)) return 'Create the database first (your database provider has a button for that), then try again.';
  if (/privileges|permission/i.test(message)) return 'The database user needs permission to create tables. Choose a database with full access.';
  if (/timeout|timed out/i.test(message)) return 'The connection timed out. Check the host and port, and make sure your network allows it.';
  if (/ssl|certificate/i.test(message)) return 'Your database requires SSL. Turn on "Use SSL connection" and try again.';
  return null;
}

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

  const [presets, setPresets] = useState<DbPreset[]>([]);
  const [useEnv, setUseEnv] = useState(false);
  const [connOpen, setConnOpen] = useState(false);
  const [connString, setConnString] = useState('');
  const [connError, setConnError] = useState<string | null>(null);

  const [backend, setBackend] = useState<Backend>('postgres');
  const [hostedUrl, setHostedUrl] = useState('');
  const [hostedKey, setHostedKey] = useState('');
  const [hostedState, setHostedState] = useState<HostedState>('idle');
  const [hostedResult, setHostedResult] = useState<string | null>(null);
  const [hostedError, setHostedError] = useState<string | null>(null);
  const [hostedBusy, setHostedBusy] = useState(false);
  const [hostedAdminExists, setHostedAdminExists] = useState(false);
  const [hostedCopied, setHostedCopied] = useState(false);
  const [hostedGraphqlEndpoint, setHostedGraphqlEndpoint] = useState<string | null>(null);
  const [graphqlConnString, setGraphqlConnString] = useState('');

  useEffect(() => {
    api.getStatus()
      .then((s) => setStatus(s.status))
      .catch((err) => setStatusError(err.message));
    api.getDbPresets()
      .then((r) => { if (r.ok) setPresets(r.presets ?? []); })
      .catch(() => { /* presets are optional */ });
  }, []);

  // No Recura server is reachable (e.g. the installer is hosted statically on
  // Vercel/Netlify). The wizard can still install through a hosted database
  // (Supabase) entirely in the browser — that flow needs no server.
  const serverUnreachable = statusError !== null;

  useEffect(() => {
    if (serverUnreachable) setBackend('hosted');
  }, [serverUnreachable]);

  if (status === null && !serverUnreachable) {
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

  // status === 'NOT_INSTALLED', or the server is unreachable (hosted-only install)
  return (
    <Shell>
      <div className="w-full max-w-2xl mx-auto space-y-5">
        {serverUnreachable && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>No Recura server is reachable at this address.</p>
              <p className="font-semibold text-amber-800/80 leading-relaxed">
                You can still install Recura with a hosted database below — that option runs entirely in this
                browser and needs no server. (Self-hosting needs a running Recura server; see the README.)
              </p>
            </div>
          </div>
        )}

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
            presets={presets}
            useEnv={useEnv}
            setUseEnv={setUseEnv}
            connOpen={connOpen}
            setConnOpen={setConnOpen}
            connString={connString}
            setConnString={setConnString}
            connError={connError}
            setConnError={setConnError}
            onDbChange={() => { setTest(null); setError(null); }}
            backend={backend}
            setBackend={setBackend}
            serverAvailable={!serverUnreachable}
            hostedUrl={hostedUrl}
            setHostedUrl={setHostedUrl}
            hostedKey={hostedKey}
            setHostedKey={setHostedKey}
            hostedState={hostedState}
            hostedError={hostedError}
            setHostedError={setHostedError}
            hostedResult={hostedResult}
            hostedBusy={hostedBusy}
            hostedAdminExists={hostedAdminExists}
            hostedCopied={hostedCopied}
            setHostedCopied={setHostedCopied}
            hostedGraphqlEndpoint={hostedGraphqlEndpoint}
            graphqlConnString={graphqlConnString}
            setGraphqlConnString={setGraphqlConnString}
            onGraphqlConnString={handleGraphqlConnString}
            onHostedTest={handleHostedTest}
            onHostedAdmin={handleHostedAdmin}
            onHostedFinish={handleHostedFinish}
            admin={admin}
            setAdmin={setAdmin}
          />
        )}
        {step === 2 && <InstallStep migrations={migrations} onNext={() => setStep(3)} />}
        {step === 3 && <AdminStep admin={admin} setAdmin={setAdmin} busy={busy} onSubmit={handleAdmin} />}
        {step === 4 && <VerifyStep result={verifyResult} onNext={handleComplete} busy={busy} />}
        {step === 5 && <CompleteStep hosted={backend === 'hosted'} />}
      </div>
    </Shell>
  );

  async function handleTest(override?: DbConnectionInput) {
    setError(null);
    // React calls onClick handlers with the click event; only accept a real
    // connection object (from handleGraphqlConnString) as an override.
    const target =
      override && typeof override === 'object' && typeof override.host === 'string'
        ? override
        : db;
    if (!useEnv && (!target.host || !target.database || !target.user)) {
      setError('Host, database name and username are required to test the connection.');
      return;
    }
    setTesting(true);
    setTest(null);
    try {
      const result = await api.testConnection(useEnv ? { ...target, useEnvDatabase: true } : target);
      setTest(result);
      if (!result.ok) setError(result.message || 'Connection test failed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed.');
    } finally {
      setTesting(false);
    }
  }

  async function handleHostedTest() {
    setError(null);
    const url = hostedUrl.trim();
    const key = hostedKey.trim();
    if (!url) {
      setHostedState('error');
      setHostedError('Please paste the database API URL.');
      return;
    }
    if (!/^https:\/\/.+/i.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)) {
      setHostedState('error');
      setHostedError('The API URL must start with https:// (or http://localhost for local development).');
      return;
    }
    setHostedState('testing');
    setHostedError(null);
    setHostedResult(null);
    try {
      const client = createRestClient(url, key);
      const { data: users, error } = await client.get<{ id: string; role?: string }>('User', {
        select: 'id, role',
        limit: 1,
      });
      if (error) {
        // A missing table on a real PostgREST server produces PGRST205 /
        // "Could not find the table" / "relation ... does not exist". Anything
        // else is NOT assumed to mean "schema missing": probe what the endpoint
        // actually is (PostgREST vs GraphQL vs unknown) and react accordingly.
        const isMissingTable = /PGRST205|Could not find the table|relation .* does not exist|undefined_table/i.test(error.message);
        if (isMissingTable) {
          setHostedState('schema-missing');
          setHostedError(error.message);
          return;
        }
        const [graphqlProbe, pgProbe] = await Promise.all([probeGraphql(url, key), probePostgrest(url, key)]);
        if (graphqlProbe.isGraphql) {
          // Nhost / Hasura: GraphQL is a database API, not a dead end. Recura
          // installs the schema over direct PostgreSQL, so ask for the
          // connection string and continue automatically.
          setHostedState('graphql');
          setHostedError(null);
          setHostedGraphqlEndpoint(graphqlProbe.endpoint ?? null);
          return;
        }
        if (pgProbe.isPostgrest) {
          // PostgREST confirmed but the table is genuinely missing → schema needed.
          setHostedState('schema-missing');
          setHostedError(error.message);
          return;
        }
        setHostedState('error');
        setHostedError(
          `We couldn't identify the connection method for this address (HTTP ${pgProbe.status}${pgProbe.contentType ? `, ${pgProbe.contentType}` : ''}). ` +
            'Paste the connection string your database provider gave you (it starts with postgres://) and Recura will install it automatically.' +
            (pgProbe.message ? ` (${pgProbe.message})` : '')
        );
        return;
      }
      const adminExists = (users ?? []).some((u) => u.role === 'ADMIN');
      setHostedAdminExists(adminExists);
      setHostedState('ok');
      setHostedResult(
        adminExists
          ? 'Connected. An administrator already exists, so the installation is complete.'
          : 'Connected and the schema is ready — create your administrator account below.'
      );
    } catch (err) {
      setHostedState('error');
      setHostedError(err instanceof Error ? err.message : 'Could not reach the database API.');
    }
  }

  /**
   * Handles a Postgres connection string offered after a GraphQL endpoint was
   * detected (Nhost / Hasura). GraphQL is a database API, not a dead end, but
   * the browser-only hosted option speaks PostgREST, so we hand off to the
   * direct-PostgreSQL install path on the Recura server instead.
   */
  function handleGraphqlConnString() {
    const { db: parsed, error } = parseConnectionString(graphqlConnString);
    if (error) {
      setHostedError(error);
      return;
    }
    setDb(parsed);
    setBackend('postgres');
    setHostedState('idle');
    setHostedError(null);
    setTest(null);
    setError(null);
    void handleTest(parsed);
  }

  async function handleHostedAdmin() {
    const name = admin.name.trim();
    const username = admin.username.trim();
    const email = admin.email.trim();
    if (!name) return setHostedError('Full name is required.');
    if (username.length < 3 || username.length > 40 || /\s/.test(username) || !USERNAME_REGEX.test(username)) {
      return setHostedError('Username must be 3–40 characters using letters, numbers, _ , - or . only.');
    }
    if (!EMAIL_REGEX.test(email)) return setHostedError('Please enter a valid email address.');
    if (admin.password.length < 6) return setHostedError('Password must be at least 6 characters.');
    if (admin.password !== admin.confirm) return setHostedError('Passwords do not match.');
    setHostedBusy(true);
    setHostedError(null);
    try {
      const passwordHash = await hashPasswordArgon2id(admin.password);
      const client = createRestClient(hostedUrl.trim(), hostedKey.trim());
      const { error } = await client.insert('User', [{
        name,
        username,
        email: email.toLowerCase(),
        passwordHash,
        role: 'ADMIN',
        currency: 'USD ($)',
      }]);
      if (error) {
        if (/duplicate|unique|23505/i.test(error.message)) {
          setHostedError('That email or username is already in use. Choose another one.');
        } else {
          setHostedError(`Could not create the administrator account: ${error.message}`);
        }
        return;
      }
      saveHostedConfig({ provider: 'postgrest', url: hostedUrl.trim(), key: hostedKey.trim() });
      setStep(5);
    } catch (err) {
      setHostedError(err instanceof Error ? err.message : 'Could not create the administrator account.');
    } finally {
      setHostedBusy(false);
    }
  }

  function handleHostedFinish() {
    saveHostedConfig({ provider: 'postgrest', url: hostedUrl.trim(), key: hostedKey.trim() });
    setStep(5);
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
      const started = await api.startInstall(useEnv ? { ...db, useEnvDatabase: true } : db, test.state, consent, false);
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
    { icon: Server, title: 'Your data stays yours', body: 'Recura is installed on your own database — your data is never stored in the browser or on a third party.' },
    { icon: Sparkles, title: 'Almost no setup', body: 'The wizard finds the easiest path for you: paste a connection string, use the database your hosting created, or fill in a few fields.' },
    { icon: ShieldCheck, title: 'Protected after install', body: 'The installer locks itself once you finish. Your data stays on your server.' },
  ];
  return (
    <ScreenCard>
      <SectionLabel>Welcome to Recura</SectionLabel>
      <p className="text-xs text-slate-500 leading-relaxed">
        This short wizard connects Recura to a database, installs everything it needs, and creates your first
        administrator account. It takes about 2 minutes and there is nothing technical to understand.
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
      <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-1.5">
        <p className="text-[11px] font-extrabold text-[#111827] flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-[#4A90FF]" /> What you will need
        </p>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          One of: <span className="font-bold text-slate-800">a hosted database REST API</span> (no server needed —
          any PostgreSQL, e.g. Supabase), <span className="font-bold text-slate-800">a database your hosting already created</span>,{' '}
          <span className="font-bold text-slate-800">a connection string</span> from a free database provider
          (<a className="text-[#4A90FF] font-bold underline" href="https://neon.tech" target="_blank" rel="noreferrer">Neon</a>,{' '}
          <a className="text-[#4A90FF] font-bold underline" href="https://supabase.com" target="_blank" rel="noreferrer">Supabase</a>,{' '}
          <a className="text-[#4A90FF] font-bold underline" href="https://render.com" target="_blank" rel="noreferrer">Render</a>), or{' '}
          <span className="font-bold text-slate-800">a few connection details</span>. Plus an email and a password for your login.
        </p>
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
  /** Optional override lets the caller test a connection string without first filling the form. */
  onTest: (override?: DbConnectionInput) => void;
  onNext: () => void;
  busy: boolean;
  presets: DbPreset[];
  useEnv: boolean;
  setUseEnv: React.Dispatch<React.SetStateAction<boolean>>;
  connOpen: boolean;
  setConnOpen: React.Dispatch<React.SetStateAction<boolean>>;
  connString: string;
  setConnString: React.Dispatch<React.SetStateAction<string>>;
  connError: string | null;
  setConnError: React.Dispatch<React.SetStateAction<string | null>>;
  onDbChange: () => void;
  backend: Backend;
  setBackend: React.Dispatch<React.SetStateAction<Backend>>;
  /** False when no Recura server is reachable — the self-hosted option is hidden. */
  serverAvailable: boolean;
  hostedUrl: string;
  setHostedUrl: React.Dispatch<React.SetStateAction<string>>;
  hostedKey: string;
  setHostedKey: React.Dispatch<React.SetStateAction<string>>;
  hostedState: HostedState;
  hostedError: string | null;
  setHostedError: React.Dispatch<React.SetStateAction<string | null>>;
  hostedResult: string | null;
  hostedBusy: boolean;
  hostedAdminExists: boolean;
  hostedCopied: boolean;
  setHostedCopied: React.Dispatch<React.SetStateAction<boolean>>;
  hostedGraphqlEndpoint: string | null;
  graphqlConnString: string;
  setGraphqlConnString: React.Dispatch<React.SetStateAction<string>>;
  onGraphqlConnString: () => void;
  onHostedTest: () => void;
  onHostedAdmin: () => void;
  onHostedFinish: () => void;
  admin: AdminForm;
  setAdmin: React.Dispatch<React.SetStateAction<AdminForm>>;
}
function DatabaseStep({
  db, setDb, test, testing, consent, setConsent, onTest, onNext, busy,
  presets, useEnv, setUseEnv, connOpen, setConnOpen, connString, setConnString,
  connError, setConnError, onDbChange,
  backend, setBackend, serverAvailable,
  hostedUrl, setHostedUrl, hostedKey, setHostedKey,
  hostedState, hostedError, setHostedError, hostedResult, hostedBusy, hostedAdminExists,
  hostedCopied, setHostedCopied, hostedGraphqlEndpoint,
  graphqlConnString, setGraphqlConnString, onGraphqlConnString,
  onHostedTest, onHostedAdmin, onHostedFinish,
  admin, setAdmin,
}: DatabaseStepProps) {
  const set = (k: keyof DbConnectionInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = k === 'ssl' ? e.target.checked : e.target.value;
    setUseEnv(false);
    onDbChange();
    setDb((prev) => ({ ...prev, [k]: value }));
  };

  const applyConnString = () => {
    const { db: parsed, error } = parseConnectionString(connString);
    setConnError(error ?? null);
    if (!error) {
      setUseEnv(false);
      onDbChange();
      setDb(parsed);
      setConnOpen(false);
      setConnString('');
    }
  };

  const needsConsent = test?.ok && (test.state === 'partial' || test.state === 'unrelated' || (test.state === 'complete' && test.migrated !== true));
  const ready = test?.ok === true && (!needsConsent || consent);

  const setAdminField = (k: keyof AdminForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAdmin((prev) => ({ ...prev, [k]: e.target.value }));

  const copySchemaSql = async () => {
    try {
      await navigator.clipboard.writeText(HOSTED_SCHEMA_SQL);
      setHostedCopied(true);
      window.setTimeout(() => setHostedCopied(false), 2500);
    } catch {
      /* clipboard blocked — the SQL stays visible to copy manually */
    }
  };

  return (
    <ScreenCard>
      <SectionLabel>Database Connection</SectionLabel>
      <p className="text-xs text-slate-500 leading-relaxed">
        {serverAvailable
          ? 'Recura stores everything in a PostgreSQL database. Pick the option that fits you best.'
          : 'Recura stores everything in a PostgreSQL database. No server is reachable here, so use a hosted database — it works entirely from this browser.'}
      </p>

      {/* Backend choice (hidden when the Recura server is unreachable) */}
      {serverAvailable && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          className={`text-left rounded-2xl border-2 p-4 transition-all ${backend === 'postgres' ? 'border-[#4A90FF] bg-blue-50/60' : 'border-[#E8EAF0] bg-[#F8FAFC] hover:border-slate-300'}`}
          onClick={() => setBackend('postgres')}
          disabled={busy}
        >
          <Server className="w-5 h-5 text-[#4A90FF]" />
          <p className="text-xs font-extrabold text-[#111827] mt-2">Self-hosted (Recommended)</p>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Your own PostgreSQL, installed by the Recura server.</p>
        </button>
        <button
          className={`text-left rounded-2xl border-2 p-4 transition-all ${backend === 'hosted' ? 'border-[#4A90FF] bg-blue-50/60' : 'border-[#E8EAF0] bg-[#F8FAFC] hover:border-slate-300'}`}
          onClick={() => setBackend('hosted')}
          disabled={busy}
        >
          <Cloud className="w-5 h-5 text-[#4A90FF]" />
          <p className="text-xs font-extrabold text-[#111827] mt-2">Hosted database (REST API)</p>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">PostgreSQL over a PostgREST REST API (e.g. Supabase) — no server to manage.</p>
        </button>
        </div>
      )}

      {backend === 'hosted' ? (
        <div className="space-y-4">
          <div className="p-4 bg-[#F8FAFC] border border-[#E8EAF0] rounded-2xl space-y-3">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Works with any PostgreSQL served through a PostgREST API — including Supabase. For Supabase,
              paste <span className="font-bold">https://&lt;project&gt;.supabase.co/rest/v1</span> and the{' '}
              <span className="font-bold">anon public key</span> from <span className="font-mono">Project Settings → API</span>.
              For a self-hosted PostgREST server, use its URL. Only public credentials are used — they stay in this browser.
              This option speaks PostgREST; if your provider exposes GraphQL (Nhost, Hasura), the wizard detects it and
              guides you to the connection-string route instead.
            </p>
            <Field label="Database API URL">
              <input className={inputCls} placeholder="https://your-database.example.com" value={hostedUrl} onChange={(e) => setHostedUrl(e.target.value)} disabled={hostedBusy} />
            </Field>
            <Field label="API key (optional)">
              <input className={inputCls} type="password" autoComplete="off" placeholder="anon public key — leave empty for open access" value={hostedKey} onChange={(e) => setHostedKey(e.target.value)} disabled={hostedBusy} />
            </Field>
            <button className="btn-secondary w-full" onClick={onHostedTest} disabled={hostedBusy || hostedState === 'testing'}>
              {hostedState === 'testing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
              {hostedState === 'testing' ? 'Checking…' : 'Verify connection & schema'}
            </button>

            {hostedState === 'error' && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> {hostedError}
              </div>
            )}

            {hostedState === 'schema-missing' && (
              <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2.5 text-xs font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    The database is reachable but the Recura schema is not installed yet. Open your database's SQL
                    console (for Supabase: <span className="font-mono">SQL Editor</span>), paste the schema below, run it,
                    then verify again.
                    <br />
                    <span className="font-normal text-amber-700">
                      Need to start over with a different provider? Use the "Self-hosted (PostgreSQL)" backend instead.
                    </span>
                  </span>
                </div>
                <textarea className={inputCls} readOnly rows={8} value={HOSTED_SCHEMA_SQL} spellCheck={false} />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button className="btn-primary flex-1 !py-2 text-xs" onClick={copySchemaSql}>
                    {hostedCopied ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {hostedCopied ? 'Copied' : 'Copy the schema'}
                  </button>
                  <button className="btn-secondary flex-1 !py-2 text-xs" onClick={onHostedTest} disabled={hostedBusy}>
                    <RefreshCw className="w-4 h-4" /> I ran it — check again
                  </button>
                </div>
              </div>
            )}

            {hostedState === 'graphql' && (
              <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-2.5 text-xs font-bold text-blue-900">
                  <Link2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    This looks like a <span className="font-extrabold">GraphQL</span> database API
                    {hostedGraphqlEndpoint ? ` (${hostedGraphqlEndpoint})` : ''} — for example Nhost or Hasura.
                    The hosted-database option connects through PostgREST, so it can't talk to this endpoint directly.
                  </span>
                </div>
                {serverAvailable ? (
                  <>
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      No problem — Recura installs its database over plain PostgreSQL. Paste the{' '}
                      <span className="font-bold">Postgres connection string</span> your provider gives you
                      (Nhost: Dashboard → Settings → Database) and we'll continue automatically.
                    </p>
                    <Field label="Postgres connection string">
                      <textarea
                        className={inputCls}
                        rows={3}
                        placeholder="postgresql://user:password@host:5432/database?sslmode=require"
                        value={graphqlConnString}
                        onChange={(e) => { setGraphqlConnString(e.target.value); setHostedError(null); }}
                        disabled={hostedBusy}
                      />
                    </Field>
                    {hostedError && (
                      <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> {hostedError}
                      </div>
                    )}
                    <button className="btn-primary w-full !py-2 text-xs" onClick={onGraphqlConnString} disabled={hostedBusy}>
                      <ClipboardPaste className="w-4 h-4" /> Install with this connection string
                    </button>
                  </>
                ) : (
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    No Recura server is reachable from this page, and the browser-only hosted option only works with a
                    PostgREST endpoint (e.g. Supabase). Try a PostgREST URL instead, or open this installer from your
                    Recura server.
                  </p>
                )}
              </div>
            )}

            {hostedState === 'ok' && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800">
                <CircleCheck className="w-5 h-5 text-emerald-500 shrink-0" /> {hostedResult}
              </div>
            )}

            {hostedState === 'ok' && hostedAdminExists && (
              <button className="btn-primary w-full" onClick={onHostedFinish}>
                <ShieldCheck className="w-4 h-4" /> Finish installation
              </button>
            )}

            {hostedState === 'ok' && !hostedAdminExists && (
              <div className="space-y-3 border-t border-[#E8EAF0] pt-4">
                <p className="text-xs font-extrabold text-[#111827]">Administrator Account</p>
                <Field label="Full Name"><input className={inputCls} placeholder="System Owner" value={admin.name} onChange={setAdminField('name')} disabled={hostedBusy} /></Field>
                <Field label="Username"><input className={inputCls} autoComplete="username" placeholder="admin" value={admin.username} onChange={setAdminField('username')} disabled={hostedBusy} /></Field>
                <Field label="Email"><input className={inputCls} type="email" autoComplete="email" placeholder="admin@example.com" value={admin.email} onChange={setAdminField('email')} disabled={hostedBusy} /></Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Password"><input className={inputCls} type="password" autoComplete="new-password" value={admin.password} onChange={setAdminField('password')} disabled={hostedBusy} /></Field>
                  <Field label="Confirm Password"><input className={inputCls} type="password" autoComplete="new-password" value={admin.confirm} onChange={setAdminField('confirm')} disabled={hostedBusy} /></Field>
                </div>
                {hostedError && (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> {hostedError}
                  </div>
                )}
                <button className="btn-primary w-full" onClick={onHostedAdmin} disabled={hostedBusy}>
                  {hostedBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  {hostedBusy ? 'Creating…' : 'Create administrator & finish'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
      <>
      {/* Quick setup: one-click options for non-technical users */}
      <div className="space-y-2.5">
        {presets.map((p) => (
          <div key={p.id} className="flex items-start gap-3 p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl">
            <Server className="w-5 h-5 text-[#4A90FF] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-[#111827]">{p.label}</p>
              {p.hint && <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{p.hint}</p>}
            </div>
            <button
              className="btn-primary !px-4 !py-2 text-[11px] shrink-0"
              onClick={() => { setUseEnv(true); onDbChange(); }}
              disabled={busy}
            >
              Use it
            </button>
          </div>
        ))}

        <div className="flex items-start gap-3 p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E8EAF0]">
          <Database className="w-5 h-5 text-[#4A90FF] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-[#111827]">Using Docker?</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              If you started Recura with <code className="font-mono">docker compose up</code>, a database is already included.
            </p>
          </div>
          <button
            className="btn-secondary !px-4 !py-2 text-[11px] shrink-0"
            onClick={() => { setUseEnv(false); onDbChange(); setDb(DOCKER_DB); }}
            disabled={busy}
          >
            Fill it in
          </button>
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 text-xs font-extrabold text-[#4A90FF] hover:text-[#2f74e6] transition-colors py-1"
          onClick={() => setConnOpen((v) => !v)}
          disabled={busy}
        >
          <Link2 className="w-4 h-4" /> {connOpen ? 'Hide connection string' : 'I have a connection string instead'}
        </button>
      </div>

      {connOpen && (
        <div className="space-y-3 p-4 bg-[#F8FAFC] border border-[#E8EAF0] rounded-2xl">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Your database provider (Neon, Supabase, Render, …) gives you a connection string that starts with{' '}
            <code className="font-mono">postgres://</code>. Paste it here and we will fill in the fields for you.
          </p>
          <textarea
            className={inputCls}
            rows={3}
            placeholder="postgresql://user:password@host:5432/database?sslmode=require"
            value={connString}
            onChange={(e) => { setConnString(e.target.value); setConnError(null); }}
            disabled={busy}
          />
          {connError && <p className="text-[11px] font-bold text-rose-700">{connError}</p>}
          <button className="btn-primary w-full !py-2 text-xs" onClick={applyConnString} disabled={busy}>
            <ClipboardPaste className="w-4 h-4" /> Fill in the fields from this string
          </button>
        </div>
      )}

      {useEnv ? (
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-800">
            <Check className="w-4 h-4 text-emerald-500" /> Using the hosting database
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            The server will connect using the database configured by your hosting provider. There is nothing to fill
            in — just test the connection below.
          </p>
        </div>
      ) : (
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
      )}

      <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
        <input type="checkbox" checked={db.ssl} onChange={set('ssl')} className="w-4 h-4 accent-[#4A90FF]" disabled={busy || useEnv} />
        Use SSL connection
        <span className="inline-flex items-center gap-1 text-slate-400 font-semibold" title="Cloud databases (Neon, Supabase, Render, Railway) usually need this. Local databases usually do not.">
          <HelpCircle className="w-3.5 h-3.5" />
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button className="btn-secondary" onClick={onTest} disabled={testing || busy}>
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          {testing ? 'Testing…' : 'Test Connection'}
        </button>
        <span className="text-[11px] text-slate-400 font-semibold">We check the connection before installing anything.</span>
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
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> {test.message || 'Connection failed.'}
              </div>
              {friendlyErrorHint(test.message || '') && (
                <p className="text-rose-700/80 font-semibold">Tip: {friendlyErrorHint(test.message || '')}</p>
              )}
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
      </>
      )}
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

function CompleteStep({ hosted = false }: { hosted?: boolean }) {
  return (
    <ScreenCard>
      <CircleCheck className="w-10 h-10 text-emerald-500 mx-auto" />
      <h1 className="text-lg font-extrabold text-[#111827] text-center">Installation Complete</h1>
      <p className="text-xs text-slate-500 text-center leading-relaxed">
        {hosted
          ? 'Recura is connected to your hosted database. The app now talks to it directly — no server to manage. Log in with the administrator account you just created.'
          : 'Recura is installed and its installer is now locked. Log in with the administrator account you just created.'}
      </p>
      <a href="/" className="btn-primary w-full">
        <Lock className="w-4 h-4" /> Go to Log in
      </a>
    </ScreenCard>
  );
}
