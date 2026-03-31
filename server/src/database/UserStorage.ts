import { randomUUID } from "node:crypto";
import { RegData, User } from "../types";
import type { WebSocket } from 'ws';
import { UserNotFound } from "../utils/errors";

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

    getUserBySocket(socket: WebSocket): User {
        const user = this.storage.find(user => user.ws === socket)

        if (!user) {
            throw new UserNotFound();
        }

        return user;
    }

    getUserById(id: string): User {
        const user = this.storage.find(user => user.index === id)

        if (!user) {
            throw new UserNotFound();
        }

        return user;
    }

    getUserByName(name: string): User | undefined {
        return this.storage.find(user => user.name === name);
    }
}