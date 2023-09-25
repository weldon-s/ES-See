import React, { useContext, useEffect, useState } from 'react';
import { Box, Container, Skeleton, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

import Client from '../api/client';
import { EditionContext } from '../contexts';
import { getOrdinal, getPointsKey } from '../utils';
import { Flag } from '../components/flags';

const CountryInfo = ({ country }) => {
    const [rawEntries, setRawEntries] = useState(undefined);
    const [entries, setEntries] = useState(undefined);
    const [updated, setUpdated] = useState(false);
    const [finals, setFinals] = useState(undefined);
    const [bestPlace, setBestPlace] = useState(undefined);
    const [hasQualified, setHasQualified] = useState(undefined);
    const [bestYears, setBestYears] = useState(undefined);

    const years = useContext(EditionContext);
    const navigate = useNavigate();

    useEffect(() => {
        //these don't have any results data so we need to fetch this separately
        Client.post(`countries/${country.id}/get_entries/`)
            .then(res => {
                setRawEntries(res.data);

                //set the entries to undefined so we can check to see if they've been updated 
                setEntries(Array(res.data.length).fill(undefined));
                setUpdated(false);
            });
    }, [country]);

    useEffect(() => {
        if (rawEntries) {
            //we make a promise for each entry that gets the entry's results
            let promises = rawEntries.map(entry =>
                Client.post("results/get_results/", {
                    edition: entry.year,
                    country: country.id
                })
            );

            //then, we wait for all of them to resolve
            Promise.all(promises)
                .then(values => {
                    const newEntries =
                        values.map(res => res.data)
                            .map((elem, index) => {
                                let ret = { ...rawEntries[index] };

                                //add results and edition data for ease of use
                                ret.results = elem;

                                if ("semi-final 1" in elem) {
                                    ret.results["semi-final"] = elem["semi-final 1"];
                                    delete ret.results["semi-final 1"];
                                }
                                if ("semi-final 2" in elem) {
                                    ret.results["semi-final"] = elem["semi-final 2"];
                                    delete ret.results["semi-final 2"];
                                }

                                ret.edition = years.find(elem => elem.id === ret.year);
                                return ret;
                            })
                            //sort chronologically
                            .sort((a, b) => a.edition.year - b.edition.year);


                    console.log(newEntries)
                    setEntries(newEntries);
                });
        }
    }, [rawEntries]);

    useEffect(() => {
        setUpdated(entries && entries.every(elem => elem !== undefined));
    }, [entries]);

    useEffect(() => {
        if (updated) {
            setFinals(entries.filter(elem => "grand final" in elem.results).length);
        }
    }, [updated]);

    useEffect(() => {
        if (updated) {
            //get all the times the country has qualified
            const finals = entries.filter(elem => "grand final" in elem.results);

            //if they've qualified, find their best final place
            if (finals.length > 0) {
                setBestPlace(finals
                    .map(elem => elem.results["grand final"].place)
                    .reduce((a, b) => Math.min(a, b))
                );

                setHasQualified(true);
            }

            //otherwise, find their best semi-final place
            else {
                setBestPlace(entries
                    .filter(elem => "semi-final" in elem.results)
                    .map(elem => elem.results["semi-final"].place)
                    .reduce((a, b) => Math.min(a, b))
                );

                setHasQualified(false);
            }

        }
    }, [updated])

    useEffect(() => {
        if (bestPlace) {
            // if they've qualified, find the years they got that place in the final
            if (hasQualified) {
                setBestYears(entries
                    .filter(elem => "grand final" in elem.results && elem.results["grand final"].place === bestPlace)
                    .map(elem => elem.edition.year)
                );
            }
            // otherwise, find the years they got that place in the semi-final
            else {
                setBestYears(entries
                    .filter(elem => "semi-final" in elem.results && elem.results["semi-final"].place === bestPlace)
                    .map(elem => elem.edition.year)
                );
            }
        }
    }, [bestPlace])

    return (
        <Container>
            <Typography variant="h3" align="center">
                {country.name} in the Eurovision Song Contest

                <Flag code={country.code} style={{
                    height: "1em",
                    marginLeft: "0.5em",
                    borderRadius: "5px",
                }} />
            </Typography>


            {
                (updated && bestYears) ?
                    <>
                        <Typography variant="body1">
                            {country.name} has participated in the Eurovision Song Contest {entries.filter(entry => entry.edition.year !== 2020).length} times, debuting in {entries[0].edition.year}.
                        </Typography>
                        <Typography variant="body1">
                            They have participated in {finals} {finals === 1 ? "final" : "finals"}.
                        </Typography>

                        <Typography variant="body1">
                            Their best result was {getOrdinal(bestPlace)} place{!hasQualified && " in their semi-final"}, which they achieved in {" "}
                            {bestYears.map((elem, index) => <span key={index}>{elem}
                                {index === bestYears.length - 1 ? "" : index === bestYears.length - 2 ? " and " : ", "}</span>)}
                        </Typography>

                        <Typography variant="h4" align="center" sx={{ mb: 1 }}>
                            {country.adjective} Entries
                        </Typography>
                        {
                            updated ?
                                <DataGrid
                                    rows={entries}
                                    columns={COLUMNS}
                                    autoHeight
                                    density="compact"
                                    hideFooter
                                    onRowClick={(params) => navigate(`/${params.row.year}/${country.code}`)}
                                />

                                :
                                <Skeleton height="50px"></Skeleton>
                        }

                    </>
                    :
                    <Skeleton height="50px"></Skeleton>
            }
        </Container >
    )
}

export default CountryInfo;

const COLUMNS = [
    {
        field: "year",
        headerName: "Year",
        valueGetter: params => params.row.edition.year,
        flex: 1
    },

    {
        field: "artist",
        headerName: "Artist",
        flex: 3
    },

    {
        field: "title",
        headerName: "Title",
        flex: 4
    },

    {
        field: "place",
        headerName: "Final Place",
        valueGetter: params => "grand final" in params.row.results ? params.row.results["grand final"].place : "N/A",
        flex: 2
    },

    {
        field: "points",
        headerName: "Final Points",
        valueGetter: params => {
            let results = params.row.results;

            if (!results["grand final"]) {
                return "N/A";
            }
            let pointsKey = getPointsKey(results["grand final"]);
            return results["grand final"][pointsKey];
        },
        flex: 2
    },

    {
        field: "semi",
        headerName: "Semi-Final Place",
        valueGetter: params => "semi-final" in params.row.results ? params.row.results["semi-final"].place : "N/A",
        flex: 2
    },

    {
        field: "semiPoints",
        headerName: "Semi-Final Points",
        valueGetter: params => {
            let results = params.row.results;

            if (!results["semi-final"]) {
                return "N/A";
            }
            let pointsKey = getPointsKey(results["semi-final"]);
            return results["semi-final"][pointsKey];
        },
        flex: 2
    }
]