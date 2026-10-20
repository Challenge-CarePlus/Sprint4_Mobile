import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Access } from "../models/login";
import { JWT_SECRET } from "../config/jwt";
import { auth, AuthPayload } from "../middleware/auth";
import { createUser, findByEmail, findById } from "../db/userStore";

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

router.post("/register",async (req, res) => {
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

        if (!EMAIL_REGEX.test(email)) {
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
            access: Access.USER
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
            user: {
                id: novoUsuario.id,
                name: novoUsuario.name,
                email: novoUsuario.email,
                access: novoUsuario.access
            }
        });
    } catch (error) {
        console.error("register:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno"
        });
    }
});

router.post("/login",async (req, res) => {
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

        if (!user || !validPassword) {
            return res.status(401).json({
                success: false,
                message: "Credenciais inválidas"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                access: user.access
            },
            JWT_SECRET,
            {
                expiresIn: "3d"
            }
        );

        return res.json({
            success: true,
            token
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
// expirada/inválida ao abrir o app (F1 do QA).
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
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            access: user.access
        }
    });
});

export default router;
