import React from "react"
import { Route, useNavigate } from "react-router-dom"
import { Box, Button, Card, Container, Grid, Typography } from "@mui/material";

import AnalysisTemplate, { AnalysisTarget, COUNTRY, LANGUAGE } from "./analysis-template"
import { Parameter, RequestData } from "./request-data"
import { Country } from "../types";
import GridTemplate from "./grid";

const START_YEAR_PARAM = Parameter.getRangeParameter("start_year", "Start Year", 2023, 1956, -1);
const END_YEAR_PARAM = Parameter.getRangeParameter("end_year", "End Year", 2023, 1956, -1);
const INCLUDE_NQ_PARAM = Parameter.getBooleanParameter("include_nq", "Include NQs?");
const VOTE_TYPE_PARAM = Parameter.getParameter("vote_type", "Vote Type", ["combined", "jury", "televote"]);
const PROPORTIONAL_PARAM = Parameter.getBooleanParameter("proportional");
const SHOW_TYPE_PARAM = Parameter.getParameter("shows", "Show Types", [["final", "Grand Finals"], ["semi", "Semi-Finals"]]);
const AVERAGE_PARAM = Parameter.getBooleanParameter("average");
const WEIGHTED_PARAM = Parameter.getBooleanParameter("weighted");
const METRIC_PARAM = Parameter.getParameter("metric", "Metric", ["points", "places"]);

const yearsConstructor = RequestData.getPresetParameters([START_YEAR_PARAM, END_YEAR_PARAM]);
const voteTypeYearsConstructor = RequestData.getPresetParameters([START_YEAR_PARAM, END_YEAR_PARAM, VOTE_TYPE_PARAM]);

export class View {
    private title: string;
    private description: string;
    private metrics: RequestData[];
    private link: string;
    element: JSX.Element;
    route: JSX.Element;
    card: JSX.Element;

    private static AnalysisCard = (props: { title: string, description: string, link: string }) => {
        const { title, description, link } = props;
        const navigate = useNavigate();

        return (
            <Grid item xs={3} onClick={() => { navigate(link) }}>
                <Box sx={{
                    backgroundColor: "#eee",
                    p: 1,
                    m: 1,
                    borderRadius: "10px",
                    height: "100px",
                    "&:hover": {
                        backgroundColor: "#ddd"
                    }
                }}>
                    <Typography variant="h6" align="center">{title}</Typography>
                    <Typography variant="body2" align="center">{description}</Typography>
                </Box>

            </Grid>
        );
    }

    // target is optional, if it's not provided, it will be a grid
    //TODO make this more flexible
    constructor(title: string, description: string, metrics: RequestData[], target?: AnalysisTarget) {
        this.title = title;
        this.description = description;
        this.metrics = metrics;

        this.link = title
            .toLowerCase()
            .replace(/[^\w\s]/g, '') //remove non-alphanumeric characters that aren't spaces
            .replace(/\s/g, '-') //replace spaces with hyphens

        if (target) {
            this.element = <AnalysisTemplate
                title={title}
                metrics={metrics}
                target={target}
            />
        }
        else {
            this.element = <GridTemplate
                title={title}
                metrics={metrics}
            />
        }

        this.route = <Route
            key={this.link}
            path={this.link}
            element={this.element}
        />
        this.card = <View.AnalysisCard
            key={this.title}
            title={this.title}
            description={this.description}
            link={this.link}
        />
    }
}

