import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Container, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Form, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import { CountryContext } from "../app"
import CountryFlagCell from '../components/country-flag-cell';
import MetricSelectionPanel from '../components/metric-choices';

//TODO make this ts
const AnalysisTemplate = ({ title, dataKey, metrics, columns }) => {
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
            <Typography variant="h3" align="center">{title}</Typography>

            <MetricSelectionPanel
                metrics={metrics}
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
                                                columns={columns}
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