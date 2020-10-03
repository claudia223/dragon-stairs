var Benchmark = require('benchmark');

var S = require('./../src/state.js');
var { optimalMove } = require('./../src/optimal.js');

function secondsUnits(s) {
    var UNITS = ['s', 'ms', 'μs', 'ns'];
    let power = s > 1 ? 0 : Math.abs(Math.floor(Math.log10(s)));
    let i = Math.min(Math.ceil(power / 3), UNITS.length - 1);

    let value = (s * Math.pow(10, 3 * i)).toPrecision(3);
    let unit = UNITS[i];

    return `${value} ${unit}`;
}

var suite = new Benchmark.Suite({
    maxTime: 1.0,
});

var cards = require('./cards');
var state = S.makeState(cards);

suite.add('optimalMove', () => {
    optimalMove(state, S.getCurrentPlayer(state));
});

suite.add('playerCards', () => {
    S.playerCards(state, S.getCurrentPlayer(state));
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
