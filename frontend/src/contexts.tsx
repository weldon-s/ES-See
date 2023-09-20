import React, { createContext, useEffect, useState } from "react";

import Client from "./api/client";

import { Country, Edition, Group } from "./types";

export const EditionContext = React.createContext<Edition[]>([]);
export const CountryContext = React.createContext<Country[]>([]);
export const GroupContext = React.createContext<Group<Country>[]>([]);

const Contexts = (props: { children: React.ReactNode }) => {
    const [years, setYears] = useState<Edition[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [groups, setGroups] = useState<Group<Country>[]>([]);

    useEffect(() => {
        Client.post("editions/get_all/")
            .then(res => {
                setYears(res.data.sort((a: Edition, b: Edition) => b.year - a.year));
            });

        Client.post("countries/get_all/")
            .then(res => {
                setCountries(res.data.sort((a: Country, b: Country) => a.name.localeCompare(b.name)));
            });
    }, [])

    useEffect(() => {
        Client.post("groups/get_all/")
            .then(res => {
                if (!countries || countries.length === 0) {
                    return;
                }

                //We'll make the groups have a list of countries instead of ids to make it easier to work with them
                setGroups(res.data
                    .sort((a: Group<number>, b: Group<number>) => a.name.localeCompare(b.name))
                    .map((group: Group<number>) => {
                        return {
                            ...group,
                            countries: countries.filter((country: Country) => group.countries.includes(country.id)),
                        }
                    })
                )
            })
    }, [countries])

    return (
        <EditionContext.Provider value={years}>
            <CountryContext.Provider value={countries}>
                <GroupContext.Provider value={groups}>
                    {props.children}
                </GroupContext.Provider>
            </CountryContext.Provider>
        </EditionContext.Provider>
    );
};

export default Contexts;