declare module 'astro:env/client' {
	export const PUBLIC_ACCESS_TOKEN_POLICY_ID: string | undefined;	
	export const PUBLIC_GATEWAY_URL: string | undefined;	
	export const PUBLIC_CARDANO_NETWORK: string;	
}declare module 'astro:env/server' {
	export const ANDAMIO_API_KEY: string;	
	export const ANDAMIO_GATEWAY_URL: string;	
	export const CARDANO_NETWORK: string;	
	export const COURSE_ID: string | undefined;	
}