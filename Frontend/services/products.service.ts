// Frontend/services/products.service.ts
import { fetchApi } from './api';
import { Product } from './types'; // Asumiendo que tienes tu interfaz Product

export const ProductsService = {
  // ==========================================
  // 🛒 CRUD BÁSICO DE PRODUCTOS
  // ==========================================
  
  findAll: async (): Promise<Product[]> => {
    return fetchApi('/products');
  },

  findOne: async (id: number): Promise<Product> => {
    return fetchApi(`/products/${id}`);
  },

  findByCategory: async (categoryId: number): Promise<Product[]> => {
    return fetchApi(`/products/category/${categoryId}`);
  },

  create: async (data: any): Promise<Product> => {
    return fetchApi('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any): Promise<Product> => {
    return fetchApi(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  remove: async (id: number): Promise<any> => {
    return fetchApi(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // 📦 INVENTARIO Y STOCK
  // ==========================================

  updateStock: async (id: number, data: { quantity: number, type: string, reason?: string }) => {
    return fetchApi(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  findAllLogs: async () => {
    return fetchApi('/products/inventory/logs');
  },

  findProductLogs: async (id: number) => {
    return fetchApi(`/products/${id}/logs`);
  },

  getAlerts: async () => {
    return fetchApi('/products/inventory/alerts');
  },

  // ==========================================
  // 🍳 RECETAS (INSUMOS)
  // ==========================================

  addRecipeItem: async (id: number, data: { ingredientId: number, quantity: number }) => {
    return fetchApi(`/products/${id}/recipe`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  addBulkRecipe: async (id: number, data: { ingredients: { ingredientId: number, quantity: number }[] }) => {
    return fetchApi(`/products/${id}/recipe/bulk`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ==========================================
  // 📊 REPORTES
  // ==========================================

  getProfitability: async () => {
    return fetchApi('/products/reports/profitability');
  },

  getProductProfitability: async (id: number) => {
    return fetchApi(`/products/${id}/profitability`);
  }
};