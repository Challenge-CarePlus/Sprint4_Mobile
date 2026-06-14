import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
    Camera as VisionCamera,
    useCameraDevice,
    useCameraPermission,
} from "react-native-vision-camera";

export default function Camera() {
    const frontDevice = useCameraDevice("front");
    const backDevice = useCameraDevice("back");

    const device = frontDevice ?? backDevice;

    const { hasPermission, requestPermission } = useCameraPermission();

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    if (!hasPermission) {
        return (
            <View style={styles.container}>
                <Text>Permissão da câmera necessária</Text>
            </View>
        );
    }

    if (!device) {
        return (
            <View style={styles.container}>
                <Text>Nenhuma câmera encontrada no dispositivo</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.cameraArea}>
                <VisionCamera
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={true}
                />
            </View>

            <View style={styles.bottomSpace} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },

    cameraArea: {
        width: "80%",
        height: "70%",
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#000",
    },

    bottomSpace: {
        height: 60,
    },
});