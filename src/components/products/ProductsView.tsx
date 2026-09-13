import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, Shield, Settings, Server, Users, Key, MonitorPlay, AlertTriangle, ArrowRight, Save, X } from 'lucide-react';
import { Product, ProductCategory, DigitalAsset, FulfillmentType, Plan } from '../../types/erp';

interface ProductsViewProps {
  products: Product[];
  categories: ProductCategory[];
  assets: DigitalAsset[];
  plans: Plan[];
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  categories,
  assets,
  plans,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    fulfillmentType: 'MANUAL',
    status: 'ACTIVE',
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
          <span>New Product Wizard</span>
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
                <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-extrabold text-[#111827] block">{prod.name}</span>
                    <span className="text-[11px] text-slate-500">{prod.description || 'No description'}</span>
                  </td>
                  <td className="py-4 px-6 text-slate-700">
                    {categories.find(c => c.id === prod.categoryId)?.name || 'Uncategorized'}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {getFulfillmentIcon(prod.fulfillmentType)}
                      {prod.fulfillmentType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-700">
                    {plans.filter(p => p.productId === prod.id).length} Plans
                  </td>
                  <td className="py-4 px-6 text-slate-700 font-mono">
                    {assets.filter(a => a.productId === prod.id).length} Assets
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeleteProduct(prod.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Product Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E8EAF0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-extrabold text-[#111827]">New Product Setup Wizard</h2>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center gap-4 mb-8">
                {[1, 2, 3, 4, 5, 6].map((step) => (
                  <div key={step} className={`flex-1 h-2 rounded-full ${wizardStep >= step ? 'bg-blue-600' : 'bg-slate-100'}`} />
                ))}
              </div>

              {wizardStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <h3 className="font-bold text-[#111827] text-base border-b pb-2">Step 1: Product Definition</h3>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-1">Product Name</label>
                    <input 
                      type="text" 
                      value={newProduct.name || ''} 
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="e.g. Netflix, Microsoft 365, Canva Pro" 
                      className="w-full px-4 py-2 bg-[#F5F7FA] border rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-1">Category</label>
                    <select
                      value={newProduct.categoryId || ''}
                      onChange={(e) => setNewProduct({...newProduct, categoryId: e.target.value})}
                      className="w-full px-4 py-2 bg-[#F5F7FA] border rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select Category...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <h3 className="font-bold text-[#111827] text-base border-b pb-2">Step 2: Fulfillment Logic</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['SHARED_ACCOUNT', 'DEDICATED_ACCOUNT', 'PROFILE', 'SEAT', 'INVITATION', 'LICENSE_KEY', 'MANUAL'].map(ft => (
                      <div 
                        key={ft}
                        onClick={() => setNewProduct({...newProduct, fulfillmentType: ft as any})}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${newProduct.fulfillmentType === ft ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                      >
                        <p className="font-bold text-xs text-[#111827]">{ft.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep > 2 && wizardStep < 6 && (
                <div className="text-center py-12 animate-in fade-in slide-in-from-right-4">
                  <Server className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-700">Wizard Configuration Mockup</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2">
                    Plans, Inventory, and Alerts configuration will be linked after the base product is saved. 
                  </p>
                </div>
              )}

              {wizardStep === 6 && (
                <div className="text-center py-12 animate-in fade-in slide-in-from-right-4">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-800 text-lg">Ready to Save</h3>
                  <p className="text-xs text-slate-500 mt-2">Please confirm the generic product details before committing to the database.</p>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E8EAF0] bg-slate-50 flex items-center justify-between">
              <button 
                disabled={wizardStep === 1}
                onClick={() => setWizardStep(wizardStep - 1)}
                className="px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-50"
              >
                Back
              </button>
              
              {wizardStep < 6 ? (
                <button 
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full text-xs font-bold flex items-center gap-2 hover:bg-blue-700"
                >
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button 
                  onClick={handleSaveProduct}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-full text-xs font-bold flex items-center gap-2 hover:bg-emerald-700"
                >
                  <Save className="w-3.5 h-3.5" /> Save Product
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

