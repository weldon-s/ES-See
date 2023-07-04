import iso from "./iso.json"

export const getYear = (year) => require(`./${year}.json`);

export const fromIso = (code) => iso[code];

export const YEARS = Object.freeze(["2023", "2022", "2021"])