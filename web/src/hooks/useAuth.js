import { API, Auth } from "aws-amplify";
import { createContext, useContext, useEffect, useState } from "react";
import LoadingBlock from "../components/LoadingBlock";

const AuthContext = createContext();

function getKey(keyName, defaultValue) {
    let value = localStorage.getItem(keyName);
    if (value === null)
        value = sessionStorage.getItem(keyName);
    if (value === null)
        return defaultValue;
    try {
        return JSON.parse(value);
    } catch {
        return defaultValue;
    }
}

function setKey(keyName, value) {
    value = JSON.stringify(value);

    try {
        localStorage.setItem(keyName, value);
    } catch {
        try {
            sessionStorage.setItem(keyName, value);
        } catch (e) {
            console.log(`Could not set key "${keyName}" in either local or session storage: ${e}`);
        }
    }
}

const RememberMeKey = 'rememberMe';

function configureAuth(rememberMe) {
    Auth.configure({ storage: rememberMe ? localStorage : sessionStorage });
}

async function loadAuth({ setUser, setAuthenticated }) {
    configureAuth(getKey(RememberMeKey, true));
    try {
        const user = await Auth.currentAuthenticatedUser();
        const session = await Auth.currentSession();
        if (session.isValid()) {
            setUser(user);
            setAuthenticated(true);
        }
    }
    catch (e) {
        console.log(`Initial authentication failed: ${e}`);
    }
}

function AuthProvider({ children }) {
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAuth({ setUser, setAuthenticated }).then(() => setLoading(false));
    }, []);

    // Show loading indicator while authentication state is loading
    if (loading) 
        return <LoadingBlock />

    function doApi(method) {
        return async function api(path, request={}, authenticate=true) {
            if (authenticate && !authenticated)
                throw Error(`User must be authenticated to use requested API: ${path}`);
            
            const authHeaders = authenticate ? {
                Authorization: user.signInUserSession.idToken.jwtToken
            } : {}

            return await method.call(API, 'splitr', path, {
                headers: {...authHeaders},
                ...request
            });
        }
    }

    const authObject = Object.freeze({
        authenticated() { return authenticated },
        user() { return user },

        async signUp(accountInfo) {
            await Auth.signUp({
                username: accountInfo.email,
                password: accountInfo.password,
                attributes: {
                    email: accountInfo.email,
                    given_name: accountInfo.firstName,
                    family_name: accountInfo.lastName,
                    'custom:hourlyWage': accountInfo.hourlyWage,
                    'custom:accessKey': accountInfo.accessKey
                }
            });
        },

        async signIn(email, password, rememberMe) {
            if (authenticated) return;
            setKey(RememberMeKey, rememberMe);
            configureAuth(rememberMe);
            const user = await Auth.signIn(email, password);
            setUser(user);
            if (user.challengeName === 'NEW_PASSWORD_REQUIRED')
                throw new Error('Admin accounts are currently disabled.');
            setAuthenticated(true);
        },

        async updatePassword(newPassword) {
            if (!user) throw new Error('Previous sign in attempt required.');
            await Auth.completeNewPassword(user, newPassword);
            setAuthenticated(true);
        },

        async signOut() {
            if (!authenticated) throw new Error('User was not signed in');
            await Auth.signOut();
            setAuthenticated(false);
            setUser(null);
        },

        api: Object.freeze({
            get: doApi(API.get),
            post: doApi(API.post)
        })
    });

    return <AuthContext.Provider value={authObject}>{children}</AuthContext.Provider>;
}

export default function useAuth() {
    return useContext(AuthContext);
}

export { AuthProvider };