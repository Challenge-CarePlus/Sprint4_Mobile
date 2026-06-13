export type Login = {
    id: number;
    name: string;
    email: string;
    password: string;
    access: Access;
};

export enum Access {
    USER = "User",
    ADMIN = "Admin"
}