import { AnswerData, WSMessage } from "../types";
import { WebSocket } from 'ws';
import { getGameById, getUserBySocket } from "../utils/utils";
import { QuestionGame } from "../database/QuestionGame";
import { answerTypes, BASE_POINTS } from "../utils/constants";

export function getStartGameAnswer(game: QuestionGame): WSMessage {
    game.start();

    return {
        type: answerTypes.question,
        data: {
            questionNumber: game.currentQuestion + 1,
            totalQuestions: game.questions.length,
            text: game.questions[game.currentQuestion].text, 
            options: game.questions[game.currentQuestion].options,
            timeLimitSec: game.questions[game.currentQuestion].timeLimitSec
        },
        id: 0
    }
}

export function getNextQuestionAnswer(game: QuestionGame): WSMessage {
    const question = game.nextQuestion();

    if (!question) {
        let i = 0;
        const resultPlayers = game.players.sort((a, b) => b.score - a.score).map(player => {
            return {name: player.name, score: player.score, rank: ++i}
        })

        return {
            type: answerTypes.gameFinished,
            data: {
                scoreboard: resultPlayers,
            },
            id: 0
        }
    }
    
    return {
        type: answerTypes.question,
        data: {
            questionNumber: game.currentQuestion + 1,
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
        type: answerTypes.answerAccepted,
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
            const points = Math.round(BASE_POINTS * ((currentQuestion.timeLimitSec - player.answerTime) / currentQuestion.timeLimitSec));
            player.score += points;
            result.pointsEarned = points;
            result.totalScore = player.score;
        }

        playerResults.push(result);
        game.emptyPlayerAnswer(player);
    }

    return {
        type: answerTypes.questionResult,
        data: {
            questionIndex: game.currentQuestion,
            correctIndex: game.getCorrectAnswer(),
            playerResults: playerResults
            },
        id: 0
    }
}