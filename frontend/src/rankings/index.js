import React, { useContext, useEffect, useMemo, useState } from "react";
import { Box, Button, Container, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from "@mui/material";

import { CountryContext, EditionContext } from "../contexts";
import Client from "../api/client";
import { EntryFlagCell } from "../components/flags.tsx";

//TODO multiple selections
const RankingsView = () => {
    //TODO get year from edition context
    const [year, setYear] = useState("");

    const [show, setShow] = useState(0);

    //Our selected entries to sort
    const [entries, setEntries] = useState(undefined);
    const [sortedEntries, setSortedEntries] = useState(undefined);

    const editions = useContext(EditionContext);
    const countries = useContext(CountryContext);

    //We need to sort the entries based on the user's input
    //We use Merge Sort for this because it has few comparisons on average (i.e. faster for users)
    //This whole process is a mess right now but it does sort
    const mergeSort = (arr) => {
        if (arr.length <= 1) {
            return arr;
        }

        const mid = Math.floor(arr.length / 2);

        const left = mergeSort(arr.slice(0, mid));
        const right = mergeSort(arr.slice(mid));

        return merge(left, right);
    }

    const merge = (left, right) => {
        let result = [];

        while (left.length && right.length) {
            const choice = prompt(`Which entry is better: ${left[0].title} (l) or ${right[0].title} (r) ?`);

            if (choice === "l") {
                result.push(left.shift());
            } else if (choice === "r") {
                result.push(right.shift());
            }
        }

        return [...result, ...left, ...right];
    }

    useEffect(() => {
        if (sortedEntries) {
            console.log("sorted entries is");
            console.log(sortedEntries);
        }
    }, [sortedEntries])

    useEffect(() => {
        if (editions) {
            const current = editions.find(elem => elem.year === 2023);
            setYear(current?.id ?? "");
        }
    }, [editions])

    const handleSubmit = () => {
        // if our year is empty, don't do anything
        if (year === "") {
            return;
        }

        const data = {
            edition: year,
        }

        // if we have a specific show type, add it
        if (show > 0) {
            data.show_type = show;
        }

        Client.post("entries/get_entries/", data)
            .then(res => {
                setEntries(res.data);
            })
    }

    return (
        <Container>
            <Box
                display="flex"
                alignItems="center"
                flexDirection="column"
            >
                <Typography variant="h3" align="center">Custom Ranking</Typography>

                <Typography align="center">Choose which entries you would like to view below.</Typography>

                <Box
                    display="inline-flex"
                    bgcolor="#eee"
                    p={1}
                    m={1}
                    borderRadius="10px"
                    flexDirection="column"
                    alignItems="center"
                    width="40%"
                >
                    <FormControl
                        sx={{
                            m: 1,
                            width: "90%",
                        }}
                    >
                        <InputLabel id="year-label">Year</InputLabel>
                        <Select
                            labelId="year-label"
                            label="Year"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        >
                            {editions &&
                                editions.map(elem =>
                                    <MenuItem
                                        key={elem.id}
                                        value={elem.id}>
                                        {elem.city} {elem.year}
                                    </MenuItem>
                                )
                            }
                        </Select>
                    </FormControl>

                    <FormControl
                        sx={{
                            m: 1,
                            width: "90%",
                        }}
                    >
                        <InputLabel id="show-label">Show</InputLabel>

                        <Select
                            labelId="show-label"
                            label="Show"
                            value={show}
                            onChange={(e) => setShow(e.target.value)}
                        >
                            <MenuItem value={0}>All</MenuItem>
                            <MenuItem value={1}>Semi-Final 1</MenuItem>
                            <MenuItem value={2}>Semi-Final 2</MenuItem>
                            <MenuItem value={3}>Grand Final</MenuItem>
                        </Select>
                    </FormControl>

                    <Button onClick={handleSubmit}>Submit</Button>
                </Box>

                {entries &&

                    <Grid container>
                        <Grid item xs={12}>
                            <Typography variant="h5" align="center">Entries to Sort</Typography>
                        </Grid>

                        {
                            entries.map(elem => {
                                return (
                                    <Grid item xs={2} key={elem.id}>

                                        <Box
                                            bgcolor="#eee"
                                            p={0.5}
                                            m={0.5}
                                            borderRadius="10px"
                                        >
                                            <EntryFlagCell
                                                entry={elem}
                                                code={countries.find(country => country.id === elem.country).code}
                                            />
                                        </Box>

                                    </Grid>
                                )
                            })
                        }
                    </Grid>
                }

                <Button
                    onClick={() => setSortedEntries(mergeSort(entries))}
                    disabled={!entries}
                >
                    Sort
                </Button>
            </Box>
        </Container>
    );
}

export default RankingsView;