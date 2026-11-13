const API_URL = 'http://localhost:5000/api';

export const getFruits = async () => {
    const response = await fetch(`${API_URL}/fruits`);

    if (!response.ok) {
        throw new Error('Failed to fetch fruits');
    }

    return response.json();
};

export const getSuppliers = async () => {
    const response = await fetch(`${API_URL}/suppliers`);

    if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
    }

    return response.json();
};

export const getVendors = async () => {
    const response = await fetch(`${API_URL}/vendors`);

    if (!response.ok) {
        throw new Error('Failed to fetch vendors');
    }

    return response.json();
};

export const getProducts = async () => {
    const response = await fetch(`${API_URL}/products`);

    if (!response.ok) {
        throw new Error('Failed to fetch products');
    }

    return response.json();
};

export const getPurchases = async () => {
    const response = await fetch(`${API_URL}/purchases`);

    if (!response.ok) {
        throw new Error('Failed to fetch purchases');
    }

    return response.json();
};