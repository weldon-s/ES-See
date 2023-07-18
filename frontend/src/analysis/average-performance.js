import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Checkbox, Container, FormControl, Grid, InputLabel, MenuItem, Select, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Form, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import { CountryContext } from "../app"
import CountryFlagCell from '../components/country-flag-cell';
import { Parameter, RequestData } from './request-data.ts';
import MetricSelectionPanel from '../components/metric-choices';

//TODO make this ts
const AveragePerformanceView = () => {
    const [data, setData] = useState(undefined);
    const [hasSelected, setHasSelected] = useState(false);

    const [table, setTable] = useState(true);

    const countries = useContext(CountryContext);

    const navigate = useNavigate();

    useEffect(() => {
        if (data) {
            setHasSelected(true);
        }
    }, [data])

    return (
        <Container sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        }}>
            <Typography variant="h3" align="center">Average Performance</Typography>

            <MetricSelectionPanel
                metrics={METRICS}
                setData={setData}
                processData={(data) =>
                    data.map((elem, index) => {
                        return {
                            ...elem,
                            country: countries ? countries.find(country => country.id === elem.country) : undefined,
                            id: index
                        }
                    })
                }
            />


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
                hasSelected ?
                    (
                        data ?
                            (
                                data.length > 0 ?
                                    (
                                        table ?
                                            <DataGrid
                                                autoHeight
                                                rows={data}
                                                columns={COLUMNS}
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

            <Button onClick={() => navigate("/analysis")} sx={{ mt: 2, alignSelf: "start" }}>Back</Button>
        </Container>
    );
}

export default AveragePerformanceView;

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
        return <Box sx={{
            backgroundColor: "#fffc",
            p: 1,
            borderRadius: "10px"
        }}>
            <CountryFlagCell country={payload[0].payload.country} />
            <Typography>Average:{payload[0].payload.average.toFixed(3)}</Typography>
        </Box>
    }
}

const COLUMNS = [
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
        headerName: "Result",
        renderCell: (params) => params.row.average.toFixed(3),
        flex: 2
    }
]

const START_YEAR_PARAM = Parameter.getRangeParameter("start_year", "Start Year", 2023, 1956, -1);
const END_YEAR_PARAM = Parameter.getRangeParameter("end_year", "End Year", 2023, 1956, -1);
const INCLUDE_NQ_PARAM = Parameter.getBooleanParameter("include_nq", "Include NQs?");
const VOTE_TYPE_PARAM = Parameter.getParameter("vote_type", "Vote Type", [["combined", "Combined"], ["jury", "Jury"], ["televote", "Televote"]]);

const requestConstructor = RequestData.getPresetParameters([START_YEAR_PARAM, END_YEAR_PARAM, VOTE_TYPE_PARAM]);

const METRICS = [
    requestConstructor("Average Grand Final Points", "average/get_average_final_points/")
        .addParameter(INCLUDE_NQ_PARAM),

    requestConstructor("Average Grand Final Proportion", "average/get_average_final_proportion/")
        .addParameter(INCLUDE_NQ_PARAM),

    requestConstructor("Average Semi-Final Points", "average/get_average_semi_points/"),

    requestConstructor("Average Semi-Final Proportion", "average/get_average_semi_proportion/"),

    requestConstructor("Average Overall Place", "average/get_average_place/")
        .addParameter(INCLUDE_NQ_PARAM),

    requestConstructor("Average Semi-Final Place", "average/get_average_semi_place/"),
]