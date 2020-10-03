var L = require('lodash');

function makeCards(numSuits, numCards) {
    if (cards > 16) {
        throw new Error('A suit can only have a maximum of 16 cards');
    }

    var cards = [];

    for (let suit = 0; suit < numSuits; suit++) {
        let suitBase = suit << 4;
        for (let num = 0; num < numCards; num++) {
            cards.push(suitBase + num);
        }
    }

    return cards;
}

function shuffleCards(cards, players) {
    var randCards = L.shuffle(cards.slice(cards.length % players));
    const handSize = randCards.length / players;

    return L.range(3).map((i) =>
        randCards.slice(i * handSize, (i + 1) * handSize)
    );
}

var getMovesLeft = (state) => state[0];
var setMovesLeft = (state, movesLeft) => (state[0] = movesLeft);

var getCurrentPlayer = (state) => state[1];
var setCurrentPlayer = (state, currentPlayer) => (state[1] = currentPlayer);

var getTotalPlayers = (state) => state[2];
var setTotalPlayers = (state, totalPlayers) => (state[2] = totalPlayers);

var getNumSuits = (state) => (state[3] & 0xf0) >> 4;
var setNumSuits = (state, numSuits) =>
    (state[3] = (state[3] & 0x0f) | ((numSuits & 0x0f) << 4));

var getNumCards = (state) => state[3] & 0x0f;
var setNumCards = (state, numCards) =>
    (state[3] = (state[3] & 0xf0) | (numCards & 0x0f));

function getInnerLimits(state, suit) {
    let offset = 4 + 4 * suit;
    return [state[offset + 0], state[offset + 1]];
}

function setInnerLimits(state, suit, min, max) {
    let offset = 4 + 4 * suit;
    state[offset + 0] = min;
    state[offset + 1] = max;
}

function getOuterLimits(state, suit) {
    let offset = 4 + 4 * suit + 2;
    return [state[offset + 0], state[offset + 1]];
}

function setOuterLimits(state, suit, min, max) {
    let offset = 4 + 4 * suit + 2;
    state[offset + 0] = min;
    state[offset + 1] = max;
}

function getHandOffset(state) {
    return 4 * getNumSuits(state) + 4;
}

function getHand(state, card, value) {
    let offset = getHandOffset(state);
    return state[offset + card];
}

function setHand(state, card, value) {
    let offset = getHandOffset(state);
    state[offset + card] = value;
}

var getCardNum = (c) => c & 0x0f;
var getCardSuit = (c) => c >> 4;

function nextPlayer(currentPlayer, totalPlayers) {
    return (currentPlayer % totalPlayers) + 1;
}

function getNextPlayer(state) {
    return nextPlayer(getCurrentPlayer(state), getTotalPlayers(state));
}

/*
 * The state is represented by a Int8Array() separated as:
 *
 * | section  | name              |     offset | bits |
 * |----------+-------------------+------------+------|
 * | Metadata | movesLeft         |          0 |    8 |
 * |          | currentPlayer     |          1 |    8 |
 * |          | totalPlayers      |          2 |    8 |
 * |          | numSuits          |          3 |    4 |
 * |          | numCards          |          3 |    4 |
 * | Limits   | suit[0].inner.min |          4 |    8 |
 * |          | suit[0].inner.max |          5 |    8 |
 * |          | suit[0].outer.min |          6 |    8 |
 * |          | suit[0].outer.max |          7 |    8 |
 * |          | ...               |        ... |  ... |
 * | Hands    | card[0,0]         | handsStart |    8 |
 * |          | ...               |        ... |  ... |
 */
function makeState(shuffled) {
    let totalPlayers = shuffled.length;

    let maxCard = L.max(L.flatten(shuffled));
    let numSuits = getCardSuit(maxCard) + 1;
    let numCards = getCardNum(maxCard) + 1;
    let cardBits = Math.ceil(Math.log2(numCards));

    let handsOffset = 4 + 4 * numSuits;
    let stateLength = handsOffset + (maxCard + 1);

    let state = new Int8Array(stateLength);

    setNumSuits(state, numSuits);
    setNumCards(state, numCards);

    let firstSuit = 0;
    let firstNum = Math.ceil(numCards / 2);
    let firstCard = (firstSuit << cardBits) + firstNum;

    for (let suit = 0; suit < numSuits; suit++) {
        // FIXME: Some suits have less cards, which might cause problems
        setOuterLimits(state, suit, 1, numCards);

        if (suit === firstSuit) {
            setInnerLimits(state, suit, firstNum - 1, firstNum + 1);
        } else {
            setInnerLimits(state, suit, firstNum, firstNum);
        }
    }

    for (let [i, cards] of shuffled.entries()) {
        for (let card of cards) {
            setHand(state, card, i + 1);
        }
    }

    setCurrentPlayer(
        state,
        nextPlayer(getHand(state, firstCard), totalPlayers)
    );
    setTotalPlayers(state, totalPlayers);
    setMovesLeft(state, L.sumBy(shuffled, 'length') - 1);
    setHand(state, firstCard, 0);

    return state;
}

function playerCards(state, player) {
    let cards = [];

    let numSuits = getNumSuits(state);
    let numCards = getNumCards(state);

    for (let suit = 0; suit < numSuits; suit++) {
        for (let num = 0; num < numCards; num++) {
            let card = (suit << 4) + num;

            if (getHand(state, card) == player) {
                cards.push(card);
            }
        }
    }

    return cards;
}

function calculateScores(state) {
    var scores = new Map();
    let totalPlayers = getTotalPlayers(state);

    for (var i = 1; i <= totalPlayers; i++) {
        scores.set(i, 0);
    }

    let offset = getHandOffset(state);
    let len = state.length - offset;

    for (let i = 0; i < len; i++) {
        let cardState = state[offset + i];
        if (cardState < 0) {
            let p = -cardState;
            let num = getCardNum(i);
            scores.set(p, scores.get(p) + num);
        }
    }

    return scores;
}

function cloneState(state) {
    return state.slice();
}

function logState(state) {
    let numSuits = getNumSuits(state);
    let numCards = getNumCards(state);

    let cards = L.flatten(
        L.range(numSuits).map((s) => {
            return L.range(numCards).map((c) => [
                String.fromCharCode(65 + s) + (c + 1),
                getHand(state, (s << 4) + c),
            ]);
        })
    );

    return {
        movesLeft: getMovesLeft(state),
        currentPlayer: getCurrentPlayer(state),
        totalPlayers: getTotalPlayers(state),
        numSuits,
        numCards,
        limits: L.fromPairs(
            L.range(numSuits).map((s) => {
                return [
                    String.fromCharCode(65 + s),
                    {
                        inner: getInnerLimits(state, s),
                        outer: getOuterLimits(state, s),
                    },
                ];
            })
        ),
        hands: L.mapValues(
            L.groupBy(cards, (x) => x[1]),
            (cs) => cs.map((c) => c[0])
        ),
        cards,
    };
}

module.exports = {
    makeCards,
    shuffleCards,
    makeState,
    cloneState,
    playerCards,
    calculateScores,
    logState,
    nextPlayer,
    getCardNum,
    getCardSuit,
    getCurrentPlayer,
    getHand,
    getHandOffset,
    getInnerLimits,
    getMovesLeft,
    getNextPlayer,
    getNumCards,
    getNumSuits,
    getOuterLimits,
    getTotalPlayers,
    setCurrentPlayer,
    setHand,
    setInnerLimits,
    setMovesLeft,
    setNumCards,
    setNumSuits,
    setOuterLimits,
    setTotalPlayers,
};
