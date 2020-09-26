// data Suits = Diamond | Clubs | Hearts | Spades

var SUITS = Object.freeze({
    DIAMONDS: "D",
    CLUBS: "C",
    HEARTS: "H",
    SPADES: "S"
});

// data Card = Yes | No | Turned

var CARD = Object.freeze({
    YES: 1,
    NO: 0,
    TURNED: -1,
})

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function shuffleCards(players){
    var cards = [];

    for(var i = 1; i <= 13; i++){
        for(suit in SUITS){
            cards.push([suit,i]);
        }
    }

    shuffleArray(cards);

    return cards;
};

function initialState(players){
    var state = new Map();
    var cards = []

    return state;
}
