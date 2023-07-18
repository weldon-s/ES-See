import React, { useContext, useEffect, useState } from 'react';

import { CountryContext } from "../app"
import Client from '../api/client';
import { Parameter, RequestData } from './request-data.ts';
import { Box, Container, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';

import MetricSelectionPanel from '../components/metric-choices';
import { DataGrid } from '@mui/x-data-grid';

import CountryFlagCell from '../components/country-flag-cell';

const QualifyingHistoryView = () => {
    const [data, setData] = useState(undefined);
    const [hasSelected, setHasSelected] = useState(false);

    const [table, setTable] = useState(true);

    const countries = useContext(CountryContext);

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
            <Typography variant="h3" align="center">Qualifying History</Typography>

            <MetricSelectionPanel
                metrics={METRICS}
                setData={setData}
                processData={(data) =>
                    data.map((elem, index) => {
                        return {
                            ...elem,
                            country: countries.find((country) => country.id === elem.country),
                            id: index
                        }
                    })
                        .sort((a, b) => b.qualify - a.qualify)
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
                                                <Bar dataKey="qualify" />
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

export default QualifyingHistoryView;

const METRICS = [
    new RequestData("Qualifying Count", "qualify/get_qualify_count/")
        .addParameter(Parameter.getRangeParameter("start_year", "Start Year", 2023, 1956, -1))
        .addParameter(Parameter.getRangeParameter("end_year", "End Year", 2023, 1956, -1)),

    new RequestData("Qualifying Rate", "qualify/get_qualify_rate/")
        .addParameter(Parameter.getRangeParameter("start_year", "Start Year", 2023, 1956, -1))
        .addParameter(Parameter.getRangeParameter("end_year", "End Year", 2023, 1956, -1))

]

const COLUMNS = [
    {
        field: "country",
        headerName: "Country",
        valueGetter: (params) => params.row.country.name,
        renderCell: (params) => <CountryFlagCell country={params.row.country} />,
        flex: 2
    },

    {
        field: "qualify",
        headerName: "Qualification Count",
        flex: 2
    }
]

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
        return <Box sx={{
            backgroundColor: "#fffc",
            p: 1,
            borderRadius: "10px"
        }}>
            <CountryFlagCell country={payload[0].payload.country} />
            <Typography>Result:{payload[0].payload.qualify}</Typography>
        </Box>
    }
}
