import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Avatar, CheckRow, Dock, Note, SwitchRow } from "../../components/admin";
import { ActionBar, PageIntro } from "../../components/ds";
import { useToast } from "../../components/Toast";
import { useDraft } from "../../context/DraftContext";
import { Audience } from "../../data/training";
import { useLoad } from "../../hooks/useLoad";
import { trainingsApi } from "../../services/trainingsApi";
import { useTheme } from "../../theme/ThemeContext";
import { fonts } from "../../theme/tokens";
import { LoadGate, padStyles } from "./common";

/** Escolher pacientes: "Todos" ou seleção individual com busca. */
export default function PickPatientsScreen() {
    const navigation = useNavigation();
    const { colors, shadow } = useTheme();
    const toast = useToast();
    const { draft, setAudience } = useDraft();
    const state = useLoad(() => trainingsApi.listPatients());

    const [audience, setLocal] = useState<Audience>({ all: draft.audience.all, ids: [...draft.audience.ids] });
    const [query, setQuery] = useState("");

    const patients = state.data ?? [];
    const q = query.trim().toLowerCase();
    const list = patients.filter((p) => !q || p.name.toLowerCase().includes(q) || p.trail.toLowerCase().includes(q));
    const count = audience.all ? patients.length : audience.ids.length;
    const allSelected = patients.length > 0 && audience.ids.length === patients.length;

    function toggle(id: string) {
        const ids = audience.ids.includes(id) ? audience.ids.filter((x) => x !== id) : [...audience.ids, id];
        setLocal({ all: false, ids });
    }

    function confirm() {
        if (!audience.all && !audience.ids.length) {
            toast("Escolha pelo menos um paciente ou ative Todos.");
            return;
        }
        setAudience(audience.all ? { all: true, ids: [] } : audience);
        navigation.goBack();
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <ScrollView contentContainerStyle={padStyles.padDock} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <PageIntro align="left" title="Quem vai ver este treino" subtitle="Escolha todos ou só alguns pacientes." />

                <SwitchRow
                    on={audience.all}
                    label="Todos os pacientes"
                    sub="Inclusive quem entrar depois"
                    onChange={(all) => setLocal({ all, ids: all ? [] : audience.ids })}
                />

                <LoadGate state={state} />

                {!audience.all && state.data !== null && (
                    <>
                        <View style={[styles.search, { backgroundColor: colors.surfaceRaised }, shadow.float]}>
                            <MaterialIcons name="search" size={20} color={colors.inkMuted} />
                            <TextInput
                                value={query}
                                onChangeText={setQuery}
                                placeholder="Buscar por nome ou trilha"
                                placeholderTextColor={colors.inkMuted}
                                accessibilityLabel="Buscar paciente"
                                style={[styles.searchInput, { color: colors.ink }, noOutline]}
                            />
                        </View>

                        <View style={styles.selRow}>
                            <Text style={[styles.selText, { color: colors.inkMuted }]}>
                                {`${audience.ids.length} de ${patients.length} selecionados`}
                            </Text>
                            <Pressable
                                onPress={() => setLocal({ all: false, ids: allSelected ? [] : patients.map((p) => p.id) })}
                                accessibilityRole="button"
                                style={styles.selLink}
                            >
                                <Text style={[styles.link, { color: colors.brandInk }]}>
                                    {allSelected ? "Limpar" : "Selecionar todos"}
                                </Text>
                            </Pressable>
                        </View>

                        {list.map((patient) => (
                            <CheckRow
                                key={patient.id}
                                on={audience.ids.includes(patient.id)}
                                title={patient.name}
                                subtitle={patient.trail}
                                avatar={<Avatar name={patient.name} />}
                                onChange={() => toggle(patient.id)}
                            />
                        ))}

                        {!list.length && <Note>{`Nenhum paciente encontrado para "${query}".`}</Note>}
                    </>
                )}
            </ScrollView>

            <Dock>
                <ActionBar
                    title="Confirmar"
                    subtitle={
                        audience.all
                            ? "Todos os pacientes"
                            : count === 0
                              ? "Escolha pelo menos um"
                              : count === 1
                                ? "1 paciente"
                                : `${count} pacientes`
                    }
                    onPress={confirm}
                />
            </Dock>
        </View>
    );
}

const noOutline = { outlineStyle: "none", outlineWidth: 0 } as object;

const styles = StyleSheet.create({
    container: { flex: 1 },
    search: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        height: 48,
        paddingHorizontal: 16,
        borderRadius: 999,
    },
    searchInput: { flex: 1, minWidth: 0, fontFamily: fonts.body, fontSize: 14 },
    selRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    selText: { fontFamily: fonts.body, fontSize: 13 },
    selLink: { minHeight: 48, justifyContent: "center", paddingHorizontal: 4 },
    link: { fontFamily: fonts.bodySemiBold, fontSize: 14 },
});
