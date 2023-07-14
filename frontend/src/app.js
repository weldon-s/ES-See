import React, { Fragment, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";

import FrontPage from "./main/front-page";

import Client from "../src/api/client"
import EntryInfo from "./main/entry-info";
import CountryInfo from "./main/country-info";
import AnalysisMenu from "./analysis";
import AveragePerformanceView from "./analysis/average-performance";

export const EditionContext = React.createContext();
export const CountryContext = React.createContext();

const CARDS = [
    {
        title: "Average Performance",
        description: "See various metrics relating to how a country has performed on average in Eurovision",
        link: "average-performance",
        element: <AveragePerformanceView />
    }
]

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
                setCountries(res.data);
            });
    }, [])

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

                                <Route path="/analysis" element={<AnalysisMenu cards={CARDS} />} />

                                {
                                    CARDS.map(card => <Route key={card.link} path={`/analysis/${card.link}`} element={card.element} />)
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