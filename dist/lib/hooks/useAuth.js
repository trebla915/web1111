"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = useAuth;
const react_1 = require("react");
const AuthProvider_1 = require("@/components/providers/AuthProvider");
// Hook to use the auth context
function useAuth() {
    const context = (0, react_1.useContext)(AuthProvider_1.AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
