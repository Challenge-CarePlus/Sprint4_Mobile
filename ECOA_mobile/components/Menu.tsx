import { MaterialIcons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { useState } from "react";
import {
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

export default function Menu() {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigation = useNavigation();

    const route = useRoute();
    const { logout } = useAuth();

    async function handleLogout() {
        await logout();
        setMenuOpen(false);
    }

    return (
        <View style={styles.fullMenu}>
            <StatusBar hidden />

            <View style={styles.menuContainer}>
                <View style={styles.menu}>
                    <Image
                        source={require("./../assets/ECOA.png")}
                    />

                    <TouchableOpacity
                        onPress={() =>
                            setMenuOpen(!menuOpen)
                        }
                    >
                        <MaterialIcons
                            name="menu"
                            size={32}
                            color="#284A7D"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {menuOpen && (
                <View style={styles.dropDown}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("MAIN" as never)}
                    >
                        <Text style={styles.menuText}>
                            Página inicial
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("CAMERA" as never)}
                    >
                        <Text style={styles.menuText}>
                            Exercício
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleLogout}
                    >
                        <Text style={styles.menuText}>
                            Sair
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    fullMenu: {
        width: "100%",
        zIndex: 1,
    },

    menuContainer: {
        position: "absolute",
        top: 0,
        width: "100%",
        height: 70,
        backgroundColor: "white",
        justifyContent: "center",
        paddingHorizontal: 25,

        elevation: 8,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },

    menu: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },

    dropDown: {
        position: "absolute",
        top: 0,
        marginTop: 70,

        width: "100%",

        backgroundColor: "#284A7D",

        paddingVertical: 10,
        paddingHorizontal: 25,

        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },

    menuText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",

        paddingVertical: 12,
    },

    title: {
        fontSize: 22,
        fontWeight: "bold",

        color: "#fff",

        textTransform: "uppercase",
        letterSpacing: 1,
    },
});