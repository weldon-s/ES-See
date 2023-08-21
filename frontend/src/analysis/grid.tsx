import { Autocomplete, Box, Button, Checkbox, Container, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { StyledBox } from "../components/layout";
import { RequestData, Parameter } from "./request-data";
import { Flag } from "../components/flags";

const START_YEAR_PARAM = Parameter.getRangeParameter("start_year", "Start Year", 2023, 1956, -1);
const END_YEAR_PARAM = Parameter.getRangeParameter("end_year", "End Year", 2023, 1956, -1);

const yearsConstructor = RequestData.getPresetParameters([START_YEAR_PARAM, END_YEAR_PARAM]);

const METRICS = [
    yearsConstructor("Cosine Similarity", "friends/get_cosine_similarity/"),
    // yearsConstructor("Spearman Correlation", "friends/"),
];

//TODO unify with other analysis template
const GridTemplate = () => {
    const [data, setData] = useState<undefined | any[]>(undefined);

    const [updateCount, setUpdateCount] = useState(0);
    const [rerender, setRerender] = useState(0);

    useEffect(() => {
        if (updateCount > 0) {
            METRICS[0].request()
                .then((res: any) => {
                    console.log(res.data);
                    setData(res.data);
                })
        }
    }, [updateCount])

    const handleUpdate = () => {
        setUpdateCount(n => n + 1);
        setData(undefined);
    }

    return (
        <Container sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        }}>
            <Typography variant="h3" align="center" > Similarity in Voting Patterns </Typography>

            <StyledBox width="50%">
                <Grid container>
                    <Grid item xs={12}>
                        <Typography variant="h6" align="center" mb={1} > Settings </Typography>
                    </Grid>

                    {
                        METRICS[0].parameters.map(param =>
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
                                                checked={METRICS[0].getChoice(param.name)}
                                                onChange={(e) => {
                                                    setRerender(n => n + 1);
                                                    METRICS[0].setChoice(param.name, e.target.checked)
                                                }}
                                            />
                                        </>
                                        :
                                        <FormControl sx={{ width: "70%" }}>
                                            <InputLabel id={`${param.name}-label`}> {param.label} </InputLabel>
                                            <Select
                                                labelId={`${param.name}-label`}
                                                label={param.label}
                                                value={METRICS[0].getChoice(param.name)}
                                                onChange={(e) => {
                                                    setRerender(n => n + 1);
                                                    METRICS[0].setChoice(param.name, e.target.value)
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

            <Box display="flex">
                <Box>
                    <Box height="20px" />
                    {
                        data && data[0].reverse().map((cell: any) =>
                            <Box height="20px">
                                <Flag key={cell.countries[1].code} code={cell.countries[1].code} round="true" />
                            </Box>
                        )}
                </Box>

                {/*TODO issue w multiple years */}
                {
                    data &&
                    data.map((col: any) =>
                        <Box>
                            <Box height="20px">
                                <Flag key={col[0].countries[1].code} code={col[0].countries[0].code} round="true" />
                            </Box>

                            {
                                col.reverse().map((cell: any) =>
                                    <Typography height="20px" variant="body2" m="1px" bgcolor="#aaa" borderRadius="2px">
                                        {cell.similarity.toFixed(METRICS[0].getDecimalPlaces()).substring(1)}
                                    </Typography>
                                )
                            }
                        </Box>
                    )
                }
            </Box>
        </Container>
    );
}

export default GridTemplate;