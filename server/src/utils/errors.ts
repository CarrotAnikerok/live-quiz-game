import { GAME_IS_NOT_FOUND, USER_IS_NOT_FOUND } from "./constants"


export class UserNotFound extends Error {
    constructor(message = '', options = {}) {
        super(message, options)
        this.name = USER_IS_NOT_FOUND;
    }
}

export class GameNotFound extends Error {
    constructor(message = '', options = {}) {
        super(message, options)
        this.name = GAME_IS_NOT_FOUND;
    }
}