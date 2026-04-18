// Frontend/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { ProductsService } from '../services/products.service';
import { OrdersService } from '../services/orders.service';
import { TablesService, Table } from '../services/tables.service'; 
import { Product } from '../services/types';

interface CartItem extends Product {
  cartQuantity: number;
}

export default function CajaPOS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tables, setTables] = useState<any[]>([]); // Cambiado a any[] temporalmente para aceptar la orden anidada
  const [selectedTableId, setSelectedTableId] = useState<number | ''>(''); 
  
  // ESTADOS DEL MODAL DE PAGO
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [checkoutTotal, setCheckoutTotal] = useState<number>(0);
  const [checkoutModal, setCheckoutModal] = useState<{isOpen: boolean, tableId: number, tableNumber: string} | null>(null);
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]); 
  
  // ESTADOS PARA OPCIÓN B (ALIAS Y AÑADIR A ORDEN EXISTENTE)
  const [orderAlias, setOrderAlias] = useState('');
  const [editingOrder, setEditingOrder] = useState<{id: number, tableNumber: string} | null>(null);

  const [activeTab, setActiveTab] = useState<'NUEVA_ORDEN' | 'MESAS_ACTIVAS'>('NUEVA_ORDEN');

  const refreshData = async () => {
    setLoading(true);
    try {
      const [productsData, tablesData] = await Promise.all([
        ProductsService.findAll(),
        TablesService.getAllTables()
      ]);
      setProducts(productsData.filter(p => p.price > 0));
      setTables(tablesData);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => {
      return prevCart.map(item => {
        if (item.id === productId) {
          return { ...item, cartQuantity: item.cartQuantity - 1 };
        }
        return item;
      }).filter(item => item.cartQuantity > 0); 
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);

  // LA MAGIA DE LA OPCIÓN B (Saltar a editar)
  const handleStartAddingItems = async (tableId: number, tableNumber: string) => {
    try {
      const activeOrder = await OrdersService.getActiveOrderByTable(tableId);
      setEditingOrder({ id: activeOrder.id, tableNumber: tableNumber });
      setSelectedTableId(tableId); 
      setActiveTab('NUEVA_ORDEN'); 
    } catch (error) {
      alert("No se pudo encontrar la orden activa.");
    }
  };

  // CANCELAR EDICIÓN
  const cancelEditing = () => {
    setEditingOrder(null);
    setSelectedTableId('');
    setCart([]);
  };

  const handleCheckout = async () => {
    if (!selectedTableId) {
      alert('Por favor, selecciona una mesa.');
      return;
    }
    setIsSubmitting(true);
    try {
      const itemsPayload = cart.map(item => ({
        productId: item.id,
        quantity: item.cartQuantity,
        price: item.price
      }));

      if (editingOrder) {
        // FLUJO: AÑADIR A ORDEN EXISTENTE
        await OrdersService.addItemsToOrder(editingOrder.id, itemsPayload);
        alert('¡Productos añadidos a la cuenta!');
      } else {
        // FLUJO: CREAR NUEVA ORDEN
        const orderPayLoad = {
          tableId: Number(selectedTableId), 
          alias: orderAlias, // Enviamos el alias
          items: itemsPayload
        };    

        console.log("1. FRONTEND ENVÍA:", orderPayLoad);

        await OrdersService.createOrder(orderPayLoad);
        alert('¡Venta enviada a la mesa con éxito!');
      }

      // Limpiamos todo
      setCart([]);
      setSelectedTableId(''); 
      setOrderAlias('');
      setEditingOrder(null);
      await refreshData(); 
      setActiveTab('MESAS_ACTIVAS'); 
    } catch (error) {
      alert('Hubo un error al procesar el pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCheckoutModal = async (tableId: number, tableNumber: string) => {
    setCheckoutModal({ isOpen: true, tableId, tableNumber });
    setPaymentMethod('CASH');
    setCheckoutTotal(0); 
    setCheckoutItems([]); 
    
    try {
      const activeOrder = await OrdersService.getActiveOrderByTable(tableId);
      setCheckoutTotal(activeOrder.total);
      setCheckoutItems(activeOrder.items); 
    } catch (error) {
      console.error('Error al obtener la cuenta:', error);
    }
  };

  const processPayment = async () => {
    if (!checkoutModal) return;
    setIsSubmitting(true);
    try {
      await OrdersService.checkoutTable(checkoutModal.tableId, paymentMethod);
      alert('¡Mesa liberada y cuenta pagada con éxito!');
      setCheckoutModal(null); 
      await refreshData();
    } catch (error) {
      alert('Hubo un error al intentar cobrar la mesa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const occupiedTables = tables.filter(t => t.status === 'OCCUPIED');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Caja - Guadalupe Café ☕</h1>
          <p className="text-sm text-gray-500">Terminal de Punto de Venta</p>
        </div>
        
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button 
            onClick={() => { setActiveTab('NUEVA_ORDEN'); cancelEditing(); }}
            className={`px-6 py-2 rounded-md font-semibold transition-colors ${activeTab === 'NUEVA_ORDEN' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Tomar Pedido
          </button>
          <button 
            onClick={() => setActiveTab('MESAS_ACTIVAS')}
            className={`px-6 py-2 rounded-md font-semibold transition-colors ${activeTab === 'MESAS_ACTIVAS' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Mesas Activas ({occupiedTables.length})
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        
        {/* VISTA 1: NUEVA ORDEN */}
        {activeTab === 'NUEVA_ORDEN' && (
          <>
            <div className="w-2/3 p-6 overflow-y-auto">
              {loading ? (
                <p className="text-gray-600">Cargando...</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <button 
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-amber-500 transition-all text-left flex flex-col justify-between h-32 active:scale-95"
                    >
                      <span className="font-semibold text-gray-700 line-clamp-2">{product.name}</span>
                      <span className="text-amber-600 font-bold mt-2">${product.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-1/3 bg-white border-l border-gray-200 flex flex-col">
              <div className={`p-4 border-b border-gray-200 ${editingOrder ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingOrder ? `Añadiendo a Mesa ${editingOrder.tableNumber}` : 'Nueva Cuenta'}
                </h2>
                {editingOrder && (
                  <button onClick={cancelEditing} className="text-sm text-red-500 hover:underline mt-1">
                    Cancelar edición
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <p className="text-gray-400 text-center mt-10">Toca un producto para agregarlo</p>
                ) : (
                  <ul className="space-y-3">
                    {cart.map((item) => (
                      <li key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex-1">
                          <span className="font-semibold text-gray-700">{item.name}</span>
                          <div className="text-sm text-gray-500">{item.cartQuantity} x ${item.price.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-gray-800">${(item.price * item.cartQuantity).toLocaleString()}</span>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="bg-red-100 text-red-600 hover:bg-red-200 rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors"
                          >
                            -
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-200">
                
                {/* ALIAS INPUT (Solo si es nueva orden) */}
                {!editingOrder && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Identificador / Alias</label>
                    <input 
                      type="text"
                      placeholder="Ej. Los de la chaqueta roja"
                      value={orderAlias}
                      onChange={(e) => setOrderAlias(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-800 outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mesa del Cliente</label>
                  <select 
                    value={selectedTableId}
                    onChange={(e) => setSelectedTableId(Number(e.target.value))}
                    disabled={!!editingOrder} // Se bloquea si estamos editando
                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-800 disabled:bg-gray-200"
                  >
                    <option value="" disabled>-- Selecciona una Mesa --</option>
                    {tables.map(table => (
                      <option key={table.id} value={table.id} disabled={table.status === 'OCCUPIED' && !editingOrder}>
                        {table.number} {table.status === 'OCCUPIED' ? '(🔴 Ocupada)' : '(🟢 Libre)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-between items-center mb-4 text-xl font-bold">
                  <span>{editingOrder ? 'Aumento:' : 'Total:'}</span>
                  <span className="text-amber-600">${total.toLocaleString()}</span>
                </div>
                
                <button 
                  onClick={handleCheckout} 
                  disabled={cart.length === 0 || isSubmitting || !selectedTableId} 
                  className={`w-full text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ${editingOrder ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                >
                  {isSubmitting ? 'Procesando...' : (editingOrder ? 'Confirmar Adición' : 'Enviar Pedido')}
                </button>
              </div>
            </div>
          </>
        )}

        {/* VISTA 2: MESAS ACTIVAS */}
        {activeTab === 'MESAS_ACTIVAS' && (
          <div className="w-full p-6 bg-gray-50 overflow-y-auto relative">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Control de Mesas</h2>
            {occupiedTables.length === 0 ? (
              <div className="text-center mt-20 text-gray-500">
                <p className="text-xl">🎉 Todas las mesas están libres</p>
                <p className="text-sm mt-2">No hay clientes por cobrar en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {occupiedTables.map(table => {
                  const activeOrder = table.orders?.[0]; // Sacamos la orden activa de la mesa
                  
                  return (
                  <div key={table.id} className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-red-800 text-lg">{table.number}</h3>
                          {/* MOSTRAMOS EL ALIAS SI EXISTE */}
                          {activeOrder?.alias && (
                            <p className="text-sm text-red-600 font-medium">"{activeOrder.alias}"</p>
                          )}
                        </div>
                        <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">
                          🔴 OCUPADA
                        </span>
                      </div>
                      <div className="p-4 flex flex-col space-y-3">
                        <button
                          onClick={() => handleStartAddingItems(table.id, table.number)}
                          className="w-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-2"
                        >
                          ➕ Añadir Productos
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                      <button
                        onClick={() => openCheckoutModal(table.id, table.number)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm"
                      >
                        💳 Ver Cuenta y Cobrar
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            )}

            {/* --- MODAL EMERGENTE DE COBRO --- */}
            {checkoutModal && checkoutModal.isOpen && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 max-w-full">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Cobrar Mesa {checkoutModal.tableNumber}</h3>
                  <p className="text-gray-500 mb-4">Selecciona el método de pago para cerrar la cuenta.</p>
                  
                  <div className="mb-4 max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Detalle de consumo</h4>
                    <ul className="space-y-2">
                      {checkoutItems.map((item: any) => (
                        <li key={item.id} className="flex justify-between text-sm border-b border-gray-100 pb-1 last:border-0">
                          <span className="text-gray-700">{item.quantity}x {item.product?.name || 'Producto'}</span>
                          <span className="text-gray-600 font-semibold">${(item.price * item.quantity).toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gray-100 p-3 rounded-lg flex justify-between items-center mb-6">
                    <span className="text-gray-600 font-semibold">Total a pagar:</span>
                    <span className="text-amber-600 font-bold text-2xl">
                      ${checkoutTotal.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-8">
                    <label className="block text-sm font-semibold text-gray-700">Método de Pago</label>
                    <select 
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg p-3 text-gray-800 focus:border-amber-500 outline-none"
                    >
                      <option value="CASH">💵 Efectivo</option>
                      <option value="CARD">💳 Tarjeta (Datáfono)</option>
                      <option value="TRANSFER">📱 Transferencia (Nequi/Daviplata)</option>
                    </select>
                  </div>

                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setCheckoutModal(null)}
                      className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={processPayment}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                      {isSubmitting ? 'Procesando...' : 'Confirmar Pago'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}