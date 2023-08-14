import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Autocomplete, Box, Button, Container, FormControl, Grid, InputLabel, MenuItem, Select, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";

import { CountryContext, EditionContext, GroupContext } from "../contexts";
import Client from "../api/client";
import { EntryFlagCell, Flag } from "../components/flags.tsx";
import { StyledBox } from "../components/layout";

//TODO unify stylings
const RankingsView = () => {
    // whether we are sorting by single year or multiple years
    const [isSingleYear, setIsSingleYear] = useState(true);

    //if multiple, whether we are sorting by country or group
    const [isCountries, setIsCountries] = useState(true);

    const [year, setYear] = useState("");
    const [show, setShow] = useState(0);

    const [startYear, setStartYear] = useState(1);
    const [endYear, setEndYear] = useState(1);
    const [country, setCountry] = useState(-1);
    const [group, setGroup] = useState(-1);

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
    const groups = useContext(GroupContext);


    const navigate = useNavigate();

    useEffect(() => {
        if (editions) {
            const year = new Date().getFullYear();
            const current = editions.find(elem => elem.year === year);

            setYear(current?.id ?? "");
            setStartYear(current?.id ?? "");
            setEndYear(current?.id ?? "");
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

    const handleSingleYearSubmit = () => {
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

    const handleMultipleYearSubmit = () => {
        const params = {
            start_year: startYear,
            end_year: endYear,
        }

        if (isCountries && country >= 0) {
            params.country = country;
        }

        if (!isCountries && group >= 0) {
            params.group = group;
        }

        Client.post("entries/get_entries_in_years/", params)
            .then(res => {
                setEntries(res.data.sort((a, b) => a.title.localeCompare(b.title)));
            })
    }

    const handleSubmit = () => {
        if (isSingleYear) {
            handleSingleYearSubmit();
        }
        else {
            handleMultipleYearSubmit();
        }
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

                <StyledBox>
                    <ToggleButtonGroup
                        exclusive
                        value={isSingleYear}
                        onChange={(e, value) => {
                            setIsSingleYear(value)
                        }}
                    >
                        <ToggleButton value={true}> Single Year </ToggleButton>
                        <ToggleButton value={false} > Multiple Years </ToggleButton>
                    </ToggleButtonGroup>

                </StyledBox>

                {isSingleYear ?
                    <StyledBox
                        display="inline-flex"
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
                            <Autocomplete
                                id="country"
                                options={editions}
                                getOptionLabel={(option) => `${option.city} ${option.year}`}
                                onChange={(e, value) => setYear(value?.id ?? undefined)}
                                value={editions.find(elem => elem.id === year) ?? null}
                                renderInput={(params) => <TextField {...params} label="Year" />}
                            />
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
                    </StyledBox>

                    :
                    <StyledBox
                        display="inline-flex"
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
                            <Autocomplete
                                id="start-year"
                                options={editions}
                                getOptionLabel={(option) => `${option.city} ${option.year}`}
                                onChange={(e, value) => setStartYear(value?.id ?? undefined)}
                                value={editions.find(elem => elem.id === startYear) ?? null}
                                renderInput={(params) => <TextField {...params} label="Start Year" />}
                            />
                        </FormControl>

                        <FormControl
                            sx={{
                                m: 1,
                                width: "90%",
                            }}
                        >
                            <Autocomplete
                                id="end-year"
                                options={editions}
                                getOptionLabel={(option) => `${option.city} ${option.year}`}
                                onChange={(e, value) => setEndYear(value?.id ?? undefined)}
                                value={editions.find(elem => elem.id === endYear) ?? null}
                                renderInput={(params) => <TextField {...params} label="End Year" />}
                            />
                        </FormControl>

                        <FormControl
                            sx={{
                                m: 1,
                                width: "90%",
                            }}
                        >
                            <InputLabel id="selection-label">Selection Method</InputLabel>
                            <Select
                                labelId="selection-label"
                                label="Selection Method"
                                value={isCountries}
                                onChange={(e) => setIsCountries(e.target.value)}
                            >
                                <MenuItem value={true}>Countries</MenuItem>
                                <MenuItem value={false}>Groups</MenuItem>
                            </Select>
                        </FormControl>

                        {isCountries ?
                            <FormControl
                                sx={{
                                    m: 1,
                                    width: "90%",
                                }}
                            >
                                <Autocomplete
                                    id="country"
                                    options={countries}
                                    getOptionLabel={(option) => `${option.name}`}
                                    onChange={(e, value) => setCountry(value?.id ?? undefined)}
                                    value={countries.find(elem => elem.id === country) ?? null}
                                    renderInput={(params) => <TextField {...params} label="Country" />}
                                />
                            </FormControl>
                            :
                            <FormControl sx={{
                                m: 1,
                                width: "90%",
                            }}>
                                <Autocomplete
                                    id="group"
                                    options={groups}
                                    getOptionLabel={(option) => `${option.name}`}
                                    onChange={(e, value) => setGroup(value?.id ?? undefined)}
                                    value={groups.find(elem => elem.id === group) ?? null}
                                    renderInput={(params) => <TextField {...params} label="Group" />}
                                />
                            </FormControl>
                        }
                        <Button onClick={handleSubmit}>Submit</Button>
                    </StyledBox>
                }

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
                                        <StyledBox
                                            height="70px"
                                            display="flex"
                                            alignItems="center"
                                        >

                                            <EntryFlagCell
                                                entry={elem}
                                                code={countries.find(country => country.id === elem.country).code}
                                            />
                                        </StyledBox>
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
                            <StyledBox
                                onClick={() => getNextChoice(true)}
                            >

                                <EntryFlagCell
                                    entry={choices[0]}
                                    code={countries.find(country => country.id === choices[0].country).code}
                                />
                            </StyledBox>
                        </Grid>

                        <Grid
                            item
                            xs={6}
                        >
                            <StyledBox
                                onClick={() => getNextChoice(false)}
                            >
                                <EntryFlagCell
                                    entry={choices[1]}
                                    code={countries.find(country => country.id === choices[1].country).code}
                                />
                            </StyledBox>
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
                                key={index}
                                display="flex"
                                alignItems="center"
                                width="50%"
                                m={1}
                                onClick={() => navigate(`/${entry.year}/${countries.find(country => country.id === entry.country).code}`)}
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

                <Box display="flex" justifyContent="start" width="100%">
                    <Button onClick={() => navigate("/")}>Back</Button>
                </Box>
            </Box>
        </Container>
    );
}

export default RankingsView;