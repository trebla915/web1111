"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCookiePreferences = exports.getCookiePreferences = exports.removeAllCookies = exports.setCookieConsent = exports.hasConsentForCookie = exports.getCookieConsent = void 0;
const js_cookie_1 = __importDefault(require("js-cookie"));
const getCookieConsent = () => {
    return js_cookie_1.default.get('cookieConsent');
};
exports.getCookieConsent = getCookieConsent;
const hasConsentForCookie = (cookieType) => {
    const consent = (0, exports.getCookieConsent)();
    if (consent === 'all') {
        return true;
    }
    if (consent === 'essential') {
        return cookieType === 'functional';
    }
    return false;
};
exports.hasConsentForCookie = hasConsentForCookie;
const setCookieConsent = (type) => {
    js_cookie_1.default.set('cookieConsent', type, { expires: 365 }); // 1 year expiry
    // Set individual cookie preferences based on consent type
    if (type === 'all') {
        js_cookie_1.default.set('analyticsCookies', 'true', { expires: 365 });
        js_cookie_1.default.set('marketingCookies', 'true', { expires: 365 });
        js_cookie_1.default.set('functionalCookies', 'true', { expires: 365 });
    }
    else if (type === 'essential') {
        js_cookie_1.default.set('functionalCookies', 'true', { expires: 365 });
        js_cookie_1.default.remove('analyticsCookies');
        js_cookie_1.default.remove('marketingCookies');
    }
};
exports.setCookieConsent = setCookieConsent;
const removeAllCookies = () => {
    const cookies = js_cookie_1.default.get();
    Object.keys(cookies).forEach(cookieName => {
        js_cookie_1.default.remove(cookieName);
    });
};
exports.removeAllCookies = removeAllCookies;
const getCookiePreferences = () => {
    return {
        analytics: js_cookie_1.default.get('analyticsCookies') === 'true',
        marketing: js_cookie_1.default.get('marketingCookies') === 'true',
        functional: js_cookie_1.default.get('functionalCookies') === 'true',
    };
};
exports.getCookiePreferences = getCookiePreferences;
const updateCookiePreferences = (preferences) => {
    if (preferences.analytics !== undefined) {
        js_cookie_1.default.set('analyticsCookies', preferences.analytics.toString(), { expires: 365 });
    }
    if (preferences.marketing !== undefined) {
        js_cookie_1.default.set('marketingCookies', preferences.marketing.toString(), { expires: 365 });
    }
    if (preferences.functional !== undefined) {
        js_cookie_1.default.set('functionalCookies', preferences.functional.toString(), { expires: 365 });
    }
};
exports.updateCookiePreferences = updateCookiePreferences;
