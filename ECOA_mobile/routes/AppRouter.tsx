import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "../pages/Login";
import Main from "../pages/Main";
import Register from "../pages/Register";
import ExerciseIntro from "../pages/ExerciseIntro";

import { useAuth } from "../context/AuthContext";
import Menu from "../components/Menu";
import Camera from "../pages/Camera";
import Settings from "../pages/Settings";
import VisionSpike from "../pages/_dev/VisionSpike";

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
            <Stack.Screen
                name="EXERCISE_INTRO"
                component={ExerciseIntro}
            />
            <Stack.Screen
                name="CAMERA"
                component={Camera}
            />
            <Stack.Screen
                name="SETTINGS"
                component={Settings}
            />

            {/* Fase 0 (spike técnico) — tela de diagnóstico, não faz parte do produto final. */}
            <Stack.Screen
                name="VISION_SPIKE"
                component={VisionSpike}
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

            <Stack.Screen
                name="REGISTER"
                component={Register}
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