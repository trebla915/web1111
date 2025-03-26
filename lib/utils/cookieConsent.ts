import Cookies from 'js-cookie';

export type CookieConsentType = 'all' | 'essential' | null;

export const getCookieConsent = (): CookieConsentType => {
  return Cookies.get('cookieConsent') as CookieConsentType;
};

export const hasConsentForCookie = (cookieType: 'analytics' | 'marketing' | 'functional'): boolean => {
  const consent = getCookieConsent();
  
  if (consent === 'all') {
    return true;
  }
  
  if (consent === 'essential') {
    return cookieType === 'functional';
  }
  
  return false;
};

export const setCookieConsent = (type: CookieConsentType) => {
  Cookies.set('cookieConsent', type, { expires: 365 }); // 1 year expiry
  
  // Set individual cookie preferences based on consent type
  if (type === 'all') {
    Cookies.set('analyticsCookies', 'true', { expires: 365 });
    Cookies.set('marketingCookies', 'true', { expires: 365 });
    Cookies.set('functionalCookies', 'true', { expires: 365 });
  } else if (type === 'essential') {
    Cookies.set('functionalCookies', 'true', { expires: 365 });
    Cookies.remove('analyticsCookies');
    Cookies.remove('marketingCookies');
  }
};

export const removeAllCookies = () => {
  const cookies = Cookies.get();
  Object.keys(cookies).forEach(cookieName => {
    Cookies.remove(cookieName);
  });
};

export const getCookiePreferences = () => {
  return {
    analytics: Cookies.get('analyticsCookies') === 'true',
    marketing: Cookies.get('marketingCookies') === 'true',
    functional: Cookies.get('functionalCookies') === 'true',
  };
};

export const updateCookiePreferences = (preferences: {
  analytics?: boolean;
  marketing?: boolean;
  functional?: boolean;
}) => {
  if (preferences.analytics !== undefined) {
    Cookies.set('analyticsCookies', preferences.analytics.toString(), { expires: 365 });
  }
  if (preferences.marketing !== undefined) {
    Cookies.set('marketingCookies', preferences.marketing.toString(), { expires: 365 });
  }
  if (preferences.functional !== undefined) {
    Cookies.set('functionalCookies', preferences.functional.toString(), { expires: 365 });
  }
}; 