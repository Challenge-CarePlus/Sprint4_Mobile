import { useFonts, Montserrat_600SemiBold, Montserrat_700Bold } from "@expo-google-fonts/montserrat";
import { BarlowCondensed_800ExtraBold } from "@expo-google-fonts/barlow-condensed";
import { OpenSans_400Regular, OpenSans_600SemiBold } from "@expo-google-fonts/open-sans";
import { ActivityIndicator, View } from "react-native";

import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./routes/AppRouter";
import { MAX_APP_WIDTH } from "./theme/layout";
import { colors } from "./theme/tokens";

export default function App() {
    const [fontsLoaded] = useFonts({
        BarlowCondensed_800ExtraBold,
        Montserrat_600SemiBold,
        Montserrat_700Bold,
        OpenSans_400Regular,
        OpenSans_600SemiBold,
    });

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
                <ActivityIndicator color={colors.brand} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, alignItems: "center", backgroundColor: colors.line }}>
            <View style={{ flex: 1, width: "100%", maxWidth: MAX_APP_WIDTH, backgroundColor: colors.surface }}>
                <AuthProvider>
                    <AppRouter />
                </AuthProvider>
            </View>
        </View>
    );
}
