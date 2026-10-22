import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { toPublicUser } from "../models/login";
import { JWT_SECRET } from "../config/jwt";
import { auth, AuthPayload } from "../middleware/auth";
import { createUser, findByEmail, findById } from "../db/userStore";

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 100;
const PASSWORD_MIN = 6;
// bcrypt só considera os primeiros 72 bytes; acima disso senhas diferentes colidem.
const PASSWORD_MAX = 72;

// Hash usado quando o e-mail não existe, pra o login gastar o mesmo tempo de
// bcrypt nos dois casos (senão o tempo de resposta revela se a conta existe).
const DUMMY_HASH = bcrypt.hashSync("ecoa-dummy-password", 10);

function normalizeEmail(value: unknown): string | null {
    return typeof value === "string" ? value.trim().toLowerCase() : null;
}

router.get("/", (req, res) => {
    res.json({
        message: "Auth API funcionando"
    });
});

// Cadastro aberto continua existindo (dormente no app com AUTH_REQUIRED=false);
// quem se cadastra é sempre paciente — o papel nunca vem do corpo da requisição.
router.post("/register", async (req, res) => {
    try {
        const { name, password } = req.body ?? {};
        const email = normalizeEmail(req.body?.email);

        if (
            typeof name !== "string" || !name.trim() ||
            !email ||
            typeof password !== "string" || !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Nome, email e senha são obrigatórios"
            });
        }

        if (name.trim().length > NAME_MAX) {
            return res.status(400).json({
                success: false,
                message: `O nome deve ter até ${NAME_MAX} caracteres`
            });
        }

        if (email.length > 254 || !EMAIL_REGEX.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Email inválido"
            });
        }

        if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
            return res.status(400).json({
                success: false,
                message: `A senha deve ter entre ${PASSWORD_MIN} e ${PASSWORD_MAX} caracteres`
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const novoUsuario = await createUser({
            name: name.trim(),
            email,
            password: hashedPassword,
            role: "patient"
        });

        if (!novoUsuario) {
            return res.status(409).json({
                success: false,
                message: "Email já cadastrado"
            });
        }

        return res.status(201).json({
            success: true,
            message: "Usuário cadastrado com sucesso",
            user: toPublicUser(novoUsuario)
        });
    } catch (error) {
        console.error("register:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno"
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const email = normalizeEmail(req.body?.email);
        const password = req.body?.password;

        if (!email || typeof password !== "string" || !password) {
            return res.status(400).json({
                success: false,
                message: "Email e senha são obrigatórios"
            });
        }

        const user = await findByEmail(email);

        const validPassword = await bcrypt.compare(
            password,
            user?.password ?? DUMMY_HASH
        );

        // Mesma mensagem pra e-mail desconhecido e senha errada: não revela qual dos dois falhou.
        if (!user || !validPassword) {
            return res.status(401).json({
                success: false,
                message: "E-mail ou senha inválidos"
            });
        }

        const payload: AuthPayload = { id: user.id, email: user.email, role: user.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "3d" });

        return res.json({
            success: true,
            token,
            user: toPublicUser(user)
        });
    } catch (error) {
        console.error("login:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno"
        });
    }
});

// Valida o token e devolve o usuário — o front usa pra descartar sessão
// expirada/inválida ao abrir o app.
router.get("/me", auth, async (_req, res) => {
    const payload = res.locals.user as AuthPayload;
    const user = await findById(payload.id);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Token inválido"
        });
    }

    return res.json({
        success: true,
        user: toPublicUser(user)
    });
});

export default router;
