import React, { createContext, useEffect, useState } from "react";

import Client from "./api/client";

//TODO make these not any
export const EditionContext = React.createContext<any[]>([]);
export const CountryContext = React.createContext<any[]>([]);
export const GroupContext = React.createContext<any[]>([]);

const Contexts = (props: { children: any }) => {
    const [years, setYears] = useState<any[]>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);

    useEffect(() => {
        Client.post("editions/get_all/")
            .then(res => {
                setYears(res.data.sort((a: any, b: any) => b.year - a.year));
            });

        Client.post("countries/get_all/")
            .then(res => {
                setCountries(res.data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
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
                    .sort((a: any, b: any) => a.name.localeCompare(b.name))
                    .map((group: any) => {
                        return {
                            ...group,
                            countries: countries.filter((country: any) => group.countries.includes(country.id)),
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