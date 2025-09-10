import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
} from 'axios';

export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.trim() || '/api'; // при rewrite на /api

export type ApiErrorPayload = {
    message?: string;
    errors?: Record<string, string | string[]>;
    statusCode?: number;
    // можно расширять по вашему контракту Nest
};

let logoutHandler: (() => void) | null = null;
let notifyError: ((msg: string) => void) | null = null;

/** Позволяет привязать логаут (Redux/логика приложения) */
export function bindLogout(handler: () => void) {
    logoutHandler = handler;
}

/** Позволяет привязать показ ошибок (например, toast.error) */
export function bindErrorNotifier(handler: (msg: string) => void) {
    notifyError = handler;
}

export const http: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // важен для cookie-сессии
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        // ВНИМАНИЕ: 'Content-Type' пусть ставит axios автоматически
        // для FormData; для JSON он сам поставит application/json
    },
});

// Утилита для извлечения сообщения об ошибке
function extractMessage(e: AxiosError<ApiErrorPayload> | any): string {
    if (axios.isAxiosError(e)) {
        const msg =
            e.response?.data?.message ??
            (typeof e.response?.data === 'string' ? e.response?.data : undefined) ??
            e.message;
        return msg || 'Request failed';
    }
    return (e && e.message) || 'Request failed';
}

// Определяем, относится ли URL к auth-роутам (login/register/reset)
function isAuthRoute(url: string | undefined): boolean {
    if (!url) return false;
    return /\/auth\/?(login|register|signin|signup|reset|forgot)/i.test(url) || /sign/i.test(url);
}

// Интерцептор ответов
http.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<ApiErrorPayload>) => {
        // network error / без ответа
        if (!error.response) {
            notifyError?.('Network error');
            return Promise.reject(error);
        }

        const { status, config } = error.response;
        const urlFromConfig = config?.url ?? (error as any)?.request?.responseURL;

        if (status === 401) {
            if (isAuthRoute(urlFromConfig)) {
                notifyError?.(extractMessage(error));
            } else {
                // не на auth-странице — выходим из аккаунта
                logoutHandler?.();
            }
            return Promise.reject(error);
        }

        if (status === 422) {
            notifyError?.(extractMessage(error));
            return Promise.reject(error);
        }

        if (status === 400) {
            // 400 возвращаем как текст, без тоста (решите как вам удобнее)
            return Promise.reject(extractMessage(error));
        }

        // по умолчанию — пробрасываем дальше
        return Promise.reject(error);
    }
);


export async function get<TResponse>(
    url: string,
    config?: AxiosRequestConfig
): Promise<TResponse> {
    const { data } = await http.get<TResponse>(url, { ...config });
    return data;
}

export async function getResponse<TResponse>(
    url: string,
    config?: AxiosRequestConfig
): Promise<AxiosResponse<TResponse>> {
    return http.get<TResponse>(url, { ...config });
}

export async function post<TResponse, TData = unknown>(
    url: string,
    data?: TData,
    config?: AxiosRequestConfig
): Promise<TResponse> {
    const { data: resp } = await http.post<TResponse>(url, data, { ...config });
    return resp;
}

export async function put<TResponse, TData = unknown>(
    url: string,
    data?: TData,
    config?: AxiosRequestConfig
): Promise<TResponse> {
    const { data: resp } = await http.put<TResponse>(url, data, { ...config });
    return resp;
}

export async function formDataPost<TResponse>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
): Promise<TResponse> {
    const { data } = await http.post<TResponse>(url, formData, {
        ...config,
        headers: { ...(config?.headers || {}), },
    });
    return data;
}

export async function formDataPut<TResponse>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
): Promise<TResponse> {
    const { data } = await http.put<TResponse>(url, formData, {
        ...config,
        headers: { ...(config?.headers || {}) },
    });
    return data;
}

export async function del<TResponse = unknown>(
    url: string,
    config?: AxiosRequestConfig
): Promise<TResponse> {
    const { data } = await http.delete<TResponse>(url, { ...config });
    return data;
}
