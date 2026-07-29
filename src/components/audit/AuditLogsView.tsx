import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { AuditLog } from '../../types/erp';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm);

    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;

    return matchesSearch && matchesAction;
  });

  return (
    <div id="subly-audit-view" className="p-8 space-y-6 bg-[#F5F7FA] min-h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#111827]">Security & Compliance Audit Trail</h1>
            <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
              Immutable Log
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Tracks admin logins, order creations, WhatsApp messaging events, template changes, and IP addresses.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#E8EAF0] flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search email, action details, IP address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl text-xs font-medium text-[#111827] px-3 py-2 focus:outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="LOGIN">Login Events</option>
            <option value="WHATSAPP_SENT">WhatsApp Sent</option>
            <option value="ORDER_CREATE">Order Creation</option>
            <option value="CUSTOMER_CREATE">Customer Creation</option>
            <option value="SETTINGS_CHANGE">Settings Changed</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-[#E8EAF0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E8EAF0] text-[11px] font-extrabold uppercase tracking-wider text-[#6B7280]">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">User / Admin</th>
                <th className="py-4 px-6">Event Action</th>
                <th className="py-4 px-6">Activity Details</th>
                <th className="py-4 px-6">IP Address</th>
                <th className="py-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAF0] text-xs">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-mono text-slate-500 font-semibold">{log.timestamp}</td>
                  <td className="py-4 px-6">
                    <span className="font-extrabold text-[#111827] block">{log.userName}</span>
                    <span className="text-[11px] text-slate-400">{log.userEmail}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-blue-50 text-blue-700 font-extrabold text-[10px] px-2.5 py-1 rounded-md border border-blue-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-700 max-w-sm">{log.details}</td>
                  <td className="py-4 px-6 font-mono text-slate-500">{log.ipAddress}</td>
                  <td className="py-4 px-6 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      Success
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
