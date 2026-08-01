import React, { useState } from 'react';
import {
  Bell,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Globe,
  Send,
  CheckSquare,
  Square,
  Copy,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Order, Language, WhatsAppTemplate } from '../../types/erp';
import { renderWhatsAppMessage, createWhatsAppWebUrl, DEFAULT_WHATSAPP_TEMPLATES } from '../../utils/whatsapp';

interface AlertsViewProps {
  orders: Order[];
  templates?: Record<Language, WhatsAppTemplate>;
  onMarkContacted: (orderId: string) => void;
  onBulkMarkContacted: (orderIds: string[]) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  orders,
  templates = DEFAULT_WHATSAPP_TEMPLATES,
  onMarkContacted,
  onBulkMarkContacted,
}) => {
  const [activeTab, setActiveTab] = useState<'3d' | '7d' | 'expired'>('3d');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('AR');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [activeMessagePreview, setActiveMessagePreview] = useState<string | null>(null);

  // Filter orders according to tab (contacted orders no longer count as alerts)
  const expiring3DaysOrders = orders.filter((o) => o.status === 'EXPIRING_3D' && !o.contactedForRenewal);
  const expiring7DaysOrders = orders.filter((o) => o.status === 'EXPIRING_7D' && !o.contactedForRenewal);
  const expiredOrders = orders.filter((o) => o.status === 'EXPIRED' && !o.contactedForRenewal);

  const currentTabOrders =
    activeTab === '3d'
      ? expiring3DaysOrders
      : activeTab === '7d'
      ? expiring7DaysOrders
      : expiredOrders;

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === currentTabOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(currentTabOrders.map((o) => o.id));
    }
  };

  const handleBulkMarkContacted = () => {
    onBulkMarkContacted(selectedOrderIds);
    setSelectedOrderIds([]);
  };

  return (
    <div id="subly-alerts-view" className="p-8 space-y-6 bg-[#F5F7FA] min-h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#111827]">
              Multi-Language WhatsApp Renewal Center
            </h1>
            <span className="bg-rose-50 text-rose-600 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
              {expiring3DaysOrders.length + expiredOrders.length} Urgent Alerts
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Automated multi-language renewal message generator (Arabic, French, English) with 1-click wa.me web links.
          </p>
        </div>

        {/* Global Language Selector */}
        <div className="flex items-center gap-2 bg-[#F5F7FA] p-1.5 rounded-full border border-[#E8EAF0]">
          <Globe className="w-4 h-4 text-slate-400 ml-2" />
          {(['AR', 'FR', 'EN'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                selectedLanguage === lang
                  ? 'bg-[#4A90FF] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {lang === 'AR' ? 'العربية (AR)' : lang === 'FR' ? 'Français (FR)' : 'English (EN)'}
            </button>
          ))}
        </div>
      </div>

      {/* Expiration Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('3d');
              setSelectedOrderIds([]);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === '3d'
                ? 'bg-[#4A90FF] hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 border border-[#E8EAF0]'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${activeTab === '3d' ? 'text-white' : 'text-rose-600'}`} />
            <span>Expiring in 3 Days ({expiring3DaysOrders.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('7d');
              setSelectedOrderIds([]);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === '7d'
                ? 'bg-[#4A90FF] hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 border border-[#E8EAF0]'
            }`}
          >
            <Clock className={`w-4 h-4 ${activeTab === '7d' ? 'text-white' : 'text-amber-600'}`} />
            <span>Expiring in 7 Days ({expiring7DaysOrders.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('expired');
              setSelectedOrderIds([]);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'expired'
                ? 'bg-[#4A90FF] hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 border border-[#E8EAF0]'
            }`}
          >
            <Bell className={`w-4 h-4 ${activeTab === 'expired' ? 'text-white' : 'text-slate-600'}`} />
            <span>Expired Subscriptions ({expiredOrders.length})</span>
          </button>
        </div>

        {/* Bulk Action Controls */}
        {selectedOrderIds.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 p-2 rounded-2xl animate-in fade-in duration-200">
            <span className="text-xs font-bold text-blue-900 px-2">
              {selectedOrderIds.length} Selected
            </span>
            <button
              onClick={handleBulkMarkContacted}
              className="bg-[#4A90FF] text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-blue-600 transition-colors"
            >
              Mark Selected Contacted
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-[#E8EAF0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E8EAF0] text-[11px] font-extrabold uppercase tracking-wider text-[#6B7280]">
                <th className="py-4 px-4 w-10">
                  <button onClick={toggleSelectAll} className="p-1">
                    {selectedOrderIds.length > 0 &&
                    selectedOrderIds.length === currentTabOrders.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-4 px-4">Order & Customer</th>
                <th className="py-4 px-4">Plan</th>
                <th className="py-4 px-4">Expiration Date</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">WhatsApp Message Preview</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAF0] text-xs">
              {currentTabOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                    <p className="font-semibold text-sm">No accounts pending in this category!</p>
                  </td>
                </tr>
              ) : (
                currentTabOrders.map((ord) => {
                  const isSelected = selectedOrderIds.includes(ord.id);

                  // Render template according to language & status
                  const rawTemplate =
                    activeTab === 'expired'
                      ? templates[selectedLanguage].expired
                      : templates[selectedLanguage].expiring3Days;

                  const compiledMessage = renderWhatsAppMessage(rawTemplate, {
                    name: ord.customerName,
                    plan: ord.planName,
                    date: ord.endDate,
                  });

                  const waUrl = createWhatsAppWebUrl(ord.customerWhatsApp, compiledMessage);

                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <button onClick={() => toggleSelectOrder(ord.id)} className="p-1">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>

                      <td className="py-4 px-4">
                        <div>
                          <span className="font-extrabold text-[#111827] block">{ord.customerName}</span>
                          <span className="text-[11px] text-emerald-600 font-bold">{ord.customerWhatsApp}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-800">{ord.planName}</td>

                      <td className="py-4 px-4 font-mono font-extrabold text-[#111827]">{ord.endDate}</td>

                      <td className="py-4 px-4">
                        {ord.contactedForRenewal ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                            ✓ Contacted ({ord.contactedAt || 'Today'})
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
                            Pending Notice
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 max-w-xs">
                        <div
                          dir={selectedLanguage === 'AR' ? 'rtl' : 'ltr'}
                          className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-700 line-clamp-2 leading-relaxed"
                          title={compiledMessage}
                        >
                          {compiledMessage}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => onMarkContacted(ord.id)}
                            className="inline-flex items-center gap-1 bg-[#25D366] hover:bg-[#22c55e] hover:opacity-90 text-white font-extrabold px-3 py-1.5 rounded-full text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send WhatsApp</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </a>

                          {!ord.contactedForRenewal && (
                            <button
                              onClick={() => onMarkContacted(ord.id)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Mark as Contacted"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
