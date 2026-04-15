export interface Category{
    id: number;
    name: string;
}

export interface Product{
    id: number;
    name: string;
    description?: string;
    price: number;
    categoryId: number;
    isActive: boolean;
    category?: Category;
}