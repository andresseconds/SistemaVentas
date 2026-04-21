'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';

interface Table {
    id: number;
    number: string;
    capacity: number;
    status: string;
}

export default function TableManager() {
    const [tables, setTables] = useState<Table[]>([]);
    const [number, setNumber] = useState('');
    const [capacity, setCapacity] = useState(2);
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.8:3000';

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const res = await fetch(`${API_URL}/tables`);
            const data = await res.json();
            setTables(data);
        } catch (error) {
            console.error("Error cargando mesas:", error);
        }
    };

    const handleSave = async () => {
        if (!number) return;
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/tables`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    number: `Mesa ${number}`, 
                    capacity: Number(capacity) 
                })
            });

            if (res.ok) {
                setNumber('');
                setCapacity(2);
                fetchTables();
                alert('Mesa creada correctamente');
            }
        } catch (error) {
            alert('Error al crear la mesa');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl animate-in fade-in duration-500">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Configuración de Mesas</h2>
                <p className="text-gray-500">Gestiona la distribución física de Guadalupe Café.</p>
            </div>

            {/* Formulario */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Número de Mesa</label>
                        <input 
                            type="text" 
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            placeholder="Ej: 5" 
                            className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-amber-500 font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Capacidad (Personas)</label>
                        <input 
                            type="number" 
                            value={capacity}
                            onChange={(e) => setCapacity(Number(e.target.value))}
                            className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-amber-500 font-medium"
                        />
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-amber-600 text-white h-[50px] rounded-xl font-bold hover:bg-amber-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Plus size={20} /> {isLoading ? '...' : 'Agregar Mesa'}
                    </button>
                </div>
            </div>

            {/* Listado de Mesas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {tables.map((table) => (
                    <div key={table.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 mb-3">
                            <span className="font-bold">{table.number.replace('Mesa ', '')}</span>
                        </div>
                        <h4 className="font-bold text-gray-800">{table.number}</h4>
                        <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                            <Users size={12} /> {table.capacity} personas
                        </div>
                        <button className="mt-4 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}