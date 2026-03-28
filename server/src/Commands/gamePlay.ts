import { AnswerData, Game, WSMessage } from "../types";
import { gameStorage, userStorage } from '../database/data';
import { WebSocket } from 'ws';
import { getGameById, getUserBySocket } from "../utils/utils";
import { QuestionGame } from "../database/QuestionGame";

const basePoints = 1000;

export function getStartGameAnswer(game: QuestionGame): WSMessage {
    game.start();

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

export function getNextQuestionAnswer(game: QuestionGame): WSMessage {
    // наверное вызывать некст квештен для каждого игрока не очень хорошо уву
    const question = game.nextQuestion();

    if (!question) {
        let i = 0;
        const resultPlayers = game.players.sort((a, b) => b.score - a.score).map(player => {
            return {name: player.name, score: player.score, rank: ++i}
        })

        return {
            type: 'game_finished',
            data: {
                scoreboard: resultPlayers,
            },
            id: 0
        }
    }
    
    return {
        type: 'question',
        data: {
            questionNumber: game.currentQuestion,
            totalQuestions: game.questions.length,
            text: question.text, 
            options: question.options,
            timeLimitSec: question.timeLimitSec
        },
        id: 0
    }
}

export function getSubmitAnswer(data: AnswerData, socket: WebSocket): WSMessage {
    const game = getGameById(data.gameId);
    const user = getUserBySocket(socket);

    game.setPlayerAnswer(user.index, data.answerIndex);

    return {
        type: 'answer_accepted',
        data: {
            questionIndex: data.answerIndex,
        },
        id: 0
    }
}

export function getQuestionResult(game: QuestionGame): WSMessage {
    const currentQuestion = game.questions[game.currentQuestion];
    const playerResults = []

    for (const player of game.players) {
        const result = {
            name: player.name,
            answered: player.hasAnswered,
            correct: player.answeredCorrectly,
            pointsEarned: 0, 
            totalScore: player.score,
        }

        if (!player.hasAnswered || !player.answerTime) {
            playerResults.push(result);
            continue;
        }

        if (player.answeredCorrectly) {
            const points = basePoints * ((currentQuestion.timeLimitSec - player.answerTime) / currentQuestion.timeLimitSec);
            player.score += points;
            result.pointsEarned = points;
            result.totalScore = player.score;
        }

        playerResults.push(result);
    }

    return {
        type: "question_result",
        data: {
            questionIndex: game.currentQuestion,
            correctIndex: game.getCorrectAnswer(),
            playerResults: playerResults
            },
        "id": 0
        }
}