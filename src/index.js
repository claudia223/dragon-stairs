var ld = require("lodash");
var ArrayKeyedMap = require("array-keyed-map");

// data Suits = Diamond | Clubs | Hearts | Spades
var SUITS = new Map([
    ["DIAMONDS", "A"],
    ["CLUBS", "B"],
    // HEARTS: "H",
    // SPADES: "S"
]);

const N_CARDS = 5;

// data Card = Yes | No | Turned
var CARD_STATE = Object.freeze({
    YES: 1,
    NO: 0,
    TURNED: -1,
})

function shuffleCards(players) {
    var cards = [];

    for (var i = 1; i <= N_CARDS; i++) {
        for (let suit of SUITS.values()) {
            cards.push([suit, i]);
        }
    }

    const cards_per_player = (cards.length / players);
    cards =  ld.shuffle(cards.slice(cards.length % players));

    return ld.range(3)
        .map(i => cards.slice(i * cards_per_player, (i + 1) * cards_per_player));
};

function makeState(playerCards) {
    const N = playerCards.length;
    var heads = new Map();
    var hands = new ArrayKeyedMap();
    var firstCard = [SUITS.values().next().value, Math.ceil(N_CARDS / 2)];

    for (let suit of SUITS.values()) {
        var head = suit === firstCard[0] ? [firstCard[1],firstCard[1]] : null;
        heads.set(suit,head);
    }

    for(let [i, cards] of playerCards.entries()){
        for(let card of cards){
            hands.set(card, i + 1);
        }
    }

    // Number of first player as an index [0, N - 1]
    var firstPlayer = hands.get(firstCard) - 1;
    // Number of next player as an index [1, N]
    var currentPlayer = ((firstPlayer + 1) % N) + 1;

    hands.set(firstCard, 0);

    return {heads, hands, currentPlayer};
}


var cards = shuffleCards(3);
var state = makeState(cards);
