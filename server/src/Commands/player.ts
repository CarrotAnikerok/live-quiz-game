import { userStorage } from "../database/data";
import { RegData, WSMessage } from "../types";
import { WebSocket } from 'ws';

export function registerPlayer(data: RegData, socket: WebSocket): WSMessage {
    const existingUser = userStorage.getUserByData(data);
    const user = existingUser ? existingUser: userStorage.addUser(data, socket);
    user.ws = socket;

    return {
            type: 'reg',
            data: {
                name: user.name,
                index: user.index,
                error: false,
                errorText: ''
            },
            id: 0
        }
}