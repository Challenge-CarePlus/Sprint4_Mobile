import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme, useThemedStyles } from "../theme/ThemeContext";
import { fonts, radii, Theme } from "../theme/tokens";

export type ConfirmOptions = {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
};

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm>(() => Promise.resolve(false));

type Pending = ConfirmOptions & { resolve: (yes: boolean) => void };

/**
 * Confirmação própria do DS para ações destrutivas (no lugar de window.confirm / Alert.alert): segue o tema
 * claro/escuro, Escape e o toque fora cancelam, alvos de 48px. Na web o Modal do react-native-web prende o foco.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [pending, setPending] = useState<Pending | null>(null);

    const confirm = useCallback<Confirm>(
        (options) =>
            new Promise<boolean>((resolve) => {
                // Uma pergunta nova cancela a anterior em vez de deixá-la pendurada.
                setPending((previous) => {
                    previous?.resolve(false);
                    return { ...options, resolve };
                });
            }),
        []
    );

    const answer = useCallback((yes: boolean) => {
        setPending((current) => {
            current?.resolve(yes);
            return null;
        });
    }, []);

    const value = useMemo(() => confirm, [confirm]);

    return (
        <ConfirmContext.Provider value={value}>
            {children}
            {pending ? <Dialog options={pending} onAnswer={answer} /> : null}
        </ConfirmContext.Provider>
    );
}

export function useConfirm(): Confirm {
    return useContext(ConfirmContext);
}

function Dialog({ options, onAnswer }: { options: ConfirmOptions; onAnswer: (yes: boolean) => void }) {
    const { colors } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const cancelRef = useRef<View>(null);

    // Foco inicial no "Cancelar": a opção segura (Enter não exclui sem querer).
    useEffect(() => {
        const timer = setTimeout(() => (cancelRef.current as unknown as HTMLElement | null)?.focus?.(), 50);
        return () => clearTimeout(timer);
    }, []);

    const dialogProps = (Platform.OS === "web"
        ? { role: "alertdialog", "aria-modal": true, "aria-labelledby": "confirm-title", "aria-describedby": "confirm-message" }
        : { accessibilityRole: "alert", accessibilityViewIsModal: true }) as object;

    return (
        <Modal transparent animationType="fade" visible onRequestClose={() => onAnswer(false)} statusBarTranslucent>
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={() => onAnswer(false)} accessible={false} />
                <View style={styles.dialog} {...dialogProps}>
                    <View style={styles.icon}>
                        <Text style={{ color: colors.danger, fontSize: 22 }} accessibilityElementsHidden importantForAccessibility="no">
                            !
                        </Text>
                    </View>
                    <Text style={styles.title} nativeID="confirm-title" accessibilityRole="header">
                        {options.title}
                    </Text>
                    <Text style={styles.message} nativeID="confirm-message">
                        {options.message}
                    </Text>
                    <View style={styles.actions}>
                        <Pressable
                            ref={cancelRef}
                            onPress={() => onAnswer(false)}
                            accessibilityRole="button"
                            style={({ pressed }) => [styles.button, styles.cancel, pressed && { opacity: 0.85 }]}
                        >
                            <Text style={styles.cancelText}>{options.cancelLabel ?? "Cancelar"}</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => onAnswer(true)}
                            accessibilityRole="button"
                            style={({ pressed }) => [styles.button, styles.danger, pressed && { opacity: 0.85 }]}
                        >
                            <Text style={styles.dangerText}>{options.confirmLabel ?? "Excluir"}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const makeStyles = ({ colors, shadow }: Theme) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            backgroundColor: "rgba(6, 27, 56, 0.6)",
        },
        dialog: {
            width: "100%",
            maxWidth: 420,
            gap: 12,
            padding: 24,
            borderRadius: radii.lg,
            backgroundColor: colors.surfaceRaised,
            ...shadow.float,
        },
        icon: {
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.dangerSoft,
        },
        title: { fontFamily: fonts.bodySemiBold, fontSize: 20, lineHeight: 26, color: colors.ink },
        message: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.inkMuted },
        actions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
        button: {
            flexGrow: 1,
            flexBasis: 140,
            minHeight: 52,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 20,
            borderRadius: radii.pill,
        },
        cancel: { backgroundColor: colors.brandSoft },
        cancelText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.brandInk },
        danger: { backgroundColor: colors.danger },
        dangerText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.surface },
    });
