import React from "react";
import { Box, Card, Container, Grid, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const AnalysisMenu = ({ cards }) => {
    return (
        <Container>
            <Typography variant="h3" align="center">Data Analysis</Typography>
            <Grid container justifyContent="center">
                {cards.map(card => {
                    return (
                        <AnalysisCard
                            key={card.title}
                            title={card.title}
                            description={card.description}
                            link={card.link}
                        />
                    );
                })}
            </Grid>

        </Container>

    );
}

export default AnalysisMenu;

const AnalysisCard = ({ title, description, link }) => {
    const navigate = useNavigate();

    return (
        <Grid item xs={3} onClick={() => { navigate(link) }}>
            <Box sx={{
                backgroundColor: "#eee",
                p: 1,
                m: 1,
                borderRadius: "10px",
                "&:hover": {
                    backgroundColor: "#ddd"
                }
            }}>
                <Typography variant="h6" align="center">{title}</Typography>
                <Typography variant="body2" align="center">{description}</Typography>
            </Box>

        </Grid>
    );
}