import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Checkbox, Container, FormControl, Grid, InputLabel, MenuItem, Select, Skeleton, Typography } from '@mui/material';
import { CountryContext, EditionContext } from '../app';
import { Form, useNavigate } from 'react-router-dom';
import Client from '../api/client';
import { DataGrid } from '@mui/x-data-grid';
import CountryFlagCell from '../components/country-flag-cell';

const AveragePerformanceView = () => {
    const [startYear, setStartYear] = useState(2023);
    const [endYear, setEndYear] = useState(2023);
    const [includeNQ, setIncludeNQ] = useState(true);

    const [data, setData] = useState(undefined);

    const [updateCount, setUpdateCount] = useState(0);

    const years = useContext(EditionContext);
    const countries = useContext(CountryContext);

    const navigate = useNavigate();

    useEffect(() => {
        if (countries) {
            Client.post("average/get_average_final_points/", {
                start_year: startYear,
                end_year: endYear,
                include_nq: includeNQ
            })
                .then(res => {
                    setData(res.data.map((elem, index) => {
                        return {
                            ...elem,
                            country: countries ? countries.find(country => country.id === elem.country) : undefined,
                            id: index
                        }
                    }));
                })
        }
    }, [updateCount]);

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


            {updateCount > 0 && (data ?
                <DataGrid
                    autoHeight
                    rows={data}
                    columns={COLUMNS}
                    density="compact"
                    hideFooter
                    onRowClick={(params) => navigate(`/${params.row.country.code}`)}
                    sx={{
                        width: "80%"
                    }}
                />
                :
                <Skeleton height="50px" width="80%"></Skeleton>
            )
            }



        </Container>
    );
}

export default AveragePerformanceView;

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
        headerName: "Average Points",
        valueGetter: (params) => params.row.average,
        renderCell: (params) => params.row.average.toFixed(2),
        flex: 2
    }
]