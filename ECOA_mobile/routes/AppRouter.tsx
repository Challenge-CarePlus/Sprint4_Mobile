import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "../pages/Login";
import Main from "../pages/Main";
import Register from "../pages/Register";
import Entrance from "../pages/Entrance";
import EvolutionScreen from "../pages/admin/EvolutionScreen";
import PatientScreen from "../pages/admin/PatientScreen";
import TrainingsScreen from "../pages/admin/TrainingsScreen";
import EditTrainingScreen from "../pages/admin/EditTrainingScreen";
import PickPatientsScreen from "../pages/admin/PickPatientsScreen";
import EditExerciseScreen from "../pages/admin/EditExerciseScreen";
import TestExerciseScreen from "../pages/admin/TestExerciseScreen";

import { AUTH_REQUIRED } from "../config/authConfig";
import { findTrack } from "../services/trackStore";
import { ThemeScope, useTheme } from "../theme/ThemeContext";
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

/** Trilha Infantil fica sempre clara (regra do DS), mesmo com o app no escuro. */
function themeFor(params: unknown): "light" | undefined {
    const trackId = (params as { trackId?: string } | undefined)?.trackId;
    return findTrack(trackId)?.ageGroup === "children" ? "light" : undefined;
}

function PrivateRoutes() {
    return (
        <Stack.Navigator
            screenLayout={({ route, children }) => <ThemeScope force={themeFor(route.params)}>{children}</ThemeScope>}
            screenOptions={{
                header: ({ route }) => (
                    <ThemeScope force={themeFor(route.params)}>
                        <Menu />
                    </ThemeScope>
                ),
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

            {/* Modo administrador (v3): o painel só aparece no menu/Home do admin e o servidor valida o papel. */}
            <Stack.Screen name="EVOLUTION" component={EvolutionScreen} />
            <Stack.Screen name="PATIENT" component={PatientScreen} />
            <Stack.Screen name="TRAININGS" component={TrainingsScreen} />
            <Stack.Screen name="EDIT_TRAINING" component={EditTrainingScreen} />
            <Stack.Screen name="PICK_PATIENTS" component={PickPatientsScreen} />
            <Stack.Screen name="EDIT_EXERCISE" component={EditExerciseScreen} />
            <Stack.Screen name="TEST_EXERCISE" component={TestExerciseScreen} />

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


/** Entrada do evento (AUTH_REQUIRED=false): acesso livre, só a equipe precisa logar. */
function EntranceRoutes() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ENTRANCE" component={Entrance} />
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
    const { colors } = useTheme();

    const { role } = useAuth();

    if (loading) {
        return null;
    }

    // AUTH_REQUIRED=true: login/cadastro de antes. false: tela de entrada do evento, que
    // deixa passar sem preencher nada (anônimo) ou com a conta da equipe/paciente.
    const canEnter = AUTH_REQUIRED ? Boolean(token) : role !== null;

    const navTheme = {
        ...DefaultTheme,
        colors: { ...DefaultTheme.colors, background: colors.surface, card: colors.surfaceRaised, text: colors.ink },
    };

    return (
        <NavigationContainer theme={navTheme}>
            {canEnter ? <PrivateRoutes /> : AUTH_REQUIRED ? <PublicRoutes /> : <EntranceRoutes />}
        </NavigationContainer>
    );
}