export interface Edition {
    id: number,
    year: number,
    host: number,
    city: string,
}

export interface Country {
    id: number,
    name: string,
    code: string,
    adjective: string,
}

export interface Language {
    id: number,
    name: string,
}

//This allows us to use either Countries or their ids to refer to them
export interface Group<T> {
    id: number,
    name: string,
    countries: T[],
}