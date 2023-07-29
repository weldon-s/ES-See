import React, { useContext } from "react"
import { Route } from "react-router-dom"
import AnalysisMenu from ".";
import AnalysisTemplate from "./analysis-template"
import CountryFlagCell from '../components/country-flag-cell';
import { Parameter, RequestData } from "./request-data"

const START_YEAR_PARAM = Parameter.getRangeParameter("start_year", "Start Year", 2023, 1956, -1);
const END_YEAR_PARAM = Parameter.getRangeParameter("end_year", "End Year", 2023, 1956, -1);
const INCLUDE_NQ_PARAM = Parameter.getBooleanParameter("include_nq", "Include NQs?");
const VOTE_TYPE_PARAM = Parameter.getParameter("vote_type", "Vote Type", [["combined", "Combined"], ["jury", "Jury"], ["televote", "Televote"]]);

const yearsConstructor = RequestData.getPresetParameters([START_YEAR_PARAM, END_YEAR_PARAM]);

const voteTypeYearsConstructor = RequestData.getPresetParameters([START_YEAR_PARAM, END_YEAR_PARAM, VOTE_TYPE_PARAM]);
const getCards = (countries) => {
    const COUNTRY_PARAM = Parameter.getParameter(
        "country",
        "Country",
        countries ? countries.map(country => [country.id, country.name]) : []
    );

    return [
        {
            title: "Average Performance",
            description: "See various metrics relating to how a country has performed on average in Eurovision",
            link: "average-performance",
            element: <AnalysisTemplate
                title="Average Performance"
                dataKey="result"
                metrics={[
                    voteTypeYearsConstructor("Average Grand Final Points", "average/get_average_final_points/")
                        .addParameter(INCLUDE_NQ_PARAM),

                    voteTypeYearsConstructor("Average Grand Final Proportion", "average/get_average_final_proportion/")
                        .addParameter(INCLUDE_NQ_PARAM),

                    voteTypeYearsConstructor("Average Semi-Final Points", "average/get_average_semi_points/"),

                    voteTypeYearsConstructor("Average Semi-Final Proportion", "average/get_average_semi_proportion/"),

                    voteTypeYearsConstructor("Average Overall Place", "average/get_average_place/")
                        .addParameter(INCLUDE_NQ_PARAM),

                    voteTypeYearsConstructor("Average Semi-Final Place", "average/get_average_semi_place/"),
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
                dataKey="result"
                metrics={
                    [
                        yearsConstructor("Qualifying Count", "qualify/get_qualify_count/", 0),

                        yearsConstructor("Qualifying Rate", "qualify/get_qualify_rate/"),

                        yearsConstructor("Longest Qualifying Streak", "qualify/get_longest_q_streak/", 0),

                        yearsConstructor("Longest Non-Qualifying Streak", "qualify/get_longest_nq_streak/", 0),
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
                    ]
                }

            />
        },

        {
            title: "Running Order",
            description: "See country's average running order position",
            link: "running-order",
            element: <AnalysisTemplate
                title="Running Order"
                dataKey="result"
                metrics={
                    [
                        yearsConstructor("Average Grand Final Running Order", "running_order/get_average_final_running_order/"),

                        yearsConstructor("Average Grand Final Running Order Proportion", "running_order/get_average_final_running_order_proportion/"),

                        yearsConstructor("Average Semi-Final Running Order", "running_order/get_average_semi_running_order/"),

                        yearsConstructor("Average Semi-Final Running Order Proportion", "running_order/get_average_semi_running_order_proportion/")
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
                    ]
                }
            />
        },

        //TODO fix this one not rendering the choice properly
        {
            title: "Voting History",
            description: "See how a country has given points to other countries in the past",
            link: "voting-history",
            element: <AnalysisTemplate
                title="Voting History"
                dataKey="result"
                metrics={
                    [
                        voteTypeYearsConstructor("Grand Final Points Given", "exchanges/get_final_points_from/", 0)
                            .addParameter(COUNTRY_PARAM),

                        voteTypeYearsConstructor("Average Grand Final Points Given", "exchanges/get_average_final_points_from/")
                            .addParameter(COUNTRY_PARAM),

                        voteTypeYearsConstructor("Semi-Final Points Given", "exchanges/get_semi_points_from/", 0)
                            .addParameter(COUNTRY_PARAM),

                        voteTypeYearsConstructor("Average Semi-Final Points Given", "exchanges/get_average_semi_points_from/")
                            .addParameter(COUNTRY_PARAM),

                        voteTypeYearsConstructor("Grand Final Points Received", "exchanges/get_final_points_to/", 0)
                            .addParameter(COUNTRY_PARAM),

                        voteTypeYearsConstructor("Average Grand Final Points Received", "exchanges/get_average_final_points_to/")
                            .addParameter(COUNTRY_PARAM),

                        voteTypeYearsConstructor("Semi-Final Points Received", "exchanges/get_semi_points_to/", 0)
                            .addParameter(COUNTRY_PARAM),

                        voteTypeYearsConstructor("Average Semi-Final Points Received", "exchanges/get_average_semi_points_to/")
                            .addParameter(COUNTRY_PARAM),
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
                    ]
                }
            />
        },

        {
            title: "Languages",
            description: "See the languages used in Eurovision",
            link: "languages",
            element: <AnalysisTemplate
                title="Languages"
                dataKey="result"
                metrics={
                    [
                        yearsConstructor("Number of Entries", "languages/get_language_count/", 2)
                            .addParameter(Parameter.getBooleanParameter("weighted", "Weighted?")),
                        yearsConstructor("Number of Countries", "languages/get_country_count/", 0),
                        yearsConstructor("Longest Use Streak", "languages/get_use_streak/", 0),
                        yearsConstructor("Qualification Rate", "languages/get_qualification_rate/"),
                        yearsConstructor("Earliest Appearance", "languages/get_earliest_appearance/", 0),
                        yearsConstructor("Latest Appearance", "languages/get_latest_appearance/", 0),
                    ]
                }
                columns={
                    [
                        {
                            field: "language",
                            headerName: "Language",
                            flex: 2
                        }
                    ]
                }
            />

        }
    ]
}

const getAnalysisRoute = (countries) => {
    const cards = getCards(countries);

    return (
        <Route path="/analysis">
            <Route index element={<AnalysisMenu cards={cards} />} />

            {
                cards.map(card => <Route key={card.link} path={card.link} element={card.element} />)
            }
        </Route>
    );
}

export default getAnalysisRoute;