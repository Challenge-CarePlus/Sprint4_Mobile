import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "../pages/Login";
import Main from "../pages/Main";

import { useAuth } from "../context/AuthContext";
import Menu from "../components/Menu";

const Stack = createNativeStackNavigator();

function PrivateRoutes() {
    return (
        <Stack.Navigator
            screenOptions={{
                header: () => <Menu />,
            }}
        >
            <Stack.Screen
                name="MAIN"
                component={Main}
            />
        </Stack.Navigator>
    );
}

function PublicRoutes() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="LOGIN"
                component={Login}
            />
        </Stack.Navigator>
    );
}

export default function AppRouter() {
    const { token, loading } = useAuth();

    if (loading) {
        return null;
    }

    return (
        <NavigationContainer>
            {token ? (
                <PrivateRoutes />
            ) : (
                <PublicRoutes />
            )}
        </NavigationContainer>
    );
}