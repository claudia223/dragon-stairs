var L = require('lodash');
var S = require('./state');

function nextMoves(state) {
    let currentPlayer = S.getCurrentPlayer(state);
    let numSuits = S.getNumSuits(state);
    let cards = [];

    for (let suit = 0; suit < numSuits; suit++) {
        let offset = 4 + 4 * suit;
        for (let j = 0; j < 2; j++) {
            let num = state[offset + j];
            let card = (suit << 4) + num;

            if (num > 0 && S.getHand(state, card) === currentPlayer) {
                cards.push(card);
            }
        }
    }

    if (L.isEmpty(cards)) {
        return { action: 'turn', cards: S.playerCards(state, currentPlayer) };
    } else {
        return { action: 'play', cards };
    }
}

function applyMoveMut(state, move) {
    let suit = move.card >> 4;
    let num = move.card & 0x0f;
    let [innerMin, innerMax] = S.getInnerLimits(state, suit);
    let [outerMin, outerMax] = S.getOuterLimits(state, suit);

    switch (move.action) {
        case 'play':

            S.setHand(state, move.card, 0);

            if (num === innerMin) {
                innerMin = innerMin === outerMin ? -1 : innerMin - 1;
            } else if (num === innerMax) {
                innerMax = innerMax === outerMax ? -1 : innerMax + 1;
            } else if (innerMin === innerMax) {
                innerMin = innerMin === outerMin ? -1 : innerMin - 1;
                innerMax = innerMax === outerMax ? -1 : innerMax + 1;
            }

            break;
        case 'turn':
            if (num < innerMin) {
                outerMin = num;
            } else if (num > innerMax) {
                outerMax = num;
            }

            S.setHand(state, move.card, -S.getCurrentPlayer(state));

            break;
    }

    S.setInnerLimits(state, suit, innerMin, innerMax);
    S.setOuterLimits(state, suit, outerMin, outerMax);
    S.setCurrentPlayer(state, S.getNextPlayer(state));
    S.setMovesLeft(state, S.getMovesLeft(state) - 1);

    return state;
}

function applyMove(state, move) {
    return applyMoveMut(S.cloneState(state), move);
}

module.exports = { nextMoves, applyMove };
