var L = require('lodash');

// data Suits = Diamond | Clubs | Hearts | Spades
var SUITS = new Map([
    ['DIAMONDS', 'A'],
    ['CLUBS', 'B'],
    // ['HEARTS', 'H'],
    // ['SPADES', 'S'],
]);

var N_CARDS = 11;

// data Card = Yes | No | Turned
var CARD_STATE = Object.freeze({
    YES: 1,
    NO: 0,
    TURNED: -1,
});

var SUIT_2_ENUM = Object.fromEntries(
    L.zip(Array.from(SUITS.values()), L.range(SUITS.size))
);
var ENUM_2_SUIT = Object.fromEntries(
    L.zip(L.range(SUITS.size), Array.from(SUITS.values()))
);

IntCardMap = class {
    constructor(size) {
        this.array = new Int8Array(size);
    }

    get(key) {
        return this.array[this.cardKey(key)];
    }

    set(key, value) {
        this.array[this.cardKey(key)] = value;
    }

    get size() {
        return this.array.length;
    }

    cardKey([suit, num]) {
        return (SUIT_2_ENUM[suit] << 4) | (num - 1);
    }

    keyCard(i) {
        let num = (i & 0xf) + 1;
        let suit = ENUM_2_SUIT[i >> 4];

        return [suit, num];
    }

    playerCards(player) {
        let cards = [];

        for (let i = 0; i < this.array.length; i++) {
            let card = this.keyCard(i);

            if (card[1] <= N_CARDS && this.array[i] == player) {
                cards.push(card);
            }
        }

        return cards;
    }

    calculateScores(totalPlayers) {
        var scores = new Map();

        for (var i = 1; i <= totalPlayers; i++) {
            scores.set(i, 0);
        }

        for (let i = 0; i < this.array.length; i++) {
            let cardState = this.array[i];
            if (cardState < 0) {
                let p = -cardState;
                let num = this.keyCard(i)[1];
                scores.set(p, scores.get(p) + num);
            }
        }

        return scores;
    }

    entries() {
        const self = this;
        return {
            *[Symbol.iterator]() {
                for (let [i, v] of self.array.entries()) {
                    let card = self.keyCard(i);

                    if (card[1] <= N_CARDS) {
                        yield [card, v];
                    }
                }
            },
        };
    }

    clone() {
        let c = new this.constructor(this.array.length);
        c.array.set(this.array);

        return c;
    }
};

IntLimits = class {
    constructor(size) {
        this.array = new Int8Array(size);
    }

    set(suit, inner, outer) {
        let offset = this.suitIndex(suit);
        this.array[offset + 0] = inner[0];
        this.array[offset + 1] = inner[1];
        this.array[offset + 2] = outer[0];
        this.array[offset + 3] = outer[1];
    }

    get(suit) {
        let offset = this.suitIndex(suit);
        return {
            inner: [this.array[offset + 0], this.array[offset + 1]],
            outer: [this.array[offset + 2], this.array[offset + 3]],
        };
    }

    clone() {
        let c = new this.constructor(this.array.length);
        c.array.set(this.array);
        return c;
    }

    innerEntries() {
        const self = this;

        return {
            *[Symbol.iterator]() {
                for (let offset = 0; offset <= self.array.length; offset += 4) {
                    let suit = self.suitName(offset);
                    let innerStart = self.array[offset + 0];
                    let innerEnd = self.array[offset + 1];
                    yield [suit, [innerStart, innerEnd]];
                }
            },
        };
    }

    suitIndex(suit) {
        return SUIT_2_ENUM[suit] << 2;
    }

    suitName(index) {
        return ENUM_2_SUIT[index >> 2];
    }
};

function makeCards() {
    var cards = [];

    for (var i = 1; i <= N_CARDS; i++) {
        for (let suit of SUITS.values()) {
            cards.push([suit, i]);
        }
    }
    return cards;
}

function shuffleCards(cards, players) {
    var randCards = L.shuffle(cards.slice(cards.length % players));
    const cards_per_player = cards.length / players;

    return L.range(3).map((i) =>
        randCards.slice(i * cards_per_player, (i + 1) * cards_per_player)
    );
}

function nextPlayer(currentPlayer, totalPlayers) {
    return (currentPlayer % totalPlayers) + 1;
}

