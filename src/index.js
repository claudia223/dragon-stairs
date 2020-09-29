var L = require('lodash');
var ArrayKeyedMap = require('array-keyed-map');

// data Suits = Diamond | Clubs | Hearts | Spades
var SUITS = new Map([
    ['DIAMONDS', 'A'],
    ['CLUBS', 'B'],
    // HEARTS: "H",
    // SPADES: "S"
]);

var N_CARDS = 5;

// data Card = Yes | No | Turned
var CARD_STATE = Object.freeze({
    YES: 1,
    NO: 0,
    TURNED: -1,
});

function shuffleCards(players) {
    var cards = [];

    for (var i = 1; i <= N_CARDS; i++) {
        for (let suit of SUITS.values()) {
            cards.push([suit, i]);
        }
    }

    const cards_per_player = cards.length / players;
    cards = L.shuffle(cards.slice(cards.length % players));

    return L.range(3).map((i) =>
        cards.slice(i * cards_per_player, (i + 1) * cards_per_player)
    );
}

function nextPlayer(currentPlayer, totalPlayers) {
    return (currentPlayer % totalPlayers) + 1;
}

function makeState(playerCards) {
    var limits = new Map();
    var hands = new ArrayKeyedMap();
    var totalPlayers = playerCards.length;
    var firstCard = [SUITS.values().next().value, Math.ceil(N_CARDS / 2)];
    var [firstSuit, firstNum] = firstCard;

    for (let suit of SUITS.values()) {
        let limit = { end: [0, N_CARDS] };

        if (suit === firstSuit) {
            limit.start = [firstNum - 1, firstNum + 1];
        } else {
            limit.start = [firstNum, firstNum];
        }

        limits.set(suit, limit);
    }

    for (let [i, cards] of playerCards.entries()) {
        for (let card of cards) {
            hands.set(card, i + 1);
        }
    }

    var currentPlayer = nextPlayer(hands.get(firstCard), totalPlayers);
    hands.set(firstCard, 0);

    return { limits, hands, currentPlayer, totalPlayers };
}

var cards = shuffleCards(3);
var state = makeState(cards);

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
    var { limits, hands, currentPlayer } = state;
    cards = [];

    for (let [suit, { start }] of limits.entries()) {
        for (let num of start) {
            let card = [suit, num];
            if (!isNaN(num) && hands.get(card) === currentPlayer) {
                cards.push(card);
            }
        }
    }

    if (L.isEmpty(cards)) {
        return { action: 'turn', cards: playerCards(state, currentPlayer) };
    } else {
        return { action: 'play', cards };
    }
}

function applyMove(state, move) {
    let [suit, num] = move.card;
    let { start, end } = state.limits.get(suit);
    //var state1 = state;

    switch (move.action) {
        case 'play':
            let [min, max] = start;

            state.hands.set(move.card, 0);

            if (num === min) {
                start[0] = min === end[0] ? NaN : min - 1;
            } else if (num === max) {
                start[1] = max === end[1] ? NaN : max + 1;
            } else if (min === max) {
                start[0] = min === end[0] ? NaN : min - 1;
                start[1] = max === end[1] ? NaN : max + 1;
            }

            break;
        case 'turn':
            if (num < start[0]) {
                end[0] = num;
            } else if (num > start[1]) {
                end[1] = num;
            }

            state.hands.set(move.card, -state.currentPlayer);

            break;
    }

    state.currentPlayer = nextPlayer(state.currentPlayer, state.totalPlayers);

    return state;
}

function isFinalState(state){
    for(let p of state.hands.values()){
        if(p > 0){
            return false;
        }
    }

    return true;
}

function score(state){
    var scores = new Map();

    for (var i = 1; i <= state.totalPlayers; i++ ){
        scores.set(i,0);
    }
    for(let p of state.hands.values()){
        if(p < 0){
            var value = state.hands.values();
            scores.set(-(value), scores.get(-value) + state.hands.entries[1]);
         }
    }
    return scores;
}

var cards = shuffleCards(3);
var state = makeState(cards);

