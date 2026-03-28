
import { WebSocket } from 'ws';
import { gameStorage, userStorage } from '../database/data';
import { CreateGameData, Game, JoinGameData, Player, StartGameData, WSMessage } from '../types';

export function getCreateGameAnswer(data: CreateGameData, socket: WebSocket): WSMessage {
    const currentUser = userStorage.getUserBySocket(socket);

    // сохранить ошибки в одно место
    if (!currentUser) {
        throw Error('User is not found');
    }

    const game = gameStorage.addGame(data.questions, currentUser.index);
    return {
            type: 'game_created',
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

    if (typeof joinedGame === 'string') {
        throw Error('Game is not found');
    }

    const personalAnswer: WSMessage = {
        type: 'game_joined',
        data: {
            gameId: joinedGame.id
        },
        id: 0
    }

    const broadcastAnswer: WSMessage = {
        type: 'player_joined',
        data: {
            playerName: player.name,
            playerCount: joinedGame.players.length,
        },
        id: 0
    }

    return [personalAnswer, broadcastAnswer];
}

//запускать когда игрок присоединяется и уходит
export function getUpdatePlayersAnswer(players: Player[]): WSMessage  {
    const playersToSend = players.map(player => {
        return {name: player.name, index: player.index, score: player.score};
    });

    return {
        type: 'update_players',
        data: playersToSend,
        id: 0
    }
}