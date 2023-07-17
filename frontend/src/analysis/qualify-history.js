import React, { useContext, useEffect, useState } from 'react';

import { CountryContext } from "../app"
import Client from '../api/client';
import { Parameter, RequestData } from './request-data.ts';
import { Checkbox, Container, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@mui/material';

const QualifyingHistoryView = () => {
    const [data, setData] = useState(undefined)
    const [year, setYear] = useState(2023)
    const [metric, setMetric] = useState(METRICS[0])
    const [choices, setChoices] = useState(METRICS[0].getDefaultValueObject())

    const countries = useContext(CountryContext);


    useEffect(() => {
        if (countries) {
            Client.post("qualify/get_qualifiers/", {
                ...choices
            })
                .then(res => {
                    setData({
                        "qualifiers": res.data.qualifiers.map(elem => countries.find(country => country.id === elem)),
                        "non_qualifiers": res.data.non_qualifiers.map(elem => countries.find(country => country.id === elem))
                    })
                })
        }
    }, [countries])

    useEffect(() => {
        console.log(data)
    }, [data])

    return (
        <Container sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        }}>
            <Typography variant="h3" align="center">Qualifying History</Typography>

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
        </Container>
    );
}

export default QualifyingHistoryView;

const METRICS = [
    new RequestData("Qualifying History", "qualify/get_qualifiers/")
        .addParameter(Parameter.getRangeParameter("year", "Year", 2023, 1956, -1))
]