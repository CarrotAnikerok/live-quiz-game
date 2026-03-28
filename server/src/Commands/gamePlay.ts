import { Game, StartGameData, WSMessage } from "../types";
import { gameStorage, userStorage } from '../database/data';

export function getStartGameAnswer(game: Game): WSMessage {
    return {
        type: 'question',
        data: {
            questionNumber: game.currentQuestion,
            totalQuestions: game.questions.length,
            text: game.questions[game.currentQuestion].text, 
            options: game.questions[game.currentQuestion].options,
            timeLimitSec: game.questions[game.currentQuestion].timeLimitSec
        },
        id: 0
    }
}