const getViews = (countries: Country[]) => {
    const COUNTRY_PARAM = Parameter.getParameter(
        "country",
        "Country",
        countries ? countries.map(country => [country.id, country.name]) : []
    );

    return [
        new View(
            "Average Performance",
            "See various metrics relating to how a country has performed on average in Eurovision",
            [
                voteTypeYearsConstructor("Average Final Points", "average/get_average_final_points/")
                    .addParameter(PROPORTIONAL_PARAM)
                    .addParameter(INCLUDE_NQ_PARAM),
                voteTypeYearsConstructor("Average Semi-Final Points", "average/get_average_semi_points/")
                    .addParameter(PROPORTIONAL_PARAM),
                voteTypeYearsConstructor("Average Overall Place", "average/get_average_place/")
                    .addParameter(INCLUDE_NQ_PARAM),
                voteTypeYearsConstructor("Average Semi-Final Place", "average/get_average_semi_place/"),
                voteTypeYearsConstructor("Average Proportion", "average/get_average_performance/"),
                voteTypeYearsConstructor("Average Number of Point Givers", "average/get_average_point_giver_count/")
                    .addParameter(SHOW_TYPE_PARAM)
                    .addParameter(PROPORTIONAL_PARAM),
            ],
            COUNTRY
        ),

        new View(
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

        new View(
            "Running Order",
            "See country's average running order position",
            [
                yearsConstructor("Average Running Order", "running_order/get_average_running_order/")
                    .addParameter(SHOW_TYPE_PARAM)
                    .addParameter(PROPORTIONAL_PARAM),
            ],
            COUNTRY
        ),

        new View(
            "Voting History",
            "See how a country has given points to other countries in the past",
            [
                voteTypeYearsConstructor("Points Given", "exchanges/get_points_from/",
                    (choices: { [key: string]: any }) => choices.average ? 3 : 0
                )
                    .addParameter(COUNTRY_PARAM)
                    .addParameter(SHOW_TYPE_PARAM)
                    .addParameter(AVERAGE_PARAM),
                voteTypeYearsConstructor("Points Received", "exchanges/get_points_to/",
                    (choices: { [key: string]: any }) => choices.average ? 3 : 0
                )
                    .addParameter(COUNTRY_PARAM)
                    .addParameter(SHOW_TYPE_PARAM)
                    .addParameter(AVERAGE_PARAM),
                voteTypeYearsConstructor("Point Discrepancy", "exchanges/get_discrepancies/",
                    (choices: { [key: string]: any }) => choices.average ? 3 : 0
                )
                    .addParameter(COUNTRY_PARAM)
                    .addParameter(SHOW_TYPE_PARAM)
                    .addParameter(AVERAGE_PARAM),
                voteTypeYearsConstructor("Friends", "exchanges/get_friends/",
                    (choices: { [key: string]: any }) => choices.average ? 3 : 0
                )
                    .addParameter(COUNTRY_PARAM)
                    .addParameter(SHOW_TYPE_PARAM)
                    .addParameter(AVERAGE_PARAM),
            ],
            COUNTRY
        ),

        new View(
            "Languages",
            "See the languages used in Eurovision",
            [
                yearsConstructor("Number of Entries", "languages/get_language_count/",
                    (choices: { [key: string]: any }) => choices.weighted ? 2 : 0
                )
                    .addParameter(WEIGHTED_PARAM),
                yearsConstructor("Number of Entries by Country", "languages/get_language_count_by_country/",
                    (choices: { [key: string]: any }) => choices.weighted ? 2 : 0
                )
                    .addParameter(COUNTRY_PARAM)
                    .addParameter(WEIGHTED_PARAM),
                yearsConstructor("Number of Countries", "languages/get_country_count/", 0),
                yearsConstructor("Longest Use Streak", "languages/get_use_streak/", 0),
                yearsConstructor("Qualification Rate", "languages/get_qualification_rate/"),
                yearsConstructor("Earliest Appearance", "languages/get_earliest_appearance/", 0),
                yearsConstructor("Latest Appearance", "languages/get_latest_appearance/", 0),
            ],
            LANGUAGE
        ),

        new View(
            "Jury vs. Televote",
            "See how a country's jury and televote results compare",
            [
                yearsConstructor("Jury vs. Televote Discrepancy", "votetypes/get_discrepancy/",
                    (choices: { [key: string]: any }) => choices.average ? 3 : 0
                )
                    .addParameter(METRIC_PARAM)
                    .addParameter(SHOW_TYPE_PARAM)
                    .addParameter(AVERAGE_PARAM),
                yearsConstructor("Average Jury vs. Televote Proportion", "votetypes/get_points_proportion/")
                    .addParameter(SHOW_TYPE_PARAM),
            ],
            COUNTRY
        ),

        new View(
            "Similarity in Voting Patterns",
            "See how similar a country's voting patterns are to other countries",
            [
                yearsConstructor("Similarity", "similarities/get_similarity/")
                    .addParameter(Parameter.getParameter("mode", "Mode", ["cosine", "rank"]))
            ]
        )
    ]
}

//since the routes need to be children, they need to be created in a function as opposed to a component
//this means we can't use hooks, so we need to pass in the countries
const getAnalysisRoute = (countries: Country[]) => {
    const views = getViews(countries);

    return (
        <Route path="/analysis">
            <Route index element={<AnalysisMenu views={views} />} />
            {
                views.map(view => view.route)
            }
        </Route>
    );
}

const AnalysisMenu = (props: { views: View[] }) => {
    const { views } = props;
    const navigate = useNavigate();

    return (
        <Container>
            <Typography variant="h3" align="center">Data Analysis</Typography>
            <Grid container justifyContent="center">
                {views.map(view => view.card)}
            </Grid>

            <Button onClick={() => { navigate("..") }}>Back</Button>
        </Container>

    );
}

export default getAnalysisRoute;
