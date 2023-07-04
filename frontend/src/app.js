import React, { Fragment, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Routes, Route, Switch } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";

import FrontPage from "./components/front-page";

import Client from "../src/api/client"

export const EditionContext = React.createContext();
export const CountryContext = React.createContext();

function App() {
    const theme = createTheme({
        typography: {
            fontFamily: 'Inter'
        }
    });

    console.log(theme)

    const [years, setYears] = useState(undefined);
    const [countries, setCountries] = useState(undefined);

    useEffect(() => {
        Client.post("editions/get_all/")
            .then(res => {
                setYears(res.data);
            });

        Client.post("countries/get_all/")
            .then(res => {
                setCountries(res.data);
            });
    }, [])

    //return <G />

    return (
        <>
            <ThemeProvider theme={theme}>
                <EditionContext.Provider value={years}>
                    <CountryContext.Provider value={countries}>
                        <BrowserRouter>
                            <Routes>
                                <Route path="/" element={<Navigate to={`/1`} />} />
                                {
                                    years && years.map(year => {
                                        return (
                                            <Fragment key={year}>
                                                <Route path={`/${year.id}`} element={<FrontPage year={year.id} />} />

                                                {/*{Object.keys(yearData.songs).map(country =>
                                                    <Route key={country}
                                                        path={`/${year}/${country}`}
                                                        element={
                                                            <EntryInfo data={getCountryData(yearData, country)} />
                                                        } />

                                                    )}*/}
                                            </Fragment>
                                        )
                                    })
                                }


                            </Routes>
                        </BrowserRouter>
                    </CountryContext.Provider>
                </EditionContext.Provider>
            </ThemeProvider >
        </>
    );
}

export default App;