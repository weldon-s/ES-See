import React, { useContext, useEffect, useState } from 'react';
import { Container, Skeleton, Typography } from '@mui/material';

import Client from '../api/client';
import { EditionContext } from '../app';

const CountryInfo = ({ country }) => {
    const [rawEntries, setRawEntries] = useState(undefined);
    const [entries, setEntries] = useState(undefined);
    const [updated, setUpdated] = useState(false);
    const [finals, setFinals] = useState(undefined);

    const years = useContext(EditionContext);

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
            )

            //then, we wait for all of them to resolve
            Promise.all(promises)
                .then(values => {
                    let newEntries =
                        values.map(res => res.data)
                            .map((elem, index) => {
                                let ret = { ...rawEntries[index] };

                                //add results and edition data for ease of use
                                ret.results = elem;
                                ret.edition = years.find(elem => elem.id === ret.year);
                                return ret;
                            })
                            //sort chronologically
                            .sort((a, b) => b.edition.year - a.edition.year);

                    setEntries(newEntries);
                })
        }
    }, [rawEntries])

    useEffect(() => {
        setUpdated(entries && entries.every(elem => elem !== undefined));
    }, [entries])

    useEffect(() => {
        if (updated) {
            setFinals(entries.filter(elem => "grand final" in elem.results).length);
        }
    }, [updated])

    return (
        <Container>
            <Typography variant="h3" align="center">
                {country.name} in the Eurovision Song Contest
            </Typography>

            {
                updated ?
                    <>
                        <Typography>
                            {country.name} has participated in the Eurovision Song Contest {entries.length} times, debuting in {entries[0].edition.year}.
                        </Typography>
                        <Typography>
                            They have participated in {finals} {finals === 1 ? "final" : "finals"}.
                        </Typography>
                    </>
                    :
                    <Skeleton height="50px"></Skeleton>
            }
        </Container>
    )
}

export default CountryInfo;