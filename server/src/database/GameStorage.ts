import { randomUUID } from "node:crypto";
import { Game, Player, Question } from "../types";

export class GameStorage {
    games: Map<string, Game> = new Map();

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

        this.games.set(game.code, game);

        return game;
    }

    joinGame(code: string, player: Player): Game | string {
        const game = this.getGame(code);
        game.players.push(player);
        return game;
    }

    getGame(code: string): Game {
        const game = this.games.get(code);

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