"use client";
import React, { useRef, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, UploadCloud, DownloadCloud, GripVertical } from 'lucide-react';
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableTableRow: React.FC<{
  id: string;
  disabled: boolean;
  children: React.ReactNode;
}> = ({ id, disabled, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { zIndex: 50, position: 'relative' as any, backgroundColor: 'white', opacity: 0.9, boxShadow: '0 5px 15px rgba(0,0,0,0.1)' } : {})
  };
  return (
    <tr ref={setNodeRef} style={style} className={`hover:bg-slate-50/80 transition-colors ${isDragging ? 'shadow-lg' : ''}`}>
      <td className="p-4 pl-6 w-10">
        <div {...(disabled ? {} : { ...attributes, ...listeners })} className={`p-1.5 rounded-lg shrink-0 ${!disabled ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-grab active:cursor-grabbing' : 'text-slate-200 cursor-not-allowed'}`}>
          <GripVertical className="w-4 h-4" />
        </div>
      </td>
      {children}
    </tr>
  );
};

import { useStore } from '../../../../context/StoreContext';
import { useToast } from '../../../../context/ToastContext';
import { Product } from '../../../../types';
import { api, API_BASE_URL, getLastApiError } from '../../../../services/api';

import { formatPrice } from '../../../../utils/formatters';
import { getSafeImageSrc } from '../../../../utils/images';
import { formatProductAgeGroups } from '../../../../utils/products';
import { useDialog } from '../../../../context/DialogContext';

export const AdminProductsPageClient: React.FC = () => {
  const { products, categories, updateProduct, deleteProduct, refreshProducts, settings } = useStore();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');
  const [isReordering, setIsReordering] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importLocked = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setIsReordering(true);
    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);

    const newProducts = arrayMove(products, oldIndex, newIndex);
    const updates = newProducts.map((p, idx) => ({ id: p.id, displayOrder: idx }));

    try {
      const res = await api.reorderProducts(updates);
      if (res && res.success) {
        showToast('Products reordered', 'success');
        await refreshProducts();
      } else {
        showToast('Failed to reorder products', 'error');
      }
    } catch (e) {
      showToast('Could not reorder products', 'error');
    } finally {
      setIsReordering(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const productCategorySlugs = p.categorySlugs?.length ? p.categorySlugs : p.categorySlug ? [p.categorySlug] : [];
    const matchesCat = selectedCatFilter === 'all' || productCategorySlugs.includes(selectedCatFilter);
    return matchesSearch && matchesCat;
  });

  
  const handleExportCSV = async () => {
    const token = localStorage.getItem('pb_admin_token') || '';
    try {
      const response = await fetch(`${API_BASE_URL}/products/export/csv`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error('Export failed');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'playbimboo-products.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Could not export products. Please sign in again and retry.', 'error');
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || importLocked.current) return;
    importLocked.current = true;
    setIsImporting(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('pb_admin_token');
      const res = await fetch(`${API_BASE_URL}/products/import/csv`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const refreshed = await refreshProducts();
        showToast(refreshed ? 'Products imported successfully.' : 'Products imported, but the catalog could not refresh. Try again.', refreshed ? 'success' : 'warning');
      } else {
        showToast('Failed to import products. Check the CSV and try again.', 'error');
      }
    } catch {
      showToast('Could not import products.', 'error');
    }
    e.target.value = '';
    importLocked.current = false;
    setIsImporting(false);
  };

  const toggleVisibility = async (prod: Product) => {
    const nextState = !(prod.isVisible !== false);
    const saved = await updateProduct(prod.id, { isVisible: nextState });
    showToast(saved ? `${prod.name} is now ${nextState ? 'visible' : 'hidden'} on storefront.` : getLastApiError() || `Could not update ${prod.name}.`, saved ? 'info' : 'error');
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (await confirm({ title: 'Delete this product?', description: 'This product will be removed from the store. Associated unused Cloudinary assets may also be deleted.', cancelLabel: 'Cancel', confirmLabel: 'Delete Product', destructive: true })) {
      const deleted = await deleteProduct(id);
      showToast(
        deleted ? `Deleted ${prodName}` : getLastApiError() || `Could not delete ${prodName}`,
        deleted ? 'info' : 'error'
      );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl text-slate-900">Products Catalog</h1>
          <p className="text-xs text-slate-500 font-medium">Manage toys, PKR pricing, inventory stock, visibility, and delivery charge logic.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { void handleExportCSV(); }}
              className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <label className={`px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${isImporting ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}>
              <UploadCloud className="w-4 h-4" />
              <span>{isImporting ? 'Importing…' : 'Import CSV'}</span>
              <input type="file" accept=".csv" className="hidden" disabled={isImporting} onChange={handleImportCSV} />
            </label>
            <button
              onClick={() => router.push('/admin/products/new')}
              className="px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-heading font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Toy</span>
            </button>
          </div>
      </div>

      {/* Filter controls */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search by toy name or brand..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={selectedCatFilter}
          onChange={e => setSelectedCatFilter(e.target.value)}
          className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c.id || c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 pl-6 w-10"></th>
                <th className="p-4">Toy</th>
                <th className="p-4">Categories</th>
                <th className="p-4">Age</th>
                <th className="p-4">Price (PKR)</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Store Visibility</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(prod => {
                const canMove = !searchQuery && selectedCatFilter === 'all' && !isReordering;

                return (
                <SortableTableRow key={prod.id || prod.slug} id={prod.id} disabled={!canMove}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={getSafeImageSrc(prod.images?.[0])} alt="" className="w-10 h-10 object-cover rounded-xl bg-slate-100" />
                      <div>
                        <span className="font-heading font-bold text-slate-900 block">{prod.name}</span>
                        <span className="text-[10px] text-slate-400">{prod.brand}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-sky-600">{prod.category || 'Uncategorized'}{(prod.categoryNames?.length || 0) > 1 && <span className="ml-1 text-[10px] text-slate-400">+{prod.categoryNames!.length - 1}</span>}</td>
                  <td className="p-4 font-bold">{formatProductAgeGroups(prod)}</td>
                  <td className="p-4 font-bold text-slate-900">{formatPrice(prod.price, settings.currency)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      prod.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {prod.trackInventory ? `${prod.stockQuantity ?? 0} in stock` : prod.inStock ? 'In stock (not tracked)' : 'Out of stock'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleVisibility(prod)}
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                        prod.isVisible !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {prod.isVisible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{prod.isVisible !== false ? 'Visible' : 'Hidden'}</span>
                    </button>
                  </td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <button
                      onClick={() => router.push(`/admin/products/edit/${encodeURIComponent(prod.id)}`)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-sky-600" />
                    </button>
                    <button
                      onClick={() => { void handleDelete(prod.id, prod.name); }}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-rose-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                  </td>
                </SortableTableRow>
                );
              })}
              </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>
      </div>

    </div>
  );
};
