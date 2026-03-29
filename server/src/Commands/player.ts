import { userStorage } from "../database/data";
import { RegData, WSMessage } from "../types";
import { WebSocket } from 'ws';
import { getErrorAnswer } from "../utils/utils";
import { answerTypes, USER_WRONG_PASSWORD } from "../utils/constants";

export function registerPlayer(data: RegData, socket: WebSocket): WSMessage {
    const existingUser = userStorage.getUserByName(data.name);

    if (existingUser && existingUser.password !== data.password) {
        return getErrorAnswer(answerTypes.registration, USER_WRONG_PASSWORD)
    }

    const user = existingUser ? existingUser: userStorage.addUser(data, socket);
    user.ws = socket;

    return {
            type: answerTypes.registration,
            data: {
                name: user.name,
                index: user.index,
                error: false,
                errorText: ''
            },
            id: 0
        }
}