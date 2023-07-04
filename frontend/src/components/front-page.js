import { Container, MenuItem, Select, Skeleton, Tooltip, Typography, styled, useTheme } from "@mui/material";
import { DataGrid, gridClasses } from "@mui/x-data-grid";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CountryContext, EditionContext } from "../app";
import Client from "../api/client"

const SongContext = React.createContext(undefined);

const FrontPage = ({ year = 1 }) => {
    const theme = useTheme();

    const [currentYear, setCurrentYear] = useState(year);
    const [showType, setShowType] = useState(3);

    const [show, setShow] = useState(undefined);
    const [songs, setSongs] = useState(undefined);
    const [placings, setPlacings] = useState(undefined);
    const countries = useContext(CountryContext);
    const years = useContext(EditionContext)

    const columns = useMemo(() => getColumns(show?.vote_types, countries), [show, countries]);

    useEffect(() => {
        Client.post("shows/get_show/", {
            year: currentYear,
            show_type: showType
        })
            .then(res => {
                setShow(res.data);
            })
    }, [currentYear, showType])

    useEffect(() => {
        if (show) {
            Client.post(`shows/${show.id}/get_results/`)
                .then(res => {
                    setPlacings(res.data);
                })
        }
    }, [show])

    useEffect(() => {
        Client.post(`editions/${currentYear}/get_entries/`)
            .then(res => {
                setSongs(res.data)
            })
    }, [currentYear])

    const getRowClass = (place) => {
        //if we are in a final and we place 1st, we win
        if (showType === 3 && place === 1) {
            return "won";
        }

        //if we are NOT in a final and we place in the top 10, we qualify for the final
        if (showType !== 3 && place <= 10) {
            return "qualified";
        }

        //otherwise, nothing special
        return "";
    }

    const navigate = useNavigate();

    return (
        <Container>
            <Typography variant="h3" textAlign="center">Eurovision Song Contest {years.find(elem => elem.id === currentYear).year}</Typography>

            <Select
                value={showType}
                onChange={(e) => {
                    setShowType(e.target.value);
                    setPlacings(undefined);
                }}
                label="Show"
                variant="standard"
            >
                <MenuItem value={1}>Semi-Final 1</MenuItem>
                <MenuItem value={2}>Semi-Final 2</MenuItem>
                <MenuItem value={3}>Final</MenuItem>
            </Select>

            <Select
                value={currentYear}
                label="Edition"
                variant="standard"
                onChange={(e) => {
                    navigate(`../${e.target.value}`);
                    setCurrentYear(e.target.value);
                    setPlacings(undefined);
                }}
            >
                {years && years.map(elem => <MenuItem key={elem.id} value={elem.id}>{elem.city} {elem.year}</MenuItem>)}

            </Select >

            {
                placings ?
                    <SongContext.Provider value={songs}>
                        <ResultDataGrid
                            hideFooter
                            density="compact"
                            rows={placings}
                            columns={columns}
                            getRowClassName={(params) => getRowClass(params.row.place)}
                        ></ResultDataGrid>
                    </SongContext.Provider>
                    :
                    <Skeleton height="300px"></Skeleton>
            }
        </Container>
    );
}

export default FrontPage

const getColumns = (voteTypes, countries) => {

    let columns = [
        {
            field: "place",
            headerName: "Place",
            flex: 1
        },

        {

            field: "country",
            headerName: "Country",
            valueGetter: params => countries.find(elem => elem.id === params.row.country).name,
            renderCell: params =>
                <CountryRenderCell
                    country={countries?.find(elem => elem.id === params.row.country)}
                />,
            flex: 1,
        },

    ];

    //if we have more than one voting type, add a column for total points
    if (voteTypes?.length > 1) {
        columns.push({
            field: "combined",
            headerName: "Points",
            flex: 1,
        })
    }

    if (voteTypes) {
        //add column for each voting type
        voteTypes.forEach(voteType => {
            let header = voteTypes.length > 1 ? voteType : "points";
            header = header.charAt(0).toUpperCase() + header.slice(1);

            columns.push({
                field: voteType,
                headerName: header,
                flex: 1,
            })

        })
    }

    columns.push({
        field: "running_order",
        headerName: "Running Order",
        flex: 1,
    });

    return columns
};

const CountryRenderCell = ({ country }) => {
    const songs = useContext(SongContext);
    const song = songs.find(elem => elem.country === country.id);

    const title = <><em>{song.title}</em> by {song.artist}</>;

    return (
        <Tooltip title={title} placement="right">
            <div>
                <span
                    className={`fi fi-${country?.code} fis`}
                    style={{ borderRadius: '50%', marginRight: '5px' }}
                />
                {country?.name}
            </div>
        </Tooltip>
    );
}

const ResultDataGrid = styled(DataGrid)(({ theme }) => ({
    '& .qualified': {
        backgroundColor: theme.palette.success.main,
        '&:hover': {
            backgroundColor: theme.palette.success.dark,
        }
    },

    '& .won': {
        backgroundColor: theme.palette.warning.main,
        '&:hover': {
            backgroundColor: theme.palette.warning.dark,
        }
    }
}));