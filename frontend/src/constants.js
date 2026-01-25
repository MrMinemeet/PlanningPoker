// @ts-check

// @ts-check

// Determine base URL based on environment
const getBaseUrl = () => {
	const origin = window.location.origin;
	const hostname = window.location.hostname;
	
	// For production deployment (your domain), always use /planning-poker
	if (hostname === 'wtf-my-code.works') {
		return `${origin}/planning-poker`;
	}
	
	// For development (localhost), use root
	return origin;
};

export const BASE_URL = getBaseUrl();
export const API_BASE_URL = `${BASE_URL}/api`;