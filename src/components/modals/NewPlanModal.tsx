import React, { useState } from 'react';
import { X, Package, DollarSign, Calendar, Layers, AlertCircle } from 'lucide-react';
import { Plan } from '../../types/erp';
import { sanitizeInput } from '../../utils/security';
import { getCurrencyRate } from '../../utils/crypto';

interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (planData: Omit<Plan, 'id' | 'activeOrders'>) => void;
  currency?: string;
  initialData?: Plan | null;
}

export const NewPlanModal: React.FC<NewPlanModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currency = 'USD ($)',
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<Plan['category']>(initialData?.category || 'Netflix');
  const [price, setPrice] = useState(initialData?.price || 10);
  const [priceInput, setPriceInput] = useState(initialData?.price ? String(initialData.price) : '');
  const [durationMonths, setDurationMonths] = useState(initialData?.durationMonths || 1);
  const [availableStock, setAvailableStock] = useState(initialData?.availableStock || 15);
  const [totalAccounts, setTotalAccounts] = useState(initialData?.totalAccounts || 20);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [error, setError] = useState<string | null>(null);

  // Reset the form whenever the modal opens so edit mode shows the current plan
  // and add mode always starts fresh. Prices are stored in USD (base) and shown
  // in the currently selected display currency, so convert on open.
  React.useEffect(() => {
    if (isOpen) {
      const rate = getCurrencyRate(currency);
      const displayPrice = initialData?.price ? Math.round(initialData.price * rate * 100) / 100 : 10;
      setName(initialData?.name || '');
      setCategory(initialData?.category || 'Netflix');
      setPrice(displayPrice);
      setPriceInput(String(displayPrice));
      setDurationMonths(initialData?.durationMonths || 1);
      setAvailableStock(initialData?.availableStock || 15);
      setTotalAccounts(initialData?.totalAccounts || 20);
      setNotes(initialData?.notes || '');
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Accept only digits and a single decimal point typed via keyboard
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    let cleaned = raw;
    if (raw.includes('.')) {
      const [intPart, ...rest] = raw.split('.');
      cleaned = `${intPart}.${rest.join('').replace(/\./g, '')}`;
    }
    setPriceInput(cleaned);
    const parsed = parseFloat(cleaned);
    setPrice(isNaN(parsed) ? 0 : parsed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = sanitizeInput(name, { maxLen: 100, allowSpaces: true });
    const cleanNotes = sanitizeInput(notes, { maxLen: 500, allowSpaces: true, preserveNewlines: true });

    if (!cleanName) {
      setError('Plan Name is required.');
      return;
    }

    if (isNaN(price) || price <= 0) {
      setError('Plan Price must be a positive amount.');
      return;
    }

    if (isNaN(durationMonths) || durationMonths < 1 || durationMonths > 60) {
      setError('Duration must be between 1 and 60 months.');
      return;
    }

    if (isNaN(availableStock) || availableStock < 0) {
      setError('Available Stock cannot be negative.');
      return;
    }

    // Convert the typed display-currency price to the USD base for storage
    const priceInUsd = Math.round((price / getCurrencyRate(currency)) * 100) / 100;

    onSubmit({
      name: cleanName,
      category,
      price: priceInUsd,
      durationMonths: Number(durationMonths),
      availableStock: Number(availableStock),
      totalAccounts: Number(totalAccounts || availableStock),
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
            <Package className="w-5 h-5 text-purple-600" />
            <h3 className="font-extrabold text-base text-[#111827]">
              {initialData ? 'Edit Plan' : 'Create New Service Plan'}
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
            <label className="block text-slate-700 font-bold mb-1">Plan Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Netflix 4K UHD - 1 Screen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
              >
                <option value="Netflix">Netflix</option>
                <option value="Disney+">Disney+</option>
                <option value="Prime Video">Prime Video</option>
                <option value="Spotify">Spotify</option>
                <option value="IPTV">IPTV</option>
                <option value="YouTube Premium">YouTube Premium</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Price ({currency}) *</label>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="0.00"
                value={priceInput}
                onChange={handlePriceChange}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Duration (Months) *</label>
              <input
                type="number"
                min="1"
                max="36"
                required
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4A90FF]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Available Stock Pool</label>
              <input
                type="number"
                min="0"
                value={availableStock}
                onChange={(e) => setAvailableStock(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Plan Description / Credentials Info</label>
            <textarea
              rows={2}
              placeholder="Private screen PIN lock included..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-[#F5F7FA] border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
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
              {initialData ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
