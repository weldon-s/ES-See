export const getOrdinal = num =>
    num % 10 === 1 && num !== 11 ? `${num}st` :
        num % 10 === 2 && num !== 12 ? `${num}nd` :
            num % 10 === 3 && num !== 13 ? `${num}rd` :
                `${num}th`;

export const getShowName = show =>
    show === "semi-final 1" ? "first semi-final" :
        show === "semi-final 2" ? "second semi-final" :
            show === "grand final" ? "Grand Final" : ""

export const getPointsKey = results =>
    results.jury && results.televote ? "combined" :
        results.jury ? "jury" : "televote";
