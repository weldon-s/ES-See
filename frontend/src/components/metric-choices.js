import React, { useContext, useEffect, useState } from "react";
import { Button, Checkbox, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from "@mui/material";

import { CountryContext } from "../app";
import Client from "../api/client";

//This class handles metric and parameter selection, as well as making API calls
const MetricSelectionPanel = ({ metrics, setData, processData = data => data }) => {
    const [metric, setMetric] = useState(metrics[0])
    const [choices, setChoices] = useState(metric.getDefaultValueObject())
    const [updateCount, setUpdateCount] = useState(0);

    const countries = useContext(CountryContext)

    useEffect(() => {
        if (countries) {
            Client.post(metric.url, {
                ...choices
            })
                .then(res => {
                    setData(processData(res.data));
                });
        }
    }, [updateCount]);

    const handleUpdate = () => {
        setUpdateCount(n => n + 1);
        setData(undefined);
    }

    return (
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
            <Grid item xs={12}>
                <Typography variant="h6" align="center" mb={1}>Settings</Typography>
            </Grid>

            <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
                <FormControl>
                    <InputLabel id="metric-label">Metric</InputLabel>
                    <Select
                        labelId="metric-label"
                        label="Metric"
                        value={metric}
                        onChange={(e) => {
                            setChoices(e.target.value.getDefaultValueObject());
                            setMetric(e.target.value);
                        }}
                    >
                        {metrics.map(metric => (
                            <MenuItem key={metric.url} value={metric}>{metric.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {metric.parameters.map(param =>
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
                    {param.type === "boolean" ?
                        <>
                            <InputLabel id={`${param.name}-label`}>{param.label}</InputLabel>
                            <Checkbox
                                checked={choices[param.name]}
                                onChange={(e) => {
                                    setChoices(
                                        currentChoices => {
                                            let newChoices = { ...currentChoices };
                                            newChoices[param.name] = e.target.checked;
                                            return newChoices;
                                        }
                                    )
                                }}
                            />
                        </>

                        :
                        <FormControl sx={{ width: "70%" }}>
                            <InputLabel id={`${param.name}-label`}>{param.label}</InputLabel>
                            <Select
                                labelId={`${param.name}-label`}
                                label={param.label}
                                value={choices[param.name]}
                                onChange={(e) => {
                                    setChoices(
                                        currentChoices => {
                                            let newChoices = { ...currentChoices };
                                            newChoices[param.name] = e.target.value;
                                            return newChoices;
                                        }
                                    )
                                }}>
                                {
                                    param.choices.map(choice => (
                                        <MenuItem key={choice.value} value={choice.value}>{choice.label}</MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>

                    }

                </Grid>


            )}

            <Grid item xs={12} display="flex" justifyContent="end">
                <Button onClick={handleUpdate}>Update</Button>
            </Grid>
        </Grid>
    );
}

export default MetricSelectionPanel;