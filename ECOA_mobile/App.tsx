import { useFonts, Montserrat_600SemiBold, Montserrat_700Bold } from "@expo-google-fonts/montserrat";
import { OpenSans_400Regular, OpenSans_600SemiBold } from "@expo-google-fonts/open-sans";
import { ActivityIndicator, View } from "react-native";

import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./routes/AppRouter";
import { colors } from "./theme/tokens";

export default function App() {
    const [fontsLoaded] = useFonts({
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
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
}
