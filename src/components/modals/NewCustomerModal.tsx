import React, { useEffect, useState } from 'react';
import { X, UserPlus, Phone, Mail, Globe, FileText, ShieldCheck, AlertCircle } from 'lucide-react';
import { Customer, CustomerStatus, Language } from '../../types/erp';
import { sanitizeInput, validateEmail, stripControlCharacters } from '../../utils/security';
import { cleanWhatsAppNumber } from '../../utils/whatsapp';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customerData: Omit<Customer, 'id' | 'registrationDate' | 'ordersCount' | 'totalSpent'>) => void;
  initialData?: Customer | null;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [status, setStatus] = useState<CustomerStatus>(initialData?.status || 'ACTIVE');
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(
    initialData?.preferredLanguage || 'AR'
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialData?.name || '');
    setWhatsapp(initialData?.whatsapp || '');
    setEmail(initialData?.email || '');
    setStatus(initialData?.status || 'ACTIVE');
    setPreferredLanguage(initialData?.preferredLanguage || 'AR');
    setNotes(initialData?.notes || '');
    setError(null);
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = sanitizeInput(name, { maxLen: 100, allowSpaces: true });
    const cleanPhone = cleanWhatsAppNumber(whatsapp);
    const cleanNotes = sanitizeInput(notes, { maxLen: 500, allowSpaces: true, preserveNewlines: true });

    if (!cleanName) {
      setError('Customer Full Name is required.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 6) {
      setError('Please enter a valid WhatsApp phone number with country code.');
      return;
    }

    let cleanEmailAddress = '';
    if (email.trim()) {
      const emailCheck = validateEmail(email);
      if (!emailCheck.isValid) {
        setError(emailCheck.error || 'Invalid email address format.');
        return;
      }
      cleanEmailAddress = emailCheck.clean;
    }

    onSubmit({
      name: cleanName,
      whatsapp: `+${cleanPhone}`,
      email: cleanEmailAddress || undefined,
      preferredLanguage,
      status,
      notes: cleanNotes,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8EAF0] space-y-6 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-base text-[#111827]">
              {initialData ? 'Edit Customer' : 'Add New Customer'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-600 text-white border border-red-700 rounded-2xl text-xs flex items-center gap-2.5 font-extrabold shadow-md animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
            <div>
              <p className="font-extrabold text-white tracking-wide">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Karim Mansouri"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] text-[#111827] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">WhatsApp Number (with country code) *</label>
            <input
              type="text"
              required
              placeholder="e.g. +212661234567"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] text-[#111827] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Email Address (Optional)</label>
            <input
              type="email"
              placeholder="e.g. karim@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] text-[#111827] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Communication Language</label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as Language)}
              className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] text-[#111827] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
            >
              <option value="AR">العربية (AR)</option>
              <option value="FR">Français (FR)</option>
              <option value="EN">English (EN)</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Used for the WhatsApp renewal &amp; thanks messages sent to this customer.
            </p>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Customer Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CustomerStatus)}
              className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] text-[#111827] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="BLOCKED">Blocked</option>
              <option value="VIP">VIP</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Notes / Preferences</label>
            <textarea
              rows={2}
              placeholder="VIP status, IPTV preferences..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-[#F5F7FA] border border-[#E8EAF0] text-[#111827] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#111827] text-white font-bold hover:opacity-85 transition-opacity duration-200 active:scale-95 cursor-pointer shadow-xs"
            >
              {initialData ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
