import React, { createContext, useEffect, useState } from "react";

import Client from "./api/client";

//TODO make these not any
export const EditionContext = React.createContext<any[]>([]);
export const CountryContext = React.createContext<any[]>([]);

const Contexts = (props: { children: any }) => {
    const [years, setYears] = useState<any[]>([]);
    const [countries, setCountries] = useState<any[]>([]);

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

    return (
        <EditionContext.Provider value={years}>
            <CountryContext.Provider value={countries}>
                {props.children}
            </CountryContext.Provider>

        </EditionContext.Provider>
    );
};

export default Contexts;