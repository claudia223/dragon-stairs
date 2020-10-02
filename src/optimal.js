var L = require('lodash');
var S = require('./state');

var { nextMoves, applyMove } = require('./game');

function isFinalState(state) {
    return S.getMovesLeft(state) === 0;
}

function stateScore(state, player) {
    let scores = S.calculateScores(state);
    let ownScore = scores.get(player);
    let [_, bestScore] = L.minBy(Array.from(scores.entries()), ([p, s]) =>
        p !== player ? s : Number.MAX_SAFE_INTEGER
    );

    return bestScore - ownScore;
}

// optimalMove :: State -> Player -> Move
function optimalMove(state, playerState) {
    if (isFinalState(state)) {
        return {
            score: stateScore(state, Math.abs(playerState)),
            card: -1,
        };
    }

    let optPlayer = Math.abs(playerState);
    let nextPlayerState =
        optPlayer == S.getNextPlayer(state)
            ? optPlayer
            : -optPlayer;

    let { action, cards } = nextMoves(state);
    let optCard = -1;
    let optScore =
        playerState > 0 ? -Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;

    for (let card of cards) {
        let newState = applyMove(state, { action, card });
        let { score } = optimalMove(newState, nextPlayerState);

        if (playerState > 0) {
            if (score > optScore) {
                optCard = card;
                optScore = score;
            }
        } else {
            if (score < optScore) {
                optCard = card;
                optScore = score;
            }
        }
    }

    return { card: optCard, score: optScore };
}

module.exports = { optimalMove };
