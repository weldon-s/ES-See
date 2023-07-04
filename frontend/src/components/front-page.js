import { IconButton, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCountryData, getResult } from "../analysis";
import { fromIso, getYear, YEARS } from "../data";

import { CountryContext, EditionContext } from "../app";
import Client from "../api/client"

const FrontPage = ({ year = 1 }) => {
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
        Client.post("entries/get_all/", {
            year: currentYear
        })
            .then(res => {
                setSongs(res.data)
            })
    }, [currentYear])

    const navigate = useNavigate();

    return (
        <>

            <Select
                value={showType}
                onChange={(e) => setShowType(e.target.value)}
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
                }}
            >
                {years && years.map(elem => <MenuItem key={elem.id} value={elem.id}>{elem.city} {elem.year}</MenuItem>)}

            </Select >
            {placings &&
                <DataGrid
                    hideFooter
                    density="compact"
                    rows={placings}
                    columns={columns}
                >
                </DataGrid>
            }
        </>
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
            renderCell: params => <CountryRenderCell country={countries?.find(elem => elem.id === params.row.country)} />,
            flex: 1,
        },

        {
            field: "running_order",
            headerName: "Running Order",
            flex: 1,
        }
    ];

    if (voteTypes?.length > 1) {
        columns.push({
            field: "combined",
            headerName: "Points",
            flex: 1,
        })
    }

    if (voteTypes) {

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

    return columns
};

const CountryRenderCell = ({ country }) => {
    return <><span
        className={`fi fi-${country?.code} fis`}
        style={{ borderRadius: '50%', marginRight: '5px' }}
    ></span> {country?.name}</>
}