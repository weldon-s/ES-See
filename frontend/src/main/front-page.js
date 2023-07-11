import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Container,
    CssBaseline,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    MenuItem,
    Select,
    Skeleton,
    Tooltip,
    Typography,
    styled
} from "@mui/material";
import { LibraryMusic } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CountryContext, EditionContext } from "../app";
import Client from "../api/client"
import CountryFlagCell from "../components/country-flag-cell";

const DRAWER_WIDTH = 250;

const SongContext = React.createContext(undefined);

const FrontPage = ({ year }) => {
    const [yearId, setYearId] = useState(year);
    const [showType, setShowType] = useState(3);
    const [show, setShow] = useState(undefined);
    const [songs, setSongs] = useState(undefined);
    const [placings, setPlacings] = useState(undefined);

    const countries = useContext(CountryContext);
    const years = useContext(EditionContext);

    const edition = useMemo(() => years.find(elem => elem.id === yearId), [yearId, years]);
    const columns = useMemo(() => getColumns(show?.vote_types, countries), [show]);

    const [showSidebar, setShowSidebar] = useState(true);

    useEffect(() => {
        Client.post("shows/get_show/", {
            year: yearId,
            show_type: showType
        })
            .then(res => {
                setShow(res.data);
            })
    }, [yearId, showType])

    useEffect(() => {
        if (show) {
            Client.post(`shows/${show.id}/get_results/`)
                .then(res => {
                    setPlacings(res.data);
                })
        }
    }, [show])

    useEffect(() => {
        Client.post(`editions/${yearId}/get_entries/`)
            .then(res => {
                setSongs(res.data)
            })
    }, [yearId])

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
        <Box sx={{ display: "flex" }}>
            <CssBaseline />
            <Drawer
                variant="permanent"
                anchor="left"
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
                }}
            >
                <Accordion elevation={0} disableGutters>
                    <AccordionSummary expandIcon={<LibraryMusic />}>
                        <Typography textAlign="center" sx={{ m: 0, p: 0 }}>{edition.year} Entries</Typography>
                    </AccordionSummary>

                    <AccordionDetails
                        sx={{
                            m: 0,
                            p: 0,
                        }}
                    >
                        <List disablePadding sx={{ m: 0 }}>
                            {(!!songs && !!countries) ?
                                songs
                                    .map(song => countries.find(elem => elem.id === song.country))
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(country => (
                                        <ListItem key={country.id} disablePadding sx={{ m: 0 }}>
                                            <ListItemButton
                                                onClick={() => navigate(`${country.code}`)}
                                                sx={{ p: "0px" }}
                                            >
                                                <CountryFlagCell
                                                    country={country}
                                                    fontSize="0.8em"
                                                    sx={{
                                                        opacity: 0.8,
                                                        width: "100%",
                                                        pl: 1,
                                                        "&:hover": {
                                                            opacity: 1
                                                        }
                                                    }} />
                                            </ListItemButton>
                                        </ListItem>
                                    ))
                                : <Skeleton height="50px"></Skeleton>
                            }
                        </List>
                    </AccordionDetails>
                </Accordion>

            </Drawer>
            <Container sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>

                <Typography variant="h3" textAlign="center">Eurovision Song Contest {edition?.year}</Typography>

                <Box sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}>
                    <Select
                        value={showType}
                        onChange={(e) => {
                            setShowType(e.target.value);
                            setPlacings(undefined);
                        }}
                        label="Show"
                        variant="standard"
                        sx={{
                            m: 1
                        }}
                    >
                        <MenuItem value={1}>Semi-Final 1</MenuItem>
                        <MenuItem value={2}>Semi-Final 2</MenuItem>
                        <MenuItem value={3}>Final</MenuItem>
                    </Select>

                    <Select
                        value={yearId}
                        label="Edition"
                        variant="standard"
                        onChange={(e) => {
                            navigate(`../${e.target.value}`);
                            setYearId(e.target.value);
                            setPlacings(undefined);
                        }}

                        sx={{
                            m: 1
                        }}
                    >
                        {years && years.map(elem => <MenuItem key={elem.id} value={elem.id}>{elem.city} {elem.year}</MenuItem>)}
                    </Select >
                </Box>

                {
                    placings ?
                        <SongContext.Provider value={songs}>
                            <ResultDataGrid
                                autoHeight
                                hideFooter
                                density="compact"
                                rows={placings}
                                columns={columns}
                                getRowClassName={(params) => getRowClass(params.row.place)}
                                onRowClick={(params) => {
                                    const country = countries?.find(elem => elem.id === params.row.country);
                                    navigate(country.code);
                                }}
                                sx={{
                                    width: "80%",
                                    maxWidth: "80%",
                                    mb: 1
                                }}
                            ></ResultDataGrid>
                        </SongContext.Provider>
                        :
                        <Skeleton height="300px"></Skeleton>
                }
            </Container >
        </Box>
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
            valueGetter: params => countries.find(elem => elem.id === params.row.country)?.name,
            renderCell: params =>
                countries ?
                    <CountryRenderCell
                        country={countries.find(elem => elem.id === params.row.country)}
                    /> : <></>,
            flex: 2,
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
    const song = songs ? songs.find(elem => elem.country === country.id) : undefined;

    const title = song ? <><em>{song.title}</em> by {song.artist}</> : "";

    return (
        <Tooltip
            title={title}
            placement="right"
        >
            <CountryFlagCell country={country} />
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