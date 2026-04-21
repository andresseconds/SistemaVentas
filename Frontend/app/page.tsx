'use client';

import { useEffect, useState } from 'react';
import { ProductsService } from '../services/products.service';
import { OrdersService } from '../services/orders.service';
import { TablesService } from '../services/tables.service';
import { Product } from '../services/types';

interface CartItem extends Product {
  cartQuantity: number;
}

// Diccionario para traducir los pagos en pantalla
const PAYMENT_LABELS: Record<string, string> = {
  CASH: '💵 Efectivo',
  CARD: '💳 Tarjeta',
  TRANSFER: '📱 Transferencia'
};

export default function CajaPOS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | ''>('');
  const [changeToReturn, setChangeToReturn] = useState<number>(0);

  // ESTADOS DEL MODAL DE PAGO (NUEVOS PARA PAGOS DIVIDIDOS)
  const [checkoutModal, setCheckoutModal] = useState<{ isOpen: boolean, orderId: number, tableNumber: string } | null>(null);
  const [checkoutTotal, setCheckoutTotal] = useState<number>(0);
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);

  const [paymentsList, setPaymentsList] = useState<{ method: string, amount: number }[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState('CASH');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number | ''>('');
  const [receiptData, setReceiptData] = useState<any>(null);

  // ESTADOS PARA OPCIÓN B
  const [orderAlias, setOrderAlias] = useState('');
  const [editingOrder, setEditingOrder] = useState<{ id: number, tableNumber: string, orderId: number } | null>(null);
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

  const handleStartAddingItems = async (tableId: number, tableNumber: string, orderId: number) => {
    try {
      const activeOrder = await OrdersService.getActiveOrderByTable(tableId);
      setEditingOrder({ id: activeOrder.id, tableNumber: tableNumber, orderId: orderId });
      setSelectedTableId(tableId);
      setActiveTab('NUEVA_ORDEN');
    } catch (error) {
      alert("No se pudo encontrar la orden activa.");
    }
  };

  const cancelEditing = () => {
    setEditingOrder(null);
    setSelectedTableId('');
    setCart([]);
  };

  const handleCheckout = async () => {
    if (!selectedTableId) return alert('Por favor, selecciona una mesa.');

    setIsSubmitting(true);
    try {
      const itemsPayload = cart.map(item => ({
        productId: item.id,
        quantity: item.cartQuantity,
        price: item.price
      }));

      if (editingOrder) {
        await OrdersService.addItemsToOrder(editingOrder.id, itemsPayload);
        alert('¡Productos añadidos a la cuenta!');
      } else {
        await OrdersService.createOrder({
          tableId: Number(selectedTableId),
          alias: orderAlias,
          items: itemsPayload
        });
        alert('¡Venta enviada a la mesa con éxito!');
      }

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

  // --- LÓGICA DE PAGOS DIVIDIDOS ---
  const openCheckoutModal = async (orderId: number, tableNumber: string, total: number, items: any[]) => {
    setCheckoutModal({ isOpen: true, orderId, tableNumber });
    // Reseteamos toda la caja con los datos exactos de esta cuenta
    setCheckoutTotal(total);
    setPaymentsList([]);
    setCurrentPaymentAmount('');
    setChangeToReturn(0);

    // Inicializa el tablero de vueltas a 0
    setChangeToReturn(0);
  };

  const totalPaid = paymentsList.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = checkoutTotal - totalPaid;

  const handleAddPayment = () => {
    const amount = Number(currentPaymentAmount);
    if (!amount || amount <= 0) return;

    // Si pagan más de lo que deben
    if (amount > remainingBalance) {

      const returnAmount = amount - remainingBalance;

      setChangeToReturn(returnAmount);

      // Añadimos solo lo que faltaba para cuadrar la caja
      setPaymentsList([...paymentsList, { method: currentPaymentMethod, amount: remainingBalance }]);

    } else {
      // Si pagan exacto o menos|
      setPaymentsList([...paymentsList, { method: currentPaymentMethod, amount }]);
      setChangeToReturn(0);
    }
    setCurrentPaymentAmount(''); // Limpiamos el input
  };

  const handleRemovePayment = (index: number) => {
    // 1. Borramos el pago de la lista
    setPaymentsList(paymentsList.filter((_, i) => i !== index));

    //2. Avisamos al estado que ya no hay vueltas que devolver
    setChangeToReturn(0);
  };

  // Función para agregar números al teclado táctil
  const handleNumpadClick = (val: string) => {
    setCurrentPaymentAmount((prev) => {
      const prevStr = prev == '' ? '' : prev.toString();
      return Number(prevStr + val);
    });
  };

  // Funci{on para el botón de borrar
  const handleNumpadDelete = () => {
    setCurrentPaymentAmount((prev) => {
      const prevStr = prev == '' ? '' : prev.toString();
      if (prevStr.length <= 1) return '';// Si queda 1 numero, vacia el input
      return Number(prevStr.slice(0, -1)); //Borra el último digito
    });
  };

  const processPayment = async () => {
    // 1. Verificamos que tengamos un orderId
    if (!checkoutModal?.orderId) return;

    setIsSubmitting(true);
    try {
      // 2. Guardamos los datos de la factura antes de que se borren 
      const ticketInfo = {
        table: checkoutModal?.tableNumber,
        products: checkoutItems,
        total: checkoutTotal,
        pagos: paymentsList
      }

      setReceiptData(ticketInfo);

      // 3. ESTA ES LA CLAVE: Llamamos a tu servicio pasando el orderId
      await OrdersService.checkoutTable(checkoutModal.orderId, paymentsList);

      alert('¡Cuenta pagada con éxito!');

      // 4. Limpiamos la mesa
      setCheckoutModal(null);
      await refreshData();// recargar
    } catch (error) {
      alert('Hubo un error al intentar cobrar la cuenta.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const occupiedTables = tables.filter(t => t.status === 'OCCUPIED');

  return (
    <>
      {/* --- RENDERIZADO CONDICIONAL: LA VISTA DEL TICKET --- */}
      {receiptData && (
        <div className="min-h-screen bg-gray-200 flex justify-center items-center p-6">
          <div className="bg-white w-80 p-6 rounded-none shadow-lg print:shadow-none print:w-full">
            {/* Cabecera del ticket */}
            <div className="text-center border-b border-dashed border-gray-400 pb-4 mb-4">
              <h2 className="text-2xl font-bold uppercase">Guadalupe Café</h2>
              <p className="text-sm text-gray-500">Mesa {receiptData.table}</p>
            </div>

            {/* Lista de productos */}
            <div className="mb-4">
              <h3 className="font-bold text-xs uppercase border-b border-gray-200 mb-2 pb-1">Consumo</h3>
              {receiptData.products.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm mb-1">
                  <span>{item.quantity}x {item.product?.name}</span>
                  <span>${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Total y Pagos */}
            <div className="border-t border-dashed border-gray-400 pt-4 mt-4">
              <div className="flex justify-between font-bold text-lg mb-2">
                <span>TOTAL:</span>
                <span>${receiptData.total.toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-500 mt-4">
                <p className="font-bold uppercase mb-1">Pagado con:</p>
                {receiptData.pagos.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>{PAYMENT_LABELS[p.method]}</span>
                    <span>${p.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de acción (No se verán al imprimir) */}
            <div className="mt-8 flex flex-col gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition-colors"
              >
                🖨️ Imprimir Ticket
              </button>

              <button
                onClick={() => setReceiptData(null)}
                className="w-full bg-gray-300 text-gray-800 font-bold py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Volver a la Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RENDERIZADO CONDICIONAL: LA VISTA NORMAL DE LA CAJA --- */}
      {!receiptData && (
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

          {/*1. CAMBIO EN MAIN: flex-col en móvil, md:flex-row en PC */}
          <main className="flex-1 flex flex-col md:flex-row overflow-hidden">

            {activeTab === 'NUEVA_ORDEN' && (
              <>
                {/* --- MITAD 1: PRODUCTOS (Arriba en móvil, Izquierda en PC) --- */}
                <div className="w-full md:w-2/3 h-1/2 md:h-full p-3 md:p-6 overflow-y-auto">
                  {loading ? <p className="text-gray-600">Cargando...</p> : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                      {products.map((product) => (
                        <button
                          key={product.id} onClick={() => addToCart(product)}
                          className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-amber-500 transition-all text-left flex flex-col justify-between h-28 md:h-32 active:scale-95"
                        >
                          <span className="font-semibold text-gray-700 text-sm md:text-base line-clamp-2">{product.name}</span>
                          <span className="text-amber-600 font-bold mt-1 md:mt-2 text-sm md:text-base">${product.price.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* --- MITAD 2: CARRITO (Abajo en móvil, Derecha en PC) --- */}
                <div className="w-full md:w-1/3 h-1/2 md:h-full bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)] md:shadow-none z-10">
                  <div className={`p-3 md:p-4 border-b border-gray-200 ${editingOrder ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <h2 className="text-base md:text-xl font-bold text-gray-800 truncate">
                      {editingOrder ? `Mesa ${editingOrder?.tableNumber}` : 'Nueva Cuenta'}
                    </h2>
                    {editingOrder && <button onClick={cancelEditing} className="text-xs text-red-500 hover:underline mt-1">Cancelar edición</button>}
                  </div>

                  {/* Lista de Items */}
                  <div className="flex-1 overflow-y-auto p-3 md:p-4">
                    {cart.length === 0 ? <p className="text-gray-400 text-sm text-center mt-4">Toca un producto para agregarlo</p> : (
                      <ul className="space-y-2">
                        {cart.map((item) => (
                          <li key={item.id} className="flex justify-between items-center bg-gray-50 p-2 md:p-3 rounded-lg border border-gray-100 gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-gray-700 text-sm md:text-base block truncate">{item.name}</span>
                              <div className="text-xs md:text-sm text-gray-500">{item.cartQuantity} x ${item.price.toLocaleString()}</div>
                            </div>
                            <div className="flex items-center space-x-2 md:space-x-3 whitespace-nowrap">
                              <span className="font-bold text-gray-800 text-sm md:text-base">${(item.price * item.cartQuantity).toLocaleString()}</span>
                              <button onClick={() => removeFromCart(item.id)} className="bg-red-100 text-red-600 hover:bg-red-200 rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center font-bold text-lg leading-none">-</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Controles de Cobro */}
                  <div className="p-3 md:p-6 bg-gray-50 border-t border-gray-200">
                    {!editingOrder && (
                      <div className="mb-2 md:mb-4">
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Identificador</label>
                        <input type="text" placeholder="Ej. Chaqueta roja" value={orderAlias} onChange={(e) => setOrderAlias(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-800 text-sm outline-none focus:border-amber-500" />
                      </div>
                    )}
                    <div className="mb-3 md:mb-4">
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Mesa</label>
                      <select
                        value={selectedTableId}
                        onChange={(e) => setSelectedTableId(Number(e.target.value))}
                        disabled={!!editingOrder}
                        className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-800 disabled:bg-gray-200 outline-none"
                      >
                        <option value="" disabled>-- Selecciona una Mesa --</option>
                        {tables.map(table => (
                          <option key={table.id} value={table.id}>
                            Mesa {table.number} {table.status === 'OCCUPIED' ? '(🔴 Tiene cuentas)' : '(🟢 Libre)'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-between items-center mb-3 md:mb-4 text-lg md:text-xl font-bold">
                      <span>{editingOrder ? 'Aumento:' : 'Total:'}</span>
                      <span className="text-amber-600">${total.toLocaleString()}</span>
                    </div>
                    <button onClick={handleCheckout} disabled={cart.length === 0 || isSubmitting || !selectedTableId} className={`w-full text-white font-bold py-2 md:py-3 px-4 rounded-lg text-sm md:text-base disabled:bg-gray-300 transition-colors ${editingOrder ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                      {isSubmitting ? 'Procesando...' : (editingOrder ? 'Confirmar Adición' : 'Enviar Pedido')}
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'MESAS_ACTIVAS' && (
              <div className="w-full p-6 bg-gray-50 overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Control de Cuentas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {occupiedTables.map(table => (
                    <div key={table.id} className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden flex flex-col">
                      <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
                        <h3 className="font-bold text-red-800 text-lg">{table.number}</h3>
                        <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                          {table.orders?.length} Cuentas
                        </span>
                      </div>

                      <div className="p-3 flex flex-col gap-3">
                        {table.orders?.map((order: any) => (
                          <div key={order.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-amber-500 transition-colors shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-gray-700">
                                {order.alias ? `👤 ${order.alias}` : `📄 Orden #${order.id.toString().slice(-4)}`}
                              </span>
                              <span className="text-amber-600 font-bold">${order.total.toLocaleString()}</span>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleStartAddingItems(table.id, table.number, order.id)}
                                className="flex-1 bg-blue-50 text-blue-700 py-2 rounded font-bold text-xs hover:bg-blue-100"
                              >
                                ➕ Añadir
                              </button>
                              <button
                                onClick={() => openCheckoutModal(order.id, table.number, order.total, order.items)}
                                className="flex-1 bg-green-600 text-white py-2 rounded font-bold text-xs hover:bg-green-700"
                              >
                                💳 Cobrar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- MODAL EMERGENTE DE COBRO DIVIDIDO --- */}
            {checkoutModal && checkoutModal.isOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-2xl w-full max-w-3xl max-h-full overflow-y-auto flex flex-col">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Cobrar {checkoutModal?.tableNumber}</h3>
                  <p className="text-gray-500 mb-4 text-xs sm:text-sm">Añade pagos hasta completar el total.</p>

                  <div className="bg-gray-800 text-white p-4 rounded-xl flex justify-between items-center mb-6">
                    <div>
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Total de la cuenta</p>
                      <span className="font-bold text-2xl sm:text-3xl">${checkoutTotal.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Pendiente</p>
                      <span className={`font-bold text-xl sm:text-2xl ${remainingBalance === 0 ? 'text-green-400' : 'text-amber-400'}`}>
                        ${remainingBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {changeToReturn > 0 && (
                    <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl mb-6 text-center shadow-inner">
                      <p className="text-sm font-bold uppercase tracking-wide">Cambio a Devolver</p>
                      <span className="text-3xl sm:text-4xl font-extrabold">${changeToReturn.toLocaleString()}</span>
                    </div>
                  )}

                  {remainingBalance > 0 && (
                    <div className="mb-4 bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-200 flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <select
                          value={currentPaymentMethod}
                          onChange={(e) => setCurrentPaymentMethod(e.target.value)}
                          className="border border-gray-300 rounded-lg p-3 text-gray-700 w-full sm:w-1/3 sm:min-w-[140px] outline-none font-bold text-lg cursor-pointer"
                        >
                          <option value="CASH">Efectivo</option>
                          <option value="CARD">Tarjeta</option>
                          <option value="TRANSFER">Transf.</option>
                        </select>

                        <div className="flex flex-1 gap-2 sm:gap-3">
                          <input
                            type="text"
                            readOnly
                            placeholder="0"
                            value={currentPaymentAmount ? `$${currentPaymentAmount.toLocaleString()}` : ''}
                            className="border border-gray-300 rounded-lg p-3 text-gray-800 flex-1 outline-none font-bold text-xl sm:text-2xl text-right bg-white min-w-0"
                          />
                          <button
                            onClick={handleAddPayment}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-6 sm:px-8 rounded-lg font-bold transition-colors text-lg shadow-sm whitespace-nowrap"
                          >
                            Añadir
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="grid grid-cols-3 gap-2 w-full md:w-1/2">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00'].map((num) => (
                            <button
                              key={num}
                              onClick={() => handleNumpadClick(num)}
                              className="bg-white border border-gray-300 py-3 rounded-lg text-lg sm:text-xl font-bold shadow-sm hover:bg-gray-100 active:bg-gray-200 text-gray-700 transition-colors"
                            >
                              {num}
                            </button>
                          ))}
                          <button
                            onClick={handleNumpadDelete}
                            className="bg-red-50 border border-red-200 text-red-600 py-3 rounded-lg text-lg sm:text-xl font-bold shadow-sm hover:bg-red-100 active:bg-red-200 transition-colors"
                          >
                            ⌫
                          </button>
                        </div>

                        {currentPaymentMethod === 'CASH' ? (
                          <div className="w-full md:w-1/2 grid grid-cols-3 md:grid-cols-2 gap-2">
                            {[2000, 5000, 10000, 20000, 50000, 100000].map((bill) => (
                              <button
                                key={bill}
                                onClick={() => setCurrentPaymentAmount((prev) => Number(prev || 0) + bill)}
                                className="bg-green-50 text-green-800 border border-green-300 hover:bg-green-100 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors flex items-center justify-center"
                              >
                                + ${bill.toLocaleString()}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="w-full md:w-1/2 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm font-medium text-center p-4">
                            Billetes rápidos<br />solo en Efectivo
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mb-6 min-h-[80px] border border-gray-100 rounded-lg p-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Pagos Ingresados</h4>
                    {paymentsList.length === 0 ? (
                      <p className="text-xs sm:text-sm text-gray-400 px-2 italic">Aún no se han ingresado pagos.</p>
                    ) : (
                      <ul className="space-y-2">
                        {paymentsList.map((payment, index) => (
                          <li key={index} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-md border border-gray-100">
                            <span className="text-xs sm:text-sm font-medium text-gray-700">{PAYMENT_LABELS[payment.method]}</span>
                            <div className="flex items-center space-x-3">
                              <span className="font-bold text-gray-800 text-sm sm:text-base">${payment.amount.toLocaleString()}</span>
                              <button onClick={() => handleRemovePayment(index)} className="text-red-500 hover:text-red-700 font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors">
                                ✕
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex space-x-3 mt-auto">
                    <button
                      onClick={() => setCheckoutModal(null)}
                      className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={processPayment}
                      disabled={isSubmitting || remainingBalance > 0}
                      className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 text-sm sm:text-base"
                    >
                      {isSubmitting ? 'Procesando...' : (remainingBalance === 0 ? '✔ Facturar' : 'Completa el pago')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </>
  );
}