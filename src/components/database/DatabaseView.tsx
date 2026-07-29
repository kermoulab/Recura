import React, { useState } from 'react';
import {
  Database,
  Download,
  Copy,
  Check,
  FileCode,
  Server,
  Layers,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { PRISMA_SCHEMA, DATABASE_SQL, DOCKER_COMPOSE, SEED_TS } from '../../data/dbExport';

export const DatabaseView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sql' | 'prisma' | 'docker' | 'seed' | 'er'>('sql');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const copyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(label);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="subly-database-view" className="p-8 space-y-6 bg-[#F5F7FA] min-h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#111827]">
              Phase 0 – Database Setup & SQL Exporter
            </h1>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              ✓ Database Verified
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Generate and export production SQL schema, Prisma models, Docker configurations, and ER diagrams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadFile('database.sql', DATABASE_SQL)}
            className="flex items-center gap-2 bg-[#111827] text-white hover:bg-black text-xs font-bold px-4 py-2.5 rounded-full shadow-xs transition-transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download database.sql</span>
          </button>
        </div>
      </div>

      {/* Exporter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('sql')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'sql'
              ? 'bg-[#4A90FF] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-[#E8EAF0] hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>database.sql</span>
        </button>

        <button
          onClick={() => setActiveTab('prisma')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'prisma'
              ? 'bg-[#4A90FF] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-[#E8EAF0] hover:bg-slate-100'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>schema.prisma</span>
        </button>

        <button
          onClick={() => setActiveTab('docker')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'docker'
              ? 'bg-[#4A90FF] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-[#E8EAF0] hover:bg-slate-100'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>docker-compose.yml</span>
        </button>

        <button
          onClick={() => setActiveTab('seed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'seed'
              ? 'bg-[#4A90FF] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-[#E8EAF0] hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>seed.ts</span>
        </button>

        <button
          onClick={() => setActiveTab('er')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            activeTab === 'er'
              ? 'bg-[#4A90FF] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-[#E8EAF0] hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ER Diagram Schema</span>
        </button>
      </div>

      {/* Code / Content Viewer */}
      {activeTab === 'er' ? (
        /* ER Diagram View */
        <div className="bg-white p-6 rounded-3xl border border-[#E8EAF0] space-y-6">
          <h2 className="font-extrabold text-base text-[#111827]">PostgreSQL Relational ER Diagram</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            {/* User Table */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <span className="font-extrabold text-blue-400 block border-b border-slate-800 pb-2">User (Admin)</span>
              <p className="text-slate-300 font-mono">id (PK UUID)</p>
              <p className="text-amber-300 font-mono font-bold">username (UNIQUE INDEX)</p>
              <p className="text-slate-300 font-mono">email (UNIQUE)</p>
              <p className="text-slate-300 font-mono">passwordHash (Argon2id)</p>
              <p className="text-slate-300 font-mono">mfaEnabled (Boolean)</p>
            </div>

            {/* Customer Table */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <span className="font-extrabold text-emerald-400 block border-b border-slate-800 pb-2">Customer</span>
              <p className="text-slate-300 font-mono">id (PK UUID)</p>
              <p className="text-slate-300 font-mono">whatsapp (UNIQUE INDEX)</p>
              <p className="text-slate-300 font-mono">preferredLanguage (ENUM AR/FR/EN)</p>
              <p className="text-slate-300 font-mono font-bold text-amber-300">1 → N Orders</p>
            </div>

            {/* Plan Table */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <span className="font-extrabold text-purple-400 block border-b border-slate-800 pb-2">Plan (Inventory)</span>
              <p className="text-slate-300 font-mono">id (PK UUID)</p>
              <p className="text-slate-300 font-mono">category (Netflix/Disney/IPTV)</p>
              <p className="text-slate-300 font-mono">availableStock (INT)</p>
              <p className="text-slate-300 font-mono font-bold text-amber-300">1 → N Orders</p>
            </div>

            {/* Order Table */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 md:col-span-2">
              <span className="font-extrabold text-cyan-400 block border-b border-slate-800 pb-2">Order (Subscriptions)</span>
              <p className="text-slate-300 font-mono">id (PK UUID)</p>
              <p className="text-slate-300 font-mono">customerId (FK → Customer)</p>
              <p className="text-slate-300 font-mono">planId (FK → Plan)</p>
              <p className="text-slate-300 font-mono">status (ACTIVE / EXPIRING_3D / EXPIRED INDEX)</p>
              <p className="text-slate-300 font-mono">accountPasswordEncrypted (AES-256)</p>
              <p className="text-slate-300 font-mono">endDate (TIMESTAMP INDEX)</p>
            </div>
          </div>
        </div>
      ) : (
        /* Syntax Code Box */
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-lg">
          <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700 text-xs text-slate-400">
            <span className="font-mono font-bold text-slate-400">
              {activeTab === 'sql'
                ? 'database.sql'
                : activeTab === 'prisma'
                ? 'schema.prisma'
                : activeTab === 'docker'
                ? 'docker-compose.yml'
                : 'seed.ts'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  copyCode(
                    activeTab === 'sql'
                      ? DATABASE_SQL
                      : activeTab === 'prisma'
                      ? PRISMA_SCHEMA
                      : activeTab === 'docker'
                      ? DOCKER_COMPOSE
                      : SEED_TS,
                    activeTab
                  )
                }
                className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-slate-200 font-semibold transition-colors"
              >
                {copiedFile === activeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <pre className="p-6 text-xs font-mono text-slate-400 overflow-x-auto max-h-[500px] leading-relaxed">
            {activeTab === 'sql'
              ? DATABASE_SQL
              : activeTab === 'prisma'
              ? PRISMA_SCHEMA
              : activeTab === 'docker'
              ? DOCKER_COMPOSE
              : SEED_TS}
          </pre>
        </div>
      )}
    </div>
  );
};
