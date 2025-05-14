"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAuthStateChange = exports.resetPassword = exports.logoutUser = exports.loginUser = exports.registerUser = void 0;
const auth_1 = require("firebase/auth");
const config_1 = require("@/lib/firebase/config");
const js_cookie_1 = __importDefault(require("js-cookie"));
const users_1 = require("./users");
// Convert Firebase user to our User type
const formatUser = (user) => {
    return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
    };
};
// Register a new user
const registerUser = async (email, password) => {
    try {
        const userCredential = await (0, auth_1.createUserWithEmailAndPassword)(config_1.auth, email, password);
        // Format user with the default role of 'user'
        const user = {
            ...formatUser(userCredential.user),
            role: 'user'
        };
        // Get token and store in cookie
        const token = await (0, auth_1.getIdToken)(userCredential.user, true);
        js_cookie_1.default.set('authToken', token, { expires: 7 }); // 7 days expiry
        return user;
    }
    catch (error) {
        throw new Error(error.message);
    }
};
exports.registerUser = registerUser;
// Login existing user
const loginUser = async (email, password) => {
    try {
        const userCredential = await (0, auth_1.signInWithEmailAndPassword)(config_1.auth, email, password);
        // Format the user with basic Firebase info
        const formattedUser = formatUser(userCredential.user);
        // Get additional user info from Firestore
        const userDoc = await (0, users_1.getUserById)(formattedUser.uid);
        // Merge Firebase auth info with Firestore data
        const user = {
            ...formattedUser,
            role: userDoc?.role || 'user',
            // Add any other fields from Firestore that you need
        };
        // Get token and store in cookie
        const token = await (0, auth_1.getIdToken)(userCredential.user, true);
        console.log('Setting auth token:', {
            tokenLength: token.length,
            uid: user.uid,
            role: user.role
        });
        js_cookie_1.default.set('authToken', token, {
            expires: 7, // 7 days expiry
            path: '/', // Make sure cookie is available across all paths
            secure: true, // Only send over HTTPS
            sameSite: 'lax' // Allow cross-site requests
        });
        // Also store the user's role and basic info in a separate cookie for the middleware
        const userInfo = {
            uid: user.uid,
            email: user.email,
            role: user.role,
        };
        js_cookie_1.default.set('userInfo', JSON.stringify(userInfo), {
            expires: 7,
            path: '/',
            secure: true,
            sameSite: 'lax'
        });
        return user;
    }
    catch (error) {
        console.error('Login error:', error);
        throw new Error(error.message);
    }
};
exports.loginUser = loginUser;
// Logout user
const logoutUser = async () => {
    // Remove all auth-related cookies
    js_cookie_1.default.remove('authToken');
    js_cookie_1.default.remove('userInfo');
    return (0, auth_1.signOut)(config_1.auth);
};
exports.logoutUser = logoutUser;
// Reset password
const resetPassword = async (email) => {
    try {
        await (0, auth_1.sendPasswordResetEmail)(config_1.auth, email);
    }
    catch (error) {
        throw new Error(error.message);
    }
};
exports.resetPassword = resetPassword;
// Subscribe to auth state changes
const onAuthStateChange = (callback) => {
    return (0, auth_1.onAuthStateChanged)(config_1.auth, async (firebaseUser) => {
        if (firebaseUser) {
            try {
                // Format the user with basic Firebase info
                const formattedUser = formatUser(firebaseUser);
                // Get additional user info from Firestore
                const userDoc = await (0, users_1.getUserById)(formattedUser.uid);
                // Merge Firebase auth info with Firestore data
                const completeUser = {
                    ...formattedUser,
                    role: userDoc?.role || 'user',
                    // Include any other fields from Firestore
                    displayName: userDoc?.displayName || formattedUser.displayName,
                    photoURL: userDoc?.photoURL || formattedUser.photoURL,
                    phone: userDoc?.phone,
                };
                callback(completeUser);
            }
            catch (error) {
                console.error('Error fetching user data:', error);
                // Fall back to basic user info if Firestore fetch fails
                callback(formatUser(firebaseUser));
            }
        }
        else {
            callback(null);
        }
    });
};
exports.onAuthStateChange = onAuthStateChange;
