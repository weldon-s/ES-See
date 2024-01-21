import { Box, styled } from "@mui/material";
import React from "react";

export const StyledBox = styled(Box)({
    backgroundColor: "#eee",
    padding: "10px",
    margin: "10px",
    borderRadius: "10px",
});

export const StyledHoverBox = styled(StyledBox)({
    "&:hover": {
        backgroundColor: "#ddd",
    },
});