import React, { ReactNode, useContext, useEffect, useLayoutEffect, useState } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Container,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Skeleton,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Form, useNavigate } from 'react-router-dom';

import { Bar, BarChart, CartesianGrid, Tooltip, TooltipProps, XAxis, YAxis } from "recharts";

import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldHigh from "@amcharts/amcharts5-geodata/worldLow";

import { CountryContext } from '../contexts';
import { CountryFlagCell } from '../components/flags';
import { RequestData } from './request-data';
import { StyledBox } from '../components/layout';

import am4geodata_usaLow from "@amcharts/amcharts5-geodata/usaLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

interface AnalysisTemplateProps {
    title: string;
    metrics: RequestData[];
    target: AnalysisTarget;
}

const AnalysisTemplate = (props: AnalysisTemplateProps) => {
    const { title, metrics, target } = props;

    const [data, setData] = useState<any>([]);
    const [view, setView] = useState<number>(0);

    const countries: any[] = useContext(CountryContext);

    const navigate = useNavigate();

    const [metricId, setMetricId] = useState<number>(0);
    const [updateCount, setUpdateCount] = useState(0);
    const [rerender, setRerender] = useState(0);
    const [columns, setColumns] = useState<any[]>([]);

    useLayoutEffect(() => {
        //This makes sure the conditions for the map div to actually be rendered are met
        if (view !== 2 || updateCount <= 0 || !data) {
            return;
        }

        let root = am5.Root.new("mapdiv");

        root.setThemes([
            am5themes_Animated.new(root)
        ]);

        let chart = root.container.children.push(am5map.MapChart.new(root, {
            projection: am5map.geoEquirectangular(),
            layout: root.horizontalLayout
        }));

        let polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
            geoJSON: am5geodata_worldHigh,
            include: data.map((elem: any) => elem.country.code.toUpperCase()),
            valueField: "value",
            calculateAggregates: true
        }));

        //TODO font
        polygonSeries.mapPolygons.template.setAll({
            tooltipHTML: "{name}: {value}",
        });

        polygonSeries.set("heatRules", [{
            target: polygonSeries.mapPolygons.template,
            dataField: "value",
            min: am5.color(0xff0000),
            max: am5.color(0x00ff00),
            key: "fill"
        }]);

        //TODO make this more general to remove all countries that don't exist
        const polygonData = data
            .map((elem: any) => {
                return {
                    id: elem.country.code.toUpperCase(),
                    value: elem.result
                }
            })

        polygonSeries.data.setAll(polygonData);

        return () => {
            root.dispose();
        }
    }, [view, updateCount, data])

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
                    const newData = res.data;

                    //set the rank and id of each result
                    newData.forEach((elem: any, index: number) => {
                        //if this result is equal to the previous result, set the rank to the same as the previous result
                        if (index > 0 && Math.abs(elem.result - newData[index - 1].result) < 0.0001) {
                            elem.rank = newData[index - 1].rank;
                        }
                        //otherwise, set the rank to the index + 1
                        else {
                            elem.rank = index + 1;
                        }

                        elem.id = index;
                    })

                    setData(newData);

                    let newColumns = [
                        {
                            field: "rank",
                            headerName: "Rank",
                            flex: 1,
                        },
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

            <StyledBox width="50%">
                <Grid container>
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

                                        param.name === "country" ?
                                            <FormControl sx={{ width: "70%" }}>
                                                <Autocomplete
                                                    id="country"
                                                    options={countries}
                                                    getOptionLabel={(option: any) => option.name}
                                                    renderInput={(params) => <TextField {...params} label="Country" />}
                                                    onChange={(e, value) => {
                                                        setRerender(n => n + 1);
                                                        metrics[metricId].setChoice(param.name, value.id)
                                                    }}
                                                />
                                            </FormControl>
                                            :
                                            <FormControl sx={{ width: "70%" }}>
                                                <InputLabel id={`${param.name}-label`}> {param.label} </InputLabel>
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
            </StyledBox>


            <StyledBox>
                <ToggleButtonGroup
                    exclusive
                    value={view}
                    onChange={(e, value) => {
                        setView(value)
                    }}
                >
                    <ToggleButton value={0}> Table </ToggleButton>
                    <ToggleButton value={1} > Chart </ToggleButton>

                    {
                        target === COUNTRY &&
                        <ToggleButton value={2} > Map </ToggleButton>
                    }
                </ToggleButtonGroup>
            </StyledBox>

            {
                updateCount > 0 ?
                    (
                        data ?
                            (
                                data.length > 0 ?
                                    (
                                        view === 0 ?
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
                                            view === 1 ?
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
                                                :
                                                <div id="mapdiv" style={{ height: "400px", width: "400px" }}></div>

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
