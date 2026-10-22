export type Role = "admin" | "patient";

export type Login = {
    id: string;
    name: string;
    email: string;
    password: string;
    role: Role;
};

/** Usuário sem o hash — o que pode sair em resposta de API. */
export type PublicUser = Omit<Login, "password">;

export function toPublicUser(user: Login): PublicUser {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
}
