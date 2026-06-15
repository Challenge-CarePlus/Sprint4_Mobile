import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type InstructionItem = {
    iconName: keyof typeof MaterialIcons.glyphMap;
    title: string;
    description: string;
};

const instructions: InstructionItem[] = [
    {
        iconName: "face-retouching-natural",
        title: "Posicione o rosto",
        description: "Mantenha o rosto centralizado na câmera para que o exercício seja analisado corretamente.",
    },
    {
        iconName: "wb-sunny",
        title: "Ambiente iluminado",
        description: "Escolha um local com boa iluminação e evite sombras fortes no rosto.",
    },
    {
        iconName: "phone-android",
        title: "Celular parado",
        description: "Segure o celular com firmeza ou apoie o aparelho durante a prática.",
    },
    {
        iconName: "record-voice-over",
        title: "Siga o feedback",
        description: "Abra e feche a boca conforme as orientações exibidas na tela.",
    },
];

export default function ExerciseIntro() {
    const navigation = useNavigation();

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.headerContainer}>
                <View style={styles.iconContainer}>
                    <MaterialIcons
                        name="fitness-center"
                        size={38}
                        color="#fff"
                    />
                </View>

                <Text style={styles.titleText}>
                    Exercício de abertura de boca
                </Text>

                <Text style={styles.subtitleText}>
                    Antes de começar, prepare o ambiente e siga as orientações para ter uma prática mais precisa.
                </Text>
            </View>

            <View style={styles.instructionsContainer}>
                {instructions.map((instruction) => (
                    <View
                        key={instruction.title}
                        style={styles.instructionCard}
                    >
                        <View style={styles.instructionIconContainer}>
                            <MaterialIcons
                                name={instruction.iconName}
                                size={26}
                                color="#fff"
                            />
                        </View>

                        <View style={styles.instructionTextContainer}>
                            <Text style={styles.instructionTitle}>
                                {instruction.title}
                            </Text>

                            <Text style={styles.instructionDescription}>
                                {instruction.description}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.tipBox}>
                <MaterialIcons
                    name="info"
                    size={24}
                    color="#284A7D"
                />

                <Text style={styles.tipText}>
                    O feedback será exibido em tempo real durante o exercício.
                </Text>
            </View>

            <TouchableOpacity
                style={styles.startButton}
                onPress={() => navigation.navigate("CAMERA" as never)}
                activeOpacity={0.85}
            >
                <Text style={styles.startButtonText}>
                    Iniciar exercício
                </Text>

                <MaterialIcons
                    name="arrow-forward"
                    size={24}
                    color="#fff"
                />
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: "10%",
        height: "85%"
    },

    contentContainer: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingVertical: 40,
        gap: 24,
    },

    headerContainer: {
        alignItems: "center",
        gap: 12,
    },

    iconContainer: {
        width: 78,
        height: 78,
        borderRadius: 999,
        backgroundColor: "#284A7D",
        justifyContent: "center",
        alignItems: "center",

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.18,
        shadowRadius: 5,
        elevation: 5,
    },

    titleText: {
        fontFamily: "Righteous_400Regular",
        fontSize: 30,
        textAlign: "center",
        color: "#1E3E6D",
    },

    subtitleText: {
        color: "#6B7280",
        fontSize: 16,
        lineHeight: 22,
        textAlign: "center",
        fontWeight: "500",
    },

    instructionsContainer: {
        gap: 14,
    },

    instructionCard: {
        width: "100%",
        borderColor: "#284A7D",
        borderWidth: 2,
        borderRadius: 8,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        backgroundColor: "#fff",
    },

    instructionIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 999,
        backgroundColor: "#284A7D",
        justifyContent: "center",
        alignItems: "center",
    },

    instructionTextContainer: {
        flex: 1,
        gap: 4,
    },

    instructionTitle: {
        color: "#000",
        fontFamily: "Righteous_400Regular",
        fontSize: 19,
    },

    instructionDescription: {
        color: "#6B7280",
        fontSize: 14,
        lineHeight: 19,
        fontWeight: "500",
    },

    tipBox: {
        borderRadius: 8,
        backgroundColor: "#EAF2FF",
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    tipText: {
        flex: 1,
        color: "#284A7D",
        fontSize: 14,
        lineHeight: 19,
        fontWeight: "700",
    },

    startButton: {
        backgroundColor: "#284A7D",
        width: "100%",
        paddingVertical: 15,
        paddingHorizontal: 18,
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
        marginBottom: "20%"
    },

    startButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
});
