import { randomUUID } from "node:crypto";
import { Game, Player, Question } from "../types";
import { WebSocket } from 'ws';

export class GameStorage {
    storage: Map<string, Game> = new Map();

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

        this.storage.set(game.code, game);

        return game;
    }

    joinGame(code: string, player: Player): Game {
        const game = this.getGame(code);
        game.players.push(player);
        return game;
    }

    getGame(code: string): Game {
        const game = this.storage.get(code);

        if (!game) {
            throw Error('Game is not found');
        }

        return game;
    }

    leaveGameByPlayerSocket(socket: WebSocket): Game | undefined {
        const playersArrays: [Game, Player[]][] = [...this.storage.values()].map(game => [game, game.players]);
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

    #generateCode(): string {
        return Array.apply(0, Array(6)).map(function() {
            return (function(charset){
                return charset.charAt(Math.floor(Math.random() * charset.length))
            }('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'));
        }).join('')
    }
}