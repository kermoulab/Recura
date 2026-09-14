import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, Shield, Settings, Server, Users, Key, MonitorPlay, Save, X, ArrowLeft, Archive, DollarSign, Activity, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { Product, ProductCategory, DigitalAsset, FulfillmentType, Plan, Order } from '../../types/erp';
import { formatCurrency } from '../../utils/crypto';

interface ProductsViewProps {
  products: Product[];
  categories: ProductCategory[];
  assets: DigitalAsset[];
  plans: Plan[];
  orders: Order[];
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddPlan: (plan: Omit<Plan, 'id'>) => void;
  onUpdatePlan: (plan: Plan) => void;
  onDeletePlan: (id: string) => void;
  onAddAsset: (asset: Omit<DigitalAsset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateAsset: (asset: DigitalAsset) => void;
  onDeleteAsset: (id: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  categories,
  assets,
  plans,
  orders,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset
}) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    fulfillmentType: 'MANUAL',
    status: 'ACTIVE',
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsTab, setDetailsTab] = useState<'general' | 'plans' | 'inventory' | 'orders'>('general');

  // Plan form state
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<Plan>>({
    category: 'Other',
    price: 0,
    cost: 0,
    durationMonths: 1,
    
    maxDevices: 1,
    availableStock: 999
  });

  // Asset form state
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<DigitalAsset>>({
    status: 'AVAILABLE',
    capacity: 1,
    occupiedCapacity: 0
  });

  const getFulfillmentIcon = (type: FulfillmentType) => {
    switch (type) {
      case 'SHARED_ACCOUNT': return <Users className="w-4 h-4 text-blue-500" />;
      case 'DEDICATED_ACCOUNT': return <Shield className="w-4 h-4 text-purple-500" />;
      case 'LICENSE_KEY': return <Key className="w-4 h-4 text-amber-500" />;
      case 'SEAT': return <MonitorPlay className="w-4 h-4 text-emerald-500" />;
      default: return <Settings className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleSaveProduct = () => {
    onAddProduct(newProduct as any);
    setIsWizardOpen(false);
    setWizardStep(1);
    setNewProduct({ fulfillmentType: 'MANUAL', status: 'ACTIVE' });
  };

  if (selectedProduct) {
    const productPlans = plans.filter(p => p.productId === selectedProduct.id);
    const productAssets = assets.filter(a => a.productId === selectedProduct.id);
    const productOrders = orders.filter(o => o.productId === selectedProduct.id);

    return (
      <div className="p-8 space-y-6 bg-[#F5F7FA] min-h-[calc(100vh-72px)]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setSelectedProduct(null)} className="p-2 bg-white rounded-full shadow-xs border border-slate-200 hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-[#111827]">{selectedProduct.name}</h1>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${selectedProduct.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {selectedProduct.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">{categories.find(c => c.id === selectedProduct.categoryId)?.name || 'Uncategorized'} • {(selectedProduct.fulfillmentType || 'MANUAL').replace('_', ' ')}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          {(['general', 'plans', 'inventory', 'orders'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setDetailsTab(tab)}
              className={`px-6 py-3 font-bold text-sm uppercase tracking-wide transition-colors border-b-2 ${detailsTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#E8EAF0] min-h-[400px]">
          {detailsTab === 'general' && (
            <div className="max-w-2xl space-y-6">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2">General Information</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Name</label>
                  <input 
                    type="text" 
                    value={selectedProduct.name} 
                    onChange={e => onUpdateProduct({...selectedProduct, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select 
                    value={selectedProduct.status}
                    onChange={e => onUpdateProduct({...selectedProduct, status: e.target.value as any})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <textarea 
                    value={selectedProduct.description || ''}
                    onChange={e => onUpdateProduct({...selectedProduct, description: e.target.value})}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fulfillment Type</label>
                  <div className="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-semibold text-slate-500 flex items-center gap-2">
                    {getFulfillmentIcon(selectedProduct.fulfillmentType || 'MANUAL')}
                    {(selectedProduct.fulfillmentType || 'MANUAL').replace('_', ' ')}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Fulfillment logic is locked once configured to protect existing inventory relationships.</p>
                </div>
              </div>
            </div>
          )}

          {detailsTab === 'plans' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h2 className="text-lg font-bold text-slate-800">Subscription Plans</h2>
                <button onClick={() => setIsAddingPlan(!isAddingPlan)} className="bg-[#111827] text-white px-4 py-2 rounded-full text-xs font-bold shadow-xs hover:bg-black">
                  {isAddingPlan ? 'Cancel' : '+ Add Plan'}
                </button>
              </div>

              {isAddingPlan && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 space-y-4">
                  <h3 className="font-bold text-sm text-slate-700">New Plan Configuration</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Plan Name (e.g. Premium Monthly)</label>
                      <input type="text" value={newPlan.name || ''} onChange={e => setNewPlan({...newPlan, name: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price</label>
                      <input type="number" value={newPlan.price || 0} onChange={e => setNewPlan({...newPlan, price: Number(e.target.value)})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cost</label>
                      <input type="number" value={newPlan.cost || 0} onChange={e => setNewPlan({...newPlan, cost: Number(e.target.value)})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Months)</label>
                      <input type="number" value={newPlan.durationMonths || 1} onChange={e => setNewPlan({...newPlan, durationMonths: Number(e.target.value)})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={() => {
                      if (!newPlan.name) return;
                      onAddPlan({...newPlan as any, productId: selectedProduct.id});
                      setIsAddingPlan(false);
                      setNewPlan({category: 'Other', price: 0, cost: 0, durationMonths: 1,  maxDevices: 1, availableStock: 999});
                    }} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md">
                      Save Plan
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productPlans.length === 0 && !isAddingPlan ? (
                  <div className="col-span-full text-center py-8 text-slate-400">No plans linked to this product yet.</div>
                ) : productPlans.map(plan => (
                  <div key={plan.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800">{plan.name}</h4>
                      <button onClick={() => onDeletePlan(plan.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-slate-500 font-bold">Price</span>
                        <span className="font-extrabold text-green-600">{formatCurrency(plan.price, 'USD')}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] uppercase text-slate-500 font-bold">Duration</span>
                        <span className="font-bold text-slate-700">{plan.durationMonths} Months</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailsTab === 'inventory' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h2 className="text-lg font-bold text-slate-800">Digital Assets & Inventory</h2>
                <button onClick={() => setIsAddingAsset(!isAddingAsset)} className="bg-[#111827] text-white px-4 py-2 rounded-full text-xs font-bold shadow-xs hover:bg-black">
                  {isAddingAsset ? 'Cancel' : '+ Add Asset'}
                </button>
              </div>

              {isAddingAsset && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 space-y-4">
                  <h3 className="font-bold text-sm text-slate-700">Provision New Asset</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Identifier (License Key, Email, Link)</label>
                      <input type="text" value={newAsset.identifier || ''} onChange={e => setNewAsset({...newAsset, identifier: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Capacity</label>
                      <input type="number" value={newAsset.capacity || 1} onChange={e => setNewAsset({...newAsset, capacity: Number(e.target.value)})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                      <select value={newAsset.status || 'AVAILABLE'} onChange={e => setNewAsset({...newAsset, status: e.target.value as any})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none">
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="RESERVED">RESERVED</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={() => {
                      if (!newAsset.identifier) return;
                      onAddAsset({...newAsset as any, productId: selectedProduct.id, fulfillmentType: selectedProduct.fulfillmentType || 'MANUAL'});
                      setIsAddingAsset(false);
                      setNewAsset({status: 'AVAILABLE', capacity: 1, occupiedCapacity: 0});
                    }} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md">
                      Save Asset
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                      <th className="py-3 px-4">Identifier</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Capacity</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {productAssets.length === 0 && !isAddingAsset ? (
                      <tr><td colSpan={4} className="py-8 text-center text-slate-400">No digital assets in inventory.</td></tr>
                    ) : productAssets.map(asset => (
                      <tr key={asset.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-slate-700">{asset.identifier}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${asset.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">{asset.occupiedCapacity} / {asset.capacity}</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => onDeleteAsset(asset.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4 inline-block" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {detailsTab === 'orders' && (
            <div>
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-6">Active & Historical Orders</h2>
              <div className="bg-white border border-[#E8EAF0] rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {productOrders.length === 0 ? (
                      <tr><td colSpan={3} className="py-8 text-center text-slate-400">No orders found for this product.</td></tr>
                    ) : productOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-blue-600">#{order.orderNumber}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${order.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {order.expiryDate ? new Date(order.expiryDate).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-[#F5F7FA] min-h-[calc(100vh-72px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-[#E8EAF0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#111827]">Products & Fulfillment Catalog</h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Manage your generic digital products, subscription models, and fulfillment logic.
          </p>
        </div>
        <button
          onClick={() => setIsWizardOpen(true)}
          className="flex items-center gap-2 bg-[#111827] text-white hover:bg-black text-xs font-bold px-4 py-2.5 rounded-full shadow-xs transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Base Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-[#E8EAF0] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F5F7FA] border-b border-[#E8EAF0] text-[11px] font-extrabold uppercase tracking-wider text-[#6B7280]">
              <th className="py-4 px-6">Product</th>
              <th className="py-4 px-6">Category</th>
              <th className="py-4 px-6">Fulfillment Type</th>
              <th className="py-4 px-6">Linked Plans</th>
              <th className="py-4 px-6">Inventory Count</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8EAF0] text-xs">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-sm">No products found. Start by creating one.</p>
                </td>
              </tr>
            ) : (
              products.map((prod) => (
                <tr key={prod.id} onClick={() => setSelectedProduct(prod)} className="hover:bg-slate-50/80 transition-colors cursor-pointer">
                  <td className="py-4 px-6">
                    <span className="font-extrabold text-[#111827] block">{prod.name}</span>
                    <span className="text-[11px] text-slate-500 truncate block max-w-[200px]">{prod.description || 'No description'}</span>
                  </td>
                  <td className="py-4 px-6 text-slate-700">
                    {categories.find(c => c.id === prod.categoryId)?.name || 'Uncategorized'}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {getFulfillmentIcon(prod.fulfillmentType || 'MANUAL')}
                      {(prod.fulfillmentType || 'MANUAL').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-700">
                    {plans.filter(p => p.productId === prod.id).length} Plans
                  </td>
                  <td className="py-4 px-6 text-slate-700 font-mono">
                    {assets.filter(a => a.productId === prod.id).length} Assets
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={(e) => { e.stopPropagation(); onDeleteProduct(prod.id); }} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal (Replaced empty mockup wizard with immediate save) */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="font-extrabold text-lg text-slate-800">New Product Setup</h2>
                <p className="text-xs text-slate-500 font-medium">Define the base product and fulfillment logic</p>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {wizardStep === 1 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Product Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. ChatGPT, Microsoft 365, ExpressVPN"
                      value={newProduct.name || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Category</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categories.map((cat) => (
                        <div 
                          key={cat.id}
                          onClick={() => setNewProduct({...newProduct, categoryId: cat.id})}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${newProduct.categoryId === cat.id ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                        >
                          <p className="font-bold text-xs text-[#111827]">{cat.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Description (Optional)</label>
                    <textarea
                      placeholder="Brief description of the service..."
                      value={newProduct.description || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-amber-800">Critical Architecture Decision</h4>
                      <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">
                        The fulfillment type determines how inventory is assigned when an order is placed. 
                        <strong> This cannot be changed later once assets are attached.</strong>
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Select Fulfillment Logic</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['SHARED_ACCOUNT', 'DEDICATED_ACCOUNT', 'LICENSE_KEY', 'ACTIVATION_CODE', 'SEAT', 'MANUAL'].map(ft => (
                        <div 
                          key={ft}
                          onClick={() => setNewProduct({...newProduct, fulfillmentType: ft as any})}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${newProduct.fulfillmentType === ft ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                        >
                          {getFulfillmentIcon(ft as any)}
                          <p className="font-bold text-xs text-[#111827]">{ft.replace('_', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                {wizardStep > 1 && (
                  <button onClick={() => setWizardStep(wizardStep - 1)} className="text-xs font-bold text-slate-500 hover:text-slate-800">
                    ? Back
                  </button>
                )}
              </div>
              
              {wizardStep === 1 ? (
                <button
                  disabled={!newProduct.name}
                  onClick={() => setWizardStep(2)}
                  className="flex items-center gap-2 bg-[#111827] text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Continue to Fulfillment <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSaveProduct}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                >
                  <Save className="w-4 h-4" /> Save Base Product
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


