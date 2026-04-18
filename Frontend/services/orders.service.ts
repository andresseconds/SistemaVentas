import { fetchApi } from './api';

export const OrdersService = {
    // Crear orden
    createOrder: async (orderData: any) => {
        return fetchApi('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    },

    // Liberar mesa
    checkoutTable: async (tableId: number, paymentMethod: string) => {
        return fetchApi(`/orders/checkout/${tableId}`,{
            method: 'PATCH',
            body: JSON.stringify({ paymentMethod }),
        });
    },

    // Saber cuanto debe la mesa
    getActiveOrderByTable: async (tableId: number) =>{
        return fetchApi(`/orders/table/${tableId}/active`);
    },


    // Agregar productos a la mesa
    addItemsToOrder: async (orderId: number, items: any[]) => {
    return fetchApi(`/orders/${orderId}/add-items`, {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    });
  },
};