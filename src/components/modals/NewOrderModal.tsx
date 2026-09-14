import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Lock, Calendar, User, Package, KeyRound, AlertCircle, Server, Layers } from 'lucide-react';
import { Customer, Plan, Order, SubscriptionStatus, ServiceAccount, Product, DigitalAsset, FulfillmentType } from '../../types/erp';
import { simulateEncrypt, simulateDecrypt, calculateDaysRemaining, formatCurrency, isEncryptedValue } from '../../utils/crypto';
import { sanitizeInput, validateEmail, stripControlCharacters } from '../../utils/security';
import { getEffectiveAccountStatus, getNextFreeProfileNumber, getOccupancy } from '../../utils/serviceAccounts';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  plans: Plan[];
  serviceAccounts?: ServiceAccount[];
  orders?: Order[];
  products?: Product[];
  assets?: DigitalAsset[];
  currency?: string;
  preselectedAccountId?: string;
  onSubmit: (orderData: Omit<Order, 'id'>) => void;
  initialData?: Order | null;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  customers,
  plans,
  serviceAccounts = [],
  orders = [],
  products = [],
  assets = [],
  currency = 'USD ($)',
  preselectedAccountId,
  onSubmit,
  initialData,
}) => {
  if (!isOpen) return null;

  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType | 'LEGACY'>('LEGACY');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [profileNumber, setProfileNumber] = useState<string>('');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');

  const [price, setPrice] = useState(0);
  const [durationMonths, setDurationMonths] = useState(1);

  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState('');

  const [accountEmail, setAccountEmail] = useState('');
  const [rawPassword, setRawPassword] = useState('');
  const [rawPin, setRawPin] = useState('');
  const [screenProfileName, setScreenProfileName] = useState('Profile 1');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus>('ACTIVE');
  const [error, setError] = useState<string | null>(null);

  // Sync state with initialData when editing
  useEffect(() => {
    if (initialData) {
      setSelectedCustomerId(initialData.customerId);
      setSelectedProductId(initialData.productId || '');
      setSelectedPlanId(initialData.planId);
      setPrice(initialData.price);
      setDurationMonths(initialData.durationMonths);
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate);
      setAccountEmail(initialData.accountEmail || '');
      setStatus(initialData.status);
      setNotes(initialData.notes || '');

      if (initialData.productId) {
        const prod = products.find(p => p.id === initialData.productId);
        if (prod) setFulfillmentType(prod.fulfillmentType || 'MANUAL');
      }

      if (initialData.serviceAccountId) setSelectedAccountId(initialData.serviceAccountId);
      if (initialData.profileNumber) setProfileNumber(initialData.profileNumber.toString());
      if (initialData.digitalAssetId) setSelectedAssetId(initialData.digitalAssetId);
      if (initialData.screenProfileName) setScreenProfileName(initialData.screenProfileName);

      if (initialData.accountPasswordEncrypted) {
        simulateDecrypt(initialData.accountPasswordEncrypted).then((v) => {
          if (!isEncryptedValue(v)) setRawPassword(v);
        });
      }
      if (initialData.pinCodeEncrypted) {
        simulateDecrypt(initialData.pinCodeEncrypted).then((v) => {
          if (!isEncryptedValue(v)) setRawPin(v);
        });
      }
    } else {
      setSelectedCustomerId(customers[0]?.id || '');
      setSelectedProductId('');
      setSelectedPlanId('');
      setFulfillmentType('LEGACY');
      setSelectedAccountId(preselectedAccountId || '');
      setProfileNumber('');
      setSelectedAssetId('');
      setPrice(0);
      setDurationMonths(1);
      setStartDate(todayStr);
      setEndDate('');
      setAccountEmail('');
      setRawPassword('');
      setRawPin('');
      setScreenProfileName('Profile 1');
      setStatus('ACTIVE');
      setNotes('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen]);

  // Update plans available based on selected product
  const availablePlans = selectedProductId 
    ? plans.filter(p => p.productId === selectedProductId)
    : plans.filter(p => !p.productId); // Legacy plans

  useEffect(() => {
    if (!initialData && availablePlans.length > 0 && !availablePlans.find(p => p.id === selectedPlanId)) {
      setSelectedPlanId(availablePlans[0].id);
    }
  }, [selectedProductId, availablePlans, selectedPlanId, initialData]);

  // Product selection effect
  useEffect(() => {
    if (!initialData && selectedProductId) {
      const prod = products.find(p => p.id === selectedProductId);
      if (prod) {
        setFulfillmentType(prod.fulfillmentType || 'MANUAL');
      }
    } else if (!initialData && !selectedProductId) {
      setFulfillmentType('LEGACY');
    }
  }, [selectedProductId, products, initialData]);

  // Auto-fill Account Email + Password for SHARED/LEGACY
  useEffect(() => {
    if (fulfillmentType === 'SHARED_ACCOUNT' || fulfillmentType === 'LEGACY') {
      const account = serviceAccounts.find((a) => a.id === selectedAccountId);
      if (account) {
        setAccountEmail(account.email);
        if (account.passwordEncrypted) {
          simulateDecrypt(account.passwordEncrypted).then((v) => {
            if (!isEncryptedValue(v)) setRawPassword(v);
          });
        } else {
          setRawPassword('');
        }
      } else if (!initialData) {
        setAccountEmail('');
        setRawPassword('');
      }
    }
  }, [selectedAccountId, fulfillmentType, serviceAccounts, initialData]);

  // Auto-fill Profile Name
  useEffect(() => {
    if (initialData) return;
    if ((fulfillmentType === 'SHARED_ACCOUNT' || fulfillmentType === 'LEGACY') && selectedAccountId && profileNumber) {
      const p = Number(profileNumber);
      if (p && Number.isInteger(p)) {
        setScreenProfileName(`Profile ${p}`);
      }
    } else if (!initialData) {
      setScreenProfileName('Profile 1');
    }
  }, [selectedAccountId, profileNumber, initialData, fulfillmentType]);

  // Auto-calculate price, duration & end date
  useEffect(() => {
    if (!initialData) {
      const plan = plans.find((p) => p.id === selectedPlanId);
      if (plan) {
        setPrice(plan.price);
        setDurationMonths(plan.durationMonths || (plan as any).duration/30 || 1); // rough fallback

        if (startDate) {
          const start = new Date(startDate);
          // If the plan has exact days `duration`, use it, else months.
          const exactDays = (plan as any).duration;
          if (exactDays) {
             start.setDate(start.getDate() + exactDays);
          } else {
             start.setMonth(start.getMonth() + (plan.durationMonths || 1));
          }
          setEndDate(start.toISOString().split('T')[0]);
        }
      }
    } else if (startDate && durationMonths) {
      const start = new Date(startDate);
      start.setMonth(start.getMonth() + durationMonths);
      setEndDate(start.toISOString().split('T')[0]);
    }
  }, [selectedPlanId, startDate, durationMonths, initialData, plans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }
    if (!selectedPlanId) {
      setError('Please select a plan.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start and End dates are required.');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);
    const plan = plans.find((p) => p.id === selectedPlanId);

    if (!customer || !plan) {
      setError('Invalid customer or plan selection.');
      return;
    }

    // Required constraints checks based on fulfillment
    if (fulfillmentType === 'SHARED_ACCOUNT' || fulfillmentType === 'LEGACY') {
      if (!selectedAccountId) {
        setError('A service account is required for this product type.');
        return;
      }
      if (!accountEmail || !rawPassword) {
        setError('Account Email and Password are required for shared service accounts.');
        return;
      }
      // Duplicate profile check (only on new orders)
      if (!initialData && selectedAccountId && profileNumber) {
        const pNum = Number(profileNumber);
        const existingOrder = orders.find(
          (o) => o.serviceAccountId === selectedAccountId && o.profileNumber === pNum && o.status !== 'EXPIRED'
        );
        if (existingOrder) {
          setError(`Profile ${pNum} is already occupied on this account! Please select another profile.`);
          return;
        }
      }
    } else if (fulfillmentType === 'LICENSE_KEY' || fulfillmentType === 'DEDICATED_ACCOUNT' || fulfillmentType === 'ACTIVATION_CODE' || fulfillmentType === 'SEAT') {
      if (!selectedAssetId && fulfillmentType !== 'MANUAL') {
        setError('A digital asset is required for this product type.');
        return;
      }
      // Digital Assets don't strictly require accountEmail/password according to DB, but we'll send defaults.
    }

    try {
      const orderData: Omit<Order, 'id'> = {
        customerId: customer.id,
        customerName: customer.fullName,
        customerWhatsApp: customer.whatsappNumber,
        productId: selectedProductId || undefined,
        digitalAssetId: selectedAssetId || undefined,
        fulfillmentType: fulfillmentType === 'LEGACY' ? undefined : fulfillmentType,
        planId: plan.id,
        planName: plan.name,
        price,
        durationMonths,
        startDate,
        endDate,
        status,
        serviceAccountId: (fulfillmentType === 'SHARED_ACCOUNT' || fulfillmentType === 'LEGACY') ? selectedAccountId : undefined,
        profileNumber: (fulfillmentType === 'SHARED_ACCOUNT' || fulfillmentType === 'LEGACY') ? Number(profileNumber) : undefined,
        screenProfileName: (fulfillmentType === 'SHARED_ACCOUNT' || fulfillmentType === 'LEGACY') ? screenProfileName : undefined,
        accountEmail: accountEmail || '-',
        accountPasswordEncrypted: rawPassword ? await simulateEncrypt(rawPassword) : '-',
        pinCodeEncrypted: rawPin ? await simulateEncrypt(rawPin) : undefined,
        notes,
      };

      onSubmit(orderData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to prepare order data.');
    }
  };

  const selectedAccount = serviceAccounts.find((a) => a.id === selectedAccountId);
  
  // Available assets for generic products
  const availableAssets = selectedProductId ? assets.filter(a => a.productId === selectedProductId && a.status === 'AVAILABLE') : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              {initialData ? 'Edit Order' : 'Create New Order'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-600 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Customer</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:border-blue-500"
                disabled={!!initialData}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.whatsappNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Product Selection */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Product</label>
              <div className="relative">
                <Package className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:border-blue-500"
                  disabled={!!initialData}
                >
                  <option value="">-- Legacy / Uncategorized --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Subscription Plan</label>
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-[#E8EAF0] rounded-xl font-medium focus:outline-none focus:border-blue-500"
                >
                  {availablePlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {formatCurrency(p.price, currency)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Fulfillment Section */}
          <div className="p-4 bg-slate-50 border border-[#E8EAF0] rounded-2xl space-y-4">
            <span className="font-extrabold text-slate-600 text-[11px] uppercase tracking-wider block mb-2 border-b border-slate-200 pb-2">
              Fulfillment: {fulfillmentType.replace('_', ' ')}
            </span>

            {(fulfillmentType === 'SHARED_ACCOUNT' || fulfillmentType === 'LEGACY') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Service Account</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => {
                      setSelectedAccountId(e.target.value);
                      if (!initialData) {
                        const acc = serviceAccounts.find(a => a.id === e.target.value);
                        if (acc) setProfileNumber(getNextFreeProfileNumber(acc, orders).toString());
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
                  >
                    <option value="">-- Not Linked --</option>
                    {serviceAccounts.map((acc) => {
                      const occupancy = getOccupancy(acc, orders);
                      return (
                        <option key={acc.id} value={acc.id}>
                          {acc.serviceType} - {acc.email} - {occupancy.used}/{acc.capacity} used
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Profile Number</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Auto-suggested"
                    value={profileNumber}
                    onChange={(e) => setProfileNumber(e.target.value)}
                    disabled={!selectedAccountId}
                    className="w-full px-3 py-2 bg-white border border-[#E8EAF0] rounded-xl font-medium focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>
            )}

            {(fulfillmentType === 'LICENSE_KEY' || fulfillmentType === 'DEDICATED_ACCOUNT' || fulfillmentType === 'ACTIVATION_CODE' || fulfillmentType === 'SEAT') && (
              <div>
                <label className="block text-slate-700 font-bold mb-1">Assign Digital Asset / Inventory</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8EAF0] rounded-xl font-medium focus:outline-none"
                >
                  <option value="">-- Select Available Asset --</option>
                  {availableAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.identifier} (Capacity: {asset.capacity - asset.occupiedCapacity} remaining)
                    </option>
                  ))}
                  {initialData && initialData.digitalAssetId && !availableAssets.find(a => a.id === initialData.digitalAssetId) && (
                    <option value={initialData.digitalAssetId}>
                      [Current Assigned Asset]
                    </option>
                  )}
                </select>
                {availableAssets.length === 0 && !initialData && (
                  <p className="text-red-500 text-[10px] mt-1 font-bold">No available assets for this product in inventory!</p>
                )}
              </div>
            )}

            {fulfillmentType === 'MANUAL' && (
              <p className="text-slate-500 text-sm italic">This product uses manual fulfillment. No asset assignment required during order creation.</p>
            )}
          </div>

          {/* Auto Calculation Preview */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
            <div>
              <span className="text-[10px] text-blue-700 font-bold uppercase block">Final Price</span>
              <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full bg-transparent text-base font-black text-[#111827] outline-none border-b border-blue-200" />
            </div>
            <div>
              <span className="text-[10px] text-blue-700 font-bold uppercase block">Start Date</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-transparent text-sm font-black text-[#111827] outline-none border-b border-blue-200" />
            </div>
            <div>
              <span className="text-[10px] text-blue-700 font-bold uppercase block">End Date</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-transparent text-sm font-black text-[#111827] outline-none border-b border-blue-200" />
            </div>
          </div>

          {/* Legacy Account Credentials Details */}
          {(fulfillmentType === 'SHARED_ACCOUNT' || fulfillmentType === 'LEGACY') && (
            <div className="p-4 bg-[#F8FAFC] border border-[#E8EAF0] rounded-2xl space-y-3">
              <span className="font-extrabold text-blue-600 text-[11px] block flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-blue-600" /> Legacy Credentials
              </span>
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Account Email *</label>
                <input type="email" required value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#E8EAF0] rounded-xl font-mono focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Password *</label>
                  <input type="password" required value={rawPassword} onChange={(e) => setRawPassword(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#E8EAF0] rounded-xl font-mono focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Profile PIN</label>
                  <input type="text" value={rawPin} onChange={(e) => setRawPin(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#E8EAF0] rounded-xl font-mono focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Screen / Profile Name</label>
                <input type="text" value={screenProfileName} onChange={(e) => setScreenProfileName(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#E8EAF0] rounded-xl focus:outline-none" />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Order Notes / Manual Delivery Info</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E8EAF0] rounded-xl focus:outline-none" rows={2} />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <select value={status} onChange={e => setStatus(e.target.value as any)} className="bg-slate-100 border border-slate-200 text-xs font-bold px-3 py-2 rounded-lg outline-none">
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING">PENDING</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-bold hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-full bg-[#4A90FF] text-white font-bold hover:opacity-85 shadow-md active:scale-95 cursor-pointer">
                {initialData ? 'Save Changes' : 'Provision Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
