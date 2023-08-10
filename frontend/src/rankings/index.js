import React, { useContext, useEffect, useMemo, useState } from "react";
import { Box, Button, Container, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from "@mui/material";

import { CountryContext, EditionContext } from "../contexts";
import Client from "../api/client";
import { EntryFlagCell, Flag } from "../components/flags.tsx";

//TODO multiple selections
const RankingsView = () => {
    //TODO get year from edition context
    const [year, setYear] = useState("");

    const [show, setShow] = useState(0);

    //Our selected entries to sort
    const [entries, setEntries] = useState(undefined);
    const [sortedEntries, setSortedEntries] = useState(undefined);

    //The two entries we are currently comparing
    const [choices, setChoices] = useState(undefined);

    /*
    array of booleans, each corresponding to a comparison between two entries in the sorting algoritm
    true if left entry is better than right entry
    this will expand as we go through the sorting algorithm
    */
    const [bools, setBools] = useState([]);

    const editions = useContext(EditionContext);
    const countries = useContext(CountryContext);

    useEffect(() => {
        if (editions) {
            const year = new Date().getFullYear();
            const current = editions.find(elem => elem.year === year);
            setYear(current?.id ?? "");
        }
    }, [editions])

    useEffect(() => {
        setBools([]);
        setChoices(undefined);
        setSortedEntries(undefined);
    }, [entries])

    /*We need to sort the entries based on the user's input
    We use Merge Sort for this because it has few comparisons on average (i.e. faster for users)
    this will return undefined if we don't have enough comparisons and will then set choices to 
    the two entries we need to compare
    */
    const mergeSort = (arr, bools) => {
        if (arr.length <= 1) {
            return arr;
        }

        const mid = Math.floor(arr.length / 2);

        const left = mergeSort(arr.slice(0, mid), bools);

        if (!left) {
            return;
        }

        const right = mergeSort(arr.slice(mid), bools);

        if (!right) {
            return;
        }

        return merge(left, right, bools);
    }

    const merge = (left, right, bools) => {
        let result = [];

        while (left.length && right.length) {
            const bool = bools.shift();

            //if we don't have enough comparisons, set choices to the two entries we need to compare
            //then return undefined to stop the sorting algorithm
            if (bool === undefined) {
                setChoices([left[0], right[0]]);
                return;
            }

            if (bool) {
                result.push(left.shift());
            }
            else {
                result.push(right.shift());
            }
        }

        return [...result, ...left, ...right];
    }

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
                setEntries(res.data.sort((a, b) => a.title.localeCompare(b.title)));
            })
    }

    const startSort = () => {
        setChoices(undefined);
        setSortedEntries(mergeSort(entries, [...bools]));
    }

    const getNextChoice = (currentBool) => {
        setSortedEntries(mergeSort(entries, [...bools, currentBool]));
        setBools(bools => [...bools, currentBool]);
    }

    const undoLastChoice = () => {
        setSortedEntries(mergeSort(entries, [...bools.slice(0, bools.length - 1)]));
        setBools(bools => bools.slice(0, bools.length - 1));
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

                <Button
                    onClick={startSort}
                    disabled={!entries}
                >
                    Sort
                </Button>

                {(entries && !choices) &&

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

                {
                    (choices && !sortedEntries) &&
                    <Grid container justifyContent="center" width="50%">
                        <Grid item xs={12}>
                            <Typography variant="h5" align="center">Which entry do you like better?</Typography>
                        </Grid>

                        <Grid
                            item
                            xs={6}
                        >
                            <Box
                                bgcolor="#eee"
                                p={0.5}
                                m={0.5}
                                borderRadius="10px"
                                onClick={() => getNextChoice(true)}
                            >
                                <EntryFlagCell
                                    entry={choices[0]}
                                    code={countries.find(country => country.id === choices[0].country).code}
                                />
                            </Box>
                        </Grid>

                        <Grid
                            item
                            xs={6}
                        >
                            <Box
                                bgcolor="#eee"
                                p={0.5}
                                m={0.5}
                                borderRadius="10px"
                                onClick={() => getNextChoice(false)}
                            >
                                <EntryFlagCell
                                    entry={choices[1]}
                                    code={countries.find(country => country.id === choices[1].country).code}
                                />
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography align="center">Comparisons made: {bools.length}</Typography>

                            {bools.length > 0 &&
                                <Box
                                    display="flex"
                                    justifyContent="end"
                                >
                                    <Button onClick={undoLastChoice}>
                                        Undo
                                    </Button>
                                </Box>

                            }
                        </Grid>
                    </Grid>
                }

                {
                    sortedEntries &&
                    <>
                        <Typography variant="h5">Your Ranking</Typography>
                        {sortedEntries.map((entry, index) => (
                            <Box
                                display="flex"
                                alignItems="center"
                                width="50%"
                                m={1}
                            >
                                <Typography align="center" mr={1}>{index + 1}. </Typography>
                                <Flag
                                    round
                                    code={countries.find(country => country.id === entry.country).code}
                                />
                                <Typography ml={1}>{entry.title}</Typography>
                            </Box>

                        ))
                        }
                    </>
                }
            </Box>
        </Container>
    );
}

export default RankingsView;