export const BASE_POINTS = 1000;
export const SHOW_RESULT_TIME = 5000;
export const MILLISECONDS_IN_SECOND = 1000;

export const GAME_IS_NOT_FOUND = 'Game is not found';
export const USER_IS_NOT_FOUND = 'User is not found';
export const USER_WRONG_PASSWORD = "Wong password!";

export const requestTypes = {
    registration: 'reg',
    createGame: 'create_game',
    joinGame: 'join_game',
    startGame: 'start_game',
    playerAnswer: 'answer'
}

export const answerTypes = {
    registration: 'reg',
    gameCreated: 'game_created',
    gameJoined: 'game_joined',
    playerJoined: 'player_joined',
    updatePlayers: 'update_players',
    question: 'question',
    answerAccepted: 'answer_accepted',
    questionResult: 'question_result',
    gameFinished: 'game_finished'
}