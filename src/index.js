const board = document.getElementById('board');
const winningMessageElement = document.getElementById('winningMessage');
const restartButton = document.getElementById('restartButton');

const shuffle = require("lodash.shuffle");

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

function shuffleCards(players) {
    var cards = [];

    for (var i = 1; i <= 13; i++) {
        for (suit in SUITS) {
            cards.push([suit, i]);
        }
    }

    shuffle(cards);

    return cards;
};

function initialState(players) {
    var state = new Map();
    var cards = []


    return state;
}


function initialiseBoard(){

}
