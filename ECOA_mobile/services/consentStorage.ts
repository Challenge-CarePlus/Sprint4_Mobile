import AsyncStorage from "@react-native-async-storage/async-storage";

export type ConsentRecord = {
    accepted: boolean;
    acceptedByGuardian: boolean;
    acceptedAt: string;
};

const CONSENT_KEY = "@ecoa_exercise_consent";

export async function getConsent(): Promise<ConsentRecord | null> {
    const stored = await AsyncStorage.getItem(CONSENT_KEY);
    return stored ? JSON.parse(stored) : null;
}

export async function saveConsent(acceptedByGuardian: boolean): Promise<ConsentRecord> {
    const record: ConsentRecord = {
        accepted: true,
        acceptedByGuardian,
        acceptedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    return record;
}

export async function hasConsent(): Promise<boolean> {
    const record = await getConsent();
    return Boolean(record?.accepted);
}