function makeState(playerCards) {
    var limits = new IntLimits(4 * SUITS.size);
    var hands = new IntCardMap(16 * SUITS.size);
    var totalPlayers = playerCards.length;
    var firstCard = [SUITS.values().next().value, Math.ceil(N_CARDS / 2)];
    var [firstSuit, firstNum] = firstCard;

    for (let suit of SUITS.values()) {
        let outer = [1, N_CARDS];
        let inner;

        if (suit === firstSuit) {
            inner = [firstNum - 1, firstNum + 1];
        } else {
            inner = [firstNum, firstNum];
        }

        limits.set(suit, inner, outer);
    }

    for (let [i, cards] of playerCards.entries()) {
        for (let card of cards) {
            hands.set(card, i + 1);
        }
    }

    let currentPlayer = nextPlayer(hands.get(firstCard), totalPlayers);
    let movesLeft = L.sumBy(playerCards, 'length') - 1;
    hands.set(firstCard, 0);

    return { limits, hands, currentPlayer, totalPlayers, movesLeft };
}

function playerCards(state, player) {
    const cards = [];

    for (let [card, cardPlayer] of state.hands.entries()) {
        if (cardPlayer === player) {
            cards.push(card);
        }
    }

    return cards;
}

function nextMoves(state) {
    let { limits, hands, currentPlayer } = state;
    let cards = [];

    for (let i = 0; i < limits.array.length; i += 4) {
        let suit = limits.suitName(i);
        for (let j = 0; j < 2; j++) {
            let num = limits.array[i + j];
            let card = [suit, num];

            if (num > 0 && hands.get(card) === currentPlayer) {
                cards.push(card);
            }
        }
    }

    if (L.isEmpty(cards)) {
        return { action: 'turn', cards: hands.playerCards(currentPlayer) };
    } else {
        return { action: 'play', cards };
    }
}

function cloneState(state) {
    return {
        ...state,
        hands: state.hands.clone(),
        limits: state.limits.clone(),
    };
}

function applyMoveMut(state, move) {
    let [suit, num] = move.card;
    let { inner, outer } = state.limits.get(suit);

    switch (move.action) {
        case 'play':
            let [min, max] = inner;

            state.hands.set(move.card, 0);

            if (num === min) {
                inner[0] = min === outer[0] ? -1 : min - 1;
            } else if (num === max) {
                inner[1] = max === outer[1] ? -1 : max + 1;
            } else if (min === max) {
                inner[0] = min === outer[0] ? -1 : min - 1;
                inner[1] = max === outer[1] ? -1 : max + 1;
            }

            break;
        case 'turn':
            if (num < inner[0]) {
                outer[0] = num;
            } else if (num > inner[1]) {
                outer[1] = num;
            }

            state.hands.set(move.card, -state.currentPlayer);

            break;
    }

    state.limits.set(suit, inner, outer);
    state.currentPlayer = nextPlayer(state.currentPlayer, state.totalPlayers);
    state.movesLeft = state.movesLeft - 1;

    return state;
}

// var applyMove = produce(applyMoveMut);
function applyMove(state, move) {
    return applyMoveMut(cloneState(state), move);
}

function isFinalState(state) {
    return state.movesLeft === 0;
}

function calculateScores(state) {
    var scores = new Map();

    for (var i = 1; i <= state.totalPlayers; i++) {
        scores.set(i, 0);
    }

    for (let [[_, num], cardState] of state.hands.entries()) {
        if (cardState < 0) {
            let p = -cardState;
            scores.set(p, scores.get(p) + num);
        }
    }

    return scores;
}

function stateScore(state, player) {
    let scores = state.hands.calculateScores(state.totalPlayers);
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
            card: null,
        };
    }

    let optPlayer = Math.abs(playerState);
    let nextPlayerState =
        optPlayer == nextPlayer(state.currentPlayer, state.totalPlayers)
            ? optPlayer
            : -optPlayer;

    let { action, cards } = nextMoves(state);
    let optCard = null;
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

var allCards = makeCards();
var cards = shuffleCards(allCards, 3);
var state = makeState(cards);

module.exports = {
    shuffleCards,
    makeCards,
    nextPlayer,
    makeState,
    playerCards,
    optimalMove,
    calculateScores,
};

