var S = require('./state');
var { optimalMove } = require('./optimal');

var allCards = S.makeCards(3, 9);
var cards = S.shuffleCards(allCards, 3);
var state = S.makeState(cards);

// optimalMove(state, S.getCurrentPlayer(state));
