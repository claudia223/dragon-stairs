var {
    shuffleCards,
    makeCards,
    nextPlayer,
    makeState,
    playerCards,
} = require('../src/index.js');

describe('shuffleCards', () => {
    let allCards = makeCards();
    let cards = shuffleCards(3, allCards);

    test('shuffleCards divides equally', () => {
        expect(cards.length).toBe(3);
    });
});

test('nextPlayer returns correct player', () => {
    expect(nextPlayer(1, 3)).toBe(2);
    expect(nextPlayer(3, 3)).toBe(1);
});

describe('playerCards', () => {
    let allCards = makeCards();
    let cards = shuffleCards(3, allCards);
    var state = makeState(cards);

    var pCards = playerCards(state, state.currentPlayer);

    test("playerCards returns player's card's length", () => {
        expect(pCards.length).toBe(cards[state.currentPlayer - 1].length);
    });
});
