var Benchmark = require('benchmark');
var S = require('./../src/index.js');

function secondsUnits(s) {
    var UNITS = ['s', 'ms', 'μs', 'ns'];
    let power = s > 1 ? 0 : Math.abs(Math.floor(Math.log10(s)));
    let unit_index = Math.floor(power / 3);
    let unit = UNITS[unit_index];
    return `${s * Math.pow(10, 3 * unit_index)} ${unit}`;
}

var suite = new Benchmark.Suite({
    maxTime: 1,
});

var allCards = S.makeCards();
var cards = S.shuffleCards(allCards, 3);
var state = S.makeState(cards);

suite.add('optimalMove', () => {
    S.optimalMove(state, state.currentPlayer);
});

suite.add('playerCards', () => {
    S.playerCards(state, state.currentPlayer);
});

suite.add('calculateScores', () => {
    S.calculateScores(state);
});

suite.on('cycle', function (event) {
    let {
        name,
        stats: { mean, sem },
    } = event.target;
    console.log(`${name} => ${secondsUnits(mean)} ± ${secondsUnits(sem)}`);
});

suite.run({ async: true });
