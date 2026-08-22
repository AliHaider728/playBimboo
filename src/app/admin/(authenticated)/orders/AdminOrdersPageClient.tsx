"use client";
import React, { useState } from 'react';
import { Eye, Search, Truck, X, CheckCircle2, Send, Trash2 } from 'lucide-react';
import { useStore } from '../../../../context/StoreContext';
import { useToast } from '../../../../context/ToastContext';
import { Order } from '../../../../types';

import { formatPrice } from '../../../../utils/formatters';
import { useDialog } from '../../../../context/DialogContext';
import { api, getLastApiError } from '../../../../services/api';

export const AdminOrdersPageClient: React.FC = () => {
  const { updateOrderStatus, updateOrderTracking, deleteOrder, settings } = useStore();
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const ITEMS_PER_PAGE = 25;

  const fetchServerOrders = React.useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const result = await api.getOrders({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchVal,
        status: activeTab === 'All' ? 'all' : activeTab
      });
      if (result && result.orders) {
        setFilteredOrders(result.orders);
        setTotalPages(result.totalPages || 1);
        setTotalCount(result.totalCount || 0);
      } else if (Array.isArray(result)) {
        setFilteredOrders(result);
        setTotalPages(1);
        setTotalCount(result.length);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoadingOrders(false);
  }, [currentPage, searchVal, activeTab]);

  React.useEffect(() => {
    fetchServerOrders();
  }, [fetchServerOrders]);

  React.useEffect(() => {
    const t = setTimeout(() => { setSearchVal(searchQuery); setCurrentPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  React.useEffect(() => { setCurrentPage(1); }, [activeTab]);

  const handleBulkStatusChange = async (newStatus: Order['status']) => {
    const accepted = await confirm({
      title: `Mark ${selectedOrderIds.size} orders as ${newStatus}?`,
      description: `All selected orders will be updated to ${newStatus}.`,
      confirmLabel: 'Update Status',
    });
    if (!accepted) return;

    setIsBulkUpdating(true);
    let successCount = 0;
    for (const orderId of Array.from(selectedOrderIds)) {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result) successCount++;
    }
    if (successCount > 0) fetchServerOrders();
    setIsBulkUpdating(false);
    
    if (successCount === selectedOrderIds.size) {
      showToast(`Successfully updated ${successCount} orders.`, 'success');
    } else {
      showToast(`Updated ${successCount} of ${selectedOrderIds.size} orders. Some failed.`, 'warning');
    }
    setSelectedOrderIds(new Set());
  };

  const handleBulkDelete = async () => {
    const accepted = await confirm({
      title: 'Delete Selected Orders?',
      description: `Are you sure you want to delete ${selectedOrderIds.size} orders permanently? This action cannot be undone.`,
      confirmLabel: 'Delete Orders',
      destructive: true
    });
    if (!accepted) return;

    setIsBulkUpdating(true);
    let successCount = 0;
    for (const orderId of Array.from(selectedOrderIds)) {
      const result = await deleteOrder(orderId);
      if (result) successCount++;
    }
    if (successCount > 0) fetchServerOrders();
    setIsBulkUpdating(false);

    if (successCount === selectedOrderIds.size) {
      showToast(`Successfully deleted ${successCount} orders.`, 'success');
    } else {
      showToast(`Deleted ${successCount} of ${selectedOrderIds.size} orders. Some failed.`, 'warning');
    }
    setSelectedOrderIds(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    const next = new Set(selectedOrderIds);
    if (next.has(orderId)) next.delete(orderId);
    else next.add(orderId);
    setSelectedOrderIds(next);
  };

  const handleStatusChange = async (order: Order, newStatus: Order['status']) => {
    if (newStatus === order.status) { if (newStatus === 'Delivered') showToast('This order is already marked as delivered.', 'info'); return; }
    const isDelivered = newStatus === 'Delivered'; const isCancelled = newStatus === 'Cancelled';
    const accepted = await confirm({
      title: isDelivered ? 'Mark this order as delivered?' : isCancelled ? 'Cancel this order?' : `Mark this order as ${newStatus.toLowerCase()}?`,
      description: isDelivered
        ? `Order ${order.id} for ${order.customerName} (${order.email}) is currently ${order.status}. The customer’s delivery email will be sent if it has not already been sent.`
        : isCancelled ? 'The order status will change to Cancelled. Tracked product and variant stock will be restored where applicable.'
        : `Order ${order.id} will move from ${order.status} to ${newStatus}.`,
      cancelLabel: isDelivered ? 'Not Yet' : isCancelled ? 'Keep Order' : 'Keep Current Status',
      confirmLabel: isDelivered ? 'Mark Delivered' : isCancelled ? 'Cancel Order' : `Mark ${newStatus}`,
      destructive: isCancelled
    });
    if (!accepted) return;
    setUpdatingOrderId(order.id);
    const result = await updateOrderStatus(order.id, newStatus);
    setUpdatingOrderId('');
    if (result) fetchServerOrders();
    if (!result) { showToast(getLastApiError() || 'Order update failed.', 'error'); return; }
    const notification = result.notification || {};
    if (isDelivered) {
      if (notification.alreadyDelivered || notification.emailStatus === 'already_sent') showToast('This order is already marked as delivered. The delivery email was not resent.', 'info');
      else if (notification.emailStatus === 'sent') showToast('Order marked as delivered. Delivery email sent.', 'success');
      else if (notification.emailStatus === 'failed') showToast('Order marked as delivered, but the email could not be sent.', 'warning');
      else showToast('Order marked as delivered.', 'success');
    } else if (isCancelled) showToast(notification.inventoryRestored ? 'Order cancelled and tracked stock restored.' : 'Order cancelled. No tracked stock required restoration.', 'success');
    else showToast(`Order marked as ${newStatus}.`, 'success');
    if (selectedOrder?.id === order.id) setSelectedOrder(result.order);
  };

  const handleSaveTracking = async (orderId: string) => {
    if (!trackingInput.trim()) return;
    const updated = await updateOrderTracking(orderId, trackingInput.trim());
    if (updated) fetchServerOrders();
    if (!updated) { showToast(getLastApiError() || 'Could not save the tracking code.', 'error'); return; }
    showToast(`Tracking code saved for ${orderId}.`, 'success');
    if (selectedOrder) setSelectedOrder(updated);
  };

  const handleDeleteOrder = async (order: Order) => {
    const accepted = await confirm({
      title: 'Delete Order?',
      description: `Are you sure you want to delete order ${order.id} permanently? This action cannot be undone.`,
      confirmLabel: 'Delete Order',
      destructive: true
    });
    if (!accepted) return;
    
    const result = await deleteOrder(order.id);
    if (result) fetchServerOrders();
    if (!result) { showToast(getLastApiError() || 'Failed to delete order.', 'error'); return; }
    showToast(`Order ${order.id} deleted successfully.`, 'success');
  };

  return (
    <div className="space-y-6 font-sans">
      

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl text-slate-900">Orders Management</h1>
          <p className="text-xs text-slate-500 font-medium">Fulfill customer orders, update delivery statuses, and issue tracking numbers.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs max-w-sm w-full sm:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search order ID or customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs overflow-x-auto w-full sm:w-auto">
          {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {selectedOrderIds.size > 0 && (
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs font-bold text-sky-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {selectedOrderIds.size} Order{selectedOrderIds.size > 1 ? 's' : ''} Selected
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mr-2 hidden sm:inline">Bulk Status:</span>
            {['Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
              <button
                key={status}
                disabled={isBulkUpdating}
                onClick={() => void handleBulkStatusChange(status as Order['status'])}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-colors border ${
                  status === 'Processing' ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200' :
                  status === 'Shipped' ? 'bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200' :
                  status === 'Delivered' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200' :
                  'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200'
                } disabled:opacity-50`}
              >
                {status}
              </button>
            ))}
            <div className="w-px h-6 bg-sky-200 mx-2 hidden sm:block" />
            <button
              disabled={isBulkUpdating}
              onClick={() => void handleBulkDelete()}
              className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 pl-6 w-12">
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrderIds.size === filteredOrders.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </th>
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4 min-w-[200px]">Items</th>
                <th className="p-4">Date</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(order => (
                <tr key={order.id || `${order.email}-${order.date}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 pl-6 w-12">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.has(order.id)}
                      onChange={() => toggleSelectOrder(order.id)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-4 font-heading font-bold text-slate-900">{order.id}</td>
                  <td className="p-4">
                    <span className="font-bold text-slate-800 block">{order.customerName}</span>
                    <span className="text-[10px] text-slate-400">{order.email}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                      {(order.items || []).map((it, idx) => (
                        <div key={`${it.productId || it.name || 'item'}-${idx}`} className="flex items-start gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          {it.image ? (
                            <img src={it.image} alt={it.name || 'Product'} className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0">
                              <span className="text-[8px] text-slate-500 font-bold uppercase">No Img</span>
                            </div>
                          )}
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[11px] font-bold text-slate-800 line-clamp-1" title={it.name || 'Unknown Item'}>{it.name || 'Unknown Item'}</span>
                            <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                              <span className="font-bold text-slate-700">{it.quantity || 0}x</span>
                              <span className="text-slate-600">{formatPrice(it.price || 0, settings.currency)}</span>
                              
                              {/* Legacy simple variant string */}
                              {!it.selectedAttributes && it.selectedVariant && (
                                <span className="text-slate-400">• {it.selectedVariant}</span>
                              )}
                              
                              {/* New attribute-based variations */}
                              {it.selectedAttributes && Object.values(it.selectedAttributes).map(v => (
                                <span key={v as string} className="bg-slate-200/60 px-1 py-0.5 rounded text-[9px] text-slate-600 font-medium">
                                  {v as string}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-slate-500">{order.date}</td>
                  <td className="p-4 font-medium">{order.paymentMethod}</td>
                  <td className="p-4 font-bold text-slate-900">{formatPrice(order.total, settings.currency)}</td>
                  <td className="p-4">
                    <select
                      value={order.status}
                      disabled={updatingOrderId === order.id}
                      onChange={e => { void handleStatusChange(order, e.target.value as Order['status']); }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border border-transparent cursor-pointer ${
                        order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'Shipped' ? 'bg-sky-100 text-sky-800' :
                        order.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                        order.status === 'Processing' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-4 pr-6 text-right space-x-1">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setTrackingInput(order.trackingNumber || '');
                      }}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                      title="View Order Details"
                    >
                      <Eye className="w-4 h-4 text-slate-700" />
                    </button>
                    <button
                      onClick={() => { void handleDeleteOrder(order); }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                      title="Delete Order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination UI */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-white border border-slate-200/80 shadow-xs rounded-3xl mt-4">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> of <span className="font-bold text-slate-700">{totalCount}</span> orders
          </div>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >Previous</button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 relative shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Order Receipt</span>
                <h3 className="font-heading font-black text-lg text-slate-900">{selectedOrder.id}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Shipping Address:</span>
                <p className="text-slate-600">{selectedOrder.shippingAddress.fullName} ({selectedOrder.shippingAddress.phone})</p>
                <p className="text-slate-600">{selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}</p>
              </div>

              {/* Courier Tracking */}
              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 space-y-2">
                <span className="font-bold text-sky-900 block">Courier Tracking Code</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter TCS / Leopard tracking code..."
                    value={trackingInput}
                    onChange={e => setTrackingInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-sky-200 bg-white"
                  />
                  <button
                    onClick={() => { void handleSaveTracking(selectedOrder.id); }}
                    className="px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Save
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">Items Purchased:</span>
                {selectedOrder.items.map((it, idx) => (
                  <div key={`${it.productId || it.name}-${it.selectedVariant || 'default'}-${idx}`} className="flex items-center justify-between text-slate-700">
                    <div className="flex flex-col">
                      <span>
                        {it.quantity}x {it.name}
                      </span>
                      {it.selectedAttributes && (
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {Object.entries(it.selectedAttributes).map(([k, v]) => (
                            <span key={k} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                      {!it.selectedAttributes && it.selectedVariant && (
                        <span className="text-[10px] text-slate-500">{it.selectedVariant}</span>
                      )}
                      {it.sku && <span className="text-[9px] text-slate-400 mt-0.5 font-mono">SKU: {it.sku}</span>}
                    </div>
                    <span className="font-bold text-slate-900">{formatPrice(it.price * it.quantity, settings.currency)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between font-heading font-black text-slate-900 text-sm">
                <span>Total Amount (COD):</span>
                <span className="text-rose-600">{formatPrice(selectedOrder.total, settings.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
