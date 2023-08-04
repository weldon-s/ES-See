import React from "react"
import { Route } from "react-router-dom"
import AnalysisMenu from ".";
import AnalysisTemplate, { AnalysisTarget, COUNTRY, LANGUAGE } from "./analysis-template"
import { Parameter, RequestData } from "./request-data"

const START_YEAR_PARAM = Parameter.getRangeParameter("start_year", "Start Year", 2023, 1956, -1);
const END_YEAR_PARAM = Parameter.getRangeParameter("end_year", "End Year", 2023, 1956, -1);
const INCLUDE_NQ_PARAM = Parameter.getBooleanParameter("include_nq", "Include NQs?");
const VOTE_TYPE_PARAM = Parameter.getParameter("vote_type", "Vote Type", [["combined", "Combined"], ["jury", "Jury"], ["televote", "Televote"]]);

const yearsConstructor = RequestData.getPresetParameters([START_YEAR_PARAM, END_YEAR_PARAM]);
const voteTypeYearsConstructor = RequestData.getPresetParameters([START_YEAR_PARAM, END_YEAR_PARAM, VOTE_TYPE_PARAM]);

export class Card {
    title: string;
    description: string;
    private metrics: RequestData[];
    private target: AnalysisTarget;
    link: string;
    element: JSX.Element;
    route: JSX.Element;

    constructor(title: string, description: string, metrics: RequestData[], target: any) {
        this.title = title;
        this.description = description;
        this.metrics = metrics;
        this.target = target;

        this.link = title
            .toLowerCase()
            .replace(/[^\w\s]/g, '') //remove non-alphanumeric characters that aren't spaces
            .replace(/\s/, '-') //replace spaces with hyphens

        this.element =
            <AnalysisTemplate
                title={title}
                metrics={metrics}
                target={target}
            />

        this.route = <Route key={this.link} path={this.link} element={this.element} />
    }
}

const getCards = (countries: any[]) => {
    const COUNTRY_PARAM = Parameter.getParameter(
        "country",
        "Country",
        countries ? countries.map(country => [country.id, country.name]) : []
    );

    return [
        new Card(
            "Average Performance",
            "See various metrics relating to how a country has performed on average in Eurovision",
            [
                voteTypeYearsConstructor("Average Grand Final Points", "average/get_average_final_points/")
                    .addParameter(INCLUDE_NQ_PARAM),
                voteTypeYearsConstructor("Average Grand Final Proportion", "average/get_average_final_proportion/")
                    .addParameter(INCLUDE_NQ_PARAM),
                voteTypeYearsConstructor("Average Semi-Final Points", "average/get_average_semi_points/"),
                voteTypeYearsConstructor("Average Semi-Final Proportion", "average/get_average_semi_proportion/"),
                voteTypeYearsConstructor("Average Overall Place", "average/get_average_place/")
                    .addParameter(INCLUDE_NQ_PARAM),
                voteTypeYearsConstructor("Average Semi-Final Place", "average/get_average_semi_place/"),
            ],
            COUNTRY
        ),

        new Card(
            "Qualifying History",
            "See the history of a country's qualification for the grand final",

            [
                yearsConstructor("Qualifying Count", "qualify/get_qualify_count/", 0),
                yearsConstructor("Qualifying Rate", "qualify/get_qualify_rate/"),
                yearsConstructor("Longest Qualifying Streak", "qualify/get_longest_q_streak/", 0),
                yearsConstructor("Longest Non-Qualifying Streak", "qualify/get_longest_nq_streak/", 0),
            ],
            COUNTRY
        ),

        new Card(
            "Running Order",
            "See country's average running order position",

            [
                yearsConstructor("Average Grand Final Running Order", "running_order/get_average_final_running_order/"),
                yearsConstructor("Average Grand Final Running Order Proportion", "running_order/get_average_final_running_order_proportion/"),
                yearsConstructor("Average Semi-Final Running Order", "running_order/get_average_semi_running_order/"),
                yearsConstructor("Average Semi-Final Running Order Proportion", "running_order/get_average_semi_running_order_proportion/")
            ],
            COUNTRY
        ),

        new Card(
            "Voting History",
            "See how a country has given points to other countries in the past",

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
            ],
            COUNTRY
        ),

        new Card(
            "Languages",
            "See the languages used in Eurovision",

            [
                yearsConstructor("Number of Entries", "languages/get_language_count/", 2)
                    .addParameter(Parameter.getBooleanParameter("weighted", "Weighted?")),
                yearsConstructor("Number of Entries by Country", "languages/get_language_count_by_country/", 2)
                    .addParameter(COUNTRY_PARAM)
                    .addParameter(Parameter.getBooleanParameter("weighted", "Weighted?")),
                yearsConstructor("Number of Countries", "languages/get_country_count/", 0),
                yearsConstructor("Longest Use Streak", "languages/get_use_streak/", 0),
                yearsConstructor("Qualification Rate", "languages/get_qualification_rate/"),
                yearsConstructor("Earliest Appearance", "languages/get_earliest_appearance/", 0),
                yearsConstructor("Latest Appearance", "languages/get_latest_appearance/", 0),
            ],
            LANGUAGE
        ),

        new Card(
            "Jury vs. Televote",
            "See how a country's jury and televote results compare",

            [
                yearsConstructor("Final Jury vs. Televote Points", "votetypes/get_discrepancy_points/"),
                yearsConstructor("Average Final Jury vs. Televote Points", "votetypes/get_average_discrepancy_points/"),
                yearsConstructor("Final Jury vs. Televote Places", "votetypes/get_discrepancy_places/"),
                yearsConstructor("Average Final Jury vs. Televote Places", "votetypes/get_average_discrepancy_places/"),
                yearsConstructor("Average Final Jury vs. Televote Proportion", "votetypes/get_points_proportion/"),
            ],
            COUNTRY
        )
    ]
}

const getAnalysisRoute = (countries: any) => {
    const cards = getCards(countries);

    return (
        <Route path="/analysis">
            <Route index element={<AnalysisMenu cards={cards} />} />

            {
                cards.map(card => card.route)
            }
        </Route>
    );
}

export default getAnalysisRoute;