import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { Avatar, Chips, MetricPanel, Note, Progress, RowCard } from "../../components/admin";
import { PageIntro } from "../../components/ds";
import { useLoad } from "../../hooks/useLoad";
import { trainingsApi } from "../../services/trainingsApi";
import { useTheme } from "../../theme/ThemeContext";
import { LoadGate, padStyles, ReloadError } from "./common";

const FILTERS = [
    { value: "Todas", label: "Todas" },
    { value: "Infantil", label: "Infantil" },
    { value: "Dicção e oratória", label: "Dicção" },
    { value: "Fortalecimento orofacial", label: "Orofacial" },
];

/** Evolução dos pacientes: filtro por trilha, resumo da semana e lista por adesão (dados de exemplo). */
export default function EvolutionScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const state = useLoad(() => trainingsApi.listPatients());
    const [filter, setFilter] = useState("Todas");

    const all = state.data ?? [];
    const list = all.filter((p) => filter === "Todas" || p.trail === filter);
    const average = Math.round(list.reduce((sum, p) => sum + p.adherence, 0) / Math.max(1, list.length));
    const doneThisWeek = list.reduce((sum, p) => sum + p.week.reduce((a, b) => a + b, 0), 0);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.surface }]}
            contentContainerStyle={padStyles.pad}
            showsVerticalScrollIndicator={false}
        >
            <PageIntro
                align="left"
                title="Evolução dos pacientes"
                subtitle="Últimos 7 dias. Dados de exemplo do protótipo."
            />

            <LoadGate state={state} />
            <ReloadError state={state} />

            {state.data !== null && (
                <>
                    <Chips options={FILTERS} value={filter} onChange={setFilter} label="Filtrar por trilha" />

                    <MetricPanel
                        title="Resumo da semana"
                        metrics={[
                            { label: "Pacientes", value: String(list.length), unit: "ativos", icon: "person" },
                            { label: "Exercícios", value: String(doneThisWeek), unit: "feitos", icon: "fitness-center" },
                            { label: "Adesão", value: String(average), unit: "% média", icon: "insights" },
                        ]}
                    />

                    {list
                        .slice()
                        .sort((a, b) => a.adherence - b.adherence)
                        .map((patient) => (
                            <RowCard
                                key={patient.id}
                                leading={<Avatar name={patient.name} />}
                                title={patient.name}
                                subtitle={`${patient.trail} · ${patient.lastSession}`}
                                accessibilityLabel={`${patient.name}, adesão ${patient.adherence}%`}
                                onPress={() => (navigation as any).navigate("PATIENT", { id: patient.id })}
                            >
                                <Progress value={patient.adherence} label={`Adesão de ${patient.name}`} />
                            </RowCard>
                        ))}

                    <Note>Ordenado de quem precisa de mais atenção para quem está indo melhor.</Note>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
