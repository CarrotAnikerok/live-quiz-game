import { randomUUID } from "node:crypto";
import { RegData, User } from "../types";
import type { WebSocket } from 'ws';

export class UserStorage {
    storage: User[] = [];

    addUser(data: RegData, ws: WebSocket): User {
        const user: User = {
            name: data.name,
            password: data.password,
            index: randomUUID(),
            ws
        }

        this.storage.push(user);

        return user;
    }

    getUserBySocket(socket: WebSocket) {
        return this.storage.find(user => user.ws === socket);
    }

    getUserById(id: string): User | undefined {
        return this.storage.find(user => user.index === id);
    }

    getUserByData(data: RegData): User | undefined {
        return this.storage.find(user => user.name === data.name && user.password === data.password);
    }
}