export const isServer = typeof window === 'undefined';
export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';
