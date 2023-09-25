import { Box, Button, Container, Grid, Skeleton, Typography } from "@mui/material";
import React, { Fragment, useContext, useEffect, useMemo, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { CountryContext, EditionContext } from "../contexts";
import Client from "../api/client";
import { CountryFlagCell, Flag } from "../components/flags";
import { getOrdinal, getPlaceKey, getPointsKey, getShowName } from "../utils";

const EntryInfo = ({ country, year }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const editions = useContext(EditionContext);
    const [entry, setEntry] = useState(undefined);
    const [pointsFrom, setPointsFrom] = useState(undefined);
    const [pointsTo, setPointsTo] = useState(undefined);

    const [results, setResults] = useState(undefined);

    const edition = useMemo(() => {
        return editions.find(elem => elem.id === year);
    }, [year, editions]);

    useEffect(() => {
        setEntry(undefined);

        Client.post("entries/get_entry/", {
            edition: year,
            country: country.id
        })
            .then(res => {
                setEntry(res.data);
            })
    }, [country, year])

    useEffect(() => {
        setPointsTo(undefined);

        if (entry) {
            Client.post(`entries/${entry.id}/get_points_to/`)
                .then(res => {
                    setPointsTo(res.data);
                })
        }
    }, [entry])

    useEffect(() => {
        setPointsFrom(undefined);

        if (entry) {
            Client.post(`entries/${entry.id}/get_points_from/`)
                .then(res => {
                    setPointsFrom(res.data);
                })
        }
    }, [entry])

    useEffect(() => {
        setResults(undefined);

        Client.post("results/get_results/", {
            edition: year,
            country: country.id
        })
            .then(res => {
                setResults(res.data);
            })
    }, [country, year])

    const getShowBlurb = (show) => {
        //we get the key for the points from the results object based on what vote types we have
        let pointsKey = getPointsKey(results[show]);

        //add general info about the performance
        let str = `They performed ${getOrdinal(results[show].running_order)} in the ${getShowName(show)}, placing 
        ${getOrdinal(results[show].place)} with ${results[show][pointsKey]} ${results[show][pointsKey] === 1 ? "point" : "points"}. `;

        //include info about the qualification status if it's a semi-final
        if (show !== "grand final") {
            str += results[show].place <= 10 ? `${country.name} therefore qualified for the ${getShowName("grand final")}.` : `${country.name} therefore failed to qualify for the ${getShowName("grand final")}.`;
        }

        return str;
    }

    return (
        <Container>
            {
                edition ?
                    <Typography variant="h3" align="center">
                        {country.name} in Eurovision {edition.year}

                        <Flag code={country.code} style={{
                            height: "1em",
                            marginLeft: "0.5em",
                            borderRadius: "5px",
                        }} />
                    </Typography>
                    :
                    <Skeleton height="50px"></Skeleton>
            }

            {
                (edition && entry) ?
                    <Typography>
                        {country.name} {edition.year === 2020 && "would have"} participated in the {edition.year} edition of Eurovision
                        with the song <em>{entry.title}</em> by {entry.artist}.
                    </Typography>
                    :
                    <Skeleton height="50px"></Skeleton>
            }

            {
                results && Object.keys(results).sort().reverse().map(show => (
                    <Typography key={show}>{getShowBlurb(show)}</Typography>
                ))
            }

            {edition.year === 2020 ?
                <Typography>Due to the COVID-19 pandemic, the 2020 contest was cancelled and {country.name} did not compete</Typography>
                :
                <>

                    <Typography variant="h6" align="center">Points Given by {country.name}</Typography>
                    {pointsFrom ?
                        <EntryPointView
                            points={pointsFrom}
                        />
                        :
                        <Skeleton height="50px"></Skeleton>
                    }

                    <Typography variant="h6" align="center">Points Received by {country.name}</Typography>
                    {
                        pointsTo ?
                            <EntryPointView
                                points={pointsTo}
                                results={results}
                            />
                            :
                            <Skeleton height="50px"></Skeleton>
                    }
                </>

            }

            <Button onClick={() => navigate(`${location.pathname} + /..`)}>Back to {edition.year}</Button>
            <Button onClick={() => navigate(`/${country.code}`)}>View Profile of {country.name}</Button>

        </Container>
    );
}

export default EntryInfo;

const EntryPointView = ({ points, results }) => (
    <Grid container justifyContent="center">
        {/*
        We sort and reverse because "grand final" is lexicographically before "semi-final" so this way we get the semi followed 
        by the final. This isn't the most intuitive way of achieving this but it didn't involve writing extra sorting code
        */}
        {Object.keys(points).sort().reverse().map(show => (
            <ShowView
                key={show}
                show={show}
                points={points[show]}
                results={results?.[show]}
            />
        ))}
    </Grid>
);

const ShowView = ({ show, points, results }) => (
    <Grid item xs={6} key={show}>
        <Typography align="center" textTransform="capitalize">{show}</Typography>
        <Grid container justifyContent="center">
            {Object.keys(points).sort().map(voteType => (
                <VoteTypeView
                    key={voteType}
                    voteType={voteType}
                    showResults={results}
                    points={points[voteType]}
                />

            ))}
        </Grid>
    </Grid>
);

const VoteTypeView = ({ voteType, showResults, points }) => (
    <Grid item xs={6} sx={{ padding: "5px" }}>
        {voteType !== "combined" &&
            <Typography align="center" textTransform="capitalize">{voteType}</Typography>
        }

        {showResults &&
            <Typography fontSize="0.8em" align="center" fontStyle="italic">
                {showResults[voteType]} {showResults[voteType] === 1 ? "point " : "points "}
                ({getOrdinal(showResults[getPlaceKey(voteType)])} place)
            </Typography>
        }

        {Object.keys(points)
            .sort((a, b) => parseInt(b) - parseInt(a))
            .map(score =>
                <PointView key={score} score={score} countriesWithScore={points[score]} />
            )
        }
    </Grid>
);

const PointView = ({ score, countriesWithScore }) => {
    const countries = useContext(CountryContext);
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <Grid
            container
            sx={{
                backgroundColor: "#eee",
                borderRadius: "5px",
                marginTop: "10px",
                marginBottom: "10px",
                padding: "5px",

                "&:hover": {
                    backgroundColor: "#ddd"
                }
            }}
        >
            <Grid
                item
                xs={4} sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: "10px"
                }}>
                <Typography >{score} {score === "1" ? "point" : "points"}</Typography>
            </Grid>
            <Grid
                item
                xs={8}
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                }}

            >
                {countriesWithScore
                    ?.map(countryId => countries.find(elem => elem.id === countryId))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((country, index) => {
                        return (
                            <Box key={index} onClick={() => navigate(`${location.pathname}/../${country.code}`)}>
                                <CountryFlagCell
                                    fontSize="0.8em"
                                    country={country}
                                />
                            </Box>
                        );
                    })}
            </Grid>
        </Grid>
    )
};