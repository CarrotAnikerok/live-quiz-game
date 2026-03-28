import { WebSocketServer } from 'ws';
import { Game, Player, User, WSMessage } from './types';
import { registerPlayer } from './Commands/player';
import { getCreateGameAnswer, getJoinGameAnswers, getUpdatePlayersAnswer} from './Commands/gameManagement';
import { getNextQuestionAnswer, getQuestionResult, getStartGameAnswer, getSubmitAnswer } from './Commands/gamePlay';
import { getGameByCode, getGameById, getUserById, getUserBySocket, leaveGame } from './utils/utils'
import { QuestionGame } from './database/QuestionGame';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const showResultsTime = 5000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', socket => {
    console.log(`New client connected. Total clients: ${wss.clients.size}`);
    socket.on('message', (message: string) => {
        const messageParsed = JSON.parse(message);
        let answer: WSMessage;
        let game: QuestionGame;
        let user: User;

        switch(messageParsed.type) {
            case 'reg':
                answer = registerPlayer(messageParsed.data, socket);
                socket.send(JSON.stringify(answer));
                break;
            case 'create_game':
                answer = getCreateGameAnswer(messageParsed.data, socket);
                socket.send(JSON.stringify(answer));
                break;
            case 'join_game':
                const answers: WSMessage[] = getJoinGameAnswers(messageParsed.data, socket);
                answer = answers[0];
                socket.send(JSON.stringify(answer));

                game = getGameByCode(messageParsed.data);
                // это бы сократить
                const host = getUserById(game.hostId);
                host?.ws.send(JSON.stringify(answers[1]));
                host?.ws.send(JSON.stringify(getUpdatePlayersAnswer(game.players)));

                game.players.forEach(player => {
                    player.ws.send(JSON.stringify(answers[1]));
                    player.ws.send(JSON.stringify(getUpdatePlayersAnswer(game.players)));
                })
                break;
            case 'start_game':
                game = getGameById(messageParsed.data.gameId);
                answer = getStartGameAnswer(game);

                socket.send(JSON.stringify(answer));
                console.log('Timelimit is ' + game.questions[game.currentQuestion].timeLimitSec)
                game.questionTimer = setTimerForQuestion(game);

                game.players.forEach(player => {
                    player.ws.send(JSON.stringify(answer));
                })

                break;
            case 'answer': 
                answer = getSubmitAnswer(messageParsed.data, socket);
                socket.send(JSON.stringify(answer));

                game = getGameById(messageParsed.data.gameId);

                console.log('is all? ' + game.isAllAnswered());

                if (game.isAllAnswered()) {
                    game.questionTimer?.close();
                    sendQuestionResult(game);
                } 

                
        }
    })

    socket.on('close', () => {
        console.log(`Client DISCONNECTED. Total clients: ${wss.clients.size}`);
        const runningGame: Game | undefined = leaveGame(socket);

        if (runningGame) {
            const host = getUserById(runningGame.hostId);
            host?.ws.send(JSON.stringify(getUpdatePlayersAnswer(runningGame.players)));
            
            runningGame.players.forEach(player => {
                player.ws.send(JSON.stringify(getUpdatePlayersAnswer(runningGame.players)));
            });
        }
    })
})


// нужжно обнулять значения для челов при начале нового вопроса
// все таки где-то есть цикл, надо его убрать
function setTimerForQuestion(game: QuestionGame) {
    return setTimeout(() => {
        sendQuestionResult(game);
    }, game.questions[game.currentQuestion].timeLimitSec * 1000)
}

function sendQuestionResult(game: QuestionGame) {
    const host = getUserById(game.hostId);
    host?.ws.send(JSON.stringify(getQuestionResult(game)));
    game.players.forEach(player => {
        player.ws.send(JSON.stringify(getQuestionResult(game)))
    })

    setTimeout(() => {
        const nextQuestionAnswer = getNextQuestionAnswer(game);
        game.players.forEach(player => {
            if (nextQuestionAnswer.type === 'question') {
                game.questionTimer = setTimerForQuestion(game);
            }

            host?.ws.send(JSON.stringify(nextQuestionAnswer));
            player.ws.send(JSON.stringify(nextQuestionAnswer));
        })
    }, showResultsTime)
}