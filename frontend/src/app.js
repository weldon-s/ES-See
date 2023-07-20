import React, { Fragment, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";

import FrontPage from "./main/front-page";

import Client from "../src/api/client"
import EntryInfo from "./main/entry-info";
import CountryInfo from "./main/country-info";
import AnalysisMenu from "./analysis";
import AnalysisTemplate from "./analysis/analysis-template";

import CountryFlagCell from './components/country-flag-cell';


import { Parameter, RequestData } from "./analysis/request-data.ts"


export const EditionContext = React.createContext();
export const CountryContext = React.createContext();

//TODO move all of this
const START_YEAR_PARAM = Parameter.getRangeParameter("start_year", "Start Year", 2023, 1956, -1);
const END_YEAR_PARAM = Parameter.getRangeParameter("end_year", "End Year", 2023, 1956, -1);
const INCLUDE_NQ_PARAM = Parameter.getBooleanParameter("include_nq", "Include NQs?");
const VOTE_TYPE_PARAM = Parameter.getParameter("vote_type", "Vote Type", [["combined", "Combined"], ["jury", "Jury"], ["televote", "Televote"]]);

const requestConstructor = RequestData.getPresetParameters([START_YEAR_PARAM, END_YEAR_PARAM, VOTE_TYPE_PARAM]);
const CARDS = [
    {
        title: "Average Performance",
        description: "See various metrics relating to how a country has performed on average in Eurovision",
        link: "average-performance",
        element: <AnalysisTemplate
            title="Average Performance"
            dataKey="average"
            metrics={[
                requestConstructor("Average Grand Final Points", "average/get_average_final_points/")
                    .addParameter(INCLUDE_NQ_PARAM),

                requestConstructor("Average Grand Final Proportion", "average/get_average_final_proportion/")
                    .addParameter(INCLUDE_NQ_PARAM),

                requestConstructor("Average Semi-Final Points", "average/get_average_semi_points/"),

                requestConstructor("Average Semi-Final Proportion", "average/get_average_semi_proportion/"),

                requestConstructor("Average Overall Place", "average/get_average_place/")
                    .addParameter(INCLUDE_NQ_PARAM),

                requestConstructor("Average Semi-Final Place", "average/get_average_semi_place/"),
            ]}
            columns={
                [
                    {
                        field: "place",
                        headerName: "Place",
                        flex: 1
                    },

                    {
                        field: "country",
                        headerName: "Country",
                        valueGetter: (params) => params.row.country.name,
                        renderCell: (params) => <CountryFlagCell country={params.row.country} />,
                        flex: 2
                    },

                    {
                        field: "average",
                        headerName: "Result",
                        renderCell: (params) => params.row.average.toFixed(3),
                        flex: 2
                    }
                ]
            }
        />
    },

    {
        title: "Qualifying History",
        description: "See the history of a country's qualification for the grand final",
        link: "qualifying-history",
        element: <AnalysisTemplate
            title="Qualifying History"
            dataKey="qualify"
            metrics={
                [
                    new RequestData("Qualifying Count", "qualify/get_qualify_count/")
                        .addParameter(Parameter.getRangeParameter("start_year", "Start Year", 2023, 1956, -1))
                        .addParameter(Parameter.getRangeParameter("end_year", "End Year", 2023, 1956, -1)),

                    new RequestData("Qualifying Rate", "qualify/get_qualify_rate/")
                        .addParameter(Parameter.getRangeParameter("start_year", "Start Year", 2023, 1956, -1))
                        .addParameter(Parameter.getRangeParameter("end_year", "End Year", 2023, 1956, -1)),

                    new RequestData("Longest Qualifying Streak", "qualify/get_longest_q_streak/")
                        .addParameter(Parameter.getRangeParameter("start_year", "Start Year", 2023, 1956, -1))
                        .addParameter(Parameter.getRangeParameter("end_year", "End Year", 2023, 1956, -1)),

                    new RequestData("Longest Non-Qualifying Streak", "qualify/get_longest_nq_streak/")
                        .addParameter(Parameter.getRangeParameter("start_year", "Start Year", 2023, 1956, -1))
                        .addParameter(Parameter.getRangeParameter("end_year", "End Year", 2023, 1956, -1)),
                ]
            }
            columns={
                [
                    {
                        field: "country",
                        headerName: "Country",
                        valueGetter: (params) => params.row.country.name,
                        renderCell: (params) => <CountryFlagCell country={params.row.country} />,
                        flex: 2
                    },

                    {
                        field: "qualify",
                        headerName: "Qualification Count",
                        flex: 2
                    }
                ]
            }

        />
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