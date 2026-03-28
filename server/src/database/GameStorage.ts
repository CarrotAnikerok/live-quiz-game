import { randomUUID } from "node:crypto";
import { Game, Player, Question } from "../types";
import { WebSocket } from 'ws';

export class GameStorage {
    storage: Game[] = [];

    addGame(questions: Question[], hostId: string) {
        const game: Game = {
            id: randomUUID(),
            code: this.#generateCode(),
            hostId,
            questions,
            players: [],
            currentQuestion: 0,
            status: 'waiting',
            playerAnswers: new Map()
        }

        this.storage.push(game);

        return game;
    }

    joinGame(code: string, player: Player): Game {
        const game = this.getGameByCode(code);
        game.players.push(player);
        return game;
    }

    leaveGameByPlayerSocket(socket: WebSocket): Game | undefined {
        const playersArrays: [Game, Player[]][] = this.storage.map(game => [game, game.players]);

        for (const players of playersArrays) {
            const foundPlayer = players[1].find(player => player.ws === socket);

            if (foundPlayer) {
                const playerIndex = players[1].indexOf(foundPlayer);
                players[1].splice(playerIndex, 1);
                return players[0];
            } 
        }

        return;
    } 

    getGameByCode(code: string): Game {
        const game = this.storage.find(game => game.code === code);

        if (!game) {
            throw Error('Game is not found');
        }

        return game;
    }

    getGameById(id: string): Game {
        const game = this.storage.find(game => game.id === id);

        if (!game) {
            throw Error('Game is not found');
        }

        return game;
    }

    #generateCode(): string {
        return Array.apply(0, Array(6)).map(function() {
            return (function(charset){
                return charset.charAt(Math.floor(Math.random() * charset.length))
            }('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'));
        }).join('')
    }
}