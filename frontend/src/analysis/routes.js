import React, { useContext } from "react"
import { Route } from "react-router-dom"
import AnalysisMenu from ".";
import AnalysisTemplate from "./analysis-template"
import CountryFlagCell from '../components/country-flag-cell';
import { Parameter, RequestData } from "./request-data.ts"
import { CountryContext } from "../app";

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
                dataKey="average"
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

                        {
                            field: "average",
                            headerName: "$header",
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
                        yearsConstructor("Qualifying Count", "qualify/get_qualify_count/"),

                        yearsConstructor("Qualifying Rate", "qualify/get_qualify_rate/"),

                        yearsConstructor("Longest Qualifying Streak", "qualify/get_longest_q_streak/"),

                        yearsConstructor("Longest Non-Qualifying Streak", "qualify/get_longest_nq_streak/"),
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
                            headerName: "$header",
                            flex: 2
                        }
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
                dataKey="average"
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
                        {
                            field: "average",
                            headerName: "$header",
                            valueGetter: (params) => params.row.average.toFixed(3),
                            flex: 2
                        }
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
                dataKey="points"
                metrics={
                    [
                        yearsConstructor("Grand Final Points Given", "exchanges/get_final_points_from/")
                            .addParameter(COUNTRY_PARAM),

                        yearsConstructor("Average Grand Final Points Given", "exchanges/get_average_final_points_from/")
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

                        {
                            field: "points",
                            headerName: "$header",
                            valueGetter: (params) => params.row.points.toFixed(3),
                            flex: 2
                        }
                    ]
                }
            />
        },
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