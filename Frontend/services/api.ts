// Función encargada de obtener la URL del backend dinamicamente
const getBaseUrl = () => {
    if(typeof window !== 'undefined'){
        return `http://${window.location.hostname}:3000`;
    }
    return 'http://localhost:3000';
};

// Wrapper genérico para las peticiones
export const fetchApi = async (endpoint: string, options: RequestInit = {}) =>{
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
            'Content-type': 'application/json',
            ...options.headers,
        },
    });

    if(!response.ok){
        throw new Error(`Error en la petición: ${response.statusText}`);
    }

    return response.json();
}