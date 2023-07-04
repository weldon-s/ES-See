import { getYear } from "../data";

const BIG_FIVE = ['de', 'es', 'fr', 'gb', 'it'];
const POINTS = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];
const SHOWS = ["semi1", "semi2", "final"];

//finds points for given array of placings (0 is 1st, length - 1 is last)
const pointSum = places => {
    let index = 0;
    return places.reduce((acc, cur) => acc + cur * (index < POINTS.length ? POINTS[index++] : 0), 0);
};

const getPointCategories = (data) => {
    return (show) => {
        return data.points[show];
    }
}

export const getCountryData = (data, country) => {
    let ret = {};

    ret.inSemi = false;
    ret.inFinal = false;

    SHOWS.forEach(show => {
        if (Object.hasOwn(data[show], country) && data[show][country].running > 0) {
            let showData = getResult(data[show]);
            let countryData = showData.filter(elem => elem.country === country)[0];

            delete countryData.country;
            ret[show] = countryData;

            if (show === "semi1" || show === "semi2") {
                ret.inSemi = true;
            }
            else {
                ret.inFinal = true;
            }
        }
    })

    ret.song = data.songs[country]
    ret.country = country
    ret.year = data.year

    return ret;
}

export const getResult = (data, pointCounter = pointSum) => {
    //we say competitors have positive RO
    let competitors = Object.keys(data).filter(elem => data[elem]?.running > 0);

    //scores obj holds arrays of rankings for jury and tele
    let scores = {};
    competitors.forEach(elem => {
        scores[elem] = {
            jury: Array(competitors.length).fill(0),
            tele: Array(competitors.length).fill(0)
        };
    });

    //mark the country at each index with the appropriate place
    Object.keys(data).forEach(country => {
        if (data[country].jury) {
            data[country].jury.forEach((recipient, index) => scores[recipient].jury[index]++);
        }

        if (data[country].tele) {
            data[country].tele.forEach((recipient, index) => scores[recipient].tele[index]++);
        }
    });

    let result = Object.keys(scores).map(elem => {
        let jury = pointCounter(scores[elem].jury)
        let tele = pointCounter(scores[elem].tele)

        return {
            country: elem,
            points: jury + tele,
            jury: jury,
            tele: tele,
            runningOrder: data[elem].running
        }
    })
        .sort((a, b) => {
            let diff = b.points - a.points

            if (diff !== 0) {
                return diff;
            }

            return b.tele - a.tele
        });

    result.forEach((elem, i) => elem.place = i + 1); //TODO fix this to be proper tiebreaking rules

    return result;
}