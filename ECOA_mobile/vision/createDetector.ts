import { ValidationRule } from "../data/types";
import { MovementDetector } from "./MovementDetector";
import { AlternatingDetector, Detector, VowelSequenceDetector } from "./SequenceDetectors";

/** Escolhe o detector que combina com a instrução do exercício (ver `ValidationRule.mode`). */
export function createDetector(rule: ValidationRule, baseline: Record<string, number>): Detector {
    if (rule.mode === "alternate") return new AlternatingDetector(rule, baseline);
    if (rule.mode === "vowels") return new VowelSequenceDetector(rule, baseline);
    return new MovementDetector(rule, baseline);
}
