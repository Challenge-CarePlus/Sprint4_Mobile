import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import users from "../db/users.json";
import { auth } from "../middleware/auth";

const router = Router();

const SECRET = "ecoafono_secret";

router.get("/", (req, res) => {
    res.json({
        message: "Auth API funcionando"
    });
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = users.find(
            (u) => u.email === email
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Usuário não encontrado"
            });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Senha inválida"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                access: user.access
            },
            SECRET,
            {
                expiresIn: "3d"
            }
        );

        return res.json({
            success: true,
            token
        });
    } catch {
        return res.status(500).json({
            success: false,
            message: "Erro interno"
        });
    }
});

export default router;