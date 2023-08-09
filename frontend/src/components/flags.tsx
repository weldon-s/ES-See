import { Box, Typography } from '@mui/material';
import React, { forwardRef } from 'react';

export const CountryFlagCell = forwardRef(
    //TODO make this not any
    (props: any, ref) =>
    (<Typography {...props} ref={ref}>
        <Flag code={props?.country?.code} round style={{ marginRight: "5px" }} />
        {props?.country?.name}
    </Typography>
    )
);

export const Flag = forwardRef(
    (props: any, ref) => {
        const passedStyle = props?.style ?? {};

        return <span
            {...props}
            ref={ref}
            className={`fi fi-${props.code}${props?.round || props?.square ? ' fis' : ''}`}
            style={
                props.round ?
                    {
                        borderRadius: '50%',
                        ...passedStyle
                    }
                    :
                    passedStyle
            }
        />
    });

export const EntryFlagCell = forwardRef(
    (props: any, ref) => {
        return (
            <Box
                display="flex"
                flexDirection="row"
                justifyContent="stretch"
            >
                <Box
                    display="flex"
                    alignItems="center"
                >
                    {/* TODO fix how these are passed */}
                    <Flag code={props?.code} round style={{ marginRight: "10px" }} />
                </Box>
                <Box
                    display="flex"
                    flexDirection="column"
                >
                    <Typography variant="caption"><em>{props?.entry?.title}</em></Typography>
                    <Typography variant="caption">{props?.entry?.artist}</Typography>
                </Box>
            </Box>
        );
    }
);