import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Checkbox, Container, FormControl, Grid, InputLabel, MenuItem, Select, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Form, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

import { CountryContext, EditionContext } from '../app';
import Client from '../api/client';
import CountryFlagCell from '../components/country-flag-cell';
import RequestData from './request-data';

const AveragePerformanceView = () => {
    const [startYear, setStartYear] = useState(2023);
    const [endYear, setEndYear] = useState(2023);

    const [metric, setMetric] = useState(METRICS[0]);
    const [choices, setChoices] = useState(METRICS[0].getDefaultValueObject());

    const [data, setData] = useState(undefined);
    const [columnLabel, setColumnLabel] = useState(METRICS[0].label);

    const [updateCount, setUpdateCount] = useState(0);

    const [table, setTable] = useState(true);

    const years = useContext(EditionContext);
    const countries = useContext(CountryContext);

    const navigate = useNavigate();

    useEffect(() => {
        if (countries) {
            Client.post(metric.url, {
                start_year: startYear,
                end_year: endYear,
                ...choices
            })
                .then(res => {
                    let data = res.data.map((elem, index) => {
                        return {
                            ...elem,
                            country: countries ? countries.find(country => country.id === elem.country) : undefined,
                            average: parseFloat(elem.average.toFixed(3)),
                            id: index
                        }
                    })

                    setData(data);
                })
        }
    }, [updateCount]);

    useEffect(() => {
        setColumnLabel(metric.label);
    }, [updateCount])

    const handleUpdate = () => {
        setUpdateCount(n => n + 1);
        setData(undefined);
    };

    return (
        <Container sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        }}>
            <Typography variant="h3" align="center">Average Performance</Typography>

            <Grid
                container
                borderRadius="10px"
                width="50%"
                p={1}
                m={1}
                justifyContent="center"
                sx={{
                    backgroundColor: "#eee",
                }}>
                <Grid item xs={12}>
                    <Typography variant="h6" align="center" mb={1}>Settings</Typography>
                </Grid>

                <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
                    <FormControl>
                        <InputLabel id="metric-label">Metric</InputLabel>
                        <Select
                            labelId="metric-label"
                            label="Metric"
                            value={metric}
                            onChange={(e) => {
                                setChoices(e.target.value.getDefaultValueObject());
                                setMetric(e.target.value);
                            }}
                        >
                            {METRICS.map(metric => (
                                <MenuItem key={metric.url} value={metric}>{metric.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={6} display="flex" justifyContent="center">
                    <FormControl>
                        <InputLabel id="start-label">Start Year</InputLabel>
                        <Select
                            labelId="start-label"
                            label="Start Year"
                            value={startYear}
                            onChange={(e) => setStartYear(e.target.value)}
                        >
                            {years && years.map(year => (
                                <MenuItem key={year.id} value={year.year}>{year.year}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={6} display="flex" justifyContent="center">
                    <FormControl>
                        <InputLabel id="end-label">End Year</InputLabel>
                        <Select
                            label="End Year"
                            value={endYear}
                            onChange={(e) => setEndYear(e.target.value)}
                        >
                            {years && years.map(year => (
                                <MenuItem key={year.id} value={year.year}>{year.year}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {metric.parameters.map(param =>
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
                        {param.type === "boolean" ?
                            <>
                                <InputLabel id={`${param.name}-label`}>{param.label}</InputLabel>
                                <Checkbox
                                    labelId={`${param.name}-label`}
                                    checked={choices[param.name]}
                                    onChange={(e) => {
                                        setChoices(
                                            currentChoices => {
                                                let newChoices = { ...currentChoices };
                                                newChoices[param.name] = e.target.checked;
                                                return newChoices;
                                            }
                                        )
                                    }}
                                />
                            </>

                            :
                            <FormControl sx={{ width: "70%" }}>
                                <InputLabel id={`${param.name}-label`}>{param.label}</InputLabel>
                                <Select
                                    labelId={`${param.name}-label`}
                                    label={param.label}
                                    value={choices[param.name]}
                                    onChange={(e) => {
                                        setChoices(
                                            currentChoices => {
                                                let newChoices = { ...currentChoices };
                                                newChoices[param.name] = e.target.value;
                                                return newChoices;
                                            }
                                        )
                                    }}>
                                    {
                                        param.choices.map(choice => (
                                            <MenuItem key={choice.value} value={choice.value}>{choice.label}</MenuItem>
                                        ))
                                    }
                                </Select>
                            </FormControl>

                        }

                    </Grid>


                )}

                <Grid item xs={12} display="flex" justifyContent="end">
                    <Button onClick={handleUpdate}>Update</Button>
                </Grid>
            </Grid>


            <Box sx={{
                backgroundColor: "#eee",
                p: 1,
                m: 1,
                borderRadius: "10px",
            }}>
                <ToggleButtonGroup
                    exclusive
                    value={table}
                    onChange={(e, value) => {
                        setTable(value)
                    }}
                >
                    <ToggleButton value={true}>Table</ToggleButton>
                    <ToggleButton value={false}>Chart</ToggleButton>
                </ToggleButtonGroup>

            </Box>

            {
                updateCount > 0 ?
                    (
                        data ?
                            (
                                data.length > 0 ?
                                    (
                                        table ?
                                            <DataGrid
                                                autoHeight
                                                rows={data}
                                                columns={getColumns(columnLabel)}
                                                density="compact"
                                                hideFooter
                                                onRowClick={(params) => navigate(`/${params.row.country.code}`)}
                                                sx={{
                                                    width: "80%",
                                                    pb: 1
                                                }}
                                            />
                                            :
                                            <BarChart data={data} width={600} height={500} style={{
                                                fontFamily: "Inter, sans-serif"
                                            }}>
                                                <CartesianGrid />
                                                <Bar dataKey="average" />
                                                <XAxis dataKey="country.name" hide />
                                                <YAxis />
                                                <Tooltip content={CustomTooltip} />
                                            </BarChart>
                                    )
                                    :
                                    <Typography variant="h6">No data found for the selected configuration. Make sure your start year isn't after your end year</Typography>
                            )
                            :
                            <Skeleton height="50px" width="80%"></Skeleton>
                    )
                    :
                    <Typography variant="h6">Choose your desired configuration and press "Update" to view your data.</Typography>
            }

        </Container>
    );
}

export default AveragePerformanceView;

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
        console.log(payload);

        return <Box sx={{
            backgroundColor: "#fffc",
            p: 1,
            borderRadius: "10px"
        }}>
            <CountryFlagCell country={payload[0].payload.country} />
            <Typography>Average:{payload[0].payload.average}</Typography>
        </Box>
    }
}

const getColumns = (label) => [
    {
        field: "place",
        headerName: "Place",
        flex: 1
    },

    {
        field: "country",
        headerName: "Country",
        valueGetter: (params) => params.row.country.name,
        renderCell: (params) => <CountryFlagCell country={params.row.country} />,
        flex: 2
    },

    {
        field: "average",
        headerName: label,
        valueGetter: (params) => params.row.average,
        flex: 2
    }
]

const METRICS = [
    new RequestData("Average Grand Final Points", "average/get_average_final_points/")
        .addBooleanParameter("include_nq", "Include NQs?")
        .addParameter("vote_type", "Vote Type", [["combined", "Combined"], ["jury", "Jury"], ["televote", "Televote"]]),

    new RequestData("Average Grand Final Proportion", "average/get_average_final_proportion/")
        .addBooleanParameter("include_nq", "Include NQs?")
        .addParameter("vote_type", "Vote Type", [["combined", "Combined"], ["jury", "Jury"], ["televote", "Televote"]]),

    new RequestData("Average Semi-Final Points", "average/get_average_semi_points/")
        .addParameter("vote_type", "Vote Type", [["combined", "Combined"], ["jury", "Jury"], ["televote", "Televote"]]),

    new RequestData("Average Semi-Final Proportion", "average/get_average_semi_proportion/")
        .addParameter("vote_type", "Vote Type", [["combined", "Combined"], ["jury", "Jury"], ["televote", "Televote"]]),

    new RequestData("Average Place", "average/get_average_place/")
        .addBooleanParameter("include_nq", "Include NQs?")
]