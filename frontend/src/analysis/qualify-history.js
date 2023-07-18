import React, { useContext, useEffect, useState } from 'react';

import { CountryContext } from "../app"
import Client from '../api/client';
import { Parameter, RequestData } from './request-data.ts';
import { Checkbox, Container, FormControl, Grid, InputLabel, MenuItem, Select, Skeleton, Typography } from '@mui/material';

import MetricSelectionPanel from '../components/metric-choices';
import { DataGrid } from '@mui/x-data-grid';

import CountryFlagCell from '../components/country-flag-cell';

const QualifyingHistoryView = () => {
    const [data, setData] = useState(undefined)
    const [hasSelected, setHasSelected] = useState(false)

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
                }
            />

            {hasSelected ? (
                data ?
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
                    <Skeleton height="50px" width="80%"></Skeleton>
            ) :
                <Typography variant="h6">Choose your desired configuration and press "Update" to view your data.</Typography>

            }
        </Container>
    );
}

export default QualifyingHistoryView;

const METRICS = [
    new RequestData("Qualifying History", "qualify/get_qualifiers/")
        .addParameter(Parameter.getRangeParameter("year", "Year", 2023, 1956, -1))
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
        field: "qualify_count",
        headerName: "Qualification Count",
        flex: 2
    }
]
