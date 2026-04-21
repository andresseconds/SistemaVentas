'use client';

import React, { useState } from 'react';
import { Package, Utensils, Table as TableIcon, Layers, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Importamos nuestros componentes especializados
import CategoryManager from './components/CategoryManager';
import TableManager from './components/TableManager'; 
// import ProductManager from './components/ProductManager';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'RECIPES' | 'TABLES' | 'CATEGORIES'>('PRODUCTS');

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            {/* --- SIDEBAR IZQUIERDO --- */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-amber-500">Guadalupe Admin</h2>
                    <p className="text-xs text-gray-400">Gestión de Negocio</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('PRODUCTS')}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'PRODUCTS' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <Package size={20} />
                        <span className="font-medium text-sm">Productos e Insumos</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('RECIPES')}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'RECIPES' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <Utensils size={20} />
                        <span className="font-medium text-sm">Recetas</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('TABLES')}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'TABLES' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <TableIcon size={20} />
                        <span className="font-medium text-sm">Mesas</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('CATEGORIES')}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'CATEGORIES' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <Layers size={20} />
                        <span className="font-medium text-sm">Categorías</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <Link href="/" className="flex items-center space-x-3 text-gray-400 hover:text-white p-2 transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-sm">Volver a la Caja</span>
                    </Link>
                </div>
            </aside>

            {/* --- CONTENIDO PRINCIPAL --- */}
            {/* Añadimos ml-64 porque el sidebar ahora es 'fixed' */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                {activeTab === 'PRODUCTS' && (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Inventario</h2>
                        <div className="bg-white p-10 rounded-xl border border-dashed border-gray-300 text-center text-gray-400">
                            Próximamente: Gestión de Productos e Insumos
                        </div>
                    </section>
                )}

                {activeTab === 'RECIPES' && (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Recetas</h2>
                        <div className="bg-white p-10 rounded-xl border border-dashed border-gray-300 text-center text-gray-400">
                            Próximamente: Ingeniería de Recetas
                        </div>
                    </section>
                )}

                {/* 👇 LOS COMPONENTES LIMPIOS */}
                {activeTab === 'TABLES' && <TableManager />}
                
                {activeTab === 'CATEGORIES' && <CategoryManager />}
            </main>
        </div>
    );
}