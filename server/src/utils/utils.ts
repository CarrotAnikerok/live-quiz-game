import { gameStorage, userStorage } from "../database/data";
import { QuestionGame } from "../database/QuestionGame";
import { Game, JoinGameData, StartGameData, User } from "../types";
import { WebSocket } from 'ws';

export function getUserBySocket(socket: WebSocket): User {
    return userStorage.getUserBySocket(socket);
}

export function getUserById(userId: string): User {
    return userStorage.getUserById(userId);
}

export function getGameById(gameId: string): QuestionGame {
    return gameStorage.getGameById(gameId);
}

export function getGameByCode(data: JoinGameData): QuestionGame {
    return gameStorage.getGameByCode(data.code);
}

export function leaveGame(socket: WebSocket): QuestionGame | undefined {
    return gameStorage.leaveGameByPlayerSocket(socket);
}