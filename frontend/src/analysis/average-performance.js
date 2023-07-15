import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Checkbox, Container, FormControl, Grid, InputLabel, MenuItem, Select, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Form, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

import { CountryContext, EditionContext } from '../app';
import Client from '../api/client';
import CountryFlagCell from '../components/country-flag-cell';

const AveragePerformanceView = () => {
    const [startYear, setStartYear] = useState(2023);
    const [endYear, setEndYear] = useState(2023);
    const [includeNQ, setIncludeNQ] = useState(true);
    const [metric, setMetric] = useState(METRICS[0]);

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
                include_nq: includeNQ
            })
                .then(res => {
                    let data = res.data.map((elem, index) => {
                        return {
                            ...elem,
                            country: countries ? countries.find(country => country.id === elem.country) : undefined,
                            average: parseFloat(elem.average.toFixed(2)),
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

            <Grid container sx={{
                width: "50%",
                backgroundColor: "#eee",
                p: 1,
                m: 1,
                borderRadius: "10px",
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
                            onChange={(e) => setMetric(e.target.value)}
                        >
                            {METRICS.map(metric => (
                                <MenuItem key={metric.url} value={metric}>{metric.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={4} display="flex" justifyContent="center">
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

                <Grid item xs={4} display="flex" justifyContent="center">
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

                <Grid item xs={4} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                    <InputLabel id="nq-label">Include NQs?</InputLabel>
                    <Checkbox
                        checked={includeNQ}
                        onChange={(e) => setIncludeNQ(e.target.checked)}
                    />
                </Grid>


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
        renderCell: (params) => params.row.average.toFixed(2),
        flex: 2
    }
]

const METRICS = [
    {
        label: "Average Grand Final Points",
        url: "average/get_average_final_points/"
    },

    {
        label: "Average Place",
        url: "average/get_average_place/"
    }
]