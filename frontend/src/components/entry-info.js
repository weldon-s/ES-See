import { Button, Container, Skeleton, Typography } from "@mui/material";
import React, { useContext, useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { EditionContext } from "../app";
import Client from "../api/client";

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
    const editions = useContext(EditionContext);
    const [entry, setEntry] = useState(undefined);
    const [points, setPoints] = useState(undefined);

    const edition = useMemo(() => {
        return editions.find(elem => elem.id === year);
    }, [year, editions]);

    useEffect(() => {
        Client.post("entries/get_entry/", {
            edition: year,
            country: country.id
        })
            .then(res => {
                setEntry(res.data);
            })
    }, [country, year])

    useEffect(() => {
        if (entry) {
            Client.post(`entries/${entry.id}/get_points_to/`)
                .then(res => {
                    console.log(res.data)
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

            <Button onClick={() => navigate(-1)}>Go Back</Button>
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