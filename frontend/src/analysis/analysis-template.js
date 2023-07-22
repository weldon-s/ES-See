import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Checkbox, Container, FormControl, Grid, InputLabel, MenuItem, Select, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Form, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import Client from '../api/client';
import { CountryContext } from "../app";
import CountryFlagCell from '../components/country-flag-cell';

//TODO make this ts
const AnalysisTemplate = ({ title, dataKey, metrics, columns }) => {
    const [data, setData] = useState(undefined);

    const [table, setTable] = useState(true);

    const countries = useContext(CountryContext);

    const navigate = useNavigate();

    console.log("metrics")
    console.log(metrics)

    const [metric, setMetric] = useState(metrics[0])
    const [choices, setChoices] = useState(metric.getDefaultValueObject())
    const [updateCount, setUpdateCount] = useState(0);
    const [processedColumns, setProcessedColumns] = useState(columns);

    useEffect(() => {
        if (countries) {
            Client.post(metric.url, {
                ...choices
            })
                .then(res => {
                    const newData = res.data.map((elem, index) => {
                        return {
                            ...elem,
                            country: countries ? countries.find(country => country.id === elem.country) : undefined,
                            id: index
                        }
                    })

                    setData(newData);
                    setProcessedColumns(columns.map(
                        column => {
                            return {
                                ...column,
                                headerName: column.headerName.replace("$header", metric.header)
                            }
                        }
                    ))
                });
        }
    }, [updateCount]);

    const handleUpdate = () => {
        setUpdateCount(n => n + 1);
        setData(undefined);
    }

    return (
        <Container sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        }}>
            <Typography variant="h3" align="center">{title}</Typography>

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
                            {metrics.map(metric => (
                                <MenuItem key={metric.url} value={metric}>{metric.label}</MenuItem>
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
                                                columns={processedColumns}
                                                density="compact"
                                                hideFooter
                                                onRowClick={(params) => navigate(`/${params.row.country.code}`)}
                                                sx={{
                                                    width: "80%",
                                                    mb: 1
                                                }}
                                            />
                                            :
                                            <BarChart data={data} width={600} height={500} style={{
                                                fontFamily: "Inter, sans-serif"
                                            }}>
                                                <CartesianGrid />
                                                <Bar dataKey={dataKey} />
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

            <Button onClick={() => navigate("/analysis")} sx={{ mt: 2, alignSelf: "start" }}>Back</Button>
        </Container>
    );
}

export default AnalysisTemplate

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
        const dataKey = payload[0].dataKey;

        return <Box sx={{
            backgroundColor: "#fffc",
            p: 1,
            borderRadius: "10px"
        }}>
            <CountryFlagCell country={payload[0].payload.country} />
            <Typography>{payload[0].payload[dataKey].toFixed(3)}</Typography>
        </Box>
    }
}