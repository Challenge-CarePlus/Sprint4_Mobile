import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "../pages/Login";
import Main from "../pages/Main";
import Register from "../pages/Register";

import { useAuth } from "../context/AuthContext";
import Menu from "../components/Menu";
import Settings from "../pages/Settings";
import VisionSpike from "../pages/_dev/VisionSpike";

import ConsentScreen from "../pages/exercise/ConsentScreen";
import TrackSelectScreen from "../pages/exercise/TrackSelectScreen";
import ExercisePreviewScreen from "../pages/exercise/ExercisePreviewScreen";
import CalibrationScreen from "../pages/exercise/CalibrationScreen";
import ExerciseSessionScreen from "../pages/exercise/ExerciseSessionScreen";
import CycleSummaryScreen from "../pages/exercise/CycleSummaryScreen";

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
                name="SETTINGS"
                component={Settings}
            />

            {/* Nova aba de exercícios de fonoaudiologia em casa (v2). */}
            <Stack.Screen
                name="CONSENT"
                component={ConsentScreen}
            />
            <Stack.Screen
                name="TRACK_SELECT"
                component={TrackSelectScreen}
            />
            <Stack.Screen
                name="EXERCISE_PREVIEW"
                component={ExercisePreviewScreen}
            />
            <Stack.Screen
                name="CALIBRATION"
                component={CalibrationScreen}
            />
            <Stack.Screen
                name="EXERCISE_SESSION"
                component={ExerciseSessionScreen}
            />
            <Stack.Screen
                name="CYCLE_SUMMARY"
                component={CycleSummaryScreen}
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