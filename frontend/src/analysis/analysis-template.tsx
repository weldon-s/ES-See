import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { Box, Button, Checkbox, Container, FormControl, Grid, InputLabel, MenuItem, Select, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Form, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { TooltipProps } from 'recharts';

import Client from '../api/client';
import { CountryContext } from '../contexts';
import { CountryFlagCell } from '../components/flags';
import { RequestData } from './request-data';

interface AnalysisTemplateProps {
    title: string;
    metrics: RequestData[];
    target: AnalysisTarget;
}

const AnalysisTemplate = (props: AnalysisTemplateProps) => {
    const { title, metrics, target } = props;

    const [data, setData] = useState<any>([]);
    const [table, setTable] = useState(true);

    const countries: any[] = useContext(CountryContext);

    const navigate = useNavigate();

    const [metricId, setMetricId] = useState<number>(0);
    const [updateCount, setUpdateCount] = useState(0);
    const [rerender, setRerender] = useState(0);
    const [columns, setColumns] = useState<any[]>([]);

    const CustomTooltip = (props: TooltipProps<string, string>) => {
        const { active, payload, label } = props;

        if (active && payload && payload.length > 0) {
            return <Box sx={
                {
                    backgroundColor: "#fffc",
                    p: 1,
                    borderRadius: "10px"
                }
            }>
                {target.render(payload[0].payload)}
                <Typography > {payload[0].payload.result.toFixed(metrics[metricId]?.getDecimalPlaces())}</Typography>
            </Box>
        }
    }

    useEffect(() => {
        if (countries && updateCount > 0) {
            metrics[metricId].request()
                .then((res: any) => {
                    const newData = res.data.map((elem: any, index: number) => {
                        return {
                            ...elem,
                            id: index
                        }
                    })

                    setData(newData);

                    //TODO places
                    let newColumns = [
                        {
                            field: target.name,
                            headerName: target.name,
                            valueGetter: (params: any) => target.getValue(params.row),
                            renderCell: (params: any) => target.render(params.row),
                            flex: 2,
                        },
                        {
                            field: "result",
                            headerName: metrics[metricId].label,
                            valueGetter: (params: any) => params.row.result.toFixed(metrics[metricId].getDecimalPlaces()),
                            flex: 2,
                        }
                    ];

                    setColumns(newColumns);
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
        }
        }>
            <Typography variant="h3" align="center" > {title} </Typography>

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
                <Grid item xs={12} >
                    <Typography variant="h6" align="center" mb={1} > Settings </Typography>
                </Grid>


                <Grid item xs={12} display="flex" justifyContent="center" mb={2} >
                    <FormControl>
                        <InputLabel id="metric-label" > Metric </InputLabel>
                        <Select
                            labelId="metric-label"
                            label="Metric"
                            value={metricId}
                            onChange={(e: any) => {
                                //setChoices(choices => metrics[e.target.value].getValueObject(choices));
                                setMetricId(e.target.value);
                            }}
                            sx={{
                                minWidth: "200px",
                            }}
                        >
                            {
                                metrics.map((metric, index) => (
                                    <MenuItem key={metric.url} value={index} > {metric.label} </MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl>
                </Grid>

                {
                    metrics[metricId].parameters.map(param =>
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
                            {
                                param.type === "boolean" ?
                                    <>
                                        <InputLabel id={`${param.name}-label`}> {param.label} </InputLabel>
                                        <Checkbox
                                            checked={metrics[metricId].getChoice(param.name)}
                                            onChange={(e) => {
                                                setRerender(n => n + 1);
                                                metrics[metricId].setChoice(param.name, e.target.checked)
                                            }}
                                        />
                                    </>

                                    :
                                    <FormControl sx={{ width: "70%" }}>
                                        <InputLabel id={`${param.name}-label`}> {param.label} </InputLabel>
                                        {/**TODO fix default value not appearing */}
                                        <Select
                                            labelId={`${param.name}-label`}
                                            label={param.label}
                                            value={metrics[metricId].getChoice(param.name)}
                                            onChange={(e) => {
                                                setRerender(n => n + 1);
                                                metrics[metricId].setChoice(param.name, e.target.value)
                                            }}>
                                            {
                                                param.choices.map(choice => (
                                                    <MenuItem key={choice.value} value={choice.value} > {choice.label} </MenuItem>
                                                ))
                                            }
                                        </Select>
                                    </FormControl>

                            }

                        </Grid>


                    )}

                <Grid item xs={12} display="flex" justifyContent="end" mt={1}>
                    <Button onClick={handleUpdate}> Update </Button>
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
                    <ToggleButton value={true}> Table </ToggleButton>
                    <ToggleButton value={false} > Chart </ToggleButton>
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
                                                columns={columns}
                                                density="compact"
                                                hideFooter
                                                onRowClick={(params) => navigate(target.navigatePath(params.row))}
                                                sx={{
                                                    width: "80%",
                                                    mb: 1
                                                }}
                                            />
                                            :
                                            <BarChart data={data} width={600} height={500} style={{
                                                fontFamily: "Inter, sans-serif"
                                            }}>
                                                {/*TODO fix axes when years are y-values*/}
                                                <CartesianGrid />
                                                <Bar dataKey="result" />
                                                <XAxis hide />
                                                <YAxis />
                                                <Tooltip content={CustomTooltip} />
                                            </BarChart>
                                    )
                                    :
                                    <Typography variant="h6" > No data found for the selected configuration. Make sure your start year isn't after your end year</Typography>
                            )
                            :
                            <Skeleton height="50px" width="80%" > </Skeleton>
                    )
                    :
                    <Typography variant="h6" > Choose your desired configuration and press "Update" to view your data.</Typography>
            }

            <Button onClick={() => navigate("/analysis")} sx={{ mt: 2, alignSelf: "start" }}> Back </Button>
        </Container>
    );
}

export default AnalysisTemplate

//Class for different targets of analysis (e.g. countries, languages)
export class AnalysisTarget {
    name: string;
    render: (row: any) => ReactNode;
    getValue: (row: any) => any;
    navigatePath: (row: any) => string;

    constructor(name: string, render: (row: any) => ReactNode, getValue: (row: any) => any, navigatePath: (row: any) => string) {
        this.name = name;
        this.render = render;
        this.getValue = getValue;
        this.navigatePath = navigatePath;
    }

    static country: AnalysisTarget = new AnalysisTarget(
        "Country",
        (row: any) => <CountryFlagCell country={row.country} />,
        (row: any) => row.country.name,
        (row: any) => `/${row.country.code}`
    )

    static language: AnalysisTarget = new AnalysisTarget(
        "Language",
        (row: any) => <Typography> {row.language.name} </Typography>,
        (row: any) => row.language.name,
        (row: any) => ''
    )
}

export const COUNTRY = AnalysisTarget.country;
export const LANGUAGE = AnalysisTarget.language;
