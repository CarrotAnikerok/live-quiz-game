
import { WebSocket } from 'ws';
import { gameStorage, userStorage } from '../database/data';
import { CreateGameData, Game, JoinGameData, Player, WSMessage } from '../types';
import { answerTypes } from '../utils/constants';

export function getCreateGameAnswer(data: CreateGameData, socket: WebSocket): WSMessage {
    const currentUser = userStorage.getUserBySocket(socket);

    // сохранить ошибки в одно место
    if (!currentUser) {
        throw Error('User is not found');
    }

    const game = gameStorage.addGame(data.questions, currentUser.index);
    return {
            type: answerTypes.gameCreated,
            data: {
                gameId: game.id,
                code: game.code,
            },
            id: 0
        }
}

export function getJoinGameAnswers(data: JoinGameData, socket: WebSocket): WSMessage[] {
    const joinedUser = userStorage.getUserBySocket(socket);

    if (!joinedUser) {
        throw Error('User is not found');
    }

    const player: Player = {
        name: joinedUser.name,
        index: joinedUser.index,
        score: 0,
        ws: joinedUser.ws,
    }

    const joinedGame: Game = gameStorage.joinGame(data.code, player);
    const personalAnswer: WSMessage = {
        type: answerTypes.gameJoined,
        data: {
            gameId: joinedGame.id
        },
        id: 0
    }

    const broadcastAnswer: WSMessage = {
        type: answerTypes.playerJoined,
        data: {
            playerName: player.name,
            playerCount: joinedGame.players.length,
        },
        id: 0
    }

    return [personalAnswer, broadcastAnswer];
}

export function getUpdatePlayersAnswer(players: Player[]): WSMessage  {
    const playersToSend = players.map(player => {
        return {name: player.name, index: player.index, score: player.score};
    });

    return {
        type: answerTypes.updatePlayers,
        data: playersToSend,
        id: 0
    }
}