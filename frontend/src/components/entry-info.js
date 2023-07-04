import { Button, Typography } from "@mui/material";
import React from "react";

import { fromIso } from "../data";
import { useNavigate } from "react-router-dom";

const getShowName = (show) =>
    show === "semi1" ? "first semi-final" :
        show === "semi2" ? "second semi-final" :
            show === "final" ? "final" :
                "";

const EntryInfo = ({ data }) => {
    const longName = fromIso(data.country)

    const navigate = useNavigate();

    const getOrdinal = num =>
        num % 10 === 1 && num !== 11 ? `${num}st` :
            num % 10 === 2 && num !== 12 ? `${num}nd` :
                num % 10 === 3 && num !== 13 ? `${num}rd` :
                    `${num}th`;

    const getShowBlurb = (showData, show) => {

        return `They performed in the ${getShowName(show)} in position ${showData.runningOrder}, placing ${getOrdinal(showData.place)}
        with ${showData.points} points (${showData.jury} from the national juries and ${showData.tele} from the televote).`
    }

    return (
        <>
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
        </>
    );
}

export default EntryInfo;