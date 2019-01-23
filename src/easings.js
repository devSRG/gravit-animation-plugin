function linear(t) {
    return t;
}

function easeIn(t) {
    return t * t;
}

function easeOut(t) {
    return t * (2 - t);
}

function easeInOut(t) {
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function easeOutElastic(t) {
    if(t == 1) t += 0.1;
    return .04 * t / (--t) * Math.sin(25 * t);
}

function easeOutSin(t) {
    return Math.sin(Math.PI / 2 * t);
}

function easeInBounce(t) {
    const scaledTime = t / 1;

    if( scaledTime < ( 1 / 2.75 ) ) {

        return 7.5625 * scaledTime * scaledTime;

    } else if( scaledTime < ( 2 / 2.75 ) ) {

        const scaledTime2 = scaledTime - ( 1.5 / 2.75 );
        return ( 7.5625 * scaledTime2 * scaledTime2 ) + 0.75;

    } else if( scaledTime < ( 2.5 / 2.75 ) ) {

        const scaledTime2 = scaledTime - ( 2.25 / 2.75 );
        return ( 7.5625 * scaledTime2 * scaledTime2 ) + 0.9375;

    } else {

        const scaledTime2 = scaledTime - ( 2.625 / 2.75 );
        return ( 7.5625 * scaledTime2 * scaledTime2 ) + 0.984375;

    }
}

function easeOutBounce(t) {
    return 1 - easeInBounce(t);
}

module.exports = {
    linear,
    easeIn,
    easeOut,
    easeInOut,
    easeOutElastic,
    easeOutSin,
    easeInBounce,
    easeOutBounce
};