import React, { Fragment, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";

import FrontPage from "./main/front-page";

import Client from "./api/client"
import EntryInfo from "./main/entry-info";
import CountryInfo from "./main/country-info";

import getAnalysisRoute from "./analysis";

import Contexts from "./contexts";
import RankingsView from "./rankings";
import GridTemplate from "./analysis/grid";

function App() {
    const theme = createTheme({
        typography: {
            fontFamily: 'Inter, sans-serif'
        }
    });

    const [years, setYears] = useState(undefined);
    const [countries, setCountries] = useState(undefined);

    useEffect(() => {
        Client.post("editions/get_all/")
            .then(res => {
                setYears(res.data.sort((a, b) => b.year - a.year));
            });

        Client.post("countries/get_all/")
            .then(res => {
                setCountries(res.data.sort((a, b) => a.name.localeCompare(b.name)));
            });
    }, [])

    return (
        <>
            <ThemeProvider theme={theme}>
                <Contexts>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Navigate to={`/1`} />} />
                            {
                                years && years.map(year => {
                                    return (
                                        <Fragment key={year}>
                                            <Route path={`/${year.id}`} element={<FrontPage year={year.id} />} />
                                            {
                                                countries && countries.map(country => (
                                                    <Route
                                                        key={country.code}
                                                        path={`/${year.id}/${country.code}`}
                                                        element={
                                                            <EntryInfo country={country} year={year.id} />
                                                        }
                                                    />
                                                ))
                                            }
                                        </Fragment>
                                    )
                                })
                            }

                            {
                                countries && countries.map(country => (
                                    <Route
                                        key={country.code}
                                        path={`${country.code}`}
                                        element={
                                            <CountryInfo country={country} />
                                        }
                                    />
                                ))
                            }

                            {getAnalysisRoute(countries)}

                            <Route path="rank" element={<RankingsView />} />
                            <Route path="tempstat" element={<GridTemplate />} />
                        </Routes>
                    </BrowserRouter>
                </Contexts>
            </ThemeProvider >
        </>
    );
}

export default App;