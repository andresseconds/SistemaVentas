'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Asumo que tu fetchApi ya maneja la URL base
      const data = await fetch('/api/categories').then(res => res.json()); 
      // O usa tu wrapper: const data = await fetchApi('/categories');
      setCategories(data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  const handleSave = async () => {
    if (!newCategory.trim()) return;
    setIsLoading(true);

    try {
      // Ajusta la ruta a tu API de NestJS
      await fetch('http://192.168.1.8:3000/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.toUpperCase() })
      });

      setNewCategory('');
      fetchCategories(); // Recargamos la lista
      alert('Categoría creada');
    } catch (error) {
      alert('Error al guardar. Verifica si ya existe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Tag className="text-amber-600" /> Categorías de Menú
        </h2>
        <p className="text-gray-500">Organiza tus productos en grupos lógicos.</p>
      </div>

      {/* Formulario */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">
          Nombre de la Categoría
        </label>
        <div className="flex gap-3">
          <input 
            type="text" 
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Ej: BEBIDAS FRÍAS" 
            className="flex-1 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium transition-all"
          />
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="bg-amber-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <Plus size={20} /> {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4 text-sm text-gray-400 font-mono">#{cat.id}</td>
                <td className="px-6 py-4 font-bold text-gray-700">{cat.name}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-300 hover:text-red-500 transition-colors p-2">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic">
                  No hay categorías registradas aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}