import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import { Access, Login } from "../models/login";

const router = Router();

const SECRET = "ecoafono_secret";

function lerUsuarios(): Login[] {
    const dados = fs.readFileSync(
        "./src/db/users.json",
        "utf-8"
    );

    return JSON.parse(dados);
}

function salvarUsuarios(users: Login[]) {
    fs.writeFileSync(
        "./src/db/users.json",
        JSON.stringify(users, null, 2)
    );
}

router.get("/", (req, res) => {
    res.json({
        message: "Auth API funcionando"
    });
});

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Nome, email e senha são obrigatórios"
            });
        }

        const users = lerUsuarios();

        const userExists = users.find(
            user => user.email === email
        );

        if (userExists) {
            return res.status(409).json({
                success: false,
                message: "Email já cadastrado"
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        const novoUsuario: Login = {
            id: Date.now(),
            name,
            email,
            password: hashedPassword,
            access: Access.USER
        };

        users.push(novoUsuario);

        salvarUsuarios(users);

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
    } catch {
        return res.status(500).json({
            success: false,
            message: "Erro interno"
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const users = lerUsuarios();

        const user = users.find(
            u => u.email === email
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