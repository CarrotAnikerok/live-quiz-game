import { gameStorage, userStorage } from "../database/data";
import { Game, JoinGameData, StartGameData, User } from "../types";
import { WebSocket } from 'ws';

export function getUserById(userId: string): User | undefined {
    return userStorage.getUserById(userId);
}

export function getGameById(data: StartGameData): Game {
    return gameStorage.getGameById(data.gameId);
}

export function getGameByCode(data: JoinGameData): Game {
    return gameStorage.getGameByCode(data.code);
}

export function leaveGame(socket: WebSocket): Game | undefined {
    return gameStorage.leaveGameByPlayerSocket(socket);
}