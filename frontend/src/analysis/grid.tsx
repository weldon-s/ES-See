import { Autocomplete, Box, Button, Checkbox, Container, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { StyledBox } from "../components/layout";
import { RequestData, Parameter } from "./request-data";
import { Flag } from "../components/flags";
import { gridFilteredSortedTopLevelRowEntriesSelector } from "@mui/x-data-grid";

const START_YEAR_PARAM = Parameter.getRangeParameter("start_year", "Start Year", 2023, 1956, -1);
const END_YEAR_PARAM = Parameter.getRangeParameter("end_year", "End Year", 2023, 1956, -1);

const yearsConstructor = RequestData.getPresetParameters([START_YEAR_PARAM, END_YEAR_PARAM]);

const METRICS = [
    yearsConstructor("Cosine Similarity", "friends/get_cosine_similarity/"),
    // yearsConstructor("Spearman Correlation", "friends/"),
];

//TODO unify with other analysis template
const GridTemplate = () => {
    const [data, setData] = useState<undefined | any>(undefined);

    const [countries, setCountries] = useState<undefined | any[]>(undefined);

    const [updateCount, setUpdateCount] = useState(0);
    const [rerender, setRerender] = useState(0);

    useEffect(() => {
        if (updateCount > 0) {
            //we need to reverse the data because we want the columns to go reverse alphabetically
            //this way our triangle is widest at the top

            METRICS[0].request()
                .then((res: any) => {
                    console.log(res.data.data);
                    console.log(res.data.countries);
                    setData(res.data.data);
                    setCountries(res.data.countries);

                })
        }
    }, [updateCount]);

    //TODO make this flexible
    const lowest = useMemo(() => {
        if (!data) {
            return undefined;
        }

        let lowest = 1;

        Object.keys(data).forEach(col => {
            Object.keys(data[col]).forEach((row: any) => {
                if (data[col][row] < lowest) {
                    lowest = data[col][row];
                }
            })
        })

        return lowest;
    }, [data]);

    const highest = useMemo(() => {
        if (!data) {
            return undefined;
        }

        let highest = 0;

        Object.keys(data).forEach(col => {
            Object.keys(data[col]).forEach((row: any) => {
                if (data[col][row] > highest) {
                    highest = data[col][row];
                }
            })
        })

        return highest;
    }, [data])

    const getColor = useMemo(() => {
        return (similarity: number) => {
            if (lowest === undefined || highest === undefined) {
                return "#aaa"
            }

            const r = Math.round(255 * (similarity - highest) / (lowest - highest));
            const g = 255 - r;

            return `rgb(${r}, ${g}, 0)`;
        }
    }, [lowest, highest])

    const handleUpdate = () => {
        setUpdateCount(n => n + 1);
        setData(undefined);
        setCountries(undefined);
    }

    return (
        <Container sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        }}>
            <Typography variant="h3" align="center" > Similarity in Voting Patterns </Typography>

            <StyledBox width="50%">
                <Grid container>
                    <Grid item xs={12}>
                        <Typography variant="h6" align="center" mb={1} > Settings </Typography>
                    </Grid>

                    {
                        METRICS[0].parameters.map(param =>
                            <Grid
                                key={param.name}
                                item
                                xs={6}
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                                mt={1}
                            >
                                {
                                    param.type === "boolean" ?
                                        <>
                                            <InputLabel id={`${param.name}-label`}> {param.label} </InputLabel>
                                            <Checkbox
                                                checked={METRICS[0].getChoice(param.name)}
                                                onChange={(e) => {
                                                    setRerender(n => n + 1);
                                                    METRICS[0].setChoice(param.name, e.target.checked)
                                                }}
                                            />
                                        </>
                                        :
                                        <FormControl sx={{ width: "70%" }}>
                                            <InputLabel id={`${param.name}-label`}> {param.label} </InputLabel>
                                            <Select
                                                labelId={`${param.name}-label`}
                                                label={param.label}
                                                value={METRICS[0].getChoice(param.name)}
                                                onChange={(e) => {
                                                    setRerender(n => n + 1);
                                                    METRICS[0].setChoice(param.name, e.target.value)
                                                }}>
                                                {
                                                    param.choices.map(choice => (
                                                        <MenuItem key={choice.value} value={choice.value} > {choice.label} </MenuItem>
                                                    ))
                                                }
                                            </Select>
                                        </FormControl>
                                }

                            </Grid>
                        )}

                    <Grid item xs={12} display="flex" justifyContent="end" mt={1}>
                        <Button onClick={handleUpdate}> Update </Button>
                    </Grid>
                </Grid>
            </StyledBox>

            <Box display="flex">
                <Box>
                    <Box height="20px" />
                    {
                        countries && countries.slice(1).reverse().map((country: string) =>
                            <Box key={country} height="20px" mr="3px">
                                <Flag code={country} round="true" />
                            </Box>
                        )
                    }
                </Box>

                {
                    countries && countries.slice(0, -1).map((column: string) =>
                        <Box key={column} display="flex" flexDirection="column" alignItems="center">
                            <Box height="20px">
                                <Flag
                                    code={column}
                                    round="true" />
                            </Box>

                            {
                                countries.slice(1).reverse().map((row: string) => {
                                    const cell = data?.[column]?.[row];

                                    return cell ?
                                        <Typography
                                            key={row}
                                            height="20px"
                                            variant="body2"
                                            bgcolor={getColor(cell)}
                                            width="100%"
                                        >
                                            {cell.toFixed(METRICS[0].getDecimalPlaces()).substring(1)}
                                        </Typography>
                                        :
                                        <Box key={row} height="20px" />
                                }
                                )
                            }
                        </Box>
                    )
                }
            </Box>
        </Container>
    );
}

export default GridTemplate;