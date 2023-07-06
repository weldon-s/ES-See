import { Box, Button, Container, Grid, Skeleton, Typography } from "@mui/material";
import React, { Fragment, useContext, useEffect, useMemo, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { CountryContext, EditionContext } from "../app";
import Client from "../api/client";
import CountryFlagCell from "./country-flag-cell";

const getShowName = (show) =>
    show === "semi1" ? "first semi-final" :
        show === "semi2" ? "second semi-final" :
            show === "final" ? "final" :
                "";

const getOrdinal = num =>
    num % 10 === 1 && num !== 11 ? `${num}st` :
        num % 10 === 2 && num !== 12 ? `${num}nd` :
            num % 10 === 3 && num !== 13 ? `${num}rd` :
                `${num}th`;

const EntryInfo = ({ country, year }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const editions = useContext(EditionContext);
    const countries = useContext(CountryContext);
    const [entry, setEntry] = useState(undefined);
    const [points, setPoints] = useState(undefined);

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
        setPoints(undefined);

        if (entry) {
            Client.post(`entries/${entry.id}/get_points_to/`)
                .then(res => {
                    setPoints(res.data);
                })
        }
    }, [entry])


    /*const getShowBlurb = (showData, show) => {

        return `They performed in the ${getShowName(show)} in position ${showData.runningOrder}, placing ${getOrdinal(showData.place)}
        with ${showData.points} points (${showData.jury} from the national juries and ${showData.tele} from the televote).`
    }*/

    return (
        <Container>
            {
                edition ?
                    <Typography variant="h3">
                        {country.name} in Eurovision {edition.year}
                    </Typography>
                    :
                    <Skeleton height="50px"></Skeleton>
            }

            {
                (edition && entry) ?
                    <Typography>
                        {country.name} participated in the {edition.year} edition of Eurovision
                        with the song <em>{entry.title}</em> by {entry.artist}.
                    </Typography>
                    :
                    <Skeleton height="50px"></Skeleton>
            }

            <Typography variant="h6" align="center">Points Received by {country.name}</Typography>
            {/* TODO add placings with result */}

            {points ?
                <Grid container justifyContent="center">
                    {Object.keys(points).map(show => (
                        <Grid item xs={6} key={show}>
                            <Typography align="center" textTransform="capitalize">{show}</Typography>


                            <Grid container justifyContent="center">
                                {Object.keys(points[show]).sort().map(voteType => (
                                    <Grid item xs={6} key={voteType} sx={{ padding: "5px" }}>
                                        <Typography align="center" textTransform="capitalize">{voteType}</Typography>

                                        {Object.keys(points[show][voteType]).length > 0 ?
                                            Object.keys(points[show][voteType])
                                                .sort((a, b) => parseInt(b) - parseInt(a))
                                                .map(score =>
                                                    <PointView key={score} score={score} countriesWithScore={points[show][voteType][score]} />
                                                )
                                            :
                                            <Typography align="center" fontSize="0.8em" fontStyle="italic">No points</Typography>
                                        }
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>
                    ))}
                </Grid>
                :
                <Skeleton height="50px"></Skeleton>}

            <Button onClick={() => navigate(`${location.pathname} + /..`)}>Back to {edition.year}</Button>
            {/*
            <Typography variant="h2">
                {longName} in ESC {data.year}
                <div className={`fib fi-${data.country}`} style={{ display: 'inline-block', height: ".75em", width: "1em" }}></div>
            </Typography>

            <Typography variant="body1">
                {longName} participated in the {data.year} edition of Eurovision with the song "{data.song.title}" by {data.song.artist}.
            </Typography>

            <Typography>{Object.hasOwn(data, "semi1") && getShowBlurb(data.semi1, "semi1")}</Typography>
            <Typography>{Object.hasOwn(data, "semi2") && getShowBlurb(data.semi2, "semi2")}</Typography>

            {!data.inFinal &&
                <Typography>
                    {`${longName} did not reach the top 10 in the semi-final and therefore failed to qualify for the grand final`}
                </Typography>
            }

            <Typography>{Object.hasOwn(data, "final") && getShowBlurb(data.final, "final")}</Typography>

            <Button onClick={() => navigate(-1)}>Go Back</Button>
        */}
        </Container>
    );
}

export default EntryInfo;

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
                    .map(country => {
                        return (
                            <Box key={country.id} onClick={() => navigate(`${location.pathname}/../${country.code}`)}>
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
}
    ;