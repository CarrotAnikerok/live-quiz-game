import { WebSocketServer } from 'ws';
import { WSMessage } from './types';
import { registerPlayer } from './Commands/player';
import { getCreateGameAnswer, getJoinGameAnswers, getUpdatePlayersAnswer} from './Commands/gameManagement';
import { getNextQuestionAnswer, getQuestionResult, getStartGameAnswer, getSubmitAnswer } from './Commands/gamePlay';
import { getErrorAnswer, getGameByCode, getGameById, getUserById, leaveGame } from './utils/utils'
import { QuestionGame } from './database/QuestionGame';
import { MILLISECONDS_IN_SECOND, requestTypes, SHOW_RESULT_TIME } from './utils/constants';
import { GameNotFound } from './utils/errors';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', socket => {
    console.log(`New client connected. Total clients: ${wss.clients.size}`);
    socket.on('message', (message: string) => {
        const messageParsed = JSON.parse(message);
        let answer: WSMessage;
        let game: QuestionGame;

        switch(messageParsed.type) {
            case requestTypes.registration:
                answer = registerPlayer(messageParsed.data, socket);
                socket.send(JSON.stringify(answer));
                break;
            case requestTypes.createGame:
                answer = getCreateGameAnswer(messageParsed.data, socket);
                socket.send(JSON.stringify(answer));
                break;
            case requestTypes.joinGame:
                try {
                    const answers: WSMessage[] = getJoinGameAnswers(messageParsed.data, socket);
                    answer = answers[0];
                    socket.send(JSON.stringify(answer));
                    // fix for fronted bag
                    setTimeout(() => {
                        game = getGameByCode(messageParsed.data);
                        broadcastToAllInGame(game, answers[1]);
                        broadcastToAllInGame(game, getUpdatePlayersAnswer(game.players));
                    }, 30)
                } catch (e){
                    if (e instanceof GameNotFound) {
                        answer = getErrorAnswer(requestTypes.registration, e.name);
                        socket.send(JSON.stringify(answer));
                    }
                }
                break;
            case requestTypes.startGame:
                game = getGameById(messageParsed.data.gameId);
                answer = getStartGameAnswer(game);

                socket.send(JSON.stringify(answer));

                game.questionTimer = setTimerForQuestion(game);
                game.players.forEach(player => {
                    player.ws.send(JSON.stringify(answer));
                })
                break;
            case requestTypes.playerAnswer: 
                answer = getSubmitAnswer(messageParsed.data, socket);
                socket.send(JSON.stringify(answer));

                game = getGameById(messageParsed.data.gameId);
                if (game.isAllAnswered()) {
                    clearTimeout(game.questionTimer);
                    sendQuestionResult(game);
                }    
                break;  
        }
    })

    socket.on('close', () => {
        console.log(`Client DISCONNECTED. Total clients: ${wss.clients.size}`);
        const runningGame: QuestionGame | undefined = leaveGame(socket);

        if (runningGame) {
            broadcastToAllInGame(runningGame, getUpdatePlayersAnswer(runningGame.players))
        }
    })
})

function setTimerForQuestion(game: QuestionGame) {
    return setTimeout(() => {
        sendQuestionResult(game);
    }, game.questions[game.currentQuestion].timeLimitSec * MILLISECONDS_IN_SECOND + MILLISECONDS_IN_SECOND)
}

function sendQuestionResult(game: QuestionGame) {
    broadcastToAllInGame(game, getQuestionResult(game));

    setTimeout(() => {
        const nextQuestionAnswer = getNextQuestionAnswer(game);

        if (nextQuestionAnswer.type === 'question') {
                game.questionTimer = setTimerForQuestion(game);
            }

        broadcastToAllInGame(game, nextQuestionAnswer);
    }, SHOW_RESULT_TIME)
}

function broadcastToAllInGame(game: QuestionGame, answer: WSMessage) {
    const message = JSON.stringify(answer);
    const host = getUserById(game.hostId);

    host?.ws.send(message);
    game.players.forEach(player => {
        player.ws.send(message);
    })
}