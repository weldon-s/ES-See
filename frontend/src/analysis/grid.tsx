import { Autocomplete, Box, Button, Checkbox, Container, FormControl, Grid, InputLabel, MenuItem, Select, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { StyledBox } from "../components/layout";
import { RequestData, Parameter } from "./request-data";
import { CountryFlagCell, Flag } from "../components/flags";
import { DataGrid } from "@mui/x-data-grid";

const START_YEAR_PARAM = Parameter.getRangeParameter("start_year", "Start Year", 2023, 1956, -1);
const END_YEAR_PARAM = Parameter.getRangeParameter("end_year", "End Year", 2023, 1956, -1);

const yearsConstructor = RequestData.getPresetParameters([START_YEAR_PARAM, END_YEAR_PARAM]);

const METRICS = [
    yearsConstructor("Similarity", "friends/get_similarity/")
        .addParameter(Parameter.getParameter("mode", "Mode", ["cosine", "rank"]))
    ,
];

//TODO unify with other analysis template
const GridTemplate = () => {
    const [data, setData] = useState<undefined | any>(undefined);

    const [countries, setCountries] = useState<undefined | any[]>(undefined);

    const [updateCount, setUpdateCount] = useState(0);
    const [rerender, setRerender] = useState(0);

    const [isGrid, setIsGrid] = useState<boolean>(true);

    const [highlights, setHighlights] = useState<undefined | any[]>(undefined);

    useEffect(() => {
        if (updateCount > 0) {
            //we need to reverse the data because we want the columns to go reverse alphabetically
            //this way our triangle is widest at the top

            METRICS[0].request()
                .then((res: any) => {
                    const data = res.data.data;
                    const countries = res.data.countries;

                    //get the most and least similar countries for each country
                    const highlights = countries.map((country: any) => {
                        let highestIndex = -1;
                        let highest = -1;
                        let lowestIndex = -1;
                        let lowest = 1;

                        countries.forEach((otherCountry: any, index: number) => {
                            if (country.code === otherCountry.code) {
                                return;
                            }

                            //let's first figure out which country goes first
                            const first = country.code < otherCountry.code ? country.code : otherCountry.code;
                            const second = country.code < otherCountry.code ? otherCountry.code : country.code;

                            //then we can get the similarity and compare it to the highest and lowest we've seen
                            const similarity = data[first][second];

                            if (highestIndex < 0 || similarity > highest) {
                                highest = similarity;
                                highestIndex = index;
                            }

                            if (lowestIndex < 0 || similarity < lowest) {
                                lowest = similarity;
                                lowestIndex = index;
                            }
                        });

                        return {
                            id: country.code,
                            country,
                            highest,
                            lowest,
                            highestCountry: countries[highestIndex],
                            lowestCountry: countries[lowestIndex],
                        }
                    })

                    setData(data);
                    setCountries(countries);
                    console.log(highlights);

                    setHighlights(highlights);
                })
        }
    }, [updateCount]);

    //TODO make this flexible
    const lowest = useMemo(() => {
        if (!data) {
            return undefined;
        }

        let lowest: number = NaN;

        Object.keys(data).forEach(col => {
            Object.keys(data[col]).forEach((row: any) => {
                if (isNaN(lowest) || data[col][row] < lowest) {
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

        let highest = NaN;

        Object.keys(data).forEach(col => {
            Object.keys(data[col]).forEach((row: any) => {
                if (isNaN(highest) || data[col][row] > highest) {
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

            <StyledBox>
                <ToggleButtonGroup
                    exclusive
                    value={isGrid}
                    onChange={(e, value) => {
                        setIsGrid(value)
                    }}
                >
                    <ToggleButton value={true}> Grid </ToggleButton>
                    <ToggleButton value={false} > Highlight </ToggleButton>
                </ToggleButtonGroup>
            </StyledBox>

            {countries && highlights ?
                isGrid ?
                    <Box display="flex">
                        <Box>
                            <Box height="20px" />
                            {
                                countries && countries.slice(1).reverse().map((country: any) =>
                                    <Box key={country.code} height="20px" mr="3px">
                                        <Flag code={country.code} round="true" />
                                    </Box>
                                )
                            }
                        </Box>

                        {
                            countries.slice(0, -1).map((column: any) =>
                                <Box key={column.code} display="flex" flexDirection="column" alignItems="center">
                                    <Box height="20px">
                                        <Flag
                                            code={column.code}
                                            round="true" />
                                    </Box>

                                    {
                                        countries.slice(1).reverse().map((row: any) => {
                                            const cell = data?.[column.code]?.[row.code];

                                            return cell ?
                                                <Typography
                                                    key={row.code}
                                                    height="20px"
                                                    variant="body2"
                                                    bgcolor={getColor(cell)}
                                                    width="100%"
                                                    pl="2px"
                                                    pr="2px"
                                                >
                                                    {cell.toFixed(METRICS[0].getDecimalPlaces())}
                                                </Typography>
                                                :
                                                <Box key={row.code} height="20px" />
                                        }
                                        )
                                    }
                                </Box>
                            )
                        }
                    </Box>
                    :
                    <DataGrid
                        autoHeight
                        rows={highlights}
                        columns={COLUMNS}
                        density="compact"
                        hideFooter
                        sx={{
                            width: "80%",
                            mb: 1
                        }}

                    />
                :
                updateCount === 0 ?
                    <Typography variant="h6" > Choose your desired configuration and press "Update" to view your data.</Typography>
                    :
                    <Skeleton height="200px" width="500px" />
            }
        </Container>
    );
}

export default GridTemplate;

const COLUMNS = [
    {
        field: "country",
        headerName: "Country",
        valueGetter: (params: any) => params.row.country.name,
        renderCell: (params: any) => <CountryFlagCell country={params.row.country} />,
        flex: 2,
    },

    {
        field: "highestCountry",
        headerName: "Most Similar Country",
        valueGetter: (params: any) => params.row.highestCountry.name,
        renderCell: (params: any) => <CountryFlagCell country={params.row.highestCountry} />,
        flex: 2,
    },

    {
        field: "highest",
        headerName: "Value",
        renderCell: (params: any) => params.row.highest.toFixed(METRICS[0].getDecimalPlaces()),
        flex: 1,
    },

    {
        field: "lowestCountry",
        headerName: "Least Similar Country",
        valueGetter: (params: any) => params.row.lowestCountry.name,
        renderCell: (params: any) => <CountryFlagCell country={params.row.lowestCountry} />,
        flex: 2,
    },

    {
        field: "lowest",
        headerName: "Value",
        renderCell: (params: any) => params.row.lowest.toFixed(METRICS[0].getDecimalPlaces()),
        flex: 1,
    },
]