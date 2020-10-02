var S = require('../src/state.js');

describe('shuffleCards', () => {
    let allCards = S.makeCards(2,11);
    let cards = S.shuffleCards(allCards, 3);

    test('shuffleCards divides equally', () => {
        expect(cards.length).toBe(3);
    });
});

test('nextPlayer returns correct player', () => {
    expect(S.nextPlayer(1, 3)).toBe(2);
    expect(S.nextPlayer(3, 3)).toBe(1);
});

describe('playerCards', () => {
    let allCards = S.makeCards(2,11);
    let cards = S.shuffleCards(allCards, 3);
    var state = S.makeState(cards);

    var currentPlayer = S.getCurrentPlayer(state);
    var pCards = S.playerCards(state, currentPlayer);

    test("playerCards returns player's card's length", () => {
        expect(pCards.length).toBe(cards[currentPlayer - 1].length);
    });
});
