import { Player, Question } from "../types";
import { WebSocket } from 'ws';
import { QuestionGame } from "./QuestionGame";
import { GameNotFound } from "../utils/errors";

export class GameStorage {
    storage: QuestionGame[] = [];

    addGame(questions: Question[], hostId: string) {
        const game = new QuestionGame(questions, hostId);
        this.storage.push(game);
        return game;
    }

    joinGame(code: string, player: Player): QuestionGame {
        const game = this.getGameByCode(code);
        
        if (!game) {
            throw new GameNotFound();
        }

        game.players.push(player);
        return game;
    }

    getGameByCode(code: string): QuestionGame {
        const game = this.storage.find(game => game.code === code);

        if (!game) {
            throw new GameNotFound();
        }

        return game;
    }

    getGameById(id: string): QuestionGame {
        const game = this.storage.find(game => game.id === id);

        if (!game) {
            throw new GameNotFound();
        }

        return game;
    }

    leaveGameByPlayerSocket(socket: WebSocket): QuestionGame | undefined {
        const playersArrays: [QuestionGame, Player[]][] = this.storage.map(game => [game, game.players]);

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
}